//initialize constants
const puppeteer = require('puppeteer');
var fs = require('fs');
var isEqual = require('lodash.isequal');

//function to launch a browser using puppeteer
let browser;
let setup = async () => {
    return new Promise(async function(resolve, reject){
        console.time('browser launch');
        browser = await puppeteer.launch({
            headless: false,
            args: ["--no-sandbox", "--disable-setuid-sandbox", '--disable-gpu']
        });
        await browser.newPage();
        let pages = await browser.pages();
        await pages[0].close();
        console.timeEnd('browser launch');
        resolve(browser);
    });
};

//launch a browser and then start scraping
setup().then(async () => {
    let page = await browser.newPage();
    let URL = "https://www.whoscored.com/Statistics";
    let rawData = {goals: [], assists: [], passes: [], shots: [], keyPasses: [], tackles: [], interceptions: [], possessionLosses: [], dribbles: [], throughBalls: [], recoveries: [], shotsOnTarget: [], conversionRate: []};
    pageSetup(page, true, false, URL)
    .then(() =>
        getPercentiles(page, "goals")
    )
    .then((goals) =>
        (rawData['goals'] = (goals), getPercentiles(page, "assists"))
    )
    .then((assists) =>
        (rawData['assists'] = (assists), getPercentiles(page, "passes"))
    )
    .then((passes) =>
        (rawData['passes'] = (passes), getPercentiles(page, "shots"))
    )
    .then((shots) =>
        (rawData['shots'] = (shots), getPercentiles(page, "keyPasses"))
    )
    .then((keyPasses) =>
        (rawData['keyPasses'] = (keyPasses), getPercentiles(page, "shotsOnTarget"))
    )
    .then((shotsOnTarget) =>
        (rawData['shotsOnTarget'] = (shotsOnTarget), getPercentiles(page, "tackles"))
    )
    .then((tackles) =>
        (rawData['tackles'] = (tackles), getPercentiles(page, "interceptions"))
    )
    .then((interceptions) =>
        (rawData['interceptions'] = (interceptions), getPercentiles(page, "possessionLosses"))
    )
    .then((possessionLosses) =>
        (rawData['possessionLosses'] = (possessionLosses), getPercentiles(page, "dribbles"))
    )
    .then((dribbles) =>
        (rawData['dribbles'] = (dribbles), getPercentiles(page, "throughBalls"))
    )
    .then((throughBalls) =>
        (rawData['throughBalls'] = (throughBalls), processData(rawData))
    )
    .catch(async (anError) => {
        console.log(anError);
    });
}).catch(async(anError) => {
    console.log(anError);
});


