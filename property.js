/* ============================================================
   HAVENGH PROPERTY DETAILS
   API CONNECTED
   ============================================================ */

const API_BASE_URL = "https://havenghapi-production.up.railway.app/api";
const PROPERTY_API = `${API_BASE_URL}/Properties`;

/* ============================================================
   HELPERS
   ============================================================ */

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
}

function getPropertyId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

function getToken() {
    return (
        sessionStorage.getItem("havenGH_token") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("accessToken") ||
        localStorage.getItem("havenGH_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken")
    );
}

function formatPrice(price) {
    if (
        price === null ||
        price === undefined ||
        price === ""
    ) {
        return "Price unavailable";
    }

    const number = Number(price);

    if (Number.isNaN(number)) {
        return String(price);
    }

    return new Intl.NumberFormat("en-GH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(number);
}

function formatDate(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleDateString("en-GH", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function absoluteImageUrl(url) {
    if (!url) {
        return "images/property-1.jpg";
    }

    if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("data:")
    ) {
        return url;
    }

    if (url.startsWith("/")) {
        return `${API_BASE_URL.replace("/api", "")}${url}`;
    }

    return url;
}

function getLocationText(location) {
    if (!location) {
        return "Location unavailable";
    }

    const parts = [
        location.area,
        location.city,
        location.region
    ].filter(Boolean);

    if (parts.length) {
        return parts.join(", ");
    }

    return (
        location.addressLine ||
        location.address ||
        location.name ||
        "Location unavailable"
    );
}

/* ============================================================
   DOM
   ============================================================ */

const propertyContent =
    document.getElementById("property-content");

const propertyError =
    document.getElementById("property-error");

const propertyErrorMessage =
    document.getElementById("property-error-message");

const propertyMainImage =
    document.getElementById("property-main-image");

const propertyMainImagePlaceholder =
    document.getElementById(
        "property-main-image-placeholder"
    );

const propertyGallerySide =
    document.getElementById(
        "property-gallery-side"
    );

const propertyBadge =
    document.getElementById("property-badge");

const propertyTitle =
    document.getElementById("property-title");

const propertyType =
    document.getElementById("property-type");

const propertyLocation =
    document.getElementById("property-location");

const breadcrumbLocation =
    document.getElementById(
        "breadcrumb-location"
    );

const propertyPrice =
    document.getElementById("property-price");

const propertyPricePeriod =
    document.getElementById(
        "property-price-period"
    );

const propertyBedrooms =
    document.getElementById(
        "property-bedrooms"
    );

const propertyBathrooms =
    document.getElementById(
        "property-bathrooms"
    );

const propertyKitchens =
    document.getElementById(
        "property-kitchens"
    );

const propertyParkings =
    document.getElementById(
        "property-parkings"
    );

const propertyDescription =
    document.getElementById(
        "property-description"
    );

const propertyFeaturesSection =
    document.getElementById(
        "property-features-section"
    );

const propertyAmenities =
    document.getElementById(
        "property-amenities"
    );

const locationDescription =
    document.getElementById(
        "location-description"
    );

const locationNote =
    document.getElementById(
        "location-note"
    );

const agentImage =
    document.getElementById("agent-image");

const agentImagePlaceholder =
    document.getElementById(
        "agent-image-placeholder"
    );

const agentName =
    document.getElementById("agent-name");

const agentVerification =
    document.getElementById(
        "agent-verification"
    );

const ownerPropertyCount =
    document.getElementById(
        "owner-property-count"
    );

const agentRating =
    document.getElementById(
        "agent-rating"
    );

const whatsappButton =
    document.getElementById(
        "whatsapp-button"
    );

const callButton =
    document.getElementById(
        "call-button"
    );

const requestPropertyButton =
    document.getElementById(
        "request-property-button"
    );

const similarSection =
    document.getElementById(
        "similar-properties-section"
    );

const similarGrid =
    document.getElementById(
        "similar-properties-grid"
    );

/* ============================================================
   LOAD PROPERTY
   ============================================================ */

async function loadProperty() {
    const propertyId = getPropertyId();

    if (!propertyId || Number(propertyId) <= 0) {
        showError("No valid property was selected.");
        return;
    }

    try {
        const response = await fetch(
            `${PROPERTY_API}/${encodeURIComponent(propertyId)}`
        );

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(
                    "This property could not be found."
                );
            }

            throw new Error(
                "Unable to load this property."
            );
        }

        const property = await response.json();

        console.log(
            "HavenGH property:",
            property
        );

        renderProperty(property);

        loadSimilarProperties(property);

    } catch (error) {
        console.error(
            "Property loading error:",
            error
        );

        showError(
            error.message ||
            "Unable to load property information."
        );
    }
}

