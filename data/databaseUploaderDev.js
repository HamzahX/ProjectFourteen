//initialize constants
const path = require('path');
const fs = require('fs');
const mongoClient = require('mongodb').MongoClient;
const mongoURI = `mongodb+srv://hamzah:${process.env.MONGOPASSWORD}@cluster0-wz8lb.mongodb.net/test?retryWrites=true&w=majority`;
const union = require('lodash/union');

//globals
let DB;
let CLUBS_COLLECTION;
let COUNTRIES_COLLECTION;
let STATS_REFERENCE_COLLECTION;
let STATS_BY_POSITION_COLLECTION;
let PLAYERS_COLLECTION;
let PERCENTILE_ARRAYS_COLLECTION;
let Z_SCORE_DATA_COLLECTION;

let FBREF_TO_WHOSCORED_TEAMS;
let COUNTRIES;
let STATS_REFERENCE;
let STATS_BY_POSITION;
let PROCESSED;
let PERCENTILE_ARRAYS = {
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
let Z_SCORE_DATA = {};
let POSSESSION_DATA = {
    "18-19": {},
    "19-20": {},
    "20-21": {},
    "21-22": {}
};
let TOP_5_LEAGUE_TEAMS = {
    "_england": [],
    "es": [],
    "it": [],
    "de": [],
    "fr": []
};

let PLAYER_DATA_TIMESTAMP = fs.statSync(path.join(__dirname, '/fbrefData/21-22/premierLeague.json')).mtime;
let PERCENTILE_DATA_TIMESTAMP = fs.statSync(path.join(__dirname, '/percentileData/21-22/GKPercentiles.json')).mtime;

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

    console.time('database connection');

    const client = await mongoClient.connect(mongoURI, {useUnifiedTopology: true});
    DB = client.db("ProjectFourteen");

    CLUBS_COLLECTION = DB.collection("Clubs_Dev");
    COUNTRIES_COLLECTION = DB.collection("Countries_Dev");
    STATS_REFERENCE_COLLECTION = DB.collection("StatsReferenceData_Dev");
    STATS_BY_POSITION_COLLECTION = DB.collection("StatsByPosition_Dev");
    PLAYERS_COLLECTION = DB.collection("Players_Dev");
    PERCENTILE_ARRAYS_COLLECTION = DB.collection("PercentileArrays_Dev");
    Z_SCORE_DATA_COLLECTION = DB.collection("ZScoreData_Dev");

    console.timeEnd('database connection');

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

    await uploadToDevCollection(CLUBS_COLLECTION, bulkInsertArray);

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

    await uploadToDevCollection(COUNTRIES_COLLECTION, bulkInsertArray);

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

    await uploadToDevCollection(STATS_REFERENCE_COLLECTION, bulkInsertArray);

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

    await uploadToDevCollection(STATS_BY_POSITION_COLLECTION, bulkInsertArray);

};


let uploadPlayers = async () => {

    let bulkInsertArray = [];

    for (let player in PROCESSED){

        let playerInfo = PROCESSED[player];

        bulkInsertArray.push({
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

    await uploadToDevCollection(PLAYERS_COLLECTION, bulkInsertArray);

};


let uploadPercentilesArrays = async () => {

    let bulkInsertArray = [];

    for (let season in PERCENTILE_ARRAYS){

        if (season === "combined"){
            for (let position in PERCENTILE_ARRAYS["18-19"]){
                for (let stat in PERCENTILE_ARRAYS["18-19"][position]){
                    let combinedArray = [
                        ...PERCENTILE_ARRAYS["18-19"][position][stat],
                        ...PERCENTILE_ARRAYS["19-20"][position][stat],
                        ...PERCENTILE_ARRAYS["20-21"][position][stat],
                        ...PERCENTILE_ARRAYS["21-22"][position][stat]
                    ];
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

    }

    await uploadToDevCollection(PERCENTILE_ARRAYS_COLLECTION, bulkInsertArray);

};


let uploadZScoreData = async () => {

    let bulkInsertArray = [];

    for (let season in PERCENTILE_ARRAYS){

        if (season === "combined")
            continue;

        for (let position in Z_SCORE_DATA[season]){
            bulkInsertArray.push({
                season: season,
                position: position,
                data: Z_SCORE_DATA[season][position],
                lastUpdated: PERCENTILE_DATA_TIMESTAMP
            })
        }

    }

    await uploadToDevCollection(Z_SCORE_DATA_COLLECTION, bulkInsertArray);

};


let uploadToDevCollection = async(devCollection, bulkInsertArray) => {

    await devCollection.deleteMany({});
    await devCollection.insertMany(bulkInsertArray);

};


let main = async () => {

    await setup();

    console.time('dev database uploading');

    await uploadClubs();
    await uploadCountries();
    await uploadStatsReference();
    await uploadStatsByPosition();
    await uploadPlayers();
    await uploadPercentilesArrays();
    await uploadZScoreData();

    console.timeEnd('dev database uploading');

};


main()
    .then(() => {
        process.exit(0)
    })
    .catch(async (anError) => {
        console.log(anError);
        process.exit(-1);
    });
