var SEASON;
//parse command line arguments to get the season
let ARGS = process.argv.slice(2);
if (ARGS.length !== 1){
    console.log("Incorrect number of args. Usage: node positionScraper <season>");
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
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const isEqual = require('lodash.isequal');

//function to launch a browser using puppeteer
let browser;
let page;
let URLs;
if (SEASON === "18-19"){
    URLs = [
        "https://www.whoscored.com/Regions/252/Tournaments/2/Seasons/7361/Stages/16368/PlayerStatistics/England-Premier-League-2018-2019",
        "https://www.whoscored.com/Regions/206/Tournaments/4/Seasons/7466/Stages/16546/PlayerStatistics/Spain-LaLiga-2018-2019",
        "https://www.whoscored.com/Regions/108/Tournaments/5/Seasons/7468/Stages/16548/PlayerStatistics/Italy-Serie-A-2018-2019",
        "https://www.whoscored.com/Regions/81/Tournaments/3/Seasons/7405/Stages/16427/PlayerStatistics/Germany-Bundesliga-2018-2019",
        "https://www.whoscored.com/Regions/74/Tournaments/22/Seasons/7344/Stages/16348/PlayerStatistics/France-Ligue-1-2018-2019"
    ];
}
else {
    URLs = [
        "https://www.whoscored.com/Statistics"
    ]
}


let setup = async () => {

    return new Promise(async function(resolve, reject){

        console.time('browser launch');
        browser = await puppeteer.launch({
            headless: false,
            args: ["--no-sandbox", "--disable-setuid-sandbox", '--disable-gpu']
        });
        page = await browser.newPage();
        await page.reload({ waitUntil: ["networkidle2"] });
        await disableImages(page);
        console.timeEnd('browser launch');
        resolve(browser);

    });

};


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


let pageSetup = async (page, isFirstIteration, position) => {

    return new Promise(async function(resolve, reject) {

        if (isFirstIteration) {

            // navigate to 'detailed' tab
            let selector;
            //whoscored data for previous seasons is stored separately (by competition)
            //data for the current season is stored together. Hence the different selectors
            if (SEASON !== "18-19"){
                // navigate to 'detailed' tab (current season)
                selector = 'a[href="#top-player-stats-detailed"]';
            }
            else {
                // navigate to 'detailed' tab (previous seasons)
                selector = 'a[href="#stage-top-player-stats-detailed"]';
            }
            await page.waitForSelector(selector);
            await page.evaluate((selector) => document.querySelector(selector).click(), selector);
            await page.waitForSelector('#statistics-table-detailed');

            //set minimum apps to 10
            await page.select('#appearancesComparisonType', '2');
            await page.focus('#appearances');
            await page.keyboard.press('Backspace');
            // await page.keyboard.press('Backspace');
            await page.keyboard.type('9');

            // select 'total' from 'accumulation' drop-down
            await page.select('#statsAccumulationType', '2');
            await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');

            //press 'toggle all positions'
            if (position === "FW"){
                selector = '#toggle-all-positions';
                await page.evaluate((selector) => document.querySelector(selector).click(), selector);
            }

            switch (position){
                case "FW":
                    //select the forward position
                    selector = '#pitch > tbody > tr:nth-child(1) > td > label';
                    await page.evaluate((selector) => document.querySelector(selector).click(), selector);
                    break;
                case "AM":
                    //unselect the forward position
                    selector = '#pitch > tbody > tr:nth-child(1) > td > label';
                    await page.evaluate((selector) => document.querySelector(selector).click(), selector);

                    //select the attacking midfield positions
                    selector = '#pitch > tbody > tr:nth-child(2) > td:nth-child(1) > label > input';
                    await page.evaluate((selector) => document.querySelector(selector).click(), selector);
                    selector = '#pitch > tbody > tr:nth-child(2) > td:nth-child(2) > label';
                    await page.evaluate((selector) => document.querySelector(selector).click(), selector);
                    selector = '#pitch > tbody > tr:nth-child(2) > td:nth-child(3) > label';
                    await page.evaluate((selector) => document.querySelector(selector).click(), selector);
                    selector = '#pitch > tbody > tr:nth-child(3) > td:nth-child(1) > label > input';
                    await page.evaluate((selector) => document.querySelector(selector).click(), selector);
                    selector = '#pitch > tbody > tr:nth-child(3) > td:nth-child(3) > label > input';
                    await page.evaluate((selector) => document.querySelector(selector).click(), selector);
                    break;
                case "CM":
                    //unselect the attacking midfield positions
                    selector = '#pitch > tbody > tr:nth-child(2) > td:nth-child(1) > label > input';
                    await page.evaluate((selector) => document.querySelector(selector).click(), selector);
                    selector = '#pitch > tbody > tr:nth-child(2) > td:nth-child(2) > label';
                    await page.evaluate((selector) => document.querySelector(selector).click(), selector);
                    selector = '#pitch > tbody > tr:nth-child(2) > td:nth-child(3) > label';
                    await page.evaluate((selector) => document.querySelector(selector).click(), selector);
                    selector = '#pitch > tbody > tr:nth-child(3) > td:nth-child(1) > label > input';
                    await page.evaluate((selector) => document.querySelector(selector).click(), selector);
                    selector = '#pitch > tbody > tr:nth-child(3) > td:nth-child(3) > label > input';
                    await page.evaluate((selector) => document.querySelector(selector).click(), selector);

                    //select the central midfield positions
                    selector = '#pitch > tbody > tr:nth-child(3) > td:nth-child(2) > label > input';
                    await page.evaluate((selector) => document.querySelector(selector).click(), selector);
                    selector = '#pitch > tbody > tr:nth-child(4) > td:nth-child(1) > label > input';
                    await page.evaluate((selector) => document.querySelector(selector).click(), selector);
                    break;
                case "FB":
                    //unselect the central midfield positions
                    selector = '#pitch > tbody > tr:nth-child(3) > td:nth-child(2) > label > input';
                    await page.evaluate((selector) => document.querySelector(selector).click(), selector);
                    selector = '#pitch > tbody > tr:nth-child(4) > td:nth-child(1) > label > input';
                    await page.evaluate((selector) => document.querySelector(selector).click(), selector);

                    //select the full-back positions
                    selector = '#pitch > tbody > tr:nth-child(5) > td:nth-child(1) > label > input';
                    await page.evaluate((selector) => document.querySelector(selector).click(), selector);
                    selector = '#pitch > tbody > tr:nth-child(5) > td:nth-child(3) > label > input';
                    await page.evaluate((selector) => document.querySelector(selector).click(), selector);
                    break;
                case "CB":
                    //unselect the full-back positions
                    selector = '#pitch > tbody > tr:nth-child(5) > td:nth-child(1) > label > input';
                    await page.evaluate((selector) => document.querySelector(selector).click(), selector);
                    selector = '#pitch > tbody > tr:nth-child(5) > td:nth-child(3) > label > input';
                    await page.evaluate((selector) => document.querySelector(selector).click(), selector);

                    //select the center-back position
                    selector = '#pitch > tbody > tr:nth-child(5) > td:nth-child(2) > label > input';
                    await page.evaluate((selector) => document.querySelector(selector).click(), selector);
                    break;
                case "GK":
                    //unselect the center-back position
                    selector = '#pitch > tbody > tr:nth-child(5) > td:nth-child(2) > label > input';
                    await page.evaluate((selector) => document.querySelector(selector).click(), selector);

                    //select the GK position
                    selector = selector = '#pitch > tbody > tr:nth-child(6) > td:nth-child(1) > label > input';
                    await page.evaluate((selector) => document.querySelector(selector).click(), selector);
            }

            //press search button
            selector = '#filter-options > div:nth-child(2) > dl > dd.search-button-container > button';
            await page.evaluate((selector) => document.querySelector(selector).click(), selector);
            await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');

            await page.waitFor(3000);
            resolve(page);

        } else {
            let selector = "#statistics-paging-detailed #next";
            await page.evaluate((selector) => document.querySelector(selector).click(), selector);
            await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');
            resolve(await page.evaluate(() => {return document.querySelector("#statistics-paging-detailed #next").className !== "option  disabled "}))
        }

    });


};


let getPlayers = async(position) => {

    console.log(`Getting ${position}s`);

    return new Promise((resolve, reject) => {
        let rawData = {names:[], codes:[]};
        pageSetup(page, true, position)
            .then(() =>
                getNamesAndCodes(page)
            )
            .then( async (namesAndCodes) => {
                rawData['names'] = rawData['names'].concat(namesAndCodes[0]);
                rawData['codes'] = rawData['codes'].concat(namesAndCodes[1]);
                await saveData(rawData, position);
                resolve()
            })
            .catch(async (anError) => {
                console.log(anError);
            });
    });

};


let getNamesAndCodes = async (page) => {

    let firstIteration = true;
    //scrape needed data
    let percentiles = [];
    return new Promise(async function(resolve, reject){
        let hasNextPage = true;
        (async function loop() {
            while (hasNextPage){
                hasNextPage = await new Promise( (resolve, reject) =>
                    scrapeNamesAndCodes(page, firstIteration)
                        .then(async (result) =>(percentiles = combineResults(percentiles, result), firstIteration = false))
                        .then(async () =>
                            resolve(await pageSetup(page, false))
                        )
                        .catch(async (anError) => {
                            reject(anError);
                        })
                );
                let array1 = percentiles.slice(percentiles.length-10, percentiles.length);
                let array2 = percentiles.slice(percentiles.length-20, percentiles.length-10);
                if (isEqual(array1, array2)){
                    percentiles.splice(percentiles.length-10, 10);
                    await page.waitFor(1000);
                }
            }
            scrapeNamesAndCodes(page, firstIteration)
                .then(async (result) =>
                    (percentiles = combineResults(percentiles, result), firstIteration = false)
                ).then(() =>
                (resolve(percentiles), logResults(percentiles))
            )
        })();
    });

};


let scrapeNamesAndCodes = async (page) => {

    return await page.evaluate(() => {
        let names = [];
        let codes = [];
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'pn') {
                let name = tds[i].innerHTML.substring(tds[i].innerHTML.indexOf('">')+2, tds[i].innerHTML.indexOf(' </a>', 0));
                let url = tds[i].innerHTML.substring(tds[i].innerHTML.indexOf('href="')+6, tds[i].innerHTML.indexOf('">', 0));
                url = url.replace("/Players/", "");
                let code = url.substring(0, url.indexOf("/"));
                names.push(name);
                codes.push(code);
            }
        }
        return [names, codes];
    });

};


