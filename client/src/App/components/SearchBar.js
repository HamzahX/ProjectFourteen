import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';

class SearchBar extends Component {

    constructor(props) {
        super(props);
        this.state = {
            query: this.props.query,
            type: this.props.type
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
        let id;
        if (type === 1){
            id="searchbar-container"
        }
        else {
            id="searchbar-container2"
        }

        return (
            <div id={id}>
                <form id="searchbar" onSubmit={this.handleSubmit}>
                    <input type="text" id="query" value={this.state.query} placeholder="Search for a player..." autoComplete="off" onChange={this.handleChange}/>
                </form>
            </div>
        );

    }

}

export default withRouter (SearchBar);