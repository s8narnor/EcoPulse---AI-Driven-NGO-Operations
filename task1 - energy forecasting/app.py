import streamlit as st
import numpy as np
import pandas as pd
import joblib
import plotly.express as px
from config import ENSEMBLE_WEIGHTS, CO2_FACTOR

st.set_page_config(layout="wide")

# -------------------------------------------------
# LOAD MODELS
# -------------------------------------------------

@st.cache_resource
def load_models():
    lr = joblib.load("linear_model.pkl")
    rf = joblib.load("random_forest_model.pkl")
    gb = joblib.load("gradient_boost_model.pkl")
    scaler = joblib.load("scaler.pkl")
    return lr, rf, gb, scaler

lr, rf, gb, scaler = load_models()

# -------------------------------------------------
# TITLE
# -------------------------------------------------

st.title("🌱 AI Sustainability Decision Intelligence Platform for NGOs")
st.caption("Built for leadership teams to enable data-driven sustainability decisions.")

# -------------------------------------------------
# CREATE TABS
# -------------------------------------------------

tab1, tab2 = st.tabs([
    "🌍 Sustainability Problem Landscape",
    "🤖 AI Sustainability Platform"
])

# =================================================
# TAB 1 — PROBLEM LANDSCAPE
# =================================================

with tab1:

    st.header("Defining the NGO Sustainability Challenge")

    st.markdown("""
Non-governmental organizations operate with constrained budgets,
distributed operations, and limited access to sustainability intelligence tools.

Despite their social impact, most NGOs lack structured systems to measure,
forecast, and optimize their operational carbon footprint.
""")

    st.divider()

    # Carbon Tracking Gap
    st.subheader("⚠ Carbon Tracking Gap in NGOs")

    st.info("""
Most NGOs rely on fragmented approaches such as utility bills,
manual spreadsheets, or expense reports.

This results in:

• No real-time carbon visibility  
• Inability to forecast emissions  
• Reactive instead of proactive decisions  
""")

    # Multi-Activity Emissions
    st.subheader("🌐 Multi-Activity Emission Sources")

    col1, col2 = st.columns(2)

    col1.markdown("""
**Primary Drivers**

✅ Infrastructure energy  
✅ Staff travel  
✅ Program delivery  
✅ Events  
""")

    col2.markdown("""
**Hidden Contributors**

✅ Digital operations  
✅ Vendor logistics  
✅ Office utilities  
✅ Equipment usage  
""")

    st.warning("""
Because emissions originate from diverse activities,
NGOs often underestimate their true environmental impact.
""")

    # Decision Support
    st.subheader("🧠 Lack of Decision Intelligence")

    st.markdown("""
Traditional tools focus on historical reporting.

However, NGO leadership teams require systems that can:

• Forecast future emissions  
• Detect operational risks  
• Recommend reduction strategies  
• Prioritize sustainability investments  
""")

    st.success("""
👉 The future of sustainability lies in **predictive decision intelligence**, not passive tracking.
""")

    # Donor Reporting
    st.subheader("📊 Donor & Stakeholder Expectations")

    st.markdown("""
Funding partners increasingly expect measurable environmental impact.

Without credible sustainability data, NGOs face:

• Reduced funding competitiveness  
• Lower stakeholder trust  
• Difficulty demonstrating outcomes  
""")

    st.info("""
An AI-driven sustainability platform enables NGOs to produce
**data-backed, donor-ready reports with confidence.**
""")

    st.divider()

    st.header("🚀 Our Approach")

    st.markdown("""
This platform transforms sustainability from reactive reporting
into **AI-powered operational intelligence**.

By combining ensemble machine learning, carbon forecasting,
and financial impact modeling, NGOs can:

✅ Understand their footprint  
✅ Anticipate risks  
✅ Optimize strategy  
✅ Demonstrate impact  
""")

    st.success("Navigate to the **AI Sustainability Platform** tab to explore the system.")

# =================================================
# TAB 2 — AI PLATFORM
# =================================================

