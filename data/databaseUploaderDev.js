//initialize constants
const path = require('path');
const fs = require('fs');
const mongoClient = require('mongodb').MongoClient;
const mongoURI = `mongodb+srv://hamzah:${process.env.MONGOPASSWORD}@cluster0-wz8lb.mongodb.net/test?retryWrites=true&w=majority`;
const union = require('lodash/union');
const keyBy = require('lodash.keyby');

//globals
var DB;
var CLUBS_COLLECTION;
var COUNTRIES_COLLECTION;
var STATS_REFERENCE_COLLECTION;
var STATS_BY_POSITION_COLLECTION;
var PLAYERS_COLLECTION;
var PERCENTILE_ARRAYS_COLLECTION;
var Z_SCORE_DATA_COLLECTION;

var FBREF_TO_WHOSCORED_TEAMS;
var COUNTRIES;
var STATS_REFERENCE;
var STATS_BY_POSITION;
var PROCESSED;
var PERCENTILE_ARRAYS = {
    "18-19": {
        'FW': {},
        'AM': {},
        'CM': {},
        'FB': {},
        'CB': {},
        'GK': {}
    },
    "19-20": {
        'FW': {},
        'AM': {},
        'CM': {},
        'FB': {},
        'CB': {},
        'GK': {}
    },
    "20-21": {
        'FW': {},
        'AM': {},
        'CM': {},
        'FB': {},
        'CB': {},
        'GK': {}
    },
    "21-22": {
        'FW': {},
        'AM': {},
        'CM': {},
        'FB': {},
        'CB': {},
        'GK': {}
    },
    "combined": {
        'FW': {},
        'AM': {},
        'CM': {},
        'FB': {},
        'CB': {},
        'GK': {}
    }
};
var Z_SCORE_DATA = {};
var POSSESSION_DATA = {
    "18-19": {

    },
    "19-20": {

    },
    "20-21": {

    }
};
var TOP_5_LEAGUE_TEAMS = {
    "_england": [],
    "es": [],
    "it": [],
    "de": [],
    "fr": []
};

var PLAYER_DATA_TIMESTAMP = fs.statSync(path.join(__dirname, '/fbrefData/21-22/premierLeague.json')).mtime;
var PERCENTILE_DATA_TIMESTAMP = fs.statSync(path.join(__dirname, '/percentileData/21-22/GKPercentiles.json')).mtime;

console.log(PLAYER_DATA_TIMESTAMP);

let setup = async () => {

    FBREF_TO_WHOSCORED_TEAMS = JSON.parse(fs.readFileSync(path.join(__dirname, '/teamMappingData/fbrefToWhoscored.json')));
    COUNTRIES = JSON.parse(fs.readFileSync(path.join(__dirname, '/referenceData/countries.json')));
    STATS_REFERENCE = JSON.parse(fs.readFileSync(path.join(__dirname, '/referenceData/allStats.json')));
    STATS_BY_POSITION = JSON.parse(fs.readFileSync(path.join(__dirname, '/referenceData/statsByPosition.json')));
    PROCESSED = JSON.parse(fs.readFileSync(path.join(__dirname, '/playerData/processed.json')));

    for (let season in PERCENTILE_ARRAYS){
        if (season !== "combined"){
            PERCENTILE_ARRAYS[season]['FW'] = JSON.parse(fs.readFileSync(path.join(__dirname, `/percentileData/${season}/FWPercentiles.json`)));
            PERCENTILE_ARRAYS[season]['AM'] = JSON.parse(fs.readFileSync(path.join(__dirname, `/percentileData/${season}/AMPercentiles.json`)));
            PERCENTILE_ARRAYS[season]['CM'] = JSON.parse(fs.readFileSync(path.join(__dirname, `/percentileData/${season}/CMPercentiles.json`)));
            PERCENTILE_ARRAYS[season]['FB'] = JSON.parse(fs.readFileSync(path.join(__dirname, `/percentileData/${season}/FBPercentiles.json`)));
            PERCENTILE_ARRAYS[season]['CB'] = JSON.parse(fs.readFileSync(path.join(__dirname, `/percentileData/${season}/CBPercentiles.json`)));
            PERCENTILE_ARRAYS[season]['GK'] = JSON.parse(fs.readFileSync(path.join(__dirname, `/percentileData/${season}/GKPercentiles.json`)));

            Z_SCORE_DATA[season] = JSON.parse(fs.readFileSync(path.join(__dirname, `/zScoreData/${season}.json`)));
        }
    }

    //use the team names from the possession data objects to populate arrays of team names for each top 5 league
    for (let season in POSSESSION_DATA){
        //load the possession data for the season
        let temp = POSSESSION_DATA[season];
        temp = JSON.parse(fs.readFileSync(path.join(__dirname, `/possessionData/${season}.json`)));
        //iterate through each competition in possession data
        for (let competition in temp){
            //list teams for the competition
            let teams = Object.keys(temp[competition]);
            //add to appropriate array in TOP_5_LEAGUE_TEAMS
            if (competition === "Premier League"){
                TOP_5_LEAGUE_TEAMS["_england"] = union(TOP_5_LEAGUE_TEAMS["_england"], teams);
            }
            else if (competition === "La Liga"){
                TOP_5_LEAGUE_TEAMS["es"] = union(TOP_5_LEAGUE_TEAMS["es"], teams);
            }
            else if (competition === "Serie A"){
                TOP_5_LEAGUE_TEAMS["it"] = union(TOP_5_LEAGUE_TEAMS["it"], teams);
            }
            else if (competition === "Bundesliga"){
                TOP_5_LEAGUE_TEAMS["de"] = union(TOP_5_LEAGUE_TEAMS["de"], teams);
            }
            else if (competition === "Ligue 1"){
                TOP_5_LEAGUE_TEAMS["fr"] = union(TOP_5_LEAGUE_TEAMS["fr"], teams);
            }
        }
    }

    return new Promise(function(resolve, reject) {

        console.time('database connection');

        mongoClient.connect(mongoURI, {useUnifiedTopology: true},function (err, client) {

            if (err) {
                console.log(err);
                reject();
            }

            DB = client.db("ProjectFourteen");

            CLUBS_COLLECTION = DB.collection("Clubs_Dev");
            COUNTRIES_COLLECTION = DB.collection("Countries_Dev");
            STATS_REFERENCE_COLLECTION = DB.collection("StatsReferenceData_Dev");
            STATS_BY_POSITION_COLLECTION = DB.collection("StatsByPosition_Dev");
            PLAYERS_COLLECTION = DB.collection("Players_Dev");
            PERCENTILE_ARRAYS_COLLECTION = DB.collection("PercentileArrays_Dev");
            Z_SCORE_DATA_COLLECTION = DB.collection("ZScoreData_Dev");

            console.timeEnd('database connection');

            resolve();

        })

    });

};


