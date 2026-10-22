/* ============================================================
HavenGH - Shared Property JavaScript
Homepage + Properties Page
Direct ASP.NET Core API connection
============================================================ */

"use strict";

/* ============================================================
API
============================================================ */

const API_BASE_URL =
"https://havenghapi-production.up.railway.app";

const PROPERTIES_API =
`${API_BASE_URL}/api/Properties`;

/* ============================================================
DOM ELEMENTS - PROPERTIES PAGE
============================================================ */

const propertyListings =
document.getElementById("property-listings");

const propertiesLoading =
document.getElementById("properties-loading");

const propertiesEmpty =
document.getElementById("properties-empty");

const propertiesError =
document.getElementById("properties-error");

const retryButton =
document.getElementById("retry-properties");

const resultsCount =
document.getElementById("results-count");

const searchButton =
document.getElementById("property-search-button");

const searchLocation =
document.getElementById("search-location");

const searchType =
document.getElementById("search-type");

const minPrice =
document.getElementById("min-price");

const maxPrice =
document.getElementById("max-price");

const sortSelect =
document.getElementById("sort");

/* ============================================================
DOM ELEMENTS - HOMEPAGE
============================================================ */

const featuredPropertiesGrid =
document.getElementById("featuredPropertiesGrid");

const homepageSearchButton =
document.getElementById("searchPropertiesBtn");

const homepageLocation =
document.getElementById("location");

const homepagePropertyType =
document.getElementById("property-type");

const homepagePrice =
document.getElementById("price");

/* ============================================================
STATE
============================================================ */

let allProperties = [];

let filteredProperties = [];

/* ============================================================
INITIALIZE
============================================================ */

document.addEventListener(
"DOMContentLoaded",
() => {


    setupEventListeners();

    /*
     * Only load the full properties page when
     * property-listings exists.
     */

    if (propertyListings) {

        loadProperties();

    }


    /*
     * Only load homepage featured properties when
     * featuredPropertiesGrid exists.
     */

    if (featuredPropertiesGrid) {

        loadFeaturedProperties();

    }


    updateCurrentYear();

}


);

/* ============================================================
EVENT LISTENERS
============================================================ */

function setupEventListeners() {


/* ========================================================
   PROPERTIES PAGE SEARCH
======================================================== */

if (searchButton) {

    searchButton.addEventListener(
        "click",
        applyFilters
    );

}


if (retryButton) {

    retryButton.addEventListener(
        "click",
        loadProperties
    );

}


if (sortSelect) {

    sortSelect.addEventListener(
        "change",
        applyFilters
    );

}


if (searchLocation) {

    searchLocation.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                applyFilters();

            }

        }
    );

}


/* ========================================================
   HOMEPAGE SEARCH
======================================================== */

if (homepageSearchButton) {

    homepageSearchButton.addEventListener(
        "click",
        handleHomepageSearch
    );

}


/* ========================================================
   MOBILE NAVIGATION
======================================================== */

const mobileMenuButton =
    document.querySelector(
        ".mobile-menu-button"
    );

const navbar =
    document.querySelector(
        ".navbar"
    );


if (
    mobileMenuButton &&
    navbar
) {

    mobileMenuButton.addEventListener(
        "click",
        () => {

            navbar.classList.toggle(
                "open"
            );


            const isOpen =
                navbar.classList.contains(
                    "open"
                );


            mobileMenuButton.setAttribute(
                "aria-label",
                isOpen
                    ? "Close navigation menu"
                    : "Open navigation menu"
            );

        }
    );

}


}

/* ============================================================
HOMEPAGE SEARCH
============================================================ */

function handleHomepageSearch() {


const location =
    homepageLocation?.value
        ?.trim() || "";


const propertyType =
    homepagePropertyType?.value
        ?.trim() || "";


const price =
    homepagePrice?.value
        ?.trim() || "";


const params =
    new URLSearchParams();


if (location) {

    params.set(
        "location",
        location
    );

}


if (propertyType) {

    params.set(
        "type",
        propertyType
    );

}


if (price) {

    params.set(
        "maxPrice",
        price
    );

}


const query =
    params.toString();


window.location.href =
    query
        ? `properties.html?${query}`
        : "properties.html";


}

/* ============================================================
LOAD PROPERTIES - PROPERTIES PAGE
============================================================ */

async function loadProperties() {


showLoading();


try {

    const response =
        await fetch(
            PROPERTIES_API,
            {
                method: "GET",

                headers: {
                    "Accept":
                        "application/json"
                },

                cache: "no-store"
            }
        );


    if (!response.ok) {

        let message =
            `API request failed (${response.status}).`;


        try {

            const errorData =
                await response.json();


            if (errorData?.message) {

                message =
                    errorData.message;

            }

        }

        catch {

            /*
             * API did not return JSON.
             */

        }


        throw new Error(message);

    }


    const data =
        await response.json();


    if (!Array.isArray(data)) {

        throw new Error(
            "The API returned an invalid property list."
        );

    }


    allProperties =
        data;


    filteredProperties =
        [...allProperties];


    hideLoading();


    applyFilters();

}

catch (error) {

    console.error(
        "HavenGH property loading error:",
        error
    );


    showError(
        error.message ||
        "Unable to load properties."
    );

}


}

/* ============================================================
LOAD FEATURED PROPERTIES - HOMEPAGE
============================================================ */

async function loadFeaturedProperties() {


if (!featuredPropertiesGrid) {

    return;

}


featuredPropertiesGrid.innerHTML = `

    <div class="featured-loading">

        Loading featured properties...

    </div>

`;


try {

    const response =
        await fetch(
            PROPERTIES_API,
            {
                method: "GET",

                headers: {
                    "Accept":
                        "application/json"
                },

                cache: "no-store"
            }
        );


    if (!response.ok) {

        throw new Error(
            `Unable to load properties (${response.status}).`
        );

    }


    const data =
        await response.json();


    if (!Array.isArray(data)) {

        throw new Error(
            "The API returned an invalid property list."
        );

    }


    /*
     * The API already returns published properties.
     *
     * If there are more than three published properties,
     * show the first three on the homepage.
     */

    const featured =
        data.slice(0, 3);


    if (featured.length === 0) {

        featuredPropertiesGrid.innerHTML = `

            <div class="featured-empty">

                <p>
                    No properties are available right now.
                </p>

                <a href="properties.html">
                    Browse all properties →
                </a>

            </div>

        `;

        return;

    }


    featuredPropertiesGrid.innerHTML = "";


    featured.forEach(
        property => {

            const card =
                createHomepagePropertyCard(
                    property
                );


            featuredPropertiesGrid.appendChild(
                card
            );

        }
    );

}

catch (error) {

    console.error(
        "HavenGH homepage property loading error:",
        error
    );


    featuredPropertiesGrid.innerHTML = `

        <div class="featured-error">

            <p>
                We couldn't load properties right now.
            </p>

            <a href="properties.html">
                Browse all properties →
            </a>

        </div>

    `;

}


}

/* ============================================================
FILTER PROPERTIES
============================================================ */

