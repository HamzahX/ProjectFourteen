//initialize constants
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const csv2json = require('csvjson-csv2json');
const merge = require('lodash.merge');

const scraperArgumentValidator = require('./scraperArgumentValidator.js');
const SEASON = scraperArgumentValidator.validateSeasonArgument();

//globals
let BROWSER;
let PAGES = [];
const TABLE_TYPES = ["standard", "shooting", "passing", "passing_types", "gca", "defense", "possession", "misc", "keeper", "keeper_adv"];


/**
 * Launches a browser window using puppeteer and navigates to the appropriate URL based on the command line arguments
 * @returns {Promise<*>} Promise resolves when the browser has been successfully launched
 */
let setup = async () => {
    return new Promise(async function(resolve, reject){

        console.time('browser launch');

        BROWSER = await puppeteer.launch({
            headless: false,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            defaultViewport: null
        });
        (async function loop() {
            for (let i=0; i<TABLE_TYPES.length; i++){
                await new Promise(async function (resolve, reject) {
                    PAGES[i] = await BROWSER.newPage();
                    PAGES[i].setDefaultNavigationTimeout(0);
                    await disableImages(PAGES[i]);
                    resolve();
                });
            }
            let pages = await BROWSER.pages();
            await pages[0].close();
            console.timeEnd('browser launch');
            resolve();
        })();

    });
};


/**
 * Disables image loading in puppeteer tabs
 * @param {*} page - The page where image loading is to be disabled
 * @returns {Promise<void>}
 */
let disableImages = async(page) => {

    await page.setRequestInterception(true);

    page.on('request', (req) => {
        if(req.resourceType() === 'image'){
            req.abort();
        }
        else {
            req.continue();
        }
    });

};


let scrapeEPLPages = async () => {

    return new Promise(async function (resolve, reject) {

        let URLs;
        if (SEASON === "18-19"){
            URLs = [
                "https://fbref.com/en/comps/9/1889/stats/2018-2019-Premier-League-Stats",
                "https://fbref.com/en/comps/9/1889/shooting/2018-2019-Premier-League-Stats",
                "https://fbref.com/en/comps/9/1889/passing/2018-2019-Premier-League-Stats",
                "https://fbref.com/en/comps/9/1889/passing_types/2018-2019-Premier-League-Stats",
                "https://fbref.com/en/comps/9/1889/gca/2018-2019-Premier-League-Stats",
                "https://fbref.com/en/comps/9/1889/defense/2018-2019-Premier-League-Stats",
                "https://fbref.com/en/comps/9/1889/possession/2018-2019-Premier-League-Stats",
                "https://fbref.com/en/comps/9/1889/misc/2018-2019-Premier-League-Stats",
                "https://fbref.com/en/comps/9/1889/keepers/2018-2019-Premier-League-Stats",
                "https://fbref.com/en/comps/9/1889/keepersadv/2018-2019-Premier-League-Stats"
            ]
        }
        else if (SEASON === "19-20"){
            URLs = [
                "https://fbref.com/en/comps/9/3232/stats/2019-2020-Premier-League-Stats",
                "https://fbref.com/en/comps/9/3232/shooting/2019-2020-Premier-League-Stats",
                "https://fbref.com/en/comps/9/3232/passing/2019-2020-Premier-League-Stats",
                "https://fbref.com/en/comps/9/3232/passing_types/2019-2020-Premier-League-Stats",
                "https://fbref.com/en/comps/9/3232/gca/2019-2020-Premier-League-Stats",
                "https://fbref.com/en/comps/9/3232/defense/2019-2020-Premier-League-Stats",
                "https://fbref.com/en/comps/9/3232/possession/2019-2020-Premier-League-Stats",
                "https://fbref.com/en/comps/9/3232/misc/2019-2020-Premier-League-Stats",
                "https://fbref.com/en/comps/9/3232/keepers/2019-2020-Premier-League-Stats",
                "https://fbref.com/en/comps/9/3232/keepersadv/2019-2020-Premier-League-Stats"
            ]
        }
        else if (SEASON === "20-21"){
            URLs = [
                "https://fbref.com/en/comps/9/10728/stats/2020-2021-Premier-League-Stats",
                "https://fbref.com/en/comps/9/10728/shooting/2020-2021-Premier-League-Stats",
                "https://fbref.com/en/comps/9/10728/passing/2020-2021-Premier-League-Stats",
                "https://fbref.com/en/comps/9/10728/passing_types/2020-2021-Premier-League-Stats",
                "https://fbref.com/en/comps/9/10728/gca/2020-2021-Premier-League-Stats",
                "https://fbref.com/en/comps/9/10728/defense/2020-2021-Premier-League-Stats",
                "https://fbref.com/en/comps/9/10728/possession/2020-2021-Premier-League-Stats",
                "https://fbref.com/en/comps/9/10728/misc/2020-2021-Premier-League-Stats",
                "https://fbref.com/en/comps/9/10728/keepers/2020-2021-Premier-League-Stats",
                "https://fbref.com/en/comps/9/10728/keepersadv/2020-2021-Premier-League-Stats"
            ]
        }
        else {
            URLs = [
                "https://fbref.com/en/comps/9/stats/Premier-League-Stats",
                "https://fbref.com/en/comps/9/shooting/Premier-League-Stats",
                "https://fbref.com/en/comps/9/passing/Premier-League-Stats",
                "https://fbref.com/en/comps/9/passing_types/Premier-League-Stats",
                "https://fbref.com/en/comps/9/gca/Premier-League-Stats",
                "https://fbref.com/en/comps/9/defense/Premier-League-Stats",
                "https://fbref.com/en/comps/9/possession/Premier-League-Stats",
                "https://fbref.com/en/comps/9/misc/Premier-League-Stats",
                "https://fbref.com/en/comps/9/keepers/Premier-League-Stats",
                "https://fbref.com/en/comps/9/keepersadv/Premier-League-Stats"
            ]
        }
        await loadPages(URLs);
        await saveJSONs("premierLeague");
        resolve();

    })

};

