import React, { Component } from 'react';
// import $ from "jquery";

//import dependencies
import Cookies from 'universal-cookie';
import dateFormat from 'dateformat';

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

//import components
import LoadingSpinner from "../components/LoadingSpinner";
import SearchBar from "../components/SearchBar";
import SliceOptions from "../components/SliceOptions";
import Slice from "../components/Slice";
import CompareSearchScreen from "../components/CompareSearchScreen";

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

        this.state = {
            isLoading: true,
            error: null,
            renderForExport: false,
            showCompareScreen: false,
            percentileArrays: this.props.percentileArrays,
            code: this.props.match.params.code,
            name: '',
            url: '',
            age: 0,
            clubs: {},
            percentileEntries: {},
            stats: {},
            lastUpdated: null,
            template: null,
            competitions: {},
            selectedCompetitions: {},
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
                this.setState({
                    error: error,
                    isLoading: false
                })
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

        let playerStats = response.stats;

        //process player position entry and set template. template is set to the most recent non-"N/A" position
        //in the player's position entries
        let template = "N/A";
        for (let season in playerStats.positions){
            let position = playerStats.positions[season];
            if (position !== "N/A"){
                template = position;
            }
        }

        //retrieve player competitions. stored in an object where the keys are seasons and the values are arrays
        //of the competitions for the season
        let competitions = {};
        for (let season in playerStats.stats){
            competitions[season] = [];
            for (let competition in playerStats.stats[season]){
                competitions[season].push(competition);
            }
        }

        if (this._isMounted){
            this.setState({
                isLoading: false,
                name: playerStats.name,
                url: "https://fbref.com/en/players/" + playerStats.fbrefCode,
                age: playerStats.age,
                clubs: playerStats.clubs,
                percentileEntries: playerStats.percentileEntries,
                stats: playerStats.stats,
                lastUpdated: dateFormat(playerStats.lastUpdated, "dd/mm/yyyy, h:MM TT", true),
                template: template,
                competitions: JSON.parse(JSON.stringify(competitions)),
                selectedCompetitions: JSON.parse(JSON.stringify(competitions))
            });
            document.title = `${playerStats.name} | Football Slices`
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
            renderForExport,
            showCompareScreen,
            code,
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
                    <SearchBar page="stats" query={this.state.query}/>
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
            if (template !== null) {
                filteredStats = this.filterStats(stats);
                if (Object.keys(filteredStats).length !== 0){
                    let calculatedStats = this.calculateStats(filteredStats);
                    let chartInput = this.constructChartInput(calculatedStats.statsPer90, calculatedStats.percentiles);
                    series.push(chartInput);
                }
            }

            let exportSlice = null;
            if (renderForExport) {
                exportSlice =
                <Slice
                    isMobile={this.isMobile}
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
                    age={age}
                    minutes={filteredStats['minutes']}
                    series={series}
                />
            }

            //return JSX code for the stats page
            return (
                <div id="main2">
                    <CompareSearchScreen
                        display={showCompareScreen}
                        currentPlayerCode={code}
                        currentPlayerName={name}
                        toggleCompareSearch={this.toggleCompareSearch}
                    />
                    <SearchBar
                        page="stats"
                    />
                    <div className="screen2" id="stats-screen">
                        <SliceOptions
                            isMobile={this.isMobile}
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
                            isAnimated={isAnimated}
                            isAnimatedInitial={true}
                            hasTooltip={true}
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
                    {/*Second slice used for exports. Not displayed*/}
                    {exportSlice}
                </div>
            );

        }

    }

}

export default Stats;
