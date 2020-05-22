import React, { Component } from 'react';
import { Link } from 'react-router-dom';


/**
 * Component to render a player search result
 */
class PlayerSearchResult extends Component {

    constructor(props) {

        super(props);

        //set the player clubs entry to their most recent season's clubs
        let clubs = this.props.clubs;
        let seasons = [];
        for (let season in clubs){
            seasons.push(season);
        }
        clubs = clubs[seasons[seasons.length-1]];

        this.state = {
            page: this.props.page,
            code: this.props.code,
            name: this.props.name,
            clubs: clubs,
            nationality: this.props.nationality,
        };

    }


    /**
     * render function
     * @return {*} - JSX code for a player search result
     */
    render() {

        let {
            page,
            code,
            name,
            clubs,
            nationality
        } = this.state;

        //change the div class name based on the page so that the CSS rules modify it accordingly
        let className = page === 'home' ? 'sample-player' : 'search-result';

        //remove the "Club: " label for home page, and modify it to "Clubs" if there are more than 1
        let clubLabel = page === 'home' ? '' : clubs.length === 1 ? 'Club:' : 'Clubs:';

        return (
            <Link to={"/stats/" + code}>
                <div tabIndex="0" className={className}>
                    <div className="name">{name}</div>
                    <div className="club">{clubLabel} {clubs.join(", ")}</div>
                    <div className="nationality">Nationality: {nationality}</div>
                </div>
            </Link>
        );
    }

}

export default (PlayerSearchResult);