/* ============================================================
   RENDER PROPERTY
   ============================================================ */

function renderProperty(property) {

    propertyContent.hidden = false;

    const location =
        property.location ||
        property.Location ||
        null;

    const title =
        property.title ||
        property.Title ||
        "Property";

    const type =
        property.propertyType ||
        property.PropertyType ||
        "Property";

    const price =
        property.price ??
        property.Price;

    const pricePeriod =
        property.pricePeriod ||
        property.PricePeriod ||
        "";

    const description =
        property.description ||
        property.Description ||
        "No description has been provided for this property.";

    /* --------------------------------------------------------
       BASIC INFORMATION
       -------------------------------------------------------- */

    propertyTitle.textContent = title;

    propertyType.textContent = type;

    const locationText =
        getLocationText(location);

    propertyLocation.textContent =
        locationText;

    breadcrumbLocation.textContent =
        locationText;

    propertyPrice.textContent =
        price != null
            ? `GH₵${formatPrice(price)}`
            : "Price unavailable";

    propertyPricePeriod.textContent =
        pricePeriod
            ? `/ ${pricePeriod}`
            : "";

    /* --------------------------------------------------------
       FEATURES
       -------------------------------------------------------- */

    setFeature(
        propertyBedrooms,
        property.bedrooms ??
        property.Bedrooms
    );

    setFeature(
        propertyBathrooms,
        property.bathrooms ??
        property.Bathrooms
    );

    setFeature(
        propertyKitchens,
        property.kitchens ??
        property.Kitchens ??
        property.kitchen ??
        property.Kitchen
    );

    setFeature(
        propertyParkings,
        property.parkings ??
        property.Parkings ??
        property.parkingSpaces ??
        property.ParkingSpaces
    );

    /* --------------------------------------------------------
       DESCRIPTION
       -------------------------------------------------------- */

    propertyDescription.textContent =
        description;

    /* --------------------------------------------------------
       LOCATION
       -------------------------------------------------------- */

    locationDescription.textContent =
        locationText;

    if (location) {
        const locationParts = [
            location.addressLine,
            location.area,
            location.city,
            location.region,
            location.country
        ].filter(Boolean);

        locationNote.textContent =
            locationParts.length
                ? locationParts.join(" • ")
                : "Location information provided by HavenGH.";
    }

    /* --------------------------------------------------------
       BADGE
       -------------------------------------------------------- */

    const isFeatured =
        property.isFeatured ??
        property.IsFeatured ??
        property.featured ??
        property.Featured ??
        false;

    if (isFeatured) {
        propertyBadge.hidden = false;
        propertyBadge.textContent =
            "Featured";
    } else {
        propertyBadge.hidden = true;
    }

    /* --------------------------------------------------------
       IMAGES
       -------------------------------------------------------- */

    renderImages(property);

    /* --------------------------------------------------------
       AMENITIES
       -------------------------------------------------------- */

    renderAmenities(property);

    /* --------------------------------------------------------
       OWNER / AGENT
       -------------------------------------------------------- */

    renderOwner(property);

    /* --------------------------------------------------------
       RENTAL REQUEST
       -------------------------------------------------------- */

    const id =
        property.propertyId ??
        property.PropertyId ??
        getPropertyId();

    requestPropertyButton.dataset.propertyId =
        id;

    requestPropertyButton.addEventListener(
        "click",
        () => {
            requestRentalProperty(id);
        }
    );
}

