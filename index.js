//express constants
const express = require('express');
const app = express();
const secure = require('express-force-https');
const path = require('path');
const bodyParser = require("body-parser");
const port = process.env.PORT || 5000;

//mongoDB constants
const mongoClient = require('mongodb').MongoClient;
const mongoURI = `mongodb+srv://hamzah:${process.env.MONGOPASSWORD}@cluster0-wz8lb.mongodb.net/test?retryWrites=true&w=majority`;

//database collections
var DB;
var PLAYERS_COLLECTION;
var CLUBS_COLLECTION;
var PERCENTILE_ARRAYS_COLLECTION;

//percentile arrays
var PERCENTILE_ARRAYS = {
    "18-19": {
        'FW': [],
        'AM': [],
        'CM': [],
        'FB': [],
        'CB': [],
        'GK': []
    },
    "19-20": {
        'FW': [],
        'AM': [],
        'CM': [],
        'FB': [],
        'CB': [],
        'GK': []
    },
    "combined": {
        'FW': [],
        'AM': [],
        'CM': [],
        'FB': [],
        'CB': [],
        'GK': []
    },
    "lastUpdated": null
};


//express set-up
app.use(secure);
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/client/build'))

app.get("/", (req, res) => {
    res.sendFile('index.html', { root });
});


/**
 * Sends the percentile arrays to the client upon request
 * @param {express.Request} req
 * @param {express.Response} res
 */
app.post('/api/percentiles', (req, res) => {

    res.json(PERCENTILE_ARRAYS);

});


/**
 * Retrieves three sample players and sends to client upon request
 * @param {express.Request} req
 * @param {express.Response} res
 */