let scrapeLaLigaPages = async () => {

    return new Promise(async function (resolve, reject) {

        let URLs;
        if (SEASON === "18-19"){
            URLs = [
                "https://fbref.com/en/comps/12/1886/stats/2018-2019-La-Liga-Stats",
                "https://fbref.com/en/comps/12/1886/shooting/2018-2019-La-Liga-Stats",
                "https://fbref.com/en/comps/12/1886/passing/2018-2019-La-Liga-Stats",
                "https://fbref.com/en/comps/12/1886/passing_types/2018-2019-La-Liga-Stats",
                "https://fbref.com/en/comps/12/1886/gca/2018-2019-La-Liga-Stats",
                "https://fbref.com/en/comps/12/1886/defense/2018-2019-La-Liga-Stats",
                "https://fbref.com/en/comps/12/1886/possession/2018-2019-La-Liga-Stats",
                "https://fbref.com/en/comps/12/1886/misc/2018-2019-La-Liga-Stats",
                "https://fbref.com/en/comps/12/1886/keepers/2018-2019-La-Liga-Stats",
                "https://fbref.com/en/comps/12/1886/keepersadv/2018-2019-La-Liga-Stats"
            ]
        }
        else if (SEASON === "19-20"){
            URLs = [
                "https://fbref.com/en/comps/12/3239/stats/2019-2020-La-Liga-Stats",
                "https://fbref.com/en/comps/12/3239/shooting/2019-2020-La-Liga-Stats",
                "https://fbref.com/en/comps/12/3239/passing/2019-2020-La-Liga-Stats",
                "https://fbref.com/en/comps/12/3239/passing_types/2019-2020-La-Liga-Stats",
                "https://fbref.com/en/comps/12/3239/gca/2019-2020-La-Liga-Stats",
                "https://fbref.com/en/comps/12/3239/defense/2019-2020-La-Liga-Stats",
                "https://fbref.com/en/comps/12/3239/possession/2019-2020-La-Liga-Stats",
                "https://fbref.com/en/comps/12/3239/misc/2019-2020-La-Liga-Stats",
                "https://fbref.com/en/comps/12/3239/keepers/2019-2020-La-Liga-Stats",
                "https://fbref.com/en/comps/12/3239/keepersadv/2019-2020-La-Liga-Stats"
            ]
        }
        else if (SEASON === "20-21"){
            URLs = [
                "https://fbref.com/en/comps/12/10731/stats/2020-2021-La-Liga-Stats",
                "https://fbref.com/en/comps/12/10731/shooting/2020-2021-La-Liga-Stats",
                "https://fbref.com/en/comps/12/10731/passing/2020-2021-La-Liga-Stats",
                "https://fbref.com/en/comps/12/10731/passing_types/2020-2021-La-Liga-Stats",
                "https://fbref.com/en/comps/12/10731/gca/2020-2021-La-Liga-Stats",
                "https://fbref.com/en/comps/12/10731/defense/2020-2021-La-Liga-Stats",
                "https://fbref.com/en/comps/12/10731/possession/2020-2021-La-Liga-Stats",
                "https://fbref.com/en/comps/12/10731/misc/2020-2021-La-Liga-Stats",
                "https://fbref.com/en/comps/12/10731/keepers/2020-2021-La-Liga-Stats",
                "https://fbref.com/en/comps/12/10731/keepersadv/2020-2021-La-Liga-Stats"
            ]
        }
        else {
            URLs = [
                "https://fbref.com/en/comps/12/stats/La-Liga-Stats",
                "https://fbref.com/en/comps/12/shooting/La-Liga-Stats",
                "https://fbref.com/en/comps/12/passing/La-Liga-Stats",
                "https://fbref.com/en/comps/12/passing_types/La-Liga-Stats",
                "https://fbref.com/en/comps/12/gca/La-Liga-Stats",
                "https://fbref.com/en/comps/12/defense/La-Liga-Stats",
                "https://fbref.com/en/comps/12/possession/La-Liga-Stats",
                "https://fbref.com/en/comps/12/misc/La-Liga-Stats",
                "https://fbref.com/en/comps/12/keepers/La-Liga-Stats",
                "https://fbref.com/en/comps/12/keepersadv/La-Liga-Stats"
            ]
        }
        await loadPages(URLs);
        await saveJSONs("laLiga");
        resolve();

    })

};

