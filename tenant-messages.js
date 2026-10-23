"use strict";

/* ============================================================
   HavenGH - Tenant Messages
   Property + Stay Messaging
   API-connected
   ============================================================ */

const HAVENGH_API = "https://havenghapi-production.up.railway.app/api";

let currentConversationId = null;

/* ============================================================
   AUTHENTICATION
   ============================================================ */

function getAuthToken() {
    return (
        sessionStorage.getItem("havenGH_token") ||
        localStorage.getItem("havenGH_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        ""
    );
}


function clearAuthentication() {

    sessionStorage.removeItem("havenGH_token");
    sessionStorage.removeItem("havenGH_user");

    localStorage.removeItem("havenGH_token");
    localStorage.removeItem("havenGH_user");
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
}


/* ============================================================
   INITIALIZE
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    setupMessageSearch();
    setupMessageRetry();
    setupBackButton();
    setupSendMessage();

    loadConversations();

});


/* ============================================================
   LOAD CONVERSATIONS
   ============================================================ */

async function loadConversations() {

    const loading =
        document.getElementById("messages-loading");

    const error =
        document.getElementById("messages-error");

    const list =
        document.getElementById("conversations-list");

    const empty =
        document.getElementById("messages-empty");

    if (loading) {
        loading.style.display = "block";

        const heading =
            loading.querySelector("h3");

        if (heading) {
            heading.textContent = "Loading messages...";
        }
    }

    if (error) {
        error.style.display = "none";
    }

    if (empty) {
        empty.style.display = "none";
    }

    if (list) {
        list.innerHTML = "";
    }


    const token = getAuthToken();

    if (!token) {

        showMessageError(
            "Your session has expired. Please log in again."
        );

        return;
    }


    try {

        const response = await fetch(
            `${HAVENGH_API}/Messages/conversations`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json"
                }
            }
        );


        if (response.status === 401) {

            clearAuthentication();

            throw new Error(
                "Your session has expired. Please log in again."
            );
        }


        if (!response.ok) {

            throw new Error(
                `Unable to load conversations. Server returned ${response.status}.`
            );
        }


        const conversations =
            await response.json();


        console.log(
            "HavenGH conversations loaded:",
            conversations
        );


        if (loading) {
            loading.style.display = "none";
        }


        if (
            !Array.isArray(conversations) ||
            conversations.length === 0
        ) {

            if (empty) {
                empty.style.display = "block";
            }

        } else {

            renderConversations(conversations);
        }


        /*
         * Support:
         *
         * tenant-messages.html?conversationId=27
         *
         * This allows Stay Details to create a conversation
         * and send the tenant directly to that conversation.
         */

        const params =
            new URLSearchParams(
                window.location.search
            );


        const conversationId =
            Number(
                params.get("conversationId")
            );


        if (
            Number.isInteger(conversationId) &&
            conversationId > 0
        ) {

            const conversation =
                Array.isArray(conversations)
                    ? conversations.find(
                        item =>
                            Number(item.conversationId) ===
                            conversationId
                    )
                    : null;


            if (conversation) {

                await openConversation(
                    conversation
                );

            } else {

                /*
                 * The conversation may have just been created.
                 */

                await openConversationById(
                    conversationId
                );
            }
        }

    }

    catch (error) {

        console.error(
            "HavenGH messages error:",
            error
        );


        if (loading) {
            loading.style.display = "none";
        }


        showMessageError(
            error.message ||
            "Unable to load messages."
        );
    }

}


    /* ============================================================
   RENDER CONVERSATIONS
   ============================================================ */

