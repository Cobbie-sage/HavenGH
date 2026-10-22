
(function () {

    "use strict";

    const API_BASE_URL = "https://havenghapi-production.up.railway.app/api";

    const conversationList =
        document.getElementById("conversation-list");

    const conversationSearch =
        document.getElementById("message-search");

    const chatEmptyState =
        document.getElementById("chat-empty-state");

    const activeChat =
        document.getElementById("active-chat");

    const chatMessages =
        document.getElementById("chat-messages");

    const messageForm =
        document.getElementById("message-form");

    const messageInput =
        document.getElementById("message-input");

    const sendMessageButton =
        document.getElementById("send-message-button");

    const logoutLink =
        document.getElementById("logout-link");


    // =========================================================
    // AUTHENTICATION
    // =========================================================

    function getToken() {

        return (
            sessionStorage.getItem("havenGH_token") ||
            sessionStorage.getItem("token") ||
            localStorage.getItem("havenGH_token") ||
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken")
        );

    }


    function clearAuthentication() {

        localStorage.removeItem("havenGH_token");
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");

        sessionStorage.removeItem("havenGH_token");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("accessToken");

    }


    function requireToken() {

        const token = getToken();

        if (!token) {

            window.location.href = "login.html";

            return null;

        }

        return token;

    }


    // =========================================================
    // API REQUEST
    // =========================================================

    async function apiRequest(url, options = {}) {

        const token = requireToken();

        if (!token) {
            return null;
        }

        const headers = {

            "Accept": "application/json",

            ...(options.body
                ? {
                    "Content-Type":
                        "application/json"
                }
                : {}),

            ...(options.headers || {}),

            "Authorization":
                "Bearer " + token

        };


        const response =
            await fetch(
                url,
                {
                    ...options,
                    headers
                }
            );


        if (response.status === 401) {

            clearAuthentication();

            alert(
                "Your session has expired. Please log in again."
            );

            window.location.href =
                "login.html";

            return null;

        }


        if (!response.ok) {

            let message =
                "The HavenGH API returned an error.";

            try {

                const data =
                    await response.json();

                if (data.message) {
                    message = data.message;
                }

                if (data.title) {
                    message = data.title;
                }

            } catch {
                // Non-JSON API response.
            }

            throw new Error(message);

        }


        if (response.status === 204) {
            return null;
        }


        return await response.json();

    }


    // =========================================================
    // HTML ESCAPING
    // =========================================================

    function escapeHtml(value) {

        const div =
            document.createElement("div");

        div.textContent =
            value ?? "";

        return div.innerHTML;

    }


    // =========================================================
    // PROFILE HELPERS
    // =========================================================

    function getParticipant(conversation) {

        return conversation &&
            conversation.otherParticipant
            ? conversation.otherParticipant
            : {};

    }


    function getProfile(conversation) {

        const participant =
            getParticipant(conversation);

        return participant.profile || {};

    }


    function getParticipantName(conversation) {

        const participant =
            getParticipant(conversation);

        const profile =
            getProfile(conversation);


        return (
            profile.fullName ||
            participant.fullName ||
            participant.email ||
            "HavenGH User"
        );

    }


    function getParticipantAvatar(conversation) {

        const profile =
            getProfile(conversation);

        return profile.avatarUrl || "";

    }


    function getParticipantRole(conversation) {

        const participant =
            getParticipant(conversation);

        const profile =
            getProfile(conversation);


        const role =
            participant.role ||
            profile.role ||
            "";


        if (!role) {
            return "";
        }


        const normalized =
            String(role).toLowerCase();


        if (normalized === "landlord") {
            return "Landlord";
        }

        if (normalized === "agent") {
            return "Property Agent";
        }

        if (normalized === "tenant") {
            return "Tenant";
        }

        if (normalized === "admin") {
            return "HavenGH Admin";
        }


        return String(role);

    }


    function getInitials(name) {

        if (!name) {
            return "HG";
        }


        return String(name)
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(
                part =>
                    part
                        .charAt(0)
                        .toUpperCase()
            )
            .join("");

    }


    // =========================================================
    // PROPERTY HELPERS
    // =========================================================

    function getProperty(conversation) {

        return conversation &&
            conversation.property
            ? conversation.property
            : null;

    }


    function getPropertyTitle(conversation) {

        const property =
            getProperty(conversation);


        if (property && property.title) {
            return property.title;
        }


        if (conversation.propertyId) {

            return (
                "Property #" +
                conversation.propertyId
            );

        }


        return "General conversation";

    }


    function getPropertyLocation(conversation) {

        const property =
            getProperty(conversation);


        if (!property || !property.location) {
            return "";
        }


        const location =
            property.location;


        return [
            location.area,
            location.city,
            location.region,
            location.country
        ]
            .filter(Boolean)
            .join(", ");

    }


    // =========================================================
    // DATE
    // =========================================================

    function formatDate(value) {

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


        return date.toLocaleString();

    }


    // =========================================================
    // EMPTY CONVERSATIONS
    // =========================================================

    function renderEmptyConversations() {

        conversationList.innerHTML = `

            <div class="empty-conversations">

                <p>
                    You don't have any conversations yet.
                </p>

            </div>

        `;

    }


    // =========================================================
    // CONVERSATIONS STATE
    // =========================================================

    let conversations = [];

    let selectedConversationId = null;


    // =========================================================
    // RENDER CONVERSATIONS
    // =========================================================

    function renderConversations(list) {

        conversationList.innerHTML = "";


        if (!list.length) {

            renderEmptyConversations();

            return;

        }


        list.forEach(function (conversation) {

            const participant =
                getParticipant(conversation);

            const fullName =
                getParticipantName(conversation);

            const avatarUrl =
                getParticipantAvatar(conversation);

            const role =
                getParticipantRole(conversation);

            const propertyTitle =
                getPropertyTitle(conversation);

            const propertyLocation =
                getPropertyLocation(conversation);

            const unread =
                Number(
                    conversation.unreadCount || 0
                );


            const button =
                document.createElement("button");


            button.type = "button";


            button.className =
                "conversation" +
                (
                    conversation.conversationId ===
                    selectedConversationId
                        ? " active"
                        : ""
                );


            button.dataset.conversationId =
                conversation.conversationId;


            let avatarHTML;


            if (avatarUrl) {

                avatarHTML = `

                    <div class="conversation-avatar">

                        <img
                            src="${escapeHtml(avatarUrl)}"
                            alt="${escapeHtml(fullName)}"
                            class="conversation-avatar-image"
                            onerror="
                                this.style.display='none';
                                this.nextElementSibling.style.display='flex';
                            "
                        >

                        <span
                            class="conversation-avatar-fallback"
                            style="display:none;"
                        >
                            ${escapeHtml(
                                getInitials(fullName)
                            )}
                        </span>

                    </div>

                `;

            } else {

                avatarHTML = `

                    <div class="conversation-avatar">

                        <span class="conversation-avatar-fallback">

                            ${escapeHtml(
                                getInitials(fullName)
                            )}

                        </span>

                    </div>

                `;

            }


            button.innerHTML = `

                ${avatarHTML}

                <div class="conversation-info">

                    <div class="conversation-top-line">

                        <strong>
                            ${escapeHtml(fullName)}
                        </strong>

                        <small>
                            ${escapeHtml(
                                formatDate(
                                    conversation.updatedAt
                                )
                            )}
                        </small>

                    </div>


                    ${
                        role
                            ? `
                                <span class="conversation-role">
                                    ${escapeHtml(role)}
                                </span>
                              `
                            : ""
                    }


                    <p class="conversation-property">

                        ${escapeHtml(
                            propertyTitle
                        )}

                    </p>


                    ${
                        propertyLocation
                            ? `
                                <p class="conversation-location">

                                    ${escapeHtml(
                                        propertyLocation
                                    )}

                                </p>
                              `
                            : ""
                    }


                    ${
                        unread > 0
                            ? `
                                <span class="conversation-unread">

                                    ${unread}

                                </span>
                              `
                            : ""
                    }

                </div>

            `;


            button.addEventListener(
                "click",
                function () {

                    selectConversation(
                        conversation.conversationId
                    );

                }
            );


            conversationList.appendChild(
                button
            );

        });

    }


    // =========================================================
    // LOAD CONVERSATIONS
    // =========================================================

    async function loadConversations() {

        try {

            const data =
                await apiRequest(
                    API_BASE_URL +
                    "/Messages/conversations"
                );


            if (!data) {
                return;
            }


            conversations =
                Array.isArray(data)
                    ? data
                    : [];


            renderConversations(
                conversations
            );


            updateConversationCount(
                conversations.length
            );


        } catch (error) {

            console.error(
                "Failed to load conversations:",
                error
            );


            conversationList.innerHTML = `

                <div class="empty-conversations">

                    <p>
                        Unable to load your conversations.
                    </p>

                    <small>
                        ${escapeHtml(
                            error.message
                        )}
                    </small>

                </div>

            `;

        }

    }


    // =========================================================
    // SELECT CONVERSATION
    // =========================================================

    async function selectConversation(
        conversationId
    ) {

        selectedConversationId =
            conversationId;


        const conversation =
            conversations.find(
                item =>
                    Number(
                        item.conversationId
                    ) ===
                    Number(
                        conversationId
                    )
            );


        if (!conversation) {
            return;
        }


        chatEmptyState.hidden = true;

        activeChat.hidden = false;


        // -----------------------------------------------------
        // PERSON
        // -----------------------------------------------------

        const participantName =
            getParticipantName(
                conversation
            );

        const participantRole =
            getParticipantRole(
                conversation
            );

        const participantAvatar =
            getParticipantAvatar(
                conversation
            );


        // -----------------------------------------------------
        // PROPERTY
        // -----------------------------------------------------

        const propertyTitle =
            getPropertyTitle(
                conversation
            );

        const propertyLocation =
            getPropertyLocation(
                conversation
            );


        const propertyName =
            document.getElementById(
                "chat-property-name"
            );

        const propertyTitleElement =
            document.getElementById(
                "chat-property-title"
            );

        const propertyLocationElement =
            document.getElementById(
                "chat-property-location"
            );

        const propertyLink =
            document.getElementById(
                "chat-property-link"
            );


        // -----------------------------------------------------
        // PERSON NAME
        // -----------------------------------------------------

        propertyName.textContent =
            participantName;


        // -----------------------------------------------------
        // ROLE + PROPERTY
        // -----------------------------------------------------

        propertyTitleElement.textContent =
            participantRole
                ? participantRole +
                  " • " +
                  propertyTitle
                : propertyTitle;


        propertyLocationElement.textContent =
            propertyLocation ||
            "Private HavenGH conversation";


        // -----------------------------------------------------
        // PROPERTY LINK
        // -----------------------------------------------------

        if (conversation.propertyId) {

            propertyLink.href =
                "property.html?id=" +
                encodeURIComponent(
                    conversation.propertyId
                );

            propertyLink.hidden = false;

        } else {

            propertyLink.hidden = true;

        }


        // -----------------------------------------------------
        // CHAT AVATAR
        // -----------------------------------------------------

        updateChatProfile(
            participantName,
            participantAvatar
        );


        await loadMessages(
            conversationId
        );


        renderConversations(
            conversations
        );

    }


    // =========================================================
    // CHAT PROFILE
    // =========================================================

    function updateChatProfile(
        name,
        avatarUrl
    ) {

        const chatHeader =
            document.querySelector(
                ".chat-header"
            );


        if (!chatHeader) {
            return;
        }


        let profile =
            chatHeader.querySelector(
                ".chat-profile"
            );


        if (!profile) {

            profile =
                document.createElement(
                    "div"
                );

            profile.className =
                "chat-profile";


            const firstChild =
                chatHeader.firstElementChild;


            if (firstChild) {

                firstChild.parentNode.insertBefore(
                    profile,
                    firstChild
                );

            } else {

                chatHeader.appendChild(
                    profile
                );

            }

        }


        const initials =
            getInitials(name);


        profile.innerHTML = avatarUrl

            ? `

                <div class="chat-profile-avatar">

                    <img
                        src="${escapeHtml(avatarUrl)}"
                        alt="${escapeHtml(name)}"
                        onerror="
                            this.style.display='none';
                            this.nextElementSibling.style.display='flex';
                        "
                    >

                    <span
                        class="chat-profile-fallback"
                        style="display:none;"
                    >
                        ${escapeHtml(initials)}
                    </span>

                </div>

              `

            : `

                <div class="chat-profile-avatar">

                    <span class="chat-profile-fallback">

                        ${escapeHtml(initials)}

                    </span>

                </div>

              `;

    }


    // =========================================================
    // LOAD MESSAGES
    // =========================================================

    async function loadMessages(
        conversationId
    ) {

        chatMessages.innerHTML = `

            <div class="empty-messages">

                <p>
                    Loading messages...
                </p>

            </div>

        `;


        try {

            const data =
                await apiRequest(
                    API_BASE_URL +
                    "/Messages/conversations/" +
                    encodeURIComponent(
                        conversationId
                    )
                );


            if (!data) {
                return;
            }


            const messages =
                Array.isArray(data)
                    ? data
                    : Array.isArray(
                        data.messages
                    )
                        ? data.messages
                        : [];


            // Render ONCE.
            renderMessages(
                messages
            );


        } catch (error) {

            console.error(
                "Failed to load messages:",
                error
            );


            chatMessages.innerHTML = `

                <div class="empty-messages">

                    <p>
                        Unable to load messages.
                    </p>

                    <small>
                        ${escapeHtml(
                            error.message
                        )}
                    </small>

                </div>

            `;

        }

    }


    // =========================================================
    // RENDER MESSAGES
    // =========================================================

    function renderMessages(
        messages
    ) {

        chatMessages.innerHTML = "";


        if (!messages.length) {

            chatMessages.innerHTML = `

                <div class="empty-messages">

                    <p>
                        No messages in this conversation yet.
                    </p>

                </div>

            `;

            return;

        }


        messages.forEach(
            function (message) {

                const wrapper =
                    document.createElement(
                        "div"
                    );


                wrapper.className =
                    "message " +
                    (
                        message.isMine
                            ? "sent"
                            : "received"
                    );


                const time =
                    document.createElement(
                        "span"
                    );


                time.className =
                    "message-time";


                time.textContent =
                    formatDate(
                        message.createdAt
                    );


                const text =
                    document.createElement(
                        "p"
                    );


                text.textContent =
                    message.messageBody ||
                    "";


                wrapper.appendChild(
                    time
                );

                wrapper.appendChild(
                    text
                );


                chatMessages.appendChild(
                    wrapper
                );

            }
        );


        chatMessages.scrollTop =
            chatMessages.scrollHeight;

    }


    // =========================================================
    // SEND MESSAGE
    // =========================================================

    messageForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const text =
                messageInput.value.trim();


            if (!text) {
                return;
            }


            if (!selectedConversationId) {

                alert(
                    "Please select a conversation first."
                );

                return;

            }


            sendMessageButton.disabled =
                true;

            sendMessageButton.textContent =
                "Sending...";


            try {

                const message =
                    await apiRequest(
                        API_BASE_URL +
                        "/Messages/conversations/" +
                        encodeURIComponent(
                            selectedConversationId
                        ) +
                        "/messages",
                        {
                            method: "POST",

                            body:
                                JSON.stringify({
                                    messageBody:
                                        text
                                })
                        }
                    );


                if (!message) {
                    return;
                }


                messageInput.value = "";


                await loadMessages(
                    selectedConversationId
                );


                await loadConversations();


                // Keep the selected conversation highlighted.
                renderConversations(
                    conversations
                );


            } catch (error) {

                console.error(
                    "Message sending failed:",
                    error
                );


                alert(
                    error.message ||
                    "Unable to send message."
                );


            } finally {

                sendMessageButton.disabled =
                    false;

                sendMessageButton.textContent =
                    "Send";

            }

        }
    );


    // =========================================================
    // SEARCH
    // =========================================================

    conversationSearch.addEventListener(
        "input",
        function () {

            const search =
                this.value
                    .trim()
                    .toLowerCase();


            if (!search) {

                renderConversations(
                    conversations
                );

                return;

            }


            const filtered =
                conversations.filter(
                    conversation => {

                        const participant =
                            getParticipant(
                                conversation
                            );

                        const profile =
                            getProfile(
                                conversation
                            );

                        const property =
                            getProperty(
                                conversation
                            );


                        const searchableText = [

                            getParticipantName(
                                conversation
                            ),

                            participant.email,

                            participant.phone,

                            profile.fullName,

                            profile.whatsAppNumber,

                            profile.instagramUsername,

                            getPropertyTitle(
                                conversation
                            ),

                            getPropertyLocation(
                                conversation
                            ),

                            conversation.propertyId,

                            conversation.conversationId

                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();


                        return searchableText.includes(
                            search
                        );

                    }
                );


            renderConversations(
                filtered
            );

        }
    );


    // =========================================================
    // CONVERSATION COUNT
    // =========================================================

    function updateConversationCount(
        count
    ) {

        const element =
            document.getElementById(
                "conversation-count"
            );


        if (!element) {
            return;
        }


        element.textContent =
            count +
            " conversation" +
            (
                count === 1
                    ? ""
                    : "s"
            );

    }


    // =========================================================
    // LOGOUT
    // =========================================================

    if (logoutLink) {

        logoutLink.addEventListener(
            "click",
            function () {

                clearAuthentication();

            }
        );

    }


    // =========================================================
    // INITIALIZE
    // =========================================================

    async function initializePage() {

        const token =
            getToken();


        if (!token) {

            window.location.href =
                "login.html";

            return;

        }


        await loadConversations();

    }


    initializePage();

})();