let scrapeSerieAPages = async () => {

    return new Promise(async function (resolve, reject) {

        let URLs;
        if (SEASON === "18-19"){
            URLs = [
                "https://fbref.com/en/comps/11/1896/stats/2018-2019-Serie-A-Stats",
                "https://fbref.com/en/comps/11/1896/shooting/2018-2019-Serie-A-Stats",
                "https://fbref.com/en/comps/11/1896/passing/2018-2019-Serie-A-Stats",
                "https://fbref.com/en/comps/11/1896/passing_types/2018-2019-Serie-A-Stats",
                "https://fbref.com/en/comps/11/1896/gca/2018-2019-Serie-A-Stats",
                "https://fbref.com/en/comps/11/1896/defense/2018-2019-Serie-A-Stats",
                "https://fbref.com/en/comps/11/1896/possession/2018-2019-Serie-A-Stats",
                "https://fbref.com/en/comps/11/1896/misc/2018-2019-Serie-A-Stats",
                "https://fbref.com/en/comps/11/1896/keepers/2018-2019-Serie-A-Stats",
                "https://fbref.com/en/comps/11/1896/keepersadv/2018-2019-Serie-A-Stats"
            ]
        }
        else if (SEASON === "19-20"){
            URLs = [
                "https://fbref.com/en/comps/11/3260/stats/2019-2020-Serie-A-Stats",
                "https://fbref.com/en/comps/11/3260/shooting/2019-2020-Serie-A-Stats",
                "https://fbref.com/en/comps/11/3260/passing/2019-2020-Serie-A-Stats",
                "https://fbref.com/en/comps/11/3260/passing_types/2019-2020-Serie-A-Stats",
                "https://fbref.com/en/comps/11/3260/gca/2019-2020-Serie-A-Stats",
                "https://fbref.com/en/comps/11/3260/defense/2019-2020-Serie-A-Stats",
                "https://fbref.com/en/comps/11/3260/possession/2019-2020-Serie-A-Stats",
                "https://fbref.com/en/comps/11/3260/misc/2019-2020-Serie-A-Stats",
                "https://fbref.com/en/comps/11/3260/keepers/2019-2020-Serie-A-Stats",
                "https://fbref.com/en/comps/11/3260/keepersadv/2019-2020-Serie-A-Stats"
            ]
        }
        else if (SEASON === "20-21"){
            URLs = [
                "https://fbref.com/en/comps/11/10730/stats/2020-2021-Serie-A-Stats",
                "https://fbref.com/en/comps/11/10730/shooting/2020-2021-Serie-A-Stats",
                "https://fbref.com/en/comps/11/10730/passing/2020-2021-Serie-A-Stats",
                "https://fbref.com/en/comps/11/10730/passing_types/2020-2021-Serie-A-Stats",
                "https://fbref.com/en/comps/11/10730/gca/2020-2021-Serie-A-Stats",
                "https://fbref.com/en/comps/11/10730/defense/2020-2021-Serie-A-Stats",
                "https://fbref.com/en/comps/11/10730/possession/2020-2021-Serie-A-Stats",
                "https://fbref.com/en/comps/11/10730/misc/2020-2021-Serie-A-Stats",
                "https://fbref.com/en/comps/11/10730/keepers/2020-2021-Serie-A-Stats",
                "https://fbref.com/en/comps/11/10730/keepersadv/2020-2021-Serie-A-Stats"
            ]
        }
        else {
            URLs = [
                "https://fbref.com/en/comps/11/stats/Serie-A-Stats",
                "https://fbref.com/en/comps/11/shooting/Serie-A-Stats",
                "https://fbref.com/en/comps/11/passing/Serie-A-Stats",
                "https://fbref.com/en/comps/11/passing_types/Serie-A-Stats",
                "https://fbref.com/en/comps/11/gca/Serie-A-Stats",
                "https://fbref.com/en/comps/11/defense/Serie-A-Stats",
                "https://fbref.com/en/comps/11/possession/Serie-A-Stats",
                "https://fbref.com/en/comps/11/misc/Serie-A-Stats",
                "https://fbref.com/en/comps/11/keepers/Serie-A-Stats",
                "https://fbref.com/en/comps/11/keepersadv/Serie-A-Stats",
            ]
        }
        await loadPages(URLs);
        await saveJSONs("serieA");
        resolve();

    })

};

