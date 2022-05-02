"use strict";

const topLeftX = 20;
const topLeftY = 20;
const bottomRightX = 437;
const bottomRightY = 290;

window.addEventListener("load", init);
var assistData;
var zoneData;

var xScale, yScale;
var widthScale, colorScale;

function selectAssistData() {
    let season = $("#assists-season-sel").val();
    console.log(season)
    return assistData[season]
}

function selectZoneData(){
    let season = $("#assists-season-sel").val();
    return zoneData[season]
}

function getStartX(pass) {
    let start_x = pass['start_x'];
    return xScale(start_x);
}

function getStartY(pass) {
    let start_y = pass['start_y'];
    return yScale(start_y);
}

function updateZones() {
    let selZoneData = selectZoneData();
    console.log(selZoneData)

    var colorDomain = d3.extent(selZoneData, function(d) {return d.count;});

    var cellColor = d3.scaleLinear()
        .domain(colorDomain)
        .range(["white", "red"])

    const svg = d3.select("svg");
    
    svg.selectAll("rect")
        .data(selZoneData)
        .join(
            enterSelection => {
                enterSelection.append("rect")
                    .attr("x", d => xScale(d.zone_x))
                    .attr("y", d => yScale(d.zone_y))
                    .attr("width", d => xScale(d.zone_w)-20)
                    .attr("height", d => yScale(d.zone_h)-20)
                    .style("stroke", "grey")
                    .style("stroke-opacity", 0.5)
                    .style("fill", d => cellColor(d.count))
                    .style("opacity", 0.6)
                    .transition()
                        .duration(500)
            },
            updateSelection => {
                updateSelection.transition()
                    .duration(200)
                    .attr("x", d => xScale(d.zone_x))
                    .attr("y", d => yScale(d.zone_y))
                    .attr("width", d => xScale(d.zone_w)-20)
                    .attr("height", d => yScale(d.zone_h)-20)
                    .style("stroke", "grey")
                    .style("stroke-opacity", 0.5)
                    .style("fill", d => cellColor(d.count))
                    .style("opacity", 0.6)
                    .transition()
                        .duration(500)
            },
            exitSelection => {
                exitSelection.transition()
                    .duration(500)
                    .attr('opacity', 0)
                    .remove();
            }
        );
}

function updateAssists() {
    let selAssistData = selectAssistData();
    
    const svg = d3.select("svg");

    svg.selectAll("circle")
        .data(selAssistData)
        .join(
            enterSelection => {
                enterSelection.append("circle")
                    .attr("cx", pass => getStartX(pass))
                    .attr("cy", pass => getStartY(pass))
                    .attr("r", 3)
                    .attr("fill", "black")
                    .attr("fill-opacity","0")
                    .style("stroke","black")
                    .style("stroke-width","1px")
                    .transition()
                        .duration(500)
            },
            updateSelection => {
                updateSelection.transition()
                    .duration(200)
                    .attr("cx", pass => getStartX(pass))
                    .attr("cy", pass => getStartY(pass))
                    .attr("r", 3)
                    .attr("fill", "black")
                    .attr("fill-opacity","0")
                    .style("stroke","black")
                    .style("stroke-width","1px")
            },
            exitSelection => {
                exitSelection.transition()
                    .duration(500)
                    .attr('opacity', 0)
                    .remove();
            }
        );
}

function init() {
    // data to SVG coordinate transforms
    xScale = d3.scaleLinear()
        .domain([0, 120])
        .range([topLeftX, bottomRightX]);
    yScale = d3.scaleLinear()
        .domain([0, 80])
        .range([topLeftY, bottomRightY]);

    // data loading and handling
    d3.json('http://localhost:12345/data/assist_zones_barcelona_clean.json')
    .then(function(data) {
        // console.log("zone data:", data);
        zoneData = data;

         // Set-up Handlers
         $("#assists-season-sel").on('change', function(event) {
            updateZones()
        });
        updateZones()
    })
    .catch(function(err) {
        console.log(err);
    });

    d3.json('http://localhost:12345/data/assists_barcelona_clean.json')
        .then(function(data) {
            // console.log("assist data:", data);
            assistData = data;

            // Populate dropdowns
            let seasons = Object.keys(data);
            $("#assists-team-sel").append(new Option('Barcelona', 'Barcelona'));
            seasons.sort().forEach(function(seasonOption) {
                $("#assists-season-sel").append(new Option(seasonOption, seasonOption))
                $("#assists-season-sel").val("La Liga \(2019/2020\)")
            });
            // Set-up Handlers
            $("#assists-season-sel").on('change', function(event) {
                updateAssists()
            });

            updateAssists()
        })
        .catch(function(err) {
            console.log(err);
        });
}
