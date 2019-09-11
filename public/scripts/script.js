var socket = io();

let stats = {};
let competitions = [];

let name;
let club;
let nationality;

function search(){
    if ($('#loading').css('display') === 'none') {
        $('.highcharts-data-table').remove();
        let query = $('#query').val();
        socket.emit('search', query);
        $("#search-screen").css("display", "none");
        $("#content-screen").css("display", "none");
        $('#loading').empty();
        $('#loading').append('Searching');
        $('#loading').append('<br><br>');
        $('#loading').append('<div id="circularG"> <div id="circularG_1" class="circularG"></div> ' +
            '<div id="circularG_2" class="circularG"></div> <div id="circularG_3" class="circularG"></div> ' +
            '<div id="circularG_4" class="circularG"></div> <div id="circularG_5" class="circularG"></div> ' +
            '<div id="circularG_6" class="circularG"></div> <div id="circularG_7" class="circularG"></div> ' +
            '<div id="circularG_8" class="circularG"></div> </div>');
        $("#loading").css("display", "flex");
    }
}

socket.on('search results', function(results){
    $('.search-filter-input').empty();
    $('#search-results').empty();
    for (let i=0; i<results.length; i++){
        let resultID = "result" + i;
        let name = results[i]["name"];
        let nationality = results[i]["nationality"];
        let club = results[i]["club"];
        let url = results[i]["URL"];
        $('#search-results').append('<div onclick="return getStats(this)" class="search-result" id="' + resultID + '">' +
            '<div class="name">' + name + '</div>' +
            '<div class="club">Club: ' + club + '</div>' +
            '<div class="nationality">Nationality: ' + nationality + '</div>' +
            '<div style="display:none" class="url">' + url + '</div>' +
            '</div>'
        );
    }
    $("#loading").css("display","none");
    $("#search-screen").css("display","flex");
    $("#search-filters").css("display","block");
    $("#search-results").css("display","grid");
});

function getStats(elem){
    $('#radar').empty();
    $('#competitions').empty();
    let url = $(elem).find('.url').text();
    name = $(elem).find('.name').text();
    club = $(elem).find('.club').text().substring(6);
    nationality = $(elem).find('.nationality').text().substring(13);
    socket.emit('scrape stats', url);
    $("#search-screen").css("display","none");
    $('#loading').empty();
    $('#loading').append('Retrieving Stats');
    $('#loading').append('<br><br>');
    $('#loading').append('<div id="circularG"> <div id="circularG_1" class="circularG"></div> ' +
        '<div id="circularG_2" class="circularG"></div> <div id="circularG_3" class="circularG"></div> ' +
        '<div id="circularG_4" class="circularG"></div> <div id="circularG_5" class="circularG"></div> ' +
        '<div id="circularG_6" class="circularG"></div> <div id="circularG_7" class="circularG"></div> ' +
        '<div id="circularG_8" class="circularG"></div> </div>');
    $("#loading").css("display","flex");
}

socket.on('stats scraped', function(someStats){
    competitions = Object.keys(someStats);
    stats = someStats;
    for (let i=0; i<competitions.length; i++){
        $('#competitions').append('<input class="competition" type="checkbox" value=' + competitions[i] + ' checked> ' + competitions[i] + '<br><br>');
    }
    $('#radar').empty();
    $("#loading").css("display","none");
    $("#content-screen").css("display","flex");
    updateRadar();
});

socket.on('error', function(){
    alert('An error has occurred. Please reload the page and try again');
});

function updateRadar(){
    competitions = [];
    $(".competition:checked").each(function () {
        competitions.push($(this).val());
    });
    let template = $("input[name='template']:checked").val();
    if (template === 'FW'){
        let fwStats = calculateForwardStats();
        drawRadarFW(fwStats);
    }
    else if (template === 'MF'){
        let mfStats = calculateMidfielderStats();
        drawRadarMF(mfStats);
    }
    else if (template === 'FB'){
        let fbStats = calculateFullbackStats();
        drawRadarFB(fbStats);
    }
    else {
        let dfStats = calculateDefenderStats();
        drawRadarDF(dfStats);
    }
}

