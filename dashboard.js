"use strict";

/* ============================================================
HAVENGH - LANDLORD / AGENT DASHBOARD
============================================================ */

/* ============================================================
API CONFIGURATION
============================================================ */

const API_BASE_URL = "https://havenghapi-production.up.railway.app";

const AUTH_ME_API =
`${API_BASE_URL}/api/Auth/me`;

const DASHBOARD_API =
`${API_BASE_URL}/api/Dashboard`;

const MY_PROPERTIES_API =
`${API_BASE_URL}/api/Properties/my`;

const RENTAL_REQUESTS_API =
`${API_BASE_URL}/api/RentalRequests`;

/* ============================================================
AUTHENTICATION
============================================================ */

function getAuthToken() {


return (
    sessionStorage.getItem("havenGH_token") ||
    localStorage.getItem("havenGH_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken")
);


}

function clearAuthentication() {


sessionStorage.removeItem("havenGH_token");

localStorage.removeItem("havenGH_token");
localStorage.removeItem("token");
localStorage.removeItem("accessToken");


}

/* ============================================================
INITIALIZE
============================================================ */

document.addEventListener(
"DOMContentLoaded",
() => {


    initializeDashboard();

}


);

/* ============================================================
DASHBOARD INITIALIZATION
============================================================ */

async function initializeDashboard() {


const token =
    getAuthToken();


if (!token) {

    window.location.href =
        "login.html";

    return;

}


setupDashboardNavigation();

setupLogout();

setupNotifications();

updateDashboardDate();


try {

    /* ----------------------------------------------------
       LOAD CURRENT USER
    ---------------------------------------------------- */

    const user =
        await loadCurrentUser(token);


    /* ----------------------------------------------------
       CHECK ROLE
    ---------------------------------------------------- */

    const role =
        String(
            user.role || ""
        )
            .trim()
            .toLowerCase();


    if (
        role !== "landlord" &&
        role !== "agent" &&
        role !== "admin"
    ) {

        console.warn(
            "Dashboard accessed by unexpected role:",
            role
        );

        redirectByRole(role);

        return;

    }


    renderUser(user);


    /* ----------------------------------------------------
       LOAD DASHBOARD DATA
    ---------------------------------------------------- */

    const [
        dashboardData,
        properties,
        requests
    ] = await Promise.all([

        loadDashboardStatistics(token),

        loadMyProperties(token),

        loadRentalRequests(token)

    ]);


    /* ----------------------------------------------------
       DASHBOARD STATISTICS
    ---------------------------------------------------- */

    const statistics =
        dashboardData.statistics;


    renderDashboardPlan(
        dashboardData.plan,
        statistics
    );


    /* ====================================================
       PROPERTY STATISTICS
       ==================================================== */

    const totalProperties =
        document.getElementById(
            "total-properties"
        );


    const propertyViews =
        document.getElementById(
            "property-views"
        );


    const listingCount =
        document.getElementById(
            "dashboard-listing-count"
        );


    const monthlyLeads =
        document.getElementById(
            "monthly-leads"
        );


    if (totalProperties) {

        totalProperties.textContent =
            statistics.totalProperties ?? 0;

    }


    if (propertyViews) {

        propertyViews.textContent =
            Number(
                statistics.totalPropertyViews ?? 0
            ).toLocaleString();

    }


    if (listingCount) {

        listingCount.textContent =
            statistics.publishedProperties ?? 0;

    }


    if (monthlyLeads) {

        monthlyLeads.textContent =
            statistics.monthlyLeads ?? 0;

    }


    /* ====================================================
       REQUEST STATISTICS
       ==================================================== */

    const totalRequests =
        document.getElementById(
            "total-requests"
        );


    const pendingRequestsElement =
        document.getElementById(
            "pending-rental-requests"
        );


    if (totalRequests) {

        totalRequests.textContent =
            statistics.totalRequests ?? 0;

    }


    const pendingRequests =
        statistics.pendingPropertyRequests ?? 0;


    if (pendingRequestsElement) {

        pendingRequestsElement.textContent =
            pendingRequests === 1
                ? "1 pending request"
                : `${pendingRequests} pending requests`;

    }


    /* ====================================================
       SIDEBAR REQUEST BADGE
       ==================================================== */

    const sidebarCount =
        document.getElementById(
            "sidebar-request-count"
        );


    if (sidebarCount) {

        if (pendingRequests > 0) {

            sidebarCount.hidden =
                false;

            sidebarCount.textContent =
                pendingRequests;

        }
        else {

            sidebarCount.hidden =
                true;

        }

    }


    /* ====================================================
       NOTIFICATION BADGE
       ==================================================== */

    const notificationCount =
        document.getElementById(
            "notification-count"
        );


    if (notificationCount) {

        if (pendingRequests > 0) {

            notificationCount.hidden =
                false;

            notificationCount.textContent =
                pendingRequests;

        }
        else {

            notificationCount.hidden =
                true;

        }

    }


    /* ====================================================
       PROPERTY CARDS
       ==================================================== */

    renderDashboardProperties(
        properties
    );


    /* ====================================================
       RENTAL REQUEST CARDS
       ==================================================== */

    renderDashboardRequests(
        requests
    );


    /* ====================================================
       NOTIFICATIONS
       ==================================================== */

    renderNotifications(
        requests
    );

}
catch (error) {

    console.error(
        "HavenGH dashboard error:",
        error
    );


    if (error.status === 401) {

        clearAuthentication();

        window.location.href =
            "login.html";

        return;

    }


    showDashboardError(
        error.message ||
        "Unable to load dashboard data."
    );

}


}

