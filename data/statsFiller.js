//initialize helpers
const path = require('path');
const fs = require('fs');
const countryCodes = require('./countryCodes.js');

const mean = require('mathjs').mean;
const mlr = require('ml-regression-multivariate-linear');
const {intersect} = require("mathjs");

const scriptName = path.basename(__filename);
const supportedSeasons = ["18-19", "19-20", "20-21", "21-22"];

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

let OUTFIELD_DATA = {};
let OUTFIELD_DATA_SEARCHABLE_BY_CODE = {};
let GK_DATA = {};
let GK_DATA_SEARCHABLE_BY_CODE = {};

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

var MLR_TURNOVERS;
var MLR_PASS_COMPLETION;
var MLR_GK_PASS_COMPLETION;

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

        OUTFIELD_DATA["EPL"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/premierLeague.json`)));
        OUTFIELD_DATA["LA_LIGA"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/laLiga.json`)));
        OUTFIELD_DATA["SERIE_A"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/serieA.json`)));
        OUTFIELD_DATA["BUNDESLIGA"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/bundesliga.json`)));
        OUTFIELD_DATA["LIGUE_1"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/ligue1.json`)));
        OUTFIELD_DATA["CHAMPIONS_LEAGUE"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/championsLeague.json`)));
        OUTFIELD_DATA["EUROPA_LEAGUE"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/europaLeague.json`)));

        for (let competition in OUTFIELD_DATA){
            OUTFIELD_DATA_SEARCHABLE_BY_CODE[competition] = Object.keys(OUTFIELD_DATA[competition]).map((key) => OUTFIELD_DATA[competition][key]);
        }

        GK_DATA["EPL"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/premierLeague_gk.json`)));
        GK_DATA["LA_LIGA"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/laLiga_gk.json`)));
        GK_DATA["SERIE_A"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/serieA_gk.json`)));
        GK_DATA["BUNDESLIGA"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/bundesliga_gk.json`)));
        GK_DATA["LIGUE_1"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/ligue1_gk.json`)));
        GK_DATA["CHAMPIONS_LEAGUE"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/championsLeague_gk.json`)));
        GK_DATA["EUROPA_LEAGUE"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/europaLeague_gk.json`)));

        for (let competition in GK_DATA){
            GK_DATA_SEARCHABLE_BY_CODE[competition] = Object.keys(GK_DATA[competition]).map((key) => GK_DATA[competition][key]);
        }

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

        resolve();

    });

};


