//express constants
const express = require('express');
const app = express();
const secure = require('express-force-https');
const path = require('path');
const bodyParser = require('body-parser');
const port = process.env.PORT || 5000;

//lodash functions
const keyBy = require('lodash.keyby');

//mongoDB constants
const mongoClient = require('mongodb').MongoClient;
const mongoURI = `mongodb+srv://hamzah:${process.env.MONGOPASSWORD}@cluster0-wz8lb.mongodb.net/test?retryWrites=true&w=majority`;

//database collections
var DB;
var CLUBS_COLLECTION;
var COUNTRIES_COLLECTION;
var STATS_REFERENCE_COLLECTION;
var STATS_BY_POSITION_COLLECTION;
var PLAYERS_COLLECTION;
var PERCENTILE_ARRAYS_COLLECTION;

var STATS_BY_POSITION = {
    "FW": [],
    "AM": [],
    "CM": [],
    "FB": [],
    "CB": [],
    "GK": []
};

//percentile arrays
var PERCENTILE_ARRAYS = {
    "18-19": {
    },
    "19-20": {
    },
    "20-21": {
    },
    "combined": {
    },
    "lastUpdated": null
};


/**
 * Establishes a connection to the MongoDB database
 * @returns {Promise<*>} Promise resolves when the connection has been successfully made
 */
let connectToDatabase = async () => {

    return new Promise(function(resolve, reject) {

        console.time('database connection');

        //establish a connection to the database
        mongoClient.connect(mongoURI, {useUnifiedTopology: true},function (err, client) {
            if (err){
                reject()
            }
            else {
                DB = client.db("ProjectFourteen");

                if (process.env.NODE_ENV === "production"){
                    console.log("production");
                    CLUBS_COLLECTION = DB.collection('Clubs');
                    COUNTRIES_COLLECTION = DB.collection("Countries");
                    STATS_REFERENCE_COLLECTION = DB.collection("StatsReferenceData");
                    STATS_BY_POSITION_COLLECTION = DB.collection("StatsByPosition");
                    PLAYERS_COLLECTION = DB.collection('Players');
                    PERCENTILE_ARRAYS_COLLECTION = DB.collection('PercentileArrays');
                }
                else {
                    console.log("development");
                    CLUBS_COLLECTION = DB.collection('Clubs_Dev');
                    COUNTRIES_COLLECTION = DB.collection("Countries_Dev");
                    STATS_REFERENCE_COLLECTION = DB.collection("StatsReferenceData_Dev");
                    STATS_BY_POSITION_COLLECTION = DB.collection("StatsByPosition_Dev");
                    PLAYERS_COLLECTION = DB.collection('Players_Dev');
                    PERCENTILE_ARRAYS_COLLECTION = DB.collection('PercentileArrays_Dev');
                }
                console.timeEnd('database connection');
                resolve();
            }
        })

    });

};


/**
 * Retrieves the percentile arrays from the MongoDB database.
 * @returns {Promise<*>} Promise resolves if the arrays have been successfully retrieved, rejects otherwise
 */
let getPercentileArrays = async () => {

    return new Promise(async function(resolve, reject){

        //retrieve all percentile arrays from the database
        PERCENTILE_ARRAYS_COLLECTION.find({}).toArray(async function (err, docs) {
            if (err){
                reject();
            }
            else if (docs.length === 0){
                reject();
            }
            else {
                //populate the percentile array object and record the time of their last update
                for (let i=0; i<docs.length; i++){
                    PERCENTILE_ARRAYS[docs[i].season][docs[i].position] = docs[i].stats;
                }
                PERCENTILE_ARRAYS['lastUpdated'] = docs[0].lastUpdated;
                resolve();
            }
        });

    });

};


/**
 * Retrieves the stats by position arrays from the MongoDB database.
 * @returns {Promise<*>} Promise resolves if the arrays have been successfully retrieved, rejects otherwise
 */
let getStatsByPosition = async () => {

    return new Promise(async function(resolve, reject){

        //retrieve all percentile arrays from the database
        STATS_BY_POSITION_COLLECTION.find({}).toArray(async function (err, docs) {
            if (err){
                reject();
            }
            else if (docs.length === 0){
                reject();
            }
            else {
                //populate the percentile array object and record the time of their last update
                for (let i=0; i<docs.length; i++){
                    STATS_BY_POSITION[docs[i].position] = docs[i].stats;
                }
                resolve();
            }
        });

    });

};


