#matplotlib inline

from datetime import datetime

import geopandas as gp

import pandas as pd
import numpy as np


currentDateAndTime = datetime.now().strftime("%H:%M:%S")
print("The current date and time is", currentDateAndTime, end="\n--------------------------------\n")   
ooklaFilepath="static/dataset/zippedOoklaFiles/2023-01-01_performance_fixed_tiles.zip"
cityMapFilePath="./static/maps_geojson/limits_IT_municipalities.geojson"
bulDatasetPath = "BUL-stateOfWorks.csv"

tiles = gp.read_file(ooklaFilepath)

cities = gp.read_file(cityMapFilePath) #,rows = 10)
cities=cities.drop(columns=["op_id", "name_de", "name_sl", 'minint_elettorale', 'minint_finloc', 'name_it', 'prov_istat_code','prov_istat_code_num', "prov_acr",'reg_istat_code', 'reg_istat_code_num', 'opdm_id', 'com_catasto_code', 'com_istat_code', 'com_istat_code_num'])

#Tiles CRS is EPSG:4326. This serves to make sure the coordinates are correct
italianCities=cities.to_crs(epsg=4326)

# The "intersects" predicate allows to define to which city each tile belongs:
# Geometric objects intersect if they have any boundary or interior point in common.
cityDF = gp.sjoin(tiles, italianCities, how="inner", predicate='intersects')

# convert to Mbps for easier reading
cityDF['avg_d_mbps'] = cityDF['avg_d_kbps'] / 1000
cityDF['avg_u_mbps'] = cityDF['avg_u_kbps'] / 1000
cityDF=cityDF.drop(columns=["quadkey","avg_d_kbps","avg_u_kbps","devices","index_right"])
cityDF=cityDF.rename(columns={"avg_lat_ms": "latency_ms","tests":"tests","name":"city","prov_name":"province",
                        "reg_name":"region","avg_d_mbps":"downloadSpeed_mbps","avg_u_mbps":"uploadSpeed_mbps"})

cityDF = cityDF.groupby(['region','province',"city"], group_keys=True).apply(
        lambda x: pd.Series(
            {"downloadSpeed_mbps": np.average(x["downloadSpeed_mbps"], weights=x["tests"]),
             "uploadSpeed_mbps": np.average(x["uploadSpeed_mbps"], weights=x["tests"]),
             "latency_ms": np.average(x["latency_ms"], weights=x["tests"]),
             }
        )
    ).reset_index().merge(
        cityDF.groupby(['city'],  group_keys=True)
        .agg(tests=("tests", "sum"))
        .reset_index(),
        on=['city'], how="left",
    ) 
bulDF=pd.read_csv(bulDatasetPath)
bulDF=bulDF.drop(columns=["region_name","province_name","city_id","wireless_work_status","pcn_route", "pcn_sede_id", "pcn_sede_name", "pcn_work_status", "pcn_direttrice", "pcn_ordine_direttrice"
                          ,"pcn_cab_transitorio" ,"ui_piano_base" ,"ui_piano_integrativo" ,"fibra" ,"fwa" ,"piano_of_fibra" ,"piano_of_fwa" ,"piano_of_fibra_2021"])
bulDF=bulDF.rename(columns={"city_name":"city","fiber_work_status":"stateOfWorks"})

bulDF[['stateOfWorks']] = bulDF[['stateOfWorks']].fillna('Unknown') #Replace NaN values with the "unknown" string
bulDF[['stateOfWorks']] = bulDF[['stateOfWorks']].replace(['in progettazione definitiva','in progettazione esecutiva',"in programmazione","in esecuzione","lavori chiusi", "in collaudo", "terminato"]
                                                          ,["In definitive planning","In executive planning" ,"Scheduled","Being implemented","In progress","Being tested","Done" ])
cityDF=cityDF.merge(bulDF, how="left",on="city")
cityDF[['stateOfWorks']] = cityDF[['stateOfWorks']].fillna('Unknown') #Replace NaN values with the "unknown" string