let scrapeBundesligaPages = async () => {

    return new Promise(async function (resolve, reject) {

        let URLs;
        if (SEASON === "18-19"){
            URLs = [
                "https://fbref.com/en/comps/20/2109/stats/2018-2019-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/2109/shooting/2018-2019-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/2109/passing/2018-2019-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/2109/passing_types/2018-2019-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/2109/gca/2018-2019-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/2109/defense/2018-2019-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/2109/possession/2018-2019-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/2109/misc/2018-2019-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/2109/keepers/2018-2019-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/2109/keepersadv/2018-2019-Bundesliga-Stats"
            ]
        }
        else if (SEASON === "19-20"){
            URLs = [
                "https://fbref.com/en/comps/20/3248/stats/2019-2020-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/3248/shooting/2019-2020-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/3248/passing/2019-2020-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/3248/passing_types/2019-2020-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/3248/gca/2019-2020-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/3248/defense/2019-2020-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/3248/possession/2019-2020-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/3248/misc/2019-2020-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/3248/keepers/2019-2020-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/3248/keepersadv/2019-2020-Bundesliga-Stats"
            ]
        }
        else if (SEASON === "20-21"){
            URLs = [
                "https://fbref.com/en/comps/20/10737/stats/2020-2021-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/10737/shooting/2020-2021-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/10737/passing/2020-2021-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/10737/passing_types/2020-2021-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/10737/gca/2020-2021-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/10737/defense/2020-2021-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/10737/possession/2020-2021-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/10737/misc/2020-2021-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/10737/keepers/2020-2021-Bundesliga-Stats",
                "https://fbref.com/en/comps/20/10737/keepersadv/2020-2021-Bundesliga-Stats"
            ]
        }
        else {
            URLs = [
                "https://fbref.com/en/comps/20/stats/Bundesliga-Stats",
                "https://fbref.com/en/comps/20/shooting/Bundesliga-Stats",
                "https://fbref.com/en/comps/20/passing/Bundesliga-Stats",
                "https://fbref.com/en/comps/20/passing_types/Bundesliga-Stats",
                "https://fbref.com/en/comps/20/gca/Bundesliga-Stats",
                "https://fbref.com/en/comps/20/defense/Bundesliga-Stats",
                "https://fbref.com/en/comps/20/possession/Bundesliga-Stats",
                "https://fbref.com/en/comps/20/misc/Bundesliga-Stats",
                "https://fbref.com/en/comps/20/keepers/Bundesliga-Stats",
                "https://fbref.com/en/comps/20/keepersadv/Bundesliga-Stats",
            ]
        }
        await loadPages(URLs);
        await saveJSONs("bundesliga");
        resolve();

    })

};

