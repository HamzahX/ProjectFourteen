var SEASON;
var ONLY_PROCESS;
//parse command line arguments to get the season
let ARGS = process.argv.slice(2);
if (ARGS.length !== 2){
    console.log("Incorrect number of args. Usage: node metadataScraper <season> <onlyProcess>");
    process.exit(-1);
}
else {
    if (ARGS[0] !== "18-19" && ARGS[0] !== "19-20" && ARGS[1] !== "true" && ARGS[1] !== "false"){
        console.log("Incorrect args.");
        process.exit(-1);
    }
    else {
        SEASON = ARGS[0];
        ONLY_PROCESS = ARGS[1] === "true";
    }
}

//initialize constants
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const countryCodes = require('./countryCodes.js');

//globals
var BROWSER;
var PAGE;
var URLs;
if (SEASON === "18-19"){
    URLs = [
        "https://www.whoscored.com/Regions/252/Tournaments/2/Seasons/7361/Stages/16368/PlayerStatistics/England-Premier-League-2018-2019",
        "https://www.whoscored.com/Regions/206/Tournaments/4/Seasons/7466/Stages/16546/PlayerStatistics/Spain-LaLiga-2018-2019",
        "https://www.whoscored.com/Regions/108/Tournaments/5/Seasons/7468/Stages/16548/PlayerStatistics/Italy-Serie-A-2018-2019",
        "https://www.whoscored.com/Regions/81/Tournaments/3/Seasons/7405/Stages/16427/PlayerStatistics/Germany-Bundesliga-2018-2019",
        "https://www.whoscored.com/Regions/74/Tournaments/22/Seasons/7344/Stages/16348/PlayerStatistics/France-Ligue-1-2018-2019",
        "https://www.whoscored.com/Regions/250/Tournaments/12/Seasons/7352/Stages/16651/PlayerStatistics/Europe-Champions-League-2018-2019",
        "https://www.whoscored.com/Regions/250/Tournaments/30/Seasons/7353/Stages/16786/PlayerStatistics/Europe-Europa-League-2018-2019"
    ];
}
else {
    URLs = [
        "https://www.whoscored.com/Regions/252/Tournaments/2/Seasons/7811/Stages/17590/PlayerStatistics/England-Premier-League-2019-2020",
        "https://www.whoscored.com/Regions/206/Tournaments/4/Seasons/7889/Stages/17702/PlayerStatistics/Spain-LaLiga-2019-2020",
        "https://www.whoscored.com/Regions/108/Tournaments/5/Seasons/7928/Stages/17835/PlayerStatistics/Italy-Serie-A-2019-2020",
        "https://www.whoscored.com/Regions/81/Tournaments/3/Seasons/7872/Stages/17682/PlayerStatistics/Germany-Bundesliga-2019-2020",
        "https://www.whoscored.com/Regions/74/Tournaments/22/Seasons/7814/Stages/17593/PlayerStatistics/France-Ligue-1-2019-2020",
        "https://www.whoscored.com/Regions/250/Tournaments/12/Seasons/7804/Stages/18065/PlayerStatistics/Europe-Champions-League-2019-2020",
        "https://www.whoscored.com/Regions/250/Tournaments/30/Seasons/7805/Stages/18066/PlayerStatistics/Europe-Europa-League-2019-2020"
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
var metadataArray = [];

//load position data; the list of players who play in each position
let FWPlayers = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/FWPlayers.json`)))['codes'];
let AMPlayers = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/AMPlayers.json`)))['codes'];
let CMPlayers = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/CMPlayers.json`)))['codes'];
let FBPlayers = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/FBPlayers.json`)))['codes'];
let CBPlayers = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/CBPlayers.json`)))['codes'];
let GKPlayers = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/GKPlayers.json`)))['codes'];

/**
 * Launches a browser window using puppeteer and navigates to the appropriate URL based on the command line arguments
 * @returns {Promise<*>} Promise resolves when the browser has been successfully launched
 */
