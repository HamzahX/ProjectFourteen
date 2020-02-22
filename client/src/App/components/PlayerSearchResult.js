import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class PlayerSearchResult extends Component {

    constructor(props) {
        super(props);

        this.state = {
            page: this.props.page,
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

        let { club, page } = this.state;
        let clubString = club[0];

        for (let i=1; i<club.length; i++){
            clubString += (", " + club[i]);
        }

        let className = page === 'home' ? 'sample-player' : 'search-result';
        let clubLabel = page === 'home' ? '' : 'Club:';

        return (
            <Link to={"/stats/" + this.state.URL}>
                <div tabIndex="0" className={className}>
                    <div className="name">{this.state.name}</div>
                    <div className="club">{clubLabel} {clubString}</div>
                    <div className="nationality">Nationality: {this.state.nationality}</div>
                </div>
            </Link>
        );
    }

}

export default (PlayerSearchResult);
