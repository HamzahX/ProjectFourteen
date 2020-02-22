import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';

class SearchBar extends Component {

    constructor(props) {
        super(props);
        this.state = {
            query: this.props.query,
            type: this.props.type,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({query: event.target.value});
    }

    handleSubmit(event) {
        event.preventDefault();
        this.props.history.push('/search/' + this.state.query);
    }

    render() {

        const { type } = this.state;
        let containerID;
        let homeButton;
        let autoFocus = false;
        if (type === 1){
            containerID = "searchbar-container1";
            homeButton = <Link to={'/'}><div id="home-button"><div>name<span style={{color: '#e1ba00'}}>.com</span></div></div></Link>;
        }
        else if (type === 2) {
            containerID="searchbar-container2";
            homeButton = <Link to={'/'}><div id="home-button"><div>name<span style={{color: '#e1bb00'}}>.com</span></div></div></Link>;
        }
        else {
            containerID = "searchbar-container3";
            autoFocus = true;
        }

        return (
            <div className="searchbar-container" id={containerID}>
                <form id="searchbar" onSubmit={this.handleSubmit}>
                    {homeButton}
                    <input type="text" id="query" value={this.state.query} placeholder="Search for players, clubs..." autoComplete="off" onChange={this.handleChange}/>
                </form>
            </div>
        );

    }

}

export default withRouter (SearchBar);
