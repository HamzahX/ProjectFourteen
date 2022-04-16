import React, { Component } from 'react';
import GlossaryText from "./GlossaryText";
import SliceExplanationText from "./SliceExplanationText";


/**
 * Component to render the glossary overlay
 */
class GlossaryOverlay extends Component {

    constructor(props) {

        super(props);
        this.toggleGlossaryOverlay = this.props.toggleGlossaryOverlay;

    }


    /**
     * render function
     * displays the player comparison search screen
     * @return {*} - JSX code for the searchbar and its container
     */
    render() {

        //return JSX code for the glossary overlay
        return (
            <div className={`overlay ${this.props.display ? "open" : "closed"}`} id="glossary-overlay">
                <div className={'overlay-inner-container'} id={'glossary-container'}>
                    <button className="close-overlay far fa-times-circle" onClick={this.toggleGlossaryOverlay}/>
                    <div className="help-section-container">
                        <SliceExplanationText/>
                    </div>
                    <GlossaryText/>
                </div>
            </div>

        );

    }

}

export default (GlossaryOverlay);
