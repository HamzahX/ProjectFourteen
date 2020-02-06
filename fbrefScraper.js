//initialize constants
const path = require('path');
const fs = require('fs');
const mongoClient = require('mongodb').MongoClient;
const mongoURI = "mongodb+srv://hamzah:containers@cluster0-wz8lb.mongodb.net/test?retryWrites=true&w=majority";

let currentSeasonCollection;

var epl;
var laLiga;
var serieA;
var bundesliga;
var ligue1;
var championsLeague;
var europaLeague;
var teamNames;

var eplPlayers = {};
var laLigaPlayers = {};
var serieAPlayers = {};
var bundesligaPlayers = {};
var ligue1Players = {};
var championsLeaguePlayers = {};
var europaLeaguePlayers = {};

let setup = async () => {
    return new Promise(async function(resolve, reject){
        epl = JSON.parse(fs.readFileSync(path.join(__dirname, '/serverUtils/fbrefEPL.json')));
        laLiga = JSON.parse(fs.readFileSync(path.join(__dirname, '/serverUtils/fbrefLaLiga.json')));
        serieA = JSON.parse(fs.readFileSync(path.join(__dirname, '/serverUtils/fbrefSerieA.json')));
        bundesliga = JSON.parse(fs.readFileSync(path.join(__dirname, '/serverUtils/fbrefBundesliga.json')));
        ligue1 = JSON.parse(fs.readFileSync(path.join(__dirname, '/serverUtils/fbrefLigue1.json')));
        championsLeague = JSON.parse(fs.readFileSync(path.join(__dirname, '/serverUtils/fbrefChampionsLeague.json')));
        europaLeague = JSON.parse(fs.readFileSync(path.join(__dirname, '/serverUtils/fbrefEuropaLeague.json')));
        teamNames = JSON.parse(fs.readFileSync(path.join(__dirname, '/serverUtils/teamNames.json')));
        resolve();
    });
};

let connectToDatabase = async () => {

    return new Promise(function(resolve, reject) {

        console.time('database connection');
        mongoClient.connect(mongoURI, {useUnifiedTopology: true},function (err, client) {
            db = client.db("ProjectFourteen");
            currentSeasonCollection = db.collection('CurrentSeasonXG');
            currentSeasonCollection.updateMany({},
                {
                    $set: {
                        hasXG: false
                    }
                });
            console.timeEnd('database connection');
            resolve();
        })

    });

};

function processPlayer(aPlayer, competition, isCLorEL = false){

    return new Promise(function (resolve, reject) {
        currentSeasonCollection.find({$text:
            {
                $search: '\"' + competition[aPlayer]['__1'].substring(0, competition[aPlayer]['__1'].indexOf('\\')) + '\"',
                $language: "en",
                $caseSensitive: false,
                $diacriticSensitive: false
            }
        }).toArray(function(err, docs) {
            if (err){

            }
            if (docs.length === 0){
                // console.log("Shit!" + competition[aPlayer]['__1'].substring(0, competition[aPlayer]['__1'].indexOf('\\')));
                reject();
            }
            else if (docs.length === 1){
                let fbrefClub = competition[aPlayer]['__4'];
                if (isCLorEL){
                    fbrefClub = fbrefClub.substring(fbrefClub.indexOf(" ") + 1, fbrefClub.length);
                }
                if (teamNames[fbrefClub] !== undefined){
                    let whoscoredClub = teamNames[fbrefClub]['whoscored'];
                    if (docs[0].club === whoscoredClub){
                        // console.log(docs[0].name);
                        // currentSeasonCollection.updateOne(
                        //     {url: docs[0].url},
                        //     {
                        //         $set: {
                        //             hasXG: true
                        //         },
                        //     }
                        // );
                        resolve(docs[0].url);
                    }
                }
                reject();
            }
            else if (docs.length > 1){
                let whoscoredClub = undefined;
                let fbrefClub = competition[aPlayer]['__4'];
                if (isCLorEL){
                    fbrefClub = fbrefClub.substring(fbrefClub.indexOf(" ") + 1, fbrefClub.length);
                }
                if (teamNames[fbrefClub] !== undefined) {
                    whoscoredClub = teamNames[fbrefClub]['whoscored'];
                }
                let numClubMatches = 0;
                let matchIndex = undefined;
                for (let i=0; i< docs.length; i++){
                    if (whoscoredClub !== undefined) {
                        if (docs[i].club === whoscoredClub) {
                            numClubMatches++;
                            matchIndex = i;
                        }
                    }
                }
                if (matchIndex !== undefined && numClubMatches === 1){
                    currentSeasonCollection.updateOne(
                        {url: docs[matchIndex].url},
                        {
                            $set: {
                                hasXG: true
                            },
                        }
                    );
                    resolve(docs[matchIndex].url);
                }
                else {
                    reject();
                }
            }
        });
    });

}

