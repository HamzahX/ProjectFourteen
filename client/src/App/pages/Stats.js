import React, { Component } from 'react';

import SearchBar from "../components/SearchBar";
import LoadingSpinner from "../components/LoadingSpinner";
import Highcharts from 'highcharts/highstock'
import HighchartsMore from 'highcharts/highcharts-more'
import HighchartsParallel from 'highcharts/modules/parallel-coordinates'
import HighchartsReact from 'highcharts-react-official'

HighchartsMore(Highcharts);
HighchartsParallel(Highcharts);

class Stats extends Component {

    constructor(props){
        super(props);
        let categories = [
            'Non-Penalty Goals',
            'Non-Penalty Shots',
            'Conversion Rate',
            'Shots on Target %',
            'Assists',
            'Key Passes',
            'Completed Passes',
            'Pass Completion %',
            'Successful Dribbles',
            'Dribble Success %',
            'Turnovers',
            'Recoveries',
        ];
        this.state = {
            isLoading: false,
            allStats: {},
            percentiles: this.props.percentiles,
            allCompetitions: [],
            selectedCompetitions: [],
            categories: categories,
            template: "FW",
            name: '',
            url: '',
            isAll: false,
            multipleLeagues: false,
            isMobile: this.props.isMobile,
            fontSizes: {
                title: this.props.isMobile === true ? '4vw' : '2em',
                subtitle: this.props.isMobile === true ? '2.8vw' : '1.4em',
                noData: this.props.isMobile === true ? '2.7vw' : '1.35em',
                xAxisLabels: this.props.isMobile === true ? '2.3vw' : '1.15em',
                dataLabels: this.props.isMobile === true ? '2.3vw' : '1.25em',
                tooltipHeader: this.props.isMobile === true ? '2.3vw' : '1em',
                tooltip: this.props.isMobile === true ? '2.3vw' : '1.25em',
                credits: this.props.isMobile === true ? '1.4vw' : '1em',
                yAxisLabels: this.props.isMobile === true ? '1vw' : '0.5em',
            }
        };

        this.processStats = this.processStats.bind(this);
        this.changeTemplate = this.changeTemplate.bind(this);
        this.changeSelectedCompetitions = this.changeSelectedCompetitions.bind(this);
        this.selectAllCompetitions = this.selectAllCompetitions.bind(this);
        this.clearAllCompetitions = this.clearAllCompetitions.bind(this);
        this.filterStats = this.filterStats.bind(this);
        this.calculateChartInput = this.calculateChartInput.bind(this);
        this.percentRank = this.percentRank.bind(this);
        this.roundNumbers = this.roundNumbers.bind(this);
        this.insertChartInput = this.insertChartInput.bind(this);
    }