//express set-up
app.use(secure);
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/client/build')));


app.get('*', (req, res) => {

    res.sendFile(path.join(__dirname+'/client/build/index.html'));

});


/**
 * Sends the percentile arrays to the client upon request
 * @param {express.Request} req
 * @param {express.Response} res
 */
app.post('/api/percentiles', (req, res) => {

    //compare the last time the client and server's percentile arrays were updated
    //update client percentile arrays if they are out of date
    let clientLastUpdate = new Date(req.body.percentilesTimestamp).getTime();
    let serverLastUpdate = PERCENTILE_ARRAYS['lastUpdated'].getTime();

    if (req.body.percentilesTimestamp === undefined || clientLastUpdate === serverLastUpdate){
        res.json(null);
    }
    else {
        res.json(PERCENTILE_ARRAYS);
    }


});


/**
 * Retrieves the number of players currently in the database and sends to the client
 * @param {express.Request} req
 * @param {express.Response} res
 */
app.post('/api/databaseSize', (req, res) => {

    getDatabaseSize().then(
        (databaseSize) => {
            res.json(databaseSize);
        }, () => {
            res.status(400);
            res.json([]);
        }
    )

});


/**
 * Retrieves the reference data used to populate advanced search select lists
 * @param {express.Request} req
 * @param {express.Response} res
 */
app.post('/api/referenceData', (req, res) => {

    getReferenceData().then(
        (referenceData) => {
            res.json(referenceData);
        }, () => {
            res.status(400);
            res.json({});
        }
    )

});


/**
 * Retrieves search results and sends to client upon request
 * @param {express.Request & {body.query: string, body.type: string}} req
 * @param {express.Response} res - Custom object containing the search results
 */
app.post('/api/search', (req, res) => {

    //retrieve the search query and the search type
    let query = req.body.query;
    let type = req.body.type;
    let isLive = req.body.isLive;

    //search and respond
    search(query, type, isLive).then(
        (searchResults) => {
            if (isLive){
                res.json(searchResults)
            }
            else{
                setTimeout(function(){
                    res.json(searchResults);
                }, 100)
            }
        },
        () => {
            setTimeout(function(){
                res.status(400);
                res.json([]);
            }, 100)
        });

});


/**
 * Retrieves advanced search results and sends to client upon request
 * @param {express.Request & {body.parameters: object}} req
 * @param {express.Response} res - Custom object containing the search results
 */
app.post('/api/advancedSearch', (req, res) => {

    //retrieve the search query and the search type
    let parameters = req.body.parameters;

    //search and respond
    advancedSearch(parameters).then(
        (searchResults) => {
            setTimeout(function(){
                res.json(searchResults);
            }, 100)
        },
        () => {
            setTimeout(function(){
                res.status(400);
                res.json([]);
            }, 100)
        });

});


/**
 * Retrieves player stats and metadata and sends to client upon request
 * @param {express.Request & {body.code : string}} req
 * @param {express.Response} res - Custom object containing the stats and metadata
 */
app.post('/api/stats', (req, res) => {

    //retrieve the player code
    let code = req.body.code;

    //retrieve stats and respond
    getStats(code).then(
        (data) => {
            //compare the last time the client and server's percentile arrays were updated
            //update client percentile arrays if they are out of date
            let clientLastUpdate = new Date(req.body.percentilesTimestamp).getTime();
            let serverLastUpdate = PERCENTILE_ARRAYS['lastUpdated'].getTime();
            if (req.body.percentilesTimestamp === undefined || clientLastUpdate === serverLastUpdate){
                setTimeout(function(){
                    res.json({
                        data: data,
                        statsByPosition: STATS_BY_POSITION
                    });
                }, 300)
            }
            else {
                setTimeout(function(){
                    res.json({
                        data: data,
                        statsByPosition: STATS_BY_POSITION,
                        newPercentileArrays: PERCENTILE_ARRAYS
                    })
                }, 300)
            }
        },
        () => {
            setTimeout(function(){
                res.status(400);
                res.json({});
            }, 100)
        });

});


/**
 * Retrieves player stats and metadata and sends to client upon request
 * @param {express.Request & {body.query : string, body.type : string}} req
 * @param {express.Response} res - Custom object containing the stats and metadata
 */
