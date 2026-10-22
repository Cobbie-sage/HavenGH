"use strict";

/* ============================================================
   HavenGH - Admin Subscription Management
   Direct ASP.NET Core API connection
============================================================ */

const HAVENGH_API = "https://havenghapi-production.up.railway.app/api";

let propertySubscriptions = [];
let staySubscriptions = [];

let currentSubscriptionType = "property";

/* ============================================================
   AUTH
============================================================ */

function getToken() {
    return localStorage.getItem("havenGH_token");
}

function clearSession() {
    localStorage.removeItem("havenGH_token");
}

/* ============================================================
   API
============================================================ */

async function apiRequest(endpoint, options = {}) {

    const token = getToken();

    if (!token) {
        window.location.href = "login.html";
        return null;
    }

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    headers.Authorization = `Bearer ${token}`;

    const response = await fetch(
        `${HAVENGH_API}${endpoint}`,
        {
            ...options,
            headers
        }
    );

    if (response.status === 401) {

        clearSession();

        window.location.href = "login.html";

        return null;
    }

    if (response.status === 403) {

        alert("Administrator access is required.");

        window.location.href = "index.html";

        return null;
    }

    if (!response.ok) {

        const errorText = await response.text();

        throw new Error(
            errorText ||
            `API request failed with status ${response.status}`
        );
    }

    return await response.json();
}

/* ============================================================
   INITIALIZATION
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initializePage
);

async function initializePage() {

    if (!getToken()) {

        window.location.href = "login.html";

        return;
    }

    updateDate();

    setupSearch();
    setupStatusFilter();

    createSubscriptionControls();
    createDetailsModal();

    showLoading();

    try {

        await Promise.all([
            loadStatistics(),
            loadPropertySubscriptions(),
            loadStaySubscriptions()
        ]);

        renderPlans();
        renderSubscriptions();

    } catch (error) {

        console.error(
            "Subscription page initialization failed:",
            error
        );

        showError();

    }
}

/* ============================================================
   DATE
============================================================ */

function updateDate() {

    const element =
        document.querySelector(".dashboard-date");

    if (!element) {
        return;
    }

    const now = new Date();

    element.textContent =
        now.toLocaleDateString(
            "en-GH",
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );
}

/* ============================================================
   STATISTICS
============================================================ */

async function loadStatistics() {

    const data =
        await apiRequest(
            "/Admin/subscriptions/statistics"
        );

    if (!data) {
        return;
    }

    console.log(
        "Subscription statistics:",
        data
    );

    setText(
        "totalSubscriptionsCount",
        data.totalPropertySubscriptions ?? 0
    );

    setText(
        "activeSubscriptionsCount",
        data.activePropertySubscriptions ?? 0
    );

    setText(
        "pendingSubscriptionsCount",
        data.pendingPropertySubscriptions ?? 0
    );

    setText(
        "expiredSubscriptionsCount",
        data.expiredPropertySubscriptions ?? 0
    );

    addRevenueStatistic(
        data.totalRevenue ??
        data.totalPropertyRevenue ??
        0
    );
}

/* ============================================================
   PROPERTY SUBSCRIPTIONS
============================================================ */

async function loadPropertySubscriptions() {

    const data =
        await apiRequest(
            "/Admin/subscriptions"
        );

    if (!data) {
        return;
    }

    propertySubscriptions =
        Array.isArray(data)
            ? data
            : (
                data.items ||
                data.subscriptions ||
                []
            );

    console.log(
        "Property subscriptions:",
        propertySubscriptions
    );
}

/* ============================================================
   STAY HOST SUBSCRIPTIONS
============================================================ */

async function loadStaySubscriptions() {

    const data =
        await apiRequest(
            "/Admin/stay-subscriptions"
        );

    if (!data) {
        return;
    }

    staySubscriptions =
        Array.isArray(data)
            ? data
            : (
                data.items ||
                data.subscriptions ||
                []
            );

    console.log(
        "Stay Host subscriptions:",
        staySubscriptions
    );
}

/* ============================================================
   REVENUE STATISTIC
============================================================ */

