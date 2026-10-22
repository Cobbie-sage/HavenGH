/* ============================================================
   HavenGH - Admin Audit Logs
   Direct ASP.NET Core API connection
   Admin only

   Connected endpoints:
   GET /api/AuditLogs
   GET /api/AuditLogs/stats
   GET /api/AuditLogs/{id}

   ============================================================ */

"use strict";

/* ============================================================
   API
   ============================================================ */

const HAVENGH_API = "https://havenghapi-production.up.railway.app/api";

/* ============================================================
   STATE
   ============================================================ */

let auditCurrentPage = 1;
const auditPageSize = 50;

let auditSearchTimer = null;

/* ============================================================
   AUTH
   ============================================================ */

function getAuditToken() {

    return (
        localStorage.getItem("havenGH_token") ||
        sessionStorage.getItem("havenGH_token") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken")
    );
}

/* ============================================================
   API REQUEST
   ============================================================ */

async function auditApiRequest(endpoint, options = {}) {

    const token = getAuditToken();

    if (!token) {

        redirectToLogin();

        throw new Error(
            "Authentication required."
        );
    }

    const headers = {
        "Accept": "application/json",
        ...(options.headers || {}),
        "Authorization": `Bearer ${token}`
    };

    /*
     * Only add Content-Type when a request actually has a body.
     */
    if (options.body) {
        headers["Content-Type"] = "application/json";
    }

    try {

        const response = await fetch(
            `${HAVENGH_API}${endpoint}`,
            {
                ...options,
                headers
            }
        );

        /* --------------------------------------------------------
           UNAUTHORIZED
           -------------------------------------------------------- */

        if (response.status === 401) {

            clearAuditSession();

            redirectToLogin();

            throw new Error(
                "Your session has expired. Please log in again."
            );
        }

        /* --------------------------------------------------------
           FORBIDDEN
           -------------------------------------------------------- */

        if (response.status === 403) {

            showAuditToast(
                "Administrator access is required.",
                "error"
            );

            throw new Error(
                "You do not have permission to access audit logs."
            );
        }

        /* --------------------------------------------------------
           RESPONSE
           -------------------------------------------------------- */

        const contentType =
            response.headers.get("content-type") || "";

        let result = null;

        if (contentType.includes("application/json")) {

            result = await response.json();

        } else {

            result = await response.text();
        }

        /* --------------------------------------------------------
           API ERROR
           -------------------------------------------------------- */

        if (!response.ok) {

            let message =
                "Request failed.";

            if (typeof result === "object" && result) {

                message =
                    result.message ||
                    result.title ||
                    result.error ||
                    message;

            } else if (
                typeof result === "string" &&
                result.trim()
            ) {

                message =
                    result;
            }

            throw new Error(message);
        }

        return result;

    } catch (error) {

        console.error(
            "HavenGH Audit API Error:",
            error
        );

        throw error;
    }
}

/* ============================================================
   SESSION
   ============================================================ */

function clearAuditSession() {

    localStorage.removeItem("havenGH_token");
    sessionStorage.removeItem("havenGH_token");

    localStorage.removeItem("token");
    sessionStorage.removeItem("token");

    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("accessToken");
}

/* ============================================================
   REDIRECT
   ============================================================ */

function redirectToLogin() {

    const loginPage =
        "login.html";

    if (
        !window.location.pathname.endsWith(
            loginPage
        )
    ) {

        window.location.href =
            loginPage;
    }
}

/* ============================================================
   INITIALIZE
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initializeAuditLogs
);

/* ============================================================
   INITIALIZE AUDIT PAGE
   ============================================================ */

async function initializeAuditLogs() {

    if (!getAuditToken()) {

        redirectToLogin();

        return;
    }

    setupAuditFilters();

    setupAuditPagination();

    await Promise.all([
        loadAuditStats(),
        loadAuditLogs()
    ]);
}

/* ============================================================
   LOAD STATISTICS
   ============================================================ */

async function loadAuditStats() {

    try {

        const result =
            await auditApiRequest(
                "/AuditLogs/stats"
            );

        const stats =
            result?.data || {};

        setAuditStat(
            "auditTotal",
            stats.total
        );

        setAuditStat(
            "auditUserActivity",
            stats.userActivity
        );

        setAuditStat(
            "auditAdminActivity",
            stats.adminActivity
        );

        setAuditStat(
            "auditSecurityEvents",
            stats.securityEvents
        );

    } catch (error) {

        console.error(
            "Failed to load audit statistics:",
            error
        );

        setAuditStat(
            "auditTotal",
            "—"
        );

        setAuditStat(
            "auditUserActivity",
            "—"
        );

        setAuditStat(
            "auditAdminActivity",
            "—"
        );

        setAuditStat(
            "auditSecurityEvents",
            "—"
        );
    }
}

