import React, {Component} from 'react';

import Highcharts from 'highcharts/highstock'
import HighchartsMore from 'highcharts/highcharts-more'
import HighchartsParallel from 'highcharts/modules/parallel-coordinates'
import HighchartsReact from "highcharts-react-official";
HighchartsMore(Highcharts);
HighchartsParallel(Highcharts);

class Slice extends Component {

    constructor(props) {

        super(props);

        this.categories = {
            "FW": [
                'Non-Penalty Goals',
                'Non-Penalty xG',
                'Non-Penalty xG/Shot',
                `${this.props.isMobile ? "Conver-<br>sion Rate" : "Conversion Rate"}`,
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
                `${this.props.isMobile ? "Pass Comp. %" : "Pass Completion %"}`,
                'Successful Dribbles',
                'Dribble Success %',
                'Times Dispossessed',
                '(pAdj) Successful Pressures',
            ],
            "CM": [
                'xA',
                'OP Shot-Creating Actions',
                'Passes into Final 1/3',
                `${this.props.isMobile ? "Prog-<br>ressive Distance" : "Progressive Distance"}`,
                `${this.props.isMobile ? "Pass Comp. %" : "Pass Completion %"}`,
                'Successful Dribbles',
                'Dribble Success %',
                'Times Dispossessed',
                '(pAdj) Successful Pressures',
                `${this.props.isMobile ? "(pAdj) Inter-<br>ceptions" : "(pAdj) Interceptions"}`,
                '(pAdj) Tackles Won',
                'Tackle/ Dribbled Past %'
            ],
            "FB": [
                'xA',
                'Passes into Final 1/3',
                'Progressive Distance',
                `${this.props.isMobile ? "Pass Comp. %" : "Pass Completion %"}`,
                'Successful Dribbles',
                'Dribble Success %',
                'Times Dispossessed',
                '(pAdj) Successful Pressures',
                '(pAdj) Interceptions',
                "(pAdj) Tackles Won",
                'Tackle/ Dribbled Past %',
                'Aerial Win %'
            ],
            "CB": [
                'Passes into Final 1/3',
                'Progressive Distance',
                `${this.props.isMobile ? "Pass Comp. %" : "Pass Completion %"}`,
                `${this.props.isMobile ? "Long Pass Comp. %" : "Long Pass Completion %"}`,
                '(pAdj) Successful Pressures',
                '(pAdj) Interceptions',
                '(pAdj) Tackles Won',
                'Tackle/ Dribbled Past %',
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

        this.subtitles = {
            "FW": "vs Top-5 League Players with 10+ Starts as Forwards<br/>",
            "AM": "vs Top-5 League Players with 10+ Starts as Attacking Midfielders / Wingers<br/>",
            "CM": "vs Top-5 League Players with 10+ Starts as Central / Defensive Midfielders<br/>",
            "FB": "vs Top-5 League Players with 10+ Starts as Full-backs<br/>",
            "CB": "vs Top-5 League Players with 10+ Starts as Center-backs<br/>",
            "GK": "vs Top-5 League Players with 10+ Starts as Goalkeepers<br/>",
            "N/A": "No Template Selected"
        };

        this.fontSizes =  {
            title: this.props.isMobile === true ? '4.6vw' : '2.3em',
            subtitle: this.props.isMobile === true ? '2.7vw' : '1.4em',
            noData: this.props.isMobile === true ? '2.7vw' : '1.35em',
            xAxisLabels: this.props.isMobile === true ? '2.3vw' : '1.15em',
            dataLabels: this.props.isMobile === true ? '2.3vw' : '1.15em',
            dataLabelsOutline: this.props.isMobile === true ? '0.3vw' : '0.2em',
            tooltipHeader: this.props.isMobile === true ? '2.3vw' : '1em',
            tooltip: this.props.isMobile === true ? '2.3vw' : '1.25em',
            credits: this.props.isMobile === true ? '2.3vw' : '1.2em',
            yAxisLabels: this.props.isMobile === true ? '1vw' : '0.5em'
        };

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
                    // fontWeight: 'bold',
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
                // spacingLeft: 30,
                // spacingRight: 30,
                marginLeft: 90,
                marginRight: 90,
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

    render() {

        let chartOptions = this.chartOptions;

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

        chartOptions.title.text = this.props.name + " [v2]";
        chartOptions.subtitle.text = subtitle;

        chartOptions.pane.startAngle = -((360/this.categories[this.props.template].length)/2);

        let chart = chartOptions.chart;
        chart.animation = this.props.isAnimated;
        chart.marginBottom = (this.props.creditsPosition === "right" && !this.props.isMobile) ? 30 : 60;
        let url = this.props.url;
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

        let xAxis = chartOptions.xAxis;
        xAxis.categories = this.categories[this.props.template];
        xAxis.labels.distance = this.props.isMobile === true ? 60 : 40;

        chartOptions.series = this.props.series.map(function (set) {
            return {
                pointPadding: 0,
                groupPadding: 0,
                // name: name,
                data: set,
                stickyTracking: false,
                zIndex: 0
            };
        });

        let dataLabels = chartOptions.plotOptions.series.dataLabels;
        dataLabels.enabled = this.props.template !== "N/A";
        dataLabels.format = this.props.labelType === "raw" ? '{point.p90_label}' : '{point.percentile_label}';

        chartOptions.tooltip.pointFormat = '<br>Raw Value: <b>{point.p90_label}</b><br/>Percentile Rank: <b>{point.percentile_label}</b>';

        let credits = chartOptions.credits;
        credits.text = `Data Source: FBref.com ${this.props.isMobile ? '<br/>.<br/>' : '<br/>'} Last Updated: ${this.props.lastUpdated} UTC`;
        credits.position = {
            align: this.props.creditsPosition,
            y: this.props.isMobile ? -40 : -20
        };

        return (
            <div className="result" id="chart">
                <HighchartsReact
                    constructorType={"chart"}
                    highcharts={Highcharts}
                    containerProps={{style: {width: '100%'}}}
                    options={chartOptions}
                />
            </div>
        );

    }

}

export default (Slice);