function addRevenueStatistic(value) {

    const stats =
        document.querySelector(
            ".dashboard-stats"
        );

    if (!stats) {
        return;
    }

    if (
        document.getElementById(
            "subscriptionRevenueCard"
        )
    ) {
        setText(
            "subscriptionRevenueCount",
            `GH₵${formatMoney(value)}`
        );

        return;
    }

    const card =
        document.createElement("div");

    card.className = "stat-card";

    card.id =
        "subscriptionRevenueCard";

    card.innerHTML = `
        <div class="stat-icon">
            GH₵
        </div>

        <div>

            <span>
                Subscription Revenue
            </span>

            <strong id="subscriptionRevenueCount">
                GH₵${formatMoney(value)}
            </strong>

            <small>
                Successful subscription payments
            </small>

        </div>
    `;

    stats.appendChild(card);
}

/* ============================================================
   PLAN CONTROLS
============================================================ */

function createSubscriptionControls() {

    const plansPanel =
        findPlansPanel();

    if (!plansPanel) {
        return;
    }

    const heading =
        plansPanel.querySelector(
            ".panel-heading"
        );

    if (!heading) {
        return;
    }

    if (
        document.getElementById(
            "subscription-type-tabs"
        )
    ) {
        return;
    }

    const controls =
        document.createElement("div");

    controls.id =
        "subscription-type-tabs";

    controls.style.cssText = `
        display:flex;
        gap:10px;
        flex-wrap:wrap;
        margin-top:20px;
    `;

    controls.innerHTML = `
        <button
            type="button"
            class="subscription-type-button active"
            data-type="property">
            Property Subscriptions
        </button>

        <button
            type="button"
            class="subscription-type-button"
            data-type="stay">
            Stay Host Subscriptions
        </button>
    `;

    heading.parentNode.appendChild(
        controls
    );

    controls
        .querySelectorAll(
            ".subscription-type-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    currentSubscriptionType =
                        button.dataset.type;

                    controls
                        .querySelectorAll(
                            ".subscription-type-button"
                        )
                        .forEach(item =>
                            item.classList.remove(
                                "active"
                            )
                        );

                    button.classList.add(
                        "active"
                    );

                    renderPlans();
                    renderSubscriptions();
                }
            );

        });
}

/* ============================================================
   FIND PLANS PANEL
============================================================ */

function findPlansPanel() {

    const panels =
        document.querySelectorAll(
            ".dashboard-panel"
        );

    for (const panel of panels) {

        const heading =
            panel.querySelector("h2");

        if (
            heading &&
            heading.textContent
                .trim()
                .toLowerCase()
                .includes("available plans")
        ) {
            return panel;
        }
    }

    return null;
}

/* ============================================================
   RENDER PLANS
============================================================ */

function renderPlans() {

    const panel =
        findPlansPanel();

    if (!panel) {
        return;
    }

    const grid =
        panel.querySelector(
            ".dashboard-grid"
        );

    if (!grid) {
        return;
    }

    if (
        currentSubscriptionType ===
        "property"
    ) {

        grid.innerHTML = `
            ${renderPlanCard(
                "Free",
                0,
                "2 active property listings",
                "For landlords and agents getting started."
            )}

            ${renderPlanCard(
                "Standard",
                50,
                "10 active property listings",
                "For landlords and agents managing more listings."
            )}

            ${renderPlanCard(
                "Business",
                100,
                "30 active property listings",
                "For larger property portfolios."
            )}
        `;

    } else {

        grid.innerHTML = `
            ${renderPlanCard(
                "Starter",
                0,
                "Stay Host membership",
                "Entry-level Stay in Ghana hosting."
            )}

            ${renderPlanCard(
                "Professional",
                150,
                "Stay Host membership",
                "For professional Stay in Ghana hosts."
            )}

            ${renderPlanCard(
                "Premium",
                300,
                "Stay Host membership",
                "For premium Stay in Ghana hosts."
            )}
        `;
    }
}

/* ============================================================
   PLAN CARD
============================================================ */

function renderPlanCard(
    name,
    price,
    limit,
    description
) {

    return `
        <div class="request-item">

            <div>

                <span class="section-label">
                    ${price === 0 ? "FREE" : "PAID"}
                </span>

                <h3>
                    ${escapeHtml(name)}
                </h3>

                <p>
                    ${escapeHtml(description)}
                </p>

                <strong>
                    GH₵${formatMoney(price)}
                    / month
                </strong>

                <small>
                    ${escapeHtml(limit)}
                </small>

            </div>

        </div>
    `;
}

