//initialize constants
const path = require('path');
const fs = require('fs');

let ALL_STATS = JSON.parse(fs.readFileSync(path.join(__dirname, '/referenceData/allStats.json')));
let PROCESSED = JSON.parse(fs.readFileSync(path.join(__dirname, '/playerData/processed.json')));

let kyleWalker = PROCESSED["69778"];

let outfieldStats = Object.keys(kyleWalker["stats"]["19-20"]["Premier League | Manchester City"]);
let gkStats = Object.keys(kyleWalker["outfieldGKStats"]["19-20"]["Champions League | Manchester City"]);

let combined = [...outfieldStats, ...gkStats];

let counter = 0;

for (let stat in ALL_STATS){

    if (stat === "age" || stat === "minutes"){
        continue;
    }

    if (ALL_STATS[stat]["types"] === undefined){
        console.log(stat);
    }

    if (ALL_STATS[stat]["types"].includes("aggregate")){
        ALL_STATS[stat]["ranges_agg"] = {};
    }

    if (ALL_STATS[stat]["types"].length === 1 && ALL_STATS[stat]["types"][0] === "aggregate"){
        delete ALL_STATS[stat]["ranges"];
    }

}

// for (let i=0; i<combined.length; i++) {
//
//     let stat = combined[i];
//
//     if (stat === "minutes" || stat === "touches"){
//         continue;
//     }
//
//     if (ALL_STATS.hasOwnProperty(stat)){
//         ALL_STATS[stat]["types"] = ["aggregate", "average"];
//     }
//     else {
//         ALL_STATS[stat] = {
//             "label": "aaaaaaaaaaaaaaa",
//             "mobileLabel": "aaaaaaaaaaaaaaa",
//             "suffix": "aaaaaaaaaaaaaaa",
//             "isReversed": false,
//             "displayOrder": 0,
//             "precision": 0,
//             "step": 1,
//             "ranges": {},
//             "types": ["aggregate"]
//         }
//     }
//
// }

//console.log(ALL_STATS);

fs.writeFile(path.join(__dirname, `referenceData/allStats.json`), JSON.stringify(ALL_STATS, null, '\t'), async function(err) {
    if (err) {
        console.log(err);
    }
});


