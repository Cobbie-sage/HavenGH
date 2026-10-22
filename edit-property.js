"use strict";

/* ============================================================
HavenGH - Edit Property
Direct ASP.NET Core API connection
============================================================ */

const API_BASE_URL = "https://havenghapi-production.up.railway.app";

const form = document.getElementById("edit-property-form");
const messageElement = document.getElementById("edit-property-message");
const saveButton = document.getElementById("save-property-button");

/* ============================================================
PROPERTY ID
============================================================ */

const urlParams = new URLSearchParams(window.location.search);
const propertyId = urlParams.get("id");

/* ============================================================
FORM ELEMENTS
============================================================ */

const titleInput = document.getElementById("property-title");
const descriptionInput = document.getElementById("property-description");
const typeInput = document.getElementById("property-type");
const statusInput = document.getElementById("property-status");
const priceInput = document.getElementById("property-price");
const pricePeriodInput = document.getElementById("property-price-period");
const bedroomsInput = document.getElementById("property-bedrooms");
const bathroomsInput = document.getElementById("property-bathrooms");

const addressInput = document.getElementById("property-address");
const areaInput = document.getElementById("property-area");
const cityInput = document.getElementById("property-city");
const regionInput = document.getElementById("property-region");
const countryInput = document.getElementById("property-country");
const latitudeInput = document.getElementById("property-latitude");
const longitudeInput = document.getElementById("property-longitude");

const featuredInput = document.getElementById("property-featured");

/* ============================================================
IMAGE ELEMENTS
============================================================ */

const imageInput =
document.getElementById("property-images");

const imageCountElement =
document.getElementById("property-image-count");

const imageGallery =
document.getElementById("property-image-gallery");

const imageMessage =
document.getElementById("property-image-message");

const MAX_IMAGES = 5;

let propertyImages = [];

/* ============================================================
INITIALIZE
============================================================ */

document.addEventListener("DOMContentLoaded", () => {


if (!propertyId || !/^\d+$/.test(propertyId)) {

    showMessage(
        "Invalid property ID. Please return to My Properties.",
        true
    );

    if (saveButton) {
        saveButton.disabled = true;
    }

    return;
}

loadProperty();


});

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
LOAD PROPERTY
============================================================ */

