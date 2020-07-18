var SEASON;
//parse command line arguments to get the season
let ARGS = process.argv.slice(2);
if (ARGS.length !== 1){
    console.log("Incorrect number of args. Usage: node statsFiller <season>");
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

//initialize helpers
const path = require('path');
const fs = require('fs');
const countryCodes = require('./countryCodes.js');

//globals to store mappings
var FBREF_TO_WHOSCORED_PLAYERS;

//globals to store fbref data
var EPL; //fbref epl player data
var EPL_GK; //fbref epl gk data

//repeat for the other competitions
var LA_LIGA;
var LA_LIGA_GK;

var SERIE_A;
var SERIE_A_GK;

var BUNDESLIGA;
var BUNDESLIGA_GK;

var LIGUE_1;
var LIGUE_1_GK;

var CHAMPIONS_LEAGUE;
var CHAMPIONS_LEAGUE_GK;

var EUROPA_LEAGUE;
var EUROPA_LEAGUE_GK;

var METADATA; //player metadata
var PROCESSED; //player metadata + stats

var FBREF_TO_WHOSCORED_TEAMS; //fbref to whoscored club name dictionary
var POSSESSION_DATA; //team average possession data
var POSITION_DATA = []; //player position arrays


let setup = async () => {

    return new Promise(async function(resolve, reject){

        METADATA = JSON.parse(fs.readFileSync(path.join(__dirname, '/playerData/metadata.json')));
        if (SEASON === "18-19"){
            PROCESSED = {};
        }
        else if (SEASON === "19-20"){
            PROCESSED = JSON.parse(fs.readFileSync(path.join(__dirname, '/playerData/processed.json')));
        }

        POSITION_DATA["FW"] = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/FWPlayers.json`)))['codes'];
        POSITION_DATA["AM"] = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/AMPlayers.json`)))['codes'];
        POSITION_DATA["CM"] = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/CMPlayers.json`)))['codes'];
        POSITION_DATA["FB"] = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/FBPlayers.json`)))['codes'];
        POSITION_DATA["CB"] = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/CBPlayers.json`)))['codes'];
        POSITION_DATA["GK"] = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/GKPlayers.json`)))['codes'];

        EPL = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/premierLeague.json`)));
        EPL_GK = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/premierLeague_gk.json`)));
        LA_LIGA = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/laLiga.json`)));
        LA_LIGA_GK = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/laLiga_gk.json`)));
        SERIE_A = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/serieA.json`)));
        SERIE_A_GK = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/serieA_gk.json`)));
        BUNDESLIGA = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/bundesliga.json`)));
        BUNDESLIGA_GK = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/bundesliga_gk.json`)));
        LIGUE_1 = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/ligue1.json`)));
        LIGUE_1_GK = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/ligue1_gk.json`)));
        CHAMPIONS_LEAGUE = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/championsLeague.json`)));
        CHAMPIONS_LEAGUE_GK = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/championsLeague_gk.json`)));
        EUROPA_LEAGUE = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/europaLeague.json`)));
        EUROPA_LEAGUE_GK = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/europaLeague_gk.json`)));

        FBREF_TO_WHOSCORED_PLAYERS = JSON.parse(fs.readFileSync(path.join(__dirname, '/playerMappingData/fbrefToWhoscored.json')));
        FBREF_TO_WHOSCORED_TEAMS = JSON.parse(fs.readFileSync(path.join(__dirname, '/teamMappingData/fbrefToWhoscored.json')));

        POSSESSION_DATA = JSON.parse(fs.readFileSync(path.join(__dirname, `possessionData/${SEASON}.json`)));

        resolve();

    });

};


let processEPLData = async () => {

    let competitionName = "Premier League";

    for (let player in EPL){
        processEntry(player, EPL, competitionName, false)
    }

    for (let gk in EPL_GK){
        processEntry(gk, EPL_GK, competitionName, true)
    }


};


let processLaLigaData = async () => {

    let competitionName = "La Liga";

    for (let player in LA_LIGA){
        processEntry(player, LA_LIGA, competitionName, false)
    }

    for (let gk in LA_LIGA_GK){
        processEntry(gk, LA_LIGA_GK, competitionName, true)
    }


};

let processSerieAData = async () => {

    let competitionName = "Serie A";

    for (let player in SERIE_A){
        processEntry(player, SERIE_A, competitionName, false)
    }

    for (let gk in SERIE_A_GK){
        processEntry(gk, SERIE_A_GK, competitionName, true)
    }


};

