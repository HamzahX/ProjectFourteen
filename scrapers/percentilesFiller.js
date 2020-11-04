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

var FW_CODES;
var AM_CODES;
var CM_CODES;
var FB_CODES;
var CB_CODES;
var GK_CODES;

var FW_PERCENTILE_DATA;
var AM_PERCENTILE_DATA;
var CM_PERCENTILE_DATA;
var FB_PERCENTILE_DATA;
var CB_PERCENTILE_DATA;
var GK_PERCENTILE_DATA;


let setup = async () => {

    PROCESSED = JSON.parse(fs.readFileSync(path.join(__dirname, '/playerData/processed.json')));

    FW_CODES = JSON.parse(fs.readFileSync(path.join(__dirname, `positionData/${SEASON}/FWPlayers.json`)))["codes"];
    AM_CODES = JSON.parse(fs.readFileSync(path.join(__dirname, `positionData/${SEASON}/AMPlayers.json`)))["codes"];
    CM_CODES = JSON.parse(fs.readFileSync(path.join(__dirname, `positionData/${SEASON}/CMPlayers.json`)))["codes"];
    FB_CODES = JSON.parse(fs.readFileSync(path.join(__dirname, `positionData/${SEASON}/FBPlayers.json`)))["codes"];
    CB_CODES = JSON.parse(fs.readFileSync(path.join(__dirname, `positionData/${SEASON}/CBPlayers.json`)))["codes"];
    GK_CODES = JSON.parse(fs.readFileSync(path.join(__dirname, `positionData/${SEASON}/GKPlayers.json`)))["codes"];

    FW_PERCENTILE_DATA = {
        npg: [],
        npxg: [],
        npxgPerShot: [],
        succAerials: [],
        aerialSuccRate: [],
        boxTouches: [],
        padjBoxTouches: [],
        xa: [],
        padjXA: [],
        ppa: [],
        padjPPA: [],
        succDribbles: [],
        padjSuccDribbles: [],
        dribbleSuccRate: [],
        turnovers: [],
        padjTurnovers: [],
        succPressures: [],
        padjSuccPressures: []
    };

    AM_PERCENTILE_DATA = {
        npg: [],
        npxg: [],
        npxgPerShot: [],
        xa: [],
        padjXA: [],
        sca: [],
        padjSCA: [],
        ppa: [],
        padjPPA: [],
        progDistance: [],
        padjProgDistance: [],
        passSuccRate: [],
        succDribbles: [],
        padjSuccDribbles: [],
        dribbleSuccRate: [],
        turnovers: [],
        padjTurnovers: [],
        succPressures: [],
        padjSuccPressures: []
    };

    CM_PERCENTILE_DATA = {
        xa: [],
        padjXA: [],
        sca:[],
        padjSCA: [],
        pft: [],
        padjPFT: [],
        progDistance: [],
        padjProgDistance: [],
        passSuccRate: [],
        succDribbles: [],
        padjSuccDribbles: [],
        dribbleSuccRate: [],
        turnovers: [],
        padjTurnovers: [],
        succPressures: [],
        padjSuccPressures: [],
        interceptions: [],
        padjInterceptions: [],
        succTackles: [],
        padjSuccTackles: [],
        dribbleTackleRate: []
    };

    FB_PERCENTILE_DATA = {
        xa: [],
        padjXA: [],
        pft: [],
        padjPFT: [],
        progDistance: [],
        padjProgDistance: [],
        passSuccRate: [],
        succDribbles: [],
        padjSuccDribbles: [],
        dribbleSuccRate: [],
        turnovers: [],
        padjTurnovers: [],
        succPressures: [],
        padjSuccPressures: [],
        interceptions: [],
        padjInterceptions: [],
        succTackles: [],
        padjSuccTackles: [],
        dribbleTackleRate: [],
        aerialSuccRate: []
    };

    CB_PERCENTILE_DATA = {
        pft: [],
        padjPFT: [],
        progDistance: [],
        padjProgDistance: [],
        passSuccRate: [],
        longPassSuccRate: [],
        succPressures: [],
        padjSuccPressures: [],
        interceptions: [],
        padjInterceptions: [],
        succTackles: [],
        padjSuccTackles: [],
        dribbleTackleRate: [],
        fouls: [],
        padjFouls: [],
        succAerials: [],
        aerialSuccRate: [],
        clearances: [],
        padjClearances: []
    };

    GK_PERCENTILE_DATA = {
        gsaa: [],
        crossStopRate: [],
        launchedPassSuccRate: []
    };

};


