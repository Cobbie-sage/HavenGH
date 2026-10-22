
(function () {

    "use strict";


    /* =========================================================
       HAVENGH ADMIN DASHBOARD
       ASP.NET CORE API CONNECTION
    ========================================================== */

    const ADMIN_API_BASE_URL =
        "https://havenghapi-production.up.railway.app";


    /* =========================================================
       STATE
    ========================================================== */

    let currentAdminStays = [];
    let selectedStay = null;

    let adminProperties = [];
    let currentPropertyFilter = "pending";
    let currentReviewProperty = null;


    /* =========================================================
       DOM ELEMENTS
    ========================================================== */

    const elements = {

        date:
            document.getElementById(
                "adminDashboardDate"
            ),

        totalUsers:
            document.getElementById(
                "totalUsersCount"
            ),

        propertyCount:
            document.getElementById(
                "propertyCount"
            ),

        stayCount:
            document.getElementById(
                "stayCount"
            ),

        rentalRequestCount:
            document.getElementById(
                "rentalRequestCount"
            ),

        pendingCount:
            document.getElementById(
                "pendingCount"
            ),

        recentStays:
            document.getElementById(
                "recentStaySubmissions"
            ),

        pendingStays:
            document.getElementById(
                "pendingStayApprovals"
            ),

        pendingProperties:
          document.getElementById(
        "adminPropertyList"
    ),

        hostCount:
            document.getElementById(
                "stayHostCount"
            ),

        securityStatus:
            document.getElementById(
                "adminSecurityStatus"
            ),

        securityProgress:
            document.getElementById(
                "adminSecurityProgress"
            ),

        securityMessage:
            document.getElementById(
                "adminSecurityMessage"
            ),

        notificationCount:
            document.getElementById(
                "adminNotificationCount"
            )

    };


    /* =========================================================
       STAY REVIEW MODAL
    ========================================================== */

    const reviewElements = {

        modal:
            document.getElementById(
                "stayReviewModal"
            ),

        title:
            document.getElementById(
                "stayReviewTitle"
            ),

        subtitle:
            document.getElementById(
                "stayReviewSubtitle"
            ),

        content:
            document.getElementById(
                "stayReviewContent"
            ),

        actions:
            document.getElementById(
                "stayReviewActions"
            ),

        message:
            document.getElementById(
                "stayReviewMessage"
            ),

        approve:
            document.getElementById(
                "approveStayButton"
            ),

        reject:
            document.getElementById(
                "rejectStayButton"
            ),

        close:
            document.getElementById(
                "closeStayReview"
            )

    };


    /* =========================================================
       AUTHENTICATION TOKEN
    ========================================================== */

    function getToken() {

        return (
            sessionStorage.getItem("havenGH_token") ||
            localStorage.getItem("havenGH_token") ||
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            ""
        );

    }


    /* =========================================================
       CLEAR AUTHENTICATION
    ========================================================== */

    function clearAuthentication() {

        sessionStorage.removeItem(
            "havenGH_token"
        );

        localStorage.removeItem(
            "havenGH_token"
        );

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "accessToken"
        );

    }


    /* =========================================================
       REDIRECT TO LOGIN
    ========================================================== */

    function redirectToLogin() {

        clearAuthentication();

        window.location.replace(
            "login.html"
        );

    }


    /* =========================================================
       ADMIN LOGOUT
    ========================================================== */

    async function logoutAdministrator() {

        const token =
            getToken();

        const logoutButton =
            document.getElementById(
                "adminLogoutButton"
            );

        if (logoutButton) {

            logoutButton.disabled =
                true;

            logoutButton.style.pointerEvents =
                "none";

            logoutButton.dataset.originalText =
                logoutButton.innerHTML;

            logoutButton.innerHTML = `
                <span>↪</span>
                <span>Logging out...</span>
            `;

        }


        try {

            if (token) {

                await fetch(
                    `${ADMIN_API_BASE_URL}/api/Auth/logout`,
                    {
                        method: "POST",

                        headers: {
                            "Accept":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        },

                        cache: "no-store"
                    }
                );

            }

        }
        catch (error) {

            console.warn(
                "Logout request failed:",
                error
            );

        }
        finally {

            clearAuthentication();

            window.location.replace(
                "login.html"
            );

        }

    }


    /* =========================================================
       HTML ESCAPING
    ========================================================== */

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


    function escapeAttribute(value) {

        return escapeHtml(value);

    }


    /* =========================================================
       API GET
       IMPORTANT:
       This function returns PARSED JSON.
       Do not use response.ok/json/text after calling it.
    ========================================================== */

    async function apiRequest(endpoint) {

        const token =
            getToken();

        if (!token) {

            redirectToLogin();

            throw new Error(
                "Administrator login session was not found."
            );

        }


        const response =
            await fetch(
                `${ADMIN_API_BASE_URL}${endpoint}`,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    cache: "no-store"
                }
            );


        if (response.status === 401) {

            clearAuthentication();

            redirectToLogin();

            throw new Error(
                "Your administrator session has expired."
            );

        }


        if (response.status === 403) {

            throw new Error(
                "Administrator access is required."
            );

        }


        if (!response.ok) {

            let message =
                `API request failed (${response.status}).`;


            try {

                const errorData =
                    await response.json();

                message =
                    errorData?.message ||
                    errorData?.title ||
                    message;

            }
            catch {

                // Keep default error.

            }


            throw new Error(
                message
            );

        }


        const text =
            await response.text();


        if (!text) {

            return null;

        }


        try {

            return JSON.parse(text);

        }
        catch {

            return text;

        }

    }


    /* =========================================================
       API POST
       Returns parsed JSON.
    ========================================================== */

    async function adminPostRequest(
        endpoint,
        body = null
    ) {

        const token =
            getToken();

        if (!token) {

            redirectToLogin();

            throw new Error(
                "Administrator login session was not found."
            );

        }


        const requestOptions = {

            method: "POST",

            headers: {

                "Accept":
                    "application/json",

                "Authorization":
                    `Bearer ${token}`

            }

        };


        if (body !== null) {

            requestOptions.headers[
                "Content-Type"
            ] =
                "application/json";

            requestOptions.body =
                JSON.stringify(body);

        }


        const response =
            await fetch(
                `${ADMIN_API_BASE_URL}${endpoint}`,
                requestOptions
            );


        if (response.status === 401) {

            clearAuthentication();

            redirectToLogin();

            throw new Error(
                "Your administrator session has expired."
            );

        }


        if (response.status === 403) {

            throw new Error(
                "Administrator access is required."
            );

        }


        const text =
            await response.text();

        let data = null;


        if (text) {

            try {

                data =
                    JSON.parse(text);

            }
            catch {

                data = {
                    message: text
                };

            }

        }


        if (!response.ok) {

            throw new Error(
                data?.message ||
                data?.title ||
                `Admin action failed (${response.status}).`
            );

        }


        return data;

    }


    /* =========================================================
       NUMBER FORMAT
    ========================================================== */

    function formatNumber(value) {

        const number =
            Number(value);

        if (!Number.isFinite(number)) {

            return "0";

        }

        return number.toLocaleString(
            "en-GH"
        );

    }


    /* =========================================================
       PRICE FORMAT - STAYS
    ========================================================== */

    function formatPrice(value) {

        const amount =
            Number(value);

        if (!Number.isFinite(amount)) {

            return "Price not set";

        }


        return new Intl.NumberFormat(
            "en-GH",
            {
                style: "currency",
                currency: "GHS",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        ).format(amount) +
        " / night";

    }


    /* =========================================================
       LOCATION - STAYS
    ========================================================== */

    function getLocation(stay) {

        const area =
            String(
                stay?.area ??
                stay?.Area ??
                ""
            ).trim();


        const city =
            String(
                stay?.city ??
                stay?.City ??
                ""
            ).trim();


        if (area && city) {

            return `${area}, ${city}`;

        }


        return (
            city ||
            area ||
            "Location not provided"
        );

    }


    /* =========================================================
       HOST - STAYS
    ========================================================== */

    function getHost(stay) {

        const host =
            stay?.host ||
            stay?.Host ||
            stay?.owner ||
            stay?.Owner ||
            stay?.ownerUser ||
            stay?.OwnerUser ||
            null;


        if (!host) {

            const ownerId =
                stay?.ownerUserId ??
                stay?.OwnerUserId;

            if (ownerId !== null &&
                ownerId !== undefined) {

                return `Host #${ownerId}`;

            }

            return "Stay Host";

        }


        if (host.email ||
            host.Email) {

            return (
                host.email ||
                host.Email
            );

        }


        if (host.phone ||
            host.Phone) {

            return (
                host.phone ||
                host.Phone
            );

        }


        const userId =
            host.userId ??
            host.UserId;


        if (userId) {

            return `Host #${userId}`;

        }


        return "Stay Host";

    }


    /* =========================================================
       STATUS CLASS
    ========================================================== */

    function statusClass(status) {

        const normalized =
            String(
                status || "draft"
            ).toLowerCase();


        switch (normalized) {

            case "pending":
                return "admin-status-pending";

            case "published":
                return "admin-status-published";

            case "rejected":
                return "admin-status-rejected";

            case "approved":
                return "admin-status-published";

            case "cancelled":
                return "admin-status-rejected";

            default:
                return "admin-status-draft";

        }

    }
        /*======= normalizeCollection=============*/

  function normalizeCollection(response) {

    if (Array.isArray(response)) {
        return response;
    }

    if (
        response &&
        Array.isArray(response.items)
    ) {
        return response.items;
    }

    if (
        response &&
        Array.isArray(response.Items)
    ) {
        return response.Items;
    }

    if (
        response &&
        Array.isArray(response.data)
    ) {
        return response.data;
    }

    if (
        response &&
        Array.isArray(response.Data)
    ) {
        return response.Data;
    }

    // Property API responses
    if (
        response &&
        Array.isArray(response.properties)
    ) {
        return response.properties;
    }

    if (
        response &&
        Array.isArray(response.Properties)
    ) {
        return response.Properties;
    }

    // Generic collection wrappers
    if (
        response &&
        Array.isArray(response.results)
    ) {
        return response.results;
    }

    if (
        response &&
        Array.isArray(response.Results)
    ) {
        return response.Results;
    }

    return [];
}


    /* =========================================================
       DATE
    ========================================================== */

    function renderDate() {

        if (!elements.date) {
            return;
        }


        elements.date.textContent =
            new Date().toLocaleDateString(
                "en-GH",
                {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            );

    }


    /* =========================================================
       CREATE STAY CARD
    ========================================================== */

   /* =========================================================
   CREATE STAY CARD
========================================================== */

function createStayCard(stay) {

    const stayId =
        Number(
            stay?.stayId ??
            stay?.StayId ??
            0
        );


    /* -----------------------------------------------------
       TITLE
    ----------------------------------------------------- */

    const title =
        escapeHtml(
            stay?.title ??
            stay?.Title ??
            "Untitled Stay"
        );


    /* -----------------------------------------------------
       LOCATION
    ----------------------------------------------------- */

    const location =
        escapeHtml(
            getLocation(stay)
        );


    /* -----------------------------------------------------
       STAY TYPE
    ----------------------------------------------------- */

    const type =
        escapeHtml(
            stay?.stayType ??
            stay?.StayType ??
            "Accommodation"
        );


    /* -----------------------------------------------------
       HOST
    ----------------------------------------------------- */

    const host =
        escapeHtml(
            getHost(stay)
        );


    /* -----------------------------------------------------
       PRICE
    ----------------------------------------------------- */

    const price =
        escapeHtml(
            formatPrice(
                stay?.pricePerNight ??
                stay?.PricePerNight
            )
        );


    /* -----------------------------------------------------
       STATUS
    ----------------------------------------------------- */

    const rawStatus =
        String(
            stay?.status ??
            stay?.Status ??
            "draft"
        )
            .trim()
            .toLowerCase();


    const status =
        escapeHtml(
            rawStatus
        );


    /* -----------------------------------------------------
       REVIEW BUTTON
    ----------------------------------------------------- */

    const reviewButton =
        rawStatus === "pending"
            ? `
                <button
                    type="button"
                    class="admin-stay-review-button"
                    data-review-stay="${stayId}">
                    Review Stay →
                </button>
              `
            : "";


    /* -----------------------------------------------------
       CARD
    ----------------------------------------------------- */

    return `

        <article class="admin-stay-item">

            <div class="admin-stay-main">

                <h3 class="admin-stay-title">
                    ${title}
                </h3>


                <p class="admin-stay-location">

                    ${type}

                    <span aria-hidden="true">
                        ·
                    </span>

                    ${location}

                </p>


                <div class="admin-stay-meta">

                    Host:
                    ${host}

                </div>


                ${reviewButton}

            </div>


            <div class="admin-stay-side">

                <span class="admin-stay-price">
                    ${price}
                </span>


                <span
                    class="admin-status ${statusClass(rawStatus)}">

                    ${status}

                </span>

            </div>

        </article>

    `;

}
    /* =========================================================
       RENDER RECENT STAYS
    ========================================================== */

    function renderRecentStays(stays) {

        if (!elements.recentStays) {
            return;
        }


        if (!stays.length) {

            elements.recentStays.innerHTML = `

                <div class="admin-empty-state">

                    <strong>
                        No Stay submissions yet
                    </strong>

                    <span>
                        New Stay in Ghana accommodations
                        will appear here when hosts create them.
                    </span>

                </div>

            `;

            return;

        }


      const recent =
    [...stays]
        .sort(
            (a, b) =>
                new Date(
                    b.createdAt ??
                    b.CreatedAt ??
                    0
                ) -
                new Date(
                    a.createdAt ??
                    a.CreatedAt ??
                    0
                )
        )
        .slice(0, 5);


        elements.recentStays.innerHTML =
            recent
                .map(createStayCard)
                .join("");

    }


    /* =========================================================
       RENDER PENDING STAYS
    ========================================================== */

    function renderPendingStays(stays) {

        if (!elements.pendingStays) {
            return;
        }


        if (!stays.length) {

            elements.pendingStays.innerHTML = `

                <div class="admin-empty-state">

                    <strong>
                        No pending Stay reviews
                    </strong>

                    <span>
                        There are currently no accommodation
                        submissions waiting for administrator review.
                    </span>

                </div>

            `;

            return;

        }


        elements.pendingStays.innerHTML =
            stays
                .slice(0, 5)
                .map(createStayCard)
                .join("");

    }


    /* =========================================================
       RENDER STATISTICS
    ========================================================== */

    function renderStatistics(statistics) {

        if (!statistics) {
            return;
        }


        if (elements.totalUsers) {

            elements.totalUsers.textContent =
                formatNumber(
                    statistics.totalUsers ??
                    statistics.TotalUsers
                );

        }


        if (elements.propertyCount) {

            elements.propertyCount.textContent =
                formatNumber(
                    statistics.totalProperties ??
                    statistics.TotalProperties
                );

        }


        if (elements.stayCount) {

            elements.stayCount.textContent =
                formatNumber(
                    statistics.totalStays ??
                    statistics.TotalStays
                );

        }


        if (elements.rentalRequestCount) {

            elements.rentalRequestCount.textContent =
                formatNumber(
                    statistics.totalRentalRequests ??
                    statistics.TotalRentalRequests
                );

        }


        const pendingStays =
            Number(
                statistics.pendingStays ??
                statistics.PendingStays ??
                0
            );


        const pendingRentals =
            Number(
                statistics.pendingRentalRequests ??
                statistics.PendingRentalRequests ??
                0
            );


        const pendingBookings =
            Number(
                statistics.pendingStayBookings ??
                statistics.PendingStayBookings ??
                0
            );


        const pendingVerifications =
            Number(
                statistics.pendingVerifications ??
                statistics.PendingVerifications ??
                0
            );


        const pendingProperties =
            Number(
                statistics.pendingProperties ??
                statistics.PendingProperties ??
                0
            );


        const totalPending =
            pendingStays +
            pendingRentals +
            pendingBookings +
            pendingVerifications +
            pendingProperties;


        if (elements.pendingCount) {

            elements.pendingCount.textContent =
                formatNumber(
                    totalPending
                );

        }


        if (elements.notificationCount) {

            elements.notificationCount.textContent =
                formatNumber(
                    totalPending
                );

        }


        if (elements.hostCount) {

            elements.hostCount.textContent =
                formatNumber(
                    statistics.stayHostCount ??
                    statistics.StayHostCount ??
                    0
                );

        }


        console.log(
            "HavenGH Admin Statistics:",
            statistics
        );

    }


    /* =========================================================
       LOAD CENTRAL ADMIN DASHBOARD
    ========================================================== */

    async function loadAdminDashboard() {

        const response =
            await apiRequest(
                "/api/Admin/dashboard"
            );


        if (!response) {

            throw new Error(
                "The Admin Dashboard returned an empty response."
            );

        }


        renderStatistics(
            response.statistics ??
            response.Statistics
        );


        currentAdminStays =
            normalizeCollection(
                response.recentStays ??
                response.RecentStays
            );


        await loadStayData();

        await loadAdminProperties();


        console.log(
            "HavenGH Admin Dashboard:",
            response
        );


        return response;

    }


    /* =========================================================
       LOAD STAY DATA
    ========================================================== */

    async function loadStayData() {

        try {

            const response =
                await apiRequest(
                    "/api/Stays/admin"
                );


            const stays =
                normalizeCollection(
                    response
                );


            currentAdminStays =
                stays;


            const pending =
                stays.filter(
                    stay =>
                        normalizeStatus(
                            stay.status ??
                            stay.Status
                        ) === "pending"
                );


            const hostIds =
                new Set();


            stays.forEach(
                stay => {

                    const host =
                        stay.host ||
                        stay.Host ||
                        stay.owner ||
                        stay.Owner ||
                        stay.ownerUser ||
                        stay.OwnerUser ||
                        null;


                    const hostId =
                        stay.ownerUserId ??
                        stay.OwnerUserId ??
                        host?.userId ??
                        host?.UserId;


                    if (
                        hostId !== null &&
                        hostId !== undefined
                    ) {

                        hostIds.add(
                            String(hostId)
                        );

                    }

                }
            );


            if (elements.stayCount) {

                elements.stayCount.textContent =
                    formatNumber(
                        stays.length
                    );

            }


            if (elements.hostCount) {

                elements.hostCount.textContent =
                    formatNumber(
                        hostIds.size
                    );

            }


            renderRecentStays(
                stays
            );


            renderPendingStays(
                pending
            );


            console.log(
                "HavenGH Admin Stay Data:",
                stays
            );

        }
        catch (error) {

            console.error(
                "Stay data loading error:",
                error
            );


            if (elements.recentStays) {

                elements.recentStays.innerHTML = `
                    <div class="admin-empty-state">
                        <strong>Stay data unavailable</strong>
                        <span>
                            ${escapeHtml(error.message)}
                        </span>
                    </div>
                `;

            }


            if (elements.pendingStays) {

                elements.pendingStays.innerHTML = `
                    <div class="admin-empty-state">
                        <strong>Stay approvals unavailable</strong>
                        <span>
                            ${escapeHtml(error.message)}
                        </span>
                    </div>
                `;

            }

        }

    }


    /* =========================================================
       VERIFY ADMINISTRATOR
    ========================================================== */

    async function verifyAdministrator() {

        const token =
            getToken();


        if (!token) {

            redirectToLogin();

            throw new Error(
                "Administrator login session was not found."
            );

        }


        const user =
            await apiRequest(
                "/api/Auth/me"
            );


        const role =
            String(
                user?.role ??
                user?.roleName ??
                user?.Role ??
                user?.RoleName ??
                ""
            )
                .trim()
                .toLowerCase();


        if (
            role !== "admin" &&
            role !== "administrator"
        ) {

            clearAuthentication();

            window.location.replace(
                "login.html"
            );

            throw new Error(
                "This account does not have administrator access."
            );

        }


        return user;

    }


    /* =========================================================
       SECURITY SUCCESS
    ========================================================== */

    function showSecuritySuccess() {

        if (elements.securityStatus) {

            elements.securityStatus.textContent =
                "Enabled";

        }


        if (elements.securityProgress) {

            elements.securityProgress.style.width =
                "100%";

        }


        if (elements.securityMessage) {

            elements.securityMessage.textContent =
                "JWT authentication and Admin role verification are active.";

        }

    }


    /* =========================================================
       SECURITY FAILURE
    ========================================================== */

    function showSecurityFailure(message) {

        if (elements.securityStatus) {

            elements.securityStatus.textContent =
                "Attention";

        }


        if (elements.securityProgress) {

            elements.securityProgress.style.width =
                "25%";

        }


        if (elements.securityMessage) {

            elements.securityMessage.textContent =
                message ||
                "Unable to verify administrator services.";

        }

    }


    /* =========================================================
       STAY IMAGE URL
    ========================================================== */

    function getStayImageUrl(image) {

        const rawUrl =
            image?.imageUrl ??
            image?.ImageUrl ??
            image?.url ??
            image?.Url ??
            "";


        if (!rawUrl) {

            return "";

        }


        if (
            rawUrl.startsWith("http://") ||
            rawUrl.startsWith("https://")
        ) {

            return rawUrl;

        }


        return `${ADMIN_API_BASE_URL}${rawUrl}`;

    }


    /* =========================================================
       OPEN STAY REVIEW
    ========================================================== */

    /* =========================================================
   OPEN STAY REVIEW
   SAFE VERSION
========================================================== */

function openStayReview(stay) {

    try {

        if (!reviewElements.modal) {

            console.error(
                "Stay Review modal was not found."
            );

            return;

        }


        if (!stay || typeof stay !== "object") {

            console.error(
                "Invalid Stay supplied to openStayReview:",
                stay
            );

            return;

        }


        selectedStay = stay;


        /* -------------------------------------------------
           BASIC INFORMATION
        ------------------------------------------------- */

        const stayTitle =
            String(
                stay.title ??
                stay.Title ??
                "Stay Review"
            );


        const stayDescription =
            String(
                stay.description ??
                stay.Description ??
                "No description provided."
            );


        const stayAmenities =
            String(
                stay.amenities ??
                stay.Amenities ??
                "No amenities provided."
            );


        const stayType =
            String(
                stay.stayType ??
                stay.StayType ??
                "Not provided"
            );


        const stayStatus =
            String(
                stay.status ??
                stay.Status ??
                "pending"
            );


        const stayPrice =
            stay.pricePerNight ??
            stay.PricePerNight;


        const maxGuests =
            stay.maxGuests ??
            stay.MaxGuests ??
            "Not provided";


        const bedrooms =
            stay.bedrooms ??
            stay.Bedrooms ??
            "Not specified";


        const bathrooms =
            stay.bathrooms ??
            stay.Bathrooms ??
            "Not specified";


        /* -------------------------------------------------
           HOST
        ------------------------------------------------- */

        const host =
            stay.host ??
            stay.Host ??
            stay.owner ??
            stay.Owner ??
            stay.ownerUser ??
            stay.OwnerUser ??
            null;


        let hostName = "Stay Host";


        if (host && typeof host === "object") {

            hostName =
                host.email ??
                host.Email ??
                host.phone ??
                host.Phone ??
                (
                    host.userId ??
                    host.UserId
                        ? `Host #${
                            host.userId ??
                            host.UserId
                        }`
                        : "Stay Host"
                );

        }
        else {

            const ownerId =
                stay.ownerUserId ??
                stay.OwnerUserId;


            if (
                ownerId !== null &&
                ownerId !== undefined &&
                ownerId !== ""
            ) {

                hostName =
                    `Host #${ownerId}`;

            }

        }


        /* -------------------------------------------------
           UPDATE HEADER
        ------------------------------------------------- */

        if (reviewElements.title) {

            reviewElements.title.textContent =
                stayTitle;

        }


        if (reviewElements.subtitle) {

            reviewElements.subtitle.textContent =
                "Review this accommodation before deciding whether it should be published.";

        }


        if (reviewElements.message) {

            reviewElements.message.className =
                "stay-review-message";

            reviewElements.message.textContent =
                "";

        }


        /* -------------------------------------------------
           IMAGES
        ------------------------------------------------- */

        let images =
            stay.images ??
            stay.Images ??
            [];


        if (!Array.isArray(images)) {

            images = [];

        }


        /*
         * Create a COPY before sorting.
         * This prevents us from modifying the API
         * response stored in currentAdminStays.
         */

        images =
            [...images].sort(
                (a, b) => {

                    const orderA =
                        Number(
                            a?.displayOrder ??
                            a?.DisplayOrder ??
                            0
                        );


                    const orderB =
                        Number(
                            b?.displayOrder ??
                            b?.DisplayOrder ??
                            0
                        );


                    return (
                        (Number.isFinite(orderA)
                            ? orderA
                            : 0) -
                        (Number.isFinite(orderB)
                            ? orderB
                            : 0)
                    );

                }
            );


        let imageHtml = "";


        if (images.length) {

            imageHtml =
                images
                    .map(
                        image => {

                            try {

                                const imageUrl =
                                    getStayImageUrl(
                                        image
                                    );


                                if (!imageUrl) {

                                    return "";

                                }


                                return `
                                    <img
                                        class="stay-review-image"
                                        src="${escapeAttribute(imageUrl)}"
                                        alt="${escapeAttribute(stayTitle)}"
                                        loading="lazy">
                                `;

                            }
                            catch (imageError) {

                                console.warn(
                                    "Unable to render Stay image:",
                                    imageError
                                );

                                return "";

                            }

                        }
                    )
                    .join("");

        }


        if (!imageHtml) {

            imageHtml = `
                <div class="stay-review-no-images">
                    No accommodation images have been uploaded.
                </div>
            `;

        }


        /* -------------------------------------------------
           BUILD REVIEW CONTENT
        ------------------------------------------------- */

        if (!reviewElements.content) {

            console.error(
                "stayReviewContent element was not found."
            );

            return;

        }


        reviewElements.content.innerHTML = `

            <div class="stay-review-grid">

                ${stayReviewDetail(
                    "Stay Type",
                    stayType
                )}

                ${stayReviewDetail(
                    "Status",
                    stayStatus
                )}

                ${stayReviewDetail(
                    "Location",
                    getLocation(stay)
                )}

                ${stayReviewDetail(
                    "Price",
                    formatPrice(stayPrice)
                )}

                ${stayReviewDetail(
                    "Maximum Guests",
                    maxGuests
                )}

                ${stayReviewDetail(
                    "Host",
                    hostName
                )}

                ${stayReviewDetail(
                    "Bedrooms",
                    bedrooms
                )}

                ${stayReviewDetail(
                    "Bathrooms",
                    bathrooms
                )}

            </div>


            <div class="stay-review-images">

                ${imageHtml}

            </div>


            <div class="stay-review-description">

                <h3>
                    Description
                </h3>

                <p>
                    ${escapeHtml(stayDescription)}
                </p>

            </div>


            <div class="stay-review-amenities">

                <h3>
                    Amenities
                </h3>

                <p>
                    ${escapeHtml(stayAmenities)}
                </p>

            </div>

        `;


        /* -------------------------------------------------
           ENABLE ACTIONS
        ------------------------------------------------- */

        if (reviewElements.actions) {

            reviewElements.actions.style.display =
                "flex";

        }


        if (reviewElements.approve) {

            reviewElements.approve.disabled =
                false;

            reviewElements.approve.textContent =
                "Approve & Publish";

        }


        if (reviewElements.reject) {

            reviewElements.reject.disabled =
                false;

            reviewElements.reject.textContent =
                "Reject Stay";

        }


        /* -------------------------------------------------
           OPEN MODAL
        ------------------------------------------------- */

        reviewElements.modal.classList.add(
            "is-open"
        );


        reviewElements.modal.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.style.overflow =
            "hidden";


        console.log(
            "Stay Review opened successfully:",
            stay
        );

    }
    catch (error) {

        console.error(
            "OPEN STAY REVIEW ERROR:",
            error
        );


        selectedStay =
            null;


        if (reviewElements.content) {

            reviewElements.content.innerHTML = `

                <div class="admin-empty-state">

                    <strong>
                        Unable to prepare Stay review
                    </strong>

                    <span>
                        ${escapeHtml(
                            error?.message ||
                            "An unexpected error occurred while opening the Stay review."
                        )}
                    </span>

                </div>

            `;

        }


        if (reviewElements.modal) {

            reviewElements.modal.classList.add(
                "is-open"
            );

            reviewElements.modal.setAttribute(
                "aria-hidden",
                "false"
            );

        }

    }

}
    function stayReviewDetail(label, value) {

        return `
            <div class="stay-review-detail">

                <span class="stay-review-detail-label">
                    ${escapeHtml(label)}
                </span>

                <span class="stay-review-detail-value">
                    ${escapeHtml(value)}
                </span>

            </div>
        `;

    }


    /* =========================================================
       CLOSE STAY REVIEW
    ========================================================== */

    function closeStayReview() {

        if (!reviewElements.modal) {
            return;
        }


        reviewElements.modal.classList.remove(
            "is-open"
        );


        reviewElements.modal.setAttribute(
            "aria-hidden",
            "true"
        );


        document.body.style.overflow =
            "";


        selectedStay =
            null;

    }


    /* =========================================================
       STAY REVIEW MESSAGE
    ========================================================== */

    function showReviewMessage(
        message,
        type
    ) {

        if (!reviewElements.message) {
            return;
        }


        reviewElements.message.textContent =
            message;


        reviewElements.message.className =
            `stay-review-message is-visible ${type}`;

    }


    /* =========================================================
       APPROVE STAY
    ========================================================== */

    async function approveSelectedStay() {

        if (!selectedStay) {
            return;
        }


        const stayId =
            Number(
                selectedStay.stayId ??
                selectedStay.StayId
            );


        if (!stayId) {
            return;
        }


        const confirmed =
            window.confirm(
                `Approve "${selectedStay.title ?? selectedStay.Title ?? "this Stay"}" and publish it publicly?`
            );


        if (!confirmed) {
            return;
        }


        try {

            reviewElements.approve.disabled =
                true;

            reviewElements.reject.disabled =
                true;


            reviewElements.approve.textContent =
                "Publishing...";


            showReviewMessage(
                "Publishing Stay...",
                "success"
            );


            const result =
                await adminPostRequest(
                    `/api/Stays/${stayId}/approve`
                );


            showReviewMessage(
                result?.message ||
                "Stay approved and published successfully.",
                "success"
            );


            reviewElements.approve.textContent =
                "Published";


            await loadAdminDashboard();


            setTimeout(
                closeStayReview,
                900
            );

        }
        catch (error) {

            console.error(
                "Approve Stay failed:",
                error
            );


            reviewElements.approve.disabled =
                false;

            reviewElements.reject.disabled =
                false;


            reviewElements.approve.textContent =
                "Approve & Publish";


            showReviewMessage(
                error.message ||
                "Unable to approve this Stay.",
                "error"
            );

        }

    }


    /* =========================================================
       REJECT STAY
    ========================================================== */

    async function rejectSelectedStay() {

        if (!selectedStay) {
            return;
        }


        const stayId =
            Number(
                selectedStay.stayId ??
                selectedStay.StayId
            );


        if (!stayId) {
            return;
        }


        const confirmed =
            window.confirm(
                `Reject "${selectedStay.title ?? selectedStay.Title ?? "this Stay"}"?`
            );


        if (!confirmed) {
            return;
        }


        try {

            reviewElements.approve.disabled =
                true;

            reviewElements.reject.disabled =
                true;


            reviewElements.reject.textContent =
                "Rejecting...";


            showReviewMessage(
                "Rejecting Stay...",
                "error"
            );


            const result =
                await adminPostRequest(
                    `/api/Stays/${stayId}/reject`
                );


            showReviewMessage(
                result?.message ||
                "Stay rejected successfully.",
                "success"
            );


            reviewElements.reject.textContent =
                "Rejected";


            await loadAdminDashboard();


            setTimeout(
                closeStayReview,
                900
            );

        }
        catch (error) {

            console.error(
                "Reject Stay failed:",
                error
            );


            reviewElements.approve.disabled =
                false;

            reviewElements.reject.disabled =
                false;


            reviewElements.reject.textContent =
                "Reject Stay";


            showReviewMessage(
                error.message ||
                "Unable to reject this Stay.",
                "error"
            );

        }

    }


    /* =========================================================
       PROPERTY STATUS
    ========================================================== */

    function normalizeStatus(status) {

        return String(
            status || ""
        )
            .trim()
            .toLowerCase();

    }


    /* =========================================================
       PROPERTY ID
    ========================================================== */

    function getPropertyId(property) {

        return Number(
            property?.PropertyId ??
            property?.propertyId ??
            property?.Id ??
            property?.id ??
            0
        );

    }


    /* =========================================================
       PROPERTY TITLE
    ========================================================== */

    function getPropertyTitle(property) {

        return (
            property?.Title ??
            property?.title ??
            "Untitled Property"
        );

    }


    /* =========================================================
       PROPERTY IMAGE URL
    ========================================================== */

    function getPropertyImageUrl(property) {

        if (!property) {
            return null;
        }


        const images =
            property.Images ??
            property.images ??
            [];


        if (!Array.isArray(images) ||
            images.length === 0) {

            return null;

        }


        const image =
            images.find(
                img =>
                    Boolean(
                        img?.IsPrimary ??
                        img?.isPrimary
                    )
            ) ||
            images[0];


        const rawUrl =
            image?.ImageUrl ??
            image?.imageUrl ??
            image?.Url ??
            image?.url ??
            "";


        if (!rawUrl) {
            return null;
        }


        if (
            rawUrl.startsWith("http://") ||
            rawUrl.startsWith("https://")
        ) {

            return rawUrl;

        }


        return `${ADMIN_API_BASE_URL}${rawUrl}`;

    }


    /* =========================================================
       PROPERTY LOCATION
    ========================================================== */

    function getPropertyLocationObject(property) {

        return (
            property?.Location ??
            property?.location ??
            null
        );

    }


    function formatPropertyLocation(location) {

        if (!location) {

            return "Location not provided";

        }


        const area =
            location.Area ??
            location.area ??
            "";


        const city =
            location.City ??
            location.city ??
            "";


        const region =
            location.Region ??
            location.region ??
            "";


        return [
            area,
            city,
            region
        ]
            .filter(Boolean)
            .join(", ") ||
            "Location not provided";

    }


    /* =========================================================
       PROPERTY PRICE
    ========================================================== */

    function formatPropertyPrice(property) {

        if (!property) {

            return "Price unavailable";

        }


        const price =
            Number(
                property.Price ??
                property.price
            );


        if (!Number.isFinite(price)) {

            return "Price unavailable";

        }


        const formatted =
            new Intl.NumberFormat(
                "en-GH",
                {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                }
            ).format(price);


        const period =
            property.PricePeriod ??
            property.pricePeriod ??
            "period";


        return `GH₵ ${formatted} / ${period}`;

    }


    /* =========================================================
       ADMIN DATE
    ========================================================== */

    function formatAdminDate(value) {

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


        return date.toLocaleString(
            "en-GH",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );

    }


    /* =========================================================
       PROPERTY DETAIL
    ========================================================== */

    function propertyDetail(
        label,
        value
    ) {

        return `
            <div class="property-review-detail">

                <small>
                    ${escapeHtml(label)}
                </small>

                <strong>
                    ${escapeHtml(
                        value === null ||
                        value === undefined ||
                        value === ""
                            ? "—"
                            : String(value)
                    )}
                </strong>

            </div>
        `;

    }


    /* =========================================================
       LOAD ADMIN PROPERTIES
       Uses /api/Properties/my

       IMPORTANT:
       Admin receives all properties from this endpoint.
    ========================================================== */

    
async function loadAdminProperties() {

    const container =
        document.getElementById("adminPropertyList");

    if (!container) {
        console.error(
            "adminPropertyList element was not found."
        );
        return;
    }

    container.innerHTML = `
        <div class="property-empty-state">
            <div class="empty-icon">⌂</div>

            <h3>
                Loading properties...
            </h3>

            <p>
                Checking rental properties awaiting administrator review.
            </p>
        </div>
    `;

    try {

        const data =
            await apiRequest("/api/Properties/my");

        adminProperties =
            normalizeCollection(data);
            console.table(
    adminProperties.map(property => ({
        id:
            property.PropertyId ??
            property.propertyId,

        title:
            property.Title ??
            property.title,

        status:
            property.Status ??
            property.status,

        owner:
            property.OwnerUserId ??
            property.ownerUserId
    }))
);

            console.log(
    "PROPERTY API RAW RESPONSE:",
    data
);

console.log(
    "NORMALIZED ADMIN PROPERTIES:",
    adminProperties
);

console.log(
    "========== HAVENGH PROPERTY STATUS DEBUG =========="
);

console.table(
    adminProperties.map(property => ({
        id:
            property.PropertyId ??
            property.propertyId,

        title:
            property.Title ??
            property.title,

        rawStatus:
            property.Status ??
            property.status,

        normalizedStatus:
            normalizeStatus(
                property.Status ??
                property.status
            ),

        owner:
            property.OwnerUserId ??
            property.ownerUserId
    }))
);

console.log(
    "STATUS COUNTS:",
    adminProperties.reduce(
        (counts, property) => {

            const status =
                normalizeStatus(
                    property.Status ??
                    property.status
                ) || "(empty)";

            counts[status] =
                (counts[status] || 0) + 1;

            return counts;

        },
        {}
    )
);

console.log(
    "PENDING PROPERTIES:",
    adminProperties.filter(
        property =>
            normalizeStatus(
                property.Status ??
                property.status
            ) === "pending"
    )
);

console.log(
    "===================================================="
);

        console.log(
            "HavenGH Admin Properties:",
            adminProperties
        );

        updatePropertyBadges();

        renderAdminProperties();

        console.log(
            "HavenGH Admin property management loaded successfully."
        );

    } catch (error) {

        console.error(
            "Failed to load HavenGH admin properties:",
            error
        );

        container.innerHTML = `
            <div class="property-empty-state">

                <div class="empty-icon">
                    ⚠
                </div>

                <h3>
                    Unable to load properties
                </h3>

                <p>
                    ${escapeHtml(
                        error?.message ||
                        "The HavenGH API could not load rental properties."
                    )}
                </p>

            </div>
        `;
    }
}



    /* =========================================================
       PROPERTY BADGES
    ========================================================== */

    function updatePropertyBadges() {

        const pending =
            adminProperties.filter(
                property =>
                    normalizeStatus(
                        property.Status ??
                        property.status
                    ) === "pending"
            ).length;


        const draft =
            adminProperties.filter(
                property =>
                    normalizeStatus(
                        property.Status ??
                        property.status
                    ) === "draft"
            ).length;


        const published =
            adminProperties.filter(
                property =>
                    normalizeStatus(
                        property.Status ??
                        property.status
                    ) === "published"
            ).length;


        const pendingBadge =
            document.getElementById(
                "pendingPropertyBadge"
            );


        const draftBadge =
            document.getElementById(
                "draftPropertyBadge"
            );


        const publishedBadge =
            document.getElementById(
                "publishedPropertyBadge"
            );


        if (pendingBadge) {

            pendingBadge.textContent =
                pending;

        }


        if (draftBadge) {

            draftBadge.textContent =
                draft;

        }


        if (publishedBadge) {

            publishedBadge.textContent =
                published;

        }


        console.log(
            "Property counts:",
            {
                pending,
                draft,
                published
            }
        );

    }


    /* =========================================================
       RENDER MAIN PROPERTY LIST
    ========================================================== */
        
function renderAdminProperties() {

    const container =
        document.getElementById("adminPropertyList");

    if (!container) {
        console.error(
            "adminPropertyList element was not found."
        );
        return;
    }

    const filteredProperties =
        adminProperties.filter(property => {

            const status =
                normalizeStatus(
                    property.Status ??
                    property.status
                );

            return status === currentPropertyFilter;
        });

    if (!filteredProperties.length) {

        let title =
            "No properties found";

        let message =
            "There are currently no properties in this category.";

        if (currentPropertyFilter === "pending") {

            title =
                "No properties awaiting review";

            message =
                "There are currently no rental properties waiting for administrator approval.";

        } else if (currentPropertyFilter === "draft") {

            title =
                "No draft properties";

            message =
                "There are currently no draft rental properties.";

        } else if (currentPropertyFilter === "published") {

            title =
                "No published properties";

            message =
                "There are currently no published rental properties.";

        }

        container.innerHTML = `
            <div class="property-empty-state">

                <div class="empty-icon">
                    ${currentPropertyFilter === "pending" ? "✓" : "⌂"}
                </div>

                <h3>
                    ${escapeHtml(title)}
                </h3>

                <p>
                    ${escapeHtml(message)}
                </p>

            </div>
        `;

        return;
    }

    container.innerHTML =
        filteredProperties
            .map(property =>
                renderAdminPropertyCard(property)
            )
            .join("");
}


    
    /* =========================================================
       RENDER PENDING PROPERTY APPROVALS
       Used directly on admin-dashboard.html
    ========================================================== */

    function renderPendingPropertyApprovals() {

        const container =
            document.getElementById(
                "pendingPropertyApprovals"
            );


        if (!container) {

            console.warn(
                "pendingPropertyApprovals element was not found."
            );

            return;

        }


        const pending =
            adminProperties.filter(
                property =>
                    normalizeStatus(
                        property.Status ??
                        property.status
                    ) === "pending"
            );


        if (!pending.length) {

            container.innerHTML = `

                <div class="admin-empty-state">

                    <strong>
                        No rental properties awaiting review
                    </strong>

                    <span>
                        New rental properties submitted by
                        landlords and agents will appear here.
                    </span>

                </div>

            `;

            return;

        }


        container.innerHTML =
            pending
                .slice(0, 10)
                .map(
                    property =>
                        renderPendingPropertyCard(
                            property
                        )
                )
                .join("");

    }


    /* =========================================================
       PENDING PROPERTY CARD
    ========================================================== */

    function renderPendingPropertyCard(property) {

        const propertyId =
            getPropertyId(property);


        const title =
            getPropertyTitle(property);


        const imageUrl =
            getPropertyImageUrl(property);


        const location =
            formatPropertyLocation(
                getPropertyLocationObject(property)
            );


        const price =
            formatPropertyPrice(property);


        const propertyType =
            property.PropertyType ??
            property.propertyType ??
            "Property";


        const ownerId =
            property.OwnerUserId ??
            property.ownerUserId ??
            "—";


        return `

            <article class="admin-property-card">

                <div class="admin-property-image">

                    ${
                        imageUrl
                            ? `
                                <img
                                    src="${escapeAttribute(imageUrl)}"
                                    alt="${escapeAttribute(title)}"
                                    loading="lazy">
                              `
                            : `
                                <div class="admin-property-image-placeholder">
                                    ⌂
                                </div>
                              `
                    }

                </div>


                <div class="admin-property-info">

                    <h3>
                        ${escapeHtml(title)}
                    </h3>


                    <div class="admin-property-meta">

                        <span>
                            ${escapeHtml(propertyType)}
                        </span>

                        <span>•</span>

                        <span>
                            ${escapeHtml(price)}
                        </span>

                    </div>


                    <div class="admin-property-location">

                        ${escapeHtml(location)}

                    </div>


                    <div class="admin-property-meta">

                        Owner #${escapeHtml(ownerId)}

                    </div>

                </div>


                <div class="admin-property-actions">

                    <button
                        type="button"
                        class="property-review-btn"
                        onclick="openPropertyReview(${propertyId})">

                        Review

                    </button>


                    <button
                        type="button"
                        class="property-approve-btn"
                        onclick="approveAdminProperty(${propertyId})">

                        Approve & Publish

                    </button>


                    <button
                        type="button"
                        class="property-reject-btn"
                        onclick="rejectAdminProperty(${propertyId})">

                        Reject

                    </button>

                </div>

            </article>

        `;

    }


    /* =========================================================
       MAIN PROPERTY CARD
    ========================================================== */

    function renderAdminPropertyCard(property) {

        const propertyId =
            getPropertyId(property);


        const status =
            normalizeStatus(
                property.Status ??
                property.status
            );


        const imageUrl =
            getPropertyImageUrl(
                property
            );


        const location =
            formatPropertyLocation(
                getPropertyLocationObject(property)
            );


        const price =
            formatPropertyPrice(
                property
            );


        const title =
            getPropertyTitle(
                property
            );


        const propertyType =
            property.PropertyType ??
            property.propertyType ??
            "Property";


        let actionButtons = "";


        if (status === "pending") {

            actionButtons = `

                <button
                    type="button"
                    class="property-review-btn"
                    onclick="openPropertyReview(${propertyId})">
                    Review
                </button>


                <button
                    type="button"
                    class="property-approve-btn"
                    onclick="approveAdminProperty(${propertyId})">
                    Approve & Publish
                </button>


                <button
                    type="button"
                    class="property-reject-btn"
                    onclick="rejectAdminProperty(${propertyId})">
                    Reject
                </button>

            `;

        }


        else if (status === "published") {

            actionButtons = `

                <button
                    type="button"
                    class="property-review-btn"
                    onclick="openPropertyReview(${propertyId})">
                    View
                </button>


                <button
                    type="button"
                    class="property-unpublish-btn"
                    onclick="unpublishAdminProperty(${propertyId})">
                    Unpublish
                </button>

            `;

        }


        else if (status === "draft") {

            actionButtons = `

                <button
                    type="button"
                    class="property-review-btn"
                    onclick="openPropertyReview(${propertyId})">
                    View
                </button>

            `;

        }


        return `

            <article class="admin-property-card">

                <div class="admin-property-image">

                    ${
                        imageUrl
                            ? `
                                <img
                                    src="${escapeAttribute(imageUrl)}"
                                    alt="${escapeAttribute(title)}"
                                    loading="lazy">
                              `
                            : `
                                <div class="admin-property-image-placeholder">
                                    ⌂
                                </div>
                              `
                    }

                </div>


                <div class="admin-property-info">

                    <h3>
                        ${escapeHtml(title)}
                    </h3>


                    <div class="admin-property-meta">

                        <span>
                            ${escapeHtml(propertyType)}
                        </span>

                        <span>•</span>

                        <span>
                            ${escapeHtml(price)}
                        </span>

                        <span>•</span>

                        <span class="property-status">
                            ${escapeHtml(status)}
                        </span>

                    </div>


                    <div class="admin-property-location">

                        ${escapeHtml(location)}

                    </div>

                </div>


                <div class="admin-property-actions">

                    ${actionButtons}

                </div>

            </article>

        `;

    }


    /* =========================================================
       OPEN PROPERTY REVIEW
    ========================================================== */

    async function openPropertyReview(propertyId) {

        const modal =
            document.getElementById(
                "propertyReviewModal"
            );


        const body =
            document.getElementById(
                "propertyReviewBody"
            );


        const title =
            document.getElementById(
                "propertyReviewTitle"
            );


        const statusElement =
            document.getElementById(
                "propertyReviewStatus"
            );


        const actions =
            document.getElementById(
                "propertyReviewActions"
            );


        if (
            !modal ||
            !body ||
            !title ||
            !statusElement ||
            !actions
        ) {

            console.warn(
                "Property review modal elements are missing."
            );

            return;

        }


        body.innerHTML = `

            <div class="property-empty-state">

                <h3>
                    Loading property...
                </h3>

                <p>
                    Please wait.
                </p>

            </div>

        `;


        actions.innerHTML =
            "";


        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        modal.classList.add(
            "open"
        );


        try {

            const property =
                await apiRequest(
                    `/api/Properties/${propertyId}`
                );


            if (!property) {

                throw new Error(
                    "The API returned no property data."
                );

            }


            currentReviewProperty =
                property;


            const status =
                normalizeStatus(
                    property.Status ??
                    property.status
                );


            const propertyTitle =
                getPropertyTitle(
                    property
                );


            title.textContent =
                propertyTitle;


            statusElement.textContent =
                status;


            const primaryImage =
                getPropertyImageUrl(
                    property
                );


            const location =
                getPropertyLocationObject(
                    property
                );


            body.innerHTML = `

                ${
                    primaryImage
                        ? `
                            <img
                                class="property-review-image"
                                src="${escapeAttribute(primaryImage)}"
                                alt="${escapeAttribute(propertyTitle)}">
                          `
                        : ""
                }


                <div class="property-review-details">

                    ${propertyDetail(
                        "Property ID",
                        getPropertyId(property)
                    )}

                    ${propertyDetail(
                        "Property Type",
                        property.PropertyType ??
                        property.propertyType
                    )}

                    ${propertyDetail(
                        "Price",
                        formatPropertyPrice(property)
                    )}

                    ${propertyDetail(
                        "Bedrooms",
                        property.Bedrooms ??
                        property.bedrooms ??
                        "—"
                    )}

                    ${propertyDetail(
                        "Bathrooms",
                        property.Bathrooms ??
                        property.bathrooms ??
                        "—"
                    )}

                    ${propertyDetail(
                        "Status",
                        status
                    )}

                    ${propertyDetail(
                        "Owner ID",
                        property.OwnerUserId ??
                        property.ownerUserId
                    )}

                    ${propertyDetail(
                        "Created",
                        formatAdminDate(
                            property.CreatedAt ??
                            property.createdAt
                        )
                    )}

                </div>


                ${
                    location
                        ? `
                            <div class="property-review-details">

                                ${propertyDetail(
                                    "Area",
                                    location.Area ??
                                    location.area
                                )}

                                ${propertyDetail(
                                    "City",
                                    location.City ??
                                    location.city
                                )}

                                ${propertyDetail(
                                    "Region",
                                    location.Region ??
                                    location.region
                                )}

                                ${propertyDetail(
                                    "Country",
                                    location.Country ??
                                    location.country
                                )}

                                ${propertyDetail(
                                    "Address",
                                    location.AddressLine ??
                                    location.addressLine
                                )}

                            </div>
                          `
                        : `
                            <div class="property-review-detail">

                                <small>
                                    Location
                                </small>

                                <strong>
                                    No location recorded
                                </strong>

                            </div>
                          `
                }


                ${
                    property.Description ??
                    property.description
                        ? `
                            <div>

                                <span class="panel-eyebrow">
                                    DESCRIPTION
                                </span>


                                <div class="property-review-description">

                                    ${escapeHtml(
                                        property.Description ??
                                        property.description
                                    )}

                                </div>

                            </div>
                          `
                        : ""
                }

            `;


            renderPropertyReviewActions(
                property
            );

        }
        catch (error) {

            console.error(
                "Property review error:",
                error
            );


            body.innerHTML = `

                <div class="property-empty-state">

                    <h3>
                        Unable to load property
                    </h3>

                    <p>
                        ${escapeHtml(
                            error.message ||
                            "Something went wrong."
                        )}
                    </p>

                </div>

            `;

        }

    }


    /* =========================================================
       PROPERTY REVIEW ACTIONS
    ========================================================== */

    function renderPropertyReviewActions(
        property
    ) {

        const actions =
            document.getElementById(
                "propertyReviewActions"
            );


        if (!actions) {
            return;
        }


        const status =
            normalizeStatus(
                property.Status ??
                property.status
            );


        const propertyId =
            getPropertyId(
                property
            );


        if (status === "pending") {

            actions.innerHTML = `

                <button
                    type="button"
                    class="admin-reject-button"
                    onclick="rejectAdminProperty(${propertyId})">

                    Reject

                </button>


                <button
                    type="button"
                    class="admin-approve-button"
                    onclick="approveAdminProperty(${propertyId})">

                    Approve & Publish

                </button>

            `;

        }


        else if (status === "published") {

            actions.innerHTML = `

                <button
                    type="button"
                    class="admin-unpublish-button"
                    onclick="unpublishAdminProperty(${propertyId})">

                    Unpublish

                </button>

            `;

        }


        else {

            actions.innerHTML =
                "";

        }

    }


    /* =========================================================
       APPROVE PROPERTY
       API:
       POST /api/Properties/{id}/publish
    ========================================================== */

    async function approveAdminProperty(
        propertyId
    ) {

        const confirmed =
            window.confirm(
                "Approve this property and publish it publicly?"
            );


        if (!confirmed) {
            return;
        }


        try {

            const result =
                await adminPostRequest(
                    `/api/Properties/${propertyId}/publish`
                );


            alert(
                result?.message ||
                "Property approved and published successfully."
            );


            closePropertyReviewModal();


            await loadAdminProperties();


        }
        catch (error) {

            console.error(
                "Property approval error:",
                error
            );


            alert(
                error.message ||
                "Unable to approve property."
            );

        }

    }


    /* =========================================================
       REJECT PROPERTY
       API:
       POST /api/Properties/{id}/reject
    ========================================================== */

    async function rejectAdminProperty(
        propertyId
    ) {

        const confirmed =
            window.confirm(
                "Reject this property? It will return to Draft so the owner can edit and resubmit it."
            );


        if (!confirmed) {
            return;
        }


        try {

            const result =
                await adminPostRequest(
                    `/api/Properties/${propertyId}/reject`
                );


            alert(
                result?.message ||
                "Property rejected and returned to Draft."
            );


            closePropertyReviewModal();


            await loadAdminProperties();


        }
        catch (error) {

            console.error(
                "Property rejection error:",
                error
            );


            alert(
                error.message ||
                "Unable to reject property."
            );

        }

    }


    /* =========================================================
       UNPUBLISH PROPERTY
       API:
       POST /api/Properties/{id}/unpublish
    ========================================================== */

    async function unpublishAdminProperty(
        propertyId
    ) {

        const confirmed =
            window.confirm(
                "Unpublish this property? It will return to Draft and disappear from public listings."
            );


        if (!confirmed) {
            return;
        }


        try {

            const result =
                await adminPostRequest(
                    `/api/Properties/${propertyId}/unpublish`
                );


            alert(
                result?.message ||
                "Property unpublished successfully."
            );


            closePropertyReviewModal();


            await loadAdminProperties();


        }
        catch (error) {

            console.error(
                "Property unpublish error:",
                error
            );


            alert(
                error.message ||
                "Unable to unpublish property."
            );

        }

    }


    /* =========================================================
       PROPERTY FILTERS
    ========================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    "[data-property-filter]"
                );


            if (!button) {
                return;
            }


            currentPropertyFilter =
                normalizeStatus(
                    button.dataset.propertyFilter
                );


            document
                .querySelectorAll(
                    "[data-property-filter]"
                )
                .forEach(
                    filterButton => {

                        filterButton.classList.toggle(
                            "active",
                            filterButton === button
                        );

                    }
                );


            renderAdminProperties();

        }
    );


    /* =========================================================
       CLOSE PROPERTY REVIEW MODAL
    ========================================================== */

    function closePropertyReviewModal() {

        const modal =
            document.getElementById(
                "propertyReviewModal"
            );


        if (!modal) {
            return;
        }


        modal.classList.remove(
            "open"
        );


        modal.setAttribute(
            "aria-hidden",
            "true"
        );


        currentReviewProperty =
            null;


        if (
            !document.querySelector(
                ".stay-review-modal.is-open"
            )
        ) {

            document.body.style.overflow =
                "";

        }

    }


    /* =========================================================
       PROPERTY MODAL EVENTS
    ========================================================== */

    document.addEventListener(
        "click",
        function (event) {

            if (
                event.target.id ===
                "closePropertyReviewModal"
            ) {

                closePropertyReviewModal();

            }


            if (
                event.target.hasAttribute(
                    "data-close-property-modal"
                )
            ) {

                closePropertyReviewModal();

            }

        }
    );


    /* =========================================================
       STAY REVIEW EVENTS
    ========================================================== */

   /* =========================================================
   STAY REVIEW EVENTS
========================================================== */

document.addEventListener(
    "click",
    function (event) {

        const reviewButton =
            event.target.closest(
                "[data-review-stay]"
            );


        if (!reviewButton) {
            return;
        }


        event.preventDefault();


        const stayId =
            Number(
                reviewButton.dataset.reviewStay
            );


        if (!Number.isFinite(stayId) || stayId <= 0) {

            console.error(
                "Invalid Stay ID:",
                reviewButton.dataset.reviewStay
            );

            return;

        }


        console.log(
            "Review Stay clicked:",
            stayId
        );


        const stay =
            currentAdminStays.find(
                item =>
                    Number(
                        item?.stayId ??
                        item?.StayId ??
                        0
                    ) === stayId
            );


        if (!stay) {

            console.error(
                "Stay was not found in currentAdminStays:",
                {
                    stayId,
                    currentAdminStays
                }
            );


            return;

        }


        openStayReview(
            stay
        );

    }
);


    /* =========================================================
       STAY MODAL CLOSE
    ========================================================== */

    if (reviewElements.close) {

        reviewElements.close.addEventListener(
            "click",
            closeStayReview
        );

    }


    if (reviewElements.modal) {

        reviewElements.modal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target.hasAttribute(
                        "data-close-review"
                    )
                ) {

                    closeStayReview();

                }

            }
        );

    }


    /* =========================================================
       STAY APPROVE BUTTON
    ========================================================== */

    if (reviewElements.approve) {

        reviewElements.approve.addEventListener(
            "click",
            approveSelectedStay
        );

    }


    /* =========================================================
       STAY REJECT BUTTON
    ========================================================== */

    if (reviewElements.reject) {

        reviewElements.reject.addEventListener(
            "click",
            rejectSelectedStay
        );

    }


    /* =========================================================
       LOGOUT BUTTON
    ========================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const logoutButton =
                event.target.closest(
                    "#adminLogoutButton"
                );


            if (!logoutButton) {
                return;
            }


            event.preventDefault();

            logoutAdministrator();

        }
    );


    /* =========================================================
       ESCAPE KEY
    ========================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key !== "Escape") {
                return;
            }


            const propertyModal =
                document.getElementById(
                    "propertyReviewModal"
                );


            if (
                propertyModal &&
                propertyModal.classList.contains(
                    "open"
                )
            ) {

                closePropertyReviewModal();

                return;

            }


            if (
                reviewElements.modal &&
                reviewElements.modal.classList.contains(
                    "is-open"
                )
            ) {

                closeStayReview();

            }

        }
    );

              /* =========================================================
       MOBILE ADMIN SIDEBAR MENU
       ========================================================= */

    function initializeMobileAdminMenu() {

        const menuButton =
            document.querySelector(
                ".dashboard-menu-button"
            );

        const sidebar =
            document.querySelector(
                ".dashboard-sidebar"
            );

        if (!menuButton || !sidebar) {
            return;
        }


        /* -----------------------------------------------------
           Create overlay once
        ----------------------------------------------------- */

        let overlay =
            document.querySelector(
                ".dashboard-mobile-overlay"
            );


        if (!overlay) {

            overlay =
                document.createElement(
                    "div"
                );

            overlay.className =
                "dashboard-mobile-overlay";

            overlay.setAttribute(
                "aria-hidden",
                "true"
            );

            document.body.appendChild(
                overlay
            );

        }


        /* -----------------------------------------------------
           Open menu
        ----------------------------------------------------- */

        function openMenu() {

            sidebar.classList.add(
                "mobile-open"
            );

            overlay.classList.add(
                "is-visible"
            );

            overlay.setAttribute(
                "aria-hidden",
                "false"
            );

            document.body.classList.add(
                "mobile-menu-open"
            );

            menuButton.setAttribute(
                "aria-expanded",
                "true"
            );

            menuButton.setAttribute(
                "aria-label",
                "Close administrator menu"
            );


            /* Change hamburger to close icon */

            menuButton.textContent =
                "×";

        }


        /* -----------------------------------------------------
           Close menu
        ----------------------------------------------------- */

        function closeMenu() {

            sidebar.classList.remove(
                "mobile-open"
            );

            overlay.classList.remove(
                "is-visible"
            );

            overlay.setAttribute(
                "aria-hidden",
                "true"
            );

            document.body.classList.remove(
                "mobile-menu-open"
            );

            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );

            menuButton.setAttribute(
                "aria-label",
                "Open administrator menu"
            );


            /* Restore hamburger */

            menuButton.textContent =
                "☰";

        }


        /* -----------------------------------------------------
           Hamburger button
        ----------------------------------------------------- */

        menuButton.addEventListener(
            "click",
            function () {

                const isOpen =
                    sidebar.classList.contains(
                        "mobile-open"
                    );


                if (isOpen) {

                    closeMenu();

                }
                else {

                    openMenu();

                }

            }
        );


        /* -----------------------------------------------------
           Dark overlay closes menu
        ----------------------------------------------------- */

        overlay.addEventListener(
            "click",
            closeMenu
        );


        /* -----------------------------------------------------
           Sidebar links close menu
        ----------------------------------------------------- */

        sidebar
            .querySelectorAll(
                ".dashboard-link"
            )
            .forEach(
                function (link) {

                    link.addEventListener(
                        "click",
                        function () {

                            closeMenu();

                        }
                    );

                }
            );


        /* -----------------------------------------------------
           Escape closes menu
        ----------------------------------------------------- */

        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Escape" &&
                    sidebar.classList.contains(
                        "mobile-open"
                    )
                ) {

                    closeMenu();

                }

            }
        );


        /* -----------------------------------------------------
           Desktop resize protection
        ----------------------------------------------------- */

        window.addEventListener(
            "resize",
            function () {

                if (
                    window.innerWidth > 850 &&
                    sidebar.classList.contains(
                        "mobile-open"
                    )
                ) {

                    closeMenu();

                }

            }
        );

    }
    /* =========================================================
       ADMIN INITIALIZATION
    ========================================================== */

          /* =========================================================
   ADMIN INITIALIZATION
========================================================== */

