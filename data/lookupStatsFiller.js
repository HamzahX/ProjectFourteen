//initialize constants
const path = require('path');
const fs = require('fs');

const scriptName = path.basename(__filename);
const supportedSeasons = ["18-19", "19-20", "20-21"];

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


let calculateAverageStats = async () => {

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
        if (PROCESSED[player]["lookupStats"]["averageStats"] === undefined){
            PROCESSED[player]["lookupStats"]["averageStats"] = {};
        }

        //all comps
        let aggregatedStats_allComps = aggregateStats(PROCESSED[player]["stats"][SEASON]);
        PROCESSED[player]["lookupStats"]["averageStats"][SEASON] = {};
        PROCESSED[player]["lookupStats"]["averageStats"][SEASON]["allComps"] = temp_average(player, aggregatedStats_allComps);

        for (let stat in aggregatedStats_allComps){
            aggregatedStats_allComps[stat] = truncateNum(aggregatedStats_allComps[stat], 1);
        }

        PROCESSED[player]["lookupStats"]["aggregateStats"][SEASON] = {};
        PROCESSED[player]["lookupStats"]["aggregateStats"][SEASON]["allComps"] = aggregatedStats_allComps;

        //league only
        let aggregatedStats_league = aggregateStats(PROCESSED[player]["stats"][SEASON], false);
        PROCESSED[player]["lookupStats"]["averageStats"][SEASON]["league"] = temp_average(player, aggregatedStats_league);

        for (let stat in aggregatedStats_league){
            aggregatedStats_league[stat] = truncateNum(aggregatedStats_league[stat], 1);
        }

        PROCESSED[player]["lookupStats"]["aggregateStats"][SEASON]["league"] = aggregatedStats_league;

    }

    //set age ranges
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