function calculateForwardStats(){
    let filteredStats = filterStats(stats);
    let statsPer90 = {};
    statsPer90['goals'] = filteredStats['goals'] / (filteredStats['minutes']/90);
    statsPer90['shots'] = filteredStats['shots'] / (filteredStats['minutes']/90);
    statsPer90['conversionRate'] = (filteredStats['goals'] / filteredStats['shots']) * 100;
    statsPer90['passingPct'] = (filteredStats['succPasses'] / filteredStats['totalPasses']) * 100;
    statsPer90['assists'] = filteredStats['assists'] / (filteredStats['minutes']/90);
    statsPer90['keyPasses'] = filteredStats['keyPasses'] / (filteredStats['minutes']/90);
    statsPer90['throughBalls'] = filteredStats['throughBalls'] / (filteredStats['minutes']/90);
    statsPer90['tacklesAndInterceptions'] = (filteredStats['tackles'] / (filteredStats['minutes']/90)) + (filteredStats['interceptions'] / (filteredStats['minutes']/90));
    statsPer90['possessionLosses'] = filteredStats['possessionLosses'] / (filteredStats['minutes']/90);
    statsPer90['dribbles'] = filteredStats['dribbles'] / (filteredStats['minutes']/90);
    for (stat in statsPer90){
        statsPer90[stat] = Math.round(statsPer90[stat] * 100) / 100;
    }
    return Object.values(statsPer90);
}

function calculateMidfielderStats(){
    let filteredStats = filterStats(stats);
    let statsPer90 = {};
    statsPer90['passingPct'] = (filteredStats['succPasses'] / filteredStats['totalPasses']) * 100;
    statsPer90['assists'] = filteredStats['assists'] / (filteredStats['minutes']/90);
    statsPer90['keyPasses'] = filteredStats['keyPasses'] / (filteredStats['minutes']/90);
    statsPer90['throughBalls'] = filteredStats['throughBalls'] / (filteredStats['minutes']/90);
    statsPer90['dribbles'] = filteredStats['dribbles'] / (filteredStats['minutes']/90);
    statsPer90['possessionLosses'] = filteredStats['possessionLosses'] / (filteredStats['minutes']/90);
    statsPer90['fouls'] = filteredStats['fouls'] / (filteredStats['minutes']/90);
    statsPer90['tacklePct'] = (filteredStats['tackles'] / (filteredStats['tackles'] + filteredStats['dribbledPast'])) *100;
    statsPer90['tackles'] = (filteredStats['tackles'] / (filteredStats['minutes']/90));
    statsPer90['interceptions'] = (filteredStats['interceptions'] / (filteredStats['minutes']/90));
    statsPer90['longPasses'] = (filteredStats['longPasses'] / (filteredStats['minutes']/90));
    for (stat in statsPer90){
        statsPer90[stat] = Math.round(statsPer90[stat] * 100) / 100;
    }
    return Object.values(statsPer90);
}

function calculateFullbackStats(){
    let filteredStats = filterStats(stats);
    let statsPer90 = {};
    statsPer90['tackles'] = (filteredStats['tackles'] / (filteredStats['minutes']/90));
    statsPer90['interceptions'] = (filteredStats['interceptions'] / (filteredStats['minutes']/90));
    statsPer90['passingPct'] = (filteredStats['succPasses'] / filteredStats['totalPasses']) * 100;
    statsPer90['assists'] = filteredStats['assists'] / (filteredStats['minutes']/90);
    statsPer90['keyPasses'] = filteredStats['keyPasses'] / (filteredStats['minutes']/90);
    statsPer90['succCrosses'] = filteredStats['succCrosses'] / (filteredStats['minutes']/90);
    statsPer90['crossingPct'] = (filteredStats['succCrosses'] / filteredStats['totalCrosses']) * 100;
    statsPer90['dribbles'] = filteredStats['dribbles'] / (filteredStats['minutes']/90);
    statsPer90['possessionLosses'] = filteredStats['possessionLosses'] / (filteredStats['minutes']/90);
    statsPer90['succAerialDuels'] = filteredStats['succAerialDuels'] / (filteredStats['minutes']/90);
    statsPer90['tacklePct'] = (filteredStats['tackles'] / (filteredStats['tackles'] + filteredStats['dribbledPast'])) *100;
    statsPer90['fouls'] = filteredStats['fouls'] / (filteredStats['minutes']/90);
    for (stat in statsPer90){
        statsPer90[stat] = Math.round(statsPer90[stat] * 100) / 100;
    }
    return Object.values(statsPer90);
}