/* ============================================================
AUTHENTICATED API REQUEST
============================================================ */

async function apiRequest(
url,
token,
options = {}
) {


const response =
    await fetch(
        url,
        {
            ...options,

            headers: {

                "Accept":
                    "application/json",

                ...(options.body
                    ? {
                        "Content-Type":
                            "application/json"
                    }
                    : {}),

                "Authorization":
                    `Bearer ${token}`,

                ...(options.headers || {})

            }

        }
    );


if (!response.ok) {

    const error =
        new Error(
            `API request failed (${response.status}).`
        );


    error.status =
        response.status;


    try {

        const data =
            await response.json();


        if (data?.message) {

            error.message =
                data.message;

        }

    }
    catch {

        // Response was not JSON.

    }


    throw error;

}


if (
    response.status === 204
) {

    return null;

}


return await response.json();


}

/* ============================================================
LOAD CURRENT USER
GET /api/Auth/me
============================================================ */

async function loadCurrentUser(token) {


return await apiRequest(
    AUTH_ME_API,
    token
);


}

/* ============================================================
LOAD DASHBOARD STATISTICS
GET /api/Dashboard
============================================================ */

async function loadDashboardStatistics(token) {


const data =
    await apiRequest(
        DASHBOARD_API,
        token
    );


if (
    !data ||
    !data.statistics
) {

    throw new Error(
        "Invalid dashboard data returned by the API."
    );

}


return data;


}

/* ============================================================
LOAD LANDLORD / AGENT PROPERTIES
GET /api/Properties/my
============================================================ */

async function loadMyProperties(token) {


const data =
    await apiRequest(
        MY_PROPERTIES_API,
        token
    );


if (!Array.isArray(data)) {

    throw new Error(
        "Invalid property data returned by the API."
    );

}


return data;


}

/* ============================================================
LOAD RENTAL REQUESTS
GET /api/RentalRequests
============================================================ */

async function loadRentalRequests(token) {


const data =
    await apiRequest(
        RENTAL_REQUESTS_API,
        token
    );


if (!Array.isArray(data)) {

    throw new Error(
        "Invalid rental request data returned by the API."
    );

}


return data;


}

/* ============================================================
RENDER SUBSCRIPTION PLAN
============================================================ */

function renderDashboardPlan(
plan,
statistics
) {


const planNameElement =
    document.getElementById(
        "dashboard-plan-name"
    );


const planDescriptionElement =
    document.getElementById(
        "dashboard-plan-description"
    );


const listingCountElement =
    document.getElementById(
        "dashboard-listing-count"
    );


const progressElement =
    document.getElementById(
        "dashboard-listing-progress"
    );


const planMessageElement =
    document.getElementById(
        "dashboard-plan-message"
    );


if (!plan) {

    if (planNameElement) {

        planNameElement.textContent =
            "No Active Plan";

    }


    if (planDescriptionElement) {

        planDescriptionElement.textContent =
            "You currently do not have an active subscription.";

    }


    if (listingCountElement) {

        listingCountElement.textContent =
            "0 / 0";

    }


    if (progressElement) {

        progressElement.style.width =
            "0%";

    }


    if (planMessageElement) {

        planMessageElement.textContent =
            "Choose a plan to start listing properties.";

    }


    return;

}


const planName =
    plan.planName ??
    "HavenGH Plan";


const listingLimit =
    Number(
        plan.listingLimit ?? 0
    );


const activeListings =
    Number(
        statistics?.activeListings ?? 0
    );


let percentage = 0;


if (listingLimit > 0) {

    percentage =
        Math.min(
            100,
            Math.max(
                0,
                (activeListings / listingLimit) * 100
            )
        );

}


if (planNameElement) {

    planNameElement.textContent =
        planName;

}


if (planDescriptionElement) {

    const price =
        Number(
            plan.price ?? 0
        );


    const billingPeriod =
        plan.billingPeriod
            ? capitalize(
                plan.billingPeriod
            )
            : "";


    if (price === 0) {

        planDescriptionElement.textContent =
            "Free HavenGH plan.";

    }
    else {

        planDescriptionElement.textContent =
            `GH₵${price.toLocaleString(
                "en-GH",
                {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                }
            )} / ${billingPeriod}`;

    }

}


if (listingCountElement) {

    listingCountElement.textContent =
        `${activeListings} / ${listingLimit}`;

}


if (progressElement) {

    progressElement.style.width =
        `${percentage}%`;

}


if (planMessageElement) {

    const remaining =
        Math.max(
            0,
            listingLimit - activeListings
        );


    if (activeListings >= listingLimit) {

        planMessageElement.textContent =
            "You have reached your listing limit. Upgrade your plan to add more.";

    }
    else if (remaining === 1) {

        planMessageElement.textContent =
            "1 active listing remaining.";

    }
    else {

        planMessageElement.textContent =
            `${remaining} active listings remaining.`;

    }

}


}