function renderConversations(conversations) {

    const list =
        document.getElementById(
            "conversations-list"
        );

    if (!list) {
        return;
    }

    list.innerHTML = "";


    conversations.forEach(conversation => {

        const card =
            document.createElement("button");


        card.type = "button";

        card.className =
            "conversation-card";


        const otherParticipant =
            conversation.otherParticipant ||
            conversation.OtherParticipant ||
            null;


        /* ====================================================
           PARTICIPANT PROFILE
           ==================================================== */

        const profile =
            otherParticipant?.profile ||
            otherParticipant?.Profile ||
            null;


        const fullName =
            profile?.fullName ||
            profile?.FullName ||
            otherParticipant?.fullName ||
            otherParticipant?.FullName ||
            "";


        const email =
            otherParticipant?.email ||
            otherParticipant?.Email ||
            "";


        /*
         * Prefer the person's real name.
         * Email is only used as a fallback.
         */

        const displayName =
            fullName.trim() ||
            email.trim() ||
            "HavenGH User";


        /* ====================================================
           PROFILE PHOTO
           ==================================================== */

        let avatarUrl =
            profile?.avatarUrl ||
            profile?.AvatarUrl ||
            "";

/*
 * Convert relative API paths into production URLs.
 *
 * Example:
 * /uploads/profiles/7.jpg
 *
 * becomes:
 * https://havenghapi-production.up.railway.app/uploads/profiles/7.jpg
 */

        if (
            avatarUrl &&
            !avatarUrl.startsWith("http://") &&
            !avatarUrl.startsWith("https://")
        ) {

            if (!avatarUrl.startsWith("/")) {
                avatarUrl = "/" + avatarUrl;
            }

            avatarUrl =
                `https://havenghapi-production.up.railway.app${avatarUrl}`;
        }


        /* ====================================================
           FALLBACK INITIALS
           ==================================================== */

        const initials =
            getInitials(displayName);


        let avatarHtml;


        if (avatarUrl) {

            avatarHtml = `
                <img
                    src="${escapeHtml(avatarUrl)}"
                    alt="${escapeHtml(displayName)}"
                    class="conversation-avatar-image"
                    loading="lazy"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                >

                <span
                    class="conversation-avatar-fallback"
                    style="display:none;">
                    ${escapeHtml(initials)}
                </span>
            `;

        }
        else {

            avatarHtml = `
                <span class="conversation-avatar-fallback">
                    ${escapeHtml(initials)}
                </span>
            `;

        }


        /* ====================================================
           LAST MESSAGE
           ==================================================== */

        const lastMessage =
            conversation.lastMessage ||
            conversation.LastMessage;


        const preview =
            lastMessage?.messageBody ||
            lastMessage?.MessageBody ||
            "No messages yet";


        /* ====================================================
           UNREAD COUNT
           ==================================================== */

        const unread =
            Number(
                conversation.unreadCount ||
                conversation.UnreadCount ||
                0
            );


        /* ====================================================
           PROPERTY
           ==================================================== */

        const property =
            conversation.property ||
            conversation.Property;


        /* ====================================================
           STAY
           ==================================================== */

        const stay =
            conversation.stay ||
            conversation.Stay;


        let conversationTitle =
            "General Conversation";


        if (property?.title) {

            conversationTitle =
                property.title;

        }
        else if (property?.Title) {

            conversationTitle =
                property.Title;

        }
        else if (stay?.title) {

            conversationTitle =
                stay.title;

        }
        else if (stay?.Title) {

            conversationTitle =
                stay.Title;

        }
        else if (conversation.propertyId) {

            conversationTitle =
                `Property #${conversation.propertyId}`;

        }
        else if (conversation.PropertyId) {

            conversationTitle =
                `Property #${conversation.PropertyId}`;

        }
        else if (conversation.stayId) {

            conversationTitle =
                `Stay #${conversation.stayId}`;

        }
        else if (conversation.StayId) {

            conversationTitle =
                `Stay #${conversation.StayId}`;

        }


        /* ====================================================
           ROLE
           ==================================================== */

        const role =
            otherParticipant?.role ||
            otherParticipant?.Role ||
            "";


        const profileRole =
            role
                ? formatParticipantRole(role)
                : "";


        /* ====================================================
           UPDATED DATE
           ==================================================== */

        const updated =
            formatMessageDate(
                conversation.updatedAt ||
                conversation.UpdatedAt
            );


        /* ====================================================
           CARD
           ==================================================== */

        card.innerHTML = `

            <div class="conversation-avatar">

                ${avatarHtml}

            </div>


            <div class="conversation-content">

                <div class="conversation-top">

                    <strong>
                        ${escapeHtml(displayName)}
                    </strong>

                    <span>
                        ${escapeHtml(updated)}
                    </span>

                </div>


                ${
                    profileRole
                        ? `
                            <div class="conversation-role">
                                ${escapeHtml(profileRole)}
                            </div>
                        `
                        : ""
                }


                <div class="conversation-property">

                    ${escapeHtml(conversationTitle)}

                </div>


                <p class="conversation-preview">

                    ${escapeHtml(preview)}

                </p>

            </div>


            ${
                unread > 0
                    ? `
                        <span class="conversation-unread">
                            ${unread}
                        </span>
                    `
                    : ""
            }

        `;


        card.addEventListener(
            "click",
            () => openConversation(conversation)
        );


        list.appendChild(card);

    });

}
/* ============================================================
   OPEN CONVERSATION
   ============================================================ */