let createMultipleRegressionModels = async () => {

    let turnover_inputs = [];
    let turnover_outputs = [];

    let pass_completion_inputs = [];
    let pass_completion_outputs = [];

    let gk_pass_completion_inputs = [];
    let gk_pass_completion_outputs = [];

    let outfieldData = {};

    outfieldData["EPL"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/premierLeague.json`)));
    outfieldData["LA_LIGA"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/laLiga.json`)));
    outfieldData["SERIE_A"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/serieA.json`)));
    outfieldData["BUNDESLIGA"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/bundesliga.json`)));
    outfieldData["LIGUE_1"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/ligue1.json`)));
    outfieldData["CHAMPIONS_LEAGUE"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/championsLeague.json`)));
    outfieldData["EUROPA_LEAGUE"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/europaLeague.json`)));

    let gkData = {};

    gkData["EPL"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/premierLeague_gk.json`)));
    gkData["LA_LIGA"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/laLiga_gk.json`)));
    gkData["SERIE_A"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/serieA_gk.json`)));
    gkData["BUNDESLIGA"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/bundesliga_gk.json`)));
    gkData["LIGUE_1"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/ligue1_gk.json`)));
    gkData["CHAMPIONS_LEAGUE"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/championsLeague_gk.json`)));
    gkData["EUROPA_LEAGUE"] = JSON.parse(fs.readFileSync(path.join(__dirname, `fbrefData/${SEASON}/europaLeague_gk.json`)));

    for (let competition in outfieldData) {

        gkData[competition] = Object.keys(gkData[competition]).map((key) => gkData[competition][key]);

        for (let player in outfieldData[competition]) {

            let playerData = outfieldData[competition][player];

            if (playerData["standard_Min"] < 900)
                continue;

            if (playerData["standard_Pos"] === "GK") {

                let gkPlayerData = gkData[competition].filter(p => p["code"] === playerData["code"])[0];

                if (gkPlayerData === undefined || gkPlayerData === null)
                    continue;

                gk_pass_completion_inputs.push(
                    [
                        playerData["passing_Att"],
                        gkPlayerData["keeper_adv_Att__1"],
                        gkPlayerData["keeper_adv_Att__2"],
                        gkPlayerData["keeper_adv_AvgLen"],
                        gkPlayerData["keeper_adv_AvgLen__1"],
                        playerData["passing_types_Press"]
                    ]
                );

                gk_pass_completion_outputs.push(
                    [
                        playerData["passing_Cmp"]
                    ]
                );

            }
            else {
                turnover_inputs.push(
                    [
                        playerData["possession_Att"],
                        playerData["possession_Def 3rd"],
                        playerData["possession_Mid 3rd"],
                        playerData["possession_Att 3rd"],
                        playerData["possession_Att Pen"],
                        playerData["possession_Prog"]
                    ]
                );

                turnover_outputs.push(
                    [
                        playerData["possession_Dis"] +
                        playerData["possession_Mis"] +
                        playerData["possession_Att"] -
                        playerData["possession_Succ"]
                    ]
                );

                if (playerData["passing_Att"] < 1000)
                    continue;

                pass_completion_inputs.push(
                    [
                        playerData["passing_Att"],
                        playerData["passing_Att__1"],
                        playerData["passing_Att__2"],
                        playerData["passing_Att__3"],
                        playerData["passing_1/3"],
                        playerData["passing_KP"],
                        playerData["passing_Prog"],
                        playerData["passing_types_Live"],
                        playerData["passing_types_FK"],
                        playerData["passing_types_Press"],
                        playerData["passing_types_Sw"],
                        playerData["passing_types_Crs"],
                        playerData["passing_types_CK"],
                        playerData["passing_types_Ground"],
                        playerData["passing_types_Low"],
                        playerData["passing_types_High"],
                        playerData["passing_types_Head"],
                        playerData["passing_types_TI"],
                        playerData["passing_types_Other"]
                    ]
                );

                pass_completion_outputs.push(
                    [
                        playerData["passing_Cmp"]
                    ]
                );
            }

        }

    }

    MLR_TURNOVERS = new mlr(turnover_inputs, turnover_outputs);
    MLR_PASS_COMPLETION = new mlr(pass_completion_inputs, pass_completion_outputs);
    MLR_GK_PASS_COMPLETION = new mlr(gk_pass_completion_inputs, gk_pass_completion_outputs);

};


let processEPLData = async () => {

    let competitionName = "Premier League";

    for (let player in OUTFIELD_DATA["EPL"]){
        processEntry(player, "EPL", competitionName, false)
    }

    for (let gk in GK_DATA["EPL"]){
        processEntry(gk, "EPL", competitionName, true)
    }


};


let processLaLigaData = async () => {

    let competitionName = "La Liga";

    for (let player in OUTFIELD_DATA["LA_LIGA"]){
        processEntry(player, "LA_LIGA", competitionName, false)
    }

    for (let gk in GK_DATA["LA_LIGA"]){
        processEntry(gk, "LA_LIGA", competitionName, true)
    }


};

let processSerieAData = async () => {

    let competitionName = "Serie A";

    for (let player in OUTFIELD_DATA["SERIE_A"]){
        processEntry(player, "SERIE_A", competitionName, false)
    }

    for (let gk in GK_DATA["SERIE_A"]){
        processEntry(gk, "SERIE_A", competitionName, true)
    }


};

let processBundesligaData = async () => {

    let competitionName = "Bundesliga";

    for (let player in OUTFIELD_DATA["BUNDESLIGA"]){
        processEntry(player, "BUNDESLIGA", competitionName, false)
    }

    for (let gk in GK_DATA["BUNDESLIGA"]){
        processEntry(gk, "BUNDESLIGA", competitionName, true)
    }


};

let processLigue1Data = async () => {

    let competitionName = "Ligue 1";

    for (let player in OUTFIELD_DATA["LIGUE_1"]){
        processEntry(player, "LIGUE_1", competitionName, false)
    }

    for (let gk in GK_DATA["LIGUE_1"]){
        processEntry(gk, "LIGUE_1", competitionName, true)
    }


};

let processChampionsLeagueData = async () => {

    let competitionName = "Champions League";

    for (let player in OUTFIELD_DATA["CHAMPIONS_LEAGUE"]){
        processEntry(player, "CHAMPIONS_LEAGUE", competitionName, false)
    }

    for (let gk in GK_DATA["CHAMPIONS_LEAGUE"]){
        processEntry(gk, "CHAMPIONS_LEAGUE", competitionName, true)
    }


};

let processEuropaLeagueData = async () => {

    let competitionName = "Europa League";

    for (let player in OUTFIELD_DATA["EUROPA_LEAGUE"]){
        processEntry(player, "EUROPA_LEAGUE", competitionName, false)
    }

    for (let gk in GK_DATA["EUROPA_LEAGUE"]){
        processEntry(gk, "EUROPA_LEAGUE", competitionName, true)
    }

};


let processEntry = (aPlayer, competitionKey, competitionName, isGoalkeeper) => {

    let competitionData;

    if (isGoalkeeper)
        competitionData = GK_DATA[competitionKey];
    else
        competitionData = OUTFIELD_DATA[competitionKey];

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

    //let possession = POSSESSION_DATA[competitionName][whoscoredClubName];

    let liveTouchesAgainstPer90BelowAverage = TOUCHES_AGAINST_BELOW_AVERAGE[competitionName][whoscoredClubName]["live_per90"];

    let att2ThirdsTouchesAgainstPer90BelowAverage = TOUCHES_AGAINST_BELOW_AVERAGE[competitionName][whoscoredClubName]["att2/3ds_per90"];
    let def2ThirdsTouchesAgainstPer90BelowAverage = TOUCHES_AGAINST_BELOW_AVERAGE[competitionName][whoscoredClubName]["def2/3ds_per90"];
    let attPenAreaTouchesAgainstPer90BelowAverage = TOUCHES_AGAINST_BELOW_AVERAGE[competitionName][whoscoredClubName]["attPenArea_per90"];

    //retrieve required stats from the fbref data (exported CSVs converted to JSON)
    let stats;
    if (isGoalkeeper){

        let outfieldDataForPlayer = OUTFIELD_DATA_SEARCHABLE_BY_CODE[competitionKey].filter(p => p["code"] === entry["code"])[0];

        let expectedCompletedPassesInputs = [
            outfieldDataForPlayer["passing_Att"],
            entry["keeper_adv_Att__1"],
            entry["keeper_adv_Att__2"],
            entry["keeper_adv_AvgLen"],
            entry["keeper_adv_AvgLen__1"],
            outfieldDataForPlayer["passing_types_Press"]
        ];

        let expectedCompletedPasses = MLR_GK_PASS_COMPLETION.predict(expectedCompletedPassesInputs)[0];

        stats = {
            minutes: entry["keeper_Min"],
            goalsAgainst: entry["keeper_adv_GA"] - entry["keeper_adv_OG"],
            psxg: entry["keeper_adv_PSxG"],
            sota: entry["keeper_SoTA"],
            stoppedCrosses: entry["keeper_adv_Stp"],
            attCrosses: entry["keeper_adv_Opp"],
            succLaunchedPasses: entry["keeper_adv_Cmp"],
            attLaunchedPasses: entry["keeper_adv_Att"],
            succPasses: outfieldDataForPlayer["passing_Cmp"],
            expSuccPasses: expectedCompletedPasses,
            attPasses: outfieldDataForPlayer["passing_Att"]
        }

    }
    else {

        let expectedTurnoversInputs = [
            entry["possession_Att"],
            entry["possession_Def 3rd"],
            entry["possession_Mid 3rd"],
            entry["possession_Att 3rd"],
            entry["possession_Att Pen"],
            entry["possession_Prog"]
        ];

        let expectedTurnovers = entry["possession_Dis"] +
            entry["possession_Mis"] +
            entry["possession_Att"] -
            entry["possession_Succ"];

        try{
            expectedTurnovers = MLR_TURNOVERS.predict(expectedTurnoversInputs)[0];
        }
        catch (e) {
        }

        let expectedCompletedPassesInputs = [
            entry["passing_Att"],
            entry["passing_Att__1"],
            entry["passing_Att__2"],
            entry["passing_Att__3"],
            entry["passing_1/3"],
            entry["passing_KP"],
            entry["passing_Prog"],
            entry["passing_types_Live"],
            entry["passing_types_FK"],
            entry["passing_types_Press"],
            entry["passing_types_Sw"],
            entry["passing_types_Crs"],
            entry["passing_types_CK"],
            entry["passing_types_Ground"],
            entry["passing_types_Low"],
            entry["passing_types_High"],
            entry["passing_types_Head"],
            entry["passing_types_TI"],
            entry["passing_types_Other"]
        ];

        let expectedCompletedPasses = entry["passing_Cmp"];

        try{
            expectedCompletedPasses = MLR_PASS_COMPLETION.predict(expectedCompletedPassesInputs)[0];
        }
        catch (e) {
        }

        stats = {

            minutes: entry["standard_Min"],
            touches: entry["possession_Touches"],
            npg: entry["standard_Gls"] - entry["standard_PK"],
            npxg: entry["standard_npxG"],
            shots: entry["shooting_Sh"],
            succAerials: entry["misc_Won"],
            attAerials: entry["misc_Won"] + entry["misc_Lost"],
            boxTouches: entry["possession_Att Pen"],
            ppr: entry["possession_Prog__1"],
            xa: entry["passing_xA"],
            sca: entry["gca_SCA"] - entry["gca_PassDead"],
            ppa: entry["passing_PPA"],
            cpa: entry["possession_CPA"],
            succDribbles: entry["possession_Succ"],
            attDribbles: entry["possession_Att"],
            timesDispossessed: entry["possession_Dis"],
            miscontrols: entry["possession_Mis"],
            failedDribbles: entry["possession_Att"] - entry["possession_Succ"],
            expTurnovers: expectedTurnovers,
            progPasses: entry["passing_Prog"],
            progCarries: entry["possession_Prog"],
            progPassesDistance: entry["passing_PrgDist"],
            progCarriesDistance: entry["possession_PrgDist"],
            progDistance: entry["passing_PrgDist"] + entry["possession_PrgDist"],
            succPasses: entry["passing_Cmp"],
            expSuccPasses: expectedCompletedPasses,
            attPasses: entry["passing_Att"],
            pft: entry["passing_1/3"],
            cft: entry["possession_1/3"],
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
        await createMultipleRegressionModels()
    })
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

