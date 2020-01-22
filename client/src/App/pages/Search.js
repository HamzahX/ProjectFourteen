import React, { Component } from 'react';

import SearchBar from "../components/SearchBar";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchResult from "../components/SearchResult";

import Select from 'react-select';


class Search extends Component {

    constructor(props){
        super(props);
        let { query } = props.match.params;
        this.state = {
            isLoading: false,
            error: null,
            query: query,
            searchResults: [],
            filteredSearchResults: [],
            clubs: [],
            nationalities: [],
        };

        this.filterByClub = this.filterByClub.bind(this);
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
        let clubs = [];
        let nationalities = [];
        for (let i=0; i<searchResults.length; i++){
            let currentResult = searchResults[i];
            let temp1 = {
                value: currentResult.club,
                label: currentResult.club
            };
            let temp2 = {
                value: currentResult.nationality,
                label: currentResult.nationality
            };
            if (!clubs.filter(e => e.value === temp1.value).length > 0){
                clubs.push(temp1);
            }
            if (!nationalities.filter(e => e.value === temp2.value).length > 0){
                nationalities.push(temp2);
            }
        }
        this.setState({
            searchResults: searchResults,
            filteredSearchResults: searchResults,
            clubs: clubs,
            nationalities: nationalities,
            isLoading: false,
            error: null
        })
    }

    getSearchResults = () => {

        fetch('/api/search', {
            method: 'post',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "query": this.state.query
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

    render() {
        let {error, isLoading, filteredSearchResults, clubs} = this.state;

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
                    <SearchResult
                        name={current.name}
                        club={current.club}
                        nationality={current.nationality}
                        URL={current.URL}
                        all={current.all}
                    />
                )
            }
            return (
                <div id="main">
                    <SearchBar type={1} query={this.state.query}/>
                    <div className="screen" id="search-screen">
                        <div className="filter" id="search-filters">
                            <h3>Filter Search Results</h3>
                            <div id="search-filter-inputs">
                                <Select
                                    placeholder={"Filter by club"}
                                    onChange={this.filterByClub}
                                    isClearable
                                    options={clubs}
                                />
                            </div>
                        </div>
                        <div className="result" id="search-results">
                            {cards}
                            {/*<SearchResult*/}
                            {/*    name={"Test"}*/}
                            {/*    club={"Test"}*/}
                            {/*    nationality={"Test"}*/}
                            {/*    URL={"test"}*/}
                            {/*    all={"test"}*/}
                            {/*/>*/}
                            {/*<SearchResult*/}
                            {/*    name={"Test"}*/}
                            {/*    club={"Test"}*/}
                            {/*    nationality={"Test"}*/}
                            {/*    URL={"test"}*/}
                            {/*    all={"test"}*/}
                            {/*/>*/}
                            {/*<SearchResult*/}
                            {/*    name={"Test"}*/}
                            {/*    club={"Test"}*/}
                            {/*    nationality={"Test"}*/}
                            {/*    URL={"test"}*/}
                            {/*    all={"test"}*/}
                            {/*/>*/}
                            {/*<SearchResult*/}
                            {/*    name={"Test"}*/}
                            {/*    club={"Test"}*/}
                            {/*    nationality={"Test"}*/}
                            {/*    URL={"test"}*/}
                            {/*    all={"test"}*/}
                            {/*/>*/}
                        </div>
                    </div>
                </div>
            );
        }
    }

}

export default Search;