function applyFilters() {


const location =
    (searchLocation?.value || "")
        .trim()
        .toLowerCase();


const propertyType =
    (searchType?.value || "")
        .trim()
        .toLowerCase();


const minimumPrice =
    minPrice?.value
        ? Number(minPrice.value)
        : null;


const maximumPrice =
    maxPrice?.value
        ? Number(maxPrice.value)
        : null;


filteredProperties =
    allProperties.filter(
        property => {


            /* --------------------------------------------
               LOCATION
            -------------------------------------------- */

            const propertyLocation =
                property.location ||
                property.Location;


            const locationText = [

                propertyLocation?.addressLine,
                propertyLocation?.AddressLine,

                propertyLocation?.area,
                propertyLocation?.Area,

                propertyLocation?.city,
                propertyLocation?.City,

                propertyLocation?.region,
                propertyLocation?.Region,

                propertyLocation?.country,
                propertyLocation?.Country

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            if (
                location &&
                !locationText.includes(
                    location
                )
            ) {

                return false;

            }


            /* --------------------------------------------
               PROPERTY TYPE
            -------------------------------------------- */

            const type =
                String(
                    property.propertyType ??
                    property.PropertyType ??
                    ""
                )
                    .trim()
                    .toLowerCase();


            if (
                propertyType &&
                type !== propertyType
            ) {

                return false;

            }


            /* --------------------------------------------
               PRICE
            -------------------------------------------- */

            const price =
                Number(
                    property.price ??
                    property.Price ??
                    0
                );


            if (
                minimumPrice !== null &&
                price < minimumPrice
            ) {

                return false;

            }


            if (
                maximumPrice !== null &&
                price > maximumPrice
            ) {

                return false;

            }


            return true;

        }
    );


applySorting();

renderProperties();


}

/* ============================================================
SORT
============================================================ */

function applySorting() {


const sort =
    sortSelect?.value ||
    "newest";


if (
    sort === "low-price"
) {

    filteredProperties.sort(
        (a, b) =>
            getPrice(a) -
            getPrice(b)
    );

}

else if (
    sort === "high-price"
) {

    filteredProperties.sort(
        (a, b) =>
            getPrice(b) -
            getPrice(a)
    );

}

else {

    filteredProperties.sort(
        (a, b) =>
            getDate(b) -
            getDate(a)
    );

}


}

/* ============================================================
RENDER PROPERTIES
============================================================ */

function renderProperties() {


if (!propertyListings) {

    return;

}


propertyListings.innerHTML =
    "";


updateResultsCount(
    filteredProperties.length
);


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

        const card =
            createPropertyCard(
                property
            );


        fragment.appendChild(
            card
        );

    }
);


propertyListings.appendChild(
    fragment
);


}

/* ============================================================
CREATE PROPERTY CARD - PROPERTIES PAGE
============================================================ */

function createPropertyCard(property) {


const card =
    document.createElement(
        "article"
    );


card.className =
    "property-card";


const propertyId =
    property.propertyId ??
    property.PropertyId;


const title =
    property.title ??
    property.Title ??
    "Untitled Property";


const description =
    property.description ??
    property.Description ??
    "";


const type =
    property.propertyType ??
    property.PropertyType ??
    "Property";


const price =
    getPrice(property);


const pricePeriod =
    property.pricePeriod ??
    property.PricePeriod ??
    "";


const bedrooms =
    property.bedrooms ??
    property.Bedrooms;


const bathrooms =
    property.bathrooms ??
    property.Bathrooms;


const featured =
    property.isFeatured ??
    property.IsFeatured;


const location =
    property.location ??
    property.Location;


const locationText =
    formatLocation(
        location
    );


/* ========================================================
   PROPERTY IMAGE
======================================================== */

const image =
    document.createElement(
        "div"
    );


image.className =
    "property-card-image";


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


    img.className =
        "property-card-image-element";


    img.addEventListener(
        "error",
        () => {

            image.innerHTML = `

                <div class="property-image-placeholder">

                    <span>
                        HavenGH
                    </span>

                </div>

            `;

        }
    );


    image.appendChild(
        img
    );

}

else {

    image.innerHTML = `

        <div class="property-image-placeholder">

            <span>
                HavenGH
            </span>

        </div>

    `;

}


/* ========================================================
   CARD CONTENT
======================================================== */

const content =
    document.createElement(
        "div"
    );


content.className =
    "property-card-content";


/* ========================================================
   BADGES
======================================================== */

const badges =
    document.createElement(
        "div"
    );


badges.className =
    "property-card-badges";


const typeBadge =
    document.createElement(
        "span"
    );


typeBadge.className =
    "property-badge";


typeBadge.textContent =
    formatPropertyType(
        type
    );


badges.appendChild(
    typeBadge
);


if (featured) {

    const featuredBadge =
        document.createElement(
            "span"
        );


    featuredBadge.className =
        "property-badge featured";


    featuredBadge.textContent =
        "Featured";


    badges.appendChild(
        featuredBadge
    );

}


/* ========================================================
   TITLE
======================================================== */

const heading =
    document.createElement(
        "h3"
    );


heading.className =
    "property-card-title";


heading.textContent =
    title;


/* ========================================================
   LOCATION
======================================================== */

const locationElement =
    document.createElement(
        "p"
    );


locationElement.className =
    "property-card-location";


locationElement.textContent =
    locationText ||
    "Location available on request";


/* ========================================================
   DESCRIPTION
======================================================== */

const descriptionElement =
    document.createElement(
        "p"
    );


descriptionElement.className =
    "property-card-description";


descriptionElement.textContent =
    truncateText(
        description,
        120
    );


/* ========================================================
   DETAILS
======================================================== */

const details =
    document.createElement(
        "div"
    );


details.className =
    "property-card-details";


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
   PRICE / FOOTER
======================================================== */

const footer =
    document.createElement(
        "div"
    );


footer.className =
    "property-card-footer";


const priceElement =
    document.createElement(
        "strong"
    );


priceElement.className =
    "property-card-price";


priceElement.textContent =
    formatPrice(
        price
    );


const period =
    document.createElement(
        "span"
    );


period.className =
    "property-card-period";


period.textContent =
    pricePeriod
        ? ` / ${capitalize(
            pricePeriod
        )}`
        : "";


priceElement.appendChild(
    period
);


/* ========================================================
   VIEW BUTTON
======================================================== */

const viewButton =
    document.createElement(
        "a"
    );


viewButton.className =
    "btn btn-dark property-view-button";


viewButton.href =
    `property-details.html?id=${encodeURIComponent(
        propertyId
    )}`;


viewButton.textContent =
    "View Property";


footer.appendChild(
    priceElement
);


footer.appendChild(
    viewButton
);


/* ========================================================
   ASSEMBLE CARD
======================================================== */

content.appendChild(
    badges
);


content.appendChild(
    heading
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
    footer
);


card.appendChild(
    image
);


card.appendChild(
    content
);


return card;


}

/* ============================================================
CREATE HOMEPAGE PROPERTY CARD
============================================================ */

