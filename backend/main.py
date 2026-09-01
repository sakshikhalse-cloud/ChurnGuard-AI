from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from pathlib import Path
import os
import joblib
import numpy as np

# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
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

@app.get("/")
def root():
    return FileResponse(
        BASE_DIR / "frontend" / "index.html"
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
        monthly_charges = float(
            data.get("monthly_charges", 0)
        )

        support_tickets = float(
            data.get("support_tickets", 0)
        )

        if monthly_charges < 0:
            raise HTTPException(
                status_code=400,
                detail="Monthly charges cannot be negative."
            )

        if support_tickets < 0:
            raise HTTPException(
                status_code=400,
                detail="Support tickets cannot be negative."
            )

        features = np.array([
            [
                monthly_charges,
                support_tickets
            ]
        ])

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
# ============================================================
# RETENTIONAI — REAL ANALYTICS API
# PostgreSQL-powered analytics for ChurnGuard frontend
# ============================================================


def rows_to_dicts(result):
    """
    Convert SQLAlchemy query results into JSON-safe dictionaries.
    """
    columns = result.keys()

    return [
        {
            key: (
                float(value)
                if isinstance(value, (float,))
                else value
            )
            for key, value in zip(columns, row)
        }
        for row in result.fetchall()
    ]


@app.get("/analytics/summary")
def analytics_summary():

    try:

        with engine.connect() as connection:

            result = connection.execute(
                text("""
                    SELECT
                        COUNT(*) AS total_customers,

                        COUNT(*) FILTER (
                            WHERE churn_status = TRUE
                        ) AS churned_customers,

                        ROUND(
                            (
                                COUNT(*) FILTER (
                                    WHERE churn_status = TRUE
                                ) * 100.0
                                /
                                NULLIF(COUNT(*), 0)
                            )::numeric,
                            2
                        ) AS churn_rate,

                        ROUND(
                            COALESCE(
                                SUM(
                                    monthly_charges
                                ) FILTER (
                                    WHERE churn_status = TRUE
                                ),
                                0
                            )::numeric,
                            2
                        ) AS revenue_at_risk,

                        ROUND(
                            COALESCE(
                                AVG(monthly_charges),
                                0
                            )::numeric,
                            2
                        ) AS average_monthly_charge

                    FROM customers
                """)
            )

            row = result.mappings().one()

            return {
                key: (
                    float(value)
                    if value is not None
                    else 0
                )
                for key, value in row.items()
            }

    except Exception as e:

        return {
            "error": str(e)
        }


# ============================================================
# HEATMAP
# Tenure group × Contract type
# ============================================================

@app.get("/analytics/heatmap")
def analytics_heatmap():

    try:

        with engine.connect() as connection:

            result = connection.execute(
                text("""
                    SELECT

                        CASE

                            WHEN tenure <= 12
                                THEN '0–12 Months'

                            WHEN tenure <= 24
                                THEN '13–24 Months'

                            WHEN tenure <= 48
                                THEN '25–48 Months'

                            ELSE '49–72 Months'

                        END AS tenure_group,


                        COALESCE(
                            contract_type,
                            'Unknown'
                        ) AS contract_type,


                        COUNT(*) AS total_customers,


                        COUNT(*) FILTER (
                            WHERE churn_status = TRUE
                        ) AS churned_customers,


                        ROUND(
                            (
                                COUNT(*) FILTER (
                                    WHERE churn_status = TRUE
                                ) * 100.0
                                /
                                NULLIF(COUNT(*), 0)
                            )::numeric,
                            2
                        ) AS churn_rate

                    FROM customers

                    GROUP BY
                        tenure_group,
                        contract_type

                    ORDER BY
                        tenure_group,
                        contract_type
                """)
            )

            return rows_to_dicts(result)

    except Exception as e:

        return {
            "error": str(e)
        }


# ============================================================
# REVENUE VS CHURN
# REAL CUSTOMER-LEVEL DATA
# ============================================================

@app.get("/analytics/revenue-churn")
def analytics_revenue_churn():

    try:

        with engine.connect() as connection:

            result = connection.execute(
                text("""
                    SELECT
                        customer_id,
                        customer_name,
                        monthly_charges,
                        tenure,
                        geography,
                        contract_type,
                        support_tickets,

                        CASE
                            WHEN churn_status = TRUE
                                THEN 100
                            ELSE 0
                        END AS churn_risk,

                        churn_status

                    FROM customers

                    ORDER BY
                        monthly_charges DESC

                    LIMIT 500
                """)
            )

            return rows_to_dicts(result)

    except Exception as e:

        return {
            "error": str(e)
        }


# ============================================================
# RISK / CUSTOMER SEGMENTS
# REAL POSTGRESQL AGGREGATION
# ============================================================

@app.get("/analytics/risk-segments")
def analytics_risk_segments():

    try:

        with engine.connect() as connection:

            result = connection.execute(
                text("""
                    SELECT

                        CASE

                            WHEN churn_status = FALSE
                                THEN 'Stable'

                            WHEN monthly_charges < (
                                SELECT
                                    AVG(monthly_charges)
                                FROM customers
                            )
                                THEN 'Watchlist'

                            ELSE 'Critical'

                        END AS segment,

                        COUNT(*) AS customer_count,

                        ROUND(
                            (
                                COUNT(*) * 100.0
                                /
                                NULLIF(
                                    (
                                        SELECT COUNT(*)
                                        FROM customers
                                    ),
                                    0
                                )
                            )::numeric,
                            2
                        ) AS percentage

                    FROM customers

                    GROUP BY segment

                    ORDER BY

                        CASE segment

                            WHEN 'Stable' THEN 1
                            WHEN 'Watchlist' THEN 2
                            WHEN 'Critical' THEN 3

                        END
                """)
            )

            return rows_to_dicts(result)

    except Exception as e:

        return {
            "error": str(e)
        }


# ============================================================
# CHURN DRIVERS
# REAL DATABASE CALCULATIONS
# ============================================================

@app.get("/analytics/drivers")
def analytics_drivers():

    try:

        with engine.connect() as connection:

            contract_result = connection.execute(
                text("""
                    SELECT
                        'Month-to-month contracts'
                            AS driver,

                        COALESCE(
                            MAX(
                                ROUND(
                                    (
                                        COUNT(*) FILTER (
                                            WHERE churn_status = TRUE
                                        ) * 100.0
                                        /
                                        NULLIF(COUNT(*), 0)
                                    )::numeric,
                                    2
                                )
                            ),
                            0
                        ) AS score

                    FROM customers

                    WHERE contract_type = 'Month-to-month'
                """)
            ).mappings().one()


            payment_result = connection.execute(
                text("""
                    SELECT
                        'Electronic check usage'
                            AS driver,

                        COALESCE(
                            MAX(
                                ROUND(
                                    (
                                        COUNT(*) FILTER (
                                            WHERE churn_status = TRUE
                                        ) * 100.0
                                        /
                                        NULLIF(COUNT(*), 0)
                                    )::numeric,
                                    2
                                )
                            ),
                            0
                        ) AS score

                    FROM customers

                    WHERE payment_method = 'Electronic check'
                """)
            ).mappings().one()


            tenure_result = connection.execute(
                text("""
                    SELECT
                        'Low tenure customers'
                            AS driver,

                        COALESCE(
                            ROUND(
                                (
                                    COUNT(*) FILTER (
                                        WHERE churn_status = TRUE
                                    ) * 100.0
                                    /
                                    NULLIF(COUNT(*), 0)
                                )::numeric,
                                2
                            ),
                            0
                        ) AS score

                    FROM customers

                    WHERE tenure <= 12
                """)
            ).mappings().one()


            charge_result = connection.execute(
                text("""
                    SELECT
                        'High monthly charges'
                            AS driver,

                        COALESCE(
                            ROUND(
                                (
                                    COUNT(*) FILTER (
                                        WHERE churn_status = TRUE
                                    ) * 100.0
                                    /
                                    NULLIF(COUNT(*), 0)
                                )::numeric,
                                2
                            ),
                            0
                        ) AS score

                    FROM customers

                    WHERE monthly_charges > (
                        SELECT AVG(monthly_charges)
                        FROM customers
                    )
                """)
            ).mappings().one()


            drivers = [

                {
                    "driver":
                        contract_result["driver"],

                    "score":
                        float(
                            contract_result["score"] or 0
                        ),

                    "icon":
                        "fa-file-contract",

                    "message":
                        "Actual churn rate among month-to-month contract customers."
                },

                {
                    "driver":
                        payment_result["driver"],

                    "score":
                        float(
                            payment_result["score"] or 0
                        ),

                    "icon":
                        "fa-credit-card",

                    "message":
                        "Actual churn rate among electronic check customers."
                },

                {
                    "driver":
                        tenure_result["driver"],

                    "score":
                        float(
                            tenure_result["score"] or 0
                        ),

                    "icon":
                        "fa-hourglass-start",

                    "message":
                        "Actual churn rate among customers with 12 months or less tenure."
                },

                {
                    "driver":
                        charge_result["driver"],

                    "score":
                        float(
                            charge_result["score"] or 0
                        ),

                    "icon":
                        "fa-indian-rupee-sign",

                    "message":
                        "Actual churn rate among customers above the average monthly charge."
                }

            ]


            return sorted(
                drivers,
                key=lambda item:
                    item["score"],
                reverse=True
            )

    except Exception as e:

        return {
            "error": str(e)
        }


# ============================================================
# GEOGRAPHY ANALYTICS
# REAL STATE / LOCATION CHURN DATA
# ============================================================

@app.get("/analytics/geography-real")
def analytics_geography_real():

    try:

        with engine.connect() as connection:

            result = connection.execute(
                text("""
                    SELECT
                        COALESCE(
                            geography,
                            'Unknown'
                        ) AS geography,

                        COUNT(*) AS total_customers,

                        COUNT(*) FILTER (
                            WHERE churn_status = TRUE
                        ) AS churned_customers,

                        ROUND(
                            (
                                COUNT(*) FILTER (
                                    WHERE churn_status = TRUE
                                ) * 100.0
                                /
                                NULLIF(COUNT(*), 0)
                            )::numeric,
                            2
                        ) AS churn_rate,

                        ROUND(
                            COALESCE(
                                SUM(monthly_charges) FILTER (
                                    WHERE churn_status = TRUE
                                ),
                                0
                            )::numeric,
                            2
                        ) AS revenue_at_risk

                    FROM customers

                    GROUP BY geography

                    ORDER BY
                        churn_rate DESC,
                        total_customers DESC
                """)
            )

            return rows_to_dicts(result)

    except Exception as e:

        return {
            "error": str(e)
        }


# ============================================================
# HIGH-RISK CUSTOMERS
# REAL DATABASE DATA
# ============================================================

@app.get("/analytics/high-risk-real")
def analytics_high_risk_real():

    try:

        with engine.connect() as connection:

            result = connection.execute(
                text("""
                    SELECT
                        customer_id,
                        customer_name,
                        geography,
                        contract_type,
                        payment_method,
                        monthly_charges,
                        tenure,
                        support_tickets,
                        churn_status

                    FROM customers

                    WHERE churn_status = TRUE

                    ORDER BY
                        monthly_charges DESC,
                        support_tickets DESC

                    LIMIT 100
                """)
            )

            return rows_to_dicts(result)

    except Exception as e:

        return {
            "error": str(e)
        }
# ============================================================
# FRONTEND STATIC ASSETS
# ============================================================

@app.get("/style.css")
def serve_stylesheet():
    return FileResponse(
        BASE_DIR / "frontend" / "style.css",
        media_type="text/css"
    )


@app.get("/script.js")
def serve_javascript():
    return FileResponse(
        BASE_DIR / "frontend" / "script.js",
        media_type="application/javascript"
    )
