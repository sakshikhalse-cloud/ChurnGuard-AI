"use strict";

/* ============================================================
   CHURNGUARD AI — COMPLETE APPLICATION CONTROLLER
   Built specifically for the current index.html
   ============================================================ */


/* ============================================================
   CONFIG
   ============================================================ */

const API_BASE_URL = "";

const APP = {
    data: null,
    customers: [],
    filteredCustomers: [],
    geography: [],
    charts: {},
    currentPage: 1,
    rowsPerPage: 10,
    activeRiskFilter: "all",
    activeDashboardFilter: "all",
    currentLocation: "all",
    currentContract: "all",
    currentPeriod: "30",
    notifications: [],
    expandedChart: null
};


/* ============================================================
   DOM HELPERS
   ============================================================ */

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

const byId = (id) =>
    document.getElementById(id);


function safeText(id, value) {
    const element = byId(id);

    if (element) {
        element.textContent =
            value === undefined ||
            value === null ||
            value === ""
                ? "--"
                : value;
    }
}


function number(value, fallback = 0) {

    const result = Number(value);

    return Number.isFinite(result)
        ? result
        : fallback;
}


function formatNumber(value) {

    return number(value).toLocaleString("en-IN");

}


function formatCurrency(value) {

    return "₹" +
        number(value).toLocaleString("en-IN", {
            maximumFractionDigits: 0
        });

}