function createHomepagePropertyCard(property) {


const card =
    document.createElement(
        "article"
    );


card.className =
    "property-card";


const propertyId =
    property.propertyId ??
    property.PropertyId;


const title =
    property.title ??
    property.Title ??
    "Property Available for Rent";


const price =
    getPrice(property);


const propertyType =
    property.propertyType ??
    property.PropertyType ??
    "Property";


const location =
    property.location ??
    property.Location;


const locationText =
    formatLocation(
        location
    );


const bedrooms =
    property.bedrooms ??
    property.Bedrooms;


const bathrooms =
    property.bathrooms ??
    property.Bathrooms;


const featured =
    property.isFeatured ??
    property.IsFeatured;


/* ========================================================
   IMAGE
======================================================== */

const imageWrapper =
    document.createElement(
        "a"
    );


imageWrapper.className =
    "property-image";


imageWrapper.href =
    `property-details.html?id=${encodeURIComponent(
        propertyId
    )}`;


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


    img.className =
        "property-card-image-element";


    img.addEventListener(
        "error",
        () => {

            imageWrapper.innerHTML = `

                <div class="property-image-placeholder">

                    <span>
                        HavenGH
                    </span>

                </div>

            `;

        }
    );


    imageWrapper.appendChild(
        img
    );

}

else {

    imageWrapper.innerHTML = `

        <div class="property-image-placeholder">

            <span>
                HavenGH
            </span>

        </div>

    `;

}


/* ========================================================
   PROPERTY BADGE
======================================================== */

const badge =
    document.createElement(
        "span"
    );


badge.className =
    "property-badge";


badge.textContent =
    featured
        ? "Featured"
        : "Available";


imageWrapper.appendChild(
    badge
);


/* ========================================================
   PROPERTY CONTENT
======================================================== */

const content =
    document.createElement(
        "div"
    );


content.className =
    "property-info";


/* ========================================================
   PRICE
======================================================== */

const priceElement =
    document.createElement(
        "div"
    );


priceElement.className =
    "property-price";


priceElement.innerHTML =
    `${escapeHtml(
        formatPrice(
            price
        )
    )}
    <span>/ month</span>`;


/* ========================================================
   TITLE
======================================================== */

const heading =
    document.createElement(
        "h3"
    );


heading.textContent =
    title;


/* ========================================================
   LOCATION
======================================================== */

const locationElement =
    document.createElement(
        "p"
    );


locationElement.className =
    "property-location";


locationElement.textContent =
    `📍 ${
        locationText ||
        "Ghana"
    }`;


/* ========================================================
   DETAILS
======================================================== */

const details =
    document.createElement(
        "div"
    );


