//initialize constants
const path = require('path');
const fs = require('fs');

const scriptName = path.basename(__filename);
const suppotedSeasons = ["18-19", "19-20", "20-21"];

var SEASON;
//parse command line arguments to get the season
let ARGS = process.argv.slice(2);
if (ARGS.length !== 1){
    console.log(`Incorrect number of args. Usage: node ${scriptName} <season>`);
    process.exit(-1);
}
else {
    if (!suppotedSeasons.includes(ARGS[0])){
        console.log("Incorrect season arg. Supported seasons are supportedSeason");
        process.exit(-1);
    }
    else {
        SEASON = ARGS[0];
    }
}

//globals
var PROCESSED;
var ALL_STATS;
var STATS_BY_POSITION;

var PERCENTILE_ARRAYS = {
    "FW": [],
    "AM": [],
    "CM": [],
    "FB": [],
    "CB": [],
    "GK": [],
};
var PERCENTILE_PLAYERS = {
    "FW": [],
    "AM": [],
    "CM": [],
    "FB": [],
    "CB": [],
    "GK": [],
};


let setup = async () => {

    PROCESSED = JSON.parse(fs.readFileSync(path.join(__dirname, '/playerData/processed.json')));
    ALL_STATS = JSON.parse(fs.readFileSync(path.join(__dirname, '/referenceData/allStats.json')));
    STATS_BY_POSITION = JSON.parse(fs.readFileSync(path.join(__dirname, '/referenceData/statsByPosition.json')));

    for (let position in PERCENTILE_ARRAYS){
        PERCENTILE_ARRAYS[position] = JSON.parse(fs.readFileSync(path.join(__dirname, `/percentileData/${SEASON}/${position}Percentiles.json`)));
        PERCENTILE_PLAYERS[position] = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/${position}PercentilePlayers.json`)))['codes'];
    }

};


let calculaterawStats = async () => {

    for (let stat in ALL_STATS){

        if (stat === "age"){
            ALL_STATS[stat]["ranges"] = {
                "min": Infinity,
                "max": -Infinity
            }
        }

        else {
            if (ALL_STATS[stat]["types"].includes("average")){
                ALL_STATS[stat]["ranges"][SEASON] = {
                    "min": Infinity,
                    "max": -Infinity
                }
            }
            if (ALL_STATS[stat]["types"].includes("aggregate")){
                ALL_STATS[stat]["ranges_agg"][SEASON] = {
                    "min": Infinity,
                    "max": -Infinity
                }
            }
        }

    }

    for (let player in PROCESSED){

        if (PROCESSED[player]["stats"][SEASON] === undefined){
            continue;
        }

        if (PROCESSED[player]["lookupStats"] === undefined){
            PROCESSED[player]["lookupStats"] = {};
        }

        if (PROCESSED[player]["lookupStats"]["aggregateStats"] === undefined){
            PROCESSED[player]["lookupStats"]["aggregateStats"] = {};
        }

        if (PROCESSED[player]["lookupStats"]["rawStats"] === undefined){
            PROCESSED[player]["lookupStats"]["rawStats"] = {};
        }

        let aggregatedStats = aggregateStats(PROCESSED[player]["stats"][SEASON]);

        let rawStats = {};
        rawStats["minutes"] = aggregatedStats["minutes"];

        if (PROCESSED[player]["positions"][SEASON].includes("GK") && PROCESSED[player]["outfieldGKStats"] === undefined)
        {
            rawStats["gsaa"] = returnFinite(((aggregatedStats["psxg"] - aggregatedStats["goalsAgainst"]) / aggregatedStats["sota"]) * 100);
            rawStats["crossStopRate"] = returnFinite((aggregatedStats["stoppedCrosses"] / aggregatedStats["attCrosses"]) * 100);
            rawStats["launchedPassSuccRate"] = returnFinite((aggregatedStats["succLaunchedPasses"] / aggregatedStats["attLaunchedPasses"]) * 100);
        }
        else {

            let minutesOverNinety = aggregatedStats["minutes"] / 90;
            let touchesOverHundred = aggregatedStats["touches"] / 100;

            rawStats["npg"] = returnFinite(aggregatedStats["npg"] / minutesOverNinety);
            rawStats["npxg"] = returnFinite(aggregatedStats["npxg"] / minutesOverNinety);
            rawStats["npxgPerShot"] = returnFinite(aggregatedStats["npxg"] / aggregatedStats["shots"]);

            rawStats["succAerials"] = returnFinite(aggregatedStats["succAerials"] / minutesOverNinety);
            rawStats["aerialSuccRate"] = returnFinite((aggregatedStats["succAerials"] / aggregatedStats["attAerials"]) * 100);

            rawStats["boxTouches"] = returnFinite(aggregatedStats["boxTouches"] / minutesOverNinety);
            rawStats["padjBoxTouches"] = returnFinite(aggregatedStats["boxTouches"] / touchesOverHundred);

            rawStats["xa"] = returnFinite(aggregatedStats["xa"] / minutesOverNinety);
            rawStats["padjXA"] = returnFinite(aggregatedStats["xa"] / touchesOverHundred);

            rawStats["ppa"] = returnFinite(aggregatedStats["ppa"] / minutesOverNinety);
            rawStats["padjPPA"] = returnFinite(aggregatedStats["ppa"] / touchesOverHundred);

            rawStats["succDribbles"] = returnFinite(aggregatedStats["succDribbles"] / minutesOverNinety);
            rawStats["padjSuccDribbles"] = returnFinite(aggregatedStats["succDribbles"] / touchesOverHundred);
            rawStats["dribbleSuccRate"] = returnFinite((aggregatedStats["succDribbles"] / aggregatedStats["attDribbles"]) * 100);

            rawStats["turnovers"] = returnFinite((aggregatedStats["timesDispossessed"] + aggregatedStats["miscontrols"]) / minutesOverNinety);
            rawStats["padjTurnovers"] = returnFinite((aggregatedStats["timesDispossessed"] + aggregatedStats["miscontrols"]) / touchesOverHundred);

            rawStats["succPressures"] = returnFinite(aggregatedStats["succPressures"] / minutesOverNinety);
            rawStats["padjSuccPressures"] = returnFinite(aggregatedStats["padjSuccPressures"] / minutesOverNinety);

            rawStats["sca"] = returnFinite(aggregatedStats["sca"] / minutesOverNinety);
            rawStats["padjSCA"] = returnFinite(aggregatedStats["sca"] / touchesOverHundred);

            rawStats["progDistance"] = returnFinite(aggregatedStats["progDistance"] / minutesOverNinety);
            rawStats["padjProgDistance"] = returnFinite(aggregatedStats["progDistance"] / touchesOverHundred);

            rawStats["passSuccRate"] = returnFinite((aggregatedStats["succPasses"] / aggregatedStats["attPasses"]) * 100);

            rawStats["pft"] = returnFinite(aggregatedStats["pft"] / minutesOverNinety);
            rawStats["padjPFT"] = returnFinite(aggregatedStats["pft"] / touchesOverHundred);

            rawStats["interceptions"] = returnFinite(aggregatedStats["interceptions"] / minutesOverNinety);
            rawStats["padjInterceptions"] = returnFinite(aggregatedStats["padjInterceptions"] / minutesOverNinety);

            rawStats["succTackles"] = returnFinite(aggregatedStats["succTackles"] / minutesOverNinety);
            rawStats["padjSuccTackles"] = returnFinite(aggregatedStats["padjSuccTackles"] / minutesOverNinety);
            rawStats["dribbleTackleRate"] = returnFinite((aggregatedStats["succDribbleTackles"] / aggregatedStats["attDribbleTackles"]) * 100);

            rawStats["longPassSuccRate"] = returnFinite((aggregatedStats["succLongPasses"] / aggregatedStats["attLongPasses"]) * 100);

            rawStats["fouls"] = returnFinite(aggregatedStats["fouls"] / minutesOverNinety);
            rawStats["padjFouls"] = returnFinite(aggregatedStats["padjFouls"] / minutesOverNinety);

            rawStats["clearances"] = returnFinite(aggregatedStats["clearances"] / minutesOverNinety);
            rawStats["padjClearances"] = returnFinite(aggregatedStats["padjClearances"] / minutesOverNinety);

        }

        for (let stat in rawStats){

            let precision = ALL_STATS[stat]["precision"];

            rawStats[stat] = truncateNum(rawStats[stat], precision);

            if (stat === "npxgPerShot" && aggregatedStats["shots"] < 20){
                continue;
            }
            else if (stat === "aerialSuccRate" && aggregatedStats["attAerials"] < 10){
                continue;
            }
            else if (stat === "dribbleSuccRate" && aggregatedStats["attDribbles"] < 10){
                continue;
            }
            else if (stat === "passSuccRate" && aggregatedStats["attPasses"] < 50){
                continue;
            }
            else if (stat === "dribbleTackleRate" && aggregatedStats["attDribbleTackles"] < 10){
                continue;
            }
            else if (stat === "longPassSuccRate" && aggregatedStats["attLongPasses"] < 25){
                continue;
            }
            else if (stat === "gsaa" && aggregatedStats["sota"] < 10){
                continue;
            }
            else if (stat === "crossStopRate" && aggregatedStats["attCrosses"] < 10){
                continue;
            }
            else if (stat === "launchedPassSuccRate" && aggregatedStats["attLaunchedPasses"] < 10){
                continue;
            }
            else if (stat !== "minutes" && rawStats["minutes"] < 400){
                continue;
            }

            let step = ALL_STATS[stat]["step"];

            let potentialMin = truncateNum(Math.floor(rawStats[stat]/step) * step, precision);
            let potentialMax = truncateNum(Math.ceil(rawStats[stat]/step) * step, precision);

            if ((stat === "gsaa" || rawStats[stat] >= 0) && potentialMin < ALL_STATS[stat]["ranges"][SEASON]["min"]){
                ALL_STATS[stat]["ranges"][SEASON]["min"] = potentialMin;
                ALL_STATS[stat]["ranges"][SEASON]["minName"] = PROCESSED[player]["name"];
            }

            if (potentialMax > ALL_STATS[stat]["ranges"][SEASON]["max"]){
                ALL_STATS[stat]["ranges"][SEASON]["max"] = potentialMax;
                ALL_STATS[stat]["ranges"][SEASON]["maxName"] = PROCESSED[player]["name"];
            }

        }

        for (let stat in aggregatedStats){

            if (ALL_STATS[stat] === undefined){
                continue;
            }

            let step = ALL_STATS[stat]["step_agg"];

            let potentialMin = Math.floor(aggregatedStats[stat]/step) * step;
            let potentialMax = Math.ceil(aggregatedStats[stat]/step) * step;

            if (aggregatedStats[stat] >= 0 && potentialMin < ALL_STATS[stat]["ranges_agg"][SEASON]["min"]){
                ALL_STATS[stat]["ranges_agg"][SEASON]["min"] = potentialMin;
                ALL_STATS[stat]["ranges_agg"][SEASON]["minName"] = PROCESSED[player]["name"];
            }

            if (potentialMax > ALL_STATS[stat]["ranges_agg"][SEASON]["max"]){
                ALL_STATS[stat]["ranges_agg"][SEASON]["max"] = potentialMax;
                ALL_STATS[stat]["ranges_agg"][SEASON]["maxName"] = PROCESSED[player]["name"];
            }

        }

        PROCESSED[player]["lookupStats"]["rawStats"][SEASON] = rawStats;
        PROCESSED[player]["lookupStats"]["aggregateStats"][SEASON] = aggregatedStats;

    }

    //same as above but for season ages
    for (let player in PROCESSED){

        if (PROCESSED[player]["age"] < ALL_STATS["age"]["ranges"]["min"]){
            ALL_STATS["age"]["ranges"]["min"] = PROCESSED[player]["age"];
            ALL_STATS["age"]["ranges"]["minName"] = PROCESSED[player]["name"];
        }

        if (PROCESSED[player]["age"] > ALL_STATS["age"]["ranges"]["max"]){
            ALL_STATS["age"]["ranges"]["max"] = PROCESSED[player]["age"];
            ALL_STATS["age"]["ranges"]["maxName"] = PROCESSED[player]["name"];
        }

    }

};


let calculatePercentileRanks = async () => {

    for (let player in PROCESSED){

        if (PROCESSED[player]["positions"][SEASON] === undefined || PROCESSED[player]["positions"][SEASON][0] === "N/A"){
            continue;
        }

        if (PROCESSED[player]["lookupStats"]["percentileRanks"] === undefined){
            PROCESSED[player]["lookupStats"]["percentileRanks"] = {};
        }

        if (PROCESSED[player]["lookupStats"]["percentileRanks"][SEASON] === undefined){
            PROCESSED[player]["lookupStats"]["percentileRanks"][SEASON] = {};
        }

        let positions = PROCESSED[player]["positions"][SEASON];
        let rawStats = PROCESSED[player]["lookupStats"]["rawStats"][SEASON];

        if (rawStats === undefined){
            console.log(player);
            continue;
        }

        for (let i=0; i<positions.length; i++){

            let position = positions[i];
            let percentileRanks = {};

            let isInPercentileArrays = PERCENTILE_PLAYERS[position].includes(player);
            let numOccurences = isInPercentileArrays ? 1 : 0;

            for (let i=0; i<STATS_BY_POSITION[position].length; i++){

                let stat = STATS_BY_POSITION[position][i];

                let playerValue = rawStats[stat];

                let percentileRank = calculatePercentileRank(PERCENTILE_ARRAYS[position][stat], playerValue, numOccurences) * 100;
                percentileRanks[stat] = truncateNum(percentileRank, 0);

                //reverse percentile ranks for "less is better" stats
                if (stat === "padjFouls" ||
                    stat === "fouls" ||
                    stat === "turnovers" ||
                    stat === "padjTurnovers"
                ) {
                    percentileRanks[stat] = 100 - percentileRanks[stat];
                }

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


let truncateNum = (value, precision) => {

    return parseFloat(Math.round(value * (10**precision)) / (10**precision).toFixed(precision));

};


function calculatePercentileRank(array, value, occurrences){

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
            return i / length;
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
            await fs.writeFile(path.join(__dirname, `referenceData/allStats.json`), JSON.stringify(ALL_STATS, null, '\t'), async function(err) {
                if (err) {
                    console.log(err);
                    reject();
                }
                resolve();
            });
        });
    });

};


console.time('look-up stats filling');

setup()
    .then(async () => {
        await calculaterawStats()
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

