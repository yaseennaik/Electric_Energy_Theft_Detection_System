# streamlit_app.py

import streamlit as st
import pandas as pd
import joblib

# --- 1. Load saved model and scaler ---
model = joblib.load("../Models/rf_model.pkl")
scaler = joblib.load("../Models/scaler.pkl")

st.title("Electric Energy Theft Detection System")

st.write("""
This app uses a pre-trained Random Forest model to detect anomalies in electricity consumption.
""")

# --- 2. User input for a single sample ---
st.subheader("Enter feature values for prediction:")

# Define the feature names exactly as in your training data
feature_names = ["Electricity_Consumed", "Temperature", "Humidity", "Wind_Speed", "Avg_of_past12"]
input_data = {}

for feature in feature_names:
    input_data[feature] = st.number_input(f"{feature}")

# --- 3. Threshold slider ---
threshold = st.slider("Set anomaly threshold", 0.0, 1.0, 0.5, 0.01)

# --- 4. Predict button ---
if st.button("Predict"):
    # Convert input to DataFrame
    sample_df = pd.DataFrame([input_data])
    
    # Scale the input
    sample_scaled = scaler.transform(sample_df)
    
    # Predict probability and label
    prob = model.predict_proba(sample_scaled)[0][1]
    pred = int(prob >= threshold)
    
    # Show result
    st.write(f"Prediction: **{'Anomaly' if pred == 1 else 'Normal'}**")
    st.write(f"Anomaly Probability: {prob:.2f}")
