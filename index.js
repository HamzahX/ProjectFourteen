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
var collection;

var browser;
var context;

//function to launch a browser using puppeteer, retrieve percentile arrays
let setup = async () => {
    return new Promise(async function(resolve, reject){
        console.time('browser launch');
        // browser = await puppeteer.launch({
        //     headless: false,
        //     args: ["--no-sandbox", "--disable-setuid-sandbox", '--disable-gpu']
        // });
        // context = await browser.createIncognitoBrowserContext();
        // await context.newPage();
        // let pages = await browser.pages();
        // await pages[0].close();
        console.timeEnd('browser launch');

        // console.time('percentile retrieval');
        // let FWPercentilesFile = fs.readFileSync(path.join(__dirname, '/serverUtils/FWPercentiles.json'));
        // percentiles.push(JSON.parse(FWPercentilesFile));
        // let AMPercentilesFile = fs.readFileSync(path.join(__dirname, '/serverUtils/AMPercentiles.json'));
        // percentiles.push(JSON.parse(AMPercentilesFile));
        // let CMPercentilesFile = fs.readFileSync(path.join(__dirname, '/serverUtils/CMPercentiles.json'));
        // percentiles.push(JSON.parse(CMPercentilesFile));
        // let FBPercentilesFile = fs.readFileSync(path.join(__dirname, '/serverUtils/FBPercentiles.json'));
        // percentiles.push(JSON.parse(FBPercentilesFile));
        // let CBPercentilesFile = fs.readFileSync(path.join(__dirname, '/serverUtils/CBPercentiles.json'));
        // percentiles.push(JSON.parse(CBPercentilesFile));
        // console.timeEnd('percentile retrieval');

        resolve();
    });
};

let connectToDatabase = async () => {

    return new Promise(function(resolve, reject) {

        console.time('database connection');
        mongoClient.connect(mongoURI, {useUnifiedTopology: true},function (err, client) {
            db = client.db("ProjectFourteen");
            collection = db.collection('CurrentSeason');
            console.timeEnd('database connection');
            resolve();
        })

    });

};

setup()
    .then(() =>
        connectToDatabase()
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
        collection.find({$text:
                {
                    $search: '\"' + aQuery + '\"',
                    $language: "en",
                    $caseSensitive: false,
                    $diacriticSensitive: false
                }
        }).toArray(function(err, docs) {
            if (err){
                reject();
            }
            else if (docs.length === 0){
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
        collection.find({"url": aURL}).toArray(function (err, docs) {
            if (err) {
                reject();
            } else if (docs.length === 0) {
                reject();
            } else {
                console.timeEnd("Time taken to return stats");
                let url = docs[0].url;
                let stats = JSON.parse(docs[0].stats);
                let name = docs[0].name;
                let lastUpdated = docs[0].lastUpdated;
                let returnObject = {
                    url: url,
                    name: name,
                    lastUpdated: dateFormat(lastUpdated, "dd/mm/yyyy, h:MM:ss TT", true),
                    stats: stats
                };
                resolve(returnObject);
            }
        });
    });

};