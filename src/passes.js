"use strict";

const topLeftXPasses = 20;
const topLeftYPasses = 20;
const bottomRightXPasses = 437;
const bottomRightYPasses = 290;
const N_DICT = {'Champions League (2008/2009)': 1,
                'Champions League (2010/2011)': 1,
                'Champions League (2014/2015)': 1,
                'La Liga (2004/2005)': 7,
                'La Liga (2005/2006)': 17,
                'La Liga (2006/2007)': 26,
                'La Liga (2007/2008)': 28,
                'La Liga (2008/2009)': 31,
                'La Liga (2009/2010)': 35,
                'La Liga (2010/2011)': 33,
                'La Liga (2011/2012)': 37,
                'La Liga (2012/2013)': 32,
                'La Liga (2013/2014)': 31,
                'La Liga (2014/2015)': 38,
                'La Liga (2015/2016)': 33,
                'La Liga (2016/2017)': 34,
                'La Liga (2017/2018)': 36,
                'La Liga (2018/2019)': 34,
                'La Liga (2019/2020)': 33}

window.addEventListener("load", initPasses);
var passData, seasonData;
var xScalePasses, yScalePasses;
var widthScalePasses, colorScalePasses, lengthScalePasses, opacityScalePasses;
var completeFilter = [0, 100];
var lengthFilter = [0, 100];

function selectDataPasses() {
    let season = $("#passes-season-sel").val();
    seasonData = passData[season]
    lengthScalePasses = d3.scaleLinear().domain([0,100])
        .range(d3.extent(seasonData.map(p => p['length'])))
    let noun = N_DICT[season] > 1 ? ' matches' : ' match'
    $("#aggregate-number-passes").text('Aggregate over ' + N_DICT[season] + noun)
    return seasonData
}

function getOrthogonal(vector) { return [-vector[1], vector[0]]; }
function getMagnitude(vector) { return Math.sqrt(vector[0]**2 + vector[1]**2) }
function getThickPoint(thickEnd, passVector, width, sign) {
    let endOrth = getOrthogonal(passVector);
    let magnitude = getMagnitude(endOrth);
    let point = [xScalePasses(thickEnd[0]) + sign * endOrth[0] * width / magnitude,
                 yScalePasses(thickEnd[1]) + sign * endOrth[1] * width / magnitude]
    return point;
}
const taperMult = 1.5;
function getPath(pass) {
    let start = pass['start_location'];
    let end = pass['end_location'];
    let passVector = [xScalePasses(end[0])-xScalePasses(start[0]), yScalePasses(end[1])-yScalePasses(start[1])];
    let width = widthScalePasses(pass['count']);
    let line = d3.line();

    let taper = [xScalePasses(start[0]), yScalePasses(start[1])]
    let passMagnitude = getMagnitude(passVector)
    let shortTaper = [xScalePasses(end[0]) + taperMult * passVector[0] * width / passMagnitude,
                      yScalePasses
                    (end[1]) + taperMult * passVector[1] * width / passMagnitude];
    return line([taper, getThickPoint(end, passVector, width, 1),
                 shortTaper, getThickPoint(end, passVector, width, -1)])
}
function encodeColorPasses(pass) { return colorScalePasses(pass['complete']); }
function encodeOpacityPasses(pass) { return pass['count']; }

function updatePasses(data) {
    let maxClusterSize = data.map(p => p['count']).reduce((x,y) => x > y ? x : y);
    widthScalePasses = d3.scaleLinear()
        .domain(d3.extent(data.map(p => p['count'])))
        .range([1, 2]);
    
    data = data.filter(p => 
        p['length'] >= lengthScalePasses(lengthFilter[0]) & p['length'] <= lengthScalePasses(lengthFilter[1]))
    data = data.filter(p => 
        p['complete'] >= completeFilter[0] / 100 & p['complete'] <= completeFilter[1] / 100)
    
    const svg = d3.select("svg#field-aggregate");
    svg.selectAll("path")
        .data(data)
        .join(
            enterSelection => {
                enterSelection.append("path")
                    .attr("d", pass => getPath(pass))
                    .attr("opacity", 0)
                    .attr("fill", pass => encodeColorPasses(pass))
                    .transition()
                        .duration(200)
                        .attr("opacity", pass => opacityScalePasses(encodeOpacityPasses(pass) / maxClusterSize))
            },
            updateSelection => {
                updateSelection.transition()
                    .duration(200)
                    .attr("d", pass => getPath(pass))
                    .attr("fill", pass => encodeColorPasses(pass))
                    .attr("opacity", pass => opacityScalePasses(encodeOpacityPasses(pass) / maxClusterSize))
            },
            exitSelection => {
                exitSelection.transition()
                    .duration(200)
                    .attr('opacity', 0)
                    .remove();
            }
        );
}

function initPasses() {
    // $("#assists-season-sel").change(function() {
    //     $("#passes-season-sel").val(this.value);
    //     let data = selectDataPasses();
    //     updatePasses(data)
    // });

    // data to SVG coordinate transforms
    xScalePasses = d3.scaleLinear()
        .domain([0, 120])
        .range([topLeftXPasses, bottomRightXPasses]);
    yScalePasses = d3.scaleLinear()
        .domain([0, 80])
        .range([topLeftYPasses, bottomRightYPasses]);
    colorScalePasses = d3.scaleLinear().domain([0,1])
        .range(["red", "blue"])
    opacityScalePasses = d3.scaleLinear().domain([0,1])
        .range([0.05, 1])

    // setup sliders and restyle
    $("#length-slider").slider({
        range: true,
        min: 0,
        max: 100,
        values: [0,100], 
        stop: function(event, ui) { lengthFilter = ui.values; updatePasses(seasonData); }
    });
    $("#complete-slider").slider({
        range: true,
        min: 0,
        max: 100,
        values: [0,100],
        orientation: 'vertical',
        slide: function(event, ui) {
            let low = ui.values[0];
            let high = ui.values[1];
            $("#complete-slider > div").css('background',
                'linear-gradient(0deg,' + colorScalePasses(low / 100) + ',' + colorScalePasses(high / 100) + ')') },
        stop: function(event, ui) { completeFilter = ui.values; updatePasses(seasonData); }
    });

    $("#complete-slider").css('height', '240px');
    $("#complete-slider").css('background', '#dddddd');
    $("#complete-slider > div").css('background',
        'linear-gradient(0deg,' + colorScalePasses(0) + ',' + colorScalePasses(1) + ')')
    $("#length-slider").css('background', '#dddddd');
    $("#length-slider > div").css('background', '#000000');

    // data loading and handling
    d3.json('http://localhost:12345/data/passes_barcelona_aggregate.json')
        .then(function(data) {
            // console.log(data);
            passData = data;

            // Populate dropdowns
            let seasons = Object.keys(data);
            $("#passes-team-sel").append(new Option('Barcelona', 'Barcelona'));
            seasons.sort().forEach(function(seasonOption) {
                $("#passes-season-sel").append(new Option(seasonOption, seasonOption))
            });
            $("#passes-season-sel").val("La Liga \(2019/2020\)")
            
            // Set-up Handlers
            $("#passes-season-sel").on('change', function(event) {
                let data = selectDataPasses();
                updatePasses(data)
            });

            updatePasses(selectDataPasses())
        })
        .catch(function(err) {
            console.log(err);
        });

    console.log('Init finished.')
}
