const path = require('path');
const fs = require('fs');

let isoCountries = JSON.parse(fs.readFileSync(path.join(__dirname, '/referenceData/countries.json')));

function cleanCountryCode(countryCode) {

    let codeUpperCase = countryCode.toUpperCase();

    if (codeUpperCase === "GB-ENG" || codeUpperCase === "ENG") {
        countryCode = "_england"
    }
    else if (codeUpperCase === "GB-SCT" || codeUpperCase === "SCO") {
        countryCode = "_scotland"
    }
    else if (codeUpperCase === "GB-WLS" || codeUpperCase === "WAL") {
        countryCode = "_wales"
    }
    else if (codeUpperCase === "GB-NIR" || codeUpperCase === "NIR") {
        countryCode = "_northern-ireland"
    }
    else if (codeUpperCase === "XK") {
        countryCode = "_kosovo"
    }

    return countryCode;

};

function getCountryName (countryCode) {

    countryCode = cleanCountryCode(countryCode);

    if (isoCountries.hasOwnProperty(countryCode)) {
        return isoCountries[countryCode];
    }
    else {
        return countryCode;
    }
}

module.exports = {
    cleanCountryCode,
    getCountryName
};