/* ============================================================
RENDER USER
============================================================ */

function renderUser(user) {


const nameElement =
    document.getElementById(
        "dashboard-user-name"
    );


const roleElement =
    document.getElementById(
        "dashboard-user-role"
    );


const welcomeElement =
    document.getElementById(
        "dashboard-welcome-message"
    );


const displayName =
    user.fullName ||
    user.businessName ||
    user.email ||
    "HavenGH User";


const role =
    user.role ||
    "User";


if (nameElement) {

    nameElement.textContent =
        displayName;

}


if (roleElement) {

    roleElement.textContent =
        capitalize(role);

}


/* ========================================================
   IDENTITY VERIFICATION
   ======================================================== */

const verificationElement =
    document.getElementById(
        "dashboard-user-verification"
    );


if (verificationElement) {

    verificationElement.classList.remove(
        "verified",
        "pending"
    );


    if (
        user.isIdentityVerified === true
    ) {

        verificationElement.textContent =
            "✓ Verified";

        verificationElement.classList.add(
            "verified"
        );

    }
    else {

        verificationElement.textContent =
            "Verification Pending";

        verificationElement.classList.add(
            "pending"
        );

    }

}


if (welcomeElement) {

    welcomeElement.textContent =
        `Welcome back, ${displayName}.`;

}


/* ========================================================
   PROFILE AVATAR
   ======================================================== */

const avatarImage =
    document.getElementById(
        "dashboard-user-avatar-img"
    );


const avatarFallback =
    document.getElementById(
        "dashboard-user-avatar-fallback"
    );


if (
    avatarImage &&
    avatarFallback
) {

    if (
        user.avatarUrl &&
        String(
            user.avatarUrl
        ).trim() !== ""
    ) {

        let avatarUrl =
            String(
                user.avatarUrl
            ).trim();


        if (
            avatarUrl.startsWith("/")
        ) {

            avatarUrl =
                `${API_BASE_URL}${avatarUrl}`;

        }


        avatarImage.src =
            avatarUrl;

        avatarImage.alt =
            `${displayName} profile picture`;

        avatarImage.hidden =
            false;

        avatarFallback.hidden =
            true;

    }
    else {

        avatarImage.src =
            "";

        avatarImage.alt =
            "";

        avatarImage.hidden =
            true;

        avatarFallback.textContent =
            displayName
                .charAt(0)
                .toUpperCase();

        avatarFallback.hidden =
            false;

    }

}


}

/* ============================================================
PROPERTY STATISTICS
============================================================ */

function renderPropertyStatistics(
properties
) {


const totalProperties =
    properties.length;


const totalViews =
    properties.reduce(
        (total, property) => {

            return total +
                Number(
                    property.viewCount ??
                    property.ViewCount ??
                    0
                );

        },
        0
    );


const totalPropertiesElement =
    document.getElementById(
        "total-properties"
    );


const propertyViewsElement =
    document.getElementById(
        "property-views"
    );


const listingCountElement =
    document.getElementById(
        "dashboard-listing-count"
    );


if (totalPropertiesElement) {

    totalPropertiesElement.textContent =
        totalProperties;

}


if (propertyViewsElement) {

    propertyViewsElement.textContent =
        totalViews.toLocaleString();

}


if (listingCountElement) {

    listingCountElement.textContent =
        totalProperties;

}


const propertyChange =
    document.getElementById(
        "total-properties-change"
    );


if (propertyChange) {

    propertyChange.textContent =
        totalProperties === 1
            ? "1 active listing"
            : `${totalProperties} listings`;

}


const viewsChange =
    document.getElementById(
        "property-views-change"
    );


if (viewsChange) {

    viewsChange.textContent =
        "Total recorded views";

}


const monthlyLeads =
    document.getElementById(
        "monthly-leads"
    );


const monthlyLeadsChange =
    document.getElementById(
        "monthly-leads-change"
    );


if (monthlyLeads) {

    monthlyLeads.textContent =
        "—";

}


if (monthlyLeadsChange) {

    monthlyLeadsChange.textContent =
        "Coming soon";

}


}

