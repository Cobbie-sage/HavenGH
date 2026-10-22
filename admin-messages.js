"use strict";

/* ============================================================
   HavenGH - Admin Messages
   Secure Admin Messaging
   ============================================================ */

const HAVENGH_API = "https://havenghapi-production.up.railway.app/api";

const TOKEN_KEYS = [
    "havenGH_token",
    "token",
    "accessToken"
];

let conversations = [];
let filteredConversations = [];

let currentConversationId = null;


/* ============================================================
   AUTHENTICATION
   ============================================================ */

function getToken() {

    for (const key of TOKEN_KEYS) {

        const token =
            localStorage.getItem(key) ||
            sessionStorage.getItem(key);

        if (token) {
            return token;
        }
    }

    return null;
}


function clearAuthentication() {

    TOKEN_KEYS.forEach(key => {

        localStorage.removeItem(key);
        sessionStorage.removeItem(key);

    });
}


function redirectToLogin() {

    window.location.href = "login.html";
}


/* ============================================================
   API
   ============================================================ */

async function apiRequest(endpoint, options = {}) {

    const token = getToken();

    if (!token) {

        redirectToLogin();

        throw new Error(
            "AUTHENTICATION_REQUIRED"
        );
    }


    const headers = {
        "Accept": "application/json",
        ...(options.headers || {}),
        "Authorization": `Bearer ${token}`
    };


    if (
        options.body &&
        !headers["Content-Type"]
    ) {
        headers["Content-Type"] =
            "application/json";
    }


    const response =
        await fetch(
            `${HAVENGH_API}${endpoint}`,
            {
                ...options,
                headers
            }
        );


    if (response.status === 401) {

        clearAuthentication();

        redirectToLogin();

        throw new Error(
            "AUTHENTICATION_REQUIRED"
        );
    }


    if (response.status === 403) {

        throw new Error(
            "Administrator access is required."
        );
    }


    let data = null;

    const contentType =
        response.headers.get(
            "content-type"
        );


    if (
        contentType &&
        contentType.includes(
            "application/json"
        )
    ) {
        data = await response.json();
    }


    if (!response.ok) {

        throw new Error(
            data?.message ||
            `Request failed (${response.status}).`
        );
    }


    return data;
}


/* ============================================================
   VERIFY ADMIN
   ============================================================ */

async function verifyAdministrator() {

    const user =
        await apiRequest(
            "/Auth/me"
        );


    const role =
        String(
            user?.role ||
            user?.Role ||
            ""
        )
        .trim()
        .toLowerCase();


    if (role !== "admin") {

        throw new Error(
            "Administrator access is required."
        );
    }


    return user;
}


/* ============================================================
   LOAD CONVERSATIONS
   ============================================================ */

async function loadConversations() {

    const container =
        document.getElementById(
            "conversation-list"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `
        <div class="messages-loading">
            Loading conversations...
        </div>
    `;


    try {

        conversations =
            await apiRequest(
                "/Messages/admin/conversations"
            );


        if (
            !Array.isArray(
                conversations
            )
        ) {
            conversations = [];
        }


        filteredConversations =
            [...conversations];


        renderConversations();

        updateNotificationCount();


    } catch (error) {

        console.error(
            "HavenGH Admin Messages Error:",
            error
        );


        container.innerHTML = `
            <div class="messages-error">
                <strong>
                    Unable to load messages
                </strong>

                <p>
                    ${escapeHtml(
                        error.message ||
                        "Please try again."
                    )}
                </p>
            </div>
        `;
    }
}


/* ============================================================
   SEARCH
   ============================================================ */

function setupSearch() {

    const search =
        document.getElementById(
            "message-search"
        );


    if (!search) {
        return;
    }


    search.addEventListener(
        "input",
        () => {

            const query =
                search.value
                    .trim()
                    .toLowerCase();


            if (!query) {

                filteredConversations =
                    [...conversations];

            } else {

                filteredConversations =
                    conversations.filter(
                        conversation =>
                            conversationMatches(
                                conversation,
                                query
                            )
                    );
            }


            renderConversations();
        }
    );
}


function conversationMatches(
    conversation,
    query
) {

    const propertyTitle =
        conversation.property?.title || "";


    const participants =
        Array.isArray(
            conversation.participants
        )
            ? conversation.participants
            : [];


    const participantText =
        participants
            .map(participant =>
                [
                    participant.email,
                    participant.phone,
                    participant.profile?.fullName
                ]
                .filter(Boolean)
                .join(" ")
            )
            .join(" ");


    const lastMessage =
        conversation.lastMessage
            ?.messageBody || "";


    return [
        propertyTitle,
        participantText,
        lastMessage
    ]
        .join(" ")
        .toLowerCase()
        .includes(query);
}


/* ============================================================
   RENDER CONVERSATIONS
   ============================================================ */

function renderConversations() {

    const container =
        document.getElementById(
            "conversation-list"
        );


    if (!container) {
        return;
    }


    if (
        filteredConversations.length === 0
    ) {

        container.innerHTML = `
            <div class="messages-empty-list">

                <div>
                    ✉
                </div>

                <strong>
                    No conversations found
                </strong>

                <span>
                    User conversations will appear here.
                </span>

            </div>
        `;

        return;
    }


    container.innerHTML =
        filteredConversations
            .map(
                conversation =>
                    createConversationCard(
                        conversation
                    )
            )
            .join("");


    container
        .querySelectorAll(
            "[data-conversation-id]"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const id =
                        Number(
                            card.dataset
                                .conversationId
                        );

                    openConversation(id);
                }
            );
        });
}