app.post('/api/comparisonStats', (req, res) => {

    //retrieve the player code
    let codes = req.body.codes;

    //retrieve stats and respond
    getComparisonStats(codes).then(
        (data) => {
            //compare the last time the client and server's percentile arrays were updated
            //update client percentile arrays if they are out of date
            let clientLastUpdate = new Date(req.body.percentilesTimestamp).getTime();
            let serverLastUpdate = PERCENTILE_ARRAYS['lastUpdated'].getTime();
            if (req.body.percentilesTimestamp === undefined || clientLastUpdate === serverLastUpdate){
                setTimeout(function(){
                    res.json({
                        data: data,
                        statsByPosition: STATS_BY_POSITION
                    });
                }, 300)
            }
            else {
                setTimeout(function(){
                    res.json({
                        data: data,
                        statsByPosition: STATS_BY_POSITION,
                        newPercentileArrays: PERCENTILE_ARRAYS
                    })
                }, 300)
            }
        },
        () => {
            setTimeout(function(){
                res.status(400);
                res.json([]);
            }, 100)
        });

});


/**
 * Queries the database for the number of players currently stored within in
 * @returns {Promise<*>} Single value object containing the number of players
 */
let getDatabaseSize = async () => {

    return new Promise(async function(resolve, reject){

        PLAYERS_COLLECTION.countDocuments({}, function (err, count) {
            if (err){
                console.log(err);
                reject()
            }
            else {
                resolve({value: count})
            }
        })

    });

};


/**
 * Queries the database for the reference data for
 * @returns {Promise<*>} Object containing reference data
 */
let getReferenceData = async () => {

    return new Promise(async function(resolve, reject){

        let referenceData = {
            countries: null,
            clubs: null,
            statsReferenceData: null,
            statsByPosition: null
        };

        COUNTRIES_COLLECTION.find({})
        .toArray(function(err, docs) {
            if (err){
                console.log(err);
                reject();
            }
            else {
                referenceData.countries = docs.sort((a, b) => a.name.localeCompare(b.name));
                CLUBS_COLLECTION.find({})
                .toArray(function(err, docs) {
                    if (err){
                        console.log(err);
                        reject();
                    }
                    else {
                        referenceData.clubs = docs.sort((a, b) => a.name.localeCompare(b.name));
                        STATS_REFERENCE_COLLECTION.find({})
                        .toArray(function(err, docs) {
                            if (err){
                                console.log(err);
                                reject();
                            }
                            else {
                                referenceData.statsReferenceData = keyBy(docs, "key");
                                referenceData.statsByPosition = STATS_BY_POSITION;
                                resolve(referenceData);
                            }
                        });
                    }
                });
            }
        });

    });

};


/**
 * Searches the database for the specified query
 * @param {string} aQuery - The search query
 * @param {string} theType - The type of search.
 *                        "playersAndClubs" returns all players and clubs who match the query
 *                        "playersByClub" returns all players whose club matches the club specified in the query
 * @param {boolean} isLive - Boolean indicating whether or not the search function is being called for a live search
 * @returns {Promise<*>} Promise object represents the search results that match the query given the search type
 */