async function loadProperty() {


const token = getToken();

if (!token) {

    showMessage(
        "You are not logged in. Please log in again.",
        true
    );

    return;
}

showMessage("Loading property...");

try {

    const response = await fetch(
        `${API_BASE_URL}/api/Properties/${propertyId}`,
        {
            method: "GET",

            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`
            }
        }
    );

    if (response.status === 401) {

        throw new Error(
            "Your session has expired. Please log in again."
        );

    }

    if (response.status === 403) {

        throw new Error(
            "You do not have permission to view this property."
        );

    }

    if (!response.ok) {

        let message =
            `Unable to load property (${response.status}).`;

        try {

            const data = await response.json();

            if (data?.message) {
                message = data.message;
            }

        }
        catch {
            // API did not return JSON.
        }

        throw new Error(message);

    }

    const property = await response.json();

    populateForm(property);

    await loadPropertyImages();

    hideMessage();

}
catch (error) {

    console.error(
        "HavenGH Edit Property load error:",
        error
    );

    showMessage(
        error.message ||
        "Unable to load property.",
        true
    );

}


}

/* ============================================================
POPULATE FORM
============================================================ */

function populateForm(property) {


const location =
    property.location ??
    property.Location ??
    null;

/* --------------------------------------------------------
   BASIC INFORMATION
-------------------------------------------------------- */

if (titleInput) {

    titleInput.value =
        property.title ??
        property.Title ??
        "";

}

if (descriptionInput) {

    descriptionInput.value =
        property.description ??
        property.Description ??
        "";

}

if (typeInput) {

    typeInput.value =
        property.propertyType ??
        property.PropertyType ??
        "";

}

if (statusInput) {

    statusInput.value =
        property.status ??
        property.Status ??
        "draft";

}


/* --------------------------------------------------------
   PRICE
-------------------------------------------------------- */

if (priceInput) {

    priceInput.value =
        property.price ??
        property.Price ??
        "";

}

if (pricePeriodInput) {

    pricePeriodInput.value =
        property.pricePeriod ??
        property.PricePeriod ??
        "monthly";

}


/* --------------------------------------------------------
   FEATURES
-------------------------------------------------------- */

if (bedroomsInput) {

    const bedrooms =
        property.bedrooms ??
        property.Bedrooms;

    bedroomsInput.value =
        bedrooms ?? "";

}

if (bathroomsInput) {

    const bathrooms =
        property.bathrooms ??
        property.Bathrooms;

    bathroomsInput.value =
        bathrooms ?? "";

}


/* --------------------------------------------------------
   FEATURED
-------------------------------------------------------- */

if (featuredInput) {

    featuredInput.checked =
        Boolean(
            property.isFeatured ??
            property.IsFeatured ??
            false
        );

}


/* --------------------------------------------------------
   LOCATION
-------------------------------------------------------- */

if (location) {

    if (addressInput) {

        addressInput.value =
            location.addressLine ??
            location.AddressLine ??
            "";

    }

    if (areaInput) {

        areaInput.value =
            location.area ??
            location.Area ??
            "";

    }

    if (cityInput) {

        cityInput.value =
            location.city ??
            location.City ??
            "";

    }

    if (regionInput) {

        regionInput.value =
            location.region ??
            location.Region ??
            "";

    }

    if (countryInput) {

        countryInput.value =
            location.country ??
            location.Country ??
            "";

    }

    if (latitudeInput) {

        latitudeInput.value =
            location.latitude ??
            location.Latitude ??
            "";

    }

    if (longitudeInput) {

        longitudeInput.value =
            location.longitude ??
            location.Longitude ??
            "";

    }

}


}

/* ============================================================
FORM SUBMIT
============================================================ */

if (form) {


form.addEventListener(
    "submit",
    updateProperty
);


}

/* ============================================================
UPDATE PROPERTY
============================================================ */

async function updateProperty(event) {


event.preventDefault();

const token = getToken();

if (!token) {

    showMessage(
        "Your session has expired. Please log in again.",
        true
    );

    return;
}


/* --------------------------------------------------------
   VALIDATE BASIC FIELDS
-------------------------------------------------------- */

const title =
    titleInput?.value.trim() || "";

const description =
    descriptionInput?.value.trim() || null;

const propertyType =
    typeInput?.value.trim() || "";

const status =
    statusInput?.value.trim() || "";

const price =
    Number(priceInput?.value);

const pricePeriod =
    pricePeriodInput?.value.trim() || "";


/* --------------------------------------------------------
   CLIENT VALIDATION
-------------------------------------------------------- */

if (!title) {

    showMessage(
        "Property title is required.",
        true
    );

    titleInput?.focus();

    return;
}

if (!propertyType) {

    showMessage(
        "Please select a property type.",
        true
    );

    typeInput?.focus();

    return;
}

if (!Number.isFinite(price) || price < 0) {

    showMessage(
        "Please enter a valid property price.",
        true
    );

    priceInput?.focus();

    return;
}

if (!pricePeriod) {

    showMessage(
        "Please select a price period.",
        true
    );

    pricePeriodInput?.focus();

    return;
}

if (!status) {

    showMessage(
        "Please select a property status.",
        true
    );

    statusInput?.focus();

    return;
}


/* --------------------------------------------------------
   OPTIONAL NUMBERS
-------------------------------------------------------- */

const bedrooms =
    getOptionalByte(bedroomsInput?.value);

const bathrooms =
    getOptionalByte(bathroomsInput?.value);


if (
    bedrooms !== null &&
    bedrooms > 100
) {

    showMessage(
        "Bedrooms cannot be greater than 100.",
        true
    );

    bedroomsInput?.focus();

    return;
}


if (
    bathrooms !== null &&
    bathrooms > 100
) {

    showMessage(
        "Bathrooms cannot be greater than 100.",
        true
    );

    bathroomsInput?.focus();

    return;
}


/* --------------------------------------------------------
   LOCATION
-------------------------------------------------------- */

const location = {

    addressLine:
        addressInput?.value.trim() || null,

    area:
        areaInput?.value.trim() || "",

    city:
        cityInput?.value.trim() || "",

    region:
        regionInput?.value.trim() || null,

    country:
        countryInput?.value.trim() || "",

    latitude:
        getOptionalDecimal(latitudeInput?.value),

    longitude:
        getOptionalDecimal(longitudeInput?.value)

};


/* --------------------------------------------------------
   LOCATION VALIDATION
-------------------------------------------------------- */

if (!location.area) {

    showMessage(
        "Location area is required.",
        true
    );

    areaInput?.focus();

    return;
}


if (!location.city) {

    showMessage(
        "City is required.",
        true
    );

    cityInput?.focus();

    return;
}


if (!location.country) {

    showMessage(
        "Country is required.",
        true
    );

    countryInput?.focus();

    return;
}


if (
    location.latitude !== null &&
    (
        location.latitude < -90 ||
        location.latitude > 90
    )
) {

    showMessage(
        "Latitude must be between -90 and 90.",
        true
    );

    latitudeInput?.focus();

    return;
}


if (
    location.longitude !== null &&
    (
        location.longitude < -180 ||
        location.longitude > 180
    )
) {

    showMessage(
        "Longitude must be between -180 and 180.",
        true
    );

    longitudeInput?.focus();

    return;
}


/* --------------------------------------------------------
   REQUEST BODY
-------------------------------------------------------- */

const requestBody = {

    title,

    description,

    propertyType,

    price,

    pricePeriod,

    bedrooms,

    bathrooms,

    isFeatured:
        featuredInput?.checked ?? false,

    status,

    location

};


/* --------------------------------------------------------
   UI
-------------------------------------------------------- */

setSavingState(true);

showMessage(
    "Saving your changes..."
);


try {

    const response = await fetch(
        `${API_BASE_URL}/api/Properties/${propertyId}`,
        {
            method: "PUT",

            headers: {

                "Accept":
                    "application/json",

                "Content-Type":
                    "application/json",

                "Authorization":
                    `Bearer ${token}`

            },

            body:
                JSON.stringify(requestBody)

        }
    );


    /* ----------------------------------------------------
       AUTHORIZATION
    ---------------------------------------------------- */

    if (response.status === 401) {

        throw new Error(
            "Your session has expired. Please log in again."
        );

    }


    if (response.status === 403) {

        throw new Error(
            "You do not have permission to edit this property."
        );

    }


    /* ----------------------------------------------------
       NOT FOUND
    ---------------------------------------------------- */

    if (response.status === 404) {

        throw new Error(
            "Property not found."
        );

    }


    /* ----------------------------------------------------
       OTHER API ERRORS
    ---------------------------------------------------- */

    if (!response.ok) {

        let message =
            `Unable to update property (${response.status}).`;

        try {

            const data =
                await response.json();

            if (data?.message) {
                message = data.message;
            }

        }
        catch {
            // Ignore invalid JSON.
        }

        throw new Error(message);

    }


    /* ----------------------------------------------------
       SUCCESS
    ---------------------------------------------------- */

    let result = null;

    try {
        result = await response.json();
    }
    catch {
        // API may return an empty response.
    }


    console.log(
        "Property updated:",
        result
    );


    showMessage(
        result?.message ||
        "Property updated successfully."
    );


    /* ----------------------------------------------------
       RETURN TO MY PROPERTIES
    ---------------------------------------------------- */

    setTimeout(() => {

        window.location.href =
            "my-properties.html";

    }, 1000);

}
catch (error) {

    console.error(
        "HavenGH Edit Property update error:",
        error
    );

    showMessage(
        error.message ||
        "Unable to update property.",
        true
    );

    setSavingState(false);

}


}

/* ============================================================
PROPERTY IMAGES
============================================================ */

/*
Load all existing images for this property.
*/

async function loadPropertyImages() {


if (!imageGallery) {
    return;
}

const token = getToken();

if (!token) {
    return;
}

try {

    const response = await fetch(
        `${API_BASE_URL}/api/PropertyImages/${propertyId}`,
        {
            method: "GET",

            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`
            }
        }
    );


    if (response.status === 401) {

        throw new Error(
            "Your session has expired."
        );

    }


    if (!response.ok) {

        throw new Error(
            `Unable to load property images (${response.status}).`
        );

    }


    const data =
        await response.json();


    /*
       Support either a plain array or an API
       response containing an images property.
    */

    if (Array.isArray(data)) {

        propertyImages = data;

    }
    else if (Array.isArray(data?.images)) {

        propertyImages = data.images;

    }
    else {

        propertyImages = [];

    }


    renderPropertyImages();

}
catch (error) {

    console.error(
        "HavenGH image loading error:",
        error
    );

    showImageMessage(
        error.message ||
        "Unable to load property images.",
        true
    );

}
```

}

/* ============================================================
RENDER PROPERTY IMAGES
============================================================ */

function renderPropertyImages() {

```
if (!imageGallery) {
    return;
}

