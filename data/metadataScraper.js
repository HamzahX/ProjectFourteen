//initialize constants
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const countryCodes = require('./countryCodes.js');

const scriptName = path.basename(__filename);
const supportedSeasons = ["18-19", "19-20", "20-21"];
const booleans = ["true", "false"];

var SEASON;
var ONLY_PROCESS;
//parse command line arguments to get the season
let ARGS = process.argv.slice(2);
if (ARGS.length !== 2){
    console.log(`Incorrect number of args. Usage: node ${scriptName} <season> <only_process_flag>`);
    process.exit(-1);
}
else {
    if (!supportedSeasons.includes(ARGS[0]) || !booleans.includes(ARGS[1])){
        console.log("Incorrect season arg. Supported seasons are supportedSeason");
        process.exit(-1);
    }
    else {
        SEASON = ARGS[0];
        ONLY_PROCESS = ARGS[1] === "true";
    }
}

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
else if (SEASON === "19-20"){
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
else if (SEASON === "20-21"){
    URLs = [
        "https://www.whoscored.com/Regions/252/Tournaments/2/Seasons/8228/Stages/18685/PlayerStatistics/England-Premier-League-2020-2021",
        "https://www.whoscored.com/Regions/206/Tournaments/4/Seasons/8321/Stages/18851/PlayerStatistics/Spain-LaLiga-2020-2021",
        "https://www.whoscored.com/Regions/108/Tournaments/5/Seasons/8330/Stages/18873/PlayerStatistics/Italy-Serie-A-2020-2021",
        "https://www.whoscored.com/Regions/81/Tournaments/3/Seasons/8279/Stages/18762/PlayerStatistics/Germany-Bundesliga-2020-2021",
        "https://www.whoscored.com/Regions/74/Tournaments/22/Seasons/8185/Stages/18594/PlayerStatistics/France-Ligue-1-2020-2021",
        "https://www.whoscored.com/Regions/250/Tournaments/12/Seasons/8177/Stages/19009/PlayerStatistics/Europe-Champions-League-2020-2021",
        "https://www.whoscored.com/Regions/250/Tournaments/30/Seasons/8178/Stages/19010/PlayerStatistics/Europe-Europa-League-2020-2021"
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

var WHOSCORED_TO_FBREF_PLAYERS = JSON.parse(fs.readFileSync(path.join(__dirname, '/playerMappingData/whoscoredToFbref.json')));

//load position data; the list of players who play in each position
let FWPlayers = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/FWPercentilePlayers.json`)))['codes'];
let AMPlayers = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/AMPercentilePlayers.json`)))['codes'];
let CMPlayers = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/CMPercentilePlayers.json`)))['codes'];
let FBPlayers = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/FBPercentilePlayers.json`)))['codes'];
let CBPlayers = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/CBPercentilePlayers.json`)))['codes'];
let GKPlayers = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/GKPercentilePlayers.json`)))['codes'];

let APPS_PER_POSITION = {
    "18-19": {},
    "19-20": {},
    "20-21": {},
};