let scrapeLigue1Pages = async () => {

    return new Promise(async function (resolve, reject) {

        let URLs;
        if (SEASON === "18-19"){
            URLs = [
                "https://fbref.com/en/comps/13/2104/stats/2018-2019-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/2104/shooting/2018-2019-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/2104/passing/2018-2019-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/2104/passing_types/2018-2019-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/2104/gca/2018-2019-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/2104/defense/2018-2019-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/2104/possession/2018-2019-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/2104/misc/2018-2019-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/2104/keepers/2018-2019-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/2104/keepersadv/2018-2019-Ligue-1-Stats"
            ]
        }
        else if (SEASON === "19-20"){
            URLs = [
                "https://fbref.com/en/comps/13/3243/stats/2019-2020-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/3243/shooting/2019-2020-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/3243/passing/2019-2020-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/3243/passing_types/2019-2020-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/3243/gca/2019-2020-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/3243/defense/2019-2020-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/3243/possession/2019-2020-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/3243/misc/2019-2020-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/3243/keepers/2019-2020-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/3243/keepersadv/2019-2020-Ligue-1-Stats"
            ]
        }
        else if (SEASON === "20-21"){
            URLs = [
                "https://fbref.com/en/comps/13/10732/stats/2020-2021-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/10732/shooting/2020-2021-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/10732/passing/2020-2021-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/10732/passing_types/2020-2021-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/10732/gca/2020-2021-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/10732/defense/2020-2021-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/10732/possession/2020-2021-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/10732/misc/2020-2021-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/10732/keepers/2020-2021-Ligue-1-Stats",
                "https://fbref.com/en/comps/13/10732/keepersadv/2020-2021-Ligue-1-Stats"
            ]
        }
        else {
            URLs = [
                "https://fbref.com/en/comps/13/stats/Ligue-1-Stats",
                "https://fbref.com/en/comps/13/shooting/Ligue-1-Stats",
                "https://fbref.com/en/comps/13/passing/Ligue-1-Stats",
                "https://fbref.com/en/comps/13/passing_types/Ligue-1-Stats",
                "https://fbref.com/en/comps/13/gca/Ligue-1-Stats",
                "https://fbref.com/en/comps/13/defense/Ligue-1-Stats",
                "https://fbref.com/en/comps/13/possession/Ligue-1-Stats",
                "https://fbref.com/en/comps/13/misc/Ligue-1-Stats",
                "https://fbref.com/en/comps/13/keepers/Ligue-1-Stats",
                "https://fbref.com/en/comps/13/keepersadv/Ligue-1-Stats",
            ]
        }
        await loadPages(URLs);
        await saveJSONs("ligue1");
        resolve();

    })

};

