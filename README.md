# ChurnGuard AI

ChurnGuard AI is an AI-powered customer churn prediction and retention analytics platform designed to identify customers at risk of leaving and support data-driven retention decisions.

## Features

- Customer churn prediction
- Machine learning-based churn risk assessment
- Customer-level churn analysis
- Churn prediction results and metrics
- Customer analytics datasets
- REST API for prediction workflows
- Web-based dashboard interface
- PostgreSQL database integration
- AWS Elastic Beanstalk deployment configuration

## Technology Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Python
- FastAPI
- REST APIs

### Machine Learning
- Scikit-learn
- Python-based churn prediction model

### Database
- PostgreSQL
- SQLAlchemy

### Deployment
- AWS Elastic Beanstalk

## Datasets

The repository includes three datasets used for customer churn analysis and prediction workflows:

- `churn_customers.csv` — Customer churn dataset
- `customer_metrics.csv` — Customer-level metrics
- `churn_predictions.csv` — Churn prediction results

These datasets support customer analysis, churn-risk assessment, and prediction workflows.

## Machine Learning Model

ChurnGuard AI uses a trained machine learning model to predict customer churn risk.

The trained model is used locally by the application during prediction. The generated `.pkl` model file is intentionally excluded from GitHub because of its large file size.

## Project Structure

```text
ChurnGuard-AI/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── Procfile
│
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── style.css
│
├── train_model.py
├── churn_customers.csv
├── customer_metrics.csv
├── churn_predictions.csv
├── screenshots/
├── .gitignore
├── .ebignore
└── Procfile
