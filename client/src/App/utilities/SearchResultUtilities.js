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

    let seasons = Object.keys(object);

    for (let i=seasons.length-1; i>=0; i--){

        let season = seasons[i];

        for (let j=0; j<object[season].length; j++){

            let value = object[season][j];

            if (value === "N/A")
                value = "-";

            allInfo.push(value)

        }

    }

    // for (let season in object){
    //
    //     for (let i=0; i<object[season].length; i++){
    //
    //         let value = object[season][i];
    //
    //         if (value === "N/A")
    //             value = "-";
    //
    //         if (allInfo.includes(value))
    //             allInfo = allInfo.filter(item => item !== value);
    //
    //         allInfo.unshift(value)
    //
    //     }
    //
    // }

    if (allInfo.length > 1){
        allInfo = allInfo.filter(item => item !== "-");
    }

    return [...new Set(allInfo)];

    //return allInfo;


}
