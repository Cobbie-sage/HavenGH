"use strict";

/* ============================================================
HavenGH - Tenant Dashboard
Real API Connection
============================================================ */

const API_BASE_URL = "http://localhost:5073";

/* ============================================================
API ENDPOINTS
============================================================ */

const PROPERTIES_API =
`${API_BASE_URL}/api/Properties`;

const SAVED_PROPERTIES_API =
`${API_BASE_URL}/api/SavedProperties`;

const RENTAL_REQUESTS_API =
`${API_BASE_URL}/api/RentalRequests`;

const MESSAGES_API =
`${API_BASE_URL}/api/Messages/conversations`;

/* ============================================================
AUTHENTICATION
============================================================ */

const TOKEN_KEY = "havenGH_token";

function getToken() {


return localStorage.getItem(TOKEN_KEY);


}

/* ============================================================
INITIALIZE
============================================================ */

document.addEventListener(
"DOMContentLoaded",
() => {

    setupMobileMenu();

    setupLogout();

    loadTenantDashboard();

}
);

/* ============================================================
LOAD TENANT DASHBOARD
============================================================ */

async function loadTenantDashboard() {


console.log(
    "HavenGH Tenant Dashboard loading..."
);


const token = getToken();


/* --------------------------------------------------------
   Make sure the tenant is authenticated.
-------------------------------------------------------- */

if (!token) {

    console.warn(
        "No HavenGH authentication token found."
    );

    redirectToLogin();

    return;

}


try {

    /*
        Load the tenant's dashboard data.

        These endpoints are protected by JWT
        authentication.
    */

    const [
        savedProperties,
        rentalRequests,
        conversations
    ] = await Promise.all([

        fetchSavedProperties(token),

        fetchRentalRequests(token),

        fetchConversations(token)

    ]);


    console.log(
        "HavenGH tenant dashboard API connected successfully."
    );


    console.log(
        "Saved properties:",
        savedProperties.length
    );


    console.log(
        "Rental requests:",
        rentalRequests.length
    );


    console.log(
        "Conversations:",
        conversations.length
    );


    /* ----------------------------------------------------
       UPDATE DASHBOARD
    ---------------------------------------------------- */

    updateSavedPropertiesCount(
        savedProperties.length
    );


    updateRentalRequestsCount(
        rentalRequests
    );


    updateMessagesCount(
        conversations
    );


    renderRecentRequests(
        rentalRequests
    );


}
catch (error) {

    console.error(
        "HavenGH Tenant Dashboard API error:",
        error
    );


    /*
        If the JWT has expired or is invalid,
        the API will normally return 401.
    */

    if (
        error.message ===
        "AUTHENTICATION_REQUIRED"
    ) {

        localStorage.removeItem(
            TOKEN_KEY
        );

        redirectToLogin();

        return;

    }


    showDashboardError(
        error.message ||
        "Unable to load your dashboard."
    );

}


}

/* ============================================================
SAVED PROPERTIES
============================================================ */

async function fetchSavedProperties(token) {


const response =
    await fetch(
        SAVED_PROPERTIES_API,
        {
            method: "GET",

            headers: {
                "Accept":
                    "application/json",

                "Authorization":
                    `Bearer ${token}`
            }
        }
    );


if (response.status === 401) {

    throw new Error(
        "AUTHENTICATION_REQUIRED"
    );

}


if (!response.ok) {

    throw new Error(
        `Saved properties request failed (${response.status}).`
    );

}


const data =
    await response.json();


if (!Array.isArray(data)) {

    throw new Error(
        "Invalid saved properties response."
    );

}


return data;


}

/* ============================================================
RENTAL REQUESTS
============================================================ */

async function fetchRentalRequests(token) {


const response =
    await fetch(
        RENTAL_REQUESTS_API,
        {
            method: "GET",

            headers: {
                "Accept":
                    "application/json",

                "Authorization":
                    `Bearer ${token}`
            }
        }
    );


if (response.status === 401) {

    throw new Error(
        "AUTHENTICATION_REQUIRED"
    );

}


if (!response.ok) {

    throw new Error(
        `Rental requests request failed (${response.status}).`
    );

}


const data =
    await response.json();


if (!Array.isArray(data)) {

    throw new Error(
        "Invalid rental requests response."
    );

}


return data;


}

/* ============================================================
CONVERSATIONS / MESSAGES
============================================================ */

