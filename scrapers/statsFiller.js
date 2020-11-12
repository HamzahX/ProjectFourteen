//initialize helpers
const path = require('path');
const fs = require('fs');
const countryCodes = require('./countryCodes.js');

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
        else{
            PROCESSED = JSON.parse(fs.readFileSync(path.join(__dirname, '/playerData/processed.json')));
        }

        POSITION_DATA["FW"] = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/FWPercentilePlayers.json`)))['codes'];
        POSITION_DATA["AM"] = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/AMPercentilePlayers.json`)))['codes'];
        POSITION_DATA["CM"] = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/CMPercentilePlayers.json`)))['codes'];
        POSITION_DATA["FB"] = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/FBPercentilePlayers.json`)))['codes'];
        POSITION_DATA["CB"] = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/CBPercentilePlayers.json`)))['codes'];
        POSITION_DATA["GK"] = JSON.parse(fs.readFileSync(path.join(__dirname, `/positionData/${SEASON}/GKPercentilePlayers.json`)))['codes'];

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
        fbrefName = entry['keeper_Player'].substring(0, entry['keeper_Player'].indexOf('\\'));
        fbrefClubName = entry["keeper_Squad"];
    }
    else {
        fbrefName = entry['standard_Player'].substring(0, entry['standard_Player'].indexOf('\\'));
        fbrefClubName = entry["standard_Squad"];
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
    if (whoscoredCode === undefined || METADATA[whoscoredCode] === undefined){
        return;
    }

    let isOutfieldGoalkeeper = false;
    if (METADATA[whoscoredCode]["positions"][SEASON] !== undefined){
        isOutfieldGoalkeeper = isGoalkeeper && !METADATA[whoscoredCode]["positions"][SEASON].includes("GK");
    }

    //retrieve the club name and the team's average possession for the required competition
    if (FBREF_TO_WHOSCORED_TEAMS[fbrefClubName] === undefined){
        console.log("Unmatched fbref club name: " + fbrefClubName + ". Check the team name mappings");
    }
    let whoscoredClubName = FBREF_TO_WHOSCORED_TEAMS[fbrefClubName]["whoscored"];

    //populate the player metadata
    if (PROCESSED[whoscoredCode] === undefined){
        PROCESSED[whoscoredCode] = {};
        let metadata = METADATA[whoscoredCode];
        PROCESSED[whoscoredCode]["fbrefCode"] = fbrefCode;
        PROCESSED[whoscoredCode]["fbrefURL"] = entry["url"];
        PROCESSED[whoscoredCode]["name"] = metadata["name"];
        PROCESSED[whoscoredCode]["name2"] = fbrefName;
        PROCESSED[whoscoredCode]["simplifiedName"] = metadata["simplifiedName"];
        PROCESSED[whoscoredCode]["simplifiedName2"] = fbrefSimplifiedName;
        PROCESSED[whoscoredCode]["age"] = metadata["age"];
        PROCESSED[whoscoredCode]["nationality"] = metadata["nationality"] === "" ? countryCodes.getCountryName(entry['standard_Nation'].split(" ")[0].toUpperCase()) : metadata["nationality"];
        PROCESSED[whoscoredCode]["countryCode"] = metadata["countryCode"] === "" ? countryCodes.cleanCountryCode(entry['standard_Nation'].split(" ")[0]) : metadata["countryCode"];
        PROCESSED[whoscoredCode]["positions"] = metadata["positions"];
        PROCESSED[whoscoredCode]["percentileEntries"] = {};
        PROCESSED[whoscoredCode]["clubs"] = metadata["clubs"];
        PROCESSED[whoscoredCode]["stats"] = {};
    }

    if (isOutfieldGoalkeeper && PROCESSED[whoscoredCode]["outfieldGKStats"] === undefined){
        PROCESSED[whoscoredCode]["outfieldGKStats"] = {};
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

    let possession = POSSESSION_DATA[competitionName][whoscoredClubName];

    //retrieve required stats from the fbref data (exported CSVs converted to JSON)
    let stats;
    if (isGoalkeeper){
        stats = {
            minutes: entry["keeper_Min"],
            goalsAgainst: entry["keeper_adv_GA"] - entry["keeper_adv_OG"],
            psxg: entry["keeper_adv_PSxG"],
            sota: entry["keeper_SoTA"],
            stoppedCrosses: entry["keeper_adv_Stp"],
            attCrosses: entry["keeper_adv_Opp"],
            succLaunchedPasses: entry["keeper_adv_Cmp"],
            attLaunchedPasses: entry["keeper_adv_Att"]
        }
    }
    else {
        stats = {
            minutes: entry["standard_Min"],
            touches: entry["possession_Touches"],
            npg: entry["standard_Gls"] - entry["standard_PK"],
            npxg: entry["standard_npxG"],
            shots: entry["shooting_Sh"] - entry["standard_PK"],
            succAerials: entry["misc_Won"],
            attAerials: entry["misc_Won"] + entry["misc_Lost"],
            boxTouches: entry["possession_Att Pen"],
            xa: entry["passing_xA"],
            sca: entry["gca_SCA"] - entry["gca_PassDead"],
            ppa: entry["passing_PPA"],
            succDribbles: entry["possession_Succ"],
            attDribbles: entry["possession_Att"],
            timesDispossessed: entry["possession_Dispos"],
            miscontrols: entry["possession_Miscon"],
            progDistance: entry["passing_PrgDist"] + entry["possession_PrgDist"],
            succPasses: entry["passing_Cmp"],
            attPasses: entry["passing_Att"],
            pft: entry["passing_1/3"],
            succLongPasses: entry["passing_Cmp__3"],
            attLongPasses: entry["passing_Att__3"],
            succPressures: entry["defense_Succ"],
            padjSuccPressures: adjustForPossessionDefensive(entry["defense_Succ"], possession),
            interceptions: entry["defense_Int"],
            padjInterceptions: adjustForPossessionDefensive(entry["defense_Int"], possession),
            succTackles: entry["defense_Tkl"],
            padjSuccTackles: adjustForPossessionDefensive(entry["defense_Tkl"], possession),
            tacklesWon: entry["defense_TklW"],
            padjTacklesWon: adjustForPossessionDefensive(entry["defense_TklW"], possession),
            succDribbleTackles: entry["defense_Tkl__1"],
            attDribbleTackles: entry["defense_Att"],
            fouls: entry["misc_Fls"],
            padjFouls: adjustForPossessionDefensive(entry["misc_Fls"], possession),
            clearances: entry["defense_Clr"],
            padjClearances: adjustForPossessionDefensive(entry["defense_Clr"], possession)
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
            if (isOutfieldGoalkeeper){
                if (PROCESSED[whoscoredCode]["outfieldGKStats"][SEASON] === undefined){
                    PROCESSED[whoscoredCode]["outfieldGKStats"][SEASON] = {};
                }
                PROCESSED[whoscoredCode]["outfieldGKStats"][SEASON][`${competitionName} | ${whoscoredClubName}`] = stats;
            }
            else {
                if (PROCESSED[whoscoredCode]["stats"][SEASON] === undefined){
                    PROCESSED[whoscoredCode]["stats"][SEASON] = {};
                }
                PROCESSED[whoscoredCode]["stats"][SEASON][`${competitionName} | ${whoscoredClubName}`] = stats;
            }
        }
    }

};


let adjustForPossessionDefensive = (value, possession) => {

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
        process.exit(-1);
    });

