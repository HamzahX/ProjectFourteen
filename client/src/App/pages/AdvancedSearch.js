import React, {Component} from 'react';

//import lodash functions
import set from 'lodash.set';

//import components
import SearchBar from "../components/SearchBar";
import LoadingSpinner from "../components/LoadingSpinner";
import LoaderOverlay from "../components/LoaderOverlay";
import PlayerSearchResult from "../components/PlayerSearchResult";

//import antd components
import {Select, Slider} from 'antd';
const Option = Select.Option;


/**
 * Search page component
 */
class AdvancedSearch extends Component {

    //class variable to track if the component is mounted
    _isMounted = false;

    _referenceData = {};

    /**
     * Constructor
     * @param props
     */
    constructor(props){

        super(props);

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

        this.state = {

            isLoading: true,
            showSearchLoaderOverlay: false,
            error: null,

            selectLists: {
                seasons: seasonOptions,
                ages: {},
                nationalities: [],
                clubs: [],
                positions: positionsOptions,
                rawStats: [],
                percentileRanks: []
            },

            parameters: {
                season: null,
                ages: {},
                nationalities: [],
                clubs: [],
                positions: [],
                rawStats: {},
                percentileRanks: {}
            },

            searchResults: []

        };

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

        console.log(referenceData);

        let selectLists = this.state.selectLists;
        let parameters = this.state.parameters;

        let ageReferenceData = referenceData.statsReferenceData["age"];
        selectLists.ages = {
            min: ageReferenceData.ranges.min,
            max: ageReferenceData.ranges.max
        };

        parameters.ages = JSON.parse(JSON.stringify(selectLists.ages));

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
        selectLists.nationalities = nationalitiesOptions;

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
        selectLists.clubs = clubsOptions;

        let rawStatsOptions = [];
        for (let stat in referenceData.statsReferenceData){

            let statData = referenceData.statsReferenceData[stat];

            if (stat === "age"){
                continue;
            }

            rawStatsOptions.push(
                <Option
                    key={stat}
                    value={stat}
                >
                    {`${statData.label} ${statData.suffix}`}
                </Option>
            )

        }
        selectLists.rawStats = rawStatsOptions;

        if (this._isMounted){

            this.setState({
                error: null,
                isLoading: false,
                parameters: parameters,
                selectLists: selectLists
            });

            document.title = 'Advanced Search | Football Slices';

            this.props.recordPageViewGA(window.location.pathname);
        }

    };


    /**
     * Function to send a post request to the server to retrieve the search results matching the query
     */
    getSearchResults = () => {

        this.setState({
            showSearchLoaderOverlay: true,
        });

        let parameters = this.state.parameters;

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
        .then(searchResults => this.processSearchResults(searchResults))
        .catch(error => {
            if (this._isMounted){
                this.setState({error})
            }
        });

    };


    /**
     * Function to process the search results and save to state
     * @param {Object} searchResults - object containing search results
     */
    processSearchResults = (searchResults) => {

        if (this._isMounted){

            this.setState({
                searchResults: []
            }, () => {
                this.setState({
                    error: null,
                    showSearchLoaderOverlay: false,
                    searchResults: searchResults
                });
            });

        }

    };


    handleSingleSelectChange = (key, value) => {

        let parameters = this.state.parameters;

        parameters[key] = value;

        this.setState({
            parameters: parameters
        });

        console.log(this.state.parameters);

    };


    handleSelectListAdd = (key, value) => {

        let parameters = this.state.parameters;

        parameters[`${key}`].push(value);

        this.setState({
            parameters: parameters
        });

        if (key === "positions"){
            this.buildPercentileRankSelectList()
        }

        console.log(this.state.parameters);

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

        if (key === "positions"){
            this.buildPercentileRankSelectList()
        }

        console.log(this.state.parameters);

    };


