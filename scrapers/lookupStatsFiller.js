var SEASON;
//parse command line arguments to get the season
let ARGS = process.argv.slice(2);
if (ARGS.length !== 1){
    console.log("Incorrect number of args. Usage: node lookupStatsFiller <season>");
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

//globals
var PROCESSED;
var STATS_BY_POSITION;

var PERCENTILE_DATA = {
    "FW": {},
    "AM": {},
    "CM": {},
    "FB": {},
    "CB": {},
    "GK": {},
};


let setup = async () => {

    PROCESSED = JSON.parse(fs.readFileSync(path.join(__dirname, '/playerData/processed.json')));
    STATS_BY_POSITION = JSON.parse(fs.readFileSync(path.join(__dirname, '../client/src/App/assets/constants/statsByPosition.json')))

    for (let position in PERCENTILE_DATA){
        PERCENTILE_DATA[position] = JSON.parse(fs.readFileSync(path.join(__dirname, `/percentileData/${SEASON}/${position}Percentiles.json`)))
    }

};


let calculateProcessedStats = async () => {

    for (let player in PROCESSED){

        if (PROCESSED[player]["stats"][SEASON] === undefined){
            continue;
        }

        if (PROCESSED[player]["lookupStats"] === undefined){
            PROCESSED[player]["lookupStats"] = {};
        }

        if (PROCESSED[player]["lookupStats"]["processedStats"] === undefined){
            PROCESSED[player]["lookupStats"]["processedStats"] = {};
        }

        let processedStats = {};

        let aggregatedStats = aggregateStats(PROCESSED[player]["stats"][SEASON]);

        let minutesOverNinety = aggregatedStats["minutes"] / 90;
        let touchesOverHundred = aggregatedStats["touches"] / 100;

        processedStats["npg"] = returnFinite(aggregatedStats["npg"] / minutesOverNinety);
        processedStats["npxg"] = returnFinite(aggregatedStats["npxg"] / minutesOverNinety);
        processedStats["npxgPerShot"] = returnFinite(aggregatedStats["npxg"] / aggregatedStats["shots"]);
        processedStats["succAerials"] = returnFinite(aggregatedStats["succAerials"] / minutesOverNinety);
        processedStats["aerialSuccRate"] = returnFinite((aggregatedStats["succAerials"] / aggregatedStats["attAerials"]) * 100);

        processedStats["boxTouches"] = returnFinite(aggregatedStats["boxTouches"] / minutesOverNinety);
        processedStats["padjBoxTouches"] = returnFinite(aggregatedStats["boxTouches"] / touchesOverHundred);

        processedStats["xa"] = returnFinite(aggregatedStats["xa"] / minutesOverNinety);
        processedStats["padjXA"] = returnFinite(aggregatedStats["xa"] / touchesOverHundred);

        processedStats["ppa"] = returnFinite(aggregatedStats["ppa"] / minutesOverNinety);
        processedStats["padjPPA"] = returnFinite(aggregatedStats["ppa"] / touchesOverHundred);

        processedStats["succDribbles"] = returnFinite(aggregatedStats["succDribbles"] / minutesOverNinety);
        processedStats["padjSuccDribbles"] = returnFinite(aggregatedStats["succDribbles"] / touchesOverHundred);
        processedStats["dribbleSuccRate"] = returnFinite((aggregatedStats["succDribbles"] / aggregatedStats["attDribbles"]) * 100);

        processedStats["turnovers"] = returnFinite((aggregatedStats["timesDispossessed"] + aggregatedStats["miscontrols"]) / minutesOverNinety);
        processedStats["padjTurnovers"] = returnFinite((aggregatedStats["timesDispossessed"] + aggregatedStats["miscontrols"]) / touchesOverHundred);

        processedStats["succPressures"] = returnFinite(aggregatedStats["succPressures"] / minutesOverNinety);
        processedStats["padjSuccPressures"] = returnFinite(aggregatedStats["padjSuccPressures"] / minutesOverNinety);

        processedStats["sca"] = returnFinite(aggregatedStats["sca"] / minutesOverNinety);
        processedStats["padjSCA"] = returnFinite(aggregatedStats["sca"] / touchesOverHundred);

        processedStats["ppa"] = returnFinite(aggregatedStats["ppa"] / minutesOverNinety);
        processedStats["padjPPA"] = returnFinite(aggregatedStats["ppa"] / touchesOverHundred);

        processedStats["progDistance"] = returnFinite(aggregatedStats["progDistance"] / minutesOverNinety);
        processedStats["padjProgDistance"] = returnFinite(aggregatedStats["progDistance"] / touchesOverHundred);

        processedStats["passSuccRate"] = returnFinite((aggregatedStats["succPasses"] / aggregatedStats["attPasses"]) * 100);

        processedStats["pft"] = returnFinite(aggregatedStats["pft"] / minutesOverNinety);
        processedStats["padjPFT"] = returnFinite(aggregatedStats["pft"] / touchesOverHundred);

        processedStats["succTackles"] = returnFinite(aggregatedStats["succTackles"] / minutesOverNinety);
        processedStats["padjSuccTackles"] = returnFinite(aggregatedStats["padjSuccTackles"] / minutesOverNinety);
        processedStats["dribbleTackleRate"] = returnFinite((aggregatedStats["succDribbleTackles"] / aggregatedStats["attDribbleTackles"]) * 100);

        processedStats["longPassSuccRate"] = returnFinite((aggregatedStats["succLongPasses"] / aggregatedStats["attLongPasses"]) * 100);

        processedStats["fouls"] = returnFinite(aggregatedStats["fouls"] / minutesOverNinety);
        processedStats["padjFouls"] = returnFinite(aggregatedStats["padjFouls"] / minutesOverNinety);

        processedStats["succAerials"] = returnFinite(aggregatedStats["succAerials"] / minutesOverNinety);
        processedStats["aerialSuccRate"] = returnFinite((aggregatedStats["succAerials"] / aggregatedStats["attAerials"]) * 100);

        processedStats["clearances"] = returnFinite(aggregatedStats["clearances"] / minutesOverNinety);
        processedStats["padjClearances"] = returnFinite(aggregatedStats["padjClearances"] / minutesOverNinety);

        PROCESSED[player]["lookupStats"]["processedStats"][SEASON] = processedStats;
    }

};


let calculatePercentileRanks = async () => {

    for (let player in PROCESSED){

        if (PROCESSED[player]["percentileEntries"][SEASON] === undefined || PROCESSED[player]["percentileEntries"][SEASON].length === 0){
            continue;
        }

        if (PROCESSED[player]["lookupStats"]["percentileRanks"] === undefined){
            PROCESSED[player]["lookupStats"]["percentileRanks"] = {};
        }

        if (PROCESSED[player]["lookupStats"]["percentileRanks"][SEASON] === undefined){
            PROCESSED[player]["lookupStats"]["percentileRanks"][SEASON] = {};
        }

        let positions = PROCESSED[player]["percentileEntries"][SEASON];
        let processedStats = PROCESSED[player]["lookupStats"]["processedStats"][SEASON];

        for (let i=0; i<positions.length; i++){

            let position = positions[i];
            let percentileRanks = {};

            for (let i=0; i<STATS_BY_POSITION[position].length; i++){

                let stat = STATS_BY_POSITION[position][i];

                let playerValue = processedStats[stat];
                percentileRanks[stat] = percentileRank(PERCENTILE_DATA[position][stat], playerValue, 1) * 100;

            }

            PROCESSED[player]["lookupStats"]["percentileRanks"][SEASON][position] = percentileRanks;

        }

    }

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


let returnFinite = (value) => {

    if (!isFinite(value)){
        value = 0;
    }

    return value

};


function percentileRank(array, value, occurrences){

    //taken from: https://gist.github.com/IceCreamYou/6ffa1b18c4c8f6aeaad2
    if (!isFinite(value)){
        value = 0;
    }
    for (let i = 0, length = array.length; i < length; i++) {
        if (value < array[i]) {
            while (i < length && value === array[i]) i++;
            if (i === 0) return 0;
            if (value !== array[i-1]) {
                i += (value - array[i-1]) / (array[i] - array[i-1]);
            }
            //adjust the returned percentile by disregarding the entries that belong to the player
            return (i / length) - (occurrences/array.length);
        }
    }
    return 1;

}


let saveStats = async () => {

    return new Promise(async function (resolve, reject) {
        await fs.writeFile(path.join(__dirname, `playerData/processed.json`), JSON.stringify(PROCESSED, null, '\t'), async function(err) {
            if (err) {
                console.log(err);
                reject();
            }
            resolve();
        });
    });

};


console.time('look-up stats filling');

setup()
    .then(async () => {
        await calculateProcessedStats()
    })
    .then(async () => {
        await calculatePercentileRanks()
    })
    .then(async () => {
        await saveStats();
    })
    .then(async () => {
        console.timeEnd('look-up stats filling');
        process.exit(0);
    })
    .catch(async(anError) => {
        console.log(anError);
        process.exit(-1);
    });

