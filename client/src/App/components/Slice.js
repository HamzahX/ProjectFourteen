import React, {Component} from 'react';

//import dependencies
import Highcharts from 'highcharts/highstock'
import HighchartsReact from 'highcharts-react-official'
import HighchartsMore from 'highcharts/highcharts-more'
import NoDataToDisplay from 'highcharts/modules/no-data-to-display';

HighchartsMore(Highcharts);
NoDataToDisplay(Highcharts);

/**
 * Component to render Slices (charts)
 */
class Slice extends Component {

    constructor(props) {

        super(props);

        this.isMobile = this.props.isMobile;
        this.isForExport = this.props.isForExport;
        this.isForComparison = this.props.isForComparison;

        this.statsByPosition = this.props.statsByPosition;
        this.statsReference = this.props.statsReference;

        //set font size constants
        this.fontSizes = undefined;
        if (this.isForExport){
            this.fontSizes =  {
                title: this.isMobile ? '5.5vw' : '2.9em',
                subtitle: this.isMobile ? '2.7vw' : '1.7em',
                noData: '1.76em',
                xAxisLabels: '1.8em',
                dataLabels: '1.95em',
                dataLabelsOutline: '0.13em',
                tooltipHeader: '0em',
                tooltip: '0em',
                legend: '2.3em',
                credits: '1.5em',
                yAxisLabels: '0.65em'
            };
        }
        else {
            if (this.isMobile) {
                this.fontSizes =  {
                    title: '4.2vw',
                    subtitle: '2.6vw',
                    noData: '2.7vw',
                    xAxisLabels: '2.15vw',
                    dataLabels: '2.3vw',
                    dataLabelsOutline: '0.3vw',
                    tooltipHeader: '2.3vw',
                    tooltip: '2.3vw',
                    legend: '2.8vw',
                    legendTitle: '2vw',
                    credits: '2.3vw',
                    yAxisLabels: '1vw'
                };
            }
            else {
                this.fontSizes =  {
                    title: '1.8em',
                    subtitle: '1.2em',
                    noData: '1.35em',
                    xAxisLabels: '1.15em',
                    dataLabels: '1.15em',
                    dataLabelsOutline: '0.21em',
                    tooltipHeader: '1.05em',
                    tooltip: '0.95em',
                    legend: '1.4em',
                    legendTitle: '1em',
                    credits: '1.2em',
                    yAxisLabels: '0.5em'
                };
            }
        }

        this.competitionDict = {
            "Premier League": "ENG",
            "La Liga": "ESP",
            "Serie A": "ITA",
            "Bundesliga": "GER",
            "Ligue 1": "FRA",
            "Champions League": "UCL",
            "Europa League": "UEL"
        };

        //set subtitle constants
        this.subtitles = {
            "FW": "Percentile Ranks vs Top-5 League <b>Forwards</b>",
            "AM": "Percentile Ranks vs Top-5 League <b>Attacking Midfielders / Wingers</b>",
            "CM": "Percentile Ranks vs Top-5 League <b>Central / Defensive Midfielders</b>",
            "FB": "Percentile Ranks vs Top-5 League <b>Full-backs</b>",
            "CB": "Percentile Ranks vs Top-5 League <b>Center-backs</b>",
            "GK": "Percentile Ranks vs Top-5 League <b>Goalkeepers</b>"
        };

        //add a link to the credits if the chart is not for export
        let chartEvents;
        if (!this.isForExport){
            chartEvents = {
                load: function() {
                    this.credits.element.onclick = function() {
                        window.open('https://fbref.com', '_blank');
                    };
                },
            };
        }

        //set x-axis label distance
        let xAxisLabelDistance;
        if (this.isForExport){
            xAxisLabelDistance = 70;
        }
        else {
            xAxisLabelDistance = this.isMobile ? 60 : 40;
        }

        //define the tooltip positioner for shared tooltips (used for comparisons)
        let tooltipPositioner = undefined;

        if (this.isForComparison) {

            if (this.isMobile){
                tooltipPositioner = (labelWidth, labelHeight) => {
                    return {x: 6, y: document.body.scrollHeight - labelHeight - 23};
                }
            }
            else {
                tooltipPositioner = function (labelWidth, labelHeight, point) {
                    let xPos = point.plotX;
                    let yPos = point.plotY;
                    return {x: xPos, y: yPos - 15};
                }
            }


        }

        //define the text for the credits
        let creditsText = this.isForExport ? "" : "Data Sources: FBref.com | StatsBomb<br/>";
        creditsText += `Last Updated: ${this.props.lastUpdated} UTC`;

        //Highcharts chart options
        //variable options are initialized to undefined, and then modified on render using props
        //consult the Highcharts API reference for detailed explanations of each option
        //https://api.highcharts.com/highcharts/
        this.chartOptions = {
            title: {
                useHTML: true,
                text: undefined,
                style: {
                    fontSize: this.fontSizes['title'],
                    fontWeight: 'bold',
                },
                margin: 35
            },
            subtitle: {
                useHTML: true,
                text: undefined,
                style: {
                    color: 'black',
                    fontSize: this.fontSizes['subtitle'],
                }
            },
            pane: {
                startAngle: undefined
            },
            chart: {
                backgroundColor: 'rgba(0, 0, 0, 0)',
                style: {
                    fontFamily: 'sans-serif'
                },
                animation: undefined,
                polar: true,
                type: 'column',
                marginLeft: 90,
                marginRight: 90,
                marginTop: undefined,
                marginBottom: undefined,
                events: chartEvents,
                zoomType: 'x',
                panning: true,
                panKey: 'shift'
            },
            xAxis: {
                categories: undefined,
                labels: {
                    zIndex: 0,
                    distance: xAxisLabelDistance,
                    style: {
                        color: 'black',
                        fontSize: this.fontSizes['xAxisLabels'],
                    },
                    padding: 31
                },
                gridLineWidth: 2,
                gridLineColor: '#777777',
                gridZIndex: 2
            },
            yAxis: {
                visible: undefined,
                labels: {
                    enabled: false,
                    // style: {
                    //     color: '#444444',
                    //     fontSize: this.fontSizes['yAxisLabels'],
                    // }
                },
                gridZIndex: 4,
                lineWidth: 0,
                endOnTick: true,
                showFirstLabel: false,
                showLastLabel: true,
                min: -15,
                max: 100,
                tickPositions: [-23, 0, 25, 50, 75, 100, 102]
            },
            series: undefined,
            colors: undefined,
            plotOptions: {
                series: {
                    animation: {
                        duration: this.props.isAnimatedInitial ? 750 : 0
                    },
                    states: {
                        hover: {
                            enabled: this.props.isAnimatedInitial
                        }
                    },
                    dataLabels: {
                        enabled: undefined,
                        style: {
                            fontWeight: 'bold',
                            fontSize: this.fontSizes['dataLabels'],
                            textOutline: this.fontSizes['dataLabelsOutline'] + " #fafbfc",
                        },
                        format: undefined,
                        padding: 0,
                        allowOverlap: true,
                        z: 7
                    },
                    point: {
                        events: {
                            mouseOut: () => {
                                if (this.isForComparison){
                                    this.slice.tooltip.hide();
                                }
                            }
                        }
                    }
                },
                column: {
                    grouping: false,
                    shadow: false,
                }
            },
            tooltip: {
                enabled: this.props.hasTooltip,
                shared: this.isForComparison,
                useHTML: true,
                outside: this.isMobile,
                positioner: tooltipPositioner,
                followPointer: !this.isMobile,
                headerFormat: `<span style="font-size: ${this.fontSizes['tooltipHeader']}; font-weight: bold">{point.key}</span><br/>─────`,
                pointFormat: `<br>${this.isForComparison ? '<span style="color: {point.tooltipColor}; font-weight: bold">{point.playerName}</span><br>' : ""}
                              Raw Value: <span style="color: {point.tooltipColor}; font-weight: bold">{point.p90_label}</span>
                              <br>Percentile Rank: <span style="color: {point.tooltipColor}; font-weight: bold">{point.percentile_label}</span>`,
                style: {
                    fontSize: this.fontSizes['tooltip'],
                    zIndex: 100
                },
                borderColor: this.isForComparison ? '#b9b9b9' : undefined,
                backgroundColor: '#fafbfc',
                borderWidth: 2
            },
            legend: {
                enabled: this.isForComparison && !this.isForExport,
                title: {
                    style: {
                        fontSize: this.fontSizes['legendTitle']
                    }
                },
                symbolPadding: this.isForExport ? 15 : (this.isMobile ? 20 : 7),
                align: 'left',
                verticalAlign: 'bottom',
                layout: 'vertical',
                itemStyle: {
                    color: 'black',
                    fontSize: this.fontSizes['legend']
                },
                itemHoverStyle: {
                    color: '#666666'
                },
                y: this.isForExport ? 5 : 10,
                margin: 0,
                padding: 0,
                itemMarginTop: 3
            },
            credits: {
                text: creditsText,
                position: {
                    align: undefined,
                    x: undefined,
                    // y: this.isMobile ? -30 : (this.isForExport ? -15 : -20)
                    y: this.isForExport ? -10 : (this.isMobile ? -30 : -20)
                },
                style: {
                    lineHeight: this.isMobile || this.isForExport ? (this.isForExport ? "20px" : "25px") : null,
                    fontSize: this.fontSizes['credits']
                },
            },
            lang: {
                noData: "Select a template and competitions to proceed",
            },
            noData: {
                attr: {
                    zIndex: 7
                },
                style: {
                    fontWeight: 'bold',
                    fontSize: this.fontSizes['noData'],
                    color: '#303030'
                }
            }
        };

        //wrap the default Highcharts axis render function to group axis grids with the data series
        //this is done in order to be able to set z-indices on the series relative to the axis grids
        //relevant github issue and further explanation: https://github.com/highcharts/highcharts/issues/3321
        Highcharts.wrap(Highcharts.Axis.prototype, 'render', function (proceed) {

            console.log(this);
            proceed.call(this);

            let chart = this.chart;

            if (!chart.seriesGroup) {
                chart.seriesGroup = chart.renderer.g('series-group')
                    .attr({
                        zIndex: 3
                    })
                    .add();
            }

            if (this.coll === "xAxis" || this.coll === "yAxis"){
                this.gridGroup
                    .attr({
                        zIndex: this.options.gridZIndex
                    })
                    .add(chart.seriesGroup);
            }

            return this;

        });

        // Highcharts.wrap(Highcharts.Tick.prototype, 'render', function (proceed) {
        //
        //     console.log(this);
        //     proceed.call(this);
        //
        //     let chart = this.chart;
        //
        //     let axis = this.axis;
        //
        //     if (chart !== undefined){
        //         if (!chart.seriesGroup) {
        //             chart.seriesGroup = chart.renderer.g('series-group')
        //                 .attr({
        //                     zIndex: 3
        //                 })
        //                 .add();
        //         }
        //         axis.axisGroup
        //             .attr({
        //                 zIndex: this.pos === 0 ? 4 : 1,
        //                 opacity: 0
        //             })
        //             .add(chart.seriesGroup);
        //     }
        //
        // });

        this.afterChartCreated = this.afterChartCreated.bind(this);

    }


