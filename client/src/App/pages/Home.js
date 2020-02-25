import React, { Component } from 'react';

// import Typist from 'react-typist';
import SearchBar from "../components/SearchBar"
import PlayerSearchResult from "../components/PlayerSearchResult"
import LoadingSpinner from "../components/LoadingSpinner";

import mockUps from "../assets/mockUps.png"


class Home extends Component {

    constructor(props) {
        super(props);

        this.state = {
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
        const { URL } = this.props.match.params;

        fetch('/api/samplePlayers', {
            method: 'post',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({})
        })
        .then(res => res.json())
        .then(samplePlayers => this.setState({samplePlayers: samplePlayers, isLoading: false}))
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
                    {/*<div id="menu">*/}
                    {/*    <a href="#home">Home</a>*/}
                    {/*    <a href="#preview">OrganizedChaos</a>*/}
                    {/*    <a href="#faq">FAQ</a>*/}
                    {/*    <a href="#contact">Contact</a>*/}
                    {/*</div>*/}
                    <div id="home">
                        <h1>name<span style={{color: '#ffd700'}}>.com</span></h1>
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
                                <h2>OrganizedChaos</h2>
                                <p>
                                    OrganizedChaos is a football stats visualization tool that is supported by an
                                    entirely automated data retrieval process. It sifts
                                    through <span className="accented-p">tens of thousands</span> of rows of numbers so
                                    you don't have to!
                                </p>
                                <p>
                                    Explore a database of <span className="accented-p">1,900+</span> players from
                                    Europe's top <span className="accented-p">5</span> leagues from this season, and
                                    hopefully much more in the near future.
                                </p>
                                <p>
                                    Simply choose from <span className="accented-p">5</span> positional templates, toggle the
                                    competitions you'd like to include, and you can visualize statistics in seconds with
                                    interactive percentile rank bar charts, powered by <a href="https://www.highcharts.com" >Highcharts.js</a>.
                                </p>
                                <p><span className="accented-p">How should the charts be interpreted?</span></p>
                                <p>
                                    Each chart consists of 12 bars. The size of the bar for each stat corresponds to the
                                    percentile rank of the selected player with regards to the stat represented by the
                                    bar. The data labels attached to each bar show the raw (per 90) value.
                                </p>
                                <p>
                                    The colours are meant to help group similar-ish stats together
                                    (as well as improve the charts' visual impact).
                                </p>
                                <ul>
                                    <li><span style={{color: '#f37c98'}}>Red</span> is for goal-scoring & shooting stats,</li>
                                    <li><span style={{color: '#d7c971'}}>Yellow</span> is for passing & chance creation,</li>
                                    <li><span style={{color: '#91d782'}}>Green</span> is for dribbling & ball retention</li>
                                    <li>and <span style={{color: '#95c3ef'}}>Blue</span> is for defensive stats</li>
                                </ul>
                            </div>
                            <div id="preview-image">
                                <img src={mockUps} alt="mockups"/>
                            </div>
                        </div>
                    </div>
                    <div id="faq" style={{backgroundColor: '#f0f1f2'}} className="homepage-section-container">
                        <div id="faq-section-container">
                            <h2>F.A.Q.</h2>
                            <div id="faq-container">
                                <div className="faq-item">
                                    <p><span className="accented-p">Where do you get your data from?</span></p>
                                    <p><a href="https://www.whoscored.com" >WhoScored.com</a> and <a href="https://www.fbref.com">FBref.com</a></p>
                                </div>
                                <div className="faq-item">
                                    <p><span className="accented-p">I can't find a player, and he plays in one of the top 5 leagues. Why?</span></p>
                                    <p>
                                        This is likely due to one of two reasons:
                                    </p>
                                    <ol>
                                        <li>
                                            The database only includes players who've made 4 or more league appearances this season.
                                        </li>
                                        <li>
                                            The search function doesn't always detect special characters such as Ø and é like it's
                                            supposed to (I'm working on it). You can try searching by club instead.
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
                                    <p><span className="accented-p">What is a percentile rank? How does the OrganizedChaos Tool calculate them?</span></p>
                                    <p>
                                        The percentile rank of a score is the percentage of scores within a total dataset
                                        that are equal to or lower than the score. This is of course reversed for stats where
                                        a lower value is better, such as the 'fouls committed per 90' stat.
                                    </p>
                                    <p>
                                        The percentile ranks for the OrganizedChaos tool are position-specific. For example,
                                        selecting the 'forward' template compares the selected player only to other forwards in the
                                        dataset. To obtain a list of players who play in each of the 5 template positions,
                                        the tool uses the <a href="https://whoscored.com/Statistics">
                                        WhoScored.com player statistics table</a> to select all top 5 league players
                                        who have accumulated 10 or more starts this season in the said position. Their stats
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
                    <div id="contact" className="homepage-section-container">
                        <div id="contact-section-container">
                            <h2>Contact</h2>
                            <p>
                                For any bug reports, suggestions or questions, please feel free to reach out to me on twitter
                                <a href="https://twitter.com/DyslexicDdue" > @DyslexicDdue</a>
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

    }

}

export default Home;