for (let i=0; i<supportedSeasons.length; i++){

    let season = supportedSeasons[i];
    APPS_PER_POSITION[season] = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${season}/appsPerPosition.json`)));

}

let PROCESSED_METADATA;

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
            // if (competitionName !== "Champions League" && competitionName !== "Europa League"){
            //     await page.select('#appearancesComparisonType', '2');
            //     await page.focus('#appearances');
            //     await page.keyboard.press('Backspace');
            //     await page.keyboard.type('3');
            // }

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
    await page.evaluate((competitionName) => {

        window.initializePlayer = function(data, playerLink, club) {
            let url = playerLink.getAttribute("href");
            url = url.replace("/Players/", "");
            let playerCode = url.substring(0, url.indexOf("/"));

            let clubName = club.textContent;
            clubName = clubName
                .substring(0, clubName.indexOf(","))
                .replace(".", "'");
            let competitionAndClub = `${competitionName} | ${clubName}`;

            playerCode = playerCode + "|" + clubName;
            data[playerCode] = {};

            return [playerCode, competitionAndClub]
        }

    }, competitionName, SEASON);

    await pageSetup(page, true, competitionName);

    let rawMetadata = {};
    return new Promise(async function(resolve, reject){
        let hasNextPage = true;
        (async function loop() {
            //loop while the table has a next page and store the results in averageStats
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

    return await page.evaluate((SEASON, WHOSCORED_TO_FBREF_PLAYERS) => {

        let data = {};

        const playerLinks = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr .grid-ghost-cell .player-link')); //get player links
        const names = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr .grid-ghost-cell .iconize-icon-left')); //get names
        const flags = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr .grid-ghost-cell .iconize-icon-left .ui-icon')); //get flags
        const clubs = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr .grid-ghost-cell .team-name')); //get clubs
        const ages = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td > span span:nth-child(1)')); //get ages
        const positions = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td > span span:nth-child(2)')); //get positions
        const startsMade = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td:nth-child(3)')); //get starts
        const minutesPlayed = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td:nth-child(4)')); //get minutes

        let aPlayer = '';
        let aCompetition = '';

        for (let i = 0; i < playerLinks.length; i++) { //iterate through HTML and process

            let playerLink = playerLinks[i];
            let name = names[i];
            let flag = flags[i];
            let club = clubs[i];
            let age = ages[i];
            let position = positions[i];
            let starts = startsMade[i];
            let minutes = minutesPlayed[i];

            let metadata = initializePlayer(data, playerLink, club);
            aPlayer = metadata[0];
            aCompetition = metadata[1];

            let playerName = name.textContent.substring(0, name.textContent.length - 1);
            let playerClub = club.textContent
                .substring(0, club.textContent.indexOf(","))
                .replace(".", "'");
            let playerAge = age.innerText;
            let playerPositionString = position.innerText.replace(", ", "");
            let playerCountryCode = flag.className.replace("ui-icon country flg-", "");
            let apps = parseInt(starts.innerText);
            let mins = parseInt(minutes.innerText);

            //when scraping for a league season, a player is only included if they've made 4+ apps or if they are
            //already in the database
            if (!aCompetition.startsWith("Champions League") && !aCompetition.startsWith("Europa League")){
                if (apps < 4 && WHOSCORED_TO_FBREF_PLAYERS[aPlayer.split("|")[0]] === undefined){
                    delete data[aPlayer];
                    continue;
                }
            }

            data[aPlayer]['name'] = playerName;
            data[aPlayer]['age'] = parseInt(playerAge, 10);
            data[aPlayer]['countryCode'] = playerCountryCode;
            data[aPlayer]['position'] = playerPositionString;
            data[aPlayer]['club'] = playerClub;
            data[aPlayer][SEASON]  = {};
            data[aPlayer][SEASON][aCompetition] = {};
            data[aPlayer][SEASON][aCompetition]['whoscoredApps'] = apps;
            data[aPlayer][SEASON][aCompetition]['whoscoredMins'] = mins;
        }
        return data;
    }, SEASON, WHOSCORED_TO_FBREF_PLAYERS);

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

    if (SEASON === supportedSeasons[0]){
        PROCESSED_METADATA = {};
    }
    else {
        PROCESSED_METADATA = JSON.parse(fs.readFileSync(path.join(__dirname, `/playerData/metadata.json`)));
    }

    let leagueCodes = {
        "Premier League": "_england",
        "La Liga": "es",
        "Serie A": "it",
        "Bundesliga": "de",
        "Ligue 1": "fr"
    };

    //loop to rawMetatdata.length - 2 because the last 2 element contain CL and EL data
    //and we don't want to create new entries for CL/EL players if they are not in the top 5 leagues
    for (let i=0; i<rawMetadata.length-2; i++){

        let aCompetiton = rawMetadata[i];

        for (let player in aCompetiton){
            let code = player.substring(0, player.indexOf("|"));
            if (PROCESSED_METADATA[code] === undefined){
                PROCESSED_METADATA[code] = {"mapped": false};
            }
        }

    }

    //loop through all rawData this time and fill player's objects in processedData
    for (let i = 0; i < rawMetadata.length; i++) {

        for (let player in rawMetadata[i]) { //for every player in a rawData object

            let processedPlayer = player.substring(0, player.indexOf("|"));

            if (PROCESSED_METADATA[processedPlayer] !== undefined){

                for (let entry in rawMetadata[i][player]){ //for every entry in that object
                    if (entry === "age"){
                        PROCESSED_METADATA[processedPlayer][entry] = rawMetadata[i][player][entry];
                    }
                    else if (entry === "position"){

                        if (PROCESSED_METADATA[processedPlayer]['positions'] === undefined){
                            PROCESSED_METADATA[processedPlayer]['positions'] = {};
                        }
                        if (i < rawMetadata.length-2){ //if the entry is not for CL/EL
                            PROCESSED_METADATA[processedPlayer]["positions"][SEASON] = processPlayerPosition(rawMetadata[i][player][entry], processedPlayer);
                        }
                    }
                    if (entry === "club"){

                        let playerClub = rawMetadata[i][player]['club'];

                        if (PROCESSED_METADATA[processedPlayer]['clubs'] === undefined){
                            PROCESSED_METADATA[processedPlayer]['clubs'] = {};
                        }
                        if (PROCESSED_METADATA[processedPlayer]['clubs'][SEASON] === undefined){
                            if (i < rawMetadata.length-2){ //if the entry is not for CL/EL
                                PROCESSED_METADATA[processedPlayer]['clubs'][SEASON] = [playerClub]
                            }
                        }
                        else {
                            if (!PROCESSED_METADATA[processedPlayer]['clubs'][SEASON].includes(playerClub)){
                                PROCESSED_METADATA[processedPlayer]['clubs'][SEASON].push(playerClub);
                            }
                        }

                        let playerLeague = Object.keys(rawMetadata[i][player][SEASON])[0].split(" | ")[0];

                        if (playerLeague !== "Champions League" && playerLeague !== "Europa League"){
                            if (PROCESSED_METADATA[processedPlayer]['leagues'] === undefined){
                                PROCESSED_METADATA[processedPlayer]['leagues'] = {};
                            }
                            if (PROCESSED_METADATA[processedPlayer]["leagues"][SEASON] === undefined){
                                PROCESSED_METADATA[processedPlayer]["leagues"][SEASON] = [leagueCodes[playerLeague]];
                            }
                            else {
                                if (!PROCESSED_METADATA[processedPlayer]["leagues"][SEASON].includes(leagueCodes[playerLeague])){
                                    PROCESSED_METADATA[processedPlayer]["leagues"][SEASON].push(leagueCodes[playerLeague])
                                }
                            }
                        }

                    }
                    if (PROCESSED_METADATA[processedPlayer][entry] === undefined){
                        // initialize the player's stats for said entry in processedData
                        if (entry === 'countryCode'){
                            if (PROCESSED_METADATA[processedPlayer]['nationality'] === undefined){
                                PROCESSED_METADATA[processedPlayer]['nationality'] = countryCodes.getCountryName(rawMetadata[i][player][entry].toUpperCase());
                            }
                            if (PROCESSED_METADATA[processedPlayer]['countryCode'] === undefined){
                                PROCESSED_METADATA[processedPlayer]['countryCode'] = countryCodes.cleanCountryCode(rawMetadata[i][player][entry]);
                            }
                        }
                        else if (entry === 'name'){
                            PROCESSED_METADATA[processedPlayer]['name'] = rawMetadata[i][player]['name'];
                            PROCESSED_METADATA[processedPlayer]['simplifiedName'] = PROCESSED_METADATA[processedPlayer]['name']
                                                                                    .normalize("NFD")
                                                                                    .replace(/[\u0300-\u036f]/g, "")
                                                                                    .replace("Ø", "O")
                                                                                    .replace("ø", "o");
                        }
                        else if (typeof rawMetadata[i][player][entry] === 'object'){
                            let competition = Object.keys(rawMetadata[i][player][entry])[0];
                            competition = competition.split(" | ")[0];
                            if (competition !== "Champions League" && competition !== "Europa League"){
                                PROCESSED_METADATA[processedPlayer][entry] = rawMetadata[i][player][entry];
                            }
                        }
                    }
                    else {
                        // if the entry is an object, it represents stats. therefore, combine the existing stats
                        // with the new stats
                        if (typeof rawMetadata[i][player][entry] === 'object'){
                            Object.assign(PROCESSED_METADATA[processedPlayer][entry], rawMetadata[i][player][entry]);
                        }
                    }

                }

            }

        }
    }

    return new Promise(async function (resolve, reject) {
        //save processedData to a file
        await fs.writeFile(path.join(__dirname, `playerData/metadata.json`), JSON.stringify(PROCESSED_METADATA, null, '\t'), function(err) {
            if (err) {
                console.log(err);
                reject();
            }
            resolve();
        });
    });

};


let processPlayerPosition = (positionString, code) => {

    let positions = [];

    if (FWPlayers.includes(code)){
        positions.push("FW");
    }

    if (AMPlayers.includes(code)){
        positions.push("AM");
    }

    if (CMPlayers.includes(code)){
        positions.push("CM");
    }

    if (FBPlayers.includes(code)){
        positions.push("FB");
    }

    if (CBPlayers.includes(code)){
        positions.push("CB");
    }

    if (GKPlayers.includes(code) || positionString === "GK" || positionString === "Goalkeeper"){
        positions.push("GK");
    }

    let latestKnownPosition = null;

    for (let season in PROCESSED_METADATA[code]["positions"]){

        if (PROCESSED_METADATA[code]["positions"][season][0] !== undefined && PROCESSED_METADATA[code]["positions"][season][0] !== "N/A"){
            latestKnownPosition = PROCESSED_METADATA[code]["positions"][season][0];
        }

        if (season === SEASON){
            break;
        }

    }

    if (APPS_PER_POSITION[SEASON][code] !== undefined){

        let max = 0;

        //set their position(s) to the position they've made the most starts in for the current season
        for (let position in APPS_PER_POSITION[SEASON][code]){

            //minimum of 3 to register
            if (APPS_PER_POSITION[SEASON][code][position] < 3 && latestKnownPosition !== null){
                continue;
            }

            if (Math.abs(APPS_PER_POSITION[SEASON][code][position] - max) <= 2){
                positions.push(position);
            }
            else if (APPS_PER_POSITION[SEASON][code][position] > max){
                positions = [position];
            }

            if (APPS_PER_POSITION[SEASON][code][position] > max){
                max = APPS_PER_POSITION[SEASON][code][position];
            }

        }

    }

    if (positions.length === 0){

        if (latestKnownPosition === null){

            if (positionString.startsWith("Forward") || positionString.startsWith("FW"))
                positions.push("FW");

            else if (positionString.startsWith("AM") || positionString.startsWith("M(L") || positionString.startsWith("M(R") || (positionString.startsWith("M(C") && positionString.includes("FW")))
                positions.push("AM");

            else if (positionString.startsWith("Midfielder") || positionString.startsWith("M(C") || positionString.startsWith("DMC"))
                positions.push("CM");

            else if (positionString.startsWith("D(R") || positionString.startsWith("D(L"))
                positions.push("FB");

            else if (positionString.startsWith("Defender") || positionString.startsWith("D(C"))
                positions.push("CB");

            else{
                console.log("Unhandled position string: " + positionString);
                positions.push("N/A");
            }

        }
        else {
            positions.push(latestKnownPosition)
        }
    }

    return [...new Set(positions)];

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