imageGallery.innerHTML = "";


updateImageCount();


if (!propertyImages.length) {

    imageGallery.innerHTML = `
        <div class="property-image-empty">
            <span>📷</span>
            <p>No property photos uploaded yet.</p>
        </div>
    `;

    return;
}


/*
   Primary image first, then sort order.
*/

const sortedImages =
    [...propertyImages].sort(
        (a, b) => {

            const aPrimary =
                Boolean(
                    a.isPrimary ??
                    a.IsPrimary ??
                    false
                );

            const bPrimary =
                Boolean(
                    b.isPrimary ??
                    b.IsPrimary ??
                    false
                );

            if (aPrimary !== bPrimary) {
                return aPrimary ? -1 : 1;
            }

            return (
                Number(
                    a.sortOrder ??
                    a.SortOrder ??
                    0
                )
                -
                Number(
                    b.sortOrder ??
                    b.SortOrder ??
                    0
                )
            );

        }
    );


sortedImages.forEach(
    (image, index) => {

        const imageId =
            image.propertyImageId ??
            image.PropertyImageId;

        const rawUrl =
            image.imageUrl ??
            image.ImageUrl ??
            "";

        const imageUrl =
            rawUrl.startsWith("http")
                ? rawUrl
                : `${API_BASE_URL}${rawUrl}`;

        const isPrimary =
            Boolean(
                image.isPrimary ??
                image.IsPrimary ??
                false
            );


        const card =
            document.createElement("div");

        card.className =
            "property-image-card";


        card.innerHTML = `

            <div class="property-image-preview">

                <img
                    src="${escapeHtml(imageUrl)}"
                    alt="Property photo ${index + 1}"
                    loading="lazy">

                <span class="property-image-number">
                    ${index + 1}
                </span>

                ${
                    isPrimary
                        ? `
                            <span class="property-image-primary">
                                PRIMARY
                            </span>
                          `
                        : ""
                }

            </div>


            <div class="property-image-actions">

                ${
                    isPrimary
                        ? `
                            <button
                                type="button"
                                class="image-action-button primary"
                                disabled>
                                Primary Photo
                            </button>
                          `
                        : `
                            <button
                                type="button"
                                class="image-action-button"
                                data-primary-id="${imageId}">
                                Make Primary
                            </button>
                          `
                }


                <button
                    type="button"
                    class="image-action-button delete"
                    data-delete-id="${imageId}">
                    Delete
                </button>

            </div>

        `;


        imageGallery.appendChild(card);

    }
);


