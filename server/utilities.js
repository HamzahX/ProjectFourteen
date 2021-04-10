const leagueCodes = {
    "Premier League": "_england",
    "La Liga": "es",
    "Serie A": "it",
    "Bundesliga": "de",
    "Ligue 1": "fr"
};

function aggregateStats(stats, selectedLeagues, selectedClubs, clubsList, includeEuropeanCompetitions = true){

    let aggregatedStats = {};

    let competitions = Object.keys(stats);

    if (selectedLeagues.length > 0){

        let eligibleClubs = clubsList
            .filter(c => selectedLeagues.includes(c.countryCode))
            .map(c => c.name);

        competitions = competitions
            .filter(c => eligibleClubs.includes(c.split(" | ")[1]));

    }

    if (selectedClubs.length > 0){

        competitions = competitions
            .filter(c => selectedClubs.includes(c.split(" | ")[1]));

    }

    if (!includeEuropeanCompetitions){

        competitions = competitions
            .filter(c => !c.startsWith("Champions League") && !c.startsWith("Europa League"));

    }

    for (let i=0; i<competitions.length; i++){

        let competition = competitions[i];

        if (!includeEuropeanCompetitions && (competition.startsWith("Champions League") || competition.startsWith("Europa League")))
            continue;

        for (let stat in stats[competition]){
            if (!(stat in aggregatedStats)){
                aggregatedStats[stat] = stats[competition][stat]
            }
            else {
                aggregatedStats[stat] += stats[competition][stat]
            }
        }

    }

    if (aggregatedStats["npg"] !== undefined && aggregatedStats["xa"] !== undefined){
        aggregatedStats["npg+xa"] = aggregatedStats["npg"] + aggregatedStats["xa"];
    }

    if (aggregatedStats["npxg"] !== undefined && aggregatedStats["xa"] !== undefined){
        aggregatedStats["npxg+xa"] = aggregatedStats["npxg"] + aggregatedStats["xa"];
    }

    let leagues = [
        ...new Set(
            competitions
                .map(c => c.split(" | ")[0])
                .filter(c => !c.startsWith("Champions League") && !c.startsWith("Europa League"))
                .map(c => leagueCodes[c])
        )
    ];
    let clubs = [...new Set(competitions.map(c => c.split(" | ")[1]))];

    return [aggregatedStats, leagues, clubs];

}

function calculateAverageStats(aggregatedStats, positions, outfieldGKStats, STATS_REFERENCE){

    let averageStats = {};
    averageStats["minutes"] = aggregatedStats["minutes"];

    if (positions.includes("GK") && outfieldGKStats === null)
    {
        averageStats = getStatAverages(aggregatedStats, true);
    }
    else {
        averageStats = getStatAverages(aggregatedStats, false);
    }

    return averageStats;

}

