//initialize constants
const puppeteer = require('puppeteer');
const countryCodes = require('./serverUtils/countryCodes.js');
const path = require('path');
const express = require('express');
const server = express();
const http = require('http').Server(server);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

//set up express path
server.use(express.static(path.join(__dirname, '/public')));

//function to launch a browser using puppeteer
let browser;
let context;
let setup = async () => {
    return new Promise(async function(resolve, reject){
        console.time('browser launch');
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--incognito'
                // '--disable-dev-shm-usage',
                // '--disable-accelerated-2d-canvas',
                // '--disable-gpu',
                // '--window-size=1920x1080',
            ]
        });
        context = await browser.createIncognitoBrowserContext();
        console.timeEnd('browser launch');
        resolve(context);
    });
};

//launch a browser and then start listening on the port
setup().then(
    http.listen(port, function () {
        console.log('listening on port ' + port);
    })
);

//wait for socket events
io.on('connection', function(socket){
    console.log("Number of users currently online: " + Object.keys(io.sockets.sockets).length);

    socket.on('search', async(aQuery) => {
        console.log(socket.id + " | Searching for: " + aQuery);
        console.time(socket.id + " | Time taken to return search results");
        let URL = "https://www.whoscored.com/Search/?t=" + aQuery.replace(' ', '+');
        let page = await context.newPage();
        getSearchResults(page, URL).then(async (searchResults) => {
            await page.close();
            for (let i=0; i<searchResults.length; i++){
                let countryISO = searchResults[i]["nationality"];
                searchResults[i]["nationality"] = countryCodes.getCountryName(countryISO.toUpperCase());
            }
            console.timeEnd(socket.id + " | Time taken to return search results");
            socket.emit('search results', searchResults);
        }).catch(async(anError) => {
            console.log(socket.id + " | " + anError);
            await page.close();
            socket.emit('alert error', anError.name);
        });
    });

    socket.on('scrape stats', async(URL) => {
        console.log(socket.id + " | Retrieving stats from: " + URL);
        console.time(socket.id + " | Time taken to return stats");
        let stats = {};
        let rawData  = [];
        let page = await context.newPage();
        getStats(page, URL).then(async (returnedData) => {
            rawData = returnedData;
            await page.close();
            for (let key in rawData[0]) {
                stats[key] = {};
            }
            for (let i = 0; i < rawData.length; i++) {
                for (let key in rawData[i]) {
                    Object.assign(stats[key], rawData[i][key]);
                }
            }
            console.timeEnd(socket.id + " | Time taken to return stats");
            socket.emit('stats scraped', stats);
        }).catch(async(anError) => {
            console.log(socket.id + " | " + anError);
            await page.close();
            socket.emit('alert error', anError.name);
        });
    });

    socket.on('disconnect', function(){
        console.log("Number of users currently online: " + Object.keys(io.sockets.sockets).length);
    })
});

