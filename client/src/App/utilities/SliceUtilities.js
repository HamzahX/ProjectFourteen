import $ from "jquery";

//import dependencies
import Cookies from 'universal-cookie';
import Highcharts from "highcharts";
import domtoimage from "dom-to-image";
import saveAs from "file-saver";

//initialize cookies
const cookies = new Cookies();

const orderedStats = {

    "FW": ['npg', 'npxg', 'npxgPerShot', 'succAerials', 'aerialSuccRate', 'boxTouches',
        'padjBoxTouches', 'xa', 'padjXA', 'ppa', 'padjPPA', 'succDribbles', 'padjSuccDribbles',
        'dribbleSuccRate', 'turnovers', 'padjTurnovers', 'succPressures', 'padjSuccPressures'],

    "AM": ['npg', 'npxg', 'npxgPerShot', 'xa', 'padjXA', 'sca', 'padjSCA', 'ppa',
        'padjPPA', 'progDistance', 'padjProgDistance', 'passSuccRate', 'succDribbles',
        'padjSuccDribbles', 'dribbleSuccRate', 'turnovers', 'padjTurnovers', 'succPressures',
        'padjSuccPressures'],

    "CM": ['xa', 'padjXA', 'sca', 'padjSCA', 'pft', 'padjPFT', 'progDistance', 'padjProgDistance',
        'passSuccRate', 'succDribbles', 'padjSuccDribbles', 'dribbleSuccRate', 'turnovers',
        'padjTurnovers', 'succPressures', 'padjSuccPressures', 'interceptions', 'padjInterceptions',
        'succTackles', 'padjSuccTackles', 'dribbleTackleRate'],

    "FB": ['xa', 'padjXA', 'pft', 'padjPFT', 'progDistance', 'padjProgDistance',
        'passSuccRate', 'succDribbles', 'padjSuccDribbles', 'dribbleSuccRate', 'turnovers', 'padjTurnovers',
        'succPressures', 'padjSuccPressures', 'interceptions', 'padjInterceptions',
        'succTackles', 'padjSuccTackles', 'dribbleTackleRate', 'aerialSuccRate'],

    "CB": ['pft', 'padjPFT', 'progDistance', 'padjProgDistance',
        'passSuccRate', 'longPassSuccRate', 'succPressures', 'padjSuccPressures',
        'interceptions', 'padjInterceptions', 'succTackles', 'padjSuccTackles', 'dribbleTackleRate',
        'fouls', 'padjFouls', 'succAerials', 'aerialSuccRate', 'clearances', 'padjClearances'],

    "GK": ['gsaa', 'crossStopRate', 'launchedPassSuccRate'],

    "N/A": ['npg', 'npxg', 'npxgPerShot', 'conversionRate', 'aerialSuccRate', 'boxTouches',
        'padjBoxTouches', 'xa', 'padjXA', 'ppa', 'padjPPA', 'succDribbles',
        'padjSuccDribbles', 'dribbleSuccRate', 'turnovers', 'padjTurnovers', 'succPressures',
        'padjSuccPressures'],

    null: ['npg', 'npxg', 'npxgPerShot', 'conversionRate', 'aerialSuccRate', 'boxTouches',
        'padjBoxTouches', 'xa', 'padjXA', 'ppa', 'padjPPA', 'succDribbles',
        'padjSuccDribbles', 'dribbleSuccRate', 'turnovers', 'padjTurnovers', 'succPressures',
        'padjSuccPressures'],
};

//colors used in the Slices
const colorArrays = {
    "FW": ['#f15c80', '#f15c80', '#f15c80', '#f15c80', '#f15c80', '#e4d354',
        '#e4d354', '#e4d354', '#90ed7d', '#90ed7d', '#90ed7d', '#7cb5ec'],
    "AM": ['#f15c80', '#f15c80', '#f15c80', '#e4d354', '#e4d354', '#e4d354',
        '#e4d354', '#e4d354', '#90ed7d', '#90ed7d', '#90ed7d', '#7cb5ec'],
    "CM": ['#e4d354', '#e4d354', '#e4d354', '#e4d354', '#e4d354', '#90ed7d',
        '#90ed7d', '#90ed7d', '#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec'],
    "FB": ['#e4d354', '#e4d354', '#e4d354', '#e4d354', '#90ed7d', '#90ed7d',
        '#90ed7d', '#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec'],
    "CB": ['#e4d354', '#e4d354', '#e4d354', '#e4d354', '#7cb5ec', '#7cb5ec',
        '#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec'],
    "GK": ['#9499ff', '#9499ff', '#e4d354'],
    "N/A": ['#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec',
        '#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec'],
    "comparison": ['#e75453', '#e75453', '#e75453', '#e75453', '#e75453', '#e75453',
        '#e75453', '#e75453', '#e75453', '#e75453', '#e75453', '#e75453'],
    null: ['#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec',
        '#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec']
};

