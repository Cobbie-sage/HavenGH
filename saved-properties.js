"use strict";

/* ============================================================
HavenGH - Saved Properties
API connection
============================================================ */

const SAVED_PROPERTIES_API =
"http://localhost:5073/api/SavedProperties";

/* ============================================================
INITIALIZE
============================================================ */

document.addEventListener("DOMContentLoaded", () => {


loadSavedProperties();


});

/* ============================================================
LOAD SAVED PROPERTIES
============================================================ */

async function loadSavedProperties() {


const container =
    document.getElementById("saved-properties");

const emptyState =
    document.getElementById("saved-empty");

if (!container || !emptyState) {
    return;
}

container.innerHTML = "";

emptyState.style.display = "none";


const token =
    localStorage.getItem("havenGH_token");


if (!token) {

    emptyState.style.display = "block";

    emptyState.innerHTML = `
        <h3>Login required</h3>

        <p>
            Please log in to view your saved properties.
        </p>

        <a href="login.html" class="btn btn-dark">
            Log In
        </a>
    `;

    return;
}


try {

    const response =
        await fetch(
            SAVED_PROPERTIES_API,
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

        throw new Error(
            "Your session has expired. Please log in again."
        );

    }


    if (!response.ok) {

        throw new Error(
            `Unable to load saved properties. Server returned ${response.status}.`
        );

    }


    const savedProperties =
        await response.json();


    if (
        !Array.isArray(savedProperties) ||
        savedProperties.length === 0
    ) {

        emptyState.style.display = "block";

        return;

    }


    savedProperties.forEach(
        savedProperty => {

            const card =
                createSavedPropertyCard(
                    savedProperty
                );

            container.appendChild(card);

        }
    );


}
catch (error) {

    console.error(
        "HavenGH saved properties error:",
        error
    );


    emptyState.style.display = "block";

    emptyState.innerHTML = `
        <h3>
            Unable to load saved properties
        </h3>

        <p>
            ${escapeHtml(error.message)}
        </p>

        <button
            type="button"
            class="btn btn-dark"
            onclick="loadSavedProperties()">
            Try Again
        </button>
    `;

}


}

/* ============================================================
CREATE SAVED PROPERTY CARD
============================================================ */

function createSavedPropertyCard(savedProperty) {


const card =
    document.createElement("article");

card.className =
    "property-card";


const propertyId =
    savedProperty.propertyId ??
    savedProperty.PropertyId;


const image =
    document.createElement("div");

image.className =
    "property-card-image";

image.innerHTML = `
    <div class="property-image-placeholder">
        <span>HavenGH</span>
    </div>
`;


const content =
    document.createElement("div");

content.className =
    "property-card-content";


const title =
    savedProperty.title ??
    savedProperty.Title ??
    `Property #${propertyId}`;


const propertyType =
    savedProperty.propertyType ??
    savedProperty.PropertyType ??
    "Property";


const price =
    Number(
        savedProperty.price ??
        savedProperty.Price ??
        0
    );


const location =
    savedProperty.location ??
    savedProperty.Location;


const locationText =
    formatSavedLocation(location);


content.innerHTML = `
    <div class="property-card-badges">

        <span class="property-badge">
            ${escapeHtml(
                formatPropertyType(propertyType)
            )}
        </span>

    </div>

    <h3 class="property-card-title">
        ${escapeHtml(title)}
    </h3>

    <p class="property-card-location">
        ${escapeHtml(
            locationText ||
            "Location available on request"
        )}
    </p>

    <div class="property-card-footer">

        <strong class="property-card-price">
            GH₵${price.toLocaleString(
                "en-GH",
                {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                }
            )}
        </strong>

        <a
            href="property-details.html?id=${encodeURIComponent(propertyId)}"
            class="btn btn-dark">
            View Property
        </a>

    </div>
`;


/* ========================================================
   REMOVE SAVED PROPERTY BUTTON
======================================================== */

const removeButton =
    document.createElement("button");

removeButton.type =
    "button";

removeButton.className =
    "btn btn-outline";

removeButton.textContent =
    "Remove";


removeButton.addEventListener(
    "click",
    () => removeSavedProperty(
        propertyId,
        removeButton
    )
);


content.appendChild(
    removeButton
);


card.appendChild(image);

card.appendChild(content);


return card;


}

/* ============================================================
REMOVE SAVED PROPERTY
============================================================ */

async function removeSavedProperty(
propertyId,
button
) {


const token =
    localStorage.getItem("havenGH_token");


if (!token) {

    alert(
        "Your session has expired. Please log in again."
    );

    return;

}


const confirmed =
    confirm(
        "Remove this property from your saved properties?"
    );


if (!confirmed) {
    return;
}


try {

    button.disabled = true;

    button.textContent =
        "Removing...";


    const response =
        await fetch(
            `${SAVED_PROPERTIES_API}/${propertyId}`,
            {
                method: "DELETE",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


    if (response.status === 401) {

        throw new Error(
            "Your session has expired. Please log in again."
        );

    }


    if (!response.ok) {

        let message =
            "Unable to remove saved property.";

        try {

            const data =
                await response.json();

            if (data.message) {
                message =
                    data.message;
            }

        }
        catch {
            // No JSON response.
        }

        throw new Error(message);

    }


    await loadSavedProperties();

}
catch (error) {

    console.error(
        "Remove saved property error:",
        error
    );

    alert(error.message);

    button.disabled = false;

    button.textContent =
        "Remove";

}


}

/* ============================================================
LOCATION
============================================================ */

function formatSavedLocation(location) {


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
HELPERS
============================================================ */

function capitalize(value) {


if (!value) {
    return "";
}

return value.charAt(0).toUpperCase() +
    value.slice(1);


}

function escapeHtml(value) {


const div =
    document.createElement("div");

div.textContent =
    value ?? "";

return div.innerHTML;


}