let calculateFWStats = async () => {

    for (let i=0; i<FW_CODES.length; i++){

        let code = FW_CODES[i];
        let aggregatedStats = aggregateStats(PROCESSED[code]["stats"][SEASON]);
        let minutes = aggregatedStats["minutes"];
        let touches = aggregatedStats["touches"];

        addToArray(FW_PERCENTILE_DATA["npg"], (aggregatedStats["npg"] / (minutes/90)));
        addToArray(FW_PERCENTILE_DATA["npxg"], (aggregatedStats["npxg"] / (minutes/90)));
        addToArray(FW_PERCENTILE_DATA["npxgPerShot"], (aggregatedStats["npxg"] / aggregatedStats["shots"]));
        addToArray(FW_PERCENTILE_DATA["succAerials"], (aggregatedStats["succAerials"] / (minutes/90)));
        addToArray(FW_PERCENTILE_DATA["aerialSuccRate"], ((aggregatedStats["succAerials"] / aggregatedStats["attAerials"]) * 100));

        addToArray(FW_PERCENTILE_DATA["boxTouches"], (aggregatedStats["boxTouches"] / (minutes/90)));
        addToArray(FW_PERCENTILE_DATA["padjBoxTouches"], (aggregatedStats["boxTouches"] / (touches/100)));

        addToArray(FW_PERCENTILE_DATA["xa"], (aggregatedStats["xa"] / (minutes/90)));
        addToArray(FW_PERCENTILE_DATA["padjXA"], (aggregatedStats["xa"] / (touches/100)));

        addToArray(FW_PERCENTILE_DATA["ppa"], (aggregatedStats["ppa"] / (minutes/90)));
        addToArray(FW_PERCENTILE_DATA["padjPPA"], (aggregatedStats["ppa"] / (touches/100)));

        addToArray(FW_PERCENTILE_DATA["succDribbles"], (aggregatedStats["succDribbles"] / (minutes/90)));
        addToArray(FW_PERCENTILE_DATA["padjSuccDribbles"], (aggregatedStats["succDribbles"] / (touches/100)));
        addToArray(FW_PERCENTILE_DATA["dribbleSuccRate"], ((aggregatedStats["succDribbles"] / aggregatedStats["attDribbles"]) * 100));

        addToArray(FW_PERCENTILE_DATA["turnovers"], ((aggregatedStats["timesDispossessed"] + aggregatedStats["miscontrols"]) / (minutes/90)));
        addToArray(FW_PERCENTILE_DATA["padjTurnovers"], ((aggregatedStats["timesDispossessed"] + aggregatedStats["miscontrols"]) / (touches/100)));

        addToArray(FW_PERCENTILE_DATA["succPressures"], (aggregatedStats["succPressures"] / (minutes/90)));
        addToArray(FW_PERCENTILE_DATA["padjSuccPressures"], (aggregatedStats["padjSuccPressures"] / (minutes/90)));
    }

    await saveData(FW_PERCENTILE_DATA, "FW");

};


