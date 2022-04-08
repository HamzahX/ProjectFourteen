//initialize constants
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const scriptName = path.basename(__filename);
const supportedSeasons = ["18-19", "19-20", "20-21", "21-22"];

var SEASON;
//parse command line arguments to get the season
let ARGS = process.argv.slice(2);
if (ARGS.length !== 1){
    console.log(`Incorrect number of args. Usage: node ${scriptName} <season>`);
    process.exit(-1);
}
else {
    if (!supportedSeasons.includes(ARGS[0])){
        console.log("Incorrect season arg. Supported seasons are supportedSeason");
        process.exit(-1);
    }
    else {
        SEASON = ARGS[0];
    }
}

//globals
var BROWSER;
var PAGES = [];
var URLs;
if (SEASON === "18-19"){
    URLs = [
        "https://fbref.com/en/comps/9/1889/2018-2019-Premier-League-Stats",
        "https://fbref.com/en/comps/12/1886/2018-2019-La-Liga-Stats",
        "https://fbref.com/en/comps/11/1896/2018-2019-Serie-A-Stats",
        "https://fbref.com/en/comps/20/2109/2018-2019-Bundesliga-Stats",
        "https://fbref.com/en/comps/13/2104/2018-2019-Ligue-1-Stats",
        "https://fbref.com/en/comps/8/2102/possession/2018-2019-Champions-League-Stats",
        "https://fbref.com/en/comps/19/2103/possession/2018-2019-Europa-League-Stats"
    ];
}
else if (SEASON === "19-20"){
    URLs = [
        "https://fbref.com/en/comps/9/3232/2019-2020-Premier-League-Stats",
        "https://fbref.com/en/comps/12/3239/2019-2020-La-Liga-Stats",
        "https://fbref.com/en/comps/11/3260/2019-2020-Serie-A-Stats",
        "https://fbref.com/en/comps/20/3248/2019-2020-Bundesliga-Stats",
        "https://fbref.com/en/comps/13/3243/2019-2020-Ligue-1-Stats",
        "https://fbref.com/en/comps/8/2900/possession/2019-2020-Champions-League-Stats",
        "https://fbref.com/en/comps/19/2901/possession/2019-2020-Europa-League-Stats"
    ];
}
else if (SEASON === "20-21"){
    URLs = [
        "https://fbref.com/en/comps/9/10728/2020-2021-Premier-League-Stats",
        "https://fbref.com/en/comps/12/10731/2020-2021-La-Liga-Stats",
        "https://fbref.com/en/comps/11/10730/2020-2021-Serie-A-Stats",
        "https://fbref.com/en/comps/20/10737/2020-2021-Bundesliga-Stats",
        "https://fbref.com/en/comps/13/10732/2020-2021-Ligue-1-Stats",
        "https://fbref.com/en/comps/8/10096/possession/2020-2021-Champions-League-Stats",
        "https://fbref.com/en/comps/19/10097/possession/2020-2021-Europa-League-Stats"
    ];
}
else {
    URLs = [
        "https://fbref.com/en/comps/9/Premier-League-Stats",
        "https://fbref.com/en/comps/12/La-Liga-Stats",
        "https://fbref.com/en/comps/11/Serie-A-Stats",
        "https://fbref.com/en/comps/20/Bundesliga-Stats",
        "https://fbref.com/en/comps/13/Ligue-1-Stats",
        "https://fbref.com/en/comps/8/possession/Champions-League-Stats",
        "https://fbref.com/en/comps/19/possession/Europa-League-Stats"
    ];
}
const COMPETITION_NAMES = [
    "Premier League",
    "La Liga",
    "Serie A",
    "Bundesliga",
    "Ligue 1",
    "Champions League",
    "Europa League"
];

const FBREF_TO_WHOSCORED_TEAMS = JSON.parse(fs.readFileSync(path.join(__dirname, '/teamMappingData/fbrefToWhoscored.json')));

var TOUCHES_AGAINST_STATS = {};


/**
 * Launches a browser window using puppeteer and creates the required number of pages
 * @returns {Promise<*>} Promise resolves when the browser has been successfully launched and all pages have been created
 */