//data label alignments
const alignments = {
    "vertical": {
        "GK": ["bottom", "top", "top"],
        "other": ["bottom", "bottom", "middle", "middle", "middle", "top",
            "top", "top", "middle", "middle", "middle", "bottom"
        ]
    },
    "horizontal": {
        "GK": ["center", "left", "right"],
        "other": ["center", "center", "left", "left", "left", "center",
            "center", "center", "right", "right", "right", "center"
        ]
    }
};

/**
 * Function to filter the complete stats based on the selected competitions
 * @param {Object} stats - object containing the complete stats of the player
 * @param {String} playerCode - the code of the player whose stats are being filtered (used for comparisons)
 * @return {Object} filteredStats - object containing aggregated totals of the filtered stats
 */
export function filterStats(stats, playerCode = undefined){

    let selectedCompetitions;
    if (playerCode === undefined) {
        selectedCompetitions = this.state.selectedCompetitions;
    }
    else {
        selectedCompetitions = this.state.selectedCompetitions[playerCode];
    }

    //iterate through complete stats, check if a competition is selected
    //add the stats for said competition to the aggregated stats if so
    //for ages, create an array containing the age range for selected competitions
    let filteredStats = {};

    for (let season in stats){
        for (let competition in stats[season]){

            if (selectedCompetitions[season].includes(competition)) {

                for (let stat in stats[season][competition]) {

                    let value = stats[season][competition][stat];

                    if (!(stat in filteredStats)){
                        if (stat === 'age'){
                            filteredStats[stat] = [value];
                        }
                        else {
                            filteredStats[stat] = value;
                        }
                    }
                    else{
                        if (stat === 'age'){
                            if (!filteredStats[stat].includes(value)){
                                filteredStats[stat].push(value);
                            }
                        }
                        else {
                            filteredStats[stat] += value;
                        }
                    }

                }

            }

        }
    }

    return filteredStats;

}


/**
 * Function to calculate the 'per90' stats and percentile ranks of the filtered stats
 * @param {Object} filteredStats - object containing the aggregated totals from the selected competitions
 * @param playerCode
 * @return {{statsPer90, percentiles}} - object containing the per90 stats and percentile ranks
 */
