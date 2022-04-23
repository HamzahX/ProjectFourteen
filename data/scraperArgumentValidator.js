const path = require('path');

const scriptName = path.basename(__filename);
const supportedSeasons = ["18-19", "19-20", "20-21", "21-22"];
const booleans = ["true", "false"];

function validateSeasonArgument(){

    var season;

    let args = process.argv.slice(2);

    if (args.length !== 1){
        console.log(`Incorrect number of args. Usage: node ${scriptName} <season>`);
        process.exit(-1);
    }
    else {
        if (!supportedSeasons.includes(args[0])){
            console.log("Incorrect season arg. Supported seasons are supportedSeason");
            process.exit(-1);
        }
        else {
            season = args[0];
        }
    }

    return season;
}

function validateSeasonAndProcessOnlyArguments(){

    var season;
    var onlyProcess;

    let ARGS = process.argv.slice(2);

    if (ARGS.length !== 2){
        console.log(`Incorrect number of args. Usage: node ${scriptName} <season> <only_process_flag>`);
        process.exit(-1);
    }
    else {
        if (!supportedSeasons.includes(ARGS[0]) || !booleans.includes(ARGS[1])){
            console.log("Incorrect season arg. Supported seasons are supportedSeason");
            process.exit(-1);
        }
        else {
            season = ARGS[0];
            onlyProcess = ARGS[1] === "true";
        }
    }

    return [season, onlyProcess];

}

module.exports = {
    supportedSeasons,
    validateSeasonArgument,
    validateSeasonAndProcessOnlyArguments
};