import React, { Component } from 'react';

//import components
import SearchBar from "../components/SearchBar";
import LoadingSpinner from "../components/LoadingSpinner";
import LoaderOverlay from "../components/LoaderOverlay";
import PlayerSearchResult from "../components/PlayerSearchResult";

import { Select } from 'antd';

const Option = Select.Option;


/**
 * Search page component
 */
class AdvancedSearch extends Component {

    //class variable to track if the component is mounted
    _isMounted = false;

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

        this.state = {

            isLoading: true,
            showSearchLoaderOverlay: false,
            error: null,

            selectLists: {
                seasons: seasonOptions,
                currentAges: {},
                nationalities: {},
                clubs: {},
                positions: {
                    "FW": "Forward",
                    "AM": "Attacking Midfielder / Winger",
                    "CM": "Central / Defensive Midfielder",
                    "FB": "Full-back",
                    "CB": "Center-back",
                    "GK": "Goalkeeper"
                },
                rawStats: {},
                percentileRanks: {}
            },

            parameters: {
                season: null,
                currentAge: {
                    min: null,
                    max: null
                },
                nationalities: [],
                seasonAge: {
                    min: null,
                    max: null
                },
                clubs: [],
                positions: [],
                rawStats: [],
                percentileRanks: []
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
     * Function to send a post request to the server to retrieve the search results matching the query
     */
    getSearchResults = () => {

        this.setState({
            showSearchLoaderOverlay: false
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
                this.setState({error, isLoading: false})
            }
        });

    };


    /**
     * Function to process the reference data and save to state
     * @param {Object} referenceData - object containing reference data
     */
    processReferenceData = (referenceData) => {

        console.log(referenceData);

        if (this._isMounted){

            this.setState({
                error: null,
                isLoading: false,
                //selectLists: selectLists
            });

            document.title = 'Advanced Search | Football Slices';

            this.props.recordPageViewGA(window.location.pathname);
        }

    };


    /**
     * Function to process the search results and save to state
     * @param {Object} searchResults - object containing search results
     */
    processSearchResults = (searchResults) => {

        if (this._isMounted){

            this.setState({
                error: null,
                showSearchLoaderOverlay: false,
                searchResults: searchResults
            });

        }

    };


    handleSeasonChange = (value) => {

        let parameters = this.state.parameters;

        parameters.season = value;

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
                                <Select
                                    placeholder={"Select a season"}
                                    style={{ width: '100%' }}
                                    onChange={this.handleSeasonChange}
                                >
                                    {selectLists.seasons}
                                </Select>
                            </div>
                            <div className="filter-buttons" id="advanced-search-filter-buttons">
                                <div className="filter-button">
                                    <button id="reset-filters-button" type="button">Reset All Filters</button>
                                </div>
                                <div className="filter-button">
                                    <button id="search-button" type="button">Search</button>
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