export function calculateStats(filteredStats, playerCode = undefined){

    let percentileArrays = this.state.percentileArrays;
    let template = this.state.template;
    let selectedCompetitions = this.state.selectedCompetitions;
    let padjTypes = this.state.pAdjTypes;

    let percentileEntries;
    let selectedSeasons = [];
    if (playerCode === undefined){

        percentileEntries = this.state.percentileEntries;

        //iterate through selected competitions and list the seasons they span
        for (let season in selectedCompetitions) {
            if (selectedCompetitions[season].length !== 0) {
                selectedSeasons.push(season);
            }
        }

    }
    else {

        percentileEntries = this.state.percentileEntries[playerCode];
        for (let code in selectedCompetitions){
            //iterate through selected competitions and list the seasons they span
            for (let season in selectedCompetitions[code]) {
                if (selectedCompetitions[code][season].length !== 0) {
                    if (!selectedSeasons.includes(season)){
                        selectedSeasons.push(season);
                    }
                }
            }
        }

    }

    let percentileSeason;
    //if only one season is selected, set the percentile season to that season
    if (selectedSeasons.length === 1) {
        percentileSeason = selectedSeasons[0];
    }
    //set the percentile season to the combined dataset otherwise
    else {
        percentileSeason = "combined";
    }

    let percentileArrayOccurrences = 0;
    //count how many of the entries in the percentile array belong to the player
    //this is done so that the percentile rank can be adjusted in order not to double count a player's entries
    for (let season in percentileEntries) {
        if (percentileSeason === season || percentileSeason === "combined") {
            if (percentileEntries[season].includes(template)) {
                percentileArrayOccurrences = 1;
            }
        }
    }

    let statsPer90 = {};
    let percentiles = {};

    //calculate per90 stats
    let minutesOverNinety = filteredStats['minutes'] / 90;
    let touchesOverHundred = filteredStats['touches'] / 100;

    switch (template) {

        case "FW":

            statsPer90["npg"] = filteredStats["npg"] / minutesOverNinety;
            statsPer90["npxg"] = filteredStats["npxg"] / minutesOverNinety;
            statsPer90["npxgPerShot"] = filteredStats["npxg"] / filteredStats["shots"];
            statsPer90["succAerials"] = filteredStats["succAerials"] / minutesOverNinety;
            statsPer90["aerialSuccRate"] = (filteredStats["succAerials"] / filteredStats["attAerials"]) * 100;
            statsPer90["dribbleSuccRate"] = (filteredStats["succDribbles"] / filteredStats["attDribbles"]) * 100;
            statsPer90["succPressures"] = filteredStats["succPressures"] / minutesOverNinety;

            if (padjTypes['offensive']){
                statsPer90["padjBoxTouches"] = filteredStats["boxTouches"] / touchesOverHundred;
                statsPer90["padjXA"] = filteredStats["xa"] / touchesOverHundred;
                statsPer90["padjPPA"] = filteredStats["ppa"] / touchesOverHundred;
                statsPer90["padjSuccDribbles"] = filteredStats["succDribbles"] / touchesOverHundred;
                statsPer90["padjTurnovers"] = (filteredStats["timesDispossessed"] + filteredStats["miscontrols"]) / touchesOverHundred;
            }
            else {
                statsPer90["boxTouches"] = filteredStats["boxTouches"] / minutesOverNinety;
                statsPer90["xa"] = filteredStats["xa"] / minutesOverNinety;
                statsPer90["ppa"] = filteredStats["ppa"] / minutesOverNinety;
                statsPer90["succDribbles"] = filteredStats["succDribbles"] / minutesOverNinety;
                statsPer90["turnovers"] = (filteredStats["timesDispossessed"] + filteredStats["miscontrols"]) / minutesOverNinety;
            }

            break;

        case "AM":

            statsPer90["npg"] = filteredStats["npg"] / minutesOverNinety;
            statsPer90["npxg"] = filteredStats["npxg"] / minutesOverNinety;
            statsPer90["npxgPerShot"] = filteredStats["npxg"] / filteredStats["shots"];
            statsPer90["passSuccRate"] = (filteredStats["succPasses"] / filteredStats["attPasses"]) * 100;
            statsPer90["dribbleSuccRate"] = (filteredStats["succDribbles"] / filteredStats["attDribbles"]) * 100;
            statsPer90["succPressures"] = filteredStats["succPressures"] / minutesOverNinety;

            if (padjTypes['offensive']){
                statsPer90["padjXA"] = filteredStats["xa"] / touchesOverHundred;
                statsPer90["padjSCA"] = filteredStats["sca"] / touchesOverHundred;
                statsPer90["padjPPA"] = filteredStats["ppa"] / touchesOverHundred;
                statsPer90["padjProgDistance"] = filteredStats["progDistance"] / touchesOverHundred;
                statsPer90["padjSuccDribbles"] = filteredStats["succDribbles"] / touchesOverHundred;
                statsPer90["padjTurnovers"] = (filteredStats["timesDispossessed"] + filteredStats["miscontrols"]) / touchesOverHundred;
            }
            else {
                statsPer90["xa"] = filteredStats["xa"] / minutesOverNinety;
                statsPer90["sca"] = filteredStats["sca"] / minutesOverNinety;
                statsPer90["ppa"] = filteredStats["ppa"] / minutesOverNinety;
                statsPer90["progDistance"] = filteredStats["progDistance"] / minutesOverNinety;
                statsPer90["succDribbles"] = filteredStats["succDribbles"] / minutesOverNinety;
                statsPer90["turnovers"] = (filteredStats["timesDispossessed"] + filteredStats["miscontrols"]) / minutesOverNinety;
            }

            break;

        case "CM":

            statsPer90["passSuccRate"] = (filteredStats["succPasses"] / filteredStats["attPasses"]) * 100;
            statsPer90["dribbleSuccRate"] = (filteredStats["succDribbles"] / filteredStats["attDribbles"]) * 100;
            statsPer90["dribbleTackleRate"] = (filteredStats["succDribbleTackles"] / filteredStats["attDribbleTackles"]) * 100;
            statsPer90["succPressures"] = filteredStats["succPressures"] / minutesOverNinety;

            if (padjTypes['offensive']){
                statsPer90["padjXA"] = filteredStats["xa"] / touchesOverHundred;
                statsPer90["padjSCA"] = filteredStats["sca"] / touchesOverHundred;
                statsPer90["padjPFT"] = filteredStats["pft"] / touchesOverHundred;
                statsPer90["padjProgDistance"] = filteredStats["progDistance"] / touchesOverHundred;
                statsPer90["padjSuccDribbles"] = filteredStats["succDribbles"] / touchesOverHundred;
                statsPer90["padjTurnovers"] = (filteredStats["timesDispossessed"] + filteredStats["miscontrols"]) / touchesOverHundred;
            }
            else {
                statsPer90["xa"] = filteredStats["xa"] / minutesOverNinety;
                statsPer90["sca"] = filteredStats["sca"] / minutesOverNinety;
                statsPer90["pft"] = filteredStats["pft"] / minutesOverNinety;
                statsPer90["progDistance"] = filteredStats["progDistance"] / minutesOverNinety;
                statsPer90["succDribbles"] = filteredStats["succDribbles"] / minutesOverNinety;
                statsPer90["turnovers"] = (filteredStats["timesDispossessed"] + filteredStats["miscontrols"]) / minutesOverNinety;
            }

            if (padjTypes['defensive']){
                statsPer90["padjInterceptions"] = filteredStats["padjInterceptions"] / minutesOverNinety;
                statsPer90["padjSuccTackles"] = filteredStats["padjSuccTackles"] / minutesOverNinety;
            }
            else {
                statsPer90["interceptions"] = filteredStats["interceptions"] / minutesOverNinety;
                statsPer90["succTackles"] = filteredStats["succTackles"] / minutesOverNinety;
            }

            break;

        case "FB":

            statsPer90["passSuccRate"] = (filteredStats["succPasses"] / filteredStats["attPasses"]) * 100;
            statsPer90["dribbleSuccRate"] = (filteredStats["succDribbles"] / filteredStats["attDribbles"]) * 100;
            statsPer90["dribbleTackleRate"] = (filteredStats["succDribbleTackles"] / filteredStats["attDribbleTackles"]) * 100;
            statsPer90["succPressures"] = filteredStats["succPressures"] / minutesOverNinety;
            statsPer90["aerialSuccRate"] = (filteredStats["succAerials"] / filteredStats["attAerials"]) * 100;

            if (padjTypes['offensive']){
                statsPer90["padjXA"] = filteredStats["xa"] / touchesOverHundred;
                statsPer90["padjPFT"] = filteredStats["pft"] / touchesOverHundred;
                statsPer90["padjProgDistance"] = filteredStats["progDistance"] / touchesOverHundred;
                statsPer90["padjSuccDribbles"] = filteredStats["succDribbles"] / touchesOverHundred;
                statsPer90["padjTurnovers"] = (filteredStats["timesDispossessed"] + filteredStats["miscontrols"]) / touchesOverHundred;
            }
            else {
                statsPer90["xa"] = filteredStats["xa"] / minutesOverNinety;
                statsPer90["pft"] = filteredStats["pft"] / minutesOverNinety;
                statsPer90["progDistance"] = filteredStats["progDistance"] / minutesOverNinety;
                statsPer90["succDribbles"] = filteredStats["succDribbles"] / minutesOverNinety;
                statsPer90["turnovers"] = (filteredStats["timesDispossessed"] + filteredStats["miscontrols"]) / minutesOverNinety;
            }

            if (padjTypes['defensive']){
                statsPer90["padjInterceptions"] = filteredStats["padjInterceptions"] / minutesOverNinety;
                statsPer90["padjSuccTackles"] = filteredStats["padjSuccTackles"] / minutesOverNinety;
            }
            else {
                statsPer90["interceptions"] = filteredStats["interceptions"] / minutesOverNinety;
                statsPer90["succTackles"] = filteredStats["succTackles"] / minutesOverNinety;
            }

            break;

        case "CB":

            statsPer90["passSuccRate"] = (filteredStats["succPasses"] / filteredStats["attPasses"]) * 100;
            statsPer90["longPassSuccRate"] = (filteredStats["succLongPasses"] / filteredStats["attLongPasses"]) * 100;
            statsPer90["dribbleTackleRate"] = (filteredStats["succDribbleTackles"] / filteredStats["attDribbleTackles"]) * 100;
            statsPer90["succAerials"] = filteredStats["succAerials"] / minutesOverNinety;
            statsPer90["aerialSuccRate"] = (filteredStats["succAerials"] / filteredStats["attAerials"]) * 100;
            statsPer90["succPressures"] = filteredStats["succPressures"] / minutesOverNinety;

            if (padjTypes['offensive']){
                statsPer90["padjPFT"] = filteredStats["pft"] / touchesOverHundred;
                statsPer90["padjProgDistance"] = filteredStats["progDistance"] / touchesOverHundred;
            }
            else {
                statsPer90["pft"] = filteredStats["pft"] / minutesOverNinety;
                statsPer90["progDistance"] = filteredStats["progDistance"] / minutesOverNinety;
            }

            if (padjTypes['defensive']){
                statsPer90["padjInterceptions"] = filteredStats["padjInterceptions"] / minutesOverNinety;
                statsPer90["padjSuccTackles"] = filteredStats["padjSuccTackles"] / minutesOverNinety;
                statsPer90["padjFouls"] = filteredStats["padjFouls"] / minutesOverNinety;
                statsPer90["padjClearances"] = filteredStats["padjClearances"] / minutesOverNinety;
            }
            else {
                statsPer90["interceptions"] = filteredStats["interceptions"] / minutesOverNinety;
                statsPer90["succTackles"] = filteredStats["succTackles"] / minutesOverNinety;
                statsPer90["fouls"] = filteredStats["fouls"] / minutesOverNinety;
                statsPer90["clearances"] = filteredStats["clearances"] / minutesOverNinety;
            }

            break;

        case "GK":

            statsPer90["gsaa"] = ((filteredStats["psxg"] - filteredStats["goalsAgainst"]) / filteredStats["sota"]) * 100;
            statsPer90["crossStopRate"] = (filteredStats["stoppedCrosses"] / filteredStats["attCrosses"]) * 100;
            statsPer90["launchedPassSuccRate"] = (filteredStats["succLaunchedPasses"] / filteredStats["attLaunchedPasses"]) * 100;

            break;

        default:

            statsPer90["npg"] = 0;
            statsPer90["npxg"] = 0;
            statsPer90["npxgPerShot"] = 0;
            statsPer90["conversionRate"] = 0;
            statsPer90["aerialSuccRate"] = 0;
            statsPer90["boxTouches"] = 0;
            statsPer90["xa"] = 0;
            statsPer90["ppa"] = 0;
            statsPer90["succDribbles"] = 0;
            statsPer90["dribbleSuccRate"] = 0;
            statsPer90["turnovers"] = 0;
            statsPer90["succPressures"] = 0;

    }

    //calculate percentile ranks
    if (template !== "N/A") {
        for (let stat in statsPer90) {
            if (isFinite(statsPer90[stat])) {
                percentiles[stat] = percentileRank(percentileArrays[percentileSeason][template][stat], statsPer90[stat], percentileArrayOccurrences) * 100;
            }
            //handle cases where the per 90 value is NaN (e.g.: as a result of divide by 0 error)
            else {
                statsPer90[stat] = 0;
                percentiles[stat] = 0;
            }
            //reverse percentile ranks for "less is better" stats
            if (stat === "padjFouls" ||
                stat === "fouls" ||
                stat === "turnovers" ||
                stat === "padjTurnovers"
            ) {
                percentiles[stat] = 100 - percentiles[stat];
            }
        }
    }
    else {
        for (let stat in statsPer90) {
            percentiles[stat] = 0;
        }
    }

    return {
        statsPer90: statsPer90,
        percentiles: percentiles
    };

}


