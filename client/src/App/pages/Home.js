import React, { Component } from 'react';

// import Typist from 'react-typist';
import SearchBar from "../components/SearchBar"
import PlayerSearchResult from "../components/PlayerSearchResult"
import LoadingSpinner from "../components/LoadingSpinner";

import mockUps from "../assets/mockups.png"
import $ from "jquery";


class Home extends Component {

    constructor(props) {
        super(props);

        this.state = {
            isMobile: this.props.isMobile,
            isLoading: false,
            samplePlayers: [],
        };
    }

    componentDidMount() {
        this.setState({
            isLoading: true
        }, () => {
            this.getSamplePlayers();
        });
    }

    getSamplePlayers = () => {
        fetch('/api/samplePlayers', {
            method: 'post',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({})
        })
        .then(res => res.json())
        .then(samplePlayers => {
            this.setState({samplePlayers: samplePlayers, isLoading: false});
            if ($('body').css('background-color') === 'rgb(250, 251, 253)') {
                var height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
                var navbarHeight = 0.06 * height;
                $("#home").css({"height": height});
                $("#navbar-container").css({"height": navbarHeight});
            }
        })
    };

    toggleMenu = () => {

        let menu = document.getElementById('menu');
        if (menu.className === "navbar"){
            menu.className += " responsive";
        }
        else{
            menu.className = "navbar"
        }

    };

    hideMenu = () => {

        let menu = document.getElementById('menu');
        if (menu.className !== "navbar"){
            menu.className = "navbar";
        }

    };