/* ============================================================
   STAT HELPER
   ============================================================ */

function setAuditStat(id, value) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    if (
        value === null ||
        value === undefined
    ) {

        element.textContent =
            "0";

        return;
    }

    if (
        typeof value === "number"
    ) {

        element.textContent =
            value.toLocaleString("en-GH");

        return;
    }

    element.textContent =
        value;
}

/* ============================================================
   LOAD AUDIT LOGS
   ============================================================ */

async function loadAuditLogs() {

    const list =
        document.getElementById(
            "audit-log-list"
        );

    if (!list) {

        console.error(
            "HavenGH: audit-log-list element was not found."
        );

        return;
    }

    showAuditLoading(list);

    const search =
        document.getElementById(
            "audit-search"
        )?.value?.trim() || "";

    const action =
        document.getElementById(
            "audit-action"
        )?.value || "all";

    const role =
        document.getElementById(
            "audit-role"
        )?.value || "all";

    try {

        const params =
            new URLSearchParams();

        /* --------------------------------------------------------
           SEARCH
           -------------------------------------------------------- */

        if (search) {

            params.append(
                "search",
                search
            );
        }

        /* --------------------------------------------------------
           ACTION
           -------------------------------------------------------- */

        if (
            action &&
            action !== "all"
        ) {

            params.append(
                "action",
                action
            );
        }

        /* --------------------------------------------------------
           ROLE
           -------------------------------------------------------- */

        if (
            role &&
            role !== "all"
        ) {

            params.append(
                "role",
                role
            );
        }

        /* --------------------------------------------------------
           PAGINATION
           -------------------------------------------------------- */

        params.append(
            "page",
            auditCurrentPage
        );

        params.append(
            "pageSize",
            auditPageSize
        );

        const endpoint =
            `/AuditLogs?${params.toString()}`;

        console.log(
            "HavenGH Audit request:",
            endpoint
        );

        const result =
            await auditApiRequest(
                endpoint
            );

        const logs =
            Array.isArray(result?.data)
                ? result.data
                : [];

        renderAuditLogs(logs);

        updateAuditPagination(
            result?.pagination
        );

    } catch (error) {

        console.error(
            "Failed to load audit logs:",
            error
        );

        renderAuditError(
            error.message
        );
    }
}

/* ============================================================
   RENDER AUDIT LOGS
   ============================================================ */

function renderAuditLogs(logs) {

    const list =
        document.getElementById(
            "audit-log-list"
        );

    if (!list) {
        return;
    }

    if (!logs.length) {

        list.innerHTML = `
            <div class="admin-audit-empty">

                <div class="admin-audit-empty-icon">
                    ✓
                </div>

                <h3>
                    No audit activity found
                </h3>

                <p>
                    There are no audit logs matching
                    your current filters.
                </p>

            </div>
        `;

        return;
    }

    list.innerHTML =
        logs
            .map(createAuditLogCard)
            .join("");
}

/* ============================================================
   AUDIT LOG CARD
   ============================================================ */

