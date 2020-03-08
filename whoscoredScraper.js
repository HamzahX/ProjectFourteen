//initialize constants
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const mongoClient = require('mongodb').MongoClient;
const mongoURI = "mongodb+srv://hamzah:containers@cluster0-wz8lb.mongodb.net/test?retryWrites=true&w=majority";

//globals
let BROWSER;
let PAGE;
let URL;
let COMPETITIONFULL;

//process command-line arguments
let args = process.argv.slice(2);
var COMPETITION; //the competition data to scrape
var ADDNEW; //boolean to track if players not already in the database should be added

//sanitize arguments
if (args.length !== 2){
    console.log("Incorrect number of args");
    process.exit(-1);
}
else if (args[0] !== "leagues" && args[0] !== "cl" && args[0] !== "el" && args[0] !== "db" && args[1] !== "true" && args[1] !== "false") {
    console.log("Incorrect competition flags");
    process.exit(-1);
}
else {
    COMPETITION = args[0];
    if (COMPETITION === "cl"){
        COMPETITIONFULL = "Champions League";
    }
    else if (COMPETITION === "el"){
        COMPETITIONFULL = "Europa League";
    }
    else {
        COMPETITIONFULL = "League";
    }
    ADDNEW = args[1] === "true";
    console.log(COMPETITION);
    console.log("Add new?: " + ADDNEW);
}

/**
 * Launches a browser window using puppeteer and navigates to the appropriate URL based on the command line arguments
 * @returns {Promise<*>} Promise resolves when the browser has been successfully launched
 */
let setup = async () => {
    return new Promise(async function(resolve, reject){

        if (COMPETITION !== "db"){
            console.time('browser launch');

            //headless = false; whoscored.com blocks headless requests
            BROWSER = await puppeteer.launch({
                headless: false,
                args: ["--no-sandbox", "--disable-setuid-sandbox"]
            });
            PAGE = await BROWSER.newPage();
            await PAGE.setDefaultNavigationTimeout(0);
            await disableImages(PAGE);

            //load URL based on competition argument
            if (COMPETITION === "leagues"){
                URL = "https://www.whoscored.com/Statistics";
            }
            else if (COMPETITION === "epl"){
                URL = "https://www.whoscored.com/Regions/252/Tournaments/2/Seasons/7811/Stages/17590/PlayerStatistics/England-Premier-League-2019-2020";
            }
            else if (COMPETITION === "ll"){
                URL = "https://www.whoscored.com/Regions/206/Tournaments/4/Seasons/7889/Stages/17702/PlayerStatistics/Spain-LaLiga-2019-2020";
            }
            else if (COMPETITION === "sa"){
                URL = "https://www.whoscored.com/Regions/108/Tournaments/5/Seasons/7928/Stages/17835/PlayerStatistics/Italy-Serie-A-2019-2020";
            }
            else if (COMPETITION === "bl"){
                URL = "https://www.whoscored.com/Regions/81/Tournaments/3/Seasons/7872/Stages/17682/PlayerStatistics/Germany-Bundesliga-2019-2020";
            }
            else if (COMPETITION === "l1"){
                URL = "https://www.whoscored.com/Regions/74/Tournaments/22/Seasons/7814/Stages/17593/PlayerStatistics/France-Ligue-1-2019-2020";
            }
            else if (COMPETITION === "cl"){
                // URL = "https://www.whoscored.com/Regions/250/Tournaments/12/Seasons/7804/Stages/17993/PlayerStatistics/Europe-Champions-League-2019-2020";
                URL = "https://www.whoscored.com/Regions/250/Tournaments/12/Seasons/7804/Stages/18065/PlayerStatistics/Europe-Champions-League-2019-2020";
            }
            else {
                // URL = "https://www.whoscored.com/Regions/250/Tournaments/30/Seasons/7805/Stages/17994/PlayerStatistics/Europe-Europa-League-2019-2020";
                URL = "https://www.whoscored.com/Regions/250/Tournaments/30/Seasons/7805/Stages/18066/PlayerStatistics/Europe-Europa-League-2019-2020";
            }
            await PAGE.goto(URL, {waitUntil: 'networkidle2'});
            console.timeEnd('browser launch');
            resolve();
        }
        else {
            resolve();
        }
    });
};

/**
 * Main scraping function driver. Contains a promise chain to scrape all 15 stats sequentially
 * @returns {Promise<[]|Promise<any>>} Promise resolves an array containing the scraped data
 */