    /**
     * Called just after the Highcharts component is created
     * Stores a reference to the chart in the class
     * @param chart
     */
    afterChartCreated(chart) {
        this.slice = chart;
    }


    /**
     * Function to add borders to legend symbols
     */
    drawLegendBorders() {

        let chart = this.slice;

        for (let i=0; i<chart.legend.allItems.length; i++){
            chart.legend.allItems[i].legendSymbol.element.setAttribute("stroke-width", "3");
            chart.legend.allItems[i].legendSymbol.element.setAttribute("stroke", i === 0 ? "rgba(231,84,83,0.55)" : "#000000");
        }

    }


    /**
     * Called just after the component mount
     */
    componentDidMount() {
        this.drawLegendBorders();
    }


    /**
     * Called whenever the component updates. NOT called on the first render
     * @param prevProps
     * @param prevState
     * @param snapshot
     */
    componentDidUpdate(prevProps, prevState, snapshot) {
        this.drawLegendBorders();
    }


    /**
     * Function to generate a string representing the list of selected competitions
     * @param (Object) allCompetitions - object containing arrays of all competitions on per-season basis
     * @param {Object} selectedCompetitions - object containing arrays of selected competitions on per-season basis
     */
    selectedCompetitionsString(allCompetitions, selectedCompetitions, template) {

        let allSeasons = [];

        if (template === null || template === "N/A"){
            return this.isForComparison ? [""] : ["-"];
        }

        for (let season in selectedCompetitions){

            if (selectedCompetitions[season].length === 0){
                continue;
            }

            let currentSeasonString = `${season.replace("-", "/")} (`;
            let currentSeason = [];

            let competitions = Object.values(allCompetitions[season]);

            let allCompetitionsClubDict = {};
            let selectedCompetitionsClubDict = {};

            for (let i=0; i<competitions.length; i++){

                let competition = competitions[i];
                let isSelected = false;

                if (selectedCompetitions[season].includes(competition)){
                    isSelected = true;
                }

                let split = competition.split(" | ");

                let competitionName = split[0];
                let competitionClub = split[1];

                if (allCompetitionsClubDict[competitionName] === undefined){
                    allCompetitionsClubDict[competitionName] = [competitionClub];
                }
                else {
                    allCompetitionsClubDict[competitionName].push(competitionClub);
                }

                if (isSelected){
                    if (selectedCompetitionsClubDict[competitionName] === undefined) {
                        selectedCompetitionsClubDict[competitionName] = [competitionClub];
                    }
                    else {
                        selectedCompetitionsClubDict[competitionName].push(competitionClub);
                    }
                }

            }

            for (let competition in selectedCompetitionsClubDict){

                if (allCompetitionsClubDict[competition].length > 1){
                    currentSeason.push(`${this.competitionDict[competition]} (${selectedCompetitionsClubDict[competition].join(", ")})`)
                }
                else {
                    currentSeason.push(this.competitionDict[competition]);
                }

            }

            currentSeasonString += `${currentSeason.join(", ")}) `;

            allSeasons.push(currentSeasonString);

        }

        return allSeasons;
    }

