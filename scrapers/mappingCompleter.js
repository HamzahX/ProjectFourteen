//initialize helpers
const path = require('path');
const fs = require('fs');

//globals to store mappings
var METADATA;
var FBREF_TO_WHOSCORED_PLAYERS;
var WHOSCORED_TO_FBREF_PLAYERS;
var FBREF_TO_WHOSCORED_PLAYERS_NEW;
var WHOSCORED_TO_FBREF_PLAYERS_NEW;
var UNFILLED_MAPPING;


//load needed files
let setup = async () => {

    return new Promise(async function(resolve, reject){

        METADATA = JSON.parse(fs.readFileSync(path.join(__dirname, '/playerData/metadata.json')));
        FBREF_TO_WHOSCORED_PLAYERS = JSON.parse(fs.readFileSync(path.join(__dirname, '/playerMappingData/fbrefToWhoscored.json')));
        WHOSCORED_TO_FBREF_PLAYERS = JSON.parse(fs.readFileSync(path.join(__dirname, '/playerMappingData/whoscoredToFbref.json')));
        FBREF_TO_WHOSCORED_PLAYERS_NEW = JSON.parse(fs.readFileSync(path.join(__dirname, '/playerMappingData/fbrefToWhoscoredNew.json')));
        WHOSCORED_TO_FBREF_PLAYERS_NEW = JSON.parse(fs.readFileSync(path.join(__dirname, '/playerMappingData/whoscoredToFbrefNew.json')));
        UNFILLED_MAPPING = JSON.parse(fs.readFileSync(path.join(__dirname, '/playerMappingData/unfilledMapping.json')));

        resolve();

    });

};


//append the new mappings to the complete mapping files
let completeMapping = async () => {

    return new Promise(async function(resolve, reject){

        //append new fbref to whoscored mappings
        for (let fbrefCode in FBREF_TO_WHOSCORED_PLAYERS_NEW){
            FBREF_TO_WHOSCORED_PLAYERS[fbrefCode] = FBREF_TO_WHOSCORED_PLAYERS_NEW[fbrefCode];
        }
        //append new whoscored to fbref mappings
        for (let whoscoredCode in WHOSCORED_TO_FBREF_PLAYERS_NEW){
            WHOSCORED_TO_FBREF_PLAYERS[whoscoredCode] = WHOSCORED_TO_FBREF_PLAYERS_NEW[whoscoredCode];
        }
        //append unfilled mappings (stored as whoscored to fbref)
        //reversed for fbref to whoscored mapping
        for (let whoscoredCode in UNFILLED_MAPPING){
            WHOSCORED_TO_FBREF_PLAYERS[whoscoredCode] = UNFILLED_MAPPING[whoscoredCode];
            FBREF_TO_WHOSCORED_PLAYERS[UNFILLED_MAPPING[whoscoredCode]] = whoscoredCode;
        }
        resolve();

    });

};


let saveMapping = async () => {

    return new Promise(async function (resolve, reject) {
        for (let whoscoredCode in METADATA){
            let fbrefCode = WHOSCORED_TO_FBREF_PLAYERS[whoscoredCode];
            if (fbrefCode === undefined || whoscoredCode === fbrefCode){
                console.log("Unmapped player. Check player mapping files");
                reject();
            }
        }
        await fs.writeFile(path.join(__dirname, `playerMappingData/fbrefToWhoscored.json`), JSON.stringify(FBREF_TO_WHOSCORED_PLAYERS, null, '\t'), async function(err) {
            if (err) {
                console.log("HERE");
                reject();
            }
            await fs.writeFile(path.join(__dirname, `playerMappingData/whoscoredToFbref.json`), JSON.stringify(WHOSCORED_TO_FBREF_PLAYERS, null, '\t'), async function(err) {
                if (err) {
                    console.log("HERE");
                    reject();
                }
                else {
                    resolve();
                }
            });
        });
    });

};


console.time('mapping completion');
setup()
    .then(async () => {
        await completeMapping();
    })
    // .then(async () => {
    //     await saveMapping();
    // })
    .then(() => {
        console.timeEnd('mapping completion');
        process.exit(0);
    })
    .catch(async(anError) => {
        console.log(anError);
        process.exit(-1);
    });