details.className =
    "property-details";


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
                ? "Bed"
                : "Beds"
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
                ? "Bath"
                : "Baths"
        }`;


    details.appendChild(
        bathroom
    );

}


/* ========================================================
   VIEW PROPERTY
======================================================== */

const viewLink =
    document.createElement(
        "a"
    );


viewLink.className =
    "btn btn-dark property-view-button";


viewLink.href =
    `property-details.html?id=${encodeURIComponent(
        propertyId
    )}`;


viewLink.textContent =
    "View Property";


/* ========================================================
   ASSEMBLE
======================================================== */

content.appendChild(
    priceElement
);


content.appendChild(
    heading
);


content.appendChild(
    locationElement
);


content.appendChild(
    details
);


content.appendChild(
    viewLink
);


card.appendChild(
    imageWrapper
);


card.appendChild(
    content
);


return card;


}

/* ============================================================
GET PRIMARY PROPERTY IMAGE
============================================================ */

function getPrimaryImage(property) {


const images =
    property?.images ??
    property?.Images ??
    [];


if (
    !Array.isArray(images) ||
    images.length === 0
) {

    return null;

}


const primary =
    images.find(
        image =>
            image?.isPrimary === true ||
            image?.IsPrimary === true
    );


const image =
    primary ||
    images[0];


let imageUrl =
    image?.imageUrl ??
    image?.ImageUrl ??
    image?.url ??
    image?.Url ??
    null;


if (!imageUrl) {

    return null;

}


imageUrl =
    String(imageUrl).trim();


if (!imageUrl) {

    return null;

}


/* --------------------------------------------------------
   Absolute URL
-------------------------------------------------------- */

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


/* --------------------------------------------------------
   Root-relative URL
-------------------------------------------------------- */

if (
    imageUrl.startsWith("/")
) {

    return `${API_BASE_URL}${imageUrl}`;

}


/* --------------------------------------------------------
   Relative URL
-------------------------------------------------------- */

return `${API_BASE_URL}/${imageUrl.replace(
    /^\/+/,
    ""
)}`;


}

/* ============================================================
PRICE
============================================================ */

function getPrice(property) {


return Number(
    property.price ??
    property.Price ??
    0
);


}

function formatPrice(price) {


return `GH₵${Number(
    price
).toLocaleString(
    "en-GH",
    {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }
)}`;


}

/* ============================================================
LOCATION
============================================================ */

function formatLocation(location) {


if (!location) {

    return "";

}


const area =
    location.area ??
    location.Area;


const city =
    location.city ??
    location.City;


const region =
    location.region ??
    location.Region;


const country =
    location.country ??
    location.Country;


return [
    area,
    city,
    region,
    country
]
    .filter(Boolean)
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
    capitalize(
        String(type)
    );


}

/* ============================================================
DATE
============================================================ */

function getDate(property) {


const value =
    property.createdAt ??
    property.CreatedAt;


const date =
    new Date(value);


return Number.isNaN(
    date.getTime()
)
    ? 0
    : date.getTime();


}

/* ============================================================
TEXT HELPERS
============================================================ */

function truncateText(
text,
maxLength
) {


if (!text) {

    return "";

}


if (
    text.length <= maxLength
) {

    return text;

}


return `${text.substring(
    0,
    maxLength
).trim()}...`;


}

function capitalize(value) {


if (!value) {

    return "";

}


return value.charAt(0).toUpperCase() +
    value.slice(1);


}

/* ============================================================
HTML ESCAPING
============================================================ */

function escapeHtml(value) {
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
UI STATES - PROPERTIES PAGE
============================================================ */

function showLoading() {


if (propertiesLoading) {

    propertiesLoading.hidden =
        false;

}


if (propertiesError) {

    propertiesError.hidden =
        true;

}


if (propertiesEmpty) {

    propertiesEmpty.hidden =
        true;

}


if (propertyListings) {

    propertyListings.innerHTML =
        "";

}


if (resultsCount) {

    resultsCount.textContent =
        "Loading properties...";

}


}

function hideLoading() {


if (propertiesLoading) {

    propertiesLoading.hidden =
        true;

}


}

function showEmpty() {


if (propertiesEmpty) {

    propertiesEmpty.hidden =
        false;

}


}

function hideEmpty() {


if (propertiesEmpty) {

    propertiesEmpty.hidden =
        true;

}


}

function showError(message) {


hideLoading();


if (propertiesEmpty) {

    propertiesEmpty.hidden =
        true;

}


if (propertyListings) {

    propertyListings.innerHTML =
        "";

}


if (resultsCount) {

    resultsCount.textContent =
        "Unable to load properties";

}


if (propertiesError) {

    propertiesError.hidden =
        false;


    const paragraph =
        propertiesError.querySelector(
            "p"
        );


    if (paragraph) {

        paragraph.textContent =
            message ||
            "We could not connect to HavenGH right now. Please try again.";

    }

}


}

function updateResultsCount(count) {


if (!resultsCount) {

    return;

}


resultsCount.textContent =
    count === 1
        ? "1 property found"
        : `${count} properties found`;


}

/* ============================================================
CURRENT YEAR
============================================================ */

function updateCurrentYear() {


document
    .querySelectorAll(
        ".current-year"
    )
    .forEach(
        element => {

            element.textContent =
                new Date().getFullYear();

        }
    );


}


/* ============================================================
   HAVENGH PROFILE
   Profile Page API Integration
   ============================================================ */

const PROFILE_API =
    `${API_BASE_URL}/api/Auth`;


/* ============================================================
   PROFILE DOM ELEMENTS
   ============================================================ */

const profileForm =
    document.getElementById("profile-form");

const profileFullName =
    document.getElementById("profile-full-name");

const profileBusinessNameInput =
    document.getElementById("profile-business-name-input");

const profileEmail =
    document.getElementById("profile-email");

const profilePhone =
    document.getElementById("profile-phone");

const profileAbout =
    document.getElementById("profile-about");

const saveProfileButton =
    document.getElementById("save-profile-button");

const profileImage =
    document.getElementById("profile-image");

const sidebarProfileImage =
    document.getElementById("sidebar-profile-image");

const profileBusinessName =
    document.getElementById("profile-business-name");

const sidebarBusinessName =
    document.getElementById("sidebar-business-name");

const profileRole =
    document.getElementById("profile-role");

const sidebarRole =
    document.getElementById("sidebar-role");

const contactPhone =
    document.getElementById("contact-phone");

const contactEmail =
    document.getElementById("contact-email");

const contactWhatsApp =
    document.getElementById("contact-whatsapp");

const contactWhatsAppNumber =
    document.getElementById("contact-whatsapp-number");

const profileVerificationBadge =
    document.getElementById("profile-verification-badge");

const identityVerificationIcon =
    document.getElementById("identity-verification-icon");

const identityVerificationTitle =
    document.getElementById("identity-verification-title");

const identityVerificationText =
    document.getElementById("identity-verification-text");

const phoneVerificationIcon =
    document.getElementById("phone-verification-icon");

const phoneVerificationTitle =
    document.getElementById("phone-verification-title");

const phoneVerificationText =
    document.getElementById("phone-verification-text");


/* ============================================================
   PROFILE INITIALIZATION
   ============================================================ */

if (profileForm) {

    loadUserProfile();

    profileForm.addEventListener(
        "submit",
        handleProfileSubmit
    );

}


/* ============================================================
   GET AUTHENTICATION TOKEN
   ============================================================ */

function getProfileToken() {

    return (
        sessionStorage.getItem("havenGH_token") ||
        localStorage.getItem("havenGH_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken")
    );

}


/* ============================================================
   LOAD USER PROFILE
   ============================================================ */

async function loadUserProfile() {

    const token =
        getProfileToken();


    /* --------------------------------------------------------
       No token
    -------------------------------------------------------- */

    if (!token) {

        redirectToLoginFromProfile();

        return;

    }


    try {

        const response =
            await fetch(
                `${PROFILE_API}/me`,
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


        /* ----------------------------------------------------
           Authentication expired / invalid
        ---------------------------------------------------- */

        if (response.status === 401) {

            handleProfileUnauthorized();

            return;

        }


        /* ----------------------------------------------------
           Other API error
        ---------------------------------------------------- */

        if (!response.ok) {

            let message =
                "Unable to load your profile.";

            try {

                const errorData =
                    await response.json();

                if (errorData?.message) {

                    message =
                        errorData.message;

                }

            }
            catch {
                // API did not return JSON.
            }


            throw new Error(message);

        }


        /* ----------------------------------------------------
           Read profile
        ---------------------------------------------------- */

        const data =
            await response.json();


        populateUserProfile(
            data
        );

    }
    catch (error) {

        console.error(
            "HavenGH profile loading error:",
            error
        );


        showProfileMessage(
            error.message ||
            "Unable to load your profile.",
            "error"
        );

    }

}


/* ============================================================
   POPULATE PROFILE
   ============================================================ */

function populateUserProfile(data) {

    if (!data) {

        return;

    }


    /* --------------------------------------------------------
       Full Name
    -------------------------------------------------------- */

    if (profileFullName) {

        profileFullName.value =
            data.fullName || "";

    }


    /* --------------------------------------------------------
       Business Name
    -------------------------------------------------------- */

    if (profileBusinessNameInput) {

        profileBusinessNameInput.value =
            data.businessName || "";

    }


    /* --------------------------------------------------------
       Email
    -------------------------------------------------------- */

    if (profileEmail) {

        profileEmail.value =
            data.email || "";

        /*
         * Email is controlled by the authentication account.
         * Do not allow ordinary profile editing to change it.
         */

        profileEmail.readOnly =
            true;

    }


    /* --------------------------------------------------------
       Phone
    -------------------------------------------------------- */

    if (profilePhone) {

        profilePhone.value =
            data.phone || "";

    }


    /* --------------------------------------------------------
       About
    -------------------------------------------------------- */

    if (profileAbout) {

        profileAbout.value =
            data.about || "";

    }


    /* --------------------------------------------------------
       Profile heading
    -------------------------------------------------------- */

    const displayBusinessName =
        data.businessName ||
        data.fullName ||
        "My HavenGH Profile";


    if (profileBusinessName) {

        profileBusinessName.textContent =
            displayBusinessName;

    }


    if (sidebarBusinessName) {

        sidebarBusinessName.textContent =
            displayBusinessName;

    }


    /* --------------------------------------------------------
       Role
    -------------------------------------------------------- */

    const displayRole =
        data.role ||
        "HavenGH User";


    if (profileRole) {

        profileRole.textContent =
            capitalize(
                displayRole
            );

    }


    if (sidebarRole) {

        sidebarRole.textContent =
            capitalize(
                displayRole
            );

    }


    /* --------------------------------------------------------
       Contact information
    -------------------------------------------------------- */

    if (contactPhone) {

        contactPhone.textContent =
            data.phone ||
            "Not provided";

    }


    if (contactEmail) {

        contactEmail.textContent =
            data.email ||
            "Not provided";

    }


    /* --------------------------------------------------------
       WhatsApp
    -------------------------------------------------------- */

    updateWhatsApp(
        data.whatsAppNumber
    );


    /* --------------------------------------------------------
       Profile image
    -------------------------------------------------------- */

    updateProfileImage(
        data.avatarUrl
    );


    /* --------------------------------------------------------
       Verification
    -------------------------------------------------------- */

    updateVerificationStatus(
        data
    );

}


/* ============================================================
   UPDATE WHATSAPP
   ============================================================ */

function updateWhatsApp(
    number
) {

    const cleanNumber =
        String(
            number || ""
        ).trim();


    if (!contactWhatsAppNumber) {

        return;

    }


    if (!cleanNumber) {

        contactWhatsAppNumber.textContent =
            "Not provided";


        if (contactWhatsApp) {

            contactWhatsApp.href =
                "#";

        }


        return;

    }


    contactWhatsAppNumber.textContent =
        cleanNumber;


    if (contactWhatsApp) {

        const whatsappNumber =
            cleanNumber.replace(
                /[^0-9]/g,
                ""
            );


        if (whatsappNumber) {

            contactWhatsApp.href =
                `https://wa.me/${whatsappNumber}`;

        }

    }

}