attachImageActionEvents();


}

/* ============================================================
IMAGE ACTION EVENTS
============================================================ */

function attachImageActionEvents() {


if (!imageGallery) {
    return;
}


imageGallery
    .querySelectorAll("[data-primary-id]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const imageId =
                    button.dataset.primaryId;

                makePrimaryImage(imageId);

            }
        );

    });


imageGallery
    .querySelectorAll("[data-delete-id]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const imageId =
                    button.dataset.deleteId;

                deletePropertyImage(imageId);

            }
        );

    });


}

/* ============================================================
IMAGE COUNT
============================================================ */

function updateImageCount() {


if (!imageCountElement) {
    return;
}

const count =
    propertyImages.length;

imageCountElement.textContent =
    `${count} / ${MAX_IMAGES} images`;


if (count >= MAX_IMAGES) {

    imageCountElement.classList.add(
        "image-limit-reached"
    );

}
else {

    imageCountElement.classList.remove(
        "image-limit-reached"
    );

}


}

/* ============================================================
SELECT IMAGES
============================================================ */

if (imageInput) {

imageInput.addEventListener(
    "change",
    handleImageSelection
);


}

/* ============================================================
HANDLE IMAGE SELECTION
============================================================ */

async function handleImageSelection() {


const files =
    Array.from(
        imageInput?.files || []
    );


if (!files.length) {
    return;
}


const remainingSlots =
    MAX_IMAGES -
    propertyImages.length;


if (remainingSlots <= 0) {

    showImageMessage(
        "This property already has the maximum of 5 images.",
        true
    );

    imageInput.value = "";

    return;
}


if (files.length > remainingSlots) {

    showImageMessage(
        `You can only add ${remainingSlots} more image${
            remainingSlots === 1 ? "" : "s"
        }.`,
        true
    );

    imageInput.value = "";

    return;
}


/*
   Validate all selected files before uploading.
*/

for (const file of files) {

    const validation =
        validateImageFile(file);

    if (!validation.valid) {

        showImageMessage(
            validation.message,
            true
        );

        imageInput.value = "";

        return;
    }

}


/*
   Upload one at a time.
   The first uploaded image becomes primary
   automatically through the API.
*/

for (let index = 0; index < files.length; index++) {

    const file = files[index];

    showImageMessage(
        `Uploading image ${index + 1} of ${files.length}...`
    );


    try {

        await uploadPropertyImage(
            file,
            propertyImages.length === 0 &&
            index === 0
        );

    }
    catch (error) {

        console.error(
            "HavenGH image upload error:",
            error
        );

        showImageMessage(
            error.message ||
            "Unable to upload image.",
            true
        );

        break;
    }

}


imageInput.value = "";


await loadPropertyImages();


if (propertyImages.length >= MAX_IMAGES) {

    showImageMessage(
        "All 5 property images have been uploaded."
    );

}
else {

    showImageMessage(
        "Property image upload completed."
    );

}


}