let processData = async (rawData) => {

    for (let i=0; i<rawData['shotsOnTarget'].length; i++){
        rawData['shotsOnTarget'][i] = (rawData['shotsOnTarget'][i] / rawData['shots'][i]) * 100;
    }

    for (let i=0; i<rawData['tackles'].length; i++){
        rawData['recoveries'][i] = (rawData['tackles'][i] + rawData['interceptions'][i]);
    }

    for (let i=0; i<rawData['goals'].length; i++){
        rawData['conversionRate'][i] = (rawData['goals'][i] / rawData['shots'][i]) * 100;
    }

    for (let key in rawData){
        rawData[key].sort();
    }

    await fs.writeFile("percentiles.json", JSON.stringify(rawData), function(err) {
        if (err) {
            console.log(err);
        }
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

let pageSetup = async (page, firstIteration, isPassingTab, URL) => {

    return new Promise(async function(resolve, reject) {

        if (firstIteration) {
            await page.goto(URL, {waitUntil: 'networkidle0'});

            // navigate to 'detailed' tab
            let selector = 'a[href="#top-player-stats-detailed"]';
            await page.waitForSelector(selector);
            await page.evaluate((selector) => document.querySelector(selector).click(), selector);
            await page.waitForSelector('#statistics-table-detailed');

            //set minimum apps to 6
            await page.select('#appearancesComparisonType', '2');
            await page.focus('#appearances');
            await page.keyboard.type('6');

            // select 'total' from 'accumulation' drop-down
            await page.select('#statsAccumulationType', '2');
            await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');

            //press 'toggle all positions'
            selector = '#toggle-all-positions';
            await page.evaluate((selector) => document.querySelector(selector).click(), selector);

            //select the forward positions
            selector = '#pitch > tbody > tr:nth-child(2) > td:nth-child(1) > label > input';
            await page.evaluate((selector) => document.querySelector(selector).click(), selector);
            selector = '#pitch > tbody > tr:nth-child(2) > td:nth-child(2) > label';
            await page.evaluate((selector) => document.querySelector(selector).click(), selector);
            selector = '#pitch > tbody > tr:nth-child(2) > td:nth-child(3) > label';
            await page.evaluate((selector) => document.querySelector(selector).click(), selector);
            selector = '#pitch > tbody > tr:nth-child(1) > td > label';
            await page.evaluate((selector) => document.querySelector(selector).click(), selector);

            //press search button
            selector = '#filter-options > div:nth-child(2) > dl > dd.search-button-container > button';
            await page.evaluate((selector) => document.querySelector(selector).click(), selector);
            await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');

            await page.waitFor(3000);
            resolve(page);

        } else {
            if (isPassingTab) {
                let selector = "#statistics-paging-passing #next";
                await page.evaluate((selector) => document.querySelector(selector).click(), selector);
                await page.waitForFunction('document.querySelector("#statistics-table-passing-loading").style.display == "none"');
                resolve(await page.evaluate(() => {return document.querySelector("#statistics-paging-passing #next").className !== "option  disabled "}))
            } else {
                let selector = "#statistics-paging-detailed #next";
                await page.evaluate((selector) => document.querySelector(selector).click(), selector);
                await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');
                resolve(await page.evaluate(() => {return document.querySelector("#statistics-paging-detailed #next").className !== "option  disabled "}))
            }
        }

    });


};

let getPercentiles = async (page, stat) => {

    let isPassingTab = (stat === "throughBalls");
    let firstIteration = true;
    //scrape needed data
    let percentiles = [];
    return new Promise(async function(resolve, reject){
        let hasNextPage = true;
        (async function loop() {
            while (hasNextPage){
                hasNextPage = await new Promise( (resolve, reject) =>
                    scrape(page, firstIteration, stat)
                    .then(async (result) =>
                        (percentiles = percentiles.concat(result), firstIteration = false)
                    )
                    .then(async () =>
                        resolve(await pageSetup(page, false, isPassingTab))
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
            scrape(page, firstIteration, stat)
            .then(async (result) =>
                (percentiles = percentiles.concat(result), firstIteration = false)
            ).then(() =>
                (resolve(percentiles), console.log(percentiles.length))
            )
        })();
    });

};

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
        case "throughBalls":
            return await scrapeThroughBalls(page, firstIteration)
    }
    
};

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

    await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');

    return await page.evaluate(() => {
        let goals = [];
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'goalNormal   ') {
                let totalGoals;
                let minutes = parseInt(tds[i-7].innerText, 10);
                if (tds[i].innerText === '-') {
                    totalGoals = 0;
                } else {
                    totalGoals = parseInt(tds[i].innerText, 10);
                }
                let goalsP90 =  (totalGoals / (minutes/90));
                goals.push(goalsP90);
            }
        }
        return goals;
    });

};

let scrapeAssists = async (page, firstIteration) => {

    if (firstIteration) {
        // select 'goals' from 'category' drop-down
        await page.select('#category', 'assists');
        await page.waitForSelector('.assist   ');

        await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');
    }

    await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');

    return await page.evaluate(() => {
        let assists = [];
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'assist   ') {
                let totalAssists;
                let minutes = parseInt(tds[i-7].innerText, 10);
                if (tds[i].innerText === '-') {
                    totalAssists = 0;
                } else {
                    totalAssists = parseInt(tds[i].innerText, 10);
                }
                let assistsP90 =  (totalAssists / (minutes/90));
                assists.push(assistsP90);
            }
        }
        return assists;
    });

};

