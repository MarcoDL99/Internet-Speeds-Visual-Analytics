import dataset from "./main.js";
import { focus, stopFocus, selectObject, selectMultipleObjects, deselectMultipleObjects, checkSelection, checkSomethingSelected } from "./main.js";
var zoomEvent, map, level
async function drawMap(newLevel, dataName) {
    level = newLevel
    const mapPaths = { "city": "./static/maps_geojson/limits_IT_municipalities.geojson", "province": "./static/maps_geojson/limits_IT_provinces.geojson", "region": "./static/maps_geojson/limits_IT_regions.geojson" };
    const measureUnits = {
        "downloadSpeed_mbps": "MBps",
        "uploadSpeed_mbps": "MBps",
        "tests": "",
        "latency_ms": "ms",
    }
    const domains = {
        "city": {
            "downloadSpeed_mbps": [0, 25, 50, 100, 250, 500, 1000],
            "uploadSpeed_mbps": [0, 10, 25, 75, 125, 200, 350],
            "latency_ms": [0, 15, 30, 50, 200, 500, 1500],
            "tests": [0, 250, 500, 1000, 5000, 40000, 260000],
        },
        "province": {
            "downloadSpeed_mbps": [0, 80, 90, 100, 125, 150, 220],
            "uploadSpeed_mbps": [0, 40, 50, 60, 80, 100, 130],
            "latency_ms": [0, 10, 15, 20, 25, 30, 35],
            "tests": [0, 10000, 25000, 50000, 100000, 250000, 450000],
        },
        "region": {
            "downloadSpeed_mbps": [0, 100, 115, 130, 140, 145, 155],
            "uploadSpeed_mbps": [0, 50, 60, 65, 70, 75, 80],
            "latency_ms": [0, 15, 17.5, 20, 22.5, 25, 28],
            "tests": [0, 50000, 100000, 250000, 300000, 500000, 800000],
        }
    }
    d3.select("#svgMap").remove();
    d3.select("#choroplethMap").style("background-image", "url(./static/gif/giphy.gif)") //Show the "Loading" GIF


    let topojson = await (await fetch(mapPaths[level])).json() // request data from the server
    // Remove old map if there is already one
    var widthMap = document.getElementById("choroplethMap").clientWidth
    var heightMap = document.getElementById("choroplethMap").clientHeight
    var projection, path;
    projection = d3.geoIdentity()
        .reflectY(true)
        .fitSize([widthMap, heightMap], topojson);

    path = d3.geoPath().projection(projection);
    var zoom = d3.zoom()
        .scaleExtent([0.5, 20]) // This control how much you can unzoom (x0.5) and zoom (x20)
        .extent([
            [0, 0],
            [widthMap, heightMap],
        ])
        .on("start", function (event) {
            if (event.sourceEvent.type == "mousedown") {
                d3.select("#svgMap").style("cursor", "grabbing");
                d3.selectAll("#mapPath").style("cursor", "grabbing");
            }

        })
        .on("zoom", handleZoom)
        .on("end", function (event) {
            if (event.sourceEvent.type == "mouseup") {
                d3.select("#svgMap").style("cursor", "grab");
                d3.selectAll("#mapPath").style("cursor", "pointer");

            }
        });

    // resetZoom(0) //Needed here otherwise if you recreate the map the zoom is not reset
    document.getElementById("resetZoomMap").addEventListener("click", resetZoom)

    var tooltip = d3.select("body")
        .append("div")
        .style("opacity", 1)
        .style("position", "absolute")
        .attr("id", "tooltip_map")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "2px")
        .style("visibility", "hidden")
        .style("font-size", "15px")
        .style("z-index", "10")
        .text("");


    var colorScale;
    if (dataName != "stateOfWorks") {
        var ranges = {
            min: 100000,
            max: 0
        };
        dataset[level].forEach(function (value, key) {
            ranges.min = Math.min(ranges.min, value[0][dataName])
            ranges.max = Math.max(ranges.max, value[0][dataName])
        })
        colorScale = d3.scaleThreshold()
            // .domain([0, ranges.min + 0.05 * (ranges.max - ranges.min), ranges.min + 0.10 * (ranges.max - ranges.min), ranges.min + 0.20 * (ranges.max - ranges.min),
            //     ranges.min + 0.40 * (ranges.max - ranges.min), ranges.min + 0.80 * (ranges.max - ranges.min), ranges.max])
            .domain(domains[level][dataName])
            .range(['#f0f9e8', '#ccebc5', '#a8ddb5', '#7bccc4', '#4eb3d3', '#2b8cbe', '#08589e'])
    }

    else {
        colorScale = d3.scaleOrdinal()
            .domain(["unknown", "in definitive planning", "in executive planning", "scheduled", "being implemented", "in progress", "being tested", "done"])
            .range(['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a'])
    }
    map = d3.select("#choroplethMap")
        .call(zoom)
        .append("svg")
        .attr("cursor", "grab")
        .attr("id", "svgMap")
        .attr("width", widthMap)
        .attr("height", heightMap)
        .append("g")
        .selectAll("path")
        .data(topojson.features)
        .enter()
        .append("g")
        .append("path")
        .attr("d", path)
        .attr("id", "mapPath")
        .attr("valueFromDataset", function (d) {
            var key = ""
            switch (level) {
                case "city":
                    key = d.properties.name
                    break
                case "province":
                    key = d.properties.prov_name
                    break
                case "region":
                    key = d.properties.reg_name
            }
            if (dataset[level].has(key)) {
                return dataset[level].get(key)[0][dataName]
            }
            else return null
        })
        .attr('fill', function (d) {
            if (this.getAttribute("valueFromDataset")) {
                if (dataName != "stateOfWorks") {
                    return colorScale(parseFloat(this.getAttribute("valueFromDataset")));
                }
                else {
                    return colorScale(this.getAttribute("valueFromDataset"));
                }
            }
            else {
                return "#606060"
            }
        })
        .attr('stroke', "black")
        .attr("cursor", "pointer")
        .on("click", function (event, d) {
            const obj = getDataName(d)
            if (dataset[level].get(obj)) {
                selectObject(obj, level)
            }
            else {
                alert("Unavailable data for this city.") //Only a few cities might have unavailable data. All provinces and all regions have data
            }
        })
        .on("mouseenter", function (event, d) {
            const objName = getDataName(d)
            if (dataset[level].has(objName)) {
                focus(objName, level)
            }
        })
        .on("mouseover", function (event, d) {
            var text = ""
            var key = getDataName(d)
            // focus(key, level)
            if (d.properties.reg_name) {
                text = text + d.properties.reg_name
            }
            if (d.properties.prov_name) {
                text = text + ", " + d.properties.prov_name
                if (d.properties.prov_acr) {
                    text = text + " (" + d.properties.prov_acr + ")"
                }
            }
            if (d.properties.name) {
                text = text + ", " + d.properties.name
            }
            text = text + "<br>"
            if (dataset[level].has(key)) {
                var data = dataset[level].get(key)[0]
                text = text + "Average Download Speed: <b>" + Number(data.downloadSpeed_mbps).toFixed(2) + "</b> MBps."
                text = text + " Average Upload Speed: <b>" + Number(data.uploadSpeed_mbps).toFixed(2) + "</b> MBps. <br>"
                text = text + "Average Latency: <b>" + Number(data.latency_ms).toFixed(2) + "</b> ms."
                text = text + " Total Number of tests: <b>" + (data.tests) + "</b>. <br>"
                if (data.stateOfWorks) {
                    text = text + "Current State of Works: <b>" + data.stateOfWorks.charAt(0).toUpperCase() + data.stateOfWorks.slice(1) + "</b>"
                }
            }
            else {
                text = text + "<b>No data available.</b>"
            }
            tooltip.html(text)
            return tooltip.style("visibility", "visible");
        })
        .on("mousemove", function (event) {
            return tooltip.style("top", event.pageY - 75 + "px")
                .style("left", event.pageX + 10 + "px");
        })
        .on("mouseout", function (event, d) {
            stopFocus()
            return tooltip.style("visibility", "hidden");
        });

    document.getElementById("zoomMap").addEventListener("click", () => {
        document.getElementById("zoomMap").disabled = true;
        document.getElementById("unzoomMap").disabled = true;
        d3.select("#choroplethMap").transition().duration(200).call(zoom.scaleBy, 1.2).on("end", () => {
            document.getElementById("zoomMap").disabled = false
            document.getElementById("unzoomMap").disabled = false
        })
    })
    document.getElementById("unzoomMap").addEventListener("click", () => {
        document.getElementById("unzoomMap").disabled = true;
        document.getElementById("zoomMap").disabled = true;
        d3.select("#choroplethMap").transition().duration(200).call(zoom.scaleBy, 0.8).on("end", () => {
            document.getElementById("unzoomMap").disabled = false;
            document.getElementById("zoomMap").disabled = false;
        })
    })
    const sizeSquare = 19

    //add the "NO DATA" to the legend 
    if (dataName != "stateOfWorks") {
        if (level == "city") {
            var legendDomain = ["No data Available"]
        }
        else {
            var legendDomain = []
        }
        for (let i = 0; i < colorScale.domain().length - 1; i++) {
            legendDomain.push([colorScale.domain()[i], colorScale.domain()[i + 1]])
        }
    }
    else {
        var legendDomain = ["No data Available"].concat(colorScale.domain())
    }
    var legendObjects = {}
    var legend = d3.select("#svgMap").selectAll(".legend")
        .data(legendDomain)
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", function (d, i) { return "translate(0," + i * sizeSquare + ")" })
        .append("rect")
        .attr("id", "legendRect")
        .attr("x", "1px")
        .attr("y", heightMap - legendDomain.length * 0.03 * heightMap)
        .attr("width", sizeSquare)
        .attr("height", sizeSquare)
        .style("fill", function (d) {
            if (d == "No data Available") {
                return ("#606060")
            }
            else {
                if (dataName != "stateOfWorks") {
                    return colorScale(d[0]);
                }
                else {
                    return colorScale(d);
                }
            }
        })
        .style("cursor", "pointer")
        .style('stroke', 'black')
        .style("margin-top", "2px")
        .style('stroke-width', '1px')
        .attr("objects", function (d) {
            let objects = []
            dataset[level].forEach(function (value, key) {
                if (dataName != "stateOfWorks") {
                    if (value[0][dataName] >= d[0] && value[0][dataName] < d[1]) {
                        objects.push(key)
                    }
                }
                else {
                    if (value[0][dataName] == d) {
                        objects.push(key)
                    }
                }
            })
            legendObjects[d] = objects
            return objects
        })
        .attr("selected", "unselected")
        .on("click", function (event, d) {
            if (d != "No data Available") {
                if (d3.select(this).attr("selected") == "unselected") {
                    d3.select(this)
                        .attr("selected", "selected")
                    selectMultipleObjects(legendObjects[d], level)
                }
                else {
                    d3.select(this)
                        .attr("selected", "unselected")
                        .style("stroke-width", "1px");
                    deselectMultipleObjects(legendObjects[d], level)
                }

            }
        })
    d3.selectAll(".legend")
        .append("text")
        .attr("class", "legendText")
        .attr("x", sizeSquare + 5)
        .attr("y", heightMap - legendDomain.length * 0.03 * heightMap + sizeSquare / 2)
        .attr("dy", ".35em")
        .text(
            function (d, i) {
                if (dataName != "stateOfWorks") {
                    if (i == 0 && level == "city") {
                        return d
                    }
                    else if (dataName == "tests") {
                        return parseFloat(d[0].toFixed(0)) + " - " + parseFloat(d[1].toFixed(0))
                    }
                    else return parseFloat(d[0].toFixed(2)) + " - " + parseFloat(d[1].toFixed(2)) + " " + measureUnits[dataName]
                }
                else return d.charAt(0).toUpperCase() + d.slice(1)

            });
    d3.select("#svgMap")
        .append("text")
        .attr("class", "legendText")
        .attr("transform", "translate(2," + (heightMap - legendDomain.length * 0.03 * heightMap - sizeSquare / 2).toString() + ")")
        .text(() => {
            switch (dataName) {
                case "downloadSpeed_mbps":
                    return ("Download Speed (MBps)")
                case "uploadSpeed_mbps":
                    return ("Upload Speed (MBps)")
                case "latency_ms":
                    return ("Latency (ms)")
                case "tests":
                    return ("Number of Tests")
                case "stateOfWorks":
                    return ("State of Works")
            }
        })

    try {
        handleZoom(zoomEvent)   //Needed so the map is not reset to normal zoom after changing data. This will generate an error "event is undefined" 
        //the first time the map is created but it's not an issue
    }
    catch (e) { }
    d3.select("#choroplethMap").style("background-image", "none") //Remove the "Loading" GIF
    updateMap()


    function handleZoom(event) {
        zoomEvent = event
        map.attr('transform', event.transform);
        updateMap()


    }
    function resetZoom(time) {
        if (isNaN(time)) {
            var animationTime = 750
        }
        else {
            var animationTime = time
        }
        d3.select("#choroplethMap")
            .transition()
            .duration(animationTime)
            .call(zoom.transform, d3.zoomIdentity);
    }
}
function updateMap() {
    d3.selectAll("#mapPath")
        .style("opacity",
            function (d) {
                const objName = getDataName(d)
                if (dataset[level].has(objName)) {
                    let res = checkSelection(objName, dataset[level].get(objName)[0], level, 1.0, 0.7, 0.9)
                    return res
                }
                else { //The no data cities
                    return 1.0
                }
            }
        )
        .style('stroke-width', function (d) {
            const objName = getDataName(d)
            if (dataset[level].has(objName)) {
                try {
                    return (checkSelection(objName, dataset[level].get(objName)[0], level, 1.0, 0.2, 0.25) / zoomEvent.transform.k).toString() + "px";
                }
                catch (e) {//If the zoom button has never been used
                    return checkSelection(objName, dataset[level].get(objName)[0], level, "1.0px", "0.2px", "0.25px")
                }
            }
            else {
                try {
                    return ((0.2 / zoomEvent.transform.k).toString() + "px")
                }
                catch (e) { //If the zoom button has never been used
                    return "0.2px"

                }
            }
        });
    d3.selectAll("#legendRect")
        .style("stroke-width", function (d) {
            if (d != "No data Available") {
                if ((d3.select(this).attr("objects")).split(",").every(elem => dataset.selectedData[level].includes(elem))) {
                    d3.select(this).attr("selected", "selected");
                    d3.select(this).attr("opacity", 1.0)
                    return "2px"
                }
                else {
                    d3.select(this).attr("selected", "unselected");
                    if (!checkSomethingSelected()) { //If nothing is selected, default opacity
                        d3.select(this).attr("opacity", 0.9)
                    }
                    else { //If something else was selected, opacity is slightly reduced
                        d3.select(this).attr("opacity", 0.7)
                    }
                    return "1px"
                }
            }
        });
}
function focusMap(objFocus, levelFocus) {
    d3.selectAll("#mapPath")
        .style('stroke', function (d) {
            if (d.properties.name) {
                if (levelFocus == "city" && d.properties.name == objFocus) {
                    return focusThis(this)
                }
                else if (levelFocus == "province" && d.properties.prov_name == objFocus) {
                    return focusThis(this)
                }
                else if (d.properties.reg_name == objFocus) {
                    return focusThis(this)
                }
            }
            else if (d.properties.prov_name) {
                if (levelFocus == "province" && d.properties.prov_name == objFocus) {
                    return focusThis(this)
                }
                else if (d.properties.reg_name == objFocus) {
                    return focusThis(this)
                }
            }
            else if (d.properties.reg_name && d.properties.reg_name == objFocus) {
                return focusThis(this)
            }
            return "black"
        });
    function focusThis(thisObj) {
        let k = 1
        if (zoomEvent) k = zoomEvent.transform.k
        d3.select(thisObj).style("stroke-width", (2 / k).toString() + "px")
        return "red"
    }
}
function stopFocusMap() {
    d3.selectAll("#mapPath")
        .style('stroke', "black")
        .style('stroke-width', function (d) {
            const objName = getDataName(d)
            if (dataset[level].has(objName)) {
                try {
                    return (checkSelection(objName, dataset[level].get(objName)[0], level, 1.0, 0.2, 0.25) / zoomEvent.transform.k).toString() + "px";
                }
                catch (e) {//If the zoom button has never been used
                    return checkSelection(objName, dataset[level].get(objName)[0], level, "1.0px", "0.2px", "0.25px")
                }
            }
            else {
                try {
                    return ((0.2 / zoomEvent.transform.k).toString() + "px")
                }
                catch (e) { //If the zoom button has never been used
                    return "0.2px"

                }
            }
        });
}
function getDataName(d) { //Get the name of the data element, based on the level we're showing
    let obj
    if (d.properties.name) {
        obj = d.properties.name
    }
    else if (d.properties.prov_name) {
        obj = d.properties.prov_name
    }
    else if (d.properties.reg_name) {
        obj = d.properties.reg_name
    }
    return obj
}
export { drawMap, updateMap, focusMap, stopFocusMap };
