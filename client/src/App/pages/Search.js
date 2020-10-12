import React, { Component } from 'react';

//import components
import SearchBar from "../components/SearchBar";
import LoadingSpinner from "../components/LoadingSpinner";
import PlayerSearchResult from "../components/PlayerSearchResult";
import ClubSearchResult from "../components/ClubSearchResult";


/**
 * Search page component
 */
class Search extends Component {

    //class variable to track if the component is mounted
    _isMounted = false;

    /**
     * Constructor
     * @param props
     */
    constructor(props){

        super(props);

        this.isMobile = this.props.isMobile;

        this.state = {
            isLoading: true,
            error: null,
            query: props.match.params.query,
            searchByClub: props.match.params.searchByClub,
            playerSearchResults: [],
            filteredPlayerSearchResults: [],
            clubSearchResults: [],
            filterValue: ""
        };

        this.getSearchResults();

    }


    /**
     * Called after component has mounted
     */
    componentDidMount() {
        this._isMounted = true;
    }


    /**
     * Called just before the component receives new props. This is done to ensure that new props trigger a setState()
     * @param nextProps
     * @param nextContext
     */
    //TODO: re-factor because componentWillReceiveProps has been deprecated
    UNSAFE_componentWillReceiveProps(nextProps, nextContext) {

        let { query, searchByClub } = nextProps.match.params;

        this.setState({
            isLoading: true,
            query: query,
            searchByClub: searchByClub
        }, () => {
            this.getSearchResults();
        });

    }


    /**
     * Function to send a post request to the server to retrieve the search results matching the query
     */
    getSearchResults = () => {

        let searchByClub = this.state.searchByClub;
        let type = searchByClub === undefined ? "playersAndClubs" : "playersByClub";

        //retrieve search results
        fetch('/api/search', {
            method: 'post',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "query": this.state.query,
                "type": type
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
     * Function to process the search results and save to state
     * @param {Object} searchResults - object containing search results
     */
    processSearchResults = (searchResults) => {

        let playerSearchResults = searchResults['playerSearchResults'];
        let clubSearchResults = searchResults['clubSearchResults'];

        if (this._isMounted){

            this.setState({
                error: null,
                isLoading: false,
                playerSearchResults: playerSearchResults,
                filteredPlayerSearchResults: playerSearchResults,
                clubSearchResults: clubSearchResults,
            });

            document.title = "Search Results | Football Slices";

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
     * Function to filter player search results
     * @param {Object} event - the input event from the search result filter
     */
    filterByName = (event) => {

        //create a deep-copy of playerSearchResults to avoid modifying the original
        let playerSearchResults = JSON.parse(JSON.stringify(this.state.playerSearchResults));
        let filteredPlayerSearchResults = [];

        let input = "";
        if (event === null) {
            filteredPlayerSearchResults = playerSearchResults;
        }
        else {
            //retrieve the input text and remove diacritics
            input = event.target.value
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace("Ø", "O")
                .replace("ø", "o");
            for (let i=0; i<playerSearchResults.length; i++){
                //remove diacritics from each search result
                let name = playerSearchResults[i].name.normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace("Ø", "O")
                    .replace("ø", "o");
                //push matches to filteredSearchResults
                if (name.toUpperCase().includes(input.toUpperCase())){
                    filteredPlayerSearchResults.push(playerSearchResults[i]);
                }
            }
        }

        //set state by clearing filteredSearchResults first, and the re-populating it on callback
        this.setState({
            filteredPlayerSearchResults: [],
            filterValue: input
        }, () => {
            this.setState({
                filteredPlayerSearchResults: filteredPlayerSearchResults,
            })
        });

    };


    /**
     * render function
     * @return {*} - JSX code for the search page
     */
    render() {

        let {
            isLoading,
            error,
            filteredPlayerSearchResults,
            clubSearchResults,
            searchByClub,
            filterValue
        } = this.state;

        //display loading spinner while the server responds to POST request for the search results
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
            for (let i=0; i<filteredPlayerSearchResults.length; i++){
                let current = filteredPlayerSearchResults[i];
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

            //construct the club cards
            let clubCards = [];
            for (let i=0; i<clubSearchResults.length; i++){
                let current = clubSearchResults[i];
                clubCards.push(
                    <ClubSearchResult
                        isMobile={this.isMobile}
                        page="search"
                        name={current.name}
                        countryCode={current.countryCode}
                        key={i}
                    />
                )
            }

            //build header for search results
            let searchText;
            if (searchByClub === undefined){
                searchText = <h3>Search results for <br/>"{this.state.query}"</h3>;
            }
            else {
                searchText = <h3>Search results for <br/>"player.club[19-20] = {this.state.query}"</h3>;
            }

            //return JSX code for the search page
            return (
                <div id="main">
                    <SearchBar
                        isMobile={this.isMobile}
                        page="search"
                        query={this.state.query}
                    />
                    <div className="screen" id="search-screen">
                        <div className="filter" id="search-filters">
                            {searchText}
                            <br />
                            <div id="search-filter-inputs">
                                <input
                                    type="text"
                                    value={filterValue}
                                    placeholder={"Filter players by name"}
                                    onChange={this.filterByName}
                                />
                            </div>
                        </div>
                        <div className="result" id="search-results">
                            {searchByClub === undefined ? <h3>Players</h3> : null}
                            {playerCards.length === 0 && searchByClub === undefined ? <p>No results found</p> : null}
                            <div id="player-search-results">
                                {playerCards}
                            </div>
                            {searchByClub === undefined ? <h3 style={{marginTop: '20px'}}>Clubs</h3> : null}
                            {clubCards.length === 0 && searchByClub === undefined ? <p>No results found</p> : null}
                            <div id="club-search-results">
                                {clubCards}
                            </div>
                        </div>
                    </div>
                </div>
            );

        }

    }

}

export default Search;
