import React, { Component } from 'react';
import { Redirect } from 'react-router-dom'

//import dependencies
import Cookies from 'universal-cookie';
import dateFormat from 'dateformat';

//import utility functions, constants
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

//import components
import LoadingSpinner from "../components/LoadingSpinner";
import SearchBar from "../components/SearchBar";
import SliceOptions from "../components/SliceOptions";
import Slice from "../components/Slice";
import GlossaryOverlay from "../components/GlossaryOverlay";
import CompareSearchOverlay from "../components/CompareSearchOverlay";
import ExportLoaderOverlay from "../components/LoaderOverlay";

//initialize cookies
const cookies = new Cookies();


/**
 * Stats page component
 */
class Stats extends Component {

    //class variable to track if the component is mounted
    _isMounted = false;

    /**
     * Constructor
     * @param props
     */
    constructor(props){

        super(props);

        //bind utility functions to this context
        this.filterStats = filterStats.bind(this);
        this.calculateStats = calculateStats.bind(this);
        this.constructChartInput = constructChartInput.bind(this);
        this.ageRangesString = ageRangesString.bind(this);
        this.changeTemplate = changeTemplate.bind(this);
        this.changePAdjTypes = changePAdjTypes.bind(this);
        this.changeSelectedCompetitions = changeSelectedCompetitions.bind(this);
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

        this.state = {
            isLoading: true,
            error: null,
            redirect: false,
            showGlossaryOverlay: false,
            showCompareSearchOverlay: false,
            showExportLoaderOverlay: false,
            renderForExport: false,
            percentileArrays: this.props.percentileArrays,
            statsByPosition: {},
            code: this.props.match.params.code,
            name: '',
            url: '',
            age: 0,
            clubs: {},
            percentileEntries: {},
            stats: {},
            isGK: false,
            isOutfieldGK: false,
            outfieldGKStats: null,
            standardStats: null,
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
        let { code } = nextProps.match.params;
        this.setState({
            redirect: false,
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
                //redirect if a v1 URL is detected
                if (code.match("^Players_[0-9]+_Show_")){
                    this.setState({
                        redirect: true,
                        isLoading: false,
                        code: code.split("_")[1]
                    })
                }
                else {
                    this.setState({
                        error: error,
                        isLoading: false
                    })
                }
            }
        });

    };


    /**
     * Function to process retrieved player stats and save to state
     * @param {Object} response - object containing the player metadata and stats, as well as new percentile arrays
     * in the event that the server needs to update a client's percentile arrays.
     */
    processStats = (response) => {

        //check if the stats object contains new percentile arrays
        if (response.newPercentileArrays !== undefined){
            //update percentile arrays in parent component as required
            this.props.updatePercentileArrays(response.newPercentileArrays);
        }

        let playerData = response.data;

        //process player position entry and set template. template is set to the most recent non-"N/A" position
        //in the player's position entries
        let template = "N/A";
        for (let season in playerData.positions){
            let position = playerData.positions[season][0];
            if (position !== "N/A"){
                template = position;
            }
        }

        let seasons = Object.keys(playerData.stats);

        let competitions = {};
        let selectedCompetitions = {};

        //retrieve player competitions. stored in an object where the keys are seasons and the values are arrays
        //of the competitions for the season
        for (let season in playerData.stats){

            competitions[season] = [];
            selectedCompetitions[season] = [];

            for (let competition in playerData.stats[season]){
                competitions[season].push(competition);
                //only 2 most recent season in selected competitions
                if (season === seasons[seasons.length - 1] || season === seasons[seasons.length - 2]){
                    selectedCompetitions[season].push(competition);
                }
            }

        }

        if (this._isMounted){

            this.setState({
                isLoading: false,
                statsByPosition: response.statsByPosition,
                name: playerData.name,
                url: "https://www.fbref.com" + playerData.fbrefURL,
                age: playerData.age,
                clubs: playerData.clubs,
                percentileEntries: playerData.percentileEntries,
                stats: playerData.stats,
                isGK: template === "GK",
                isOutfieldGK: playerData.outfieldGKStats != null,
                outfieldGKStats: playerData.outfieldGKStats,
                standardStats: playerData.stats,
                lastUpdated: dateFormat(playerData.lastUpdated, "dd/mm/yyyy, h:MM TT", true),
                template: template,
                competitions: JSON.parse(JSON.stringify(competitions)),
                selectedCompetitions: JSON.parse(JSON.stringify(selectedCompetitions))
            });

            document.title = `${playerData.name} | Football Slices`;

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
     * @return {*} - JSX code for the stats page
     */
    render() {

        let {
            isLoading,
            error,
            redirect,
            showGlossaryOverlay,
            showCompareSearchOverlay,
            showExportLoaderOverlay,
            renderForExport,
            statsByPosition,
            code,
            url,
            name,
            age,
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

        else if (redirect){
            return <Redirect to={`/stats/${code}`}/>
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

            if (template !== null && template !== "N/A") {
                filteredStats = this.filterStats(stats);
                if (Object.keys(filteredStats).length !== 0){
                    let calculatedStats = this.calculateStats(filteredStats);
                    let chartInput = this.constructChartInput(statsByPosition, calculatedStats.statsPer90, calculatedStats.percentiles);
                    series.push(chartInput);
                }
            }

            let exportSlice = null;

            if (renderForExport) {
                exportSlice =
                <Slice
                    isMobile={this.isMobile}
                    isForComparison={false}
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
                    competitions={competitions}
                    selectedCompetitions={selectedCompetitions}
                    age={age}
                    minutes={filteredStats['minutes']}
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
                    <CompareSearchOverlay
                        isMobile={this.isMobile}
                        display={showCompareSearchOverlay}
                        currentPlayerCode={code}
                        currentPlayerName={name}
                        toggleCompareSearchOverlay={this.toggleCompareSearchOverlay}
                    />
                    <ExportLoaderOverlay
                        isMobile={this.isMobile}
                        display={showExportLoaderOverlay}
                    />
                    <SearchBar
                        isMobile={this.isMobile}
                        page="stats"
                    />
                    <div className="screen2" id="stats-screen">
                        <SliceOptions
                            isMobile={this.isMobile}
                            isForComparison={false}
                            isGK={isGK}
                            isOutfieldGK={isOutfieldGK}
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
                            isAnimated={isAnimated}
                            isAnimatedInitial={true}
                            hasTooltip={true}
                            creditsPosition={creditsPosition}
                            url={url}
                            lastUpdated={lastUpdated}
                            template={template}
                            labelType={labelType}
                            name={name}
                            competitions={competitions}
                            selectedCompetitions={selectedCompetitions}
                            age={age}
                            minutes={filteredStats['minutes']}
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

export default Stats;
