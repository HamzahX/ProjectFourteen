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
const countryCodes = require('./serverUtils/countryCodes.js');

var db;
var currentSeasonCollection;
var percentilesCollection;

let percentiles = {
    'fw': [],
    'am': [],
    'cm': [],
    'fb': [],
    'cb': []
};

//function to launch a browser using puppeteer, retrieve percentile arrays
let setup = async () => {
    return new Promise(async function(resolve, reject){

        percentilesCollection.find({}).toArray(function (err, docs) {
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

        resolve();
    });
};

let connectToDatabase = async () => {

    return new Promise(function(resolve, reject) {

        console.time('database connection');
        mongoClient.connect(mongoURI, {useUnifiedTopology: true},function (err, client) {
            db = client.db("ProjectFourteen");
            currentSeasonCollection = db.collection('CurrentSeason');
            percentilesCollection = db.collection('Percentiles');
            console.timeEnd('database connection');
            resolve();
        })

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

app.post('/api/search', (req, res) => {

    let aQuery = req.body.query;
    search(aQuery).then(
        (searchResults) => {
            setTimeout(function(){
                res.json(searchResults);
            }, 500)
        },
        () => {
            setTimeout(function(){
                res.status(400);
                res.json([]);
            }, 500)
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
                    lastUpdated: response.lastUpdated,
                    stats: response.stats
                });
            }, 1000)
        },
        (err) => {

        });

});

app.get('*', (req,res) =>{
    res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

let search = async (aQuery) => {

    return new Promise(async function(resolve, reject){
        console.log("Searching the database for: " + aQuery);
        console.time("Time taken to return search results");
        currentSeasonCollection.find({$text:
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
                reject();
            }
            else {
                let searchResults = [];
                for (let i=0; i<docs.length; i++){
                    let result = {
                        name: docs[i].name,
                        club: docs[i].club,
                        nationality: countryCodes.getCountryName(docs[i].countryCode.toUpperCase()),
                        URL: docs[i].url,
                        all: false
                    };
                    searchResults.push(result);
                }
                console.timeEnd("Time taken to return search results");
                resolve(searchResults);
            }
        });
    });

};

let getStats = async (aURL) => {

    return new Promise(async function(resolve, reject){
        console.log("Retrieving stats from the database for: " + aURL);
        console.time("Time taken to return stats");
        currentSeasonCollection.find({"url": aURL}).toArray(function (err, docs) {
            if (err) {
                console.timeEnd("Time taken to return search results");
                reject();
            } else if (docs.length === 0) {
                console.timeEnd("Time taken to return search results");
                reject();
            } else {
                let url = docs[0].url;
                let stats = docs[0].stats;
                let name = docs[0].name;
                let lastUpdated = docs[0].lastUpdated;
                let returnObject = {
                    url: url,
                    name: name,
                    lastUpdated: dateFormat(lastUpdated, "dd/mm/yyyy, h:MM:ss TT", true),
                    stats: stats
                };
                console.timeEnd("Time taken to return stats");
                resolve(returnObject);
            }
        });
    });

};