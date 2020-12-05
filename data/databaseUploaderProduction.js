//initialize constants
const path = require('path');
const fs = require('fs');
const mongoClient = require('mongodb').MongoClient;
const mongoURI = `mongodb+srv://hamzah:${process.env.MONGOPASSWORD}@cluster0-wz8lb.mongodb.net/test?retryWrites=true&w=majority`;

//globals
var DB;

var DEV_PLAYERS_COLLECTION;
var DEV_COUNTRIES_COLLECTION;
var DEV_STATS_REFERENCE_COLLECTION;
var DEV_STATS_BY_POSITION_COLLECTION;
var DEV_PERCENTILE_ARRAYS_COLLECTION;
var DEV_CLUBS_COLLECTION;

var PROD_PLAYERS_COLLECTION;
var PROD_COUNTRIES_COLLECTION;
var PROD_STATS_REFERENCE_COLLECTION;
var PROD_STATS_BY_POSITION_COLLECTION;
var PROD_PERCENTILE_ARRAYS_COLLECTION;
var PROD_CLUBS_COLLECTION;

let setup = async () => {

    return new Promise(function(resolve, reject) {

        console.time('database connection');

        mongoClient.connect(mongoURI, {useUnifiedTopology: true},function (err, client) {
            if (err) {
                console.log(err);
                reject();
            }

            DB = client.db("ProjectFourteen");

            DEV_CLUBS_COLLECTION = DB.collection("Clubs_Dev");
            DEV_COUNTRIES_COLLECTION = DB.collection("Countries_Dev");
            DEV_STATS_REFERENCE_COLLECTION = DB.collection("StatsReferenceData_Dev");
            DEV_STATS_BY_POSITION_COLLECTION = DB.collection("StatsByPosition_Dev");
            DEV_PLAYERS_COLLECTION = DB.collection("Players_Dev");
            DEV_PERCENTILE_ARRAYS_COLLECTION = DB.collection("PercentileArrays_Dev");

            PROD_CLUBS_COLLECTION = DB.collection("Clubs");
            PROD_COUNTRIES_COLLECTION = DB.collection("Countries");
            PROD_STATS_REFERENCE_COLLECTION = DB.collection("StatsReferenceData");
            PROD_STATS_BY_POSITION_COLLECTION = DB.collection("StatsByPosition");
            PROD_PLAYERS_COLLECTION = DB.collection("Players");
            PROD_PERCENTILE_ARRAYS_COLLECTION = DB.collection("PercentileArrays");

            console.timeEnd('database connection');
            resolve();
        })

    });

};


let copyDevToProduction = async (devCollection, prodCollection) => {

    return new Promise(function (resolve, reject) {

        prodCollection.deleteMany({}).then(
            () => {
                devCollection.find({}).toArray(async function(err, docs) {
                    let bulkInsertArray = [];
                    for (let i=0; i<docs.length; i++){
                        bulkInsertArray.push(docs[i]);
                    }
                    prodCollection.insertMany(bulkInsertArray, function(err, res) {
                        if (err) {
                            console.log(err);
                        }
                        resolve();
                    });
                });
            }
        );

    });

};


console.time('production database uploading');
setup()
    .then(async () => {
        await copyDevToProduction(DEV_CLUBS_COLLECTION, PROD_CLUBS_COLLECTION)
    })
    .then(async () => {
        await copyDevToProduction(DEV_COUNTRIES_COLLECTION, PROD_COUNTRIES_COLLECTION)
    })
    .then(async () => {
        await copyDevToProduction(DEV_STATS_REFERENCE_COLLECTION, PROD_STATS_REFERENCE_COLLECTION)
    })
    .then(async () => {
        await copyDevToProduction(DEV_STATS_BY_POSITION_COLLECTION, PROD_STATS_BY_POSITION_COLLECTION)
    })
    .then(async () => {
        await copyDevToProduction(DEV_PLAYERS_COLLECTION, PROD_PLAYERS_COLLECTION)
    })
    .then(async () => {
        await copyDevToProduction(DEV_PERCENTILE_ARRAYS_COLLECTION, PROD_PERCENTILE_ARRAYS_COLLECTION)
    })
    .then(async () => {
        console.timeEnd('production database uploading');
        process.exit(0);
    })
    .catch(async(anError) => {
        console.log(anError);
        process.exit(-1);
    });


