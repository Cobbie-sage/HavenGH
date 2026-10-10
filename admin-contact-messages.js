"use strict";

/* ============================================================
   HAVENGH - ADMIN CONTACT MESSAGES
   ============================================================
   Handles messages submitted through:
   Contact Us → /api/ContactMessages

   IMPORTANT:
   This file is separate from admin-messages.js.
   Do NOT use this file for user-to-user Conversations.
   ============================================================ */


/* ============================================================
   API CONFIGURATION
   ============================================================ */

const HAVENGH_API = "http://localhost:5073/api";


/* ============================================================
   STATE
   ============================================================ */

let allContactMessages = [];
let filteredContactMessages = [];

let currentMessageId = null;
let currentStatusFilter = "all";


/* ============================================================
   AUTH TOKEN
   ============================================================ */

function getAuthToken() {
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


/* ============================================================
   API REQUEST
   ============================================================ */

async function apiRequest(endpoint, options = {}) {

    const token = getAuthToken();

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
        `${HAVENGH_API}${endpoint}`,
        {
            ...options,
            headers
        }
    );

    if (response.status === 401) {

        showNotice(
            "Your admin session has expired. Please log in again.",
            "error"
        );

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1200);

        throw new Error("Unauthorized");
    }

    if (response.status === 403) {

        showNotice(
            "Administrator access is required.",
            "error"
        );

        throw new Error("Forbidden");
    }

    let data = null;

    const contentType =
        response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    if (!response.ok) {

        const errorMessage =
            data?.message ||
            data?.title ||
            "The request could not be completed.";

        throw new Error(errorMessage);
    }

    return data;
}


/* ============================================================
   VERIFY ADMINISTRATOR
   ============================================================ */

async function verifyAdministrator() {

    const user = await apiRequest("/Auth/me");

    const role =
        user?.role ||
        user?.roleName ||
        user?.Role ||
        user?.RoleName ||
        "";

    if (String(role).toLowerCase() !== "admin") {

        showNotice(
            "Administrator access is required.",
            "error"
        );

        throw new Error("Not an administrator");
    }

    return user;
}


/* ============================================================
   LOAD CONTACT MESSAGES
   ============================================================ */

async function loadContactMessages() {

    const list =
        document.getElementById("contact-message-list");

    if (list) {

        list.innerHTML = `
            <div class="messages-loading">
                Loading messages...
            </div>
        `;
    }

    try {

        const data =
            await apiRequest("/ContactMessages");

        allContactMessages =
            Array.isArray(data)
                ? data
                : [];

        updateStatistics();

        applyFilters();

    } catch (error) {

        console.error(
            "Failed to load contact messages:",
            error
        );

        if (list) {

            list.innerHTML = `
                <div class="messages-error">
                    ${escapeHtml(
                        error.message ||
                        "Unable to load contact messages."
                    )}
                </div>
            `;
        }
    }
}


/* ============================================================
   STATISTICS
   ============================================================ */

function updateStatistics() {

    const total =
        allContactMessages.length;

    const newCount =
        countStatus("new");

    const openCount =
        countStatus("open");

    const resolvedCount =
        countStatus("resolved");

    const closedCount =
        countStatus("closed");

    setText("stat-all", total);
    setText("stat-new", newCount);
    setText("stat-open", openCount);
    setText("stat-resolved", resolvedCount);
    setText("stat-closed", closedCount);
}


function countStatus(status) {

    return allContactMessages.filter(
        message =>
            String(message.status || "")
                .toLowerCase() === status
    ).length;
}


/* ============================================================
   FILTERING
   ============================================================ */

