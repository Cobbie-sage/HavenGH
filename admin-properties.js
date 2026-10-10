"use strict";

/* ============================================================
HavenGH - Admin Properties
Admin Property Management
Direct ASP.NET Core API connection
============================================================ */

const HAVENGH_API = "http://localhost:5073/api";

let adminallProperties = [];
let adminfilteredProperties = [];

/* ============================================================
INITIALIZATION
============================================================ */

document.addEventListener("DOMContentLoaded", () => {


initializeAdminProperties();


});

async function initializeAdminProperties() {


setupSearch();
setupFilters();

await loadAdminProperties();


}

/* ============================================================
AUTHENTICATION
============================================================ */

function getToken() {


return (
    localStorage.getItem("havenGH_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("havenGH_token") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
    null
);


}

function isLoggedIn() {


return !!getToken();


}

/* ============================================================
API REQUEST
============================================================ */

async function apiRequest(endpoint, options = {}) {


const token = getToken();

if (!token) {

    redirectToLogin();

    throw new Error(
        "You must be logged in as an administrator."
    );

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

    redirectToLogin();

    throw new Error(
        "Your session has expired. Please log in again."
    );

}


if (response.status === 403) {

    throw new Error(
        "Administrator access is required for this action."
    );

}


if (response.status === 204) {

    return null;

}


let data = null;

try {

    data = await response.json();

} catch {

    data = null;

}


if (!response.ok) {

    throw new Error(
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status}.`
    );

}


return data;


}

/* ============================================================
LOGIN REDIRECT
============================================================ */

function redirectToLogin() {


const currentPage =
    window.location.pathname +
    window.location.search;

const loginUrl =
    `login.html?returnUrl=${encodeURIComponent(currentPage)}`;


window.location.href = loginUrl;


}

/* ============================================================
LOAD PROPERTIES
============================================================ */

async function loadAdminProperties() {


const container =
    document.getElementById(
        "admin-properties-list"
    );


if (!container) {

    return;

}


showLoading(container);


try {

    const data =
        await apiRequest("/Properties/my");


      adminallProperties =
    Array.isArray(data)
        ? data
        : [];
    console.table(
    adminallProperties.map(property => ({
        id: property.propertyId,
        title: property.title,
        status: property.status
    }))
);

       adminfilteredProperties =
    [...adminallProperties];


    updateStatistics();

    renderProperties();


} catch (error) {

    console.error(
        "HavenGH Admin Properties Error:",
        error
    );


    showError(
        container,
        error.message ||
        "Unable to load properties."
    );

}


}

/* ============================================================
STATISTICS
============================================================ */

function updateStatistics() {
    const total = adminallProperties.length;

    const countStatus = (status) =>
        adminallProperties.filter(property =>
            String(property.status || "").trim().toLowerCase() === status
        ).length;

    const published = countStatus("published");
    const pending = countStatus("pending");
    const rented = countStatus("rented");
    const draft = countStatus("draft");

    document.getElementById("adminTotalProperties").textContent = total;
    document.getElementById("adminPublishedProperties").textContent = published;
    document.getElementById("adminPendingProperties").textContent = pending;
    document.getElementById("adminRentedProperties").textContent = rented;
    document.getElementById("adminDraftProperties").textContent = draft;
}

/* ============================================================
SEARCH
============================================================ */

function setupSearch() {


const search =
    document.getElementById(
        "admin-property-search"
    );


if (!search) {

    return;

}


search.addEventListener(
    "input",
    applyFilters
);


}

/* ============================================================
FILTERS
============================================================ */

function setupFilters() {


const status =
    document.getElementById(
        "admin-property-status"
    );


const type =
    document.getElementById(
        "admin-property-type"
    );


if (status) {

    status.addEventListener(
        "change",
        applyFilters
    );

}


if (type) {

    type.addEventListener(
        "change",
        applyFilters
    );

}


}

/* ============================================================
APPLY FILTERS
============================================================ */

function applyFilters() {


const searchInput =
    document.getElementById(
        "admin-property-search"
    );


const statusInput =
    document.getElementById(
        "admin-property-status"
    );


const typeInput =
    document.getElementById(
        "admin-property-type"
    );


const search =
    (
        searchInput?.value ||
        ""
    )
        .trim()
        .toLowerCase();


const selectedStatus =
    (
        statusInput?.value ||
        "all"
    )
        .toLowerCase();


const selectedType =
    (
        typeInput?.value ||
        "all"
    )
        .toLowerCase();


adminfilteredProperties =
    adminallProperties.filter(property => {

        const title =
            String(
                property.Title || ""
            ).toLowerCase();


        const description =
            String(
                property.Description || ""
            ).toLowerCase();


        const propertyType =
            normalizeType(
                property.PropertyType
            );


        const location =
            property.Location || {};


        const area =
            String(
                location.Area || ""
            ).toLowerCase();


        const city =
            String(
                location.City || ""
            ).toLowerCase();


        const region =
            String(
                location.Region || ""
            ).toLowerCase();


        const matchesSearch =
            !search ||
            title.includes(search) ||
            description.includes(search) ||
            area.includes(search) ||
            city.includes(search) ||
            region.includes(search);


        const matchesStatus =
            selectedStatus === "all" ||
            normalizeStatus(
                property.Status
            ) === selectedStatus;


        const matchesType =
            selectedType === "all" ||
            propertyType === selectedType;


        return (
            matchesSearch &&
            matchesStatus &&
            matchesType
        );

    });


renderProperties();


}

/* ============================================================
RENDER PROPERTIES
============================================================ */

function renderProperties() {


const container =
    document.getElementById(
        "admin-properties-list"
    );


if (!container) {

    return;

}


if (!adminfilteredProperties.length) {

    container.innerHTML = `

        <div class="request-item">

            <div>

                <h3>
                    No properties found
                </h3>

                <p>
                    No property listings match
                    your current search or filters.
                </p>

                <small>
                    Try changing your search
                    or status/type filters.
                </small>

            </div>

        </div>

    `;

    return;

}


container.innerHTML =
    adminfilteredProperties
        .map(renderPropertyCard)
        .join("");


attachPropertyActions();


}

/* ============================================================
PROPERTY CARD
============================================================ */

function renderPropertyCard(property) {


const id =
    property.PropertyId;


const title =
    escapeHtml(
        property.Title ||
        "Untitled Property"
    );


const description =
    escapeHtml(
        truncate(
            property.Description ||
            "No description available.",
            130
        )
    );


const type =
    formatPropertyType(
        property.PropertyType
    );


const status =
    normalizeStatus(
        property.Status
    );


const statusLabel =
    formatStatus(status);


const price =
    formatCurrency(
        property.Price
    );


const pricePeriod =
    formatPricePeriod(
        property.PricePeriod
    );


const location =
    property.Location || {};


const locationText =
    [
        location.Area,
        location.City,
        location.Region
    ]
        .filter(Boolean)
        .map(escapeHtml)
        .join(", ") ||
    "Location not provided";


const bedrooms =
    property.Bedrooms ??
    "—";


const bathrooms =
    property.Bathrooms ??
    "—";


const views =
    Number(
        property.ViewCount || 0
    ).toLocaleString();


const imageUrl =
    getPrimaryImageUrl(
        property
    );


const featured =
    property.IsFeatured === true;


return `

    <article
        class="admin-property-card"
        data-property-id="${id}"
    >

        <div class="admin-property-image">

            <img
                src="${escapeAttribute(imageUrl)}"
                alt="${escapeAttribute(title)}"
                loading="lazy"
                onerror="this.onerror=null;this.src='images/property-placeholder.jpg';"
            >

            <div class="admin-property-badges">

                <span
                    class="admin-property-status status-${status}"
                >
                    ${escapeHtml(statusLabel)}
                </span>

                ${
                    featured
                        ? `
                            <span
                                class="admin-property-featured"
                            >
                                Featured
                            </span>
                        `
                        : ""
                }

            </div>

        </div>


        <div class="admin-property-body">

            <div class="admin-property-heading">

                <div>

                    <span
                        class="admin-property-type"
                    >
                        ${escapeHtml(type)}
                    </span>

                    <h3>
                        ${title}
                    </h3>

                </div>

            </div>


            <p class="admin-property-location">

                <span>⌖</span>

                ${locationText}

            </p>


            <p class="admin-property-description">

                ${description}

            </p>


            <div class="admin-property-meta">

                <span>
                    🛏 ${escapeHtml(String(bedrooms))}
                    ${bedrooms === 1 ? "Bedroom" : "Bedrooms"}
                </span>

                <span>
                    ◫ ${escapeHtml(String(bathrooms))}
                    ${bathrooms === 1 ? "Bathroom" : "Bathrooms"}
                </span>

                <span>
                    ◉ ${views} views
                </span>

            </div>


            <div class="admin-property-price">

                <strong>
                    ${escapeHtml(price)}
                </strong>

                <span>
                    / ${escapeHtml(pricePeriod)}
                </span>

            </div>


            <div class="admin-property-actions">

                <button
                    type="button"
                    class="admin-property-action view"
                    data-action="view"
                    data-id="${id}"
                >
                    View
                </button>


                ${
                    status === "published"
                        ? `
                            <button
                                type="button"
                                class="admin-property-action secondary"
                                data-action="unpublish"
                                data-id="${id}"
                            >
                                Unpublish
                            </button>
                        `
                        : status !== "archived"
                            ? `
                                <button
                                    type="button"
                                    class="admin-property-action primary"
                                    data-action="publish"
                                    data-id="${id}"
                                >
                                    Publish
                                </button>
                            `
                            : ""
                }


                ${
                    status !== "archived"
                        ? `
                            <button
                                type="button"
                                class="admin-property-action danger"
                                data-action="archive"
                                data-id="${id}"
                            >
                                Archive
                            </button>
                        `
                        : ""
                }

            </div>

        </div>

    </article>

`;


}

/* ============================================================
ACTION EVENTS
============================================================ */

function attachPropertyActions() {


const buttons =
    document.querySelectorAll(
        ".admin-property-action"
    );


buttons.forEach(button => {

    button.addEventListener(
        "click",
        handlePropertyAction
    );

});


}

/* ============================================================
PROPERTY ACTION HANDLER
============================================================ */

async function handlePropertyAction(event) {


const button =
    event.currentTarget;


const action =
    button.dataset.action;


const id =
    button.dataset.id;


if (!id || !action) {

    return;

}


if (action === "view") {

    window.location.href =
        `property-details.html?id=${encodeURIComponent(id)}`;

    return;

}


if (action === "publish") {

    await changePropertyStatus(
        id,
        "publish",
        button
    );

    return;

}


if (action === "unpublish") {

    await changePropertyStatus(
        id,
        "unpublish",
        button
    );

    return;

}


if (action === "archive") {

    await archiveProperty(
        id,
        button
    );

}


}

/* ============================================================
PUBLISH / UNPUBLISH
============================================================ */

async function changePropertyStatus(
id,
action,
button
) {


const property =
    findProperty(id);


if (!property) {

    return;

}


const title =
    property.Title ||
    "this property";


const isPublishing =
    action === "publish";


const confirmation =
    isPublishing
        ? `Publish "${title}"?`
        : `Unpublish "${title}" and move it back to draft?`;


if (!window.confirm(confirmation)) {

    return;

}


setButtonLoading(
    button,
    true,
    isPublishing
        ? "Publishing..."
        : "Unpublishing..."
);


try {

    await apiRequest(
        `/Properties/${encodeURIComponent(id)}/${action}`,
        {
            method: "POST"
        }
    );


    await loadAdminProperties();


    showToast(
        isPublishing
            ? "Property published successfully."
            : "Property unpublished successfully.",
        "success"
    );


} catch (error) {

    console.error(error);


    showToast(
        error.message ||
        "Unable to update property status.",
        "error"
    );


} finally {

    setButtonLoading(
        button,
        false
    );

}


}

/* ============================================================
ARCHIVE
============================================================ */

async function archiveProperty(
id,
button
) {


const property =
    findProperty(id);


if (!property) {

    return;

}


const title =
    property.Title ||
    "this property";


const confirmed =
    window.confirm(
        `Archive "${title}"?\n\n` +
        "The property will no longer be active."
    );


if (!confirmed) {

    return;

}


setButtonLoading(
    button,
    true,
    "Archiving..."
);


try {

    await apiRequest(
        `/Properties/${encodeURIComponent(id)}`,
        {
            method: "DELETE"
        }
    );


    await loadAdminProperties();


    showToast(
        "Property archived successfully.",
        "success"
    );


} catch (error) {

    console.error(error);


    showToast(
        error.message ||
        "Unable to archive property.",
        "error"
    );


} finally {

    setButtonLoading(
        button,
        false
    );

}


}

/* ============================================================
FIND PROPERTY
============================================================ */

function findProperty(id) {


return adminallProperties.find(
    property =>
        String(property.PropertyId) ===
        String(id)
);


}

/* ============================================================
IMAGE
============================================================ */

function getPrimaryImageUrl(property) {


const images =
    Array.isArray(property.Images)
        ? property.Images
        : [];


if (!images.length) {

    return "images/property-placeholder.jpg";

}


const primary =
    images.find(
        image =>
            image.IsPrimary === true
    );


const image =
    primary ||
    images[0];


const rawUrl =
    image?.ImageUrl;


if (!rawUrl) {

    return "images/property-placeholder.jpg";

}


if (
    rawUrl.startsWith("http://") ||
    rawUrl.startsWith("https://")
) {

    return rawUrl;

}


return `http://localhost:5073${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;


}

/* ============================================================
FORMATTING
============================================================ */

function normalizeStatus(status) {


return String(
    status || ""
)
    .trim()
    .toLowerCase();


}

function normalizeType(type) {


return String(
    type || ""
)
    .trim()
    .toLowerCase();


}

function formatStatus(status) {


const labels = {

    draft: "Draft",

    pending: "Pending",

    published: "Published",

    rented: "Rented",

    archived: "Archived"

};


return (
    labels[status] ||
    "Unknown"
);


}

function formatPropertyType(type) {


const labels = {

    "single-room":
        "Single Room",

    "single-room-porch":
        "Single Room + Porch",

    "chamber-hall":
        "Chamber & Hall",

    apartment:
        "Apartment",

    house:
        "House"

};


const normalized =
    normalizeType(type);


return (
    labels[normalized] ||
    type ||
    "Property"
);


}

function formatPricePeriod(period) {


const normalized =
    String(
        period || ""
    )
        .trim()
        .toLowerCase();


const labels = {

    monthly: "month",

    yearly: "year",

    daily: "day"

};


return (
    labels[normalized] ||
    normalized ||
    "period"
);


}

function formatCurrency(value) {


const number =
    Number(value);


if (
    !Number.isFinite(number)
) {

    return "GH₵ —";

}


return (
    "GH₵ " +
    number.toLocaleString(
        "en-GH",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    )
);


}

/* ============================================================
UI STATES
============================================================ */

function showLoading(container) {


container.innerHTML = `

    <div class="request-item">

        <div>

            <h3>
                Loading properties...
            </h3>

            <p>
                Please wait while HavenGH
                retrieves the property listings.
            </p>

        </div>

    </div>

`;


}

function showError(
container,
message
) {


container.innerHTML = `

    <div class="request-item">

        <div>

            <h3>
                Unable to load properties
            </h3>

            <p>
                ${escapeHtml(message)}
            </p>

            <button
                type="button"
                class="admin-property-action primary"
                id="admin-properties-retry"
                style="margin-top:12px;"
            >
                Try Again
            </button>

        </div>

    </div>

`;


const retry =
    document.getElementById(
        "admin-properties-retry"
    );


retry?.addEventListener(
    "click",
    loadAdminProperties
);


}

/* ============================================================
BUTTON LOADING
============================================================ */

function setButtonLoading(
button,
loading,
text = "Please wait..."
) {


if (!button) {

    return;

}


if (loading) {

    button.dataset.originalText =
        button.textContent;


    button.disabled =
        true;


    button.textContent =
        text;

} else {

    button.disabled =
        false;


    button.textContent =
        button.dataset.originalText ||
        button.textContent;

}


}

/* ============================================================
TOAST
============================================================ */

function showToast(
message,
type = "success"
) {


let toast =
    document.getElementById(
        "havenGH-admin-toast"
    );


if (!toast) {

    toast =
        document.createElement(
            "div"
        );


    toast.id =
        "havenGH-admin-toast";


    document.body.appendChild(
        toast
    );

}


toast.className =
    `havenGH-admin-toast ${type}`;


toast.textContent =
    message;


requestAnimationFrame(() => {

    toast.classList.add(
        "show"
    );

});


window.clearTimeout(
    toast._timeout
);


toast._timeout =
    window.setTimeout(() => {

        toast.classList.remove(
            "show"
        );

    }, 3500);


}

/* ============================================================
TEXT HELPERS
============================================================ */

function truncate(
text,
maxLength
) {


const value =
    String(text || "");


if (
    value.length <= maxLength
) {

    return value;

}


return (
    value.substring(
        0,
        maxLength
    ).trim() +
    "..."
);


}

function escapeHtml(value) {


return String(
    value ?? ""
)
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );


}

function escapeAttribute(value) {


return escapeHtml(value);


}

/* ============================================================
OPTIONAL GLOBAL REFRESH
============================================================ */

window.refreshAdminProperties =
loadAdminProperties;