/* ============================================================
   RENDER SUBSCRIPTIONS
============================================================ */

function renderSubscriptions() {

    const container =
        document.getElementById(
            "subscription-list"
        );

    if (!container) {
        return;
    }

    const search =
        (
            document.getElementById(
                "subscription-search"
            )?.value || ""
        )
        .trim()
        .toLowerCase();

    const status =
        (
            document.getElementById(
                "subscription-status"
            )?.value || "all"
        )
        .toLowerCase();

    let records =
        currentSubscriptionType === "property"
            ? propertySubscriptions
            : staySubscriptions;

    records =
        records.filter(subscription => {

            const user =
                subscription.user || {};

            const plan =
                currentSubscriptionType === "property"
                    ? (
                        subscription.plan || {}
                    )
                    : (
                        subscription.stayPlan || {}
                    );

            const subscriptionStatus =
                String(
                    subscription.status || ""
                ).toLowerCase();

            const text = [

                user.userId,
                user.email,
                user.phone,
                user.role,

                plan.planName,
                plan.name,

                subscriptionStatus,

                subscription.externalReference

            ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

            const matchesSearch =
                !search ||
                text.includes(search);

            const matchesStatus =
                status === "all" ||
                subscriptionStatus === status;

            return (
                matchesSearch &&
                matchesStatus
            );
        });

    if (!records.length) {

        container.innerHTML = `
            <div class="request-item">

                <div>

                    <h3>
                        No subscriptions found
                    </h3>

                    <p>
                        No ${currentSubscriptionType === "property"
                            ? "property"
                            : "Stay Host"} subscriptions
                        match the current filters.
                    </p>

                </div>

            </div>
        `;

        return;
    }

    container.innerHTML =
        records
            .map(renderSubscriptionCard)
            .join("");

    container
        .querySelectorAll(
            "[data-subscription-id]"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const id =
                        card.dataset.subscriptionId;

                    openSubscriptionDetails(
                        id
                    );
                }
            );

            card.style.cursor =
                "pointer";

        });
}

/* ============================================================
   SUBSCRIPTION CARD
============================================================ */

function renderSubscriptionCard(
    subscription
) {

    const isStay =
        currentSubscriptionType === "stay";

    const user =
        subscription.user || {};

    const plan =
        isStay
            ? (
                subscription.stayPlan || {}
            )
            : (
                subscription.plan || {}
            );

    const id =
        isStay
            ? subscription.staySubscriptionId
            : subscription.subscriptionId;

    const status =
        String(
            subscription.status || "unknown"
        );

    const statusClass =
        status.toLowerCase();

    const userLabel =
        user.email ||
        user.phone ||
        `User #${user.userId ?? "—"}`;

    const planName =
        plan.planName ||
        plan.name ||
        "Unknown Plan";

    const price =
        Number(
            plan.price || 0
        );

    return `
        <article
            class="request-item subscription-record"
            data-subscription-id="${escapeHtml(id)}"
        >

            <div>

                <span class="section-label">
                    ${isStay
                        ? "STAY HOST"
                        : "PROPERTY"}
                </span>

                <h3>
                    ${escapeHtml(planName)}
                </h3>

                <p>
                    ${escapeHtml(userLabel)}
                </p>

                <small>
                    ${escapeHtml(
                        user.role || "User"
                    )}
                    · GH₵${formatMoney(price)}
                </small>

                <small>
                    Started:
                    ${escapeHtml(
                        formatDate(
                            subscription.startsAt
                        )
                    )}
                </small>

                <small>
                    Ends:
                    ${escapeHtml(
                        formatDate(
                            subscription.endsAt
                        )
                    )}
                </small>

            </div>

            <div>

                <strong
                    class="subscription-status ${escapeHtml(statusClass)}"
                >
                    ${escapeHtml(
                        capitalize(status)
                    )}
                </strong>

                <small>
                    View details →
                </small>

            </div>

        </article>
    `;
}

/* ============================================================
   DETAILS MODAL
============================================================ */