let getStats = async() => {

    if (COMPETITION !== "db") {
        console.log("Getting stats");
        return new Promise((resolve, reject) => {
            //initialize rawData array
            //holds 15 objects, one for each stat
            let rawData;
            rawData = [];
            //set up scraping page and sequentially scrape all 15 stats
            pageSetup(PAGE, true)
                .then(() =>
                    scrapingLoop(PAGE, "assists")
                )
                .then((assists) =>
                    (rawData.push(assists), saveRawData(rawData),
                        scrapingLoop(PAGE, "goals"))
                )
                .then((goals) =>
                    (rawData.push(goals), saveRawData(rawData),
                        scrapingLoop(PAGE, "passes"))
                )
                .then((passes) =>
                    (rawData.push(passes), saveRawData(rawData),
                        scrapingLoop(PAGE, "shots"))
                )
                .then((shots) =>
                    (rawData.push(shots), saveRawData(rawData),
                        scrapingLoop(PAGE, "keyPasses"))
                )
                .then((keyPasses) =>
                    (rawData.push(keyPasses), saveRawData(rawData),
                        scrapingLoop(PAGE, "shotsOnTarget"))
                )
                .then((shotsOnTarget) =>
                    (rawData.push(shotsOnTarget), saveRawData(rawData),
                        scrapingLoop(PAGE, "fouls"))
                )
                .then((fouls) =>
                    (rawData.push(fouls), saveRawData(rawData),
                        scrapingLoop(PAGE, "tackles"))
                )
                .then((tackles) =>
                    (rawData.push(tackles), saveRawData(rawData),
                        scrapingLoop(PAGE, "interceptions"))
                )
                .then((interceptions) =>
                    (rawData.push(interceptions), saveRawData(rawData),
                        scrapingLoop(PAGE, "possessionLosses"))
                )
                .then((possessionLosses) =>
                    (rawData.push(possessionLosses), saveRawData(rawData),
                        scrapingLoop(PAGE, "dribbles"))
                )
                .then((dribbles) =>
                    (rawData.push(dribbles), saveRawData(rawData),
                        scrapingLoop(PAGE, "clearances"))
                )
                .then((clearances) =>
                    (rawData.push(clearances), saveRawData(rawData),
                        scrapingLoop(PAGE, "aerialDuels"))
                )
                .then((aerialDuels) =>
                    (rawData.push(aerialDuels), saveRawData(rawData),
                        scrapingLoop(PAGE, "crosses"))
                )
                .then((crosses) =>
                    (rawData.push(crosses), saveRawData(rawData),
                        scrapingLoop(PAGE, "blocks"))
                )
                .then((blocks) =>
                    (rawData.push(blocks),
                        saveRawData(rawData))
                )
                .then(() => {
                    resolve(rawData)
                })
                .catch(async (anError) => {
                    console.log(anError);
                });

        });
    }
    else {
        return new Promise((resolve, reject) => {
           resolve()
        });
    }
};

/**
 * Converts raw data from 'per-stat' basis to 'per-player' basis
 * @returns {Promise<*|Promise<any>>} Resolves a custom object containing the processed data
 */
let processRawData = async () => {

    if (COMPETITION !== 'db') {

        // create an array of arrays to temporarily store combined raw data from leagues + cl + el
        // populate it by reading from local files
        let rawDataTemp = [];
        try {
            if (COMPETITION !== 'cl' && COMPETITION !== 'el'){
                rawDataTemp.push(JSON.parse(fs.readFileSync(path.join(__dirname, '/serverUtils/leagueRaw.json'))));
            }
        }
        catch (err) {

        }
        try {
            if (COMPETITION === 'cl'){
                rawDataTemp.push(JSON.parse(fs.readFileSync(path.join(__dirname, '/serverUtils/clRaw.json'))));
            }
        }
        catch (err) {

        }
        try {
            if (COMPETITION === 'el'){
                rawDataTemp.push(JSON.parse(fs.readFileSync(path.join(__dirname, '/serverUtils/elRaw.json'))));
            }
        }
        catch (err) {

        }

        // deconstruct temporary array of arrays into single array
        let rawData = [];
        for (let i=0; i<rawDataTemp.length; i++){
            for (let j=0; j<rawDataTemp[i].length; j++){
                rawData.push(rawDataTemp[i][j]);
            }
        }

        // initialize processed data object and begin to populate it using the raw data.
        // rawData is stored on per-stat basis. i.e.: each stat is a key and the value for each key is an object where the keys are players
        // processedData is stored on a per-player basis. i.e.: each player is a key and the value for each key is an object where the keys are stats
        let processedData = {};

        // loop through rawData and initialize an object in the processedData object for every player key
        for (let i=0; i<rawData.length; i+=15){ //increment by 15 because we only need the first array of each competition
            if (i === 0) {
                for (let player in rawData[i]) {
                    let processedPlayer = player.substring(0, player.indexOf("|"));
                    processedData[processedPlayer] = {};
                }
            }
            else { //else condition to pick up any players not in rawData[i]
                for (let player in rawData[i]) {
                    if (processedData[player] === undefined){
                        let processedPlayer = player.substring(0, player.indexOf("|"));
                        processedData[processedPlayer] = {};
                    }
                }
            }
        }

        // loop through all rawData this time and fill player's objects in processedData
        for (let i = 0; i < rawData.length; i++) {
            for (let player in rawData[i]) { //for every player in a rawData object
                let processedPlayer = player.substring(0, player.indexOf("|"));
                for (let entry in rawData[i][player]){ //for every entry in that object
                    if (processedData[processedPlayer][entry] === undefined){
                        // initialize the player's stats for said entry in processedData
                        if (entry === 'club'){
                            processedData[processedPlayer][entry] = [rawData[i][player][entry]]
                        }
                        else {
                            processedData[processedPlayer][entry] = rawData[i][player][entry];
                        }
                    }
                    else {
                        if (typeof rawData[i][player][entry] === 'object'){
                            // if the entry is an object, it represents stats. therefore, combine the existing stats
                            // with the new stats
                            Object.assign(processedData[processedPlayer][entry], rawData[i][player][entry]);
                        }
                        else if (entry === 'club'){
                            // if the entry is a club, push to the existing list of clubs
                            let playerClub = rawData[i][player]['club'];
                            if (!processedData[processedPlayer]['club'].includes(playerClub)){
                                processedData[processedPlayer]['club'].push(playerClub)
                            }
                        }
                    }
                }
            }
        }

        //save processedData to a file
        return new Promise(async function(resolve, reject) {
            await fs.writeFile(path.join(__dirname, '/serverUtils/processed.json'), JSON.stringify(processedData), function (err) {
                if (err) {
                    console.log(err);
                    reject();
                }
                resolve();
            });
        });
    }

    else {
        return new Promise(async function(resolve, reject) {
            resolve();
        });
    }

};

