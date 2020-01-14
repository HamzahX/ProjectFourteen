//initialize constants
const puppeteer = require('puppeteer');
const countryCodes = require('./serverUtils/countryCodes.js');
const path = require('path');
const express = require('express');
const server = express();
const http = require('http').Server(server);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const fs = require('fs');
const mongoClient = require('mongodb').MongoClient;
const mongoURI = "mongodb+srv://hamzah:containers@cluster0-wz8lb.mongodb.net/test?retryWrites=true&w=majority";

//set up express path
server.use(express.static(path.join(__dirname, '/public')));

var browser;
var context;

var db;
var collection;

let FWPercentiles;
let AMPercentiles;
let CMPercentiles;
let FBPercentiles;
let CBPercentiles;

//function to launch a browser using puppeteer, retrieve percentile arrays
let setup = async () => {
    return new Promise(async function(resolve, reject){
        console.time('browser launch');
        browser = await puppeteer.launch({
            headless: false,
            args: ["--no-sandbox", "--disable-setuid-sandbox", '--disable-gpu']
        });
        context = await browser.createIncognitoBrowserContext();
        await context.newPage();
        let pages = await browser.pages();
        await pages[0].close();
        console.timeEnd('browser launch');

        console.time('percentile retrieval');
        let FWPercentilesFile = fs.readFileSync(path.join(__dirname, '/serverUtils/FWPercentiles.json'));
        FWPercentiles = JSON.parse(FWPercentilesFile);
        let AMPercentilesFile = fs.readFileSync(path.join(__dirname, '/serverUtils/AMPercentiles.json'));
        AMPercentiles = JSON.parse(AMPercentilesFile);
        let CMPercentilesFile = fs.readFileSync(path.join(__dirname, '/serverUtils/CMPercentiles.json'));
        CMPercentiles = JSON.parse(CMPercentilesFile);
        let FBPercentilesFile = fs.readFileSync(path.join(__dirname, '/serverUtils/FBPercentiles.json'));
        FBPercentiles = JSON.parse(FBPercentilesFile);
        let CBPercentilesFile = fs.readFileSync(path.join(__dirname, '/serverUtils/CBPercentiles.json'));
        CBPercentiles = JSON.parse(CBPercentilesFile);
        console.timeEnd('percentile retrieval');

        resolve(context);
    });
};

let connectToDatabase = async () => {

    return new Promise(function(resolve, reject) {

        mongoClient.connect(mongoURI, {useUnifiedTopology: true},function (err, client) {
            console.log("Connected to database");
            db = client.db("ProjectFourteen");
            collection = db.collection('CurrentSeason');
            resolve();
        })

    });

};

//launch a browser and then start listening on the port
setup()
    .then(() =>
        connectToDatabase()
    )
    .then(() =>
        http.listen(port, function () {
            console.log('Listening on port ' + port);
        })
    )
    .catch(async (anError) => {
        console.log(anError);
    });

