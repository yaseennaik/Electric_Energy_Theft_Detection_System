# ⚡ Electric Energy Theft Detection System

## 📘 Overview
The **Electric Energy Theft Detection System** is a machine learning project designed to detect abnormal electricity consumption patterns that could indicate 


**power theft**.  
By analyzing power usage data alongside environmental factors like temperature, humidity, and wind speed, the system identifies irregularities in electricity usage and flags suspicious behavior.

---

## 🧩 Dataset Information
The dataset contains **half-hourly readings** of electricity consumption and related weather parameters.

**Features include:**
- **Timestamp:** Date and time of recording (30-minute intervals)  
- **Electricity_Consumed (kWh):** Power consumed  
- **Temperature (°C):** Ambient temperature  
- **Humidity (%):** Relative humidity  
- **Wind_Speed (km/h):** Wind conditions  
- **Avg_of_past12:** Rolling average of past 12 readings (used to track usage trends)  
- **Anomaly_Label:** Indicates whether the record is *Normal* or *Theft*  

---

## ⚙️ Preprocessing Steps
1. **Loaded** the raw dataset and inspected its structure and datatypes.  
2. **Handled missing values** by removing rows with null `Anomaly_Label`.  
3. **Removed unnecessary columns** such as `Avg_Past_Consumption`.  
4. **Converted** `Timestamp` to proper datetime format and sorted data chronologically.  
5. **Added a new feature** — `Avg_of_past12`, representing the rolling mean of the last 12 readings.  
6. **Encoded labels**:  
   - Normal → 0  
   - Theft → 1  
7. **Saved** the processed dataset for training and testing.

---

## 📊 Visualization Performed
- **Histograms:** Observed distribution of all numerical features.    
- **Box Plots:** Identified outliers in energy consumption.  
- **Heatmap:** Visualized correlations among variables.

---

## 🧾 Output Summary
- ✅ Preprocessed dataset ready for model training  
- ✅ Rolling averages computed for each record  
- ✅ Visual insights generated for better understanding of data trends  

---

## 🛠️ Tools & Libraries
- **Python**  
- **Pandas**  
- **NumPy**  
- **Matplotlib / Seaborn**  
- **Scikit-learn**

---

## 🤖 Model (Next Phase)
The next phase involves training a **Random Forest Classifier** for theft detection.  

---

## 📅 Current Status
| Task | Status |
|------|---------|
| Data Preprocessing | ✅ Completed |
| Data Visualization | ✅ Completed |
| Model Building | 🔜 Next Phase |

---

### 👨‍💻 Author
Developed by **Yaseen Naik**  
*Energy-focused ML Research Project*