/* ============================================================
RENDER DASHBOARD PROPERTIES
============================================================ */

function renderDashboardProperties(
properties
) {


const container =
    document.getElementById(
        "dashboard-properties"
    );


const loading =
    document.getElementById(
        "dashboard-properties-loading"
    );


const empty =
    document.getElementById(
        "dashboard-properties-empty"
    );


if (loading) {

    loading.hidden =
        true;

}


if (!container) {

    return;

}


container.innerHTML =
    "";


if (
    !Array.isArray(properties) ||
    properties.length === 0
) {

    if (empty) {

        empty.hidden =
            false;

    }

    return;

}


if (empty) {

    empty.hidden =
        true;

}


/*
    Show newest four properties.
*/

const recentProperties =
    [...properties]
        .sort(
            (a, b) =>
                getDate(b) -
                getDate(a)
        )
        .slice(0, 4);


recentProperties.forEach(
    property => {

        container.appendChild(
            createDashboardPropertyCard(
                property
            )
        );

    }
);


}

/* ============================================================
CREATE PROPERTY CARD
============================================================ */

function createDashboardPropertyCard(
property
) {


const card =
    document.createElement(
        "article"
    );


card.className =
    "dashboard-property-card";


const propertyId =
    property.propertyId ??
    property.PropertyId;


const title =
    property.title ??
    property.Title ??
    "Untitled Property";


const price =
    Number(
        property.price ??
        property.Price ??
        0
    );


const pricePeriod =
    property.pricePeriod ??
    property.PricePeriod ??
    "";


/*
    Normalize the property status.

    This is important because the API may
    return either "draft" or "Draft".
*/

const status =
    String(
        property.status ??
        property.Status ??
        "draft"
    )
        .trim()
        .toLowerCase();


const location =
    property.location ??
    property.Location;


const locationText =
    formatLocation(
        location
    );


const imageUrl =
    getPrimaryImage(
        property
    );


/* ========================================================
   PROPERTY IMAGE
   ======================================================== */

const image =
    document.createElement(
        "div"
    );


image.className =
    "dashboard-property-image";


if (imageUrl) {

    const img =
        document.createElement(
            "img"
        );


    img.src =
        imageUrl;


    img.alt =
        title;


    img.loading =
        "lazy";


    img.onerror =
        function () {

            console.warn(
                "Property image failed to load:",
                imageUrl
            );


            image.innerHTML = `
                <div class="dashboard-property-image-placeholder">
                    <span>HavenGH</span>
                </div>
            `;

        };


    image.appendChild(
        img
    );

}
else {

    image.innerHTML = `
        <div class="dashboard-property-image-placeholder">
            <span>HavenGH</span>
        </div>
    `;

}


/* ========================================================
   PROPERTY CONTENT
   ======================================================== */

const content =
    document.createElement(
        "div"
    );


content.className =
    "dashboard-property-content";


/* ========================================================
   STATUS
   ======================================================== */

const statusElement =
    document.createElement(
        "span"
    );


statusElement.className =
    `property-status status-${status}`;


statusElement.textContent =
    getPropertyStatusLabel(
        status
    );


/* ========================================================
   TITLE
   ======================================================== */

const heading =
    document.createElement(
        "h3"
    );


heading.textContent =
    title;


/* ========================================================
   LOCATION
   ======================================================== */

const locationElement =
    document.createElement(
        "p"
    );


locationElement.textContent =
    locationText ||
    "Location unavailable";


/* ========================================================
   PROPERTY ACTIONS
   ======================================================== */

const actions =
    document.createElement(
        "div"
    );


actions.className =
    "dashboard-property-actions";


/*
    DRAFT
    --------------------------------------------------------
    Landlord / Agent can submit the property
    for HavenGH Admin review.

    IMPORTANT:
    This does NOT publish the property.
*/

if (status === "draft") {

    const reviewButton =
        document.createElement(
            "button"
        );


    reviewButton.type =
        "button";


    reviewButton.className =
        "property-submit-review";


    reviewButton.textContent =
        "Submit for Review";


    reviewButton.addEventListener(
        "click",
        () => {

            submitPropertyForReview(
                propertyId,
                reviewButton
            );

        }
    );


    actions.appendChild(
        reviewButton
    );

}


/*
    PENDING
    --------------------------------------------------------
    The property has already been submitted.
*/

else if (status === "pending") {

    const pendingButton =
        document.createElement(
            "button"
        );


    pendingButton.type =
        "button";


    pendingButton.className =
        "property-review-pending";


    pendingButton.textContent =
        "Awaiting Admin Review";


    pendingButton.disabled =
        true;


    actions.appendChild(
        pendingButton
    );

}


/*
    PUBLISHED
*/

else if (status === "published") {

    const publishedLabel =
        document.createElement(
            "span"
        );


    publishedLabel.className =
        "property-published-label";


    publishedLabel.textContent =
        "✓ Published";


    actions.appendChild(
        publishedLabel
    );

}


/*
    RENTED
*/

else if (status === "rented") {

    const rentedLabel =
        document.createElement(
            "span"
        );


    rentedLabel.className =
        "property-rented-label";


    rentedLabel.textContent =
        "Rented";


    actions.appendChild(
        rentedLabel
    );

}


/*
    ARCHIVED
*/

else if (status === "archived") {

    const archivedLabel =
        document.createElement(
            "span"
        );


    archivedLabel.className =
        "property-archived-label";


    archivedLabel.textContent =
        "Archived";


    actions.appendChild(
        archivedLabel
    );

}


/* ========================================================
   FOOTER
   ======================================================== */

const footer =
    document.createElement(
        "div"
    );


footer.className =
    "dashboard-property-footer";


const priceElement =
    document.createElement(
        "strong"
    );


priceElement.textContent =
    formatPrice(
        price
    );


if (pricePeriod) {

    const period =
        document.createElement(
            "span"
        );


    period.textContent =
        ` / ${capitalize(
            pricePeriod
        )}`;


    priceElement.appendChild(
        period
    );

}


/* ========================================================
   VIEW LINK
   ======================================================== */

const viewLink =
    document.createElement(
        "a"
    );


viewLink.href =
    `property-details.html?id=${encodeURIComponent(
        propertyId
    )}`;


viewLink.textContent =
    "View →";


/* ========================================================
   BUILD CONTENT
   ======================================================== */

if (
    actions.children.length > 0
) {

    content.appendChild(
        actions
    );

}


content.appendChild(
    statusElement
);


content.appendChild(
    heading
);


content.appendChild(
    locationElement
);


footer.appendChild(
    priceElement
);


footer.appendChild(
    viewLink
);


content.appendChild(
    footer
);


card.appendChild(
    image
);


card.appendChild(
    content
);


return card;


}

