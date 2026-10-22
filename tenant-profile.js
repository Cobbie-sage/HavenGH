"use strict";

/* ============================================================
   HAVENGH - TENANT PROFILE
   ============================================================ */

const TENANT_PROFILE_API =
    "https://havenghapi-production.up.railway.app/api/Auth/me";

const TENANT_PROFILE_UPDATE_API =
    "https://havenghapi-production.up.railway.app/api/Auth/profile";


/* ============================================================
   INITIALIZE
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    loadTenantProfile();

    setupProfileForm();

});


/* ============================================================
   LOAD CURRENT TENANT
   ============================================================ */

async function loadTenantProfile() {

    const token =
        localStorage.getItem("havenGH_token");

    if (!token) {

        showProfileError(
            "Your session has expired. Please log in again."
        );

        return;
    }

    try {

        console.log(
            "HavenGH Tenant Profile loading..."
        );

        const response =
            await fetch(
                TENANT_PROFILE_API,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            "Bearer " + token,

                        "Accept":
                            "application/json"
                    }
                }
            );


        if (response.status === 401) {

            localStorage.removeItem(
                "havenGH_token"
            );

            showProfileError(
                "Your session has expired. Please log in again."
            );

            return;
        }


        if (!response.ok) {

            throw new Error(
                "Unable to load profile. Server returned " +
                response.status +
                "."
            );

        }


        const user =
            await response.json();


        console.log(
            "HavenGH Tenant Profile loaded successfully."
        );

        console.log(
            "Tenant profile:",
            user
        );


        displayTenantProfile(user);

    }

    catch (error) {

        console.error(
            "HavenGH Tenant Profile error:",
            error
        );

        showProfileError(
            error.message ||
            "Unable to load your profile."
        );

    }

}


/* ============================================================
   DISPLAY PROFILE
   ============================================================ */

function displayTenantProfile(user) {

    const profileName =
        document.getElementById("profile-name");

    const profileEmail =
        document.getElementById("profile-email");

    const profilePhone =
        document.getElementById("profile-phone");

    const nameInput =
        document.getElementById("tenant-name");

    const emailInput =
        document.getElementById("tenant-email");

    const phoneInput =
        document.getElementById("tenant-phone");


    /* ========================================================
       FULL NAME
       ======================================================== */

    if (profileName) {

        profileName.textContent =
            user.fullName ||
            "HavenGH Tenant";

    }


    if (nameInput) {

        nameInput.value =
            user.fullName ||
            "";

        nameInput.placeholder =
            "Enter your full name";

        nameInput.disabled =
            false;

    }


    /* ========================================================
       EMAIL
       ======================================================== */

    if (profileEmail) {

        profileEmail.textContent =
            user.email ||
            "No email";

    }


    if (emailInput) {

        emailInput.value =
            user.email ||
            "";

        emailInput.readOnly =
            true;

    }


    /* ========================================================
       PHONE
       ======================================================== */

    if (profilePhone) {

        profilePhone.textContent =
            user.phone ||
            "No phone number";

    }


    if (phoneInput) {

        phoneInput.value =
            user.phone ||
            "";

    }

}


/* ============================================================
   PROFILE FORM
   ============================================================ */

function setupProfileForm() {

    const profileForm =
        document.getElementById(
            "tenant-profile-form"
        );


    if (!profileForm) {

        console.warn(
            "Tenant profile form was not found."
        );

        return;

    }


    profileForm.addEventListener(
        "submit",
        updateTenantProfile
    );

}


/* ============================================================
   UPDATE PROFILE
   ============================================================ */

async function updateTenantProfile(event) {

    event.preventDefault();


    const token =
        localStorage.getItem("havenGH_token");


    if (!token) {

        showProfileError(
            "Your session has expired. Please log in again."
        );

        return;

    }


    const nameInput =
        document.getElementById("tenant-name");

    const phoneInput =
        document.getElementById("tenant-phone");

    const saveButton =
        document.querySelector(
            "#tenant-profile-form button[type='submit']"
        );


    const fullName =
        nameInput?.value.trim() || "";


    const phone =
        phoneInput?.value.trim() || "";


    if (!fullName) {

        alert(
            "Please enter your full name."
        );

        nameInput?.focus();

        return;

    }


    try {

        /* -------------------------------------------------
           Disable button while saving
        ------------------------------------------------- */

        if (saveButton) {

            saveButton.disabled = true;

            saveButton.textContent =
                "Saving...";

        }


        console.log(
            "HavenGH Tenant Profile saving..."
        );


        const response =
            await fetch(
                TENANT_PROFILE_UPDATE_API,
                {
                    method: "PUT",

                    headers: {
                        "Authorization":
                            "Bearer " + token,

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body: JSON.stringify({
                        fullName: fullName,
                        phone: phone
                    })
                }
            );


        /* -------------------------------------------------
           Unauthorized
        ------------------------------------------------- */

        if (response.status === 401) {

            localStorage.removeItem(
                "havenGH_token"
            );

            showProfileError(
                "Your session has expired. Please log in again."
            );

            return;

        }


        /* -------------------------------------------------
           Other API errors
        ------------------------------------------------- */

        if (!response.ok) {

            let message =
                "Unable to update your profile.";

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


        /* -------------------------------------------------
           Read updated profile
        ------------------------------------------------- */

        const updatedUser =
            await response.json();


        console.log(
            "HavenGH Tenant Profile updated successfully."
        );

        console.log(
            "Updated profile:",
            updatedUser
        );


        /* -------------------------------------------------
           Update page immediately
        ------------------------------------------------- */

        const profileName =
            document.getElementById(
                "profile-name"
            );

        const profilePhone =
            document.getElementById(
                "profile-phone"
            );


        if (profileName) {

            profileName.textContent =
                updatedUser.fullName ||
                "HavenGH Tenant";

        }


        if (profilePhone) {

            profilePhone.textContent =
                updatedUser.phone ||
                "No phone number";

        }


        if (phoneInput) {

            phoneInput.value =
                updatedUser.phone ||
                "";

        }


        alert(
            "Your profile has been updated successfully."
        );

    }

    catch (error) {

        console.error(
            "HavenGH Tenant Profile update error:",
            error
        );


        showProfileError(
            error.message ||
            "Unable to update your profile."
        );

    }

    finally {

        if (saveButton) {

            saveButton.disabled = false;

            saveButton.textContent =
                "Save Changes";

        }

    }

}


/* ============================================================
   PROFILE ERROR
   ============================================================ */

function showProfileError(message) {

    console.error(
        "Profile:",
        message
    );

    alert(message);

}