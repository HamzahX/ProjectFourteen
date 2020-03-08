//express constants
const express = require('express');
const path = require('path');
const app = express();
const bodyParser = require("body-parser");
const port = process.env.PORT || 5000;

//file writer
const fs = require('fs');

//mongoDB constants
const mongoClient = require('mongodb').MongoClient;
const mongoURI = "mongodb+srv://hamzah:" + process.env.MONGOPASSWORD + "@cluster0-wz8lb.mongodb.net/test?retryWrites=true&w=majority";

//helper functions
const countryCodes = require('./countryCodes.js');
const clubsList = JSON.parse(fs.readFileSync(path.join(__dirname, 'clubsList.json')));
const dateFormat = require('dateformat');

//globals
var DB;
var PLAYERSCOLLECTION;
var PERCENTILEARRAYSCOLLECTION;
var PERCENTILES = {
    'fw': [],
    'am': [],
    'cm': [],
    'fb': [],
    'cb': []
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
                PLAYERSCOLLECTION = DB.collection('Players');
                PERCENTILEARRAYSCOLLECTION = DB.collection('PercentileArrays');
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

        PERCENTILEARRAYSCOLLECTION.find({}).toArray(function (err, docs) {
            if (err) {
                reject();
            } else if (docs.length === 0) {
                reject();
            } else {
                for (let i=0; i<docs.length; i++){
                    PERCENTILES[docs[i].position] = docs[i].stats;
                }
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
    res.json(PERCENTILES);
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
 * @param {express.Request & {body.query : string, body.type : string}} req
 * @param {express.Response} res - Custom object containing the search results
 */
app.post('/api/search', (req, res) => {

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

    let URL = "https://www.whoscored.com/" + req.body.URL;
    URL = URL.replace("Show", "History")
        .split("_").join("/");
    getStats(URL).then(
        (response) => {
            setTimeout(function(){
                res.json({
                    url: response.url,
                    name: response.name,
                    club: response.club,
                    stats: response.stats,
                    lastUpdated: response.lastUpdated,
                });
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
 * Searches the database for the specified query
 * @param {string} aQuery - The search query
 * @param {string} theType - The type of search.
*                         "playersAndClubs" returns all players and clubs who match the query
 *                        "playersByClub" returns all players whose club matches the club specified in the query
 * @returns {Promise<*>} Promise object represents the search results that match the query given the search type
 */
let search = async (aQuery, theType) => {

    return new Promise(async function(resolve, reject){
        console.log("Searching the database for: " + aQuery);
        console.time("Time taken to return search results");
        if (theType === "playersAndClubs"){
            let clubSearchResults = [];
            let playerSearchResults = [];
            for (let i=0; i<clubsList.length; i++){
                if (clubsList[i].toUpperCase().includes(aQuery.toUpperCase())){
                    clubSearchResults.push(clubsList[i]);
                }
            }
            PLAYERSCOLLECTION.find({$text:
                {
                    $search: '\"' + aQuery + '\"',
                    $language: "en",
                    $caseSensitive: false,
                    $diacriticSensitive: false
                }
            }).toArray(function(err, docs) {
                if (err){
                    console.timeEnd("Time taken to return search results");
                    reject();
                }
                else if (docs.length === 0){
                    console.timeEnd("Time taken to return search results");
                    let searchResults = {
                        clubSearchResults: clubSearchResults,
                        playerSearchResults: playerSearchResults,
                    };
                    resolve(searchResults);
                }
                else {
                    for (let i=0; i<docs.length; i++){
                        let result = {
                            name: docs[i].name,
                            club: docs[i].club,
                            nationality: countryCodes.getCountryName(docs[i].countryCode.toUpperCase()),
                            URL: docs[i].url,
                            all: false
                        };
                        playerSearchResults.push(result);
                    }
                    playerSearchResults = playerSearchResults.reverse();
                    let searchResults = {
                        clubSearchResults: clubSearchResults,
                        playerSearchResults: playerSearchResults,
                    };
                    console.timeEnd("Time taken to return search results");
                    resolve(searchResults);
                }
            });
        }
        else if (theType === "playersByClub"){
            PLAYERSCOLLECTION.find({club: aQuery}).toArray(function(err, docs) {
                if (err){
                    console.timeEnd("Time taken to return search results");
                    reject();
                }
                else if (docs.length === 0){
                    console.timeEnd("Time taken to return search results");
                    reject();
                }
                else {
                    let playerSearchResults = [];
                    for (let i=0; i<docs.length; i++){
                        let result = {
                            name: docs[i].name,
                            club: docs[i].club,
                            nationality: countryCodes.getCountryName(docs[i].countryCode.toUpperCase()),
                            URL: docs[i].url,
                            all: false
                        };
                        playerSearchResults.push(result);
                    }
                    let searchResults = {
                        clubSearchResults: [],
                        playerSearchResults: playerSearchResults,
                    };
                    console.timeEnd("Time taken to return search results");
                    resolve(searchResults);
                }
            });
        }
    });

};

/**
 * Queries the database for the stats of the requested player
 * @param {string} aURL - the whoscored.com URL of the requested player, which is used as the identifying value in
 *                        the MongoDB database
 * @returns {Promise<*>} Promise object represents the stats of the requested player, along with their metadata.
 */
let getStats = async (aURL) => {

    return new Promise(async function(resolve, reject){
        console.log("Retrieving stats from the database for: " + aURL);
        console.time("Time taken to return stats");
        PLAYERSCOLLECTION.find({"url": aURL}).toArray(function (err, docs) {
            if (err) {
                console.timeEnd("Time taken to return search results");
                reject();
            } else if (docs.length === 0) {
                console.timeEnd("Time taken to return search results");
                reject();
            } else {
                let url = docs[0].url;
                let name = docs[0].name;
                let club = docs[0].club;
                let stats = docs[0].stats;
                let lastUpdated = docs[0].lastUpdated;
                let returnObject = {
                    url: url,
                    name: name,
                    stats: stats,
                    club: club,
                    lastUpdated: dateFormat(lastUpdated, "dd/mm/yyyy, h:MM:ss TT", true)
                };
                console.timeEnd("Time taken to return stats");
                resolve(returnObject);
            }
        });
    });

};

/**
 * queries the database to retrieve 3 random players
 * @returns {Promise<*>} Promise object represents the metadata of the 3 random players
 */
let getSamplePlayers = async () => {

    let samplePlayers = [];

    return new Promise(async function(resolve, reject){
        PLAYERSCOLLECTION.aggregate([ {$sample: {size: 3}} ]).toArray(function (err, docs) {
            if (err) {
                reject();
            } else if (docs.length === 0) {
                reject();
            } else {
                for (let i=0; i<docs.length; i++){
                    let url = docs[i].url;
                    let name = docs[i].name;
                    let club = docs[i].club;
                    let samplePlayer = {
                        url: url,
                        name: name,
                        club: club,
                        nationality: countryCodes.getCountryName(docs[i].countryCode.toUpperCase()),
                    };
                    samplePlayers.push(samplePlayer);
                }
                resolve(samplePlayers);
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