let temp_average = (player, aggregatedStats) => {

    let averageStats = {};
    averageStats["minutes"] = aggregatedStats["minutes"];

    if (PROCESSED[player]["positions"][SEASON].includes("GK") && PROCESSED[player]["outfieldGKStats"] === undefined)
    {
        averageStats["gsaa"] = returnFinite(((aggregatedStats["psxg"] - aggregatedStats["goalsAgainst"]) / aggregatedStats["sota"]) * 100);
        averageStats["crossStopRate"] = returnFinite((aggregatedStats["stoppedCrosses"] / aggregatedStats["attCrosses"]) * 100);
        averageStats["launchedPassSuccRate"] = returnFinite((aggregatedStats["succLaunchedPasses"] / aggregatedStats["attLaunchedPasses"]) * 100);
    }
    else {

        let minutesOverNinety = aggregatedStats["minutes"] / 90;
        let touchesOverHundred = aggregatedStats["touches"] / 100;

        averageStats["npg"] = returnFinite(aggregatedStats["npg"] / minutesOverNinety);
        averageStats["npxg"] = returnFinite(aggregatedStats["npxg"] / minutesOverNinety);
        averageStats["npxgPerShot"] = returnFinite(aggregatedStats["npxg"] / aggregatedStats["shots"]);

        averageStats["succAerials"] = returnFinite(aggregatedStats["succAerials"] / minutesOverNinety);
        averageStats["aerialSuccRate"] = returnFinite((aggregatedStats["succAerials"] / aggregatedStats["attAerials"]) * 100);

        averageStats["boxTouches"] = returnFinite(aggregatedStats["boxTouches"] / minutesOverNinety);
        averageStats["padjBoxTouches"] = returnFinite(aggregatedStats["boxTouches"] / touchesOverHundred);

        averageStats["xa"] = returnFinite(aggregatedStats["xa"] / minutesOverNinety);
        averageStats["padjXA"] = returnFinite(aggregatedStats["xa"] / touchesOverHundred);

        averageStats["ppa"] = returnFinite(aggregatedStats["ppa"] / minutesOverNinety);
        averageStats["padjPPA"] = returnFinite(aggregatedStats["ppa"] / touchesOverHundred);

        averageStats["succDribbles"] = returnFinite(aggregatedStats["succDribbles"] / minutesOverNinety);
        averageStats["padjSuccDribbles"] = returnFinite(aggregatedStats["succDribbles"] / touchesOverHundred);
        averageStats["dribbleSuccRate"] = returnFinite((aggregatedStats["succDribbles"] / aggregatedStats["attDribbles"]) * 100);

        averageStats["turnovers"] = returnFinite((aggregatedStats["timesDispossessed"] + aggregatedStats["miscontrols"]) / minutesOverNinety);
        averageStats["padjTurnovers"] = returnFinite((aggregatedStats["timesDispossessed"] + aggregatedStats["miscontrols"]) / touchesOverHundred);

        averageStats["succPressures"] = returnFinite(aggregatedStats["succPressures"] / minutesOverNinety);
        averageStats["padjSuccPressures"] = returnFinite(aggregatedStats["padjSuccPressures"] / minutesOverNinety);

        averageStats["sca"] = returnFinite(aggregatedStats["sca"] / minutesOverNinety);
        averageStats["padjSCA"] = returnFinite(aggregatedStats["sca"] / touchesOverHundred);

        averageStats["progDistance"] = returnFinite(aggregatedStats["progDistance"] / minutesOverNinety);
        averageStats["padjProgDistance"] = returnFinite(aggregatedStats["progDistance"] / touchesOverHundred);

        averageStats["passSuccRate"] = returnFinite((aggregatedStats["succPasses"] / aggregatedStats["attPasses"]) * 100);

        averageStats["pft"] = returnFinite(aggregatedStats["pft"] / minutesOverNinety);
        averageStats["padjPFT"] = returnFinite(aggregatedStats["pft"] / touchesOverHundred);

        averageStats["interceptions"] = returnFinite(aggregatedStats["interceptions"] / minutesOverNinety);
        averageStats["padjInterceptions"] = returnFinite(aggregatedStats["padjInterceptions"] / minutesOverNinety);

        averageStats["succTackles"] = returnFinite(aggregatedStats["succTackles"] / minutesOverNinety);
        averageStats["padjSuccTackles"] = returnFinite(aggregatedStats["padjSuccTackles"] / minutesOverNinety);
        averageStats["dribbleTackleRate"] = returnFinite((aggregatedStats["succDribbleTackles"] / aggregatedStats["attDribbleTackles"]) * 100);

        averageStats["longPassSuccRate"] = returnFinite((aggregatedStats["succLongPasses"] / aggregatedStats["attLongPasses"]) * 100);

        averageStats["fouls"] = returnFinite(aggregatedStats["fouls"] / minutesOverNinety);
        averageStats["padjFouls"] = returnFinite(aggregatedStats["padjFouls"] / minutesOverNinety);

        averageStats["clearances"] = returnFinite(aggregatedStats["clearances"] / minutesOverNinety);
        averageStats["padjClearances"] = returnFinite(aggregatedStats["padjClearances"] / minutesOverNinety);

    }

    for (let stat in averageStats){

        let precision = ALL_STATS[stat]["precision"];

        averageStats[stat] = truncateNum(averageStats[stat], precision);

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
        else if (stat !== "minutes" && averageStats["minutes"] < 400){
            continue;
        }

        let step = ALL_STATS[stat]["step"];

        let potentialMin = truncateNum(Math.floor(averageStats[stat]/step) * step, precision);
        let potentialMax = truncateNum(Math.ceil(averageStats[stat]/step) * step, precision);

        if ((stat === "gsaa" || averageStats[stat] >= 0) && potentialMin < ALL_STATS[stat]["ranges"][SEASON]["min"]){
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

    return averageStats;

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

        //occasionally some players have an appearance logged in whoscored but not in fbref.
        //no biggie, typically 1 minute appearances and such. we just skip.
        if (PROCESSED[player]["lookupStats"]["averageStats"][SEASON] === undefined){
            continue;
        }

        let averageStats_allComps = PROCESSED[player]["lookupStats"]["averageStats"][SEASON]["allComps"];
        let averageStats_league = PROCESSED[player]["lookupStats"]["averageStats"][SEASON]["league"];

        if (PROCESSED[player]["lookupStats"]["percentileRanks"][SEASON]["allComps"] === undefined) {

            PROCESSED[player]["lookupStats"]["percentileRanks"][SEASON]["allComps"] = {};
            PROCESSED[player]["lookupStats"]["percentileRanks"][SEASON]["league"] = {};
        }

        for (let i=0; i<positions.length; i++){

            let position = positions[i];
            PROCESSED[player]["lookupStats"]["percentileRanks"][SEASON]["allComps"][position] = temp_percentile(player, position, averageStats_allComps);
            PROCESSED[player]["lookupStats"]["percentileRanks"][SEASON]["league"][position] = temp_percentile(player, position, averageStats_league);

        }

    }

};


let temp_percentile = (player, position, averageStats) => {

    let percentileRanks = {};

    let isInPercentileArrays = PERCENTILE_PLAYERS[position].includes(player);
    let numOccurences = isInPercentileArrays ? 1 : 0;

    for (let i=0; i<STATS_BY_POSITION[position].length; i++){

        let stat = STATS_BY_POSITION[position][i];

        let playerValue = averageStats[stat];

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

    return percentileRanks;

};


let aggregateStats = (stats, includeEuropeanCompetitions = true) => {

    let aggregatedStats = {};

    for (let competition in stats){

        if (!includeEuropeanCompetitions && (competition.startsWith("Champions League") || competition.startsWith("Europa League")))
            continue;

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
        await calculateAverageStats()
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