async function openConversation(conversation) {

    if (!conversation) {
        return;
    }


    currentConversationId =
        conversation.conversationId ??
        conversation.ConversationId;


    const conversationsList =
        document.getElementById(
            "conversations-list"
        );


    const conversationView =
        document.getElementById(
            "conversation-view"
        );


    const loading =
        document.getElementById(
            "messages-loading"
        );


    const empty =
        document.getElementById(
            "messages-empty"
        );


    if (conversationsList) {
        conversationsList.style.display = "none";
    }


    if (empty) {
        empty.style.display = "none";
    }


    if (loading) {

        loading.style.display = "block";

        const heading =
            loading.querySelector("h3");

        if (heading) {
            heading.textContent =
                "Loading conversation...";
        }
    }


    if (conversationView) {
        conversationView.style.display = "none";
    }


    const person =
        document.getElementById(
            "conversation-person"
        );


    const property =
        document.getElementById(
            "conversation-property"
        );


    const participant =
    conversation.otherParticipant ||
    conversation.OtherParticipant ||
    null;


const participantProfile =
    participant?.profile ||
    participant?.Profile ||
    null;


const conversationPersonName =
    participantProfile?.fullName ||
    participantProfile?.FullName ||
    participant?.fullName ||
    participant?.FullName ||
    participant?.email ||
    participant?.Email ||
    "HavenGH User";


    /*
     * Determine whether this is a property or Stay.
     */

    const propertyTitle =
        conversation.property?.title ||
        conversation.property?.Title;


    const stayTitle =
        conversation.stay?.title ||
        conversation.stay?.Title;


    let conversationTitle =
        "General Conversation";


    if (propertyTitle) {

        conversationTitle =
            propertyTitle;

    }
    else if (stayTitle) {

        conversationTitle =
            stayTitle;

    }
    else if (conversation.propertyId) {

        conversationTitle =
            `Property #${conversation.propertyId}`;

    }
    else if (conversation.stayId) {

        conversationTitle =
            `Stay #${conversation.stayId}`;

    }


   if (person) {
    person.textContent = conversationPersonName;
      }


    if (property) {
        property.textContent = conversationTitle;
    }


    try {

        const token =
            getAuthToken();


        if (!token) {

            throw new Error(
                "Your session has expired. Please log in again."
            );
        }


        const response = await fetch(
            `${HAVENGH_API}/Messages/conversations/${currentConversationId}`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`,

                    "Accept":
                        "application/json"
                }
            }
        );


        if (response.status === 401) {

            clearAuthentication();

            throw new Error(
                "Your session has expired. Please log in again."
            );
        }


        if (response.status === 404) {

            throw new Error(
                "Conversation not found."
            );
        }


        if (!response.ok) {

            throw new Error(
                `Unable to load conversation. Server returned ${response.status}.`
            );
        }


        const data =
            await response.json();


        /*
         * If the API returns updated conversation
         * information, use it.
         */

        if (
            data.otherParticipant ||
            data.property ||
            data.stay
        ) {

           
          const returnedParticipant =
    data.otherParticipant ||
    data.OtherParticipant ||
    null;


const returnedProfile =
    returnedParticipant?.profile ||
    returnedParticipant?.Profile ||
    null;


const returnedName =
    returnedProfile?.fullName ||
    returnedProfile?.FullName ||
    returnedParticipant?.fullName ||
    returnedParticipant?.FullName ||
    returnedParticipant?.email ||
    returnedParticipant?.Email;


if (
    returnedName &&
    person
) {

    person.textContent =
        returnedName;
}

            const returnedTitle =
                data.property?.title ||
                data.property?.Title ||
                data.stay?.title ||
                data.stay?.Title;


            if (
                returnedTitle &&
                property
            ) {

                property.textContent =
                    returnedTitle;
            }
        }


        renderConversationMessages(
            data.messages ||
            data.Messages ||
            []
        );


        if (loading) {
            loading.style.display = "none";
        }


        if (conversationView) {
            conversationView.style.display = "block";
        }

    }

    catch (error) {

        console.error(
            "Conversation loading error:",
            error
        );


        if (loading) {
            loading.style.display = "none";
        }


        showMessageError(
            error.message ||
            "Unable to load conversation."
        );
    }

}


/* ============================================================
   OPEN CONVERSATION BY ID
   ============================================================ */

async function openConversationById(conversationId) {

    const token =
        getAuthToken();


    if (!token) {

        showMessageError(
            "Your session has expired. Please log in again."
        );

        return;
    }


    try {

        const response =
            await fetch(
                `${HAVENGH_API}/Messages/conversations/${conversationId}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Accept":
                            "application/json"
                    }
                }
            );


        if (response.status === 401) {

            clearAuthentication();

            throw new Error(
                "Your session has expired. Please log in again."
            );
        }


        if (response.status === 404) {

            throw new Error(
                "Conversation not found."
            );
        }


        if (!response.ok) {

            throw new Error(
                `Unable to open conversation. Server returned ${response.status}.`
            );
        }


        const data =
            await response.json();


        /*
         * Build a conversation object that supports
         * both Property and Stay conversations.
         */

        const conversation = {

            conversationId:
                data.conversationId ??
                data.ConversationId ??
                conversationId,


            propertyId:
                data.propertyId ??
                data.PropertyId ??
                null,


            stayId:
                data.stayId ??
                data.StayId ??
                null,


            property:
                data.property ??
                data.Property ??
                null,


            stay:
                data.stay ??
                data.Stay ??
                null,


            otherParticipant:
                data.otherParticipant ??
                data.OtherParticipant ??
                null,


            messages:
                data.messages ||
                data.Messages ||
                []

        };


        /*
         * Open without requesting the messages twice
         * if the API already supplied them.
         */

        await openConversation(
            conversation
        );

    }

    catch (error) {

        console.error(
            "Open conversation by ID error:",
            error
        );


        showMessageError(
            error.message ||
            "Unable to open conversation."
        );
    }

}


