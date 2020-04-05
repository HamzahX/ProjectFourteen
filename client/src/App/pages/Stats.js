import React, { Component } from 'react';

import SearchBar from "../components/SearchBar";
import LoadingSpinner from "../components/LoadingSpinner";

import domtoimage from 'dom-to-image';
import { saveAs } from 'file-saver';

import Highcharts from 'highcharts/highstock'
import HighchartsMore from 'highcharts/highcharts-more'
import HighchartsParallel from 'highcharts/modules/parallel-coordinates'
import HighchartsReact from 'highcharts-react-official'
HighchartsMore(Highcharts);
HighchartsParallel(Highcharts);

class Stats extends Component {

    constructor(props){
        super(props);
        let categories = {
            "FW": [
                'Non-Penalty Goals',
                'Non-Penalty xG',
                'Conversion Rate',
                'Shots on Target %',
                'Assists',
                'xA',
                'Passes into the Penalty Area',
                'Pass Completion %',
                'Successful Dribbles',
                'Dribble Success %',
                'Times Dispossessed',
                'Recoveries',
            ],
            "AM": [
                'Non-Penalty Goals',
                'Non-Penalty xG',
                'Assists',
                'xA',
                'Passes into the Penalty Area',
                'Pass Completion %',
                'Completed Crosses',
                'Cross Completion %',
                'Successful Dribbles',
                'Dribble Success %',
                'Times Dispossessed',
                'Recoveries',
            ],
            "CM": [
                'Non-Penalty Goals+Assists',
                'Non-Penalty xG+xA',
                'Passes into the Final 1/3',
                'Pass Completion %',
                'Completed Long Passes',
                'Long Pass Completion %',
                'Successful Dribbles',
                'Dribble Success %',
                'Interceptions',
                'Tackles Won',
                'Tackle Win %',
                'Fouls Committed'
            ],
            "FB": [
                'Assists',
                'xA',
                'Passes into the Final 1/3',
                'Pass Completion %',
                'Completed Crosses',
                'Cross Completion %',
                'Successful Dribbles',
                'Dribble Success %',
                'Interceptions',
                'Tackles Won',
                'Tackle Win %',
                'Fouls Committed'
            ],
            "CB": [
                'Passes into the Final 1/3',
                'Pass Completion %',
                'Completed Long Passes',
                'Long Pass Completion %',
                'Interceptions',
                'Tackles Won',
                'Tackle Win %',
                'Fouls Committed',
                'Aerial Duels Won',
                'Aerial Duel Win %',
                'Blocks',
                'Clearances'
            ],
            "N/A": [
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
                "-"
            ]

        };
        this.state = {
            isLoading: false,
            allStats: {},
            percentiles: this.props.percentiles,
            allCompetitions: [],
            selectedCompetitions: [],
            categories: categories,
            selectedCategories: null,
            template: null,
            labelType: "raw",
            name: '',
            age: 0,
            url: '',
            isAll: false,
            multipleClubs: false,
            isMobile: this.props.isMobile,
            creditsPosition: "right",
            animation: true,
            fontSizes: {
                title: this.props.isMobile === true ? '4vw' : '2em',
                subtitle: this.props.isMobile === true ? '2.7vw' : '1.4em',
                noData: this.props.isMobile === true ? '2.7vw' : '1.35em',
                xAxisLabels: this.props.isMobile === true ? '2.3vw' : '1.15em',
                dataLabels: this.props.isMobile === true ? '2.3vw' : '1.25em',
                dataLabelsOutline: this.props.isMobile === true ? '0.3vw' : '0.2em',
                tooltipHeader: this.props.isMobile === true ? '2.3vw' : '1em',
                tooltip: this.props.isMobile === true ? '2.3vw' : '1.25em',
                credits: this.props.isMobile === true ? '2vw' : '1.15em',
                yAxisLabels: this.props.isMobile === true ? '1vw' : '0.5em',
            }
        };

        this.processStats = this.processStats.bind(this);
        this.changeTemplate = this.changeTemplate.bind(this);
        this.changeSelectedCompetitions = this.changeSelectedCompetitions.bind(this);
        this.changeLabelType = this.changeLabelType.bind(this);
        this.selectAllCompetitions = this.selectAllCompetitions.bind(this);
        this.clearAllCompetitions = this.clearAllCompetitions.bind(this);
        this.toggleCreditsPosition = this.toggleCreditsPosition.bind(this);
        this.exportAsImage = this.exportAsImage.bind(this);
        this.filterStats = this.filterStats.bind(this);
        this.calculateChartInput = this.calculateChartInput.bind(this);
        this.percentRank = this.percentRank.bind(this);
        this.roundNumbers = this.roundNumbers.bind(this);
        this.ordinalSuffix = this.ordinalSuffix.bind(this);
        this.insertChartInput = this.insertChartInput.bind(this);
    }

