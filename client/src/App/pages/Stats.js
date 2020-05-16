import React, { Component } from 'react';

import LoadingSpinner from "../components/LoadingSpinner";
import SearchBar from "../components/SearchBar";
import Slice from "../components/Slice";

import Cookies from 'universal-cookie';
import domtoimage from 'dom-to-image';
import saveAs from 'file-saver';
import Highcharts from 'highcharts/highstock'

const dateFormat = require('dateformat');
const cookies = new Cookies();

class Stats extends Component {

    _isMounted = false;

    constructor(props){

        super(props);

        let labelTypeCookie = cookies.get('labelType');
        let creditsPositionCookie = cookies.get('creditsPosition');

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

        this.state = {
            isLoading: true,
            error: null,
            isMobile: this.props.isMobile,
            percentileArrays: this.props.percentileArrays,
            name: '',
            url: '',
            age: 0,
            clubs: {},
            positions: {},
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

    componentDidMount() {

        this._isMounted = true;

    }

    getStats = () => {

        const { code } = this.props.match.params;

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
        .catch(error => this.setState({error, isLoading: false}));

    };

    processStats = (response) => {

        if (response.newPercentileArrays !== undefined){
            this.props.updatePercentileArrays(response.newPercentileArrays);
            response = response.stats;
        }

        let position = "N/A";
        for (let season in response.positions){
            let temp = response.positions[season];
            if (temp !== "N/A"){
                position = temp;
            }
        }

        let competitions = {};
        for (let season in response.stats){
            competitions[season] = [];
            for (let competition in response.stats[season]){
                competitions[season].push(competition);
            }
        }

        if (this._isMounted){
            this.setState({
                isLoading: false,
                name: response.name,
                url: "https://fbref.com/en/players/" + response.fbrefCode,
                age: response.age,
                clubs: response.clubs,
                stats: response.stats,
                lastUpdated: dateFormat(response.lastUpdated, "dd/mm/yyyy, h:MM TT", true),
                template: position,
                competitions: JSON.parse(JSON.stringify(competitions)),
                selectedCompetitions: JSON.parse(JSON.stringify(competitions)),
            }, () => {

            });
        }

    };

    componentWillUnmount() {
        this._isMounted = false;
    }

    filterStats = (stats) => {

        let filteredStats = {};
        let selectedCompetitions = this.state.selectedCompetitions;

        for (let season in stats){
            for (let competition in stats[season]){
                if (selectedCompetitions[season].includes(competition)) {
                    for (let stat in stats[season][competition]) {
                        if (!(stat in filteredStats)) {
                            filteredStats[stat] = stats[season][competition][stat];
                        } else {
                            filteredStats[stat] += stats[season][competition][stat];
                        }
                    }
                }
            }
        }

        return filteredStats;

    };

    calculateChartInput = (filteredStats) => {

        let percentileArrays = this.state.percentileArrays;
        let selectedCompetitions = this.state.selectedCompetitions;
        let template = this.state.template;

        let includedSeasons = [];
        let percentileSeason;

        for (let season in selectedCompetitions){
            if (selectedCompetitions[season].length !== 0) {
                includedSeasons.push(season);
            }
        }
        if (includedSeasons.length === 1){
            percentileSeason = includedSeasons[0];
        }
        else {
            percentileSeason = "combined";
        }

        let statsPer90 = {};
        let percentiles = {};

        let minutes = filteredStats['minutes'];
        switch (template){
            case "FW":
                statsPer90["npg"] = filteredStats["npg"] / (minutes/90);
                statsPer90["npxg"] = filteredStats["npxg"] / (minutes/90);
                statsPer90["npxgPerShot"] = filteredStats["npxg"] / filteredStats["shots"];
                statsPer90["conversionRate"] = (filteredStats["npg"] / filteredStats["shots"]) * 100;
                statsPer90["aerialSuccRate"] = (filteredStats["succAerials"] / filteredStats["attAerials"]) * 100;
                statsPer90["boxTouches"] = filteredStats["boxTouches"] / (minutes/90);
                statsPer90["xa"] = filteredStats["xa"] / (minutes/90);
                statsPer90["ppa"] = filteredStats["ppa"] / (minutes/90);
                statsPer90["succDribbles"] = filteredStats["succDribbles"] / (minutes/90);
                statsPer90["dribbleSuccRate"] = (filteredStats["succDribbles"] / filteredStats["attDribbles"]) * 100;
                statsPer90["timesDispossessed"] = filteredStats["timesDispossessed"] / (minutes/90);
                // statsPer90["succPressures"] = filteredStats["succPressures"] / (minutes/90);
                statsPer90["padjSuccPressures"] = filteredStats["padjSuccPressures"] / (minutes/90);
                break;
            case "AM":
                statsPer90["npg"] = filteredStats["npg"] / (minutes/90);
                statsPer90["npxg"] = filteredStats["npxg"] / (minutes/90);
                statsPer90["npxgPerShot"] = filteredStats["npxg"] / filteredStats["shots"];
                statsPer90["xa"] = filteredStats["xa"] / (minutes/90);
                statsPer90["sca"] = filteredStats["sca"] / (minutes/90);
                statsPer90["ppa"] = filteredStats["ppa"] / (minutes/90);
                statsPer90["progDistance"] = filteredStats["progDistance"] / (minutes/90);
                statsPer90["passSuccRate"] = (filteredStats["succPasses"] / filteredStats["attPasses"]) * 100;
                statsPer90["succDribbles"] = filteredStats["succDribbles"] / (minutes/90);
                statsPer90["dribbleSuccRate"] = (filteredStats["succDribbles"] / filteredStats["attDribbles"]) * 100;
                statsPer90["timesDispossessed"] = filteredStats["timesDispossessed"] / (minutes/90);
                // statsPer90["succPressures"] = filteredStats["succPressures"] / (minutes/90);
                statsPer90["padjSuccPressures"] = filteredStats["padjSuccPressures"] / (minutes/90);
                break;
            case "CM":
                statsPer90["xa"] = filteredStats["xa"] / (minutes/90);
                statsPer90["sca"] = filteredStats["sca"] / (minutes/90);
                statsPer90["pft"] = filteredStats["pft"] / (minutes/90);
                statsPer90["progDistance"] = filteredStats["progDistance"] / (minutes/90);
                statsPer90["passSuccRate"] = (filteredStats["succPasses"] / filteredStats["attPasses"]) * 100;
                statsPer90["succDribbles"] = filteredStats["succDribbles"] / (minutes/90);
                statsPer90["dribbleSuccRate"] = (filteredStats["succDribbles"] / filteredStats["attDribbles"]) * 100;
                statsPer90["timesDispossessed"] = filteredStats["timesDispossessed"] / (minutes/90);
                // statsPer90["succPressures"] = filteredStats["succPressures"] / (minutes/90);
                statsPer90["padjSuccPressures"] = filteredStats["padjSuccPressures"] / (minutes/90);
                // statsPer90["interceptions"] = filteredStats["interceptions"] / (minutes/90);
                statsPer90["padjInterceptions"] = filteredStats["padjInterceptions"] / (minutes/90);
                // statsPer90["tacklesWon"] = filteredStats["tacklesWon"] / (minutes/90);
                statsPer90["padjTacklesWon"] = filteredStats["padjTacklesWon"] / (minutes/90);
                statsPer90["dribbleTackleRate"] = (filteredStats["succDribbleTackles"] / filteredStats["attDribbleTackles"]) * 100;
                break;
            case "FB":
                statsPer90["xa"] = filteredStats["xa"] / (minutes/90);
                statsPer90["pft"] = filteredStats["pft"] / (minutes/90);
                statsPer90["progDistance"] = filteredStats["progDistance"] / (minutes/90);
                statsPer90["passSuccRate"] = (filteredStats["succPasses"] / filteredStats["attPasses"]) * 100;
                statsPer90["succDribbles"] = filteredStats["succDribbles"] / (minutes/90);
                statsPer90["dribbleSuccRate"] = (filteredStats["succDribbles"] / filteredStats["attDribbles"]) * 100;
                statsPer90["timesDispossessed"] = filteredStats["timesDispossessed"] / (minutes/90);
                // statsPer90["succPressures"] = filteredStats["succPressures"] / (minutes/90);
                statsPer90["padjSuccPressures"] = filteredStats["padjSuccPressures"] / (minutes/90);
                // statsPer90["interceptions"] = filteredStats["interceptions"] / (minutes/90);
                statsPer90["padjInterceptions"] = filteredStats["padjInterceptions"] / (minutes/90);
                // statsPer90["tacklesWon"] = filteredStats["tacklesWon"] / (minutes/90);
                statsPer90["padjTacklesWon"] = filteredStats["padjTacklesWon"] / (minutes/90);
                statsPer90["dribbleTackleRate"] = (filteredStats["succDribbleTackles"] / filteredStats["attDribbleTackles"]) * 100;
                statsPer90["aerialSuccRate"] = (filteredStats["succAerials"] / filteredStats["attAerials"]) * 100;
                break;
            case "CB":
                statsPer90["pft"] = filteredStats["pft"] / (minutes/90);
                statsPer90["progDistance"] = filteredStats["progDistance"] / (minutes/90);
                statsPer90["passSuccRate"] = (filteredStats["succPasses"] / filteredStats["attPasses"]) * 100;
                statsPer90["longPassSuccRate"] = (filteredStats["succLongPasses"] / filteredStats["attLongPasses"]) * 100;
                // statsPer90["succPressures"] = filteredStats["succPressures"] / (minutes/90);
                statsPer90["padjSuccPressures"] = filteredStats["padjSuccPressures"] / (minutes/90);
                // statsPer90["interceptions"] = filteredStats["interceptions"] / (minutes/90);
                statsPer90["padjInterceptions"] = filteredStats["padjInterceptions"] / (minutes/90);
                // statsPer90["tacklesWon"] = filteredStats["tacklesWon"] / (minutes/90);
                statsPer90["padjTacklesWon"] = filteredStats["padjTacklesWon"] / (minutes/90);
                statsPer90["dribbleTackleRate"] = (filteredStats["succDribbleTackles"] / filteredStats["attDribbleTackles"]) * 100;
                // statsPer90["fouls"] = filteredStats["fouls"] / (minutes/90);
                statsPer90["padjFouls"] = filteredStats["padjFouls"] / (minutes/90);
                statsPer90["succAerials"] = filteredStats["succAerials"] / (minutes/90);
                statsPer90["aerialSuccRate"] = (filteredStats["succAerials"] / filteredStats["attAerials"]) * 100;
                // statsPer90["clearances"] = filteredStats["clearances"] / (minutes/90);
                statsPer90["padjClearances"] = filteredStats["padjClearances"] / (minutes/90);
                break;
            case "GK":
                statsPer90["gsaa"] = ((filteredStats["psxg"]-filteredStats["goalsAgainst"])/filteredStats["sota"]) * 100;
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

        if (template !== "N/A" && percentileArrays[percentileSeason] !== undefined){
            for (let stat in statsPer90){
                if (isFinite(statsPer90[stat])){
                    percentiles[stat] = this.percentileRank(percentileArrays[percentileSeason][template][stat], statsPer90[stat]) * 100;
                }
                else {
                    percentiles[stat] = 0;
                }
                if (stat === "padjFouls" || stat === "timesDispossessed"){
                    percentiles[stat] = 100 - percentiles[stat];
                }
            }
        }
        else {
            for (let stat in statsPer90){
                percentiles[stat] = 0;
            }
        }

        return this.constructChartInput(statsPer90, percentiles);

    };

    percentileRank = (array, value) => {

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

    constructChartInput = (statsPer90, percentiles) => {

        let template = this.state.template;

        let colors = this.colors[template];

        let p90_labels = this.significantFigures(statsPer90);
        let percentile_labels = this.roundNumbers(percentiles, 0);

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

    roundNumbers = (someStats, precision) => {

        for (let stat in someStats){
            if (isFinite(someStats[stat])) {
                someStats[stat] = Math.round(someStats[stat] * (10**precision)) / (10**precision);
            }
            else {
                someStats[stat] = 0;
            }
        }
        return someStats;

    };

    significantFigures = (someStats) => {

        for (let stat in someStats){
            let value = someStats[stat];
            let precision;
            if (isFinite(value)) {
                if (Math.abs(value) < 10){
                    precision = 2;
                }
                else if (Math.abs(value) < 100){
                    precision = 1;
                }
                else {
                    precision = 0;
                }
                someStats[stat] = Math.round(someStats[stat] * (10**precision)) / (10**precision);
            }
            else {
                someStats[stat] = 0;
            }
        }
        return someStats;

    };

    ordinalSuffix = (aNumber) => {

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

    changeTemplate = (event) => {

        let template = event.target.value;

        this.setState({
            template: template,
            isAnimated: true
        }, () => {

        });

    };

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

    changeLabelType = (event) => {

        let labelType = event.target.value;

        cookies.set('labelType', labelType, {path: '/'});

        this.setState({
            labelType: labelType,
            isAnimated: false
        })

    };

    toggleCreditsPosition = (event) => {

        let oldPosition = this.state.creditsPosition;
        let newPosition;

        if (oldPosition === "right"){
            newPosition = "center"
        }
        else {
            newPosition = "right"
        }

        cookies.set('creditsPosition', newPosition, {path: '/'});

        this.setState({
            isAnimated: false,
            creditsPosition: newPosition
        })

    };

    exportChart = () => {

        const isMobile = this.state.isMobile;
        const name = this.state.name;

        const scale = isMobile ? 1 : 2;
        let node = document.getElementsByClassName('highcharts-container')[0];

        if (isMobile) {
            domtoimage.toPng(node, {
                bgcolor: '#fafbfc',
                style: {
                    'background-size': '25%'
                }
            })
                .then(function (blob) {
                    window.saveAs(blob, `${name.replace(" ", "-")}.png`);
                })
                .catch(function (error) {
                    alert("An error occurred while downloading the PNG. Please refresh the page and try again")
                });
        }
        else {

            //scale and position the background (the watermark)
            let backgroundSize = 12/scale;

            //get the width and height of the background in pixels
            let backgroundWidth = (backgroundSize/100) * node.offsetWidth;
            let backgroundHeight = (789/2089) * backgroundWidth;

            //get the height of the background as a percentage of the total height of the chart
            let backgroundHeightRatio = (backgroundHeight / node.offsetHeight) * 100;

            //get the aspect ratio of the current dimensions of the chart
            let nodeAspectRatio = node.offsetWidth / node.offsetHeight;

            domtoimage.toPng(node, {
                bgcolor: '#fafbfc',
                height: node.offsetHeight * scale,
                width: node.offsetWidth * scale,
                style: {
                    transform: `scale(${scale}) translate(${node.offsetWidth / 2 / scale}px, ${node.offsetHeight / 2 / scale}px)`,
                    //set the background position after the 4x scaling
                    //For the Y position, we start with 50% (bottom left), and then adjust based on the height of the watermark and the desired padding
                    'background-position': `0.3% ${50-(0.3*nodeAspectRatio)-((backgroundHeightRatio+(0.3*nodeAspectRatio))/2)}%`,
                    'background-size': `${backgroundSize}%`
                }
            })
                .then(function (blob) {
                    window.saveAs(blob, `${name.replace(" ", "-")}.png`);
                })
                .catch(function (error) {
                    alert("An error occurred while downloading the PNG. Please refresh the page and try again")
                });
        }

    };

    render() {

        let {
            isLoading,
            error,
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

        if (isLoading) {
            return (
                <LoadingSpinner/>
            )
        }

        else if (error !== null) {
            return (
                <div id="main2">
                    <SearchBar type={2} query={this.state.query}/>
                    <div className="screen" id="error-screen">
                        <p>{error.message}</p>
                    </div>
                </div>
            )
        }

        else {

            let competitionsForm = [];
            let counter = 0;
            for (let season in competitions){
                let competitionLabels = [];
                let multipleClubs = clubs[season].length !== 1;
                competitionsForm.push(
                    <h4
                        key={`${season}_header`}
                        style={{
                            marginBottom: isMobile ? '20px' : '10px',
                            marginTop: (counter !== 0 && !isMobile) ? '15px' : '20px'
                        }}
                    >
                        {season.replace("-", "/")} {multipleClubs === false ? ' | ' + clubs[season][0] : null}
                    </h4>
                );
                for (let i=0; i<competitions[season].length; i++){
                    let currentCompetition = competitions[season][i];
                    let isIncluded = selectedCompetitions[season].includes(currentCompetition);
                    let label = currentCompetition;
                    if (clubs[season].length === 1){
                        label = label.substring(0, label.indexOf("|")-1)
                    }
                    competitionLabels.push(
                        <label key={`${season}_${currentCompetition}`} className={`${isIncluded ? "selected-label" : null} selectable-label`}>
                            <input className="competition"
                                   type="checkbox"
                                   value={`${season}_${currentCompetition}`}
                                   onChange={this.changeSelectedCompetitions}
                                   checked={isIncluded}
                            /> {label}
                        </label>
                    )
                }
                competitionsForm.push(<form key={`${season}_form`} className="competitions">{competitionLabels}</form>);
                counter++;
            }

            let filteredStats = {};
            let series = [];

            if (Object.keys(stats).length !== 0 && template !== null) {

                filteredStats = this.filterStats(stats);

                if (Object.keys(filteredStats).length !== 0){
                    let chartInput = this.calculateChartInput(filteredStats);
                    series = [chartInput];

                }

                else {
                    series = [];
                }

            }

            return (
                <div id="main2">
                    <SearchBar type={2}/>
                    <div className="screen2" id="content-screen">
                        <div className="filter" id="chart-filters">
                            <div className="chart-filter-inputs" id="chart-filter-inputs-laptop">
                                <h3>Template</h3>
                                <form id="templates">
                                    <label className={template !== "GK" ? "selectable-label" : "blocked-label"}>
                                        <input type="radio"
                                               name="template"
                                               value="FW"
                                               checked={template === "FW"}
                                               disabled={template === "GK"}
                                               onChange={this.changeTemplate}
                                        /> Forward
                                    </label>
                                    <label className={template !== "GK" ? "selectable-label" : "blocked-label"}>
                                        <input type="radio"
                                               name="template"
                                               value="AM"
                                               checked={template === "AM"}
                                               disabled={template === "GK"}
                                               onChange={this.changeTemplate}
                                        /> Attacking Midfielder / Winger
                                    </label>
                                    <label className={template !== "GK" ? "selectable-label" : "blocked-label"}>
                                        <input type="radio"
                                               name="template"
                                               value="CM"
                                               checked={template === "CM"}
                                               disabled={template === "GK"}
                                               onChange={this.changeTemplate}
                                        /> Central / Defensive Midfielder
                                    </label>
                                    <label className={template !== "GK" ? "selectable-label" : "blocked-label"}>
                                        <input type="radio"
                                               name="template"
                                               value="FB"
                                               checked={template === "FB"}
                                               disabled={template === "GK"}
                                               onChange={this.changeTemplate}
                                        /> Full-back
                                    </label>
                                    <label className={template !== "GK" ? "selectable-label" : "blocked-label"}>
                                        <input type="radio"
                                               name="template"
                                               value="CB"
                                               checked={template === "CB"}
                                               disabled={template === "GK"}
                                               onChange={this.changeTemplate}
                                        /> Center-back
                                    </label>
                                    <label className={template === "GK" ? "selectable-label" : "blocked-label"}>
                                        <input type="radio"
                                               name="template"
                                               value="GK"
                                               checked={template === "GK"}
                                               disabled={template !== "GK"}
                                               onChange={this.changeTemplate}
                                        /> Goalkeeper
                                    </label>
                                </form>
                                <h3>Competitions</h3>
                                {competitionsForm}
                                <h3>Data Labels</h3>
                                <form id="data-labels">
                                    <label className="selectable-label">
                                        <input
                                            type="radio"
                                            name="labelType"
                                            value="raw"
                                            checked={labelType === "raw"}
                                            onChange={this.changeLabelType}
                                        /> <span>Raw Values</span>
                                    </label>
                                    <label className="selectable-label">
                                        <input
                                            type="radio"
                                            name="labelType"
                                            value="percentiles"
                                            checked={labelType === "percentiles"}
                                            onChange={this.changeLabelType}
                                        /> <span>Percentile Ranks</span>
                                    </label>
                                </form>
                            </div>
                            <div className="chart-filter-inputs" id="chart-filter-inputs-mobile">
                                <div id="templates-container">
                                    <h3>Template</h3>
                                    <form id="templates">
                                        <label className={`${template === "FW" ? "selected-label" : null} ${template !== "GK" ? "selectable-label" : null}`}>
                                            <input type="radio"
                                                   name="template"
                                                   value="FW"
                                                   checked={template === "FW"}
                                                   disabled={template === "GK"}
                                                   onChange={this.changeTemplate}
                                            /> <span>Forward</span>
                                        </label>
                                        <label className={`${template === "AM" ? "selected-label" : null} ${template !== "GK" ? "selectable-label" : null}`}>
                                            <input type="radio"
                                                   name="template"
                                                   value="AM"
                                                   checked={template === "AM"}
                                                   disabled={template === "GK"}
                                                   onChange={this.changeTemplate}
                                            /> <span>Attacking Midfielder / Winger</span>
                                        </label>
                                        <label className={`${template === "CM" ? "selected-label" : null} ${template !== "GK" ? "selectable-label" : null}`}>
                                            <input type="radio"
                                                   name="template"
                                                   value="CM"
                                                   checked={template === "CM"}
                                                   disabled={template === "GK"}
                                                   onChange={this.changeTemplate}
                                            /> <span>Central / Defensive Midfielder</span>
                                        </label>
                                        <label className={`${template === "FB" ? "selected-label" : null} ${template !== "GK" ? "selectable-label" : null}`}>
                                            <input type="radio"
                                                   name="template"
                                                   value="FB"
                                                   checked={template === "FB"}
                                                   disabled={template === "GK"}
                                                   onChange={this.changeTemplate}
                                            /> <span>Full-back</span>
                                        </label>
                                        <label className={`${template === "CB" ? "selected-label" : null} ${template !== "GK" ? "selectable-label" : null}`}>
                                            <input type="radio"
                                                   name="template"
                                                   value="CB"
                                                   checked={template === "CB"}
                                                   disabled={template === "GK"}
                                                   onChange={this.changeTemplate}
                                            /> <span>Center-back</span>
                                        </label>
                                        <label className={`${template === "GK" ? "selected-label" : null} ${template === "GK" ? "selectable-label" : null}`}>
                                            <input type="radio"
                                                   name="template"
                                                   value="GK"
                                                   checked={template === "GK"}
                                                   disabled={template !== "GK"}
                                                   onChange={this.changeTemplate}
                                            /> <span>Goalkeeper</span>
                                        </label>
                                    </form>
                                </div>
                                <div id="competitions-container">
                                    <h3 style={{marginBottom: '0px'}}>Competitions</h3>
                                    {competitionsForm}
                                </div>
                                <h3>Data Labels</h3>
                                <form id="data-labels">
                                    <label className={`${labelType === "raw" ? "selected-label" : null} selectable-label`}>
                                        <input
                                            type="radio"
                                            name="labelType"
                                            value="raw"
                                            checked={labelType === "raw"}
                                            onChange={this.changeLabelType}
                                        /> <span>Raw Values</span>
                                    </label>
                                    <label className={`${labelType === "percentiles" ? "selected-label" : null} selectable-label`}>
                                        <input
                                            type="radio"
                                            name="labelType"
                                            value="percentiles"
                                            checked={labelType === "percentiles"}
                                            onChange={this.changeLabelType}
                                        /> <span>Percentile Ranks</span>
                                    </label>
                                </form>
                            </div>
                            <div id="filter-buttons">
                                <div className="filter-button">
                                    <button id="toggleCreditsButton" type="button" onClick={this.toggleCreditsPosition}>Toggle Credits Position</button>
                                </div>
                                <div className="filter-button">
                                    <button id="exportButton" type="button" onClick={this.exportChart}>Export Chart</button>
                                </div>
                                <div className="filter-button">
                                    <button id="compareButton" type="button" disabled={true}>Compare To...</button>
                                </div>
                            </div>
                        </div>
                        <Slice
                            isMobile={isMobile}
                            isAnimated={isAnimated}
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
                </div>
            );
        }
    }

}

export default Stats;