let setup = async () => {
    return new Promise(async function(resolve, reject){

        console.time('browser launch');

        BROWSER = await puppeteer.launch({
            headless: false,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        (async function loop() {
            for (let i=0; i<URLs.length; i++){
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


let loadPages = async () => {

    return new Promise(async function (resolve, reject) {

        let gotoPromises = [];
        for (let i=0; i<URLs.length; i++){
            gotoPromises.push(PAGES[i].goto(URLs[i], {waitUntil: 'networkidle2'}))
        }

        await Promise.all(gotoPromises);
        resolve();

    });

};


let saveJSONs = async () => {

    return new Promise(function (resolve, reject) {

        let retrieveJSONPromises = [];
        for (let i=0; i<COMPETITION_NAMES.length; i++){
            retrieveJSONPromises.push(retrieveJSON(PAGES[i], COMPETITION_NAMES[i]))
        }
        Promise.all(retrieveJSONPromises).then(
            async (results) => {
                for (let i=0; i<results.length; i++){
                    let currentCompetition = results[i]['competitionName'];
                    TOUCHES_AGAINST_STATS[currentCompetition] = results[i]['touchesAgainstStats'];
                }
                await fs.writeFile(path.join(__dirname, `touchesAgainstData/${SEASON}.json`), JSON.stringify(TOUCHES_AGAINST_STATS, null, '\t'), async function(err) {
                    if (err) {
                        console.log(err);
                    }
                    resolve()
                });
            }
        )

    });

};


let retrieveJSON = async (page, competitionName) => {

    await page.waitForSelector('#stats_squads_possession_against');

    return await page.evaluate(async (competitionName, FBREF_TO_WHOSCORED_TEAMS) => {

        let touchesAgainstStats = {};

        const ths = Array.from(document.querySelectorAll('#stats_squads_possession_against tbody [data-stat="squad"]')); //get all th elements in the table (team names)

        //get touches against tds
        const tds_90s = Array.from(document.querySelectorAll('#stats_squads_possession_against tbody [data-stat="minutes_90s"]'));
        const tds_def_pen_area = Array.from(document.querySelectorAll('#stats_squads_possession_against tbody [data-stat="touches_def_pen_area"]'));
        const tds_def_3rd = Array.from(document.querySelectorAll('#stats_squads_possession_against tbody [data-stat="touches_def_3rd"]'));
        const tds_mid_3rd = Array.from(document.querySelectorAll('#stats_squads_possession_against tbody [data-stat="touches_mid_3rd"]'));
        const tds_att_3rd = Array.from(document.querySelectorAll('#stats_squads_possession_against tbody [data-stat="touches_att_3rd"]'));
        const tds_att_pen_area = Array.from(document.querySelectorAll('#stats_squads_possession_against tbody [data-stat="touches_att_pen_area"]'));
        const tds_live = Array.from(document.querySelectorAll('#stats_squads_possession_against tbody [data-stat="touches_live_ball"]'));

        for (let i=0; i<ths.length; i++){

            let teamNameHTML;

            if (competitionName !== "Champions League" && competitionName !== "Europa League"){
                teamNameHTML = ths[i].innerHTML;
            }
            else {
                teamNameHTML = ths[i].innerHTML;
                teamNameHTML = teamNameHTML.substring(teamNameHTML.indexOf('</span>')+7, teamNameHTML.length);
            }

            let teamName = teamNameHTML.substring(teamNameHTML.indexOf('">')+2, teamNameHTML.indexOf('</a>'));

            //remove "vs "
            teamName = teamName.substring(3, teamName.length);

            if (FBREF_TO_WHOSCORED_TEAMS[teamName] === undefined){
                continue;
            }

            teamName = FBREF_TO_WHOSCORED_TEAMS[teamName]["whoscored"];

            touchesAgainstStats[teamName] = {};

            let matchesPlayed = parseInt(tds_90s[i].innerHTML);

            touchesAgainstStats[teamName]["matchesPlayed"] = matchesPlayed;

            touchesAgainstStats[teamName]["defPenArea_total"] = parseInt(tds_def_pen_area[i].innerHTML);
            touchesAgainstStats[teamName]["def3rd_total"] = parseInt(tds_def_3rd[i].innerHTML);
            touchesAgainstStats[teamName]["mid3rd_total"] = parseInt(tds_mid_3rd[i].innerHTML);
            touchesAgainstStats[teamName]["att3rd_total"] = parseInt(tds_att_3rd[i].innerHTML);
            touchesAgainstStats[teamName]["attPenArea_total"] = parseInt(tds_att_pen_area[i].innerHTML);
            touchesAgainstStats[teamName]["live_total"] = parseInt(tds_live[i].innerHTML);

            touchesAgainstStats[teamName]["def2/3ds_total"] = touchesAgainstStats[teamName]["def3rd_total"] + touchesAgainstStats[teamName]["mid3rd_total"];
            touchesAgainstStats[teamName]["att2/3ds_total"] = touchesAgainstStats[teamName]["mid3rd_total"] + touchesAgainstStats[teamName]["att3rd_total"];

            touchesAgainstStats[teamName]["defPenArea_per90"] = parseInt(tds_def_pen_area[i].innerHTML) / matchesPlayed;
            touchesAgainstStats[teamName]["def3rd_per90"] = parseInt(tds_def_3rd[i].innerHTML) / matchesPlayed;
            touchesAgainstStats[teamName]["mid3rd_per90"] = parseInt(tds_mid_3rd[i].innerHTML) / matchesPlayed;
            touchesAgainstStats[teamName]["att3rd_per90"] = parseInt(tds_att_3rd[i].innerHTML) / matchesPlayed;
            touchesAgainstStats[teamName]["attPenArea_per90"] = parseInt(tds_att_pen_area[i].innerHTML) / matchesPlayed;
            touchesAgainstStats[teamName]["live_per90"] = parseInt(tds_live[i].innerHTML) / matchesPlayed;

            touchesAgainstStats[teamName]["def2/3ds_per90"] = touchesAgainstStats[teamName]["def3rd_per90"] + touchesAgainstStats[teamName]["mid3rd_per90"];
            touchesAgainstStats[teamName]["att2/3ds_per90"] = touchesAgainstStats[teamName]["mid3rd_per90"] + touchesAgainstStats[teamName]["att3rd_per90"];

        }

        return {
            'touchesAgainstStats': touchesAgainstStats,
            'competitionName': competitionName,
        }

    }, competitionName, FBREF_TO_WHOSCORED_TEAMS);

};


console.time('touches against retrieval');
setup()
    .then(async () => {
        await loadPages();
        await saveJSONs();
    })
    .then(() =>
        (console.timeEnd('touches against retrieval'), process.exit(0))
    )
    .catch(async (anError) => {
        console.log(anError);
        process.exit(-1);
    });