/* ============================================================
VALIDATE IMAGE
============================================================ */

function validateImageFile(file) {


const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
];


const maxFileSize =
    10 * 1024 * 1024;


if (!allowedTypes.includes(file.type)) {

    return {
        valid: false,
        message:
            "Only JPG, JPEG, PNG and WEBP images are allowed."
    };

}


if (file.size > maxFileSize) {

    return {
        valid: false,
        message:
            "Each image must be 10 MB or smaller."
    };

}


return {
    valid: true
};


}

/* ============================================================
UPLOAD IMAGE
============================================================ */

async function uploadPropertyImage(
file,
isPrimary
) {


const token =
    getToken();


if (!token) {

    throw new Error(
        "Your session has expired. Please log in again."
    );

}


const formData =
    new FormData();


formData.append(
    "image",
    file
);


formData.append(
    "isPrimary",
    isPrimary ? "true" : "false"
);


const response =
    await fetch(
        `${API_BASE_URL}/api/PropertyImages/${propertyId}/upload`,
        {
            method: "POST",

            headers: {
                "Authorization":
                    `Bearer ${token}`
            },

            body: formData
        }
    );


if (response.status === 401) {

    throw new Error(
        "Your session has expired. Please log in again."
    );

}


if (response.status === 403) {

    throw new Error(
        "You do not have permission to upload images for this property."
    );

}


if (!response.ok) {

    let message =
        `Unable to upload image (${response.status}).`;

    try {

        const data =
            await response.json();

        if (data?.message) {
            message = data.message;
        }

    }
    catch {
        // Ignore invalid JSON.
    }

    throw new Error(message);

}


return await response.json();


}

/* ============================================================
MAKE PRIMARY IMAGE
============================================================ */

