import { computeScatterplot, focusScatterplot, removeScatterplot, stopFocusScatterplot, updateScatterplot as updateScatterPlot } from "./scatterplot.js";
import { drawMap, focusMap, stopFocusMap, updateMap } from "./choropleth.js";
import { focusParallelPlot, parallelPlot, stopFocusParallelPlot, updateParallelPlot } from "./parallelPlot.js";

export { dataset as default };
const cityDatasetPath = "./static/dataset/speedtest_bul_city.csv"
const provinceDatasetPath = "./static/dataset/speedtest_bul_province.csv"
const regionDatasetPath = "./static/dataset/speedtest_bul_region.csv"

const scatterplotComputeButton = document.getElementById("computeSCATTERPLOT")
const radioButtonsScatterplotLevel = [document.getElementById("citySCATTERPLOT"), document.getElementById("provinceSCATTERPLOT"), document.getElementById("regionSCATTERPLOT")]
const radioButtonsScatterplotData = [document.getElementById("downloadSCATTERPLOT"), document.getElementById("uploadSCATTERPLOT"), document.getElementById("latencySCATTERPLOT"), document.getElementById("testsSCATTERPLOT"), document.getElementById("stateWorksSCATTERPLOT")]

const radioButtonsMapLevel = [document.getElementById("cityMAP"), document.getElementById("provinceMAP"), document.getElementById("regionMAP")]
const radioButtonsMapData = [document.getElementById("downloadMAP"), document.getElementById("uploadMAP"), document.getElementById("latencyMAP"), document.getElementById("testsMAP"), document.getElementById("stateWorksMAP")]
const radioButtonsParallelLevel = [document.getElementById("cityPARALLEL"), document.getElementById("provincePARALLEL"), document.getElementById("regionPARALLEL")]

const detailElements = {
    cityCount: document.getElementById("cityCount"), provinceCount: document.getElementById("provinceCount"), regionCount: document.getElementById("regionCount"),
    avgDownload: document.getElementById("avgDownload"), avgUpload: document.getElementById("avgUpload"), avgLatency: document.getElementById("avgLatency"),
    totalTests: document.getElementById("totalTests"), table: document.getElementById("tableDetail"), tableHead: document.getElementById("tableHead"),
    tableBody: document.getElementById("tableBody"), detailLevelCity: document.getElementById("detailLevelCity"), detailLevelProvince: document.getElementById("detailLevelProvince"),
    detailLevelRegion: document.getElementById("detailLevelRegion")
}
let detailLevel = null
let scatterplotLevel = "city";
let scatterplotAttributes = { "downloadSpeed_mbps": true, "uploadSpeed_mbps": true, "latency_ms": true, "tests": true, "stateOfWorks": true }
let mapLevel = "city";
let mapData = "downloadSpeed_mbps";
let mapOptionsShown = true



var dataset = { city: null, province: null, region: null, tsne: null, selectedData: { city: [], province: [], region: [] } }
var filters = { parallelPlot: { level: "city", objects: [] }, scatterPlot: { level: "city", objects: [] } }
d3.csv(cityDatasetPath).then(function (rows) {

    dataset.city = d3.group(rows, d => d.city)
    d3.csv(provinceDatasetPath).then(function (rows) {
        dataset.province = d3.group(rows, d => d.province)
        d3.csv(regionDatasetPath).then(function (rows) {
            dataset.region = d3.group(rows, d => d.region)
            d3.csv("./static/dataset/tsne/tsne_default.csv").then(function (rows) {
                dataset.tsne = d3.group(rows, d => d.city)
                computeScatterplot(scatterplotLevel, null, null)
                drawMap(mapLevel, mapData)
                parallelPlot(mapLevel, mapData)
            })
        })
    })


})

//SCATTERPLOT

for (let i = 0; i < 3; i++) {
    radioButtonsScatterplotLevel[i].addEventListener("change", () => {
        scatterplotLevel = radioButtonsScatterplotLevel[i].value

    })
}
for (let i = 0; i < 5; i++) {
    radioButtonsScatterplotData[i].addEventListener("change", () => {
        scatterplotAttributes[radioButtonsScatterplotData[i].value] = radioButtonsScatterplotData[i].checked
    })
}

