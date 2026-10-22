
document.addEventListener("DOMContentLoaded", () => {

    const form = document.querySelector(".property-form");

    if (!form) {
        return;
    }

    const API_BASE_URL = "https://havenghapi-production.up.railway.app/api";

    // ============================================================
    // AUTHENTICATION
    // ============================================================

    function getToken() {
        return localStorage.getItem("havenGH_token");
    }

    function redirectToLogin() {
        window.location.href =
            "login.html?returnUrl=" +
            encodeURIComponent(window.location.pathname);
    }

    // ============================================================
    // MESSAGE
    // ============================================================

    function showMessage(message, type = "error") {

        let box =
            document.getElementById("property-form-message");

        if (!box) {

            box = document.createElement("div");

            box.id =
                "property-form-message";

            box.style.marginBottom =
                "20px";

            box.style.padding =
                "14px 18px";

            box.style.borderRadius =
                "10px";

            form.prepend(box);
        }

        box.textContent = message;

        if (type === "success") {

            box.style.background =
                "#e7f6ee";

            box.style.color =
                "#145c38";

        } else {

            box.style.background =
                "#fdecec";

            box.style.color =
                "#8a1f1f";
        }

        box.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }

    // ============================================================
    // CHECK LOGIN
    // ============================================================

    const token = getToken();

    if (!token) {

        showMessage(
            "Please log in before adding a property."
        );

        setTimeout(() => {
            redirectToLogin();
        }, 1200);

        return;
    }

    // ============================================================
    // IMAGE PREVIEW
    // ============================================================

    const imageInput =
        document.getElementById("property-images");

    const imagePreview =
        document.getElementById("image-preview");

    if (imageInput && imagePreview) {

        imageInput.addEventListener(
            "change",
            () => {

                imagePreview.innerHTML = "";

                const files =
                    Array.from(imageInput.files);

                files.forEach((file) => {

                    if (!file.type.startsWith("image/")) {
                        return;
                    }

                    const reader =
                        new FileReader();

                    reader.onload = (event) => {

                        const wrapper =
                            document.createElement("div");

                        wrapper.className =
                            "image-preview-item";

                        const img =
                            document.createElement("img");

                        img.src =
                            event.target.result;

                        img.alt =
                            file.name;

                        wrapper.appendChild(img);

                        imagePreview.appendChild(
                            wrapper
                        );
                    };

                    reader.readAsDataURL(file);
                });
            }
        );
    }

    // ============================================================
    // FORM SUBMISSION
    // ============================================================

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const submitButton =
                form.querySelector(
                    ".publish-button"
                );

            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "Creating property...";
            }

            try {

                // ====================================================
                // BASIC INFORMATION
                // ====================================================

                const title =
                    document
                        .getElementById("property-title")
                        ?.value
                        .trim();

                const description =
                    document
                        .getElementById("description")
                        ?.value
                        .trim() || null;

                const propertyType =
                    document
                        .getElementById("property-type")
                        ?.value
                        .trim();

                // ====================================================
                // RENTAL INFORMATION
                // ====================================================

                const priceValue =
                    document
                        .getElementById("price")
                        ?.value;

                const price =
                    Number(priceValue);

                const rentalPeriod =
                    document
                        .getElementById("rental-period")
                        ?.value;

                let pricePeriod =
                    "monthly";

                if (rentalPeriod === "year") {
                    pricePeriod = "yearly";
                }

                if (rentalPeriod === "month") {
                    pricePeriod = "monthly";
                }

                const bedroomsValue =
                    document
                        .getElementById("bedrooms")
                        ?.value;

                const bathroomsValue =
                    document
                        .getElementById("bathrooms")
                        ?.value;

                const bedrooms =
                    bedroomsValue === ""
                        ? null
                        : Number(bedroomsValue);

                const bathrooms =
                    bathroomsValue === ""
                        ? null
                        : Number(bathroomsValue);

                // ====================================================
                // LOCATION
                // ====================================================

                const region =
                    document
                        .getElementById("region")
                        ?.value
                        .trim();

                const city =
                    document
                        .getElementById("city")
                        ?.value
                        .trim();

                const area =
                    document
                        .getElementById("location")
                        ?.value
                        .trim();

                const location = {

                    addressLine: null,

                    area: area,

                    city: city,

                    region: region,

                    country: "Ghana",

                    latitude: null,

                    longitude: null
                };

                // ====================================================
                // VALIDATION
                // ====================================================

                if (!title) {
                    throw new Error(
                        "Property title is required."
                    );
                }

                if (!propertyType) {
                    throw new Error(
                        "Please select a property type."
                    );
                }

                if (!Number.isFinite(price) || price < 0) {
                    throw new Error(
                        "Please enter a valid rental price."
                    );
                }

                if (!region) {
                    throw new Error(
                        "Please select a region."
                    );
                }

                if (!city) {
                    throw new Error(
                        "City / Town is required."
                    );
                }

                if (!area) {
                    throw new Error(
                        "Area / Neighbourhood is required."
                    );
                }

                // ====================================================
                // SELECTED IMAGES
                // ====================================================

                const selectedImages =
                    imageInput
                        ? Array.from(imageInput.files)
                        : [];

                // Maximum 10 MB per image
                const MAX_IMAGE_SIZE =
                    10 * 1024 * 1024;

                const allowedTypes = [
                    "image/jpeg",
                    "image/png",
                    "image/webp"
                ];

                for (const file of selectedImages) {

                    if (!allowedTypes.includes(
                        file.type.toLowerCase()
                    )) {

                        throw new Error(
                            `Invalid image type: ${file.name}. ` +
                            "Only JPG, JPEG, PNG and WEBP are allowed."
                        );
                    }

                    if (file.size > MAX_IMAGE_SIZE) {

                        throw new Error(
                            `${file.name} is larger than 10 MB.`
                        );
                    }
                }

                // ====================================================
                // CREATE PROPERTY
                // ====================================================
                //
                // IMPORTANT:
                //
                // Do NOT send ownerUserId.
                //
                // Do NOT send status.
                //
                // The backend controls both.
                //
                // The property will initially be "draft".
                // ====================================================

                const propertyData = {

                    title: title,

                    description: description,

                    propertyType: propertyType,

                    price: price,

                    pricePeriod: pricePeriod,

                    bedrooms: bedrooms,

                    bathrooms: bathrooms,

                    location: location
                };

                console.log(
                    "Creating HavenGH property:",
                    propertyData
                );

                const createResponse =
                    await fetch(
                        `${API_BASE_URL}/Properties`,
                        {
                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body:
                                JSON.stringify(
                                    propertyData
                                )
                        }
                    );

                let createResult = null;

                try {

                    createResult =
                        await createResponse.json();

                } catch {

                    createResult = null;
                }

                // ====================================================
                // AUTH ERROR
                // ====================================================

                if (createResponse.status === 401) {

                    localStorage.removeItem(
                        "havenGH_token"
                    );

                    showMessage(
                        "Your login session has expired. Please log in again."
                    );

                    setTimeout(() => {
                        redirectToLogin();
                    }, 1500);

                    return;
                }

                // ====================================================
                // FORBIDDEN
                // ====================================================

                if (createResponse.status === 403) {

                    showMessage(
                        createResult?.message ||
                        "You do not currently have permission to create a property."
                    );

                    return;
                }

                // ====================================================
                // OTHER CREATE ERROR
                // ====================================================

                if (!createResponse.ok) {

                    throw new Error(
                        createResult?.message ||
                        "Unable to create the property."
                    );
                }

                // ====================================================
                // PROPERTY ID
                // ====================================================

                const propertyId =
                    createResult?.propertyId ??
                    createResult?.PropertyId;

                if (!propertyId) {

                    console.error(
                        "Property creation response:",
                        createResult
                    );

                    throw new Error(
                        "Property was created but the property ID was not returned."
                    );
                }

                console.log(
                    "Property created:",
                    propertyId
                );

                // ====================================================
                // UPLOAD IMAGES
                // ====================================================

                if (selectedImages.length > 0) {

                    if (submitButton) {

                        submitButton.textContent =
                            `Uploading photos 0/${selectedImages.length}...`;
                    }

                    for (
                        let index = 0;
                        index < selectedImages.length;
                        index++
                    ) {

                        const file =
                            selectedImages[index];

                        const imageForm =
                            new FormData();

                        imageForm.append(
                            "image",
                            file
                        );

                        // First image is primary.
                        imageForm.append(
                            "isPrimary",
                            index === 0
                                ? "true"
                                : "false"
                        );

                        console.log(
                            `Uploading image ${index + 1}/${selectedImages.length}:`,
                            file.name
                        );

                        if (submitButton) {

                            submitButton.textContent =
                                `Uploading photos ${index + 1}/${selectedImages.length}...`;
                        }

                        const uploadResponse =
                            await fetch(
                                `${API_BASE_URL}/PropertyImages/${propertyId}/upload`,
                                {
                                    method: "POST",

                                    headers: {
                                        "Authorization":
                                            `Bearer ${token}`
                                    },

                                    body: imageForm
                                }
                            );

                        let uploadResult =
                            null;

                        try {

                            uploadResult =
                                await uploadResponse.json();

                        } catch {

                            uploadResult =
                                null;
                        }

                        if (
                            uploadResponse.status === 401
                        ) {

                            localStorage.removeItem(
                                "havenGH_token"
                            );

                            showMessage(
                                "Your login session has expired. Please log in again."
                            );

                            setTimeout(() => {
                                redirectToLogin();
                            }, 1500);

                            return;
                        }

                        if (
                            uploadResponse.status === 403
                        ) {

                            throw new Error(
                                uploadResult?.message ||
                                "You do not have permission to upload images for this property."
                            );
                        }

                        if (!uploadResponse.ok) {

                            throw new Error(
                                uploadResult?.message ||
                                `Unable to upload image: ${file.name}`
                            );
                        }

                        console.log(
                            "Image uploaded:",
                            uploadResult
                        );
                    }
                }

                // ====================================================
                // PUBLISH PROPERTY
                // ====================================================
                //
                // The backend created the property as draft.
                //
                // Now explicitly call:
                //
                // POST /api/Properties/{id}/publish
                //
                // The backend will check subscription access.
                // ====================================================

                if (submitButton) {

                    submitButton.textContent =
                        "Publishing property...";
                }

                const publishResponse =
                    await fetch(
                        `${API_BASE_URL}/Properties/${propertyId}/publish`,
                        {
                            method: "POST",

                            headers: {

                                "Authorization":
                                    `Bearer ${token}`
                            }
                        }
                    );

                let publishResult =
                    null;

                try {

                    publishResult =
                        await publishResponse.json();

                } catch {

                    publishResult =
                        null;
                }

                // ====================================================
                // PUBLISH FORBIDDEN
                // ====================================================

                if (publishResponse.status === 403) {

                    showMessage(
                        publishResult?.message ||
                        "Your property was created, but it could not be published because your current subscription does not allow publishing."
                    );

                    return;
                }

                // ====================================================
                // PUBLISH OTHER ERROR
                // ====================================================

                if (!publishResponse.ok) {

                    throw new Error(
                        publishResult?.message ||
                        "Property was created but could not be published."
                    );
                }

                // ====================================================
                // SUCCESS
                // ====================================================

                showMessage(
                    "Property created and published successfully.",
                    "success"
                );

                console.log(
                    "Property published:",
                    publishResult
                );

                // ====================================================
                // REDIRECT
                // ====================================================

                setTimeout(() => {

                    window.location.href =
                        "dashboard.html";

                }, 1200);

            } catch (error) {

                console.error(
                    "Add property error:",
                    error
                );

                showMessage(
                    error.message ||
                    "Something went wrong while creating the property."
                );

            } finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "Publish Property →";
                }
            }
        }
    );
});