/* ============================================================
   FEATURES
   ============================================================ */

function setFeature(element, value) {
    if (!element) {
        return;
    }

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        element.textContent = "-";
        return;
    }

    element.textContent = value;
}

/* ============================================================
   IMAGES
   ============================================================ */

function renderImages(property) {

    let images =
        property.images ||
        property.Images ||
        property.propertyImages ||
        property.PropertyImages ||
        [];

    if (!Array.isArray(images)) {
        images = [];
    }

    const imageUrls = images
        .map(image => {

            if (typeof image === "string") {
                return image;
            }

            return (
                image.imageUrl ||
                image.ImageUrl ||
                image.url ||
                image.Url ||
                image.path ||
                image.Path
            );
        })
        .filter(Boolean);

    const primaryImage =
        property.primaryImage ||
        property.PrimaryImage ||
        imageUrls[0];

    if (!primaryImage) {
        propertyMainImage.hidden = true;
        propertyMainImagePlaceholder.hidden = false;
        propertyMainImagePlaceholder.textContent =
            "No property image available.";
    } else {
        const url =
            absoluteImageUrl(primaryImage);

        propertyMainImage.src = url;
        propertyMainImage.alt =
            property.title ||
            "HavenGH property";

        propertyMainImage.hidden = false;
        propertyMainImagePlaceholder.hidden =
            true;

        propertyMainImage.onerror = () => {
            propertyMainImage.hidden = true;
            propertyMainImagePlaceholder.hidden =
                false;
            propertyMainImagePlaceholder.textContent =
                "Property image unavailable.";
        };
    }

    propertyGallerySide.innerHTML = "";

    imageUrls
        .filter(url =>
            url !== primaryImage
        )
        .slice(0, 4)
        .forEach((imageUrl, index) => {

            const image =
                document.createElement("img");

            image.src =
                absoluteImageUrl(imageUrl);

            image.alt =
                `${property.title || "Property"} image ${index + 2}`;

            image.loading = "lazy";

            image.addEventListener(
                "click",
                () => {

                    const current =
                        propertyMainImage.src;

                    propertyMainImage.src =
                        absoluteImageUrl(imageUrl);

                    propertyMainImage.hidden =
                        false;

                    propertyMainImagePlaceholder.hidden =
                        true;

                    image.src = current;
                }
            );

            image.onerror = () => {
                image.remove();
            };

            propertyGallerySide.appendChild(
                image
            );
        });
}

/* ============================================================
   AMENITIES
   ============================================================ */

function renderAmenities(property) {

    let amenities =
        property.amenities ||
        property.Amenities ||
        property.features ||
        property.Features ||
        [];

    if (typeof amenities === "string") {
        amenities =
            amenities
                .split(",")
                .map(item => item.trim())
                .filter(Boolean);
    }

    if (!Array.isArray(amenities)) {
        amenities = [];
    }

    if (!amenities.length) {
        propertyFeaturesSection.hidden =
            true;
        return;
    }

    propertyFeaturesSection.hidden =
        false;

    propertyAmenities.innerHTML = "";

    amenities.forEach(item => {

        const name =
            typeof item === "string"
                ? item
                : item.name ||
                  item.Name ||
                  item.feature ||
                  item.Feature;

        if (!name) {
            return;
        }

        const element =
            document.createElement("span");

        element.className =
            "property-amenity";

        element.textContent =
            `✓ ${name}`;

        propertyAmenities.appendChild(
            element
        );
    });
}

/* ============================================================
   OWNER / AGENT
   ============================================================ */

