import json
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

def load_prophet_config(config_path: str) -> dict:
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Config file not found: {config_path}", file=sys.stderr)
        raise
    except json.JSONDecodeError as e:
        print(f"Invalid JSON in config file: {e}", file=sys.stderr)
        raise


def validate_prophet_config(cfg: dict) -> None:
    required_keys = [
        "growth",
        "seasonality_mode",
        "interval_width",
        "mcmc_samples",
        "daily_seasonality",
        "weekly_seasonality",
        "yearly_seasonality",
        "cycles",
        "cycle_fourier_order",
        "predict_period"
    ]
    missing = [key for key in required_keys if key not in cfg]
    if missing:
        raise KeyError(", ".join(missing))


def cycle_analysis(data, cycle, filename_base, filename_token, input_csv_name, cfg: dict, forecast_plot = False):
    training = []
    testing = []
    #if (len(data) > 2800 ):
    #    training = data[-2800:-220].iloc[:-1,]
    #    testing = data[-220:]
    #else:
    training = data[0:-60]
    testing = data[-60:]
    predict_period = cfg["predict_period"]
    df = training.reset_index()
    df.columns = ['n','o', 'p', 'np','y','ds', 't']
    training.columns = ['n','o', 'p', 'np','y','ds']
    testing.columns = ['n','o', 'p', 'np','y','ds']
    #m = Prophet(weekly_seasonality=False,yearly_seasonality=False,daily_seasonality=False)
    #m.add_seasonality('self_define_cycle',period=cycle,fourier_order=32,mode=mode)

    m = Prophet(
        growth=cfg["growth"],
        seasonality_mode=cfg["seasonality_mode"],
        interval_width=cfg["interval_width"],
        mcmc_samples=cfg["mcmc_samples"],
        daily_seasonality=cfg["daily_seasonality"],
        weekly_seasonality=cfg["weekly_seasonality"],
        yearly_seasonality=cfg["yearly_seasonality"],
    )
    
    for c in cycle:
        nameCycle = 'cycle'+str(c)
        m.add_seasonality(name=nameCycle, period=c, fourier_order=cfg["cycle_fourier_order"])

    m.fit(df)
    future = m.make_future_dataframe(periods=predict_period)
    forecast = m.predict(future)
    if forecast_plot:
        components22 = m.plot_components(forecast)
        forecast22 = m.plot(forecast)
         
        testDate = testing.values[:,5] #date
        testValue = testing.values[:,4] #value

        #forecast22.savefig(f"./public/results/{filename_base}0-{filename_token}.png")
        #components22.savefig(f"./public/results/{filename_base}1-{filename_token}.png")

        conv_dates = []
        for i in range(len(testDate)):
            date1 = datetime.datetime.strptime(testing.values[i,5], '%m/%d/%Y 0:00').date()
            conv_dates = numpy.append(conv_dates, date1)
        plt.plot(conv_dates, testValue, '.', color='#33ff33', alpha=0.6)

        plt.xlabel('Date', fontsize=12, fontweight='bold', color='gray')
        plt.ylabel('Price', fontsize=12, fontweight='bold', color='gray')
        
        forecast22.savefig(f"./public/results/{filename_base}0-{filename_token}.png")
        components22.savefig(f"./public/results/{filename_base}1-{filename_token}.png")
        plt.savefig(f"./public/results/{filename_base}2-{filename_token}.png")
        plt.show()

        #plt.close("all")
    
  #  input_with_prediction = data.copy()
  #  input_with_prediction.columns = ['ds', 'y']
  #  input_with_prediction['predict'] = numpy.nan

  #  forecast_with_input = forecast[['ds', 'yhat']].copy()
  #  forecast_with_input['ds'] = forecast_with_input['ds'].dt.strftime('%Y-%m-%d')

  #  input_dates = set(input_with_prediction['ds'].astype(str))
  #  future_only = forecast_with_input[~forecast_with_input['ds'].isin(input_dates)].copy()
  #  future_only = future_only.rename(columns={'yhat': 'predict'})
  #  future_only['y'] = numpy.nan
  #  future_only = future_only[['ds', 'y', 'predict']]

   # output_df = pd.concat([input_with_prediction, future_only], ignore_index=True)
   # output_df = output_df.sort_values('ds').reset_index(drop=True)

   # output_name = f"{Path(input_csv_name).stem}_predict.csv"
   # output_path = Path("./public/results") / output_name
   # output_path.parent.mkdir(parents=True, exist_ok=True)
   # output_df.to_csv(output_path, index=False)

    return 0

def RunPredict(csv_name, base, token, cfg: dict): 
    fileName = csv_name
    df = pd.read_csv(fileName) #usecols=[0,1])
    print("Running prediction on: "+fileName)
    cycle_analysis(df, cfg["cycles"], base, token, csv_name, cfg, forecast_plot=True)

def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: python scripts/predict.py <csv-file-name> <config-json-path>", file=sys.stderr)
        return 1

    csv_name = sys.argv[1]
    config_path = sys.argv[2]
    #if "error" in csv_name.lower():
    #    print("Simulated processor error for testing", file=sys.stderr)
    #    return 2

    #root = Path(__file__).resolve().parent.parent
    results_dir = "./public/results"
    #results_dir.mkdir(parents=True, exist_ok=True)

    try:
        cfg = load_prophet_config(config_path)
        validate_prophet_config(cfg)
    except (FileNotFoundError, json.JSONDecodeError):
        return 4
    except KeyError as e:
        print(f"Missing config keys: {e}", file=sys.stderr)
        return 5

    stem = Path(csv_name).stem
    match = re.match(r"^(.*)-(\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2})$", stem)
    if not match:
        print("CSV file name does not contain expected token", file=sys.stderr)
        return 3

    base = match.group(1)
    token = match.group(2)

    RunPredict(csv_name, base, token, cfg)
    #for index in (1, 2, 3):
    #    file_name = f"{base}{index}-{token}.png"
    #    (results_dir / file_name).write_bytes(png_bytes)
    print("Done.")

if __name__ == "__main__":
    raise SystemExit(main())