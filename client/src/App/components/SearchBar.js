import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import OutsideClickHandler from 'react-outside-click-handler';

//import components
import PlayerSearchResult from "./PlayerSearchResult";
import ClubSearchResult from "./ClubSearchResult";
import $ from "jquery";


/**
 * Component to render a div containing a searchbar
 * Also handles the live search requests and aborts
 */
class SearchBar extends Component {

    //class variable to track if the component is mounted
    _isMounted = false;
    _firstRequest = true;

    constructor(props) {

        super(props);

        this.page = this.props.page;
        this.isMobile = this.props.isMobile;
        this.currentPlayerCode = this.props.currentPlayerCode;
        this.liveSearchEnabled = true;

        //try to create the abort controller for live search requests
        //AbortController is relatively new, so we catch an error and disable live search if it is undefined
        try {
            this.controller = new AbortController();
            // throw new Error("ERROR");
        }
        catch (e) {
            this.liveSearchEnabled = false;
        }

        //change the searchbar container id based on the page so that the CSS rules modify it accordingly
        this.containerID = "";
        switch (this.page) {
            case "search":
                this.containerID = "searchbar-container2";
                break;
            case "stats":
                this.containerID = "searchbar-container3";
                break;
            default:
                this.containerID = "searchbar-container1";
        }

        //attach a home button to the searchbar if it is not being displayed on the homepage or the compare dialog
        this.displayHomeButton = 'default';
        if (this.page === "home" || this.page === "compare"){
            this.displayHomeButton = 'none';
        }

        this.state = {
            query: this.props.query || "",
            isLoading: false,
            error: null,
            liveResultsOpen: false,
            playerSearchResults: [],
            clubSearchResults: [],
        };

    }


    /**
     * Called after component has mounted
     */
    componentDidMount() {
        this._isMounted = true;
    }


