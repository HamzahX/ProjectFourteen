//express constants
const express = require('express');
const path = require('path');
const app = express();
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

//object containing percentile arrays
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
    "combined": {
        'FW': {},
        'AM': {},
        'CM': {},
        'FB': {},
        'CB': {},
        'GK': {}
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
        mongoClient.connect(mongoURI, {useUnifiedTopology: true},function (err, client) {
            if(err){
                reject()
            }
            else {
                DB = client.db("ProjectFourteen");
                if (process.env.NODE_ENV === "production"){ //production environment
                    console.log("production");
                    PLAYERS_COLLECTION = DB.collection('Players');
                    PERCENTILE_ARRAYS_COLLECTION = DB.collection('PercentileArrays');
                }
                else { //dev environment
                    PLAYERS_COLLECTION = DB.collection('DevPlayers');
                    PERCENTILE_ARRAYS_COLLECTION = DB.collection('DevPercentileArrays');
                }
                CLUBS_COLLECTION = DB.collection('Clubs');
                console.timeEnd('database connection');
                resolve();
            }
        })

    });

};

/**
 * Retrieves the percentile arrays from the MongoDB database.
 * @returns {Promise<*>} Promise resolves when the arrays have been successfully retrieved
 */
let getPercentileArrays = async () => {

    return new Promise(async function(resolve, reject){

        PERCENTILE_ARRAYS_COLLECTION.find({}).toArray(async function (err, docs) {
            if (err) {
                reject();
            }
            else if (docs.length === 0) {
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

//express set-up
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './client/build')));

/**
 * Serves the SPA
 * @param {express.Request} req
 * @param {express.Response} res
 */
app.get('/', (req, res) =>{
    res.sendFile(path.join(__dirname+'/client/build/index.html'));
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
 * Sends three sample players to the client upon request
 * @param {express.Request} req
 * @param {express.Response} res
 */
app.post('/api/samplePlayers', (req, res) => {

    getSamplePlayers().then(
        (samplePlayers) => {
            setTimeout(function(){
                res.json(samplePlayers);
            }, 300);
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

    // if (req.headers.host.includes("herokuapp")){
    //     res.redirect(301, 'http://www.footballslices.com' + req.path)
    // }

    let query = req.body.query;
    let type = req.body.type;
    search(query, type).then(
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
 * @param {express.Request & {body.query : string, body.type : string}} req
 * @param {express.Response} res - Custom object containing the stats and metadata
 */
app.post('/api/stats', (req, res) => {

    // if (req.headers.host.includes("herokuapp")){
    //     res.redirect(301, 'http://www.footballslices.com' + req.path)
    // }

    let code = req.body.code;
    getStats(code).then(
        (stats) => {
            setTimeout(function(){
                //compare the last time the client and server's percentile arrays were updated
                let clientLastUpdate = new Date(req.body.percentilesTimestamp).getTime();
                let serverLastUpdate = PERCENTILE_ARRAYS['lastUpdated'].getTime();
                if (req.body.percentilesTimestamp === undefined || clientLastUpdate === serverLastUpdate){
                    res.json(stats);
                }
                else { //update client percentile arrays if they are out of date
                    res.json({
                        stats: stats,
                        newPercentileArrays: PERCENTILE_ARRAYS
                    })
                }
            }, 300)
        },
        () => {
            setTimeout(function(){
                res.status(400);
                res.json([]);
            }, 100)
        });

});


app.get('*', (req,res) =>{
    res.sendFile(path.join(__dirname+'/client/build/index.html'));
});


/**
 * queries the database to retrieve 3 random players
 * @returns {Promise<*>} Promise object represents the metadata of the 3 random players
 */
let getSamplePlayers = async () => {

    let samplePlayers = [];

    return new Promise(async function(resolve, reject){
        PLAYERS_COLLECTION.aggregate([
            {$match: {"positions.19-20": {$exists: true }}}, //players with 19-20 stats
            {$match: {"positions.19-20": {$ne: "N/A"}}}, //players with a position recorded for 19-20
            {$sample: {size: 3}}
        ])
            .toArray(function (err, docs) {
                if (err) {
                    reject();
                } else if (docs.length === 0) {
                    reject();
                } else {
                    for (let i=0; i<docs.length; i++){
                        //retrieve sample player info and push to array
                        let samplePlayer = {
                            code: docs[i].code,
                            name: docs[i].name,
                            clubs: docs[i].clubs,
                            nationality: docs[i].nationality
                        };
                        samplePlayers.push(samplePlayer);
                    }
                    resolve(samplePlayers);
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
 * @returns {Promise<*>} Promise object represents the search results that match the query given the search type
 */
let search = async (aQuery, theType) => {

    return new Promise(async function(resolve, reject){
        //searching for players and clubs
        if (theType === "playersAndClubs"){
            //remove diacritics from the query
            let simplifiedQuery = aQuery
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace("Ø", "O")
                .replace("ø", "o");
            console.log("Searching for: " + aQuery);
            let clubSearchResults = [];
            let playerSearchResults = [];
            CLUBS_COLLECTION.find(
                {$or: [
                    {name: {$regex: aQuery, $options: 'i'}},
                    {name2: {$regex: aQuery, $options: 'i'}},
                    {name3: {$regex: simplifiedQuery, $options: 'i'}},
                    {name4: {$regex: simplifiedQuery, $options: 'i'}},
                ]}
            )
            .toArray(function(err, docs) {
                if (err){
                    console.log(err);
                    reject();
                }
                for (let i=0; i<docs.length; i++){
                    clubSearchResults.push(docs[i].name);
                }
                PLAYERS_COLLECTION.find(
                    {$or: [
                        {name: {$regex: aQuery, $options: 'i'}},
                        {name2: {$regex: aQuery, $options: 'i'}},
                        {simplifiedName: {$regex: simplifiedQuery, $options: 'i'}},
                        {simplifiedName2: {$regex: simplifiedQuery, $options: 'i'}},
                    ]}
                )
                .toArray(function(err, docs) {
                    if (err){
                        console.log(err);
                        reject();
                    }
                    else if (docs.length === 0){
                        let searchResults = {
                            clubSearchResults: clubSearchResults,
                            playerSearchResults: playerSearchResults,
                        };
                        resolve(searchResults);
                    }
                    else {
                        for (let i=0; i<docs.length; i++){
                            let result = {
                                code: docs[i].code,
                                name: docs[i].name,
                                nationality: docs[i].nationality,
                                clubs: docs[i].clubs,
                            };
                            playerSearchResults.unshift(result);
                        }
                        let searchResults = {
                            clubSearchResults: clubSearchResults,
                            playerSearchResults: playerSearchResults,
                        };
                        resolve(searchResults);
                    }
                });
            });
        }
        else if (theType === "playersByClub"){
            console.log("Retrieving players who play for: " + aQuery);
            PLAYERS_COLLECTION.find({"clubs.19-20": aQuery}).toArray(function(err, docs) {
                if (err){
                    reject();
                }
                else if (docs.length === 0){
                    reject();
                }
                else {
                    let playerSearchResults = [];
                    for (let i=0; i<docs.length; i++){
                        let result = {
                            code: docs[i].code,
                            name: docs[i].name,
                            nationality: docs[i].nationality,
                            clubs: docs[i].clubs,
                        };
                        playerSearchResults.push(result);
                    }
                    let searchResults = {
                        clubSearchResults: [],
                        playerSearchResults: playerSearchResults,
                    };
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
let getStats = async (code) => {

    return new Promise(async function(resolve, reject){
        console.log("Retrieving stats for: " + code);
        PLAYERS_COLLECTION.find({"code": code}).toArray(function (err, docs) {
            if (err) {
                reject();
            } else if (docs.length === 0) {
                reject();
            } else {
                resolve(docs[0]);
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

module.exports.connectToDatabase = connectToDatabase;
module.exports.search = search;
module.exports.getStats = getStats;
module.exports.getSamplePlayers = getSamplePlayers;