function createAuditLogCard(log) {

    const rawAction =
        normalizeAction(
            log?.actionType
        );

    const actionClass =
        getAuditActionClass(
            rawAction
        );

    const actionLabel =
        formatAction(
            rawAction
        );

    /* --------------------------------------------------------
       USER
       -------------------------------------------------------- */

    const userEmail =
        log?.user?.email ||
        "System";

    /* --------------------------------------------------------
       ROLE
       -------------------------------------------------------- */

    const roleLabel =
        getAuditRoleName(log);

    /* --------------------------------------------------------
       DESCRIPTION
       -------------------------------------------------------- */

    const description =
        escapeAuditHtml(
            log?.details ||
            "No details provided."
        );

    /* --------------------------------------------------------
       ENTITY
       -------------------------------------------------------- */

    const entity =
        log?.entityType
            ? escapeAuditHtml(
                log.entityType
            )
            : "";

    const entityId =
        log?.entityId !== null &&
        log?.entityId !== undefined
            ? ` #${escapeAuditHtml(
                log.entityId
            )}`
            : "";

    /* --------------------------------------------------------
       IP
       -------------------------------------------------------- */

    const ipAddress =
        escapeAuditHtml(
            log?.ipAddress ||
            "Unavailable"
        );

    /* --------------------------------------------------------
       DATE
       -------------------------------------------------------- */

    const createdAt =
        formatAuditDate(
            log?.createdAt
        );

    /* --------------------------------------------------------
       USER AGENT
       -------------------------------------------------------- */

    const userAgent =
        escapeAuditHtml(
            log?.userAgent ||
            ""
        );

    /* --------------------------------------------------------
       CARD
       -------------------------------------------------------- */

    return `
        <article
            class="request-item audit-log-item"
            data-audit-id="${escapeAuditHtml(
                log?.auditLogId
            )}"
        >

            <div class="audit-log-main">

                <div
                    class="audit-log-icon ${actionClass}"
                    aria-hidden="true"
                >
                    ${getAuditActionIcon(rawAction)}
                </div>

                <div class="audit-log-content">

                    <div class="audit-log-top">

                        <div>

                            <h3>
                                ${escapeAuditHtml(
                                    actionLabel
                                )}
                            </h3>

                            <p class="audit-log-description">
                                ${description}
                            </p>

                        </div>

                        <span
                            class="audit-log-action ${actionClass}"
                        >
                            ${escapeAuditHtml(
                                actionLabel
                            )}
                        </span>

                    </div>

                    <div class="audit-log-meta">

                        <span>
                            <strong>User:</strong>
                            ${escapeAuditHtml(
                                userEmail
                            )}
                        </span>

                        <span>
                            <strong>Role:</strong>
                            ${escapeAuditHtml(
                                roleLabel
                            )}
                        </span>

                        ${
                            entity
                                ? `
                                    <span>
                                        <strong>Entity:</strong>
                                        ${entity}${entityId}
                                    </span>
                                  `
                                : ""
                        }

                        <span>
                            <strong>IP:</strong>
                            ${ipAddress}
                        </span>

                        <span>
                            <strong>Date:</strong>
                            ${createdAt}
                        </span>

                    </div>

                    ${
                        userAgent
                            ? `
                                <div class="audit-log-user-agent">

                                    <strong>
                                        Device:
                                    </strong>

                                    ${userAgent}

                                </div>
                              `
                            : ""
                    }

                </div>

            </div>

        </article>
    `;
}

/* ============================================================
   ROLE NAME
   ============================================================ */

function getAuditRoleName(log) {

    if (
        log?.user?.role?.roleName
    ) {

        return formatRole(
            log.user.role.roleName
        );
    }

    if (
        log?.user?.roleName
    ) {

        return formatRole(
            log.user.roleName
        );
    }

    if (
        !log?.user
    ) {

        return "System";
    }

    if (
        log.user.roleId !== null &&
        log.user.roleId !== undefined
    ) {

        return `Role #${escapeAuditHtml(
            log.user.roleId
        )}`;
    }

    return "System";
}

/* ============================================================
   NORMALIZE ACTION
   ============================================================ */

function normalizeAction(action) {

    return String(
        action || ""
    )
        .trim()
        .toUpperCase()
        .replace(
            /\s+/g,
            "_"
        );
}

/* ============================================================
   ACTION CATEGORY
   ============================================================ */

function getAuditActionCategory(action) {

    const normalized =
        normalizeAction(action);

    if (
        normalized === "LOGIN" ||
        normalized.endsWith("_LOGIN")
    ) {
        return "login";
    }

    if (
        normalized === "LOGOUT" ||
        normalized.endsWith("_LOGOUT")
    ) {
        return "logout";
    }

    if (
        normalized === "CREATE" ||
        normalized.endsWith("_CREATED") ||
        normalized.endsWith("_CREATE")
    ) {
        return "create";
    }

    if (
        normalized === "UPDATE" ||
        normalized.endsWith("_UPDATED") ||
        normalized.endsWith("_UPDATE")
    ) {
        return "update";
    }

    if (
        normalized === "DELETE" ||
        normalized.endsWith("_DELETED") ||
        normalized.endsWith("_DELETE")
    ) {
        return "delete";
    }

    if (
        normalized === "APPROVE" ||
        normalized.endsWith("_APPROVED") ||
        normalized.endsWith("_APPROVE") ||
        normalized === "PUBLISH" ||
        normalized.endsWith("_PUBLISHED")
    ) {
        return "approve";
    }

    if (
        normalized === "REJECT" ||
        normalized.endsWith("_REJECTED") ||
        normalized.endsWith("_REJECT")
    ) {
        return "reject";
    }

    if (
        normalized === "FAILED_LOGIN" ||
        normalized === "LOGIN_FAILED"
    ) {
        return "failed_login";
    }

    if (
        normalized === "PASSWORD_RESET" ||
        normalized === "PASSWORD_CHANGED" ||
        normalized === "PASSWORD_CHANGE"
    ) {
        return "password_reset";
    }

    if (
        normalized === "2FA" ||
        normalized === "TWO_FACTOR" ||
        normalized === "TWO_FACTOR_ENABLED" ||
        normalized === "TWO_FACTOR_DISABLED"
    ) {
        return "2fa";
    }

    if (
        normalized === "SECURITY" ||
        normalized === "USER_LOCKED" ||
        normalized === "USER_UNLOCKED"
    ) {
        return "security";
    }

    return "neutral";
}