/* ============================================================
   UPDATE PROFILE IMAGE
   ============================================================ */

function updateProfileImage(
    avatarUrl
) {

    if (!avatarUrl) {

        return;

    }


    let imageUrl =
        String(
            avatarUrl
        ).trim();


    if (!imageUrl) {

        return;

    }


    /* --------------------------------------------------------
       Absolute URL
    -------------------------------------------------------- */

    if (
        !imageUrl.startsWith(
            "http://"
        ) &&
        !imageUrl.startsWith(
            "https://"
        )
    ) {

        if (
            imageUrl.startsWith(
                "/"
            )
        ) {

            imageUrl =
                `${API_BASE_URL}${imageUrl}`;

        }
        else {

            imageUrl =
                `${API_BASE_URL}/${imageUrl.replace(
                    /^\/+/,
                    ""
                )}`;

        }

    }


    if (profileImage) {

        profileImage.src =
            imageUrl;

    }


    if (sidebarProfileImage) {

        sidebarProfileImage.src =
            imageUrl;

    }

}


/* ============================================================
   UPDATE VERIFICATION STATUS
   ============================================================ */

function updateVerificationStatus(
    data
) {

    /* --------------------------------------------------------
       Identity verification
    -------------------------------------------------------- */

    const identityVerified =
        data.isIdentityVerified === true;


    if (identityVerificationTitle) {

        identityVerificationTitle.textContent =
            identityVerified
                ? "Identity Verified"
                : "Identity Verification";

    }


    if (identityVerificationText) {

        identityVerificationText.textContent =
            identityVerified
                ? "Your identity has been verified by HavenGH."
                : "Your identity has not been verified yet.";

    }


    if (identityVerificationIcon) {

        identityVerificationIcon.textContent =
            identityVerified
                ? "✓"
                : "○";

    }


    /* --------------------------------------------------------
       Phone verification
    -------------------------------------------------------- */

    const phoneVerified =
        data.isPhoneVerified === true;


    if (phoneVerificationTitle) {

        phoneVerificationTitle.textContent =
            phoneVerified
                ? "Phone Verified"
                : "Phone Verification";

    }


    if (phoneVerificationText) {

        phoneVerificationText.textContent =
            phoneVerified
                ? "Your phone number has been verified."
                : data.phone
                    ? "Your phone number has not been verified yet."
                    : "Add a phone number to verify your phone.";

    }


    if (phoneVerificationIcon) {

        phoneVerificationIcon.textContent =
            phoneVerified
                ? "✓"
                : "○";

    }


    /* --------------------------------------------------------
       Header verification badge
    -------------------------------------------------------- */

    if (profileVerificationBadge) {

        if (identityVerified) {

            profileVerificationBadge.textContent =
                "✓ Verified";

        }
        else {

            profileVerificationBadge.textContent =
                "Unverified";

        }

    }

}


/* ============================================================
   SAVE PROFILE
   ============================================================ */

async function handleProfileSubmit(
    event
) {

    event.preventDefault();


    const token =
        getProfileToken();


    if (!token) {

        redirectToLoginFromProfile();

        return;

    }


    /* --------------------------------------------------------
       Get values
    -------------------------------------------------------- */

    const fullName =
        profileFullName?.value
            ?.trim() || "";


    const businessName =
        profileBusinessNameInput?.value
            ?.trim() || "";


    const phone =
        profilePhone?.value
            ?.trim() || "";


    const about =
        profileAbout?.value
            ?.trim() || "";


    /*
     * Your current HTML does not have a separate WhatsApp
     * input field yet.
     *
     * We therefore preserve the existing WhatsApp number
     * returned by the API instead of accidentally deleting it.
     */

    let whatsAppNumber = "";


    if (contactWhatsAppNumber) {

        const currentWhatsApp =
            contactWhatsAppNumber.textContent
                ?.trim() || "";


        if (
            currentWhatsApp &&
            currentWhatsApp !== "Not provided"
        ) {

            whatsAppNumber =
                currentWhatsApp;

        }

    }


    /* --------------------------------------------------------
       Validation
    -------------------------------------------------------- */

    if (!fullName) {

        showProfileMessage(
            "Full name is required.",
            "error"
        );

        if (profileFullName) {

            profileFullName.focus();

        }

        return;

    }


    if (fullName.length > 150) {

        showProfileMessage(
            "Full name cannot exceed 150 characters.",
            "error"
        );

        return;

    }


    /* --------------------------------------------------------
       Disable save button
    -------------------------------------------------------- */

    const originalButtonText =
        saveProfileButton
            ? saveProfileButton.textContent
            : "Save Changes";


    if (saveProfileButton) {

        saveProfileButton.disabled =
            true;

        saveProfileButton.textContent =
            "Saving...";

    }


    try {

        /* ----------------------------------------------------
           Send update
        ---------------------------------------------------- */

        const response =
            await fetch(
                `${PROFILE_API}/profile`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({

                        fullName:
                            fullName,

                        businessName:
                            businessName || null,

                        phone:
                            phone || null,

                        about:
                            about || null,

                        whatsAppNumber:
                            whatsAppNumber || null

                    })
                }
            );


        /* ----------------------------------------------------
           Unauthorized
        ---------------------------------------------------- */

        if (response.status === 401) {

            handleProfileUnauthorized();

            return;

        }


        /* ----------------------------------------------------
           Read response
        ---------------------------------------------------- */

        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data?.message ||
                "Unable to save your profile."
            );

        }


        /* ----------------------------------------------------
           Update UI using returned values
        ---------------------------------------------------- */

        populateUserProfile(
            data
        );


        showProfileMessage(
            data.message ||
            "Profile updated successfully.",
            "success"
        );

    }
    catch (error) {

        console.error(
            "HavenGH profile update error:",
            error
        );


        showProfileMessage(
            error.message ||
            "Unable to save your profile.",
            "error"
        );

    }
    finally {

        if (saveProfileButton) {

            saveProfileButton.disabled =
                false;

            saveProfileButton.textContent =
                originalButtonText;

        }

    }

}


/* ============================================================
   PROFILE MESSAGE
   ============================================================ */