async function makePrimaryImage(imageId) {


const token =
    getToken();


if (!token) {

    showImageMessage(
        "Your session has expired. Please log in again.",
        true
    );

    return;
}


try {

    showImageMessage(
        "Updating primary photo..."
    );


    const response =
        await fetch(
            `${API_BASE_URL}/api/PropertyImages/${imageId}/primary`,
            {
                method: "PUT",

                headers: {
                    "Accept":
                        "application/json",

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


    if (response.status === 403) {

        throw new Error(
            "You do not have permission to change this image."
        );

    }


    if (!response.ok) {

        let message =
            `Unable to change primary image (${response.status}).`;

        try {

            const data =
                await response.json();

            if (data?.message) {
                message = data.message;
            }

        }
        catch {
            // Ignore invalid JSON.
        }

        throw new Error(message);

    }


    await loadPropertyImages();


    showImageMessage(
        "Primary property photo updated."
    );

}
catch (error) {

    console.error(
        "HavenGH primary image error:",
        error
    );

    showImageMessage(
        error.message ||
        "Unable to update primary image.",
        true
    );

}


}

/* ============================================================
DELETE PROPERTY IMAGE
============================================================ */

async function deletePropertyImage(imageId) {


const token =
    getToken();


if (!token) {

    showImageMessage(
        "Your session has expired. Please log in again.",
        true
    );

    return;
}


const confirmed =
    window.confirm(
        "Are you sure you want to delete this property photo?"
    );


if (!confirmed) {
    return;
}


try {

    showImageMessage(
        "Deleting photo..."
    );


    const response =
        await fetch(
            `${API_BASE_URL}/api/PropertyImages/${imageId}`,
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


    if (response.status === 401) {

        throw new Error(
            "Your session has expired. Please log in again."
        );

    }


    if (response.status === 403) {

        throw new Error(
            "You do not have permission to delete this image."
        );

    }


    if (response.status === 404) {

        throw new Error(
            "Image not found."
        );

    }


    if (!response.ok) {

        let message =
            `Unable to delete image (${response.status}).`;

        try {

            const data =
                await response.json();

            if (data?.message) {
                message = data.message;
            }

        }
        catch {
            // Ignore invalid JSON.
        }

        throw new Error(message);

    }


    await loadPropertyImages();


    showImageMessage(
        "Property photo deleted successfully."
    );

}
catch (error) {

    console.error(
        "HavenGH delete image error:",
        error
    );

    showImageMessage(
        error.message ||
        "Unable to delete property photo.",
        true
    );

}


}

/* ============================================================
IMAGE MESSAGE
============================================================ */

function showImageMessage(
message,
isError = false
) {


if (!imageMessage) {
    return;
}


imageMessage.textContent =
    message;

imageMessage.hidden =
    false;

imageMessage.className =
    isError
        ? "api-message error"
        : "api-message";


}

/* ============================================================
OPTIONAL BYTE
============================================================ */

function getOptionalByte(value) {


if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
) {
    return null;
}


const number =
    Number(value);


if (
    !Number.isInteger(number) ||
    number < 0 ||
    number > 255
) {
    return null;
}


return number;


}

/* ============================================================
OPTIONAL DECIMAL
============================================================ */

function getOptionalDecimal(value) {


if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
) {
    return null;
}


const number =
    Number(value);


return Number.isFinite(number)
    ? number
    : null;


}

/* ============================================================
SAVE BUTTON STATE
============================================================ */

function setSavingState(isSaving) {


if (!saveButton) {
    return;
}


saveButton.disabled =
    isSaving;


saveButton.textContent =
    isSaving
        ? "Saving Changes..."
        : "Save Changes";


}

/* ============================================================
MESSAGE
============================================================ */

function showMessage(
message,
isError = false
) {


if (!messageElement) {
    return;
}


messageElement.textContent =
    message;


messageElement.hidden =
    false;


messageElement.className =
    isError
        ? "api-message error"
        : "api-message";


}

function hideMessage() {


if (!messageElement) {
    return;
}


messageElement.textContent =
    "";

messageElement.hidden =
    true;


}

/* ============================================================
HTML ESCAPE
============================================================ */

function escapeHtml(value) {


return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");


}