//wait for socket events
io.on('connection', async function(socket){

    console.log("Number of users currently online: " + Object.keys(io.sockets.sockets).length);

    socket.emit('percentile arrays', FWPercentiles, AMPercentiles, CMPercentiles, FBPercentiles, CBPercentiles);

    socket.on('search', async(aQuery) => {
        if (aQuery.toLowerCase() === "test") {
            try{
                let fileContents = fs.readFileSync(path.join(__dirname, '/serverUtils/sampleSearchResults.json'));
                let sampleSearchResults = JSON.parse(fileContents);
                socket.emit('search results', sampleSearchResults);
            }
            catch(error) {
                socket.emit('alert error', "Invalid Search");
            }
        }
        else if (aQuery.includes("--all")){
            aQuery = aQuery.replace("--all", "");
            console.log(socket.id + " | Searching for: " + aQuery);
            console.time(socket.id + " | Time taken to return search results");
            let URL = "https://www.whoscored.com/Search/?t=" + aQuery.replace(' ', '+');
            let page = await context.newPage();
            getSearchResults(page, URL).then(async (searchResults) => {
                await page.close();
                for (let i = 0; i < searchResults.length; i++) {
                    let countryISO = searchResults[i]["nationality"];
                    searchResults[i]["nationality"] = countryCodes.getCountryName(countryISO.toUpperCase());
                    searchResults[i]["all"] = true;
                }
                console.timeEnd(socket.id + " | Time taken to return search results");
                socket.emit('search results', searchResults);
                // await fs.writeFile(path.join(__dirname, '/serverUtils/sampleSearchResults.json'), JSON.stringify(searchResults), function(err) {
                //     if (err) {
                //         console.log(err);
                //     }
                // });
            }).catch(async (anError) => {
                await page.close();
                console.log(socket.id + " | " + anError);
                socket.emit('alert error', anError.name);
            });
        }
        else {
            console.log(socket.id + " | Searching the database for: " + aQuery);
            console.time(socket.id + " | Time taken to return search results");
            collection.find({$text:
                        {
                            $search: '\"' + aQuery + '\"',
                            $caseSensitive: false,
                            $diacriticSensitive: false
                        }
                }).toArray(function(err, docs) {
                if (err){
                    console.log(socket.id + " | " + err);
                    socket.emit('alert error', "An error occurred while retrieving from the database");
                }
                else if (docs.length === 0){
                    console.log(socket.id + " | " + "Error: Player not found in database");
                    socket.emit('alert error', "The player you searched for was not found in the database. Sorry!");
                }
                else {
                    let searchResults = [];
                    for (let i=0; i<docs.length; i++){
                        let result = {
                            name: docs[i].name,
                            club: docs[i].club,
                            nationality: countryCodes.getCountryName(docs[i].countryCode.toUpperCase()),
                            URL: docs[i].url,
                            all: false
                        };
                        searchResults.push(result);
                    }
                    socket.emit('search results', searchResults);
                    console.timeEnd(socket.id + " | Time taken to return search results");
                }
            });
        }
    });

    socket.on('scrape stats', async(URL, all) => {
        if (URL === 'test') {
            let fileContents = fs.readFileSync(path.join(__dirname, '/serverUtils/sampleStats.json'));
            let sampleStats = JSON.parse(fileContents);
            socket.emit('stats scraped', sampleStats);
        }
        else if (all === "true"){
            console.log(socket.id + " | Retrieving stats dynamically from: " + URL);
            console.time(socket.id + " | Time taken to return stats");
            let page = await context.newPage();
            getStats(page, URL).then(async (rawData) => {
                await page.close();
                let unorderedStats = {};
                for (let key in rawData[0]) {
                    unorderedStats[key] = {};
                }
                for (let i = 0; i < rawData.length; i++) {
                    for (let key in rawData[i]) {
                        Object.assign(unorderedStats[key], rawData[i][key]);
                    }
                }
                let orderedStats = {};
                Object.keys(unorderedStats).sort().reverse().forEach(function(key) {
                    orderedStats[key] = unorderedStats[key];
                });
                console.timeEnd(socket.id + " | Time taken to return stats");
                socket.emit('stats scraped', orderedStats);
                // await fs.writeFile(path.join(__dirname, '/serverUtils/sampleStats.json'), JSON.stringify(orderedStats), function(err) {
                //     if (err) {
                //         console.log(err);
                //     }
                // });
            }).catch(async (anError) => {
                await page.close();
                console.log(socket.id + " | " + anError);
                socket.emit('alert error', anError.name);
            });
        }
        else {
            console.log(socket.id + " | Retrieving stats from the database for: " + URL);
            console.time(socket.id + " | Time taken to return stats");
            collection.find({"url": URL}).toArray(function(err, docs) {
                if (err){
                    console.log(socket.id + " | " + err);
                    socket.emit('alert error', "An error occurred while retrieving from the database");
                }
                else if (docs.length === 0){
                    console.log(socket.id + " | " + "Error: Player not found in database");
                    socket.emit('alert error', "The player you selected was not found in the database. Sorry!");
                }
                else {
                    socket.emit('stats scraped', JSON.parse(docs[0].stats));
                    console.timeEnd(socket.id + " | Time taken to return stats");
                }
            });
        }
    });

    socket.on('disconnect', function(){
        console.log("Number of users currently online: " + Object.keys(io.sockets.sockets).length);
    })

});

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