async function initialize() {

    /* -----------------------------------------------------
       Initialize mobile sidebar menu
    ----------------------------------------------------- */

    initializeMobileAdminMenu();


    /* -----------------------------------------------------
       Render dashboard date
    ----------------------------------------------------- */

    renderDate();


    try {

        /*
         * 1. Verify JWT.
         */

        await verifyAdministrator();


        /*
         * 2. Security indicator.
         */

        showSecuritySuccess();


        /*
         * 3. Load central dashboard.
         */

        await loadAdminDashboard();


        console.log(
            "HavenGH Admin Dashboard initialized successfully."
        );

    }
    catch (error) {

        console.error(
            "HavenGH Admin Dashboard Error:",
            error
        );


        const message =
            String(
                error?.message ||
                ""
            ).toLowerCase();


        if (
            message.includes("session") ||
            message.includes("administrator access") ||
            message.includes("authentication") ||
            message.includes("login")
        ) {

            redirectToLogin();

            return;

        }


        showSecurityFailure(
            error?.message ||
            "Unable to load administrator dashboard."
        );


        if (elements.recentStays) {

            elements.recentStays.innerHTML = `

                <div class="admin-empty-state">

                    <strong>
                        Stay data unavailable
                    </strong>

                    <span>
                        ${escapeHtml(
                            error?.message ||
                            "Unable to load Stay data."
                        )}
                    </span>

                </div>

            `;

        }


        if (elements.pendingStays) {

            elements.pendingStays.innerHTML = `

                <div class="admin-empty-state">

                    <strong>
                        Stay approvals unavailable
                    </strong>

                    <span>
                        The administrator Stay service
                        could not be loaded.
                    </span>

                </div>

            `;

        }


        if (elements.pendingProperties) {

            elements.pendingProperties.innerHTML = `

                <div class="admin-empty-state">

                    <strong>
                        Property approvals unavailable
                    </strong>

                    <span>
                        The administrator property service
                        could not be loaded.
                    </span>

                </div>

            `;

        }

    }

}

    /* =========================================================
       INITIAL DOM READY
    ========================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );


    /* =========================================================
       BACK/FORWARD CACHE PROTECTION
    ========================================================== */

    window.addEventListener(
        "pageshow",
        async function () {

            const token =
                getToken();


            if (!token) {

                redirectToLogin();

                return;

            }


            try {

                await verifyAdministrator();

            }
            catch (error) {

                console.warn(
                    "Restored dashboard session is invalid:",
                    error
                );


                redirectToLogin();

            }

        }
    );


    /* =========================================================
       EXPOSE ONLY THE FUNCTIONS NEEDED BY INLINE HTML
    ========================================================== */

    window.openPropertyReview =
        openPropertyReview;

    window.approveAdminProperty =
        approveAdminProperty;

    window.rejectAdminProperty =
        rejectAdminProperty;

    window.unpublishAdminProperty =
        unpublishAdminProperty;

    window.closePropertyReviewModal =
        closePropertyReviewModal;

    window.openStayReview =
        openStayReview;

    window.closeStayReview =
        closeStayReview;

        window.debugAdminProperties = function () {
    return adminProperties.map(p => ({
        id: p.propertyId ?? p.PropertyId,
        title: p.title ?? p.Title,
        status: p.status ?? p.Status
    }));
};

})();

