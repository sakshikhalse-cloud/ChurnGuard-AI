from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from pathlib import Path
import os
import joblib
import numpy as np
import pandas as pd

# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"
BACKEND_DIR = Path(__file__).resolve().parent

load_dotenv(BACKEND_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured.")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

MODEL_PATH = BASE_DIR / "models" / "churn_model.pkl"

if not MODEL_PATH.exists():
    raise RuntimeError(f"ML model not found: {MODEL_PATH}")

model = joblib.load(MODEL_PATH)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="RetentionAI API",
    description="Customer Churn & Retention Analytics Platform",
    version="2.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# HELPER
# ============================================================

def rows_to_dicts(result):
    columns = result.keys()

    return [
        dict(zip(columns, row))
        for row in result.fetchall()
    ]


# ============================================================
# ROOT + HEALTH
# ============================================================

app.mount(
    "/static",
    StaticFiles(directory=FRONTEND_DIR),
    name="static"
)


@app.get("/")
def root():
    return FileResponse(
        FRONTEND_DIR / "index.html"
    )


@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e)
            }
        )


# ============================================================
# DASHBOARD STATS
# ============================================================
@app.get("/stats")
def get_stats():
    try:
        with engine.connect() as connection:

            result = connection.execute(
                text("""
                    SELECT
                        COUNT(*) AS total_customers,

                        COUNT(*) FILTER (
                            WHERE churn_status = TRUE
                        ) AS total_churn,

                        COUNT(*) FILTER (
                            WHERE churn_status = TRUE
                        ) AS high_risk_customers,

                        COALESCE(
                            COUNT(*),
                            0
                        ) AS total_predictions,

                        COALESCE(
                            SUM(monthly_charges),
                            0
                        ) AS monthly_revenue,

                        COALESCE(
                            SUM(monthly_charges)
                            FILTER (
                                WHERE churn_status = TRUE
                            ),
                            0
                        ) AS revenue_at_risk

                    FROM customers
                """)
            ).mappings().one()

        total_customers = int(
            result["total_customers"] or 0
        )

        total_churn = int(
            result["total_churn"] or 0
        )

        churn_rate = (
            round(
                (
                    total_churn /
                    total_customers
                ) * 100,
                2
            )
            if total_customers > 0
            else 0
        )

        return {
            "total_customers": total_customers,

            "total_churn": total_churn,

            "churn_rate": float(
                churn_rate
            ),

            "total_predictions": int(
                result["total_predictions"] or 0
            ),

            "total_revenue": float(
                result["monthly_revenue"] or 0
            ),

            "monthly_revenue": float(
                result["monthly_revenue"] or 0
            ),

            "high_risk_customers": int(
                result["high_risk_customers"] or 0
            ),

            "revenue_at_risk": float(
                result["revenue_at_risk"] or 0
            )
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.get("/customers")
def get_customers(limit: int = 1000):
    try:
        with engine.connect() as connection:

            result = connection.execute(
                text("""
                    SELECT
                        customer_id,
                        customer_name,
                        geography,

                        tenure_months AS tenure,

                        contract_type,
                        payment_method,

                        monthly_charges,
                        total_charges,

                        support_tickets,

                        churn_status,

                        CASE
                            WHEN churn_status = TRUE
                            THEN 100
                            ELSE 0
                        END AS churn_probability

                    FROM customers

                    ORDER BY customer_id

                    LIMIT :limit
                """),
                {
                    "limit": limit
                }
            )

            customers = [
                dict(row)
                for row in result.mappings().all()
            ]

            return customers

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
# ============================================================
# CONTRACT ANALYTICS
# ============================================================

@app.get("/analytics/contract")
def contract_analytics():
    try:
        with engine.connect() as connection:

            result = connection.execute(
                text("""
                    SELECT
                        COALESCE(
                            contract_type,
                            'Unknown'
                        ) AS contract_type,

                        COUNT(*) AS total_customers,

                        SUM(
                            CASE
                                WHEN churn_status = TRUE
                                THEN 1
                                ELSE 0
                            END
                        ) AS churned_customers,

                        ROUND(
                            (
                                SUM(
                                    CASE
                                        WHEN churn_status = TRUE
                                        THEN 1
                                        ELSE 0
                                    END
                                ) * 100.0
                                / NULLIF(COUNT(*), 0)
                            )::numeric,
                            2
                        ) AS churn_rate

                    FROM customers

                    GROUP BY contract_type

                    ORDER BY churn_rate DESC NULLS LAST
                """)
            )

            return rows_to_dicts(result)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# PAYMENT ANALYTICS
# ============================================================

@app.get("/analytics/payment")
def payment_analytics():
    try:
        with engine.connect() as connection:

            result = connection.execute(
                text("""
                    SELECT
                        COALESCE(
                            payment_method,
                            'Unknown'
                        ) AS payment_method,

                        COUNT(*) AS total_customers,

                        SUM(
                            CASE
                                WHEN churn_status = TRUE
                                THEN 1
                                ELSE 0
                            END
                        ) AS churned_customers,

                        ROUND(
                            (
                                SUM(
                                    CASE
                                        WHEN churn_status = TRUE
                                        THEN 1
                                        ELSE 0
                                    END
                                ) * 100.0
                                / NULLIF(COUNT(*), 0)
                            )::numeric,
                            2
                        ) AS churn_rate

                    FROM customers

                    GROUP BY payment_method

                    ORDER BY churn_rate DESC NULLS LAST
                """)
            )

            return rows_to_dicts(result)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# GEOGRAPHY ANALYTICS
# ============================================================

@app.get("/analytics/geography")
@app.get("/geography")
def geography_analytics():
    try:
        with engine.connect() as connection:

            result = connection.execute(
                text("""
                    SELECT
                        COALESCE(
                            geography,
                            'Unknown'
                        ) AS region,

                        COUNT(*) AS customers,

                        SUM(
                            CASE
                                WHEN churn_status = TRUE
                                THEN 1
                                ELSE 0
                            END
                        ) AS churned_customers,

                        ROUND(
                            (
                                SUM(
                                    CASE
                                        WHEN churn_status = TRUE
                                        THEN 1
                                        ELSE 0
                                    END
                                ) * 100.0
                                / NULLIF(COUNT(*), 0)
                            )::numeric,
                            2
                        ) AS churn_rate,

                        COALESCE(
                            SUM(monthly_charges),
                            0
                        ) AS revenue

                    FROM customers

                    GROUP BY geography

                    ORDER BY customers DESC
                """)
            )

            return {
                "regions": rows_to_dicts(result)
            }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# HIGH RISK CUSTOMERS
# ============================================================

@app.get("/analytics/high-risk")
def high_risk_customers():
    try:
        with engine.connect() as connection:

            result = connection.execute(
                text("""
                    SELECT
                        customer_id,
                        customer_name,
                        geography,
                        contract_type,
                        monthly_charges,
                        support_tickets,
                        churn_status

                    FROM customers

                    WHERE churn_status = TRUE

                    ORDER BY
                        monthly_charges DESC,
                        support_tickets DESC

                    LIMIT 10
                """)
            )

            return rows_to_dicts(result)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# CUSTOMER EXPLORER
# ============================================================

@app.get("/customers")
@app.get("/customers/sample")
def get_customers():
    try:
        with engine.connect() as connection:

            result = connection.execute(
                text("""
                    SELECT
                        customer_id,
                        customer_name,
                        geography,
                        contract_type,
                        monthly_charges,
                        support_tickets,
                        churn_status

                    FROM customers

                    ORDER BY customer_id

                    LIMIT 100
                """)
            )

            return rows_to_dicts(result)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# CUSTOMER SEGMENTS
# ============================================================

@app.get("/segments")
def get_segments():
    """
    Dynamically segments customers using
    churn status, monthly charges and tenure.
    """

    try:
        with engine.connect() as connection:

            result = connection.execute(
                text("""
                    SELECT
                        CASE

                            WHEN churn_status = TRUE
                                 AND monthly_charges >= (
                                     SELECT
                                         AVG(monthly_charges)
                                     FROM customers
                                 )
                            THEN 'At Risk Premium'

                            WHEN churn_status = TRUE
                            THEN 'At Risk'

                            WHEN COALESCE(tenure_months, 0) <= 6
                            THEN 'New Customers'

                            WHEN monthly_charges >= (
                                SELECT
                                    AVG(monthly_charges)
                                FROM customers
                            )
                            AND COALESCE(tenure_months, 0) >= 24
                            THEN 'High Value Loyalists'

                            WHEN COALESCE(tenure_months, 0) >= 12
                            THEN 'Growth Potential'

                            ELSE 'Price Sensitive'

                        END AS name,

                        COUNT(*) AS customers,

                        ROUND(
                            (
                                SUM(
                                    CASE
                                        WHEN churn_status = TRUE
                                        THEN 1
                                        ELSE 0
                                    END
                                ) * 100.0
                                / NULLIF(COUNT(*), 0)
                            )::numeric,
                            2
                        ) AS churn_rate,

                        COALESCE(
                            SUM(monthly_charges),
                            0
                        ) AS revenue

                    FROM customers

                    GROUP BY name

                    ORDER BY customers DESC
                """)
            )

            segments = rows_to_dicts(result)

            for segment in segments:

                churn_rate = float(
                    segment["churn_rate"] or 0
                )

                if churn_rate >= 50:
                    priority = "CRITICAL"

                elif churn_rate >= 30:
                    priority = "HIGH RISK"

                elif churn_rate >= 15:
                    priority = "MODERATE"

                elif churn_rate >= 5:
                    priority = "WATCH"

                else:
                    priority = "LOW RISK"

                segment["priority"] = priority
                segment["customers"] = int(
                    segment["customers"]
                )
                segment["churn_rate"] = churn_rate
                segment["revenue"] = float(
                    segment["revenue"] or 0
                )

            return {
                "segments": segments
            }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# CHURN PREDICTION
# ============================================================

@app.post("/predict")
def predict_churn(data: dict):

    try:
        age = float(data.get("age", 0))
        tenure_months = float(data.get("tenure_months", 0))
        monthly_charges = float(data.get("monthly_charges", 0))
        total_charges = float(data.get("total_charges", 0))
        support_tickets = float(data.get("support_tickets", 0))

        if age < 0:
            raise HTTPException(
                status_code=400,
                detail="Age cannot be negative."
            )

        if tenure_months < 0:
            raise HTTPException(
                status_code=400,
                detail="Tenure months cannot be negative."
            )

        if monthly_charges < 0:
            raise HTTPException(
                status_code=400,
                detail="Monthly charges cannot be negative."
            )

        if total_charges < 0:
            raise HTTPException(
                status_code=400,
                detail="Total charges cannot be negative."
            )

        if support_tickets < 0:
            raise HTTPException(
                status_code=400,
                detail="Support tickets cannot be negative."
            )

        features = np.array([[
            age,
            tenure_months,
            monthly_charges,
            total_charges,
            support_tickets
        ]])

        prediction = int(
            model.predict(features)[0]
        )

        probability = float(
            model.predict_proba(features)[0][1]
        )

        risk_level = (
            "High"
            if probability >= 0.70
            else "Medium"
            if probability >= 0.40
            else "Low"
        )

        return {
            "churn_prediction": prediction,
            "churn_probability": round(
                probability * 100,
                2
            ),
            "risk_level": risk_level
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
