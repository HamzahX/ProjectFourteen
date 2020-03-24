(this.webpackJsonpclient=this.webpackJsonpclient||[]).push([[0],{32:function(e,t,a){e.exports=a.p+"static/media/mockUps3.f4278b79.png"},37:function(e,t,a){e.exports=a(49)},42:function(e,t,a){},43:function(e,t,a){},49:function(e,t,a){"use strict";a.r(t);var s=a(0),n=a.n(s),l=a(17),r=a(12),i=(a(42),a(4)),o=a(5),c=a(6),u=a(7),m=a(8),p=a(16),h=(a(43),a(1)),d=function(e){function t(e){var a;return Object(i.a)(this,t),(a=Object(c.a)(this,Object(u.a)(t).call(this,e))).state={query:a.props.query,type:a.props.type},a.handleChange=a.handleChange.bind(Object(h.a)(a)),a.handleSubmit=a.handleSubmit.bind(Object(h.a)(a)),a}return Object(m.a)(t,e),Object(o.a)(t,[{key:"handleChange",value:function(e){this.setState({query:e.target.value})}},{key:"handleSubmit",value:function(e){e.preventDefault(),this.props.history.push("/search/"+this.state.query)}},{key:"render",value:function(){var e,t,a=this.state.type;return 1===a?(e="searchbar-container1",t=n.a.createElement(r.b,{to:"/"},n.a.createElement("div",{id:"home-button"},n.a.createElement("div",null,"name",n.a.createElement("span",{style:{color:"#e1ba00"}},".com"))))):2===a?(e="searchbar-container2",t=n.a.createElement(r.b,{to:"/"},n.a.createElement("div",{id:"home-button"},n.a.createElement("div",null,"name",n.a.createElement("span",{style:{color:"#e1bb00"}},".com"))))):e="searchbar-container3",n.a.createElement("div",{className:"searchbar-container",id:e},n.a.createElement("form",{id:"searchbar",onSubmit:this.handleSubmit},t,n.a.createElement("input",{type:"text",id:"query",value:this.state.query,placeholder:"Search for players, clubs...",autoComplete:"off",onChange:this.handleChange})))}}]),t}(s.Component),b=Object(p.f)(d),f=function(e){function t(e){var a;return Object(i.a)(this,t),(a=Object(c.a)(this,Object(u.a)(t).call(this,e))).state={page:a.props.page,name:a.props.name,club:a.props.club,nationality:a.props.nationality,URL:a.props.URL.replace("https://www.whoscored.com/","").replace("History","Show").split("/").join("_"),all:a.props.all},a}return Object(m.a)(t,e),Object(o.a)(t,[{key:"render",value:function(){for(var e=this.state,t=e.club,a=e.page,s=t[0],l=1;l<t.length;l++)s+=", "+t[l];var i="home"===a?"sample-player":"search-result",o="home"===a?"":"Club:";return n.a.createElement(r.b,{to:"/stats/"+this.state.URL},n.a.createElement("div",{tabIndex:"0",className:i},n.a.createElement("div",{className:"name"},this.state.name),n.a.createElement("div",{className:"club"},o," ",s),n.a.createElement("div",{className:"nationality"},"Nationality: ",this.state.nationality)))}}]),t}(s.Component),g=function(e){function t(){return Object(i.a)(this,t),Object(c.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(m.a)(t,e),Object(o.a)(t,[{key:"render",value:function(){return n.a.createElement("div",{id:"main"},n.a.createElement("div",{className:"screen",id:"loading-screen"},n.a.createElement("div",{className:"loader"},"Loading...")))}}]),t}(s.Component),y=a(32),v=a.n(y),E=function(e){function t(e){var a;return Object(i.a)(this,t),(a=Object(c.a)(this,Object(u.a)(t).call(this,e))).getSamplePlayers=function(){fetch("/api/samplePlayers",{method:"post",headers:{"Content-Type":"application/json"},body:JSON.stringify({})}).then((function(e){return e.json()})).then((function(e){return a.setState({samplePlayers:e,isLoading:!1})}))},a.state={isLoading:!1,samplePlayers:[]},a}return Object(m.a)(t,e),Object(o.a)(t,[{key:"componentDidMount",value:function(){var e=this;this.setState({isLoading:!0},(function(){e.getSamplePlayers()}))}},{key:"render",value:function(){var e=this.state,t=e.isLoading,a=e.samplePlayers;if(t)return n.a.createElement(g,null);for(var s=[],l=0;l<a.length;l++){var r=a[l];s.push(n.a.createElement(f,{page:"home",name:r.name,club:r.club,nationality:r.nationality,URL:r.url}))}return n.a.createElement("div",{id:"homepage"},n.a.createElement("div",{id:"home"},n.a.createElement("h1",null,"name",n.a.createElement("span",{style:{color:"#ffd700"}},".com")),n.a.createElement(b,{type:3}),n.a.createElement("br",null),n.a.createElement("br",null),n.a.createElement("p",null,"...or try using a sample player"),n.a.createElement("br",null),n.a.createElement("div",{id:"sample-results"},s)),n.a.createElement("div",{id:"preview",className:"homepage-section-container"},n.a.createElement("div",{id:"preview-section-container"},n.a.createElement("div",{id:"preview-text"},n.a.createElement("h2",null,"OrganizedChaos"),n.a.createElement("p",null,"OrganizedChaos is a football stats visualization tool that is supported by an entirely automated data retrieval process. It sifts through ",n.a.createElement("span",{className:"accented-p"},"tens of thousands")," of rows of numbers so you don't have to!"),n.a.createElement("p",null,"Explore a database of ",n.a.createElement("span",{className:"accented-p"},"1,900+")," players from Europe's top ",n.a.createElement("span",{className:"accented-p"},"5")," leagues from this season, and hopefully previous seasons as well in the near future."),n.a.createElement("p",null,"Simply choose from ",n.a.createElement("span",{className:"accented-p"},"5")," positional templates, toggle the competitions you'd like to include, and you can visualize statistics in seconds with interactive percentile rank bar charts, powered by ",n.a.createElement("a",{href:"https://www.highcharts.com"},"Highcharts.js"),"."),n.a.createElement("p",null,n.a.createElement("span",{className:"accented-p"},"How should the charts be interpreted?")),n.a.createElement("p",null,"Each chart consists of 12 wedges. The size of each wedge corresponds to the percentile rank of the selected player with regards to the stat represented by the wedge. The data labels show the raw per 90 value."),n.a.createElement("p",null,"The colours are meant to help group similar-ish stats together (as well as improve the charts' visual impact)."),n.a.createElement("ul",null,n.a.createElement("li",null,n.a.createElement("span",{style:{color:"#f15c80"}},"Red")," is for goal-scoring & shooting stats,"),n.a.createElement("li",null,n.a.createElement("span",{style:{color:"#e4d354"}},"Yellow")," is for passing & chance creation,"),n.a.createElement("li",null,n.a.createElement("span",{style:{color:"#90ed7d"}},"Green")," is for dribbling & ball retention"),n.a.createElement("li",null,"and ",n.a.createElement("span",{style:{color:"#7cb5ec"}},"Blue")," is for defensive stats."))),n.a.createElement("div",{id:"preview-image"},n.a.createElement("img",{src:v.a,alt:"mockups"})))),n.a.createElement("div",{id:"faq",style:{backgroundColor:"#f0f1f2"},className:"homepage-section-container"},n.a.createElement("div",{id:"faq-section-container"},n.a.createElement("h2",null,"F.A.Q."),n.a.createElement("div",{id:"faq-container"},n.a.createElement("div",{className:"faq-item"},n.a.createElement("p",null,n.a.createElement("span",{className:"accented-p"},"Where does the data come from?")),n.a.createElement("p",null,n.a.createElement("a",{href:"https://www.whoscored.com"},"WhoScored.com")," and ",n.a.createElement("a",{href:"https://www.fbref.com"},"FBref.com"),".")),n.a.createElement("div",{className:"faq-item"},n.a.createElement("p",null,n.a.createElement("span",{className:"accented-p"},"Will the dataset be expanded to include players that aren't in the top 5 leagues?")),n.a.createElement("p",null,"Probably not. This is due to the fact that ",n.a.createElement("a",{href:"https://www.fbref.com"},"FBref.com")," only has xG and xA data for a few competitions.")),n.a.createElement("div",{className:"faq-item"},n.a.createElement("p",null,n.a.createElement("span",{className:"accented-p"},"I can't find a player, and they play in one of the top 5 leagues. Why?")),n.a.createElement("p",null,"This is likely due to one of two reasons:"),n.a.createElement("ol",null,n.a.createElement("li",null,"The database only includes players who've made 4 or more league appearances this season."),n.a.createElement("li",null,'Some players are listed under their nickname. For example, try searching for "Chicharito" instead of "Javier Hernandez".'))),n.a.createElement("div",{className:"faq-item"},n.a.createElement("p",null,n.a.createElement("span",{className:"accented-p"},"Can you add a feature to compare players on the same chart?")),n.a.createElement("p",null,"Yes, that's in the works right now. Stay tuned!")),n.a.createElement("div",{className:"faq-item"},n.a.createElement("p",null,n.a.createElement("span",{className:"accented-p"},"What is a percentile rank? How does the OrganizedChaos Tool calculate them?")),n.a.createElement("p",null,"The percentile rank of a score is the percentage of scores within a total dataset that are equal to or lower than the score. This is of course reversed for stats where a lower value is better, such as the 'fouls committed per 90' stat."),n.a.createElement("p",null,"The percentile ranks for the OrganizedChaos tool are position-specific. For example, selecting the 'forward' template compares the selected player only to other forwards in the dataset. To obtain a list of players who play in each of the 5 template positions, the tool uses the ",n.a.createElement("a",{href:"https://whoscored.com/Statistics"},"WhoScored.com player statistics table")," to select all top 5 league players who have accumulated 10 or more league starts this season in the said position. Their stats from all competitions are then recorded in the dataset for their position."),n.a.createElement("p",null,"For each chart, the percentile ranks of the selected player are then obtained by comparing the player to all other scores in the dataset of the selected template position. Note that the percentile ranks are not competition-specific. In other words, the selected player's stats are always compared to other players' stats from all competitions, regardless of which competitions are toggled for the selected player."))))),n.a.createElement("div",{id:"contact",className:"homepage-section-container"},n.a.createElement("div",{id:"contact-section-container"},n.a.createElement("h2",null,"Contact"),n.a.createElement("p",null,"For any bug reports, suggestions or questions, please feel free to reach out to me on twitter ",n.a.createElement("a",{href:"https://twitter.com/DyslexicDdue"},"@DyslexicDdue"),"."))))}}]),t}(s.Component),C=a(21),k=a(26),S=function(e){function t(e){var a;return Object(i.a)(this,t),(a=Object(c.a)(this,Object(u.a)(t).call(this,e))).state={name:a.props.name},a}return Object(m.a)(t,e),Object(o.a)(t,[{key:"render",value:function(){return n.a.createElement(r.b,{to:"/search/"+this.state.name+"/all"},n.a.createElement("div",{tabIndex:"0",className:"search-result"},n.a.createElement("div",{className:"name"},this.state.name)))}}]),t}(s.Component),P=function(e){function t(e){var a;Object(i.a)(this,t),(a=Object(c.a)(this,Object(u.a)(t).call(this,e))).getSearchResults=function(){var e;e=void 0===a.state.searchByClub?"playersAndClubs":"playersByClub",fetch("/api/search",{method:"post",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:a.state.query,type:e})}).then((function(e){if(e.ok)return e.json();throw new Error("No results found")})).then((function(e){return a.processSearchResults(e)})).catch((function(e){return a.setState({error:e,isLoading:!1})}))},a.hideMenu=function(){a.setState({openMenu:!1})},a.handleInputChange=function(e,t){var s;"input-change"===t.action&&(s=0!==e.length,a.setState({openMenu:s}))};var s=e.match.params.query,n=e.match.params.searchByClub;return a.state={isLoading:!1,error:null,query:s,searchByClub:n,playerSearchResults:[],filteredPlayerSearchResults:[],openMenu:!1,clubSearchResults:[],names:[],clubs:[],nationalities:[],reactSelectStyle:{control:function(e,t){return Object(C.a)({},e,{boxShadow:"none","&:hover":{borderColor:"#B23535"},"&:focus":{borderColor:"#B23535"}})}},reactSelectTheme:function(e){return Object(C.a)({},e,{colors:Object(C.a)({},e.colors,{primary25:"pink",primary:"#e75453"})})}},a.filterByClub=a.filterByClub.bind(Object(h.a)(a)),a.filterByName=a.filterByName.bind(Object(h.a)(a)),a}return Object(m.a)(t,e),Object(o.a)(t,[{key:"componentDidMount",value:function(){var e=this;this.setState({isLoading:!0},(function(){e.getSearchResults()}))}},{key:"componentWillReceiveProps",value:function(e,t){var a=this,s=e.match.params,n=s.query,l=s.searchByClub;this.setState({isLoading:!0,query:n,searchByClub:l},(function(){a.getSearchResults()}))}},{key:"processSearchResults",value:function(e){for(var t=e.playerSearchResults,a=e.clubSearchResults,s=[],n=[],l=[],r=function(e){for(var a=t[e],r=a.club,i=function(e){var t={value:a.club[e],label:a.club[e]};!n.filter((function(e){return e.value===t.value})).length>0&&n.push(t)},o=0;o<r.length;o++)i(o);var c={value:a.nationality,label:a.nationality},u={value:a.name,label:a.name};s.push(u),!l.filter((function(e){return e.value===c.value})).length>0&&l.push(c)},i=0;i<t.length;i++)r(i);this.setState({playerSearchResults:t,filteredPlayerSearchResults:t,clubSearchResults:a,names:s,clubs:n,nationalities:l,isLoading:!1,error:null})}},{key:"filterByClub",value:function(e){var t=this;console.log(e);var a=JSON.parse(JSON.stringify(this.state.playerSearchResults)),s=[];if(null===e||0===e.length)s=a;else for(var n=0;n<a.length;n++)for(var l=0;l<e.length;l++)a[n].club.includes(e[l].value)&&!s.includes(a[n])&&s.push(a[n]);this.setState({filteredPlayerSearchResults:[]},(function(){t.setState({filteredPlayerSearchResults:s})}))}},{key:"filterByName",value:function(e){var t=this,a=JSON.parse(JSON.stringify(this.state.playerSearchResults)),s=[];if(null===e)s=a;else for(var n=0;n<a.length;n++)a[n].name.toUpperCase().includes(e.value.toUpperCase())&&s.push(a[n]);this.setState({filteredPlayerSearchResults:[]},(function(){t.setState({filteredPlayerSearchResults:s,openMenu:!1})}))}},{key:"render",value:function(){var e=this.state,t=e.error,a=e.isLoading,s=e.filteredPlayerSearchResults,l=e.clubSearchResults,r=e.clubs,i=e.names,o=e.searchByClub,c=e.openMenu,u=e.reactSelectStyle,m=e.reactSelectTheme;if(a)return n.a.createElement(g,null);if(null!==t)return n.a.createElement("div",{id:"main"},n.a.createElement(b,{type:1,query:this.state.query}),n.a.createElement("div",{className:"screen",id:"error-screen"},n.a.createElement("p",null,t.message)));for(var p=[],h=0;h<s.length;h++){var d=s[h];p.push(n.a.createElement(f,{page:"search",name:d.name,club:d.club,nationality:d.nationality,URL:d.URL,all:d.all}))}for(var y,v,E=[],C=0;C<l.length;C++){var P=l[C];E.push(n.a.createElement(S,{name:P}))}return void 0===o?(v=n.a.createElement("h3",null,"Search results for ",n.a.createElement("br",null),'"',this.state.query,'"'),y=n.a.createElement(k.a,{styles:u,theme:m,placeholder:"Filter players by club",onChange:this.filterByClub,isMulti:!0,isClearable:!0,options:r})):(v=n.a.createElement("h3",null,"Search results for ",n.a.createElement("br",null),'"player.club = ',this.state.query,'"'),y=n.a.createElement(k.a,{styles:u,theme:m,placeholder:"Filter players by name",onChange:this.filterByName,onInputChange:this.handleInputChange,onBlur:this.hideMenu,isClearable:!0,menuIsOpen:c,options:i,components:{DropdownIndicator:function(){return null},IndicatorSeparator:function(){return null}}})),n.a.createElement("div",{id:"main"},n.a.createElement(b,{type:1,query:this.state.query}),n.a.createElement("div",{className:"screen",id:"search-screen"},n.a.createElement("div",{className:"filter",id:"search-filters"},v,n.a.createElement("div",{id:"search-filter-inputs"},y)),n.a.createElement("div",{className:"result",id:"search-results"},void 0===o?n.a.createElement("h3",null,"Players"):null,0===p.length&&void 0===o?n.a.createElement("p",null,"No results found"):null,n.a.createElement("div",{id:"player-search-results"},p),void 0===o?n.a.createElement("h3",{style:{marginTop:"20px"}},"Clubs"):null,0===E.length&&void 0===o?n.a.createElement("p",null,"No results found"):null,n.a.createElement("div",{id:"club-search-results"},E))))}}]),t}(s.Component),w=a(33),O=a.n(w),N=(a(48),a(18)),x=a.n(N),j=a(34),L=a.n(j),R=a(35),A=a.n(R),T=a(36),M=a.n(T);L()(x.a),A()(x.a);var B=function(e){function t(e){var a;Object(i.a)(this,t),(a=Object(c.a)(this,Object(u.a)(t).call(this,e))).getStats=function(){var e=a.props.match.params.URL;fetch("/api/stats",{method:"post",headers:{"Content-Type":"application/json"},body:JSON.stringify({URL:e})}).then((function(e){return e.json()})).then((function(e){return a.processStats(e)}))};return a.state={isLoading:!1,allStats:{},percentiles:a.props.percentiles,allCompetitions:[],selectedCompetitions:[],categories:{FW:["Non-Penalty Goals","Non-Penalty xG","Conversion Rate","Shots on Target %","Assists","xA","Passes into the Penalty Area","Pass Completion %","Successful Dribbles","Dribble Success %","Turnovers","Recoveries"],AM:["Non-Penalty Goals","Non-Penalty xG","Assists","xA","Passes into the Penalty Area","Pass Completion %","Completed Crosses","Cross Completion %","Successful Dribbles","Dribble Success %","Turnovers","Recoveries"],CM:["Non-Penalty Goals + Assists","Non-Penalty xG + xA","Passes into the Final 1/3","Pass Completion %","Completed Long Passes","Long Pass Completion %","Successful Dribbles","Dribble Success %","Interceptions","Tackles Won","Tackle Win %","Fouls Committed"],FB:["Assists","xA","Passes into the Final 1/3","Pass Completion %","Completed Crosses","Cross Completion %","Successful Dribbles","Dribble Success %","Interceptions","Tackles Won","Tackle Win %","Fouls Committed"],CB:["Passes into the Final 1/3","Pass Completion %","Completed Long Passes","Long Pass Completion %","Interceptions","Tackles Won","Tackle Win %","Fouls Committed","Aerial Duels Won","Aerial Duel Win %","Blocks","Clearances"],"N/A":["-","-","-","-","-","-","-","-","-","-","-","-"]},selectedCategories:null,template:null,labelType:"raw",name:"",age:0,url:"",isAll:!1,multipleClubs:!1,isMobile:a.props.isMobile,creditsPosition:"right",animation:!0,fontSizes:{title:!0===a.props.isMobile?"4vw":"2em",subtitle:!0===a.props.isMobile?"2.7vw":"1.4em",noData:!0===a.props.isMobile?"2.7vw":"1.35em",xAxisLabels:!0===a.props.isMobile?"2.3vw":"1.15em",dataLabels:!0===a.props.isMobile?"2.3vw":"1.25em",dataLabelsOutline:!0===a.props.isMobile?"0.3vw":"0.2em",tooltipHeader:!0===a.props.isMobile?"2.3vw":"1em",tooltip:!0===a.props.isMobile?"2.3vw":"1.25em",credits:!0===a.props.isMobile?"2.2vw":"1.15em",yAxisLabels:!0===a.props.isMobile?"1vw":"0.5em"}},a.processStats=a.processStats.bind(Object(h.a)(a)),a.changeTemplate=a.changeTemplate.bind(Object(h.a)(a)),a.changeSelectedCompetitions=a.changeSelectedCompetitions.bind(Object(h.a)(a)),a.changeLabelType=a.changeLabelType.bind(Object(h.a)(a)),a.selectAllCompetitions=a.selectAllCompetitions.bind(Object(h.a)(a)),a.clearAllCompetitions=a.clearAllCompetitions.bind(Object(h.a)(a)),a.toggleCreditsPosition=a.toggleCreditsPosition.bind(Object(h.a)(a)),a.exportAsImage=a.exportAsImage.bind(Object(h.a)(a)),a.filterStats=a.filterStats.bind(Object(h.a)(a)),a.calculateChartInput=a.calculateChartInput.bind(Object(h.a)(a)),a.percentRank=a.percentRank.bind(Object(h.a)(a)),a.roundNumbers=a.roundNumbers.bind(Object(h.a)(a)),a.ordinalSuffix=a.ordinalSuffix.bind(Object(h.a)(a)),a.insertChartInput=a.insertChartInput.bind(Object(h.a)(a)),a}return Object(m.a)(t,e),Object(o.a)(t,[{key:"componentDidMount",value:function(){var e=this;this.setState({isLoading:!0},(function(){e.getStats()})),this.chartRef=this.chartRef=n.a.createRef()}},{key:"processStats",value:function(e){var t=this.state.categories,a=1!==e.club.length,s=t[e.position];this.setState({url:e.url,name:e.name,age:e.age,club:e.club[0],template:e.position,selectedCategories:s,lastUpdated:e.lastUpdated,allStats:e.stats,allCompetitions:Object.keys(e.stats),selectedCompetitions:Object.keys(e.stats),isLoading:!1,multipleClubs:a},(function(){}))}},{key:"changeSelectedCompetitions",value:function(e){var t=this.state.selectedCompetitions,a=e.target.value;t.includes(a)?t.splice(t.indexOf(a),1):t.push(a),this.setState({selectedCompetitions:t,animation:!0})}},{key:"selectAllCompetitions",value:function(e){var t=JSON.parse(JSON.stringify(this.state.allCompetitions));this.setState({selectedCompetitions:t})}},{key:"clearAllCompetitions",value:function(e){this.setState({selectedCompetitions:[]})}},{key:"toggleCreditsPosition",value:function(e){var t;t="right"===this.state.creditsPosition?"center":"right",this.setState({creditsPosition:t})}},{key:"exportAsImage",value:function(){var e=this.state.name,t=document.getElementsByClassName("highcharts-container")[0];O.a.toPng(t,{bgcolor:"#fafbfc"}).then((function(t){window.saveAs(t,"".concat(e.replace(" ","-"),".png"))})).catch((function(e){console.error("oops, something went wrong!",e)}))}},{key:"changeTemplate",value:function(e){var t=this,a=e.target.value;this.setState({template:a,animation:!0},(function(){t.setCategories()}))}},{key:"setCategories",value:function(){var e=this.state.template,t=this.state.categories[e];this.setState({selectedCategories:t})}},{key:"changeLabelType",value:function(e){var t=e.target.value;this.setState({labelType:t,animation:!1})}},{key:"filterStats",value:function(e){var t={},a=this.state.selectedCompetitions;for(var s in e)if(a.includes(s))for(var n in e[s])n in t?t[n]+=e[s][n]:t[n]=e[s][n];return t}},{key:"calculateChartInput",value:function(e,t){var a={},s={};switch(this.state.template){case"FW":for(var n in a.goals=e.goals/(e.minutes/90),a.xG=e.xG/(e.minutes/90),a.conversionRate=e.goals/(e.shots-e.penaltiesTaken)*100,a.shotsOnTarget=(e.shotsOnTarget-e.penaltiesTaken)/(e.shots-e.penaltiesTaken)*100,a.assists=e.assists/(e.minutes/90),a.xA=e.xA/(e.minutes/90),a.PPA=e.PPA/(e.minutes/90),a.passingRate=e.succPasses/e.totalPasses*100,a.succDribbles=e.succDribbles/(e.minutes/90),a.dribbleRate=e.succDribbles/e.totalDribbles*100,a.possessionLosses=e.possessionLosses/(e.minutes/90),a.recoveries=e.tackles/(e.minutes/90)+e.interceptions/(e.minutes/90),a)s[n]=100*this.percentRank(t.fw[n],a[n]);s.possessionLosses=100-s.possessionLosses;break;case"AM":for(var l in a.goals=e.goals/(e.minutes/90),a.xG=e.xG/(e.minutes/90),a.assists=e.assists/(e.minutes/90),a.xA=e.xA/(e.minutes/90),a.PPA=e.PPA/(e.minutes/90),a.passingRate=e.succPasses/e.totalPasses*100,a.succCrosses=e.succCrosses/(e.minutes/90),a.crossRate=e.succCrosses/e.totalCrosses*100,a.succDribbles=e.succDribbles/(e.minutes/90),a.dribbleRate=e.succDribbles/e.totalDribbles*100,a.possessionLosses=e.possessionLosses/(e.minutes/90),a.recoveries=e.tackles/(e.minutes/90)+e.interceptions/(e.minutes/90),a)s[l]=100*this.percentRank(t.am[l],a[l]);s.possessionLosses=100-s.possessionLosses;break;case"CM":for(var r in a.goalsPlusAssists=(e.goals+e.assists)/(e.minutes/90),a.xGPlusxA=(e.xG+e.xA)/(e.minutes/90),a.PFT=e.PFT/(e.minutes/90),a.passingRate=e.succPasses/e.totalPasses*100,a.succLongPasses=e.succLongPasses/(e.minutes/90),a.longPassingRate=e.succLongPasses/e.totalLongPasses*100,a.succDribbles=e.succDribbles/(e.minutes/90),a.dribbleRate=e.succDribbles/e.totalDribbles*100,a.interceptions=e.interceptions/(e.minutes/90),a.tackles=e.tackles/(e.minutes/90),a.tackleRate=e.tackles/(e.tackles+e.dribbledPast)*100,a.fouls=e.fouls/(e.minutes/90),a)s[r]=100*this.percentRank(t.cm[r],a[r]);s.fouls=100-s.fouls;break;case"FB":for(var i in a.assists=e.assists/(e.minutes/90),a.xA=e.xA/(e.minutes/90),a.PFT=e.PFT/(e.minutes/90),a.passingRate=e.succPasses/e.totalPasses*100,a.succCrosses=e.succCrosses/(e.minutes/90),a.crossRate=e.succCrosses/e.totalCrosses*100,a.succDribbles=e.succDribbles/(e.minutes/90),a.dribbleRate=e.succDribbles/e.totalDribbles*100,a.interceptions=e.interceptions/(e.minutes/90),a.tackles=e.tackles/(e.minutes/90),a.tackleRate=e.tackles/(e.tackles+e.dribbledPast)*100,a.fouls=e.fouls/(e.minutes/90),a)s[i]=100*this.percentRank(t.fb[i],a[i]);s.fouls=100-s.fouls;break;case"CB":for(var o in a.PFT=e.PFT/(e.minutes/90),a.passingRate=e.succPasses/e.totalPasses*100,a.succLongPasses=e.succLongPasses/(e.minutes/90),a.longPassingRate=e.succLongPasses/e.totalLongPasses*100,a.interceptions=e.interceptions/(e.minutes/90),a.tackles=e.tackles/(e.minutes/90),a.tackleRate=e.tackles/(e.tackles+e.dribbledPast)*100,a.fouls=e.fouls/(e.minutes/90),a.succAerialDuels=e.succAerialDuels/(e.minutes/90),a.aerialDuelRate=e.succAerialDuels/e.totalAerialDuels*100,a.blocks=e.blocks/(e.minutes/90),a.clearances=e.clearances/(e.minutes/90),a)s[o]=100*this.percentRank(t.cb[o],a[o]);s.fouls=100-s.fouls;break;case"N/A":for(var c in a.goals=0,a.xG=0,a.conversionRate=0,a.shotsOnTarget=0,a.assists=0,a.xA=0,a.PPA=0,a.passingRate=0,a.succDribbles=0,a.dribbleRate=0,a.possessionLosses=0,a.recoveries=0,a)s[c]=0}return this.insertChartInput(a,s)}},{key:"percentRank",value:function(e,t){isFinite(t)||(t=0);for(var a=0,s=e.length;a<s;a++)if(t<e[a]){for(;a<s&&t===e[a];)a++;return 0===a?0:(t!==e[a-1]&&(a+=(t-e[a-1])/(e[a]-e[a-1])),a/s)}return 1}},{key:"roundNumbers",value:function(e,t){for(var a in e)isFinite(e[a])?e[a]=Math.round(e[a]*Math.pow(10,t))/Math.pow(10,t):e[a]=0;return e}},{key:"ordinalSuffix",value:function(e){var t=e%10,a=e%100;return 1===t&&11!==a?e+"st":2===t&&12!==a?e+"nd":3===t&&13!==a?e+"rd":e+"th"}},{key:"insertChartInput",value:function(e,t){var a=this.state.template,s=[];s="FW"===a?[5,5,5,5,6,6,6,6,2,2,2,0]:"AM"===a?[5,5,6,6,6,6,6,6,2,2,2,0]:"CM"===a?[8,8,6,6,6,6,2,2,0,0,0,0]:"FB"===a?[6,6,6,6,6,6,2,2,0,0,0,0]:"CB"===a?[6,6,6,6,0,0,0,0,0,0,0,0]:[0,0,0,0,0,0,0,0,0,0,0,0],e=this.roundNumbers(e,2),t=this.roundNumbers(t,0);var n=[],l=0;for(var r in t)n[l]={y:t[r],percentile:this.ordinalSuffix(t[r]),p90:e[r],color:x.a.Color(x.a.getOptions().colors[s[l]]).setOpacity(.85).get()},l++;return n}},{key:"render",value:function(){var e=this.state,t=e.name,a=e.age,s=e.url,l=e.club,r=e.lastUpdated,i=e.selectedCompetitions,o=e.template,c=e.selectedCategories,u=e.labelType,m=e.allStats,p=e.percentiles,h=e.isLoading,d=e.multipleClubs,f=e.fontSizes,y=e.creditsPosition,v=e.animation,E=e.isMobile;if(h)return n.a.createElement(g,null);for(var C=this.state.allCompetitions,k=[],S=0;S<C.length;S++){var P=C[S],w=i.includes(P),O=P;d||(O=O.substring(0,O.indexOf("|")-1)),k.push(n.a.createElement("label",{className:w?"selected-label":null},n.a.createElement("input",{className:"competition",type:"checkbox",value:P,onChange:this.changeSelectedCompetitions,checked:w})," ","  "+O))}if(0!==p.length&&0!==Object.keys(m).length&&c!==[]){var N,j=this.filterStats(m),L="";if(0!==i.length){switch(L="Age: ".concat(a," \u2551 Minutes Played: ").concat(j.minutes.toLocaleString(),"<br/>"),N=[this.calculateChartInput(j,p)],o){case"FW":L+="vs Top-5 League Players with 10+ Starts as Forwards<br/>";break;case"AM":L+="vs Top-5 League Players with 10+ Starts as Attacking Midfielders / Wingers<br/>";break;case"CM":L+="vs Top-5 League Players with 10+ Starts as Central / Defensive Midfielders<br/>";break;case"FB":L+="vs Top-5 League Players with 10+ Starts as Full-backs<br/>";break;case"CB":L+="vs Top-5 League Players with 10+ Starts as Center-backs<br/>";break;case"N/A":L+="No template selected<br/>"}L+="N/A"!==o?"Percentile Rank Bars w/ Per 90 Stats<br/>":"-<br/>"}else N=[],L="-<br>-<br>-";var R="Last Updated: ".concat(r," UTC ").concat(E?"<br/>.<br/>":"<br/>","Sources: Opta (via WhoScored.com) & StatsBomb (via FBref.com)"),A=E?-40:-20,T={chart:{animation:v,backgroundColor:"rgba(0, 0, 0, 0)",style:{fontFamily:"sans-serif"},parallelCoordinates:!0,parallelAxes:{labels:{enabled:!1,style:{color:"#444444",fontSize:f.yAxisLabels}},gridZIndex:5,lineWidth:0,endOnTick:!0,showFirstLabel:!1,showLastLabel:!0,min:-15,max:100,tickPositions:[-15,0,25,50,75,100]},polar:!0,type:"column",spacingLeft:0,spacingRight:0,marginLeft:90,marginRight:90,marginBottom:"right"!==y||E?60:30,events:{load:function(){this.title.element.onclick=function(){window.open(s,"_blank")}}}},credits:{text:R,position:{align:y,y:A},style:{fontSize:f.credits},href:""},plotOptions:{series:{dataLabels:{enabled:"N/A"!==o,style:{fontWeight:"bold",fontSize:f.dataLabels,textOutline:f.dataLabelsOutline+" #fafbfc"},format:"raw"===u?"{point.p90}":"{point.percentile}",padding:0,allowOverlap:!0,z:7}}},title:{text:t+", 19/20",style:{color:"#e75453",fontSize:f.title,fontWeight:"bold"},margin:35},pane:{startAngle:-15},lang:{noData:"Select a competition"},noData:{attr:{zIndex:6},style:{fontWeight:"bold",fontSize:f.noData,color:"#303030"}},subtitle:{text:L,style:{fontWeight:"bold",fontSize:f.subtitle}},tooltip:{headerFormat:'<span style="font-size: '+f.tooltipHeader+'">{point.key}</span><br/>',pointFormat:'<span style="color:{point.color}">\u25cf</span> {series.name}<br>Raw Value: <b>{point.p90}</b><br/>Percentile Rank: <b>{point.percentile}</b>',style:{fontSize:f.tooltip}},legend:{enabled:!1,borderWidth:1,align:"center",verticalAlign:"bottom",layout:"horizontal"},xAxis:{categories:c,labels:{zIndex:1,distance:!0===E?60:40,style:{color:"black",fontSize:f.xAxisLabels},padding:31},gridLineWidth:1.5,gridLineColor:"#333333",gridZIndex:4},series:N.map((function(e,a){return{pointPadding:0,groupPadding:0,name:t,data:e,stickyTracking:!1,zIndex:0}})),exporting:{scale:1,sourceWidth:1920,sourceHeight:1080,buttons:{contextButton:{menuItems:["viewFullscreen","printChart"]}}}}}return n.a.createElement("div",{id:"main2"},n.a.createElement(b,{type:2}),n.a.createElement("div",{className:"screen2",id:"content-screen"},n.a.createElement("div",{className:"filter",id:"chart-filters"},n.a.createElement("div",{className:"chart-filter-inputs",id:"chart-filter-inputs-laptop"},n.a.createElement("h3",null,"Template"),n.a.createElement("form",{id:"templates",onChange:this.changeTemplate},n.a.createElement("label",null,n.a.createElement("input",{type:"radio",name:"template",value:"FW",checked:"FW"===o||null})," Forward "),n.a.createElement("label",null,n.a.createElement("input",{type:"radio",name:"template",value:"AM",checked:"AM"===o||null})," Attacking Midfielder / Winger"),n.a.createElement("label",null,n.a.createElement("input",{type:"radio",name:"template",value:"CM",checked:"CM"===o||null})," Central / Defensive Midfielder"),n.a.createElement("label",null,n.a.createElement("input",{type:"radio",name:"template",value:"FB",checked:"FB"===o||null})," Full-back "),n.a.createElement("label",null,n.a.createElement("input",{type:"radio",name:"template",value:"CB",checked:"CB"===o||null})," Center-back ")),n.a.createElement("h3",null,"Competitions"),n.a.createElement("h4",{style:{marginBottom:"10px"}},"19/20 ",!1===d?" | "+l:null),n.a.createElement("form",{id:"competitions"},k),n.a.createElement("h3",null,"Data Labels"),n.a.createElement("form",{id:"data-labels",onChange:this.changeLabelType},n.a.createElement("label",{className:"raw"===u?"selected-label":null},n.a.createElement("input",{type:"radio",name:"labelType",value:"raw",checked:"raw"===u||null})," ",n.a.createElement("span",null,"Per 90 Stats")),n.a.createElement("label",{className:"percentiles"===u?"selected-label":null},n.a.createElement("input",{type:"radio",name:"labelType",value:"percentiles",checked:"percentiles"===u||null})," ",n.a.createElement("span",null,"Percentile Ranks")))),n.a.createElement("div",{className:"chart-filter-inputs",id:"chart-filter-inputs-mobile"},n.a.createElement("div",{id:"templates-container"},n.a.createElement("h3",null,"Template"),n.a.createElement("form",{id:"templates",onChange:this.changeTemplate},n.a.createElement("label",{className:"FW"===o?"selected-label":null},n.a.createElement("input",{type:"radio",name:"template",value:"FW",checked:"FW"===o||null})," ",n.a.createElement("span",null,"Forward")),n.a.createElement("label",{className:"AM"===o?"selected-label":null},n.a.createElement("input",{type:"radio",name:"template",value:"AM",checked:"AM"===o||null})," ",n.a.createElement("span",null,"Attacking Midfielder / Winger")),n.a.createElement("label",{className:"CM"===o?"selected-label":null},n.a.createElement("input",{type:"radio",name:"template",value:"CM",checked:"CM"===o||null})," ",n.a.createElement("span",null,"Central / Defensive Midfielder")),n.a.createElement("label",{className:"FB"===o?"selected-label":null},n.a.createElement("input",{type:"radio",name:"template",value:"FB",checked:"FB"===o||null})," ",n.a.createElement("span",null,"Full-back")),n.a.createElement("label",{className:"CB"===o?"selected-label":null},n.a.createElement("input",{type:"radio",name:"template",value:"CB",checked:"CB"===o||null})," ",n.a.createElement("span",null,"Center-back")))),n.a.createElement("div",{id:"competitions-container"},n.a.createElement("h3",{style:{marginBottom:"0px"}},"Competitions"),n.a.createElement("h4",{style:{marginBottom:"20px"}},"19/20 ",!1===d?" | "+l:null),n.a.createElement("form",{id:"competitions"},k)),n.a.createElement("h3",null,"Data Labels"),n.a.createElement("form",{id:"data-labels",onChange:this.changeLabelType},n.a.createElement("label",{className:"raw"===u?"selected-label":null},n.a.createElement("input",{type:"radio",name:"labelType",value:"raw",checked:"raw"===u||null})," ",n.a.createElement("span",null,"Per 90 Stats")),n.a.createElement("label",{className:"percentiles"===u?"selected-label":null},n.a.createElement("input",{type:"radio",name:"labelType",value:"percentiles",checked:"percentiles"===u||null})," ",n.a.createElement("span",null,"Percentile Ranks")))),n.a.createElement("div",{id:"filter-buttons"},n.a.createElement("div",{className:"filter-button"},n.a.createElement("button",{id:"toggleCreditsButton",type:"button",onClick:this.toggleCreditsPosition},"Toggle Credits Position")),n.a.createElement("div",{className:"filter-button"},n.a.createElement("button",{id:"exportButton",type:"button",onClick:this.exportAsImage},"Export Chart as PNG")),n.a.createElement("div",{className:"filter-button"},n.a.createElement("button",{id:"compareButton",type:"button",disabled:!0},"Compare To...")))),n.a.createElement("div",{className:"result",id:"chart"},n.a.createElement(M.a,{constructorType:"chart",highcharts:x.a,containerProps:{style:{width:"100%"}},options:T,ref:this.chartRef}))))}}]),t}(s.Component),F=a(20),D=a.n(F),W=function(e){function t(e){var a;return Object(i.a)(this,t),(a=Object(c.a)(this,Object(u.a)(t).call(this,e))).getPercentiles=function(){fetch("/api/percentiles",{method:"post",headers:{"Content-Type":"application/json"},body:JSON.stringify({})}).then((function(e){return e.json()})).then((function(e){return a.setState({percentiles:e})})).catch()},a.state={percentiles:{},isMobile:!1},a}return Object(m.a)(t,e),Object(o.a)(t,[{key:"componentDidMount",value:function(){var e=!1,t=this;D()((function(){if("rgb(250, 251, 253)"===D()("body").css("background-color")&&(e=!0),e){var a=Math.max(document.documentElement.clientHeight,window.innerHeight||0);D()("html, body, #root, #root-container").css({height:a}),D()("#home").css({height:a}),t.setState({isMobile:e})}})),this.getPercentiles()}},{key:"render",value:function(){var e=this;return n.a.createElement(p.c,null,n.a.createElement((function(){return n.a.createElement("div",{id:"root-container"},n.a.createElement(p.c,null,n.a.createElement(p.a,{exact:!0,path:"/",component:E}),n.a.createElement(p.a,{path:"/search/:query/:searchByClub?",component:P}),n.a.createElement(p.a,{path:"/stats/:URL",render:function(t){return n.a.createElement(B,Object.assign({},t,{percentiles:e.state.percentiles,isMobile:e.state.isMobile}))}})))}),null))}}]),t}(s.Component);Object(l.render)(n.a.createElement(r.a,null,n.a.createElement(W,null)),document.getElementById("root"))}},[[37,1,2]]]);
//# sourceMappingURL=main.74688910.chunk.js.map