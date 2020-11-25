const leagueNames = {
    "_england": "Premier League",
    "es": "La Liga",
    "it": "Serie A",
    "de": "Bundesliga",
    "fr": "Ligue 1"
};


export function getLeaguesDisplay(leagueCodesArray){

    let leagueNamesArray = leagueCodesArray.map(x => leagueNames[x]);

    return leagueNamesArray.join(", ");

}


export function getMostRecentPositions(positions){

    let latestPositions = [];

    let seasons = Object.keys(positions);

    for (let i=seasons.length-1; i>=0; i--){
        let season = seasons[i];
        let currentSeasonPositions = positions[season];
        latestPositions = (currentSeasonPositions === undefined || currentSeasonPositions.length < 1 || currentSeasonPositions[0] === "N/A") ? ["-"] : currentSeasonPositions;
        if (latestPositions[0] !== "-"){
            break;
        }
    }

}


export function getAllEntriesFromObject(object){

    let allInfo = [];

    for (let season in object){

        for (let entry in object[season]){

            let value = object[season][entry];

            if (value === "N/A")
                value = "-";

            if (!allInfo.includes(value)){
                allInfo.unshift(value)
            }

        }

    }

    if (allInfo.length > 1){
        allInfo = allInfo.filter(item => item !== "-");
    }

    return allInfo;


}