/**
 * Function to calculate the percentile rank of a given value within a given array
 * @param {Array} array - the array of values
 * @param {number} value - the value for which the percentile rank is being calculated
 * @param {number} occurrences - the number of occurrences of the player's numbers within the percentile array
 * @return {number} the percentile rank of the value in the array (adjusted for the double-counting problem)
 */
function percentileRank(array, value, occurrences){

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
            //adjust the returned percentile by disregarding the entries that belong to the player
            return (i / length) - (occurrences/array.length);
        }
    }
    return 1;

}


/**
 * Function to construct the input given to the Highcharts component
 * @param {Object} statsPer90 - object containing the per90 stats
 * @param {Object} percentiles - object containing the percentile ranks
 * @param playerCode
 * @param playerName
 * @param playerAge
 * @param minutes
 * @param isForComparison
 * @param index
 * @return {Array} chartInput - array containing information for each data point in the Highcharts plot
 */
export function constructChartInput(statsPer90, percentiles, playerCode, playerName, playerAge, minutes, isForComparison, index){

    let template = this.state.template;

    let colors;
    if (isForComparison) {
        colors = colorArrays['comparison'];
    }
    else {
        colors = colorArrays[template];
    }

    let verticalAlignments = alignments['vertical'][template === "GK" ? "GK" : "other"];
    let horizontalAlignments = alignments['horizontal'][template === "GK" ? "GK" : "other"];

    let isSecondPlayer = index === 1;

    //remove unnecessary precision from the per90 labels and the percentile ranks
    let p90_labels = truncate(statsPer90);
    let percentile_labels = roundNumbers(percentiles, 0);

    //iterate through per90 stats and percentile ranks and construct objects for each point on the Highcharts plot
    let chartInput = [];

    let i = 0;
    for (let stat in orderedStats[template]){

        let key = orderedStats[template][stat];

        if (statsPer90[key] === undefined){
            continue;
        }

        chartInput[i] = {
            playerName: playerCode !== undefined ? playerName : null,
            y: percentiles[key],
            p90_label: p90_labels[key],
            percentile_label: ordinalSuffix(percentile_labels[key]),
            dataLabels: {
                align: horizontalAlignments[i],
                verticalAlign: verticalAlignments[i]
            },
            color: Highcharts.Color(colors[i]).setOpacity(index !== 1 ? (isForComparison ? 0.55 : 0.85) : 0).get(),
            tooltipColor: index === 0 ? colors[i] : 'black',
            borderColor: isSecondPlayer ? 'black' : null,
            borderWidth: isSecondPlayer ? 6 : 0
        };

        i++;

    }

    return chartInput;

}