let calculateAMStats = async () => {

    for (let i=0; i<AM_CODES.length; i++){

        let code = AM_CODES[i];
        let aggregatedStats = aggregateStats(PROCESSED[code]["stats"][SEASON]);
        let minutes = aggregatedStats["minutes"];
        let touches = aggregatedStats["touches"];

        addToArray(AM_PERCENTILE_DATA["npg"], (aggregatedStats["npg"] / (minutes/90)));
        addToArray(AM_PERCENTILE_DATA["npxg"], (aggregatedStats["npxg"] / (minutes/90)));
        addToArray(AM_PERCENTILE_DATA["npxgPerShot"], (aggregatedStats["npxg"] / aggregatedStats["shots"]));

        addToArray(AM_PERCENTILE_DATA["xa"], (aggregatedStats["xa"] / (minutes/90)));
        addToArray(AM_PERCENTILE_DATA["padjXA"], (aggregatedStats["xa"] / (touches/100)));

        addToArray(AM_PERCENTILE_DATA["sca"], (aggregatedStats["sca"] / (minutes/90)));
        addToArray(AM_PERCENTILE_DATA["padjSCA"], (aggregatedStats["sca"] / (touches/100)));

        addToArray(AM_PERCENTILE_DATA["ppa"], (aggregatedStats["ppa"] / (minutes/90)));
        addToArray(AM_PERCENTILE_DATA["padjPPA"], (aggregatedStats["ppa"] / (touches/100)));

        addToArray(AM_PERCENTILE_DATA["progDistance"], (aggregatedStats["progDistance"] / (minutes/90)));
        addToArray(AM_PERCENTILE_DATA["padjProgDistance"], (aggregatedStats["progDistance"] / (touches/100)));

        addToArray(AM_PERCENTILE_DATA["passSuccRate"], ((aggregatedStats["succPasses"] / aggregatedStats["attPasses"]) * 100));

        addToArray(AM_PERCENTILE_DATA["succDribbles"], (aggregatedStats["succDribbles"] / (minutes/90)));
        addToArray(AM_PERCENTILE_DATA["padjSuccDribbles"], (aggregatedStats["succDribbles"] / (touches/100)));
        addToArray(AM_PERCENTILE_DATA["dribbleSuccRate"], ((aggregatedStats["succDribbles"] / aggregatedStats["attDribbles"]) * 100));

        addToArray(AM_PERCENTILE_DATA["turnovers"], ((aggregatedStats["timesDispossessed"] + aggregatedStats["miscontrols"]) / (minutes/90)));
        addToArray(AM_PERCENTILE_DATA["padjTurnovers"], ((aggregatedStats["timesDispossessed"] + aggregatedStats["miscontrols"]) / (touches/100)));

        addToArray(AM_PERCENTILE_DATA["succPressures"], (aggregatedStats["succPressures"] / (minutes/90)));
        addToArray(AM_PERCENTILE_DATA["padjSuccPressures"], (aggregatedStats["padjSuccPressures"] / (minutes/90)));

    }

    await saveData(AM_PERCENTILE_DATA, "AM");

};


let calculateCMStats = async () => {

    for (let i=0; i<CM_CODES.length; i++){

        let code = CM_CODES[i];
        let aggregatedStats = aggregateStats(PROCESSED[code]["stats"][SEASON]);
        let minutes = aggregatedStats["minutes"];
        let touches = aggregatedStats["touches"];

        addToArray(CM_PERCENTILE_DATA["xa"], (aggregatedStats["xa"] / (minutes/90)));
        addToArray(CM_PERCENTILE_DATA["padjXA"], (aggregatedStats["xa"] / (touches/100)));

        addToArray(CM_PERCENTILE_DATA["sca"], (aggregatedStats["sca"] / (minutes/90)));
        addToArray(CM_PERCENTILE_DATA["padjSCA"], (aggregatedStats["sca"] / (touches/100)));

        addToArray(CM_PERCENTILE_DATA["pft"], (aggregatedStats["pft"] / (minutes/90)));
        addToArray(CM_PERCENTILE_DATA["padjPFT"], (aggregatedStats["pft"] / (touches/100)));

        addToArray(CM_PERCENTILE_DATA["progDistance"], (aggregatedStats["progDistance"] / (minutes/90)));
        addToArray(CM_PERCENTILE_DATA["padjProgDistance"], (aggregatedStats["progDistance"] / (touches/100)));

        addToArray(CM_PERCENTILE_DATA["passSuccRate"], ((aggregatedStats["succPasses"] / aggregatedStats["attPasses"]) * 100));

        addToArray(CM_PERCENTILE_DATA["succDribbles"], (aggregatedStats["succDribbles"] / (minutes/90)));
        addToArray(CM_PERCENTILE_DATA["padjSuccDribbles"], (aggregatedStats["succDribbles"] / (touches/100)));
        addToArray(CM_PERCENTILE_DATA["dribbleSuccRate"], ((aggregatedStats["succDribbles"] / aggregatedStats["attDribbles"]) * 100));

        addToArray(CM_PERCENTILE_DATA["turnovers"], ((aggregatedStats["timesDispossessed"] + aggregatedStats["miscontrols"]) / (minutes/90)));
        addToArray(CM_PERCENTILE_DATA["padjTurnovers"], ((aggregatedStats["timesDispossessed"] + aggregatedStats["miscontrols"]) / (touches/100)));

        addToArray(CM_PERCENTILE_DATA["succPressures"], (aggregatedStats["succPressures"] / (minutes/90)));
        addToArray(CM_PERCENTILE_DATA["padjSuccPressures"], (aggregatedStats["padjSuccPressures"] / (minutes/90)));

        addToArray(CM_PERCENTILE_DATA["interceptions"], (aggregatedStats["interceptions"] / (minutes/90)));
        addToArray(CM_PERCENTILE_DATA["padjInterceptions"], (aggregatedStats["padjInterceptions"] / (minutes/90)));

        addToArray(CM_PERCENTILE_DATA["succTackles"], (aggregatedStats["succTackles"] / (minutes/90)));
        addToArray(CM_PERCENTILE_DATA["padjSuccTackles"], (aggregatedStats["padjSuccTackles"] / (minutes/90)));
        addToArray(CM_PERCENTILE_DATA["dribbleTackleRate"], ((aggregatedStats["succDribbleTackles"] / aggregatedStats["attDribbleTackles"]) * 100));

    }

    await saveData(CM_PERCENTILE_DATA, "CM");

};