/* ============================================================
PROPERTY STATUS LABEL
============================================================ */

function getPropertyStatusLabel(
status
) {


switch (
    String(status)
        .trim()
        .toLowerCase()
) {

    case "draft":

        return "Draft";


    case "pending":

        return "Pending Review";


    case "published":

        return "Published";


    case "rented":

        return "Rented";


    case "archived":

        return "Archived";


    default:

        return capitalize(
            status
        );

}


}

/* ============================================================
SUBMIT PROPERTY FOR ADMIN REVIEW
POST /api/Properties/{id}/submit-review
============================================================ */

async function submitPropertyForReview(
propertyId,
button
) {


const token =
    getAuthToken();


if (!token) {

    window.location.href =
        "login.html";

    return;

}


if (!propertyId) {

    alert(
        "Unable to identify this property."
    );

    return;

}


/*
    Prevent double-clicks.
*/

if (button) {

    button.disabled =
        true;


    button.textContent =
        "Submitting...";

}


try {

    /*
        Existing HavenGH API endpoint.

        draft -> pending

        This does NOT publish the property.
    */

    const result =
        await apiRequest(
            `${API_BASE_URL}/api/Properties/${propertyId}/submit-review`,
            token,
            {
                method: "POST"
            }
        );


    console.log(
        "HavenGH property submitted for review:",
        result
    );


    /*
        Reload properties from the API.

        This ensures the card reflects the
        real database status instead of
        changing the UI only.
    */

    const properties =
        await loadMyProperties(
            token
        );


    renderDashboardProperties(
        properties
    );


    /*
        Optional confirmation.
    */

    if (
        result?.message
    ) {

        console.log(
            result.message
        );

    }

}
catch (error) {

    console.error(
        "Unable to submit property for review:",
        error
    );


    if (
        error.status === 401
    ) {

        clearAuthentication();

        window.location.href =
            "login.html";

        return;

    }


    alert(
        error.message ||
        "Unable to submit property for review."
    );


    if (button) {

        button.disabled =
            false;


        button.textContent =
            "Submit for Review";

    }

}


}

