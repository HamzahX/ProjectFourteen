//initialize constants
const mongoClient = require('mongodb').MongoClient;
const mongoURI = `mongodb+srv://hamzah:${process.env.MONGOPASSWORD}@cluster0-wz8lb.mongodb.net/test?retryWrites=true&w=majority`;

//globals
let DB;

let DEV_PLAYERS_COLLECTION;
let DEV_COUNTRIES_COLLECTION;
let DEV_STATS_REFERENCE_COLLECTION;
let DEV_STATS_BY_POSITION_COLLECTION;
let DEV_PERCENTILE_ARRAYS_COLLECTION;
let DEV_CLUBS_COLLECTION;
let DEV_Z_SCORE_DATA_COLLECTION;

let PROD_PLAYERS_COLLECTION;
let PROD_COUNTRIES_COLLECTION;
let PROD_STATS_REFERENCE_COLLECTION;
let PROD_STATS_BY_POSITION_COLLECTION;
let PROD_PERCENTILE_ARRAYS_COLLECTION;
let PROD_CLUBS_COLLECTION;
let PROD_Z_SCORE_DATA_COLLECTION;

let setup = async () => {

    console.time('database connection');

    const client = await mongoClient.connect(mongoURI, {useUnifiedTopology: true});

    DB = client.db("ProjectFourteen");

    DEV_CLUBS_COLLECTION = DB.collection("Clubs_Dev");
    DEV_COUNTRIES_COLLECTION = DB.collection("Countries_Dev");
    DEV_STATS_REFERENCE_COLLECTION = DB.collection("StatsReferenceData_Dev");
    DEV_STATS_BY_POSITION_COLLECTION = DB.collection("StatsByPosition_Dev");
    DEV_PLAYERS_COLLECTION = DB.collection("Players_Dev");
    DEV_PERCENTILE_ARRAYS_COLLECTION = DB.collection("PercentileArrays_Dev");
    DEV_Z_SCORE_DATA_COLLECTION = DB.collection("ZScoreData_Dev");

    PROD_CLUBS_COLLECTION = DB.collection("Clubs");
    PROD_COUNTRIES_COLLECTION = DB.collection("Countries");
    PROD_STATS_REFERENCE_COLLECTION = DB.collection("StatsReferenceData");
    PROD_STATS_BY_POSITION_COLLECTION = DB.collection("StatsByPosition");
    PROD_PLAYERS_COLLECTION = DB.collection("Players");
    PROD_PERCENTILE_ARRAYS_COLLECTION = DB.collection("PercentileArrays");
    PROD_Z_SCORE_DATA_COLLECTION = DB.collection("ZScoreData")

    console.timeEnd('database connection');

};


let copyDevToProduction = async (devCollection, prodCollection) => {

    await prodCollection.deleteMany({});

    const documents = await devCollection.find({}).toArray();
    await prodCollection.insertMany(documents);

};

let main = async () => {

    console.time('production database uploading');

    await setup();

    await copyDevToProduction(DEV_CLUBS_COLLECTION, PROD_CLUBS_COLLECTION);
    await copyDevToProduction(DEV_COUNTRIES_COLLECTION, PROD_COUNTRIES_COLLECTION);
    await copyDevToProduction(DEV_STATS_REFERENCE_COLLECTION, PROD_STATS_REFERENCE_COLLECTION);
    await copyDevToProduction(DEV_STATS_BY_POSITION_COLLECTION, PROD_STATS_BY_POSITION_COLLECTION);
    await copyDevToProduction(DEV_PLAYERS_COLLECTION, PROD_PLAYERS_COLLECTION);
    await copyDevToProduction(DEV_PERCENTILE_ARRAYS_COLLECTION, PROD_PERCENTILE_ARRAYS_COLLECTION);
    await copyDevToProduction(DEV_Z_SCORE_DATA_COLLECTION, PROD_Z_SCORE_DATA_COLLECTION);

    console.timeEnd('production database uploading');

};

main()
    .then(() => {
        process.exit(0)
    })
    .catch(async (anError) => {
        console.log(anError);
        process.exit(-1);
    });