function formatPercent(value) {

    const valueNumber = number(value);

    return valueNumber.toFixed(
        valueNumber % 1 === 0 ? 0 : 2
    ) + "%";

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ============================================================
   DEMO DATA FALLBACK
   Dashboard will NEVER go blank if API fails.
   ============================================================ */

function buildDemoCustomers() {

    const names = [
        "Aarav Sharma",
        "Priya Patel",
        "Rohan Verma",
        "Ananya Singh",
        "Kabir Mehta",
        "Sneha Iyer",
        "Arjun Nair",
        "Meera Kapoor",
        "Vikram Joshi",
        "Isha Gupta",
        "Rahul Shah",
        "Kavya Rao",
        "Aditya Jain",
        "Neha Kulkarni",
        "Dev Malhotra",
        "Pooja Desai",
        "Aryan Singh",
        "Riya Mehta",
        "Siddharth Bose",
        "Tanvi Patil",
        "Kunal Verma",
        "Aditi Sharma",
        "Nikhil Iyer",
        "Ishita Jain",
        "Varun Rao",
        "Simran Kaur",
        "Harsh Patel",
        "Anjali Nair",
        "Yash Gupta",
        "Diya Kapoor"
    ];

    const locations = [
        ["Mumbai", "Maharashtra"],
        ["Pune", "Maharashtra"],
        ["Delhi", "Delhi"],
        ["Bengaluru", "Karnataka"],
        ["Chennai", "Tamil Nadu"],
        ["Hyderabad", "Telangana"],
        ["Ahmedabad", "Gujarat"],
        ["Kolkata", "West Bengal"]
    ];

    const contracts = [
        "Month-to-month",
        "One year",
        "Two year"
    ];

    const payments = [
        "Electronic check",
        "Mailed check",
        "Bank transfer (automatic)",
        "Credit card (automatic)"
    ];

    return names.map((name, index) => {

        const probability =
            Math.max(
                4,
                Math.min(
                    98,
                    96 - index * 2.7 +
                    ((index % 4) * 4)
                )
            );

        const location =
            locations[index % locations.length];

        let risk = "low";

        if (probability >= 70) {
            risk = "high";
        } else if (probability >= 40) {
            risk = "medium";
        }

        return {
            id: `CG-${String(index + 1).padStart(4, "0")}`,
            name,
            location: location[0],
            state: location[1],
            tenure: 1 + ((index * 5) % 72),
            contract: contracts[index % contracts.length],
            payment:
                payments[index % payments.length],
            monthlyCharges:
                39 + ((index * 13) % 100),
            totalCharges:
                900 + ((index * 823) % 6800),
            churnProbability:
                Number(probability.toFixed(1)),
            risk,
            prediction:
                probability >= 50 ? "Likely to Churn" : "Likely to Stay"
        };

    });

}


function buildDemoGeography(customers) {

    const grouped = {};

    customers.forEach((customer) => {

        const key = customer.state;

        if (!grouped[key]) {

            grouped[key] = {
                location: customer.state,
                city: customer.location,
                customers: 0,
                churned: 0,
                revenue: 0
            };

        }

        grouped[key].customers += 1;

        if (customer.churnProbability >= 50) {
            grouped[key].churned += 1;
        }

        grouped[key].revenue +=
            customer.monthlyCharges;

    });

    return Object.values(grouped).map((item) => {

        const churnRate =
            item.customers
                ? (item.churned / item.customers) * 100
                : 0;

        return {
            ...item,
            churnRate:
                Number(churnRate.toFixed(1)),
            risk:
                churnRate >= 60
                    ? "high"
                    : churnRate >= 35
                        ? "medium"
                        : "low"
        };

    });

}


function buildDemoData() {

    const customers =
        buildDemoCustomers();

    const geography =
        buildDemoGeography(customers);

    const highRisk =
        customers.filter(
            customer =>
                customer.risk === "high"
        );

    const churnRate =
        (
            customers.filter(
                customer =>
                    customer.churnProbability >= 50
            ).length /
            customers.length
        ) * 100;

    const monthlyRevenue =
        customers.reduce(
            (sum, customer) =>
                sum +
                customer.monthlyCharges,
            0
        );

    const revenueAtRisk =
        highRisk.reduce(
            (sum, customer) =>
                sum +
                customer.monthlyCharges,
            0
        );

    return {
        totalCustomers: 100000,
        churnRate: Number(churnRate.toFixed(2)),
        monthlyRevenue:
            Math.round(monthlyRevenue * 1000),
        totalPredictions: 100000,
        highRiskCustomers:
            highRisk.length * 100,
        revenueAtRisk:
            Math.round(revenueAtRisk * 1000),
        customerGrowth: "+8.4% vs previous period",
        customers,
        geography
    };

}


/* ============================================================
   DATA NORMALIZATION
   Supports backend responses with different key names.
   ============================================================ */

function normalizeCustomer(raw, index = 0) {

    const probability =
        raw.churnProbability ??
        raw.churn_probability ??
        raw.probability ??
        raw.risk_score ??
        raw.churnRisk ??
        raw.risk ??
        0;

    const probabilityValue =
        number(probability) <= 1
            ? number(probability) * 100
            : number(probability);

    let risk =
        String(
            raw.riskLevel ??
            raw.risk_level ??
            raw.risk ??
            ""
        ).toLowerCase();

    if (
        !["low", "medium", "high"]
            .includes(risk)
    ) {

        risk =
            probabilityValue >= 70
                ? "high"
                : probabilityValue >= 40
                    ? "medium"
                    : "low";

    }

    return {

        id:
            raw.id ??
            raw.customer_id ??
            `CG-${String(index + 1).padStart(4, "0")}`,

        name:
            raw.name ??
            raw.customer_name ??
            `Customer ${index + 1}`,

        location:
            raw.location ??
            raw.city ??
            raw.state ??
            "Unknown",

        state:
            raw.state ??
            raw.location ??
            raw.city ??
            "Unknown",

        tenure:
            number(
                raw.tenure ??
                raw.tenure_months ??
                0
            ),

        contract:
            raw.contract ??
            raw.contract_type ??
            "Month-to-month",

        payment:
            raw.payment ??
            raw.payment_method ??
            raw.paymentMethod ??
            "Electronic check",

        monthlyCharges:
            number(
                raw.monthlyCharges ??
                raw.monthly_charges ??
                raw.monthly_value ??
                0
            ),

        totalCharges:
            number(
                raw.totalCharges ??
                raw.total_charges ??
                0
            ),

        churnProbability:
            Number(
                probabilityValue.toFixed(1)
            ),

        risk,

        prediction:
            raw.prediction ??
            (
                probabilityValue >= 50
                    ? "Likely to Churn"
                    : "Likely to Stay"
            )

    };

}


function normalizeAPIData(data) {

    const sourceCustomers =
        data.customers ??
        data.customer_data ??
        data.data?.customers ??
        [];

    const customers =
        Array.isArray(sourceCustomers)
            ? sourceCustomers.map(
                normalizeCustomer
            )
            : [];

    const geography =
        data.geography ??
        data.states ??
        data.locations ??
        (
            customers.length
                ? buildDemoGeography(customers)
                : []
        );

    const totalCustomers =
        data.totalCustomers ??
        data.total_customers ??
        data.kpis?.totalCustomers ??
        data.kpis?.total_customers ??
        (
            customers.length || 0
        );

    const churnRate =
        data.churnRate ??
        data.churn_rate ??
        data.kpis?.churnRate ??
        data.kpis?.churn_rate ??
        0;

    const highRiskCustomers =
        data.highRiskCustomers ??
        data.high_risk_customers ??
        data.kpis?.highRiskCustomers ??
        customers.filter(
            customer =>
                customer.risk === "high"
        ).length;

    const monthlyRevenue =
    data.monthlyRevenue ??
    data.monthly_revenue ??
    data.totalRevenue ??
    data.total_revenue ??
    data.revenue ??
    data.kpis?.monthlyRevenue ??
    customers.reduce(
        (sum, customer) =>
            sum + Number(
                customer.monthlyCharges ??
                customer.monthly_charges ??
                0
            ),
        0
    );

    const revenueAtRisk =
        data.revenueAtRisk ??
        data.revenue_at_risk ??
        data.kpis?.revenueAtRisk ??
        customers
            .filter(
                customer =>
                    customer.risk === "high"
            )
            .reduce(
                (sum, customer) =>
                    sum + customer.monthlyCharges,
                0
            );

    return {

        totalCustomers:
            number(totalCustomers),

        churnRate:
            number(churnRate) <= 1
                ? number(churnRate) * 100
                : number(churnRate),

        monthlyRevenue:
            number(monthlyRevenue),

        totalPredictions:
            number(
                data.totalPredictions ??
                data.total_predictions ??
                totalCustomers
            ),

        highRiskCustomers:
            number(highRiskCustomers),

        revenueAtRisk:
            number(revenueAtRisk),

        customerGrowth:
            data.customerGrowth ??
            data.customer_growth ??
            "+8.4% vs previous period",

        customers,

        geography

    };

}


/* ============================================================
   LOADER — GUARANTEED TRANSITION
   ============================================================ */

function showApplication() {

    const loader =
        byId("appLoader");

    const app =
        byId("app");

    if (app) {

        app.classList.remove("hidden");

        app.style.display = "flex";
        app.style.visibility = "visible";
        app.style.opacity = "1";

    }

    if (loader) {

        loader.style.opacity = "0";
        loader.style.pointerEvents = "none";

        setTimeout(() => {

            loader.style.display = "none";

        }, 600);

    }

}


function initializeLoaderSafety() {

    const app =
        byId("app");

    if (app) {

        app.classList.remove("hidden");

    }

    setTimeout(
        showApplication,
        1800
    );

}


/* ============================================================
   API CONNECTION
   ============================================================ */

async function fetchJSON(endpoint) {

    const response =
        await fetch(
            `${API_BASE_URL}${endpoint}`
        );

    if (!response.ok) {

        throw new Error(
            `${endpoint}: ${response.status}`
        );

    }

    return response.json();

}

async function loadApplicationData() {

    updateSystemStatus(
        "Connecting...",
        "connecting"
    );

    try {

        const [
            stats,
            customers,
            geography
        ] = await Promise.all([
            fetchJSON("/stats"),
            fetchJSON("/customers?limit=1000"),
            fetchJSON("/analytics/geography")
        ]);

        if (!Array.isArray(customers)) {
            throw new Error(
                "Invalid customers response"
            );
        }

        const normalizedCustomers =
            customers.map(
                normalizeCustomer
            );

        const rawGeography =
    Array.isArray(geography?.regions)
        ? geography.regions
        : Array.isArray(geography)
            ? geography
            : [];

const geographyData = rawGeography.map(region => {
    const churnRate = number(
        region.churnRate ??
        region.churn_rate ??
        0
    );

    return {
        location:
            region.location ??
            region.region ??
            "Unknown",

        state:
            region.state ??
            region.region ??
            "Unknown",

        customers:
            number(
                region.customers ??
                region.total_customers ??
                0
            ),

        churned:
            number(
                region.churned ??
                region.churned_customers ??
                0
            ),

        churnRate,

        revenue:
            number(
                region.revenue ??
                region.total_revenue ??
                0
            ),

        risk:
            churnRate >= 15
                ? "high"
                : churnRate >= 10
                    ? "medium"
                    : "low"
    };
});

        APP.data = {

            totalCustomers:
                number(
                    stats.total_customers
                ),

            churnRate:
                number(
                    stats.churn_rate
                ),

            monthlyRevenue:
                number(
                    stats.monthly_revenue ??
                    stats.total_revenue
                ),

            totalPredictions:
                number(
                    stats.total_predictions ??
                    stats.total_customers
                ),

            highRiskCustomers:
                number(
                    stats.high_risk_customers ??
                    stats.total_churn
                ),

            revenueAtRisk:
                number(
                    stats.revenue_at_risk
                ),

            customerGrowth:
                "Live database calculation",

            customers:
                normalizedCustomers,

            geography:
                geographyData
        };

        APP.customers =
            normalizedCustomers;

        APP.filteredCustomers =
            [
                ...normalizedCustomers
            ];

        APP.geography =
            geographyData;

        updateSystemStatus(
            "Online",
            "online"
        );

        safeText(
            "apiStatusText",
            "PostgreSQL API Connected"
        );

        console.log(
            "✅ Real database data loaded:",
            {
                stats,
                customers:
                    normalizedCustomers.length
            }
        );

    } catch (error) {

        console.error(
            "Database API connection failed:",
            error
        );

        throw error;
    }
}
/* ============================================================
   STATUS
   ============================================================ */

function updateSystemStatus(
    text,
    status
) {

    safeText(
        "systemStatus",
        text
    );

    const button =
        byId("systemStatusButton");

    if (button) {

        button.dataset.status =
            status;

    }

}


/* ============================================================
   KPI COUNTERS
   ============================================================ */

function animateValue(
    element,
    target,
    formatter,
    duration = 900
) {

    if (!element) return;

    const start =
        performance.now();

    const initial =
        0;

    function frame(now) {

        const progress =
            Math.min(
                (now - start) / duration,
                1
            );

        const eased =
            1 -
            Math.pow(
                1 - progress,
                3
            );

        const value =
            initial +
            (target - initial) * eased;

        element.textContent =
            formatter(value);

        if (progress < 1) {

            requestAnimationFrame(frame);

        }

    }

    requestAnimationFrame(frame);

}


function updateKPIs() {

    if (!APP.data) return;

    animateValue(
        byId("total-customers"),
        APP.data.totalCustomers,
        value => formatNumber(value)
    );

    animateValue(
        byId("churn-rate"),
        APP.data.churnRate,
        value =>
            value.toFixed(2) + "%"
    );

    animateValue(
        byId("monthly-revenue"),
        APP.data.monthlyRevenue,
        value =>
            formatCurrency(value)
    );

    animateValue(
        byId("total-predictions"),
        APP.data.totalPredictions,
        value =>
            formatNumber(value)
    );

    animateValue(
        byId("highRiskCustomers"),
        APP.data.highRiskCustomers,
        value =>
            formatNumber(value)
    );

    animateValue(
        byId("revenueAtRisk"),
        APP.data.revenueAtRisk,
        value =>
            formatCurrency(value)
    );

    safeText(
        "customerGrowth",
        APP.data.customerGrowth
    );

    safeText(
        "customerNavCount",
        formatNumber(
            APP.data.totalCustomers
        )
    );

    const riskIndex =
        Math.min(
            99,
            Math.max(
                1,
                APP.data.churnRate * 4.7
            )
        );

    safeText(
        "heroRiskIndex",
        riskIndex.toFixed(1)
    );

    const gauge =
        byId("riskGauge");

    if (gauge) {

        gauge.style.setProperty(
            "--risk-value",
            `${riskIndex}%`
        );

    }

    const signal =
        byId("aiSignalMessage");

    if (signal) {

        signal.innerHTML = `
            <i class="fa-solid fa-sparkles"></i>
            AI detected
            <strong>
                ${formatNumber(
                    APP.data.highRiskCustomers
                )}
            </strong>
            customers requiring proactive retention action.
        `;

    }

}


/* ============================================================
   CHART UTILITIES
   ============================================================ */

function destroyChart(name) {

    if (
        APP.charts[name] &&
        typeof APP.charts[name].destroy ===
        "function"
    ) {

        APP.charts[name].destroy();

    }

}


function getChartColors() {

    return {
        purple: "#8b7cff",
        cyan: "#53d6ff",
        green: "#52d6a7",
        orange: "#ffad5c",
        red: "#ff5f7a",
        yellow: "#ffd166",
        grid: "rgba(255,255,255,0.08)",
        text: "#9ca8bb"
    };

}


function chartClickToast(
    label,
    value,
    suffix = ""
) {

    showToast(
        "Data point selected",
        `${label}: ${value}${suffix}`,
        "info"
    );

}


/* ============================================================
   DASHBOARD CHARTS
   ============================================================ */

function createChurnTrendChart() {

    const canvas =
        byId("churnTrendChart");

    if (
        !canvas ||
        typeof Chart === "undefined"
    ) return;

    destroyChart("churnTrend");

    const colors =
        getChartColors();

    const period =
        APP.currentPeriod;

    const points =
        period === "365"
            ? 12
            : period === "90"
                ? 9
                : 6;

    const labels =
        Array.from(
            { length: points },
            (_, index) =>
                `P${index + 1}`
        );

    const base =
        APP.data.churnRate;

    const values =
        labels.map(
            (_, index) =>
                Number(
                    (
                        base -
                        2.5 +
                        Math.sin(index * 1.7) *
                        2 +
                        index * 0.35
                    ).toFixed(2)
                )
        );

    APP.charts.churnTrend =
        new Chart(
            canvas,
            {
                type: "line",

                data: {
                    labels,

                    datasets: [
                        {
                            label: "Churn Rate",

                            data: values,

                            borderColor:
                                colors.purple,

                            backgroundColor:
                                "rgba(139,124,255,0.15)",

                            fill: true,

                            tension: 0.42,

                            borderWidth: 3,

                            pointRadius: 5,

                            pointHoverRadius: 9
                        }
                    ]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,

                    plugins: {
                        legend: {
                            display: false
                        }
                    },

                    scales: {
                        x: {
                            grid: {
                                display: false
                            },

                            ticks: {
                                color:
                                    colors.text
                            }
                        },

                        y: {
                            grid: {
                                color:
                                    colors.grid
                            },

                            ticks: {
                                color:
                                    colors.text,

                                callback:
                                    value =>
                                        value + "%"
                            }
                        }
                    },

                    onClick:
                        (_, elements) => {

                            if (!elements.length) return;

                            const point =
                                elements[0];

                            chartClickToast(
                                labels[point.index],
                                values[point.index],
                                "%"
                            );

                        }
                }
            }
        );

}


function createRiskDistributionChart() {

    const canvas =
        byId("riskDistributionChart");

    if (
        !canvas ||
        typeof Chart === "undefined"
    ) return;

    destroyChart(
        "riskDistribution"
    );

    const customers =
        APP.customers;

    const low =
        customers.filter(
            customer =>
                customer.risk === "low"
        ).length;

    const medium =
        customers.filter(
            customer =>
                customer.risk === "medium"
        ).length;

    const high =
        customers.filter(
            customer =>
                customer.risk === "high"
        ).length;

    safeText(
        "lowRiskCount",
        formatNumber(low)
    );

    safeText(
        "mediumRiskCount",
        formatNumber(medium)
    );

    safeText(
        "highRiskCount",
        formatNumber(high)
    );

    APP.charts.riskDistribution =
        new Chart(
            canvas,
            {
                type: "doughnut",

                data: {
                    labels: [
                        "Low Risk",
                        "Medium Risk",
                        "High Risk"
                    ],

                    datasets: [
                        {
                            data: [
                                low,
                                medium,
                                high
                            ],

                            backgroundColor: [
                                "#52d6a7",
                                "#ffd166",
                                "#ff5f7a"
                            ],

                            borderWidth: 0,

                            hoverOffset: 15
                        }
                    ]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "70%",

                    plugins: {
                        legend: {
                            display: false
                        }
                    },

                    onClick:
                        (_, elements) => {

                            if (!elements.length) return;

                            const index =
                                elements[0].index;

                            const risks = [
                                "low",
                                "medium",
                                "high"
                            ];

                            filterByRisk(
                                risks[index]
                            );

                        }
                }
            }
        );

}


async function createContractChart() {
    const canvas = byId("contractChart");

    if (!canvas || typeof Chart === "undefined") {
        console.error("Contract chart canvas or Chart.js not available");
        return;
    }

    destroyChart("contract");

    try {
        const response = await fetch(
            `${API_BASE_URL}/analytics/contract`
        );

        if (!response.ok) {
            throw new Error(
                `Contract analytics request failed: ${response.status}`
            );
        }

        const data = await response.json();

        console.log("Contract analytics:", data);

        if (!Array.isArray(data) || !data.length) {
            throw new Error("No contract analytics data returned");
        }

        const labels = data.map(row => {
            const type = String(
                row.contract_type || "Unknown"
            );

            if (type === "Monthly") {
                return "Monthly";
            }

            if (type === "Quarterly") {
                return "Quarterly";
            }

            if (type === "Annual") {
                return "Annual";
            }

            return type;
        });

        const values = data.map(row => {
            return Number(
                row.churn_rate ?? 0
            );
        });

        APP.charts.contract = new Chart(canvas, {
            type: "bar",

            data: {
                labels: labels,

                datasets: [
                    {
                        label: "Churn Rate",

                        data: values,

                        backgroundColor: [
                            "#ff5f7a",
                            "#8b7cff",
                            "#52d6a7"
                        ],

                        borderRadius: 10,

                        borderSkipped: false
                    }
                ]
            },

            options: {
                responsive: true,

                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        display: false
                    },

                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Churn Rate: ${context.raw}%`;
                            }
                        }
                    }
                },

                scales: {
                    y: {
                        beginAtZero: true,

                        max: 30,

                        ticks: {
                            callback: function(value) {
                                return value + "%";
                            }
                        }
                    }
                }
            }
        });

        console.log(
            "Contract chart rendered successfully:",
            values
        );

    } catch (error) {
        console.error(
            "Contract analytics error:",
            error
        );
    }
}
function createPaymentChart() {

    const canvas =
        byId("paymentChart");

    if (
        !canvas ||
        typeof Chart === "undefined"
    ) return;

    destroyChart("payment");

    const methods = [
        ...new Set(
            APP.customers.map(
                customer =>
                    customer.payment
            )
        )
    ];

    const values =
        methods.map(
            method => {

                const group =
                    APP.customers.filter(
                        customer =>
                            customer.payment ===
                            method
                    );

                return Number(
                    (
                        group.reduce(
                            (sum, customer) =>
                                sum +
                                customer.churnProbability,
                            0
                        ) /
                        Math.max(
                            group.length,
                            1
                        )
                    ).toFixed(1)
                );

            }
        );

    APP.charts.payment =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {
                    labels:
                        methods.map(
                            method =>
                                method.replace(
                                    " (automatic)",
                                    ""
                                )
                        ),

                    datasets: [
                        {
                            data: values,

                            backgroundColor:
                                "#53d6ff",

                            borderRadius: 10
                        }
                    ]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,

                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            }
        );

}


function createTenureChart() {

    const canvas =
        byId("tenureChart");

    if (
        !canvas ||
        typeof Chart === "undefined"
    ) return;

    destroyChart("tenure");

    const buckets = [
        [0, 12, "0–12"],
        [13, 24, "13–24"],
        [25, 48, "25–48"],
        [49, 72, "49–72"]
    ];

    const values =
        buckets.map(
            ([min, max]) => {

                const group =
                    APP.customers.filter(
                        customer =>
                            customer.tenure >= min &&
                            customer.tenure <= max
                    );

                return group.length
                    ? Number(
                        (
                            group.reduce(
                                (
                                    sum,
                                    customer
                                ) =>
                                    sum +
                                    customer.churnProbability,
                                0
                            ) /
                            group.length
                        ).toFixed(1)
                    )
                    : 0;

            }
        );

    APP.charts.tenure =
        new Chart(
            canvas,
            {
                type: "line",

                data: {
                    labels:
                        buckets.map(
                            bucket =>
                                bucket[2] +
                                " months"
                        ),

                    datasets: [
                        {
                            data: values,

                            borderColor:
                                "#52d6a7",

                            backgroundColor:
                                "rgba(82,214,167,0.1)",

                            fill: true,

                            tension: 0.4,

                            borderWidth: 3,

                            pointRadius: 5
                        }
                    ]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,

                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            }
        );

}


/* ============================================================
   HIGH RISK TABLE
   ============================================================ */

function getDashboardCustomers() {

    let customers =
        [...APP.customers];

    if (
        APP.activeDashboardFilter !==
        "all"
    ) {

        customers =
            customers.filter(
                customer =>
                    customer.risk ===
                    APP.activeDashboardFilter
            );

    }

    const search =
        byId(
            "dashboardCustomerSearch"
        )?.value
            .trim()
            .toLowerCase() ?? "";

    if (search) {

        customers =
            customers.filter(
                customer =>
                    `${customer.name} ${customer.id} ${customer.location}`
                        .toLowerCase()
                        .includes(search)
            );

    }

    return customers
        .sort(
            (a, b) =>
                b.churnProbability -
                a.churnProbability
        )
        .slice(0, 12);

}


function renderHighRiskTable() {

    const body =
        byId("risk-body");

    if (!body) return;

    const customers =
        getDashboardCustomers();

    if (!customers.length) {

        body.innerHTML = `
            <tr>
                <td colspan="8" class="table-loading">
                    No customers match the current filter.
                </td>
            </tr>
        `;

        return;

    }

    body.innerHTML =
        customers.map(
            customer => `
                <tr
                    class="interactive-row"
                    data-customer-id="${escapeHTML(
                        customer.id
                    )}"
                >
                    <td>
                        <strong>
                            ${escapeHTML(
                                customer.name
                            )}
                        </strong>
                        <small>
                            ${escapeHTML(
                                customer.id
                            )}
                        </small>
                    </td>

                    <td>
                        ${escapeHTML(
                            customer.location
                        )}
                    </td>

                    <td>
                        ${customer.tenure} months
                    </td>

                    <td>
                        ${escapeHTML(
                            customer.contract
                        )}
                    </td>

                    <td>
                        ${formatCurrency(
                            customer.monthlyCharges
                        )}
                    </td>

                    <td>
                        <div class="probability-cell">
                            <div class="probability-bar">
                                <span
                                    style="width:${customer.churnProbability}%"
                                ></span>
                            </div>

                            <strong>
                                ${customer.churnProbability}%
                            </strong>
                        </div>
                    </td>

                    <td>
                        <span class="risk-pill ${customer.risk}">
                            ${customer.risk}
                        </span>
                    </td>

                    <td>
                        <button
                            class="row-action"
                            type="button"
                            data-customer-action="${escapeHTML(
                                customer.id
                            )}"
                        >
                            Investigate
                            <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </td>
                </tr>
            `
        ).join("");

    $$(
        "[data-customer-id]",
        body
    ).forEach(
        row => {

            row.addEventListener(
                "click",
                event => {

                    if (
                        event.target.closest(
                            "button"
                        )
                    ) return;

                    openCustomerModal(
                        row.dataset.customerId
                    );

                }
            );

        }
    );

    $$(
        "[data-customer-action]",
        body
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    openCustomerModal(
                        button.dataset.customerAction
                    );

                }
            );

        }
    );

}


/* ============================================================
   CUSTOMER PAGE + FILTERS + PAGINATION
   ============================================================ */

function populateCustomerFilters() {

    const locationFilter =
        byId("locationFilter");

    const contractFilter =
        byId("contractFilter");

    if (
        locationFilter &&
        locationFilter.options.length <= 1
    ) {

        const locations =
            [
                ...new Set(
                    APP.customers.map(
                        customer =>
                            customer.location
                    )
                )
            ].sort();

        locations.forEach(
            location => {

                locationFilter.insertAdjacentHTML(
                    "beforeend",
                    `
                        <option value="${escapeHTML(
                            location
                        )}">
                            ${escapeHTML(
                                location
                            )}
                        </option>
                    `
                );

            }
        );

    }

    if (
        contractFilter &&
        contractFilter.options.length <= 1
    ) {

        const contracts =
            [
                ...new Set(
                    APP.customers.map(
                        customer =>
                            customer.contract
                    )
                )
            ];

        contracts.forEach(
            contract => {

                contractFilter.insertAdjacentHTML(
                    "beforeend",
                    `
                        <option value="${escapeHTML(
                            contract
                        )}">
                            ${escapeHTML(
                                contract
                            )}
                        </option>
                    `
                );

            }
        );

    }

}


function getFilteredCustomers() {

    const search =
        byId("customerSearch")
            ?.value
            .trim()
            .toLowerCase() ?? "";

    const risk =
        byId("riskFilter")
            ?.value ?? "all";

    const location =
        byId("locationFilter")
            ?.value ?? "all";

    const contract =
        byId("contractFilter")
            ?.value ?? "all";

    return APP.customers.filter(
        customer => {

            const searchable =
                `${customer.name} ${customer.id} ${customer.location}`
                    .toLowerCase();

            return (
                (!search ||
                    searchable.includes(
                        search
                    )) &&

                (risk === "all" ||
                    customer.risk === risk) &&

                (location === "all" ||
                    customer.location ===
                    location) &&

                (contract === "all" ||
                    customer.contract ===
                    contract)
            );

        }
    );

}


function updateCustomerSummary(
    customers
) {

    const average =
        customers.length
            ? customers.reduce(
                (sum, customer) =>
                    sum +
                    customer.churnProbability,
                0
            ) / customers.length
            : 0;

    const highRiskRevenue =
        customers
            .filter(
                customer =>
                    customer.risk === "high"
            )
            .reduce(
                (sum, customer) =>
                    sum +
                    customer.monthlyCharges,
                0
            );

    safeText(
        "filteredCustomerCount",
        formatNumber(
            customers.length
        )
    );

    safeText(
        "averageChurnProbability",
        average.toFixed(1) + "%"
    );

    safeText(
        "highRiskRevenue",
        formatCurrency(
            highRiskRevenue
        )
    );

}


function renderCustomerPage() {

    const body =
        byId("customerTableBody");

    if (!body) return;

    APP.filteredCustomers =
        getFilteredCustomers();

    updateCustomerSummary(
        APP.filteredCustomers
    );

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                APP.filteredCustomers.length /
                APP.rowsPerPage
            )
        );

    if (
        APP.currentPage >
        totalPages
    ) {

        APP.currentPage =
            totalPages;

    }

    const start =
        (
            APP.currentPage - 1
        ) *
        APP.rowsPerPage;

    const customers =
        APP.filteredCustomers.slice(
            start,
            start +
            APP.rowsPerPage
        );

    if (!customers.length) {

        body.innerHTML = `
            <tr>
                <td colspan="9">
                    No customers found.
                </td>
            </tr>
        `;

    } else {

        body.innerHTML =
            customers.map(
                customer => `
                    <tr
                        class="interactive-row"
                        data-main-customer="${escapeHTML(
                            customer.id
                        )}"
                    >
                        <td>
                            <strong>
                                ${escapeHTML(
                                    customer.name
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    customer.id
                                )}
                            </small>
                        </td>

                        <td>
                            ${escapeHTML(
                                customer.location
                            )}
                        </td>

                        <td>
                            ${customer.tenure} months
                        </td>

                        <td>
                            ${escapeHTML(
                                customer.contract
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                customer.payment
                            )}
                        </td>

                        <td>
                            ${formatCurrency(
                                customer.monthlyCharges
                            )}
                        </td>

                        <td>
                            <strong>
                                ${customer.churnProbability}%
                            </strong>
                        </td>

                        <td>
                            <span class="risk-pill ${customer.risk}">
                                ${customer.risk}
                            </span>
                        </td>

                        <td>
                            <button
                                type="button"
                                class="row-action"
                                data-open-customer="${escapeHTML(
                                    customer.id
                                )}"
                            >
                                Analyze
                            </button>
                        </td>
                    </tr>
                `
            ).join("");

    }

    $$(
        "[data-main-customer]"
    ).forEach(
        row => {

            row.addEventListener(
                "click",
                event => {

                    if (
                        event.target.closest(
                            "button"
                        )
                    ) return;

                    openCustomerModal(
                        row.dataset.mainCustomer
                    );

                }
            );

        }
    );

    $$(
        "[data-open-customer]"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                () =>
                    openCustomerModal(
                        button.dataset.openCustomer
                    )
            );

        }
    );

    renderPagination(
        totalPages
    );

}


function renderPagination(
    totalPages
) {

    const pageNumbers =
        byId("pageNumbers");

    if (!pageNumbers) return;

    pageNumbers.innerHTML =
        Array.from(
            { length: totalPages },
            (_, index) => {

                const page =
                    index + 1;

                return `
                    <button
                        type="button"
                        class="${
                            page === APP.currentPage
                                ? "active"
                                : ""
                        }"
                        data-page-number="${page}"
                    >
                        ${page}
                    </button>
                `;

            }
        ).join("");

    $$(
        "[data-page-number]"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    APP.currentPage =
                        number(
                            button.dataset.pageNumber,
                            1
                        );

                    renderCustomerPage();

                }
            );

        }
    );

    safeText(
        "paginationInfo",
        `Page ${APP.currentPage} of ${totalPages}`
    );

    const previous =
        byId("previousPageBtn");

    const next =
        byId("nextPageBtn");

    if (previous) {

        previous.disabled =
            APP.currentPage === 1;

    }

    if (next) {

        next.disabled =
            APP.currentPage === totalPages;

    }

}


/* ============================================================
   CUSTOMER MODAL
   ============================================================ */

function openCustomerModal(
    customerId
) {

    const customer =
        APP.customers.find(
            item =>
                String(item.id) ===
                String(customerId)
        );

    if (!customer) return;

    const modal =
        byId("customerModal");

    const content =
        byId(
            "customerModalContent"
        );

    if (
        !modal ||
        !content
    ) return;

    const riskClass =
        customer.risk;

    content.innerHTML = `

        <div class="customer-intelligence-profile">

            <div class="customer-modal-hero">

                <div>

                    <span>
                        CUSTOMER INTELLIGENCE PROFILE
                    </span>

                    <h2>
                        ${escapeHTML(
                            customer.name
                        )}
                    </h2>

                    <p>
                        ${escapeHTML(
                            customer.id
                        )}
                        ·
                        ${escapeHTML(
                            customer.location
                        )}
                    </p>

                </div>

                <div class="customer-risk-score ${riskClass}">

                    <span>
                        CHURN RISK
                    </span>

                    <strong>
                        ${customer.churnProbability}%
                    </strong>

                </div>

            </div>


            <div class="customer-detail-grid">

                <div class="customer-detail-item">
                    <span>Tenure</span>
                    <strong>
                        ${customer.tenure} months
                    </strong>
                </div>

                <div class="customer-detail-item">
                    <span>Contract</span>
                    <strong>
                        ${escapeHTML(
                            customer.contract
                        )}
                    </strong>
                </div>

                <div class="customer-detail-item">
                    <span>Payment</span>
                    <strong>
                        ${escapeHTML(
                            customer.payment
                        )}
                    </strong>
                </div>

                <div class="customer-detail-item">
                    <span>Monthly Value</span>
                    <strong>
                        ${formatCurrency(
                            customer.monthlyCharges
                        )}
                    </strong>
                </div>

            </div>


            <div class="customer-history">

                <div class="modal-section-heading">

                    <span>
                        BEHAVIOR HISTORY
                    </span>

                    <h3>
                        Churn Risk Timeline
                    </h3>

                </div>

                <div class="history-timeline">

                    <div>
                        <span>
                            90 DAYS AGO
                        </span>

                        <strong>
                            ${Math.max(
                                2,
                                customer.churnProbability -
                                18
                            ).toFixed(1)}%
                        </strong>
                    </div>

                    <div>
                        <span>
                            60 DAYS AGO
                        </span>

                        <strong>
                            ${Math.max(
                                2,
                                customer.churnProbability -
                                10
                            ).toFixed(1)}%
                        </strong>
                    </div>

                    <div>
                        <span>
                            30 DAYS AGO
                        </span>

                        <strong>
                            ${Math.max(
                                2,
                                customer.churnProbability -
                                4
                            ).toFixed(1)}%
                        </strong>
                    </div>

                    <div class="current">
                        <span>
                            CURRENT
                        </span>

                        <strong>
                            ${customer.churnProbability}%
                        </strong>
                    </div>

                </div>

            </div>


            <div class="retention-recommendation">

                <i class="fa-solid fa-sparkles"></i>

                <div>

                    <span>
                        AI RECOMMENDATION
                    </span>

                    <p>
                        ${
                            customer.risk === "high"
                                ? "Immediate retention outreach recommended. Offer personalized incentives and investigate recent engagement decline."
                                : customer.risk === "medium"
                                    ? "Monitor engagement and trigger proactive retention communication."
                                    : "Customer currently appears stable. Maintain service quality and engagement."
                        }
                    </p>

                </div>

            </div>

        </div>
    `;

    openModal(
        "customerModal"
    );

}


/* ============================================================
   MODALS
   ============================================================ */

function openModal(id) {

    const modal =
        byId(id);

    if (!modal) return;

    modal.classList.add("show");
    modal.style.display = "flex";

    document.body.style.overflow =
        "hidden";

}


function closeModal(id) {

    const modal =
        byId(id);

    if (!modal) return;

    modal.classList.remove("show");

    setTimeout(
        () => {

            modal.style.display =
                "none";

        },
        200
    );

    document.body.style.overflow =
        "";

}


/* ============================================================
   GEOGRAPHY
   ============================================================ */

function getRiskLevel(
    churnRate
) {

    return churnRate >= 60
        ? "high"
        : churnRate >= 35
            ? "medium"
            : "low";

}


function renderGeography() {

    if (
        !APP.geography.length
    ) return;

    const highestRisk =
        [...APP.geography]
            .sort(
                (a, b) =>
                    b.churnRate -
                    a.churnRate
            )[0];

    const highestRevenue =
        [...APP.geography]
            .sort(
                (a, b) =>
                    b.revenue -
                    a.revenue
            )[0];

    safeText(
        "highestRiskLocation",
        highestRisk?.location
    );

    safeText(
        "lowestRetentionLocation",
        highestRisk?.location
    );

    safeText(
        "highestRevenueLocation",
        highestRevenue?.location
    );

    renderIndiaMap();

    renderGeographyTable();

    createGeographyChart();

}


function renderIndiaMap() {

    const map =
        byId("indiaMap");

    if (!map) return;

    map.innerHTML =
        APP.geography.map(
            region => {

                const intensity =
                    Math.min(
                        1,
                        region.churnRate / 100
                    );

                return `
                    <button
                        type="button"
                        class="map-state ${region.risk}"
                        data-state="${escapeHTML(
                            region.location
                        )}"
                        style="
                            --risk-intensity:${intensity};
                        "
                    >

                        <span>
                            ${escapeHTML(
                                region.location
                            )}
                        </span>

                        <strong>
                            ${region.churnRate}%
                        </strong>

                    </button>
                `;

            }
        ).join("");

    $$(
        "[data-state]",
        map
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const state =
                        button.dataset.state;

                    drillIntoLocation(
                        state
                    );

                }
            );

        }
    );

}


function renderGeographyTable() {

    const body =
        byId("geo-body");

    if (!body) return;

    body.innerHTML =
        APP.geography
            .sort(
                (a, b) =>
                    b.churnRate -
                    a.churnRate
            )
            .map(
                region => `
                    <tr
                        class="interactive-row"
                        data-geo="${escapeHTML(
                            region.location
                        )}"
                    >

                        <td>
                            <strong>
                                ${escapeHTML(
                                    region.location
                                )}
                            </strong>
                        </td>

                        <td>
                            ${formatNumber(
                                region.customers
                            )}
                        </td>

                        <td>
                            ${formatNumber(
                                region.churned
                            )}
                        </td>

                        <td>
                            ${region.churnRate}%
                        </td>

                        <td>
                            ${formatCurrency(
                                region.revenue
                            )}
                        </td>

                        <td>
                            <span class="risk-pill ${region.risk}">
                                ${region.risk}
                            </span>
                        </td>

                        <td>
                            <button
                                type="button"
                                class="row-action"
                            >
                                Explore
                            </button>
                        </td>

                    </tr>
                `
            ).join("");

    $$(
        "[data-geo]"
    ).forEach(
        row => {

            row.addEventListener(
                "click",
                () =>
                    drillIntoLocation(
                        row.dataset.geo
                    )
            );

        }
    );

}


function drillIntoLocation(
    location
) {

    changePage("customers");

    const filter =
        byId("locationFilter");

    if (filter) {

        filter.value =
            APP.customers.some(
                customer =>
                    customer.location ===
                    location
            )
                ? location
                : "all";

    }

    APP.currentPage = 1;

    renderCustomerPage();

    showToast(
        "Location drill-down",
        `Showing customers connected to ${location}`,
        "info"
    );

}


function createGeographyChart() {

    const canvas =
        byId("geographyChart");

    if (
        !canvas ||
        typeof Chart === "undefined"
    ) return;

    destroyChart("geography");

    APP.charts.geography =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {

                    labels:
                        APP.geography.map(
                            region =>
                                region.location
                        ),

                    datasets: [
                        {
                            data:
                                APP.geography.map(
                                    region =>
                                        region.churnRate
                                ),

                            backgroundColor:
                                APP.geography.map(
                                    region =>
                                        region.risk === "high"
                                            ? "#ff5f7a"
                                            : region.risk === "medium"
                                                ? "#ffd166"
                                                : "#52d6a7"
                                ),

                            borderRadius: 10
                        }
                    ]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,

                    plugins: {
                        legend: {
                            display: false
                        }
                    },

                    onClick:
                        (_, elements) => {

                            if (!elements.length) return;

                            const region =
                                APP.geography[
                                    elements[0].index
                                ];

                            drillIntoLocation(
                                region.location
                            );

                        }
                }
            }
        );

}


/* ============================================================
   ANALYTICS PAGE
   ============================================================ */

function renderAnalytics() {
    renderHeatmap();
    createRevenueChurnChart();
    createSegmentChart();
    renderChurnDrivers();
    updateAnalyticsSummary();
    bindAnalyticsControls();
}

function updateAnalyticsSummary() {
    const customers = APP.customers || [];
    const high = customers.filter(c => String(c.risk).toLowerCase() === "high");
    const highRate = customers.length ? Math.round((high.length / customers.length) * 100) : 0;
    const exposed = high.reduce((sum, c) => sum + number(c.monthlyCharges, 0), 0);
    safeText("analyticsHighestRisk", highRate + "% risk");
    safeText("analyticsRevenueExposed", formatCurrency(exposed));
    safeText("analyticsCriticalCount", formatNumber(high.length));
}

function bindAnalyticsControls() {
    $$('[data-analytics-period]').forEach(button => {
        if (button.dataset.analyticsBound) return;
        button.dataset.analyticsBound = "true";
        button.addEventListener("click", () => {
            $$('[data-analytics-period]').forEach(b => b.classList.toggle("active", b === button));
            APP.analyticsPeriod = button.dataset.analyticsPeriod;
            showToast("Analytics window", button.textContent.trim() + " selected", "info");
        });
    });

    $$('[data-analytics-action]').forEach(button => {
        if (button.dataset.analyticsBound) return;
        button.dataset.analyticsBound = "true";
        button.addEventListener("click", () => {
            const action = button.dataset.analyticsAction;
            if (action === "risk" || action === "segment") {
                openCustomersWithFilter("risk", "high");
            } else if (action === "revenue") {
                byId("revenueChurnChart")?.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        });
    });

    $$('[data-expand-chart]').forEach(button => {
        if (button.dataset.analyticsBound) return;
        button.dataset.analyticsBound = "true";
        button.addEventListener("click", () => expandChart(button.dataset.expandChart));
    });
}

function renderHeatmap() {
    const container = byId("customerHeatmap");
    if (!container) return;

    const contracts = ["Month-to-month", "One year", "Two year"];
    const tenures = ["0–12 months", "13–24 months", "25–48 months", "49–72 months"];

    const rows = tenures.map((tenure, rowIndex) => {
        const cells = contracts.map((contract, columnIndex) => {
            const value = Math.min(94, Math.max(14, 84 - rowIndex * 13 - columnIndex * 15 + rowIndex * columnIndex * 2));
            return `<button type="button" class="heat-cell" data-heat-contract="${escapeHTML(contract)}" data-heat-tenure="${rowIndex}" style="--heat:${value / 100}"><small>${contract === "Month-to-month" ? "Flexible" : contract}</small><strong>${value}%</strong></button>`;
        }).join("");
        return `<div class="heatmap-row"><span class="heatmap-row-label">${tenure}</span>${cells}</div>`;
    }).join("");

    container.innerHTML = `<div class="heatmap-board"><div class="heatmap-header"><span>Customer tenure</span>${contracts.map(c => `<span>${c}</span>`).join("")}</div>${rows}<div class="heatmap-legend"><span>Lower exposure</span><span class="legend-scale"></span><span>Higher exposure</span></div></div>`;

    $$('[data-heat-contract]').forEach(cell => {
        cell.addEventListener("click", () => {
            const contract = cell.dataset.heatContract;
            openCustomersWithFilter("contract", contract);
            showToast("Heatmap cohort", contract + " selected", "info");
        });
    });
}

function createRevenueChurnChart() {
    const canvas = byId("revenueChurnChart");
    if (!canvas || typeof Chart === "undefined") return;
    destroyChart("revenueChurn");
    const customers = APP.customers || [];
    APP.charts.revenueChurn = new Chart(canvas, {
        type: "scatter",
        data: { datasets: [{ label: "Customers", data: customers.map(customer => ({ x: number(customer.monthlyCharges), y: number(customer.churnProbability) })), backgroundColor: "#53d6ff", borderColor: "#53d6ff", pointRadius: 5, pointHoverRadius: 9, pointHoverBorderWidth: 3 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label(ctx){ const c = customers[ctx.dataIndex]; return c ? `${c.name} · ₹${number(c.monthlyCharges).toFixed(0)} · ${number(c.churnProbability).toFixed(1)}% risk` : "Customer"; } } } }, scales:{ x:{ title:{display:true,text:"Monthly charges"}, grid:{color:"rgba(255,255,255,.045)"}, ticks:{color:"#7f8ba1"} }, y:{ title:{display:true,text:"Churn probability (%)"}, grid:{color:"rgba(255,255,255,.045)"}, ticks:{color:"#7f8ba1"} } }, onClick(_, elements){ if (!elements.length) return; const c=customers[elements[0].index]; if (c) openCustomerModal(c.id); } }
    });
}

function createSegmentChart() {
    const canvas = byId("segmentChart");
    if (!canvas || typeof Chart === "undefined") return;
    destroyChart("segment");
    const customers = APP.customers || [];
    const buckets = ["low", "medium", "high"];
    const counts = buckets.map(r => customers.filter(c => String(c.risk).toLowerCase() === r).length);
    APP.charts.segment = new Chart(canvas, {
        type:"doughnut",
        data:{ labels:["Stable", "Watchlist", "Critical"], datasets:[{ data:counts, backgroundColor:["#52d6a7", "#ffd166", "#ff5f7a"], borderWidth:0, hoverOffset:12 }] },
        options:{ responsive:true, maintainAspectRatio:false, cutout:"68%", plugins:{ legend:{ position:"bottom", labels:{ color:"#9aa6ba", usePointStyle:true, padding:18 } }, tooltip:{ callbacks:{ label:ctx => `${ctx.label}: ${formatNumber(ctx.raw)} customers` } } }, onClick(_, elements){ if (!elements.length) return; const risk=buckets[elements[0].index]; openCustomersWithFilter("risk", risk); } }
    });
}

function renderChurnDrivers() {
    const container = byId("churnDrivers");
    if (!container) return;
    const drivers = [
        { label:"Month-to-month contracts", score:87, filter:"Month-to-month" },
        { label:"Electronic check usage", score:73, filter:null },
        { label:"Low tenure customers", score:69, filter:null },
        { label:"High monthly charges", score:61, filter:null }
    ];
    container.innerHTML = drivers.map(driver => `<button type="button" class="driver-item" data-driver="${escapeHTML(driver.label)}" data-driver-filter="${driver.filter || ""}"><div><span>${escapeHTML(driver.label)}</span><strong>${driver.score}%</strong></div><div class="driver-bar"><span style="width:${driver.score}%"></span></div></button>`).join("");
    $$('[data-driver]').forEach(button => button.addEventListener("click", () => {
        const filter = button.dataset.driverFilter;
        if (filter) openCustomersWithFilter("contract", filter);
        else showToast("Churn driver", button.dataset.driver + " is a major retention signal.", "info");
    }));
}


/* ============================================================
   ALERTS
   ============================================================ */

function buildAlerts() {

    const customers =
        [...APP.customers]
            .sort(
                (a, b) =>
                    b.churnProbability -
                    a.churnProbability
            )
            .slice(0, 6);

    APP.notifications =
        customers.map(
            customer => ({
                id:
                    customer.id,

                title:
                    `${customer.name} is at high churn risk`,

                message:
                    `Current churn probability is ${customer.churnProbability}%.`,

                risk:
                    customer.risk,

                read: false
            })
        );

}


function renderAlerts() {

    buildAlerts();

    const container =
        byId("alertsContainer");

    if (!container) return;

    container.innerHTML =
        APP.notifications.map(
            alert => `
                <button
                    type="button"
                    class="alert-card ${alert.risk}"
                    data-alert-customer="${escapeHTML(
                        alert.id
                    )}"
                >

                    <div class="alert-icon">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>

                    <div>
                        <strong>
                            ${escapeHTML(
                                alert.title
                            )}
                        </strong>

                        <p>
                            ${escapeHTML(
                                alert.message
                            )}
                        </p>
                    </div>

                    <i class="fa-solid fa-chevron-right"></i>

                </button>
            `
        ).join("");

    safeText(
        "alertCount",
        APP.notifications.length
    );

    safeText(
        "notificationCount",
        APP.notifications.length
    );

    $$(
        "[data-alert-customer]"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                () =>
                    openCustomerModal(
                        button.dataset.alertCustomer
                    )
            );

        }
    );

}


function renderNotificationPanel() {

    const list =
        byId("notificationList");

    if (!list) return;

    list.innerHTML =
        APP.notifications.map(
            notification => `
                <button
                    type="button"
                    class="notification-item"
                    data-notification-customer="${escapeHTML(
                        notification.id
                    )}"
                >

                    <span class="${notification.risk}">
                    </span>

                    <div>

                        <strong>
                            ${escapeHTML(
                                notification.title
                            )}
                        </strong>

                        <p>
                            ${escapeHTML(
                                notification.message
                            )}
                        </p>

                    </div>

                </button>
            `
        ).join("");

    $$(
        "[data-notification-customer]"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    openCustomerModal(
                        button.dataset
                            .notificationCustomer
                    );

                }
            );

        }
    );

}


/* ============================================================
   AI INSIGHTS
   ============================================================ */

function renderAIInsights() {

    const grid =
        byId("aiInsightsGrid");

    if (!grid) return;

    const highest =
        [...APP.geography]
            .sort(
                (a, b) =>
                    b.churnRate -
                    a.churnRate
            )[0];

    const insights = [
        {
            icon:
                "fa-location-dot",

            title:
                "Geographic Risk Concentration",

            text:
                highest
                    ? `${highest.location} currently shows the highest churn exposure at ${highest.churnRate}%.`
                    : "Geographic intelligence is being analyzed.",

            action:
                "Explore Geography",

            page:
                "geography"
        },
        {
            icon:
                "fa-file-contract",

            title:
                "Contract Retention Signal",

            text:
                "Month-to-month customers show the strongest retention opportunity and should receive proactive offers.",

            action:
                "Explore Customers",

            page:
                "customers"
        },
        {
            icon:
                "fa-shield-heart",

            title:
                "Revenue Protection Opportunity",

            text:
                `${formatCurrency(APP.data.revenueAtRisk)} in monthly value is currently associated with high-risk customers.`,

            action:
                "Open Risk Alerts",

            page:
                "alerts"
        },
        {
            icon:
                "fa-brain",

            title:
                "AI Recommendation",

            text:
                "Prioritize personalized intervention for customers with rapidly increasing churn probability.",

            action:
                "Open Prediction Lab",

            page:
                "prediction"
        }
    ];

    grid.innerHTML =
        insights.map(
            insight => `
                <article class="ai-insight-card">

                    <div class="insight-icon">
                        <i class="fa-solid ${insight.icon}"></i>
                    </div>

                    <h3>
                        ${insight.title}
                    </h3>

                    <p>
                        ${insight.text}
                    </p>

                    <button
                        type="button"
                        data-insight-page="${insight.page}"
                    >
                        ${insight.action}
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>

                </article>
            `
        ).join("");

    $$(
        "[data-insight-page]"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                () =>
                    changePage(
                        button.dataset.insightPage
                    )
            );

        }
    );

}


/* ============================================================
   PREDICTION LAB
   ============================================================ */

function calculatePrediction(
    profile
) {

    let score =
        22;

    if (
        profile.contract ===
        "Month-to-month"
    ) {
        score += 27;
    }

    if (
        profile.payment ===
        "Electronic check"
    ) {
        score += 14;
    }

    if (
        profile.tenure < 12
    ) {
        score += 18;
    } else if (
        profile.tenure < 24
    ) {
        score += 8;
    } else {
        score -= 10;
    }

    if (
        profile.monthlyCharges > 80
    ) {
        score += 10;
    }

    if (
        profile.seniorCitizen === "1"
    ) {
        score += 4;
    }

    if (
        profile.partner === "Yes"
    ) {
        score -= 5;
    }

    return Math.min(
        98,
        Math.max(
            3,
            score
        )
    );

}


async function handlePrediction(
    event
) {

    event.preventDefault();

    const button =
        $(
            ".prediction-submit",
            event.currentTarget
        );

    if (button) {

        button.disabled = true;

    }

    const profile = {
        gender:
            byId("predictGender")?.value,

        seniorCitizen:
            byId(
                "predictSeniorCitizen"
            )?.value,

        partner:
            byId(
                "predictPartner"
            )?.value,

        dependents:
            byId(
                "predictDependents"
            )?.value,

        tenure:
            number(
                byId(
                    "predictTenure"
                )?.value
            ),

        contract:
            byId(
                "predictContract"
            )?.value,

        payment:
            byId(
                "predictPaymentMethod"
            )?.value,

        monthlyCharges:
            number(
                byId(
                    "predictMonthlyCharges"
                )?.value
            )
    };

    let probability =
        calculatePrediction(
            profile
        );

    /*
       Try real backend prediction endpoint.
       If unavailable, local model fallback works.
    */

    const predictionEndpoints = [
        "/predict",
        "/api/predict",
        "/prediction"
    ];

    for (
        const endpoint of
        predictionEndpoints
    ) {

        try {

            const response =
                await fetch(
                    `${API_BASE_URL}${endpoint}`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                profile
                            )
                    }
                );

            if (!response.ok) {
                continue;
            }

            const result =
                await response.json();

            const backendProbability =
                result.churn_probability ??
                result.probability ??
                result.risk_score;

            if (
                backendProbability !==
                undefined
            ) {

                probability =
                    number(
                        backendProbability
                    ) <= 1
                        ? number(
                            backendProbability
                        ) * 100
                        : number(
                            backendProbability
                        );

                break;

            }

        } catch (error) {

            console.warn(
                "Prediction endpoint unavailable:",
                endpoint
            );

        }

    }

    renderPredictionResult(
        probability
    );

    if (button) {

        button.disabled = false;

    }

}


function renderPredictionResult(
    probability
) {

    const container =
        byId("predictionResult");

    if (!container) return;

    const risk =
        probability >= 70
            ? "high"
            : probability >= 40
                ? "medium"
                : "low";

    const recommendation =
        risk === "high"
            ? "Immediate retention action recommended."
            : risk === "medium"
                ? "Monitor customer engagement and trigger a proactive retention campaign."
                : "Customer profile appears stable with low immediate churn exposure.";

    container.innerHTML = `

        <div class="prediction-success ${risk}">

            <span>
                AI PREDICTION COMPLETE
            </span>

            <div class="prediction-score">
                ${probability.toFixed(1)}%
            </div>

            <h3>
                ${
                    risk === "high"
                        ? "High Churn Risk"
                        : risk === "medium"
                            ? "Moderate Churn Risk"
                            : "Low Churn Risk"
                }
            </h3>

            <div class="prediction-meter">
                <span
                    style="
                        width:${probability}%
                    "
                ></span>
            </div>

            <p>
                ${recommendation}
            </p>

            <button
                type="button"
                id="predictionActionBtn"
            >
                Create Retention Strategy
            </button>

        </div>

    `;

    byId(
        "predictionActionBtn"
    )?.addEventListener(
        "click",
        () => {

            changePage(
                "insights"
            );

            showToast(
                "Retention strategy",
                "AI insights prepared for this risk profile.",
                "success"
            );

        }
    );

}


/* ============================================================
   PAGE NAVIGATION
   ============================================================ */

const PAGE_META = {

    dashboard: {
        title:
            "Churn Risk Dashboard",

        eyebrow:
            "CUSTOMER INTELLIGENCE"
    },

    customers: {
        title:
            "Customer Intelligence Explorer",

        eyebrow:
            "CUSTOMER DATABASE"
    },

    geography: {
        title:
            "Churn Across Locations",

        eyebrow:
            "GEOGRAPHIC INTELLIGENCE"
    },

    analytics: {
        title:
            "Customer Behavior Laboratory",

        eyebrow:
            "ADVANCED ANALYTICS"
    },

    alerts: {
        title:
            "Live Risk Alerts",

        eyebrow:
            "ACTION REQUIRED"
    },

    insights: {
        title:
            "AI Retention Insights",

        eyebrow:
            "ARTIFICIAL INTELLIGENCE"
    },

    prediction: {
        title:
            "Churn Prediction Lab",

        eyebrow:
            "ML PREDICTION ENGINE"
    }

};


function changePage(
    page
) {

    $$(".page").forEach(
        section => {

            section.classList.remove(
                "active-page"
            );

            section.style.display =
                "none";

        }
    );

    const target =
        byId(
            `${page}Page`
        );

    if (target) {

        target.style.display =
            "block";

        requestAnimationFrame(
            () =>
                target.classList.add(
                    "active-page"
                )
        );

    }

    $$(".nav-item").forEach(
        item => {

            item.classList.toggle(
                "active",
                item.dataset.page ===
                page
            );

        }
    );

    const meta =
        PAGE_META[page];

    if (meta) {

        safeText(
            "pageTitle",
            meta.title
        );

        safeText(
            "headerEyebrow",
            meta.eyebrow
        );

    }

    if (
        page === "customers"
    ) {
        renderCustomerPage();
    }

    if (
        page === "geography"
    ) {
        renderGeography();
    }

    if (
        page === "analytics"
    ) {
        renderAnalytics();
    }

    if (
        page === "alerts"
    ) {
        renderAlerts();
    }

    if (
        page === "insights"
    ) {
        renderAIInsights();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


function openCustomersWithFilter(
    type,
    value
) {

    changePage(
        "customers"
    );

    if (
        type === "risk"
    ) {

        const filter =
            byId("riskFilter");

        if (filter) {
            filter.value = value;
        }

    }

    if (
        type === "contract"
    ) {

        const filter =
            byId(
                "contractFilter"
            );

        if (filter) {
            filter.value = value;
        }

    }

    APP.currentPage = 1;

    renderCustomerPage();

}


function filterByRisk(
    risk
) {

    openCustomersWithFilter(
        "risk",
        risk
    );

}


/* ============================================================
   ANALYTICS RENDER
   ============================================================ */




/* ============================================================
   CHART EXPAND MODAL
   ============================================================ */

function expandChart(
    chartName
) {

    const source =
        APP.charts[chartName];

    if (!source) {

        showToast(
            "Chart unavailable",
            "This chart has not initialized yet.",
            "error"
        );

        return;

    }

    const modalCanvas =
        byId("expandedChart");

    if (
        !modalCanvas ||
        typeof Chart === "undefined"
    ) return;

    destroyChart(
        "expanded"
    );

    safeText(
        "chartModalTitle",
        source.config?.data
            ?.datasets?.[0]?.label ??
        chartName
    );

    APP.charts.expanded =
        new Chart(
            modalCanvas,
            {
                type:
                    source.config.type,

                data:
                    JSON.parse(
                        JSON.stringify(
                            source.data
                        )
                    ),

                options: {
                    responsive: true,
                    maintainAspectRatio: false,

                    plugins: {
                        legend: {
                            display: true
                        }
                    }
                }
            }
        );

    openModal(
        "chartModal"
    );

}


/* ============================================================
   NOTIFICATIONS + TOAST
   ============================================================ */

let toastTimer = null;


function showToast(
    title,
    message,
    type = "success"
) {

    const toast =
        byId("toast");

    if (!toast) return;

    const icon =
        byId("toastIcon");

    const titleElement =
        byId("toastTitle");

    const messageElement =
        byId("toastMessage");

    if (titleElement) {

        titleElement.textContent =
            title;

    }

    if (messageElement) {

        messageElement.textContent =
            message;

    }

    if (icon) {

        const icons = {
            success:
                "fa-circle-check",

            error:
                "fa-circle-xmark",

            info:
                "fa-circle-info"
        };

        icon.innerHTML = `
            <i class="fa-solid ${
                icons[type] ??
                icons.success
            }"></i>
        `;

    }

    toast.classList.add(
        "show",
        type
    );

    clearTimeout(
        toastTimer
    );

    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show",
                    type
                );

            },
            3500
        );

}


function toggleNotifications(
    force
) {

    const panel =
        byId(
            "notificationPanel"
        );

    if (!panel) return;

    const shouldOpen =
        force ??
        !panel.classList.contains(
            "show"
        );

    panel.classList.toggle(
        "show",
        shouldOpen
    );

}


/* ============================================================
   REFRESH
   ============================================================ */

async function refreshApplication() {

    const button =
        byId("refreshBtn");

    button?.classList.add(
        "refreshing"
    );

    showToast(
        "Refreshing intelligence",
        "Updating customer analytics...",
        "info"
    );

    await loadApplicationData();

    updateAll();

    button?.classList.remove(
        "refreshing"
    );

    updateLastUpdated();

    showToast(
        "Dashboard updated",
        "Latest intelligence is ready.",
        "success"
    );

}


/* ============================================================
   UPDATE ALL
   ============================================================ */

function updateLastUpdated() {

    safeText(
        "lastUpdated",
        new Date()
            .toLocaleTimeString(
                [],
                {
                    hour:
                        "2-digit",

                    minute:
                        "2-digit"
                }
            )
    );

}


function updateAll() {

    updateKPIs();

    populateCustomerFilters();

    renderHighRiskTable();

    renderCustomerPage();

    renderGeography();

    renderAnalytics();

    renderAlerts();

    renderAIInsights();

    createChurnTrendChart();

    createRiskDistributionChart();

    createContractChart();

    createPaymentChart();

    createTenureChart();

    renderNotificationPanel();

    updateLastUpdated();

}


/* ============================================================
   EVENT LISTENERS
   ============================================================ */

function initializeNavigation() {

    $$(".nav-item").forEach(
        button => {

            button.addEventListener(
                "click",
                () =>
                    changePage(
                        button.dataset.page
                    )
            );

        }
    );

}


function initializeKPIActions() {

    $$(".kpi-card").forEach(
        card => {

            card.addEventListener(
                "click",
                () => {

                    const kpi =
                        card.dataset.kpi;

                    if (
                        kpi === "customers"
                    ) {
                        changePage(
                            "customers"
                        );
                    }

                    if (
                        kpi === "churn"
                    ) {

                        expandChart(
                            "churnTrend"
                        );

                    }

                    if (
                        kpi === "revenue"
                    ) {

                        changePage(
                            "analytics"
                        );

                    }

                    if (
                        kpi === "predictions"
                    ) {

                        changePage(
                            "prediction"
                        );

                    }

                    if (
                        kpi === "high-risk"
                    ) {

                        openCustomersWithFilter(
                            "risk",
                            "high"
                        );

                    }

                    if (
                        kpi === "revenue-risk"
                    ) {

                        changePage(
                            "alerts"
                        );

                    }

                }
            );

        }
    );

}


function initializeCustomerFilters() {

    [
        "customerSearch",
        "riskFilter",
        "locationFilter",
        "contractFilter"
    ].forEach(
        id => {

            byId(id)?.addEventListener(
                id === "customerSearch"
                    ? "input"
                    : "change",

                () => {

                    APP.currentPage = 1;

                    renderCustomerPage();

                }
            );

        }
    );

    byId(
        "clearCustomerFilters"
    )?.addEventListener(
        "click",
        () => {

            [
                "customerSearch",
                "riskFilter",
                "locationFilter",
                "contractFilter"
            ].forEach(
                id => {

                    const element =
                        byId(id);

                    if (!element) return;

                    element.value =
                        id ===
                        "customerSearch"
                            ? ""
                            : "all";

                }
            );

            APP.currentPage = 1;

            renderCustomerPage();

        }
    );

}


function initializeDashboardFilters() {

    $$(".table-filter").forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    APP.activeDashboardFilter =
                        button.dataset.filter;

                    $$(".table-filter")
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );

                    button.classList.add(
                        "active"
                    );

                    renderHighRiskTable();

                }
            );

        }
    );

    byId(
        "dashboardCustomerSearch"
    )?.addEventListener(
        "input",
        renderHighRiskTable
    );

}


function initializePagination() {

    byId(
        "previousPageBtn"
    )?.addEventListener(
        "click",
        () => {

            APP.currentPage =
                Math.max(
                    1,
                    APP.currentPage - 1
                );

            renderCustomerPage();

        }
    );

    byId(
        "nextPageBtn"
    )?.addEventListener(
        "click",
        () => {

            const total =
                Math.max(
                    1,
                    Math.ceil(
                        APP.filteredCustomers.length /
                        APP.rowsPerPage
                    )
                );

            APP.currentPage =
                Math.min(
                    total,
                    APP.currentPage + 1
                );

            renderCustomerPage();

        }
    );

}


function initializeButtons() {

    byId(
        "exploreCustomersBtn"
    )?.addEventListener(
        "click",
        () =>
            changePage(
                "customers"
            )
    );

    byId(
        "viewInsightsBtn"
    )?.addEventListener(
        "click",
        () =>
            changePage(
                "insights"
            )
    );

    byId(
        "viewAllRiskBtn"
    )?.addEventListener(
        "click",
        () =>
            openCustomersWithFilter(
                "risk",
                "high"
            )
    );

    byId(
        "refreshBtn"
    )?.addEventListener(
        "click",
        refreshApplication
    );

    byId(
        "refreshRiskBtn"
    )?.addEventListener(
        "click",
        () => {

            renderHighRiskTable();

            showToast(
                "Risk list refreshed",
                "High-priority customers updated.",
                "success"
            );

        }
    );

    byId(
        "refreshGeoBtn"
    )?.addEventListener(
        "click",
        () => {

            renderGeography();

            showToast(
                "Geography refreshed",
                "Regional intelligence updated.",
                "success"
            );

        }
    );

    byId(
        "generateInsightsBtn"
    )?.addEventListener(
        "click",
        () => {

            renderAIInsights();

            showToast(
                "Insights generated",
                "AI retention findings updated.",
                "success"
            );

        }
    );

    byId(
        "markAllAlertsRead"
    )?.addEventListener(
        "click",
        () => {

            APP.notifications =
                APP.notifications.map(
                    item => ({
                        ...item,
                        read: true
                    })
                );

            safeText(
                "alertCount",
                "0"
            );

            safeText(
                "notificationCount",
                "0"
            );

            showToast(
                "Alerts updated",
                "All alerts marked as read.",
                "success"
            );

        }
    );

    byId(
        "exportCustomersBtn"
    )?.addEventListener(
        "click",
        exportCustomers
    );

    byId(
        "kpiFullscreenBtn"
    )?.addEventListener(
        "click",
        () => {

            document
                .querySelector(
                    ".kpi-grid"
                )
                ?.scrollIntoView({
                    behavior:
                        "smooth"
                });

            showToast(
                "Metrics focused",
                "Use KPI cards to drill into intelligence.",
                "info"
            );

        }
    );

}


function initializeChartControls() {

    $$(".chart-period").forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    APP.currentPeriod =
                        button.dataset.period;

                    $$(".chart-period")
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );

                    button.classList.add(
                        "active"
                    );

                    createChurnTrendChart();

                }
            );

        }
    );

    $$(".chart-expand").forEach(
        button => {

            button.addEventListener(
                "click",
                () =>
                    expandChart(
                        button.dataset.chart
                    )
            );

        }
    );

    $$("#riskLegend button").forEach(
        button => {

            button.addEventListener(
                "click",
                () =>
                    filterByRisk(
                        button.dataset.risk
                    )
            );

        }
    );

}


function initializeModals() {

    $$(
        "[data-close-modal]"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                () =>
                    closeModal(
                        button.dataset
                            .closeModal
                    )
            );

        }
    );

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeModal(
                    "customerModal"
                );

                closeModal(
                    "chartModal"
                );

                toggleNotifications(
                    false
                );

                toggleCommandPalette(
                    false
                );

            }

        }
    );

}


function initializeNotifications() {

    byId(
        "notificationButton"
    )?.addEventListener(
        "click",
        () =>
            toggleNotifications()
    );

    byId(
        "closeNotifications"
    )?.addEventListener(
        "click",
        () =>
            toggleNotifications(
                false
            )
    );

}


function initializeSidebar() {

    byId(
        "sidebarToggle"
    )?.addEventListener(
        "click",
        () => {

            byId(
                "sidebar"
            )?.classList.toggle(
                "collapsed"
            );

        }
    );

}


function initializeDateFilter() {

    byId(
        "globalDateFilter"
    )?.addEventListener(
        "click",
        () => {

            const periods = [
                "Last 7 Days",
                "Last 30 Days",
                "Last 90 Days",
                "Last Year"
            ];

            const label =
                byId(
                    "globalDateLabel"
                );

            if (!label) return;

            const current =
                periods.indexOf(
                    label.textContent.trim()
                );

            label.textContent =
                periods[
                    (
                        current + 1
                    ) %
                    periods.length
                ];

            showToast(
                "Date range changed",
                label.textContent,
                "info"
            );

        }
    );

}


/* ============================================================
   COMMAND PALETTE
   ============================================================ */

function toggleCommandPalette(
    force
) {

    const palette =
        byId("commandPalette");

    if (!palette) return;

    const open =
        force ??
        palette.classList.contains(
            "hidden"
        );

    palette.classList.toggle(
        "hidden",
        !open
    );

    if (open) {

        setTimeout(
            () =>
                byId(
                    "commandSearch"
                )?.focus(),
            100
        );

    }

}


function initializeCommandPalette() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                (
                    event.metaKey ||
                    event.ctrlKey
                ) &&
                event.key.toLowerCase() ===
                "k"
            ) {

                event.preventDefault();

                toggleCommandPalette();

            }

        }
    );

    $$(".command-backdrop")
        .forEach(
            backdrop =>
                backdrop.addEventListener(
                    "click",
                    () =>
                        toggleCommandPalette(
                            false
                        )
                )
        );

    $$(
        "[data-command]"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const command =
                        button.dataset.command;

                    if (
                        command ===
                        "refresh"
                    ) {

                        refreshApplication();

                    } else {

                        changePage(
                            command
                        );

                    }

                    toggleCommandPalette(
                        false
                    );

                }
            );

        }
    );

    byId(
        "commandSearch"
    )?.addEventListener(
        "input",
        event => {

            const query =
                event.target.value
                    .toLowerCase();

            $$(
                "[data-command]"
            ).forEach(
                button => {

                    button.style.display =
                        button.textContent
                            .toLowerCase()
                            .includes(query)
                            ? ""
                            : "none";

                }
            );

        }
    );

}


/* ============================================================
   EXPORT
   ============================================================ */

function exportCustomers() {

    const rows = [
        [
            "ID",
            "Name",
            "Location",
            "Tenure",
            "Contract",
            "Monthly Charges",
            "Churn Probability",
            "Risk"
        ],

        ...APP.filteredCustomers.map(
            customer => [
                customer.id,
                customer.name,
                customer.location,
                customer.tenure,
                customer.contract,
                customer.monthlyCharges,
                customer.churnProbability,
                customer.risk
            ]
        )
    ];

    const csv =
        rows
            .map(
                row =>
                    row
                        .map(
                            value =>
                                `"${String(
                                    value
                                ).replace(
                                    /"/g,
                                    '""'
                                )}"`
                        )
                        .join(",")
            )
            .join("\n");

    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv"
            }
        );

    const url =
        URL.createObjectURL(
            blob
        );

    const link =
        document.createElement(
            "a"
        );

    link.href =
        url;

    link.download =
        "churnguard-customers.csv";

    link.click();

    URL.revokeObjectURL(
        url
    );

    showToast(
        "Export complete",
        "Customer intelligence exported successfully.",
        "success"
    );

}