async function fetchConversations(token) {


const response =
    await fetch(
        MESSAGES_API,
        {
            method: "GET",

            headers: {
                "Accept":
                    "application/json",

                "Authorization":
                    `Bearer ${token}`
            }
        }
    );


if (response.status === 401) {

    throw new Error(
        "AUTHENTICATION_REQUIRED"
    );

}


if (!response.ok) {

    throw new Error(
        `Messages request failed (${response.status}).`
    );

}


const data =
    await response.json();


if (!Array.isArray(data)) {

    throw new Error(
        "Invalid conversations response."
    );

}


return data;


}

/* ============================================================
SAVED PROPERTY COUNT
============================================================ */

function updateSavedPropertiesCount(count) {


const statCards =
    document.querySelectorAll(
        ".dashboard-stat-card"
    );


if (!statCards[0]) {
    return;
}


const number =
    statCards[0].querySelector(
        ".stat-number"
    );


const description =
    statCards[0].querySelector(
        ".stat-description"
    );


if (number) {

    number.textContent =
        count;

}


if (description) {

    description.textContent =
        count === 1
            ? "Property saved"
            : "Properties saved";

}


}

/* ============================================================
RENTAL REQUEST COUNT
============================================================ */

function updateRentalRequestsCount(
rentalRequests
) {


const statCards =
    document.querySelectorAll(
        ".dashboard-stat-card"
    );


if (!statCards[1]) {
    return;
}


/*
    Active requests means requests that are
    currently pending or approved.

    Cancelled, rejected and completed
    requests are not counted as active.
*/

const activeRequests =
    rentalRequests.filter(
        request => {

            const status =
                String(
                    request.status ??
                    request.Status ??
                    ""
                )
                .trim()
                .toLowerCase();


            return (
                status === "pending" ||
                status === "approved"
            );

        }
    );


const number =
    statCards[1].querySelector(
        ".stat-number"
    );


const description =
    statCards[1].querySelector(
        ".stat-description"
    );


if (number) {

    number.textContent =
        activeRequests.length;

}


if (description) {

    description.textContent =
        activeRequests.length === 1
            ? "Rental request"
            : "Rental requests";

}


}

/* ============================================================
MESSAGE COUNT
============================================================ */

function updateMessagesCount(
conversations
) {


const statCards =
    document.querySelectorAll(
        ".dashboard-stat-card"
    );


if (!statCards[2]) {
    return;
}


const number =
    statCards[2].querySelector(
        ".stat-number"
    );


const description =
    statCards[2].querySelector(
        ".stat-description"
    );


/*
    Show the number of conversations.

    The Messages API also returns unreadCount,
    which we can use later for a separate
    unread-message indicator.
*/

if (number) {

    number.textContent =
        conversations.length;

}


if (description) {

    description.textContent =
        conversations.length === 1
            ? "Conversation"
            : "Conversations";

}


}

/* ============================================================
RECENT RENTAL REQUESTS
============================================================ */

function renderRecentRequests(
rentalRequests
) {


const emptyState =
    document.querySelector(
        ".dashboard-empty-state"
    );


if (!emptyState) {
    return;
}


/*
    Sort newest first.
*/

const requests =
    [...rentalRequests]
        .sort(
            (a, b) =>
                getRequestDate(b) -
                getRequestDate(a)
        )
        .slice(0, 3);


/* --------------------------------------------------------
   No requests
-------------------------------------------------------- */

if (requests.length === 0) {

    emptyState.innerHTML = `

        <div class="empty-state-icon">
            ▣
        </div>

        <h3>
            No rental requests yet
        </h3>

        <p>
            When you request a property, your requests
            and their status will appear here.
        </p>

        <a
            href="properties.html"
            class="btn btn-dark">

            Find a Property

        </a>

    `;

    return;

}


/* --------------------------------------------------------
   Create recent request container
-------------------------------------------------------- */

const container =
    document.createElement("div");

container.className =
    "dashboard-recent-requests";


requests.forEach(
    request => {

        container.appendChild(
            createRequestCard(request)
        );

    }
);


/*
    Replace the old empty state.
*/

emptyState.replaceWith(
    container
);


}

/* ============================================================
CREATE REQUEST CARD
============================================================ */