/**
 * Function to truncate all values in an object to 3 digits
 * @param {Object} someStats - object containing the values that need to be reduced to 3 digits
 * @return {Object} threeDigitStats - object containing value of someStats reduced to 3 digits
 */
function truncate(someStats){

    let threeDigitStats = {};

    for (let stat in someStats){
        let precision;
        if (
            stat === "progDistance" ||
            stat === "padjProgDistance" ||
            someStats[stat] === 0
        ) {
            precision = 0;
        }
        else if (
            stat === "conversionRate" ||
            stat === "aerialSuccRate" ||
            stat === "dribbleSuccRate" ||
            stat === "passSuccRate" ||
            stat === "dribbleTackleRate" ||
            stat === "longPassSuccRate" ||
            stat === "launchedPassSuccRate"
        ) {
            precision = 1;
        }
        else if (
            stat === "npxgPerShot"
        ){
            precision = 3;
        }
        else {
            precision = 2;
        }
        threeDigitStats[stat] = parseFloat(Math.round(someStats[stat] * (10**precision)) / (10**precision)).toFixed(precision);
    }
    return threeDigitStats;

}


/**
 * Function to round all values in an object to a specified precision
 * @param {Object} someStats - object containing the values that need to be rounded
 * @param {number} precision - the number of decimal places each number should be rounded to
 * @return {Object}
 */
