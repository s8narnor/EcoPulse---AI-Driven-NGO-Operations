FEATURES = [
    'hour', 'is_weekend', 'activity_index',
    'T_out', 'RH_out', 'Windspeed',
    'avg_indoor_temp', 'avg_indoor_humidity',
    'lag_1', 'lag_2', 'rolling_mean_3'
]

ENSEMBLE_WEIGHTS = {
    "lr": 0.2,
    "rf": 0.4,
    "gb": 0.4
}

CO2_FACTOR = 0.82  # kg CO2 per kWh
