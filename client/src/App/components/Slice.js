import React, {Component} from 'react';

//import dependencies
import Highcharts from 'highcharts/highstock'
import HighchartsReact from 'highcharts-react-official'
import HighchartsMore from 'highcharts/highcharts-more'
HighchartsMore(Highcharts);


/**
 * Component to render Slices (charts)
 */
class Slice extends Component {

    constructor(props) {

        super(props);

        this.isMobile = this.props.isMobile;
        this.isForExport = this.props.isForExport;

        //set font size constants
        this.fontSizes = null;
        if (this.isForExport){
            this.fontSizes =  {
                title: '3.3em',
                subtitle: '2em',
                noData: '1.76em',
                xAxisLabels: '1.95em',
                dataLabels: '1.95em',
                dataLabelsOutline: '0.13em',
                tooltipHeader: '1.3em',
                tooltip: '0em',
                credits: '1.65em',
                yAxisLabels: '0.65em'
            };
        }
        else {
            this.fontSizes =  {
                title: this.props.isMobile ? '4.6vw' : '2.3em',
                subtitle: this.props.isMobile ? '2.7vw' : '1.4em',
                noData: this.props.isMobile ? '2.7vw' : '1.35em',
                xAxisLabels: this.props.isMobile ? '2.3vw' : '1.15em',
                dataLabels: this.props.isMobile ? '2.3vw' : '1.15em',
                dataLabelsOutline: this.props.isMobile ? '0.3vw' : '0.18em',
                tooltipHeader: this.props.isMobile ? '2.3vw' : '1em',
                tooltip: this.props.isMobile ? '2.3vw' : '1.25em',
                credits: this.props.isMobile ? '2.3vw' : '1.2em',
                yAxisLabels: this.props.isMobile ? '1vw' : '0.5em'
            };
        }

        //set categories (x-axis labels) constants
        this.categories = {
            "FW": [
                'Non-Penalty Goals',
                'Non-Penalty xG',
                'Non-Penalty xG/Shot',
                `${this.isMobile && !this.isForExport ? "Conver-<br>sion Rate" : "Conversion Rate"}`,
                'Aerial Win %',
                'Touches in Box',
                'xA',
                'Passes into Box',
                'Successful Dribbles',
                'Dribble Success %',
                'Times Dispossessed',
                '(pAdj) Successful Pressures',
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
                '(pAdj) Successful Pressures',
            ],
            "CM": [
                'xA',
                'OP Shot-Creating Actions',
                'Passes into Final 1/3',
                `${this.isMobile && !this.isForExport ? "Prog-<br>ressive Distance" : "Progressive Distance"}`,
                `${this.isMobile && !this.isForExport ? "Pass Comp. %" : "Pass Completion %"}`,
                'Successful Dribbles',
                'Dribble Success %',
                'Times Dispossessed',
                '(pAdj) Successful Pressures',
                `${this.isMobile && !this.isForExport ? "(pAdj) Inter-<br>ceptions" : "(pAdj) Interceptions"}`,
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
                '(pAdj) Successful Pressures',
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
                '(pAdj) Successful Pressures',
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

        //set subtitle constants
        this.subtitles = {
            "FW": "vs Top-5 League Players with 10+ Starts as Forwards<br/>",
            "AM": "vs Top-5 League Players with 10+ Starts as Attacking Midfielders / Wingers<br/>",
            "CM": "vs Top-5 League Players with 10+ Starts as Central / Defensive Midfielders<br/>",
            "FB": "vs Top-5 League Players with 10+ Starts as Full-backs<br/>",
            "CB": "vs Top-5 League Players with 10+ Starts as Center-backs<br/>",
            "GK": "vs Top-5 League Players with 10+ Starts as Goalkeepers<br/>",
            "N/A": "No Template Selected"
        };

        //Highcharts chart options
        //variable options are initialized to null, and then modified on render using props
        //consult the Highcharts API reference for detailed explanations of each option
        //https://api.highcharts.com/highcharts/
        this.chartOptions = {
            title: {
                text: null,
                style: {
                    color: '#e75453',
                    fontSize: this.fontSizes['title'],
                    fontWeight: 'bold',
                },
                margin: 35
            },
            subtitle: {
                text: null,
                style: {
                    fontSize: this.fontSizes['subtitle']
                }
            },
            pane: {
                startAngle: null
            },
            chart: {
                backgroundColor: 'rgba(0, 0, 0, 0)',
                style: {
                    fontFamily: 'sans-serif'
                },
                animation: null,
                polar: true,
                type: 'column',
                marginLeft: 90,
                marginRight: 90,
                marginTop: null,
                marginBottom: null,
                events: null
            },
            xAxis: {
                categories: null,
                labels: {
                    zIndex: 1,
                    distance: null,
                    style: {
                        color: 'black',
                        fontSize: this.fontSizes['xAxisLabels'],
                    },
                    padding: 31
                },
                gridLineWidth: 2,
                gridLineColor: '#555555',
                gridZIndex: 4
            },
            yAxis: {
                labels: {
                    enabled: false,
                    // style: {
                    //     color: '#444444',
                    //     fontSize: this.fontSizes['yAxisLabels'],
                    // }
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
            series: null,
            plotOptions: {
                series: {
                    states: {
                        hover: {
                            enabled: null
                        }
                    },
                    dataLabels: {
                        enabled: null,
                        style: {
                            fontWeight: 'bold',
                            fontSize: this.fontSizes['dataLabels'],
                            textOutline: this.fontSizes['dataLabelsOutline'] + " #fafbfc",
                        },
                        format: null,
                        padding: 0,
                        allowOverlap: true,
                        z: 7
                    },
                },
            },
            tooltip: {
                headerFormat: '<span style="font-size: ' + this.fontSizes['tooltipHeader'] + '"><b>{point.key}</b></span><br/>',
                pointFormat: null,
                style: {
                    fontSize: this.fontSizes['tooltip']
                }
            },
            legend: {
                enabled: false,
                // borderWidth: 1,
                // align: 'center',
                // verticalAlign: 'bottom',
                // layout: 'horizontal'
            },
            credits: {
                text: null,
                position: {
                    align: null,
                    y: null
                },
                style: {
                    fontSize: this.fontSizes['credits']
                },
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
                    fontSize: this.fontSizes['noData'],
                    color: '#303030'
                }
            },
        }

    }

    /**
     * render function
     * configures chart options based on props and draws the slice charts
     * @return {*} - JSX code for the slice charts
     */
    render() {

        let chartOptions = this.chartOptions;

        //set the title
        let title = chartOptions.title;
        title.text = this.props.name;
        // title.text += !this.isForExport ? " <span style='font-size: 0.4em; transform: translateY(-50%)'>🔗</span>" : "";

        //build the subtitle
        let subtitle = "";
        if (this.props.series.length !== 0){
            subtitle = `Age: ${this.props.age} ║ Minutes Played: ${this.props.minutes.toLocaleString()}<br/>`;
            subtitle += this.subtitles[this.props.template];
            if (this.props.template !== "N/A"){
                subtitle += "Percentile Rank Bars w/ Per 90 Stats<br/>";
            }
            else {
                subtitle += "<br/>-"
            }
        }
        else {
            subtitle = "-<br>-<br>-";
        }
        //set the subtitle
        chartOptions.subtitle.text = subtitle;

        //calculate the start angle based on the number of wedges
        chartOptions.pane.startAngle = -((360/this.categories[this.props.template].length)/2);

        let chart = chartOptions.chart;
        //set animation (on update) to true or false
        chart.animation = this.props.isAnimated;
        //set chart margins
        if (this.isForExport){
            chart.marginTop = 230;
            chart.marginBottom = (this.props.creditsPosition === "right") ? 100 : 120;
        }
        else {
            chart.marginBottom = (this.props.creditsPosition === "right" && !this.props.isMobile) ? 30 : 60;
            let url = this.props.url;
            //add links to title and credits if the chart is not for export
            chart.events = {
                load: function() {
                    this.title.element.onclick = function() {
                        window.open(url, '_blank');
                    };
                    this.credits.element.onclick = function() {
                        window.open('https://fbref.com', '_blank');
                    }
                },
            };
        }

        let xAxis = chartOptions.xAxis;
        //set x-axis labels
        xAxis.categories = this.categories[this.props.template];
        if (this.isForExport){
            xAxis.labels.distance = 75;
        }
        else {
            xAxis.labels.distance = this.isMobile ? 60 : 40;
        }

        //set data points
        chartOptions.series = this.props.series.map(function (data) {
            return {
                pointPadding: 0,
                groupPadding: 0,
                // name: name,
                data: data,
                stickyTracking: false,
                zIndex: 0
            };
        });

        //disable initial animation and hover effects for charts that are for export
        let series = chartOptions.plotOptions.series;
        if (!this.props.isAnimatedInitial){
            series.animation = this.props.isAnimatedInitial;
        }
        series.states.hover.enabled = this.props.isAnimatedInitial;

        //set data labels
        let dataLabels = series.dataLabels;
        dataLabels.enabled = this.props.template !== "N/A";
        dataLabels.format = this.props.labelType === "raw" ? '{point.p90_label}' : '{point.percentile_label}';

        //disable tooltip for charts that for export
        chartOptions.tooltip.enabled = this.props.hasTooltip;
        chartOptions.tooltip.pointFormat = '<br>Raw Value: <b>{point.p90_label}</b><br/>Percentile Rank: <b>{point.percentile_label}</b>';

        //set credits text and position
        let credits = chartOptions.credits;
        credits.text = `Data Sources: FBref.com | StatsBomb ${this.isMobile || this.isForExport ? '<br/>.<br/>' : '<br/>'} Last Updated: ${this.props.lastUpdated} UTC`;
        credits.position = {
            align: this.props.creditsPosition,
            y: this.isMobile || this.isForExport ? -40 : -20
        };

        let className = this.isForExport ? null : "result";
        let id = this.isForExport ? "export" : "chart";

        //pass chart options to the Highcharts component and render
        return (
            <div className={className} id={id}>
                <HighchartsReact
                    constructorType={"chart"}
                    highcharts={Highcharts}
                    containerProps={{style: {width: '100%', height: '100%'}}}
                    options={chartOptions}
                />
            </div>
        );

    }

}

export default (Slice);
