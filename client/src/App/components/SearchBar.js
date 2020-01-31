import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';

class SearchBar extends Component {

    constructor(props) {
        super(props);
        this.state = {
            query: this.props.query,
            type: this.props.type,
            searchType: this.props.searchType === undefined ? "byName" : this.props.searchType
        };

        this.handleChange1 = this.handleChange1.bind(this);
        this.handleChange2 = this.handleChange2.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange1(event) {
        this.setState({searchType: event.target.value});
    }

    handleChange2(event) {
        this.setState({query: event.target.value});
    }

    handleSubmit(event) {
        event.preventDefault();
        const { searchType } = this.state;
        if (searchType === "byName"){
            this.props.history.push('/playerSearch/' + this.state.query);
        }
        else {
            this.props.history.push('/clubSearch/' + this.state.query);
        }
    }

    render() {

        const { type, searchType } = this.state;
        let id;
        let homeButton;
        if (type === 1){
            id="searchbar-container1";
            homeButton = <Link to={'/'}><div id="home-button"><div>name<span style={{color: '#e1ba00'}}>.com</span></div></div></Link>;
        }
        else if (type === 2) {
            id="searchbar-container2";
            homeButton = <Link to={'/'}><div id="home-button"><div>name<span style={{color: '#e1bb00'}}>.com</span></div></div></Link>;
        }
        else {
            id="searchbar-container3";
        }

        let placeholder;
        if (searchType === "byName"){
            placeholder = "Search for a player..."
        }
        else {
            placeholder = "Search for a club..."
        }

        return (
            <div className="searchbar-container" id={id}>
                <form id="searchbar" onSubmit={this.handleSubmit}>
                    {homeButton}
                    <input type="text" id="query" value={this.state.query} placeholder={placeholder} autoComplete="off" onChange={this.handleChange2}/>
                    <select value={this.state.searchType} onChange={this.handleChange1}>
                        <option value="byName">By Name</option>
                        <option value="byClub">By Club</option>
                    </select>
                </form>
            </div>
        );

    }

}

export default withRouter (SearchBar);