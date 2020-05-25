import React, { Component, Fragment } from 'react';
import { Link, withRouter } from 'react-router-dom';
import PlayerSearchResult from "./PlayerSearchResult";
import ClubSearchResult from "./ClubSearchResult";

var controller = new AbortController();
var { signal } = controller;

/**
 * Component to render a div containing a searchbar
 * Also handles the live search
 */
class SearchBar extends Component {

    //class variable to track if the component is mounted
    _isMounted = false;
    _firstRequest = true;

    constructor(props) {

        super(props);

        let page = this.props.page;

        //change the searchbar container id based on the page so that the CSS rules modify it accordingly
        this.containerID = "";
        switch (page) {
            case "home":
                this.containerID = "searchbar-container1";
                break;
            case "search":
                this.containerID = "searchbar-container2";
                break;
            case "stats":
                this.containerID = "searchbar-container3";
                break;
            default:
                this.containerID = "searchbar-container1";
        }

        //attach a home button to the searchbar if it is not being displayed on the homepage
        this.displayHomeButton = 'default';
        if (page === "home"){
            this.displayHomeButton = 'none';
        }

        this.state = {
            page: this.props.page,
            query: this.props.query || "",
            isLoading: false,
            error: null,
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

        controller = new AbortController();
        signal = controller.signal;

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
     * Function to handle an input to the searchbar
     * Updates searchbar input value, fetches search results and sets state
     * @param {Object} event - the input event from the searchbar input
     */
    handleChange = (event) => {

        let query = event.target.value;

        //cancel previous request if it's not the first request
        if (this._firstRequest){
            this._firstRequest = false;
        }
        else {
            controller.abort();
        }

        //set searchbar input value
        this.setState({
            query: query
        });

        // //update search results
        // if (query !== ""){
        //     this.getSearchResults(query)
        //     .then((searchResults) => {
        //         let playerSearchResults = searchResults['playerSearchResults'];
        //         let clubSearchResults = searchResults['clubSearchResults'];
        //         if (this._isMounted){
        //             this.setState({
        //                 error: null,
        //                 isLoading: false,
        //                 playerSearchResults: [],
        //                 clubSearchResults: []
        //             }, () => {
        //                 this.setState({
        //                     playerSearchResults: playerSearchResults,
        //                     clubSearchResults: clubSearchResults
        //                 })
        //             })
        //         }
        //     }, (error) => {
        //         if (this._isMounted){
        //             this.setState({
        //                 error, isLoading: false
        //             })
        //         }
        //     })
        // }
        // else {
        //     if (this._isMounted){
        //         this.setState({
        //             error: null,
        //             isLoading: false,
        //             playerSearchResults: [],
        //             clubSearchResults: []
        //         })
        //     }
        // }

    };


    /**
     * Function to handle submit events from the searchbar input
     * Redirects to the search URL with the correct URL params
     * @param {Object} event - the submit event from the searchbar input
     */
    handleSubmit = (event) => {
        event.preventDefault();
        this.props.history.push('/search/' + this.state.query);
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
            error,
            playerSearchResults,
            clubSearchResults
        } = this.state;

        //construct the player cards
        let playerCards = [];
        for (let i=0; i<playerSearchResults.length; i++){
            let current = playerSearchResults[i];
            playerCards.push(
                <PlayerSearchResult
                    page="search"
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

            <Fragment>
                <div className="searchbar-container" id={this.containerID}>
                    <form id="searchbar-form" onSubmit={this.handleSubmit}>
                        <Link to={'/'}>
                            <div id="home-button" style={{display: this.displayHomeButton}}>
                                <div>
                                    Football
                                    <span style={{color: '#e4c000', display: 'block'}}>Slices
                            <span style={{color: 'black'}}>.com</span></span>
                                </div>
                            </div>
                        </Link>
                        <input
                            type="text"
                            id="searchbar-input"
                            value={query}
                            placeholder="Search for players, clubs..."
                            autoComplete="off"
                            onChange={this.handleChange}
                        />
                    </form>
                </div>
                {/*<div id="live-search-results">*/}
                {/*    {playerCards}*/}
                {/*    {clubCards}*/}
                {/*</div>*/}
            </Fragment>

        );

    }

}

export default withRouter (SearchBar);
