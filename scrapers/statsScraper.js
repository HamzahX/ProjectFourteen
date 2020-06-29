var SEASON;
//parse command line arguments to get the season
let ARGS = process.argv.slice(2);
if (ARGS.length !== 1){
    console.log("Incorrect number of args. Usage: node fbrefScraper <season>");
    process.exit(-1);
}
else {
    if (ARGS[0] !== "18-19" && ARGS[0] !== "19-20"){
        console.log("Incorrect season arg. Supported seasons are 18-19 and 19-20");
        process.exit(-1);
    }
    else {
        SEASON = ARGS[0];
    }
}

//initialize constants
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const csv2json = require('csvjson-csv2json');
const merge = require('lodash.merge');

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
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
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
                "https://fbref.com/en/comps/13/keepersadv/Ligue-1-Stats"
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
                "https://fbref.com/en/comps/8/keepersadv/Champions-League-Stats"
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
        for (let i=0; i<TABLE_TYPES.length; i++){
            retrieveJSONPromises.push(retrieveJSON(PAGES[i], TABLE_TYPES[i]))
        }
        Promise.all(retrieveJSONPromises).then(
            (result) => {
                (async function loop() {
                    let combined = {};
                    let combined_gk = {};
                    for (let i=0; i<result.length; i++){
                        await new Promise(async function (resolve, reject) {
                            let temp = result[i];
                            if ('keeper___1' in temp['1'] || 'keeper_adv___1' in temp['1'] || 'passing_types___1' in temp['1']){
                                combined_gk = merge(combined_gk, temp);
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


let retrieveJSON = async (page, tableType) => {

    return new Promise(async function (resolve, reject) {
        let buttonSelector = `#all_stats_${tableType} > div.section_heading > div > ul > li.hasmore > div > ul > li:nth-child(4) > button`; //convert to csv button selector;
        let csvSelector = `#csv_stats_${tableType}`;

        await page.waitForSelector(`#stats_${tableType}`);

        let returnValues = await page.evaluate(async (buttonSelector, csvSelector, tableType) => {
            let playerCodes = [];
            if (tableType === "standard" || tableType === "keeper"){
                let tds = Array.from(document.querySelectorAll('[data-stat="player"]'), e => e.innerHTML);
                for (let i=0; i<tds.length; i++){
                    if (tds[i] !== "Player"){
                        playerCodes.push(tds[i]);
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
            csv[1] = csv[1].split(",");
            for (let i=0; i<csv[1].length; i++){
                csv[1][i] = tableType + "_" + csv[1][i];
            }
            csv[1] = csv[1].join(",");
            csv = csv.join("\n");
            return [csv, playerCodes];
        }, buttonSelector, csvSelector, tableType);

        let csv = returnValues[0];
        let playerCodes = returnValues[1];

        if (tableType === "passing_types"){
            let csvTemp = csv;
            csv = [];
            csvTemp = csvTemp.split("\n");
            csv.push(csvTemp[0]);
            csv.push(csvTemp[1]);
            let counter = 1;
            for (let i=2; i<csvTemp.length; i++){
                let currentLine = csvTemp[i];
                currentLine = currentLine.split(",");
                if (currentLine[3] === "GK"){
                    currentLine[0] = counter.toString();
                    counter++;
                    csv.push(currentLine.join(","));
                }
            }
            csv = csv.join("\n");
        }

        let json = csv2json(csv,
            {
                parseNumbers: true,
                parseJSON: true,
                hash: true
            });

        // console.log([Object.keys(json).length, playerCodes.length]);

        if (tableType === "standard" || tableType === "keeper"){
            for (let i=0; i<playerCodes.length; i++){
                let playerCodeString = playerCodes[i];
                let playerCode = playerCodeString.substring(21, playerCodeString.indexOf("/", 21));
                json[(i+1).toString(10)]["code"] = playerCode;
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
    });

