# 🧠 ChurnGuard AI

## AI-Powered Customer Churn Prediction & Retention Analytics Platform

ChurnGuard AI is a full-stack customer churn prediction and retention analytics platform that combines **Machine Learning, FastAPI, PostgreSQL, JavaScript, and interactive data visualization** to analyze customer behavior and identify customers who may be at risk of churn.

The platform processes a **100K+ customer dataset** and provides an interactive analytics dashboard for exploring churn patterns, customer segments, high-risk customers, geographic trends, payment behavior, customer metrics, and machine-learning-based churn predictions.

---

## 🚀 Live Demo

ChurnGuard AI is deployed on **Render**.

👉 **Live Application:**

https://churnguard-ai-qvl3.onrender.com/

---

# 📌 Problem Statement

Customer churn is a major challenge for businesses because losing existing customers can negatively affect revenue, customer lifetime value, and long-term growth.

Analyzing large customer datasets manually makes it difficult to:

- Identify customers at risk of churn
- Analyze large volumes of customer records
- Detect churn patterns
- Identify high-risk customer groups
- Understand customer behavior
- Compare churn across geographic and behavioral segments
- Convert raw customer data into actionable analytics

### Objective

The objective of ChurnGuard AI is to provide a centralized platform that combines:

**Customer Data → PostgreSQL → Analytics APIs → Machine Learning → Interactive Dashboard**

The system allows users to:

1. Analyze customer data
2. Explore churn patterns
3. Identify high-risk customers
4. Generate churn predictions
5. Explore customer segments
6. Analyze payment behavior
7. Analyze geographic trends
8. Explore customer-level metrics
9. Access the platform through a cloud deployment

---

# ✨ Key Features

## 🤖 1. Machine Learning Churn Prediction

ChurnGuard AI includes a trained **Random Forest Classifier** for customer churn prediction.

The model uses customer attributes including:

- Age
- Tenure
- Monthly charges
- Total charges
- Support tickets

The model produces a churn prediction that can be used to classify customers according to their estimated churn risk.

### Risk Classification

| Churn Probability | Risk Level |
|---|---|
| `< 40%` | 🟢 Low |
| `40% – 69%` | 🟡 Medium |
| `≥ 70%` | 🔴 High |

The trained model is serialized using `joblib` and loaded by the FastAPI backend for inference.

---

# 📊 2. Interactive Analytics Dashboard

ChurnGuard AI provides a web-based analytics dashboard for exploring customer and churn data.

The dashboard includes analytics such as:

- Total customer population
- Churn statistics
- High-risk customers
- Customer segmentation
- Geographic analysis
- Payment behavior
- Customer metrics
- Churn trends
- Customer-level analysis

The dashboard is designed to convert large customer datasets into easily interpretable business insights.

---

# 👥 3. Customer Analytics

The platform provides customer-level analytics backed by PostgreSQL.

Users can explore customer information and analyze characteristics associated with churn.

Customer information can include:

- Customer ID
- Customer name
- Age
- Gender
- Geography
- Tenure
- Monthly charges
- Total charges
- Contract information
- Payment method
- Support tickets
- Login information
- Churn status

Customer data is retrieved through backend REST APIs and rendered dynamically by the frontend.

---

# ⚠️ 4. High-Risk Customer Identification

ChurnGuard AI provides dedicated high-risk customer analysis.

This allows users to identify customers who require greater attention based on their churn-related information.

Potential business applications include:

- Customer retention campaigns
- Targeted customer support
- Personalized offers
- Customer engagement
- Retention prioritization

---

# 💳 5. Payment Behavior Analysis

The dashboard analyzes customer payment behavior and visualizes the distribution of customers across payment methods.

This allows users to explore relationships between:

**Payment Method → Customer Behavior → Churn**

Payment-related analytics are retrieved from the PostgreSQL-backed API layer.

---

# 🌍 6. Geographic Analysis

Customer geographic information is analyzed and visualized through the dashboard.

Users can explore customer distribution and churn-related patterns across geographic categories.

This provides another dimension for identifying customer groups that may require further analysis.

---

# 🧩 7. Customer Segmentation

ChurnGuard AI supports customer segmentation based on available customer attributes and churn-related characteristics.

Segmentation allows a large customer population to be divided into meaningful groups for easier analysis.

This can help with:

- Customer profiling
- Risk analysis
- Retention strategies
- Behavioral analysis

---

# 📈 8. Churn Trend & Tenure Analysis

The platform analyzes churn patterns across customer lifecycle and tenure.

Tenure-based analysis helps visualize how customer churn behavior changes throughout the customer lifecycle.

This provides additional context for identifying potentially vulnerable customer groups.

---

# 🗃️ 9. PostgreSQL Database

ChurnGuard AI uses **PostgreSQL** as its primary relational database.

The database stores customer information, customer metrics, and machine-learning prediction data.

### Major Tables

```text
customers
customer_metrics
churn_predictions