function showProfileMessage(
    message,
    type
) {

    let messageElement =
        document.getElementById(
            "profile-api-message"
        );


    if (!messageElement) {

        messageElement =
            document.createElement(
                "div"
            );

        messageElement.id =
            "profile-api-message";


        messageElement.setAttribute(
            "role",
            "status"
        );


        if (profileForm) {

            profileForm.prepend(
                messageElement
            );

        }

    }


    messageElement.textContent =
        message;


    messageElement.className =
        `profile-api-message ${type || ""}`;


    /*
     * Automatically remove the message after a few seconds.
     */

    window.clearTimeout(
        messageElement._hideTimer
    );


    messageElement._hideTimer =
        window.setTimeout(
            () => {

                messageElement.textContent =
                    "";

                messageElement.className =
                    "profile-api-message";

            },
            5000
        );

}


/* ============================================================
   HANDLE UNAUTHORIZED PROFILE SESSION
   ============================================================ */
         function handleProfileUnauthorized() {

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

    alert(
        "Your session has expired. Please log in again."
    );

    redirectToLoginFromProfile();

}

/* ============================================================
   REDIRECT TO LOGIN
   ============================================================ */

function redirectToLoginFromProfile() {

    const returnUrl =
        window.location.pathname
            .split("/")
            .pop() ||
        "profile.html";


    window.location.href =
        `login.html?returnUrl=${encodeURIComponent(
            returnUrl
        )}`;

}

/* ============================================================
   HAVENGH 2FA SECURITY
   AccountController API Integration
   ============================================================ */

"use strict";


/* ============================================================
   2FA API
   ============================================================ */

const TWO_FACTOR_API =
    `${API_BASE_URL}/api/Account/2fa`;


/* ============================================================
   2FA DOM ELEMENTS
   ============================================================ */

const twoFactorStatusText =
    document.getElementById(
        "two-factor-status-text"
    );

const twoFactorMessage =
    document.getElementById(
        "two-factor-message"
    );

const twoFactorActionArea =
    document.getElementById(
        "two-factor-action-area"
    );

const enableTwoFactorButton =
    document.getElementById(
        "enable-two-factor"
    );

const twoFactorSetupArea =
    document.getElementById(
        "two-factor-setup-area"
    );

const twoFactorQr =
    document.getElementById(
        "two-factor-qr"
    );

const twoFactorSecretKey =
    document.getElementById(
        "two-factor-secret-key"
    );

const copyTwoFactorKeyButton =
    document.getElementById(
        "copy-two-factor-key"
    );

const twoFactorSetupCode =
    document.getElementById(
        "two-factor-setup-code"
    );

const verifyTwoFactorSetupButton =
    document.getElementById(
        "verify-two-factor-setup"
    );

const cancelTwoFactorSetupButton =
    document.getElementById(
        "cancel-two-factor-setup"
    );

const twoFactorDisableArea =
    document.getElementById(
        "two-factor-disable-area"
    );

const twoFactorDisablePassword =
    document.getElementById(
        "two-factor-disable-password"
    );

const twoFactorDisableCode =
    document.getElementById(
        "two-factor-disable-code"
    );

const disableTwoFactorButton =
    document.getElementById(
        "disable-two-factor"
    );

const cancelTwoFactorDisableButton =
    document.getElementById(
        "cancel-two-factor-disable"
    );


/* ============================================================
   2FA INITIALIZATION
   ============================================================ */

if (
    twoFactorStatusText
) {

    initializeTwoFactor();

}


/* ============================================================
   GET AUTH TOKEN
   ============================================================ */

function getTwoFactorToken() {

    return (
        sessionStorage.getItem(
            "havenGH_token"
        ) ||
        localStorage.getItem(
            "havenGH_token"
        ) ||
        localStorage.getItem(
            "token"
        ) ||
        localStorage.getItem(
            "accessToken"
        )
    );

}


/* ============================================================
   AUTHENTICATED API HEADERS
   ============================================================ */

function getTwoFactorHeaders(
    includeJson = false
) {

    const token =
        getTwoFactorToken();


    const headers = {

        "Accept":
            "application/json"

    };


    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }


    if (includeJson) {

        headers["Content-Type"] =
            "application/json";

    }


    return headers;

}


/* ============================================================
   INITIALIZE 2FA
   ============================================================ */

async function initializeTwoFactor() {

    const token =
        getTwoFactorToken();


    if (!token) {

        redirectToLoginFromProfile();

        return;

    }


    await loadTwoFactorStatus();

}


/* ============================================================
   LOAD 2FA STATUS
   GET /api/Account/2fa/status
   ============================================================ */

async function loadTwoFactorStatus() {

    try {

        setTwoFactorStatus(
            "Checking your 2FA status..."
        );


        const response =
            await fetch(
                `${TWO_FACTOR_API}/status`,
                {
                    method: "GET",

                    headers:
                        getTwoFactorHeaders(),

                    cache: "no-store"
                }
            );


        if (
            response.status === 401
        ) {

            handleProfileUnauthorized();

            return;

        }


        const data =
            await readTwoFactorResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                data?.message ||
                "Unable to check two-factor authentication status."
            );

        }


        const enabled =
            data?.enabled === true;


        updateTwoFactorUI(
            enabled
        );

    }
    catch (error) {

        console.error(
            "HavenGH 2FA status error:",
            error
        );


        setTwoFactorStatus(
            "Unable to determine your 2FA status."
        );


        showTwoFactorMessage(
            error.message ||
            "Unable to check 2FA status.",
            "error"
        );

    }

}


/* ============================================================
   UPDATE 2FA UI
   ============================================================ */

function updateTwoFactorUI(
    enabled
) {

    if (!twoFactorStatusText) {

        return;

    }


    if (enabled) {

        twoFactorStatusText.textContent =
            "Enabled. Your account is protected by two-factor authentication.";


        twoFactorStatusText.classList.add(
            "security-enabled"
        );


        twoFactorStatusText.classList.remove(
            "security-disabled"
        );


        if (enableTwoFactorButton) {

            enableTwoFactorButton.textContent =
                "Manage 2FA";

        }


        if (twoFactorActionArea) {

            twoFactorActionArea.hidden =
                false;

        }


        if (twoFactorSetupArea) {

            twoFactorSetupArea.hidden =
                true;

        }

        /*
         * Show the disable controls only when
         * the user chooses to manage 2FA.
         */
        showTwoFactorDisableButton();

    }
    else {

        twoFactorStatusText.textContent =
            "Disabled. Your account is currently using password-only login.";


        twoFactorStatusText.classList.add(
            "security-disabled"
        );


        twoFactorStatusText.classList.remove(
            "security-enabled"
        );


        if (enableTwoFactorButton) {

            enableTwoFactorButton.textContent =
                "Enable 2FA";

        }


        if (twoFactorActionArea) {

            twoFactorActionArea.hidden =
                false;

        }


        if (twoFactorSetupArea) {

            twoFactorSetupArea.hidden =
                true;

        }


        hideTwoFactorDisableArea();

    }

}


/* ============================================================
   ENABLE BUTTON
   ============================================================ */