function applyFilters() {

    const searchInput =
        document.getElementById("message-search");

    const search =
        String(searchInput?.value || "")
            .trim()
            .toLowerCase();

    filteredContactMessages =
        allContactMessages.filter(message => {

            const status =
                String(message.status || "")
                    .toLowerCase();

            if (
                currentStatusFilter !== "all" &&
                status !== currentStatusFilter
            ) {
                return false;
            }

            if (!search) {
                return true;
            }

            const searchableText = [

                message.fullName,
                message.email,
                message.phone,
                message.subject,
                message.messageBody,
                message.status

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(search);
        });

    renderMessageList();
}


/* ============================================================
   RENDER MESSAGE LIST
   ============================================================ */

function renderMessageList() {

    const list =
        document.getElementById("contact-message-list");

    const count =
        document.getElementById("message-result-count");

    if (!list) {
        return;
    }

    if (count) {

        count.textContent =
            `${filteredContactMessages.length} ${
                filteredContactMessages.length === 1
                    ? "message"
                    : "messages"
            }`;
    }

    if (filteredContactMessages.length === 0) {

        list.innerHTML = `
            <div class="messages-empty">
                No contact messages found.
            </div>
        `;

        return;
    }

    list.innerHTML =
        filteredContactMessages
            .map(createMessageItem)
            .join("");
}


/* ============================================================
   CREATE MESSAGE ITEM
   ============================================================ */

function createMessageItem(message) {

    const id =
        Number(message.contactMessageId);

    const status =
        String(message.status || "new")
            .toLowerCase();

    const statusClass =
        `status-${status}`;

    const active =
        currentMessageId === id
            ? " active"
            : "";

    const name =
        escapeHtml(
            message.fullName || "Unknown sender"
        );

    const subject =
        escapeHtml(
            message.subject || "No subject"
        );

    const preview =
        escapeHtml(
            message.messageBody || ""
        );

    const date =
        formatDate(message.createdAt);

    return `
        <button
            type="button"
            class="contact-message-item${active}"
            data-message-id="${id}">

            <div class="contact-message-top">

                <span class="contact-message-name">
                    ${name}
                </span>

                <span class="contact-message-date">
                    ${escapeHtml(date)}
                </span>

            </div>

            <div class="contact-message-subject">
                ${subject}
            </div>

            <div class="contact-message-preview">
                ${preview}
            </div>

            <div class="contact-message-bottom">

                <span class="message-status ${statusClass}">
                    ${escapeHtml(status)}
                </span>

            </div>

        </button>
    `;
}


/* ============================================================
   OPEN MESSAGE
   ============================================================ */

async function openMessage(messageId) {

    currentMessageId =
        Number(messageId);

    renderMessageList();

    try {

        const message =
            await apiRequest(
                `/ContactMessages/${messageId}`
            );

        renderMessageDetails(message);

    } catch (error) {

        console.error(
            "Failed to load contact message:",
            error
        );

        showNotice(
            error.message ||
            "Unable to load the selected message.",
            "error"
        );
    }
}


/* ============================================================
   RENDER MESSAGE DETAILS
   ============================================================ */

function renderMessageDetails(message) {

    const empty =
        document.getElementById(
            "message-detail-empty"
        );

    const content =
        document.getElementById(
            "message-detail-content"
        );

    if (!content) {
        return;
    }

    if (empty) {
        empty.style.display = "none";
    }

    content.classList.add("visible");

    setText(
        "detail-subject",
        message.subject || "No subject"
    );

    setText(
        "detail-date",
        formatDate(message.createdAt)
    );

    setText(
        "detail-name",
        message.fullName || "Unknown"
    );

    setText(
        "detail-message",
        message.messageBody || ""
    );

    const status =
        String(message.status || "new")
            .toLowerCase();

    const statusBadge =
        document.getElementById(
            "detail-status-badge"
        );

    if (statusBadge) {

        statusBadge.className =
            `message-status status-${status}`;

        statusBadge.textContent =
            status.toUpperCase();
    }

    const statusSelect =
        document.getElementById(
            "message-status-select"
        );

    if (statusSelect) {
        statusSelect.value = status;
    }


    /* ========================================================
       EMAIL
       ======================================================== */

    const emailLink =
        document.getElementById(
            "detail-email"
        );

    const emailButton =
        document.getElementById(
            "email-sender-button"
        );

    const email =
        String(message.email || "").trim();

    if (emailLink) {

        emailLink.textContent =
            email || "Not provided";

        emailLink.href =
            email
                ? `mailto:${encodeURIComponent(email)}`
                : "#";
    }

    if (emailButton) {

        emailButton.href =
            email
                ? `mailto:${encodeURIComponent(email)}`
                : "#";

        emailButton.style.display =
            email ? "inline-flex" : "none";
    }


    /* ========================================================
       PHONE
       ======================================================== */

    const phoneLink =
        document.getElementById(
            "detail-phone"
        );

    const callButton =
        document.getElementById(
            "call-sender-button"
        );

    const phone =
        String(message.phone || "").trim();

    if (phoneLink) {

        phoneLink.textContent =
            phone || "Not provided";

        phoneLink.href =
            phone
                ? `tel:${phone}`
                : "#";
    }

    if (callButton) {

        callButton.href =
            phone
                ? `tel:${phone}`
                : "#";

        callButton.style.display =
            phone ? "inline-flex" : "none";
    }
}


/* ============================================================
   UPDATE MESSAGE STATUS
   ============================================================ */

async function updateMessageStatus(status) {

    if (!currentMessageId) {
        return;
    }

    const allowedStatuses = [
        "new",
        "open",
        "resolved",
        "closed"
    ];

    if (!allowedStatuses.includes(status)) {
        return;
    }

    const select =
        document.getElementById(
            "message-status-select"
        );

    if (select) {
        select.disabled = true;
    }

    try {

        const result =
            await apiRequest(
                `/ContactMessages/${currentMessageId}/status`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        status: status
                    })
                }
            );

        const messageIndex =
            allContactMessages.findIndex(
                message =>
                    Number(message.contactMessageId) ===
                    Number(currentMessageId)
            );

        if (messageIndex !== -1) {

            allContactMessages[messageIndex].status =
                result?.status || status;
        }

        updateStatistics();

        applyFilters();

        updateDetailStatusBadge(
            result?.status || status
        );

        showNotice(
            "Message status updated successfully.",
            "success"
        );

    } catch (error) {

        console.error(
            "Failed to update message status:",
            error
        );

        showNotice(
            error.message ||
            "Unable to update message status.",
            "error"
        );

    } finally {

        if (select) {
            select.disabled = false;
        }
    }
}