/* ============================================================
   START PROPERTY CONVERSATION
   ============================================================ */

async function startPropertyConversation(propertyId) {

    const token =
        getAuthToken();


    if (!token) {

        window.location.href =
            "login.html";

        return;
    }


    if (
        !Number.isInteger(Number(propertyId)) ||
        Number(propertyId) <= 0
    ) {

        console.error(
            "Invalid property ID."
        );

        return;
    }


    try {

        const response =
            await fetch(
                `${HAVENGH_API}/Messages/conversations/property/${Number(propertyId)}`,
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Accept":
                            "application/json"
                    }
                }
            );


        if (response.status === 401) {

            clearAuthentication();

            window.location.href =
                "login.html";

            return;
        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to start property conversation."
            );
        }


        const conversationId =
            data.conversationId ??
            data.ConversationId;


        if (!conversationId) {

            throw new Error(
                "The server did not return a conversation ID."
            );
        }


        window.location.href =
            `tenant-messages.html?conversationId=${encodeURIComponent(conversationId)}`;

    }

    catch (error) {

        console.error(
            "Start property conversation error:",
            error
        );


        alert(
            error.message ||
            "Unable to start conversation."
        );
    }

}


/* ============================================================
   START STAY CONVERSATION
   ============================================================ */

async function startStayConversation(stayId) {

    const token =
        getAuthToken();


    if (!token) {

        /*
         * Remember the Stay so the login page can return
         * to the Stay flow if you later implement that.
         */

        try {
            sessionStorage.setItem(
                "havenGH_pending_stay_chat",
                String(stayId)
            );
        }
        catch {
            // Ignore storage errors.
        }


        window.location.href =
            "login.html";

        return;
    }


    if (
        !Number.isInteger(Number(stayId)) ||
        Number(stayId) <= 0
    ) {

        console.error(
            "Invalid Stay ID."
        );

        return;
    }


    try {

        /*
         * IMPORTANT:
         *
         * This is a NEW Stay-specific endpoint.
         * It does not replace or modify the existing
         * property messaging endpoint.
         */

        const response =
            await fetch(
                `${HAVENGH_API}/Messages/conversations/stay/${Number(stayId)}`,
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Accept":
                            "application/json"
                    }
                }
            );


        if (response.status === 401) {

            clearAuthentication();

            window.location.href =
                "login.html";

            return;
        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to start Stay conversation."
            );
        }


        const conversationId =
            data.conversationId ??
            data.ConversationId;


        if (!conversationId) {

            throw new Error(
                "The server did not return a conversation ID."
            );
        }


        /*
         * Open the same existing tenant messaging page.
         */

        window.location.href =
            `tenant-messages.html?conversationId=${encodeURIComponent(conversationId)}`;

    }

    catch (error) {

        console.error(
            "Start Stay conversation error:",
            error
        );


        alert(
            error.message ||
            "Unable to start Stay conversation."
        );
    }

}