if (
    enableTwoFactorButton
) {

    enableTwoFactorButton.addEventListener(
        "click",
        handleEnableTwoFactor
    );

}


/* ============================================================
   ENABLE 2FA
   POST /api/Account/2fa/setup
   ============================================================ */

async function handleEnableTwoFactor() {

    const token =
        getTwoFactorToken();


    if (!token) {

        redirectToLoginFromProfile();

        return;

    }


    if (twoFactorSetupArea) {

        twoFactorSetupArea.hidden =
            true;

    }


    if (twoFactorDisableArea) {

        twoFactorDisableArea.hidden =
            true;

    }


    setTwoFactorButtonLoading(
        enableTwoFactorButton,
        true,
        "Preparing..."
    );


    clearTwoFactorMessage();


    try {

        const response =
            await fetch(
                `${TWO_FACTOR_API}/setup`,
                {
                    method: "POST",

                    headers:
                        getTwoFactorHeaders(),

                    cache: "no-store"
                }
            );


        if (
            response.status === 401
        ) {

            handleProfileUnauthorized();

            return;

        }


        const data =
            await readTwoFactorResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                data?.message ||
                "Unable to start 2FA setup."
            );

        }


        const secretKey =
            String(
                data?.secretKey ||
                ""
            ).trim();


        const provisioningUri =
            String(
                data?.provisioningUri ||
                ""
            ).trim();


        if (!secretKey) {

            throw new Error(
                "The HavenGH API did not return a setup key."
            );

        }


        if (
            twoFactorSecretKey
        ) {

            twoFactorSecretKey.value =
                secretKey;

        }


        generateTwoFactorQr(
            provisioningUri
        );


        if (twoFactorSetupArea) {

            twoFactorSetupArea.hidden =
                false;

        }


        if (twoFactorActionArea) {

            twoFactorActionArea.hidden =
                true;

        }


        if (twoFactorSetupCode) {

            twoFactorSetupCode.value =
                "";

            twoFactorSetupCode.focus();

        }


        showTwoFactorMessage(
            "Scan the QR code with your authenticator app, then enter the 6-digit code.",
            "success"
        );

    }
    catch (error) {

        console.error(
            "HavenGH 2FA setup error:",
            error
        );


        showTwoFactorMessage(
            error.message ||
            "Unable to start 2FA setup.",
            "error"
        );

    }
    finally {

        setTwoFactorButtonLoading(
            enableTwoFactorButton,
            false,
            "Enable 2FA"
        );

    }

}


/* ============================================================
   GENERATE QR CODE
   ============================================================ */

function generateTwoFactorQr(
    provisioningUri
) {

    if (!twoFactorQr) {

        return;

    }


    twoFactorQr.innerHTML =
        "";


    if (!provisioningUri) {

        twoFactorQr.innerHTML = `

            <p>
                QR code unavailable.
                Please use the setup key manually.
            </p>

        `;

        return;

    }


    /*
     * QRCode is loaded from QRCode.js.
     */

    if (
        typeof QRCode ===
        "undefined"
    ) {

        twoFactorQr.innerHTML = `

            <p>
                QR generator is still loading.
                Please use the setup key below.
            </p>

        `;

        return;

    }


    new QRCode(
        twoFactorQr,
        {
            text:
                provisioningUri,

            width:
                220,

            height:
                220,

            correctLevel:
                QRCode.CorrectLevel.M
        }
    );

}


/* ============================================================
   COPY SETUP KEY
   ============================================================ */

if (
    copyTwoFactorKeyButton
) {

    copyTwoFactorKeyButton.addEventListener(
        "click",
        copyTwoFactorSetupKey
    );

}


async function copyTwoFactorSetupKey() {

    const key =
        twoFactorSecretKey?.value
            ?.trim() || "";


    if (!key) {

        showTwoFactorMessage(
            "There is no setup key to copy.",
            "error"
        );

        return;

    }


    try {

        await navigator.clipboard.writeText(
            key
        );


        const originalText =
            copyTwoFactorKeyButton.textContent;


        copyTwoFactorKeyButton.textContent =
            "Copied";


        window.setTimeout(
            () => {

                copyTwoFactorKeyButton.textContent =
                    originalText ||
                    "Copy";

            },
            2000
        );


    }
    catch (error) {

        console.error(
            "Unable to copy 2FA key:",
            error
        );


        showTwoFactorMessage(
            "Unable to copy the setup key. Please copy it manually.",
            "error"
        );

    }

}


/* ============================================================
   VERIFY 2FA SETUP
   POST /api/Account/2fa/verify-setup
   ============================================================ */

if (
    verifyTwoFactorSetupButton
) {

    verifyTwoFactorSetupButton.addEventListener(
        "click",
        verifyTwoFactorSetup
    );

}


async function verifyTwoFactorSetup() {

    const code =
        twoFactorSetupCode?.value
            ?.trim() || "";


    if (
        !/^\d{6}$/.test(
            code
        )
    ) {

        showTwoFactorMessage(
            "Enter the current 6-digit authenticator code.",
            "error"
        );


        if (twoFactorSetupCode) {

            twoFactorSetupCode.focus();

        }


        return;

    }


    setTwoFactorButtonLoading(
        verifyTwoFactorSetupButton,
        true,
        "Verifying..."
    );


    clearTwoFactorMessage();


    try {

        const response =
            await fetch(
                `${TWO_FACTOR_API}/verify-setup`,
                {
                    method: "POST",

                    headers:
                        getTwoFactorHeaders(
                            true
                        ),

                    body:
                        JSON.stringify({
                            code: code
                        })
                }
            );


        if (
            response.status === 401
        ) {

            handleProfileUnauthorized();

            return;

        }


        const data =
            await readTwoFactorResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                data?.message ||
                "The authenticator code could not be verified."
            );

        }


        if (twoFactorSetupCode) {

            twoFactorSetupCode.value =
                "";

        }


        if (twoFactorSetupArea) {

            twoFactorSetupArea.hidden =
                true;

        }


        if (twoFactorActionArea) {

            twoFactorActionArea.hidden =
                false;

        }


        updateTwoFactorUI(
            true
        );


        showTwoFactorMessage(
            data?.message ||
            "Two-factor authentication has been enabled successfully.",
            "success"
        );

    }
    catch (error) {

        console.error(
            "HavenGH 2FA verification error:",
            error
        );


        if (twoFactorSetupCode) {

            twoFactorSetupCode.value =
                "";

            twoFactorSetupCode.focus();

        }


        showTwoFactorMessage(
            error.message ||
            "Unable to verify the authenticator code.",
            "error"
        );

    }
    finally {

        setTwoFactorButtonLoading(
            verifyTwoFactorSetupButton,
            false,
            "Verify & Enable"
        );

    }

}


/* ============================================================
   CANCEL SETUP
   ============================================================ */

if (
    cancelTwoFactorSetupButton
) {

    cancelTwoFactorSetupButton.addEventListener(
        "click",
        cancelTwoFactorSetup
    );

}


