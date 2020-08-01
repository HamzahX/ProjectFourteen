import React, { Component } from 'react';
// import $ from "jquery";

//import dependencies
import Cookies from 'universal-cookie';

//import components
import LoadingSpinner from "../components/LoadingSpinner";
import SearchBar from "../components/SearchBar";
import SliceOptions from "../components/SliceOptions";
import Slice from "../components/Slice";
import CompareSearchScreen from "../components/CompareSearchOverlay";
import ExportLoaderScreen from "../components/ExportLoaderOverlay";

//import utility functions
import {
    filterStats,
    calculateStats,
    constructChartInput,
    changeTemplate,
    changeSelectedCompetitions,
    changeLabelType,
    toggleCreditsPosition,
    exportChart,
    toggleCompareSearch
} from "../utilities/SliceUtilities"

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

        //bind utility function to this context
        this.filterStats = filterStats.bind(this);
        this.calculateStats = calculateStats.bind(this);
        this.constructChartInput = constructChartInput.bind(this);
        this.changeTemplate = changeTemplate.bind(this);
        this.changeSelectedCompetitions = changeSelectedCompetitions.bind(this);
        this.changeLabelType = changeLabelType.bind(this);
        this.toggleCreditsPosition = toggleCreditsPosition.bind(this);
        this.exportChart = exportChart.bind(this);
        this.toggleCompareSearch = toggleCompareSearch.bind(this);

        //device and browser info
        this.isMobile = this.props.isMobile;
        this.isSafari = this.props.isSafari;

        //cookies
        let labelTypeCookie = cookies.get('labelType');
        let creditsPositionCookie = cookies.get('creditsPosition');

        //retrieve player codes from the URL
        let codes = this.props.match.params.codes.split("_");

        //modify them if they are identical (comparing a player to themselves). This is done so the objects holding
        //the data for the 2 instances of the player can have unique keys
        if (codes[0] === codes[1]) {
            codes[0] = codes[0] + "|1";
            codes[1] = codes[1] + "|2";
        }

        this.state = {
            isLoading: true,
            error: null,
            showCompareSearchOverlay: false,
            showExportLoaderOverlay: false,
            renderForExport: false,
            percentileArrays: this.props.percentileArrays,
            codes: codes,
            names: {},
            urls: {},
            ages: {},
            clubs: {},
            percentileEntries: {},
            stats: {},
            template: null,
            competitions: {},
            selectedCompetitions: {},
            labelType: labelTypeCookie === undefined ? "raw" : labelTypeCookie,
            creditsPosition: creditsPositionCookie === undefined ? "right" : creditsPositionCookie,
            lastUpdated: null,
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

        //retrieve player codes from the URL
        let codes = nextProps.match.params.codes.split("_");
        //modify them if they are identical (comparing a player to themselves). This is done so the objects holding
        //the data for the 2 iterations of the player can have unique keys
        if (codes[0] === codes[1]) {
            codes[0] = codes[0] + "|1";
            codes[1] = codes[1] + "|2";
        }

        this.setState({
            isLoading: true,
            showCompareSearchOverlay: false,
            codes: codes
        }, () => {
            this.getStats();
        });

    }


    /**
     * Function to send a post request to the server to retrieve the stats of the player
     */
    getStats = () => {

        const codes = this.state.codes;

        //fetch stats
        fetch('/api/comparisonStats', {
            method: 'post',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "codes": codes,
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
            console.log(error);
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
     * @param {Object} response - object containing the players' metadata and stats, as well as new percentile arrays
     * in the event that the server needs to update a client's percentile arrays.
     */
    processStats = (response) => {

        let codes = this.state.codes;

        //check if the stats object contains new percentile arrays
        if (response.newPercentileArrays !== undefined){
            //update percentile arrays in parent component as required
            this.props.updatePercentileArrays(response.newPercentileArrays);
        }

        let playerStats = response.stats;

        //process player position entry and set template. template is set to the most recent non-"N/A" position
        //in the player's position entries
        let template = "N/A";
        for (let season in playerStats[codes[0]].positions){
            let position = playerStats[codes[0]].positions[season];
            if (position !== "N/A"){
                template = position;
            }
        }

        let names = {};
        let urls = {};
        let ages = {};
        let clubs = {};
        let percentileEntries = {};
        let stats = {};
        let competitions = {};

        //retrieve the information for the 2 players and store in objects
        for (let code in playerStats){
            names[code] = playerStats[code].name;
            urls[code] = "https://www.fbref.com" + playerStats[code].fbrefURL;
            ages[code] = playerStats[code].age;
            clubs[code] = playerStats[code].clubs;
            percentileEntries[code] = playerStats[code].percentileEntries;
            stats[code] = playerStats[code].stats;
            competitions[code] = {};
            //retrieve player competitions. stored in an object where the keys are seasons and the values are arrays
            //of the competitions for the season
            for (let season in playerStats[code].stats){
                competitions[code][season] = [];
                for (let competition in playerStats[code].stats[season]){
                    competitions[code][season].push(competition);
                }
            }
        }

        if (this._isMounted){
            this.setState({
                isLoading: false,
                names: JSON.parse(JSON.stringify(names)),
                urls: JSON.parse(JSON.stringify(urls)),
                ages: JSON.parse(JSON.stringify(ages)),
                clubs: JSON.parse(JSON.stringify(clubs)),
                percentileEntries: JSON.parse(JSON.stringify(percentileEntries)),
                stats: JSON.parse(JSON.stringify(stats)),
                template: template,
                competitions: JSON.parse(JSON.stringify(competitions)),
                selectedCompetitions: JSON.parse(JSON.stringify(competitions)),
                lastUpdated: dateFormat(playerStats[codes[0]].lastUpdated, "dd/mm/yyyy, h:MM TT", true)
            });
            document.title = `${names[codes[0]]} vs ${names[codes[1]]} | Football Slices`
        }

    };


    /**
     * Called just before the component un-mounts
     */
    componentWillUnmount() {
        this._isMounted = false;
    }


    /**
     * render function
     * @return {*} - JSX code for the compare page
     */
    render() {

        let {
            isLoading,
            error,
            showCompareSearchOverlay,
            showExportLoaderOverlay,
            renderForExport,
            codes,
            urls,
            names,
            ages,
            clubs,
            stats,
            lastUpdated,
            competitions,
            selectedCompetitions,
            template,
            labelType,
            creditsPosition,
            isAnimated
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
                    <SearchBar
                        isMobile={this.isMobile}
                        page="stats"
                        query={this.state.query}
                    />
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
            let hasUndefined;
            if (template !== null) {
                for (let i=0; i<codes.length; i++){
                    let code = codes[i];
                    filteredStats[code] = this.filterStats(stats[code], code);
                    if (Object.keys(filteredStats[code]).length !== 0){
                        let calculatedStats = this.calculateStats(filteredStats[code], code);
                        let chartInput = this.constructChartInput(
                            calculatedStats.statsPer90,
                            calculatedStats.percentiles,
                            code,
                            names[codes[i]],
                            ages[codes[i]],
                            filteredStats[code]['minutes'],
                            i
                        );
                        series.push(chartInput);
                    }
                    else {
                        hasUndefined = true;
                    }
                }
            }

            let code1 = codes[0];
            let code2 = codes[1];

            let exportSlice = null;
            if (renderForExport) {
                exportSlice =
                <Slice
                    isMobile={this.isMobile}
                    isForExport={true}
                    isForComparison={true}
                    hasUndefined={hasUndefined}
                    isAnimated={false}
                    isAnimatedInitial={false}
                    hasTooltip={false}
                    creditsPosition={creditsPosition}
                    url={
                        [urls[code1], urls[code2]]
                    }
                    lastUpdated={lastUpdated}
                    template={template}
                    labelType={labelType}
                    name={
                        [names[code1], names[code2]]
                    }
                    age={
                        [ages[code1], ages[code2]]
                    }
                    minutes={
                        [filteredStats[code1]['minutes'], filteredStats[code2]['minutes']]
                    }
                    series={series}
                />
            }

            //return JSX code for the stats page
            return (
                <div id="main2">
                    <CompareSearchScreen
                        isMobile={this.isMobile}
                        display={showCompareSearchOverlay}
                        currentPlayerCode={codes[0]}
                        currentPlayerName={names[codes[0]]}
                        toggleCompareSearch={this.toggleCompareSearch}
                    />
                    <ExportLoaderScreen
                        isMobile={this.isMobile}
                        display={showExportLoaderOverlay}
                    />
                    <SearchBar
                        isMobile={this.isMobile}
                        page="stats"
                    />
                    <div className="screen2" id="compare-screen">
                        <SliceOptions
                            isMobile={this.isMobile}
                            codes={codes}
                            names={names}
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
                            isMobile={this.isMobile}
                            isForExport={false}
                            isForComparison={true}
                            hasUndefined={hasUndefined}
                            isAnimated={isAnimated}
                            isAnimatedInitial={true}
                            hasTooltip={true}
                            creditsPosition={creditsPosition}
                            url={
                                [urls[code1], urls[code2]]
                            }
                            lastUpdated={lastUpdated}
                            template={template}
                            labelType={labelType}
                            name={
                                [names[code1], names[code2]]
                            }
                            age={
                                [ages[code1], ages[code2]]
                            }
                            minutes={
                                [filteredStats[code1]['minutes'], filteredStats[code2]['minutes']]
                            }
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