/* ============================================================
REQUEST STATISTICS
============================================================ */

function renderRequestStatistics(
requests
) {


const totalRequests =
    requests.length;


const pendingRequests =
    requests.filter(
        request =>
            String(
                request.status ??
                request.Status ??
                ""
            )
                .toLowerCase() ===
            "pending"
    ).length;


const totalElement =
    document.getElementById(
        "total-requests"
    );


const pendingElement =
    document.getElementById(
        "pending-rental-requests"
    );


if (totalElement) {

    totalElement.textContent =
        totalRequests;

}


if (pendingElement) {

    pendingElement.textContent =
        pendingRequests === 1
            ? "1 pending request"
            : `${pendingRequests} pending requests`;

}


/* ========================================================
   SIDEBAR BADGE
   ======================================================== */

const sidebarCount =
    document.getElementById(
        "sidebar-request-count"
    );


if (sidebarCount) {

    if (pendingRequests > 0) {

        sidebarCount.hidden =
            false;


        sidebarCount.textContent =
            pendingRequests;

    }
    else {

        sidebarCount.hidden =
            true;

    }

}


/* ========================================================
   NOTIFICATION BADGE
   ======================================================== */

const notificationCount =
    document.getElementById(
        "notification-count"
    );


if (notificationCount) {

    if (pendingRequests > 0) {

        notificationCount.hidden =
            false;


        notificationCount.textContent =
            pendingRequests;

    }
    else {

        notificationCount.hidden =
            true;

    }

}


}

/* ============================================================
RENDER RECENT REQUESTS
============================================================ */

function renderDashboardRequests(
requests
) {


const container =
    document.getElementById(
        "dashboard-requests"
    );


const loading =
    document.getElementById(
        "dashboard-requests-loading"
    );


const empty =
    document.getElementById(
        "dashboard-requests-empty"
    );


if (loading) {

    loading.hidden =
        true;

}


if (!container) {

    return;

}


container.innerHTML =
    "";


if (
    !Array.isArray(requests) ||
    requests.length === 0
) {

    if (empty) {

        empty.hidden =
            false;

    }

    return;

}


if (empty) {

    empty.hidden =
        true;

}


const recentRequests =
    [...requests]
        .sort(
            (a, b) =>
                getDate(b) -
                getDate(a)
        )
        .slice(0, 5);


recentRequests.forEach(
    request => {

        container.appendChild(
            createRequestCard(
                request
            )
        );

    }
);


}

/* ============================================================
CREATE REQUEST CARD
============================================================ */

function createRequestCard(
request
) {


const item =
    document.createElement(
        "article"
    );


item.className =
    "dashboard-request-card";


const requestId =
    request.rentalRequestId ??
    request.RentalRequestId;


const propertyId =
    request.propertyId ??
    request.PropertyId;


const status =
    String(
        request.status ??
        request.Status ??
        "pending"
    )
        .toLowerCase();


const message =
    request.message ??
    request.Message ??
    "";


const createdAt =
    request.createdAt ??
    request.CreatedAt;


const heading =
    document.createElement(
        "h3"
    );


heading.textContent =
    `Rental Request #${requestId}`;


const property =
    document.createElement(
        "p"
    );


property.textContent =
    `Property #${propertyId}`;


const statusElement =
    document.createElement(
        "span"
    );


statusElement.className =
    `request-status request-${status}`;


statusElement.textContent =
    capitalize(status);


const messageElement =
    document.createElement(
        "p"
    );


messageElement.textContent =
    truncateText(
        message,
        100
    );


const dateElement =
    document.createElement(
        "small"
    );


dateElement.textContent =
    formatDate(
        createdAt
    );


item.appendChild(
    heading
);


item.appendChild(
    property
);


item.appendChild(
    statusElement
);


if (message) {

    item.appendChild(
        messageElement
    );

}


item.appendChild(
    dateElement
);


/*
    Only pending rental requests
    receive Approve / Reject buttons.
*/

if (
    status === "pending"
) {

    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "dashboard-request-actions";


    const approve =
        document.createElement(
            "button"
        );


    approve.type =
        "button";


    approve.className =
        "request-approve";


    approve.textContent =
        "Approve";


    const reject =
        document.createElement(
            "button"
        );


    reject.type =
        "button";


    reject.className =
        "request-reject";


    reject.textContent =
        "Reject";


    approve.addEventListener(
        "click",
        () =>
            updateRequestStatus(
                requestId,
                "approved",
                approve,
                reject
            )
    );


    reject.addEventListener(
        "click",
        () =>
            updateRequestStatus(
                requestId,
                "rejected",
                approve,
                reject
            )
    );


    actions.appendChild(
        approve
    );


    actions.appendChild(
        reject
    );


    item.appendChild(
        actions
    );

}


return item;


}

