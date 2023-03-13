var citiesMapPath="./maps_geojson/limits_IT_municipalities.geojson"
var provincesMapPath="./maps_geojson/limits_IT_provinces.geojson"
var regionsMapPath="./maps_geojson/limits_IT_regions.geojson"

var datasetPath="./dataset/speedtest_bul_tiles.csv"



var svgMap = d3.select("#map");
var g = svgMap.append("g");
var widthMap = document.getElementById("map").clientWidth
var heightMap = document.getElementById("map").clientHeight;

//Load geojson file
d3.json(citiesMapPath, function(error,data){
    // createWorld
  })