function renderOwner(property) {

    const owner =
        property.owner ||
        property.Owner ||
        property.agent ||
        property.Agent ||
        null;

    if (!owner) {
        agentName.textContent =
            "HavenGH Property Owner";

        agentVerification.textContent =
            "HavenGH verified listing";

        return;
    }

    const profile =
        owner.profile ||
        owner.Profile ||
        {};

    const name =
        profile.fullName ||
        profile.FullName ||
        owner.fullName ||
        owner.FullName ||
        owner.businessName ||
        owner.BusinessName ||
        owner.email ||
        owner.Email ||
        "HavenGH User";

    agentName.textContent =
        name;

    const role =
        owner.role ||
        owner.Role ||
        "Property Owner";

    const verified =
        owner.isIdentityVerified ??
        owner.IsIdentityVerified ??
        owner.identityVerified ??
        owner.IdentityVerified ??
        false;

    agentVerification.textContent =
        verified
            ? `${role} • Identity verified`
            : `${role} • HavenGH member`;

    /* --------------------------------------------------------
       AVATAR
       -------------------------------------------------------- */

    const avatar =
        profile.avatarUrl ||
        profile.AvatarUrl ||
        owner.avatarUrl ||
        owner.AvatarUrl;

    if (avatar) {

        agentImage.src =
            absoluteImageUrl(avatar);

        agentImage.hidden = false;
        agentImagePlaceholder.hidden =
            true;

        agentImage.onerror = () => {
            agentImage.hidden = true;
            agentImagePlaceholder.hidden =
                false;
        };
    }

    /* --------------------------------------------------------
       PHONE
       -------------------------------------------------------- */

    const phone =
        owner.phone ||
        owner.Phone ||
        profile.phone ||
        profile.Phone;

    if (phone) {

        callButton.href =
            `tel:${phone}`;

        callButton.hidden =
            false;
    }

    /* --------------------------------------------------------
       WHATSAPP
       -------------------------------------------------------- */

    const whatsapp =
        profile.whatsAppNumber ||
        profile.WhatsAppNumber ||
        owner.whatsAppNumber ||
        owner.WhatsAppNumber ||
        owner.whatsappNumber ||
        owner.WhatsApp;

    if (whatsapp) {

        const whatsappNumber =
            normalizeGhanaPhone(
                whatsapp
            );

        whatsappButton.href =
            `https://wa.me/${whatsappNumber}`;

        whatsappButton.hidden =
            false;
    }

    /* --------------------------------------------------------
       OWNER PROPERTY COUNT
       -------------------------------------------------------- */

    const propertyCount =
        owner.propertyCount ??
        owner.PropertyCount ??
        owner.propertiesCount ??
        owner.PropertiesCount;

    if (propertyCount != null) {
        ownerPropertyCount.textContent =
            propertyCount;
    }

    /* --------------------------------------------------------
       RATING
       -------------------------------------------------------- */

    const rating =
        owner.rating ??
        owner.Rating ??
        owner.averageRating ??
        owner.AverageRating;

    if (rating != null) {
        agentRating.textContent =
            Number(rating).toFixed(1);
    }
}

function normalizeGhanaPhone(phone) {

    let value =
        String(phone)
            .replace(/[^\d+]/g, "");

    if (value.startsWith("+")) {
        return value.substring(1);
    }

    if (value.startsWith("233")) {
        return value;
    }

    if (value.startsWith("0")) {
        return `233${value.substring(1)}`;
    }

    return value;
}

/* ============================================================
   RENTAL REQUEST
   ============================================================ */

function requestRentalProperty(propertyId) {

    if (!propertyId) {
        return;
    }

    const token = getToken();

    if (!token) {

        const returnUrl =
            `property.html?id=${encodeURIComponent(
                propertyId
            )}`;

        window.location.href =
            `login.html?returnUrl=${encodeURIComponent(
                returnUrl
            )}`;

        return;
    }

    window.location.href =
        `tenant-request.html?propertyId=${encodeURIComponent(
            propertyId
        )}&request=true`;
}