let setup = async () => {
    return new Promise(async function(resolve, reject){
        if (ONLY_PROCESS){
            resolve();
        }
        console.time('browser launch');
        //headless = false; whoscored.com blocks headless requests
        BROWSER = await puppeteer.launch({
            headless: false,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        PAGE = await BROWSER.newPage();
        await PAGE.setDefaultNavigationTimeout(0);
        await disableImages(PAGE);
        // await PAGE.goto(URL, {waitUntil: 'networkidle2'});
        console.timeEnd('browser launch');
        resolve();
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


/**
 * Main scraping function driver. Contains a promise chain to scrape and save metadata
 * @returns {Promise<[]|Promise<any>>} Promise resolves an array containing the scraped data
 */
let getMetadata = async(competitionName) => {

    console.log("Getting metadata");
    return new Promise((resolve, reject) => {
        //set up scraping page and sequentially scrape all 15 stats
        pageSetup(PAGE, true, competitionName)
            .then(() =>
                scrapingLoop(PAGE, competitionName)
            )
            .then((metadata) => {
                resolve(metadata)
            })
            .catch(async (anError) => {
                console.log(anError);
            });

    });

};


//function to set up page used for scraping
/**
 * Sets up the page before scraping begins
 * @param {*} page - The page where the scraping will take place
 * @param {boolean} isFirstIteration - Boolean to track what type of setup is required.
 *                                     True when the function is being called for the first time on a page
 *                                     False otherwise
 * @param {string} competitionName - The name of the competition that we're scraping data for
 * @returns {Promise<*|boolean>}
 */
let pageSetup = async (page, isFirstIteration, competitionName) => {

    return new Promise(async function(resolve, reject) {

        //if this is the first iteration of the scraping loop
        if (isFirstIteration) {

            //navigate to the detailed tab
            let selector = 'a[href="#stage-top-player-stats-detailed"]';

            await page.waitForSelector(selector);
            await page.evaluate((selector) => document.querySelector(selector).click(), selector);
            await page.waitForSelector('#player-table-statistics-body');

            //if it's not a European competition, set the minimum number of appearances to 4 (more than 3)
            if (competitionName !== "Champions League" && competitionName !== "Europa League"){
                await page.select('#appearancesComparisonType', '2');
                await page.focus('#appearances');
                await page.keyboard.press('Backspace');
                await page.keyboard.type('3');
            }

            // select 'total' from 'accumulation' drop-down
            await page.select('#statsAccumulationType', '2');
            await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');

            await page.waitFor(3000);
            resolve(page);

        }
        //if this is NOT the first iteration of the scraping loop
        else {
            //click the 'next' button to display the next 10 players
            let selector = "#statistics-paging-detailed #next";
            await page.evaluate((selector) => document.querySelector(selector).click(), selector);
            await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');
            //resolve a boolean indicating whether or not there is another page available
            resolve(await page.evaluate(() => {return document.querySelector("#statistics-paging-detailed #next").className !== "option  disabled "}))
        }

    });

};


/**
 * Loops through all pages of the table and scrapes them
 * @param {*} page - The puppeteer page where the scraping is taking place
 * @param {string} competitionName - The name of the competition being scraped
 * @returns {Promise<*>} - Resolves a custom object containing the scraped data
 */
let scrapingLoop = async (page, competitionName) => {

    //refresh the page (For long scraping jobs, the page seems to get stuck after a while if it is not periodically refreshed)
    await page.reload({ waitUntil: ["networkidle2"] });

    //attach the initializePlayer function to the page window after the refresh
    await page.evaluate((competitionName, SEASON) => {
        window.initializePlayer = function(data, td) {
            let url = td.innerHTML.substring(td.innerHTML.indexOf('href="')+6, td.innerHTML.indexOf('">', 0));
            url = url.replace("/Players/", "");
            let playerCode = url.substring(0, url.indexOf("/"));
            let currentClub = td.innerHTML.substring(td.innerHTML.indexOf('"team-name">')+12, td.innerHTML.indexOf(', </span', 0)).replace(".", "'");
            let currentCompetition = `${competitionName} | ${currentClub}`;
            playerCode = playerCode + "|" + currentClub;
            data[playerCode] = {};
            return [playerCode, currentCompetition]
        }
    }, competitionName, SEASON);

    await pageSetup(page, true, competitionName);

    let rawMetadata = {};
    return new Promise(async function(resolve, reject){
        let hasNextPage = true;
        (async function loop() {
            //loop while the table has a next page and store the results in rawStats
            while (hasNextPage){
                hasNextPage = await new Promise( (resolve, reject) =>
                    scrapeMetadata(page)
                        .then(async (result) => (rawMetadata = combineResults(rawMetadata, result)))
                        .then(async () =>
                            resolve(await pageSetup(page, false, competitionName))
                        )
                        .catch(async (anError) => {
                            reject(anError);
                        })
                );
            }
            //scrape the last page
            scrapeMetadata(page)
                .then(async (result) =>
                    rawMetadata = combineResults(rawMetadata, result)
                )
                .then(async() => {
                    console.log("Scraped metadata for: " + Object.keys(rawMetadata).length + " players");
                    resolve(rawMetadata);
                })
        })();
    });

};


/**
 * Scrapes player metadata
 * @param {*} page - The puppeteer page
 * @return {Promise<*>} - Custom object containing the scraped assists stats
 */
let scrapeMetadata = async (page) => {

    return await page.evaluate((SEASON) => {
        let data = {};
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td')); //get all table cells
        let aPlayer = '';
        let aCompetition = '';
        for (let i = 0; i < tds.length; i++) { //iterate through all of them at process
            if (tds[i].className === 'pn') {
                let metadata = initializePlayer(data, tds[i]);
                aPlayer = metadata[0];
                aCompetition = metadata[1];
                let aPlayerName = tds[i].innerHTML.substring(tds[i].innerHTML.indexOf('">')+2, tds[i].innerHTML.indexOf(' </a>', 0));
                let aPlayerClub = tds[i].innerHTML.substring(tds[i].innerHTML.indexOf('team-name">')+11, tds[i].innerHTML.indexOf(', </span>', 0)).replace(".", "'");
                let temp = tds[i].innerHTML.indexOf('player-meta-data">');
                let temp2 = tds[i].innerHTML.indexOf('player-meta-data">', temp+18);
                let temp3 = tds[i].innerHTML.indexOf('</span>', tds[i].innerHTML.indexOf('</span>')+7);
                let temp4 = tds[i].innerHTML.indexOf('</span>', temp3+7);
                let age = tds[i].innerHTML.substring(tds[i].innerHTML.indexOf('player-meta-data">', temp+18)+18, temp3);
                let positionString = tds[i].innerHTML.substring(tds[i].innerHTML.indexOf('player-meta-data">', temp2+18)+19, temp4).trim();
                let flagtd = tds[i - 1];
                let countryCode = flagtd.innerHTML.substring(flagtd.innerHTML.indexOf('flg-')+4, flagtd.innerHTML.indexOf('"></span>'));
                let apps = parseInt(tds[i+1].innerText, 10);
                let mins = parseInt(tds[i+2].innerText, 10);
                data[aPlayer]['name'] = aPlayerName;
                data[aPlayer]['age'] = parseInt(age, 10);
                data[aPlayer]['countryCode'] = countryCode;
                data[aPlayer]['position'] = positionString;
                data[aPlayer]['club'] = aPlayerClub;
                data[aPlayer][SEASON]  = {};
                data[aPlayer][SEASON][aCompetition] = {};
                data[aPlayer][SEASON][aCompetition]['whoscoredApps'] = apps;
                data[aPlayer][SEASON][aCompetition]['whoscoredMins'] = mins;
            }
        }
        return data;
    }, SEASON);

};


/**
 * Combines data scraped from a table page to the existing data already scraped
 * @param {*} original - Custom object containing the data from previous table pages
 * @param {*} addition - Custom object containing the data from a new table page
 * @return {*} result - Custom object containing the two parameters concatenated
 */
let combineResults = (original, addition) => {
    let result = {};
    if (addition !== undefined && Array.isArray(addition[0])){
        if (original.length === 0){
            result = addition;
        }
        else {
            result[0] = original[0].concat(addition[0]);
            result[1] = original[1].concat(addition[1]);
        }
    }
    else {
        result = Object.assign({}, original, addition);
    }
    return result;
};


/**
 * Saves rawData to a local file. This is done so scraping can be continued in the event of an unexpected interrupt
 * @param {array} rawData - The raw data that has been scraped
 * @returns {Promise<*>} - Resolves when the asynchronous file writing function resolves
 */
let saveRawData = async() => {

    return new Promise(async function(resolve, reject) {
        await fs.writeFile(path.join(__dirname, `playerData/raw_${SEASON}.json`), JSON.stringify(metadataArray, null, '\t'), function(err) {
            if (err) {
                console.log(err);
                reject();
            }
            resolve();
        });
    });
};


let processRawData = async () => {

    let rawMetadata = JSON.parse(fs.readFileSync(path.join(__dirname, `/playerData/raw_${SEASON}.json`)));
    let processedMetadata;
    if (SEASON === "18-19"){
        processedMetadata = {};
    }
    else {
        processedMetadata = JSON.parse(fs.readFileSync(path.join(__dirname, `/playerData/metadata.json`)));
    }

    //loop to rawMetatdata.length - 2 because the last 2 element contain CL and EL data
    //and we don't want to create new entries for CL/EL players if they are not in the top 5 leagues
    for (let i=0; i<rawMetadata.length-2; i++){

        let aCompetiton = rawMetadata[i];

        for (let player in aCompetiton){
            let code = player.substring(0, player.indexOf("|"));
            if (processedMetadata[code] === undefined){
                processedMetadata[code] = {"mapped": false};
            }
        }

    }

    //loop through all rawData this time and fill player's objects in processedData
    for (let i = 0; i < rawMetadata.length; i++) {
        for (let player in rawMetadata[i]) { //for every player in a rawData object
            let processedPlayer = player.substring(0, player.indexOf("|"));
            if (processedMetadata[processedPlayer] !== undefined){
                for (let entry in rawMetadata[i][player]){ //for every entry in that object
                    if (entry === "age"){
                        processedMetadata[processedPlayer][entry] = rawMetadata[i][player][entry];
                    }
                    else if (entry === "position"){
                        if (processedMetadata[processedPlayer]['positions'] === undefined){
                            processedMetadata[processedPlayer]['positions'] = {};
                        }
                        processedMetadata[processedPlayer]["positions"][SEASON] = processPlayerPosition(rawMetadata[i][player][entry], processedPlayer);
                    }
                    if (entry === "club"){
                        if (processedMetadata[processedPlayer]['clubs'] === undefined){
                            processedMetadata[processedPlayer]['clubs'] = {};
                        }
                        let playerClub = rawMetadata[i][player]['club'];
                        if (processedMetadata[processedPlayer]['clubs'][SEASON] === undefined){
                            if (i < rawMetadata.length-2){ //if the entry is not for CL/EL
                                processedMetadata[processedPlayer]['clubs'][SEASON] = [playerClub]
                            }
                        }
                        else {
                            if (!processedMetadata[processedPlayer]['clubs'][SEASON].includes(playerClub)){
                                processedMetadata[processedPlayer]['clubs'][SEASON].push(playerClub);
                            }
                        }
                    }
                    if (processedMetadata[processedPlayer][entry] === undefined){
                        // initialize the player's stats for said entry in processedData
                        if (entry === 'countryCode'){
                            if (processedMetadata[processedPlayer]['nationality'] === undefined){
                                processedMetadata[processedPlayer]['nationality'] = countryCodes.getCountryName(rawMetadata[i][player][entry].toUpperCase());
                            }
                            if (processedMetadata[processedPlayer]['countryCode'] === undefined){
                                processedMetadata[processedPlayer]['countryCode'] = cleanCountryCode(rawMetadata[i][player][entry]);
                            }
                        }
                        else if (entry === 'name'){
                            processedMetadata[processedPlayer]['name'] = rawMetadata[i][player]['name'];
                            processedMetadata[processedPlayer]['simplifiedName'] = processedMetadata[processedPlayer]['name']
                                                                                    .normalize("NFD")
                                                                                    .replace(/[\u0300-\u036f]/g, "")
                                                                                    .replace("Ø", "O")
                                                                                    .replace("ø", "o");
                        }
                        else if (typeof rawMetadata[i][player][entry] === 'object'){
                            let competition = Object.keys(rawMetadata[i][player][entry])[0];
                            competition = competition.split(" | ")[0];
                            if (competition !== "Champions League" && competition !== "Europa League"){
                                processedMetadata[processedPlayer][entry] = rawMetadata[i][player][entry];
                            }
                        }
                    }
                    else {
                        // if the entry is an object, it represents stats. therefore, combine the existing stats
                        // with the new stats
                        if (typeof rawMetadata[i][player][entry] === 'object'){
                            Object.assign(processedMetadata[processedPlayer][entry], rawMetadata[i][player][entry]);
                        }
                    }
                }
            }
        }
    }

    return new Promise(async function (resolve, reject) {
        //save processedData to a file
        await fs.writeFile(path.join(__dirname, `playerData/metadata.json`), JSON.stringify(processedMetadata, null, '\t'), function(err) {
            if (err) {
                console.log(err);
                reject();
            }
            resolve();
        });
    });

};


let processPlayerPosition = (aString, code) => {
    if (FWPlayers.includes(code)){
        return "FW"
    }
    else if (AMPlayers.includes(code)){
        return "AM"
    }
    else if (CMPlayers.includes(code)){
        return "CM"
    }
    else if (FBPlayers.includes(code)){
        return "FB"
    }
    else if (CBPlayers.includes(code)){
        return "CB"
    }
    else if (GKPlayers.includes(code) || aString === "GK" || aString === "Goalkeeper"){
        return "GK"
    }
    else {
        return "N/A"
    }
};


let cleanCountryCode = (code) => {
    let codeUpperCase = code.toUpperCase();
    if (codeUpperCase === "GB-ENG" || codeUpperCase === "ENG") {
        code = "_england"
    }
    else if (codeUpperCase === "GB-SCT" || codeUpperCase === "SCO") {
        code = "_scotland"
    }
    else if (codeUpperCase === "GB-WLS" || codeUpperCase === "WAL") {
        code = "_wales"
    }
    else if (codeUpperCase === "GB-NIR" || codeUpperCase === "NIR") {
        code = "_unknown"
    }
    else if (codeUpperCase === "XK") {
        code = "_kosovo"
    }
    return code;
};


console.time('metadata retrieval');
setup()
    .then(async() => {
        return new Promise(function (resolve, reject) {
            if (ONLY_PROCESS){
                resolve();
            }
            else{
                (async function loop() { //special syntax to call asynchronous function in a loop
                    for (let i=0; i<URLs.length; i++){
                        await new Promise(function (resolve, reject) {
                            PAGE.goto(URLs[i], {waitUntil: 'networkidle2'})
                                .then(() =>
                                    getMetadata(COMPETITION_NAMES[i])
                                )
                                .then( async (metadata) => {
                                    metadataArray[i] = metadata;
                                    await saveRawData();
                                    resolve();
                                })
                        });
                    }
                    resolve();
                })();
            }
        })
    })
    .then(() =>
        processRawData()
    )
    .then(() => {
        console.timeEnd('metadata retrieval');
        process.exit(0);
    })
    .catch(async (anError) => {
        console.log(anError);
        process.exit(-1);
    });
