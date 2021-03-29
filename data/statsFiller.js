//initialize helpers
const path = require('path');
const fs = require('fs');
const countryCodes = require('./countryCodes.js');

const mean = require('mathjs').mean;

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
var TOUCHES_AGAINST_DATA;
var POSITION_DATA = []; //player position arrays

var AVERAGE_TOUCHES_AGAINST = {};
var TOUCHES_AGAINST_BELOW_AVERAGE = {};

var MEAN_POSSESSION_DIST_FROM_AVERAGE;
var MEAN_TOUCHES_AGAINST_DISTANCES_FROM_AVERAGE = {};
var ADJUSTMENT_COEFFICIENTS = {};

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

        let possessionDistancesFromAverage = [];

        for (let competition in POSSESSION_DATA){
            for (let team in POSSESSION_DATA[competition]){
                possessionDistancesFromAverage.push(Math.abs(POSSESSION_DATA[competition][team] - 50))
            }
        }

        MEAN_POSSESSION_DIST_FROM_AVERAGE = mean(possessionDistancesFromAverage);

        TOUCHES_AGAINST_DATA = JSON.parse(fs.readFileSync(path.join(__dirname, `touchesAgainstData/${SEASON}.json`)));

        let firstCompetition = Object.keys(TOUCHES_AGAINST_DATA)[0];
        let firstTeam = Object.keys(TOUCHES_AGAINST_DATA[firstCompetition])[0];
        let touchTypes = Object.keys(TOUCHES_AGAINST_DATA[firstCompetition][firstTeam]);

        for (let i=0; i<touchTypes.length; i++){

            let touchType = touchTypes[i];

            let allValues = [];

            for (let competition in TOUCHES_AGAINST_DATA){
                for (let team in TOUCHES_AGAINST_DATA[competition]){

                    allValues.push(TOUCHES_AGAINST_DATA[competition][team][touchType]);

                    if (TOUCHES_AGAINST_DATA[competition][team][touchType] === null){
                        console.log(competition, team);
                    }

                }
            }

            AVERAGE_TOUCHES_AGAINST[touchType] = mean(allValues);

        }

        for (let i=0; i<touchTypes.length; i++){

            let touchType = touchTypes[i];

            let touchesAgainstDistancesFromAverage = [];

            for (let competition in TOUCHES_AGAINST_DATA){

                if (TOUCHES_AGAINST_BELOW_AVERAGE[competition] === undefined)
                    TOUCHES_AGAINST_BELOW_AVERAGE[competition] = {};

                for (let team in TOUCHES_AGAINST_DATA[competition]){

                    if (TOUCHES_AGAINST_BELOW_AVERAGE[competition][team] === undefined)
                        TOUCHES_AGAINST_BELOW_AVERAGE[competition][team] = {};

                    let touchesAgainstBelowAverage = AVERAGE_TOUCHES_AGAINST[touchType] - TOUCHES_AGAINST_DATA[competition][team][touchType];

                    TOUCHES_AGAINST_BELOW_AVERAGE[competition][team][touchType] = touchesAgainstBelowAverage;

                    touchesAgainstDistancesFromAverage.push(Math.abs(touchesAgainstBelowAverage));

                }
            }

            MEAN_TOUCHES_AGAINST_DISTANCES_FROM_AVERAGE[touchType] = mean(touchesAgainstDistancesFromAverage);
            ADJUSTMENT_COEFFICIENTS[touchType] = MEAN_POSSESSION_DIST_FROM_AVERAGE / MEAN_TOUCHES_AGAINST_DISTANCES_FROM_AVERAGE[touchType];

        }

        //console.log(TOUCHES_AGAINST_BELOW_AVERAGE);
        //console.log(MEAN_TOUCHES_AGAINST_DISTANCES_FROM_AVERAGE);
        //console.log(ADJUSTMENT_COEFFICIENTS);

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

        if (metadata["countryCode"] === ""){
            metadata["countryCode"] = countryCodes.cleanCountryCode(entry['standard_Nation'].split(" ")[0]);
        }

        if (metadata["nationality"] === ""){
            metadata["nationality"] = countryCodes.getCountryName(entry['standard_Nation'].split(" ")[0].toUpperCase());
        }

        let fbrefCountryCode = countryCodes.cleanCountryCode(entry['standard_Nation'].split(" ")[0]);
        let fbrefNationality = countryCodes.getCountryName(entry['standard_Nation'].split(" ")[0].toUpperCase());

        if (metadata["countryCode"] === fbrefCountryCode){
            PROCESSED[whoscoredCode]["countryCodes"] = [metadata["countryCode"]];
        }
        else {
            PROCESSED[whoscoredCode]["countryCodes"] = [metadata["countryCode"], fbrefCountryCode];
        }

        if (metadata["nationality"] === fbrefNationality){
            PROCESSED[whoscoredCode]["nationalities"] = [metadata["nationality"]];
        }
        else {
            PROCESSED[whoscoredCode]["nationalities"] = [metadata["nationality"], fbrefNationality];
        }

        PROCESSED[whoscoredCode]["leagues"] = metadata["leagues"];
        PROCESSED[whoscoredCode]["clubs"] = metadata["clubs"];
        PROCESSED[whoscoredCode]["positions"] = metadata["positions"];
        PROCESSED[whoscoredCode]["displayPositions"] = metadata["displayPositions"];
        PROCESSED[whoscoredCode]["percentileEntries"] = {};
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

    let liveTouchesAgainstPer90BelowAverage = TOUCHES_AGAINST_BELOW_AVERAGE[competitionName][whoscoredClubName]["live_per90"];

    let att2ThirdsTouchesAgainstPer90BelowAverage = TOUCHES_AGAINST_BELOW_AVERAGE[competitionName][whoscoredClubName]["att2/3ds_per90"];
    let def2ThirdsTouchesAgainstPer90BelowAverage = TOUCHES_AGAINST_BELOW_AVERAGE[competitionName][whoscoredClubName]["def2/3ds_per90"];
    let attPenAreaTouchesAgainstPer90BelowAverage = TOUCHES_AGAINST_BELOW_AVERAGE[competitionName][whoscoredClubName]["attPenArea_per90"];

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
            shots: entry["shooting_Sh"],
            succAerials: entry["misc_Won"],
            attAerials: entry["misc_Won"] + entry["misc_Lost"],
            boxTouches: entry["possession_Att Pen"],
            xa: entry["passing_xA"],
            sca: entry["gca_SCA"] - entry["gca_PassDead"],
            ppa: entry["passing_PPA"],
            succDribbles: entry["possession_Succ"],
            attDribbles: entry["possession_Att"],
            timesDispossessed: entry["possession_Dis"],
            miscontrols: entry["possession_Mis"],
            progDistance: entry["passing_PrgDist"] + entry["possession_PrgDist"],
            succPasses: entry["passing_Cmp"],
            attPasses: entry["passing_Att"],
            pft: entry["passing_1/3"],
            succLongPasses: entry["passing_Cmp__3"],
            attLongPasses: entry["passing_Att__3"],

            succPressures: entry["defense_Succ"],
            padjSuccPressures: adjustForPossessionDefensive_2(entry["defense_Succ"], liveTouchesAgainstPer90BelowAverage, "live_per90"),
            padjSuccPressures_def: adjustForPossessionDefensive_2(entry["defense_Succ"], att2ThirdsTouchesAgainstPer90BelowAverage, "att2/3ds_per90"),
            padjSuccPressures_att: adjustForPossessionDefensive_2(entry["defense_Succ"], def2ThirdsTouchesAgainstPer90BelowAverage, "def2/3ds_per90"),

            interceptions: entry["defense_Int"],
            padjInterceptions: adjustForPossessionDefensive_2(entry["defense_Int"], liveTouchesAgainstPer90BelowAverage, "live_per90"),
            padjInterceptions_def: adjustForPossessionDefensive_2(entry["defense_Int"], att2ThirdsTouchesAgainstPer90BelowAverage, "att2/3ds_per90"),
            padjInterceptions_att: adjustForPossessionDefensive_2(entry["defense_Int"], def2ThirdsTouchesAgainstPer90BelowAverage, "def2/3ds_per90"),

            succTackles: entry["defense_Tkl"],
            padjSuccTackles: adjustForPossessionDefensive_2(entry["defense_Tkl"], liveTouchesAgainstPer90BelowAverage, "live_per90"),
            padjSuccTackles_def: adjustForPossessionDefensive_2(entry["defense_Tkl"], att2ThirdsTouchesAgainstPer90BelowAverage, "att2/3ds_per90"),
            padjSuccTackles_att: adjustForPossessionDefensive_2(entry["defense_Tkl"], def2ThirdsTouchesAgainstPer90BelowAverage, "def2/3ds_per90"),

            tacklesWon: entry["defense_TklW"],
            padjTacklesWon: adjustForPossessionDefensive_2(entry["defense_TklW"], liveTouchesAgainstPer90BelowAverage, "live_per90"),
            padjTacklesWon_def: adjustForPossessionDefensive_2(entry["defense_TklW"], att2ThirdsTouchesAgainstPer90BelowAverage, "att2/3ds_per90"),
            padjTacklesWon_att: adjustForPossessionDefensive_2(entry["defense_TklW"], def2ThirdsTouchesAgainstPer90BelowAverage, "def2/3ds_per90"),

            succDribbleTackles: entry["defense_Tkl__1"],
            attDribbleTackles: entry["defense_Att"],

            fouls: entry["misc_Fls"],
            padjFouls: adjustForPossessionDefensive_2(entry["misc_Fls"], liveTouchesAgainstPer90BelowAverage, "live_per90"),
            padjFouls_def: adjustForPossessionDefensive_2(entry["misc_Fls"], att2ThirdsTouchesAgainstPer90BelowAverage, "att2/3ds_per90"),
            padjFouls_att: adjustForPossessionDefensive_2(entry["misc_Fls"], def2ThirdsTouchesAgainstPer90BelowAverage, "def2/3ds_per90"),

            clearances: entry["defense_Clr"],
            padjClearances: adjustForPossessionDefensive_2(entry["defense_Clr"], liveTouchesAgainstPer90BelowAverage, "live_per90"),
            padjClearances_def: adjustForPossessionDefensive_2(entry["defense_Clr"], attPenAreaTouchesAgainstPer90BelowAverage, "attPenArea_per90"),

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


let adjustForPossessionDefensive_1 = (value, possession) => {

    //StatsBomb sigmoid function adapted from: https://statsbomb.com/2014/06/introducing-possession-adjusted-player-stats/
    return (value * 2) / (1 + Math.exp(-0.1 * (possession - 50)));

};


let adjustForPossessionDefensive_2 = (value, touchesAgainstBelowAverage, touchType) => {

    //StatsBomb sigmoid function adapted from: https://statsbomb.com/2014/06/introducing-possession-adjusted-player-stats/
    return (value * 2) / (1 + Math.exp(-0.1 * (ADJUSTMENT_COEFFICIENTS[touchType] * touchesAgainstBelowAverage)));

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