scatterplotComputeButton.addEventListener("click", () => {
    var request = []
    var tsneAttr = ""
    for (const attr of Object.keys(scatterplotAttributes)) {
        if (scatterplotAttributes[attr]) {
            request.push(attr)
            tsneAttr = tsneAttr + attr + "-"
        }
    }
    if (tsneAttr) {
        tsneAttr = tsneAttr.substring(0, tsneAttr.length - 1);
    }
    switch (request.length) {
        case 0 || 1:
            alert("Please select at least two attributes to fill the scatterplot")
            break;
        case 2:
            if (scatterplotLevel != "city" && request[1] == "stateOfWorks") {
                removeScatterplot()
                fetch("/tsne?level=" + scatterplotLevel + "&attributes=" + tsneAttr).then(response => response.text())
                    .then((response) => {
                        d3.csv(response).then(function (rows) {
                            dataset.tsne = d3.group(rows, d => d[scatterplotLevel])
                            computeScatterplot(scatterplotLevel, null, null)
                            setFilter("scatterPlot", "city", []) //Reset any eventual filter when we change level on the scatterPlot
                            setFilter("scatterPlot", "province", [])
                            setFilter("scatterPlot", "region", [])
                            updateScatterPlot()
                        })
                    })
                    .catch(err => console.log(err))
            }
            else {
                computeScatterplot(scatterplotLevel, request[0], request[1])
                setFilter("scatterPlot", "city", []) //Reset any eventual filter when we change level on the scatterPlot
                setFilter("scatterPlot", "province", [])
                setFilter("scatterPlot", "region", [])
                updateScatterPlot()
            }
            break;
        default:
            removeScatterplot()
            fetch("/tsne?level=" + scatterplotLevel + "&attributes=" + tsneAttr).then(response => response.text())
                .then((response) => {
                    d3.csv(response).then(function (rows) {
                        dataset.tsne = d3.group(rows, d => d[scatterplotLevel])
                        computeScatterplot(scatterplotLevel, null, null)
                        setFilter("scatterPlot", "city", []) //Reset any eventual filter when we change level on the scatterPlot
                        setFilter("scatterPlot", "province", [])
                        setFilter("scatterPlot", "region", [])
                        updateScatterPlot()
                    })
                })
                .catch(err => console.log(err))

    }

});

//CHOROPLETH MAP
radioButtonsMapLevel[0].addEventListener("change", () => {
    radioButtonsMapData[4].style.display = "";
    document.getElementById("stateWorksMAPLabel").style.display = "";

    mapLevel = radioButtonsMapLevel[0].value
    drawMap(mapLevel, mapData)
    updateMap()


})
for (let i = 1; i < 3; i++) {
    radioButtonsMapLevel[i].addEventListener("change", () => {
        radioButtonsMapData[4].style.display = "none";
        document.getElementById("stateWorksMAPLabel").style.display = "none";
        if (mapData == "stateOfWorks") {
            mapData = "downloadSpeed_mbps"
            radioButtonsMapData[0].checked = true;
        }
        mapLevel = radioButtonsMapLevel[i].value
        drawMap(mapLevel, mapData)
        updateMap()

    })
}
for (let i = 0; i < 5; i++) {
    radioButtonsMapData[i].addEventListener("change", () => {
        mapData = radioButtonsMapData[i].value
        drawMap(mapLevel, mapData)
        updateMap()
    })
}

document.getElementById("showHideMapOptions").addEventListener("click", () => {
    if (mapOptionsShown) {
        document.getElementById("mapOptions").style.display = "none"
        document.getElementById("showHideMapOptions").innerHTML = "Show Map Selectors"
    }
    else {
        document.getElementById("mapOptions").style.display = ""
        document.getElementById("showHideMapOptions").innerHTML = "Hide Map Selectors"
    }
    mapOptionsShown = !mapOptionsShown
})


//Parallel Plot
for (let i = 0; i < 3; i++) {
    radioButtonsParallelLevel[i].addEventListener("change", () => {
        parallelPlot(radioButtonsMapLevel[i].value)
        setFilter("parallelPlot", "city", []) //Reset any eventual filter when we change level on the parallelPlot
        setFilter("parallelPlot", "province", [])
        setFilter("parallelPlot", "region", [])
        updateParallelPlot()
    })
}

// //FPS tracker
// function animate() {

//     stats.begin();

//     // monitored code goes here

//     stats.end();

//     requestAnimationFrame(animate);

// }
// requestAnimationFrame(animate);