let processEPLData = async () => {

    return new Promise(function(resolve, reject) {

        (async function loop() {
            for (let player in epl) {
                processPlayer(player, epl).then(
                    (response) => {
                        eplPlayers[player] = response;
                    },
                    () => {
                        ;
                    }
                )
            }
        })();
        setTimeout(async function () {
            await fs.writeFile(path.join(__dirname, 'serverUtils/eplMapping.json'), JSON.stringify(eplPlayers), function(err) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log(Object.keys(eplPlayers).length);
                    resolve();
                }
            });
        }, 20000)

    });

};

let processLaLigaData = async () => {

    return new Promise(function(resolve, reject) {

        (async function loop() {
            for (let player in laLiga) {
                processPlayer(player, laLiga).then(
                    (response) => {
                        laLigaPlayers[player] = response
                    },
                    () => {
                        ;
                    }
                )
            }
        })();
        setTimeout(async function () {
            await fs.writeFile(path.join(__dirname, 'serverUtils/laLigaMapping.json'), JSON.stringify(laLigaPlayers), function(err) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log(Object.keys(laLigaPlayers).length);
                    resolve();
                }
            });
        }, 20000)

    });

};

let processSerieAData = async () => {

    return new Promise(function(resolve, reject) {

        (async function loop() {
            for (let player in serieA) {
                processPlayer(player, serieA).then(
                    (response) => {
                        serieAPlayers[player] = response
                    },
                    () => {
                        ;
                    }
                )
            }
        })();
        setTimeout(async function () {
            await fs.writeFile(path.join(__dirname, 'serverUtils/serieAMapping.json'), JSON.stringify(serieAPlayers), function(err) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log(Object.keys(serieAPlayers).length);
                    resolve();
                }
            });
        }, 20000)

    });

};

let processBundesligaData = async () => {

    return new Promise(function(resolve, reject) {

        (async function loop() {
            for (let player in bundesliga) {
                processPlayer(player, bundesliga).then(
                    (response) => {
                        bundesligaPlayers[player] = response
                    },
                    () => {
                        ;
                    }
                )
            }
        })();
        setTimeout(async function () {
            await fs.writeFile(path.join(__dirname, 'serverUtils/bundesligaMapping.json'), JSON.stringify(bundesligaPlayers), function(err) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log(Object.keys(bundesligaPlayers).length);
                    resolve();
                }
            });
        }, 20000)

    });

};

let processLigue1Data = async () => {

    return new Promise(function(resolve, reject) {

        (async function loop() {
            for (let player in ligue1) {
                processPlayer(player, ligue1).then(
                    (response) => {
                        ligue1Players[player] = response
                    },
                    () => {
                        ;
                    }
                )
            }
        })();
        setTimeout(async function () {
            await fs.writeFile(path.join(__dirname, 'serverUtils/ligue1Mapping.json'), JSON.stringify(ligue1Players), function(err) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log(Object.keys(ligue1Players).length);
                    resolve();
                }
            });
        }, 20000)

    });

};

let processChampionsLeagueData = async () => {

    return new Promise(function(resolve, reject) {

        (async function loop() {
            for (let player in championsLeague) {
                processPlayer(player, championsLeague, true).then(
                    (response) => {
                        championsLeaguePlayers[player] = response
                    },
                    () => {
                        ;
                    }
                )
            }
        })();
        setTimeout(async function () {
            await fs.writeFile(path.join(__dirname, 'serverUtils/championsLeagueMapping.json'), JSON.stringify(championsLeaguePlayers), function(err) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log(Object.keys(championsLeaguePlayers).length);
                    resolve();
                }
            });
        }, 20000)

    });

};

