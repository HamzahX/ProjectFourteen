//initialize constants
const path = require('path');
const fs = require('fs');

const utilities = require('../server/utilities.js');

const mean = require('mathjs').mean;
const std = require('mathjs').std;

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
var PROCESSED;

var FW_CODES;
var AM_CODES;
var CM_CODES;
var FB_CODES;
var CB_CODES;
var GK_CODES;

var STATS_BY_POSITION;

var PERCENTILE_DATA = {
    "FW": {},
    "AM": {},
    "CM": {},
    "FB": {},
    "CB": {},
    "GK": {},
};

var Z_SCORE_INFO;

let setup = async () => {

    PROCESSED = JSON.parse(fs.readFileSync(path.join(__dirname, '/playerData/processed.json')));

    FW_CODES = JSON.parse(fs.readFileSync(path.join(__dirname, `positionData/${SEASON}/FWPercentilePlayers.json`)))["codes"];
    AM_CODES = JSON.parse(fs.readFileSync(path.join(__dirname, `positionData/${SEASON}/AMPercentilePlayers.json`)))["codes"];
    CM_CODES = JSON.parse(fs.readFileSync(path.join(__dirname, `positionData/${SEASON}/CMPercentilePlayers.json`)))["codes"];
    FB_CODES = JSON.parse(fs.readFileSync(path.join(__dirname, `positionData/${SEASON}/FBPercentilePlayers.json`)))["codes"];
    CB_CODES = JSON.parse(fs.readFileSync(path.join(__dirname, `positionData/${SEASON}/CBPercentilePlayers.json`)))["codes"];
    GK_CODES = JSON.parse(fs.readFileSync(path.join(__dirname, `positionData/${SEASON}/GKPercentilePlayers.json`)))["codes"];

    STATS_BY_POSITION = JSON.parse(fs.readFileSync(path.join(__dirname, '/referenceData/statsByPosition.json')));

    for (let position in STATS_BY_POSITION){
        for (let i=0; i<STATS_BY_POSITION[position].length; i++){
            let stat = STATS_BY_POSITION[position][i];
            PERCENTILE_DATA[position][stat] = [];
        }
    }

    Z_SCORE_INFO = {
        "FW": {},
        "AM": {},
        "CM": {},
        "FB": {},
        "CB": {},
        "GK": {},
    };

};


let calculateFWStats = async () => {

    for (let i=0; i<FW_CODES.length; i++){

        let code = FW_CODES[i];
        let aggregatedStats = aggregateStats(PROCESSED[code]["stats"][SEASON]);

        let averageStats = utilities.getStatAverages(aggregatedStats, false);

        for (let i=0; i<STATS_BY_POSITION["FW"].length; i++){

            let stat = STATS_BY_POSITION["FW"][i];
            addToArray(PERCENTILE_DATA["FW"][stat], averageStats[stat]);

        }

    }

    populateZScoreInfo("FW", PERCENTILE_DATA["FW"]);

    await saveData(PERCENTILE_DATA["FW"], "FW");

};


let calculateAMStats = async () => {

    for (let i=0; i<AM_CODES.length; i++){

        let code = AM_CODES[i];
        let aggregatedStats = aggregateStats(PROCESSED[code]["stats"][SEASON]);

        let averageStats = utilities.getStatAverages(aggregatedStats, false);

        for (let i=0; i<STATS_BY_POSITION["AM"].length; i++){

            let stat = STATS_BY_POSITION["AM"][i];
            addToArray(PERCENTILE_DATA["AM"][stat], averageStats[stat]);

        }

    }

    populateZScoreInfo("AM", PERCENTILE_DATA["AM"]);

    await saveData(PERCENTILE_DATA["AM"], "AM");

};


let calculateCMStats = async () => {

    for (let i=0; i<CM_CODES.length; i++){

        let code = CM_CODES[i];
        let aggregatedStats = aggregateStats(PROCESSED[code]["stats"][SEASON]);

        let averageStats = utilities.getStatAverages(aggregatedStats, false);

        for (let i=0; i<STATS_BY_POSITION["CM"].length; i++){

            let stat = STATS_BY_POSITION["CM"][i];
            addToArray(PERCENTILE_DATA["CM"][stat], averageStats[stat]);

        }

    }

    populateZScoreInfo("CM", PERCENTILE_DATA["CM"]);

    await saveData(PERCENTILE_DATA["CM"], "CM");

};