export function selectObject(obj, level) { //Handles selection/deselection of a single object
    var index = dataset.selectedData[level].indexOf(obj);
    if (index > -1) { // if obj is already selected
        dataset.selectedData[level].splice(index, 1);
        if (level == "city" || level == "province") {
            var indexRegion = dataset.selectedData.region.indexOf(dataset[level].get(obj)[0].region);
            if (indexRegion > -1) { //if you're deselecting something in a lower level, deselect the corresponding object in the upper level
                dataset.selectedData.region.splice(indexRegion, 1);
            }
            if (level == "city") {
                var indexProvince = dataset.selectedData.province.indexOf(dataset[level].get(obj)[0].province);
                if (indexProvince > -1) { //if you're deselecting something in a lower level, deselect the corresponding object in the upper level
                    dataset.selectedData.region.splice(indexProvince, 1);
                }
            }
        }
        if (level == "province") {
            for (let i = dataset.selectedData.city.length - 1; i >= 0; i--) {
                if (dataset.city.get(dataset.selectedData.city[i])[0].province == obj) {
                    dataset.selectedData.city.splice(i, 1);
                }
            }
        }
        if (level == "region") {
            for (let i = dataset.selectedData.city.length - 1; i >= 0; i--) {
                if (dataset.city.get(dataset.selectedData.city[i])[0].region == obj) {
                    dataset.selectedData.city.splice(i, 1);
                }
            }
            for (let i = dataset.selectedData.province.length - 1; i >= 0; i--) {
                if (dataset.province.get(dataset.selectedData.province[i])[0].region == obj) {
                    dataset.selectedData.province.splice(i, 1);
                }
            }
        }

    }
    else {   // if the obj is being selected
        dataset.selectedData[level].push(obj)
        if (level == "region") {
            dataset.province.forEach(objProvince => {
                if (objProvince[0].region == obj && (!dataset.selectedData.province.includes(objProvince[0].province))) dataset.selectedData.province.push(objProvince[0].province)
            })
            dataset.city.forEach(objCity => {

                if (objCity[0].region == obj && (!dataset.selectedData.city.includes(objCity[0].city))) dataset.selectedData.city.push(objCity[0].city)
            })
        }
        else if (level == "province") {
            dataset.city.forEach(objCity => {
                if (objCity[0].province == obj && (!dataset.selectedData.city.includes(objCity[0].city))) dataset.selectedData.city.push(objCity[0].city)
            })
        }
    }
    updateAll()
}
export function selectMultipleObjects(objArray, level) { //Handles selection of multiple objects

    objArray.forEach(obj => {
        var index = dataset.selectedData[level].indexOf(obj); // iCheck index >-1 to know if obj has not yet been selected. This is to avoid multiple selections of the same object.
        if (index == -1) {
            if (!dataset.selectedData[level].includes(obj)) {
                dataset.selectedData[level].push(obj)
            }
            if (level == "region") {
                dataset.province.forEach(objProvince => {
                    if (objProvince[0].region == obj && (!dataset.selectedData.province.includes(objProvince[0].province))) dataset.selectedData.province.push(objProvince[0].province)
                })
                dataset.city.forEach(objCity => {

                    if (objCity[0].region == obj && (!dataset.selectedData.city.includes(objCity[0].city))) dataset.selectedData.city.push(objCity[0].city)
                })
            }
            else if (level == "province") {
                dataset.city.forEach(objCity => {
                    if (objCity[0].province == obj && (!dataset.selectedData.city.includes(objCity[0].city))) dataset.selectedData.city.push(objCity[0].city)
                })
            }
        }
    })
    updateAll()
}
export function deselectMultipleObjects(objArray, level) { //Handles selection of multiple objects
    objArray.forEach(obj => {
        var index = dataset.selectedData[level].indexOf(obj);
        if (index > -1) { // if obj has been selected previously, deselect it
            dataset.selectedData[level].splice(index, 1);
            if (level == "city" || level == "province") {
                var indexRegion = dataset.selectedData.region.indexOf(dataset[level].get(obj)[0].region);
                if (indexRegion > -1) { //if you're deselecting something in a lower level, deselect the corresponding object in the upper level
                    dataset.selectedData.region.splice(indexRegion, 1);
                }
                if (level == "city") {
                    var indexProvince = dataset.selectedData.province.indexOf(dataset[level].get(obj)[0].province);
                    if (indexProvince > -1) { //if you're deselecting something in a lower level, deselect the corresponding object in the upper level
                        dataset.selectedData.region.splice(indexProvince, 1);
                    }
                }
            }
            if (level == "province") {
                for (let i = dataset.selectedData.city.length - 1; i >= 0; i--) {
                    if (dataset.city.get(dataset.selectedData.city[i])[0].province == obj) {
                        dataset.selectedData.city.splice(i, 1);
                    }
                }
            }
            if (level == "region") {
                for (let i = dataset.selectedData.city.length - 1; i >= 0; i--) {
                    if (dataset.city.get(dataset.selectedData.city[i])[0].region == obj) {
                        dataset.selectedData.city.splice(i, 1);
                    }
                }
                for (let i = dataset.selectedData.province.length - 1; i >= 0; i--) {
                    if (dataset.province.get(dataset.selectedData.province[i])[0].region == obj) {
                        dataset.selectedData.province.splice(i, 1);
                    }
                }
            }
        }
    })
    updateAll()
}
export function checkSelection(dataName, dataObject, visualizationLevel, valueYes, valueNo, valueDefault) {
    if ((!checkSomethingSelected()) && (!checkFiltersActive())) { //If nothing has been selected and there are no filters active
        return valueDefault || valueYes //If there is a default value return it, otherwise return the value for the selected case
    }
    else if ((dataset.selectedData[visualizationLevel].includes(dataName))) {
        return valueYes
    }

    else {
        return valueNo
    }
}

