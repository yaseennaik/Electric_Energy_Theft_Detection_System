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

## 🤖 Model Implementation
We have successfully implemented a **Random Forest Classifier** for theft detection with the following configurations:
- Number of trees (n_estimators): 300
- Class weights: Balanced (to handle class imbalance)
- Max depth: None (allows trees to grow fully)
- Min samples split: 2

### 📊 Model Performance Metrics

#### Confusion Matrix
```
[[934  11]
 [ 28  27]]
```

##### Interpretation:
- True Negatives (TN) = 934: Correctly identified normal cases
- False Positives (FP) = 11: Normal cases wrongly flagged as theft
- False Negatives (FN) = 28: Missed theft cases
- True Positives (TP) = 27: Correctly identified theft cases

#### Detailed Performance Metrics

For Normal Cases (Class 0):
- **Precision**: 0.97 (97% of predicted normal cases were actually normal)
- **Recall**: 0.99 (99% of actual normal cases were correctly identified)
- **F1-score**: 0.98 (Harmonic mean of precision and recall)

For Theft Cases (Class 1):
- **Precision**: 0.71 (71% of predicted theft cases were actual theft)
- **Recall**: 0.49 (49% of actual theft cases were detected)
- **F1-score**: 0.58 (Harmonic mean of precision and recall)

Overall Performance:
- **Accuracy**: 0.96 (96% of all predictions were correct)
- **Macro Average**:
  - Precision: 0.84
  - Recall: 0.74
  - F1-score: 0.78

### 📝 Understanding the Metrics

1. **Precision**: 
   - What it means: Out of all cases our model flags as theft, what percentage are actually theft?
   - Why it matters: High precision means fewer false accusations of theft
   - Our results: 71% precision for theft detection is good but can be improved

2. **Recall**: 
   - What it means: Out of all actual theft cases, what percentage did our model catch?
   - Why it matters: High recall means we're not missing many theft cases
   - Our results: 49% recall for theft suggests we're missing about half of actual theft cases

3. **F1-score**: 
   - What it means: Balanced measure between precision and recall
   - Why it matters: Good for imbalanced datasets like ours
   - Our results: 0.58 for theft detection indicates room for improvement

4. **Accuracy**: 
   - What it means: Overall correct predictions (both normal and theft)
   - Why it matters: General model performance indicator
   - Our results: 96% accuracy, but this is influenced by class imbalance

### ⚠️ Current Limitations
1. Class Imbalance: Only 5% of data represents theft cases
2. Moderate Theft Detection Rate: Currently catching 49% of theft cases
3. False Positives: Small but present risk of wrongly flagging normal usage as theft

### 🚀 Future Improvements
1. Data Enhancement:
   - Collect more theft cases
   - Apply SMOTE for balanced training
2. Model Optimization:
   - Experiment with XGBoost, LightGBM
   - Fine-tune class weights
   - Enhanced feature engineering

---

## 📅 Current Status
| Task | Status |
|------|---------|
| Data Preprocessing | ✅ Completed |
| Data Visualization | ✅ Completed |
| Model Building | ✅ Completed |
| Model Evaluation | ✅ Completed |
| Future Improvements | 🔜 In Progress |

---

### 👨‍💻 Author
Developed by **Yaseen Naik**  
*Energy-focused ML Research Project*
