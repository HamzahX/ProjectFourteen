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
// console.log(mongoURI);

//puppeteer
const dateFormat = require('dateformat');

//helper functions
const countryCodes = require('./countryCodes.js');
const clubsList = JSON.parse(fs.readFileSync(path.join(__dirname, 'clubsList.json')));

var db;
var playersCollection;
var percentileArraysCollection;

var percentiles = {
    'fw': [],
    'am': [],
    'cm': [],
    'fb': [],
    'cb': []
};

let connectToDatabase = async () => {

    return new Promise(function(resolve, reject) {

        console.time('database connection');
        mongoClient.connect(mongoURI, {useUnifiedTopology: true},function (err, client) {
            db = client.db("ProjectFourteen");
            playersCollection = db.collection('Players');
            percentileArraysCollection = db.collection('PercentileArrays');
            console.timeEnd('database connection');
            resolve();
        })

    });

};

//function to retrieve percentile arrays
let setup = async () => {
    return new Promise(async function(resolve, reject){

        percentileArraysCollection.find({}).toArray(function (err, docs) {
            if (err) {
                reject();
            } else if (docs.length === 0) {
                reject();
            } else {
                for (let i=0; i<docs.length; i++){
                    percentiles[docs[i].position] = docs[i].stats;
                }
                resolve(percentiles);
            }
        });

        // resolve();
    });
};

connectToDatabase()
    .then(() =>
        setup()
    )
    .then(() =>
        (app.listen(port), console.log('App is listening on port ' + port))
    )
    .catch(async (anError) => {
        console.log(anError);
    });

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './client/build')));

app.get('/', (req,res) =>{
    res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

app.post('/api/percentiles', (req, res) => {

    res.json(percentiles);

});

app.post('/api/samplePlayers', (req, res) => {

    getSamplePlayers().then(
        (samplePlayers) => {
            setTimeout(function(){
                res.json(samplePlayers)
            }, 300)
        }, () => {
            res.status(400);
            res.json([]);
        }
    )

});

app.post('/api/search', (req, res) => {

    let aQuery = req.body.query;
    let type = req.body.type;
    search(aQuery, type).then(
        (searchResults) => {
            setTimeout(function(){
                res.json(searchResults);
            }, 100)
        },
        () => {
            setTimeout(function(){
                res.status(400);
                res.json([]);
            }, 200)
        });

});

app.post('/api/stats', (req, res) => {

    let aURL = "https://www.whoscored.com/" + req.body.URL;
    aURL = aURL.replace("Show", "History")
        .split("_").join("/");
    getStats(aURL).then(
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
        (err) => {

        });

});

app.get('*', (req,res) =>{
    res.sendFile(path.join(__dirname+'/client/build/index.html'));
});


let search = async (aQuery, type) => {

    return new Promise(async function(resolve, reject){
        console.log("Searching the database for: " + aQuery);
        console.time("Time taken to return search results");
        if (type === "playersAndClubs"){
            let clubSearchResults = [];
            let playerSearchResults = [];
            for (let i=0; i<clubsList.length; i++){
                if (clubsList[i].toUpperCase().includes(aQuery.toUpperCase())){
                    clubSearchResults.push(clubsList[i]);
                }
            }
            playersCollection.find({$text:
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
        else if (type === "playersByClub"){
            playersCollection.find({club: aQuery}).toArray(function(err, docs) {
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
                    // searchResults = searchResults.reverse();
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

let getStats = async (aURL) => {

    return new Promise(async function(resolve, reject){
        console.log("Retrieving stats from the database for: " + aURL);
        console.time("Time taken to return stats");
        playersCollection.find({"url": aURL}).toArray(function (err, docs) {
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

let getSamplePlayers = async () => {

    let samplePlayers = [];

    return new Promise(async function(resolve, reject){
        playersCollection.aggregate([ {$sample: {size: 3}} ]).toArray(function (err, docs) {
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