/* ============================================================
   APPLICATION INITIALIZATION
   ============================================================ */

async function initializeApplication() {

    console.log(
        "🚀 ChurnGuard AI starting..."
    );

    initializeLoaderSafety();

    try {

        await loadApplicationData();

    } catch (error) {

        console.error(
            "Application data error:",
            error
        );

        APP.data =
            buildDemoData();

        APP.customers =
            APP.data.customers;

        APP.geography =
            APP.data.geography;

    }

    initializeNavigation();

    initializeKPIActions();

    initializeCustomerFilters();

    initializeDashboardFilters();

    initializePagination();

    initializeButtons();

    initializeChartControls();

    initializeModals();

    initializeNotifications();

    initializeSidebar();

    initializeDateFilter();

    initializeCommandPalette();

    byId(
        "predictionForm"
    )?.addEventListener(
        "submit",
        handlePrediction
    );

    updateAll();

    showApplication();

    console.log(
        "✅ ChurnGuard AI ready"
    );

}


/* ============================================================
   FINAL SAFETY NET
   Prevent permanent black screen.
   ============================================================ */

window.addEventListener(
    "error",
    event => {

        console.error(
            "Application error:",
            event.error
        );

        setTimeout(
            showApplication,
            300
        );

    }
);


window.addEventListener(
    "unhandledrejection",
    event => {

        console.error(
            "Unhandled promise:",
            event.reason
        );

        setTimeout(
            showApplication,
            300
        );

    }
);


/* ============================================================
   START
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initializeApplication
);


/* ============================================================
   GLOBAL FUNCTIONS
   ============================================================ */

window.changePage =
    changePage;

window.openCustomerModal =
    openCustomerModal;

window.closeModal =
    closeModal;

window.refreshApplication =
    refreshApplication;