let processBundesligaData = async () => {

    let competitionName = "Bundesliga";

    for (let player in BUNDESLIGA){
        processEntry(player, BUNDESLIGA, competitionName, false)
    }

    for (let gk in BUNDESLIGA_GK){
        processEntry(gk, BUNDESLIGA_GK, competitionName, true)
    }


};

let processLigue1Data = async () => {

    let competitionName = "Ligue 1";

    for (let player in LIGUE_1){
        processEntry(player, LIGUE_1, competitionName, false)
    }

    for (let gk in LIGUE_1_GK){
        processEntry(gk, LIGUE_1_GK, competitionName, true)
    }


};

let processChampionsLeagueData = async () => {

    let competitionName = "Champions League";

    for (let player in CHAMPIONS_LEAGUE){
        processEntry(player, CHAMPIONS_LEAGUE, competitionName, false)
    }

    for (let gk in CHAMPIONS_LEAGUE_GK){
        processEntry(gk, CHAMPIONS_LEAGUE_GK, competitionName, true)
    }


};

let processEuropaLeagueData = async () => {

    let competitionName = "Europa League";

    for (let player in EUROPA_LEAGUE){
        processEntry(player, EUROPA_LEAGUE, competitionName, false)
    }

    for (let gk in EUROPA_LEAGUE_GK){
        processEntry(gk, EUROPA_LEAGUE_GK, competitionName, true)
    }

};