/**
 * Saves rawDara to a local file. This is done so scraping can be continued in the event of an unexpected interrupt
 * @param {array} rawData - The raw data that has been scraped
 * @returns {Promise<*>} - Resolves when the asynchronous file writing function resolves
 */
let saveRawData = async(rawData) => {

    return new Promise(async function(resolve, reject) {
        if (COMPETITION === "cl"){
            await fs.writeFile(path.join(__dirname, '/serverUtils/clRaw.json'), JSON.stringify(rawData), function(err) {
                if (err) {
                    console.log(err);
                    reject();
                }
                resolve();
            });
        }
        else if (COMPETITION === "el"){
            await fs.writeFile(path.join(__dirname, '/serverUtils/elRaw.json'), JSON.stringify(rawData), function(err) {
                if (err) {
                    console.log(err);
                    reject();
                }
                resolve();
            });
        }
        else{
            await fs.writeFile(path.join(__dirname, '/serverUtils/leagueRaw.json'), JSON.stringify(rawData), function(err) {
                if (err) {
                    console.log(err);
                    reject();
                }
                resolve();
            });
        }
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

//function to set up page used for scraping
/**
 * Sets up the page before scraping begins
 * @param {*} page - The page where the scraping will take place
 * @param {boolean} isFirstIteration - Boolean to track what type of setup is required.
 *                                     True when the function is being called for the first time on a page
 *                                     False otherwise
 * @returns {Promise<*|boolean>}
 */
let pageSetup = async (page, isFirstIteration) => {

    return new Promise(async function(resolve, reject) {

        //if this is the first iteration of the scraping loop
        if (isFirstIteration) {

            //navigate to the correct tab
            let selector;
            if (COMPETITION === "leagues"){
                // navigate to 'detailed' tab (top 5 leagues page)
                selector = 'a[href="#top-player-stats-detailed"]';
            }
            else {
                // navigate to 'detailed' tab (cl/el or individual league pages)
                selector = 'a[href="#stage-top-player-stats-detailed"]';
            }
            await page.waitForSelector(selector);
            await page.evaluate((selector) => document.querySelector(selector).click(), selector);
            await page.waitForSelector('#statistics-table-detailed');

            //set the minimum number of appearances to 4 (more than 3)
            if (COMPETITION !== "cl" && COMPETITION !== "el"){
                await page.select('#appearancesComparisonType', '2');
                await page.focus('#appearances');
                await page.keyboard.press('Backspace');
                await page.keyboard.type('3');
            }

            //unselect the goalkeeper position
            selector = '#pitch > tbody > tr:nth-child(6) > td:nth-child(1) > label > input';
            await page.evaluate((selector) => document.querySelector(selector).click(), selector);

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
 * @param {string} stat - The stat being scraped
 * @returns {Promise<*>} - Resolves a custom object containing the scraped data for the specified stat
 */
let scrapingLoop = async (page, stat) => {

    //refresh the page (For long scraping jobs, the page seems to get stuck after a while if it is not periodically refreshed)
    await page.reload({ waitUntil: ["networkidle2"] });

    // page.on('console', msg => {
    //     for (let i = 0; i < msg._args.length; ++i)
    //         console.log(`${i}: ${msg._args[i]}`);
    // });

    //attach the initializePlayer function to the page window after the refresh
    await page.evaluate((COMPETITIONFULL) => {
       window.initializePlayer = function(data, td) {
           let currentCompetitionPrefix = COMPETITIONFULL;
           let currentPlayer = td.innerHTML.substring(td.innerHTML.indexOf('href="')+6, td.innerHTML.indexOf('">', 0));
           currentPlayer = "https://www.whoscored.com" + currentPlayer.replace("Show", "History");
           let currentClub = td.innerHTML.substring(td.innerHTML.indexOf('"team-name">')+12, td.innerHTML.indexOf(', </span', 0)).replace(".", "'");
           let currentCompetition = currentCompetitionPrefix + " | " + currentClub;
           currentPlayer = currentPlayer + "|" + currentClub;
           data[currentPlayer] = {};
           data[currentPlayer][currentCompetition] = {};
           return [currentPlayer, currentCompetition]
       }
    }, COMPETITIONFULL);

    await pageSetup(page, true);

    let firstIteration = true;
    let rawStats = {};
    return new Promise(async function(resolve, reject){
        let hasNextPage = true;
        (async function loop() { //special syntax to call asynchronous function in a loop
            while (hasNextPage){ //loop while the table has a next page and store the results in rawStats
                hasNextPage = await new Promise( (resolve, reject) =>
                    scrape(page, firstIteration, stat)
                        .then(async (result) => (rawStats = combineResults(rawStats, result), firstIteration = false))
                        .then(async () =>
                            resolve(await pageSetup(page, false))
                        )
                        .catch(async (anError) => {
                            reject(anError);
                        })
                );
            }
            //scrape the last page
            scrape(page, firstIteration, stat)
                .then(async (result) =>
                    (rawStats = combineResults(rawStats, result), firstIteration = false)
                ).then(() =>
                (resolve(rawStats), console.log("Scraped " + stat + " stats: " + Object.keys(rawStats).length + " players"))
            )
        })();
    });

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
    // console.log(result);
    return result;
};

/**
 * Wrapper function to call the correct scraping function based on an argument
 * @param {*} page - The Puppeteer page where the scraping is taking place
 * @param {boolean} firstIteration - Boolean to track which iteration of scraping is needed
 * @param {string} stat - The stat whose data needs to be scraped
 * @return {Promise<*>} - The promise resolves when the correct scraping function resolves
 */
let scrape = async (page, firstIteration, stat) => {

    switch (stat) {
        case "goals":
            return await scrapeGoals(page, firstIteration);
        case "assists":
            return await scrapeAssists(page, firstIteration);
        case "passes":
            return await scrapePasses(page, firstIteration);
        case "shots":
            return await scrapeShots(page, firstIteration);
        case "keyPasses":
            return await scrapeKeyPasses(page, firstIteration);
        case "shotsOnTarget":
            return await scrapeShotsOnTarget(page, firstIteration);
        case "tackles":
            return await scrapeTackles(page, firstIteration);
        case "interceptions":
            return await scrapeInterceptions(page, firstIteration);
        case "possessionLosses":
            return await scrapePossessionLosses(page, firstIteration);
        case "dribbles":
            return await scrapeDribbles(page, firstIteration);
        case "fouls":
            return await scrapeFouls(page, firstIteration);
        case "crosses":
            return await scrapeCrosses(page, firstIteration);
        case "aerialDuels":
            return await scrapeAerialDuels(page, firstIteration);
        case "clearances":
            return await scrapeClearances(page, firstIteration);
        case "blocks":
            return await scrapeBlocks(page, firstIteration);
    }

};

/**
 * Scrapes stats for assists
 * @param {*} page - The puppeteer page
 * @param {boolean} firstIteration - Boolean to track if this is the first iteration of the scraping loop
 * @return {Promise<*>} - Custom object containing the scraped assists stats
 */
let scrapeAssists = async (page, firstIteration) => {

    if (firstIteration){
        // select 'assists' from 'category' drop-down
        await page.select('#category', 'assists');
        await page.waitForSelector('.assist   ');

        await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');
    }

    return await page.evaluate(() => {
        let assists = {};
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td')); //get all table cells
        let currentPlayer = '';
        let currentCompetition = '';
        for (let i = 0; i < tds.length; i++) { //iterate through all of them at process
            if (tds[i].className === 'pn') {
                let metadata = initializePlayer(assists, tds[i]);
                currentPlayer = metadata[0];
                currentCompetition = metadata[1];
                let currentPlayerName = tds[i].innerHTML.substring(tds[i].innerHTML.indexOf('">')+2, tds[i].innerHTML.indexOf(' </a>', 0));
                let currentPlayerClub = tds[i].innerHTML.substring(tds[i].innerHTML.indexOf('team-name">')+11, tds[i].innerHTML.indexOf(', </span>', 0)).replace(".", "'");
                let flagtd = tds[i - 1];
                let countryCode = flagtd.innerHTML.substring(flagtd.innerHTML.indexOf('flg-')+4, flagtd.innerHTML.indexOf('"></span>'));
                assists[currentPlayer]['name'] = currentPlayerName;
                assists[currentPlayer]['club'] = currentPlayerClub;
                assists[currentPlayer]['countryCode'] = countryCode;
            } else {
                if (tds[i].className === 'assist   ') {
                    if (tds[i].innerText === '-') {
                        assists[currentPlayer][currentCompetition]['assists'] = 0;
                    } else {
                        assists[currentPlayer][currentCompetition]['assists'] = parseInt(tds[i].innerText, 10);
                    }
                }
                if (tds[i].className === 'minsPlayed   ') {
                    if (tds[i].innerText === '-') {
                        assists[currentPlayer][currentCompetition]['minutes'] = 0;
                    } else {
                        assists[currentPlayer][currentCompetition]['minutes'] = parseInt(tds[i].innerText, 10);
                    }
                }
            }
        }
        return assists;
    });

};


/**
 * Scrapes stats for goals
 * @param {*} page - The puppeteer page
 * @param {boolean} firstIteration - Boolean to track if this is the first iteration of the scraping loop
 * @return {Promise<*>} - Custom object containing the scraped goals stats
 */
let scrapeGoals = async (page, firstIteration) => {

    if (firstIteration) {
        // select 'goals' from 'category' drop-down
        await page.select('#category', 'goals');
        await page.waitForSelector('.goalTotal   ');

        // select 'situations' from 'sub category' drop-down
        await page.select('#subcategory', 'situations');
        await page.waitForSelector('.goalNormal   ');

        await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');
    }

    return await page.evaluate(() => {
        let goals = {};
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td')); //get all table cells
        let currentPlayer = '';
        let currentCompetition = '';
        for (let i = 0; i < tds.length; i++) { //iterate through all of them at process
            if (tds[i].className === 'pn') {
                let metadata = initializePlayer(goals, tds[i]);
                currentPlayer = metadata[0];
                currentCompetition = metadata[1];
            } else {
                if (tds[i].className === 'goalNormal   ') {
                    if (tds[i].innerText === '-') {
                        goals[currentPlayer][currentCompetition]['goals'] = 0;
                    } else {
                        goals[currentPlayer][currentCompetition]['goals'] = parseInt(tds[i].innerText, 10);
                    }
                }
            }
        }
        return goals;
    });

};

/**
 * Scrapes stats for shots
 * @param {*} page - The puppeteer page
 * @param {boolean} firstIteration - Boolean to track if this is the first iteration of the scraping loop
 * @return {Promise<*>} - Custom object containing the scraped shots stats
 */
let scrapeShots = async (page, firstIteration) => {

    if (firstIteration) {
        // select 'shots' from 'category' drop-down
        await page.select('#category', 'shots');
        await page.waitForSelector('.shotsTotal   ');

        // select 'situations' from 'sub category' drop-down
        await page.select('#subcategory', 'situations');
        await page.waitForSelector('.shotOpenPlay   ');

        await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');
    }

    return await page.evaluate(() => {
        let shots = {};
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td')); //get all table cells
        let currentPlayer = '';
        let currentCompetition = '';
        for (let i = 0; i < tds.length; i++) { //iterate through all of them at process
            if (tds[i].className === 'pn') {
                let metadata = initializePlayer(shots, tds[i]);
                currentPlayer = metadata[0];
                currentCompetition = metadata[1];
            } else {
                if (tds[i].className === 'shotsTotal   ') {
                    if (tds[i].innerText === '-') {
                        shots[currentPlayer][currentCompetition]['shots'] = 0;
                    } else {
                        let totalShots = parseInt(tds[i].innerText, 10);
                        let penalties = tds[i + 4].innerText;
                        if (penalties === '-') {
                            penalties = '0';
                        }
                        shots[currentPlayer][currentCompetition]['shots'] = totalShots;
                        shots[currentPlayer][currentCompetition]['penaltiesTaken'] = parseInt(penalties, 10);
                    }
                }
            }
        }
        return shots;
    });

};

/**
 * Scrapes stats for shots on target
 * @param {*} page - The puppeteer page
 * @param {boolean} firstIteration - Boolean to track if this is the first iteration of the scraping loop
 * @return {Promise<*>} - Custom object containing the scraped shots on target stats
 */
let scrapeShotsOnTarget = async (page, firstIteration) => {

    if (firstIteration) {
        // select 'shots' from 'category' drop-down
        await page.select('#category', 'shots');
        await page.waitForSelector('.shotsTotal   ');

        // select 'situations' from 'sub category' drop-down
        await page.select('#subcategory', 'accuracy');
        await page.waitForSelector('.shotOnTarget   ');

        await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');
    }

    return await page.evaluate(() => {
        let shots = {};
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td')); //get all table cells
        let currentPlayer = '';
        let currentCompetition = '';
        for (let i = 0; i < tds.length; i++) { //iterate through all of them at process
            if (tds[i].className === 'pn') {
                let metadata = initializePlayer(shots, tds[i]);
                currentPlayer = metadata[0];
                currentCompetition = metadata[1];
            } else {
                if (tds[i].className === 'shotOnTarget   ') {
                    if (tds[i].innerText === '-') {
                        shots[currentPlayer][currentCompetition]['shotsOnTarget'] = 0;
                    } else {
                        let shotsOnTarget = parseInt(tds[i].innerText, 10);
                        shots[currentPlayer][currentCompetition]['shotsOnTarget'] = shotsOnTarget;
                    }
                }
            }
        }
        return shots;
    });

};

/**
 * Scrapes stats for passes
 * @param {*} page - The puppeteer page
 * @param {boolean} firstIteration - Boolean to track if this is the first iteration of the scraping loop
 * @return {Promise<*>} - Custom object containing the scraped passes stats
 */
let scrapePasses = async (page, firstIteration) => {

    if (firstIteration) {
        // select 'passes' from 'category' drop-down
        await page.select('#category', 'passes');
        await page.waitForSelector('.passTotal   ');

        await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');
    }

    return await page.evaluate(() => {
        let passes = {};
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td')); //get all table cells
        let currentPlayer = '';
        let currentCompetition = '';
        for (let i = 0; i < tds.length; i++) { //iterate through all of them at process
            if (tds[i].className === 'pn') {
                let metadata = initializePlayer(passes, tds[i]);
                currentPlayer = metadata[0];
                currentCompetition = metadata[1];
            } else {
                if (tds[i].className === 'passTotal   ') {
                    if (tds[i].innerText === '-') {
                        passes[currentPlayer][currentCompetition]['succPasses'] = 0;
                        passes[currentPlayer][currentCompetition]['totalPasses'] = 0;
                    } else {
                        let totalPasses = parseInt(tds[i].innerText, 10);
                        let accLB = tds[i + 1].innerText;
                        if (accLB === '-') {
                            accLB = '0';
                        }
                        let inAccLB = tds[i + 2].innerText;
                        if (inAccLB === '-') {
                            inAccLB = '0';
                        }
                        let accSP = tds[i + 3].innerText;
                        if (accSP === '-') {
                            accSP = '0';
                        }
                        passes[currentPlayer][currentCompetition]['succPasses'] = parseInt(accLB, 10) + parseInt(accSP, 10);
                        passes[currentPlayer][currentCompetition]['totalPasses'] = totalPasses;
                        passes[currentPlayer][currentCompetition]['succLongPasses'] = parseInt(accLB, 10);
                        passes[currentPlayer][currentCompetition]['totalLongPasses'] = parseInt(inAccLB, 10) + parseInt(accLB, 10);
                    }
                }
            }
        }
        return passes;
    });

};

/**
 * Scrapes stats for key passes
 * @param {*} page - The puppeteer page
 * @param {boolean} firstIteration - Boolean to track if this is the first iteration of the scraping loop
 * @return {Promise<*>} - Custom object containing the scraped key passes stats
 */
let scrapeKeyPasses = async (page, firstIteration) => {

    if (firstIteration) {
        // select 'key passes' from 'category' drop-down
        await page.select('#category', 'key-passes');
        await page.waitForSelector('.keyPassesTotal   ');

        await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');
    }

    return await page.evaluate(() => {
        let keyPasses = {};
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td')); //get all table cells
        let currentPlayer = '';
        let currentCompetition = '';
        for (let i = 0; i < tds.length; i++) { //iterate through all of them at process
            if (tds[i].className === 'pn') {
                let metadata = initializePlayer(keyPasses, tds[i]);
                currentPlayer = metadata[0];
                currentCompetition = metadata[1];
            } else {
                if (tds[i].className === 'keyPassesTotal   ') {
                    if (tds[i].innerText === '-') {
                        keyPasses[currentPlayer][currentCompetition]['keyPasses'] = 0;
                    } else {
                        keyPasses[currentPlayer][currentCompetition]['keyPasses'] = parseInt(tds[i].innerText, 10);
                    }
                }
            }
        }
        return keyPasses;
    });

};

/**
 * Scrapes stats for tackles
 * @param {*} page - The puppeteer page
 * @param {boolean} firstIteration - Boolean to track if this is the first iteration of the scraping loop
 * @return {Promise<*>} - Custom object containing the scraped tackles stats
 */
let scrapeTackles = async (page, firstIteration) => {

    if (firstIteration) {
        // select 'tackles' from 'category' drop-down
        await page.select('#category', 'tackles');
        await page.waitForSelector('.tackleWonTotal   ');

        await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');
    }

    return await page.evaluate(() => {
        let tackles = {};
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td')); //get all table cells
        let currentPlayer = '';
        let currentCompetition = '';
        for (let i = 0; i < tds.length; i++) { //iterate through all of them at process
            if (tds[i].className === 'pn') {
                let metadata = initializePlayer(tackles, tds[i]);
                currentPlayer = metadata[0];
                currentCompetition = metadata[1];
            } else {
                if (tds[i].className === 'tackleWonTotal   ') {
                    if (tds[i].innerText === '-') {
                        tackles[currentPlayer][currentCompetition]['tackles'] = 0;
                    } else {
                        tackles[currentPlayer][currentCompetition]['tackles'] = parseInt(tds[i].innerText, 10);
                    }
                } else if (tds[i].className === 'challengeLost   ') {
                    if (tds[i].innerText === '-') {
                        tackles[currentPlayer][currentCompetition]['dribbledPast'] = 0;
                    } else {
                        tackles[currentPlayer][currentCompetition]['dribbledPast'] = parseInt(tds[i].innerText, 10);
                    }
                }
            }
        }
        return tackles;
    });

};

/**
 * Scrapes stats for interceptions
 * @param {*} page - The puppeteer page
 * @param {boolean} firstIteration - Boolean to track if this is the first iteration of the scraping loop
 * @return {Promise<*>} - Custom object containing the scraped interceptions stats
 */
let scrapeInterceptions = async (page, firstIteration) => {

    if (firstIteration) {
        // select 'interception' from 'category' drop-down
        await page.select('#category', 'interception');
        await page.waitForSelector('.interceptionAll   ');

        await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');
    }

    return await page.evaluate(() => {
        let interceptions = {};
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td')); //get all table cells
        let currentPlayer = '';
        let currentCompetition = '';
        for (let i = 0; i < tds.length; i++) { //iterate through all of them at process
            if (tds[i].className === 'pn') {
                let metadata = initializePlayer(interceptions, tds[i]);
                currentPlayer = metadata[0];
                currentCompetition = metadata[1];
            } else {
                if (tds[i].className === 'interceptionAll   ') {
                    if (tds[i].innerText === '-') {
                        interceptions[currentPlayer][currentCompetition]['interceptions'] = 0;
                    } else {
                        interceptions[currentPlayer][currentCompetition]['interceptions'] = parseInt(tds[i].innerText, 10);
                    }
                }
            }
        }
        return interceptions;
    });

};

/**
 * Scrapes stats for possession losses
 * @param {*} page - The puppeteer page
 * @param {boolean} firstIteration - Boolean to track if this is the first iteration of the scraping loop
 * @return {Promise<*>} - Custom object containing the scraped possession losses stats
 */
let scrapePossessionLosses = async (page, firstIteration) => {

    if (firstIteration) {
        // select 'possession loss' from 'category' drop-down
        await page.select('#category', 'possession-loss');
        await page.waitForSelector('.turnover   ');

        await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');
    }

    return await page.evaluate(() => {
        let possessionLosses = {};
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td')); //get all table cells
        let currentPlayer = '';
        let currentCompetition = '';
        for (let i = 0; i < tds.length; i++) { //iterate through all of them at process
            if (tds[i].className === 'pn') {
                let metadata = initializePlayer(possessionLosses, tds[i]);
                currentPlayer = metadata[0];
                currentCompetition = metadata[1];
            } else {
                if (tds[i].className === 'turnover   ') {
                    let dispossessions = tds[i + 1].innerText;
                    if (dispossessions === '-') {
                        dispossessions = '0';
                    }
                    possessionLosses[currentPlayer][currentCompetition]['possessionLosses'] = parseInt(dispossessions, 10);
                }
            }
        }
        return possessionLosses;
    });

};

/**
 * Scrapes stats for dribbles
 * @param {*} page - The puppeteer page
 * @param {boolean} firstIteration - Boolean to track if this is the first iteration of the scraping loop
 * @return {Promise<*>} - Custom object containing the scraped dribbles stats
 */
let scrapeDribbles = async (page, firstIteration) => {

    if (firstIteration) {
        // select 'dribbles' from 'category' drop-down
        await page.select('#category', 'dribbles');
        await page.waitForSelector('.dribbleWon  ');

        await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');
    }

    return await page.evaluate(() => {
        let dribbles = {};
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td')); //get all table cells
        let currentPlayer = '';
        let currentCompetition = '';
        for (let i = 0; i < tds.length; i++) { //iterate through all of them at process
            if (tds[i].className === 'pn') {
                let metadata = initializePlayer(dribbles, tds[i]);
                currentPlayer = metadata[0];
                currentCompetition = metadata[1];
            } else {
                if (tds[i].className === 'dribbleWon   ') {
                    let succDribbles = tds[i].innerText;
                    let totalDribbles = tds[i+1].innerText;
                    if (succDribbles === '-') {
                        succDribbles = '0';
                    }
                    if (totalDribbles === '-') {
                        totalDribbles = '0';
                    }
                    dribbles[currentPlayer][currentCompetition]['succDribbles'] = parseInt(succDribbles, 10);
                    dribbles[currentPlayer][currentCompetition]['totalDribbles'] = parseInt(totalDribbles, 10);
                }
            }
        }
        return dribbles;
    });

};

/**
 * Scrapes stats for clearances
 * @param {*} page - The puppeteer page
 * @param {boolean} firstIteration - Boolean to track if this is the first iteration of the scraping loop
 * @return {Promise<*>} - Custom object containing the scraped clearances stats
 */
let scrapeClearances = async (page, firstIteration) => {

    if (firstIteration) {
        // select 'clearances' from 'category' drop-down
        await page.select('#category', 'clearances');
        await page.waitForSelector('.clearanceTotal   ');

        await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');
    }

    return await page.evaluate(() => {
        let clearances = {};
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td')); //get all table cells
        let currentPlayer = '';
        let currentCompetition = '';
        for (let i = 0; i < tds.length; i++) { //iterate through all of them at process
            if (tds[i].className === 'pn') {
                let metadata = initializePlayer(clearances, tds[i]);
                currentPlayer = metadata[0];
                currentCompetition = metadata[1];
            } else {
                if (tds[i].className === 'clearanceTotal   ') {
                    if (tds[i].innerText === '-') {
                        clearances[currentPlayer][currentCompetition]['clearances'] = 0;
                    } else {
                        clearances[currentPlayer][currentCompetition]['clearances'] = parseInt(tds[i].innerText, 10);
                    }
                }
            }
        }
        return clearances;
    });

};

/**
 * Scrapes stats for aerial duels
 * @param {*} page - The puppeteer page
 * @param {boolean} firstIteration - Boolean to track if this is the first iteration of the scraping loop
 * @return {Promise<*>} - Custom object containing the scraped aerial duels stats
 */
let scrapeAerialDuels = async (page, firstIteration) => {

    if (firstIteration) {
        // select 'aerial' from 'category' drop-down
        await page.select('#category', 'aerial');
        await page.waitForSelector('.duelAerialWon   ');

        await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');
    }

    return await page.evaluate(() => {
        let aerialDuels = {};
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td')); //get all table cells
        let currentPlayer = '';
        let currentCompetition = '';
        for (let i = 0; i < tds.length; i++) { //iterate through all of them at process
            if (tds[i].className === 'pn') {
                let metadata = initializePlayer(aerialDuels, tds[i]);
                currentPlayer = metadata[0];
                currentCompetition = metadata[1];
            } else {
                if (tds[i].className === 'duelAerialWon   ') {
                    if (tds[i].innerText === '-') {
                        aerialDuels[currentPlayer][currentCompetition]['succAerialDuels'] = 0;
                    } else {
                        aerialDuels[currentPlayer][currentCompetition]['succAerialDuels'] = parseInt(tds[i].innerText, 10);
                    }
                } else if (tds[i].className === 'duelAerialTotal   ') {
                    if (tds[i].innerText === '-') {
                        aerialDuels[currentPlayer][currentCompetition]['totalAerialDuels'] = 0;
                    } else {
                        aerialDuels[currentPlayer][currentCompetition]['totalAerialDuels'] = parseInt(tds[i].innerText, 10);
                    }
                }
            }
        }
        return aerialDuels;
    });

};

/**
 * Scrapes stats for crosses
 * @param {*} page - The puppeteer page
 * @param {boolean} firstIteration - Boolean to track if this is the first iteration of the scraping loop
 * @return {Promise<*>} - Custom object containing the scraped crosses stats
 */
let scrapeCrosses = async (page, firstIteration) => {

    if (firstIteration) {
        // select 'aerial' from 'category' drop-down
        await page.select('#category', 'passes');
        await page.waitForSelector('.passTotal   ');

        //select 'type' from 'sub-category' drop-down
        await page.select('#subcategory', 'type');
        await page.waitForSelector('.passCrossAccurate   ');

        await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');
    }

    return await page.evaluate(() => {
        let crosses = {};
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td')); //get all table cells
        let currentPlayer = '';
        let currentCompetition = '';
        for (let i = 0; i < tds.length; i++) { //iterate through all of them at process
            if (tds[i].className === 'pn') {
                let metadata = initializePlayer(crosses, tds[i]);
                currentPlayer = metadata[0];
                currentCompetition = metadata[1];
            } else {
                if (tds[i].className === 'passCrossAccurate   ') {
                    let successfulCrosses = tds[i].innerText;
                    let unsuccessfulCrosses = tds[i + 1].innerText;
                    if (successfulCrosses === "-") {
                        successfulCrosses = 0;
                    } else {
                        successfulCrosses = parseInt(tds[i].innerText, 10);
                    }
                    if (unsuccessfulCrosses === "-") {
                        unsuccessfulCrosses = 0;
                    } else {
                        unsuccessfulCrosses = parseInt(tds[i + 1].innerText, 10);
                    }
                    crosses[currentPlayer][currentCompetition]['succCrosses'] = successfulCrosses;
                    crosses[currentPlayer][currentCompetition]['totalCrosses'] = successfulCrosses + unsuccessfulCrosses;
                }
            }
        }
        return crosses;
    });

};

/**
 * Scrapes stats for fouls
 * @param {*} page - The puppeteer page
 * @param {boolean} firstIteration - Boolean to track if this is the first iteration of the scraping loop
 * @return {Promise<*>} - Custom object containing the scraped fouls stats
 */
let scrapeFouls = async (page, firstIteration) => {

    if (firstIteration) {
        // select 'aerial' from 'category' drop-down
        await page.select('#category', 'fouls');
        await page.waitForSelector('.foulCommitted   ');

        await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');
    }

    return await page.evaluate(() => {
        let fouls = {};
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td')); //get all table cells
        let currentPlayer = '';
        let currentCompetition = '';
        for (let i = 0; i < tds.length; i++) { //iterate through all of them at process
            if (tds[i].className === 'pn') {
                let metadata = initializePlayer(fouls, tds[i]);
                currentPlayer = metadata[0];
                currentCompetition = metadata[1];
            } else {
                if (tds[i].className === 'foulCommitted   ') {
                    if (tds[i].innerText === '-') {
                        fouls[currentPlayer][currentCompetition]['fouls'] = 0;
                    } else {
                        fouls[currentPlayer][currentCompetition]['fouls'] = parseInt(tds[i].innerText, 10);
                    }
                }
            }
        }
        return fouls;
    });

};

/**
 * Scrapes stats for blocks
 * @param {*} page - The puppeteer page
 * @param {boolean} firstIteration - Boolean to track if this is the first iteration of the scraping loop
 * @return {Promise<*>} - Custom object containing the scraped blocks stats
 */
let scrapeBlocks = async (page, firstIteration) => {

    if (firstIteration) {
        // select 'blocks' from 'category' drop-down
        await page.select('#category', 'blocks');
        await page.waitForSelector('.outfielderBlock   ');

        await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');
    }

    return await page.evaluate(() => {
        let blocks = {};
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td')); //get all table cells
        let currentPlayer = '';
        let currentCompetition = '';
        for (let i = 0; i < tds.length; i++) { //iterate through all of them at process
            if (tds[i].className === 'pn') {
                let metadata = initializePlayer(blocks, tds[i]);
                currentPlayer = metadata[0];
                currentCompetition = metadata[1];
            } else {
                if (tds[i].className === 'outfielderBlock   ') {
                    if (tds[i].innerText === '-') {
                        blocks[currentPlayer][currentCompetition]['blocks'] = 0;
                    } else {
                        blocks[currentPlayer][currentCompetition]['blocks'] = parseInt(tds[i].innerText, 10);
                    }
                }
            }
        }
        return blocks;
    });

};

/**
 * Uploads the processedData to the MongoDB database
 * @return {Promise<*>} Resolves when the data has been successfully uploaded
 */
let uploadToDatabase = async () => {

    return new Promise(async function(resolve, reject){
        if (COMPETITION === "db"){

            let processedData = JSON.parse(fs.readFileSync(path.join(__dirname, '/serverUtils/processed.json')));

            mongoClient.connect(mongoURI, {useUnifiedTopology: true}, function(err, client) {
                console.log("Connected to database");
                let db = client.db("ProjectFourteen");
                let collection = db.collection('Players');
                for (let player in processedData){
                    let processedPlayer = processedData[player];
                    let url = player;
                    let name = processedPlayer['name'];
                    let countryCode = processedPlayer['countryCode'];
                    let club = processedPlayer['club'];
                    delete processedPlayer['name'];
                    delete processedPlayer['club'];
                    delete processedPlayer['countryCode'];
                    collection.find({"url": player}).toArray(function (err, docs) {
                        if (err) {
                            console.log("Error uploading to database");
                        } else if (docs.length === 0) {
                            if (ADDNEW){
                                collection.insertOne(
                                    {
                                        url: url,
                                        name: name,
                                        club: club,
                                        countryCode: countryCode,
                                        stats: processedPlayer,
                                        lastUpdated: new Date()
                                    }
                                )
                            }
                        } else {
                            let temp = docs[0].stats;
                            let temp2 = docs[0].club;
                            for (let competition in processedPlayer){
                                temp[competition] = processedPlayer[competition]
                            }
                            temp2 = Array.from(new Set(temp2.concat(club)));
                            collection.updateOne(
                                {url: player},
                                {
                                    $set: {
                                        club: temp2,
                                        stats: temp,
                                        lastUpdated: new Date()
                                    }
                                }
                            )
                        }
                    });
                }
            });
            setTimeout(function(){
                console.log("Uploaded to database");
                resolve();
            }, 60000)
        }
        else {
            resolve()
        }
    });

};

console.time('stat retrieval');
setup()
    .then(() =>
        getStats()
    )
    .then(() =>
        processRawData()
    )
    .then(() =>
        uploadToDatabase()
    )
    .then(() =>
        (console.timeEnd('stat retrieval'), process.exit(0))
    )
    .catch(async (anError) => {
        console.log(anError);
    });
