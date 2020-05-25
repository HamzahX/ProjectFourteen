import React, { Component } from 'react';
import Collapsible from 'react-collapsible';

/**
 * Component to render the options for the displayed slice
 */
class SliceOptions extends Component {

    constructor(props) {

        super(props);

        this.positions = {
            "FW": "Forward",
            "AM": "Attacking Midfielder / Winger",
            "CM": "Central / Defensive Midfielder",
            "FB": "Full-back",
            "CB": "Center-back",
            "GK": "Goalkeeper"
        };

        this.competitions = this.props.competitions;
        this.clubs = this.props.clubs;

        this.labelTypes = {
            "raw": "Raw Value",
            "percentiles": "Percentile Ranks"
        };

        this.state = {
        };

    }

    /**
     * render function
     * @return {*} - JSX code for the slice options
     */
    render() {

        let isMobile = this.props.isMobile;

        let template = this.props.template;
        let selectedCompetitions = this.props.selectedCompetitions;
        let labelType = this.props.labelType;

        //construct templates form
        let templateLabels = [];
        let mobileTemplateLabels = [];
        for (let position in this.positions){
            let className;
            let mobileClassName;
            let disabled;
            if (position !== "GK"){
                className = template !== "GK" ? "selectable-label" : "blocked-label";
                mobileClassName = `${template === position ? "selected-label" : null} ${template !== "GK" ? "selectable-label" : null}`;
                disabled = template === "GK";
            }
            else {
                className = template === "GK" ? "selectable-label" : "blocked-label";
                mobileClassName = `${template === position ? "selected-label" : null} ${template === "GK" ? "selectable-label" : null}`;
                disabled = template !== "GK";
            }
            templateLabels.push(
                <label
                    className={className}
                    key={`${position}_label`}
                >
                    <input type="radio"
                           name="template"
                           value={position}
                           checked={template === position}
                           disabled={disabled}
                           onChange={this.props.changeTemplate}
                    /> {this.positions[position]}
                </label>
            );
            mobileTemplateLabels.push(
                <label
                    className={mobileClassName}
                    key={`${position}_label_mobile`}
                >
                    <input type="radio"
                           name="template"
                           value={position}
                           checked={template === position}
                           disabled={disabled}
                           onChange={this.props.changeTemplate}
                    /> {this.positions[position]}
                </label>
            );
        }
        let templatesForm = <form id="templates">{templateLabels}</form>;
        let mobileTemplatesForm = <form id="templates">{mobileTemplateLabels}</form>;

        //construct competitions forms
        let competitionsForms = [];
        let counter = 0;
        for (let season in this.competitions){
            let competitionLabels = [];
            let multipleClubs = this.clubs[season].length !== 1;
            competitionsForms.push(
                <h4
                    key={`${season}_header`}
                    style={{
                        marginBottom: isMobile ? '20px' : '10px',
                        marginTop: (counter !== 0 && !isMobile) ? '15px' : '5px'
                    }}
                >
                    {season.replace("-", "/")} {multipleClubs === false ? ' | ' + this.clubs[season][0] : null}
                </h4>
            );
            for (let i=0; i<this.competitions[season].length; i++){
                let currentCompetition = this.competitions[season][i];
                let isIncluded = selectedCompetitions[season].includes(currentCompetition);
                let label = currentCompetition;
                if (this.clubs[season].length === 1){
                    label = label.substring(0, label.indexOf("|")-1)
                }
                competitionLabels.push(
                    <label
                        className={`${isIncluded ? "selected-label" : null} selectable-label`}
                        key={`${season}_${currentCompetition}`}
                    >
                        <input className="competition"
                               type="checkbox"
                               value={`${season}_${currentCompetition}`}
                               onChange={this.props.changeSelectedCompetitions}
                               checked={isIncluded}
                        /> {label}
                    </label>
                )
            }
            competitionsForms.push(<form key={`${season}_form`} className="competitions">{competitionLabels}</form>);
            counter++;
        }

        //construct label type form
        let labelTypeLabels = [];
        for (let type in this.labelTypes){
            labelTypeLabels.push(
                <label
                    className="selectable-label"
                    key={type}
                >
                    <input
                        type="radio"
                        name="labelType"
                        value={type}
                        checked={labelType === type}
                        onChange={this.props.changeLabelType}
                    /> {this.labelTypes[type]}
                </label>
            )
        }
        let labelTypeForm = <form id="data-labels">{labelTypeLabels}</form>;

        return (
            <div className="filter" id="chart-filters">
                <div className="chart-filter-inputs" id="chart-filter-inputs-laptop">
                    <Collapsible
                        open={true}
                        trigger="Template"
                        className="chart-filter-headers"
                        transitionTime={200}
                        transitionCloseTime={200}
                    >
                        {templatesForm}
                    </Collapsible>
                    <Collapsible
                        open={true}
                        trigger="Competitions"
                        className="chart-filter-headers"
                        transitionTime={200}
                        transitionCloseTime={200}
                    >
                        {competitionsForms}
                    </Collapsible>
                    <Collapsible
                        open={true}
                        trigger="Data Labels"
                        className="chart-filter-headers"
                        transitionTime={200}
                        transitionCloseTime={200}
                    >
                        {labelTypeForm}
                    </Collapsible>
                </div>
                <div className="chart-filter-inputs" id="chart-filter-inputs-mobile">
                    <Collapsible
                        open={true}
                        trigger="Template"
                        className="chart-filter-headers"
                        transitionTime={200}
                        transitionCloseTime={200}
                    >
                        {mobileTemplatesForm}
                    </Collapsible>
                    <Collapsible
                        open={true}
                        trigger="Competitions"
                        className="chart-filter-headers"
                        transitionTime={200}
                        transitionCloseTime={200}
                    >
                        {competitionsForms}
                    </Collapsible>
                    <Collapsible
                        open={true}
                        trigger="Data Labels"
                        className="chart-filter-headers"
                        transitionTime={200}
                        transitionCloseTime={200}
                    >
                        {labelTypeForm}
                    </Collapsible>
                </div>
                <div id="filter-buttons">
                    <div className="filter-button">
                        <button id="toggleCreditsButton" type="button" onClick={this.props.toggleCreditsPosition}>Toggle Credits Position</button>
                    </div>
                    <div className="filter-button">
                        <button id="exportButton" type="button" onClick={this.props.exportChart}>Export Chart</button>
                    </div>
                    <div className="filter-button">
                        <button id="compareButton" type="button" disabled={true}>Compare To...</button>
                    </div>
                </div>
            </div>
        )

    }

}

export default (SliceOptions);
