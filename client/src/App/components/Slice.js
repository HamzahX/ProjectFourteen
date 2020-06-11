import React, {Component} from 'react';

//import dependencies
import Highcharts from 'highcharts/highstock'
import HighchartsReact from 'highcharts-react-official'
import HighchartsMore from 'highcharts/highcharts-more'
import $ from "jquery"
HighchartsMore(Highcharts);


/**
 * Component to render Slices (charts)
 */
class Slice extends Component {

    constructor(props) {

        super(props);

        this.isMobile = this.props.isMobile;
        this.isForExport = this.props.isForExport;
        this.isForComparison = this.props.isForComparison;

        //set font size constants
        this.fontSizes = undefined;
        if (this.isForExport){
            this.fontSizes =  {
                title: this.isMobile ? '4.6vw' : '2.3em',
                subtitle: '2em',
                noData: '1.76em',
                xAxisLabels: '1.8em',
                dataLabels: '1.95em',
                dataLabelsOutline: '0.13em',
                tooltipHeader: '0em',
                tooltip: '0em',
                legend: '1.6em',
                credits: '1.5em',
                yAxisLabels: '0.65em'
            };
        }
        else {
            this.fontSizes =  {
                title: this.isMobile ? '4vw' : '1.7em',
                subtitle: this.isMobile ? '2.6vw' : '1.4em',
                noData: this.isMobile ? '2.7vw' : '1.35em',
                xAxisLabels: this.isMobile ? '2.3vw' : '1.15em',
                dataLabels: this.isMobile ? '2.3vw' : '1.15em',
                dataLabelsOutline: this.isMobile ? '0.3vw' : '0.18em',
                tooltipHeader: this.isMobile ? '2.3vw' : '1em',
                tooltip: this.isMobile ? '2.3vw' : '1.25em',
                legend: this.isMobile ? '2.8vw' : '1.4em',
                legendTitle: this.isMobile ? '2vw' : '1em',
                credits: this.isMobile ? '2.3vw' : '1.2em',
                yAxisLabels: this.isMobile ? '1vw' : '0.5em'
            };
        }

        //set categories (x-axis labels) constants
        this.categories = {
            "FW": [
                'Non-Penalty Goals',
                'Non-Penalty xG',
                'Non-Penalty xG/Shot',
                `${this.isMobile && !this.isForExport ? "Conver-sion Rate" : "Conversion Rate"}`,
                'Aerial Win %',
                'Touches in Box',
                'xA',
                'Passes into Box',
                'Successful Dribbles',
                'Dribble Success %',
                'Times Dispossessed',
                'Successful Pressures',
            ],
            "AM": [
                'Non-Penalty Goals',
                'Non-Penalty xG',
                'Non-Penalty xG/Shot',
                'xA',
                'OP Shot-Creating Actions',
                'Passes into Box',
                'Progressive Distance',
                `${this.isMobile && !this.isForExport ? "Pass Comp. %" : "Pass Completion %"}`,
                'Successful Dribbles',
                'Dribble Success %',
                'Times Dispossessed',
                'Successful Pressures',
            ],
            "CM": [
                'xA',
                'OP Shot-Creating Actions',
                'Passes into Final 1/3',
                `${this.isMobile && !this.isForExport ? "Prog-ressive Distance" : "Progressive Distance"}`,
                `${this.isMobile && !this.isForExport ? "Pass Comp. %" : "Pass Completion %"}`,
                'Successful Dribbles',
                'Dribble Success %',
                'Times Dispossessed',
                'Successful Pressures',
                `${this.isMobile && !this.isForExport ? "(pAdj) Inter-ceptions" : "(pAdj) Interceptions"}`,
                '(pAdj) Tackles Won',
                `${this.isForExport ? "Tackle/Dribbled Past %" : "Tackle/ Dribbled Past %"}`
            ],
            "FB": [
                'xA',
                'Passes into Final 1/3',
                'Progressive Distance',
                `${this.isMobile && !this.isForExport ? "Pass Comp. %" : "Pass Completion %"}`,
                'Successful Dribbles',
                'Dribble Success %',
                'Times Dispossessed',
                'Successful Pressures',
                '(pAdj) Interceptions',
                "(pAdj) Tackles Won",
                `${this.isForExport ? "Tackle/Dribbled Past %" : "Tackle/ Dribbled Past %"}`,
                'Aerial Win %'
            ],
            "CB": [
                'Passes into Final 1/3',
                'Progressive Distance',
                `${this.isMobile && !this.isForExport ? "Pass Comp. %" : "Pass Completion %"}`,
                `${this.isMobile && !this.isForExport ? "Long Pass Comp. %" : "Long Pass Completion %"}`,
                'Successful Pressures',
                '(pAdj) Interceptions',
                '(pAdj) Tackles Won',
                `${this.isForExport ? "Tackle/Dribbled Past %" : "Tackle/ Dribbled Past %"}`,
                '(pAdj) Fouls Committed',
                'Aerials Won',
                'Aerial Win %',
                '(pAdj) Clearances'
            ],
            "GK": [
                "GSAA %",
                "Cross Stopping %",
                "Launched Pass Completion %"
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

        this.titleClassNames = {
            "FW": "multi-color-1",
            "AM": "multi-color-1",
            "CM": "multi-color-2",
            "FB": "multi-color-2",
            "CB": "multi-color-3",
            "GK": "multi-color-4",
            "N/A": "multi-color-1"
        };

        this.titleColors = {
            "FW": ['#f15c80', '#e4d354', '#90ed7d', '#7cb5ec'],
            "AM": ['#f15c80', '#e4d354', '#90ed7d', '#7cb5ec'],
            "CM": ['#e4d354', '#90ed7d', '#7cb5ec'],
            "FB": ['#e4d354', '#90ed7d', '#7cb5ec'],
            "CB": ['#e4d354', '#7cb5ec'],
            "GK": ['#9499ff', '#e4d354'],
            "N/A": ['#000000'],
        };

        this.primaryColors = {
            "FW": '#f15c80',
            "AM": '#e4d354',
            "CM": '#e4d354',
            "FB": '#7cb5ec',
            "CB": '#7cb5ec',
            "GK": '#9499ff',
            "N/A": '#000000',
        };

        //set subtitle constants
        this.subtitles = {
            "FW": "vs Top-5 League Players with 10+ Starts as <b>Forwards</b>",
            "AM": "vs Top-5 League Players with 10+ Starts as <b>Attacking Midfielders / Wingers</b>",
            "CM": "vs Top-5 League Players with 10+ Starts as <b>Central / Defensive Midfielders</b>",
            "FB": "vs Top-5 League Players with 10+ Starts as <b>Full-backs</b>",
            "CB": "vs Top-5 League Players with 10+ Starts as <b>Center-backs</b>",
            "GK": "vs Top-5 League Players with 10+ Starts as <b>Goalkeepers</b>",
            "N/A": "No Template Selected"
        };

        //calculate the start angle based on the number of wedges
        //the goal is to have the first wedge pointing to 0 degrees
        let startAngle = -((360/this.categories[this.props.template].length)/2);

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
            xAxisLabelDistance = 75;
        }
        else {
            xAxisLabelDistance = this.isMobile ? 60 : 40;
        }

        //define the tooltip positioner for shared tooltips (used for comparisons)
        let tooltipPositioner = undefined;
        if (this.isForComparison) {
            tooltipPositioner = function (labelWidth, labelHeight, point) {
                let xPos = point.plotX;
                let yPos = point.plotY - 33;
                return {x: xPos, y: yPos};
            }
        }

        //Highcharts chart options
        //variable options are initialized to undefined, and then modified on render using props
        //consult the Highcharts API reference for detailed explanations of each option
        //https://api.highcharts.com/highcharts/
        this.chartOptions = {
            title: {
                useHTML: true,
                text: undefined,
                style: {
                    color: '#e75453',
                    fontSize: this.fontSizes['title'],
                    fontWeight: 'bold',
                },
                margin: 35
            },
            subtitle: {
                text: undefined,
                style: {
                    color: 'black',
                    fontSize: this.fontSizes['subtitle'],
                }
            },
            pane: {
                startAngle: startAngle
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
                events: chartEvents
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
                gridLineColor: 'black',
                gridZIndex: 1
            },
            yAxis: {
                labels: {
                    enabled: false,
                    // style: {
                    //     color: '#444444',
                    //     fontSize: this.fontSizes['yAxisLabels'],
                    // }
                },
                gridZIndex: 3,
                lineWidth: 0,
                endOnTick: true,
                showFirstLabel: false,
                showLastLabel: true,
                min: -15,
                max: 100,
                tickPositions: [-15, 0, 25, 50, 75, 100, 102]
            },
            series: undefined,
            colors: undefined,
            plotOptions: {
                series: {
                    animation: {
                        duration: this.props.isAnimatedInitial ? 750 : 0
                    },
                    events: {
                        legendItemClick: (event) => {
                            event.preventDefault();
                            let series = this.slice.series[event.target.index];
                            let seriesOptions = series.options;
                            seriesOptions.dataLabels.enabled = !seriesOptions.dataLabels.enabled;
                            seriesOptions.animation = false;
                            series.update(seriesOptions);
                            this.drawLegendBorders()
                        }
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
                positioner: tooltipPositioner,
                followPointer: !this.isMobile,
                headerFormat: `<span style="font-size: ${this.fontSizes['tooltipHeader']}; font-weight: bold">{point.key}</span><br/>-----`,
                pointFormat: '<br><b>{point.playerName}</b><br>Raw Value: <b>{point.p90_label}</b><br/>Percentile Rank: <b>{point.percentile_label}</b>',
                style: {
                    fontSize: this.fontSizes['tooltip']
                },
                backgroundColor: '#fafbfc',
                borderWidth: 2
            },
            legend: {
                enabled: this.isForComparison,
                title: {
                    // text: "Click to toggle data labels",
                    style: {
                        fontSize: this.fontSizes['legendTitle']
                    }
                },
                symbolPadding: this.isMobile ? 20 : 7,
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
                y: 10,
                margin: 0,
                padding: 0,
                itemMarginTop: 3
            },
            credits: {
                text: `Data Sources: FBref.com | StatsBomb<br/>Last Updated: ${this.props.lastUpdated} UTC`,
                position: {
                    align: undefined,
                    x: undefined,
                    y: this.isMobile || this.isForExport ? -30 : -20
                },
                style: {
                    lineHeight: this.isMobile || this.isForExport ? (this.isForExport ? "20px" : "25px") : null,
                    fontSize: this.fontSizes['credits']
                },
            },
            lang: {
                noData: "Select a competition"
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
            },
            responsive: {
                rules: [{
                    condition: {
                        maxWidth: 960
                    },
                    chartOptions: {
                        legend: {
                            verticalAlign: 'bottom'
                        }
                    }
                }]
            }
        };

        //wrap the default Highcharts axis render function to group axis grids with the data series
        //this is done in order to be able to set z-indices on the series relative to the axis grids
        //relevant github issue and further explanation: https://github.com/highcharts/highcharts/issues/3321
        Highcharts.wrap(Highcharts.Axis.prototype, 'render', function (proceed) {

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

        let borderColor = this.primaryColors[this.props.template];
        if (borderColor === '#e4d354'){
            borderColor = '#ebb320';
        }

        $.each(chart.legend.allItems, function (i, item) {
            item.legendSymbol.element.setAttribute("stroke-width", "3");
            //primary color border to first symbol, black border to second symbol
            item.legendSymbol.element.setAttribute("stroke", i === 0 ? borderColor : "#000000")
        });

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


    // splitText(text, colors) {
    //
    //     let chunks = [];
    //
    //     let textLength = text.length;
    //     let numColors = colors.length;
    //
    //     if (textLength % numColors === 0) {
    //         let chunkSize = Math.floor(textLength / numColors);
    //         for (let i=0; i<textLength; i+=chunkSize){
    //             chunks.push(text.slice(i, i+chunkSize));
    //         }
    //     }
    //
    //     else {
    //         let chunkSize = Math.ceil((textLength) / numColors--);
    //         for (let i=0; i<textLength; i+=chunkSize) {
    //             chunkSize = Math.ceil((textLength - i) / numColors--);
    //             chunks.push(text.slice(i, i+chunkSize));
    //         }
    //     }
    //
    //     return chunks;
    //
    // }


    /**
     * render function
     * configures chart options based on props and draws the slice charts
     * @return {*} - JSX code for the slice charts
     */
    render() {

        let chartOptions = this.chartOptions;

        let title = "";
        let titleColor = this.primaryColors[this.props.template];
        if (titleColor === '#e4d354'){
            titleColor = '#cd9820';
        }
        if (this.isForComparison) {
            chartOptions.title.style.color = titleColor;
            title += `<span class="chart-title"><a href=${this.props.url[0]} target="_blank" rel="noopener noreferrer">${this.props.name[0]}</a></span>`;
            title += `<span class="chart-title" style='color: black;'> - <a href=${this.props.url[1]} target="_blank" rel="noopener noreferrer">${this.props.name[1]}</a></span>`;
        }
        else {
            title = `<span class="chart-title"><a href=${this.props.url} target="_blank" rel="noopener noreferrer">${this.props.name}</a></span>`;
        }
        chartOptions.title.text = title;

        //build the subtitle
        let subtitle = "";
        if (this.props.series.length === 0 || this.props.hasUndefined){
            subtitle = "-<br>-<br>-";
        }
        else {
            if (this.isForComparison) {
                subtitle += `<span style='color: ${titleColor}'>Age: <span style='font-weight: bold; color: ${titleColor}'>${this.props.age[0]} ║ </span></span>`;
                subtitle += `<span style='color: ${titleColor}'>Minutes Played: <span style='font-weight: bold; color: ${titleColor}'>${this.props.minutes[0].toLocaleString()}</span></span>`;
                subtitle += " - ";
                subtitle += `Age: <b>${this.props.age[1]}</b> ║ `;
                subtitle += `Minutes Played: <b>${this.props.minutes[1].toLocaleString()}</b><br>`;
            }
            else {
                subtitle += `Age: <span style="font-weight: bold; color: #e75453">${this.props.age}</span> ║ `;
                subtitle += `Minutes Played: <span style="font-weight: bold; color: #e75453">${this.props.minutes.toLocaleString()}</span><br>`;
            }
            subtitle += "Percentile Rank Bars (per 90 stats)<br>";
            subtitle += this.subtitles[this.props.template];
        }
        //set the subtitle
        chartOptions.subtitle.text = subtitle;

        let chart = chartOptions.chart;
        //set animation (on update) to true or false
        chart.animation = this.props.isAnimated;
        //set chart margins
        if (this.isForExport){
            chart.marginTop = 230;
            chart.marginBottom = 120;
        }
        else {
            chart.marginBottom = (this.props.creditsPosition === "right" && !this.props.isMobile) ? 30 : 60;
        }

        let xAxis = chartOptions.xAxis;
        //set x-axis labels
        xAxis.categories = this.categories[this.props.template];

        //set data points
        chartOptions.series = this.props.series.map(function (data, index) {
            return {
                name: data[0].playerName,
                data: data,
                zIndex: index === 0 ? 0 : 2,
                pointPadding: 0,
                groupPadding: 0,
                stickyTracking: false,
            };
        });

        //set series color
        let titleColors = this.titleColors[this.props.template];
        let numColors = titleColors.length;
        let gradientStops = [];
        let stop = 0;
        for (let i=0; i<numColors; i++){
            if (titleColors[numColors - 1 - i] !== this.primaryColors[this.props.template]){
                gradientStops.push([stop, titleColors[numColors - 1 - i]]);
                stop++
            }
        }
        chartOptions.colors = [
            {
                radialGradient: {
                    cx: 0.5,
                    cy: 0.5,
                    r: 0.3,
                },
                stops: gradientStops
            },
            // {
            //     linearGradient: {
            //         x1: 0,
            //         x2: 0,
            //         y1: 0,
            //         y2: 1
            //     },
            //     stops: gradientStops
            // },
            'white'
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

        //pass chart options to the Highcharts component and render
        return (
            <div className={className} id={id}>
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