/* ============================================================
UPDATE REQUEST STATUS
PUT /api/RentalRequests/{id}/status
============================================================ */

async function updateRequestStatus(
requestId,
status,
approveButton,
rejectButton
) {

const token =
    getAuthToken();


if (!token) {

    window.location.href =
        "login.html";

    return;

}


if (approveButton) {

    approveButton.disabled =
        true;

}


if (rejectButton) {

    rejectButton.disabled =
        true;

}


try {

    await apiRequest(
        `${RENTAL_REQUESTS_API}/${requestId}/status`,
        token,
        {
            method: "PUT",

            body: JSON.stringify({
                status
            })
        }
    );


    const requests =
        await loadRentalRequests(
            token
        );


    renderRequestStatistics(
        requests
    );


    renderDashboardRequests(
        requests
    );


    renderNotifications(
        requests
    );

}
catch (error) {

    console.error(
        "Unable to update rental request:",
        error
    );


    if (
        error.status === 401
    ) {

        clearAuthentication();

        window.location.href =
            "login.html";

        return;

    }


    alert(
        error.message ||
        "Unable to update rental request."
    );


    if (approveButton) {

        approveButton.disabled =
            false;

    }


    if (rejectButton) {

        rejectButton.disabled =
            false;

    }

}


}

/* ============================================================
NOTIFICATIONS
============================================================ */

function setupNotifications() {


const button =
    document.getElementById(
        "notification-button"
    );


const panel =
    document.getElementById(
        "notification-panel"
    );


if (
    !button ||
    !panel
) {

    return;

}


button.addEventListener(
    "click",
    event => {

        event.stopPropagation();


        const isHidden =
            panel.hidden;


        panel.hidden =
            !isHidden;


        button.setAttribute(
            "aria-expanded",
            String(isHidden)
        );

    }
);


document.addEventListener(
    "click",
    event => {

        if (
            !panel.contains(
                event.target
            ) &&
            event.target !== button
        ) {

            panel.hidden =
                true;


            button.setAttribute(
                "aria-expanded",
                "false"
            );

        }

    }
);


const markRead =
    document.getElementById(
        "mark-notifications-read"
    );


if (markRead) {

    markRead.addEventListener(
        "click",
        () => {

            /*
                Notifications are currently derived
                from pending rental requests.
            */

            panel.hidden =
                true;

        }
    );

}


}

/* ============================================================
RENDER NOTIFICATIONS
============================================================ */

function renderNotifications(
requests
) {


const list =
    document.getElementById(
        "notification-list"
    );


const empty =
    document.getElementById(
        "notification-empty"
    );


if (!list) {

    return;

}


list
    .querySelectorAll(
        ".dashboard-generated-notification"
    )
    .forEach(
        element =>
            element.remove()
    );


const pending =
    requests
        .filter(
            request =>
                String(
                    request.status ??
                    request.Status ??
                    ""
                )
                    .toLowerCase() ===
                "pending"
        )
        .slice(0, 5);


if (
    pending.length === 0
) {

    if (empty) {

        empty.hidden =
            false;

    }

    return;

}


if (empty) {

    empty.hidden =
        true;

}


pending.forEach(
    request => {

        const notification =
            document.createElement(
                "div"
            );


        notification.className =
            "notification-item dashboard-generated-notification";


        const id =
            request.rentalRequestId ??
            request.RentalRequestId;


        const createdAt =
            request.createdAt ??
            request.CreatedAt;


        notification.innerHTML = `
            <strong>New rental request</strong>
            <span>Request #${escapeHtml(id)}</span>
            <small>${escapeHtml(
                formatDate(createdAt)
            )}</small>
        `;


        list.appendChild(
            notification
        );

    }
);


}

/* ============================================================
LOGOUT
============================================================ */

