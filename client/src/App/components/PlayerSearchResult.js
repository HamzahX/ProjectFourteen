import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class PlayerSearchResult extends Component {

    constructor(props) {

        super(props);

        this.state = {
            page: this.props.page,
            code: this.props.code,
            name: this.props.name,
            clubs: this.props.clubs,
            clubString: "",
            nationality: this.props.nationality,
        };

    }

    componentDidMount() {

        let clubs = this.state.clubs;
        let seasons = [];
        for (let season in clubs){
            seasons.push(season);
        }
        clubs = clubs[seasons[seasons.length-1]];

        this.setState({
            clubs: clubs,
            clubString: clubs[0]
        })

    }

    render() {

        let { page, code, name, clubs, clubString, nationality } = this.state;

        for (let i=1; i<clubs.length; i++){
            clubString += (", " + clubs[i]);
        }

        let className = page === 'home' ? 'sample-player' : 'search-result';
        let clubLabel = page === 'home' ? '' : clubs.length === 1 ? 'Club:' : 'Clubs:';

        return (
            <Link to={"/stats/" + code}>
                <div tabIndex="0" className={className}>
                    <div className="name">{name}</div>
                    <div className="club">{clubLabel} {clubString}</div>
                    <div className="nationality">Nationality: {nationality}</div>
                </div>
            </Link>
        );
    }

}

export default (PlayerSearchResult);
