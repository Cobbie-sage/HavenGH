
/* ============================================================
   HavenGH - My Properties
   Landlord / Agent Property Management
   Direct ASP.NET Core API connection

   API:
   GET    /api/Properties/my
   POST   /api/Properties/{id}/publish
   POST   /api/Properties/{id}/unpublish
   DELETE /api/Properties/{id}

   Authentication:
   JWT stored as "havenGH_token"

   IMPORTANT:
   Subscription expiration / restoration is controlled by the
   backend SubscriptionAccessService. This page displays the
   current status returned by the API and never bypasses
   subscription rules.
   ============================================================ */

"use strict";


/* ============================================================
   API
   ============================================================ */

const API_BASE_URL =
    "https://havenghapi-production.up.railway.app";

const MY_PROPERTIES_API =
    `${API_BASE_URL}/api/Properties/my`;


    /* ============================================================
   CURRENT USER
   ============================================================ */

const AUTH_ME_API =
    `${API_BASE_URL}/api/Auth/me`;


/* ============================================================
   LOAD CURRENT USER
   ============================================================ */

async function loadCurrentUser() {

    const token =
        getToken();

    if (!token) {
        return;
    }

    const response =
        await fetch(
            AUTH_ME_API,
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

        throw new Error(
            "Your session has expired. Please log in again."
        );

    }


    if (!response.ok) {

        throw new Error(
            "Unable to load your account information."
        );

    }


    const user =
        await response.json();


    renderCurrentUser(
        user
    );

}


/* ============================================================
   RENDER CURRENT USER
   ============================================================ */

function renderCurrentUser(
    user
) {

    if (!user) {
        return;
    }


    /*
       Use the same identity priority as dashboard.js.
    */

    const displayName =
        user.fullName ||
        user.businessName ||
        user.email ||
        "HavenGH User";


    const role =
        user.role ||
        "User";


    const nameElement =
        document.getElementById(
            "dashboard-user-name"
        );


    const roleElement =
        document.getElementById(
            "dashboard-user-role"
        );


    const avatarImage =
        document.getElementById(
            "dashboard-user-avatar-img"
        );


    const avatarFallback =
        document.getElementById(
            "dashboard-user-avatar-fallback"
        );


    /*
       NAME
    */

    if (nameElement) {

        nameElement.textContent =
            displayName;

    }


    /*
       ROLE
    */

    if (roleElement) {

        roleElement.textContent =
            formatUserRole(
                role
            );

    }


    /*
       AVATAR
    */

    const avatarUrl =
        user.avatarUrl ||
        user.AvatarUrl ||
        "";


    if (
        avatarImage &&
        avatarUrl
    ) {

        avatarImage.src =
            normalizeAvatarUrl(
                avatarUrl
            );

        avatarImage.alt =
            `${displayName} profile picture`;

        avatarImage.hidden =
            false;


        if (avatarFallback) {

            avatarFallback.hidden =
                true;

        }


        avatarImage.onerror =
            function () {

                avatarImage.hidden =
                    true;

                if (avatarFallback) {

                    avatarFallback.textContent =
                        getInitial(
                            displayName
                        );

                    avatarFallback.hidden =
                        false;

                }

            };

    }
    else {

        if (avatarImage) {

            avatarImage.hidden =
                true;

        }


        if (avatarFallback) {

            avatarFallback.textContent =
                getInitial(
                    displayName
                );

            avatarFallback.hidden =
                false;

        }

    }

}


/* ============================================================
   USER ROLE
   ============================================================ */

function formatUserRole(
    role
) {

    const normalized =
        String(
            role ?? ""
        )
            .trim()
            .toLowerCase();


    const labels = {

        admin:
            "Administrator",

        landlord:
            "Landlord",

        agent:
            "Agent",

        tenant:
            "Tenant"

    };


    return (
        labels[normalized] ||
        capitalize(normalized) ||
        "User"
    );

}


/* ============================================================
   USER INITIAL
   ============================================================ */