function roundNumbers(someStats, precision){

    let roundedStats = {};

    for (let stat in someStats){
        roundedStats[stat] = Math.round(someStats[stat] * (10**precision)) / (10**precision);
    }

    return roundedStats;

}


/**
 * Function to append an ordinal suffix (-st, -nd, -rd, -th) to numbers
 * @param {number} aNumber - the number to which the ordinal suffix is being appended
 * @return {string} - the number with the ordinal suffix appended to it
 */
function ordinalSuffix(aNumber){

    //taken from: https://stackoverflow.com/questions/13627308/add-st-nd-rd-and-th-ordinal-suffix-to-a-number
    let j = aNumber % 10,
        k = aNumber % 100;
    if (j === 1 && k !== 11) {
        return aNumber + "st";
    }
    if (j === 2 && k !== 12) {
        return aNumber + "nd";
    }
    if (j === 3 && k !== 13) {
        return aNumber + "rd";
    }
    return aNumber + "th";

}


/**
 * Function to reduce array of ages into string collapsing consecutive numbers
 * E.g.: [23, 24, 25, 27] => ["23-25", "27"]
 * @param ageArray -
 * @return {string}
 */
export function ageRangesString(ageArray){

    //adapted from: https://stackoverflow.com/questions/2270910/how-to-reduce-consecutive-integers-in-an-array-to-hyphenated-range-expressions

    if (ageArray === undefined){
        return "";
    }

    let ranges = [], rstart, rend;
    for (let i = 0; i < ageArray.length; i++) {
        rstart = ageArray[i];
        rend = rstart;
        while (ageArray[i + 1] - ageArray[i] === 1) {
            rend = ageArray[i + 1];
            i++;
        }
        ranges.push(rstart === rend ? rstart+'' : rstart + '-' + rend);
    }
    return ranges.join(", ");

}