let scrapeChampionsLeaguePages = async () => {

    return new Promise(async function (resolve, reject) {

        let URLs;
        if (SEASON === "18-19"){
            URLs = [
                "https://fbref.com/en/comps/8/2102/stats/2018-2019-Champions-League-Stats",
                "https://fbref.com/en/comps/8/2102/shooting/2018-2019-Champions-League-Stats",
                "https://fbref.com/en/comps/8/2102/passing/2018-2019-Champions-League-Stats",
                "https://fbref.com/en/comps/8/2102/passing_types/2018-2019-Champions-League-Stats",
                "https://fbref.com/en/comps/8/2102/gca/2018-2019-Champions-League-Stats",
                "https://fbref.com/en/comps/8/2102/defense/2018-2019-Champions-League-Stats",
                "https://fbref.com/en/comps/8/2102/possession/2018-2019-Champions-League-Stats",
                "https://fbref.com/en/comps/8/2102/misc/2018-2019-Champions-League-Stats",
                "https://fbref.com/en/comps/8/2102/keepers/2018-2019-Champions-League-Stats",
                "https://fbref.com/en/comps/8/2102/keepersadv/2018-2019-Champions-League-Stats"
            ]
        }
        else if (SEASON === "19-20"){
            URLs = [
                "https://fbref.com/en/comps/8/2900/stats/2019-2020-Champions-League-Stats",
                "https://fbref.com/en/comps/8/2900/shooting/2019-2020-Champions-League-Stats",
                "https://fbref.com/en/comps/8/2900/passing/2019-2020-Champions-League-Stats",
                "https://fbref.com/en/comps/8/2900/passing_types/2019-2020-Champions-League-Stats",
                "https://fbref.com/en/comps/8/2900/gca/2019-2020-Champions-League-Stats",
                "https://fbref.com/en/comps/8/2900/defense/2019-2020-Champions-League-Stats",
                "https://fbref.com/en/comps/8/2900/possession/2019-2020-Champions-League-Stats",
                "https://fbref.com/en/comps/8/2900/misc/2019-2020-Champions-League-Stats",
                "https://fbref.com/en/comps/8/2900/keepers/2019-2020-Champions-League-Stats",
                "https://fbref.com/en/comps/8/2900/keepersadv/2019-2020-Champions-League-Stats"
            ]
        }
        else if (SEASON === "20-21"){
            URLs = [
                "https://fbref.com/en/comps/8/10096/stats/2020-2021-Champions-League-Stats",
                "https://fbref.com/en/comps/8/10096/shooting/2020-2021-Champions-League-Stats",
                "https://fbref.com/en/comps/8/10096/passing/2020-2021-Champions-League-Stats",
                "https://fbref.com/en/comps/8/10096/passing_types/2020-2021-Champions-League-Stats",
                "https://fbref.com/en/comps/8/10096/gca/2020-2021-Champions-League-Stats",
                "https://fbref.com/en/comps/8/10096/defense/2020-2021-Champions-League-Stats",
                "https://fbref.com/en/comps/8/10096/possession/2020-2021-Champions-League-Stats",
                "https://fbref.com/en/comps/8/10096/misc/2020-2021-Champions-League-Stats",
                "https://fbref.com/en/comps/8/10096/keepers/2020-2021-Champions-League-Stats",
                "https://fbref.com/en/comps/8/10096/keepersadv/2020-2021-Champions-League-Stats"
            ]
        }
        else {
            URLs = [
                "https://fbref.com/en/comps/8/stats/Champions-League-Stats",
                "https://fbref.com/en/comps/8/shooting/Champions-League-Stats",
                "https://fbref.com/en/comps/8/passing/Champions-League-Stats",
                "https://fbref.com/en/comps/8/passing_types/Champions-League-Stats",
                "https://fbref.com/en/comps/8/gca/Champions-League-Stats",
                "https://fbref.com/en/comps/8/defense/Champions-League-Stats",
                "https://fbref.com/en/comps/8/possession/Champions-League-Stats",
                "https://fbref.com/en/comps/8/misc/Champions-League-Stats",
                "https://fbref.com/en/comps/8/keepers/Champions-League-Stats",
                "https://fbref.com/en/comps/8/keepersadv/Champions-League-Stats",
            ]
        }
        await loadPages(URLs);
        await saveJSONs("championsLeague");
        resolve();

    })

};

