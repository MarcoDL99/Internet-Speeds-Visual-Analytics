import numpy as np

import pandas as pd

from sklearn.manifold import TSNE
from sklearn.preprocessing import StandardScaler
from sklearn import preprocessing
from sklearn import manifold
from datetime import datetime

import matplotlib.pyplot as plt
import matplotlib.patheffects as PathEffects
from scipy.spatial.distance import euclidean, pdist, squareform
import seaborn as sns # We import seaborn to make nice plots


# def scatter(x, colors,n_classes,Title):
#     # We choose a color palette with seaborn, a color for each class
#     palette = np.array(sns.color_palette("hls", n_classes))

#     # We create a scatter plot.
#     f = plt.figure(figsize=(8, 8))
#     ax = plt.subplot(aspect='equal')
#     sc = ax.scatter(x[:,0], x[:,1], lw=0, s=20,c =palette[colors.astype(np.int)])
#     plt.xlim(-25, 25)
#     plt.ylim(-25, 25)
#     ax.axis('off')
#     ax.axis('tight')
#     xtext = -30 
#     ytext = 50

#     txts = []
#     txt = ax.text(xtext, ytext, Title, fontsize=20)
#     txts.append(txt)

#     # We add the labels for each digit    
#     for i in range(n_classes):
#         # Position of each label.
#         xtext, ytext = np.median(x[colors == i, :], axis=0)
#         txt = ax.text(xtext, ytext, str(i+1), fontsize=16)
#         txt.set_path_effects([
#             PathEffects.Stroke(linewidth=5, foreground="w"),
#             PathEffects.Normal()])
#         txts.append(txt)
#     return f, ax, sc, txts


def tsne(data, csvName): #takes around 20 seconds
    currentDateAndTime = datetime.now().strftime("%H:%M:%S")
    print("START", data.columns.values)
    print("The current date and time is", currentDateAndTime)
    # data=data.head(5000)
    RS = 2015010
    data_tsne= TSNE(random_state=RS).fit_transform(data)
    pd.DataFrame(data_tsne).to_csv(csvName)
    print("END", data.columns.values)
    currentDateAndTime = datetime.now().strftime("%H:%M:%S")
    print("The current date and time is", currentDateAndTime, end="\n--------------------------------\n")   

datasetPath = "../dataset/speedtest_bul_cities.csv"
df=pd.read_csv(datasetPath)

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
#statesMap = {"unknown": 0, "in definitive planning": 1, "in executive planning": 2, "scheduled": 3, "being implemented": 4,"in progress": 5, "being tested": 6, "done": 7}