let uploadClubs = async () => {

    let bulkInsertArray = [];

    for (let fbrefClub in FBREF_TO_WHOSCORED_TEAMS){

        let whoscoredClub = FBREF_TO_WHOSCORED_TEAMS[fbrefClub]["whoscored"];

        for (let country in TOP_5_LEAGUE_TEAMS){

            if (TOP_5_LEAGUE_TEAMS[country].includes(whoscoredClub)){
                bulkInsertArray.push({
                    name: whoscoredClub,
                    name2: fbrefClub,
                    name3: whoscoredClub
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace("Ø", "O")
                        .replace("ø", "o"),
                    name4: fbrefClub
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace("Ø", "O")
                        .replace("ø", "o"),
                    countryCode: country
                });
            }

        }

    }

    return new Promise(async function(resolve, reject){

        CLUBS_COLLECTION.deleteMany({}).then(
            () => {
                CLUBS_COLLECTION.insertMany(bulkInsertArray, async function(err, res) {
                    if (err) {
                        console.log(err);
                    }
                    resolve();
                });
            }
        );

    });

};


let uploadCountries = async () => {

    let bulkInsertArray = [];

    let allPlayerCountryCodes = [];

    for (let player in PROCESSED){

        let countryCodes = PROCESSED[player].countryCodes;

        for (let i=0; i<countryCodes.length; i++){

            let countryCode = countryCodes[i];

            if (!allPlayerCountryCodes.includes(countryCode)){
                allPlayerCountryCodes.push(countryCode.toUpperCase());
            }

        }

    }

    for (let countryCode in COUNTRIES){

        if (!allPlayerCountryCodes.includes(countryCode.toUpperCase())){
            continue;
        }

        bulkInsertArray.push({
            code: countryCode,
            name: COUNTRIES[countryCode]
        })

    }

    return new Promise(async function(resolve, reject){

        COUNTRIES_COLLECTION.deleteMany({}).then(
            () => {
                COUNTRIES_COLLECTION.insertMany(bulkInsertArray, async function(err, res) {
                    if (err) {
                        console.log(err);
                    }
                    resolve();
                });
            }
        );

    });

};


let uploadStatsReference = async () => {

    let bulkInsertArray = [];

    for (let stat in STATS_REFERENCE){

        let statInfo = STATS_REFERENCE[stat];

        bulkInsertArray.push({
            key: stat,
            label: statInfo["label"],
            mobileLabel: statInfo["mobileLabel"],
            suffix: statInfo["suffix"],
            isReversed: statInfo["isReversed"],
            displayOrder: statInfo["displayOrder"],
            types: statInfo["types"],
            precision: statInfo["precision"],
            step: statInfo["step"],
            step_agg: statInfo["step_agg"],
            ranges: statInfo["ranges"],
            ranges_agg: statInfo["ranges_agg"]
        })

    }

    return new Promise(async function (resolve, reject) {

        STATS_REFERENCE_COLLECTION.deleteMany({}).then(
            () => {
                STATS_REFERENCE_COLLECTION.insertMany(bulkInsertArray, function(err, res) {
                    if (err) {
                        console.log(err);
                    }
                    resolve();
                });
            }
        );

    });

};