let getSearchResults = async (page, URL) => {

    await disableImages(page);
    await page.goto(URL, {waitUntil: 'networkidle2'});

    return await page.evaluate(() => {
        let searchResults = [];
        const as = Array.from(document.querySelectorAll('.search-result table tr td a'));
        for (let i=0; i<as.length; i++){
            let result = {};
            if (as[i].outerHTML.startsWith('<a href="/Players')) {
                result["name"] = as[i].innerText;
                result["nationality"] = as[i].outerHTML.substring(
                    as[i].outerHTML.indexOf("country flg") + 12,
                    as[i].outerHTML.indexOf("</span>") - 2
                );
                result["club"] = "N/A";
                if (i !== as.length-1 && as[i + 1].outerHTML.startsWith('<a style')) {
                    result["club"] = as[i + 1].innerText;
                }
                let URL = as[i].outerHTML.substring(
                    as[i].outerHTML.indexOf("a href=") + 8,
                    as[i].outerHTML.indexOf(" class=") - 1
                );
                result["URL"] = "https://www.whoscored.com" + URL.replace("Show", "History");
                searchResults.push(result);
            }
        }
        return searchResults;
    });

};

let getStats = async (page, URL) => {

    await disableImages(page);
    await page.goto(URL, {waitUntil: 'networkidle2'});

    //scrape needed data
    let rawData = [];
    return new Promise(function(resolve, reject){
        scrapeAssistsAndMinutes(page)
        .then((assists) =>
            (rawData.push(assists), scrapeGoals(page))
        )
        .then((goals) =>
            (rawData.push(goals), scrapePasses(page))
        )
        .then((passes) =>
            (rawData.push(passes), scrapeShots(page))
        )
        .then((shots) =>
            (rawData.push(shots), scrapeKeyPasses(page))
        )
        .then((keyPasses) =>
            (rawData.push(keyPasses), scrapeShotsOnTarget(page))
        )
        .then((shotsOnTarget) =>
            (rawData.push(shotsOnTarget), scrapeFouls(page))
        )
        .then((fouls) =>
            (rawData.push(fouls), scrapeTackles(page))
        )
        .then((tackles) =>
            (rawData.push(tackles), scrapeInterceptions(page))
        )
        .then((interceptions) =>
            (rawData.push(interceptions), scrapePossessionLosses(page))
        )
        .then((possessionLosses) =>
            (rawData.push(possessionLosses), scrapeDribbles(page))
        )
        .then((dribbles) =>
            (rawData.push(dribbles), scrapeClearances(page))
        )
        .then((clearances) =>
            (rawData.push(clearances), scrapeAerialDuels(page))
        )
        .then((aerialDuels) =>
            (rawData.push(aerialDuels), scrapeCrosses(page))
        )
        .then((crosses) =>
            (rawData.push(crosses), scrapeBlocks(page))
        )
        .then((blocks) =>
            (rawData.push(blocks), scrapeThroughBalls(page))
        )
        .then((throughballs) =>
            (rawData.push(throughballs), resolve(rawData))
        )
        .catch(async(anError) => {
            reject(anError);
        })
    });

};

let scrapeAssistsAndMinutes = async (page) => {

    await page.waitForFunction('document.querySelector("#statistics-table-summary-loading").style.display == "none"');

    return await page.evaluate(() => {
        let assists = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-summary #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + ' - ' + tds[i + 2].innerText + '|' + tds[i + 1].innerText;
                assists[currentSeason] = {};
            } else {
                if (tds[i].className === 'assistTotal   ') {
                    if (tds[i].innerText === '-') {
                        assists[currentSeason]['assists'] = 0;
                    } else {
                        assists[currentSeason]['assists'] = parseInt(tds[i].innerText, 10);
                    }
                }
                if (tds[i].className === 'minsPlayed   ') {
                    if (tds[i].innerText === '-') {
                        assists[currentSeason]['minutes'] = 0;
                    } else {
                        assists[currentSeason]['minutes'] = parseInt(tds[i].innerText, 10);
                    }
                }
            }
        }
        return assists;
    });

};

