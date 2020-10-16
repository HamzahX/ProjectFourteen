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
    STATS_BY_POSITION = JSON.parse(fs.readFileSync(path.join(__dirname, '../client/src/App/assets/text/statsByPosition.json')));

    for (let position in PERCENTILE_DATA){
        PERCENTILE_DATA[position] = JSON.parse(fs.readFileSync(path.join(__dirname, `/percentileData/${SEASON}/${position}Percentiles.json`)))
    }

};


let calculateProcessedStats = async () => {

    for (let player in PROCESSED){

        let processedStats = {};

        let aggregatedStats = aggregateStats(PROCESSED[player]["stats"][SEASON]);

        let minutesOverNinety = aggregatedStats["minutes"] / 90;
        let touchesOverHundred = aggregatedStats["touches"] / 100;

        addToStatsObject(processedStats["npg"], (aggregatedStats["npg"] / minutesOverNinety));
        addToStatsObject(processedStats["npxg"], (aggregatedStats["npxg"] / minutesOverNinety));
        addToStatsObject(processedStats["npxgPerShot"], (aggregatedStats["npxg"] / aggregatedStats["shots"]));
        addToStatsObject(processedStats["succAerials"], (aggregatedStats["succAerials"] / minutesOverNinety));
        addToStatsObject(processedStats["aerialSuccRate"], ((aggregatedStats["succAerials"] / aggregatedStats["attAerials"]) * 100));

        addToStatsObject(processedStats["boxTouches"], (aggregatedStats["boxTouches"] / minutesOverNinety));
        addToStatsObject(processedStats["padjBoxTouches"], (aggregatedStats["boxTouches"] / touchesOverHundred));

        addToStatsObject(processedStats["xa"], (aggregatedStats["xa"] / minutesOverNinety));
        addToStatsObject(processedStats["padjXA"], (aggregatedStats["xa"] / touchesOverHundred));

        addToStatsObject(processedStats["ppa"], (aggregatedStats["ppa"] / minutesOverNinety));
        addToStatsObject(processedStats["padjPPA"], (aggregatedStats["ppa"] / touchesOverHundred));

        addToStatsObject(processedStats["succDribbles"], (aggregatedStats["succDribbles"] / minutesOverNinety));
        addToStatsObject(processedStats["padjSuccDribbles"], (aggregatedStats["succDribbles"] / touchesOverHundred));
        addToStatsObject(processedStats["dribbleSuccRate"], ((aggregatedStats["succDribbles"] / aggregatedStats["attDribbles"]) * 100));

        addToStatsObject(processedStats["turnovers"], ((aggregatedStats["timesDispossessed"] + aggregatedStats["miscontrols"]) / minutesOverNinety));
        addToStatsObject(processedStats["padjTurnovers"], ((aggregatedStats["timesDispossessed"] + aggregatedStats["miscontrols"]) / touchesOverHundred));

        addToStatsObject(processedStats["succPressures"], (aggregatedStats["succPressures"] / minutesOverNinety));
        addToStatsObject(processedStats["padjSuccPressures"], (aggregatedStats["padjSuccPressures"] / minutesOverNinety));

        addToStatsObject(processedStats["sca"], (aggregatedStats["sca"] / minutesOverNinety));
        addToStatsObject(processedStats["padjSCA"], (aggregatedStats["sca"] / touchesOverHundred));

        addToStatsObject(processedStats["ppa"], (aggregatedStats["ppa"] / minutesOverNinety));
        addToStatsObject(processedStats["padjPPA"], (aggregatedStats["ppa"] / touchesOverHundred));

        addToStatsObject(processedStats["progDistance"], (aggregatedStats["progDistance"] / minutesOverNinety));
        addToStatsObject(processedStats["padjProgDistance"], (aggregatedStats["progDistance"] / touchesOverHundred));

        addToStatsObject(processedStats["passSuccRate"], ((aggregatedStats["succPasses"] / aggregatedStats["attPasses"]) * 100));

        addToStatsObject(processedStats["pft"], (aggregatedStats["pft"] / minutesOverNinety));
        addToStatsObject(processedStats["padjPFT"], (aggregatedStats["pft"] / touchesOverHundred));

        addToStatsObject(processedStats["succTackles"], (aggregatedStats["succTackles"] / minutesOverNinety));
        addToStatsObject(processedStats["padjSuccTackles"], (aggregatedStats["padjSuccTackles"] / minutesOverNinety));
        addToStatsObject(processedStats["dribbleTackleRate"], ((aggregatedStats["succDribbleTackles"] / aggregatedStats["attDribbleTackles"]) * 100));

        addToStatsObject(processedStats["longPassSuccRate"], ((aggregatedStats["succLongPasses"] / aggregatedStats["attLongPasses"]) * 100));

        addToStatsObject(processedStats["fouls"], (aggregatedStats["fouls"] / minutesOverNinety));
        addToStatsObject(processedStats["padjFouls"], (aggregatedStats["padjFouls"] / minutesOverNinety));

        addToStatsObject(processedStats["succAerials"], (aggregatedStats["succAerials"] / minutesOverNinety));
        addToStatsObject(processedStats["aerialSuccRate"], ((aggregatedStats["succAerials"] / aggregatedStats["attAerials"]) * 100));

        addToStatsObject(processedStats["clearances"], (aggregatedStats["clearances"] / minutesOverNinety));
        addToStatsObject(processedStats["padjClearances"], (aggregatedStats["padjClearances"] / minutesOverNinety));

        PROCESSED[player]["processedStats"][SEASON] = processedStats;
    }

};


let calculatePercentileRanks = async () => {

    for (let player in PROCESSED){

        let positions = PROCESSED[player]["percentileEntries"][SEASON];
        for (let position in positions){



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


let addToStatsObject = (key, value) => {

    if (isFinite(value)){
        key = value;
    }
    else {
        key = 0;
    }

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


console.time('percentiles generation');

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
        console.timeEnd('percentiles generation');
        process.exit(0);
    })
    .catch(async(anError) => {
        console.log(anError);
        process.exit(-1);
    });

