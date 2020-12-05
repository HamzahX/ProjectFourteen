var SEASON = "19-20";

//initialize helpers
const path = require('path');
const fs = require('fs');
const countryCodes = require('./countryCodes.js');
const merge = require('lodash.merge');

//globals to store mappings
var FBREF_TO_WHOSCORED_PLAYERS;

//globals to store fbref data
var EPL; //fbref epl player data
var LA_LIGA;
var SERIE_A;
var BUNDESLIGA;
var LIGUE_1;

var METADATA; //player metadata
var PROCESSED_PL; //player metadata + stats
var PROCESSED_LL;
var PROCESSED_SA;
var PROCESSED_BL;
var PROCESSED_L1;

var FBREF_TO_WHOSCORED_TEAMS; //fbref to whoscored club name dictionary
var POSSESSION_DATA; //team average possession data

var ENDINGS = ["_Player", "_Nation", "_Pos", "_Squad", "_Age", "_Born", "_Matches", "code", "url"];


let setup = async () => {

    return new Promise(async function(resolve, reject){

        METADATA = JSON.parse(fs.readFileSync(path.join(__dirname, '/playerData/metadata.json')));
        PROCESSED_PL = {};
        PROCESSED_LL = {};
        PROCESSED_SA = {};
        PROCESSED_BL = {};
        PROCESSED_L1 = {};

        EPL = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/premierLeague.json`)));
        LA_LIGA = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/laLiga.json`)));
        SERIE_A = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/serieA.json`)));
        BUNDESLIGA = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/bundesliga.json`)));
        LIGUE_1 = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/ligue1.json`)));

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


};


let processLaLigaData = async () => {

    let competitionName = "La Liga";

    for (let player in LA_LIGA){
        processEntry(player, LA_LIGA, competitionName, false)
    }


};


let processSerieAData = async () => {

    let competitionName = "Serie A";

    for (let player in SERIE_A){
        processEntry(player, SERIE_A, competitionName, false)
    }


};


let processBundesligaData = async () => {

    let competitionName = "Bundesliga";

    for (let player in BUNDESLIGA){
        processEntry(player, BUNDESLIGA, competitionName, false)
    }


};


let processLigue1Data = async () => {

    let competitionName = "Ligue 1";

    for (let player in LIGUE_1){
        processEntry(player, LIGUE_1, competitionName, false)
    }


};


let processEntry = (aPlayer, competitionData, competitionName, isGoalkeeper) => {

    //retrieve the player object from the fbref stats and the player name
    let entry = competitionData[aPlayer];

    let fbrefClubName = entry["standard_Squad"];

    //retrieve the fbref player code and translate it to the whoscored player code
    let fbrefCode = entry["code"];
    let whoscoredCode = FBREF_TO_WHOSCORED_PLAYERS[fbrefCode];

    //exit the function if the player doesn't exist in the mapping
    if (whoscoredCode === undefined){
        return;
    }

    let metadata = METADATA[whoscoredCode];
    if (metadata["clubs"][SEASON] === undefined){
        return;
    }

    let whoscoredClubName = FBREF_TO_WHOSCORED_TEAMS[fbrefClubName]["whoscored"];
    let possession = POSSESSION_DATA[competitionName][whoscoredClubName];

    let currentPlayer;
    if (competitionName === "Premier League"){
        PROCESSED_PL[`${whoscoredCode} | ${whoscoredClubName}`] = {};
    }
    else if (competitionName === "La Liga"){
        PROCESSED_LL[`${whoscoredCode} | ${whoscoredClubName}`] = {};
    }
    else if (competitionName === "Serie A"){
        PROCESSED_SA[`${whoscoredCode} | ${whoscoredClubName}`] = {};
    }
    else if (competitionName === "Bundesliga"){
        PROCESSED_BL[`${whoscoredCode} | ${whoscoredClubName}`] = {};
    }
    else {
        PROCESSED_L1[`${whoscoredCode} | ${whoscoredClubName}`] = {};
    }

    //populate the player metadata
    if (currentPlayer === undefined){
        if (competitionName === "Premier League"){
            currentPlayer = PROCESSED_PL[`${whoscoredCode} | ${whoscoredClubName}`];
        }
        else if (competitionName === "La Liga"){
            currentPlayer = PROCESSED_LL[`${whoscoredCode} | ${whoscoredClubName}`];
        }
        else if (competitionName === "Serie A"){
            currentPlayer = PROCESSED_SA[`${whoscoredCode} | ${whoscoredClubName}`];
        }
        else if (competitionName === "Bundesliga"){
            currentPlayer = PROCESSED_BL[`${whoscoredCode} | ${whoscoredClubName}`];
        }
        else {
            currentPlayer = PROCESSED_L1[`${whoscoredCode} | ${whoscoredClubName}`];
        }
        // currentPlayer["fbrefCode"] = fbrefCode;
        // currentPlayer["fbrefURL"] = entry["url"];
        currentPlayer["name"] = metadata["name"];
        currentPlayer["age"] = metadata["age"];
        currentPlayer["nationality"] = metadata["nationality"] === "" ? countryCodes.getCountryName(entry['standard_Nation'].split(" ")[0].toUpperCase()) : metadata["nationality"];
        currentPlayer["clubs"] = metadata["clubs"][SEASON].join(", ");
        currentPlayer["positions"] = metadata["positions"][SEASON];
        currentPlayer["minutes"] = entry["standard_Min"];
        currentPlayer = merge(currentPlayer, entry);
        // currentPlayer["npg"] =  entry["standard_Performance"] - entry["standard_Performance__2"];
        // currentPlayer["npxg"] =  entry["standard_Expected__1"];
        // currentPlayer["shots"] =  entry["shooting_Standard__3"] - entry["standard_Performance__3"];
        // currentPlayer["succAerials"] =  entry["misc_Aerial Duels"];
        // currentPlayer["attAerials"] =  entry["misc_Aerial Duels"] + entry["misc_Aerial Duels__1"];
        // currentPlayer["boxTouches"] =  entry["possession_Touches__5"];
        // currentPlayer["xa"] =  entry["standard_Expected__2"];
        // currentPlayer["sca"] =  entry["gca_SCA Types"] + entry["gca_SCA Types__2"] + entry["gca_SCA Types__3"] + entry["gca_SCA Types__4"];
        // currentPlayer["ppa"] =  entry["passing___13"];
        // currentPlayer["succDribbles"] =  entry["possession_Dribbles"];
        // currentPlayer["attDribbles"] =  entry["possession_Dribbles__1"];
        // currentPlayer["timesDispossessed"] =  entry["possession___9"];
        // currentPlayer["succPressures"] =  entry["defense_Pressures__1"];
        // currentPlayer["padjSuccPressures"] =  adjustForPossession(entry["defense_Pressures__1"], possession);
        // currentPlayer["progDistance"] =  entry["passing_Total__4"] + entry["possession_Carries__2"];
        // currentPlayer["succPasses"] =  entry["passing_Total"];
        // currentPlayer["attPasses"] =  entry["passing_Total__1"];
        // currentPlayer["pft"] =  entry["passing___12"];
        // currentPlayer["succLongPasses"] =  entry["passing_Long"];
        // currentPlayer["attLongPasses"] =  entry["passing_Long__1"];
        // currentPlayer["interceptions"] =  entry["defense___8"];
        // currentPlayer["padjInterceptions"] =  adjustForPossession(entry["defense___8"], possession);
        // currentPlayer["tacklesWon"] =  entry["defense_Tackles__1"];
        // currentPlayer["padjTacklesWon"] =  adjustForPossession(entry["defense_Tackles__1"], possession);
        // currentPlayer["succDribbleTackles"] =  entry["defense_Vs Dribbles"];
        // currentPlayer["attDribbleTackles"] =  entry["defense_Vs Dribbles__1"];
        // currentPlayer["fouls"] =  entry["misc_Performance__3"];
        // currentPlayer["padjFouls"] =  adjustForPossession(entry["misc_Performance__3"], possession);
        // currentPlayer["clearances"] =  entry["defense___9"];
        // currentPlayer["padjClearances"] =  adjustForPossession(entry["defense___9"], possession)
    }

    for (let stat in currentPlayer){
        for (let i=0; i<ENDINGS.length; i++){
            if (stat.endsWith(ENDINGS[i])){
                delete currentPlayer[stat]
            }
        }
    }

};

let adjustForPossession = (value, possession) => {

    //StatsBomb sigmoid function adapted from: https://statsbomb.com/2014/06/introducing-possession-adjusted-player-stats/
    return (value * 2) / (1 + Math.exp(-0.1 * (possession - 50)));

};


let saveStats = async () => {

    return new Promise(async function (resolve, reject) {
        await fs.writeFile(path.join(__dirname, `playerData/processed_PremierLeague.json`), JSON.stringify(PROCESSED_PL, null, '\t'), async function(err) {
            if (err) {
                console.log(err);
                reject();
            }
            await fs.writeFile(path.join(__dirname, `playerData/processed_LaLiga.json`), JSON.stringify(PROCESSED_LL, null, '\t'), async function(err) {
                if (err) {
                    console.log(err);
                    reject();
                }
                await fs.writeFile(path.join(__dirname, `playerData/processed_SerieA.json`), JSON.stringify(PROCESSED_SA, null, '\t'), async function(err) {
                    if (err) {
                        console.log(err);
                        reject();
                    }
                    await fs.writeFile(path.join(__dirname, `playerData/processed_Bundesliga.json`), JSON.stringify(PROCESSED_BL, null, '\t'), async function(err) {
                        if (err) {
                            console.log(err);
                            reject();
                        }
                        await fs.writeFile(path.join(__dirname, `playerData/processed_Ligue1.json`), JSON.stringify(PROCESSED_L1, null, '\t'), async function(err) {
                            if (err) {
                                console.log(err);
                                reject();
                            }
                            resolve();
                        });
                    });
                });
            });
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
        await saveStats();
    })
    .then(() => {
        console.timeEnd('stats filling');
        process.exit(0);
    })
    .catch(async(anError) => {
        console.log(anError);
        process.exit(-1);
    });