let calculateFBStats = async () => {

    for (let i=0; i<FB_CODES.length; i++){

        let code = FB_CODES[i];

        if (PROCESSED[code] === undefined){
            console.log(code);
        }

        let aggregatedStats = aggregateStats(PROCESSED[code]["stats"][SEASON]);
        let minutes = aggregatedStats["minutes"];
        let touches = aggregatedStats["touches"];

        addToArray(FB_PERCENTILE_DATA["xa"], (aggregatedStats["xa"] / (minutes/90)));
        addToArray(FB_PERCENTILE_DATA["padjXA"], (aggregatedStats["xa"] / (touches/100)));

        addToArray(FB_PERCENTILE_DATA["pft"], (aggregatedStats["pft"] / (minutes/90)));
        addToArray(FB_PERCENTILE_DATA["padjPFT"], (aggregatedStats["pft"] / (touches/100)));

        addToArray(FB_PERCENTILE_DATA["progDistance"], (aggregatedStats["progDistance"] / (minutes/90)));
        addToArray(FB_PERCENTILE_DATA["padjProgDistance"], (aggregatedStats["progDistance"] / (touches/100)));

        addToArray(FB_PERCENTILE_DATA["passSuccRate"], ((aggregatedStats["succPasses"] / aggregatedStats["attPasses"]) * 100));

        addToArray(FB_PERCENTILE_DATA["succDribbles"], (aggregatedStats["succDribbles"] / (minutes/90)));
        addToArray(FB_PERCENTILE_DATA["padjSuccDribbles"], (aggregatedStats["succDribbles"] / (touches/100)));
        addToArray(FB_PERCENTILE_DATA["dribbleSuccRate"], ((aggregatedStats["succDribbles"] / aggregatedStats["attDribbles"]) * 100));

        addToArray(FB_PERCENTILE_DATA["turnovers"], ((aggregatedStats["timesDispossessed"] + aggregatedStats["miscontrols"]) / (minutes/90)));
        addToArray(FB_PERCENTILE_DATA["padjTurnovers"], ((aggregatedStats["timesDispossessed"] + aggregatedStats["miscontrols"]) / (touches/100)));

        addToArray(FB_PERCENTILE_DATA["succPressures"], (aggregatedStats["succPressures"] / (minutes/90)));
        addToArray(FB_PERCENTILE_DATA["padjSuccPressures"], (aggregatedStats["padjSuccPressures"] / (minutes/90)));

        addToArray(FB_PERCENTILE_DATA["interceptions"], (aggregatedStats["interceptions"] / (minutes/90)));
        addToArray(FB_PERCENTILE_DATA["padjInterceptions"], (aggregatedStats["padjInterceptions"] / (minutes/90)));

        addToArray(FB_PERCENTILE_DATA["succTackles"], (aggregatedStats["succTackles"] / (minutes/90)));
        addToArray(FB_PERCENTILE_DATA["padjSuccTackles"], (aggregatedStats["padjSuccTackles"] / (minutes/90)));
        addToArray(FB_PERCENTILE_DATA["dribbleTackleRate"], ((aggregatedStats["succDribbleTackles"] / aggregatedStats["attDribbleTackles"]) * 100));

        addToArray(FB_PERCENTILE_DATA["aerialSuccRate"], ((aggregatedStats["succAerials"] / aggregatedStats["attAerials"]) * 100));

    }

    await saveData(FB_PERCENTILE_DATA, "FB");

};