let calculateFBStats = async () => {

    for (let i=0; i<FB_CODES.length; i++){

        let code = FB_CODES[i];

        if (PROCESSED[code] === undefined){
            console.log(code);
        }

        let aggregatedStats = aggregateStats(PROCESSED[code]["stats"][SEASON]);

        let averageStats = utilities.getStatAverages(aggregatedStats, false);

        for (let i=0; i<STATS_BY_POSITION["FB"].length; i++){

            let stat = STATS_BY_POSITION["FB"][i];
            addToArray(PERCENTILE_DATA["FB"][stat], averageStats[stat]);

        }

    }

    populateZScoreInfo("FB", PERCENTILE_DATA["FB"]);

    await saveData(PERCENTILE_DATA["FB"], "FB");

};


let calculateCBStats = async () => {

    for (let i=0; i<CB_CODES.length; i++){

        let code = CB_CODES[i];
        let aggregatedStats = aggregateStats(PROCESSED[code]["stats"][SEASON]);

        let averageStats = utilities.getStatAverages(aggregatedStats, false);

        for (let i=0; i<STATS_BY_POSITION["CB"].length; i++){

            let stat = STATS_BY_POSITION["CB"][i];
            addToArray(PERCENTILE_DATA["CB"][stat], averageStats[stat]);

        }

    }

    populateZScoreInfo("CB", PERCENTILE_DATA["CB"]);

    await saveData(PERCENTILE_DATA["CB"], "CB");

};


let calculateGKStats = async () => {

    for (let i=0; i<GK_CODES.length; i++){

        let code = GK_CODES[i];
        let aggregatedStats = aggregateStats(PROCESSED[code]["stats"][SEASON]);

        let averageStats = utilities.getStatAverages(aggregatedStats, true);

        for (let i=0; i<STATS_BY_POSITION["GK"].length; i++){

            let stat = STATS_BY_POSITION["GK"][i];
            addToArray(PERCENTILE_DATA["GK"][stat], averageStats[stat]);

        }

    }

    populateZScoreInfo("GK", PERCENTILE_DATA["GK"]);

    await saveData(PERCENTILE_DATA["GK"], "GK");

};


let aggregateStats = (stats) => {

    let aggregatedStats = {};

    for (let competition in stats){
        for (let stat in stats[competition]){
            if (!(stat in aggregatedStats)){
                aggregatedStats[stat] = stats[competition][stat]
            }
            else {
                aggregatedStats[stat] += stats[competition][stat]
            }
        }
    }

    return aggregatedStats;

};


let addToArray = (array, value) => {

    if (isFinite(value)){
        array.push(value);
    }
    else {
        array.push(0)
    }

};


let populateZScoreInfo = (position, statDict) => {

    for (let stat in statDict){

        if (Z_SCORE_INFO[position][stat] === undefined){
            Z_SCORE_INFO[position][stat] = {};
        }

        Z_SCORE_INFO[position][stat]["mean"] = mean(statDict[stat]);
        Z_SCORE_INFO[position][stat]["stdDev"] = std(statDict[stat]);

    }

};


let saveData =  async (percentileData, position) => {

    let filePath;
    switch (position) {
        case "FW":
            filePath = `percentileData/${SEASON}/FWPercentiles.json`;
            break;
        case "AM":
            filePath = `percentileData/${SEASON}/AMPercentiles.json`;
            break;
        case "CM":
            filePath = `percentileData/${SEASON}/CMPercentiles.json`;
            break;
        case "FB":
            filePath = `percentileData/${SEASON}/FBPercentiles.json`;
            break;
        case "CB":
            filePath = `percentileData/${SEASON}/CBPercentiles.json`;
            break;
        case "GK":
            filePath = `percentileData/${SEASON}/GKPercentiles.json`;
            break;

    }

    //sort the arrays
    for (let array in percentileData){
        percentileData[array].sort(function(a, b){return a - b});
    }

    return new Promise(async function (resolve, reject) {
        await fs.writeFile(path.join(__dirname, filePath), JSON.stringify(percentileData, null, '\t'), function(err) {
            if (err) {
                console.log(err);
            }
            resolve();
        });
    });

};


let saveZScoreInfo = async () => {

    return new Promise(async function (resolve, reject) {
        await fs.writeFile(path.join(__dirname, `zScoreData/${SEASON}.json`), JSON.stringify(Z_SCORE_INFO, null, '\t'), function(err) {
            if (err) {
                console.log(err);
            }
            resolve();
        });
    });

};


console.time('percentile arrays filling');

setup()
    .then(async () => {
        await calculateFWStats();
        await calculateAMStats();
        await calculateCMStats();
        await calculateFBStats();
        await calculateCBStats();
        await calculateGKStats();
        await saveZScoreInfo();
    })
    .then(async () => {
        console.timeEnd('percentile arrays filling');
        process.exit(0);
    })
    .catch(async(anError) => {
        console.log(anError);
        process.exit(-1);
    });