function calculateDefenderStats(){
    let filteredStats = filterStats(stats);
    let statsPer90 = {};
    statsPer90['passingPct'] = (filteredStats['succPasses'] / filteredStats['totalPasses']) * 100;
    statsPer90['tacklePct'] = (filteredStats['tackles'] / (filteredStats['tackles'] + filteredStats['dribbledPast'])) *100;
    statsPer90['tackles'] = (filteredStats['tackles'] / (filteredStats['minutes']/90));
    statsPer90['interceptions'] = (filteredStats['interceptions'] / (filteredStats['minutes']/90));
    statsPer90['clearances'] = filteredStats['clearances'] / (filteredStats['minutes']/90);
    statsPer90['fouls'] = filteredStats['fouls'] / (filteredStats['minutes']/90);
    statsPer90['aerialDuelPct'] = (filteredStats['succAerialDuels'] / filteredStats['totalAerialDuels']) * 100;
    statsPer90['succAerialDuels'] = filteredStats['succAerialDuels'] / (filteredStats['minutes']/90);
    statsPer90['longPasses'] = (filteredStats['longPasses'] / (filteredStats['minutes']/90));
    for (stat in statsPer90){
        statsPer90[stat] = Math.round(statsPer90[stat] * 100) / 100;
    }
    return Object.values(statsPer90);
}

function filterStats(stats){
    let filteredStats = {};
    for (let competition in stats){
        if (competitions.includes(competition)) {
            for (let stat in stats[competition]) {
                if (!(stat in filteredStats)) {
                    filteredStats[stat] = stats[competition][stat];
                } else {
                    filteredStats[stat] += stats[competition][stat];
                }
            }
        }
    }
    return filteredStats;
}

function drawRadar(stats, subtitle, categories, yAxis){
    let series = [stats];
    $('.highcharts-data-table').remove();
    Highcharts.chart('radar', {
        chart: {
            parallelCoordinates: true,
            parallelAxes: {
                labels: {
                    style: {
                        color: 'black'
                    }
                },
                gridLineWidth: 0,
                lineWidth: 1,
                showFirstLabel: false,
                showLastLabel: false
            },
            polar: true,
            maxWidth: 1000,
            hideDelay: 200
        },
        title: {
            // text: name + ' | ' + club + ' & ' + nationality,
            text: name,
            style: {
                fontSize: '2em'
            }
        },
        subtitle: {
            text: subtitle,
            style: {
                fontSize: '1.5em'
            }
        },
        tooltip: {
            // pointFormat: '<span style="color:{point.color}">\u25CF</span>' +
            //     '{series.name}: <b>{point.formattedValue}</b><br/>'
            pointFormat: '<span style="color:{point.color}">\u25CF</span>' +
                ' <b>{point.formattedValue}</b><br/>'
        },
        legend: {
            enabled: false,
            borderWidth: 1,
            align: 'center',
            verticalAlign: 'bottom',
            layout: 'horizontal'
        },
        xAxis: {
            categories: categories,
            labels: {
                distance: 30,
                style: {
                    fontSize: '1.3em'
                }
            },
            gridLineWidth: 0
        },
        yAxis: yAxis,
        series:
            series.map(function (set, i) {
            return {
                name: name,
                data: set,
                stickyTracking: false
            };
        })
    });
}

