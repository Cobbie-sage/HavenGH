"use strict";

/* ============================================================
HavenGH - Property Details
Direct ASP.NET Core API connection
============================================================ */

const API_BASE_URL = "http://localhost:5073";

/* ============================================================
DOM
============================================================ */

const loading =
document.getElementById("loading");

const errorBox =
document.getElementById("error-box");

const errorMessage =
document.getElementById("error-message");

const propertyPage =
document.getElementById("property-page");

const viewContactButton =
document.getElementById("view-contact-button");

const agentContactBox =
document.getElementById("agent-contact-box");

const agentPhone =
document.getElementById("agent-phone");

const agentWhatsapp =
document.getElementById("agent-whatsapp");

const whatsappButton =
document.getElementById("whatsapp-button");

const chatAgentButton =
document.getElementById("chat-agent-button");
const requestPropertyButton =
    document.getElementById("request-property-button");

const savePropertyButton =
    document.getElementById("save-property-button");

function setupPropertyActions(property) {
    const propertyId =
        property.propertyId ??
        property.PropertyId;

    if (!propertyId) {
        return;
    }

    // ============================================================
    // REQUEST PROPERTY
    // ============================================================

    if (requestPropertyButton) {
        requestPropertyButton.addEventListener("click", () => {
            window.location.href =
                `submit-request.html?id=${encodeURIComponent(propertyId)}`;
        });
    }

    // ============================================================
    // SAVE PROPERTY
    // ============================================================

    if (savePropertyButton) {
        updateSaveButton(propertyId);

        savePropertyButton.addEventListener("click", () => {
            toggleSavedProperty(propertyId);
        });
    }
}
function getSavedProperties() {
    try {
        return JSON.parse(
            localStorage.getItem("havenGH_saved") || "[]"
        );
    } catch {
        return [];
    }
}

function setSavedProperties(properties) {
    localStorage.setItem(
        "havenGH_saved",
        JSON.stringify(properties)
    );
}

function isPropertySaved(propertyId) {
    const saved = getSavedProperties();

    return saved.some(
        id => Number(id) === Number(propertyId)
    );
}

function updateSaveButton(propertyId) {
    if (!savePropertyButton) {
        return;
    }

    const saved = isPropertySaved(propertyId);

    if (saved) {
        savePropertyButton.classList.add("saved");

        savePropertyButton.innerHTML = `
            <span aria-hidden="true">♥</span>
        `;

        savePropertyButton.setAttribute(
            "aria-label",
            "Remove saved property"
        );

        savePropertyButton.setAttribute(
            "title",
            "Remove saved property"
        );

    } else {
        savePropertyButton.classList.remove("saved");

        savePropertyButton.innerHTML = `
            <span aria-hidden="true">♡</span>
        `;

        savePropertyButton.setAttribute(
            "aria-label",
            "Save property"
        );

        savePropertyButton.setAttribute(
            "title",
            "Save property"
        );
    }
}

function toggleSavedProperty(propertyId) {
    let saved = getSavedProperties();

    const existingIndex = saved.findIndex(
        id => Number(id) === Number(propertyId)
    );

    if (existingIndex >= 0) {
        saved.splice(existingIndex, 1);
    } else {
        saved.push(propertyId);
    }

    setSavedProperties(saved);
    updateSaveButton(propertyId);
}
/* ============================================================
GET TOKEN
============================================================ */