function getInitial(
    name
) {

    const value =
        String(
            name ?? ""
        )
            .trim();


    if (!value) {
        return "H";
    }


    return value
        .charAt(0)
        .toUpperCase();

}


/* ============================================================
   AVATAR URL
   ============================================================ */

function normalizeAvatarUrl(
    avatarUrl
) {

    const value =
        String(
            avatarUrl ?? ""
        )
            .trim();


    if (!value) {
        return "";
    }


    /*
       Already absolute.
    */

    if (
        value.startsWith("http://") ||
        value.startsWith("https://")
    ) {

        return value;

    }


    /*
       Root-relative.
    */

    if (
        value.startsWith("/")
    ) {

        return (
            `${API_BASE_URL}${value}`
        );

    }


    /*
       Relative.
    */

    return (
        `${API_BASE_URL}/${value.replace(
            /^\/+/,
            ""
        )}`
    );

}


/* ============================================================
   STATE
   ============================================================ */

let allProperties = [];
let filteredProperties = [];


/* ============================================================
   DOM ELEMENTS
   ============================================================ */

const propertyList =
    document.getElementById("my-property-list");

const propertyCount =
    document.getElementById("my-properties-count");

const activeCount =
    document.getElementById("my-properties-active");

const emptyState =
    document.getElementById("my-properties-empty");

const messageElement =
    document.getElementById("my-properties-message");

const searchInput =
    document.getElementById("property-search");

const statusFilter =
    document.getElementById("property-status");

const typeFilter =
    document.getElementById("property-type-filter");

const addPropertyPrompt =
    document.getElementById("add-property-prompt");


/* ============================================================
   INITIALIZE
   ============================================================ */

      document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupFilters();

        const token =
            getToken();


        if (!token) {

            showMessage(
                "You are not logged in. Please log in to continue.",
                true
            );

            return;

        }


        try {

            /*
               Load the authenticated user's identity
               from the same API used by dashboard.js.
            */

            await loadCurrentUser();


            /*
               Then load their properties.
            */

            await loadMyProperties();

        }
        catch (error) {

            console.error(
                "HavenGH My Properties initialization error:",
                error
            );


            showMessage(
                error?.message ||
                "Unable to load your account.",
                true
            );

        }

    }
);


/* ============================================================
   TOKEN
   ============================================================ */

function getToken() {

    return (
        localStorage.getItem("havenGH_token") ||
        sessionStorage.getItem("havenGH_token") ||
        ""
    );

}


/* ============================================================
   MESSAGE
   ============================================================ */

function showMessage(
    message,
    isError = false
) {

    if (!messageElement) {
        console.error(
            "HavenGH: #my-properties-message was not found."
        );

        return;
    }

    messageElement.textContent =
        message;

    messageElement.hidden =
        false;

    messageElement.classList.toggle(
        "error",
        isError
    );

}


function hideMessage() {

    if (!messageElement) {
        return;
    }

    messageElement.hidden =
        true;

    messageElement.textContent =
        "";

    messageElement.classList.remove(
        "error"
    );

}


/* ============================================================
   LOAD MY PROPERTIES
   ============================================================ */