function createRequestCard(request) {


const card =
    document.createElement("article");

card.className =
    "dashboard-request-card";


const propertyId =
    request.propertyId ??
    request.PropertyId;


const status =
    String(
        request.status ??
        request.Status ??
        "pending"
    )
    .trim()
    .toLowerCase();


const message =
    request.message ??
    request.Message ??
    "";


const createdAt =
    request.createdAt ??
    request.CreatedAt;


const title =
    request.propertyTitle ??
    request.PropertyTitle ??
    `Property #${propertyId ?? ""}`;


const statusLabel =
    capitalize(status);


card.innerHTML = `

    <div class="dashboard-request-card-content">

        <div>

            <span class="dashboard-label">
                RENTAL REQUEST
            </span>

            <h3>
                ${escapeHtml(title)}
            </h3>

            <p>
                ${escapeHtml(
                    truncateText(message, 100)
                )}
            </p>

            <small>
                ${formatRequestDate(createdAt)}
            </small>

        </div>

        <span class="
            dashboard-request-status
            status-${escapeHtml(status)}
        ">
            ${escapeHtml(statusLabel)}
        </span>

    </div>

    <div class="dashboard-request-card-footer">

        ${
            propertyId
                ? `
                    <a
                        href="property-details.html?id=${encodeURIComponent(propertyId)}"
                        class="btn btn-dark">
                        View Property
                    </a>
                  `
                : ""
        }

        <a
            href="tenant-request.html"
            class="section-link">
            View Requests →
        </a>

    </div>

`;


return card;


}

/* ============================================================
REQUEST DATE
============================================================ */

function getRequestDate(request) {


const value =
    request.createdAt ??
    request.CreatedAt;


const date =
    new Date(value);


return Number.isNaN(
    date.getTime()
)
    ? 0
    : date.getTime();


}

function formatRequestDate(value) {


if (!value) {
    return "";
}


const date =
    new Date(value);


if (
    Number.isNaN(
        date.getTime()
    )
) {

    return "";

}


return date.toLocaleDateString(
    "en-GH",
    {
        day: "numeric",
        month: "short",
        year: "numeric"
    }
);


}

/* ============================================================
TEXT HELPERS
============================================================ */

function truncateText(
text,
maxLength
) {


if (!text) {
    return "";

}


text =
    String(text);


if (
    text.length <=
    maxLength
) {

    return text;

}


return (
    text.substring(
        0,
        maxLength
    )
    .trim() +
    "..."
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

/*
Escape API data before inserting it
into HTML.


This prevents property/request text
from becoming executable HTML.
```

*/

function escapeHtml(value) {


return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");


}

/* ============================================================
DASHBOARD ERROR
============================================================ */

function showDashboardError(message) {


console.error(
    "Dashboard error:",
    message
);


const heading =
    document.querySelector(
        ".dashboard-header h1"
    );


if (heading) {

    heading.insertAdjacentHTML(
        "afterend",
        `
        <p
            class="dashboard-api-error"
            role="alert">
            ${escapeHtml(message)}
        </p>
        `
    );

}


}
/* ============================================================
   LOGOUT
============================================================ */

function setupLogout() {

    const logoutButton =
        document.querySelector(
            '[data-action="logout"]'
        );

    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener(
        "click",
        function (event) {

            /*
                Stop the normal href navigation temporarily
                so the token is removed first.
            */
            event.preventDefault();

            /*
                Remove the main HavenGH authentication token.
            */
            localStorage.removeItem(
                "havenGH_token"
            );

            /*
                Remove any possible session token.
            */
            sessionStorage.removeItem(
                "havenGH_token"
            );

            /*
                Remove older/fallback token keys.
            */
            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "accessToken"
            );

            /*
                Redirect only after authentication
                data has been cleared.
            */
            window.location.href =
                "login.html";

        }
    );
}
/* ============================================================
LOGIN REDIRECT
============================================================ */

function redirectToLogin() {


window.location.href =
    "login.html";


}

/* ============================================================
MOBILE DASHBOARD MENU
============================================================ */

function setupMobileMenu() {


const menuButton =
    document.querySelector(
        ".dashboard-menu-button"
    );


const sidebar =
    document.querySelector(
        ".dashboard-sidebar"
    );


if (
    !menuButton ||
    !sidebar
) {

    return;

}


menuButton.addEventListener(
    "click",
    () => {

        const isOpen =
            sidebar.classList.toggle(
                "mobile-open"
            );


        menuButton.setAttribute(
            "aria-expanded",
            isOpen
                ? "true"
                : "false"
        );

    }
);


/*
    Close the mobile menu when
    the user selects a navigation link.
*/

sidebar
    .querySelectorAll("a")
    .forEach(
        link => {

            link.addEventListener(
                "click",
                () => {

                    sidebar.classList.remove(
                        "mobile-open"
                    );


                    menuButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }
            );

        }
    );


}