    /**
     * Function to send a post request to the server to retrieve the search results matching the query
     */
    getSearchResults = (query) => {

        //create a new abort controller for every request and retrieve its signal
        let signal = null;
        if (this.liveSearchEnabled){
            this.controller = new AbortController();
            signal = this.controller.signal;
        }

        return new Promise((resolve, reject) => {
            //fetch search results
            //pass signal to the fetch request so it can be cancelled
            //this is done with live searches to cancel the previous request every time a new letter is typed
            fetch('/api/search', {
                signal,
                method: 'post',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "query": query,
                    "type": "playersAndClubs",
                    "isLive": true
                })
            })
                .then(res => {
                    if (res.ok) {
                        return res.json()
                    }
                    else {
                        throw new Error("Failed to fetch search results. Please refresh the page and try again.")
                    }
                },
                    () => {
                        reject()
                    })
                .then(searchResults => {
                    resolve(searchResults);
                })
                .catch(error => {
                    reject(error);
                });
        })

    };


    /**
     * Called just before the component un-mounts
     */
    componentWillUnmount() {
        this._isMounted = false;
    }


    /**
     * Function to handle an input to the searchbar if live search is NOT enabled
     * Updates searchbar input value
     * @param {Object} event - the input event from the searchbar input
     */
    handleChange = (event) => {

        this.setState({
            query: event.target.value,
        });

    };


    /**
     * Function to handle an input to the searchbar if live search is enabled
     * Updates searchbar input value, fetches search results and sets state
     * @param {Object} event - the input event from the searchbar input
     */
    handleChangeLive = (event) => {

        let query = event.target.value;

        //cancel previous request if it's not the first request
        if (this._firstRequest){
            this._firstRequest = false;
        }
        else {
            this.controller.abort();
        }

        //set searchbar input value and open live search results container
        this.setState({
            query: query,
            liveResultsOpen: query.length > 0,
            isLoading: true
        });

        this.updateLiveSearchResults(query);

    };


    /**
     * Function to update the arrays of search results
     * Also handles the display of the loading spinner and error messages (if applicable) in the live container
     */
    updateLiveSearchResults = (query) => {

        if (query.length > 0){
            this.getSearchResults(query)
                .then((searchResults) => {
                    let playerSearchResults = searchResults['playerSearchResults'];
                    let clubSearchResults = searchResults['clubSearchResults'];
                    if (this._isMounted){
                        this.setState({
                            playerSearchResults: [],
                            clubSearchResults: []
                        }, () => {
                            this.setState({
                                playerSearchResults: playerSearchResults,
                                clubSearchResults: clubSearchResults,
                                error: null,
                                isLoading: false
                            })
                        })
                    }
                }, (error) => {
                    if (this._isMounted){
                        if (error){
                            this.setState({
                                error: error,
                                isLoading: false
                            })
                        }
                    }
                })
        }
        else {
            if (this._isMounted){
                this.setState({
                    error: null,
                    isLoading: false,
                    playerSearchResults: [],
                    clubSearchResults: []
                })
            }
        }

    };


    /**
     * Function to handle the searchbar being focused
     * Displays the live search results on focus
     * @param {Object} event - the focus event from the searchbar input
     */
    handleFocus = (event) => {

        let query = event.target.value;
        if (this.isMobile && this.page === "home"){
            $("#searchbar-container1").css({
                "position": "fixed",
                "top": 0,
                "left": 0,
                "width": "100%",
                "z-index": 7
            });
            $("h1").css({
                "display": "none"
            })
        }
        this.setState({
            liveResultsOpen: this.liveSearchEnabled && query.length > 0
        })

    };

    /**
     * Function to handle the searchbar being blurred (un-focused)
     * hides the live search results
     */
    handleBlur = () => {

        if (this.isMobile && this.page === "home"){
            $("#searchbar-container1").css({
                "position": "relative",
                "width": '75%',
                "z-index": 1
            });
            $("h1").css({
                "display": "block"
            })
        }

        this.setState({
            liveResultsOpen: false
        })

    };


    /**
     * Function to handle submit events from the searchbar input if live search is NOT enabled
     * Redirects to the search URL with the correct URL params
     * @param {Object} event - the submit event from the searchbar input
     */
    handleSubmit = (event) => {

        event.preventDefault();

        if (this.page !== "compare"){
            this.props.history.push('/search/' + this.state.query);
        }
        else {

            let query = this.state.query;

            //open live search results container
            this.setState({
                liveResultsOpen: query.length > 0,
                isLoading: true
            });

            this.updateLiveSearchResults(query);

        }

    };


    /**
     * Function to handle submit events from the searchbar input if live search is enabled
     * Redirects to the search URL with the correct URL params
     * @param {Object} event - the submit event from the searchbar input
     */
    handleSubmitLive = (event) => {

        event.preventDefault();

        if (this.page !== "compare"){
            this.props.history.push('/search/' + this.state.query);
        }

    };


    /**
     * render function
     * modifies searchbar based on the page it is to be displayed on
     * @return {*} - JSX code for the searchbar and its container
     */
    render() {

        const {
            query,
            isLoading,
            liveResultsOpen,
            playerSearchResults,
            clubSearchResults
        } = this.state;

        //construct the player cards
        let playerCards = [];
        for (let i=0; i<playerSearchResults.length; i++){
            let current = playerSearchResults[i];
            playerCards.push(
                <PlayerSearchResult
                    page="live"
                    forComparison={this.page === "compare"}
                    comparisonCode={this.currentPlayerCode}
                    code={current.code}
                    name={current.name}
                    clubs={current.clubs}
                    nationality={current.nationality}
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
                    name={current}
                    key={i}
                />
            )
        }

        //return JSX code for the searchbar
        return (
            <div className="searchbar-container" id={this.containerID}>
                <Link id="home-button" to={'/'}>
                    <div style={{display: this.displayHomeButton}}>
                        <div>
                            Football
                            <span style={{color: '#e4c000', display: 'block'}}>
                                Slices
                                <span style={{color: 'black'}}>.com</span>
                            </span>
                        </div>
                    </div>
                </Link>
                <OutsideClickHandler
                    onOutsideClick={this.handleBlur}
                >
                    <form id="searchbar-form" onSubmit={this.liveSearchEnabled ? this.handleSubmitLive : this.handleSubmit}>
                        <input
                            type="text"
                            id="searchbar-input"
                            value={query}
                            placeholder={this.page === "compare" ? "Search for players..." : "Search for players, clubs..."}
                            autoComplete="off"
                            onChange={this.liveSearchEnabled ? this.handleChangeLive : this.handleChange}
                            onFocus={this.handleFocus}
                        />
                        <div id="live-search-results" style={{display: liveResultsOpen ? 'block' : 'none'}}>
                            <div id="live-search-loader">
                                <div style={{display: isLoading ? 'block' : 'none'}} className="loader">
                                    Loading...
                                </div>
                            </div>
                            <div>
                                <div>
                                    <h3>Players</h3>
                                    {playerCards}
                                    {playerCards.length === 0 ? <p>{isLoading ? "..." : " No results found"}</p> : null}
                                </div>
                                <div style={{display: this.page === "compare" ? 'none' : 'block'}}>
                                    <h3>Clubs</h3>
                                    {clubCards}
                                    {clubCards.length === 0 ? <p>{isLoading ? "..." : " No results found"}</p> : null}
                                </div>
                            </div>
                        </div>
                    </form>
                </OutsideClickHandler>
            </div>

        );

    }

}

export default withRouter (SearchBar);
