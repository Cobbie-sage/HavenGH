"use strict";

/* ============================================================
   HavenGH - Admin Stay in Ghana Management
   Direct ASP.NET Core API connection
============================================================ */

(function () {

    const API_BASE_URL = "https://havenghapi-production.up.railway.app";

    let allStays = [];
    let filteredStays = [];

    /* =========================================================
       AUTHENTICATION
    ========================================================= */

    function getToken() {

        return (
            sessionStorage.getItem("havenGH_token") ||
            localStorage.getItem("havenGH_token") ||
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            ""
        );
    }

    function clearSession() {

        sessionStorage.removeItem("havenGH_token");

        localStorage.removeItem("havenGH_token");
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
    }

    function redirectToLogin() {

        window.location.href = "login.html";
    }

    /* =========================================================
       API REQUEST
    ========================================================= */

    async function apiRequest(endpoint, options = {}) {

        const token = getToken();

        if (!token) {

            redirectToLogin();

            throw new Error(
                "Administrator authentication is required."
            );
        }

        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {})
        };

        headers.Authorization = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );

        if (response.status === 401) {

            clearSession();
            redirectToLogin();

            throw new Error(
                "Your administrator session has expired."
            );
        }

        if (response.status === 403) {

            throw new Error(
                "Administrator permission is required."
            );
        }

        let data = null;

        const contentType =
            response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {

            data = await response.json();

        } else {

            const text = await response.text();

            data = text
                ? { message: text }
                : null;
        }

        if (!response.ok) {

            throw new Error(
                data?.message ||
                `Request failed with status ${response.status}.`
            );
        }

        return data;
    }

    /* =========================================================
       DOM
    ========================================================= */

    const totalStaysElement =
        document.getElementById("totalStays");

    const pendingStaysElement =
        document.getElementById("pendingStays");

    const approvedStaysElement =
        document.getElementById("approvedStays");

    const suspendedStaysElement =
        document.getElementById("suspendedStays");

    const pendingApprovalBadge =
        document.getElementById("pendingApprovalBadge");

    const pendingStaysList =
        document.getElementById("pendingStaysList");

    const staysTableBody =
        document.getElementById("staysTableBody");

    const staySearch =
        document.getElementById("staySearch");

    const stayStatus =
        document.getElementById("stayStatus");

    const stayLocation =
        document.getElementById("stayLocation");

    const refreshButton =
        document.getElementById("refreshStaysButton");

    const notificationCount =
        document.getElementById("adminNotificationCount");

    /* =========================================================
       HELPERS
    ========================================================= */

    function normalizeCollection(data) {

        if (Array.isArray(data)) {
            return data;
        }

        if (Array.isArray(data?.items)) {
            return data.items;
        }

        if (Array.isArray(data?.stays)) {
            return data.stays;
        }

        return [];
    }

    function normalizeStatus(status) {

        return String(status || "")
            .trim()
            .toLowerCase();
    }

    function formatCurrency(value) {

        const amount = Number(value || 0);

        return new Intl.NumberFormat(
            "en-GH",
            {
                style: "currency",
                currency: "GHS",
                maximumFractionDigits: 2
            }
        ).format(amount);
    }

    function formatDate(value) {

        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
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

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getStatusClass(status) {

        const normalized =
            normalizeStatus(status);

        if (normalized === "published") {
            return "approved";
        }

        if (normalized === "pending") {
            return "pending";
        }

        if (normalized === "rejected") {
            return "rejected";
        }

        if (normalized === "suspended") {
            return "suspended";
        }

        return "draft";
    }

    function getStatusLabel(status) {

        const normalized =
            normalizeStatus(status);

        switch (normalized) {

            case "published":
                return "Approved";

            case "pending":
                return "Pending";

            case "rejected":
                return "Rejected";

            case "suspended":
                return "Suspended";

            case "draft":
                return "Draft";

            default:
                return status || "Unknown";
        }
    }

    function getStayLocation(stay) {

        return [
            stay.city,
            stay.area
        ]
            .filter(Boolean)
            .join(", ");
    }

    function getStayImage(stay) {

        if (!Array.isArray(stay.images)) {
            return "";
        }

        const primary =
            stay.images.find(
                image => image.isPrimary
            );

        return (
            primary?.imageUrl ||
            stay.images[0]?.imageUrl ||
            ""
        );
    }

    function resolveImageUrl(imageUrl) {

        if (!imageUrl) {
            return "";
        }

        if (
            imageUrl.startsWith("http://") ||
            imageUrl.startsWith("https://")
        ) {
            return imageUrl;
        }

        return `${API_BASE_URL}${imageUrl.startsWith("/")
            ? imageUrl
            : `/${imageUrl}`}`;
    }

    /* =========================================================
       STATISTICS
    ========================================================= */

    function updateStatistics() {

        const total =
            allStays.length;

        const pending =
            allStays.filter(
                stay =>
                    normalizeStatus(stay.status) ===
                    "pending"
            ).length;

        const published =
            allStays.filter(
                stay =>
                    normalizeStatus(stay.status) ===
                    "published"
            ).length;

        const suspended =
            allStays.filter(
                stay =>
                    normalizeStatus(stay.status) ===
                    "suspended"
            ).length;

        totalStaysElement.textContent =
            total;

        pendingStaysElement.textContent =
            pending;

        approvedStaysElement.textContent =
            published;

        suspendedStaysElement.textContent =
            suspended;

        pendingApprovalBadge.textContent =
            `${pending} Pending`;

        /*
         * Pending stays require administrator attention.
         */
        if (notificationCount) {

            notificationCount.textContent =
                pending;
        }
    }

    /* =========================================================
       LOAD ALL ADMIN STAYS
    ========================================================= */

    async function loadStays() {

        try {

            setLoadingState();

            const data =
                await apiRequest(
                    "/api/Stays/admin"
                );

            allStays =
                normalizeCollection(data);

            filteredStays =
                [...allStays];

            updateStatistics();

            applyFilters();

            renderPendingStays();

            console.log(
                "HavenGH Admin Stay Data:",
                allStays
            );

        }
        catch (error) {

            console.error(
                "HavenGH Admin Stays Error:",
                error
            );

            renderErrorState(
                error.message
            );
        }
    }

    /* =========================================================
       LOADING STATE
    ========================================================= */

    function setLoadingState() {

        if (staysTableBody) {

            staysTableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <h3>Loading stays...</h3>
                            <p>
                                Connecting to the HavenGH API.
                            </p>
                        </div>
                    </td>
                </tr>
            `;
        }

        if (pendingStaysList) {

            pendingStaysList.innerHTML = `
                <div class="request-item">
                    <div>
                        <h3>Loading approval queue...</h3>
                        <p>
                            Checking for pending stay submissions.
                        </p>
                    </div>
                </div>
            `;
        }
    }

    /* =========================================================
       ERROR STATE
    ========================================================= */

    function renderErrorState(message) {

        if (staysTableBody) {

            staysTableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <h3>Unable to load stays</h3>
                            <p>
                                ${escapeHtml(message)}
                            </p>
                            <button
                                type="button"
                                class="btn btn-dark"
                                id="retryStaysButton"
                            >
                                Try Again
                            </button>
                        </div>
                    </td>
                </tr>
            `;

            const retryButton =
                document.getElementById(
                    "retryStaysButton"
                );

            retryButton?.addEventListener(
                "click",
                loadStays
            );
        }

        if (pendingStaysList) {

            pendingStaysList.innerHTML = `
                <div class="request-item">
                    <div>
                        <h3>Unable to load approvals</h3>
                        <p>
                            ${escapeHtml(message)}
                        </p>
                    </div>
                </div>
            `;
        }
    }

    /* =========================================================
       FILTERING
    ========================================================= */

    function applyFilters() {

        const search =
            String(staySearch?.value || "")
                .trim()
                .toLowerCase();

        const status =
            String(stayStatus?.value || "all")
                .trim()
                .toLowerCase();

        const location =
            String(stayLocation?.value || "all")
                .trim()
                .toLowerCase();

        filteredStays =
            allStays.filter(stay => {

                const title =
                    String(stay.title || "")
                        .toLowerCase();

                const hostEmail =
                    String(
                        stay.host?.email || ""
                    ).toLowerCase();

                const hostPhone =
                    String(
                        stay.host?.phone || ""
                    ).toLowerCase();

                const city =
                    String(stay.city || "")
                        .toLowerCase();

                const area =
                    String(stay.area || "")
                        .toLowerCase();

                const matchesSearch =
                    !search ||
                    title.includes(search) ||
                    hostEmail.includes(search) ||
                    hostPhone.includes(search);

                const matchesStatus =
                    status === "all" ||
                    normalizeStatus(stay.status) ===
                    status;

                let matchesLocation = true;

                if (location !== "all") {

                    if (location === "other") {

                        matchesLocation =
                            ![
                                "accra",
                                "kumasi",
                                "cape coast",
                                "cape-coast",
                                "takoradi"
                            ].some(
                                cityName =>
                                    city.includes(cityName)
                            );

                    } else {

                        const locationText =
                            location.replace(
                                "-",
                                " "
                            );

                        matchesLocation =
                            city.includes(locationText) ||
                            area.includes(locationText);
                    }
                }

                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesLocation
                );
            });

        renderStaysTable();
    }

    /* =========================================================
       RENDER TABLE
    ========================================================= */

    function renderStaysTable() {

        if (!staysTableBody) {
            return;
        }

        if (!filteredStays.length) {

            staysTableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <h3>No stays found</h3>
                            <p>
                                No Stay in Ghana listings
                                match the current filters.
                            </p>
                        </div>
                    </td>
                </tr>
            `;

            return;
        }

        staysTableBody.innerHTML =
            filteredStays
                .map(renderStayRow)
                .join("");
    }

    function renderStayRow(stay) {

        const status =
            normalizeStatus(stay.status);

        const imageUrl =
            resolveImageUrl(
                getStayImage(stay)
            );

        const hostName =
            stay.host?.email ||
            stay.host?.phone ||
            (
                stay.host?.userId
                    ? `User #${stay.host.userId}`
                    : "Unknown host"
            );

        const location =
            getStayLocation(stay) ||
            "—";

        const imageHtml =
            imageUrl
                ? `
                    <img
                        src="${escapeHtml(imageUrl)}"
                        alt="${escapeHtml(stay.title)}"
                        class="admin-stay-thumb"
                        loading="lazy"
                    >
                  `
                : `
                    <div class="admin-stay-thumb-placeholder">
                        🏠
                    </div>
                  `;

        let actions = `
            <button
                type="button"
                class="btn btn-dark admin-stay-view"
                data-stay-id="${stay.stayId}"
            >
                View
            </button>
        `;

        if (status === "pending") {

            actions += `
                <button
                    type="button"
                    class="btn btn-primary admin-stay-approve"
                    data-stay-id="${stay.stayId}"
                >
                    Approve
                </button>

                <button
                    type="button"
                    class="btn btn-danger admin-stay-reject"
                    data-stay-id="${stay.stayId}"
                >
                    Reject
                </button>
            `;
        }

        return `
            <tr>

                <td>

                    <div class="admin-stay-cell">

                        ${imageHtml}

                        <div>

                            <strong>
                                ${escapeHtml(
                                    stay.title ||
                                    "Untitled stay"
                                )}
                            </strong>

                            <small>
                                ${escapeHtml(
                                    stay.stayType ||
                                    "Accommodation"
                                )}
                            </small>

                        </div>

                    </div>

                </td>

                <td>

                    <div class="admin-host-cell">

                        <strong>
                            ${escapeHtml(hostName)}
                        </strong>

                        ${
                            stay.host?.phone
                                ? `
                                    <small>
                                        ${escapeHtml(
                                            stay.host.phone
                                        )}
                                    </small>
                                  `
                                : ""
                        }

                    </div>

                </td>

                <td>
                    ${escapeHtml(location)}
                </td>

                <td>

                    <strong>
                        ${escapeHtml(
                            formatCurrency(
                                stay.pricePerNight
                            )
                        )}
                    </strong>

                    <small>
                        / night
                    </small>

                </td>

                <td>

                    <span
                        class="dashboard-status ${getStatusClass(status)}"
                    >
                        ${escapeHtml(
                            getStatusLabel(status)
                        )}
                    </span>

                </td>

                <td>

                    <div class="admin-stay-actions">

                        ${actions}

                    </div>

                </td>

            </tr>
        `;
    }

    /* =========================================================
       PENDING APPROVALS
    ========================================================= */

    function renderPendingStays() {

        if (!pendingStaysList) {
            return;
        }

        const pending =
            allStays.filter(
                stay =>
                    normalizeStatus(stay.status) ===
                    "pending"
            );

        if (!pending.length) {

            pendingStaysList.innerHTML = `
                <div class="request-item">
                    <div>
                        <h3>No pending submissions</h3>
                        <p>
                            There are currently no Stay in Ghana
                            listings awaiting administrator review.
                        </p>
                        <small>
                            Connected to HavenGH API
                        </small>
                    </div>
                </div>
            `;

            return;
        }

        pendingStaysList.innerHTML =
            pending
                .map(stay => {

                    const host =
                        stay.host?.email ||
                        stay.host?.phone ||
                        (
                            stay.host?.userId
                                ? `User #${stay.host.userId}`
                                : "Unknown host"
                        );

                    return `
                        <div class="request-item">

                            <div>

                                <h3>
                                    ${escapeHtml(
                                        stay.title ||
                                        "Untitled stay"
                                    )}
                                </h3>

                                <p>
                                    ${escapeHtml(
                                        getStayLocation(stay) ||
                                        "Location not provided"
                                    )}
                                </p>

                                <small>
                                    Host:
                                    ${escapeHtml(host)}
                                    · Submitted:
                                    ${escapeHtml(
                                        formatDate(
                                            stay.updatedAt ||
                                            stay.createdAt
                                        )
                                    )}
                                </small>

                            </div>

                            <div>

                                <button
                                    type="button"
                                    class="btn btn-primary admin-stay-approve"
                                    data-stay-id="${stay.stayId}"
                                >
                                    Approve
                                </button>

                                <button
                                    type="button"
                                    class="btn btn-danger admin-stay-reject"
                                    data-stay-id="${stay.stayId}"
                                >
                                    Reject
                                </button>

                            </div>

                        </div>
                    `;
                })
                .join("");
    }

    /* =========================================================
       APPROVE STAY
    ========================================================= */

    async function approveStay(stayId) {

        const stay =
            allStays.find(
                item =>
                    Number(item.stayId) ===
                    Number(stayId)
            );

        if (!stay) {
            return;
        }

        const confirmed =
            window.confirm(
                `Approve "${stay.title}" and publish it on HavenGH?`
            );

        if (!confirmed) {
            return;
        }

        try {

            await apiRequest(
                `/api/Stays/${stayId}/approve`,
                {
                    method: "POST"
                }
            );

            await loadStays();

            alert(
                "Stay approved and published successfully."
            );

        }
        catch (error) {

            console.error(
                "Approve stay error:",
                error
            );

            alert(
                error.message ||
                "Unable to approve this stay."
            );
        }
    }

    /* =========================================================
       REJECT STAY
    ========================================================= */

    async function rejectStay(stayId) {

        const stay =
            allStays.find(
                item =>
                    Number(item.stayId) ===
                    Number(stayId)
            );

        if (!stay) {
            return;
        }

        const confirmed =
            window.confirm(
                `Reject "${stay.title}"?`
            );

        if (!confirmed) {
            return;
        }

        try {

            await apiRequest(
                `/api/Stays/${stayId}/reject`,
                {
                    method: "POST"
                }
            );

            await loadStays();

            alert(
                "Stay rejected successfully."
            );

        }
        catch (error) {

            console.error(
                "Reject stay error:",
                error
            );

            alert(
                error.message ||
                "Unable to reject this stay."
            );
        }
    }

    /* =========================================================
       VIEW STAY
    ========================================================= */

    function viewStay(stayId) {

        const stay =
            allStays.find(
                item =>
                    Number(item.stayId) ===
                    Number(stayId)
            );

        if (!stay) {
            return;
        }

        const host =
            stay.host?.email ||
            stay.host?.phone ||
            (
                stay.host?.userId
                    ? `User #${stay.host.userId}`
                    : "Unknown host"
            );

        const message = [
            `Stay: ${stay.title || "Untitled"}`,
            `Type: ${stay.stayType || "—"}`,
            `Location: ${getStayLocation(stay) || "—"}`,
            `Price: ${formatCurrency(stay.pricePerNight)} / night`,
            `Bedrooms: ${stay.bedrooms ?? "—"}`,
            `Bathrooms: ${stay.bathrooms ?? "—"}`,
            `Rooms: ${stay.rooms ?? "—"}`,
            `Maximum guests: ${stay.maxGuests ?? "—"}`,
            `Status: ${getStatusLabel(stay.status)}`,
            `Host: ${host}`,
            `Created: ${formatDate(stay.createdAt)}`
        ].join("\n");

        window.alert(message);
    }

    /* =========================================================
       EVENTS
    ========================================================= */

    staySearch?.addEventListener(
        "input",
        applyFilters
    );

    stayStatus?.addEventListener(
        "change",
        applyFilters
    );

    stayLocation?.addEventListener(
        "change",
        applyFilters
    );

    refreshButton?.addEventListener(
        "click",
        loadStays
    );

    document.addEventListener(
        "click",
        function (event) {

            const approveButton =
                event.target.closest(
                    ".admin-stay-approve"
                );

            if (approveButton) {

                approveStay(
                    approveButton.dataset.stayId
                );

                return;
            }

            const rejectButton =
                event.target.closest(
                    ".admin-stay-reject"
                );

            if (rejectButton) {

                rejectStay(
                    rejectButton.dataset.stayId
                );

                return;
            }

            const viewButton =
                event.target.closest(
                    ".admin-stay-view"
                );

            if (viewButton) {

                viewStay(
                    viewButton.dataset.stayId
                );
            }
        }
    );

    /* =========================================================
       ADMIN VERIFICATION
    ========================================================= */

    async function verifyAdministrator() {

        const data =
            await apiRequest(
                "/api/Auth/me"
            );

        const role =
            String(
                data?.role ||
                data?.user?.role ||
                ""
            )
                .trim()
                .toLowerCase();

        if (
            role !== "admin" &&
            role !== "administrator"
        ) {

            clearSession();
            redirectToLogin();

            throw new Error(
                "Administrator access is required."
            );
        }

        return data;
    }

    /* =========================================================
       INITIALIZE
    ========================================================= */

    async function initialize() {

        try {

            await verifyAdministrator();

            await loadStays();

        }
        catch (error) {

            console.error(
                "HavenGH Admin Stay initialization error:",
                error
            );
        }
    }

    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );

})();