    // competitionStringsComparison(allCompetitions, selectedCompetitions) {
    //
    //     let strings = [];
    //
    //     let seasons = {
    //         0: [],
    //         1: []
    //     };
    //
    //     for (let player in seasons){
    //
    //         for (let season in selectedCompetitions[player]){
    //             if (selectedCompetitions[player][season].length > 0){
    //                 seasons[player].push(season);
    //             }
    //         }
    //
    //     }
    //
    //     let numRows = 0;
    //     for (let player in seasons){
    //         if (seasons[player].length > numRows){
    //             numRows = seasons[player].length;
    //         }
    //     }
    //
    //     for (let i=0; i<numRows; i++){
    //
    //         let currentLineStrings = [];
    //
    //         for (let player in seasons){
    //
    //             if (seasons[player][i] !== undefined){
    //
    //                 let season = seasons[player][i];
    //                 let currentSeasonString = this.temp(season, selectedCompetitions[player], allCompetitions[player]);
    //
    //                 currentLineStrings.push(currentSeasonString);
    //
    //             }
    //             else {
    //                 currentLineStrings.push("");
    //             }
    //
    //         }
    //
    //         strings.push(currentLineStrings);
    //
    //     }
    //
    // }


    /**
     * render function
     * configures chart options based on props and draws the slice charts
     * @return {*} - JSX code for the slice charts
     */
    render() {

        let chartOptions = this.chartOptions;

        let template = this.props.template;

        let title;

        if (this.isForComparison) {
            if (!this.isForExport){
                title = `<span class="chart-title player-1"><a href=${this.props.url[0]} target="_blank" rel="noopener noreferrer">${this.props.names[0]}</a><a href=${this.props.url} target="_blank" rel="noopener noreferrer"><i id="link-icon" class="fa fa-external-link"></i></a></span>`;
                title += `<span class="player-2"> vs <span class="chart-title"><a href=${this.props.url[1]} target="_blank" rel="noopener noreferrer">${this.props.names[1]}</a><a href=${this.props.url} target="_blank" rel="noopener noreferrer"><i id="link-icon" class="fa fa-external-link"></i></a></span></span>`;
            }
            else {
                title = `<span class="chart-title player-1"><a href=${this.props.url[0]} target="_blank" rel="noopener noreferrer">${this.props.names[0]}</a></span>`;
                title += `<span class="player-2"> vs <span class="chart-title"><a href=${this.props.url[1]} target="_blank" rel="noopener noreferrer">${this.props.names[1]}</a></span></span>`;
            }

            if (this.isMobile && !this.isForExport){
                let temp = {
                    player1: this.selectedCompetitionsString(this.props.competitions[0], this.props.selectedCompetitions[0], template),
                    player2: this.selectedCompetitionsString(this.props.competitions[1], this.props.selectedCompetitions[1], template)
                };
                title += "<div id='competitions-container' class='centered-around-separator'>";
                for (let i=0; i<Math.max(temp.player1.length, temp.player2.length); i++){
                    title += `<div><span class="player-1 competitions">${temp.player1[i] === undefined ? "" : temp.player1[i]}</span> │ <span class="player-2 competitions">${temp.player2[i] === undefined ? "" : temp.player2[i]}</span></div>`;
                }
                title += "</div>"
            }
            else {
                title += '<br>';
                title += `<div id='competitions-container'><span class="player-1 competitions">${this.selectedCompetitionsString(this.props.competitions[0], this.props.selectedCompetitions[0], template).join("&nbsp|&nbsp&nbsp")}</span>`;
                title += `<span class="player-2 competitions"> - ${this.selectedCompetitionsString(this.props.competitions[1], this.props.selectedCompetitions[1], template).join("&nbsp|&nbsp&nbsp")}</span></div>`;
            }
        }
        else {
            title = `<span class="single-player-title chart-title"><a href=${this.props.url} target="_blank" rel="noopener noreferrer">${this.props.name}</a>`;

            if (!this.isForExport){
                title += `<a href=${this.props.url} target="_blank" rel="noopener noreferrer"><i id="link-icon" class="fa fa-external-link"></i></a></span>`;
            }

            let competitionStringParts = this.selectedCompetitionsString(this.props.competitions, this.props.selectedCompetitions, template);
            if (this.isMobile && !this.isForExport){
                title += "<div id='competitions-container'>";
                for (let i=0; i<competitionStringParts.length; i++){
                    title += `<span class="single-player-title competitions">${competitionStringParts[i]}</span><br>`;
                }
                title += "</div>"
            }
            else {
                title += `<br><div id='competitions-container'><span class="single-player-title competitions">${competitionStringParts.join("&nbsp|&nbsp&nbsp")}</span></div>`;
            }
        }
        chartOptions.title.text = title;

        //build the subtitle
        let subtitle;
        if (this.props.template === null || this.props.template === "N/A" || this.props.series.length === 0) {
            chartOptions.xAxis.visible = false;
            chartOptions.yAxis.visible = false;
            subtitle = "-<br>-<br>";
        }
        else {
            chartOptions.xAxis.visible = true;
            chartOptions.yAxis.visible = true;
            if (this.isForComparison) {
                if (this.isMobile && !this.isForExport){
                    subtitle = `<div class="centered-around-separator"><div><span><span class="player-1">Age: <span class="player-1 age-minutes">${this.props.ages[0]}</span>  </span>`;
                    subtitle += `<span class="player-1">Minutes: <span class="player-1 age-minutes">${this.props.minutes[0].toLocaleString()}</span></span></span>`;
                    subtitle += "<b> - </b>";
                    subtitle += `<span><span class="player-2">Age: <span class="age-minutes">${this.props.ages[1]}</span>  </span>`;
                    subtitle += `<span class="player-2">Minutes: <span class="age-minutes">${this.props.minutes[1].toLocaleString()}</span></span></span></div></div>`;
                }
                else {
                    subtitle = `<span class="player-1">Age: <span class="player-1 age-minutes">${this.props.ages[0]}</span>   </span>`;
                    subtitle += `<span class="player-1">Minutes: <span class="player-1 age-minutes">${this.props.minutes[0].toLocaleString()}</span></span>`;
                    subtitle += "<b> - </b>";
                    subtitle += `<span class="player-2">Age: <span class="age-minutes">${this.props.ages[1]}</span>   </span>`;
                    subtitle += `<span class="player-2">Minutes: <span class="age-minutes">${this.props.minutes[1].toLocaleString()}</span></span>`;
                    subtitle += "<br>"
                }
            }
            else {
                subtitle = `Age: <span class="single-player-title age-minutes">${this.props.age}</span>  `;
                subtitle += `Minutes: <span class="single-player-title age-minutes">${this.props.minutes.toLocaleString()}</span><br>`;
            }
            subtitle += `${this.subtitles[this.props.template]}`;
        }
        //set the subtitle
        chartOptions.subtitle.text = subtitle;

        //calculate the start angle based on the number of wedges
        //the goal is to have the first wedge pointing to 0 degrees
        chartOptions.pane.startAngle = -((360/this.props.statsKeys.length)/2);

        let chart = chartOptions.chart;
        //set animation (on update) to true or false
        chart.animation = this.props.isAnimated;
        //set chart margins
        if (this.isForExport){
            chart.marginTop = 230;
            chart.marginBottom = 130;
        }
        else {
            chart.marginBottom = (this.props.creditsPosition === "right" && !this.props.isMobile) ? 30 : 60;
        }

        let categories = [];

        if (template !== null && template !== "N/A"){

            let statsKeys = this.props.statsKeys;
            let selectedStats = this.statsByPosition[template].filter(x => statsKeys.includes(x));

            if (this.isMobile){
                for (let i=0; i<selectedStats.length; i++) {

                    let stat = selectedStats[i];
                    categories[i] = `${this.statsReference[stat]['mobileLabel']}  <span style="font-size: 0.8em">${this.statsReference[stat]['suffix']}</span>`;

                }
            }
            else {
                for (let i=0; i<selectedStats.length; i++) {

                    let stat = selectedStats[i];
                    categories[i] = `${this.statsReference[stat]['label']}  <span style="font-size: 0.8em">${this.statsReference[stat]['suffix']}</span>`;

                }
            }

        }
        else {

            categories = Array(12).fill("-");

        }

        let xAxis = chartOptions.xAxis;

        //set x-axis labels
        xAxis.categories = categories;

        //set data points
        chartOptions.series = this.props.series.map((data, index) => {
            return {
                name: data[0].playerName,
                data: data,
                zIndex: index === 0 ? 0 : 3,
                pointPadding: 0,
                groupPadding: 0,
                stickyTracking: false,
            };
        });

        //set series colors
        chartOptions.colors = [
            '#e75453',
            '#fafbfc'
        ];

        //set data labels
        let dataLabels = chartOptions.plotOptions.series.dataLabels;
        dataLabels.enabled = this.props.template !== "N/A" && !this.isForComparison;
        dataLabels.format = this.props.labelType === "raw" ? '{point.p90_label}' : '{point.percentile_label}';

        //set credits position
        let credits = chartOptions.credits;
        let creditsPosition = this.props.creditsPosition;
        credits.position.align = this.isForExport ? "center" : creditsPosition;
        credits.position.x = this.isForExport || creditsPosition === "center" ? 0 : -10;

        let className = this.isForExport ? undefined : "result";
        let id = this.isForExport ? "export" : "chart";

        let helpButton = null;
        if (!this.isForExport)
            helpButton = <button className="fas fa-question-circle explanation-button" onClick={this.props.toggleGlossaryOverlay}/>;

        //pass chart options to the Highcharts component and render
        return (
            <div className={className} id={id}>
                {helpButton}
                <HighchartsReact
                    constructorType={"chart"}
                    highcharts={Highcharts}
                    containerProps={{style: {width: '100%', height: '100%'}}}
                    options={chartOptions}
                    callback={this.afterChartCreated}
                />
            </div>
        );

    }

}

export default (Slice);