function createDetailsModal() {

    if (
        document.getElementById(
            "subscriptionDetailsModal"
        )
    ) {
        return;
    }

    const modal =
        document.createElement("div");

    modal.id =
        "subscriptionDetailsModal";

    modal.style.cssText = `
        position:fixed;
        inset:0;
        display:none;
        align-items:center;
        justify-content:center;
        padding:20px;
        background:rgba(0,0,0,.65);
        z-index:9999;
    `;

    modal.innerHTML = `
        <div
            id="subscriptionDetailsBox"
            style="
                width:min(720px,100%);
                max-height:90vh;
                overflow:auto;
                background:#fff;
                border-radius:16px;
                padding:28px;
                position:relative;
            "
        >

            <button
                type="button"
                id="closeSubscriptionModal"
                style="
                    position:absolute;
                    top:14px;
                    right:16px;
                    border:0;
                    background:none;
                    font-size:26px;
                    cursor:pointer;
                "
                aria-label="Close">
                ×
            </button>

            <div
                id="subscriptionDetailsContent">
                Loading...
            </div>

        </div>
    `;

    document.body.appendChild(modal);

    document
        .getElementById(
            "closeSubscriptionModal"
        )
        .addEventListener(
            "click",
            closeSubscriptionDetails
        );

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {
                closeSubscriptionDetails();
            }
        }
    );
}

/* ============================================================
   OPEN DETAILS
============================================================ */

async function openSubscriptionDetails(id) {

    const modal =
        document.getElementById(
            "subscriptionDetailsModal"
        );

    const content =
        document.getElementById(
            "subscriptionDetailsContent"
        );

    if (!modal || !content) {
        return;
    }

    modal.style.display =
        "flex";

    content.innerHTML = `
        <h2>
            Subscription Details
        </h2>

        <p>
            Loading subscription information...
        </p>
    `;

    try {

        const endpoint =
            currentSubscriptionType === "property"
                ? `/Admin/subscriptions/${encodeURIComponent(id)}`
                : `/Admin/stay-subscriptions/${encodeURIComponent(id)}`;

        const subscription =
            await apiRequest(endpoint);

        if (!subscription) {
            return;
        }

        renderSubscriptionDetails(
            subscription
        );

    } catch (error) {

        console.error(
            "Failed to load subscription details:",
            error
        );

        content.innerHTML = `
            <h2>
                Unable to load details
            </h2>

            <p>
                The subscription details could not
                be retrieved from the API.
            </p>
        `;
    }
}

/* ============================================================
   RENDER DETAILS
============================================================ */