/* ============================================================
   CONVERSATION CARD
   ============================================================ */

function createConversationCard(
    conversation
) {

    const participants =
        Array.isArray(
            conversation.participants
        )
            ? conversation.participants
            : [];


    const names =
        participants
            .map(
                participant =>
                    participant.profile
                        ?.fullName ||
                    participant.email ||
                    "User"
            )
            .filter(Boolean);


    const title =
        conversation.property?.title ||
        "General Conversation";


    const participantText =
        names.join(", ");


    const lastMessage =
        conversation.lastMessage
            ?.messageBody ||
        "No messages yet";


    const date =
        formatDate(
            conversation.updatedAt
        );


    const unread =
        conversation.lastMessage &&
        !conversation.lastMessage.isRead;


    return `
        <button
            type="button"
            class="conversation-card ${
                currentConversationId ===
                conversation.conversationId
                    ? "active"
                    : ""
            }"
            data-conversation-id="${
                conversation.conversationId
            }">

            <div class="conversation-avatar">
                ${escapeHtml(
                    getInitials(
                        names[0] ||
                        "User"
                    )
                )}
            </div>

            <div class="conversation-card-content">

                <div class="conversation-card-top">

                    <strong>
                        ${escapeHtml(
                            names[0] ||
                            "HavenGH User"
                        )}
                    </strong>

                    <time>
                        ${escapeHtml(date)}
                    </time>

                </div>

                <div class="conversation-property">
                    ${escapeHtml(title)}
                </div>

                <p>
                    ${escapeHtml(
                        truncate(
                            lastMessage,
                            70
                        )
                    )}
                </p>

                ${
                    participantText
                        ? `
                        <small>
                            ${escapeHtml(
                                participantText
                            )}
                        </small>
                        `
                        : ""
                }

            </div>

            ${
                unread
                    ? `
                    <span
                        class="conversation-unread">
                    </span>
                    `
                    : ""
            }

        </button>
    `;
}


/* ============================================================
   OPEN CONVERSATION
   ============================================================ */

async function openConversation(
    conversationId
) {

    currentConversationId =
        conversationId;


    renderConversations();


    const windowElement =
        document.getElementById(
            "message-window"
        );


    if (!windowElement) {
        return;
    }


    windowElement.innerHTML = `
        <div class="messages-loading">
            Loading conversation...
        </div>
    `;


    try {

        const data =
            await apiRequest(
                `/Messages/admin/conversations/${conversationId}`
            );


        renderMessageWindow(
            data
        );


    } catch (error) {

        windowElement.innerHTML = `
            <div class="messages-error">

                <strong>
                    Unable to load conversation
                </strong>

                <p>
                    ${escapeHtml(
                        error.message
                    )}
                </p>

            </div>
        `;
    }
}


/* ============================================================
   MESSAGE WINDOW
   ============================================================ */

function renderMessageWindow(
    data
) {

    const windowElement =
        document.getElementById(
            "message-window"
        );


    if (!windowElement) {
        return;
    }


    const participants =
        Array.isArray(
            data.participants
        )
            ? data.participants
            : [];


    const messages =
        Array.isArray(
            data.messages
        )
            ? data.messages
            : [];


    const propertyTitle =
        conversations.find(
            c =>
                c.conversationId ===
                data.conversationId
        )?.property?.title ||
        "HavenGH Conversation";


    const otherParticipants =
        participants
            .map(
                participant =>
                    participant.profile
                        ?.fullName ||
                    participant.email ||
                    "User"
            )
            .join(", ");


    windowElement.innerHTML = `

        <div class="message-window-header">

            <div>

                <span class="section-label">
                    CONVERSATION
                </span>

                <h3>
                    ${escapeHtml(
                        propertyTitle
                    )}
                </h3>

                <p>
                    ${escapeHtml(
                        otherParticipants
                    )}
                </p>

            </div>

        </div>


        <div
            class="messages-body"
            id="messages-body">

            ${
                messages.length
                    ? messages
                        .map(
                            message =>
                                createMessageBubble(
                                    message,
                                    participants
                                )
                        )
                        .join("")
                    : `
                    <div class="messages-empty">

                        <strong>
                            No messages yet
                        </strong>

                        <p>
                            Start the conversation
                            with this user.
                        </p>

                    </div>
                    `
            }

        </div>


        <form
            class="admin-message-form"
            id="admin-message-form">

            <textarea
                id="admin-message-input"
                maxlength="2000"
                placeholder="Write a message..."
                rows="2"
                required></textarea>

            <button
                type="submit">
                Send Message
            </button>

        </form>
    `;


    scrollMessagesToBottom();


    const form =
        document.getElementById(
            "admin-message-form"
        );


    form?.addEventListener(
        "submit",
        sendAdminMessage
    );
}


