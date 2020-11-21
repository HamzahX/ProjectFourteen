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

            if (object[season][entry] === "N/A")
                object[season][entry] = "-";

            if (!allInfo.includes(object[season][entry])){
                allInfo.unshift(object[season][entry])
            }

        }

    }

    if (allInfo.length > 1){
        allInfo = allInfo.filter(item => item !== "-");
    }

    return allInfo;


}