cityDF.to_csv("speedtest_bul_city.csv",index=False)
stateOfWorksProvince = {}
stateOfWorksRegion= {}
for index, row in cityDF.iterrows():
    stateOfWorksProvince[row["province"]] = {}
    stateOfWorksProvince[row["province"]]["Unknown"] = 0
    stateOfWorksProvince[row["province"]]["In definitive planning"] = 0
    stateOfWorksProvince[row["province"]]["In executive planning"] = 0
    stateOfWorksProvince[row["province"]]["Scheduled"] = 0
    stateOfWorksProvince[row["province"]]["Being implemented"] = 0
    stateOfWorksProvince[row["province"]]["In progress"] = 0
    stateOfWorksProvince[row["province"]]["Being tested"] = 0
    stateOfWorksProvince[row["province"]]["Done"] = 0
    
    stateOfWorksRegion[row["region"]] = {}
    stateOfWorksRegion[row["region"]]["Unknown"] = 0
    stateOfWorksRegion[row["region"]]["In definitive planning"] = 0
    stateOfWorksRegion[row["region"]]["In executive planning"] = 0
    stateOfWorksRegion[row["region"]]["Scheduled"] = 0
    stateOfWorksRegion[row["region"]]["Being implemented"] = 0
    stateOfWorksRegion[row["region"]]["In progress"] = 0
    stateOfWorksRegion[row["region"]]["Being tested"] = 0
    stateOfWorksRegion[row["region"]]["Done"] = 0   

for index, row in cityDF.iterrows():
    stateOfWorksProvince[row["province"]][row["stateOfWorks"]] = stateOfWorksProvince[row["province"]][row["stateOfWorks"]] +1
    stateOfWorksRegion[row["region"]][row["stateOfWorks"]]=stateOfWorksRegion[row["region"]][row["stateOfWorks"]] +1
    
#Now filter the data based on province
provinceDF = cityDF.drop(columns=["city"])
provinceDF = cityDF.groupby(['region','province'], group_keys=True).apply(
        lambda x: pd.Series(
            {"downloadSpeed_mbps": np.average(x["downloadSpeed_mbps"], weights=x["tests"]),
             "uploadSpeed_mbps": np.average(x["uploadSpeed_mbps"], weights=x["tests"]),
             "latency_ms": np.average(x["latency_ms"], weights=x["tests"]),
             }
        )
    ).reset_index().merge(
        cityDF.groupby(['province'],  group_keys=True)
        .agg(tests=("tests", "sum"))
        .reset_index(),
        on=['province'], how="left",
    )
provincesUnknown = []
provincesInDefinitivePlanning = []
provincesInExecutivePlanning = []
provincesScheduled = []
provincesBeingImplemented = []
provincesInProgress = []
provincesBeingTested = []
provincesDone = []
for index, row in provinceDF.iterrows():
    provincesUnknown.append(stateOfWorksProvince[row["province"]]["Unknown"])
    provincesInDefinitivePlanning.append(stateOfWorksProvince[row["province"]]["In definitive planning"])
    provincesInExecutivePlanning.append(stateOfWorksProvince[row["province"]]["In executive planning"])
    provincesScheduled.append(stateOfWorksProvince[row["province"]]["Scheduled"])
    provincesBeingImplemented.append(stateOfWorksProvince[row["province"]]["Being implemented"])
    provincesInProgress.append(stateOfWorksProvince[row["province"]]["In progress"])
    provincesBeingTested.append(stateOfWorksProvince[row["province"]]["Being tested"])
    provincesDone.append(stateOfWorksProvince[row["province"]]["Done"])

provinceDF["Unknown"] = provincesUnknown
provinceDF["In definitive planning"] = provincesInDefinitivePlanning
provinceDF["In executive planning"] = provincesInExecutivePlanning
provinceDF["Scheduled"] = provincesScheduled
provinceDF["Being implemented"] = provincesBeingImplemented
provinceDF["In progress"] = provincesInProgress
provinceDF["Being tested"] = provincesBeingTested
provinceDF["Done"] = provincesDone

provinceDF.to_csv("speedtest_bul_province.csv",index=False)
provinceDF = provinceDF.drop(columns=["province"])
regionDF = provinceDF.groupby(['region'], group_keys=True).apply(
        lambda x: pd.Series(
            {"downloadSpeed_mbps": np.average(x["downloadSpeed_mbps"], weights=x["tests"]),
             "uploadSpeed_mbps": np.average(x["uploadSpeed_mbps"], weights=x["tests"]),
             "latency_ms": np.average(x["latency_ms"], weights=x["tests"]),
             }
        )
    ).reset_index().merge(
        provinceDF.groupby(['region'],  group_keys=True)
        .agg({"tests": ["sum"], 
             "Unknown": ["sum"], 
            "In definitive planning": ["sum"], 
            "In executive planning" : ["sum"],
            "Scheduled" : ["sum"],
            "Being implemented" : ["sum"], 
            "In progress": ["sum"], 
            "Being tested": ["sum"], 
            "Done": ["sum"]}
             )
        .reset_index(),
        on=['region'], how="left",
    )
pd.DataFrame(regionDF).to_csv("speedtest_bul_region.csv",index=False)

currentDateAndTime = datetime.now().strftime("%H:%M:%S")
print("The current date and time is", currentDateAndTime, end="\n--------------------------------\n")   