    componentDidMount() {
        this.setState({
            isLoading: true
        }, () => {
            this.getStats();
        });

        this.chartRef = this.chartRef = React.createRef();
    }

    getStats = () => {
        const { URL } = this.props.match.params;

        fetch('/api/stats', {
            method: 'post',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "URL": URL
            })
        })
        .then(res => res.json())
        .then(response => this.processStats(response))
    };

    processStats(response) {
        let categories = this.state.categories;
        let multipleClubs = (response.club.length !== 1);
        let selectedCategories = categories[response.position];
        this.setState({
            url: response.url,
            name: response.name,
            age: response.age,
            club: response.club[0],
            template: response.position,
            selectedCategories: selectedCategories,
            lastUpdated: response.lastUpdated,
            allStats: response.stats,
            allCompetitions: Object.keys(response.stats),
            selectedCompetitions: Object.keys(response.stats),
            isLoading: false,
            multipleClubs: multipleClubs
        }, () => {

        });
    }

    changeSelectedCompetitions(event){

        let selectedCompetitions = this.state.selectedCompetitions;
        let clickedCompetition = event.target.value;

        if (selectedCompetitions.includes(clickedCompetition)){
            selectedCompetitions.splice(selectedCompetitions.indexOf(clickedCompetition), 1);
        }
        else{
            selectedCompetitions.push(clickedCompetition);
        }

        this.setState({
            selectedCompetitions: selectedCompetitions,
            animation: true
        });

    }

    selectAllCompetitions(event){

        let allCompetitions = JSON.parse(JSON.stringify(this.state.allCompetitions));

        this.setState({
            selectedCompetitions: allCompetitions
        });

    }

    clearAllCompetitions(event){

        this.setState({
            selectedCompetitions: []
        });

    }

    toggleCreditsPosition(event){

        let oldPosition = this.state.creditsPosition;
        let newPosition;

        if (oldPosition === "right"){
            newPosition = "center"
        }
        else {
            newPosition = "right"
        }

        this.setState({
            animation: false,
            creditsPosition: newPosition
        })

    }

    exportAsImage() {

        const isMobile = this.state.isMobile;
        const name = this.state.name;

        const scale = isMobile ? 1 : 2;
        let node = document.getElementsByClassName('highcharts-container')[0];
        // let node = document.getElementById('chart');

        if (isMobile) {
            domtoimage.toPng(node, {
                bgcolor: '#fafbfc',
                style: {
                    'background-size': '20%'
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
            let backgroundSize = 15/scale;

            //get the width and height of the background in pixels
            let backgroundWidth = (backgroundSize/100) * node.offsetWidth;
            let backgroundHeight = (9/16) * backgroundWidth;

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

    }

    changeTemplate(event){

        let template = event.target.value;

        this.setState({
            template: template,
            animation: true
        }, () => {
            this.setCategories();
        });

    }

    setCategories() {
        let template = this.state.template;
        let categories = this.state.categories;
        let selectedCategories = categories[template];

        this.setState({
            selectedCategories: selectedCategories
        })

    }

    changeLabelType(event){

        let labelType = event.target.value;

        this.setState({
            labelType: labelType,
            animation: false
        })

    }

    filterStats(stats){
        let filteredStats = {};
        let selectedCompetitions = this.state.selectedCompetitions;
        for (let competition in stats){
            if (selectedCompetitions.includes(competition)) {
                for (let stat in stats[competition]) {
                    if (!(stat in filteredStats)) {
                        filteredStats[stat] = stats[competition][stat];
                    } else {
                        filteredStats[stat] += stats[competition][stat];
                    }
                }
            }
        }
        return filteredStats;
    }

    calculateChartInput(filteredStats, percentileArrays){
        let template = this.state.template;
        let statsPer90 = {};
        let percentiles = {};
        switch (template){
            case "FW":
                statsPer90['goals'] = filteredStats['goals'] / (filteredStats['minutes']/90);
                // statsPer90['shots'] = (filteredStats['shots']  - filteredStats['penaltiesTaken']) / (filteredStats['minutes']/90);
                statsPer90['xG'] = filteredStats['xG'] / (filteredStats['minutes']/90);
                statsPer90['conversionRate'] = (filteredStats['goals'] / (filteredStats['shots']  - filteredStats['penaltiesTaken'])) * 100;
                statsPer90['shotsOnTarget'] = ((filteredStats['shotsOnTarget'] - filteredStats['penaltiesTaken']) / (filteredStats['shots'] - filteredStats['penaltiesTaken'])) * 100;
                statsPer90['assists'] = filteredStats['assists'] / (filteredStats['minutes']/90);
                // statsPer90['keyPasses'] = filteredStats['keyPasses'] / (filteredStats['minutes']/90);
                statsPer90['xA'] = filteredStats['xA'] / (filteredStats['minutes']/90);
                // statsPer90['succPasses'] = filteredStats['succPasses'] / (filteredStats['minutes']/90);
                statsPer90['PPA'] = filteredStats['PPA'] / (filteredStats['minutes']/90);
                statsPer90['passingRate'] = (filteredStats['succPasses'] / filteredStats['totalPasses']) * 100;
                statsPer90['succDribbles'] = filteredStats['succDribbles'] / (filteredStats['minutes']/90);
                statsPer90['dribbleRate'] = (filteredStats['succDribbles'] / filteredStats['totalDribbles']) * 100;
                statsPer90['possessionLosses'] = filteredStats['possessionLosses'] / (filteredStats['minutes']/90);
                statsPer90['recoveries'] = (filteredStats['tackles'] / (filteredStats['minutes']/90)) + (filteredStats['interceptions'] / (filteredStats['minutes']/90));
                for (let key in statsPer90){
                    percentiles[key] = this.percentRank(percentileArrays['fw'][key], statsPer90[key]) * 100
                }
                percentiles['possessionLosses'] = 100 - percentiles['possessionLosses'];
                break;
            case "AM":
                statsPer90['goals'] = filteredStats['goals'] / (filteredStats['minutes']/90);
                // statsPer90['shots'] = (filteredStats['shots']  - filteredStats['penaltiesTaken']) / (filteredStats['minutes']/90);
                statsPer90['xG'] = filteredStats['xG'] / (filteredStats['minutes']/90);
                statsPer90['assists'] = filteredStats['assists'] / (filteredStats['minutes']/90);
                // statsPer90['keyPasses'] = filteredStats['keyPasses'] / (filteredStats['minutes']/90);
                statsPer90['xA'] = filteredStats['xA'] / (filteredStats['minutes']/90);
                // statsPer90['succPasses'] = filteredStats['succPasses'] / (filteredStats['minutes']/90);
                statsPer90['PPA'] = filteredStats['PPA'] / (filteredStats['minutes']/90);
                statsPer90['passingRate'] = (filteredStats['succPasses'] / filteredStats['totalPasses']) * 100;
                statsPer90['succCrosses'] = filteredStats['succCrosses'] / (filteredStats['minutes']/90);
                statsPer90['crossRate'] = (filteredStats['succCrosses'] / filteredStats['totalCrosses']) * 100;
                statsPer90['succDribbles'] = filteredStats['succDribbles'] / (filteredStats['minutes']/90);
                statsPer90['dribbleRate'] = (filteredStats['succDribbles'] / filteredStats['totalDribbles']) * 100;
                statsPer90['possessionLosses'] = filteredStats['possessionLosses'] / (filteredStats['minutes']/90);
                statsPer90['recoveries'] = (filteredStats['tackles'] / (filteredStats['minutes']/90)) + (filteredStats['interceptions'] / (filteredStats['minutes']/90));
                for (let key in statsPer90){
                    percentiles[key] = this.percentRank(percentileArrays['am'][key], statsPer90[key]) * 100
                }
                percentiles['possessionLosses'] = 100 - percentiles['possessionLosses'];
                break;
            case "CM":
                statsPer90['goalsPlusAssists'] = (filteredStats['goals'] + filteredStats['assists']) / (filteredStats['minutes']/90);
                // statsPer90['keyPasses'] = filteredStats['keyPasses'] / (filteredStats['minutes']/90);
                // statsPer90['xA'] = filteredStats['xA'] / (filteredStats['minutes']/90);
                statsPer90['xGPlusxA'] = (filteredStats['xG'] + filteredStats['xA']) / (filteredStats['minutes']/90);
                // statsPer90['succPasses'] = filteredStats['succPasses'] / (filteredStats['minutes']/90);
                statsPer90['PFT'] = filteredStats['PFT'] / (filteredStats['minutes']/90);
                statsPer90['passingRate'] = (filteredStats['succPasses'] / filteredStats['totalPasses']) * 100;
                statsPer90['succLongPasses'] = filteredStats['succLongPasses'] / (filteredStats['minutes']/90);
                statsPer90['longPassingRate'] = (filteredStats['succLongPasses'] / filteredStats['totalLongPasses']) * 100;
                statsPer90['succDribbles'] = filteredStats['succDribbles'] / (filteredStats['minutes']/90);
                statsPer90['dribbleRate'] = (filteredStats['succDribbles'] / filteredStats['totalDribbles']) * 100;
                statsPer90['interceptions'] = (filteredStats['interceptions'] / (filteredStats['minutes']/90));
                statsPer90['tackles'] = (filteredStats['tackles'] / (filteredStats['minutes']/90));
                statsPer90['tackleRate'] = (filteredStats['tackles'] / (filteredStats['tackles'] + filteredStats['dribbledPast'])) *100;
                statsPer90['fouls'] = filteredStats['fouls'] / (filteredStats['minutes']/90);
                for (let key in statsPer90){
                    percentiles[key] = this.percentRank(percentileArrays['cm'][key], statsPer90[key]) * 100
                }
                percentiles['fouls'] = 100 - percentiles['fouls'];
                break;
            case "FB":
                statsPer90['assists'] = filteredStats['assists'] / (filteredStats['minutes']/90);
                // statsPer90['keyPasses'] = filteredStats['keyPasses'] / (filteredStats['minutes']/90);
                statsPer90['xA'] = filteredStats['xA'] / (filteredStats['minutes']/90);
                // statsPer90['succPasses'] = filteredStats['succPasses'] / (filteredStats['minutes']/90);
                statsPer90['PFT'] = filteredStats['PFT'] / (filteredStats['minutes']/90);
                statsPer90['passingRate'] = (filteredStats['succPasses'] / filteredStats['totalPasses']) * 100;
                statsPer90['succCrosses'] = filteredStats['succCrosses'] / (filteredStats['minutes']/90);
                statsPer90['crossRate'] = (filteredStats['succCrosses'] / filteredStats['totalCrosses']) * 100;
                statsPer90['succDribbles'] = filteredStats['succDribbles'] / (filteredStats['minutes']/90);
                statsPer90['dribbleRate'] = (filteredStats['succDribbles'] / filteredStats['totalDribbles']) * 100;
                statsPer90['interceptions'] = (filteredStats['interceptions'] / (filteredStats['minutes']/90));
                statsPer90['tackles'] = (filteredStats['tackles'] / (filteredStats['minutes']/90));
                statsPer90['tackleRate'] = (filteredStats['tackles'] / (filteredStats['tackles'] + filteredStats['dribbledPast'])) *100;
                statsPer90['fouls'] = filteredStats['fouls'] / (filteredStats['minutes']/90);
                for (let key in statsPer90){
                    percentiles[key] = this.percentRank(percentileArrays['fb'][key], statsPer90[key]) * 100
                }
                percentiles['fouls'] = 100 - percentiles['fouls'];
                break;
            case "CB":
                // statsPer90['succPasses'] = filteredStats['succPasses'] / (filteredStats['minutes']/90);
                statsPer90['PFT'] = filteredStats['PFT'] / (filteredStats['minutes']/90);
                statsPer90['passingRate'] = (filteredStats['succPasses'] / filteredStats['totalPasses']) * 100;
                statsPer90['succLongPasses'] = filteredStats['succLongPasses'] / (filteredStats['minutes']/90);
                statsPer90['longPassingRate'] = (filteredStats['succLongPasses'] / filteredStats['totalLongPasses']) * 100;
                statsPer90['interceptions'] = (filteredStats['interceptions'] / (filteredStats['minutes']/90));
                statsPer90['tackles'] = (filteredStats['tackles'] / (filteredStats['minutes']/90));
                statsPer90['tackleRate'] = (filteredStats['tackles'] / (filteredStats['tackles'] + filteredStats['dribbledPast'])) *100;
                statsPer90['fouls'] = filteredStats['fouls'] / (filteredStats['minutes']/90);
                statsPer90['succAerialDuels'] = filteredStats['succAerialDuels'] / (filteredStats['minutes']/90);
                statsPer90['aerialDuelRate'] = (filteredStats['succAerialDuels'] / filteredStats['totalAerialDuels']) * 100;
                statsPer90['blocks'] = (filteredStats['blocks'] / (filteredStats['minutes']/90));
                statsPer90['clearances'] = filteredStats['clearances'] / (filteredStats['minutes']/90);
                for (let key in statsPer90){
                    percentiles[key] = this.percentRank(percentileArrays['cb'][key], statsPer90[key]) * 100
                }
                percentiles['fouls'] = 100 - percentiles['fouls'];
                break;
            case "N/A":
                statsPer90['goals'] = 0;
                statsPer90['xG'] = 0;
                statsPer90['conversionRate'] = 0;
                statsPer90['shotsOnTarget'] = 0;
                statsPer90['assists'] = 0;
                statsPer90['xA'] = 0;
                statsPer90['PPA'] = 0;
                statsPer90['passingRate'] = 0;
                statsPer90['succDribbles'] = 0;
                statsPer90['dribbleRate'] = 0;
                statsPer90['possessionLosses'] = 0;
                statsPer90['recoveries'] = 0;
                for (let key in statsPer90){
                    percentiles[key] = 0
                }
                break;
        }
        return this.insertChartInput(statsPer90, percentiles);
    }

    percentRank(array, value) {
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
    }

    roundNumbers(someStats, precision){
        for (let stat in someStats){
            if (isFinite(someStats[stat])) {
                someStats[stat] = Math.round(someStats[stat] * (10**precision)) / (10**precision);
            }
            else {
                someStats[stat] = 0;
            }
        }
        return someStats;
    }

    ordinalSuffix(i) {
        var j = i % 10,
            k = i % 100;
        if (j === 1 && k !== 11) {
            return i + "st";
        }
        if (j === 2 && k !== 12) {
            return i + "nd";
        }
        if (j === 3 && k !== 13) {
            return i + "rd";
        }
        return i + "th";
    }

    insertChartInput(statsPer90, percentiles) {
        let template = this.state.template;
        let colors = [];
        if (template === "FW"){
            colors = [5, 5, 5, 5, 6, 6, 6, 6, 2, 2, 2, 0];
        }
        else if (template === "AM"){
            colors = [5, 5, 6, 6, 6, 6, 6, 6, 2, 2, 2, 0];
        }
        else if (template === "CM"){
            colors = [8, 8, 6, 6, 6, 6, 2, 2, 0, 0, 0, 0];
        }
        else if (template === "FB"){
            colors = [6, 6, 6, 6, 6, 6, 2, 2, 0, 0, 0, 0];
        }
        else if (template === "CB") {
            colors = [6, 6, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0];
        }
        else {
            colors = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        }
        statsPer90 = this.roundNumbers(statsPer90, 2);
        percentiles = this.roundNumbers(percentiles, 0);
        let chartInput = [];
        let i = 0;
        for (let key in percentiles){
            chartInput[i] = {
                y: percentiles[key],
                percentile: this.ordinalSuffix(percentiles[key]),
                p90: statsPer90[key],
                color: Highcharts.Color(Highcharts.getOptions().colors[colors[i]]).setOpacity(0.85).get()
            };
            i++;
        }
        return chartInput;
    }

    render() {

        let {
            name,
            age,
            url,
            club,
            lastUpdated,
            selectedCompetitions,
            template,
            selectedCategories,
            labelType,
            allStats,
            percentiles,
            isLoading,
            multipleClubs,
            fontSizes,
            creditsPosition,
            animation,
            isMobile
        } = this.state;

        if (isLoading) {
            return (
                <LoadingSpinner/>
            )
        }

        else {
            let allCompetitions = this.state.allCompetitions;
            let competitionLabels = [];
            for (let i=0; i<allCompetitions.length; i++){
                let current = allCompetitions[i];
                let isIncluded = selectedCompetitions.includes(current);
                let label = current;
                if (!multipleClubs){
                    label = label.substring(0, label.indexOf("|")-1)
                }
                competitionLabels.push(
                    <label className={isIncluded ? "selected-label" : null}>
                        <input className="competition"
                               type="checkbox"
                               value={current}
                               onChange={this.changeSelectedCompetitions}
                               checked={isIncluded}
                        /> {"  " + label}
                    </label>
                )
            }

            if (percentiles.length !== 0 && Object.keys(allStats).length !== 0 && selectedCategories !== []) {

                let selectedStats = this.filterStats(allStats);
                let series;
                let subtitle = "";
                if (selectedCompetitions.length !== 0){
                    subtitle = `Age: ${age} ║ Minutes Played: ${selectedStats['minutes'].toLocaleString()}<br/>`;
                    let chartInput = this.calculateChartInput(selectedStats, percentiles);
                    series = [chartInput];
                    switch (template) {
                        case "FW":
                            subtitle += "vs Top-5 League Players with 10+ Starts as Forwards<br/>";
                            break;
                        case "AM":
                            subtitle += "vs Top-5 League Players with 10+ Starts as Attacking Midfielders / Wingers<br/>";
                            break;
                        case "CM":
                            subtitle += "vs Top-5 League Players with 10+ Starts as Central / Defensive Midfielders<br/>";
                            break;
                        case "FB":
                            subtitle += "vs Top-5 League Players with 10+ Starts as Full-backs<br/>";
                            break;
                        case "CB":
                            subtitle += "vs Top-5 League Players with 10+ Starts as Center-backs<br/>";
                            break;
                        case "N/A":
                            subtitle += "No template selected<br/>"
                    }
                    if (template !== "N/A"){
                        subtitle += "Percentile Rank Bars w/ Per 90 Stats<br/>";
                    }
                    else {
                        subtitle += "-<br/>"
                    }
                }

                else {
                    series = [];
                    subtitle = "-<br>-<br>-";
                }

                let credits = `Last Updated: ${lastUpdated} UTC ${isMobile ? '<br/>.<br/>' : '<br/>'}Sources: Opta (via WhoScored.com) & StatsBomb (via FBref.com)`;
                let creditsOffset = isMobile ? -40 : -20;

                var options = {
                    chart: {
                        animation: animation,
                        backgroundColor: 'rgba(0, 0, 0, 0)',
                        style: {
                            fontFamily: 'sans-serif'
                        },
                        parallelCoordinates: true,
                        parallelAxes: {
                            labels: {
                                enabled: false,
                                style: {
                                    color: '#444444',
                                    fontSize: fontSizes['yAxisLabels'],
                                }
                            },
                            gridZIndex: 5,
                            lineWidth: 0,
                            endOnTick: true,
                            showFirstLabel: false,
                            showLastLabel: true,
                            min: -15,
                            max: 100,
                            tickPositions: [-15, 0, 25, 50, 75, 100]
                        },
                        polar: true,
                        type: 'column',
                        // plotBackgroundColor: '#F5F6F7',
                        // plotShadow: true,
                        // hideDelay: 0,
                        spacingLeft: 0,
                        spacingRight: 0,
                        marginLeft: 90,
                        marginRight: 90,
                        marginBottom: (creditsPosition === "right" && !isMobile) ? 30 : 60,
                        events: {
                            load: function() {
                                this.title.element.onclick = function() {
                                    window.open(url, '_blank');
                                }
                            },
                        }
                    },
                    credits: {
                        text: credits,
                        position: {
                            align: creditsPosition,
                            y: creditsOffset
                        },
                        style: {
                            fontSize: fontSizes['credits']
                        },
                        href: ''
                    },
                    plotOptions: {
                        series: {
                            dataLabels: {
                                enabled: template !== "N/A",
                                style: {
                                    // color: "black",
                                    fontWeight: 'bold',
                                    fontSize: fontSizes['dataLabels'],
                                    textOutline: fontSizes['dataLabelsOutline'] + " #fafbfc"
                                },
                                format: labelType === "raw" ? '{point.p90}' : '{point.percentile}',
                                padding: 0,
                                allowOverlap: true,
                                z: 7
                            },
                            // shadow: true
                        },
                    },
                    title: {
                        text: name + ", 19/20",
                        style: {
                            color: '#e75453',
                            fontSize: fontSizes['title'],
                            fontWeight: 'bold',
                        },
                        margin: 35
                    },
                    pane: {
                        startAngle: -15
                    },
                    lang: {
                        noData: "Select a competition"
                    },
                    noData: {
                        attr: {
                            zIndex: 6
                        },
                        style: {
                            fontWeight: 'bold',
                            fontSize: fontSizes['noData'],
                            color: '#303030'
                        }
                    },
                    subtitle: {
                        text: subtitle,
                        style: {
                            fontWeight: 'bold',
                            // color: 'black',
                            fontSize: fontSizes['subtitle']
                        }
                    },
                    tooltip: {
                        headerFormat: '<span style="font-size: ' + fontSizes['tooltipHeader'] + '">{point.key}</span><br/>',
                        pointFormat: '<span style="color:{point.color}">\u25CF</span>' +
                            ' {series.name}<br>Raw Value: <b>{point.p90}</b><br/>Percentile Rank: <b>{point.percentile}</b>',
                        style: {
                            fontSize: fontSizes['tooltip']
                        }
                    },
                    legend: {
                        enabled: false,
                        borderWidth: 1,
                        align: 'center',
                        verticalAlign: 'bottom',
                        layout: 'horizontal'
                    },
                    xAxis: {
                        categories: selectedCategories,
                        labels: {
                            zIndex: 1,
                            distance: isMobile === true ? 60 : 40,
                            style: {
                                color: 'black',
                                fontSize: fontSizes['xAxisLabels'],
                            },
                            padding: 31
                        },
                        gridLineWidth: 1.5,
                        gridLineColor: '#333333',
                        gridZIndex: 4
                    },
                    series:
                        series.map(function (set, i) {
                            return {
                                pointPadding: 0,
                                groupPadding: 0,
                                name: name,
                                data: set,
                                stickyTracking: false,
                                zIndex: 0
                            };
                        }),
                    exporting: {
                        scale: 1,
                        sourceWidth: 1920,
                        sourceHeight: 1080,
                        buttons: {
                            contextButton: {
                                menuItems: ["viewFullscreen", "printChart"]
                            }
                        }
                    }
                };
            }

            return (
                <div id="main2">
                    <SearchBar type={2}/>
                    <div className="screen2" id="content-screen">
                        <div className="filter" id="chart-filters">
                            <div className="chart-filter-inputs" id="chart-filter-inputs-laptop">
                                <h3>Template</h3>
                                <form id="templates" onChange={this.changeTemplate}>
                                    <label><input type="radio" name="template" value="FW" checked={template === "FW" ? true: null}/> Forward </label>
                                    <label><input type="radio" name="template" value="AM" checked={template === "AM" ? true: null}/> Attacking Midfielder / Winger</label>
                                    <label><input type="radio" name="template" value="CM" checked={template === "CM" ? true: null}/> Central / Defensive Midfielder</label>
                                    <label><input type="radio" name="template" value="FB" checked={template === "FB" ? true: null}/> Full-back </label>
                                    <label><input type="radio" name="template" value="CB" checked={template === "CB" ? true: null}/> Center-back </label>
                                </form>
                                <h3>Competitions</h3>
                                <h4 style={{marginBottom: '10px'}}>19/20 {multipleClubs === false ? ' | ' + club : null}</h4>
                                <form id="competitions">
                                    {competitionLabels}
                                </form>
                                <h3>Data Labels</h3>
                                <form id="data-labels" onChange={this.changeLabelType}>
                                    <label className={labelType === "raw" ? "selected-label" : null}>
                                        <input type="radio" name="labelType" value="raw" checked={labelType === "raw" ? true: null}/> <span>Per 90 Stats</span>
                                    </label>
                                    <label className={labelType === "percentiles" ? "selected-label" : null}>
                                        <input type="radio" name="labelType" value="percentiles" checked={labelType === "percentiles" ? true: null}/> <span>Percentile Ranks</span>
                                    </label>
                                </form>
                            </div>
                            <div className="chart-filter-inputs" id="chart-filter-inputs-mobile">
                                <div id="templates-container">
                                    <h3>Template</h3>
                                    <form id="templates" onChange={this.changeTemplate}>
                                        <label className={template === "FW" ? "selected-label" : null}>
                                            <input type="radio" name="template" value="FW" checked={template === "FW" ? true: null}/> <span>Forward</span>
                                        </label>
                                        <label className={template === "AM" ? "selected-label" : null}>
                                            <input type="radio" name="template" value="AM" checked={template === "AM" ? true: null}/> <span>Attacking Midfielder / Winger</span>
                                        </label>
                                        <label className={template === "CM" ? "selected-label" : null}>
                                            <input type="radio" name="template" value="CM" checked={template === "CM" ? true: null}/> <span>Central / Defensive Midfielder</span>
                                        </label>
                                        <label className={template === "FB" ? "selected-label" : null}>
                                            <input type="radio" name="template" value="FB" checked={template === "FB" ? true: null}/> <span>Full-back</span>
                                        </label>
                                        <label className={template === "CB" ? "selected-label" : null}>
                                            <input type="radio" name="template" value="CB" checked={template === "CB" ? true: null}/> <span>Center-back</span>
                                        </label>
                                    </form>
                                </div>
                                <div id="competitions-container">
                                    <h3 style={{marginBottom: '0px'}}>Competitions</h3>
                                    <h4 style={{marginBottom: '20px'}}>19/20 {multipleClubs === false ? ' | ' + club : null}</h4>
                                    <form id="competitions">
                                        {competitionLabels}
                                    </form>
                                </div>
                                <h3>Data Labels</h3>
                                <form id="data-labels" onChange={this.changeLabelType}>
                                    <label className={labelType === "raw" ? "selected-label" : null}>
                                        <input type="radio" name="labelType" value="raw" checked={labelType === "raw" ? true: null}/> <span>Per 90 Stats</span>
                                    </label>
                                    <label className={labelType === "percentiles" ? "selected-label" : null}>
                                        <input type="radio" name="labelType" value="percentiles" checked={labelType === "percentiles" ? true: null}/> <span>Percentile Ranks</span>
                                    </label>
                                </form>
                            </div>
                            <div id="filter-buttons">
                                <div className="filter-button">
                                    <button id="toggleCreditsButton" type="button" onClick={this.toggleCreditsPosition}>Toggle Credits Position</button>
                                </div>
                                <div className="filter-button">
                                    <button id="exportButton" type="button" onClick={this.exportAsImage}>Export Chart as PNG</button>
                                </div>
                                <div className="filter-button">
                                    <button id="compareButton" type="button" disabled={true}>Compare To...</button>
                                </div>
                            </div>
                        </div>
                        <div className="result" id="chart">
                            <HighchartsReact
                                constructorType={"chart"}
                                highcharts={Highcharts}
                                containerProps={{style: {width: '100%'}}}
                                options={options}
                                ref={this.chartRef}
                            />
                        </div>
                    </div>
                </div>
            );
        }
    }

}

export default Stats;
