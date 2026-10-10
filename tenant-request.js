const API_BASE_URL = "http://localhost:5073/api";
const RENTAL_REQUESTS_API = `${API_BASE_URL}/RentalRequests`;

let allRequests = [];

// ============================================================
// AUTH
// ============================================================

function getToken() {
    return (
        sessionStorage.getItem("havenGH_token") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("accessToken") ||
        localStorage.getItem("havenGH_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken")
    );
}

function clearAuthentication() {
    [
        "havenGH_token",
        "token",
        "accessToken"
    ].forEach(key => {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
    });
}

// ============================================================
// API REQUEST
// ============================================================

async function apiRequest(url, options = {}) {
    const token = getToken();

    if (!token) {
        window.location.href = "login.html";
        throw new Error("You are not logged in.");
    }

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 401) {
        clearAuthentication();
        window.location.href = "login.html";
        throw new Error("Your session has expired. Please log in again.");
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
            data?.title ||
            "Unable to complete the request."
        );
    }

    return data;
}

// ============================================================
// HELPERS
// ============================================================

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
}

function formatDate(value) {
    if (!value) {
        return "Date unavailable";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleDateString("en-GH", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function formatPrice(price, pricePeriod) {
    if (price === null || price === undefined || price === "") {
        return "Price unavailable";
    }

    const number = Number(price);

    if (Number.isNaN(number)) {
        return escapeHtml(String(price));
    }

    const formatted = new Intl.NumberFormat("en-GH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(number);

    if (pricePeriod) {
        return `GH₵${formatted} <span>/ ${escapeHtml(pricePeriod)}</span>`;
    }

    return `GH₵${formatted}`;
}

function getPropertyTitle(request) {
    const property = request?.property;

    // IMPORTANT:
    // Use the real property title from the API.
    if (property?.title) {
        return property.title;
    }

    // Temporary fallback only if an old/incomplete API
    // response is encountered.
    return "Property information unavailable";
}

function getPropertyLocation(request) {
    const location = request?.property?.location;

    if (!location) {
        return "Location unavailable";
    }

    const parts = [
        location.area,
        location.city,
        location.region
    ].filter(Boolean);

    if (parts.length > 0) {
        return parts.join(", ");
    }

    if (location.addressLine) {
        return location.addressLine;
    }

    return "Location unavailable";
}

function getPropertyImage(request) {
    const image = request?.property?.primaryImage;

    if (!image) {
        return "images/property-1.jpg";
    }

    if (
        image.startsWith("http://") ||
        image.startsWith("https://")
    ) {
        return image;
    }

    if (image.startsWith("/")) {
        return `http://localhost:5073${image}`;
    }

    return image;
}

function normalizeStatus(status) {
    return String(status || "")
        .trim()
        .toLowerCase();
}

function formatStatus(status) {
    const normalized = normalizeStatus(status);

    return normalized.charAt(0).toUpperCase() +
        normalized.slice(1);
}

// ============================================================
// PAGE ELEMENTS
// ============================================================

const loadingElement =
    document.getElementById("request-loading");

const errorElement =
    document.getElementById("request-error");

const errorTextElement =
    document.getElementById("request-error-text");

const listElement =
    document.getElementById("tenant-request-list");

const emptyElement =
    document.getElementById("request-empty");

const searchElement =
    document.getElementById("request-search");

const statusElement =
    document.getElementById("request-status");

const retryButton =
    document.getElementById("request-retry");

const pendingCountElement =
    document.getElementById("pending-request-count");

const approvedCountElement =
    document.getElementById("approved-request-count");

const completedCountElement =
    document.getElementById("completed-request-count");

const totalCountElement =
    document.getElementById("total-request-count");

const sidebarCountElement =
    document.getElementById("sidebar-request-count");

// ============================================================
// LOAD REQUESTS
// ============================================================

async function loadRentalRequests() {
    showLoading();

    try {
        const data = await apiRequest(
            RENTAL_REQUESTS_API
        );

        allRequests =
            Array.isArray(data)
                ? data
                : [];

        updateSummary();
        renderRequests();

    } catch (error) {

        console.error(
            "Failed to load rental requests:",
            error
        );

        showError(
            error.message ||
            "Unable to load your rental requests."
        );
    }
}

// ============================================================
// SUMMARY
// ============================================================

function updateSummary() {
    const pending =
        allRequests.filter(
            request =>
                normalizeStatus(request.status) ===
                "pending"
        ).length;

    const approved =
        allRequests.filter(
            request =>
                normalizeStatus(request.status) ===
                "approved"
        ).length;

    const completed =
        allRequests.filter(
            request =>
                normalizeStatus(request.status) ===
                "completed"
        ).length;

    if (pendingCountElement) {
        pendingCountElement.textContent = pending;
    }

    if (approvedCountElement) {
        approvedCountElement.textContent = approved;
    }

    if (completedCountElement) {
        completedCountElement.textContent = completed;
    }

    if (totalCountElement) {
        totalCountElement.textContent =
            allRequests.length;
    }

    if (sidebarCountElement) {
        sidebarCountElement.textContent =
            pending;
    }
}

// ============================================================
// FILTERING
// ============================================================

function getFilteredRequests() {
    const search =
        String(searchElement?.value || "")
            .trim()
            .toLowerCase();

    const selectedStatus =
        normalizeStatus(
            statusElement?.value || ""
        );

    return allRequests.filter(request => {

        const property =
            request.property || {};

        const location =
            property.location || {};

        const searchableText = [
            property.title,
            property.propertyType,
            location.addressLine,
            location.area,
            location.city,
            location.region,
            location.country,
            request.message
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        const matchesSearch =
            !search ||
            searchableText.includes(search);

        const matchesStatus =
            !selectedStatus ||
            selectedStatus === "all" ||
            normalizeStatus(request.status) ===
                selectedStatus;

        return matchesSearch &&
            matchesStatus;
    });
}

// ============================================================
// RENDER REQUESTS
// ============================================================

function renderRequests() {
    const requests =
        getFilteredRequests();

    listElement.innerHTML = "";

    if (requests.length === 0) {
        listElement.style.display = "none";
        emptyElement.style.display = "block";
        return;
    }

    listElement.style.display = "grid";
    emptyElement.style.display = "none";

    requests.forEach(request => {
        listElement.appendChild(
            createRequestCard(request)
        );
    });
}

// ============================================================
// REQUEST CARD
// ============================================================

function createRequestCard(request) {

    const property =
        request.property || {};

    const location =
        property.location || {};

    const status =
        normalizeStatus(request.status);

    const card =
        document.createElement("article");

    card.className =
        "request-card";

    const propertyTitle =
        getPropertyTitle(request);

    const propertyLocation =
        getPropertyLocation(request);

    const imageUrl =
        getPropertyImage(request);

    const propertyId =
        request.propertyId ||
        property.propertyId;

    card.innerHTML = `
        <div class="request-property-image">
            <img
                src="${escapeHtml(imageUrl)}"
                alt="${escapeHtml(propertyTitle)}"
                loading="lazy"
                onerror="this.src='images/property-1.jpg';"
            >
        </div>

        <div class="request-card-content">

            <div class="request-card-top">

                <div>
                    <h3 class="request-card-title">
                        ${escapeHtml(propertyTitle)}
                    </h3>

                    <p class="request-card-location">
                        ${escapeHtml(propertyLocation)}
                    </p>
                </div>

                <span class="request-status ${escapeHtml(status)}">
                    ${escapeHtml(
                        formatStatus(status)
                    )}
                </span>

            </div>

            <div class="request-card-price">
                ${formatPrice(
                    property.price,
                    property.pricePeriod
                )}
            </div>

            ${
                property.propertyType
                    ? `
                        <div class="request-property-type">
                            ${escapeHtml(
                                property.propertyType
                            )}
                        </div>
                    `
                    : ""
            }

            ${
                request.message
                    ? `
                        <div class="request-message">
                            <strong>Your message</strong><br>
                            ${escapeHtml(
                                request.message
                            )}
                        </div>
                    `
                    : ""
            }

            <div class="request-meta">

                <div class="request-meta-item">
                    Requested:
                    <strong>
                        ${formatDate(
                            request.createdAt
                        )}
                    </strong>
                </div>

                <div class="request-meta-item">
                    Request ID:
                    <strong>
                        #${escapeHtml(
                            request.rentalRequestId
                        )}
                    </strong>
                </div>

            </div>

            <div class="request-card-actions">

                ${
                    propertyId
                        ? `
                            <a
                                href="property.html?id=${encodeURIComponent(propertyId)}"
                                class="btn request-view-property"
                            >
                                View Property
                            </a>
                        `
                        : ""
                }

                ${
                    status === "pending"
                        ? `
                            <button
                                type="button"
                                class="btn request-cancel-button"
                                data-request-id="${escapeHtml(
                                    request.rentalRequestId
                                )}"
                            >
                                Cancel Request
                            </button>
                        `
                        : ""
                }

            </div>

        </div>
    `;

    const cancelButton =
        card.querySelector(
            ".request-cancel-button"
        );

    if (cancelButton) {
        cancelButton.addEventListener(
            "click",
            () => cancelRentalRequest(
                request.rentalRequestId
            )
        );
    }

    return card;
}

// ============================================================
// CANCEL REQUEST
// ============================================================

async function cancelRentalRequest(requestId) {

    if (!requestId) {
        return;
    }

    const confirmed =
        window.confirm(
            "Are you sure you want to cancel this rental request?"
        );

    if (!confirmed) {
        return;
    }

    try {

        await apiRequest(
            `${RENTAL_REQUESTS_API}/${requestId}/cancel`,
            {
                method: "PUT"
            }
        );

        await loadRentalRequests();

    } catch (error) {

        console.error(
            "Failed to cancel rental request:",
            error
        );

        showError(
            error.message ||
            "Unable to cancel the rental request."
        );
    }
}

// ============================================================
// UI STATES
// ============================================================

function showLoading() {

    loadingElement.style.display = "flex";
    errorElement.style.display = "none";
    listElement.style.display = "none";
    emptyElement.style.display = "none";
}

function showError(message) {

    loadingElement.style.display = "none";
    listElement.style.display = "none";
    emptyElement.style.display = "none";

    errorElement.style.display = "block";

    if (errorTextElement) {
        errorTextElement.textContent =
            message;
    }
}

// ============================================================
// SEARCH / FILTER
// ============================================================

if (searchElement) {
    searchElement.addEventListener(
        "input",
        renderRequests
    );
}

if (statusElement) {
    statusElement.addEventListener(
        "change",
        renderRequests
    );
}

if (retryButton) {
    retryButton.addEventListener(
        "click",
        loadRentalRequests
    );
}

// ============================================================
// LOGOUT
// ============================================================

document
    .querySelector(".dashboard-logout")
    ?.addEventListener("click", event => {

        event.preventDefault();

        clearAuthentication();

        window.location.href =
            "login.html";
    });

// ============================================================
// START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {
        loadRentalRequests();
    }
);