/* ============================================================
   SIMILAR PROPERTIES
   ============================================================ */

async function loadSimilarProperties(currentProperty) {

    try {

        const response =
            await fetch(PROPERTY_API);

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        const properties =
            Array.isArray(data)
                ? data
                : data.properties ||
                  data.items ||
                  [];

        const currentId =
            currentProperty.propertyId ??
            currentProperty.PropertyId;

        const currentType =
            String(
                currentProperty.propertyType ??
                currentProperty.PropertyType ??
                ""
            ).toLowerCase();

        const similar =
            properties
                .filter(property => {

                    const id =
                        property.propertyId ??
                        property.PropertyId;

                    if (
                        Number(id) ===
                        Number(currentId)
                    ) {
                        return false;
                    }

                    const status =
                        String(
                            property.status ??
                            property.Status ??
                            ""
                        ).toLowerCase();

                    if (status !== "published") {
                        return false;
                    }

                    return true;
                })
                .sort((a, b) => {

                    const aType =
                        String(
                            a.propertyType ??
                            a.PropertyType ??
                            ""
                        ).toLowerCase();

                    const bType =
                        String(
                            b.propertyType ??
                            b.PropertyType ??
                            ""
                        ).toLowerCase();

                    return (
                        Number(bType === currentType) -
                        Number(aType === currentType)
                    );
                })
                .slice(0, 3);

        if (!similar.length) {
            similarSection.hidden = true;
            return;
        }

        similarSection.hidden = false;
        similarGrid.innerHTML = "";

        similar.forEach(property => {

            similarGrid.appendChild(
                createSimilarCard(property)
            );
        });

    } catch (error) {

        console.warn(
            "Similar properties unavailable:",
            error
        );
    }
}

function createSimilarCard(property) {

    const id =
        property.propertyId ??
        property.PropertyId;

    const title =
        property.title ??
        property.Title ??
        "Property";

    const price =
        property.price ??
        property.Price;

    const type =
        property.propertyType ??
        property.PropertyType ??
        "Property";

    const location =
        getLocationText(
            property.location ||
            property.Location
        );

    let image =
        property.primaryImage ||
        property.PrimaryImage;

    if (!image) {

        const images =
            property.images ||
            property.Images ||
            property.propertyImages ||
            property.PropertyImages ||
            [];

        if (Array.isArray(images) &&
            images.length) {

            const first =
                images[0];

            image =
                typeof first === "string"
                    ? first
                    : first.imageUrl ||
                      first.ImageUrl;
        }
    }

    const card =
        document.createElement("article");

    card.className =
        "similar-property-card";

    card.innerHTML = `
        <a
            href="property.html?id=${encodeURIComponent(id)}"
            class="similar-property-image-link"
        >
            <img
                src="${escapeHtml(
                    absoluteImageUrl(image)
                )}"
                alt="${escapeHtml(title)}"
                loading="lazy"
            >
        </a>

        <div class="similar-property-content">

            <span class="similar-property-type">
                ${escapeHtml(type)}
            </span>

            <h3>
                <a
                    href="property.html?id=${encodeURIComponent(id)}"
                >
                    ${escapeHtml(title)}
                </a>
            </h3>

            <p class="similar-property-location">
                ${escapeHtml(location)}
            </p>

            <strong class="similar-property-price">
                GH₵${escapeHtml(
                    formatPrice(price)
                )}
            </strong>

        </div>
    `;

    return card;
}

/* ============================================================
   ERROR
   ============================================================ */

function showError(message) {

    propertyContent.hidden = true;

    propertyError.hidden = false;

    propertyErrorMessage.textContent =
        message;
}

/* ============================================================
   FOOTER YEAR
   ============================================================ */

function setCurrentYear() {

    document
        .querySelectorAll(".current-year")
        .forEach(element => {

            element.textContent =
                new Date().getFullYear();
        });
}

/* ============================================================
   START
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setCurrentYear();

        loadProperty();
    }
);