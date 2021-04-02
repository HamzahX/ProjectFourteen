import React, {Component} from 'react';
import { Link } from 'react-router-dom';
import withRouter from "react-router-dom/es/withRouter";
import {
    withQueryParams,
    JsonParam,
} from 'use-query-params';

import Cookies from 'universal-cookie';

//import lodash functions
import set from 'lodash.set';
import isEqual from 'lodash.isequal';

//import custom components
import SearchBar from "../components/SearchBar";
import LoadingSpinner from "../components/LoadingSpinner";
import LoaderOverlay from "../components/LoaderOverlay";
import ExplanationOverlay from "../components/ExplanationOverlay";
import PlayerSearchResult from "../components/PlayerSearchResult";

//import pre-made components
import Collapsible from 'react-collapsible';
import {Select, Slider, Tooltip} from 'antd';
import DataTable, { createTheme } from 'react-data-table-component';

//import utility functions, constants
import {
    getLeaguesDisplay,
    getAllEntriesFromObject
} from "../utilities/SearchResultUtilities"
import { ordinalSuffix } from "../utilities/SliceUtilities"
import dateFormat from "dateformat";

//initialize constants
const Option = Select.Option;
const cookies = new Cookies();

const _ = require('lodash');


/**
 * Advanced Search page component
 */
class AdvancedSearch extends Component {

    //class variable to track if the component is mounted
    _isMounted = false;

    _firstSearchMade = false;
    _referenceData = {};
    _statsReferenceDataArraySorted = [];
    _parametersOriginalState = {};

    _baseColumns = [
        {
            name: 'Name',
            selector: 'name',
            style: {
                fontSize: this.props.isMobile ? '3em' : '1.15em',
                fontWeight: 'bold',
                color: '#e75453'
            },
            minWidth: '250px',
            sortable: true,
            sortFunction: (rowA, rowB) => (rowA.simplifiedName.localeCompare(rowB.simplifiedName)),
            ignoreRowClick: true,
            cell: row => {
                return (
                    <Link to={`/stats/${row.code}`}>
                        <div tabIndex="0" className="table-link">
                            {row.name}
                        </div>
                    </Link>
                );
            }
        },
        {
            name: 'Current Age',
            selector: 'age',
            sortable: true,
            ignoreRowClick: true
        },
        {
            name: 'Nationality',
            selector: 'nationalities',
            sortable: true,
            ignoreRowClick: true
        },
        {
            name: 'League(s)',
            selector: 'leagues',
            sortable: true,
            ignoreRowClick: true
        },
        {
            name: 'Club(s)',
            selector: 'clubs',
            sortable: true,
            ignoreRowClick: true
        },
        {
            name: 'Position(s)',
            selector: 'displayPositions',
            sortable: true,
            ignoreRowClick: true
        }
    ];

    _customStyles = {
        headCells: {
            style: {
                fontSize: '1em',
                fontWeight: 'bold',
                color: '#000000'
            },
        },
    };

    /**
     * Constructor
     * @param props
     */
    constructor(props){

        super(props);

        this.ordinalSuffix = ordinalSuffix.bind(this);

        this.isMobile = this.props.isMobile;

        let seasons = {
            "18-19": "18/19",
            "19-20": "19/20",
            "20-21": "20/21"
        };
        let seasonOptions = [];

        for (let season in seasons){
            seasonOptions.push(
                <Option
                    key={season}
                    value={season}
                >
                    {seasons[season]}
                </Option>
            )
        }

        let positions = {
            "FW": "Forward",
            "AM": "Attacking Midfielder / Winger",
            "CM": "Central / Defensive Midfielder",
            "FB": "Full-back",
            "CB": "Center-back",
            "GK": "Goalkeeper"
        };
        let positionsOptions = [];

        for (let position in positions){
            positionsOptions.push(
                <Option
                    key={position}
                    value={position}
                >
                    {positions[position]}
                </Option>
            )
        }

        let leagues = {
            "_england": "Premier League",
            "es": "La Liga",
            "it": "Serie A",
            "de": "Bundesliga",
            "fr": "Ligue 1"
        };
        let leaguesOptions = [];

        for (let league in leagues){
            leaguesOptions.push(
                <Option
                    key={league}
                    value={league}
                >
                    {leagues[league]}
                </Option>
            )
        }

        let displayTypeCookie = cookies.get('displayType');

        this.state = {

            isLoading: true,
            error: null,
            showSearchLoaderOverlay: false,
            showExplanationOverlay: false,

            displayType: this.isMobile ? "cards" : displayTypeCookie || "cards",

            filterOptions: {
                seasons: seasonOptions,
                ages: {},
                nationalities: [],
                leagues: leaguesOptions,
                clubs: [],
                positions: positionsOptions,
                aggregateStats: [],
                averageStats: [],
                percentileRanks: []
            },

            parameters: {
                season: "20-21",
                includeEuropeanCompetitions: true,
                ages: {},
                nationalities: [],
                leagues: [],
                clubs: [],
                positions: [],
                aggregateStats: {},
                averageStats: {},
                percentileRanks: {}
            },

            tableColumns: _.cloneDeep(this._baseColumns),

            searchResults: [],

            searchResultsDisplay: null

        };

        createTheme('basic', {
            background: {
                default: '#fafbfc',
            },
            striped: {
                default: '#f3f4f5',
            }
        });

        this.getReferenceData();

    }