/* ============================================================
   ACTION CLASS
   ============================================================ */

function getAuditActionClass(action) {

    switch (
        getAuditActionCategory(action)
    ) {

        case "login":
            return "audit-success";

        case "logout":
            return "audit-neutral";

        case "create":
            return "audit-create";

        case "update":
            return "audit-update";

        case "delete":
            return "audit-danger";

        case "approve":
            return "audit-success";

        case "reject":
            return "audit-danger";

        case "failed_login":
            return "audit-danger";

        case "password_reset":
            return "audit-security";

        case "2fa":
            return "audit-security";

        case "security":
            return "audit-security";

        default:
            return "audit-neutral";
    }
}

/* ============================================================
   ACTION ICON
   ============================================================ */

function getAuditActionIcon(action) {

    switch (
        getAuditActionCategory(action)
    ) {

        case "login":
            return "↪";

        case "logout":
            return "↩";

        case "create":
            return "+";

        case "update":
            return "✎";

        case "delete":
            return "×";

        case "approve":
            return "✓";

        case "reject":
            return "!";

        case "failed_login":
            return "⚠";

        case "password_reset":
            return "⌁";

        case "2fa":
            return "🔒";

        case "security":
            return "🔒";

        default:
            return "•";
    }
}

/* ============================================================
   FORMAT ACTION
   ============================================================ */

function formatAction(action) {

    if (!action) {
        return "Platform Activity";
    }

    const normalized =
        normalizeAction(action);

    /*
     * Friendly labels for known system actions.
     */

    const friendlyLabels = {

        "LOGIN":
            "Login",

        "LOGOUT":
            "Logout",

        "FAILED_LOGIN":
            "Failed Login",

        "PASSWORD_RESET":
            "Password Reset",

        "PASSWORD_CHANGED":
            "Password Changed",

        "2FA":
            "Two-Factor Authentication",

        "TWO_FACTOR_ENABLED":
            "Two-Factor Enabled",

        "TWO_FACTOR_DISABLED":
            "Two-Factor Disabled",

        "USER_LOCKED":
            "User Locked",

        "USER_UNLOCKED":
            "User Unlocked",

        "PROPERTY_CREATED":
            "Property Created",

        "PROPERTY_UPDATED":
            "Property Updated",

        "PROPERTY_DELETED":
            "Property Deleted",

        "PROPERTY_PUBLISHED":
            "Property Published",

        "PROPERTY_UNPUBLISHED":
            "Property Unpublished",

        "PROPERTY_APPROVED":
            "Property Approved",

        "PROPERTY_REJECTED":
            "Property Rejected"
    };

    if (
        friendlyLabels[normalized]
    ) {

        return friendlyLabels[
            normalized
        ];
    }

    return normalized
        .replace(
            /_/g,
            " "
        )
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );
}

/* ============================================================
   FORMAT ROLE
   ============================================================ */

function formatRole(role) {

    if (!role) {
        return "System";
    }

    return String(role)
        .replace(
            /_/g,
            " "
        )
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );
}

/* ============================================================
   FORMAT DATE
   ============================================================ */