let scrapeGoals = async (page) => {

    // navigate to 'detailed' tab
    let selector1 = 'a[href="#player-tournament-stats-detailed"]';
    await page.waitForSelector(selector1);
    await page.evaluate((selector) => document.querySelector(selector).click(), selector1);
    await page.waitForSelector('#statistics-table-detailed');

    // select 'total' from 'accumulation' drop-down
    await page.select('#statsAccumulationType', '2');
    await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');

    // select 'goals' from 'category' drop-down
    await page.select('#category', 'goals');
    await page.waitForSelector('.goalTotal   ');

    // select 'situations' from 'sub category' drop-down
    await page.select('#subcategory', 'situations');
    await page.waitForSelector('.goalNormal   ');

    await page.waitForSelector('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td:not(:empty)');

    return await page.evaluate(() => {
        let goals = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + ' - ' + tds[i + 2].innerText + '|' + tds[i + 1].innerText;
                goals[currentSeason] = {};
            } else {
                if (tds[i].className === 'goalNormal   ') {
                    if (tds[i].innerText === '-') {
                        goals[currentSeason]['goals'] = 0;
                    } else {
                        goals[currentSeason]['goals'] = parseInt(tds[i].innerText, 10);
                    }
                }
            }
        }
        return goals;
    });

};

let scrapeShots = async (page) => {

    // select 'shots' from 'category' drop-down
    await page.select('#category', 'shots');
    await page.waitForSelector('.shotsTotal   ');

    // select 'situations' from 'sub category' drop-down
    await page.select('#subcategory', 'situations');
    await page.waitForSelector('.shotOpenPlay   ');

    await page.waitForSelector('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td:not(:empty)');

    return await page.evaluate(() => {
        let shots = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + ' - ' + tds[i + 2].innerText + '|' + tds[i + 1].innerText;
                shots[currentSeason] = {};
            } else {
                if (tds[i].className === 'shotsTotal   ') {
                    if (tds[i].innerText === '-') {
                        shots[currentSeason]['shots'] = 0;
                    } else {
                        let totalShots = parseInt(tds[i].innerText, 10);
                        let penalties = tds[i + 4].innerText;
                        if (penalties === '-') {
                            penalties = '0';
                        }
                        shots[currentSeason]['shots'] = totalShots;
                        shots[currentSeason]['penaltiesTaken'] = parseInt(penalties, 10);
                    }
                }
            }
        }
        return shots;
    });

};

let scrapeShotsOnTarget = async (page) => {

    // select 'shots' from 'category' drop-down
    await page.select('#category', 'shots');
    await page.waitForSelector('.shotsTotal   ');

    // select 'situations' from 'sub category' drop-down
    await page.select('#subcategory', 'accuracy');
    await page.waitForSelector('.shotOnTarget   ');

    await page.waitForSelector('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td:not(:empty)');

    return await page.evaluate(() => {
        let shots = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + ' - ' + tds[i + 2].innerText + '|' + tds[i + 1].innerText;
                shots[currentSeason] = {};
            } else {
                if (tds[i].className === 'shotOnTarget   ') {
                    if (tds[i].innerText === '-') {
                        shots[currentSeason]['shotsOnTarget'] = 0;
                    } else {
                        let shotsOnTarget = parseInt(tds[i].innerText, 10);
                        shots[currentSeason]['shotsOnTarget'] = shotsOnTarget;
                    }
                }
            }
        }
        return shots;
    });

};

let scrapePasses = async (page) => {

    // select 'passes' from 'category' drop-down
    await page.select('#category', 'passes');
    await page.waitForSelector('.passTotal   ');

    await page.waitForSelector('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td:not(:empty)');

    return await page.evaluate(() => {
        let passes = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + ' - ' + tds[i + 2].innerText + '|' + tds[i + 1].innerText;
                passes[currentSeason] = {};
            } else {
                if (tds[i].className === 'passTotal   ') {
                    if (tds[i].innerText === '-') {
                        passes[currentSeason]['succPasses'] = 0;
                        passes[currentSeason]['totalPasses'] = 0;
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
                        passes[currentSeason]['succPasses'] = parseInt(accLB, 10) + parseInt(accSP, 10);
                        passes[currentSeason]['totalPasses'] = totalPasses;
                        passes[currentSeason]['succLongPasses'] = parseInt(accLB, 10);
                        passes[currentSeason]['totalLongPasses'] = parseInt(inAccLB, 10) + parseInt(accLB, 10);
                    }
                }
            }
        }
        return passes;
    });

};

