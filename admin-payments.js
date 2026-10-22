
"use strict";

/* ============================================================
   HavenGH - Admin Payments
   Direct ASP.NET Core API connection
   ============================================================ */

let allPayments = [];
const API_BASE_URL = "https://havenghapi-production.up.railway.app";

/* ============================================================
   DOM
   ============================================================ */

const totalPaymentsCount =
    document.getElementById("totalPaymentsCount");

const completedPaymentsCount =
    document.getElementById("completedPaymentsCount");

const pendingPaymentsCount =
    document.getElementById("pendingPaymentsCount");

const failedPaymentsCount =
    document.getElementById("failedPaymentsCount");

const paymentList =
    document.getElementById("payment-list");

const paymentSearch =
    document.getElementById("payment-search");


/* ============================================================
   TOKEN
   ============================================================ */

function getToken() {

    return (
        sessionStorage.getItem("havenGH_token") ||
        localStorage.getItem("havenGH_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        ""
    );
}


/* ============================================================
   CLEAR SESSION
   ============================================================ */

function clearAuthentication() {

    sessionStorage.removeItem("havenGH_token");
    localStorage.removeItem("havenGH_token");

    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
}


/* ============================================================
   REDIRECT TO LOGIN
   ============================================================ */

function redirectToLogin() {

    clearAuthentication();

    window.location.replace("login.html");
}


/* ============================================================
   API REQUEST
   ============================================================ */

async function apiRequest(endpoint, options = {}) {

    const token = getToken();

    if (!token) {

        redirectToLogin();

        throw new Error(
            "Authentication required."
        );
    }


    const url =
        `${API_BASE_URL}${endpoint}`;


    console.log(
        "HavenGH API request:",
        url
    );


    const headers = {

        "Content-Type": "application/json",

        ...(options.headers || {}),

        "Authorization":
            `Bearer ${token}`
    };


    const response = await fetch(
        url,
        {
            ...options,
            headers
        }
    );


    console.log(
        "HavenGH API response:",
        response.status,
        response.url
    );


    /* --------------------------------------------------------
       SESSION EXPIRED
       -------------------------------------------------------- */

    if (response.status === 401) {

        redirectToLogin();

        throw new Error(
            "Your session has expired."
        );
    }


    /* --------------------------------------------------------
       FORBIDDEN
       -------------------------------------------------------- */

    if (response.status === 403) {

        paymentList.innerHTML = `
            <div class="request-item">

                <div>

                    <h3>Access denied</h3>

                    <p>
                        You do not have administrator
                        permission to view payment records.
                    </p>

                </div>

            </div>
        `;

        throw new Error(
            "Administrator access required."
        );
    }


    /* --------------------------------------------------------
       OTHER ERRORS
       -------------------------------------------------------- */

    if (!response.ok) {

        let message =
            "Unable to load payment information.";

        try {

            const data =
                await response.json();

            if (data?.message) {
                message = data.message;
            }

        } catch {
            // Ignore invalid JSON response.
        }

        throw new Error(message);
    }


    return response.json();
}


/* ============================================================
   LOAD PAYMENTS
   ============================================================ */

async function loadPayments() {

    if (!paymentList) {
        console.error(
            "HavenGH: payment-list element was not found."
        );
        return;
    }


    paymentList.innerHTML = `
        <div class="request-item">

            <div>

                <h3>Loading payments...</h3>

                <p>
                    Connecting to HavenGH payment records.
                </p>

            </div>

        </div>
    `;


    try {

        const data = await apiRequest("/api/admin");


        console.log(
            "HavenGH payment data:",
            data
        );


        allPayments =
            Array.isArray(data?.payments)
                ? data.payments
                : [];


        updateStatistics(
            data?.statistics
        );


        renderPayments(
            allPayments
        );


    } catch (error) {

        console.error(
            "Failed to load admin payments:",
            error
        );


        if (
            error.message ===
            "Administrator access required."
        ) {
            return;
        }


        paymentList.innerHTML = `
            <div class="request-item">

                <div>

                    <h3>Unable to load payments</h3>

                    <p>
                        ${escapeHtml(
                            error.message ||
                            "An unexpected error occurred."
                        )}
                    </p>

                    <small>
                        Please refresh the page and try again.
                    </small>

                </div>

            </div>
        `;
    }
}


/* ============================================================
   STATISTICS
   ============================================================ */

function updateStatistics(statistics) {

    if (totalPaymentsCount) {

        totalPaymentsCount.textContent =
            statistics?.totalPayments ?? 0;
    }


    if (completedPaymentsCount) {

        completedPaymentsCount.textContent =
            statistics?.completedPayments ?? 0;
    }


    if (pendingPaymentsCount) {

        pendingPaymentsCount.textContent =
            statistics?.pendingPayments ?? 0;
    }


    if (failedPaymentsCount) {

        failedPaymentsCount.textContent =
            statistics?.failedPayments ?? 0;
    }
}


/* ============================================================
   RENDER PAYMENTS
   ============================================================ */

function renderPayments(payments) {

    if (!paymentList) {
        return;
    }


    if (!payments.length) {

        paymentList.innerHTML = `
            <div class="request-item">

                <div>

                    <h3>No payment records yet</h3>

                    <p>
                        Payment transactions will appear
                        here when customers make payments.
                    </p>

                    <small>
                        The HavenGH payment API is connected.
                    </small>

                </div>

            </div>
        `;

        return;
    }


    paymentList.innerHTML =
        payments
            .map(
                payment =>
                    createPaymentCard(payment)
            )
            .join("");
}


/* ============================================================
   PAYMENT CARD
   ============================================================ */

function createPaymentCard(payment) {

    const status =
        String(
            payment.status || "unknown"
        ).toLowerCase();


    const statusLabel =
        formatStatus(status);


    const statusClass =
        getStatusClass(status);


    const amount =
        formatCurrency(
            payment.amount,
            payment.currency
        );


    const createdAt =
        formatDate(
            payment.createdAt
        );


    const paidAt =
        payment.paidAt
            ? formatDate(payment.paidAt)
            : "Not paid";


    const provider =
        payment.provider ||
        "—";


    const reference =
        payment.providerReference ||
        "—";


    const planName =
        payment.planName ||
        `Plan #${payment.planId}`;


    return `
        <div
            class="request-item payment-record"
            data-payment-id="${escapeHtml(payment.paymentId)}"
        >

            <div class="payment-record-main">

                <div class="payment-record-header">

                    <div>

                        <h3>
                            Payment #${escapeHtml(
                                payment.paymentId
                            )}
                        </h3>

                        <p>
                            ${escapeHtml(planName)}
                        </p>

                    </div>


                    <span
                        class="payment-status ${statusClass}"
                    >
                        ${statusLabel}
                    </span>

                </div>


                <div class="payment-record-details">

                    <div>

                        <small>User</small>

                        <strong>
                            User #${escapeHtml(
                                payment.userId
                            )}
                        </strong>

                    </div>


                    <div>

                        <small>Amount</small>

                        <strong>
                            ${amount}
                        </strong>

                    </div>


                    <div>

                        <small>Provider</small>

                        <strong>
                            ${escapeHtml(provider)}
                        </strong>

                    </div>


                    <div>

                        <small>Reference</small>

                        <strong>
                            ${escapeHtml(reference)}
                        </strong>

                    </div>


                    <div>

                        <small>Created</small>

                        <strong>
                            ${createdAt}
                        </strong>

                    </div>


                    <div>

                        <small>Paid</small>

                        <strong>
                            ${paidAt}
                        </strong>

                    </div>

                </div>

            </div>

        </div>
    `;
}


/* ============================================================
   SEARCH
   ============================================================ */

function setupPaymentSearch() {

    if (!paymentSearch) {
        return;
    }


    paymentSearch.addEventListener(
        "input",
        () => {

            const query =
                paymentSearch.value
                    .trim()
                    .toLowerCase();


            if (!query) {

                renderPayments(
                    allPayments
                );

                return;
            }


            const filtered =
                allPayments.filter(
                    payment => {

                        const searchableText =
                            [

                                payment.paymentId,

                                payment.userId,

                                payment.planId,

                                payment.planName,

                                payment.subscriptionId,

                                payment.amount,

                                payment.currency,

                                payment.provider,

                                payment.providerReference,

                                payment.status

                            ]
                                .filter(
                                    value =>
                                        value !== null &&
                                        value !== undefined
                                )
                                .join(" ")
                                .toLowerCase();


                        return searchableText
                            .includes(query);
                    }
                );


            renderPayments(
                filtered
            );
        }
    );
}


/* ============================================================
   FORMAT STATUS
   ============================================================ */

function formatStatus(status) {

    switch (status) {

        case "successful":
        case "paid":
            return "Completed";

        case "pending":
            return "Pending";

        case "failed":
            return "Failed";

        default:
            return capitalize(status);
    }
}


/* ============================================================
   STATUS CLASS
   ============================================================ */

function getStatusClass(status) {

    switch (status) {

        case "successful":
        case "paid":
            return "status-success";

        case "pending":
            return "status-pending";

        case "failed":
            return "status-failed";

        default:
            return "status-neutral";
    }
}


/* ============================================================
   FORMAT CURRENCY
   ============================================================ */

function formatCurrency(amount, currency) {

    const numericAmount =
        Number(amount);


    if (!Number.isFinite(numericAmount)) {
        return "—";
    }


    const currencyCode =
        currency || "GHS";


    try {

        return new Intl.NumberFormat(
            "en-GH",
            {
                style: "currency",
                currency: currencyCode,
                minimumFractionDigits: 2
            }
        ).format(numericAmount);

    } catch {

        return `${currencyCode} ${numericAmount.toFixed(2)}`;
    }
}


/* ============================================================
   FORMAT DATE
   ============================================================ */

function formatDate(value) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(value);


    if (Number.isNaN(date.getTime())) {
        return "—";
    }


    return new Intl.DateTimeFormat(
        "en-GH",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    ).format(date);
}


/* ============================================================
   CAPITALIZE
   ============================================================ */

function capitalize(value) {

    if (!value) {
        return "Unknown";
    }


    return value.charAt(0).toUpperCase() +
        value.slice(1);
}


/* ============================================================
   HTML ESCAPE
   ============================================================ */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* ============================================================
   INITIALIZE
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupPaymentSearch();

        loadPayments();

    }
);