/**
 * Function to change the selected template
 * @param {Object} event - the input event from the template form
 */
export function changeTemplate(event){

    let { codes, stats, template, competitions, selectedCompetitions } = this.state;
    let newTemplate = event.target.value;

    //check if the function was called from a comparison page
    if (codes !== undefined) {

        for (let i=0; i<codes.length; i++){

            let code = codes[i];

            if (this.state.isOutfieldGK[code]){

                if (template !== "GK" && newTemplate === "GK"){
                    let outfieldGKStats = this.state.outfieldGKStats[code];
                    stats[code] = outfieldGKStats;
                }
                else if (template === "GK" && newTemplate !== "GK"){
                    let standardStats = this.state.standardStats[code];
                    stats[code] = standardStats;
                }

                competitions[code] = {};
                for (let season in stats[code]){
                    competitions[code][season] = [];
                    for (let competition in stats[code][season]){
                        competitions[code][season].push(competition);
                    }
                }

                selectedCompetitions = JSON.parse(JSON.stringify(competitions));

            }

        }

    }
    //handle case where function is called from stats page
    else {

        if (this.state.isOutfieldGK) {

            if (template !== "GK" && newTemplate === "GK"){
                let outfieldGKStats = this.state.outfieldGKStats;
                stats = outfieldGKStats;
            }
            else if (template === "GK" && newTemplate !== "GK"){
                let standardStats = this.state.standardStats;
                stats = standardStats;
            }

            competitions = {};
            for (let season in stats){
                competitions[season] = [];
                for (let competition in stats[season]){
                    competitions[season].push(competition);
                }
            }

            selectedCompetitions = JSON.parse(JSON.stringify(competitions));

        }

    }

    this.setState({
        stats: stats,
        template: newTemplate,
        competitions: competitions,
        selectedCompetitions: selectedCompetitions,
        isAnimated: true
    });

}


/**
 * Function to change the list of selected competitions
 * @param {Object} event - the input event from the competitions form
 */
export function changeSelectedCompetitions(event){

    let clickedValues = event.target.value.split("_");
    let selectedCompetitions = this.state.selectedCompetitions;

    //retrieve the information of the clicked checkbox
    let code;
    let entry;
    let clickedSeason;
    let clickedCompetition;
    let isLastCompetition = false;

    //retrieve the season and competition from the clicked checkbox
    clickedSeason = clickedValues[0];
    clickedCompetition = clickedValues[1];

    //check if the function was called from a 'compare' page, where the checkbox values include an extra value
    let forComparison = clickedValues.length > 2;

    //if so, retrieve the player code from the clicked checkbox
    if (forComparison) {
        code = clickedValues[2];
        entry = selectedCompetitions[code][clickedSeason];
        //determine if the click competition is the last checked competition
        let counter = 0;
        for (let season in selectedCompetitions[code]) {
            counter += selectedCompetitions[code][season].length;
        }
        isLastCompetition = counter === 1;
    }
    else {
        entry = selectedCompetitions[clickedSeason];
    }

    //remove the clicked competition from selected competitions if it is already included
    //don't remove a clicked competition if it is the last checked competition of a player on a compare page
    if (entry.includes(clickedCompetition) && !isLastCompetition){
        entry.splice(entry.indexOf(clickedCompetition), 1);
    }
    //add it otherwise
    else {
        if (!entry.includes(clickedCompetition)){
            entry.push(clickedCompetition);
        }
    }

    this.setState({
        selectedCompetitions: selectedCompetitions,
        isAnimated: true
    });

}


