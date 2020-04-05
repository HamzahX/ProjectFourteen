import React, { Component } from 'react';

import SearchBar from "../components/SearchBar";
import LoadingSpinner from "../components/LoadingSpinner";
import PlayerSearchResult from "../components/PlayerSearchResult";

import Select from 'react-select';
import ClubSearchResult from "../components/ClubSearchResult";


class Search extends Component {

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
            names: [],
            clubs: [],
            nationalities: [],
            reactSelectStyle: {
                control: (base, state) => ({
                    ...base,
                    boxShadow: "none",
                    '&:hover': {
                        borderColor: '#B23535'
                    },
                    '&:focus': {
                        borderColor: '#B23535'
                    },
                })
            },
            reactSelectTheme: theme => ({
                ...theme,
                colors: {
                    ...theme.colors,
                    primary25: "pink",
                    primary: "#e75453"
                }
            })
        };

        this.filterByClub = this.filterByClub.bind(this);
        this.filterByName = this.filterByName.bind(this);
    }

    componentDidMount() {
        this.setState({
            isLoading: true
        }, () => {
            this.getSearchResults();
        });
    }

    componentWillReceiveProps(nextProps, nextContext) {
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

    processSearchResults(searchResults){
        let playerSearchResults = searchResults['playerSearchResults'];
        let clubSearchResults = searchResults['clubSearchResults'];

        let names = [];
        let clubs = [];
        let nationalities = [];

        for (let i=0; i<playerSearchResults.length; i++){
            let currentResult = playerSearchResults[i];
            let currentResultClubs = currentResult.club;
            for (let i=0; i<currentResultClubs.length; i++){
                let temp1 = {
                    value: currentResult.club[i],
                    label: currentResult.club[i],
                };
                if (!clubs.filter(e => e.value === temp1.value).length > 0){
                    clubs.push(temp1);
                }
            }
            let temp2 = {
                value: currentResult.nationality,
                label: currentResult.nationality,
            };
            let temp3 = {
                value: currentResult.name,
                label: currentResult.name
            };
            names.push(temp3);
            if (!nationalities.filter(e => e.value === temp2.value).length > 0){
                nationalities.push(temp2);
            }
        }

        this.setState({
            playerSearchResults: playerSearchResults,
            filteredPlayerSearchResults: playerSearchResults,
            clubSearchResults: clubSearchResults,
            names: names,
            clubs: clubs,
            nationalities: nationalities,
            isLoading: false,
            error: null
        })
    }

    filterByClub(selectedOption){

        console.log(selectedOption);

        let playerSearchResults = JSON.parse(JSON.stringify(this.state.playerSearchResults));
        let filteredPlayerSearchResults = [];

        if (selectedOption === null || selectedOption.length === 0){
            filteredPlayerSearchResults = playerSearchResults;
        }

        else {
            for (let i=0; i<playerSearchResults.length; i++){
                for (let j=0; j<selectedOption.length; j++){
                    if (playerSearchResults[i].club.includes(selectedOption[j].value)
                        && !filteredPlayerSearchResults.includes(playerSearchResults[i])) {
                        filteredPlayerSearchResults.push(playerSearchResults[i]);
                    }
                    // if (selectedOption[j].value === playerSearchResults[i].club){
                    //     filteredPlayerSearchResults.push(playerSearchResults[i]);
                    // }
                }
            }
        }

        this.setState({
            filteredPlayerSearchResults: []
        }, () => {
            this.setState({
                filteredPlayerSearchResults: filteredPlayerSearchResults
            })
        });

    }

    filterByName(selectedOption){

        let playerSearchResults = JSON.parse(JSON.stringify(this.state.playerSearchResults));
        let filteredPlayerSearchResults = [];

        if (selectedOption === null){
            filteredPlayerSearchResults = playerSearchResults;
        }

        else {
            for (let i=0; i<playerSearchResults.length; i++){
                if (playerSearchResults[i].name.toUpperCase().includes(selectedOption.value.toUpperCase())){
                    filteredPlayerSearchResults.push(playerSearchResults[i]);
                }
            }
        }

        this.setState({
            filteredPlayerSearchResults: []
        }, () => {
            this.setState({
                filteredPlayerSearchResults: filteredPlayerSearchResults,
                openMenu: false
            })
        });

    }

    hideMenu = () => {
        this.setState({ openMenu: false });
    };

    handleInputChange = (query, { action }) => {
        if (action === "input-change") {
            let openMenu;
            openMenu = query.length !== 0;
            this.setState({ openMenu: openMenu });
        }
    };

    render() {
        let {
            error,
            isLoading,
            filteredPlayerSearchResults,
            clubSearchResults,
            clubs,
            names,
            searchByClub,
            openMenu,
            reactSelectStyle,
            reactSelectTheme
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
                        name={current.name}
                        club={current.club}
                        nationality={current.nationality}
                        URL={current.URL}
                        all={current.all}
                    />
                );
            }

            let clubCards = [];
            for (let i=0; i<clubSearchResults.length; i++){
                let current = clubSearchResults[i];
                clubCards.push(
                    <ClubSearchResult
                        name={current}
                    />
                )
            }

            let searchFilter;
            let searchText;
            // if (searchByClub === undefined){
            //     searchText = <h3>Search results for <br/>"{this.state.query}"</h3>;
            //     searchFilter =
            //         <Select
            //             styles={reactSelectStyle}
            //             theme={reactSelectTheme}
            //             placeholder={"Filter players by club"}
            //             onChange={this.filterByClub}
            //             isMulti
            //             isClearable
            //             options={clubs}
            //         />
            // }
            //
            // else {
            //     searchText = <h3>Search results for <br/>"player.club = {this.state.query}"</h3>;
            //     searchFilter =
            //         <Select
            //             styles={reactSelectStyle}
            //             theme={reactSelectTheme}
            //             placeholder={"Filter players by name"}
            //             onChange={this.filterByName}
            //             onInputChange={this.handleInputChange}
            //             onBlur={this.hideMenu}
            //             isClearable
            //             menuIsOpen={openMenu}
            //             options={names}
            //             components={
            //                 {
            //                     DropdownIndicator: () => null,
            //                     IndicatorSeparator: () => null
            //                 }
            //             }
            //         />
            // }

            searchText = <h3>Search results for <br/>"player.club = {this.state.query}"</h3>;
            searchFilter =
                <Select
                    styles={reactSelectStyle}
                    theme={reactSelectTheme}
                    placeholder={"Filter players by name"}
                    onChange={this.filterByName}
                    onInputChange={this.handleInputChange}
                    onBlur={this.hideMenu}
                    isClearable
                    menuIsOpen={openMenu}
                    options={names}
                    components={
                        {
                            DropdownIndicator: () => null,
                            IndicatorSeparator: () => null
                        }
                    }
                />

            return (
                <div id="main">
                    <SearchBar type={1} query={this.state.query}/>
                    <div className="screen" id="search-screen">
                        <div className="filter" id="search-filters">
                            {searchText}
                            <div id="search-filter-inputs">
                                {searchFilter}
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