let scrapeEuropaLeaguePages = async () => {

    return new Promise(async function (resolve, reject) {

        let URLs;
        if (SEASON === "18-19"){
            URLs = [
                "https://fbref.com/en/comps/19/2103/stats/2018-2019-Europa-League-Stats",
                "https://fbref.com/en/comps/19/2103/shooting/2018-2019-Europa-League-Stats",
                "https://fbref.com/en/comps/19/2103/passing/2018-2019-Europa-League-Stats",
                "https://fbref.com/en/comps/19/2103/passing_types/2018-2019-Europa-League-Stats",
                "https://fbref.com/en/comps/19/2103/gca/2018-2019-Europa-League-Stats",
                "https://fbref.com/en/comps/19/2103/defense/2018-2019-Europa-League-Stats",
                "https://fbref.com/en/comps/19/2103/possession/2018-2019-Europa-League-Stats",
                "https://fbref.com/en/comps/19/2103/misc/2018-2019-Europa-League-Stats",
                "https://fbref.com/en/comps/19/2103/keepers/2018-2019-Europa-League-Stats",
                "https://fbref.com/en/comps/19/2103/keepersadv/2018-2019-Europa-League-Stats"
            ]
        }
        else if (SEASON === "19-20"){
            URLs = [
                "https://fbref.com/en/comps/19/2901/stats/2019-2020-Europa-League-Stats",
                "https://fbref.com/en/comps/19/2901/shooting/2019-2020-Europa-League-Stats",
                "https://fbref.com/en/comps/19/2901/passing/2019-2020-Europa-League-Stats",
                "https://fbref.com/en/comps/19/2901/passing_types/2019-2020-Europa-League-Stats",
                "https://fbref.com/en/comps/19/2901/gca/2019-2020-Europa-League-Stats",
                "https://fbref.com/en/comps/19/2901/defense/2019-2020-Europa-League-Stats",
                "https://fbref.com/en/comps/19/2901/possession/2019-2020-Europa-League-Stats",
                "https://fbref.com/en/comps/19/2901/misc/2019-2020-Europa-League-Stats",
                "https://fbref.com/en/comps/19/2901/keepers/2019-2020-Europa-League-Stats",
                "https://fbref.com/en/comps/19/2901/keepersadv/2019-2020-Europa-League-Stats"
            ]
        }
        else if (SEASON === "20-21"){
            URLs = [
                "https://fbref.com/en/comps/19/10097/stats/2020-2021-Europa-League-Stats",
                "https://fbref.com/en/comps/19/10097/shooting/2020-2021-Europa-League-Stats",
                "https://fbref.com/en/comps/19/10097/passing/2020-2021-Europa-League-Stats",
                "https://fbref.com/en/comps/19/10097/passing_types/2020-2021-Europa-League-Stats",
                "https://fbref.com/en/comps/19/10097/gca/2020-2021-Europa-League-Stats",
                "https://fbref.com/en/comps/19/10097/defense/2020-2021-Europa-League-Stats",
                "https://fbref.com/en/comps/19/10097/possession/2020-2021-Europa-League-Stats",
                "https://fbref.com/en/comps/19/10097/misc/2020-2021-Europa-League-Stats",
                "https://fbref.com/en/comps/19/10097/keepers/2020-2021-Europa-League-Stats",
                "https://fbref.com/en/comps/19/10097/keepersadv/2020-2021-Europa-League-Stats"
            ]
        }
        else {
            URLs = [
                "https://fbref.com/en/comps/19/stats/Europa-League-Stats",
                "https://fbref.com/en/comps/19/shooting/Europa-League-Stats",
                "https://fbref.com/en/comps/19/passing/Europa-League-Stats",
                "https://fbref.com/en/comps/19/passing_types/Europa-League-Stats",
                "https://fbref.com/en/comps/19/gca/Europa-League-Stats",
                "https://fbref.com/en/comps/19/defense/Europa-League-Stats",
                "https://fbref.com/en/comps/19/possession/Europa-League-Stats",
                "https://fbref.com/en/comps/19/misc/Europa-League-Stats",
                "https://fbref.com/en/comps/19/keepers/Europa-League-Stats",
                "https://fbref.com/en/comps/19/keepersadv/Europa-League-Stats"
            ]
        }
        await loadPages(URLs);
        await saveJSONs("europaLeague");
        resolve();

    })

};


let loadPages = async (URLs) => {

    return new Promise(async function (resolve, reject) {

        let gotoPromises = [];
        for (let i=0; i<URLs.length; i++){
            gotoPromises.push(PAGES[i].goto(URLs[i], {waitUntil: 'networkidle2'}))
        }

        await Promise.all(gotoPromises);
        resolve();

    });

};


saveJSONs = async (competition) => {

    return new Promise(function (resolve, reject) {

        let retrieveJSONPromises = [];

        let unhideTable = competition === "europaLeague";

        for (let i=0; i<TABLE_TYPES.length; i++){
            if (TABLE_TYPES[i].startsWith("keeper")){
                unhideTable = false;
            }
            retrieveJSONPromises.push(retrieveJSON(PAGES[i], TABLE_TYPES[i], unhideTable))
        }

        Promise.all(retrieveJSONPromises).then(
            (result) => {
                (async function loop() {
                    let combined = {};
                    let combined_gk = {};
                    for (let i=0; i<result.length; i++){
                        await new Promise(async function (resolve, reject) {
                            let temp = result[i];
                            if ('keeper_Player' in temp['1'] || 'keeper_adv_Player' in temp['1']){
                                combined_gk = merge(combined_gk, temp);
                                resolve();
                            }
                            else if('passing_types_Player' in temp['1']){
                                //create temp object containing passing type data for just GKs
                                // let temp2 = {};
                                // let counter = 1;
                                // for (let player in temp){
                                //     if (temp[player]['passing_types_Pos'] === "GK")
                                //     {
                                //         temp2[counter.toString()] = temp[player];
                                //         counter++
                                //     }
                                // }
                                // combined_gk = merge(combined_gk, temp2);
                                combined = merge(combined, temp);
                                resolve();
                            }
                            else {
                                combined = merge(combined, temp);
                                resolve();
                            }
                        });
                    }
                    await fs.writeFile(path.join(__dirname, `fbrefData/${SEASON}/${competition}.json`), JSON.stringify(combined, null, '\t'), async function(err) {
                        if (err) {
                            console.log(err);
                        }
                        await fs.writeFile(path.join(__dirname, `fbrefData/${SEASON}/${competition}_gk.json`), JSON.stringify(combined_gk, null, '\t'), function(err) {
                            if (err) {
                                console.log(err);
                            }
                            resolve();
                        });
                    });
                })();
            }
        )

    });

};