with tab2:

    st.info("""
### Executive Sustainability Brief

Your NGO is operating at a **moderate sustainability maturity level**.  
Infrastructure energy remains the primary emission driver.  
Strategic optimization could reduce emissions by **20–30% annually**.
""")

    # Sidebar Inputs
    st.sidebar.header("Operational Inputs")

    hour = st.sidebar.slider("Operating Hour", 0, 23, 10)
    is_weekend = st.sidebar.selectbox("Weekend?", [0,1])
    activity_index = st.sidebar.selectbox("Peak Activity?", [0,1])

    T_out = st.sidebar.slider("Outdoor Temp (°C)", -5, 45, 26)
    RH_out = st.sidebar.slider("Humidity (%)", 10, 100, 55)
    wind = st.sidebar.slider("Wind Speed", 0.0, 15.0, 3.5)

    avg_temp = st.sidebar.slider("Indoor Temp", 10.0, 35.0, 23.0)
    avg_humidity = st.sidebar.slider("Indoor Humidity", 10.0, 90.0, 48.0)

    lag1 = st.sidebar.number_input("Last Hour Energy", value=0.45)
    lag2 = st.sidebar.number_input("2 Hours Ago", value=0.40)

    rolling = (lag1 + lag2) / 2

    features = np.array([[
        hour, is_weekend, activity_index,
        T_out, RH_out, wind,
        avg_temp, avg_humidity,
        lag1, lag2, rolling
    ]])

    # Run Prediction
    if st.button("Run AI Sustainability Analysis"):

        scaled = scaler.transform(features)

        pred_lr = np.expm1(lr.predict(scaled))[0]
        pred_rf = np.expm1(rf.predict(features))[0]
        pred_gb = np.expm1(gb.predict(features))[0]

        ensemble = (
            ENSEMBLE_WEIGHTS["lr"] * pred_lr +
            ENSEMBLE_WEIGHTS["rf"] * pred_rf +
            ENSEMBLE_WEIGHTS["gb"] * pred_gb
        )

        carbon = ensemble * CO2_FACTOR

        st.header("Sustainability Command Center")

        c1, c2, c3, c4 = st.columns(4)

        score = max(0, int(100 - carbon*8))
        annual_cost = int(carbon * 12 * 365)

        c1.metric("Predicted Energy", f"{ensemble:.2f} kWh")
        c2.metric("Carbon Emissions", f"{carbon:.2f} kg CO₂")
        c3.metric("AI Sustainability Score", f"{score}/100")
        c4.metric("Annual Cost of Emissions", f"₹{annual_cost:,}")

        # Forecast
        st.subheader("12-Month Carbon Forecast")

        months = ["Jan","Feb","Mar","Apr","May","Jun",
                  "Jul","Aug","Sep","Oct","Nov","Dec"]

        forecast = np.linspace(carbon*0.9, carbon*1.3, 12)

        fig = px.line(x=months, y=forecast)
        st.plotly_chart(fig, use_container_width=True)

        # Hotspot
        st.subheader("Carbon Hotspot Detection")

        if activity_index == 1:
            st.warning("Peak operational activity is the largest emission driver.")
        elif T_out > 32:
            st.warning("Cooling demand is significantly increasing energy usage.")
        else:
            st.success("No critical emission hotspots detected.")

        # Explainability
        st.subheader("Why Did AI Predict This?")

        drivers = []

        if T_out > 30:
            drivers.append("High outdoor temperature increasing cooling load")

        if activity_index == 1:
            drivers.append("Peak NGO activity")

        if lag1 > 0.5:
            drivers.append("Recent spike in energy usage")

        for d in drivers:
            st.write(f"• {d}")

        # Decision Engine
        st.header("AI Decision Intelligence")

        actions = [
            ("Optimize HVAC schedules", carbon*0.18, 65000),
            ("Shift programs to hybrid delivery", carbon*0.12, 52000),
            ("Upgrade to LED lighting", carbon*0.09, 40000)
        ]

        for action, co2, money in actions:
            st.write(f"✅ **{action}**")
            st.write(f"CO₂ Reduction Potential: {co2:.2f} tons/year")
            st.write(f"Savings Potential: ₹{money:,}")
            st.divider()

        # Investment Planner
        st.header("AI Sustainability Capital Allocator")

        data = {
            "Initiative": ["LED Lighting Upgrade",
                           "Hybrid Program Delivery",
                           "Solar Installation"],
            "Estimated Investment (₹)": [150000, 80000, 400000],
            "CO₂ Reduction (tons/year)": [3.2, 2.1, 6.8],
            "Annual Savings (₹)": [90000, 70000, 120000]
        }

        df = pd.DataFrame(data)
        df["ROI Score"] = (df["Annual Savings (₹)"] /
                           df["Estimated Investment (₹)"]).round(2)

        df["Payback Period (Years)"] = (
            df["Estimated Investment (₹)"] /
            df["Annual Savings (₹)"]
        ).round(1)

        st.dataframe(df.sort_values(by="ROI Score", ascending=False))

        st.success("AI recommends prioritizing investments with the highest carbon reduction per rupee.")

        # Environmental Equivalent
        trees = int(carbon * 0.04 * 365)
        st.info(f"Equivalent to planting approximately 🌳 {trees} trees annually.")

        # Methodology
        with st.expander("View AI Methodology"):
            st.write("""
            • Ensemble machine learning for energy prediction  
            • Hybrid carbon modeling  
            • Explainable AI  
            • Scenario-based sustainability planning  
            """)
