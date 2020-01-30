import React, { Component } from 'react';

import Typist from 'react-typist';

import SearchBar from "../components/SearchBar"

import mockUps from "../assets/mockUps.png"


class Home extends Component {
    render() {
        return (
            <div id="homepage">
                <div id="menu">
                    <a href="#home">Home</a>
                    <a href="#preview">OrganizedChaos</a>
                    <a href="#faq">FAQ</a>
                    <a href="#contact">Contact</a>
                </div>
                <div id="home">
                    <Typist cursor={{show: false}} avgTypingDelay={120}>
                        {/*<Typist.Delay ms={500}/>*/}
                        <h1>[name]<span style={{color: '#ffd700'}}>.com</span></h1>
                    </Typist>
                    <SearchBar type={3}/>
                </div>
                <div className="homepage-section-container">
                    <div id="preview">
                        <div id="preview-text">
                            <h2>OrganizedChaos</h2>
                            <p>
                                The OrganizedChaos tool is all about automation. It sifts through mounds of tables
                                and numbers so you don't have to!
                            </p>
                            <br/>
                            <p>
                                Explore a database of <span className="accented-p">2,500+</span> players from
                                Europe's top <span className="accented-p">5</span> leagues as well the UEFA Champions League and Europa League.
                            </p>
                            <br/>
                            <p>
                                Simply choose from <span className="accented-p">5</span> positional templates, toggle the
                                competitions you'd like to include, and you can visualize statistics in seconds with
                                interactive percentile rank bar charts, powered by Highcharts.js.
                            </p>
                        </div>
                        <div id="preview-image">
                            <img src={mockUps} alt="mockups"/>
                        </div>
                    </div>
                </div>
                <div style={{backgroundColor: '#f0f1f2'}} className="homepage-section-container">
                    <div id="faq">
                        <h2>F.A.Q.</h2>
                        <div id="faq-container">
                            <div className="faq-item">
                                <p><span className="accented-p">Where do you get your data from?</span></p>
                                <p><a href="https://www.whoscored.com">whoscored.com</a></p>
                            </div>
                            <div className="faq-item">
                                <p><span className="accented-p">Do you plan on adding xG data to the charts?</span></p>
                                <p>
                                    Absolutely! I actually started this project mainly to learn and practice using browser
                                    automation tools. <a href="https://www.whoscored.com">whoscored.com</a> was a fun
                                    playground to practice on, and so I used it as my primary data source.
                                    However, I definitely plan on incorporating some more advanced data from other
                                    sources such as <a href="https://fbref.com">FBREF.com</a> and/or the <a href="https://github.com/statsbomb">Statsbomb API</a> in the future.
                                </p>
                            </div>
                            <div className="faq-item">
                                <p><span className="accented-p">How should the charts be interpreted?</span></p>
                                <p>
                                    Each chart consists of 12 bars. The size of the bar for each stat corresponds to
                                    the percentile rank of the selected player with regards to the stat in question. The data labels attached to
                                    each bar show the raw (per 90) value.
                                </p>
                                <br/>
                                <p>
                                    **Please note that the position of a stat on the chart can change between different
                                    position templates.**
                                </p>
                            </div>
                            <div className="faq-item">
                                <p><span className="accented-p">What do the colors on the charts mean?</span></p>
                                <p>
                                    The colours are meant to help group similar statistics together
                                    (as well as improve the charts' visual impact).
                                </p>
                                <ul>
                                    <li><span style={{color: '#f37c98'}}>Red</span> is for goal-scoring & shooting stats,</li>
                                    <li><span style={{color: '#d7c971'}}>Yellow</span> is for passing & chance creation,</li>
                                    <li><span style={{color: '#91d782'}}>Green</span> is for dribbling & ball retention</li>
                                    <li>and <span style={{color: '#95c3ef'}}>Blue</span> is for defensive stats</li>
                                </ul>
                            </div>
                            <div className="faq-item">
                                <p><span className="accented-p">How are the percentile ranks calculated?</span></p>
                                <p>
                                    Although the OrganizedChaos tool contains data for the Champions League and the Europa
                                    League, the percentile ranks are based only on top 5 league data.
                                </p>
                                <br/>
                                <p>
                                    For each of the 5 position templates, my script uses the <a href="https://whoscored.com/Statistics">
                                    whoscored.com player statistics table</a> to select all top 5 league players
                                    who have accumulated more than 10 starts this season in the said position.
                                    Their stats are then recorded in my dataset (and updated after each top 5 league
                                    matchday).
                                </p>
                                <br/>
                                <p>
                                    For each player's chart, the percentile ranks are then obtained by determining the percentage
                                    of scores within the total dataset for the selected template position that are equal
                                    to or lower than the player's score. This is of course reversed for stats where a
                                    lower value is better, such as the 'fouls committed per 90' stat.
                                </p>
                            </div>
                            <div className="faq-item">
                                <p><span className="accented-p">Can you add a feature to compare players on the same chart?</span></p>
                                <p>
                                    Yes, player comparison is definitely a feature I plan on implementing,
                                    although I don't have a concrete timeline for that as of right now. Stay tuned!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="homepage-section-container">
                    <div id="contact">
                        <h2>Contact</h2>
                        <p>
                            For any comments, bug reports, suggestions or questions, please feel free to reach out to me on twitter
                            <a href="https://twitter.com/DyslexicDdue"> @DyslexicDdue</a>
                        </p>
                    </div>
                </div>
            </div>
        );
    }
}
export default Home;