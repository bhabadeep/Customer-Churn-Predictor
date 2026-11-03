# ⚡ PulseChurn: Customer Retention Intelligence

An end-to-end machine learning solution for predicting telecommunications customer churn. This project spans the entire ML lifecycle—from exploratory data analysis and threshold-optimized model training to full-stack deployment using **FastAPI** and a custom **Swiss Design** (International Typographic Style) web interface.

## 🚀 Key Features

* **Cost-Sensitive ML Pipeline:** Utilizes a tuned Scikit-Learn Random Forest classifier optimized with a custom decision threshold (0.55) to balance retention marketing costs against customer lifetime value.
* **Real-Time Inference API:** A production-ready REST API built with FastAPI and validated via Pydantic.
* **Brutalist Swiss UI:** A high-contrast, hyper-legible frontend built with Tailwind CSS and Vanilla JS, featuring one-click persona testing and dynamic SVG probability gauges.
* **Automated Feature Engineering:** The backend automatically maps raw API JSON payloads into engineered features (e.g., historical spend averages, service bundling totals, tenure binning) on the fly.

## 🛠️ Tech Stack

* **Machine Learning:** Python, Scikit-Learn, Pandas, NumPy, Joblib
* **Backend:** FastAPI, Uvicorn, Pydantic
* **Frontend:** HTML5, Tailwind CSS, JavaScript (ES6), SVG

## 📁 Repository Structure

```text
├── models/
│   └── churn_prediction_pipeline.joblib  # Serialized Scikit-Learn model
├── static/
│   ├── index.html                        # Swiss-design frontend layout
│   └── script.js                         # UI logic & API integration
├── main.py                               # FastAPI application & endpoints
├── requirements.txt                      # Project dependencies
└── README.md                             # Project documentation