function getToken() {


return (
    sessionStorage.getItem("havenGH_token") ||
    localStorage.getItem("havenGH_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    ""
);


}

/* ============================================================
AUTHENTICATION
============================================================ */

async function getAuthenticatedUser() {


const token =
    getToken();

if (!token) {
    return null;
}

try {

    const response =
        await fetch(
            `${API_BASE_URL}/api/Auth/me`,
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


    if (
        response.status === 401 ||
        response.status === 403
    ) {

        return null;

    }


    if (!response.ok) {

        return null;

    }


    return await response.json();

}
catch (error) {

    console.error(
        "HavenGH authentication check failed:",
        error
    );

    return null;

}


}

/* ============================================================
GET PROPERTY ID
============================================================ */

function getPropertyId() {


const params =
    new URLSearchParams(
        window.location.search
    );

const id =
    params.get("id");

if (!id) {
    return null;
}


const propertyId =
    Number(id);


if (
    !Number.isInteger(propertyId) ||
    propertyId <= 0
) {

    return null;

}


return propertyId;


}

/* ============================================================
INITIALIZE
============================================================ */

document.addEventListener(
"DOMContentLoaded",
loadProperty
);

/* ============================================================
LOAD PROPERTY
============================================================ */

async function loadProperty() {


const propertyId =
    getPropertyId();


if (!propertyId) {

    showError(
        "No valid property ID was provided."
    );

    return;

}


try {

    /*
     * Public property details can be viewed
     * anonymously.
     *
     * If a token exists, send it.
     */

    const token =
        getToken();


    const headers = {
        "Accept":
            "application/json"
    };


    if (token) {

        headers["Authorization"] =
            `Bearer ${token}`;

    }


    const response =
        await fetch(
            `${API_BASE_URL}/api/Properties/${propertyId}`,
            {
                method: "GET",
                headers,
                cache: "no-store"
            }
        );


    if (response.status === 401) {

        throw new Error(
            "Your session has expired or your login token is invalid."
        );

    }


    if (response.status === 403) {

        throw new Error(
            "You do not have permission to view this property."
        );

    }


    if (response.status === 404) {

        throw new Error(
            "Property not found or you do not have permission to view it."
        );

    }


    if (!response.ok) {

        let message =
            `Unable to load property (${response.status}).`;


        try {

            const data =
                await response.json();


            if (data?.message) {

                message =
                    data.message;

            }

        }
        catch {

            // API did not return JSON.

        }


        throw new Error(message);

    }


    const property =
        await response.json();


    console.log(
        "HavenGH property details:",
        property
    );


    await renderProperty(property);

}
catch (error) {

    console.error(
        "HavenGH Property Details error:",
        error
    );


    showError(
        error.message ||
        "Unable to load property details."
    );

}


}

/* ============================================================
LOCK PRIVATE CONTACT ACTIONS
============================================================ */

function lockPrivateContactActions() {


if (whatsappButton) {

    whatsappButton.classList.add("hidden");

    whatsappButton.style.display =
        "none";

    whatsappButton.removeAttribute("href");

}


if (chatAgentButton) {

    chatAgentButton.classList.add("hidden");

    chatAgentButton.style.display =
        "none";

    chatAgentButton.onclick =
        null;

}


if (viewContactButton) {

    viewContactButton.classList.add("hidden");

    viewContactButton.style.display =
        "none";

    viewContactButton.disabled =
        true;

    viewContactButton.onclick =
        null;

}


if (agentContactBox) {

    agentContactBox.classList.add("hidden");

    agentContactBox.style.display =
        "none";

}


if (agentPhone) {

    agentPhone.textContent =
        "";

    agentPhone.removeAttribute("href");

    agentPhone.classList.add("hidden");

}


if (agentWhatsapp) {

    agentWhatsapp.textContent =
        "";

    agentWhatsapp.removeAttribute("href");

    agentWhatsapp.classList.add("hidden");

}


}

/* ============================================================
UNLOCK PRIVATE CONTACT ACTIONS
============================================================ */

function unlockPrivateContactActions() {


if (viewContactButton) {

    viewContactButton.classList.remove("hidden");

    viewContactButton.style.display =
        "";

    viewContactButton.disabled =
        false;

}


}

/* ============================================================
RENDER PROPERTY
============================================================ */
/*
 * ============================================================
 * RENDER PROPERTY
 * ============================================================
 */

async function renderProperty(property) {

    /*
     * Support ASP.NET Core JSON naming
     * regardless of whether camelCase or
     * PascalCase is returned.
     */

    const propertyId =
        property.propertyId ??
        property.PropertyId;


    /*
     * REQUEST PROPERTY BUTTON
     *
     * Opens the tenant-facing request page
     * for this specific property.
     */

    const requestButton =
        document.getElementById("request-property-button");

    if (requestButton && propertyId) {

        requestButton.onclick = () => {

            window.location.href =
                `request.html?id=${encodeURIComponent(propertyId)}`;

        };
    }


    const title =
        property.title ??
        property.Title ??
        "Untitled Property";


    const description =
        property.description ??
        property.Description ??
        "No description provided.";


    const propertyType =
        property.propertyType ??
        property.PropertyType ??
        "";


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


    const status =
        String(
            property.status ??
            property.Status ??
            "draft"
        )
        .trim()
        .toLowerCase();


    const bedrooms =
        property.bedrooms ??
        property.Bedrooms;


    const bathrooms =
        property.bathrooms ??
        property.Bathrooms;


    const viewCount =
        property.viewCount ??
        property.ViewCount ??
        0;


    const location =
        property.location ??
        property.Location ??
        null;


const owner =
    property.owner ??
    property.Owner ??
    null;

setupPropertyActions(property);
/* ========================================================
   BASIC INFO
   ======================================================== */

setText(
    "property-id",
    propertyId ?? "—"
);


setText(
    "property-title",
    title
);


setText(
    "property-description",
    description
);


setText(
    "property-type",
    formatPropertyType(propertyType)
);


setText(
    "property-status",
    formatStatus(status)
);


/* ========================================================
   PRICE
   ======================================================== */

setText(
    "price",
    formatPrice(price)
);


setText(
    "price-period",
    pricePeriod
        ? `/ ${capitalize(pricePeriod)}`
        : ""
);


/* ========================================================
   SPECS
   ======================================================== */

setText(
    "bedrooms",
    bedrooms ?? "—"
);


setText(
    "bathrooms",
    bathrooms ?? "—"
);


setText(
    "views",
    viewCount
);


/* ========================================================
   LOCATION
   ======================================================== */

const locationText =
    formatLocation(location);


setText(
    "location",
    locationText ||
    "Location not provided"
);


/*
 * Keep the full location available for
 * any future map functionality.
 */

if (location) {

    console.log(
        "HavenGH property location:",
        {
            propertyId:
                location.propertyId ??
                location.PropertyId,

            addressLine:
                location.addressLine ??
                location.AddressLine,

            area:
                location.area ??
                location.Area,

            city:
                location.city ??
                location.City,

            region:
                location.region ??
                location.Region,

            country:
                location.country ??
                location.Country,

            latitude:
                location.latitude ??
                location.Latitude,

            longitude:
                location.longitude ??
                location.Longitude
        }
    );

}


/* ========================================================
   OWNER
   ======================================================== */

/*
 * Private contact information is locked first.
 *
 * This means anonymous visitors never
 * see private owner contact controls.
 */

lockPrivateContactActions();


if (owner) {

    /*
     * Public visitors see only non-private owner information.
     */
    setText(
        "owner-email",
        "Property Owner"
    );

    setText(
        "owner-role",
        owner.role ??
        owner.Role ??
        "Property Owner"
    );


    /*
     * Check authentication.
     */
    const currentUser =
        await getAuthenticatedUser();


    /*
     * ============================================================
     * ANONYMOUS / INVALID SESSION
     * ============================================================
     *
     * Private controls remain locked.
     */
    if (!currentUser) {

        lockPrivateContactActions();

    }
    else {

        /*
         * ========================================================
         * AUTHENTICATED USER
         * ========================================================
         */

        const email =
            owner.email ??
            owner.Email ??
            "";

        const phone =
            owner.phone ??
            owner.Phone ??
            "";

        const whatsappUrl =
            owner.whatsAppUrl ??
            owner.WhatsAppUrl ??
            "";


        /*
         * Private email is available only to authenticated users.
         */
        setText(
            "owner-email",
            email ||
            "Property Owner"
        );


        unlockPrivateContactActions();


        /*
         * WhatsApp shortcut.
         *
         * Only use the URL supplied by the API.
         */
        if (
            whatsappButton &&
            whatsappUrl
        ) {

            whatsappButton.href =
                whatsappUrl;

            whatsappButton.target =
                "_blank";

            whatsappButton.rel =
                "noopener noreferrer";

            whatsappButton.classList.remove(
                "hidden"
            );

            whatsappButton.style.display =
                "";

        }
        else if (whatsappButton) {

            whatsappButton.classList.add(
                "hidden"
            );

            whatsappButton.style.display =
                "none";

            whatsappButton.removeAttribute(
                "href"
            );

        }


        /*
         * Configure authenticated contact controls.
         */
        setupAgentContact(
            {
                ...owner,
                phone,
                whatsAppUrl:
                    whatsappUrl
            }
        );

    }

}


/* ========================================================
   USER PERMISSIONS
   ======================================================== */

/*
 * IMPORTANT:
 *
 * This is inside renderProperty(),
 * where property, propertyId and owner
 * are available.
 */

await setupUserActions(
    property,
    propertyId,
    owner
);


/* ========================================================
   DATE
   ======================================================== */

const createdAt =
    property.createdAt ??
    property.CreatedAt;


if (createdAt) {

    setText(
        "created-at",
        formatDate(createdAt)
    );

}


/* ========================================================
   IMAGES
   ======================================================== */

renderImages(property);


/* ========================================================
   SHOW PAGE
   ======================================================== */

loading.classList.add(
    "hidden"
);


propertyPage.classList.remove(
    "hidden"
);


}

/* ============================================================
VIEW OWNER CONTACT
============================================================ */

/* ============================================================
VIEW OWNER CONTACT
============================================================ */

function setupAgentContact(owner) {

    if (!viewContactButton) {
        return;
    }

    /*
     * Always begin locked.
     */
    if (agentContactBox) {

        agentContactBox.classList.add("hidden");

        agentContactBox.style.display = "none";

    }

    if (agentPhone) {

        agentPhone.textContent = "";

        agentPhone.removeAttribute("href");

        agentPhone.classList.add("hidden");

    }

    if (agentWhatsapp) {

        agentWhatsapp.textContent = "";

        agentWhatsapp.removeAttribute("href");

        agentWhatsapp.classList.add("hidden");

    }


    /*
     * Read ONLY the contact information
     * supplied by the authenticated API response.
     */
    const phone =
        owner?.phone ??
        owner?.Phone ??
        "";

    const whatsappUrl =
        owner?.whatsAppUrl ??
        owner?.WhatsAppUrl ??
        "";


    /*
     * No private contact information.
     */
    if (!phone && !whatsappUrl) {

        viewContactButton.disabled = true;

        viewContactButton.textContent =
            "Contact Not Available";

        return;

    }


    viewContactButton.disabled = false;

    viewContactButton.textContent =
        "View Contact";


    /*
     * ============================================================
     * VIEW CONTACT CLICK
     * ============================================================
     *
     * Authentication is checked AGAIN immediately before
     * revealing any private information.
     */
    viewContactButton.onclick =
        async () => {

            const currentUser =
                await getAuthenticatedUser();


            /*
             * FAIL CLOSED
             *
             * If the user is not authenticated,
             * absolutely nothing private is revealed.
             */
            if (!currentUser) {

                lockPrivateContactActions();

                window.location.replace(
                    "login.html"
                );

                return;

            }


            if (!agentContactBox) {
                return;
            }


            const isHidden =
                agentContactBox.classList.contains(
                    "hidden"
                );


            if (isHidden) {

                /*
                 * =================================================
                 * PHONE
                 * =================================================
                 */

                if (agentPhone) {

                    if (phone) {

                        agentPhone.textContent =
                            phone;

                        agentPhone.href =
                            `tel:${phone}`;

                        agentPhone.classList.remove(
                            "hidden"
                        );

                    }
                    else {

                        agentPhone.textContent =
                            "Phone number not available";

                        agentPhone.removeAttribute(
                            "href"
                        );

                        agentPhone.classList.remove(
                            "hidden"
                        );

                    }

                }


                /*
                 * =================================================
                 * WHATSAPP
                 * =================================================
                 *
                 * IMPORTANT:
                 *
                 * Never construct a WhatsApp URL from the phone
                 * number in the frontend.
                 *
                 * Only use the WhatsAppUrl explicitly returned
                 * by the authenticated API response.
                 */
                if (agentWhatsapp) {

                    if (whatsappUrl) {

                        agentWhatsapp.href =
                            whatsappUrl;

                        agentWhatsapp.target =
                            "_blank";

                        agentWhatsapp.rel =
                            "noopener noreferrer";

                        agentWhatsapp.classList.remove(
                            "hidden"
                        );

                    }
                    else {

                        agentWhatsapp.textContent =
                            "";

                        agentWhatsapp.removeAttribute(
                            "href"
                        );

                        agentWhatsapp.classList.add(
                            "hidden"
                        );

                    }

                }


                /*
                 * Show private contact box.
                 */
                agentContactBox.classList.remove(
                    "hidden"
                );

                agentContactBox.style.display =
                    "";


                viewContactButton.textContent =
                    "Hide Contact";

            }
            else {

                /*
                 * Hide private information again.
                 */
                agentContactBox.classList.add(
                    "hidden"
                );

                agentContactBox.style.display =
                    "none";


                /*
                 * Remove private data from the DOM
                 * when the contact box is closed.
                 */
                if (agentPhone) {

                    agentPhone.textContent =
                        "";

                    agentPhone.removeAttribute(
                        "href"
                    );

                    agentPhone.classList.add(
                        "hidden"
                    );

                }

                if (agentWhatsapp) {

                    agentWhatsapp.textContent =
                        "";

                    agentWhatsapp.removeAttribute(
                        "href"
                    );

                    agentWhatsapp.classList.add(
                        "hidden"
                    );

                }


                viewContactButton.textContent =
                    "View Contact";

            }

        };

}

/* ============================================================
USER PERMISSIONS
============================================================ */

async function setupUserActions(
property,
propertyId,
owner
) {


const editButton =
    document.getElementById(
        "edit-button"
    );


const chatButton =
    document.getElementById(
        "chat-agent-button"
    );


/*
 * Always start hidden.
 */

if (editButton) {

    editButton.classList.add(
        "hidden"
    );

    editButton.style.display =
        "none";

    editButton.onclick =
        null;

}


if (chatButton) {

    chatButton.classList.add(
        "hidden"
    );

    chatButton.style.display =
        "none";

    chatButton.onclick =
        null;

}


const token =
    getToken();


/*
 * Anonymous visitor:
 *
 * Can view the property.
 *
 * Cannot edit.
 *
 * Cannot chat.
 */

if (!token) {

    return;

}


try {

    const response =
        await fetch(
            `${API_BASE_URL}/api/Auth/me`,
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


    if (!response.ok) {

        return;

    }


    const currentUser =
        await response.json();


    const currentUserId =
        currentUser.userId ??
        currentUser.UserId;


    const currentUserRole =
        String(
            currentUser.role ??
            currentUser.Role ??
            ""
        )
        .trim()
        .toLowerCase();


    /*
     * Property owner ID.
     */

    const ownerUserId =
        property.ownerUserId ??
        property.OwnerUserId ??
        owner?.userId ??
        owner?.UserId;


    const isAdmin =
        currentUserRole === "admin";


    const isTenant =
        currentUserRole === "tenant";


    const isLandlord =
        currentUserRole === "landlord";


    const isAgent =
        currentUserRole === "agent";


    const ownsProperty =
        currentUserId != null &&
        ownerUserId != null &&
        Number(currentUserId) ===
        Number(ownerUserId);


    /*
     * Edit permissions:
     *
     * Admin
     *
     * OR
     *
     * Landlord/Agent who owns property.
     *
     * Tenant can NEVER edit.
     */

    const canEdit =
        isAdmin ||
        (
            !isTenant &&
            ownsProperty &&
            (
                isLandlord ||
                isAgent
            )
        );


    console.log(
        "HAVENGH PERMISSION CHECK",
        {
            currentUserId,
            currentUserRole,
            ownerUserId,
            isAdmin,
            isTenant,
            isLandlord,
            isAgent,
            ownsProperty,
            canEdit
        }
    );


    /* ====================================================
       EDIT PROPERTY
       ==================================================== */

    if (
        canEdit &&
        editButton
    ) {

        editButton.href =
            `edit-property.html?id=${encodeURIComponent(
                propertyId
            )}`;


        editButton.classList.remove(
            "hidden"
        );


        editButton.style.display =
            "";

    }


    /* ====================================================
       CHAT AGENT
       ==================================================== */

    /*
     * Only a logged-in tenant can start
     * a property conversation.
     *
     * The property owner cannot chat with
     * themselves through this button.
     */

    if (
        isTenant &&
        !ownsProperty &&
        chatButton
    ) {

        chatButton.classList.remove(
            "hidden"
        );


        chatButton.style.display =
            "";


        chatButton.onclick =
            () => startPropertyConversation(
                propertyId,
                chatButton
            );

    }

}
catch (error) {

    console.error(
        "HavenGH user permission check failed:",
        error
    );


    /*
     * Fail closed.
     *
     * If authentication cannot be verified,
     * private actions remain hidden.
     */

    if (editButton) {

        editButton.classList.add(
            "hidden"
        );

        editButton.style.display =
            "none";

    }


    if (chatButton) {

        chatButton.classList.add(
            "hidden"
        );

        chatButton.style.display =
            "none";

    }

}


}

/* ============================================================
START PROPERTY CONVERSATION
============================================================ */

async function startPropertyConversation(
propertyId,
chatButton
) {


const token =
    getToken();


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
 * Prevent multiple clicks.
 */

if (chatButton) {

    chatButton.dataset.originalText =
        chatButton.textContent;


    chatButton.textContent =
        "Opening Chat...";


    chatButton.style.pointerEvents =
        "none";


    chatButton.style.opacity =
        "0.7";

}


try {

    const response =
        await fetch(
            `${API_BASE_URL}/api/Messages/conversations/property/${propertyId}`,
            {
                method: "POST",

                headers: {
                    "Accept":
                        "application/json",

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${token}`
                },

                cache: "no-store"
            }
        );


    if (response.status === 401) {

        localStorage.removeItem(
            "havenGH_token"
        );

        sessionStorage.removeItem(
            "havenGH_token"
        );

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "accessToken"
        );


        window.location.href =
            "login.html";

        return;

    }


    if (response.status === 403) {

        throw new Error(
            "You do not have permission to start this conversation."
        );

    }


    if (response.status === 404) {

        throw new Error(
            "This property or its owner could not be found."
        );

    }


    if (!response.ok) {

        let message =
            `Unable to start chat (${response.status}).`;


        try {

            const data =
                await response.json();


            if (data?.message) {

                message =
                    data.message;

            }

        }
        catch {

            // API did not return JSON.

        }


        throw new Error(message);

    }


    const conversation =
        await response.json();


    console.log(
        "HavenGH property conversation:",
        conversation
    );


    const conversationId =
        conversation.conversationId ??
        conversation.ConversationId;


    if (!conversationId) {

        throw new Error(
            "The conversation was created but no conversation ID was returned."
        );

    }


    /*
     * Current HavenGH tenant messages page.
     */

    window.location.href =
        `tenant-messages.html?conversationId=${encodeURIComponent(
            conversationId
        )}`;

}
catch (error) {

    console.error(
        "HavenGH start conversation error:",
        error
    );


    alert(
        error.message ||
        "Unable to start the conversation."
    );


    if (chatButton) {

        chatButton.textContent =
            chatButton.dataset.originalText ||
            "Chat Agent";


        chatButton.style.pointerEvents =
            "";


        chatButton.style.opacity =
            "";

    }

}


}

/* ============================================================
IMAGES
============================================================ */

function renderImages(property) {

    const imageContainer =
        document.getElementById("main-image");

    const thumbnailContainer =
        document.getElementById("gallery-thumbnails");

    const previousButton =
        document.getElementById("gallery-prev");

    const nextButton =
        document.getElementById("gallery-next");

    const counter =
        document.getElementById("gallery-counter");


    if (!imageContainer) {
        return;
    }


    const images =
        property.images ??
        property.Images ??
        [];


    if (
        !Array.isArray(images) ||
        images.length === 0
    ) {

        imageContainer.innerHTML =
            `<span class="gallery-empty">HavenGH</span>`;

        if (thumbnailContainer) {
            thumbnailContainer.innerHTML = "";
        }

        if (previousButton) {
            previousButton.style.display = "none";
        }

        if (nextButton) {
            nextButton.style.display = "none";
        }

        if (counter) {
            counter.textContent = "0 / 0";
        }

        return;
    }


    /*
     * Put the primary image first.
     */

    const sortedImages =
        [
            ...images
        ].sort(
            (a, b) => {

                const aPrimary =
                    Boolean(
                        a.isPrimary ??
                        a.IsPrimary
                    );

                const bPrimary =
                    Boolean(
                        b.isPrimary ??
                        b.IsPrimary
                    );

                if (
                    aPrimary &&
                    !bPrimary
                ) {
                    return -1;
                }

                if (
                    !aPrimary &&
                    bPrimary
                ) {
                    return 1;
                }

                const aOrder =
                    Number(
                        a.sortOrder ??
                        a.SortOrder ??
                        0
                    );

                const bOrder =
                    Number(
                        b.sortOrder ??
                        b.SortOrder ??
                        0
                    );

                return aOrder - bOrder;
            }
        );


    let currentIndex = 0;


    const propertyTitle =
        property.title ??
        property.Title ??
        "HavenGH Property";


    /*
     * Convert API image path
     * into a complete browser URL.
     */

    function getImageUrl(image) {

        const rawImageUrl =
            image.imageUrl ??
            image.ImageUrl ??
            "";


        if (!rawImageUrl) {
            return "";
        }


        return (
            rawImageUrl.startsWith("http://") ||
            rawImageUrl.startsWith("https://")
        )
            ? rawImageUrl
            : `${API_BASE_URL}${rawImageUrl}`;
    }


    /*
     * Display selected image.
     */

    function showImage(index) {

        if (
            index < 0 ||
            index >= sortedImages.length
        ) {
            return;
        }


        currentIndex =
            index;


        const image =
            sortedImages[currentIndex];


        const imageUrl =
            getImageUrl(image);


        if (!imageUrl) {

            imageContainer.innerHTML =
                `<span class="gallery-empty">HavenGH</span>`;

            return;
        }


        const imageElement =
            document.createElement("img");


        imageElement.src =
            imageUrl;


        imageElement.alt =
            `${propertyTitle} - Image ${currentIndex + 1}`;


        imageElement.loading =
            currentIndex === 0
                ? "eager"
                : "lazy";


        imageElement.onerror =
            () => {

                console.error(
                    "HavenGH property image failed to load:",
                    imageUrl
                );

                imageContainer.innerHTML =
                    `<span class="gallery-empty">
                        Image unavailable
                    </span>`;
            };


        imageContainer.innerHTML =
            "";


        imageContainer.appendChild(
            imageElement
        );


        /*
         * Counter
         */

        if (counter) {

            counter.textContent =
                `${currentIndex + 1} / ${sortedImages.length}`;

        }


        /*
         * Active thumbnail
         */

        if (thumbnailContainer) {

            const thumbnails =
                thumbnailContainer.querySelectorAll(
                    ".gallery-thumbnail"
                );


            thumbnails.forEach(
                (thumbnail, thumbnailIndex) => {

                    thumbnail.classList.toggle(
                        "active",
                        thumbnailIndex === currentIndex
                    );

                }
            );

        }


        /*
         * Arrow visibility
         */

        if (previousButton) {

            previousButton.style.display =
                sortedImages.length > 1
                    ? ""
                    : "none";

        }


        if (nextButton) {

            nextButton.style.display =
                sortedImages.length > 1
                    ? ""
                    : "none";

        }

    }


    /*
     * Build thumbnails.
     */

    if (thumbnailContainer) {

        thumbnailContainer.innerHTML =
            "";


        sortedImages.forEach(
            (image, index) => {

                const imageUrl =
                    getImageUrl(image);


                if (!imageUrl) {
                    return;
                }


                const thumbnail =
                    document.createElement("button");


                thumbnail.type =
                    "button";


                thumbnail.className =
                    "gallery-thumbnail";


                thumbnail.setAttribute(
                    "aria-label",
                    `View image ${index + 1}`
                );


                const thumbnailImage =
                    document.createElement("img");


                thumbnailImage.src =
                    imageUrl;


                thumbnailImage.alt =
                    `${propertyTitle} thumbnail ${index + 1}`;


                thumbnailImage.loading =
                    "lazy";


                thumbnailImage.onerror =
                    () => {

                        thumbnail.style.display =
                            "none";

                    };


                thumbnail.appendChild(
                    thumbnailImage
                );


                thumbnail.addEventListener(
                    "click",
                    () => {

                        showImage(index);

                    }
                );


                thumbnailContainer.appendChild(
                    thumbnail
                );

            }
        );

    }


    /*
     * Previous image.
     */

    if (previousButton) {

        previousButton.onclick =
            () => {

                const previousIndex =
                    currentIndex <= 0
                        ? sortedImages.length - 1
                        : currentIndex - 1;


                showImage(
                    previousIndex
                );

            };

    }


    /*
     * Next image.
     */

    if (nextButton) {

        nextButton.onclick =
            () => {

                const nextIndex =
                    currentIndex >= sortedImages.length - 1
                        ? 0
                        : currentIndex + 1;


                showImage(
                    nextIndex
                );

            };

    }


    /*
     * Keyboard navigation.
     */

    document.addEventListener(
        "keydown",
        event => {

            if (
                sortedImages.length <= 1
            ) {
                return;
            }


            if (
                event.key === "ArrowLeft"
            ) {

                const previousIndex =
                    currentIndex <= 0
                        ? sortedImages.length - 1
                        : currentIndex - 1;


                showImage(
                    previousIndex
                );

            }


            if (
                event.key === "ArrowRight"
            ) {

                const nextIndex =
                    currentIndex >= sortedImages.length - 1
                        ? 0
                        : currentIndex + 1;


                showImage(
                    nextIndex
                );

            }

        }
    );


    /*
     * Show the primary image first.
     */

    showImage(0);

}

/* ============================================================
LOCATION
============================================================ */

function formatLocation(location) {


if (!location) {

    return "";

}


const values = [

    location.addressLine ??
    location.AddressLine,

    location.area ??
    location.Area,

    location.city ??
    location.City,

    location.region ??
    location.Region,

    location.country ??
    location.Country

];


return values
    .filter(
        value =>
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
    )
    .map(
        value =>
            String(value).trim()
    )
    .filter(
        (value, index, array) =>
            array.indexOf(value) === index
    )
    .join(", ");


}

/* ============================================================
PROPERTY TYPE
============================================================ */

function formatPropertyType(type) {


const labels = {

    "single-room":
        "Single Room",

    "single-room-porch":
        "Single Room with Porch",

    "chamber-hall":
        "Chamber & Hall",

    "apartment":
        "Apartment",

    "house":
        "Full House"

};


const normalized =
    String(type)
        .trim()
        .toLowerCase();


return labels[normalized] ||
    capitalize(normalized);


}

/* ============================================================
STATUS
============================================================ */

function formatStatus(status) {


const labels = {

    draft:
        "Draft",

    pending:
        "Pending",

    published:
        "Published",

    rented:
        "Rented",

    archived:
        "Archived"

};


return labels[status] ||
    capitalize(status);


}

/* ============================================================
PRICE
============================================================ */

function formatPrice(price) {


const numericPrice =
    Number(price);


if (
    !Number.isFinite(numericPrice)
) {

    return "GH₵0";

}


return `GH₵${numericPrice.toLocaleString(
    "en-GH",
    {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }
)}`;


}

/* ============================================================
DATE
============================================================ */

function formatDate(value) {


const date =
    new Date(value);


if (
    Number.isNaN(
        date.getTime()
    )
) {

    return "—";

}


return date.toLocaleDateString(
    "en-GH",
    {
        day:
            "numeric",

        month:
            "short",

        year:
            "numeric"
    }
);


}

/* ============================================================
TEXT
============================================================ */

function capitalize(value) {


if (!value) {

    return "";

}


return value.charAt(0).toUpperCase() +
    value.slice(1);


}

function setText(
id,
value
) {


const element =
    document.getElementById(id);


if (element) {

    element.textContent =
        value;

}


}

/* ============================================================
ERROR
============================================================ */

function showError(message) {


if (loading) {

    loading.classList.add(
        "hidden"
    );

}


if (propertyPage) {

    propertyPage.classList.add(
        "hidden"
    );

}


if (errorMessage) {

    errorMessage.textContent =
        message;

}


if (errorBox) {

    errorBox.classList.remove(
        "hidden"
    );

}


}