let getSearchResults = async (page, URL) => {

    await page.goto(URL, {waitUntil: 'networkidle0'});

    return await page.evaluate(() => {
        let searchResults = [];
        const as = Array.from(document.querySelectorAll('.search-result table tr td a'));
        for (let i=0; i<as.length; i++){
            let result = {};
            if (as[i].outerHTML.startsWith('<a href="/Players')) {
                result["name"] = as[i].innerText;
                let countryISO = as[i].outerHTML.substring(
                    as[i].outerHTML.indexOf("country flg") + 12,
                    as[i].outerHTML.indexOf("</span>") - 2
                );
                result["nationality"] = countryISO;
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

let pageSetup = async(page, URL) => {
    await page.goto(URL, {waitUntil: 'networkidle0'});

    // navigate to 'detailed' tab
    let selector1 = 'a[href="#player-tournament-stats-detailed"]';
    await page.waitForSelector(selector1);
    await page.evaluate((selector) => document.querySelector(selector).click(), selector1);
    // await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');
    await page.waitForSelector('#statistics-table-detailed');

    // select 'total' from 'accumulation' drop-down
    await page.select('#statsAccumulationType', '2');
    await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');
};

let getStats = async (page, URL) => {

    await pageSetup(page, URL);

    //initialize data structure to hold all data
    let rawData = [];

    //TODO: Refactor this ugly piece of shit code
    //scrape needed data
    return new Promise(function(resolve, reject){
        scrapeGoalsAndMinutes(page).then((goals) => {
            rawData.push(goals);
            scrapeShots(page).then((shots) => {
                rawData.push(shots);
                scrapePasses(page).then((passes) => {
                    rawData.push(passes);
                    scrapeAssists(page).then((assists) => {
                        rawData.push(assists);
                        scrapeKeyPasses(page).then((keyPasses) => {
                            rawData.push(keyPasses);
                            scrapeThroughBalls(page).then((throughBalls) => {
                                rawData.push(throughBalls);
                                scrapeTackles(page).then((tackles) => {
                                    rawData.push(tackles);
                                    scrapeInterceptions(page).then((interceptions) => {
                                        rawData.push(interceptions);
                                        scrapePossessionLosses(page).then((possessionLosses) => {
                                            rawData.push(possessionLosses);
                                            scrapeDribbles(page).then((dribbles) => {
                                                rawData.push(dribbles);
                                                scrapeClearances(page).then((clearances) => {
                                                    rawData.push(clearances);
                                                    scrapeAerialDuels(page).then((aerialDuels) => {
                                                        rawData.push(aerialDuels);
                                                        scrapeCrosses(page).then((crosses) => {
                                                            rawData.push(crosses);
                                                            scrapeFouls(page).then((fouls) => {
                                                                rawData.push(fouls);
                                                                resolve(rawData);
                                                            }).catch(async(anError) => {
                                                                reject(anError);
                                                            })
                                                        }).catch(async(anError) => {
                                                            reject(anError);
                                                        })
                                                    }).catch(async(anError) => {
                                                        reject(anError);
                                                    })
                                                }).catch(async(anError) => {
                                                    reject(anError);
                                                })
                                            }).catch(async(anError) => {
                                                reject(anError);
                                            })
                                        }).catch(async(anError) => {
                                            reject(anError);
                                        })
                                    }).catch(async(anError) => {
                                        reject(anError);
                                    })
                                }).catch(async(anError) => {
                                    reject(anError);
                                })
                            }).catch(async(anError) => {
                                reject(anError);
                            })
                        }).catch(async(anError) => {
                            reject(anError);
                        })
                    }).catch(async(anError) => {
                        reject(anError);
                    })
                }).catch(async(anError) => {
                    reject(anError);
                })
            }).catch(async(anError) => {
                reject(anError);
            })
        }).catch(async(anError) => {
            reject(anError);
        })
    });

};

let scrapeGoalsAndMinutes = async (page) => {
    // select 'goals' from 'category' drop-down
    await page.select('#category', 'goals');
    // await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');
    await page.waitForSelector('.goalTotal   ');

    // select 'situations' from 'sub category' drop-down
    await page.select('#subcategory', 'situations');
    // await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');
    await page.waitForSelector('.goalNormal   ');

    return await page.evaluate(() => {
        // initialize data structure to store all scraped data
        var goals = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + '-' + tds[i + 2].innerText;
                goals[currentSeason] = {};
            } else {
                if (tds[i].className === 'goalNormal   ') {
                    if (tds[i].innerText === '-') {
                        goals[currentSeason]['goals'] = 0;
                    } else {
                        goals[currentSeason]['goals'] = parseInt(tds[i].innerText, 10);
                    }
                }
                else if (tds[i].className === 'minsPlayed   ') {
                    if (tds[i].innerText === '-') {
                        goals[currentSeason]['minutes'] = 0;
                    } else {
                        goals[currentSeason]['minutes'] = parseInt(tds[i].innerText, 10);
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
    // await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');
    await page.waitForSelector('.shotsTotal   ');

    // select 'situations' from 'sub category' drop-down
    await page.select('#subcategory', 'situations');
    // await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');
    await page.waitForSelector('.shotOpenPlay   ');

    return await page.evaluate(() => {
        // initialize data structure to store all scraped data
        var shots = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + '-' + tds[i + 2].innerText;
                shots[currentSeason] = {};
            } else {
                if (tds[i].className === 'shotsTotal   ') {
                    if (tds[i].innerText === '-') {
                        shots[currentSeason]['shots'] = 0;
                    } else {
                        let totalShots = parseInt(tds[i].innerText, 10);
                        let penalties = tds[i+4].innerText;
                        if (penalties === '-'){
                            penalties = '0';
                        }
                        let nonPenaltyShots = totalShots - parseInt(penalties, 10);
                        shots[currentSeason]['shots'] = nonPenaltyShots;
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
    // await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');
    await page.waitForSelector('.passTotal   ');

    return await page.evaluate(() => {
        // initialize data structure to store all scraped data
        var passes = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + '-' + tds[i + 2].innerText;
                passes[currentSeason] = {};
            } else {
                if (tds[i].className === 'passTotal   ') {
                    if (tds[i].innerText === '-') {
                        passes[currentSeason]['succPasses'] = 0;
                        passes[currentSeason]['totalPasses'] = 0;
                    } else {
                        let totalPasses = parseInt(tds[i].innerText, 10);
                        let accLB = tds[i+1].innerText;
                        if (accLB === '-'){
                            accLB = '0';
                        }
                        let accSP = tds[i+3].innerText;
                        if (accSP === '-'){
                            accSP = '0';
                        }
                        let successfulPasses = parseInt(accLB, 10) + parseInt(accSP, 10);
                        passes[currentSeason]['succPasses'] = successfulPasses;
                        passes[currentSeason]['totalPasses'] = totalPasses;
                        passes[currentSeason]['longPasses'] = parseInt(accLB, 10)
                    }
                }
            }
        }
        return passes;
    });
};

let scrapeAssists = async (page) => {
    // select 'assists' from 'category' drop-down
    await page.select('#category', 'assists');
    // await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');
    await page.waitForSelector('.assist   ');

    return await page.evaluate(() => {
        // initialize data structure to store all scraped data
        var assists = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + '-' + tds[i + 2].innerText;
                assists[currentSeason] = {};
            } else {
                if (tds[i].className === 'assist   ') {
                    if (tds[i].innerText === '-') {
                        assists[currentSeason]['assists'] = 0;
                    } else {
                        assists[currentSeason]['assists'] = parseInt(tds[i].innerText, 10);
                    }
                }
            }
        }
        return assists;
    });
};

let scrapeKeyPasses = async (page) => {
    // select 'key passes' from 'category' drop-down
    await page.select('#category', 'key-passes');
    // await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');
    await page.waitForSelector('.keyPassesTotal   ');

    return await page.evaluate(() => {
        // initialize data structure to store all scraped data
        var keyPasses = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + '-' + tds[i + 2].innerText;
                keyPasses[currentSeason] = {};
            } else {
                if (tds[i].className === 'keyPassesTotal   ') {
                    if (tds[i].innerText === '-') {
                        keyPasses[currentSeason]['keyPasses']= 0;
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
    // select 'passes' from 'category' drop-down
    await page.select('#category', 'key-passes');
    // await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');
    await page.waitForSelector('.keyPassesTotal   ');

    // select 'type' from 'sub-category' drop-down
    await page.select('#subcategory', 'type');
    // await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');
    await page.waitForSelector('.keyPassThroughball   ');

    return await page.evaluate(() => {
        // initialize data structure to store all scraped data
        var throughBalls = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + '-' + tds[i + 2].innerText;
                throughBalls[currentSeason] = {};
            } else {
                if (tds[i].className === 'keyPassThroughball   ') {
                    if (tds[i].innerText === '-') {
                        throughBalls[currentSeason]['throughBalls'] = 0;
                    } else {
                        throughBalls[currentSeason]['throughBalls'] = parseInt(tds[i].innerText, 10);
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
    // await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');
    await page.waitForSelector('.tackleWonTotal   ');

    return await page.evaluate(() => {
        // initialize data structure to store all scraped data
        var tackles = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + '-' + tds[i + 2].innerText;
                tackles[currentSeason] = {};
            } else {
                if (tds[i].className === 'tackleWonTotal   ') {
                    if (tds[i].innerText === '-') {
                        tackles[currentSeason]['tackles'] = 0;
                    } else {
                        tackles[currentSeason]['tackles'] = parseInt(tds[i].innerText, 10);
                    }
                }
                else if (tds[i].className === 'challengeLost   '){
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
    // await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');
    await page.waitForSelector('.interceptionAll   ');

    return await page.evaluate(() => {
        // initialize data structure to store all scraped data
        var interceptions = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + '-' + tds[i + 2].innerText;
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
    // await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');
    await page.waitForSelector('.turnover   ');

    return await page.evaluate(() => {
        // initialize data structure to store all scraped data
        var possessionLosses = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + '-' + tds[i + 2].innerText;
                possessionLosses[currentSeason] = {};
            } else {
                if (tds[i].className === 'turnover   ') {
                    let unsuccessfulTouches = tds[i].innerText;
                    if (unsuccessfulTouches === '-'){
                        unsuccessfulTouches = '0';
                    }
                    let dispossessions = tds[i+1].innerText;
                    if (dispossessions === '-'){
                        dispossessions = '0';
                    }
                    let totalLostPossessions = parseInt(unsuccessfulTouches, 10) + parseInt(dispossessions, 10);
                    possessionLosses[currentSeason]['possessionLosses'] = totalLostPossessions;
                }
            }
        }
        return possessionLosses;
    });
};

let scrapeDribbles = async (page) => {
    // select 'dribbles' from 'category' drop-down
    await page.select('#category', 'dribbles');
    // await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');
    await page.waitForSelector('.dribbleWon  ');

    return await page.evaluate(() => {
        // initialize data structure to store all scraped data
        var dribbles = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + '-' + tds[i + 2].innerText;
                dribbles[currentSeason] = {};
            } else {
                if (tds[i].className === 'dribbleWon   ') {
                    if (tds[i].innerText === '-') {
                        dribbles[currentSeason]['dribbles'] = 0;
                    } else {
                        dribbles[currentSeason]['dribbles'] = parseInt(tds[i].innerText, 10);
                    }
                }
            }
        }
        return dribbles;
    });
};

let scrapeClearances = async (page) => {
    // select 'clearances' from 'category' drop-down
    await page.select('#category', 'clearances');
    // await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');
    await page.waitForSelector('.clearanceTotal   ');

    return await page.evaluate(() => {
        // initialize data structure to store all scraped data
        var clearances = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + '-' + tds[i + 2].innerText;
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
    // await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');
    await page.waitForSelector('.duelAerialWon   ');

    return await page.evaluate(() => {
        // initialize data structure to store all scraped data
        var aerialDuels = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + '-' + tds[i + 2].innerText;
                aerialDuels[currentSeason] = {};
            } else {
                if (tds[i].className === 'duelAerialWon   ') {
                    if (tds[i].innerText === '-') {
                        aerialDuels[currentSeason]['succAerialDuels'] = 0;
                    } else {
                        aerialDuels[currentSeason]['succAerialDuels'] = parseInt(tds[i].innerText, 10);
                    }
                }
                else if (tds[i].className === 'duelAerialTotal   ') {
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
    // await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');
    await page.waitForSelector('.passTotal   ');

    //select 'type' from 'sub-category' drop-down
    await page.select('#subcategory', 'type');
    // await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');
    await page.waitForSelector('.passCrossAccurate   ');

    return await page.evaluate(() => {
        // initialize data structure to store all scraped data
        var crosses = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + '-' + tds[i + 2].innerText;
                crosses[currentSeason] = {};
            }
            else {
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
    // await page.waitForFunction('document.querySelector("#statistics-table-detailed-loading").style.display == "none"');
    await page.waitForSelector('.foulCommitted   ');

    return await page.evaluate(() => {
        // initialize data structure to store all scraped data
        var fouls = {};
        let currentSeason = '';
        const tds = Array.from(document.querySelectorAll('#player-tournament-stats-detailed #top-player-stats-summary-grid tr td'));
        for (let i = 0; i < tds.length; i++) {
            if (tds[i].className === 'rank tournament') {
                currentSeason = tds[i].innerText + '-' + tds[i + 2].innerText;
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