let combineResults = (original, addition) => {
    let result = [];
    if (addition !== undefined && Array.isArray(addition[0])){
        if (original.length === 0){
            result = addition;
        }
        else {
            for (let i=0; i<original.length; i++){
                result[i] = original[i].concat(addition[i]);
            }
        }
    }
    else {
        result = original.concat(addition);
    }
    return result;
};


function logResults(percentiles){
    if (Array.isArray(percentiles[0])){
        let numbers = [];
        for (let i=0; i<percentiles.length; i++){
            numbers.push(percentiles[i].length);
        }
        console.log(numbers);
    }
    else {
        console.log(percentiles.length)
    }
}


let saveData =  async (rawData, position) => {

    let filePath;

    switch (position) {
        case "FW":
            filePath = `positionData/${SEASON}/FWPlayers.json`;
            break;
        case "AM":
            filePath = `positionData/${SEASON}/AMPlayers.json`;
            break;
        case "CM":
            filePath = `positionData/${SEASON}/CMPlayers.json`;
            break;
        case "FB":
            filePath = `positionData/${SEASON}/FBPlayers.json`;
            break;
        case "CB":
            filePath = `positionData/${SEASON}/CBPlayers.json`;
            break;
        case "GK":
            filePath = `positionData/${SEASON}/GKPlayers.json`;
            break;

    }

    //remove duplicates from the arrays
    for (let array in rawData){
        let uniqueSet = new Set(rawData[array]);
        rawData[array] = [...uniqueSet];
    }

    return new Promise(async function (resolve, reject) {
        await fs.writeFile(path.join(__dirname, filePath), JSON.stringify(rawData, null, '\t'), function(err) {
            if (err) {
                console.log(err);
            }
            resolve();
        });
    });

};


console.time('player positions scraped');
setup()
    .then(async() => {
        return new Promise(function (resolve, reject) {
            (async function loop() { //special syntax to call asynchronous function in a loop
                for (let i=0; i<URLs.length; i++){
                    await new Promise(function (resolve, reject) {
                        page.goto(URLs[i], {waitUntil: 'networkidle2'})
                            .then(async () => {
                                await getPlayers("FW")
                            })
                            .then(async () => {
                                await getPlayers("AM")
                            })
                            .then(async () => {
                                await getPlayers("CM")
                            })
                            .then(async () => {
                                await getPlayers("FB")
                            })
                            .then(async () => {
                                await getPlayers("CB")
                            })
                            .then(async () => {
                                await getPlayers("GK");
                                resolve()
                            })
                    });
                }
                resolve();
            })();
        })
    })
    .then(async () => {
        console.timeEnd('player positions scraped'), process.exit(0)
    })
    .catch(async(anError) => {
        console.log(anError);
    });