    render() {

        let { isLoading, samplePlayers } = this.state;

        if (isLoading) {
            return (
                <LoadingSpinner/>
            )
        }

        else {

            let samplePlayerCards = [];
            for (let i=0; i<samplePlayers.length; i++){
                let current = samplePlayers[i];
                samplePlayerCards.push(
                    <PlayerSearchResult
                        page = {"home"}
                        name = {current.name}
                        club = {current.club}
                        nationality = {current.nationality}
                        URL = {current.url}
                    />
                );
            }

            return (
                <div id="homepage">
                    <div id="navbar-container">
                        <div className="navbar" id="menu">
                            <div><a onClick={this.hideMenu} href="#home">Home</a></div>
                            <div><a onClick={this.hideMenu} href="#preview">Preview</a></div>
                            <div><a onClick={this.hideMenu} href="#faq">F.A.Q.</a></div>
                            <div><a onClick={this.hideMenu} href="#glossary">Glossary</a></div>
                            <div><a onClick={this.hideMenu} href="#contact">Contact</a></div>
                            <div id="burger-icon-container"><a onClick={this.toggleMenu} id="burgerIcon">
                                <i className="fa fa-bars"/>
                            </a></div>
                        </div>
                    </div>
                    <div id="home">
                        <h1>Football<span style={{color: '#e4c000'}}>Slices</span></h1>
                        <SearchBar type={3}/>
                        <br/>
                        <br/>
                        <p>...or try using a sample player</p>
                        <br/>
                        <div id="sample-results">
                            {samplePlayerCards}
                        </div>
                    </div>
                    <div id="preview" className="homepage-section-container">
                        <div id="preview-section-container">
                            <div id="preview-text">
                                <h2>Preview</h2>
                                <p>
                                    FootballSlices are stats visualizations that are supported by an
                                    entirely automated data retrieval process. The tool sifts through tens of thousands
                                    of rows of numbers so you don't have to!
                                </p>
                                <p>
                                    Explore a database of <span style={{color: 'orangered'}}>1,900+ players </span>
                                    from <span style={{color: 'orangered'}}>Europe's top 5 leagues</span> from this
                                    season, and hopefully previous seasons as well in the near future.
                                </p>
                                <p>
                                    Simply choose from 5 positional templates, toggle the
                                    competitions you'd like to include, and you can visualize statistics in seconds with
                                    interactive percentile rank bar charts, powered by <a href="https://www.highcharts.com" >Highcharts.js</a>.
                                </p>
                                <p><span className="accented-p">Interpreting FootballSlices</span></p>
                                <p>
                                    FootballSlices consist of 12 wedges. The size of each wedge corresponds to the
                                    percentile rank of the selected player with regards to the stat represented by the
                                    wedge. The data labels show the raw per 90 value.
                                </p>
                                <p>
                                    The colours are meant to help group similar-ish stats together
                                    (as well as improve the charts' visual impact).
                                </p>
                                <ul>
                                    <li><span style={{color: '#f15c80', fontWeight: 'bold'}}>Red</span> is for goal-scoring & shooting stats,</li>
                                    <li><span style={{color: '#e4c000', fontWeight: 'bold'}}>Yellow</span> is for passing & chance creation,</li>
                                    <li><span style={{color: '#90ed7d', fontWeight: 'bold'}}>Green</span> is for dribbling & ball retention</li>
                                    <li>and <span style={{color: '#7cb5ec', fontWeight: 'bold'}}>Blue</span> is for defensive stats.</li>
                                </ul>
                            </div>
                            <div id="preview-image">
                                <img src={mockUps} alt="mockups"/>
                            </div>
                        </div>
                    </div>
                    <div id="faq" style={{backgroundColor: '#f4f5f6'}} className="homepage-section-container">
                        <div id="faq-section-container">
                            <h2>F.A.Q.</h2>
                            <div id="faq-container">
                                <div className="faq-item">
                                    <p><span className="accented-p">Where does the data come from?</span></p>
                                    <p><a href="https://www.whoscored.com" >WhoScored.com</a> and <a href="https://www.fbref.com">FBref.com</a>.</p>
                                </div>
                                <div className="faq-item">
                                    <p><span className="accented-p">Will the dataset be expanded to include players that aren't in the top 5 leagues?</span></p>
                                    <p>
                                        Probably not. This is due to the fact that <a href="https://www.fbref.com">FBref.com</a> only
                                        has xG and xA data for a few competitions.
                                    </p>
                                </div>
                                <div className="faq-item">
                                    <p><span className="accented-p">I can't find a player, and they play in one of the top 5 leagues. Why?</span></p>
                                    <p>
                                        This is likely due to one of two reasons:
                                    </p>
                                    <ol>
                                        <li>
                                            The database only includes players who've made 4 or more league appearances this season.
                                        </li>
                                        <li>
                                            Some players are listed under their nickname. For example, try searching for "Chicharito" instead
                                            of "Javier Hernandez".
                                        </li>
                                    </ol>
                                </div>
                                <div className="faq-item">
                                    <p><span className="accented-p">Can you add a feature to compare players on the same chart?</span></p>
                                    <p>
                                        Yes, that's in the works right now. Stay tuned!
                                    </p>
                                </div>
                                <div className="faq-item">
                                    <p><span className="accented-p">What is a percentile rank? How are they calculated for the FootballSlices?</span></p>
                                    <p>
                                        The percentile rank of a score is the percentage of scores within a total dataset
                                        that are equal to or lower than the score. This is of course reversed for stats where
                                        a lower value is better, such as the 'fouls committed per 90' stat.
                                    </p>
                                    <p>
                                        The percentile ranks for FootballSlices are position-specific. For example,
                                        selecting the 'forward' template compares the selected player only to other forwards in the
                                        dataset. To obtain a list of players who play in each of the 5 template positions,
                                        the tool uses the <a href="https://whoscored.com/Statistics">
                                        WhoScored.com player statistics table</a> to select all top 5 league players
                                        who have accumulated 10 or more league starts this season in the said position. Their stats
                                        from all competitions are then recorded in the dataset for their position.
                                    </p>
                                    <p>
                                        For each chart, the percentile ranks of the selected player are then obtained by comparing
                                        the player to all other scores in the dataset of the selected template position.
                                        Note that the percentile ranks are not competition-specific. In other words, the selected
                                        player's stats are always compared to other players' stats from all competitions, regardless
                                        of which competitions are toggled for the selected player.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="glossary" className="homepage-section-container">
                        <div id="glossary-section-container">
                            <h2>Glossary</h2>
                            <ul>
                                <li>
                                    <span className="accented-p">Non-penalty Goal</span> [Opta] A goal that did not stem directly from a penalty kick.
                                </li>
                                <li>
                                    <span className="accented-p">Non-penalty xG (Expected Goals)</span> [StatsBomb] Expected goals that did not stem directly from penalty kicks.
                                </li>
                                <li>
                                    <span className="accented-p">Conversion Rate</span> [Opta] The percentage of goal attempts that resulted in goals, excluding penalty kicks.
                                </li>
                                <li>
                                    <span className="accented-p">Shot on Target</span> [Opta] A goal attempt that either went into the net, or would have gone into the net
                                    but for being saved by the goalkeeper or a "last-man" defender.
                                </li>
                                <li>
                                    <span className="accented-p">Assist</span> [Opta] The final touch that led to a teammate scoring a goal.
                                </li>
                                <li>
                                    <span className="accented-p">xA (Expected Assists)</span> [StatsBomb] Expected goals that resulted from shot assists.
                                </li>
                                <li>
                                    <span className="accented-p">Completed Pass</span> [Opta] An attempted pass which successfully found a teammate.
                                </li>
                                <li>
                                    <span className="accented-p">Pass into the Penalty Area</span> [StatsBomb] A completed pass that entered the opposition penalty area, excluding set pieces.
                                </li>
                                <li>
                                    <span className="accented-p">Pass into the Final 1/3</span> [StatsBomb] A completed pass that entered the 1/3 of the pitch closest to the
                                    opposition goal, excluding set pieces.
                                </li>
                                <li>
                                    <span className="accented-p">Completed Long Pass</span> [Opta] A completed pass of 25 yards or more.
                                </li>
                                <li>
                                    <span className="accented-p">Completed Cross</span> [Opta] A completed pass from a wide position to a specific area in front of the goal.
                                </li>
                                <li>
                                    <span className="accented-p">Pass Completion %</span> [Opta] The percentage of attempted passes, including crosses, that successfully found a teammate.
                                </li>
                                <li>
                                    <span className="accented-p">Successful Dribble</span> [Opta] A successful attempt at taking on a player and making it past them whilst retaining possession.
                                </li>
                                <li>
                                    <span className="accented-p">Dispossessed</span> [Opta] Being tackled by an opponent without attempting to dribble past them.
                                </li>
                                <li>
                                    <span className="accented-p">Interception</span> [Opta] Reading an opponent's pass and preventing it from reaching another opponent by moving into the
                                    line of the pass.
                                </li>
                                <li>
                                    <span className="accented-p">Successful Tackle</span> [Opta] A successful dispossession of an opponent, whether the tackling player came away with the ball or not.
                                </li>
                                <li>
                                    <span className="accented-p">Foul Committed</span> [Opta] An infringement that was penalized by the referee and resulted in a free kick being awarded
                                    to the opposition team, excluding offsides.
                                </li>
                                <li>
                                    <span className="accented-p">Aerial Duel Won</span> [Opta] Winning the ball in a duel that was challenged in the air.
                                </li>
                                <li>
                                    <span className="accented-p">Block</span> [Opta] A prevention of a shot on target taken by an opponent from reaching the goal.
                                </li>
                                <li>
                                    <span className="accented-p">Clearance</span> [Opta] An action where a player kicked the ball away from his own goal with no intended recipient.
                                </li>
                            </ul>
                            <p>
                                Please consult the <a href="https://www.optasports.com/news/opta-s-event-definitions/">Opta event definitions page</a> to
                                see the complete definitions of the stats provided by Opta. For a detailed explanation of StatsBomb's expected goals/assists
                                model, you can visit <a href="https://fbref.com/en/expected-goals-model-explained/">FBref's explanation</a>.
                            </p>
                        </div>
                    </div>
                    <div id="contact" style={{backgroundColor: '#f4f5f6'}} className="homepage-section-container">
                        <div id="contact-section-container">
                            <h2>Contact</h2>
                            <p>
                                For any bug reports, suggestions or questions, please feel free to reach out to me
                                at either of the following:
                            </p>
                            <ul>
                                <li>Twitter: <a href="https://twitter.com/DyslexicDdue" >@DyslexicDdue</a></li>
                                <li>Email: <a href="mailto:footballslices@gmail.com" >FootballSlices@gmail.com</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            );
        }

    }

}

export default Home;