/* ============================================================
   UPDATE DETAIL STATUS BADGE
   ============================================================ */

function updateDetailStatusBadge(status) {

    const badge =
        document.getElementById(
            "detail-status-badge"
        );

    if (!badge) {
        return;
    }

    const normalizedStatus =
        String(status || "new")
            .toLowerCase();

    badge.className =
        `message-status status-${normalizedStatus}`;

    badge.textContent =
        normalizedStatus.toUpperCase();
}


/* ============================================================
   NOTICE
   ============================================================ */

let noticeTimer = null;

function showNotice(message, type = "success") {

    const notice =
        document.getElementById(
            "messages-notice"
        );

    if (!notice) {
        return;
    }

    notice.className =
        `messages-notice show ${type}`;

    notice.textContent =
        message;

    clearTimeout(noticeTimer);

    noticeTimer =
        setTimeout(() => {

            notice.classList.remove("show");

        }, 4500);
}


/* ============================================================
   DATE FORMAT
   ============================================================ */

function formatDate(value) {

    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


/* ============================================================
   SET TEXT SAFELY
   ============================================================ */

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.textContent =
        value ?? "";
}


/* ============================================================
   HTML ESCAPE
   ============================================================ */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ============================================================
   EVENT HANDLERS
   ============================================================ */

function setupEventHandlers() {

    /* --------------------------------------------------------
       SEARCH
       -------------------------------------------------------- */

    const search =
        document.getElementById(
            "message-search"
        );

    if (search) {

        search.addEventListener(
            "input",
            () => {
                applyFilters();
            }
        );
    }


    /* --------------------------------------------------------
       STATUS FILTERS
       -------------------------------------------------------- */

    document
        .querySelectorAll(".status-filter")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".status-filter"
                        )
                        .forEach(item => {
                            item.classList.remove(
                                "active"
                            );
                        });

                    button.classList.add("active");

                    currentStatusFilter =
                        button.dataset.status ||
                        "all";

                    applyFilters();
                }
            );
        });


    /* --------------------------------------------------------
       MESSAGE LIST
       -------------------------------------------------------- */

    const messageList =
        document.getElementById(
            "contact-message-list"
        );

    if (messageList) {

        messageList.addEventListener(
            "click",
            event => {

                const item =
                    event.target.closest(
                        ".contact-message-item"
                    );

                if (!item) {
                    return;
                }

                const id =
                    item.dataset.messageId;

                if (id) {
                    openMessage(id);
                }
            }
        );
    }


    /* --------------------------------------------------------
       STATUS SELECT
       -------------------------------------------------------- */

    const statusSelect =
        document.getElementById(
            "message-status-select"
        );

    if (statusSelect) {

        statusSelect.addEventListener(
            "change",
            () => {

                updateMessageStatus(
                    statusSelect.value
                );
            }
        );
    }


    /* --------------------------------------------------------
       REFRESH
       -------------------------------------------------------- */

    const refreshButton =
        document.getElementById(
            "refresh-messages"
        );

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async () => {

                refreshButton.disabled = true;

                try {
                    await loadContactMessages();
                } finally {
                    refreshButton.disabled = false;
                }
            }
        );
    }
}


/* ============================================================
   INITIALIZATION
   ============================================================ */

async function initializeContactMessages() {

    try {

        await verifyAdministrator();

        setupEventHandlers();

        await loadContactMessages();

    } catch (error) {

        console.error(
            "Contact Messages initialization failed:",
            error
        );
    }
}


/* ============================================================
   START
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initializeContactMessages
);