function drawRadarFW(stats){
    let subtitle = 'Forward Template | per 90';
    let categories = [
        'Non-penalty goals',
        'Non-penalty shots',
        'Conversion Rate',
        'Passing %',
        'Assists',
        'Key Passes',
        'Through Balls',
        'Tackles+Interceptions',
        'Possession Losses',
        'Successful Dribbles'
    ];
    let yAxis = [
        {min: 0, max: 1},
        {min: 0, max: 7},
        {min: 0, max: 50},
        {min: 50, max: 100},
        {min: 0, max: 0.6},
        {min: 0, max: 4},
        {min: 0, max: 0.6},
        {min: 0, max: 4},
        {min: 0, max: 7, reversed: true},
        {min: 0, max: 6}
    ];
    drawRadar(stats, subtitle, categories, yAxis);
}

function drawRadarMF(stats){
    let subtitle = 'Midfielder Template | per 90';
    let categories = [
        'Passing %',
        'Assists',
        'Key Passes',
        'Through Balls',
        'Successful Dribbles',
        'Possession Losses',
        'Fouls',
        'Tackle Success %',
        'Tackles',
        'Interceptions',
        'Long Balls'
    ];
    let yAxis = [
        {min: 50, max: 100},
        {min: 0, max: 0.6},
        {min: 0, max: 4},
        {min: 0, max: 0.6},
        {min: 0, max: 6},
        {min: 0, max: 6, reversed: true},
        {min: 0, max: 5, reversed: true},
        {min: 30, max: 75},
        {min: 0, max: 5},
        {min: 0, max: 4},
        {min: 0, max: 10}
    ];
    drawRadar(stats, subtitle, categories, yAxis);
}

function drawRadarFB(stats){
    let subtitle = 'Fullback Template | per 90';
    let categories = [
        'Tackles',
        'Interceptions',
        'Passing %',
        'Assists',
        'Key Passes',
        'Completed Crosses',
        'Crossing %',
        'Successful Dribbles',
        'Possession Losses',
        'Aerial Duels Won',
        'Tackle Success %',
        'Fouls'
    ];
    let yAxis = [
        {min: 0, max: 5},
        {min: 0, max: 4},
        {min: 50, max: 100},
        {min: 0, max: 0.6},
        {min: 0, max: 4},
        {min: 0, max: 1.5},
        {min: 0, max: 40},
        {min: 0, max: 4},
        {min: 0, max: 3, reversed: true},
        {min: 0, max: 2},
        {min: 30, max: 85},
        {min: 0, max: 4, reversed: true},
    ];
    drawRadar(stats, subtitle, categories, yAxis);
}

function drawRadarDF(stats){
    let subtitle = 'Central Defender Template | per 90';
    let categories = [
        'Passing %',
        'Tackle Success %',
        'Tackles',
        'Interceptions',
        'Clearances',
        'Fouls',
        'Aerial Success %',
        'Aerial Duels Won',
        'Long Balls',
    ];
    let yAxis = [
        {min: 50, max: 100},
        {min: 30, max: 75},
        {min: 0, max: 5},
        {min: 0, max: 4},
        {min: 0, max: 10},
        {min: 0, max: 3, reversed: true},
        {min: 30, max: 100},
        {min: 0, max: 5},
        {min: 0, max: 6},
    ];
    drawRadar(stats, subtitle, categories, yAxis);
}

function selectAllSeasons(){
    $('#competitions').trigger("reset");
}

function clearAllSeasons(){
    $('input:checkbox').prop("checked", false);
}

$("#searchbar").submit(function(e) {
    e.preventDefault();
});

$("#competitions").submit(function(e) {
    e.preventDefault();
});

$(document).ready(function(){
    $("#filterByClub").on("keyup", function() {
        let value = $(this).val().toLowerCase();
        $("#search-results .search-result").filter(function() {
            $(this).toggle($(this).children(".club").text().toLowerCase().indexOf(value) > -1)
        });
    });
});

$(document).ready(function(){
    $("#filterByNationality").on("keyup", function() {
        let value = $(this).val().toLowerCase();
        $("#search-results .search-result").filter(function() {
            $(this).toggle($(this).children(".nationality").text().toLowerCase().indexOf(value) > -1)
        });
    });
});