/* ============================================================
   RENDER MESSAGES
   ============================================================ */

function renderConversationMessages(messages) {

    const container =
        document.getElementById(
            "conversation-messages"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        !Array.isArray(messages) ||
        messages.length === 0
    ) {

        container.innerHTML = `
            <div class="conversation-empty">
                <p>No messages yet.</p>
                <span>Start the conversation below.</span>
            </div>
        `;

        return;
    }


    messages.forEach(message => {

        const messageElement =
            document.createElement("div");


        const isMine =
            message.isMine ??
            message.IsMine ??
            false;


        const messageBody =
            message.messageBody ??
            message.MessageBody ??
            "";


        const createdAt =
            message.createdAt ??
            message.CreatedAt;


        messageElement.className =
            isMine
                ? "chat-message message-mine"
                : "chat-message message-theirs";


        messageElement.innerHTML = `

            <div class="chat-message-body">
                ${escapeHtml(messageBody)}
            </div>

            <span class="chat-message-time">
                ${formatMessageTime(createdAt)}
            </span>

        `;


        container.appendChild(
            messageElement
        );

    });


    container.scrollTop =
        container.scrollHeight;

}


/* ============================================================
   SEND MESSAGE
   ============================================================ */

function setupSendMessage() {

    const form =
        document.getElementById(
            "message-send-form"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (!currentConversationId) {

                alert(
                    "Please select a conversation first."
                );

                return;
            }


            const input =
                document.getElementById(
                    "message-input"
                );


            const button =
                document.getElementById(
                    "send-message-button"
                );


            if (!input) {
                return;
            }


            const messageBody =
                input.value.trim();


            if (!messageBody) {
                return;
            }


            if (messageBody.length > 2000) {

                alert(
                    "Message cannot exceed 2000 characters."
                );

                return;
            }


            const token =
                getAuthToken();


            if (!token) {

                alert(
                    "Your session has expired. Please log in again."
                );

                return;
            }


            if (button) {

                button.disabled = true;
                button.textContent = "Sending...";
            }


            try {

                const response =
                    await fetch(
                        `${HAVENGH_API}/Messages/conversations/${currentConversationId}/messages`,
                        {
                            method: "POST",

                            headers: {
                                "Authorization":
                                    `Bearer ${token}`,

                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                messageBody:
                                    messageBody
                            })
                        }
                    );


                if (response.status === 401) {

                    clearAuthentication();

                    throw new Error(
                        "Your session has expired. Please log in again."
                    );
                }


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        data.Message ||
                        "Unable to send message."
                    );
                }


                input.value = "";


                const container =
                    document.getElementById(
                        "conversation-messages"
                    );


                if (!container) {
                    return;
                }


                /*
                 * Remove "No messages yet" state if present.
                 */

                const emptyMessage =
                    container.querySelector(
                        ".conversation-empty"
                    );


                if (emptyMessage) {
                    emptyMessage.remove();
                }


                const messageElement =
                    document.createElement("div");


                messageElement.className =
                    "chat-message message-mine";


                const returnedBody =
                    data.messageBody ??
                    data.MessageBody ??
                    messageBody;


                const returnedCreatedAt =
                    data.createdAt ??
                    data.CreatedAt;


                messageElement.innerHTML = `

                    <div class="chat-message-body">
                        ${escapeHtml(returnedBody)}
                    </div>

                    <span class="chat-message-time">
                        ${formatMessageTime(
                            returnedCreatedAt
                        )}
                    </span>

                `;


                container.appendChild(
                    messageElement
                );


                container.scrollTop =
                    container.scrollHeight;


                console.log(
                    "HavenGH message sent successfully."
                );

            }

            catch (error) {

                console.error(
                    "Send message error:",
                    error
                );


                alert(
                    error.message ||
                    "Unable to send message."
                );

            }

            finally {

                if (button) {

                    button.disabled = false;
                    button.textContent = "Send";
                }
            }

        }
    );

}