function setupLogout() {


const logoutButton =
    document.getElementById(
        "logout-button"
    );


if (!logoutButton) {

    return;

}


logoutButton.addEventListener(
    "click",
    async event => {

        event.preventDefault();


        const token =
            getAuthToken();


        /*
            Clear browser authentication immediately.
        */

        clearAuthentication();


        /*
            Tell API to revoke authenticated sessions.
        */

        if (token) {

            try {

                await fetch(
                    `${API_BASE_URL}/api/Account/sessions/sign-out-all`,
                    {
                        method: "POST",

                        headers: {

                            "Accept":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`

                        }

                    }
                );

            }
            catch (error) {

                console.warn(
                    "Logout API request failed:",
                    error
                );

            }

        }


        window.location.href =
            "login.html";

    }
);


}

/* ============================================================
MOBILE DASHBOARD NAVIGATION
============================================================ */

function setupDashboardNavigation() {


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

        const open =
            sidebar.classList.toggle(
                "mobile-open"
            );


        menuButton.setAttribute(
            "aria-expanded",
            String(open)
        );

    }
);


sidebar
    .querySelectorAll(
        ".dashboard-link"
    )
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

/* ============================================================
DATE
============================================================ */

function updateDashboardDate() {


const element =
    document.getElementById(
        "dashboard-date"
    );


if (!element) {

    return;

}


const date =
    new Date();


element.textContent =
    date.toLocaleDateString(
        "en-GH",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );


}

/* ============================================================
GET PRIMARY PROPERTY IMAGE
============================================================ */

function getPrimaryImage(
property
) {


const images =
    property.images ??
    property.Images ??
    [];


if (
    !Array.isArray(images) ||
    images.length === 0
) {

    return null;

}


const primary =
    images.find(
        image =>
            image.isPrimary === true ||
            image.IsPrimary === true
    );


const image =
    primary ||
    images[0];


let imageUrl =
    image.imageUrl ??
    image.ImageUrl ??
    image.url ??
    image.Url ??
    null;


if (!imageUrl) {

    return null;

}


imageUrl =
    String(
        imageUrl
    ).trim();


/*
    Relative API path:
    /uploads/properties/file.jpg
*/

if (
    imageUrl.startsWith("/")
) {

    imageUrl =
        `${API_BASE_URL}${imageUrl}`;

}


/*
    Relative path without leading slash:
    uploads/properties/file.jpg
*/

else if (
    !imageUrl.startsWith("http://") &&
    !imageUrl.startsWith("https://")
) {

    imageUrl =
        `${API_BASE_URL}/${imageUrl}`;

}


return imageUrl;


}

/* ============================================================
FORMAT LOCATION
============================================================ */

function formatLocation(
location
) {


if (!location) {

    return "";

}


return [

    location.area ??
    location.Area,

    location.city ??
    location.City,

    location.region ??
    location.Region,

    location.country ??
    location.Country

]
    .filter(Boolean)
    .filter(
        (value, index, array) =>
            array.indexOf(value) === index
    )
    .join(", ");


}

/* ============================================================
FORMAT PRICE
============================================================ */

function formatPrice(
price
) {

return `GH₵${Number(
    price
).toLocaleString(
    "en-GH",
    {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }
)}`;


}

/* ============================================================
FORMAT DATE
============================================================ */

function formatDate(
value
) {


if (!value) {

    return "Date unavailable";

}


const date =
    new Date(value);


if (
    Number.isNaN(
        date.getTime()
    )
) {

    return "Date unavailable";

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
GET DATE
============================================================ */

function getDate(
item
) {


const value =
    item.createdAt ??
    item.CreatedAt;


const date =
    new Date(value);


return Number.isNaN(
    date.getTime()
)
    ? 0
    : date.getTime();


}

/* ============================================================
CAPITALIZE
============================================================ */

function capitalize(
value
) {


if (!value) {

    return "";

}


return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
);


}

/* ============================================================
TRUNCATE TEXT
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
    text.length <= maxLength
) {

    return text;

}


return (
    text
        .substring(
            0,
            maxLength
        )
        .trim() +
    "..."
);


}

/* ============================================================
ESCAPE HTML
============================================================ */

function escapeHtml(
value
) {


return String(value)
    .replaceAll(
        "&",
        "&amp;"
    )
    .replaceAll(
        "<",
        "&lt;"
    )
    .replaceAll(
        ">",
        "&gt;"
    )
    .replaceAll(
        '"',
        "&quot;"
    )
    .replaceAll(
        "'",
        "&#039;"
    );


}

/* ============================================================
ROLE REDIRECT
============================================================ */

function redirectByRole(
role
) {


if (
    role === "tenant"
) {

    window.location.href =
        "tenant-dashboard.html";

    return;

}


if (
    role === "agent"
) {

    window.location.href =
        "dashboard.html";

    return;

}


if (
    role === "admin"
) {

    window.location.href =
        "admin-dashboard.html";

    return;

}


window.location.href =
    "login.html";


}

/* ============================================================
DASHBOARD ERROR
============================================================ */

function showDashboardError(
message
) {


console.error(
    "Dashboard:",
    message
);


const propertiesLoading =
    document.getElementById(
        "dashboard-properties-loading"
    );


const requestsLoading =
    document.getElementById(
        "dashboard-requests-loading"
    );


if (propertiesLoading) {

    propertiesLoading.textContent =
        "Unable to load your properties.";

}


if (requestsLoading) {

    requestsLoading.textContent =
        "Unable to load rental requests.";

}


}