function formatAuditDate(dateValue) {

    if (!dateValue) {
        return "Unknown date";
    }

    const date =
        new Date(dateValue);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Unknown date";
    }

    return date.toLocaleString(
        "en-GH",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

/* ============================================================
   FILTERS
   ============================================================ */

function setupAuditFilters() {

    const search =
        document.getElementById(
            "audit-search"
        );

    const action =
        document.getElementById(
            "audit-action"
        );

    const role =
        document.getElementById(
            "audit-role"
        );

    /* --------------------------------------------------------
       SEARCH
       -------------------------------------------------------- */

    if (search) {

        search.addEventListener(
            "input",
            () => {

                clearTimeout(
                    auditSearchTimer
                );

                auditSearchTimer =
                    setTimeout(
                        () => {

                            auditCurrentPage =
                                1;

                            loadAuditLogs();

                        },
                        350
                    );
            }
        );
    }

    /* --------------------------------------------------------
       ACTION
       -------------------------------------------------------- */

    if (action) {

        action.addEventListener(
            "change",
            () => {

                auditCurrentPage =
                    1;

                loadAuditLogs();
            }
        );
    }

    /* --------------------------------------------------------
       ROLE
       -------------------------------------------------------- */

    if (role) {

        role.addEventListener(
            "change",
            () => {

                auditCurrentPage =
                    1;

                loadAuditLogs();
            }
        );
    }
}

/* ============================================================
   PAGINATION
   ============================================================ */

function setupAuditPagination() {

    const existing =
        document.getElementById(
            "audit-pagination"
        );

    if (existing) {
        return;
    }

    createAuditPagination();
}

/* ============================================================
   CREATE PAGINATION
   ============================================================ */

function createAuditPagination() {

    const list =
        document.getElementById(
            "audit-log-list"
        );

    if (!list) {
        return;
    }

    const parent =
        list.parentNode;

    if (!parent) {
        return;
    }

    const existing =
        document.getElementById(
            "audit-pagination"
        );

    if (existing) {
        return;
    }

    const pagination =
        document.createElement(
            "div"
        );

    pagination.className =
        "audit-pagination";

    pagination.id =
        "audit-pagination";

    parent.appendChild(
        pagination
    );
}

/* ============================================================
   UPDATE PAGINATION
   ============================================================ */

function updateAuditPagination(
    pagination
) {

    const container =
        document.getElementById(
            "audit-pagination"
        );

    if (!container) {
        return;
    }

    if (
        !pagination ||
        !pagination.totalPages ||
        pagination.totalPages <= 1
    ) {

        container.innerHTML = "";

        return;
    }

    const current =
        Number(
            pagination.page
        ) || 1;

    const totalPages =
        Number(
            pagination.totalPages
        ) || 1;

    container.innerHTML = `

        <button
            type="button"
            class="audit-page-button"
            ${current <= 1 ? "disabled" : ""}
            data-page="${current - 1}"
        >
            ← Previous
        </button>

        <span class="audit-page-info">
            Page ${current} of ${totalPages}
        </span>

        <button
            type="button"
            class="audit-page-button"
            ${current >= totalPages ? "disabled" : ""}
            data-page="${current + 1}"
        >
            Next →
        </button>

    `;

    container
        .querySelectorAll(
            ".audit-page-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const page =
                        Number(
                            button.dataset.page
                        );

                    if (
                        !page ||
                        page < 1 ||
                        page > totalPages
                    ) {

                        return;
                    }

                    auditCurrentPage =
                        page;

                    loadAuditLogs();

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });
                }
            );
        });
}

/* ============================================================
   LOADING STATE
   ============================================================ */

function showAuditLoading(list) {

    list.innerHTML = `

        <div class="admin-audit-loading">

            <div class="audit-loading-spinner"></div>

            <p>
                Loading audit activity...
            </p>

        </div>

    `;
}

/* ============================================================
   ERROR STATE
   ============================================================ */

function renderAuditError(message) {

    const list =
        document.getElementById(
            "audit-log-list"
        );

    if (!list) {
        return;
    }

    list.innerHTML = `

        <div class="admin-audit-error">

            <div class="admin-audit-error-icon">
                !
            </div>

            <h3>
                Unable to load audit logs
            </h3>

            <p>
                ${escapeAuditHtml(
                    message ||
                    "Something went wrong while loading audit activity."
                )}
            </p>

            <button
                type="button"
                class="audit-retry-button"
                id="audit-retry-button"
            >
                Try Again
            </button>

        </div>

    `;

    const retryButton =
        document.getElementById(
            "audit-retry-button"
        );

    if (retryButton) {

        retryButton.addEventListener(
            "click",
            () => {

                loadAuditLogs();
                loadAuditStats();

            }
        );
    }
}

/* ============================================================
   TOAST
   ============================================================ */

function showAuditToast(
    message,
    type = "success"
) {

    let toast =
        document.querySelector(
            ".havenGH-admin-toast"
        );

    if (!toast) {

        toast =
            document.createElement(
                "div"
            );

        toast.className =
            "havenGH-admin-toast";

        document.body.appendChild(
            toast
        );
    }

    toast.className =
        `havenGH-admin-toast ${type}`;

    toast.textContent =
        message;

    requestAnimationFrame(
        () => {

            toast.classList.add(
                "show"
            );

        }
    );

    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        3500
    );
}

/* ============================================================
   HTML ESCAPE
   ============================================================ */

function escapeAuditHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }

    return String(value)
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

/* ============================================================
   DEBUG / GLOBAL ACCESS
   ============================================================ */

window.loadAuditLogs =
    loadAuditLogs;

window.loadAuditStats =
    loadAuditStats;