let scrapePasses = async (page, firstIteration) => {
    
    if (firstIteration) {
        // select 'passes' from 'category' drop-down
        await page.select('#category', 'passes');
        await page.waitForSelector('.passTotal   ');

        await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');
    }

    await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');

    return await page.evaluate(() => {
        let passes = [];
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'passTotal   ') {
                let passSuccess;
                if (tds[i].innerText === '-') {
                    passSuccess = 0;
                } else {
                    let totalPasses = parseInt(tds[i].innerText, 10);
                    let accLB = tds[i + 1].innerText;
                    if (accLB === '-') {
                        accLB = '0';
                    }
                    let accSP = tds[i + 3].innerText;
                    if (accSP === '-') {
                        accSP = '0';
                    }
                    accLB = parseInt(accLB, 10);
                    accSP = parseInt(accSP, 10);
                    passSuccess = ((accSP + accLB) / totalPasses) * 100;
                }
                passes.push(passSuccess);
            }
        }
        return passes;
    });

};

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

    await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');

    return await page.evaluate(() => {
        let shots = [];
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'shotsTotal   ') {
                let totalShots;
                let penalties;
                let minutes = parseInt(tds[i-1].innerText, 10);
                if (tds[i].innerText === '-') {
                    totalShots = 0;
                    penalties = 0;
                } else {
                    totalShots = parseInt(tds[i].innerText, 10);
                    penalties = tds[i + 4].innerText;
                    if (penalties === '-') {
                        penalties = '0';
                    }
                }
                let shotsP90 =  ((totalShots - penalties) / (minutes/90));
                shots.push(shotsP90);
            }
        }
        return shots;
    });

};

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

    await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');

    return await page.evaluate(() => {
        let shotsOnTarget = [];
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'shotOnTarget   ') {
                let totalShotsOnTarget;
                let minutes = parseInt(tds[i-4].innerText, 10);
                if (tds[i].innerText === '-') {
                    totalShotsOnTarget = 0;
                } else {
                    totalShotsOnTarget = parseInt(tds[i].innerText, 10);
                }
                let shotsOnTargetP90 = (totalShotsOnTarget / (minutes/90));
                shotsOnTarget.push(shotsOnTargetP90)
            }
        }
        return shotsOnTarget;
    });

};

let scrapeKeyPasses = async (page, firstIteration) => {

    if (firstIteration) {
        // select 'key passes' from 'category' drop-down
        await page.select('#category', 'key-passes');
        await page.waitForSelector('.keyPassesTotal   ');

        await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');
    }

    await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');

    return await page.evaluate(() => {
        let keyPasses = [];
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'keyPassesTotal   ') {
                let totalKeyPasses;
                let minutes = parseInt(tds[i-1].innerText, 10);
                if (tds[i].innerText === '-') {
                    totalKeyPasses = 0;
                } else {
                    totalKeyPasses = parseInt(tds[i].innerText, 10);
                }
                let keyPassesP90 = (totalKeyPasses / (minutes/90));
                keyPasses.push(keyPassesP90)
            }
        }
        return keyPasses;
    });

};

let scrapeThroughBalls = async (page, firstIteration) => {

    if (firstIteration) {
        let selector1 = 'a[href="#top-player-stats-passing"]';
        await page.waitForSelector(selector1);
        await page.evaluate((selector) => document.querySelector(selector).click(), selector1);
        await page.waitForSelector('#statistics-table-passing');
        await page.waitForFunction('document.querySelector("#statistics-table-passing-loading").style.display == "none"');
        await page.waitForSelector('#statistics-table-passing #top-player-stats-summary-grid tr td:not(:empty)');
    }

    await page.waitForFunction('document.querySelector("#statistics-table-passing-loading").style.display == "none"');

    return await page.evaluate(() => {
        let throughBalls = [];
        const tds = Array.from(document.querySelectorAll('#statistics-table-passing #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'pn') {
                if (tds[i].innerText.includes("FW") || tds[i].innerText.includes("AM")) {
                    let totalThroughBalls;
                    let apps = tds[i + 1].innerText;
                    let minutes = parseInt(tds[i + 2].innerText, 10);
                    let meetsMinimum = false;
                    if (apps.includes('(')) {
                        let starts = parseInt(apps.substr(0, apps.indexOf('(')), 10);
                        let subs = parseInt(apps.substr(apps.indexOf('(') + 1, apps.indexOf(')')), 10);
                        apps = starts + subs;
                        if (starts > 6){
                            meetsMinimum = true;
                        }
                    } else {
                        apps = parseInt(tds[i + 1].innerText, 10);
                        if (apps > 6){
                            meetsMinimum = true;
                        }
                    }
                    if (tds[i + 9].innerText === '-') {
                        totalThroughBalls = 0;
                    } else {
                        totalThroughBalls = parseFloat(tds[i + 9].innerText) * apps;
                    }
                    let throughBallsP90 = (totalThroughBalls / (minutes/90));
                    if (meetsMinimum) {
                        throughBalls.push(throughBallsP90);
                    }
                }
            }
        }
        return throughBalls;
    });

};