let processEntry = (aPlayer, competitionData, competitionName, isGoalkeeper) => {

    let isCLorEL = false;
    if (competitionName === "Champions League" || competitionName === "Europa League"){
        isCLorEL = true;
    }

    //retrieve the player object from the fbref stats and the player name
    let entry = competitionData[aPlayer];

    //retrieve the player name and club from the fbref entry
    let fbrefName;
    let fbrefClubName;
    if (isGoalkeeper){
        fbrefName = entry['keeper___1'].substring(0, entry['keeper___1'].indexOf('\\'));
        fbrefClubName = entry["keeper___4"];
    }
    else {
        fbrefName = entry['standard___1'].substring(0, entry['standard___1'].indexOf('\\'));
        fbrefClubName = entry["standard___4"];
    }

    //remove the diacritics from the fbref name
    let fbrefSimplifiedName = fbrefName
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace("Ø", "O")
        .replace("ø", "o");

    //trim the club country if the entry is from CL/EL
    if (isCLorEL){
        fbrefClubName = fbrefClubName.substring(fbrefClubName.indexOf(" ") + 1, fbrefClubName.length);
    }

    //retrieve the fbref player code and translate it to the whoscored player code
    let fbrefCode = entry["code"];
    let whoscoredCode = FBREF_TO_WHOSCORED_PLAYERS[fbrefCode];

    //exit the function if the player doesn't exist in the mapping
    if (whoscoredCode === undefined){
        return;
    }

    if (isGoalkeeper && METADATA[whoscoredCode]["positions"][SEASON] !== "GK"){
        return;
    }

    //retrieve the club name and the team's average possession for the required competition
    if (FBREF_TO_WHOSCORED_TEAMS[fbrefClubName] === undefined){
        console.log(fbrefClubName);
    }
    let whoscoredClubName = FBREF_TO_WHOSCORED_TEAMS[fbrefClubName]["whoscored"];
    let possession = POSSESSION_DATA[competitionName][whoscoredClubName];

    //populate the player metadata
    if (PROCESSED[whoscoredCode] === undefined){
        PROCESSED[whoscoredCode] = {};
        let currentPlayer = PROCESSED[whoscoredCode];
        let metadata = METADATA[whoscoredCode];
        currentPlayer["fbrefCode"] = fbrefCode;
        currentPlayer["name"] = metadata["name"];
        currentPlayer["name2"] = fbrefName;
        currentPlayer["simplifiedName"] = metadata["simplifiedName"];
        currentPlayer["simplifiedName2"] = fbrefSimplifiedName;
        currentPlayer["age"] = metadata["age"];
        currentPlayer["nationality"] = metadata["nationality"] === "" ? countryCodes.getCountryName(entry['standard___2'].split(" ")[0].toUpperCase()) : metadata["nationality"];
        currentPlayer["positions"] = metadata["positions"];
        currentPlayer["percentileEntries"] = {};
        currentPlayer["clubs"] = metadata["clubs"];
        currentPlayer["stats"] = {};
    }

    if (PROCESSED[whoscoredCode]["percentileEntries"][SEASON] === undefined){
        PROCESSED[whoscoredCode]["percentileEntries"][SEASON] = [];
    }

    let percentileEntriesArray = PROCESSED[whoscoredCode]["percentileEntries"][SEASON];
    for (let position in POSITION_DATA){
        if (POSITION_DATA[position].includes(whoscoredCode)){
            if (!percentileEntriesArray.includes(position)) percentileEntriesArray.push(position)
        }
    }

    //retrieve required stats from the fbref data (exported CSVs converted to JSON)
    let stats;
    if (isGoalkeeper && METADATA[whoscoredCode]["positions"][SEASON] === "GK"){
        stats = {
            minutes: entry["keeper_Playing Time__2"],
            goalsAgainst: entry["keeper_Performance"] - entry["keeper_adv_Goals__4"],
            psxg: entry["keeper_adv_Expected"],
            sota: entry["keeper_Performance__2"],
            stoppedCrosses: entry["keeper_adv_Crosses__1"],
            attCrosses: entry["keeper_adv_Crosses"],
            succPressurePasses: entry["passing_types_Pass Types__4"],
            succLaunchedPasses: entry["keeper_adv_Launched"],
            attLaunchedPasses: entry["keeper_adv_Launched__1"]
        }
    }
    else {
        stats = {
            minutes: entry["standard_Playing Time__2"],
            npg: entry["standard_Performance"] - entry["standard_Performance__2"],
            npxg: entry["standard_Expected__1"],
            shots: entry["shooting_Standard__3"] - entry["standard_Performance__3"],
            succAerials: entry["misc_Aerial Duels"],
            attAerials: entry["misc_Aerial Duels"] + entry["misc_Aerial Duels__1"],
            boxTouches: entry["possession_Touches__5"],
            xa: entry["standard_Expected__2"],
            sca: entry["gca_SCA Types"] + entry["gca_SCA Types__2"] + entry["gca_SCA Types__3"] + entry["gca_SCA Types__4"],
            ppa: entry["passing___13"],
            succDribbles: entry["possession_Dribbles"],
            attDribbles: entry["possession_Dribbles__1"],
            timesDispossessed: entry["possession___9"],
            succPressures: entry["defense_Pressures__1"],
            padjSuccPressures: adjustForPossession(entry["defense_Pressures__1"], possession),
            progDistance: entry["passing_Total__4"] + entry["possession_Carries__2"],
            succPasses: entry["passing_Total"],
            attPasses: entry["passing_Total__1"],
            pft: entry["passing___12"],
            succLongPasses: entry["passing_Long"],
            attLongPasses: entry["passing_Long__1"],
            interceptions: entry["defense___8"],
            padjInterceptions: adjustForPossession(entry["defense___8"], possession),
            tacklesWon: entry["defense_Tackles__1"],
            padjTacklesWon: adjustForPossession(entry["defense_Tackles__1"], possession),
            succDribbleTackles: entry["defense_Vs Dribbles"],
            attDribbleTackles: entry["defense_Vs Dribbles__1"],
            fouls: entry["misc_Performance__3"],
            padjFouls: adjustForPossession(entry["misc_Performance__3"], possession),
            clearances: entry["defense___9"],
            padjClearances: adjustForPossession(entry["defense___9"], possession)
        };
        for (let stat in stats){
            if (typeof stats[stat] === "string"){
                stats[stat] = 0;
            }
        }
    }

    //populate the player stats
    if (METADATA[whoscoredCode][SEASON] !== undefined){
        if (METADATA[whoscoredCode][SEASON][`${competitionName} | ${whoscoredClubName}`] !== undefined){
            if (PROCESSED[whoscoredCode]["stats"][SEASON] === undefined){
                PROCESSED[whoscoredCode]["stats"][SEASON] = {};
            }
            PROCESSED[whoscoredCode]["stats"][SEASON][`${competitionName} | ${whoscoredClubName}`] = stats;
        }
    }

};


let adjustForPossession = (value, possession) => {

    //StatsBomb sigmoid function adapted from: https://statsbomb.com/2014/06/introducing-possession-adjusted-player-stats/
    return (value * 2) / (1 + Math.exp(-0.1 * (possession - 50)));

};


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


console.time('stats filling');
setup()
    .then(async () => {
        await processEPLData()
    })
    .then(async () => {
        await processLaLigaData()
    })
    .then(async () => {
        await processSerieAData()
    })
    .then(async () => {
        await processBundesligaData()
    })
    .then(async () => {
        await processLigue1Data()
    })
    .then(async () => {
        await processChampionsLeagueData()
    })
    .then(async () => {
        await processEuropaLeagueData()
    })
    .then(async () => {
        await saveStats();
    })
    .then(() => {
        console.timeEnd('stats filling');
        process.exit(0);
    })
    .catch(async(anError) => {
        console.log(anError);
    });

