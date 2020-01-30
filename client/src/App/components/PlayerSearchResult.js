import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class PlayerSearchResult extends Component {

    constructor(props) {
        super(props);

        this.state = {
            name: this.props.name,
            club: this.props.club,
            nationality: this.props.nationality,
            URL: this.props.URL.replace("https://www.whoscored.com/", "")
                .replace("History", "Show")
                .split("/")
                .join("_"),
            all: this.props.all
        };

    }

    render() {
        return (
            <Link to={"/stats/" + this.state.URL}>
                <div tabIndex="0" className="search-result">
                    <div className="name">{this.state.name}</div>
                    <div className="club">Club: {this.state.club}</div>
                    <div className="nationality">Nationality: {this.state.nationality}</div>
                </div>
            </Link>
        );
    }

}

export default (PlayerSearchResult);