let processEuropaLeagueData = async () => {

    return new Promise(function(resolve, reject) {

        (async function loop() {
            for (let player in europaLeague) {
                processPlayer(player, europaLeague, true).then(
                    (response) => {
                        europaLeaguePlayers[player] = response
                    },
                    () => {
                        ;
                    }
                )
            }
        })();
        setTimeout(async function () {
            await fs.writeFile(path.join(__dirname, 'serverUtils/europaLeagueMapping.json'), JSON.stringify(europaLeaguePlayers), function(err) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log(Object.keys(europaLeaguePlayers).length);
                    resolve();
                }
            });
        }, 20000)

    });

};

let uploadToDatabase = async () => {

    return new Promise(async function(resolve, reject){

        let mappings = {
            'epl': JSON.parse(fs.readFileSync(path.join(__dirname, '/serverUtils/eplMapping.json'))),
            'laLiga': JSON.parse(fs.readFileSync(path.join(__dirname, '/serverUtils/laLigaMapping.json'))),
            'serieA': JSON.parse(fs.readFileSync(path.join(__dirname, '/serverUtils/serieAMapping.json'))),
            'bundesliga': JSON.parse(fs.readFileSync(path.join(__dirname, '/serverUtils/bundesligaMapping.json'))),
            'ligue1': JSON.parse(fs.readFileSync(path.join(__dirname, '/serverUtils/ligue1Mapping.json'))),
            'championsLeague': JSON.parse(fs.readFileSync(path.join(__dirname, '/serverUtils/championsLeagueMapping.json'))),
            'europaLeague': JSON.parse(fs.readFileSync(path.join(__dirname, '/serverUtils/europaLeagueMapping.json')))
        };

        (async function loop() {
            for (let player in epl){
                let url = mappings['epl'][player];
                if (url !== undefined){
                    await processUpload(player, url, epl)
                }
            }
        })();

        (async function loop() {
            for (let player in laLiga){
                let url = mappings['laLiga'][player];
                if (url !== undefined){
                    await processUpload(player, url, laLiga)
                }
            }
        })();

        (async function loop() {
            for (let player in serieA){
                let url = mappings['serieA'][player];
                if (url !== undefined){
                    await processUpload(player, url, serieA)
                }
            }
        })();

        (async function loop() {
            for (let player in bundesliga){
                let url = mappings['bundesliga'][player];
                if (url !== undefined){
                    await processUpload(player, url, bundesliga)
                }
            }
        })();

        (async function loop() {
            for (let player in ligue1){
                let url = mappings['ligue1'][player];
                if (url !== undefined){
                    await processUpload(player, url, ligue1)
                }
            }
        })();

        (async function loop() {
            for (let player in championsLeague){
                let url = mappings['championsLeague'][player];
                if (url !== undefined){
                    await processUpload(player, url, championsLeague, true)
                }
            }
        })();

        (async function loop() {
            for (let player in europaLeague){
                let url = mappings['europaLeague'][player];
                if (url !== undefined){
                    await processUpload(player, url, europaLeague, true)
                }
            }
        })();

        setTimeout(function () {
            resolve()
        }, 120000)

    });

};

function processUpload(player, url, aCompetition, isCLorEL = false){

    return new Promise(function (resolve, reject) {

        let startsWith = "League";
        if (isCLorEL) {
            startsWith = "Champions League";
        }
        currentSeasonCollection.find({url: url}).toArray(function(err, docs){
            let temp = docs[0].stats;
            for (let competition in temp){
                if (competition.startsWith(startsWith)){
                    temp[competition]['xG'] = aCompetition[player]['Expected__1'];
                    temp[competition]['xA'] = aCompetition[player]['Expected__2'];
                    // delete temp[competition]['xG'];
                    // delete temp[competition]['xA'];
                }
            }
            currentSeasonCollection.updateOne(
                {url: url},
                {
                    $set: {
                        stats: temp,
                        hasXG: true
                    },
                }
            );
            resolve();
        });

    });
}

console.time('percentiles retrieval');
setup()
    .then(async () => {
        await connectToDatabase()
    })
    .then(async () => {
        await processEPLData()
    })
    .then(async () => {
        await processLaLigaData()
    })
    .then(async () => {
        await processSerieAData()
    })
    .then(async () => {
        await processBundesligaData()
    })
    .then(async () => {
        await processLigue1Data()
    })
    .then(async () => {
        await processChampionsLeagueData()
    })
    .then(async () => {
        await processEuropaLeagueData()
    })
    .then(async () => {
        await uploadToDatabase()
    })
    .then(() => {
        console.timeEnd('percentiles retrieval'), process.exit(0)
    })
    .catch(async(anError) => {
        console.log(anError);
    });