/* ============================================================
   MESSAGE BUBBLE
   ============================================================ */

function createMessageBubble(
    message,
    participants
) {

    const isAdmin =
        message.senderUserId ===
        getCurrentUserId();


    let senderName =
        isAdmin
            ? "HavenGH Admin"
            : "User";


    if (!isAdmin) {

        const sender =
            participants.find(
                participant =>
                    participant.userId ===
                    message.senderUserId
            );


        senderName =
            sender?.profile?.fullName ||
            sender?.email ||
            "User";
    }


    return `
        <div class="
            message-row
            ${isAdmin ? "message-mine" : "message-theirs"}
        ">

            <div class="message-bubble">

                <div class="message-sender">
                    ${escapeHtml(senderName)}
                </div>

                <div class="message-text">
                    ${escapeHtml(
                        message.messageBody
                    )}
                </div>

                <time>
                    ${escapeHtml(
                        formatDate(
                            message.createdAt
                        )
                    )}
                </time>

            </div>

        </div>
    `;
}


/* ============================================================
   SEND ADMIN MESSAGE
   ============================================================ */

async function sendAdminMessage(
    event
) {

    event.preventDefault();


    if (!currentConversationId) {
        return;
    }


    const input =
        document.getElementById(
            "admin-message-input"
        );


    const button =
        event.target.querySelector(
            "button[type='submit']"
        );


    const message =
        input?.value.trim();


    if (!message) {
        return;
    }


    button.disabled = true;


    try {

        await apiRequest(
            `/Messages/admin/conversations/${currentConversationId}/messages`,
            {
                method: "POST",

                body: JSON.stringify({
                    messageBody: message
                })
            }
        );


        input.value = "";


        await loadConversations();

        await openConversation(
            currentConversationId
        );


    } catch (error) {

        alert(
            error.message ||
            "Unable to send message."
        );


    } finally {

        button.disabled = false;
    }
}


/* ============================================================
   NOTIFICATIONS
   ============================================================ */

function updateNotificationCount() {

    const element =
        document.getElementById(
            "adminNotificationCount"
        );


    if (!element) {
        return;
    }


    const unread =
        conversations.filter(
            conversation =>
                conversation.lastMessage &&
                !conversation.lastMessage.isRead
        ).length;


    element.textContent =
        unread;
}


/* ============================================================
   HELPERS
   ============================================================ */

function getCurrentUserId() {

    const token =
        getToken();


    if (!token) {
        return null;
    }


    try {

        const payload =
            token.split(".")[1];


        const decoded =
            JSON.parse(
                atob(
                    payload
                        .replace(/-/g, "+")
                        .replace(/_/g, "/")
                )
            );


        return Number(
            decoded[
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
            ] ||
            decoded.sub ||
            0
        );


    } catch {

        return null;
    }
}


function formatDate(value) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (Number.isNaN(
        date.getTime()
    )) {
        return "";
    }


    return date.toLocaleString(
        [],
        {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


function truncate(
    text,
    length
) {

    if (!text) {
        return "";
    }


    return text.length > length
        ? `${text.substring(
            0,
            length
        )}...`
        : text;
}


function getInitials(
    name
) {

    return String(name)
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(
            word =>
                word.charAt(0)
                    .toUpperCase()
        )
        .join("");
}


function escapeHtml(
    value
) {

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


function scrollMessagesToBottom() {

    const body =
        document.getElementById(
            "messages-body"
        );


    if (body) {

        body.scrollTop =
            body.scrollHeight;
    }
}


/* ============================================================
   INITIALIZE
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            await verifyAdministrator();

            setupSearch();

            const refresh =
                document.getElementById(
                    "refresh-messages"
                );


            refresh?.addEventListener(
                "click",
                () => loadConversations()
            );


            await loadConversations();


        } catch (error) {

            console.error(
                "HavenGH Admin Messages initialization error:",
                error
            );


            if (
                error.message ===
                "AUTHENTICATION_REQUIRED"
            ) {
                return;
            }


            const container =
                document.getElementById(
                    "conversation-list"
                );


            if (container) {

                container.innerHTML = `
                    <div class="messages-error">

                        <strong>
                            Access denied
                        </strong>

                        <p>
                            ${escapeHtml(
                                error.message
                            )}
                        </p>

                    </div>
                `;
            }
        }
    }
);