    buildPercentileRankSelectList = () => {

        let parameters = this.state.parameters;
        let selectLists = this.state.selectLists;

        let percentileRankOptions = [];

        if (parameters.positions.length !== 1){

            selectLists.percentileRanks = percentileRankOptions;

            this.setState({
                selectLists: selectLists
            });

            return;
        }

        let position = parameters.positions[0];

        for (let stat in this._referenceData.statsReferenceData){

            let statData = this._referenceData.statsReferenceData[stat];

            if (!this._referenceData.statsByPosition[position].includes(stat)){
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
        selectLists.percentileRanks = percentileRankOptions;

        this.setState({
            selectLists: selectLists
        });

    };


    handleLookupStatAdd = (parametersKey, stat) => {

        let parameters = this.state.parameters;

        let season = this.state.parameters.season;
        let referenceData = this._referenceData.statsReferenceData[stat];

        parameters[`${parametersKey}`][stat] = {
            min: referenceData.ranges[season].min,
            max: referenceData.ranges[season].max,
        };

        this.setState({
            parameters: parameters
        });

        console.log(this.state.parameters);

    };


    handleLookupStatRemove = (parametersKey, stat) => {

        let parameters = this.state.parameters;

        delete parameters[parametersKey][stat];

        this.setState({
            parameters: parameters
        });

        console.log(this.state.parameters);

    };


    handleRangeSliderChange = (key, values) => {

        let parameters = this.state.parameters;

        set(parameters, `${key}.min`, values[0]);
        set(parameters, `${key}.max`, values[1]);

        this.setState({
            parameters: parameters
        });

        console.log(this.state.parameters);

    };


    /**
     * Called just before the component un-mounts
     */
    componentWillUnmount() {
        this._isMounted = false;
    }


    /**
     * render function
     * @return {*} - JSX code for the search page
     */
    render() {

        let {
            isLoading,
            showSearchLoaderOverlay,
            error,
            selectLists,
            parameters,
            searchResults
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

            let rawStatsSliders = [];
            for (let stat in parameters.rawStats){

                let statData = this._referenceData.statsReferenceData[stat];

                rawStatsSliders.push(
                    <h4>{`${statData.label} ${statData.suffix}`}</h4>
                );

                rawStatsSliders.push(
                    <Slider
                        key={`rawStatSlider-${stat}`}
                        range={true}
                        defaultValue={[parameters.rawStats[stat].min, parameters.rawStats[stat].max]}
                        min={season === null ? 0 : statData.ranges[season].min}
                        max={season === null ? 0 : statData.ranges[season].max}
                        step={statData.step}
                        onChange={(values) => this.handleRangeSliderChange(`rawStats.${stat}`, values)}
                    />
                );

            }

            let percentileRanksSliders = [];


            //construct the player cards
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
                        clubs={current.clubs}
                        nationality={current.nationality}
                        countryCode={current.countryCode}
                        positions={current.positions}
                        key={i}
                    />
                );
            }


            //return JSX code for the search page
            return (
                <div id="main">
                    <LoaderOverlay
                        isMobile={this.isMobile}
                        display={showSearchLoaderOverlay}
                    />
                    <SearchBar
                        isMobile={this.isMobile}
                        page="search"
                        query={this.state.query}
                    />
                    <div className="screen" id="search-screen">
                        <div className="filter" id="advanced-search-filters">
                            <div className="filter-inputs search-filter-inputs" id="advanced-search-filter-inputs">
                                <h3>Season</h3>
                                <Select
                                    placeholder={"Select a season"}
                                    style={{ width: '100%' }}
                                    onChange={(val) => this.handleSingleSelectChange("season", val)}
                                >
                                    {selectLists.seasons}
                                </Select>
                                <h3>Current Age</h3>
                                <Slider
                                    range={true}
                                    defaultValue={[selectLists.ages.min, selectLists.ages.max]}
                                    min={selectLists.ages.min}
                                    max={selectLists.ages.max}
                                    onChange={(values) => this.handleRangeSliderChange("ages", values)}
                                />
                                <h3>Nationalities</h3>
                                <Select
                                    placeholder={"Select nationalities"}
                                    style={{ width: '100%' }}
                                    mode={"multiple"}
                                    onSelect={(val) => this.handleSelectListAdd("nationalities", val)}
                                    onDeselect={(val) => this.handleSelectListRemove("nationalities", val)}
                                >
                                    {selectLists.nationalities}
                                </Select>
                                <h3>Clubs</h3>
                                <Select
                                    placeholder={"Select clubs"}
                                    style={{ width: '100%' }}
                                    disabled={parameters.season === null}
                                    mode={"multiple"}
                                    onSelect={(val) => this.handleSelectListAdd("clubs", val)}
                                    onDeselect={(val) => this.handleSelectListRemove("clubs", val)}
                                >
                                    {selectLists.clubs}
                                </Select>
                                <h3>Positions</h3>
                                <Select
                                    placeholder={"Select positions"}
                                    style={{ width: '100%' }}
                                    disabled={parameters.season === null}
                                    mode={"multiple"}
                                    onSelect={(val) => this.handleSelectListAdd("positions", val)}
                                    onDeselect={(val) => this.handleSelectListRemove("positions", val)}
                                >
                                    {selectLists.positions}
                                </Select>
                                <h3>Raw Stat Filters</h3>
                                <Select
                                    placeholder={"Select stats to add range filters"}
                                    style={{ width: '100%' }}
                                    disabled={parameters.season === null}
                                    mode={"multiple"}
                                    onSelect={(val) => this.handleLookupStatAdd("rawStats", val)}
                                    onDeselect={(val) => this.handleLookupStatRemove("rawStats", val)}
                                >
                                    {selectLists.rawStats}
                                </Select>
                                {rawStatsSliders}
                                <h3>Percentile Rank Filters</h3>
                                <Select
                                    placeholder={"Select stats to add range filters"}
                                    style={{ width: '100%' }}
                                    disabled={parameters.season === null}
                                    mode={"multiple"}
                                    onSelect={(val) => this.handleLookupStatAdd("percentileRanks", val)}
                                    onDeselect={(val) => this.handleLookupStatRemove("percentileRanks", val)}
                                >
                                    {selectLists.percentileRanks}
                                </Select>
                                {percentileRanksSliders}
                            </div>
                            <div className="filter-buttons" id="advanced-search-filter-buttons">
                                <div className="filter-button">
                                    <button id="reset-filters-button" type="button" onClick={this.resetParameters}>Reset All Filters</button>
                                </div>
                                <div className="filter-button">
                                    <button id="search-button" type="button" onClick={this.getSearchResults}>Search</button>
                                </div>
                            </div>
                        </div>
                        <div className="result" id="search-results">
                            {playerCards.length === 0 ? <p>No results found</p> : null}
                            <div id="player-search-results">
                                {playerCards}
                            </div>
                        </div>
                    </div>
                </div>
            );

        }

    }

}

export default AdvancedSearch;
