import React, { Component } from 'react';

//import dependencies
import Cookies from 'universal-cookie';
import Highcharts from 'highcharts'
import domtoimage from 'dom-to-image';
import saveAs from 'file-saver';

//import components
import LoadingSpinner from "../components/LoadingSpinner";
import SearchBar from "../components/SearchBar";
import SliceOptions from "../components/SliceOptions";
import Slice from "../components/Slice";

//initialize helpers
const dateFormat = require('dateformat');
const cookies = new Cookies();


/**
 * Compare page component
 */
class Compare extends Component {

    //class variable to track if the component is mounted
    _isMounted = false;

    /**
     * Constructor
     * @param props
     */
    constructor(props){

        super(props);

        //colors used in the Slices
        this.colors = {
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
            null: ['#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec',
                '#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec', '#7cb5ec']
        };

        //cookies
        let labelTypeCookie = cookies.get('labelType');
        let creditsPositionCookie = cookies.get('creditsPosition');

        this.state = {
            isLoading: true,
            error: null,
            renderForExport: false,
            showCompareScreen: false,
            isMobile: this.props.isMobile,
            isSafari: this.props.isSafari,
            percentileArrays: this.props.percentileArrays,
            code: this.props.match.params.code,
            name: '',
            url: '',
            age: 0,
            clubs: {},
            positions: {},
            percentileEntries: {},
            stats: {},
            lastUpdated: null,
            template: "N/A",
            competitions: {},
            selectedCompetitions: {},
            labelType: labelTypeCookie === undefined ? "raw" : labelTypeCookie,
            creditsPosition: creditsPositionCookie === undefined ? "right" : creditsPositionCookie,
            isAnimated: true
        };

        this.getStats();

    }


    /**
     * Called after component has mounted
     */
    componentDidMount() {
        this._isMounted = true;
    }