    componentDidMount() {
        this.setState({
            isLoading: true
        }, () => {
            this.getStats();
        });
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
        let multipleLeagues = this.state.allCompetitions.filter(x => x.startsWith("League | ")).length > 1;
        this.setState({
            url: response.url,
            name: response.name,
            lastUpdated: response.lastUpdated,
            allStats: response.stats,
            allCompetitions: Object.keys(response.stats),
            selectedCompetitions: Object.keys(response.stats),
            isLoading: false,
            multipleLeagues: multipleLeagues
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
            selectedCompetitions: selectedCompetitions
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

    changeTemplate(event){
        let template = event.target.value;

        this.setState({
            template: template
        }, () => {
            this.setCategories();
        });

    }

    setCategories() {
        let template = this.state.template;

        let categories = [];
        switch (template) {
            case "FW":
                categories = [
                    'Non-Penalty Goals',
                    'Non-Penalty Shots',
                    'Conversion Rate',
                    'Shots on Target %',
                    'Assists',
                    'Key Passes',
                    'Completed Passes',
                    'Pass Completion %',
                    'Successful Dribbles',
                    'Dribble Success %',
                    'Turnovers',
                    'Recoveries',
                ];
                break;
            case "AM":
                categories = [
                    'Non-Penalty Goals',
                    'Non-Penalty Shots',
                    'Assists',
                    'Key Passes',
                    'Completed Passes',
                    'Pass Completion %',
                    'Completed Crosses',
                    'Cross Completion %',
                    'Successful Dribbles',
                    'Dribble Success %',
                    'Turnovers',
                    'Recoveries',
                ];
                break;
            case "CM":
                categories = [
                    'Non-Penalty Goals + Assists',
                    'Key Passes',
                    'Completed Passes',
                    'Pass Completion %',
                    'Completed Long Passes',
                    'Long Pass Completion %',
                    'Successful Dribbles',
                    'Dribble Success %',
                    'Interceptions',
                    'Tackles Won',
                    'Tackle Win %',
                    'Fouls Committed'
                ];
                break;
            case "FB":
                categories = [
                    'Assists',
                    'Key Passes',
                    'Completed Passes',
                    'Pass Completion %',
                    'Completed Crosses',
                    'Cross Completion %',
                    'Successful Dribbles',
                    'Dribble Success %',
                    'Interceptions',
                    'Tackles Won',
                    'Tackle Win %',
                    'Fouls Committed'
                ];
                break;
            case "CB":
                categories = [
                    'Completed Passes',
                    'Pass Completion %',
                    'Completed Long Passes',
                    'Long Pass Completion %',
                    'Interceptions',
                    'Tackles Won',
                    'Tackle Win %',
                    'Fouls Committed',
                    'Blocks',
                    'Clearances',
                    'Aerial Duels Won',
                    'Aerial Duel Win %'
                ];
                break;
        }

        this.setState({
            categories: categories
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
                statsPer90['shots'] = (filteredStats['shots']  - filteredStats['penaltiesTaken']) / (filteredStats['minutes']/90);
                statsPer90['conversionRate'] = (filteredStats['goals'] / (filteredStats['shots']  - filteredStats['penaltiesTaken'])) * 100;
                statsPer90['shotsOnTarget'] = ((filteredStats['shotsOnTarget'] - filteredStats['penaltiesTaken']) / (filteredStats['shots'] - filteredStats['penaltiesTaken'])) * 100;
                statsPer90['assists'] = filteredStats['assists'] / (filteredStats['minutes']/90);
                statsPer90['keyPasses'] = filteredStats['keyPasses'] / (filteredStats['minutes']/90);
                statsPer90['succPasses'] = filteredStats['succPasses'] / (filteredStats['minutes']/90);
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
                statsPer90['shots'] = (filteredStats['shots']  - filteredStats['penaltiesTaken']) / (filteredStats['minutes']/90);
                statsPer90['assists'] = filteredStats['assists'] / (filteredStats['minutes']/90);
                statsPer90['keyPasses'] = filteredStats['keyPasses'] / (filteredStats['minutes']/90);
                statsPer90['succPasses'] = filteredStats['succPasses'] / (filteredStats['minutes']/90);
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
                statsPer90['keyPasses'] = filteredStats['keyPasses'] / (filteredStats['minutes']/90);
                statsPer90['succPasses'] = filteredStats['succPasses'] / (filteredStats['minutes']/90);
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
                statsPer90['keyPasses'] = filteredStats['keyPasses'] / (filteredStats['minutes']/90);
                statsPer90['succPasses'] = filteredStats['succPasses'] / (filteredStats['minutes']/90);
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
                statsPer90['succPasses'] = filteredStats['succPasses'] / (filteredStats['minutes']/90);
                statsPer90['passingRate'] = (filteredStats['succPasses'] / filteredStats['totalPasses']) * 100;
                statsPer90['succLongPasses'] = filteredStats['succLongPasses'] / (filteredStats['minutes']/90);
                statsPer90['longPassingRate'] = (filteredStats['succLongPasses'] / filteredStats['totalLongPasses']) * 100;
                statsPer90['interceptions'] = (filteredStats['interceptions'] / (filteredStats['minutes']/90));
                statsPer90['tackles'] = (filteredStats['tackles'] / (filteredStats['minutes']/90));
                statsPer90['tackleRate'] = (filteredStats['tackles'] / (filteredStats['tackles'] + filteredStats['dribbledPast'])) *100;
                statsPer90['fouls'] = filteredStats['fouls'] / (filteredStats['minutes']/90);
                statsPer90['blocks'] = (filteredStats['blocks'] / (filteredStats['minutes']/90));
                statsPer90['clearances'] = filteredStats['clearances'] / (filteredStats['minutes']/90);
                statsPer90['succAerialDuels'] = filteredStats['succAerialDuels'] / (filteredStats['minutes']/90);
                statsPer90['aerialDuelRate'] = (filteredStats['succAerialDuels'] / filteredStats['totalAerialDuels']) * 100;
                for (let key in statsPer90){
                    percentiles[key] = this.percentRank(percentileArrays['cb'][key], statsPer90[key]) * 100
                }
                percentiles['fouls'] = 100 - percentiles['fouls'];
                break;
        }
        return this.insertChartInput(statsPer90, percentiles);
    }

    percentRank(array, value) {
        if (!isFinite(value)){
            value = 0;
        }
        for (let i = 0, l = array.length; i < l; i++) {
            if (value < array[i]) {
                while (i < l && value === array[i]) i++;
                if (i === 0) return 0;
                if (value !== array[i-1]) {
                    i += (value - array[i-1]) / (array[i] - array[i-1]);
                }
                return i / l;
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
            colors = [8, 6, 6, 6, 6, 6, 2, 2, 0, 0, 0, 0];
        }
        else if (template === "FB"){
            colors = [6, 6, 6, 6, 6, 6, 2, 2, 0, 0, 0, 0];
        }
        else {
            colors = [6, 6, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0];
        }
        statsPer90 = this.roundNumbers(statsPer90, 2);
        percentiles = this.roundNumbers(percentiles, 0);
        let chartInput = [];
        let i = 0;
        for (let key in percentiles){
            // chartInput[i] = {y: percentiles[key], p90: statsPer90[key], color: '#FF0000'};
            chartInput[i] = {y: percentiles[key], p90: statsPer90[key], color: Highcharts.Color(Highcharts.getOptions().colors[colors[i]]).setOpacity(0.8).get()};
            i++;
        }
        return chartInput;
    }

    render() {

        let {
            name,
            url,
            lastUpdated,
            selectedCompetitions,
            template,
            categories,
            allStats,
            percentiles,
            isLoading,
            multipleLeagues,
            fontSizes,
            isMobile
        } = this.state;

        if (isLoading) {
            return (
                <LoadingSpinner/>
            )
        }

        else {
            let allCompetitions = this.state.allCompetitions;
            let cards = [];
            for (let i=0; i<allCompetitions.length; i++){
                let current = allCompetitions[i];
                let isIncluded = selectedCompetitions.includes(current);
                let label = current;
                if (!multipleLeagues){
                    label = label.substring(0, label.indexOf("|")-1)
                }
                cards.push(
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

            if (percentiles.length !== 0 && Object.keys(allStats).length !== 0 && categories !== []) {

                let selectedStats = this.filterStats(allStats);
                let series;
                let subtitle;
                if (selectedCompetitions.length !== 0){
                    let chartInput = this.calculateChartInput(selectedStats, percentiles);
                    series = [chartInput];
                    subtitle = "Percentile Rank Bars (w/ p90 Raw Values)<br>";
                    switch (template) {
                        case "FW":
                            subtitle += "Forward Template  ║  Minutes Played: ";
                            break;
                        case "AM":
                            subtitle += "Attacking Midfielder / Winger Template  ║  Minutes Played: ";
                            break;
                        case "CM":
                            subtitle += "Central / Defensive Midfielder Template  ║  Minutes Played: ";
                            break;
                        case "FB":
                            subtitle += "Full-back Template  ║  Minutes Played: ";
                            break;
                        case "CB":
                            subtitle += "Center-back Template  ║  Minutes Played: ";
                            break;
                    }

                    subtitle += selectedStats['minutes'].toLocaleString();
                    subtitle += "<br>Last Updated: " + lastUpdated + " UTC";
                }

                else {
                    series = [];
                    subtitle = "-<br>-<br>-";
                }

                var options = {
                    chart: {
                        backgroundColor: '#fafbfc',
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
                        hideDelay: 0,
                        spacingLeft: 0,
                        spacingRight: 0,
                        marginLeft: 90,
                        marginRight: 90,
                        marginBottom: 30,
                        events: {
                            load: function() {
                                this.title.element.onclick = function() {
                                    window.open(url, '_blank');
                                }
                            },
                        }
                    },
                    credits: {
                        text: "Percentile ranks are calculated by comparing a player to other top 5 league players who have at least 10 starts in the selected template position",
                        style: {
                            fontSize: fontSizes['credits']
                        },
                        href: ''
                    },
                    plotOptions: {
                        series: {
                            color: Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0.6).get(),
                            dataLabels: {
                                enabled: true,
                                inside: true,
                                style: {
                                    color: "black",
                                    fontWeight: '600',
                                    fontSize: fontSizes['dataLabels'],
                                    textOutline: "1.5px contrast"
                                },
                                format: '{point.p90}',
                                padding: 0,
                                allowOverlap: true,
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
                        startAngle: -16.3636363636363636363
                    },
                    lang: {
                        noData: "Select a competition"
                    },
                    noData: {
                        style: {
                            fontWeight: 'bold',
                            fontSize: fontSizes['noData'],
                            color: '#303030'
                        }
                    },
                    subtitle: {
                        text: subtitle,
                        style: {
                            // color: 'black',
                            fontSize: fontSizes['subtitle']
                        }
                    },
                    tooltip: {
                        headerFormat: '<span style="font-size: ' + fontSizes['tooltipHeader'] + '">{point.key}</span><br/>',
                        pointFormat: '<span style="color:{point.color}">\u25CF</span>' +
                            ' {series.name}<br>Raw Value: <b>{point.p90}</b><br/>Percentile Rank: <b>{point.formattedValue}</b>',
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
                        categories: categories,
                        labels: {
                            distance: isMobile === true ? 60 : 40,
                            style: {
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
                                <h4>19/20</h4>
                                <form id="competitions">
                                    {cards}
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
                                    <h3>Competitions</h3>
                                    <h4>19/20</h4>
                                    <form id="competitions">
                                        {cards}
                                    </form>
                                </div>
                            </div>
                            <div id="filter-buttons">
                                <div className="filter-button">
                                    <button id="selectAllButton" type="button" onClick={this.selectAllCompetitions}>Select All Competitions</button>
                                </div>
                                <div className="filter-button">
                                    <button id="clearAllButton" type="button" onClick={this.clearAllCompetitions}>Clear All Competitions</button>
                                </div>
                                <div className="filter-button">
                                    <button id="toggleTableButton" type="button" disabled={true}>Toggle Data Table</button>
                                </div>
                            </div>
                        </div>
                        <div className="result" id="chart">
                            <HighchartsReact
                                constructorType={"chart"}
                                highcharts={Highcharts}
                                containerProps={{style: {width: '100%'}}}
                                options={options}
                            />
                        </div>
                    </div>
                </div>
            );
        }
    }

}

export default Stats;