let scrapeKeyPasses = async (page) => {

    // select 'key passes' from 'category' drop-down
    await page.select('#category', 'key-passes');
    await page.waitForSelector('.keyPassesTotal   ');

    await page.waitForSelector('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td:not(:empty)');

    return await page.evaluate(() => {
        let keyPasses = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + ' - ' + tds[i + 2].innerText + '|' + tds[i + 1].innerText;
                keyPasses[currentSeason] = {};
            } else {
                if (tds[i].className === 'keyPassesTotal   ') {
                    if (tds[i].innerText === '-') {
                        keyPasses[currentSeason]['keyPasses'] = 0;
                    } else {
                        keyPasses[currentSeason]['keyPasses'] = parseInt(tds[i].innerText, 10);
                    }
                }
            }
        }
        return keyPasses;
    });

};

let scrapeThroughBalls = async (page) => {

    let selector1 = 'a[href="#player-tournament-stats-passing"]';
    await page.waitForSelector(selector1);
    await page.evaluate((selector) => document.querySelector(selector).click(), selector1);
    await page.waitForSelector('#statistics-table-passing');

    await page.waitForFunction('document.querySelector("#statistics-table-passing-loading").style.display == "none"');

    await page.waitForSelector('#player-tournament-stats-passing #top-player-stats-summary-grid tr td:not(:empty)');

    return await page.evaluate(() => {
        let throughBalls = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-passing #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + ' - ' + tds[i + 2].innerText + '|' + tds[i + 1].innerText;
                throughBalls[currentSeason] = {};
            } else {
                if (tds[i].className === 'accurateThroughBallPerGame   ') {
                    let apps = tds[i-8].innerText;
                    if (apps.includes('(')) {
                        let starts = apps.substr(0, apps.indexOf('('));
                        let subs = apps.substr(apps.indexOf('(') + 1, apps.indexOf(')'));
                        apps = parseInt(starts, 10) + parseInt(subs, 10);
                    }
                    else {
                        apps = parseInt(tds[i-8].innerText, 10)
                    }
                    if (tds[i].innerText === '-') {
                        throughBalls[currentSeason]['throughBalls'] = 0;
                    } else {
                        // throughBalls[currentSeason]['throughBalls'] = Math.round(parseFloat(tds[i].innerText) * apps);
                        throughBalls[currentSeason]['throughBalls'] = parseFloat(tds[i].innerText) * apps;
                    }
                }
            }
        }
        return throughBalls;
    });

};

let scrapeTackles = async (page) => {

    // select 'tackles' from 'category' drop-down
    await page.select('#category', 'tackles');
    await page.waitForSelector('.tackleWonTotal   ');

    await page.waitForSelector('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td:not(:empty)');

    return await page.evaluate(() => {
        let tackles = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + ' - ' + tds[i + 2].innerText + '|' + tds[i + 1].innerText;
                tackles[currentSeason] = {};
            } else {
                if (tds[i].className === 'tackleWonTotal   ') {
                    if (tds[i].innerText === '-') {
                        tackles[currentSeason]['tackles'] = 0;
                    } else {
                        tackles[currentSeason]['tackles'] = parseInt(tds[i].innerText, 10);
                    }
                } else if (tds[i].className === 'challengeLost   ') {
                    if (tds[i].innerText === '-') {
                        tackles[currentSeason]['dribbledPast'] = 0;
                    } else {
                        tackles[currentSeason]['dribbledPast'] = parseInt(tds[i].innerText, 10);
                    }
                }
            }
        }
        return tackles;
    });

};

let scrapeInterceptions = async (page) => {

    // select 'interception' from 'category' drop-down
    await page.select('#category', 'interception');
    await page.waitForSelector('.interceptionAll   ');

    await page.waitForSelector('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td:not(:empty)');

    return await page.evaluate(() => {
        let interceptions = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + ' - ' + tds[i + 2].innerText + '|' + tds[i + 1].innerText;
                interceptions[currentSeason] = {};
            } else {
                if (tds[i].className === 'interceptionAll   ') {
                    if (tds[i].innerText === '-') {
                        interceptions[currentSeason]['interceptions'] = 0;
                    } else {
                        interceptions[currentSeason]['interceptions'] = parseInt(tds[i].innerText, 10);
                    }
                }
            }
        }
        return interceptions;
    });

};