function renderSubscriptionDetails(
    subscription
) {

    const content =
        document.getElementById(
            "subscriptionDetailsContent"
        );

    if (!content) {
        return;
    }

    const isStay =
        currentSubscriptionType === "stay";

    const user =
        subscription.user || {};

    const plan =
        isStay
            ? (
                subscription.stayPlan || {}
            )
            : (
                subscription.plan || {}
            );

    const status =
        subscription.status || "unknown";

    let paymentHtml = "";

    if (
        isStay &&
        Array.isArray(
            subscription.payments
        )
    ) {

        paymentHtml = `
            <hr>

            <h3>
                Payment History
            </h3>

            ${
                subscription.payments.length
                    ? subscription.payments
                        .map(payment => `
                            <div
                                class="request-item"
                                style="margin-top:10px;"
                            >

                                <div>

                                    <strong>
                                        GH₵${formatMoney(
                                            payment.amount
                                        )}
                                    </strong>

                                    <small>
                                        ${escapeHtml(
                                            payment.provider
                                        )}
                                    </small>

                                    <small>
                                        Reference:
                                        ${escapeHtml(
                                            payment.providerReference
                                        )}
                                    </small>

                                    <small>
                                        Status:
                                        ${escapeHtml(
                                            payment.status
                                        )}
                                    </small>

                                    <small>
                                        Paid:
                                        ${escapeHtml(
                                            formatDate(
                                                payment.paidAt
                                            )
                                        )}
                                    </small>

                                </div>

                            </div>
                        `)
                        .join("")
                    : `
                        <p>
                            No payment records found.
                        </p>
                    `
            }
        `;
    }

    content.innerHTML = `
        <span class="section-label">
            ${isStay
                ? "STAY HOST"
                : "PROPERTY"}
        </span>

        <h2>
            ${escapeHtml(
                plan.planName ||
                plan.name ||
                "Subscription"
            )}
        </h2>

        <p>
            <strong>Status:</strong>
            ${escapeHtml(
                capitalize(status)
            )}
        </p>

        <hr>

        <h3>
            User
        </h3>

        <p>
            <strong>User ID:</strong>
            ${escapeHtml(
                user.userId ?? "—"
            )}
        </p>

        <p>
            <strong>Email:</strong>
            ${escapeHtml(
                user.email || "—"
            )}
        </p>

        <p>
            <strong>Phone:</strong>
            ${escapeHtml(
                user.phone || "—"
            )}
        </p>

        <p>
            <strong>Role:</strong>
            ${escapeHtml(
                user.role || "—"
            )}
        </p>

        <hr>

        <h3>
            Plan
        </h3>

        <p>
            <strong>Plan:</strong>
            ${escapeHtml(
                plan.planName ||
                plan.name ||
                "—"
            )}
        </p>

        <p>
            <strong>Price:</strong>
            GH₵${formatMoney(
                plan.price
            )}
        </p>

        <p>
            <strong>Billing:</strong>
            ${escapeHtml(
                plan.billingPeriod ||
                "—"
            )}
        </p>

        ${
            plan.listingLimit !== undefined
                ? `
                    <p>
                        <strong>Listing limit:</strong>
                        ${escapeHtml(
                            plan.listingLimit
                        )}
                    </p>
                `
                : ""
        }

        <hr>

        <h3>
            Subscription
        </h3>

        <p>
            <strong>Started:</strong>
            ${escapeHtml(
                formatDate(
                    subscription.startsAt
                )
            )}
        </p>

        <p>
            <strong>Ends:</strong>
            ${escapeHtml(
                formatDate(
                    subscription.endsAt
                )
            )}
        </p>

        <p>
            <strong>External reference:</strong>
            ${escapeHtml(
                subscription.externalReference ||
                "—"
            )}
        </p>

        <p>
            <strong>Created:</strong>
            ${escapeHtml(
                formatDate(
                    subscription.createdAt
                )
            )}
        </p>

        ${paymentHtml}
    `;
}

/* ============================================================
   CLOSE DETAILS
============================================================ */

function closeSubscriptionDetails() {

    const modal =
        document.getElementById(
            "subscriptionDetailsModal"
        );

    if (modal) {
        modal.style.display =
            "none";
    }
}

/* ============================================================
   SEARCH
============================================================ */

function setupSearch() {

    const input =
        document.getElementById(
            "subscription-search"
        );

    if (!input) {
        return;
    }

    input.addEventListener(
        "input",
        debounce(
            renderSubscriptions,
            150
        )
    );
}

/* ============================================================
   FILTER
============================================================ */

function setupStatusFilter() {

    const filter =
        document.getElementById(
            "subscription-status"
        );

    if (!filter) {
        return;
    }

    filter.addEventListener(
        "change",
        renderSubscriptions
    );
}

/* ============================================================
   LOADING
============================================================ */

function showLoading() {

    const container =
        document.getElementById(
            "subscription-list"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="request-item">

            <div>

                <h3>
                    Loading subscriptions...
                </h3>

                <p>
                    Retrieving subscription data
                    from the HavenGH API.
                </p>

            </div>

        </div>
    `;
}

/* ============================================================
   ERROR
============================================================ */

function showError() {

    const container =
        document.getElementById(
            "subscription-list"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="request-item">

            <div>

                <h3>
                    Unable to load subscriptions
                </h3>

                <p>
                    HavenGH could not retrieve
                    subscription information.
                </p>

                <small>
                    Confirm that the API is running
                    and that you are logged in as Admin.
                </small>

            </div>

        </div>
    `;
}

/* ============================================================
   HELPERS
============================================================ */

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value;
    }
}

function formatMoney(value) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-GH",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}

function formatDate(value) {

    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "—";
    }

    return date.toLocaleDateString(
        "en-GH",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

function capitalize(value) {

    if (!value) {
        return "";
    }

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );
}

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function debounce(
    callback,
    delay
) {

    let timeout;

    return function () {

        clearTimeout(timeout);

        timeout =
            setTimeout(
                callback,
                delay
            );
    };
}