let scrapeTackles = async (page, firstIteration) => {

    if (firstIteration) {
        // select 'tackles' from 'category' drop-down
        await page.select('#category', 'tackles');
        await page.waitForSelector('.tackleWonTotal   ');

        await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');
    }

    await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');

    return await page.evaluate(() => {
        let tackles = [];
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'tackleWonTotal   ') {
                let totalTackles;
                let minutes = parseInt(tds[i - 1].innerText, 10);
                if (tds[i].innerText === '-') {
                    totalTackles = 0;
                } else {
                    totalTackles = parseInt(tds[i].innerText, 10);
                }
                let tacklesP90 = (totalTackles / (minutes/90));
                tackles.push(tacklesP90);
            }
        }
        return tackles;
    });

};

let scrapeInterceptions = async (page, firstIteration) => {

    if (firstIteration) {
        // select 'interception' from 'category' drop-down
        await page.select('#category', 'interception');
        await page.waitForSelector('.interceptionAll   ');

        await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');
    }

    await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');

    return await page.evaluate(() => {
        let interceptions = [];
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'interceptionAll   ') {
                let totalInterceptions;
                let minutes = parseInt(tds[i - 1].innerText, 10);
                if (tds[i].innerText === '-') {
                    totalInterceptions = 0;
                } else {
                    totalInterceptions = parseInt(tds[i].innerText, 10);
                }
                let interceptionsP90 = (totalInterceptions / (minutes/90));
                interceptions.push(interceptionsP90);
            }
        }
        return interceptions;
    });

};

let scrapePossessionLosses = async (page, firstIteration) => {

    if (firstIteration) {
        // select 'possession loss' from 'category' drop-down
        await page.select('#category', 'possession-loss');
        await page.waitForSelector('.turnover   ');

        await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');
    }

    await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');

    return await page.evaluate(() => {
        let dispossessions = [];
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'dispossessed   ') {
                let totalDispossessions;
                let minutes = parseInt(tds[i - 2].innerText, 10);
                if (tds[i].innerText === '-') {
                    totalDispossessions = '0';
                }
                else {
                    totalDispossessions = parseInt(tds[i].innerText, 10);
                }
                let dispossessionsP90 = (totalDispossessions / (minutes/90));
                dispossessions.push(dispossessionsP90);
            }
        }
        return dispossessions;
    });

};

let scrapeDribbles = async (page, firstIteration) => {

    if (firstIteration) {
        // select 'dribbles' from 'category' drop-down
        await page.select('#category', 'dribbles');
        await page.waitForSelector('.dribbleWon  ');

        await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');
    }

    await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');

    return await page.evaluate(() => {
        let dribbles = [];
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'dribbleWon   ') {
                let totalDribbles;
                let minutes = parseInt(tds[i - 2].innerText, 10);
                if (tds[i].innerText === '-') {
                    totalDribbles = 0;
                } else {
                    totalDribbles = parseInt(tds[i].innerText, 10);
                }
                let dribblesP90 = (totalDribbles / (minutes/90));
                dribbles.push(dribblesP90);
            }
        }
        return dribbles;
    });

};