    /**
     * Called after component has mounted
     */
    componentDidMount() {
        this._isMounted = true;
    }


    /**
     * Function to send a get request to the server to retrieve the reference data used to populate the select lists
     */
    getReferenceData = () => {

        //retrieve search results
        fetch('/api/referenceData', {
            method: 'post',
            headers: {
                "Content-Type": "application/json"
            },
        })
        .then(res => {
            if (res.ok) {
                return res.json()
            }
            else {
                throw new Error("Failed to fetch reference data. Please refresh the page and try again.")
            }
        })
        .then(referenceData => this.processReferenceData(referenceData))
        .catch(error => {
            if (this._isMounted){
                this.setState({error, isLoading: false})
            }
        });

    };


    /**
     * Function to process the reference data and save to state
     * @param {Object} referenceData - object containing reference data
     */
    processReferenceData = (referenceData) => {

        this._referenceData = referenceData;

        let statsReferenceDataArray = [];
        for (let stat in referenceData.statsReferenceData){
            let temp = referenceData.statsReferenceData[stat];
            temp.stat = stat;
            statsReferenceDataArray.push(temp);
        }

        statsReferenceDataArray.sort((a, b) => a.displayOrder - b.displayOrder);

        this._statsReferenceDataArraySorted = statsReferenceDataArray;

        let filterOptions = this.state.filterOptions;
        let parameters = this.state.parameters;
        let queryParameters = this.props.query.parameters;

        let ageReferenceData = referenceData.statsReferenceData["age"];

        filterOptions.ages = {
            min: ageReferenceData.ranges.min,
            max: ageReferenceData.ranges.max
        };

        parameters.ages = JSON.parse(JSON.stringify(filterOptions.ages));

        let season = parameters.season;
        let minutesReferenceData = referenceData.statsReferenceData["minutes"];

        parameters.aggregateStats.minutes = {
            min: minutesReferenceData.ranges_agg[season].min,
            max: minutesReferenceData.ranges_agg[season].max,
        };

        this._parametersOriginalState = JSON.parse(JSON.stringify(this.state.parameters));

        if (queryParameters !== undefined){
            parameters = JSON.parse(JSON.stringify(queryParameters));
        }

        let nationalitiesOptions = [];
        for (let i=0; i<referenceData.countries.length; i++){

            let country = referenceData.countries[i];

            nationalitiesOptions.push(
                <Option
                    key={country.code.toLowerCase()}
                    value={country.code.toLowerCase()}
                >
                    {country.name}
                </Option>
            )

        }
        filterOptions.nationalities = nationalitiesOptions;

        let clubsOptions = [];
        for (let i=0; i<referenceData.clubs.length; i++){

            let club = referenceData.clubs[i];

            clubsOptions.push(
                <Option
                    key={club.name}
                    value={club.name}
                >
                    {club.name}
                </Option>
            )

        }
        filterOptions.clubs = clubsOptions;

        let aggregateStatsOptions = [];
        for (let i=0; i<statsReferenceDataArray.length; i++){

            let statData = statsReferenceDataArray[i];
            let stat = statData.stat;

            if (!statData.types.includes("aggregate") || stat === "minutes"){
                continue;
            }

            aggregateStatsOptions.push(
                <Option
                    key={stat}
                    value={stat}
                >
                    {`${statData.label}`}
                </Option>
            )

        }
        filterOptions.aggregateStats = aggregateStatsOptions;

        let averageStatsOptions = [];
        for (let i=0; i<statsReferenceDataArray.length; i++){

            let statData = statsReferenceDataArray[i];
            let stat = statData.stat;

            if (!statData.types.includes("average")){
                continue;
            }

            averageStatsOptions.push(
                <Option
                    key={stat}
                    value={stat}
                >
                    {`${statData.label} ${statData.suffix}`}
                </Option>
            )

        }
        filterOptions.averageStats = averageStatsOptions;

        if (this._isMounted){

            this.setState({
                parameters: parameters,
                filterOptions: filterOptions
            });

            if (parameters.positions.length === 1){
                this.buildPercentileRankSelectList();
            }

            if (parameters.leagues.length > 0){
                this.buildClubsSelectList();
            }

            let handleQueryParameters = queryParameters !== undefined && !isEqual(queryParameters, this._parametersOriginalState);

            this.setState({
                error: null,
                isLoading: handleQueryParameters,
            });

            document.title = 'Advanced Search | Football Slices';

            this.props.recordPageViewGA(window.location.pathname);

            if (handleQueryParameters){
                this.getSearchResults(true);
            }

        }

    };