/**
 * Function to change the selected values for possession adjustment
 * @param {Object} event - the input event from the possession adjustment form
 */
export function changePAdjTypes(event){

    let clickedType = event.target.value;

    let pAdjTypes = this.state.pAdjTypes;
    pAdjTypes[clickedType] = !pAdjTypes[clickedType];

    this.setState({
        pAdjTypes: pAdjTypes,
        isAnimated: true
    });

    cookies.set('padjTypes', pAdjTypes, {path: '/'});

}


/**
 * Function to change the type of data labels
 * @param {Object} event - the input event from the data labels form
 */
export function changeLabelType(event){

    let labelType = event.target.value;

    this.setState({
        labelType: labelType,
        isAnimated: false
    });

    cookies.set('labelType', labelType, {path: '/'});

}


/**
 * Function to change the position of the credits at the bottom of the Slice container
 */
export function toggleCreditsPosition(){

    let oldPosition = this.state.creditsPosition;
    let newPosition = oldPosition === "right" ? "center" : "right";

    this.setState({
        isAnimated: false,
        creditsPosition: newPosition
    });

    cookies.set('creditsPosition', newPosition, {path: '/'});

}


/**
 * Function to export the chart in a standardized 2400 * 2200 downloadable PNG format
 * Triggers the page to temporarily load a second slice to the "#export" div, which has fixed height and width
 * Passes the second slice to the "dom-to-image" package, which converts it to an image (with 4x scaling)
 * Adds the FootballSlices watermark to the exported image
 * @return {Promise<void>}
 */
export async function exportChart(){

    //render the second slice and then export it.
    //callback executes after the page has re-rendered with the second slice
    this.setState({
        showExportLoaderOverlay: true,
        renderForExport: true
    }, () => {

        let name = this.state.name;
        if (name === undefined) {
            name = Object.values(this.state.names).join("-vs-");
        }

        $('<img/>').attr('src', '../exportBackground.png').on('load', () => {

            setTimeout(() => {

                const node = document.getElementById('export');

                if (this.firstExport){

                    this.firstExport = false;

                    domtoimage.toPng(node, {
                        bgcolor: '#fafbfc',
                        width: 1200,
                        height: 1100,
                        style: {
                            //make the export div visible
                            'opacity': '1',
                            'transform': 'scale(1)',
                        }
                    })
                        .then(async (blob) => {
                        })
                        .catch(function (error) {
                            console.log(error);
                            alert("An error occurred while exporting. Please refresh the page and try again.")
                        });

                }

                domtoimage.toPng(node, {
                    bgcolor: '#fafbfc',
                    width: 1200,
                    height: 1100,
                    style: {
                        //make the export div visible
                        'opacity': '1',
                        'transform': 'scale(1)',
                    }
                })
                    .then(async (blob) => {
                        //download the image and revert 'renderForExport' to false so the second slice doesn't continue being updated
                        saveAs(blob, `${name.replace(" ", "-")}.png`);
                        setTimeout(() => {
                            this.setState({
                                showExportLoaderOverlay: false,
                                renderForExport: false
                            })
                        }, 500);
                    })
                    .catch(function (error) {
                        console.log(error);
                        alert("An error occurred while exporting. Please refresh the page and try again.")
                    });

            }, 1000);

            $(this).remove();

        });

    });

}


/**
 * Function to the show an overlay containing a glossary/explanation
 */
export function toggleGlossaryOverlay(){

    let currentState = this.state.showGlossaryOverlay;

    this.setState({
        showGlossaryOverlay: !currentState
    });

}


/**
 * Function to the show the search dialog for the comparison functionality
 */
export function toggleCompareSearchOverlay(){

    let currentState = this.state.showCompareSearchOverlay;

    this.setState({
        showCompareSearchOverlay: !currentState
    });

    if (!this.isMobile){
        $("#compare-search-overlay #searchbar-input").focus()
    }

}