let scrapeClearances = async (page, firstIteration) => {

    // select 'clearances' from 'category' drop-down
    await page.select('#category', 'clearances');
    await page.waitForSelector('.clearanceTotal   ');

    await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');

    return await page.evaluate(() => {
        let clearances = [];
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + ' - ' + tds[i + 2].innerText + '|' + tds[i + 1].innerText;
                clearances[currentSeason] = [];
            } else {
                if (tds[i].className === 'clearanceTotal   ') {
                    if (tds[i].innerText === '-') {
                        clearances[currentSeason]['clearances'] = 0;
                    } else {
                        clearances[currentSeason]['clearances'] = parseInt(tds[i].innerText, 10);
                    }
                }
            }
        }
        return clearances;
    });

};

let scrapeAerialDuels = async (page, firstIteration) => {

    // select 'aerial' from 'category' drop-down
    await page.select('#category', 'aerial');
    await page.waitForSelector('.duelAerialWon   ');

    await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');

    return await page.evaluate(() => {
        let aerialDuels = [];
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + ' - ' + tds[i + 2].innerText + '|' + tds[i + 1].innerText;
                aerialDuels[currentSeason] = [];
            } else {
                if (tds[i].className === 'duelAerialWon   ') {
                    if (tds[i].innerText === '-') {
                        aerialDuels[currentSeason]['succAerialDuels'] = 0;
                    } else {
                        aerialDuels[currentSeason]['succAerialDuels'] = parseInt(tds[i].innerText, 10);
                    }
                } else if (tds[i].className === 'duelAerialTotal   ') {
                    if (tds[i].innerText === '-') {
                        aerialDuels[currentSeason]['totalAerialDuels'] = 0;
                    } else {
                        aerialDuels[currentSeason]['totalAerialDuels'] = parseInt(tds[i].innerText, 10);
                    }
                }
            }
        }
        return aerialDuels;
    });

};

let scrapeCrosses = async (page, firstIteration) => {

    // select 'aerial' from 'category' drop-down
    await page.select('#category', 'passes');
    await page.waitForSelector('.passTotal   ');

    //select 'type' from 'sub-category' drop-down
    await page.select('#subcategory', 'type');
    await page.waitForSelector('.passCrossAccurate   ');

    await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');

    return await page.evaluate(() => {
        let crosses = [];
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + ' - ' + tds[i + 2].innerText + '|' + tds[i + 1].innerText;
                crosses[currentSeason] = [];
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
                    crosses[currentSeason]['succCrosses'] = successfulCrosses;
                    crosses[currentSeason]['totalCrosses'] = successfulCrosses + unsuccessfulCrosses;
                }
            }
        }
        return crosses;
    });

};

let scrapeFouls = async (page, firstIteration) => {

    // select 'aerial' from 'category' drop-down
    await page.select('#category', 'fouls');
    await page.waitForSelector('.foulCommitted   ');

    await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');

    return await page.evaluate(() => {
        let fouls = [];
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + ' - ' + tds[i + 2].innerText + '|' + tds[i + 1].innerText;
                fouls[currentSeason] = [];
            } else {
                if (tds[i].className === 'foulCommitted   ') {
                    if (tds[i].innerText === '-') {
                        fouls[currentSeason]['fouls'] = 0;
                    } else {
                        fouls[currentSeason]['fouls'] = parseInt(tds[i].innerText, 10);
                    }
                }
            }
        }
        return fouls;
    });

};

let scrapeBlocks = async (page, firstIteration) => {

    // select 'blocks' from 'category' drop-down
    await page.select('#category', 'blocks');
    await page.waitForSelector('.outfielderBlock   ');

    await page.waitForSelector('#statistics-table-detailed #top-player-stats-summary-grid tr td:not(:empty)');

    return await page.evaluate(() => {
        let blocks = [];
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#statistics-table-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + ' - ' + tds[i + 2].innerText + '|' + tds[i + 1].innerText;
                blocks[currentSeason] = [];
            } else {
                if (tds[i].className === 'outfielderBlock   ') {
                    if (tds[i].innerText === '-') {
                        blocks[currentSeason]['blocks'] = 0;
                    } else {
                        blocks[currentSeason]['blocks'] = parseInt(tds[i].innerText, 10);
                    }
                }
            }
        }
        return blocks;
    });

};