let calculateCBStats = async () => {

    for (let i=0; i<CB_CODES.length; i++){

        let code = CB_CODES[i];
        let aggregatedStats = aggregateStats(PROCESSED[code]["stats"][SEASON]);
        let minutes = aggregatedStats["minutes"];
        let touches = aggregatedStats["touches"];

        addToArray(CB_PERCENTILE_DATA["pft"], (aggregatedStats["pft"] / (minutes/90)));
        addToArray(CB_PERCENTILE_DATA["padjPFT"], (aggregatedStats["pft"] / (touches/100)));

        addToArray(CB_PERCENTILE_DATA["progDistance"], (aggregatedStats["progDistance"] / (minutes/90)));
        addToArray(CB_PERCENTILE_DATA["padjProgDistance"], (aggregatedStats["progDistance"] / (touches/100)));

        addToArray(CB_PERCENTILE_DATA["passSuccRate"], ((aggregatedStats["succPasses"] / aggregatedStats["attPasses"]) * 100));

        addToArray(CB_PERCENTILE_DATA["longPassSuccRate"], ((aggregatedStats["succLongPasses"] / aggregatedStats["attLongPasses"]) * 100));

        addToArray(CB_PERCENTILE_DATA["succPressures"], (aggregatedStats["succPressures"] / (minutes/90)));
        addToArray(CB_PERCENTILE_DATA["padjSuccPressures"], (aggregatedStats["padjSuccPressures"] / (minutes/90)));

        addToArray(CB_PERCENTILE_DATA["interceptions"], (aggregatedStats["interceptions"] / (minutes/90)));
        addToArray(CB_PERCENTILE_DATA["padjInterceptions"], (aggregatedStats["padjInterceptions"] / (minutes/90)));

        addToArray(CB_PERCENTILE_DATA["succTackles"], (aggregatedStats["succTackles"] / (minutes/90)));
        addToArray(CB_PERCENTILE_DATA["padjSuccTackles"], (aggregatedStats["padjSuccTackles"] / (minutes/90)));
        addToArray(CB_PERCENTILE_DATA["dribbleTackleRate"], ((aggregatedStats["succDribbleTackles"] / aggregatedStats["attDribbleTackles"]) * 100));

        addToArray(CB_PERCENTILE_DATA["fouls"], (aggregatedStats["fouls"] / (minutes/90)));
        addToArray(CB_PERCENTILE_DATA["padjFouls"], (aggregatedStats["padjFouls"] / (minutes/90)));

        addToArray(CB_PERCENTILE_DATA["succAerials"], (aggregatedStats["succAerials"] / (minutes/90)));
        addToArray(CB_PERCENTILE_DATA["aerialSuccRate"], ((aggregatedStats["succAerials"] / aggregatedStats["attAerials"]) * 100));

        addToArray(CB_PERCENTILE_DATA["clearances"], (aggregatedStats["clearances"] / (minutes/90)));
        addToArray(CB_PERCENTILE_DATA["padjClearances"], (aggregatedStats["padjClearances"] / (minutes/90)));

    }

    await saveData(CB_PERCENTILE_DATA, "CB");

};


let calculateGKStats = async () => {

    for (let i=0; i<GK_CODES.length; i++){

        let code = GK_CODES[i];
        let aggregatedStats = aggregateStats(PROCESSED[code]["stats"][SEASON]);

        addToArray(GK_PERCENTILE_DATA["gsaa"], (((aggregatedStats["psxg"]-aggregatedStats["goalsAgainst"])/aggregatedStats["sota"]) * 100));
        addToArray(GK_PERCENTILE_DATA["crossStopRate"], ((aggregatedStats["stoppedCrosses"] / aggregatedStats["attCrosses"]) * 100));
        addToArray(GK_PERCENTILE_DATA["launchedPassSuccRate"], ((aggregatedStats["succLaunchedPasses"] / aggregatedStats["attLaunchedPasses"]) * 100));

    }

    await saveData(GK_PERCENTILE_DATA, "GK");

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


console.time('percentiles generation');

setup()
    .then(async () => {
        await calculateFWStats();
        await calculateAMStats();
        await calculateCMStats();
        await calculateFBStats();
        await calculateCBStats();
        await calculateGKStats();
    })
    .then(async () => {
        console.timeEnd('percentiles generation');
        process.exit(0);
    })
    .catch(async(anError) => {
        console.log(anError);
        process.exit(-1);
    });

