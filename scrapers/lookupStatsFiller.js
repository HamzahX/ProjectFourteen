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
    ALL_STATS = JSON.parse(fs.readFileSync(path.join(__dirname, '/referenceData/allStats.json')));
    STATS_BY_POSITION = JSON.parse(fs.readFileSync(path.join(__dirname, '/referenceData/statsByPosition.json')));

    for (let position in PERCENTILE_DATA){
        PERCENTILE_DATA[position] = JSON.parse(fs.readFileSync(path.join(__dirname, `/percentileData/${SEASON}/${position}Percentiles.json`)))
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
            ALL_STATS[stat]["ranges"][SEASON] = {
                "min": Infinity,
                "max": -Infinity
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

        if (PROCESSED[player]["lookupStats"]["rawStats"] === undefined){
            PROCESSED[player]["lookupStats"]["rawStats"] = {};
        }

        let rawStats = {};

        let aggregatedStats = aggregateStats(PROCESSED[player]["stats"][SEASON]);

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

        PROCESSED[player]["lookupStats"]["rawStats"][SEASON] = rawStats;

        for (let stat in rawStats){

            if (rawStats[stat] < ALL_STATS[stat]["ranges"][SEASON]["min"]){
                ALL_STATS[stat]["ranges"][SEASON]["min"] = rawStats[stat];
                ALL_STATS[stat]["ranges"][SEASON]["minName"] = PROCESSED[player]["name"];
            }

            if (rawStats[stat] > ALL_STATS[stat]["ranges"][SEASON]["max"]){
                ALL_STATS[stat]["ranges"][SEASON]["max"] = rawStats[stat];
                ALL_STATS[stat]["ranges"][SEASON]["maxName"] = PROCESSED[player]["name"];
            }

        }



    }

    //same as above but for season ages
    for (let player in PROCESSED){

        if (PROCESSED[player]["age"] < ALL_STATS["age"]["ranges"]["min"]){
            ALL_STATS["age"]["ranges"]["min"] = PROCESSED[player]["age"];
            ALL_STATS["age"]["ranges"]["minName"] = PROCESSED[player]["name"];
        }

        if (PROCESSED[player]["age"][SEASON] > ALL_STATS["age"]["ranges"]["max"]){
            ALL_STATS["age"]["ranges"]["max"] = PROCESSED[player]["age"];
            ALL_STATS["age"]["ranges"]["maxName"] = PROCESSED[player]["name"];
        }

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
        let rawStats = PROCESSED[player]["lookupStats"]["rawStats"][SEASON];

        if (rawStats === undefined){
            console.log(player);
        }

        for (let i=0; i<positions.length; i++){

            let position = positions[i];
            let percentileRanks = {};

            for (let i=0; i<STATS_BY_POSITION[position].length; i++){

                let stat = STATS_BY_POSITION[position][i];

                let playerValue = rawStats[stat];
                percentileRanks[stat] = percentileRank(PERCENTILE_DATA[position][stat], playerValue, 1) * 100;

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

