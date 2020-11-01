import React, { Component } from 'react';
// import $ from "jquery";

//import dependencies
import Cookies from 'universal-cookie';

//import components
import LoadingSpinner from "../components/LoadingSpinner";
import SearchBar from "../components/SearchBar";
import SliceOptions from "../components/SliceOptions";
import Slice from "../components/Slice";
import GlossaryOverlay from "../components/GlossaryOverlay";
import CompareSearchScreen from "../components/CompareSearchOverlay";
import ExportLoaderScreen from "../components/LoaderOverlay";

//import utility functions
import {
    filterStats,
    calculateStats,
    constructChartInput,
    ageRangesString,
    changeTemplate,
    changeSelectedCompetitions,
    changePAdjTypes,
    changeLabelType,
    toggleCreditsPosition,
    exportChart,
    toggleGlossaryOverlay,
    toggleCompareSearchOverlay
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
        this.ageRangesString = ageRangesString.bind(this);
        this.changeTemplate = changeTemplate.bind(this);
        this.changeSelectedCompetitions = changeSelectedCompetitions.bind(this);
        this.changePAdjTypes = changePAdjTypes.bind(this);
        this.changeLabelType = changeLabelType.bind(this);
        this.toggleCreditsPosition = toggleCreditsPosition.bind(this);
        this.exportChart = exportChart.bind(this);
        this.toggleGlossaryOverlay = toggleGlossaryOverlay.bind(this);
        this.toggleCompareSearchOverlay = toggleCompareSearchOverlay.bind(this);

        //device and browser info
        this.isMobile = this.props.isMobile;
        this.isSafari = this.props.isSafari;

        //cookies
        let pAdjTypesCookie = cookies.get('pAdjTypes');
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
            showGlossaryOverlay: false,
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
            isGK: null,
            isOutfieldGK: {},
            outfieldGKStats: {},
            standardStats: {},
            lastUpdated: null,
            template: null,
            competitions: {},
            selectedCompetitions: {},
            pAdjTypes: pAdjTypesCookie === undefined ? { offensive: false, defensive: false } : pAdjTypesCookie,
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

        let playerData = response.data;

        //process player position entry and set template. template is set to the most recent non-"N/A" position
        //in the player's position entries
        let template = "N/A";
        for (let season in playerData[codes[0]].positions){
            let position = playerData[codes[0]].positions[season][0];
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
        let isOutfieldGK = {};
        let outfieldGKStats = {};
        let standardStats = {};
        let competitions = {};

        //retrieve the information for the 2 players and store in objects
        for (let code in playerData){

            names[code] = playerData[code].name;
            urls[code] = "https://www.fbref.com" + playerData[code].fbrefURL;
            ages[code] = playerData[code].age;
            clubs[code] = playerData[code].clubs;
            percentileEntries[code] = playerData[code].percentileEntries;

            let hasOutfieldGKStats = playerData[code].outfieldGKStats !== null;

            //set the initial stats set to GK stats if player 1 is a GK and player 2 is an outfield GK
            stats[code] = (template === "GK" && hasOutfieldGKStats) ? playerData[code].outfieldGKStats : playerData[code].stats;
            isOutfieldGK[code] = hasOutfieldGKStats;

            outfieldGKStats[code] = playerData[code].outfieldGKStats;
            standardStats[code] = playerData[code].stats;

            competitions[code] = {};
            //retrieve player competitions. stored in an object where the keys are seasons and the values are arrays
            //of the competitions for the season
            for (let season in stats[code]){
                competitions[code][season] = [];
                for (let competition in stats[code][season]){
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
                isGK: template === "GK",
                isOutfieldGK: JSON.parse(JSON.stringify(isOutfieldGK)),
                outfieldGKStats: JSON.parse(JSON.stringify(outfieldGKStats)),
                standardStats: JSON.parse(JSON.stringify(standardStats)),
                lastUpdated: dateFormat(playerData[codes[0]].lastUpdated, "dd/mm/yyyy, h:MM TT", true),
                template: template,
                competitions: JSON.parse(JSON.stringify(competitions)),
                selectedCompetitions: JSON.parse(JSON.stringify(competitions))
            });

            document.title = `${names[codes[0]]} vs ${names[codes[1]]} | Football Slices`;

            this.props.recordPageViewGA(window.location.pathname);
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
            showGlossaryOverlay,
            showCompareSearchOverlay,
            showExportLoaderOverlay,
            renderForExport,
            codes,
            urls,
            names,
            clubs,
            stats,
            isGK,
            isOutfieldGK,
            lastUpdated,
            competitions,
            selectedCompetitions,
            template,
            pAdjTypes,
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

            for (let i=0; i<codes.length; i++){

                let code = codes[i];
                filteredStats[code] = this.filterStats(stats[code], code);

                if (template !== null && template !== "N/A"){
                    let calculatedStats = this.calculateStats(filteredStats[code], code);
                    let chartInput = this.constructChartInput(
                        calculatedStats.statsPer90,
                        calculatedStats.percentiles,
                        code,
                        names[codes[i]],
                        filteredStats[code]['minutes'],
                        true,
                        i
                    );
                    series.push(chartInput);
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
                    isAnimated={false}
                    isAnimatedInitial={false}
                    hasTooltip={false}
                    creditsPosition={creditsPosition}
                    url={
                        [null, null]
                    }
                    lastUpdated={lastUpdated}
                    template={template}
                    labelType={labelType}
                    names={
                        [names[code1], names[code2]]
                    }
                    competitions={
                        [competitions[code1], competitions[code2]]
                    }
                    selectedCompetitions={
                        [selectedCompetitions[code1], selectedCompetitions[code2]]
                    }
                    ages={
                        [this.ageRangesString(filteredStats[code1]['age']), this.ageRangesString(filteredStats[code2]['age'])]
                    }
                    minutes={
                        [filteredStats[code1]['minutes'], filteredStats[code2]['minutes']]
                    }
                    padjTypes={pAdjTypes}
                    series={series}
                />
            }

            //return JSX code for the stats page
            return (
                <div id="main2">
                    <GlossaryOverlay
                        display={showGlossaryOverlay}
                        toggleGlossaryOverlay={this.toggleGlossaryOverlay}
                    />
                    <CompareSearchScreen
                        isMobile={this.isMobile}
                        display={showCompareSearchOverlay}
                        currentPlayerCode={codes[0]}
                        currentPlayerName={names[codes[0]]}
                        toggleCompareSearchOverlay={this.toggleCompareSearchOverlay}
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
                            isForComparison={true}
                            isGK={isGK}
                            isOutfieldGK={isOutfieldGK[codes[0]]}
                            codes={codes}
                            names={names}
                            template={template}
                            competitions={competitions}
                            clubs={clubs}
                            selectedCompetitions={selectedCompetitions}
                            pAdjTypes={pAdjTypes}
                            labelType={labelType}
                            changeTemplate={this.changeTemplate}
                            changeSelectedCompetitions={this.changeSelectedCompetitions}
                            changePAdjTypes={this.changePAdjTypes}
                            changeLabelType={this.changeLabelType}
                            toggleCreditsPosition={this.toggleCreditsPosition}
                            exportChart={this.exportChart}
                            toggleCompareSearchOverlay={this.toggleCompareSearchOverlay}
                        />
                        <Slice
                            isMobile={this.isMobile}
                            isForExport={false}
                            isForComparison={true}
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
                            names={
                                [names[code1], names[code2]]
                            }
                            competitions={
                                [competitions[code1], competitions[code2]]
                            }
                            selectedCompetitions={
                                [selectedCompetitions[code1], selectedCompetitions[code2]]
                            }
                            ages={
                                [this.ageRangesString(filteredStats[code1]['age']), this.ageRangesString(filteredStats[code2]['age'])]
                            }
                            minutes={
                                [filteredStats[code1]['minutes'], filteredStats[code2]['minutes']]
                            }
                            padjTypes={pAdjTypes}
                            series={series}
                            toggleGlossaryOverlay={this.toggleGlossaryOverlay}
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
