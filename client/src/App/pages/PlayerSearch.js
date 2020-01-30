import React, { Component } from 'react';

import SearchBar from "../components/SearchBar";
import LoadingSpinner from "../components/LoadingSpinner";
import PlayerSearchResult from "../components/PlayerSearchResult";

import Select from 'react-select';


class PlayerSearch extends Component {

    constructor(props){
        super(props);
        let query = props.match.params.query;
        let searchByClub = props.match.params.searchByClub;
        this.state = {
            isLoading: false,
            error: null,
            query: query,
            searchByClub: searchByClub,
            searchResults: [],
            filteredSearchResults: [],
            names: [],
            clubs: [],
            nationalities: [],
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
        let { query } = nextProps.match.params;
        this.setState({
            isLoading: true,
            query: query
        }, () => {
            this.getSearchResults();
        });
    }

    processSearchResults(searchResults){
        let names = [];
        let clubs = [];
        let nationalities = [];
        for (let i=0; i<searchResults.length; i++){
            let currentResult = searchResults[i];
            let temp1 = {
                value: currentResult.club,
                label: currentResult.club,
            };
            let temp2 = {
                value: currentResult.nationality,
                label: currentResult.nationality,
            };
            let temp3 = {
                value: currentResult.name,
                label: currentResult.name
            };
            if (!clubs.filter(e => e.value === temp1.value).length > 0){
                clubs.push(temp1);
            }
            if (!nationalities.filter(e => e.value === temp2.value).length > 0){
                nationalities.push(temp2);
            }
            names.push(temp3);
        }
        this.setState({
            searchResults: searchResults,
            filteredSearchResults: searchResults,
            names: names,
            clubs: clubs,
            nationalities: nationalities,
            isLoading: false,
            error: null
        })
    }

    getSearchResults = () => {

        let searchByClub = this.state.searchByClub;
        // alert(searchByClub);
        let type;
        if (searchByClub === undefined){
            type = "playerByName"
        }
        else {
            type = "playerByClub"
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

    filterByClub(selectedOption){

        let searchResults = JSON.parse(JSON.stringify(this.state.searchResults));
        let filteredSearchResults = [];

        if (selectedOption === null){
            filteredSearchResults = searchResults;
        }

        else {
            for (let i=0; i<searchResults.length; i++){
                if (selectedOption.value === searchResults[i].club){
                    filteredSearchResults.push(searchResults[i]);
                }
            }
        }

        this.setState({
            filteredSearchResults: []
        }, () => {
            this.setState({
                filteredSearchResults: filteredSearchResults
            })
        });

    }

    filterByName(selectedOption){

        let searchResults = JSON.parse(JSON.stringify(this.state.searchResults));
        let filteredSearchResults = [];

        if (selectedOption === null){
            filteredSearchResults = searchResults;
        }

        else {
            for (let i=0; i<searchResults.length; i++){
                if (searchResults[i].name.toUpperCase().includes(selectedOption.value.toUpperCase())){
                    filteredSearchResults.push(searchResults[i]);
                }
            }
        }

        this.setState({
            filteredSearchResults: []
        }, () => {
            this.setState({
                filteredSearchResults: filteredSearchResults
            })
        });

    }

    render() {
        let {error, isLoading, filteredSearchResults, clubs, names, searchByClub} = this.state;

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

            let cards = [];
            for (let i=0; i<filteredSearchResults.length; i++){
                let current = filteredSearchResults[i];
                cards.push(
                    <PlayerSearchResult
                        name={current.name}
                        club={current.club}
                        nationality={current.nationality}
                        URL={current.URL}
                        all={current.all}
                    />
                )
            }

            const reactSelectStyle = {
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
            };

            const reactSelectTheme = theme => ({
                ...theme,
                colors: {
                    ...theme.colors,
                    primary25: "pink",
                    primary: "#e75453"
                }
            });

            let searchFilter;
            let searchText;
            if (searchByClub === undefined){
                searchText = <h2>Search results for <br/>"player.name ⊃ {this.state.query}"</h2>;
                searchFilter =
                    <Select
                        styles={reactSelectStyle}
                        theme={reactSelectTheme}
                        placeholder={"Filter by club"}
                        onChange={this.filterByClub}
                        isClearable
                        options={clubs}
                    />
            }

            else {
                searchText = <h2>Search results for <br/>"player.club = {this.state.query}"</h2>;
                searchFilter =
                    <Select
                        styles={reactSelectStyle}
                        theme={reactSelectTheme}
                        placeholder={"Filter by name"}
                        onChange={this.filterByName}
                        isClearable
                        options={names}
                    />
            }

            return (
                <div id="main">
                    <SearchBar searchType={searchByClub === "all" ? "byClub" : "byName"} type={1} query={this.state.query}/>
                    <div className="screen" id="search-screen">
                        <div className="filter" id="search-filters">
                            {searchText}
                            <div id="search-filter-inputs">
                                {searchFilter}
                            </div>
                        </div>
                        <div className="result" id="search-results">
                            {cards}
                        </div>
                    </div>
                </div>
            );
        }
    }

}

export default PlayerSearch;