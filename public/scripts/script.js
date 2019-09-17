var socket = io();

let radar;

let stats = {};
let competitions = [];

let name;
let club;
let nationality;

function search(){
    if ($('#loading-screen').css('display') === 'none') {
        $('.highcharts-data-table').remove();
        let query = $('#query').val();
        socket.emit('search', query);
        $("#search-screen").css("display", "none");
        $("#content-screen").css("display", "none");
        $('#loading-screen').empty();
        $('#loading-screen').append('Searching');
        $('#loading-screen').append('<br><br>');
        $('#loading-screen').append('<div id="circularG"> <div id="circularG_1" class="circularG"></div> ' +
            '<div id="circularG_2" class="circularG"></div> <div id="circularG_3" class="circularG"></div> ' +
            '<div id="circularG_4" class="circularG"></div> <div id="circularG_5" class="circularG"></div> ' +
            '<div id="circularG_6" class="circularG"></div> <div id="circularG_7" class="circularG"></div> ' +
            '<div id="circularG_8" class="circularG"></div> </div>');
        $("#loading-screen").css("display", "flex");
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
    $("#loading-screen").css("display","none");
    $("#search-screen").css("display","flex");
    $("#search-filters").css("display","block");
    $("#search-results").css("display","grid");
});

function getStats(elem){
    $('#filterByClub').empty();
    $('#filterByNationality').empty();
    $('#radar').empty();
    $('#competitions').empty();
    let url = $(elem).find('.url').text();
    name = $(elem).find('.name').text();
    club = $(elem).find('.club').text().substring(6);
    nationality = $(elem).find('.nationality').text().substring(13);
    socket.emit('scrape stats', url);
    $("#search-screen").css("display","none");
    $('#loading-screen').empty();
    $('#loading-screen').append('Retrieving Stats');
    $('#loading-screen').append('<br><br>');
    $('#loading-screen').append('<div id="circularG"> <div id="circularG_1" class="circularG"></div> ' +
        '<div id="circularG_2" class="circularG"></div> <div id="circularG_3" class="circularG"></div> ' +
        '<div id="circularG_4" class="circularG"></div> <div id="circularG_5" class="circularG"></div> ' +
        '<div id="circularG_6" class="circularG"></div> <div id="circularG_7" class="circularG"></div> ' +
        '<div id="circularG_8" class="circularG"></div> </div>');
    $("#loading-screen").css("display","flex");
}

socket.on('stats scraped', function(someStats){
    competitions = Object.keys(someStats);
    stats = someStats;
    for (let i=0; i<competitions.length; i++){
        $('#competitions').append('<input class="competition" type="checkbox" value=' + competitions[i] + ' checked> ' + competitions[i] + '<br><br>');
    }
    $('#radar').empty();
    $("#loading-screen").css("display","none");
    $("#content-screen").css("display","flex");
    updateRadar();
});

socket.on('alert error', function(anError){
    alert(anError + "\nPlease wait for the page to reload and try again");
    location.reload();
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
    radar = Highcharts.chart('radar', {
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
            type: 'line',
            maxWidth: 1000,
            hideDelay: 0,
            marginLeft: 100,
            marginRight: 100
        },
        plotOptions: {
            series: {
                softThreshold: false
            }
        },
        title: {
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
                stickyTracking: true
            };
        })
    });
}

function drawRadarFW(stats){
    let subtitle = 'FW / AM Template  |  per 90';
    let categories = [
        'Non-Penalty Goals',
        'Non-Penalty Shots',
        'Conversion Rate',
        '% Passes Completed',
        'Assists',
        'Key Passes',
        'Through Balls',
        'Recoveries',
        'Possession Losses',
        'Successful Dribbles'
    ];
    let yAxis = [
        {softMin: 0, softMax: 1},
        {softMin: 0, softMax: 7},
        {softMin: 0, softMax: 35},
        {softMin: 50, softMax: 100},
        {softMin: 0, softMax: 0.6},
        {softMin: 0, softMax: 4},
        {softMin: 0, softMax: 0.6},
        {softMin: 0, softMax: 3.3},
        {softMin: 0, softMax: 7, reversed: true},
        {softMin: 0, softMax: 6}
    ];
    drawRadar(stats, subtitle, categories, yAxis);
}

function drawRadarMF(stats){
    let subtitle = 'CM / DM Template  |  per 90';
    let categories = [
        '% Passes Completed',
        'Assists',
        'Key Passes',
        'Through Balls',
        'Successful Dribbles',
        'Possession Losses',
        'Fouls Committed',
        '% Tackles Won',
        'Tackles Won',
        'Interceptions',
        'Long Balls'
    ];
    let yAxis = [
        {softMin: 50, softMax: 100},
        {softMin: 0, softMax: 0.5},
        {softMin: 0, softMax: 3},
        {softMin: 0, softMax: 0.4},
        {softMin: 0, softMax: 3},
        {softMin: 0, softMax: 4.5, reversed: true},
        {softMin: 0, softMax: 3.3, reversed: true},
        {softMin: 30, softMax: 75},
        {softMin: 0, softMax: 5},
        {softMin: 0, softMax: 5},
        {softMin: 0, softMax: 9}
    ];
    drawRadar(stats, subtitle, categories, yAxis);
}

function drawRadarFB(stats){
    let subtitle = 'FB Template  |  per 90';
    let categories = [
        'Tackles Won',
        'Interceptions',
        '% Passes Completed',
        'Assists',
        'Key Passes',
        'Successful Crosses',
        '% Crosses Completed',
        'Successful Dribbles',
        'Possession Losses',
        'Aerial Duels Won',
        '% Tackles Won',
        'Fouls Committed'
    ];
    let yAxis = [
        {softMin: 0, softMax: 5},
        {softMin: 0, softMax: 4},
        {softMin: 50, softMax: 100},
        {softMin: 0, softMax: 0.45},
        {softMin: 0, softMax: 2.5},
        {softMin: 0, softMax: 1.5},
        {softMin: 0, softMax: 40},
        {softMin: 0, softMax: 2.5},
        {softMin: 0, softMax: 4, reversed: true},
        {softMin: 0, softMax: 2},
        {softMin: 30, softMax: 85},
        {softMin: 0, softMax: 3, reversed: true},
    ];
    drawRadar(stats, subtitle, categories, yAxis);
}

function drawRadarDF(stats){
    let subtitle = 'CB Template  |  per 90';
    let categories = [
        '% Passes Completed',
        '% Tackles Won',
        'Tackles Won',
        'Interceptions',
        'Clearances',
        'Fouls Committed',
        '% Aerial Duels Won',
        'Aerial Duels Won',
        'Long Balls',
    ];
    let yAxis = [
        {softMin: 50, softMax: 100},
        {softMin: 45, softMax: 100},
        {softMin: 0, softMax: 4},
        {softMin: 0, softMax: 3},
        {softMin: 0, softMax: 10},
        {softMin: 0, softMax: 2.5, reversed: true},
        {softMin: 40, softMax: 85},
        {softMin: 0, softMax: 5},
        {softMin: 0, softMax: 8.5},
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

});

$(document).ready(function(){
    $("#filterByNationality").on("keyup", function() {
        let value = $(this).val().toLowerCase();
        $("#search-results .search-result").filter(function() {
            $(this).toggle($(this).children(".nationality").text().toLowerCase().indexOf(value) > -1)
        });
    });

    $("#filterByClub").on("keyup", function() {
        let value = $(this).val().toLowerCase();
        $("#search-results .search-result").filter(function() {
            $(this).toggle($(this).children(".club").text().toLowerCase().indexOf(value) > -1)
        });
    });

});