let uploadStatsByPosition = async () => {

    let bulkInsertArray = [];

    for (let position in STATS_BY_POSITION){

        let stats = STATS_BY_POSITION[position];

        bulkInsertArray.push({
            position: position,
            stats: stats
        })

    }

    return new Promise(async function (resolve, reject) {

        STATS_BY_POSITION_COLLECTION.deleteMany({}).then(
            () => {
                STATS_BY_POSITION_COLLECTION.insertMany(bulkInsertArray, function(err, res) {
                    if (err) {
                        console.log(err);
                    }
                    resolve();
                });
            }
        );

    });

};


let uploadPlayers = async () => {

    let batch = PLAYERS_COLLECTION.initializeOrderedBulkOp();

    for (let player in PROCESSED){

        let playerInfo = PROCESSED[player];

        batch.insert({
            code: player,
            fbrefCode: playerInfo["fbrefCode"],
            fbrefURL: playerInfo["fbrefURL"],
            name: playerInfo["name"],
            name2: playerInfo["name2"],
            simplifiedName: playerInfo["simplifiedName"],
            simplifiedName2: playerInfo["simplifiedName2"],
            age: playerInfo["age"],
            countryCodes: playerInfo["countryCodes"],
            nationalities: playerInfo["nationalities"],
            leagues: playerInfo["leagues"],
            clubs: playerInfo["clubs"],
            positions: playerInfo["positions"],
            displayPositions: playerInfo["displayPositions"],
            percentileEntries: playerInfo["percentileEntries"],
            stats: playerInfo["stats"],
            outfieldGKStats: playerInfo["outfieldGKStats"],
            lookupStats: playerInfo["lookupStats"],
            lastUpdated: PLAYER_DATA_TIMESTAMP
        })

    }

    return new Promise(async function (resolve, reject) {

        PLAYERS_COLLECTION.deleteMany({}).then(
            () => {
                batch.execute(function(err, result) {
                    if (err){
                        console.log(err);
                    }
                    resolve();
                });
            }
        );

    });

};


let uploadPercentilesArrays = async () => {

    return new Promise(function (resolve, reject) {

        (async function loop() {

            for (let season in PERCENTILE_ARRAYS){

                let bulkInsertArray = [];

                if (season === "combined"){
                    for (let position in PERCENTILE_ARRAYS["18-19"]){
                        for (let stat in PERCENTILE_ARRAYS["18-19"][position]){
                            let combinedArray = [...PERCENTILE_ARRAYS["18-19"][position][stat], ...PERCENTILE_ARRAYS["19-20"][position][stat], ...PERCENTILE_ARRAYS["20-21"][position][stat]];
                            combinedArray.sort(function(a, b){return a - b});
                            PERCENTILE_ARRAYS["combined"][position][stat] = combinedArray;
                        }
                    }
                }

                for (let position in PERCENTILE_ARRAYS[season]){
                    bulkInsertArray.push({
                        season: season,
                        position: position,
                        stats: PERCENTILE_ARRAYS[season][position],
                        lastUpdated: PERCENTILE_DATA_TIMESTAMP
                    })
                }

                await new Promise(function (resolve, reject) {
                    PERCENTILE_ARRAYS_COLLECTION.deleteMany({season: season}).then(
                        () => {
                            PERCENTILE_ARRAYS_COLLECTION.insertMany(bulkInsertArray, function(err, res) {
                                if (err) {
                                    console.log(err);
                                }
                                resolve();
                            });
                        }
                    );
                });

            }

            resolve();

        })();

    });

};


let uploadZScoreData = async () => {

    return new Promise(function (resolve, reject) {

        (async function loop() {

            for (let season in PERCENTILE_ARRAYS){

                if (season === "combined")
                    continue;

                let bulkInsertArray = [];

                for (let position in Z_SCORE_DATA[season]){
                    bulkInsertArray.push({
                        season: season,
                        position: position,
                        data: Z_SCORE_DATA[season][position],
                        lastUpdated: PERCENTILE_DATA_TIMESTAMP
                    })
                }

                await new Promise(function (resolve, reject) {
                    Z_SCORE_DATA_COLLECTION.deleteMany({season: season}).then(
                        () => {
                            Z_SCORE_DATA_COLLECTION.insertMany(bulkInsertArray, function(err, res) {
                                if (err) {
                                    console.log(err);
                                }
                                resolve();
                            });
                        }
                    );
                });

            }

            resolve();

        })();

    });

};


console.time('dev database uploading');
setup()
    .then(async () => {
        await uploadClubs()
    })
    .then(async () => {
        await uploadCountries()
    })
    .then(async () => {
        await uploadStatsReference()
    })
    .then(async () => {
        await uploadStatsByPosition()
    })
    .then(async () => {
        await uploadPlayers()
    })
    .then(async () => {
        await uploadPercentilesArrays()
    })
    .then(async () => {
        await uploadZScoreData()
    })
    .then(async () => {
        console.timeEnd('dev database uploading');
        process.exit(0);
    })
    .catch(async(anError) => {
        console.log(anError);
        process.exit(-1);
    });