let scrapePossessionLosses = async (page) => {

    // select 'possession loss' from 'category' drop-down
    await page.select('#category', 'possession-loss');
    await page.waitForSelector('.turnover   ');

    await page.waitForSelector('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td:not(:empty)');

    return await page.evaluate(() => {
        let possessionLosses = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + ' - ' + tds[i + 2].innerText + '|' + tds[i + 1].innerText;
                possessionLosses[currentSeason] = {};
            } else {
                if (tds[i].className === 'turnover   ') {
                    let dispossessions = tds[i + 1].innerText;
                    if (dispossessions === '-') {
                        dispossessions = '0';
                    }
                    possessionLosses[currentSeason]['possessionLosses'] = parseInt(dispossessions, 10);
                }
            }
        }
        return possessionLosses;
    });

};

let scrapeDribbles = async (page) => {

    // select 'dribbles' from 'category' drop-down
    await page.select('#category', 'dribbles');
    await page.waitForSelector('.dribbleWon  ');

    await page.waitForSelector('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td:not(:empty)');

    return await page.evaluate(() => {
        let dribbles = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + ' - ' + tds[i + 2].innerText + '|' + tds[i + 1].innerText;
                dribbles[currentSeason] = {};
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
                    dribbles[currentSeason]['succDribbles'] = parseInt(succDribbles, 10);
                    dribbles[currentSeason]['totalDribbles'] = parseInt(totalDribbles, 10);
                }
            }
        }
        return dribbles;
    });

};

let scrapeClearances = async (page) => {

    // select 'clearances' from 'category' drop-down
    await page.select('#category', 'clearances');
    await page.waitForSelector('.clearanceTotal   ');

    await page.waitForSelector('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td:not(:empty)');

    return await page.evaluate(() => {
        let clearances = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + ' - ' + tds[i + 2].innerText + '|' + tds[i + 1].innerText;
                clearances[currentSeason] = {};
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

let scrapeAerialDuels = async (page) => {

    // select 'aerial' from 'category' drop-down
    await page.select('#category', 'aerial');
    await page.waitForSelector('.duelAerialWon   ');

    await page.waitForSelector('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td:not(:empty)');

    return await page.evaluate(() => {
        let aerialDuels = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + ' - ' + tds[i + 2].innerText + '|' + tds[i + 1].innerText;
                aerialDuels[currentSeason] = {};
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

let scrapeCrosses = async (page) => {

    // select 'aerial' from 'category' drop-down
    await page.select('#category', 'passes');
    await page.waitForSelector('.passTotal   ');

    //select 'type' from 'sub-category' drop-down
    await page.select('#subcategory', 'type');
    await page.waitForSelector('.passCrossAccurate   ');

    await page.waitForSelector('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td:not(:empty)');

    return await page.evaluate(() => {
        let crosses = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + ' - ' + tds[i + 2].innerText + '|' + tds[i + 1].innerText;
                crosses[currentSeason] = {};
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

let scrapeFouls = async (page) => {

    // select 'aerial' from 'category' drop-down
    await page.select('#category', 'fouls');
    await page.waitForSelector('.foulCommitted   ');

    await page.waitForSelector('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td:not(:empty)');

    return await page.evaluate(() => {
        let fouls = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + ' - ' + tds[i + 2].innerText + '|' + tds[i + 1].innerText;
                fouls[currentSeason] = {};
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

let scrapeBlocks = async (page) => {

    // select 'blocks' from 'category' drop-down
    await page.select('#category', 'blocks');
    await page.waitForSelector('.outfielderBlock   ');

    await page.waitForSelector('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td:not(:empty)');

    return await page.evaluate(() => {
        let blocks = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + ' - ' + tds[i + 2].innerText + '|' + tds[i + 1].innerText;
                blocks[currentSeason] = {};
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

