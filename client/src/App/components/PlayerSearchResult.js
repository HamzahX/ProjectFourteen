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
            forComparison: this.props.forComparison,
            comparisonCode: this.props.comparisonCode,
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
            forComparison,
            comparisonCode,
            code,
            name,
            clubs,
            nationality
        } = this.state;

        let link;
        //set the link to the comparison page if it is a result for a player comparison
        if (forComparison) {
            link = `/compare/${comparisonCode}_${code}`;
        }
        //set the link to the stats page otherwise
        else {
            link = `/stats/${code}`;
        }

        return (
            <Link to={link}>
                <div tabIndex="0" className="search-result">
                    <div className="name">{name}</div>
                    <div className="club">{page === "live" ? '' : clubs.length === 1 ? 'Club:' : 'Clubs:'} {clubs.join(", ")}</div>
                    <div className="nationality">Nationality: {nationality}</div>
                </div>
            </Link>
        );
    }

}

export default (PlayerSearchResult);