let search = async (aQuery, theType, isLive) => {

    return new Promise(async function(resolve, reject){

        let searchResults = {
            clubSearchResults: [],
            playerSearchResults: [],
        };

        //searching for players and clubs
        if (theType === "playersAndClubs"){

            //clean the query to remove regex special characters
            aQuery = aQuery.replace(/[|&;$%@"<>()+,\\/\[\]]/g, "");

            //re-construct the query without diacritics
            let simplifiedQuery = aQuery
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace("Ø", "O")
                .replace("ø", "o");

            //build regular expressions to match results where the first word matches the query
            let regex1 = new RegExp('^' + aQuery);
            let regex2 = new RegExp('^' + simplifiedQuery);

            //build regular expressions to match results where any of the other words match the query
            let regex3 = " " + aQuery;
            let regex4 = " " + simplifiedQuery;

            //find clubs whose whoscored or fbref name/simplifiedName includes the query
            CLUBS_COLLECTION.find(
                {$or: [
                    {name: {$regex: regex1, $options: 'i'}},
                    {name2: {$regex: regex1, $options: 'i'}},
                    {name3: {$regex: regex2, $options: 'i'}},
                    {name4: {$regex: regex2, $options: 'i'}},
                    {name: {$regex: regex3, $options: 'i'}},
                    {name2: {$regex: regex3, $options: 'i'}},
                    {name3: {$regex: regex4, $options: 'i'}},
                    {name4: {$regex: regex4, $options: 'i'}},
                ]}
            )
            .limit(isLive ? 5 : 0)
            .toArray(function(err, docs) {
                if (err){
                    console.log(err);
                    reject();
                }
                //push matched clubs to search results
                for (let i=0; i<docs.length; i++){
                    let clubSearchResult = buildClubSearchResult(docs[i]);
                    searchResults.clubSearchResults.push(clubSearchResult);
                }
                //find players whose whoscored or fbref name/simplifiedName includes the query
                PLAYERS_COLLECTION.find(
                    {$or: [
                            {name: {$regex: regex1, $options: 'i'}},
                            {name2: {$regex: regex1, $options: 'i'}},
                            {simplifiedName: {$regex: regex2, $options: 'i'}},
                            {simplifiedName2: {$regex: regex2, $options: 'i'}},
                            {name: {$regex: regex3, $options: 'i'}},
                            {name2: {$regex: regex3, $options: 'i'}},
                            {simplifiedName: {$regex: regex4, $options: 'i'}},
                            {simplifiedName2: {$regex: regex4, $options: 'i'}},
                    ]}
                )
                .limit(isLive ? 10 : 0)
                .toArray(function(err, docs) {
                    if (err){
                        console.log(err);
                        reject();
                    }
                    else {
                        //push matched players to search results
                        for (let i=0; i<docs.length; i++){
                            let playerSearchResult = buildPlayerSearchResult(docs[i]);
                            searchResults.playerSearchResults.push(playerSearchResult);
                        }
                        resolve(searchResults);
                    }
                });
            });

        }
        //search for players by club
        else if (theType === "playersByClub"){

            //find all players whose array of clubs for the 19/20 season includes the query
            PLAYERS_COLLECTION.find({"clubs.20-21": aQuery}).toArray(function(err, docs) {
                if (err){
                    reject();
                }
                else {
                    //push matched players to search results
                    for (let i=0; i<docs.length; i++){
                        let playerSearchResult = buildPlayerSearchResult(docs[i]);
                        searchResults.playerSearchResults.push(playerSearchResult);
                    }
                    resolve(searchResults);
                }
            });

        }

    });

};


/**
 * Searches the database for the specified query parameters
 * @param {object} parameters - The search query
 * @returns {Promise<*>} Promise object represents the search results that match the query given the search type
 */
let advancedSearch = async (parameters) => {

    let query = {
        '$and': []
    };

    let season = parameters.season;

    if (season !== null){

        query['$and'].push({
            [`stats.${season}`]: {$exists: true}
        })

    }

    if (parameters.ages !== undefined){

        let minAge = parameters.ages.min || -Infinity;
        let maxAge = parameters.ages.max || Infinity;

        query['$and'].push({
            age: {
                '$gte': minAge,
                '$lte': maxAge
            }
        })

    }

    if (parameters.nationalities.length > 0){

        query['$and'].push({
            countryCodes: {
                '$in': parameters.nationalities,
            }
        })

    }

    if (parameters.leagues.length > 0){

        query['$and'].push({
            [`leagues.${season}`]: {
                '$in': parameters.leagues,
            }
        })

    }

    if (parameters.clubs.length > 0){

        query['$and'].push({
            [`clubs.${season}`]: {
                '$in': parameters.clubs,
            }
        })

    }

    if (parameters.positions.length > 0){

        query['$and'].push({
            [`positions.${season}`]: {
                '$in': parameters.positions,
            }
        })

    }

    if (Object.keys(parameters.aggregateStats).length > 0){

        for (let stat in parameters.aggregateStats){

            let min = parameters.aggregateStats[stat].min || -Infinity;
            let max = parameters.aggregateStats[stat].max || Infinity;

            query['$and'].push({
                [`lookupStats.aggregateStats.${season}.${stat}`]: {
                    '$gte': min,
                    '$lte': max
                }
            })

        }

    }

    if (Object.keys(parameters.rawStats).length > 0){

        for (let stat in parameters.rawStats){

            let min = parameters.rawStats[stat].min || -Infinity;
            let max = parameters.rawStats[stat].max || Infinity;

            query['$and'].push({
                [`lookupStats.rawStats.${season}.${stat}`]: {
                    '$gte': min,
                    '$lte': max
                }
            })

        }

    }

    if (Object.keys(parameters.percentileRanks).length > 0){

        for (let stat in parameters.percentileRanks){

            let min = parameters.percentileRanks[stat].min || 0;
            let max = parameters.percentileRanks[stat].max || 100;

            query['$and'].push({
                [`lookupStats.percentileRanks.${season}.${parameters.positions[0]}.${stat}`]: {
                    '$gte': min,
                    '$lte': max
                }
            })

        }

    }

    let searchResults = [];

    return new Promise(async function(resolve, reject){

        //find the player who match the query
        PLAYERS_COLLECTION.find(query).toArray(function (err, docs) {
            if (err) {
                reject();
            }
            else if (docs.length === 0) {
                resolve(searchResults);
            }
            else {

                for (let i=0; i<docs.length; i++){

                    let playerSearchResult = buildPlayerSearchResult(docs[i]);

                    for (let stat in parameters.aggregateStats){
                        playerSearchResult[`aggregate_${stat}`] = docs[i].lookupStats.aggregateStats[parameters.season][stat];
                    }

                    for (let stat in parameters.rawStats){
                        playerSearchResult[`raw_${stat}`] = docs[i].lookupStats.rawStats[parameters.season][stat];
                    }

                    for (let stat in parameters.percentileRanks){
                        playerSearchResult[`percentile_${stat}`] = docs[i].lookupStats.percentileRanks[parameters.season][parameters.positions[0]][stat];
                    }

                    searchResults.push(playerSearchResult);

                }

                let statsFields = Object.keys(searchResults[0]).filter(i =>
                    (i.startsWith("aggregate") ||
                     i.startsWith("raw") ||
                     i.startsWith("percentile")) &&
                     i !== "aggregate_minutes"
                );

                if (statsFields.length > 0){
                    let fieldToSort = statsFields[0];
                    searchResults.sort((a, b) => { return parseFloat(b[fieldToSort]) - parseFloat(a[fieldToSort]) });
                }

                resolve(searchResults);

            }
        });

    });

};


/**
 * Queries the database for the stats of the requested player
 * @param {string} code - the whoscored.com code of the requested player, which is used as the identifying value in
 *                        the MongoDB database
 * @returns {Promise<*>} Promise object represents the stats of the requested player, along with their metadata.
 */
let getStats = async (code) => {

    return new Promise(async function(resolve, reject){

        //find the player who matches the requested code
        PLAYERS_COLLECTION.find({"code": code}).toArray(function (err, docs) {
            if (err) {
                reject();
            }
            else if (docs.length === 0) {
                reject();
            }
            else {
                resolve(docs[0]);
            }
        });

    });

};


/**
 * Queries the database for the stats of the requested players
 * @param {string} codes - the whoscored.com codes of the requested players, which is used as the identifying value in
 *                        the MongoDB database
 * @returns {Promise<*>} Promise object represents the stats of the requested players, along with their metadata.
 */
let getComparisonStats = async (codes) => {

    let code1 = codes[0];
    let code2 = codes[1];

    let data = {};

    return new Promise(async function(resolve, reject){

        //find the player who matches code 1
        PLAYERS_COLLECTION.find({"code": code1.split("|")[0]}).toArray(function (err, docs) {
            if (err) {
                reject();
            }
            else if (docs.length === 0) {
                reject();
            }
            else {
                data[code1] = docs[0];
                //find the player who matches code 1
                PLAYERS_COLLECTION.find({"code": code2.split("|")[0]}).toArray(function (err, docs) {
                    if (err) {
                        reject();
                    }
                    else if (docs.length === 0) {
                        reject();
                    }
                    else {
                        data[code2] = docs[0];
                        resolve(data);
                    }
                });
            }
        });

    });

};


let buildClubSearchResult = (doc) => {

    return {
        name: doc.name,
        countryCode: doc.countryCode
    };

};


let buildPlayerSearchResult = (doc) => {

    return {
        code: doc.code,
        name: doc.name,
        age: doc.age,
        nationalities: doc.nationalities,
        countryCodes: doc.countryCodes,
        leagues: doc.leagues,
        clubs: doc.clubs,
        positions: doc.positions
    };

};


/**
 * "Main" function / promise chain
 * Connects to database, retrieves percentile array and begins listening for connections
 */
connectToDatabase()
    .then(() =>
        getStatsByPosition()
    )
    .then(() =>
        getPercentileArrays()
    )
    .then(() =>
        (app.listen(port), console.log('App is listening on port ' + port))
    )
    .catch(async (anError) => {
        console.log(anError);
    });
