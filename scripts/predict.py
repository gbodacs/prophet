import pandas as pd
from prophet import Prophet
from prophet.plot import plot_plotly, plot_components_plotly
import matplotlib
matplotlib.use('Agg')
from matplotlib import pyplot
from pathlib import Path
import re

import numpy
from numpy import array
from numpy import hstack
import matplotlib.pyplot as plt
from pandas import read_csv
import datetime
import glob, os
import math
import random
import sys, getopt
# from keras.optimizers import SGD
# from keras.models import Sequential
# from keras.models import load_model
# from keras.callbacks import Callback
# from keras.layers import Dense
# from keras.layers import Dropout
# from keras.layers import LSTM
# from keras.layers import RepeatVector
# from keras.layers import TimeDistributed
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error
from sklearn.metrics import mean_absolute_error
from sklearn.metrics import mean_squared_log_error

def cycle_analysis(data, cycle, filename_base, filename_token, forecast_plot = False):
    training = []
    testing = []
    if (len(data) > 2800 ):
        training = data[-2800:-220].iloc[:-1,]
        testing = data[-220:]
    else:
        training = data[0:-60].iloc[:-1,]
        testing = data[-60:]
    predict_period = 60
    df = training.reset_index()
    df.columns = ['index','ds','y']
    training.columns = ['ds','y']
    testing.columns = ['ds','y']
    #m = Prophet(weekly_seasonality=False,yearly_seasonality=False,daily_seasonality=False)
    #m.add_seasonality('self_define_cycle',period=cycle,fourier_order=32,mode=mode)

    m = Prophet(
    growth="linear",
    #holidays=holidays,
    seasonality_mode='multiplicative',  # mcmc-vel multiplicative-ot kell hasznalni --- map-pel additive-ot
    #changepoint_prior_scale=0.3,
    #seasonality_prior_scale=0.3,
    interval_width=0.85,                 # egy cycle szelessegenek rugalmassaga
    #holidays_prior_scale=20,
    mcmc_samples=50,
    #changepoint_prior_scale=30,
    #changepoint_range=0.91,
    #seasonality_prior_scale=35,
    #holidays_prior_scale=20,
    daily_seasonality=False,
    weekly_seasonality=False,
    yearly_seasonality=False,
    )
    
    for c in cycle:
        nameCycle = 'cycle'+str(c)
        m.add_seasonality(name=nameCycle, period=c, fourier_order=32) # prior_scale=15

    m.fit(df)
    future = m.make_future_dataframe(periods=predict_period)
    forecast = m.predict(future)
    if forecast_plot:
        components22 = m.plot_components(forecast)
        forecast22 = m.plot(forecast)
         
        testDate = testing.values[:,0] #date
        testValue = testing.values[:,1] #value

        #forecast22.savefig(f"./public/results/{filename_base}0-{filename_token}.png")
        #components22.savefig(f"./public/results/{filename_base}1-{filename_token}.png")

        conv_dates = []
        for i in range(len(testDate)):
            date1 = datetime.datetime.strptime(testing.values[i,0], '%Y-%m-%d').date()
            conv_dates = numpy.append(conv_dates, date1)
        plt.plot(conv_dates, testValue, '.', color='#33ff33', alpha=0.6)

        plt.xlabel('Date', fontsize=12, fontweight='bold', color='gray')
        plt.ylabel('Price', fontsize=12, fontweight='bold', color='gray')
        
        forecast22.savefig(f"./public/results/{filename_base}0-{filename_token}.png")
        components22.savefig(f"./public/results/{filename_base}1-{filename_token}.png")
        plt.savefig(f"./public/results/{filename_base}2-{filename_token}.png")
        #plt.show()

        plt.close("all")
    
    temp = forecast['yhat']
    # Todo: save new csv with forecasted values in another column, for later analysis

    return 0

def RunPredict(csv_name, base, token): 
    fileName = csv_name
    df = pd.read_csv(fileName, usecols=[0,1])
    print("Running prediction on: "+fileName)
    cycle_analysis(df, [16, 21], base, token, forecast_plot=True) # fixed cycles

def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python scripts/p2.py <csv-file-name>", file=sys.stderr)
        return 1

    csv_name = sys.argv[1]
    #if "error" in csv_name.lower():
    #    print("Simulated processor error for testing", file=sys.stderr)
    #    return 2

    #root = Path(__file__).resolve().parent.parent
    results_dir = "./public/results"
    #results_dir.mkdir(parents=True, exist_ok=True)

    stem = Path(csv_name).stem
    match = re.match(r"^(.*)-(\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2})$", stem)
    if not match:
        print("CSV file name does not contain expected token", file=sys.stderr)
        return 3

    base = match.group(1)
    token = match.group(2)

    RunPredict(csv_name, base, token)
    #for index in (1, 2, 3):
    #    file_name = f"{base}{index}-{token}.png"
    #    (results_dir / file_name).write_bytes(png_bytes)
    print("Done.")

if __name__ == "__main__":
    raise SystemExit(main())