import joblib
import numpy as np

# Load models
lr = joblib.load("linear_model.pkl")
rf = joblib.load("random_forest_model.pkl")
gb = joblib.load("gradient_boost_model.pkl")
scaler = joblib.load("scaler.pkl")

CO2_FACTOR = 0.82

# Example input (same order as training features)
raw_features = np.array([
    [19, 0, 1, 30, 70, 3.0, 24, 55, 0.25, 0.22, 0.24]
])


scaled_features = scaler.transform(raw_features)

# Predict
y_lr = np.expm1(lr.predict(scaled_features))[0]
y_rf = np.expm1(rf.predict(raw_features))[0]
y_gb = np.expm1(gb.predict(raw_features))[0]

energy = 0.2*y_lr + 0.4*y_rf + 0.4*y_gb
co2 = energy * CO2_FACTOR

print(f"Predicted Energy: {energy:.3f} kWh")
print(f"Estimated CO₂ Emission: {co2:.3f} kg")