    /**
     * Function to send a post request to the server to retrieve the search results matching the query
     */
    getSearchResults = (fromQueryString = false) => {

        this.setState({
            showSearchLoaderOverlay: fromQueryString !== true,
        });

        //clear deep clone of parameters and clean it
        let parameters = JSON.parse(JSON.stringify(this.state.parameters));

        //delete percentile ranks parameters if not exactly 1 position is selected
        if (parameters.positions.length !== 1){

            for (let stat in parameters.percentileRanks){
                delete parameters.percentileRanks[stat];
            }

        }

        let season = parameters.season;

        //because range slider min/max values are not true min/maxes, we set the min/max to -infinity/infinity
        //if the slider is at the max allowed value
        for (let stat in parameters.averageStats){

            let statRanges = this._referenceData.statsReferenceData[stat].ranges[season];

            if (parameters.averageStats[stat].min === statRanges.min){
                parameters.averageStats[stat].min = null
            }

            if (parameters.averageStats[stat].max === statRanges.max){
                parameters.averageStats[stat].max = null
            }

        }

        //retrieve search results
        fetch('/api/advancedSearch', {
            method: 'post',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "parameters": parameters
            })
        })
        .then(res => {
            if (res.ok) {
                return res.json()
            }
            else {
               throw new Error("Failed to fetch search results. Please refresh the page and try again.")
            }
        })
        .then(searchResults => {
            this._firstSearchMade = true;
            this.processSearchResults(searchResults)
        })
        .catch(error => {
            if (this._isMounted){
                this.setState({error})
            }
        });

    };


    /**
     * Function to process the search results and save to state
     * @param {Object} searchResults - object containing search results
     * parameters
     */
    processSearchResults = (searchResults) => {

        let parameters = this.state.parameters;
        let displayType = this.state.displayType;

        let tableColumns;

        if (displayType === "table"){

            tableColumns = _.cloneDeep(this._baseColumns);

            for (let stat in parameters.aggregateStats){

                let statData = this._referenceData.statsReferenceData[stat];

                tableColumns.push({
                    name: `${statData.label}`,
                    selector: `aggregate_${stat}`,
                    sortable: true,
                    ignoreRowClick: true,
                    format: row => parseFloat(row[`aggregate_${stat}`])
                })
            }

            for (let stat in parameters.averageStats){

                let statData = this._referenceData.statsReferenceData[stat];

                tableColumns.push({
                    name: `${statData.label} ${statData.suffix}`,
                    selector: `raw_${stat}`,
                    sortable: true,
                    ignoreRowClick: true,
                    format: row => parseFloat(row[`raw_${stat}`])
                })
            }

            if (parameters.positions.length === 1){
                for (let stat in parameters.percentileRanks){

                    let statData = this._referenceData.statsReferenceData[stat];

                    tableColumns.push({
                        name: `${statData.label} ${statData.suffix} (Percentile Rank)`,
                        selector: `percentile_${stat}`,
                        sortable: true,
                        ignoreRowClick: true,
                        sortFunction: (rowA, rowB) => { return parseFloat(rowA[`percentile_${stat}`]) - parseFloat(rowB[`percentile_${stat}`]) },
                        format: row => this.ordinalSuffix(row[`percentile_${stat}`]) + " percentile"
                    })
                }
            }

        }

        if (this._isMounted){

            this.setState({
                searchResults: [],
                searchResultsDisplay: null
            }, () => {
                this.setState({
                    error: null,
                    isLoading: false,
                    showSearchLoaderOverlay: false,
                    tableColumns: tableColumns,
                    searchResults: searchResults
                }, () => {
                    this.buildSearchResultsDisplay();
                });
            });

        }

    };


    toggleExplanationOverlay = () => {

        let currentState = this.state.showExplanationOverlay;

        this.setState({
            showExplanationOverlay: !currentState
        });

    };


    handleTableButtonClick = () => {

        this.setState({
            displayType: "table"
        }, () => {
            this.processSearchResults(this.state.searchResults);
        });

        cookies.set('displayType', "table", {path: '/'});

    };


    handleCardsButtonClick = () => {

        this.setState({
            displayType: "cards"
        }, () => {
            this.processSearchResults(this.state.searchResults);
        });

        cookies.set('displayType', "cards", {path: '/'});

    };


    buildSearchResultsDisplay = () => {

        let season = this.state.parameters.season;
        let searchResults = this.state.searchResults;

        let displayType = this.state.displayType;
        let tableColumns = this.state.tableColumns;

        let searchResultsDisplay;

        if (displayType === "cards"){

            let playerCards = [];

            for (let i=0; i<searchResults.length; i++){

                let current = searchResults[i];

                playerCards.push(
                    <PlayerSearchResult
                        isMobile={this.isMobile}
                        page="search"
                        code={current.code}
                        name={current.name}
                        age={current.age}
                        season={season}
                        clubs={current.clubs}
                        nationalities={current.nationalities}
                        countryCodes={current.countryCodes}
                        positions={current.displayPositions}
                        key={i}
                    />
                );

            }

            searchResultsDisplay =
                <div id="player-search-results">
                    {playerCards}
                </div>;

        }
        else if (displayType === "table"){

            let tableRows = [];

            for (let i=0; i<searchResults.length; i++){

                let current = searchResults[i];
                let row = {};

                for (let key in current){

                    if (Array.isArray(current[key])){
                        row[key] = current[key].join(", ");
                    }
                    else if (typeof current[key] === 'object'){

                        if (season !== null){

                            if (key === "leagues"){
                                row[key] = getLeaguesDisplay(current[key][season])
                            }
                            else {
                                row[key] = current[key][season].join(", ");
                                if (row[key] === "N/A"){
                                    row[key] = "-";
                                }
                            }

                        }

                        else {
                            row[key] = getAllEntriesFromObject(current[key]).join(", ");
                        }

                    }
                    else {
                        row[key] = current[key];
                    }

                }

                tableRows.push(row);

            }

            if (tableRows.length > 0){

                searchResultsDisplay =
                    <div id="player-search-results-table">
                        <DataTable
                            title={""}
                            columns={tableColumns}
                            data={tableRows}
                            theme={"basic"}
                            customStyles={this._customStyles}
                            striped={false}
                            //highlightOnHover={true}
                            //pointerOnHover={true}
                            pagination={true}
                            paginationPerPage={30}
                            fixedHeader={true} //causes mis-aligned header bug by adding permanent scrollbar
                            allowOverflow={true}
                            overflowY={true}
                            overflowX={true}
                            defaultSortAsc={false}
                        />
                    </div>;

            }

        }

        this.setState({
            searchResultsDisplay: searchResultsDisplay
        })

    };


    handleSingleSelectChange = (key, value) => {

        let parameters = this.state.parameters;

        let oldValue = parameters[key];

        parameters[key] = value;

        //changing the season changes the min/max values on the sliders so we update accordingly
        if (key === "season"){

            let season = parameters.season;

            //if current max/min is greater/less than new max/min
            //or if current max/min is equal to slider max/min
            //update raw stat slider
            for (let stat in parameters.averageStats){

                let statData = this._referenceData.statsReferenceData[stat];

                if (
                    parameters.averageStats[stat].max > statData.ranges[season].max ||
                    parameters.averageStats[stat].max === statData.ranges[oldValue].max
                ){
                    parameters.averageStats[stat].max = statData.ranges[season].max;
                }

                if (parameters.averageStats[stat].min < statData.ranges[season].min ||
                    parameters.averageStats[stat].min === statData.ranges[oldValue].min
                ){
                    parameters.averageStats[stat].min = statData.ranges[season].min;
                }

            }

            //same as above but for aggregate stats
            for (let stat in parameters.aggregateStats){

                let statData = this._referenceData.statsReferenceData[stat];

                if (
                    parameters.aggregateStats[stat].max > statData.ranges_agg[season].max ||
                    parameters.aggregateStats[stat].max === statData.ranges_agg[oldValue].max
                ){
                    parameters.aggregateStats[stat].max = statData.ranges_agg[season].max;
                }

                if (parameters.aggregateStats[stat].min < statData.ranges_agg[season].min ||
                    parameters.aggregateStats[stat].min === statData.ranges_agg[oldValue].min
                ){
                    parameters.aggregateStats[stat].min = statData.ranges_agg[season].min;
                }

            }

        }

        this.setState({
            parameters: parameters
        });

        this.props.setQuery({
            parameters: parameters
        }, 'replaceIn');

        if (key === "season" && this._firstSearchMade && this.state.searchResults.length > 0){
            this.getSearchResults();
        }

    };


    handleIncludeEuropeanCompetitionsClick = () => {

        let parameters = this.state.parameters;

        parameters.includeEuropeanCompetitions = !parameters.includeEuropeanCompetitions;

        this.setState({
            parameters: parameters
        });

        this.props.setQuery({
            parameters: parameters
        }, 'replaceIn');

        if (this._firstSearchMade && this.state.searchResults.length > 0){
            this.getSearchResults();
        }

    };


    handleRangeSliderChange = (key, values) => {

        let parameters = this.state.parameters;

        set(parameters, `${key}.min`, values[0]);
        set(parameters, `${key}.max`, values[1]);

        this.setState({
            parameters: parameters
        });

        this.props.setQuery({
            parameters: parameters
        }, 'replaceIn');

    };


    handleSelectListAdd = (key, value) => {

        let parameters = this.state.parameters;

        parameters[`${key}`].push(value);

        this.setState({
            parameters: parameters
        });

        this.props.setQuery({
            parameters: parameters
        }, 'replaceIn');

        if (key === "positions"){
            this.buildPercentileRankSelectList();
        }
        else if (key === "leagues"){
            this.buildClubsSelectList();
        }

    };


    handleSelectListRemove = (key, value) => {

        let parameters = this.state.parameters;

        let index = parameters[`${key}`].indexOf(value);
        if (index > -1) {
            parameters[`${key}`].splice(index, 1);
        }

        this.setState({
            parameters: parameters
        });

        this.props.setQuery({
            parameters: parameters
        }, 'replaceIn');

        if (key === "positions"){
            this.buildPercentileRankSelectList()
        }
        else if (key === "leagues"){
            this.buildClubsSelectList();
        }

    };


    handleSelectListClear = (key) => {

        let parameters = this.state.parameters;

        parameters[key] = [];

        this.setState({
            parameters: parameters
        });

        this.props.setQuery({
            parameters: parameters
        }, 'replaceIn');

        if (key === "positions"){
            this.buildPercentileRankSelectList()
        }
        else if (key === "leagues"){
            this.buildClubsSelectList();
        }

    };


    buildPercentileRankSelectList = () => {

        let filterOptions = this.state.filterOptions;
        let parameters = this.state.parameters;

        if (parameters.positions.length !== 1){

            filterOptions.percentileRanks = [];

            this.setState({
                filterOptions: filterOptions
            });

        }
        else {

            let percentileRankOptions = [];

            let position = parameters.positions[0];

            for (let i=0; i<this._statsReferenceDataArraySorted.length; i++){

                let stat = this._statsReferenceDataArraySorted[i].stat;

                let statData = this._referenceData.statsReferenceData[stat];

                if (!this._referenceData.statsByPosition[position].includes(stat)){

                    if (parameters.percentileRanks.hasOwnProperty(stat)){
                        delete parameters.percentileRanks[stat];
                    }

                    continue;
                }

                percentileRankOptions.push(
                    <Option
                        key={stat}
                        value={stat}
                    >
                        {`${statData.label} ${statData.suffix}`}
                    </Option>
                )

            }

            filterOptions.percentileRanks = percentileRankOptions;

            this.setState({
                filterOptions: filterOptions,
                parameters: parameters
            });

            this.props.setQuery({
                parameters: parameters
            }, 'replaceIn');

        }

    };


    buildClubsSelectList = () => {

        let parameters = this.state.parameters;
        let filterOptions = this.state.filterOptions;

        let selectedLeagues = parameters.leagues;

        let clubsReferenceData = this._referenceData.clubs;

        let eligibleClubs;

        if (selectedLeagues.length === 0){
            eligibleClubs = clubsReferenceData
                .map(x => x.name);
        }
        else {
            eligibleClubs = clubsReferenceData
                .filter(x => selectedLeagues.includes(x.countryCode))
                .map(x => x.name);
        }

        let clubsOptions = [];
        for (let i=0; i<clubsReferenceData.length; i++){

            let club = clubsReferenceData[i];

            if (!eligibleClubs.includes(club.name)){
                continue;
            }

            clubsOptions.push(
                <Option
                    key={club.name}
                    value={club.name}
                >
                    {club.name}
                </Option>
            )

        }
        filterOptions.clubs = clubsOptions;

        parameters.clubs = parameters.clubs.filter(x => eligibleClubs.includes(x));

        this.setState({
            filterOptions: filterOptions,
            parameters: parameters
        });

        this.props.setQuery({
            parameters: parameters
        }, 'replaceIn');

    };


    handleLookupStatSelectListAdd = (parametersKey, stat) => {

        let parameters = this.state.parameters;

        let season = parameters.season;
        let referenceData = this._referenceData.statsReferenceData[stat];

        let rangesKey = parametersKey === "averageStats" ? "ranges" : "ranges_agg";

        let min = parametersKey === "percentileRanks" ? 0 : referenceData[rangesKey][season].min;
        let max = parametersKey === "percentileRanks" ? 100 : referenceData[rangesKey][season].max;

        parameters[`${parametersKey}`][stat] = {
            min: min,
            max: max,
        };

        this.setState({
            parameters: parameters
        });

        this.props.setQuery({
            parameters: parameters
        }, 'replaceIn');

    };


    handleLookupStatSelectListRemove = (parametersKey, stat) => {

        let parameters = this.state.parameters;

        delete parameters[parametersKey][stat];

        this.setState({
            parameters: parameters
        });

        this.props.setQuery({
            parameters: parameters
        }, 'replaceIn');

    };


    handleLookupStatsSelectListClear = (key) => {

        let parameters = this.state.parameters;

        for (let stat in parameters[key]){
            if (stat !== "minutes"){
                delete parameters[key][stat];
            }
        }

        this.setState({
            parameters: parameters
        });

        this.props.setQuery({
            parameters: parameters
        }, 'replaceIn');

    };


    resetParameters = () => {

        let parametersOriginalState = JSON.parse(JSON.stringify(this._parametersOriginalState));

        this.setState({
            parameters: parametersOriginalState,
            searchResults: [],
            searchResultsDisplay: null
        }, () => {

            this._firstSearchMade = false;

            this.props.setQuery({
                parameters: parametersOriginalState
            }, 'replaceIn');

            this.buildClubsSelectList();

        });

    };


    /**
     * Called just before the component un-mounts
     */
    componentWillUnmount() {
        this._isMounted = false;
    }


    tooltipFormatter = (value, min, max) => {

        if (value === min)
            return "min";

        else if (value === max)
            return "max";

        else
            return value;

    };



    /**
     * render function
     * @return {*} - JSX code for the search page
     */
    render() {

        let {
            isLoading,
            error,
            showSearchLoaderOverlay,
            showExplanationOverlay,
            filterOptions,
            parameters,
            searchResults,
            displayType,
            searchResultsDisplay
        } = this.state;

        //display loading spinner while the server responds to POST request for the reference data
        if (isLoading) {
            return (
                <LoadingSpinner/>
            )
        }

        //display the error message screen if an error is caught
        else if (error !== null) {
            return (
                <div id="main">
                    <SearchBar
                        isMobile={this.isMobile}
                        page="search"
                        query={this.state.query}
                    />
                    <div className="screen" id="error-screen">
                        <p>{error.message}</p>
                    </div>
                </div>
            )
        }

        //build search page otherwise
        else {

            let season = parameters.season;

            let aggregateStatSliders = [];
            for (let stat in parameters.aggregateStats){

                if (stat === "minutes"){
                    continue;
                }

                let statData = this._referenceData.statsReferenceData[stat];

                aggregateStatSliders.push(
                    <h4 key={statData.key}>{`${statData.label}`}</h4>
                );

                aggregateStatSliders.push(
                    <Slider
                        key={`aggregateStatSlider-${stat}`}
                        range={true}
                        value={[parameters.aggregateStats[stat].min, parameters.aggregateStats[stat].max]}
                        min={statData.ranges_agg[season].min}
                        max={statData.ranges_agg[season].max + 0.0001}
                        step={statData.step_agg}
                        onChange={(values) => this.handleRangeSliderChange(`aggregateStats.${stat}`, values)}
                    />
                );

            }


            let averageStatsSliders = [];
            for (let stat in parameters.averageStats){

                let statData = this._referenceData.statsReferenceData[stat];

                averageStatsSliders.push(
                    <h4 key={statData.key}>{`${statData.label} ${statData.suffix}`}</h4>
                );

                averageStatsSliders.push(
                    <Slider
                        key={`averageStatslider-${stat}`}
                        range={true}
                        value={[parameters.averageStats[stat].min, parameters.averageStats[stat].max]}
                        min={statData.ranges[season].min}
                        max={statData.ranges[season].max + 0.0001}
                        step={statData.step}
                        onChange={(values) => this.handleRangeSliderChange(`averageStats.${stat}`, values)}
                        tipFormatter={value => {return this.tooltipFormatter(value, statData.ranges[season].min, statData.ranges[season].max)}}
                    />
                );

            }

            let percentileRanksSliders = [];
            for (let stat in parameters.percentileRanks){

                let statData = this._referenceData.statsReferenceData[stat];

                percentileRanksSliders.push(
                    <h4 key={statData.key}>{`${statData.label} ${statData.suffix}`}</h4>
                );

                percentileRanksSliders.push(
                    <Slider
                        key={`percentileRanksSlider-${stat}`}
                        disabled={parameters.positions.length !== 1}
                        range={true}
                        value={[parameters.percentileRanks[stat].min, parameters.percentileRanks[stat].max]}
                        min={0}
                        max={season === null ? 0 : 100}
                        step={5}
                        onChange={(values) => this.handleRangeSliderChange(`percentileRanks.${stat}`, values)}
                    />
                );

            }

            let minutesReferenceData = this._referenceData.statsReferenceData["minutes"];

            //return JSX code for the search page
            return (
                <div id="main">
                    <LoaderOverlay
                        display={showSearchLoaderOverlay}
                    />
                    <ExplanationOverlay
                        display={showExplanationOverlay}
                        toggleExplanationOverlay={this.toggleExplanationOverlay}
                    />
                    <SearchBar
                        isMobile={this.isMobile}
                        page="search"
                        query={this.state.query}
                    />
                    <div className="screen" id="search-screen">
                        <div className="filter" id="advanced-search-filters">
                            <div className="filter-inputs search-filter-inputs" id="advanced-search-filter-inputs">
                                <button className="fas fa-question-circle explanation-button" onClick={this.toggleExplanationOverlay}/>
                                <h4 style={{'display': this.isMobile ? "none" : "block"}}>Results Display</h4>
                                <div style={{'display': this.isMobile ? "none" : "block"}} id="display-type-buttons-container">
                                    <button
                                        className={`fas fa-th display-type-button ${displayType === "cards" ? "selected" : null}`}
                                        onClick={this.handleCardsButtonClick}
                                    />
                                    │
                                    <button
                                        className={`fas fa-table display-type-button ${displayType === "table" ? "selected" : null}`}
                                        onClick={this.handleTableButtonClick}
                                    />
                                </div>
                                <h4>Season</h4>
                                <Select
                                    value={parameters.season}
                                    placeholder={"Select a season"}
                                    style={{ width: '100%' }}
                                    onChange={(val) => this.handleSingleSelectChange("season", val)}
                                >
                                    {filterOptions.seasons}
                                </Select>
                                <label
                                    className={`${parameters.includeEuropeanCompetitions ? "selected-label" : null} selectable-label`}
                                    key={'includeEuropeanCompetitionsCheckbox'}
                                >
                                    <input className=""
                                           type="checkbox"
                                           value={"Include European Competitions"}
                                           onChange={this.handleIncludeEuropeanCompetitionsClick}
                                           checked={parameters.includeEuropeanCompetitions}
                                    /> <b>Include CL/EL Stats?</b>
                                </label>
                                <Collapsible
                                    open={!this.isMobile}
                                    trigger="Metadata"
                                    className="filter-headers"
                                    transitionTime={200}
                                    transitionCloseTime={200}
                                >
                                    <h4>Current Age</h4>
                                    <Slider
                                        value={[parameters.ages.min, parameters.ages.max]}
                                        range={true}
                                        defaultValue={[filterOptions.ages.min, filterOptions.ages.max]}
                                        min={filterOptions.ages.min}
                                        max={filterOptions.ages.max}
                                        onChange={(values) => this.handleRangeSliderChange("ages", values)}
                                    />
                                    <h4>Minutes</h4>
                                    <Slider
                                        key={`averageStatslider-minutes`}
                                        range={true}
                                        value={[parameters.aggregateStats["minutes"].min, parameters.aggregateStats["minutes"].max]}
                                        min={minutesReferenceData.ranges_agg[season].min}
                                        max={minutesReferenceData.ranges_agg[season].max + 0.0001}
                                        step={minutesReferenceData.step_agg}
                                        onChange={(values) => this.handleRangeSliderChange(`aggregateStats.minutes`, values)}
                                    />
                                    <h4>Nationalities</h4>
                                    <Select
                                        value={parameters.nationalities.map(x => x)}
                                        placeholder={"Select nationalities"}
                                        style={{ width: '100%' }}
                                        mode={"multiple"}
                                        allowClear={true}
                                        onSelect={(val) => this.handleSelectListAdd("nationalities", val)}
                                        onDeselect={(val) => this.handleSelectListRemove("nationalities", val)}
                                        onClear={() => this.handleSelectListClear("nationalities")}
                                        filterOption={(input, option) =>
                                            option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                        }
                                    >
                                        {filterOptions.nationalities}
                                    </Select>
                                    <h4>Leagues</h4>
                                    <Tooltip
                                        title={"Select a season to use this filter"}
                                        overlayClassName={parameters.season !== null ? "hideTooltip" : null}
                                    >
                                        <Select
                                            value={parameters.leagues.map(x => x)}
                                            placeholder={"Select leagues"}
                                            style={{ width: '100%' }}
                                            mode={"multiple"}
                                            allowClear={true}
                                            onSelect={(val) => this.handleSelectListAdd("leagues", val)}
                                            onDeselect={(val) => this.handleSelectListRemove("leagues", val)}
                                            onClear={() => this.handleSelectListClear("leagues")}
                                            filterOption={(input, option) =>
                                                option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                            }
                                        >
                                            {filterOptions.leagues}
                                        </Select>
                                    </Tooltip>
                                    <h4>Clubs</h4>
                                    <Tooltip
                                        title={"Select a season to use this filter"}
                                        overlayClassName={parameters.season !== null ? "hideTooltip" : null}
                                    >
                                        <Select
                                            value={parameters.clubs.map(x => x)}
                                            placeholder={"Select clubs"}
                                            style={{ width: '100%' }}
                                            disabled={parameters.season === null}
                                            mode={"multiple"}
                                            allowClear={true}
                                            onSelect={(val) => this.handleSelectListAdd("clubs", val)}
                                            onDeselect={(val) => this.handleSelectListRemove("clubs", val)}
                                            onClear={() => this.handleSelectListClear("clubs")}
                                            filterOption={(input, option) =>
                                                option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                            }
                                        >
                                            {filterOptions.clubs}
                                        </Select>
                                    </Tooltip>
                                    <h4>Positions</h4>
                                    <Tooltip
                                        title={"Select a season to use this filter"}
                                        overlayClassName={parameters.season !== null ? "hideTooltip" : null}
                                    >
                                        <Select
                                            value={parameters.positions.map(x => x)}
                                            placeholder={"Select positions"}
                                            style={{ width: '100%' }}
                                            disabled={parameters.season === null}
                                            mode={"multiple"}
                                            allowClear={true}
                                            onSelect={(val) => this.handleSelectListAdd("positions", val)}
                                            onDeselect={(val) => this.handleSelectListRemove("positions", val)}
                                            onClear={() => this.handleSelectListClear("positions")}
                                            filterOption={(input, option) =>
                                                option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                            }
                                        >
                                            {filterOptions.positions}
                                        </Select>
                                    </Tooltip>
                                </Collapsible>
                                <Collapsible
                                    open={!this.isMobile}
                                    trigger="Totals"
                                    className="filter-headers"
                                    transitionTime={200}
                                    transitionCloseTime={200}
                                >
                                    <Tooltip
                                        title={"Select a season to use this filter"}
                                        overlayClassName={parameters.season !== null ? "hideTooltip" : null}
                                    >
                                        <Select
                                            value={Object.keys(parameters.aggregateStats).filter(i => i !== "minutes")}
                                            placeholder={"Select stats to add range sliders"}
                                            style={{ width: '100%' }}
                                            disabled={parameters.season === null}
                                            mode={"multiple"}
                                            allowClear={true}
                                            onSelect={(val) => this.handleLookupStatSelectListAdd("aggregateStats", val)}
                                            onDeselect={(val) => this.handleLookupStatSelectListRemove("aggregateStats", val)}
                                            onClear={() => this.handleLookupStatsSelectListClear("aggregateStats")}
                                            filterOption={(input, option) =>
                                                option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                            }
                                        >
                                            {filterOptions.aggregateStats}
                                        </Select>
                                    </Tooltip>
                                    {aggregateStatSliders}
                                </Collapsible>
                                <Collapsible
                                    open={!this.isMobile}
                                    trigger="Averages"
                                    className="filter-headers"
                                    transitionTime={200}
                                    transitionCloseTime={200}
                                >
                                    <Tooltip
                                        title={"Select a season to use this filter"}
                                        overlayClassName={parameters.season !== null ? "hideTooltip" : null}
                                    >
                                        <Select
                                            value={Object.keys(parameters.averageStats)}
                                            placeholder={"Select stats to add range sliders"}
                                            style={{ width: '100%' }}
                                            disabled={parameters.season === null}
                                            mode={"multiple"}
                                            allowClear={true}
                                            onSelect={(val) => this.handleLookupStatSelectListAdd("averageStats", val)}
                                            onDeselect={(val) => this.handleLookupStatSelectListRemove("averageStats", val)}
                                            onClear={() => this.handleLookupStatsSelectListClear("averageStats")}
                                            filterOption={(input, option) =>
                                                option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                            }
                                        >
                                            {filterOptions.averageStats}
                                        </Select>
                                    </Tooltip>
                                    {averageStatsSliders}
                                </Collapsible>
                                <Collapsible
                                    open={!this.isMobile}
                                    trigger="Percentile Ranks"
                                    className="filter-headers"
                                    transitionTime={200}
                                    transitionCloseTime={200}
                                >
                                    <Tooltip
                                        title={parameters.season === null ? "Select a season to use this filter" : "Select exactly one position to use this filter"}
                                        overlayClassName={parameters.season !== null && parameters.positions.length === 1 ? "hideTooltip" : null}
                                    >
                                        <Select
                                            value={Object.keys(parameters.percentileRanks)}
                                            placeholder={"Select stats to add range sliders"}
                                            style={{ width: '100%' }}
                                            disabled={parameters.season === null || parameters.positions.length !== 1}
                                            mode={"multiple"}
                                            allowClear={true}
                                            onSelect={(val) => this.handleLookupStatSelectListAdd("percentileRanks", val)}
                                            onDeselect={(val) => this.handleLookupStatSelectListRemove("percentileRanks", val)}
                                            onClear={() => this.handleLookupStatsSelectListClear("percentileRanks")}
                                            filterOption={(input, option) =>
                                                option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                            }
                                        >
                                            {filterOptions.percentileRanks}
                                        </Select>
                                    </Tooltip>
                                    {percentileRanksSliders}
                                </Collapsible>
                            </div>
                            <div className="filter-buttons" id="advanced-search-filter-buttons">
                                <div className="filter-button">
                                    <button id="reset-filters-button" type="button" onClick={this.resetParameters}>Reset</button>
                                </div>
                                <div className="filter-button">
                                    <button id="search-button" type="button" onClick={this.getSearchResults}>Search</button>
                                </div>
                            </div>
                        </div>
                        <div className={`result ${displayType === "cards" ? "scrollable" : null}`} id="search-results">
                            {
                                searchResults.length > 0 ?
                                <p style={{marginLeft: '0px', lineHeight: '1.3'}}>
                                    Season: {parameters.season.replace("-", "/")} | {parameters.includeEuropeanCompetitions ? 'League + CL/EL Stats' : 'League Stats Only'}
                                    <br/>
                                    Data Sources: FBref.com & StatsBomb | Last Updated: {dateFormat(searchResults[0].lastUpdated, "dd/mm/yyyy, h:MM TT", true)} UTC
                                </p> :
                                null
                            }
                            {searchResults.length === 0 && this._firstSearchMade ? <p>No results found</p> : null}
                            {searchResultsDisplay}
                        </div>
                    </div>
                </div>
            );

        }

    }

}

export default withQueryParams({
    parameters: JsonParam
}, withRouter(AdvancedSearch));