function getStatAverages(aggregatedStats, isGoalkeeper) {

    let averageStats = {};

    if (isGoalkeeper)
    {
        averageStats["gsaa"] = returnFinite(((aggregatedStats["psxg"] - aggregatedStats["goalsAgainst"]) / aggregatedStats["sota"]) * 100);
        averageStats["crossStopRate"] = returnFinite((aggregatedStats["stoppedCrosses"] / aggregatedStats["attCrosses"]) * 100);
        averageStats["launchedPassSuccRate"] = returnFinite((aggregatedStats["succLaunchedPasses"] / aggregatedStats["attLaunchedPasses"]) * 100);
    }
    else {

        let minutesOverNinety = aggregatedStats["minutes"] / 90;
        let touchesOverHundred = aggregatedStats["touches"] / 100;

        averageStats["npg"] = returnFinite(aggregatedStats["npg"] / minutesOverNinety);
        averageStats["npxg"] = returnFinite(aggregatedStats["npxg"] / minutesOverNinety);
        averageStats["npxgPerShot"] = returnFinite(aggregatedStats["npxg"] / aggregatedStats["shots"]);

        averageStats["succAerials"] = returnFinite(aggregatedStats["succAerials"] / minutesOverNinety);
        averageStats["aerialSuccRate"] = returnFinite((aggregatedStats["succAerials"] / aggregatedStats["attAerials"]) * 100);

        averageStats["boxTouches"] = returnFinite(aggregatedStats["boxTouches"] / minutesOverNinety);
        averageStats["padjBoxTouches"] = returnFinite(aggregatedStats["boxTouches"] / touchesOverHundred);

        averageStats["xa"] = returnFinite(aggregatedStats["xa"] / minutesOverNinety);
        averageStats["padjXA"] = returnFinite(aggregatedStats["xa"] / touchesOverHundred);

        averageStats["ppa"] = returnFinite(aggregatedStats["ppa"] / minutesOverNinety);
        averageStats["padjPPA"] = returnFinite(aggregatedStats["ppa"] / touchesOverHundred);

        averageStats["succDribbles"] = returnFinite(aggregatedStats["succDribbles"] / minutesOverNinety);
        averageStats["padjSuccDribbles"] = returnFinite(aggregatedStats["succDribbles"] / touchesOverHundred);
        averageStats["dribbleSuccRate"] = returnFinite((aggregatedStats["succDribbles"] / aggregatedStats["attDribbles"]) * 100);

        averageStats["turnovers"] = returnFinite((aggregatedStats["timesDispossessed"] + aggregatedStats["miscontrols"]) / minutesOverNinety);
        averageStats["padjTurnovers"] = returnFinite((aggregatedStats["timesDispossessed"] + aggregatedStats["miscontrols"]) / touchesOverHundred);

        averageStats["succPressures"] = returnFinite(aggregatedStats["succPressures"] / minutesOverNinety);
        averageStats["padjSuccPressures"] = returnFinite(aggregatedStats["padjSuccPressures"] / minutesOverNinety);
        averageStats["padjSuccPressures_att"] = returnFinite(aggregatedStats["padjSuccPressures_att"] / minutesOverNinety);
        averageStats["padjSuccPressures_def"] = returnFinite(aggregatedStats["padjSuccPressures_def"] / minutesOverNinety);

        averageStats["sca"] = returnFinite(aggregatedStats["sca"] / minutesOverNinety);
        averageStats["padjSCA"] = returnFinite(aggregatedStats["sca"] / touchesOverHundred);

        averageStats["progDistance"] = returnFinite(aggregatedStats["progDistance"] / minutesOverNinety);
        averageStats["padjProgDistance"] = returnFinite(aggregatedStats["progDistance"] / touchesOverHundred);

        averageStats["passSuccRate"] = returnFinite((aggregatedStats["succPasses"] / aggregatedStats["attPasses"]) * 100);

        averageStats["pft"] = returnFinite(aggregatedStats["pft"] / minutesOverNinety);
        averageStats["padjPFT"] = returnFinite(aggregatedStats["pft"] / touchesOverHundred);

        averageStats["interceptions"] = returnFinite(aggregatedStats["interceptions"] / minutesOverNinety);
        averageStats["padjInterceptions"] = returnFinite(aggregatedStats["padjInterceptions"] / minutesOverNinety);
        averageStats["padjInterceptions_def"] = returnFinite(aggregatedStats["padjInterceptions_def"] / minutesOverNinety);

        averageStats["succTackles"] = returnFinite(aggregatedStats["succTackles"] / minutesOverNinety);
        averageStats["padjSuccTackles"] = returnFinite(aggregatedStats["padjSuccTackles"] / minutesOverNinety);
        averageStats["padjSuccTackles_def"] = returnFinite(aggregatedStats["padjSuccTackles_def"] / minutesOverNinety);

        averageStats["dribbleTackleRate"] = returnFinite((aggregatedStats["succDribbleTackles"] / aggregatedStats["attDribbleTackles"]) * 100);

        averageStats["longPassSuccRate"] = returnFinite((aggregatedStats["succLongPasses"] / aggregatedStats["attLongPasses"]) * 100);

        averageStats["fouls"] = returnFinite(aggregatedStats["fouls"] / minutesOverNinety);
        averageStats["padjFouls"] = returnFinite(aggregatedStats["padjFouls"] / minutesOverNinety);
        averageStats["padjFouls_def"] = returnFinite(aggregatedStats["padjFouls_def"] / minutesOverNinety);

        averageStats["clearances"] = returnFinite(aggregatedStats["clearances"] / minutesOverNinety);
        averageStats["padjClearances"] = returnFinite(aggregatedStats["padjClearances"] / minutesOverNinety);
        averageStats["padjClearances_def"] = returnFinite(aggregatedStats["padjClearances_def"] / minutesOverNinety);

        averageStats["npg+xa"] = returnFinite(aggregatedStats["npg+xa"] / minutesOverNinety);
        averageStats["npxg+xa"] = returnFinite(aggregatedStats["npxg+xa"] / minutesOverNinety);

    }

    return averageStats;

}

let returnFinite = (value) => {

    if (!isFinite(value)){
        value = 0;
    }

    return value

};

function calculatePercentileRanks(positionStats, percentileArrays, averageStats) {

    let percentileRanks = {};

    for (let i=0; i<positionStats.length; i++){

        let stat = positionStats[i];

        let playerValue = averageStats[stat];

        let percentileRank = calculatePercentileRank(percentileArrays[stat], playerValue) * 100;
        percentileRanks[stat] = truncateNum(percentileRank, 0);

        //reverse percentile ranks for "less is better" stats
        if (stat === "padjFouls" ||
            stat === "fouls" ||
            stat === "turnovers" ||
            stat === "padjTurnovers"
        ) {
            percentileRanks[stat] = 100 - percentileRanks[stat];
        }

    }

    return percentileRanks;

}


let calculatePercentileRank = (array, value) => {

    //taken from: https://gist.github.com/IceCreamYou/6ffa1b18c4c8f6aeaad2
    if (!isFinite(value)){
        value = 0;
    }
    for (let i = 0, length = array.length; i < length; i++) {
        if (value < array[i]) {
            while (i < length && value === array[i]) i++;
            if (i === 0) return 0;
            if (value !== array[i-1]) {
                i += (value - array[i-1]) / (array[i] - array[i-1]);
            }
            return i / length;
        }
    }

    return 1;

};


let truncateNum = (value, precision) => {

    return parseFloat(Math.round(value * (10**precision)) / (10**precision).toFixed(precision));

};

module.exports = {
    aggregateStats,
    calculateAverageStats,
    getStatAverages,
    calculatePercentileRanks
};