async function loadMyProperties() {

    console.log(
        "HavenGH My Properties: loading..."
    );

    const token =
        getToken();


    if (!token) {

        console.error(
            "HavenGH My Properties: no JWT token."
        );

        showMessage(
            "You are not logged in. Please log in to view your properties.",
            true
        );

        if (propertyList) {
            propertyList.innerHTML = "";
        }

        return;

    }


    showMessage(
        "Loading your properties..."
    );


    try {

        const response =
            await fetch(
                MY_PROPERTIES_API,
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


        console.log(
            "HavenGH My Properties API status:",
            response.status
        );


        /*
           SESSION EXPIRED
        */

        if (
            response.status === 401
        ) {

            clearAuthentication();

            throw new Error(
                "Your session has expired. Please log in again."
            );

        }


        /*
           WRONG ROLE
        */

        if (
            response.status === 403
        ) {

            throw new Error(
                "You do not have permission to manage properties."
            );

        }


        /*
           OTHER API ERROR
        */

        if (!response.ok) {

            let message =
                `Unable to load properties (${response.status}).`;

            try {

                const errorData =
                    await response.json();

                if (
                    errorData &&
                    errorData.message
                ) {

                    message =
                        errorData.message;

                }

            }
            catch {
                // API did not return JSON.
            }

            throw new Error(
                message
            );

        }


        /*
           READ RESPONSE
        */

        const responseText =
            await response.text();


        let data;

        try {

            data =
                JSON.parse(
                    responseText
                );

        }
        catch {

            throw new Error(
                "The API returned invalid JSON."
            );

        }


        /*
           API CONTRACT:
           GET /api/Properties/my returns an array.
        */

        if (
            !Array.isArray(data)
        ) {

            throw new Error(
                "The API returned an invalid property list."
            );

        }


        /*
           STORE DATA
        */

        allProperties =
            data;

        filteredProperties =
            [...allProperties];


        console.log(
            "HavenGH My Properties: received",
            allProperties.length,
            "properties."
        );


        /*
           UPDATE UI
        */

        hideMessage();

        updateSummary();

        applyFilters();

    }
    catch (error) {

        console.error(
            "HavenGH My Properties error:",
            error
        );


        showMessage(
            error?.message ||
            "Unable to load your properties.",
            true
        );


        if (propertyList) {
            propertyList.innerHTML = "";
        }

    }

}


/* ============================================================
   CLEAR AUTHENTICATION
   ============================================================ */

function clearAuthentication() {

    localStorage.removeItem(
        "havenGH_token"
    );

    sessionStorage.removeItem(
        "havenGH_token"
    );

}


/* ============================================================
   FILTERS
   ============================================================ */

function setupFilters() {

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            applyFilters
        );

    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    if (typeFilter) {

        typeFilter.addEventListener(
            "change",
            applyFilters
        );

    }

}


/* ============================================================
   APPLY FILTERS
   ============================================================ */