let retrieveJSON = async (page, tableType, unhideTable = false) => {

    return new Promise(async function (resolve, reject) {

        // await page.waitFor(10000);

        if (unhideTable){
            let unhideTableButtonSelector = `#stats_${tableType}_control`;

            await page.waitForSelector(unhideTableButtonSelector);
            await page.evaluate((unhideTableButtonSelector) => document.querySelector(unhideTableButtonSelector).click(), unhideTableButtonSelector);

            let tableSelector = `.table_container`;
            await page.waitForSelector(tableSelector);

            await page.waitForSelector(unhideTableButtonSelector);
            await page.evaluate((unhideTableButtonSelector) => document.querySelector(unhideTableButtonSelector).click(), unhideTableButtonSelector);
        }

        //let convertToCsvButtonSelector = `#all_stats_${tableType} > div.section_heading > div > ul > li.hasmore > div > ul > li:nth-child(4) > button`; //convert to csv button selector;
        let convertToCsvButtonSelector = `#stats_${tableType}_sh > div > ul > li.hasmore > div > ul > li:nth-child(4) > button`
        let csvSelector = `#csv_stats_${tableType}`;

        await page.waitForSelector(`#stats_${tableType}`);
        await page.waitForSelector(convertToCsvButtonSelector);

        let returnValues = await page.evaluate(async (buttonSelector, csvSelector, tableType) => {
            let playerCodes = [];
            let playerURLs = [];
            if (tableType === "standard" || tableType === "keeper"){
                let tds = Array.from(document.querySelectorAll('[data-stat="player"]'), e => e.innerHTML);
                for (let i=0; i<tds.length; i++){
                    if (tds[i] !== "Player"){
                        playerCodes.push(tds[i].substring(21, tds[i].indexOf("/", 21)));
                        playerURLs.push(tds[i].substring(9, tds[i].indexOf('">', 9)));
                    }
                }
            }
            document.querySelector(buttonSelector).click();
            let csv = document.querySelector(csvSelector).innerHTML;
            csv = csv.replace("<!-- ALREADYCSV -->", "");
            csv = csv.replace("--- When using SR data, please cite us and provide a link and/or a mention.\n" +
                "\n" +
                "\n" +
                " ", "");
            csv = csv.split("\n");
            csv.shift();
            csv.shift();
            csv[0] = csv[0].split(",");
            for (let i=0; i<csv[0].length; i++){
                csv[0][i] = tableType + "_" + csv[0][i];
            }
            csv[0] = csv[0].join(",");
            csv = csv.join("\n");
            return [csv, playerCodes, playerURLs];
        }, convertToCsvButtonSelector, csvSelector, tableType);

        let csv = returnValues[0];
        let playerCodes = returnValues[1];
        let playerURLs = returnValues[2];

        let json = csv2json(csv,
            {
                parseNumbers: true,
                parseJSON: true,
                hash: true
            });

        //if the table is hidden by default, there seems to be a bug where the table is duplicated in the HTML
        //therefore, we disregard the second half of the player codes array.
        let numPlayerCodes = unhideTable ? playerCodes.length / 2 : playerCodes.length;

        if (tableType === "standard" || tableType === "keeper"){
            //note that we start at 1 because the fbref CSV row numbers start at 1, not 0
            for (let i=1; i<numPlayerCodes+1; i++){
                json[(i).toString(10)]["code"] = playerCodes[i-1];
                json[(i).toString(10)]["url"] = playerURLs[i-1];
            }
        }

        resolve(json);

    });


};

console.time('fbref stat retrieval');
setup()
    .then(() =>
        scrapeEPLPages()
    )
    .then(() =>
        scrapeLaLigaPages()
    )
    .then(() =>
        scrapeSerieAPages()
    )
    .then(() =>
        scrapeBundesligaPages()
    )
    .then(() =>
        scrapeLigue1Pages()
    )
    .then(() =>
        scrapeChampionsLeaguePages()
    )
    .then(() =>
        scrapeEuropaLeaguePages()
    )
    .then(() =>
        (console.timeEnd('fbref stat retrieval'), process.exit(0))
    )
    .catch(async (anError) => {
        console.log(anError);
        process.exit(-1);
    });