export function checkSomethingSelected() { //returns true if something has been selected, false if nothing has been selected
    return ((dataset.selectedData.city.length || dataset.selectedData.province.length || dataset.selectedData.region.length))
}

function checkFiltersActive() { //returns true if there is at least one brush active in the scatterplot or in the parallelPlot, false otherwise
    return (filters.parallelPlot.objects.length || filters.scatterPlot.objects.length)
}

function checkFiltersActiveAtLevel(level) {
    return ((filters.parallelPlot.level == level && filters.parallelPlot.objects.length) || (filters.scatterPlot.level == level && filters.parallelPlot.objects.length))
}

function checkFiltersIncludeObject(objName, level) {        //Returns true if the object is being filtered by both filters or by one and the other is inactive
    return (((filters.scatterPlot.level == level && filters.scatterPlot.objects.includes(objName)) && (!filters.parallelPlot.objects.length || (filters.parallelPlot.level == level && filters.parallelPlot.objects.includes(objName))))
        || ((filters.parallelPlot.level == level && filters.parallelPlot.objects.includes(objName)) && (!filters.scatterPlot.objects.length || (filters.scatterPlot.level == level && filters.scatterPlot.objects.includes(objName)))))
}

export function setFilter(visualization, level, objects) {
    filters[visualization].objects = objects
    filters[visualization].level = level

    dataset.selectedData.city = []      //Reset all the selections
    dataset.selectedData.province = []
    dataset.selectedData.region = []
    filters.scatterPlot.objects.forEach(obj => {
        switch (filters.scatterPlot.level) {
            case "city":
                if (filters.parallelPlot.level == "city") {
                    if (filters.parallelPlot.objects.includes(obj) || !filters.parallelPlot.objects.length) { //If parallel also filtered the same object or is filtering nothing
                        if (!dataset.selectedData.city.includes(obj)) dataset.selectedData.city.push(obj)
                    }
                }
                else if (filters.parallelPlot.level == "province") {
                    const dataObject = (dataset[filters.scatterPlot.level].get(obj))[0]
                    if (filters.parallelPlot.objects.includes(dataObject.province) || !filters.parallelPlot.objects.length) { //If paralle also filtered the same city or is filtering nothing
                        if (!dataset.selectedData.city.includes(obj)) dataset.selectedData.city.push(obj)
                    }
                }
                else {
                    const dataObject = (dataset[filters.scatterPlot.level].get(obj))[0]
                    if (filters.parallelPlot.objects.includes(dataObject.region) || !filters.parallelPlot.objects.length) { //If paralle also filtered the same city or is filtering nothing
                        if (!dataset.selectedData.city.includes(obj)) dataset.selectedData.city.push(obj)
                    }
                }
                break
            case "province":
                if (filters.parallelPlot.level == "city") {
                    if (!filters.parallelPlot.objects.length) { //If parallel also filtered the same object or is filtering nothing
                        dataset.city.forEach(objCity => {
                            if (filters.scatterPlot.objects.includes(objCity[0].province)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                    }
                    else {
                        dataset.city.forEach(objCity => {
                            if (filters.scatterPlot.objects.includes(objCity[0].province) && filters.parallelPlot.objects.includes(objCity[0].city)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                    }
                    if (!dataset.selectedData.province.includes(obj)) dataset.selectedData.province.push(obj)
                }
                else if (filters.parallelPlot.level == "province") {
                    if (!filters.parallelPlot.objects.length) { //If parallel also filtered the same object or is filtering nothing
                        if (!dataset.selectedData.province.includes(obj)) dataset.selectedData.province.push(obj)

                        dataset.city.forEach(objCity => {
                            if (filters.scatterPlot.objects.includes(objCity[0].province)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                    }
                    else if (filters.parallelPlot.objects.includes(obj)) { //If parallel also filtered the same object or is filtering nothing
                        if (!dataset.selectedData.province.includes(obj)) dataset.selectedData.province.push(obj)
                        dataset.city.forEach(objCity => {
                            if (filters.scatterPlot.objects.includes(objCity[0].province) && filters.parallelPlot.objects.includes(objCity[0].province)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                    }
                }
                else {
                    const dataObject = (dataset[filters.scatterPlot.level].get(obj))[0]
                    if (!filters.parallelPlot.objects.length) { //If parallel also filtered the same object or is filtering nothing
                        dataset.city.forEach(objCity => {
                            if (filters.scatterPlot.objects.includes(objCity[0].province)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                        if (!dataset.selectedData.province.includes(obj)) dataset.selectedData.province.push(obj)

                    }
                    else if (filters.parallelPlot.objects.includes(dataObject.region) || !filters.parallelPlot.objects.length) { //If paralle also filtered the same city or is filtering nothing
                        if (!dataset.selectedData.province.includes(obj)) dataset.selectedData.province.push(obj)
                        dataset.city.forEach(objCity => {
                            if (filters.scatterPlot.objects.includes(objCity[0].province) && filters.parallelPlot.objects.includes(objCity[0].region)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                    }
                }
                break
            case "region": {
                if (filters.parallelPlot.level == "city") {
                    if (!dataset.selectedData.region.includes(obj)) dataset.selectedData.region.push(obj)
                    dataset.province.forEach(objProvince => {
                        if (filters.scatterPlot.objects.includes(objProvince[0].region)) {
                            if (!dataset.selectedData.province.includes(objProvince[0].province)) dataset.selectedData.province.push(objProvince[0].province)
                        }
                    })
                    if (!filters.parallelPlot.objects.length) { //If parallel also filtered the same object or is filtering nothing
                        dataset.city.forEach(objCity => {
                            if (filters.scatterPlot.objects.includes(objCity[0].region)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                    }
                    else {
                        dataset.city.forEach(objCity => {
                            if (filters.scatterPlot.objects.includes(objCity[0].region) && filters.parallelPlot.objects.includes(objCity[0].city)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                    }
                }
                else if (filters.parallelPlot.level == "province") {
                    if (!dataset.selectedData.region.includes(obj)) dataset.selectedData.region.push(obj)
                    if (!filters.parallelPlot.objects.length) { //If parallel also filtered the same object or is filtering nothing
                        dataset.city.forEach(objCity => {
                            if (filters.scatterPlot.objects.includes(objCity[0].region)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                        dataset.province.forEach(objProvince => {
                            if (filters.scatterPlot.objects.includes(objProvince[0].region)) {
                                if (!dataset.selectedData.province.includes(objProvince.province)) dataset.selectedData.province.push(objProvince[0].province)
                            }
                        })
                    }
                    else {
                        dataset.city.forEach(objCity => {
                            if (filters.scatterPlot.objects.includes(objCity[0].region) && filters.parallelPlot.objects.includes(objCity[0].province)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                        dataset.province.forEach(objProvince => {
                            if (filters.scatterPlot.objects.includes(objProvince[0].region) && filters.parallelPlot.objects.includes(objProvince[0].province)) {
                                if (!dataset.selectedData.city.includes(objProvince[0].province)) dataset.selectedData.province.push(objProvince[0].province)
                            }
                        })
                    }
                }
                else {
                    if (!filters.parallelPlot.objects.length) {
                        if (!dataset.selectedData.region.includes(obj)) dataset.selectedData.region.push(obj)

                        dataset.city.forEach(objCity => {
                            if (filters.scatterPlot.objects.includes(objCity[0].region)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                        dataset.province.forEach(objProvince => {
                            if (filters.scatterPlot.objects.includes(objProvince[0].region)) {
                                if (!dataset.selectedData.province.includes(objProvince[0].province)) dataset.selectedData.province.push(objProvince[0].province)
                            }
                        })
                    }
                    else if (filters.parallelPlot.objects.includes(obj)) { //If parallel also filtered the same object or is filtering nothing
                        if (!dataset.selectedData.region.includes(obj)) dataset.selectedData.region.push(obj)
                        dataset.city.forEach(objCity => {
                            if (filters.scatterPlot.objects.includes(objCity[0].region) && filters.parallelPlot.objects.includes(objCity[0].region)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                        dataset.province.forEach(objProvince => {
                            if (filters.scatterPlot.objects.includes(objProvince[0].region) && filters.parallelPlot.objects.includes(objProvince[0].region)) {
                                if (!dataset.selectedData.province.includes(objProvince[0].province)) dataset.selectedData.province.push(objProvince[0].province)
                            }
                        })
                    }
                }
            }
        }
    })
    filters.parallelPlot.objects.forEach(obj => {
        switch (filters.parallelPlot.level) {
            case "city":
                if (filters.scatterPlot.level == "city") {
                    if (filters.scatterPlot.objects.includes(obj) || !filters.scatterPlot.objects.length) { //If parallel also filtered the same object or is filtering nothing
                        if (!dataset.selectedData.city.includes(obj)) dataset.selectedData.city.push(obj)
                    }
                }
                else if (filters.scatterPlot.level == "province") {
                    const dataObject = (dataset[filters.parallelPlot.level].get(obj))[0]
                    if (filters.scatterPlot.objects.includes(dataObject.province) || !filters.scatterPlot.objects.length) { //If paralle also filtered the same city or is filtering nothing
                        if (!dataset.selectedData.city.includes(obj)) dataset.selectedData.city.push(obj)
                    }
                }
                else {
                    const dataObject = (dataset[filters.parallelPlot.level].get(obj))[0]
                    if (filters.scatterPlot.objects.includes(dataObject.region) || !filters.scatterPlot.objects.length) { //If paralle also filtered the same city or is filtering nothing
                        if (!dataset.selectedData.city.includes(obj)) dataset.selectedData.city.push(obj)
                    }
                }
                break
            case "province":
                if (filters.scatterPlot.level == "city") {
                    if (!filters.scatterPlot.objects.length) { //If parallel also filtered the same object or is filtering nothing
                        dataset.city.forEach(objCity => {
                            if (filters.parallelPlot.objects.includes(objCity[0].province)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                    }
                    else {
                        dataset.city.forEach(objCity => {
                            if (filters.parallelPlot.objects.includes(objCity[0].province) && filters.scatterPlot.objects.includes(objCity[0].city)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                    }
                    if (!dataset.selectedData.province.includes(obj)) dataset.selectedData.province.push(obj)
                }
                else if (filters.scatterPlot.level == "province") {
                    if (!filters.scatterPlot.objects.length) { //If parallel also filtered the same object or is filtering nothing
                        if (!dataset.selectedData.province.includes(obj)) dataset.selectedData.province.push(obj)

                        dataset.city.forEach(objCity => {
                            if (filters.parallelPlot.objects.includes(objCity[0].province)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                    }
                    if (filters.scatterPlot.objects.includes(obj)) { //If parallel also filtered the same object or is filtering nothing
                        if (!dataset.selectedData.province.includes(obj)) dataset.selectedData.province.push(obj)
                        dataset.city.forEach(objCity => {
                            if (filters.parallelPlot.objects.includes(objCity[0].province) && filters.scatterPlot.objects.includes(objCity[0].province)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                    }
                }
                else {
                    const dataObject = (dataset[filters.parallelPlot.level].get(obj))[0]
                    if (!filters.scatterPlot.objects.length) { //If parallel also filtered the same object or is filtering nothing
                        dataset.city.forEach(objCity => {
                            if (filters.parallelPlot.objects.includes(objCity[0].province)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                        if (!dataset.selectedData.province.includes(obj)) dataset.selectedData.province.push(obj)

                    }
                    else if (filters.scatterPlot.objects.includes(dataObject.region) || !filters.scatterPlot.objects.length) { //If paralle also filtered the same city or is filtering nothing
                        if (!dataset.selectedData.province.includes(obj)) dataset.selectedData.province.push(obj)
                        dataset.city.forEach(objCity => {
                            if (filters.parallelPlot.objects.includes(objCity[0].province) && filters.scatterPlot.objects.includes(objCity[0].region)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                    }
                }
                break
            case "region": {
                if (filters.scatterPlot.level == "city") {
                    if (!dataset.selectedData.region.includes(obj)) dataset.selectedData.region.push(obj)
                    dataset.province.forEach(objProvince => {
                        if (filters.parallelPlot.objects.includes(objProvince[0].region)) {
                            if (!dataset.selectedData.province.includes(objProvince[0].province)) dataset.selectedData.province.push(objProvince[0].province)
                        }
                    })
                    if (!filters.scatterPlot.objects.length) { //If parallel also filtered the same object or is filtering nothing
                        dataset.city.forEach(objCity => {
                            if (filters.parallelPlot.objects.includes(objCity[0].region)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                    }
                    else {
                        dataset.city.forEach(objCity => {
                            if (filters.parallelPlot.objects.includes(objCity[0].region) && filters.scatterPlot.objects.includes(objCity[0].city)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                    }
                }
                else if (filters.scatterPlot.level == "province") {
                    if (!dataset.selectedData.region.includes(obj)) dataset.selectedData.region.push(obj)
                    if (!filters.scatterPlot.objects.length) { //If parallel also filtered the same object or is filtering nothing
                        dataset.city.forEach(objCity => {
                            if (filters.parallelPlot.objects.includes(objCity[0].region)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                        dataset.province.forEach(objProvince => {
                            if (filters.parallelPlot.objects.includes(objProvince[0].region)) {
                                if (!dataset.selectedData.province.includes(objProvince.province)) dataset.selectedData.province.push(objProvince[0].province)
                            }
                        })
                    }
                    else {
                        dataset.city.forEach(objCity => {
                            if (filters.parallelPlot.objects.includes(objCity[0].region) && filters.scatterPlot.objects.includes(objCity[0].province)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                        dataset.province.forEach(objProvince => {
                            if (filters.parallelPlot.objects.includes(objProvince[0].region) && filters.scatterPlot.objects.includes(objProvince[0].province)) {
                                if (!dataset.selectedData.city.includes(objProvince[0].province)) dataset.selectedData.province.push(objProvince[0].province)
                            }
                        })
                    }
                }
                else {
                    if (!filters.scatterPlot.objects.length) {
                        if (!dataset.selectedData.region.includes(obj)) dataset.selectedData.region.push(obj)
                        dataset.city.forEach(objCity => {
                            if (filters.parallelPlot.objects.includes(objCity[0].region)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                        dataset.province.forEach(objProvince => {
                            if (filters.parallelPlot.objects.includes(objProvince[0].region)) {
                                if (!dataset.selectedData.province.includes(objProvince[0].province)) dataset.selectedData.province.push(objProvince[0].province)
                            }
                        })
                    }
                    else if (filters.scatterPlot.objects.includes(obj)) { //If parallel also filtered the same object or is filtering nothing
                        if (!dataset.selectedData.region.includes(obj)) dataset.selectedData.region.push(obj)
                        dataset.city.forEach(objCity => {
                            if (filters.parallelPlot.objects.includes(objCity[0].region) && filters.scatterPlot.objects.includes(objCity[0].region)) {
                                if (!dataset.selectedData.city.includes(objCity[0].city)) dataset.selectedData.city.push(objCity[0].city)
                            }
                        })
                        dataset.province.forEach(objProvince => {
                            if (filters.parallelPlot.objects.includes(objProvince[0].region) && filters.scatterPlot.objects.includes(objProvince[0].region)) {
                                if (!dataset.selectedData.province.includes(objProvince[0].province)) dataset.selectedData.province.push(objProvince[0].province)
                            }
                        })
                    }
                }
            }
        }
    })

    updateAll()
}
function updateAll() {
    updateScatterPlot()
    updateMap()
    updateParallelPlot()
    updateDetails()
}
function updateDetails() {
    detailElements.cityCount.innerHTML = dataset.selectedData.city.length
    detailElements.provinceCount.innerHTML = dataset.selectedData.province.length
    detailElements.regionCount.innerHTML = dataset.selectedData.region.length
    let avgDownload = 0
    let avgUpload = 0
    let avgLatency = 0
    let totalTests = 0

    while (detailElements.tableBody.firstChild) {
        detailElements.tableBody.removeChild(detailElements.tableBody.lastChild);
    }
    dataset.selectedData[detailLevel].forEach(obj => {
        const dataObj = dataset[detailLevel].get(obj)[0]
        const thisTests = parseInt(dataObj.tests)
        totalTests = totalTests + thisTests
        avgDownload = avgDownload + parseFloat(dataObj.downloadSpeed_mbps) * thisTests
        avgUpload = avgUpload + parseFloat(dataObj.uploadSpeed_mbps) * thisTests
        avgLatency = avgLatency + parseFloat(dataObj.latency_ms) * thisTests

        let row = detailElements.tableBody.insertRow();
        row.addEventListener("mouseenter", () => {
            focus(obj, detailLevel)
        })
        row.addEventListener("mouseout", () => {
            stopFocus()
        })
        if (dataObj.city) {
            generateCell(row, dataObj.city)
        }
        if (dataObj.province) {
            generateCell(row, dataObj.province);
        }
        generateCell(row, dataObj.region);
        generateCell(row, parseFloat(dataObj.downloadSpeed_mbps).toFixed(2));
        generateCell(row, parseFloat(dataObj.uploadSpeed_mbps).toFixed(2));
        generateCell(row, parseFloat(dataObj.latency_ms).toFixed(2));
        generateCell(row, parseInt(dataObj.tests));
        if (dataObj.stateOfWorks) {
            generateCell(row, dataObj.stateOfWorks);
        }
        else {
            const names = ["Unknown", "In definitive planning", "In executive planning", "Scheduled", "Being implemented", "In progress", "Being tested", "Done"]
            for (let k = 0; k < names.length; k++) {
                generateCell(row, dataObj[names[k]])
            }
        }
    })

    avgDownload = avgDownload / totalTests
    avgUpload = avgUpload / totalTests
    avgLatency = avgLatency / totalTests
    if (avgDownload) {
        detailElements.avgDownload.innerHTML = avgDownload.toFixed(2)
    }
    else {
        detailElements.avgDownload.innerHTML = 0
    }
    if (avgUpload) {
        detailElements.avgUpload.innerHTML = avgUpload.toFixed(2)
    }
    else {
        detailElements.avgUpload.innerHTML = 0
    }
    if (avgLatency) {
        detailElements.avgLatency.innerHTML = avgLatency.toFixed(2)
    }
    else {
        detailElements.avgLatency.innerHTML = 0
    }
    if (totalTests) {
        detailElements.totalTests.innerHTML = totalTests
    }
    else {
        detailElements.totalTests.innerHTML = 0
    }
    function generateCell(row, cellText) {
        let cell = row.insertCell();
        let text = document.createTextNode(cellText);
        cell.appendChild(text);
    }
}

function setDetailLevel(level) {
    if (level != detailLevel) {
        detailLevel = level

        while (detailElements.tableHead.firstChild) {
            detailElements.tableHead.removeChild(detailElements.tableHead.lastChild);
        }
        let row = detailElements.tableHead.insertRow()
        let modifier = 0;
        if (level == "city") {
            generateCell("City")
            generateCell("Province")
            detailElements.tableHead.children[0].children[0].addEventListener("click", () => {
                sortTable("city")
            })
            detailElements.tableHead.children[0].children[1].addEventListener("click", () => {
                sortTable("province")
            })
            modifier = 2
        }
        else if (level == "province") {
            generateCell("Province")
            detailElements.tableHead.children[0].children[0].addEventListener("click", () => {
                sortTable("province")
            })
            modifier = 1

        }
        generateCell("Region")
        detailElements.tableHead.children[0].children[0 + modifier].addEventListener("click", () => {
            sortTable("region")
        })
        generateCell("Download Speed (MBps)")
        detailElements.tableHead.children[0].children[1 + modifier].addEventListener("click", () => {
            sortTableNumbers("downloadSpeed_mbps")
        })
        generateCell("Upload Speed (MBps)")
        detailElements.tableHead.children[0].children[2 + modifier].addEventListener("click", () => {
            sortTableNumbers("uploadSpeed_mbps")
        })
        generateCell("Latency (ms)")
        detailElements.tableHead.children[0].children[3 + modifier].addEventListener("click", () => {
            sortTableNumbers("latency_ms")
        })
        generateCell("Tests")
        detailElements.tableHead.children[0].children[4 + modifier].addEventListener("click", () => {
            sortTableNumbers("tests")
        })
        if (level == "city") {
            generateCell("State of Works")
            detailElements.tableHead.children[0].children[7].addEventListener("click", () => {
                sortTable("stateOfWorks")
            })
        }
        else {
            const names = ["Unknown", "In definitive planning", "In executive planning", "Scheduled", "Being implemented", "In progress", "Being tested", "Done"]

            for (let k = 0; k < names.length; k++) {
                generateCell(names[k])
                detailElements.tableHead.children[0].children[5 + k + modifier].addEventListener("click", () => {
                    sortTableNumbers(names[k])
                })
            }
        }
        updateDetails()
        function generateCell(cellText) {
            let th = document.createElement("th");
            let text = document.createTextNode(cellText);
            th.appendChild(text);
            row.appendChild(th);
        }
    }
}

//Table Interactions
detailElements.detailLevelCity.addEventListener("click", (event) => {
    detailElements.detailLevelCity.style.backgroundColor = '#cccccc';
    detailElements.detailLevelProvince.style.backgroundColor = 'white';
    detailElements.detailLevelRegion.style.backgroundColor = 'white';

    setDetailLevel("city")
})
detailElements.detailLevelProvince.addEventListener("click", () => {
    detailElements.detailLevelCity.style.backgroundColor = 'white';
    detailElements.detailLevelProvince.style.backgroundColor = '#cccccc';
    detailElements.detailLevelRegion.style.backgroundColor = 'white';

    setDetailLevel("province")
})
detailElements.detailLevelRegion.addEventListener("click", () => {
    detailElements.detailLevelCity.style.backgroundColor = 'white';
    detailElements.detailLevelProvince.style.backgroundColor = 'white';
    detailElements.detailLevelRegion.style.backgroundColor = '#cccccc';

    setDetailLevel("region")
})
setDetailLevel("city")


function sortTable(attr) {
    let objs = []
    dataset.selectedData[detailLevel].forEach(obj => {
        objs.push(dataset[detailLevel].get(obj)[0])
    })
    objs.sort((a, b) => a[attr].toLowerCase() > b[attr].toLowerCase())
    dataset.selectedData[detailLevel] = []
    objs.forEach(obj => {
        dataset.selectedData[detailLevel].push(obj[detailLevel])
    })
    updateDetails()
}
function sortTableNumbers(attr) {
    let objs = []
    dataset.selectedData[detailLevel].forEach(obj => {
        objs.push(dataset[detailLevel].get(obj)[0])
    })
    objs.sort((a, b) => parseFloat(a[attr]) > parseFloat(b[attr]))
    dataset.selectedData[detailLevel] = []
    objs.forEach(obj => {
        dataset.selectedData[detailLevel].push(obj[detailLevel])
    })
    updateDetails()
}

export function focus(objName, level) {
    focusMap(objName, level)
    focusParallelPlot(objName, level)
    focusScatterplot(objName, level)
}
export function stopFocus() {
    stopFocusMap()
    stopFocusParallelPlot()
    stopFocusScatterplot()
}