    /**
     * Called just before the component receives new props. This is done to ensure that new props trigger a re-render
     * @param nextProps
     * @param nextContext
     */
    //TODO: re-factor because componentWillReceiveProps has been deprecated
    UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
        let { code } = nextProps.match.params;
        this.setState({
            isLoading: true,
            code: code
        }, () => {
            this.getStats();
        });
    }


    /**
     * Function to send a post request to the server to retrieve the stats of the player
     */
    getStats = () => {

        const code = this.state.code;

        //fetch stats
        fetch('/api/stats', {
            method: 'post',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "code": code,
                "percentilesTimestamp": this.state.percentileArrays['lastUpdated']
            })
        })
        .then(res => {
            if (res.ok) {
                return res.json()
            }
            else {
                throw new Error("Failed to fetch. This is likely due to a malformed URL. Please try searching for the player again.")
            }
        })
        .then(response => this.processStats(response))
        .catch(error => {
            if (this._isMounted){
                this.setState({
                    error: error,
                    isLoading: false
                })
            }
        });

    };


    /**
     * Function to process retrieved player stats and save to state
     * @param {Object} playerStats - object containing the player metadata and stats, as well as new percentile arrays
     * in the event that the server needs to update a client's percentile arrays.
     */
    processStats = (playerStats) => {

        //check if the stats object contains new percentile arrays
        if (playerStats.newPercentileArrays !== undefined){
            //update percentile arrays in parent component as required
            this.props.updatePercentileArrays(playerStats.newPercentileArrays);
            playerStats = playerStats.stats;
        }

        //process player position entry and set template. template is set to the most recent non-"N/A" position
        //in the player's position entries
        let template = "N/A";
        for (let season in playerStats.positions){
            let position = playerStats.positions[season];
            if (position !== "N/A"){
                template = position;
            }
        }

        //retrieve player competitions. stored in an object where the keys are seasons and the values are arrays
        //of the competitions for the season
        let competitions = {};
        for (let season in playerStats.stats){
            competitions[season] = [];
            for (let competition in playerStats.stats[season]){
                competitions[season].push(competition);
            }
        }

        if (this._isMounted){
            this.setState({
                isLoading: false,
                name: playerStats.name,
                url: "https://fbref.com/en/players/" + playerStats.fbrefCode,
                age: playerStats.age,
                clubs: playerStats.clubs,
                percentileEntries: playerStats.percentileEntries,
                stats: playerStats.stats,
                lastUpdated: dateFormat(playerStats.lastUpdated, "dd/mm/yyyy, h:MM TT", true),
                template: template,
                competitions: JSON.parse(JSON.stringify(competitions)),
                selectedCompetitions: JSON.parse(JSON.stringify(competitions)),
            })
        }

    };


    /**
     * Called just before the component un-mounts
     */
    componentWillUnmount() {
        this._isMounted = false;
    }


    /**
     * Function to filter the complete stats based on the selected competitions
     * @param {Object} stats - object containing the complete stats of the player
     * @return {Object} filteredStats - object containing aggregated totals of the filtered stats
     */
    filterStats = (stats) => {

        let filteredStats = {};
        let selectedCompetitions = this.state.selectedCompetitions;

        //iterate through complete stats, check if a competition is selected, and add the stats for said competition
        //to the aggregated stats if so
        for (let season in stats){
            for (let competition in stats[season]){
                if (selectedCompetitions[season].includes(competition)) {
                    for (let stat in stats[season][competition]) {
                        if (!(stat in filteredStats)) {
                            filteredStats[stat] = stats[season][competition][stat];
                        }
                        else {
                            filteredStats[stat] += stats[season][competition][stat];
                        }
                    }
                }
            }
        }

        return filteredStats;

    };


    /**
     * Function to calculate the 'per90' stats and percentile ranks of the filtered stats
     * @param {Object} filteredStats - object containing the aggregated totals from the selected competitions
     * @return {{statsPer90, percentiles}} - object containing the per90 stats and percentile ranks
     */
    calculateStats = (filteredStats) => {

        let percentileArrays = this.state.percentileArrays;
        let percentileEntries = this.state.percentileEntries;
        let selectedCompetitions = this.state.selectedCompetitions;
        let template = this.state.template;

        let includedSeasons = [];
        let percentileSeason;
        let percentileArrayOccurrences = 0;

        //iterate through selected competitions and list the seasons they span
        for (let season in selectedCompetitions) {
            if (selectedCompetitions[season].length !== 0) {
                includedSeasons.push(season);
            }
        }
        //if only one season is selected, set the percentile season to that season
        if (includedSeasons.length === 1) {
            percentileSeason = includedSeasons[0];
        }
        //set the percentile season to the combined dataset otherwise
        else {
            percentileSeason = "combined";
        }

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
        let minutes = filteredStats['minutes'];
        switch (template) {
            case "FW":
                statsPer90["npg"] = filteredStats["npg"] / (minutes / 90);
                statsPer90["npxg"] = filteredStats["npxg"] / (minutes / 90);
                statsPer90["npxgPerShot"] = filteredStats["npxg"] / filteredStats["shots"];
                statsPer90["conversionRate"] = (filteredStats["npg"] / filteredStats["shots"]) * 100;
                statsPer90["aerialSuccRate"] = (filteredStats["succAerials"] / filteredStats["attAerials"]) * 100;
                statsPer90["boxTouches"] = filteredStats["boxTouches"] / (minutes / 90);
                statsPer90["xa"] = filteredStats["xa"] / (minutes / 90);
                statsPer90["ppa"] = filteredStats["ppa"] / (minutes / 90);
                statsPer90["succDribbles"] = filteredStats["succDribbles"] / (minutes / 90);
                statsPer90["dribbleSuccRate"] = (filteredStats["succDribbles"] / filteredStats["attDribbles"]) * 100;
                statsPer90["timesDispossessed"] = filteredStats["timesDispossessed"] / (minutes / 90);
                // statsPer90["succPressures"] = filteredStats["succPressures"] / (minutes/90);
                statsPer90["padjSuccPressures"] = filteredStats["padjSuccPressures"] / (minutes / 90);
                break;
            case "AM":
                statsPer90["npg"] = filteredStats["npg"] / (minutes / 90);
                statsPer90["npxg"] = filteredStats["npxg"] / (minutes / 90);
                statsPer90["npxgPerShot"] = filteredStats["npxg"] / filteredStats["shots"];
                statsPer90["xa"] = filteredStats["xa"] / (minutes / 90);
                statsPer90["sca"] = filteredStats["sca"] / (minutes / 90);
                statsPer90["ppa"] = filteredStats["ppa"] / (minutes / 90);
                statsPer90["progDistance"] = filteredStats["progDistance"] / (minutes / 90);
                statsPer90["passSuccRate"] = (filteredStats["succPasses"] / filteredStats["attPasses"]) * 100;
                statsPer90["succDribbles"] = filteredStats["succDribbles"] / (minutes / 90);
                statsPer90["dribbleSuccRate"] = (filteredStats["succDribbles"] / filteredStats["attDribbles"]) * 100;
                statsPer90["timesDispossessed"] = filteredStats["timesDispossessed"] / (minutes / 90);
                // statsPer90["succPressures"] = filteredStats["succPressures"] / (minutes/90);
                statsPer90["padjSuccPressures"] = filteredStats["padjSuccPressures"] / (minutes / 90);
                break;
            case "CM":
                statsPer90["xa"] = filteredStats["xa"] / (minutes / 90);
                statsPer90["sca"] = filteredStats["sca"] / (minutes / 90);
                statsPer90["pft"] = filteredStats["pft"] / (minutes / 90);
                statsPer90["progDistance"] = filteredStats["progDistance"] / (minutes / 90);
                statsPer90["passSuccRate"] = (filteredStats["succPasses"] / filteredStats["attPasses"]) * 100;
                statsPer90["succDribbles"] = filteredStats["succDribbles"] / (minutes / 90);
                statsPer90["dribbleSuccRate"] = (filteredStats["succDribbles"] / filteredStats["attDribbles"]) * 100;
                statsPer90["timesDispossessed"] = filteredStats["timesDispossessed"] / (minutes / 90);
                // statsPer90["succPressures"] = filteredStats["succPressures"] / (minutes/90);
                statsPer90["padjSuccPressures"] = filteredStats["padjSuccPressures"] / (minutes / 90);
                // statsPer90["interceptions"] = filteredStats["interceptions"] / (minutes/90);
                statsPer90["padjInterceptions"] = filteredStats["padjInterceptions"] / (minutes / 90);
                // statsPer90["tacklesWon"] = filteredStats["tacklesWon"] / (minutes/90);
                statsPer90["padjTacklesWon"] = filteredStats["padjTacklesWon"] / (minutes / 90);
                statsPer90["dribbleTackleRate"] = (filteredStats["succDribbleTackles"] / filteredStats["attDribbleTackles"]) * 100;
                break;
            case "FB":
                statsPer90["xa"] = filteredStats["xa"] / (minutes / 90);
                statsPer90["pft"] = filteredStats["pft"] / (minutes / 90);
                statsPer90["progDistance"] = filteredStats["progDistance"] / (minutes / 90);
                statsPer90["passSuccRate"] = (filteredStats["succPasses"] / filteredStats["attPasses"]) * 100;
                statsPer90["succDribbles"] = filteredStats["succDribbles"] / (minutes / 90);
                statsPer90["dribbleSuccRate"] = (filteredStats["succDribbles"] / filteredStats["attDribbles"]) * 100;
                statsPer90["timesDispossessed"] = filteredStats["timesDispossessed"] / (minutes / 90);
                // statsPer90["succPressures"] = filteredStats["succPressures"] / (minutes/90);
                statsPer90["padjSuccPressures"] = filteredStats["padjSuccPressures"] / (minutes / 90);
                // statsPer90["interceptions"] = filteredStats["interceptions"] / (minutes/90);
                statsPer90["padjInterceptions"] = filteredStats["padjInterceptions"] / (minutes / 90);
                // statsPer90["tacklesWon"] = filteredStats["tacklesWon"] / (minutes/90);
                statsPer90["padjTacklesWon"] = filteredStats["padjTacklesWon"] / (minutes / 90);
                statsPer90["dribbleTackleRate"] = (filteredStats["succDribbleTackles"] / filteredStats["attDribbleTackles"]) * 100;
                statsPer90["aerialSuccRate"] = (filteredStats["succAerials"] / filteredStats["attAerials"]) * 100;
                break;
            case "CB":
                statsPer90["pft"] = filteredStats["pft"] / (minutes / 90);
                statsPer90["progDistance"] = filteredStats["progDistance"] / (minutes / 90);
                statsPer90["passSuccRate"] = (filteredStats["succPasses"] / filteredStats["attPasses"]) * 100;
                statsPer90["longPassSuccRate"] = (filteredStats["succLongPasses"] / filteredStats["attLongPasses"]) * 100;
                // statsPer90["succPressures"] = filteredStats["succPressures"] / (minutes/90);
                statsPer90["padjSuccPressures"] = filteredStats["padjSuccPressures"] / (minutes / 90);
                // statsPer90["interceptions"] = filteredStats["interceptions"] / (minutes/90);
                statsPer90["padjInterceptions"] = filteredStats["padjInterceptions"] / (minutes / 90);
                // statsPer90["tacklesWon"] = filteredStats["tacklesWon"] / (minutes/90);
                statsPer90["padjTacklesWon"] = filteredStats["padjTacklesWon"] / (minutes / 90);
                statsPer90["dribbleTackleRate"] = (filteredStats["succDribbleTackles"] / filteredStats["attDribbleTackles"]) * 100;
                // statsPer90["fouls"] = filteredStats["fouls"] / (minutes/90);
                statsPer90["padjFouls"] = filteredStats["padjFouls"] / (minutes / 90);
                statsPer90["succAerials"] = filteredStats["succAerials"] / (minutes / 90);
                statsPer90["aerialSuccRate"] = (filteredStats["succAerials"] / filteredStats["attAerials"]) * 100;
                // statsPer90["clearances"] = filteredStats["clearances"] / (minutes/90);
                statsPer90["padjClearances"] = filteredStats["padjClearances"] / (minutes / 90);
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
                statsPer90["succAerials"] = 0;
                statsPer90["boxTouches"] = 0;
                statsPer90["xa"] = 0;
                statsPer90["ppa"] = 0;
                statsPer90["succDribbles"] = 0;
                statsPer90["dribbleSuccRate"] = 0;
                statsPer90["timesDispossessed"] = 0;
                // statsPer90["succPressures"] = 0;
                statsPer90["padjSuccPressures"] = 0;
        }

        // for (let stat in statsPer90){
        //     percentiles[stat] = 100;
        // }

        //calculate percentile ranks
        if (template !== "N/A") {
            for (let stat in statsPer90) {
                if (isFinite(statsPer90[stat])) {
                    percentiles[stat] = this.percentileRank(percentileArrays[percentileSeason][template][stat], statsPer90[stat], percentileArrayOccurrences) * 100;
                }
                //handle cases where the per 90 value is NaN (e.g.: as a result of divide by 0 error)
                else {
                    statsPer90[stat] = 0;
                    percentiles[stat] = 0;
                }
                //reverse percentile ranks for "less is better" stats
                if (stat === "padjFouls" || stat === "timesDispossessed") {
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

    };


    /**
     * Function to calculate the percentile rank of a given value within a given array
     * @param {Array} array - the array of values
     * @param {number} value - the value for which the percentile rank is being calculated
     * @param {Integer} occurrences - the number of occurrences of the player's numbers within the percentile array
     * @return {number} the percentile rank of the value in the array (adjusted for the double-counting problem)
     */
    percentileRank = (array, value, occurrences) => {

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

    };


    /**
     * Function to construct the input given to the Highcharts component
     * @param {Object} statsPer90 - object containing the per90 stats
     * @param {Object} percentiles - object containing the percentile ranks
     * @return {Array} chartInput - array containing information for each data point in the Highcharts plot
     */
    constructChartInput = (statsPer90, percentiles) => {

        let template = this.state.template;
        let colors = this.colors[template];

        //remove unnecessary precision from the per90 labels and the percentile ranks
        let p90_labels = this.truncate(statsPer90);
        let percentile_labels = this.roundNumbers(percentiles, 0);

        //iterate through per90 stats and percentile ranks and construct objects for each point on the Highcharts plot
        let chartInput = [];
        let i = 0;
        for (let key in percentiles){
            chartInput[i] = {
                y: percentiles[key],
                p90_label: p90_labels[key],
                percentile_label: this.ordinalSuffix(percentile_labels[key]),
                color: Highcharts.Color(colors[i]).setOpacity(0.85).get()
            };
            i++;
        }
        return chartInput;

    };


    /**
     * Function to truncate all values in an object to 3 digits
     * @param {Object} someStats - object containing the values that need to be reduced to 3 digits
     * @return {Object} threeDigitStats - object containing value of someStats reduced to 3 digits
     */
    truncate = (someStats) => {

        let threeDigitStats = {};

        for (let stat in someStats){
            let precision;
            if (
                stat === "progDistance" ||
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

    };


    /**
     * Function to round all values in an object to a specified precision
     * @param {Object} someStats - object containing the values that need to be rounded
     * @param {number} precision - the number of decimal places each number should be rounded to
     * @return {Object}
     */
    roundNumbers = (someStats, precision) => {

        let roundedStats = {};

        for (let stat in someStats){
            roundedStats[stat] = Math.round(someStats[stat] * (10**precision)) / (10**precision);
        }

        return roundedStats;

    };


    /**
     * Function to append an ordinal suffix (-st, -nd, -rd, -th) to numbers
     * @param {number} aNumber - the number to which the ordinal suffix is being appended
     * @return {string} - the number with the ordinal suffix appended to it
     */
    ordinalSuffix = (aNumber) => {

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

    };


    /**
     * Function to change the selected template
     * @param {Object} event - the input event from the template form
     */
    changeTemplate = (event) => {

        let template = event.target.value;

        this.setState({
            template: template,
            isAnimated: true
        }, () => {

        });

    };


    /**
     * Function to change the list of selected competitions
     * @param {Object} event - the input event from the competitions form
     */
    changeSelectedCompetitions = (event) => {

        let selectedCompetitions = this.state.selectedCompetitions;
        let clickedValues = event.target.value.split("_");

        let clickedSeason = clickedValues[0];
        let clickedCompetition = clickedValues[1];

        if (selectedCompetitions[clickedSeason].includes(clickedCompetition)){
            selectedCompetitions[clickedSeason].splice(selectedCompetitions[clickedSeason].indexOf(clickedCompetition), 1);
        }
        else {
            selectedCompetitions[clickedSeason].push(clickedCompetition);
        }

        this.setState({
            selectedCompetitions: selectedCompetitions,
            isAnimated: true
        });

    };


    /**
     * Function to change the type of data labels
     * @param {Object} event - the input event from the data labels form
     */
    changeLabelType = (event) => {

        let labelType = event.target.value;

        cookies.set('labelType', labelType, {path: '/'});

        this.setState({
            labelType: labelType,
            isAnimated: false
        })

    };


    /**
     * Function to change the position of the credits at the bottom of the Slice container
     */
    toggleCreditsPosition = () => {

        let oldPosition = this.state.creditsPosition;
        let newPosition = oldPosition === "right" ? "center" : "right";

        cookies.set('creditsPosition', newPosition, {path: '/'});
        this.setState({
            isAnimated: false,
            creditsPosition: newPosition
        })

    };


    /**
     * Function to export the chart in a standardized 2400 * 2200 downloadable PNG format
     * Triggers the page to temporarily load a second slice to the "#export" div, which has fixed height and width
     * Passes the second slice to the "dom-to-image" package, which converts it to an image (with 4x scaling)
     * Adds the FootballSlices watermark to the exported image
     * @return {Promise<void>}
     */
    exportChart = async () => {

        //exit if the browser is Safari because its foreign object rules stop the feature from working properly
        const isSafari = this.state.isSafari;
        if (isSafari){
            alert("Sorry, this feature is not supported in Safari.");
            return;
        }

        //render the second slice and then export it.
        //callback executes after the page has re-rendered with the second slice
        this.setState({
            renderForExport: true
        }, () => {

            const name = this.state.name;
            const node = document.getElementById('export');
            const scale = 2;

            //scale the background (the watermark)
            let backgroundSize = 18/scale;

            //get the width and height of the background in pixels
            let backgroundWidth = (backgroundSize/100) * node.offsetWidth;
            let backgroundHeight = (791/2070) * backgroundWidth; //height = inverted aspect ratio * width

            //get the height of the background as a percentage of the total height of the chart
            let backgroundHeightRatio = (backgroundHeight / node.offsetHeight) * 100;

            //get the aspect ratio of the export div
            let nodeAspectRatio = node.offsetWidth / node.offsetHeight;

            domtoimage.toPng(node, {
                bgcolor: '#fafbfc',
                width: 1200 * scale,
                height: 1100 * scale,
                style: {
                    //make the export div visible
                    opacity: '1',
                    //scale up 4x to improve the resolution of the exported chart
                    transform: `scale(${scale}) translate(${node.offsetWidth / 2 / scale}px, ${node.offsetHeight / 2 / scale}px)`,
                    //set the background position after the 4x scaling
                    //for the Y position, we start with 50% (bottom left),
                    //and then adjust based on the height of the watermark to achieve 0.3% bottom pading
                    'background-position': `0.3% ${(100/scale)-(0.3*nodeAspectRatio)-((backgroundHeightRatio+(0.3*nodeAspectRatio))/scale)}%`,
                    'background-size': `${backgroundSize}%`
                }
            })
            .then((blob) => {
                //download the image and revert 'renderForExport' to false so the second slice doesn't continue being updated
                saveAs(blob, `${name.replace(" ", "-")}.png`);
                this.setState({
                    renderForExport: false
                })
            })
            .catch(function (error) {
                console.log(error);
                alert("An error occurred while exporting. Please refresh the page and try again.")
            });

        });

    };


    /**
     * Function to the show the search dialog for the comparison functionality
     */
    toggleCompareSearch = () => {

        let currentState = this.state.showCompareScreen;

        this.setState({
            showCompareScreen: !currentState
        })

    };



    /**
     * render function
     * @return {*} - JSX code for the stats page
     */
    render() {

        let {
            isLoading,
            error,
            renderForExport,
            showCompareScreen,
            code,
            url,
            name,
            age,
            clubs,
            stats,
            lastUpdated,
            competitions,
            selectedCompetitions,
            template,
            labelType,
            creditsPosition,
            isAnimated,
            isMobile
        } = this.state;

        //display loading spinner while the server responds to POST request for the stats
        if (isLoading) {
            return (
                <LoadingSpinner/>
            )
        }

        //display the error message screen if an error is caught
        else if (error !== null) {
            return (
                <div id="main2">
                    <SearchBar page="stats" query={this.state.query}/>
                    <div className="screen" id="error-screen">
                        <p>{error.message}</p>
                    </div>
                </div>
            )
        }

        //build stats page otherwise
        else {

            //calculate stats and construct chart input
            let filteredStats = {};
            let series = [];
            if (template !== null) {
                filteredStats = this.filterStats(stats);
                if (Object.keys(filteredStats).length !== 0){
                    let calculatedStats = this.calculateStats(filteredStats);
                    let chartInput = this.constructChartInput(calculatedStats.statsPer90, calculatedStats.percentiles);
                    series = [chartInput];

                }
            }

            let exportSlice = null;
            if (renderForExport) {
                exportSlice =
                <Slice
                    isMobile={isMobile}
                    isForExport={true}
                    isAnimated={false}
                    isAnimatedInitial={false}
                    hasTooltip={false}
                    creditsPosition={creditsPosition}
                    url={null}
                    lastUpdated={lastUpdated}
                    template={template}
                    labelType={labelType}
                    name={name}
                    age={age}
                    minutes={filteredStats['minutes']}
                    series={series}
                />
            }

            //return JSX code for the stats page
            return (
                <div id="main2">
                    <div id="compare-search-screen" style={{display: showCompareScreen ? "block" : "none"}}>
                        <button className="far fa-times" onClick={this.toggleCompareSearch} id="close-compare-search">
                        </button>
                        <SearchBar
                            page="compare"
                            currentPlayerCode={code}
                        />
                    </div>
                    <SearchBar
                        page="stats"
                    />
                    <div className="screen2" id="stats-screen">
                        <SliceOptions
                            isMobile={isMobile}
                            template={template}
                            competitions={competitions}
                            clubs={clubs}
                            selectedCompetitions={selectedCompetitions}
                            labelType={labelType}
                            changeTemplate={this.changeTemplate}
                            changeSelectedCompetitions={this.changeSelectedCompetitions}
                            changeLabelType={this.changeLabelType}
                            toggleCreditsPosition={this.toggleCreditsPosition}
                            exportChart={this.exportChart}
                            toggleCompareSearch={this.toggleCompareSearch}
                        />
                        <Slice
                            isMobile={isMobile}
                            isForExport={false}
                            isAnimated={isAnimated}
                            isAnimatedInitial={true}
                            hasTooltip={true}
                            creditsPosition={creditsPosition}
                            url={url}
                            lastUpdated={lastUpdated}
                            template={template}
                            labelType={labelType}
                            name={name}
                            age={age}
                            minutes={filteredStats['minutes']}
                            series={series}
                        />
                    </div>
                    {/*Second slice used for exports. Not displayed*/}
                    {exportSlice}
                </div>
            );

        }

    }

}

export default Compare;