app.post('/api/samplePlayer', (req, res) => {

    getSamplePlayer().then(
        (samplePlayer) => {
            res.json(samplePlayer);
        }, () => {
            res.status(400);
            res.json([]);
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
 * Retrieves player stats and metadata and sends to client upon request
 * @param {express.Request & {body.code : string}} req
 * @param {express.Response} res - Custom object containing the stats and metadata
 */
app.post('/api/stats', (req, res) => {

    //retrieve the player code
    let code = req.body.code;

    //retrieve stats and respond
    getStats(code).then(
        (stats) => {
            //compare the last time the client and server's percentile arrays were updated
            //update client percentile arrays if they are out of date
            let clientLastUpdate = new Date(req.body.percentilesTimestamp).getTime();
            let serverLastUpdate = PERCENTILE_ARRAYS['lastUpdated'].getTime();
            if (req.body.percentilesTimestamp === undefined || clientLastUpdate === serverLastUpdate){
                setTimeout(function(){
                    res.json({
                        stats: stats
                    });
                }, 300)
            }
            else {
                setTimeout(function(){
                    res.json({
                        stats: stats,
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
 * Retrieves player stats and metadata and sends to client upon request
 * @param {express.Request & {body.query : string, body.type : string}} req
 * @param {express.Response} res - Custom object containing the stats and metadata
 */
app.post('/api/comparisonStats', (req, res) => {

    //retrieve the player code
    let codes = req.body.codes;

    //retrieve stats and respond
    getComparisonStats(codes).then(
        (stats) => {
            //compare the last time the client and server's percentile arrays were updated
            //update client percentile arrays if they are out of date
            let clientLastUpdate = new Date(req.body.percentilesTimestamp).getTime();
            let serverLastUpdate = PERCENTILE_ARRAYS['lastUpdated'].getTime();
            if (req.body.percentilesTimestamp === undefined || clientLastUpdate === serverLastUpdate){
                setTimeout(function(){
                    res.json({
                        stats: stats
                    });
                }, 300)
            }
            else {
                setTimeout(function(){
                    res.json({
                        stats: stats,
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


app.get('*', (req, res) => {

    res.sendFile(path.join(__dirname+'/client/build/index.html'));

});


/**
 * Establishes a connection to the MongoDB database
 * @returns {Promise<*>} Promise resolves when the connection has been successfully made
 */
connectToDatabase = async () => {

    return new Promise(function(resolve, reject) {

        console.time('database connection');
        //establish a connection to the database
        mongoClient.connect(mongoURI, {useUnifiedTopology: true},function (err, client) {
            if (err){
                reject()
            }
            else {
                DB = client.db("ProjectFourteen");
                //retrieve to the production collections if it is a production environment
                if (process.env.NODE_ENV === "production"){
                    console.log("production");
                    PLAYERS_COLLECTION = DB.collection('Players');
                    PERCENTILE_ARRAYS_COLLECTION = DB.collection('PercentileArrays');
                }
                //retrieve to the development collections otherwise
                else {
                    PLAYERS_COLLECTION = DB.collection('Players_Dev');
                    PERCENTILE_ARRAYS_COLLECTION = DB.collection('PercentileArrays_Dev');
                }
                //retrieve the clubs collection
                CLUBS_COLLECTION = DB.collection('Clubs');
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
getPercentileArrays = async () => {

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
 * Queries the database to retrieve a random players
 * @returns {Promise<*>} Promise object represents the metadata of the random player
 */
getSamplePlayer = async () => {

    return new Promise(async function(resolve, reject){

        //retrieve 3 players with recorded positions in the 19/20 seasons
        PLAYERS_COLLECTION.aggregate([
            {$match: {"positions.19-20": {$exists: true }}},
            {$match: {"positions.19-20": {$ne: "N/A"}}},
            {$sample: {size: 1}}
        ])
        .toArray(function (err, docs) {
            if (err) {
                reject();
            }
            else if (docs.length === 0) {
                reject();
            }
            else {
                //retrieve sample player metadata and resolve
                let samplePlayer = {
                    code: docs[0].code,
                    name: docs[0].name,
                    clubs: docs[0].clubs,
                    nationality: docs[0].nationality
                };
                resolve(samplePlayer);
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
search = async (aQuery, theType, isLive) => {

    return new Promise(async function(resolve, reject){

        let searchResults = {
            clubSearchResults: [],
            playerSearchResults: [],
        };

        //searching for players and clubs
        if (theType === "playersAndClubs"){

            //re-construct the query without diacritics
            let simplifiedQuery = aQuery
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace("Ø", "O")
                .replace("ø", "o");

            //find clubs whose whoscored or fbref name/simplifiedName includes the query
            CLUBS_COLLECTION.find(
                {$or: [
                    {name: {$regex: new RegExp('^' + aQuery), $options: 'i'}},
                    {name2: {$regex: new RegExp('^' + aQuery), $options: 'i'}},
                    {name3: {$regex: new RegExp('^' + simplifiedQuery), $options: 'i'}},
                    {name4: {$regex: new RegExp('^' + simplifiedQuery), $options: 'i'}},
                    {name: {$regex: " " + aQuery, $options: 'i'}},
                    {name2: {$regex: " " + aQuery, $options: 'i'}},
                    {name3: {$regex: " " + simplifiedQuery, $options: 'i'}},
                    {name4: {$regex: " " + simplifiedQuery, $options: 'i'}},
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
                    searchResults.clubSearchResults.push(docs[i].name);
                }
                //find players whose whoscored or fbref name/simplifiedName includes the query
                PLAYERS_COLLECTION.find(
                    {$or: [
                            {name: {$regex: new RegExp('^' + aQuery), $options: 'i'}},
                            {name2: {$regex: new RegExp('^' + aQuery), $options: 'i'}},
                            {simplifiedName: {$regex: new RegExp('^' + simplifiedQuery), $options: 'i'}},
                            {simplifiedName2: {$regex: new RegExp('^' + simplifiedQuery), $options: 'i'}},
                            {name: {$regex: " " + aQuery, $options: 'i'}},
                            {name2: {$regex: " " + aQuery, $options: 'i'}},
                            {simplifiedName: {$regex: " " + simplifiedQuery, $options: 'i'}},
                            {simplifiedName2: {$regex: " " + simplifiedQuery, $options: 'i'}},
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
                            let result = {
                                code: docs[i].code,
                                name: docs[i].name,
                                nationality: docs[i].nationality,
                                clubs: docs[i].clubs,
                            };
                            searchResults.playerSearchResults.push(result);
                        }
                        resolve(searchResults);
                    }
                });
            });

        }
        //search for players by club
        else if (theType === "playersByClub"){

            //find all players whose array of clubs for the 19/20 season includes the query
            PLAYERS_COLLECTION.find({"clubs.19-20": aQuery}).toArray(function(err, docs) {
                if (err){
                    reject();
                }
                else {
                    //push matched players to search results
                    for (let i=0; i<docs.length; i++){
                        let player = {
                            code: docs[i].code,
                            name: docs[i].name,
                            nationality: docs[i].nationality,
                            clubs: docs[i].clubs,
                        };
                        searchResults.playerSearchResults.push(player);
                    }
                    resolve(searchResults);
                }
            });

        }

    });

};


/**
 * Queries the database for the stats of the requested player
 * @param {string} code - the whoscored.com code of the requested player, which is used as the identifying value in
 *                        the MongoDB database
 * @returns {Promise<*>} Promise object represents the stats of the requested player, along with their metadata.
 */
getStats = async (code) => {

    //parse the code to handle v1 URLs (of the form "Players_[code]_Show_[Name]")
    //v2 only requires the code
    if (code.includes("Players")){
        code = code.split("_")[1];
    }

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
getComparisonStats = async (codes) => {

    let code1 = codes[0];
    let code2 = codes[1];

    let stats = {};

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
                stats[code1] = docs[0];
                //find the player who matches code 1
                PLAYERS_COLLECTION.find({"code": code2.split("|")[0]}).toArray(function (err, docs) {
                    if (err) {
                        reject();
                    }
                    else if (docs.length === 0) {
                        reject();
                    }
                    else {
                        stats[code2] = docs[0];
                        resolve(stats);
                    }
                });
            }
        });

    });

};


/**
 * "Main" function / promise chain
 * Connects to database, retrieves percentile array and begins listening for connections
 */
connectToDatabase()
    .then(() =>
        getPercentileArrays()
    )
    .then(() =>
        (app.listen(port), console.log('App is listening on port ' + port))
    )
    .catch(async (anError) => {
        console.log(anError);
    });


//export functions needed in the unit testing module
module.exports.connectToDatabase = connectToDatabase;
module.exports.getSamplePlayer = getSamplePlayer;
module.exports.search = search;
module.exports.getStats = getStats;
