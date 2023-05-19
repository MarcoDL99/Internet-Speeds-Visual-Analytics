import flask
from flask import Flask, render_template, request
from datetime import datetime

import pandas as pd
from sklearn.manifold import TSNE

app = Flask(__name__)

@app.route("/")
def index():
    return render_template('index.html')

@app.route('/tsne') #/tsne?level=N&use=download-upload-latency-tests-states
def tsne():
    csvName="./static/dataset/tsne/tsne_results.csv"   
    datasetsPaths = {
        "city": "./static/dataset/speedtest_bul_city.csv",
        "province": "./static/dataset/speedtest_bul_province.csv",
        "region": "./static/dataset/speedtest_bul_region.csv"
    }
    requestLevel = request.args.get('level') 
    
    requestAttributes = request.args.get("attributes").split("-")
    
    def executeTSNE(data): #takes up to a minute seconds
        """Each work state is mapped to an integer value based on the progress of the work. The value increases with the completeness of the works, so the lowest value
        is assigned to works which are still being planned, whereas completed works have the highest value. Also, some cities have an unknown state of work as it is not
        present in the BUL dataset. This state is mapped to 0. The full mapping is the following:
        "Unknown" -> 0
        "In definitive planning"-> 1
        "In executive planning" -> 2
        "Scheduled" -> 3
        "Being implemented" -> 4
        "In progress" -> 5
        "Being tested"  -> 6
        "Done" -> 7
            
        The distance between two states is the absolute value of the difference between the integers. 
        """
        if ("stateOfWorks" in data.columns):
            data["stateOfWorks"]=data["stateOfWorks"].replace(["unknown","in definitive planning","in executive planning","scheduled","being implemented","in progress","being tested","done"],[0,1,2,3,4,5,6,7])
        elif("Unknown" in data.columns):   #If doing tsne on province/region state of works, normalize the data 
            for index, row in data.iterrows():
                count = row["Unknown"]
                count = count + row["In definitive planning"]
                count = count + row["In executive planning"]
                count = count + row["Scheduled"]
                count = count + row["Being implemented"]
                count = count + row["In progress"]
                count = count + row["Being tested"]
                count = count + row["Done"]
                data.at[index,"Unknown"] = (data.at[index,"Unknown"])/count
                data.at[index,"In definitive planning"] = (data.at[index,"In definitive planning"])/count            
                data.at[index,"In executive planning"] = (data.at[index,"In executive planning"])/count
                data.at[index,"Scheduled"] = (data.at[index,"Scheduled"])/count
                data.at[index,"Being implemented"] = (data.at[index,"Being implemented"])/count
                data.at[index,"In progress"] = (data.at[index,"In progress"])/count
                data.at[index,"Done"] = (data.at[index,"Done"])/count
        print(data)
        currentDateAndTime = datetime.now().strftime("%H:%M:%S")
        print("STARTING TSNE ON ", data.columns.values)
        print("The current date and time is", currentDateAndTime)
        RS = 2015010
        if len(data.index) <=30:
            data_tsne= TSNE(random_state=RS, perplexity=10).fit_transform(data)
        else:
            data_tsne= TSNE(random_state=RS).fit_transform(data)
        df = pd.DataFrame(data_tsne) 
        df.columns = ["tsneX","tsneY"]
        print("ENDING TSNE ON ", data.columns.values)
        currentDateAndTime = datetime.now().strftime("%H:%M:%S")
        print("The current date and time is", currentDateAndTime, end="\n--------------------------------\n")  
        return df 
    

    df = pd.read_csv(datasetsPaths[requestLevel])
    print(requestAttributes)
    if("stateOfWorks" in requestAttributes and requestLevel!="city"): #If doing tsne on region/provinces
        requestAttributes.remove("stateOfWorks")
        requestAttributes.append("Unknown")
        requestAttributes.append("In definitive planning")
        requestAttributes.append("In executive planning")
        requestAttributes.append("Scheduled")
        requestAttributes.append("Being implemented")
        requestAttributes.append("In progress")
        requestAttributes.append("Being tested")
        requestAttributes.append("Done")
    print(requestAttributes)
    tsneDF=executeTSNE(df[requestAttributes])
    columns=["region","province","city"]
    if requestLevel=="province":
            columns=["region","province"]
    elif requestLevel=="region":
            columns=["region"]
    mergedDF= pd.concat([df[columns],tsneDF],axis=1) #axis=1 -> concat columns, axis =0 -> concat rows
    pd.DataFrame(mergedDF).to_csv(csvName, index = False) #index = False removes the index column
    return csvName

if (__name__ == '__main__'):
    app.run()