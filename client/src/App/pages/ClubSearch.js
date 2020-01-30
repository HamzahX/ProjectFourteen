import React, { Component } from 'react';

import SearchBar from "../components/SearchBar";
import LoadingSpinner from "../components/LoadingSpinner";
import ClubSearchResult from "../components/ClubSearchResult";


class ClubSearch extends Component {

    constructor(props){
        super(props);
        let { query } = props.match.params;
        this.state = {
            isLoading: false,
            error: null,
            query: query,
            searchResults: [],
        };

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

    getSearchResults = () => {

        fetch('/api/search', {
            method: 'post',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "query": this.state.query,
                "type": "club"
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
        .then(searchResults => this.setState({searchResults: searchResults, isLoading: false}))
        .catch(error => this.setState({error, isLoading: false}));

    };

    render() {
        let {error, isLoading, searchResults} = this.state;

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
            for (let i=0; i<searchResults.length; i++){
                let current = searchResults[i];
                cards.push(
                    <ClubSearchResult
                        name={current}
                    />
                )
            }

            return (
                <div id="main">
                    <SearchBar searchType={"byClub"} type={1} query={this.state.query}/>
                    <div className="screen" id="search-screen">
                        <div className="filter" id="search-filters">
                            <h2>Search results for <br/>"club.name ⊃ {this.state.query}"</h2>
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

export default ClubSearch;