function applyFilters() {

    const search =
        (
            searchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const status =
        (
            statusFilter?.value ||
            "all"
        )
            .trim()
            .toLowerCase();


    const type =
        (
            typeFilter?.value ||
            "all"
        )
            .trim()
            .toLowerCase();


    filteredProperties =
        allProperties.filter(
            property => {

                const title =
                    String(
                        property.title ??
                        property.Title ??
                        ""
                    )
                        .toLowerCase();


                const description =
                    String(
                        property.description ??
                        property.Description ??
                        ""
                    )
                        .toLowerCase();


                const propertyType =
                    String(
                        property.propertyType ??
                        property.PropertyType ??
                        ""
                    )
                        .toLowerCase();


                const propertyStatus =
                    String(
                        property.status ??
                        property.Status ??
                        ""
                    )
                        .toLowerCase();


                const location =
                    property.location ??
                    property.Location;


                const locationText = [

                    location?.addressLine,
                    location?.AddressLine,

                    location?.area,
                    location?.Area,

                    location?.city,
                    location?.City,

                    location?.region,
                    location?.Region,

                    location?.country,
                    location?.Country

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                /*
                   SEARCH
                */

                if (
                    search &&
                    !title.includes(search) &&
                    !description.includes(search) &&
                    !locationText.includes(search)
                ) {

                    return false;

                }


                /*
                   STATUS
                */

                if (
                    status !== "all" &&
                    propertyStatus !== status
                ) {

                    return false;

                }


                /*
                   PROPERTY TYPE
                */

                if (
                    type !== "all" &&
                    propertyType !== type
                ) {

                    return false;

                }


                return true;

            }
        );


    renderProperties();

}


/* ============================================================
   SUMMARY
   ============================================================ */

function updateSummary() {

    const total =
        allProperties.length;


    /*
       Active means currently published.

       Subscription expiration is handled by the API.
       Therefore if the backend changes a property from
       published to draft/unpublished, this counter will
       automatically reflect that status after reload.
    */

    const active =
        allProperties.filter(
            property => {

                const status =
                    String(
                        property.status ??
                        property.Status ??
                        ""
                    )
                        .trim()
                        .toLowerCase();

                return status === "published";

            }
        ).length;


    if (propertyCount) {

        propertyCount.textContent =
            total === 1
                ? "1 Property"
                : `${total} Properties`;

    }


    if (activeCount) {

        activeCount.textContent =
            active === 1
                ? "1 Active"
                : `${active} Active`;

    }


    /*
       Optional add-property prompt.
    */

    if (addPropertyPrompt) {

        addPropertyPrompt.style.display =
            total === 0
                ? ""
                : addPropertyPrompt.style.display;

    }

}


/* ============================================================
   RENDER PROPERTIES
   ============================================================ */

function renderProperties() {

    if (!propertyList) {

        console.error(
            "HavenGH: #my-property-list was not found."
        );

        return;

    }


    propertyList.innerHTML =
        "";


    if (
        filteredProperties.length === 0
    ) {

        showEmpty();

        return;

    }


    hideEmpty();


    const fragment =
        document.createDocumentFragment();


    filteredProperties.forEach(
        property => {

            fragment.appendChild(
                createPropertyCard(
                    property
                )
            );

        }
    );


    propertyList.appendChild(
        fragment
    );

}


/* ============================================================
   PROPERTY CARD
   ============================================================ */

function createPropertyCard(
    property
) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "my-property-card";


    /*
       PROPERTY ID
    */

    const propertyId =
        property.propertyId ??
        property.PropertyId;


    if (
        propertyId === null ||
        propertyId === undefined
    ) {

        console.error(
            "HavenGH: Property has no PropertyId.",
            property
        );

        return card;

    }


    /*
       BASIC DATA
    */

    const title =
        property.title ??
        property.Title ??
        "Untitled Property";


    const description =
        property.description ??
        property.Description ??
        "";


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


    const location =
        property.location ??
        property.Location;


    const locationText =
        formatLocation(
            location
        );


    /* ========================================================
       IMAGE
       ======================================================== */

    const imageContainer =
        document.createElement(
            "div"
        );

    imageContainer.className =
        "my-property-image";


    const imageUrl =
        getPrimaryImage(
            property
        );


    if (imageUrl) {

        const img =
            document.createElement(
                "img"
            );


        img.src =
            imageUrl;


        img.alt =
            title;


        img.loading =
            "lazy";


        img.decoding =
            "async";


        img.onerror =
            function () {

                console.warn(
                    "HavenGH image failed:",
                    imageUrl
                );

                showImagePlaceholder(
                    imageContainer
                );

            };


        imageContainer.appendChild(
            img
        );

    }
    else {

        showImagePlaceholder(
            imageContainer
        );

    }


    /* ========================================================
       CONTENT
       ======================================================== */

    const content =
        document.createElement(
            "div"
        );

    content.className =
        "my-property-content";


    /* ========================================================
       HEADER
       ======================================================== */

    const header =
        document.createElement(
            "div"
        );

    header.className =
        "my-property-card-header";


    const heading =
        document.createElement(
            "h3"
        );

    heading.textContent =
        title;


    const statusBadge =
        document.createElement(
            "span"
        );

    statusBadge.className =
        `property-status-badge status-${status}`;


    statusBadge.textContent =
        formatStatus(
            status
        );


    header.appendChild(
        heading
    );

    header.appendChild(
        statusBadge
    );


    /* ========================================================
       TYPE
       ======================================================== */

    const typeElement =
        document.createElement(
            "span"
        );

    typeElement.className =
        "my-property-type";


    typeElement.textContent =
        formatPropertyType(
            propertyType
        );


    /* ========================================================
       LOCATION
       ======================================================== */

    const locationElement =
        document.createElement(
            "p"
        );

    locationElement.className =
        "my-property-location";


    locationElement.textContent =
        locationText ||
        "Location not provided";


    /* ========================================================
       DESCRIPTION
       ======================================================== */

    const descriptionElement =
        document.createElement(
            "p"
        );

    descriptionElement.className =
        "my-property-description";


    descriptionElement.textContent =
        truncateText(
            description,
            130
        );


    /* ========================================================
       DETAILS
       ======================================================== */

    const details =
        document.createElement(
            "div"
        );

    details.className =
        "my-property-details";


    if (
        bedrooms !== null &&
        bedrooms !== undefined
    ) {

        const bedroom =
            document.createElement(
                "span"
            );


        bedroom.textContent =
            `${bedrooms} ${
                Number(bedrooms) === 1
                    ? "Bedroom"
                    : "Bedrooms"
            }`;


        details.appendChild(
            bedroom
        );

    }


    if (
        bathrooms !== null &&
        bathrooms !== undefined
    ) {

        const bathroom =
            document.createElement(
                "span"
            );


        bathroom.textContent =
            `${bathrooms} ${
                Number(bathrooms) === 1
                    ? "Bathroom"
                    : "Bathrooms"
            }`;


        details.appendChild(
            bathroom
        );

    }


    /* ========================================================
       PRICE
       ======================================================== */

    const priceElement =
        document.createElement(
            "strong"
        );

    priceElement.className =
        "my-property-price";


    priceElement.textContent =
        formatPrice(
            price
        );


    if (pricePeriod) {

        const period =
            document.createElement(
                "small"
            );


        period.textContent =
            ` / ${capitalize(
                pricePeriod
            )}`;


        priceElement.appendChild(
            period
        );

    }


    /* ========================================================
       ACTIONS
       ======================================================== */

    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "my-property-actions";


    /* --------------------------------------------------------
       VIEW
       -------------------------------------------------------- */

    const viewButton =
        document.createElement(
            "a"
        );


    viewButton.href =
        `property-details.html?id=${encodeURIComponent(
            propertyId
        )}`;


    viewButton.className =
        "property-action-button view";


    viewButton.textContent =
        "View";


    /* --------------------------------------------------------
       EDIT
       -------------------------------------------------------- */

    const editButton =
        document.createElement(
            "a"
        );


    editButton.href =
        `edit-property.html?id=${encodeURIComponent(
            propertyId
        )}`;


    editButton.className =
        "property-action-button edit";


    editButton.textContent =
        "Edit";


    actions.appendChild(
        viewButton
    );


    actions.appendChild(
        editButton
    );


    /* --------------------------------------------------------
       PUBLISH / UNPUBLISH
       -------------------------------------------------------- */

    if (
        status === "published"
    ) {

        const unpublishButton =
            document.createElement(
                "button"
            );


        unpublishButton.type =
            "button";


        unpublishButton.className =
            "property-action-button unpublish";


        unpublishButton.textContent =
            "Unpublish";


        unpublishButton.addEventListener(
            "click",
            () => {

                changeStatus(
                    propertyId,
                    "unpublish"
                );

            }
        );


        actions.appendChild(
            unpublishButton
        );

    }
    else if (
        status === "draft" ||
        status === "pending"
    ) {

        const publishButton =
            document.createElement(
                "button"
            );


        publishButton.type =
            "button";


        publishButton.className =
            "property-action-button publish";


        publishButton.textContent =
            "Publish";


        publishButton.addEventListener(
            "click",
            () => {

                changeStatus(
                    propertyId,
                    "publish"
                );

            }
        );


        actions.appendChild(
            publishButton
        );

    }


    /* --------------------------------------------------------
       DELETE / ARCHIVE
       -------------------------------------------------------- */

    if (
        status !== "archived"
    ) {

        const deleteButton =
            document.createElement(
                "button"
            );


        deleteButton.type =
            "button";


        deleteButton.className =
            "property-action-button delete";


        deleteButton.textContent =
            "Delete";


        deleteButton.addEventListener(
            "click",
            () => {

                deleteProperty(
                    propertyId,
                    title
                );

            }
        );


        actions.appendChild(
            deleteButton
        );

    }


    /* ========================================================
       ASSEMBLE CARD
       ======================================================== */

    content.appendChild(
        header
    );


    content.appendChild(
        typeElement
    );


    content.appendChild(
        locationElement
    );


    if (description) {

        content.appendChild(
            descriptionElement
        );

    }


    content.appendChild(
        details
    );


    content.appendChild(
        priceElement
    );


    content.appendChild(
        actions
    );


    card.appendChild(
        imageContainer
    );


    card.appendChild(
        content
    );


    return card;

}


/* ============================================================
   IMAGE PLACEHOLDER
   ============================================================ */

function showImagePlaceholder(
    container
) {

    if (!container) {
        return;
    }


    container.innerHTML = `
        <div class="property-image-placeholder">
            <span>HavenGH</span>
        </div>
    `;

}


/* ============================================================
   PRIMARY PROPERTY IMAGE
   ============================================================ */

function getPrimaryImage(
    property
) {

    if (!property) {
        return null;
    }


    /*
       API CONTRACT:

       Images = [
           {
               PropertyImageId,
               ImageUrl,
               SortOrder,
               IsPrimary
           }
       ]
    */

    const images =
        property.images ??
        property.Images ??
        [];


    if (
        !Array.isArray(images) ||
        images.length === 0
    ) {

        return null;

    }


    /*
       Prefer primary image.
    */

    const primary =
        images.find(
            image =>
                image?.isPrimary === true ||
                image?.IsPrimary === true
        );


    /*
       If there is no primary image,
       use the first returned image.
    */

    const image =
        primary ||
        images[0];


    if (!image) {
        return null;
    }


    /*
       Support both ASP.NET JSON naming
       conventions.
    */

    let imageUrl =
        image.imageUrl ??
        image.ImageUrl ??
        image.url ??
        image.Url ??
        null;


    if (!imageUrl) {
        return null;
    }


    imageUrl =
        String(
            imageUrl
        ).trim();


    if (!imageUrl) {
        return null;
    }


    /*
       Already absolute.
    */

    if (
        imageUrl.startsWith(
            "http://"
        ) ||
        imageUrl.startsWith(
            "https://"
        )
    ) {

        return imageUrl;

    }


    /*
       Root-relative URL:

       /uploads/properties/a.jpg

       becomes:

       https://havenghapi-production.up.railway.app/uploads/properties/a.jpg
    */

    if (
        imageUrl.startsWith("/")
    ) {

        return (
            `${API_BASE_URL}${imageUrl}`
        );

    }


    /*
       Relative URL:

       uploads/properties/a.jpg

       becomes:

       https://havenghapi-production.up.railway.app/uploads/properties/a.jpg
    */

    return (
        `${API_BASE_URL}/${imageUrl.replace(
            /^\/+/,
            ""
        )}`
    );

}


/* ============================================================
   CHANGE PROPERTY STATUS
   ============================================================ */

async function changeStatus(
    propertyId,
    action
) {

    if (
        propertyId === null ||
        propertyId === undefined
    ) {

        alert(
            "Invalid property ID."
        );

        return;

    }


    const token =
        getToken();


    if (!token) {

        alert(
            "Please log in again."
        );

        return;

    }


    /*
       Only these actions are allowed.
    */

    if (
        action !== "publish" &&
        action !== "unpublish"
    ) {

        console.error(
            "Invalid property status action:",
            action
        );

        return;

    }


    const endpoint =
        `${API_BASE_URL}/api/Properties/${encodeURIComponent(
            propertyId
        )}/${action}`;


    try {

        /*
           Prevent accidental double clicks.
        */

        const response =
            await fetch(
                endpoint,
                {
                    method: "POST",

                    headers: {
                        "Accept":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (
            response.status === 401
        ) {

            clearAuthentication();

            throw new Error(
                "Your session has expired. Please log in again."
            );

        }


        if (
            response.status === 403
        ) {

            /*
               This can happen when:
               - subscription has expired
               - subscription does not allow publishing
               - user lacks permission
            */

            let message =
                "You do not have permission to change this property.";

            try {

                const data =
                    await response.json();

                if (data?.message) {
                    message =
                        data.message;
                }

            }
            catch {
                // Ignore invalid JSON.
            }


            throw new Error(
                message
            );

        }


        if (!response.ok) {

            let message =
                "Unable to change property status.";

            try {

                const data =
                    await response.json();

                if (data?.message) {
                    message =
                        data.message;
                }

            }
            catch {
                // Ignore invalid JSON.
            }


            throw new Error(
                message
            );

        }


        /*
           Reload from API.

           This is important because the backend is the
           authority for subscription status and publishing.
        */

        await loadMyProperties();

    }
    catch (error) {

        console.error(
            "HavenGH property status error:",
            error
        );


        alert(
            error?.message ||
            "Unable to change property status."
        );

    }

}


/* ============================================================
   DELETE / ARCHIVE PROPERTY
   ============================================================ */

async function deleteProperty(
    propertyId,
    title
) {

    const confirmed =
        window.confirm(
            `Are you sure you want to archive "${title}"?\n\nThis property will no longer be active.`
        );


    if (!confirmed) {
        return;
    }


    const token =
        getToken();


    if (!token) {

        alert(
            "Please log in again."
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/Properties/${encodeURIComponent(
                    propertyId
                )}`,
                {
                    method: "DELETE",

                    headers: {
                        "Accept":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (
            response.status === 401
        ) {

            clearAuthentication();

            throw new Error(
                "Your session has expired. Please log in again."
            );

        }


        if (
            response.status === 403
        ) {

            throw new Error(
                "You do not have permission to archive this property."
            );

        }


        if (!response.ok) {

            let message =
                "Unable to archive property.";

            try {

                const data =
                    await response.json();

                if (data?.message) {
                    message =
                        data.message;
                }

            }
            catch {
                // Ignore invalid JSON.
            }


            throw new Error(
                message
            );

        }


        /*
           Reload current API data.
        */

        await loadMyProperties();

    }
    catch (error) {

        console.error(
            "HavenGH property archive error:",
            error
        );


        alert(
            error?.message ||
            "Unable to archive property."
        );

    }

}


/* ============================================================
   LOCATION
   ============================================================ */

function formatLocation(
    location
) {

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

function formatPropertyType(
    type
) {

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
        String(
            type ?? ""
        )
            .trim()
            .toLowerCase();


    return (
        labels[normalized] ||
        capitalize(normalized)
    );

}


/* ============================================================
   STATUS
   ============================================================ */

function formatStatus(
    status
) {

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


    return (
        labels[status] ||
        capitalize(status)
    );

}


/* ============================================================
   PRICE
   ============================================================ */

function formatPrice(
    price
) {

    const numericPrice =
        Number(price);


    return (
        `GH₵${(
            Number.isFinite(
                numericPrice
            )
                ? numericPrice
                : 0
        ).toLocaleString(
            "en-GH",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        )}`
    );

}


/* ============================================================
   TEXT
   ============================================================ */

function truncateText(
    text,
    maxLength
) {

    if (!text) {
        return "";
    }


    const value =
        String(text);


    if (
        value.length <= maxLength
    ) {

        return value;

    }


    return (
        `${value.substring(
            0,
            maxLength
        ).trim()}...`
    );

}


/* ============================================================
   CAPITALIZE
   ============================================================ */

function capitalize(
    value
) {

    if (!value) {
        return "";
    }


    const text =
        String(value);


    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );

}


/* ============================================================
   EMPTY STATE
   ============================================================ */

function showEmpty() {

    if (emptyState) {

        emptyState.style.display =
            "block";

    }

}


function hideEmpty() {

    if (emptyState) {

        emptyState.style.display =
            "none";

    }

}

