import React, { Component } from 'react';

import SearchBar from "../components/SearchBar";
import LoadingSpinner from "../components/LoadingSpinner";
import PlayerSearchResult from "../components/PlayerSearchResult";

import ClubSearchResult from "../components/ClubSearchResult";


class Search extends Component {

    _isMounted = false;

    constructor(props){
        super(props);
        let query = props.match.params.query;
        let searchByClub = props.match.params.searchByClub;
        this.state = {
            isLoading: false,
            error: null,
            query: query,
            searchByClub: searchByClub,
            playerSearchResults: [],
            filteredPlayerSearchResults: [],
            openMenu: false,
            clubSearchResults: [],
            filterValue: ""
            // reactSelectStyle: {
            //     control: (base) => ({
            //         ...base,
            //         boxShadow: "none",
            //         '&:hover': {
            //             borderColor: '#B23535'
            //         },
            //         '&:focus': {
            //             borderColor: '#B23535'
            //         },
            //     })
            // },
            // reactSelectTheme: theme => ({
            //     ...theme,
            //     colors: {
            //         ...theme.colors,
            //         primary25: "pink",
            //         primary: "#e75453"
            //     }
            // })
        };

    }

    componentDidMount() {

        this._isMounted = true;

        this.setState({
            isLoading: true
        }, () => {
            this.getSearchResults();
        });
    }

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


    getSearchResults = () => {

        let searchByClub = this.state.searchByClub;
        let type;
        if (searchByClub === undefined){
            type = "playersAndClubs"
        }
        else {
            type = "playersByClub"
        }
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
               throw new Error("No results found")
            }
        })
        .then(searchResults => this.processSearchResults(searchResults))
        .catch(error => this.setState({error, isLoading: false}));

    };

    processSearchResults = (searchResults) => {

        let playerSearchResults = searchResults['playerSearchResults'];
        let clubSearchResults = searchResults['clubSearchResults'];

        if (this._isMounted){
            this.setState({
                isLoading: false,
                playerSearchResults: playerSearchResults,
                filteredPlayerSearchResults: playerSearchResults,
                clubSearchResults: clubSearchResults,
                error: null
            })
        }
    };

    componentWillUnmount() {
        this._isMounted = false;
    }

    filterByName = (event) => {

        let playerSearchResults = JSON.parse(JSON.stringify(this.state.playerSearchResults));
        let filteredPlayerSearchResults = [];

        let input;
        if (event === null) {
            filteredPlayerSearchResults = playerSearchResults;
        }
        else {
            input = event.target.value
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace("Ø", "O")
                .replace("ø", "o");
            for (let i=0; i<playerSearchResults.length; i++){
                let name = playerSearchResults[i].name.normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace("Ø", "O")
                    .replace("ø", "o");
                if (name.toUpperCase().includes(input.toUpperCase())){
                    filteredPlayerSearchResults.push(playerSearchResults[i]);
                }
            }
        }

        this.setState({
            filteredPlayerSearchResults: []
        }, () => {
            this.setState({
                filteredPlayerSearchResults: filteredPlayerSearchResults,
                filterValue: input
            })
        });

    };

    render() {

        let {
            error,
            isLoading,
            filteredPlayerSearchResults,
            clubSearchResults,
            searchByClub,
            filterValue
        } = this.state;

        if (isLoading) {
            return (
                <LoadingSpinner/>
            )
        }

        else if (error !== null) {
            return (
                <div id="main">
                    <SearchBar type={1} query={this.state.query}/>
                    <div className="screen" id="error-screen">
                        <p>{error.message}</p>
                    </div>
                </div>
            )
        }

        else {

            let playerCards = [];
            for (let i=0; i<filteredPlayerSearchResults.length; i++){
                let current = filteredPlayerSearchResults[i];
                playerCards.push(
                    <PlayerSearchResult
                        page={"search"}
                        code={current.code}
                        name={current.name}
                        clubs={current.clubs}
                        nationality={current.nationality}
                        key={i}
                    />
                );
            }

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


            let searchText;
            if (searchByClub === undefined){
                searchText = <h3>Search results for <br/>"{this.state.query}"</h3>;
            }
            else {
                searchText = <h3>Search results for <br/>"player.club = {this.state.query}"</h3>;
            }

            return (
                <div id="main">
                    <SearchBar type={1} query={this.state.query}/>
                    <div className="screen" id="search-screen">
                        <div className="filter" id="search-filters">
                            {searchText}
                            <br />
                            <div id="search-filter-inputs">
                                <input type="text" value={filterValue} placeholder={"Filter players by name"} onChange={this.filterByName} />
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