function cancelTwoFactorSetup() {

    if (twoFactorSetupCode) {

        twoFactorSetupCode.value =
            "";

    }


    if (twoFactorSecretKey) {

        twoFactorSecretKey.value =
            "";

    }


    if (twoFactorQr) {

        twoFactorQr.innerHTML =
            "";

    }


    if (twoFactorSetupArea) {

        twoFactorSetupArea.hidden =
            true;

    }


    if (twoFactorActionArea) {

        twoFactorActionArea.hidden =
            false;

    }


    clearTwoFactorMessage();

}


/* ============================================================
   MANAGE 2FA BUTTON
   ============================================================ */

function showTwoFactorDisableButton() {

    if (!twoFactorActionArea) {

        return;

    }


    twoFactorActionArea.innerHTML = `

        <button
            type="button"
            id="manage-two-factor"
            class="save-profile-button">

            Manage 2FA

        </button>

    `;


    const manageButton =
        document.getElementById(
            "manage-two-factor"
        );


    if (manageButton) {

        manageButton.addEventListener(
            "click",
            showTwoFactorDisableArea
        );

    }

}


/* ============================================================
   SHOW DISABLE AREA
   ============================================================ */

function showTwoFactorDisableArea() {

    if (twoFactorActionArea) {

        twoFactorActionArea.hidden =
            true;

    }


    if (twoFactorDisableArea) {

        twoFactorDisableArea.hidden =
            false;

    }


    clearTwoFactorMessage();


    if (twoFactorDisablePassword) {

        twoFactorDisablePassword.value =
            "";

        twoFactorDisablePassword.focus();

    }


    if (twoFactorDisableCode) {

        twoFactorDisableCode.value =
            "";

    }

}


/* ============================================================
   CANCEL DISABLE
   ============================================================ */

if (
    cancelTwoFactorDisableButton
) {

    cancelTwoFactorDisableButton.addEventListener(
        "click",
        cancelTwoFactorDisable
    );

}


function cancelTwoFactorDisable() {

    hideTwoFactorDisableArea();


    clearTwoFactorMessage();

}


function hideTwoFactorDisableArea() {

    if (twoFactorDisableArea) {

        twoFactorDisableArea.hidden =
            true;

    }


    if (twoFactorActionArea) {

        twoFactorActionArea.hidden =
            false;

    }

}


/* ============================================================
   DISABLE 2FA
   POST /api/Account/2fa/disable
   ============================================================ */

if (
    disableTwoFactorButton
) {

    disableTwoFactorButton.addEventListener(
        "click",
        disableTwoFactor
    );

}


async function disableTwoFactor() {

    const password =
        twoFactorDisablePassword?.value
            ?.trim() || "";


    const code =
        twoFactorDisableCode?.value
            ?.trim() || "";


    if (!password) {

        showTwoFactorMessage(
            "Enter your current password.",
            "error"
        );


        if (twoFactorDisablePassword) {

            twoFactorDisablePassword.focus();

        }


        return;

    }


    if (
        !/^\d{6}$/.test(
            code
        )
    ) {

        showTwoFactorMessage(
            "Enter the current 6-digit authenticator code.",
            "error"
        );


        if (twoFactorDisableCode) {

            twoFactorDisableCode.focus();

        }


        return;

    }


    const confirmed =
        window.confirm(
            "Are you sure you want to disable two-factor authentication?"
        );


    if (!confirmed) {

        return;

    }


    setTwoFactorButtonLoading(
        disableTwoFactorButton,
        true,
        "Disabling..."
    );


    clearTwoFactorMessage();


    try {

        const response =
            await fetch(
                `${TWO_FACTOR_API}/disable`,
                {
                    method: "POST",

                    headers:
                        getTwoFactorHeaders(
                            true
                        ),

                    body:
                        JSON.stringify({

                            currentPassword:
                                password,

                            code:
                                code

                        })
                }
            );


        if (
            response.status === 401
        ) {

            handleProfileUnauthorized();

            return;

        }


        const data =
            await readTwoFactorResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                data?.message ||
                "Unable to disable two-factor authentication."
            );

        }


        if (twoFactorDisablePassword) {

            twoFactorDisablePassword.value =
                "";

        }


        if (twoFactorDisableCode) {

            twoFactorDisableCode.value =
                "";

        }


        hideTwoFactorDisableArea();


        updateTwoFactorUI(
            false
        );


        showTwoFactorMessage(
            data?.message ||
            "Two-factor authentication has been disabled.",
            "success"
        );

    }
    catch (error) {

        console.error(
            "HavenGH 2FA disable error:",
            error
        );


        if (twoFactorDisableCode) {

            twoFactorDisableCode.value =
                "";

        }


        showTwoFactorMessage(
            error.message ||
            "Unable to disable two-factor authentication.",
            "error"
        );

    }
    finally {

        setTwoFactorButtonLoading(
            disableTwoFactorButton,
            false,
            "Disable 2FA"
        );

    }

}


/* ============================================================
   READ API RESPONSE SAFELY
   ============================================================ */

async function readTwoFactorResponse(
    response
) {

    try {

        return await response.json();

    }
    catch {

        return {};

    }

}


/* ============================================================
   STATUS TEXT
   ============================================================ */

function setTwoFactorStatus(
    message
) {

    if (
        twoFactorStatusText
    ) {

        twoFactorStatusText.textContent =
            message;

    }

}


/* ============================================================
   2FA MESSAGE
   ============================================================ */

function showTwoFactorMessage(
    message,
    type
) {

    if (!twoFactorMessage) {

        return;

    }


    twoFactorMessage.textContent =
        message || "";


    twoFactorMessage.className =
        `profile-api-message ${type || ""}`;

}


function clearTwoFactorMessage() {

    if (!twoFactorMessage) {

        return;

    }


    twoFactorMessage.textContent =
        "";


    twoFactorMessage.className =
        "profile-api-message";

}


/* ============================================================
   BUTTON LOADING
   ============================================================ */

function setTwoFactorButtonLoading(
    button,
    loading,
    text
) {

    if (!button) {

        return;

    }


    if (loading) {

        if (
            !button.dataset.originalText
        ) {

            button.dataset.originalText =
                button.textContent;

        }


        button.disabled =
            true;


        button.textContent =
            text;

    }
    else {

        button.disabled =
            false;


        button.textContent =
            button.dataset.originalText ||
            text;


        delete button.dataset.originalText;

    }

}


/* ============================================================
   NUMERIC CODE INPUT
   ============================================================ */

[
    twoFactorSetupCode,
    twoFactorDisableCode
]
.forEach(
    input => {

        if (!input) {

            return;

        }


        input.addEventListener(
            "input",
            () => {

                input.value =
                    input.value
                        .replace(
                            /\D/g,
                            ""
                        )
                        .slice(
                            0,
                            6
                        );

            }
        );

    }
);


/* ============================================================
   LOGOUT
   ============================================================ */

const logoutLink =
    document.getElementById(
        "logout-link"
    );


if (logoutLink) {

    logoutLink.addEventListener(
        "click",
        event => {

            event.preventDefault();


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


            window.location.href =
                "login.html";

        }
    );

}