def executeTsne(df):
    df["stateOfWorks"]=df["stateOfWorks"].replace(["unknown","in definitive planning","in executive planning","scheduled","being implemented","in progress","being tested","done"],[0,1,2,3,4,5,6,7])
    print(df["stateOfWorks"])
    print(df.head())

    tsne(df[["downloadSpeed_mbps" , "uploadSpeed_mbps" , "latency_ms"]],"../dataset/tsne/city/data_tsneABC.csv")
    tsne(df[["downloadSpeed_mbps" , "uploadSpeed_mbps" , "tests"]],"../dataset/tsne/city/data_tsneABD.csv")
    tsne(df[["downloadSpeed_mbps" , "uploadSpeed_mbps" , "stateOfWorks"]],"../dataset/tsne/city/data_tsneABE.csv")
    tsne(df[["downloadSpeed_mbps" , "latency_ms" , "tests"]],"../dataset/tsne/city/data_tsneACD.csv")
    tsne(df[["downloadSpeed_mbps" , "latency_ms" , "stateOfWorks"]],"../dataset/tsne/city/data_tsneACE.csv")
    tsne(df[["downloadSpeed_mbps" , "tests" , "stateOfWorks"]],"../dataset/tsne/city/data_tsneADE.csv")
    tsne(df[["uploadSpeed_mbps" , "latency_ms" , "tests"]],"../dataset/tsne/city/data_tsneBCD.csv")
    tsne(df[["uploadSpeed_mbps" , "latency_ms" , "stateOfWorks"]],"../dataset/tsne/city/data_tsneBCE.csv")
    tsne(df[["uploadSpeed_mbps" , "tests" , "stateOfWorks"]],"../dataset/tsne/city/data_tsneBDE.csv")
    tsne(df[["latency_ms" , "tests" , "stateOfWorks"]],"../dataset/tsne/city/data_tsneCDE.csv")

    tsne(df[["downloadSpeed_mbps" , "uploadSpeed_mbps" , "latency_ms" , "tests"]],"../dataset/tsne/city/data_tsneABCD.csv")
    tsne(df[["downloadSpeed_mbps" , "uploadSpeed_mbps" , "latency_ms" , "stateOfWorks"]],"../dataset/tsne/city/data_tsneABCE.csv")
    tsne(df[["downloadSpeed_mbps" , "uploadSpeed_mbps" , "tests" , "stateOfWorks"]],"../dataset/tsne/city/data_tsneABDE.csv")
    tsne(df[["downloadSpeed_mbps" , "latency_ms" , "tests" , "stateOfWorks"]],"../dataset/tsne/city/data_tsneACDE.csv")
    tsne(df[["uploadSpeed_mbps" , "latency_ms" , "tests" , "stateOfWorks"]],"../dataset/tsne/city/data_tsneBCDE.csv")

    tsne(df[["downloadSpeed_mbps" , "uploadSpeed_mbps" , "latency_ms" , "tests", "stateOfWorks"]],"../dataset/tsne/city/data_tsneABCDE.csv")



executeTsne(df)

"""_summary_
    
    
df2 = df.groupby(["reg_name", "prov_name","name","stateOfWorks"]).agg({"downloadSpeed_mbps" :"mean", "uploadSpeed_mbps" :"mean", "latency_ms" :"mean", "tests" : "sum"})
pd.DataFrame(df2).to_csv("df2.csv")
df2=pd.read_csv("df2.csv")
# print(df2)
# print(df2["name"].drop_duplicates())
df2 = df[["reg_name", "prov_name","stateOfWorks"]].drop_duplicates()#.agg({"downloadSpeed_mbps" :"mean", "uploadSpeed_mbps" :"mean", "latency_ms" :"mean", "tests" : "sum"})
print(df2)
pd.DataFrame(df2).to_csv("speedtest_bul_provinces.csv")
df2=pd.read_csv("speedtest_bul_provinces.csv")
print(df2)
provinces=(df2["prov_name"].drop_duplicates()).values.tolist()

# print(df3)
# print(.tolist())
# print(df3.loc[df3["stateOfWorks"] =="unknown"].count())

provinceStates={}
for province in provinces:
    df3=df2.loc[df2["prov_name"]==province]
    
    provinceStates[province]= df3["stateOfWorks"].value_counts()
print(provinceStates.keys())
dff=provinceStates[provinces[0]]
count=0
for key in provinceStates.keys():
    if (count != 0):
        dff=pd.DataFrame(dff).concat(provinceStates[key])    
    count+=1
pd.DataFrame(dff).to_csv("dff.csv")

    #{"unknown": df2.loc[df2[]], "in definitive planning": 1, "in executive planning": 2, "scheduled": 3, "being implemented": 4,"in progress": 5, "being tested": 6, "done": 7}
    
# df2 = df.groupby(["reg_name"]).agg({"downloadSpeed_mbps" :"mean", "uploadSpeed_mbps" :"mean", "latency_ms" :"mean", "tests" : "sum"})
# pd.DataFrame(df2).to_csv("speedtest_bul_regions.csv")
# df2=pd.read_csv("speedtest_bul_regions.csv")
# print(df2)
# print(provinces)
    
    """