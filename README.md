# 🧠 ChurnGuard AI

### AI-Powered Customer Churn Prediction & Retention Analytics Platform

ChurnGuard AI is a full-stack customer churn prediction and retention analytics platform that combines **Machine Learning, FastAPI, PostgreSQL, JavaScript, and AWS Elastic Beanstalk** to help analyze customer behavior and identify customers who may be at risk of churn.

The platform provides an interactive analytics dashboard where users can explore customer statistics, churn patterns, customer segments, geographic trends, contract/payment analysis, high-risk customers, and ML-based churn predictions.

---

## 🚀 Live Demo

ChurnGuard AI is deployed on **AWS Elastic Beanstalk**.

👉 **Live Application:**

http://churn-guard-prod.eba-btypecmh.ap-south-1.elasticbeanstalk.com

---

## 📌 Problem Statement

Customer churn is a major challenge for businesses because losing existing customers can negatively affect revenue and long-term growth.

Traditional customer analysis often relies on manually examining large amounts of customer data, making it difficult to:

- Identify customers who are likely to churn
- Analyze large customer datasets efficiently
- Understand churn patterns
- Identify high-risk customers
- Compare churn across different customer segments
- Analyze the relationship between customer characteristics and churn
- Convert raw customer data into actionable insights

### Objective

The objective of ChurnGuard AI is to provide a centralized platform that combines **customer data analytics with machine learning-based churn prediction**.

The system allows users to:

1. Analyze customer data
2. Explore churn patterns
3. Identify high-risk customers
4. Generate churn predictions
5. View customer segmentation
6. Analyze contract and payment patterns
7. Analyze geographic trends
8. Access the platform through a deployed cloud application

---

# ✨ Key Features

## 🤖 1. Machine Learning Churn Prediction

ChurnGuard AI includes a trained machine learning model that predicts whether a customer is likely to churn.

The prediction system accepts customer-related input values and returns:

- Churn prediction
- Churn probability
- Risk classification

The system uses probability thresholds to categorize customers into:

| Probability | Risk Level |
|---|---|
| `< 40%` | 🟢 Low |
| `40% – 69%` | 🟡 Medium |
| `≥ 70%` | 🔴 High |

The prediction model is loaded using `joblib` and performs inference through the FastAPI backend.

---

## 📊 2. Customer Analytics Dashboard

The platform provides an interactive dashboard for exploring customer data.

The dashboard can display information such as:

- Total customers
- Churn statistics
- Customer metrics
- Customer segments
- High-risk customers
- Revenue-related analytics
- Geographic distribution
- Contract analysis
- Payment analysis
- Churn patterns

---

## 👥 3. Customer Analysis

The application provides access to customer-level information stored in PostgreSQL.

Users can analyze customer records and identify patterns associated with churn.

The backend provides customer data through REST API endpoints which are consumed by the frontend.

---

## ⚠️ 4. High-Risk Customer Identification

ChurnGuard AI provides a dedicated high-risk customer analysis section.

This helps users identify customers who require greater attention based on their churn-related information.

High-risk customers can be used as a starting point for:

- Retention campaigns
- Customer support follow-ups
- Targeted offers
- Customer engagement strategies

---

## 📈 5. Contract Analysis

The application provides analytics related to customer contract information.

Contract-level patterns can help identify differences in churn behavior across customer groups.

---

## 💳 6. Payment Analysis

The platform analyzes customer payment-related information and presents the results through the dashboard.

This makes it easier to identify relationships between payment methods and customer churn.

---

## 🌍 7. Geographic Analysis

Customer geographic information is analyzed and visualized through the application.

This allows users to explore churn distribution across different geographic categories.

---

## 🧩 8. Customer Segmentation

Customers can be analyzed through different segments based on available customer attributes and churn-related characteristics.

Segmentation helps transform a large customer dataset into more understandable groups.

---

## 🗃️ 9. PostgreSQL Database

ChurnGuard AI uses **PostgreSQL** as its primary database.

The database contains customer information, customer metrics, and churn prediction-related data.

The major tables used by the application include:

```text
customers
customer_metrics
churn_predictions