/* ============================================================
   BACK TO CONVERSATIONS
   ============================================================ */

function setupBackButton() {

    const button =
        document.getElementById(
            "back-to-conversations"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            currentConversationId =
                null;


            const view =
                document.getElementById(
                    "conversation-view"
                );


            const list =
                document.getElementById(
                    "conversations-list"
                );


            const loading =
                document.getElementById(
                    "messages-loading"
                );


            if (view) {
                view.style.display = "none";
            }


            if (list) {
                list.style.display = "block";
            }


            if (loading) {
                loading.style.display = "none";
            }


            /*
             * Remove conversationId from URL.
             */

            try {

                const url =
                    new URL(
                        window.location.href
                    );


                url.searchParams.delete(
                    "conversationId"
                );


                window.history.replaceState(
                    {},
                    document.title,
                    url.toString()
                );

            }
            catch {
                // Ignore URL errors.
            }


            loadConversations();

        }
    );

}


/* ============================================================
   SEARCH CONVERSATIONS
   ============================================================ */

function setupMessageSearch() {

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


            document
                .querySelectorAll(
                    ".conversation-card"
                )
                .forEach(card => {

                    const text =
                        card.textContent
                            .toLowerCase();


                    card.style.display =
                        text.includes(query)
                            ? ""
                            : "none";

                });

        }
    );

}


/* ============================================================
   RETRY
   ============================================================ */

function setupMessageRetry() {

    const retry =
        document.getElementById(
            "messages-retry"
        );


    if (!retry) {
        return;
    }


    retry.addEventListener(
        "click",
        loadConversations
    );

}


/* ============================================================
   ERROR DISPLAY
   ============================================================ */

function showMessageError(message) {

    const loading =
        document.getElementById(
            "messages-loading"
        );


    const error =
        document.getElementById(
            "messages-error"
        );


    const errorText =
        document.getElementById(
            "messages-error-text"
        );


    if (loading) {
        loading.style.display = "none";
    }


    if (error) {
        error.style.display = "block";
    }


    if (errorText) {

        errorText.textContent =
            message ||
            "Something went wrong while loading messages.";
    }

}


/* ============================================================
   DATE HELPERS
   ============================================================ */

function formatMessageDate(dateString) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(dateString);


    if (Number.isNaN(date.getTime())) {
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


function formatMessageTime(dateString) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(dateString);


    if (Number.isNaN(date.getTime())) {
        return "";
    }


    return date.toLocaleTimeString(
        "en-GH",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


       /* ============================================================
   PARTICIPANT INITIALS
   ============================================================ */

function getInitials(name) {

    if (!name) {
        return "HG";
    }


    const cleanName =
        String(name)
            .trim()
            .replace(/\s+/g, " ");


    const parts =
        cleanName.split(" ");


    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        parts[0].charAt(0) +
        parts[parts.length - 1].charAt(0)
    ).toUpperCase();

}


/* ============================================================
   PARTICIPANT ROLE
   ============================================================ */

function formatParticipantRole(role) {

    if (!role) {
        return "";
    }


    const value =
        String(role)
            .trim()
            .toLowerCase();


    switch (value) {

        case "landlord":
            return "Landlord";

        case "agent":
            return "Property Agent";

        case "tenant":
            return "Tenant";

        case "admin":
            return "HavenGH Admin";

        default:
            return String(role);

    }

}

/* ============================================================
   HTML SAFETY
   ============================================================ */

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value == null
            ? ""
            : String(value);

    return div.innerHTML;
}
/* ============================================================
   PUBLIC FUNCTIONS
   ============================================================

   These functions are intentionally available globally so
   Stay Details / Property Details can call them if needed.

   Examples:

   startPropertyConversation(18);

   startStayConversation(5);

   ============================================================ */