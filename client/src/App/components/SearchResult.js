import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';

class SearchResult extends Component {

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

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(event) {
        event.preventDefault();
        this.props.history.push('/stats/' + this.state.URL);
    }

    render() {
        return (
            <div onClick={this.handleClick} tabIndex="0" className="search-result">
                <div className="name">{this.state.name}</div>
                <div className="club">Club: {this.state.club}</div>
                <div className="nationality">Nationality: {this.state.nationality}</div>
            </div>
        );
    }

}

export default withRouter (SearchResult);