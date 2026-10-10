/* ============================================================
   HavenGH - Account Settings
   Dedicated Account Settings API connection
   ============================================================ */

"use strict";

/* ============================================================
   API
   ============================================================ */

const ACCOUNT_API_BASE_URL = "http://localhost:5073/api/Account";


/* ============================================================
   AUTH TOKEN
   Supports both sessionStorage and localStorage
   ============================================================ */

function getAccountAuthToken() {
    return (
        sessionStorage.getItem("havenGH_token") ||
        localStorage.getItem("havenGH_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken")
    );
}


/* ============================================================
   CLEAR SESSION
   ============================================================ */

function clearAccountSession() {

    sessionStorage.removeItem("havenGH_token");

    localStorage.removeItem("havenGH_token");
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
}


/* ============================================================
   REDIRECT TO LOGIN
   ============================================================ */

function redirectToAccountLogin() {

    clearAccountSession();

    window.location.href = "login.html";
}


/* ============================================================
   API REQUEST
   ============================================================ */

async function accountApiRequest(endpoint, options = {}) {

    const token = getAccountAuthToken();

    if (!token) {
        redirectToAccountLogin();
        throw new Error("Authentication required.");
    }

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        "Authorization": `Bearer ${token}`
    };

    const response = await fetch(
        `${ACCOUNT_API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );

    if (response.status === 401) {

        redirectToAccountLogin();

        throw new Error("Your session has expired.");
    }

    let data = null;

    try {
        data = await response.json();
    }
    catch {
        data = null;
    }

    if (!response.ok) {

        throw new Error(
            data?.message ||
            "Something went wrong. Please try again."
        );
    }

    return data;
}


/* ============================================================
   DOM READY
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    /*
       Only run on Account Settings page.
    */

    if (!document.getElementById("savePersonal")) {
        return;
    }

    initializeAccountSettings();

});


/* ============================================================
   INITIALIZE
   ============================================================ */

async function initializeAccountSettings() {

    try {

        await loadAccount();

    }
    catch (error) {

        console.error(
            "Account Settings initialization error:",
            error
        );

        showMessage(
            "personalMessage",
            error.message ||
            "Unable to load your account.",
            "error"
        );
    }


    setupPersonalForm();

    setupBusinessForm();

    setupPreferences();

    setupDeactivateAccount();

}


/* ============================================================
   LOAD ACCOUNT
   GET /api/Account/me
   ============================================================ */

async function loadAccount() {

    const account =
        await accountApiRequest("/me", {
            method: "GET"
        });

    console.log(
        "HavenGH account loaded:",
        account
    );

    populateAccount(account);
}


/* ============================================================
   POPULATE ACCOUNT
   ============================================================ */

function populateAccount(account) {

    if (!account) {
        return;
    }

    const profile =
        account.profile || {};


    /* --------------------------------------------------------
       Full Name
       -------------------------------------------------------- */

    const fullName =
        profile.fullName ||
        "";


    const nameParts =
        fullName
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    const firstName =
        nameParts.length > 0
            ? nameParts[0]
            : "";


    const lastName =
        nameParts.length > 1
            ? nameParts.slice(1).join(" ")
            : "";


    setValue(
        "firstName",
        firstName
    );

    setValue(
        "lastName",
        lastName
    );


    /* --------------------------------------------------------
       Email
       -------------------------------------------------------- */

    setValue(
        "email",
        account.email || ""
    );


    /* --------------------------------------------------------
       Phone
       -------------------------------------------------------- */

    setValue(
        "phone",
        account.phone || ""
    );


    /* --------------------------------------------------------
       Business Name
       -------------------------------------------------------- */

    setValue(
        "businessName",
        profile.businessName || ""
    );


    /* --------------------------------------------------------
       Description / About
       -------------------------------------------------------- */

    setValue(
        "description",
        profile.about || ""
    );


    /* --------------------------------------------------------
       Host role
       -------------------------------------------------------- */

    const hostType =
        document.getElementById("hostType");

    if (hostType) {

        /*
           The API currently doesn't have a hostType field.

           Therefore we don't overwrite the existing selection.
        */
    }


    /* --------------------------------------------------------
       Profile summary
       -------------------------------------------------------- */

    updateAccountSummary(account);

}


/* ============================================================
   ACCOUNT SUMMARY
   ============================================================ */

function updateAccountSummary(account) {

    const roleName =
        account.roleName ||
        "Host";


    const roleElements =
        document.querySelectorAll(
            ".account-role, .profile-role, .host-role"
        );


    roleElements.forEach(element => {

        element.textContent =
            roleName;

    });


    const verificationElements =
        document.querySelectorAll(
            ".account-verification"
        );


    verificationElements.forEach(element => {

        if (account.isIdentityVerified) {

            element.textContent =
                "Account verified";

        }
        else if (account.isEmailVerified) {

            element.textContent =
                "Email verified";

        }
        else {

            element.textContent =
                "Account verification pending";

        }

    });
}


/* ============================================================
   PERSONAL INFORMATION
   ============================================================ */

function setupPersonalForm() {

    const saveButton =
        document.getElementById("savePersonal");

    const cancelButton =
        document.getElementById("cancelPersonal");


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            savePersonalInformation
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            async () => {

                try {

                    await loadAccount();

                    showMessage(
                        "personalMessage",
                        "Changes cancelled.",
                        "success"
                    );

                }
                catch (error) {

                    showMessage(
                        "personalMessage",
                        error.message,
                        "error"
                    );

                }

            }
        );

    }
}


/* ============================================================
   SAVE PERSONAL INFORMATION
   PUT /api/Account/me
   ============================================================ */

async function savePersonalInformation() {

    const firstName =
        getValue("firstName");

    const lastName =
        getValue("lastName");

    const phone =
        getValue("phone");


    const fullName =
        `${firstName} ${lastName}`
            .trim();


    if (!fullName) {

        showMessage(
            "personalMessage",
            "Please enter your name.",
            "error"
        );

        return;
    }


    const button =
        document.getElementById("savePersonal");


    setButtonLoading(
        button,
        true,
        "Saving..."
    );


    try {

        const data =
            await accountApiRequest(
                "/me",
                {
                    method: "PUT",

                    body: JSON.stringify({
                        fullName,
                        phone
                    })
                }
            );


        showMessage(
            "personalMessage",
            data.message ||
            "Personal information saved successfully.",
            "success"
        );


        await loadAccount();

    }
    catch (error) {

        console.error(
            "Save personal information error:",
            error
        );

        showMessage(
            "personalMessage",
            error.message,
            "error"
        );

    }
    finally {

        setButtonLoading(
            button,
            false,
            "Save Changes"
        );

    }
}


/* ============================================================
   BUSINESS INFORMATION
   ============================================================ */

function setupBusinessForm() {

    const saveButton =
        document.getElementById("saveBusiness");


    if (!saveButton) {
        return;
    }


    saveButton.addEventListener(
        "click",
        saveBusinessInformation
    );

}


/* ============================================================
   SAVE BUSINESS INFORMATION
   PUT /api/Account/me
   ============================================================ */

async function saveBusinessInformation() {

    const businessName =
        getValue("businessName");

    const description =
        getValue("description");


    const button =
        document.getElementById("saveBusiness");


    setButtonLoading(
        button,
        true,
        "Saving..."
    );


    try {

        const data =
            await accountApiRequest(
                "/me",
                {
                    method: "PUT",

                    body: JSON.stringify({
                        businessName,
                        about: description
                    })
                }
            );


        showMessage(
            "businessMessage",
            data.message ||
            "Business information saved successfully.",
            "success"
        );


        await loadAccount();

    }
    catch (error) {

        console.error(
            "Save business information error:",
            error
        );

        showMessage(
            "businessMessage",
            error.message,
            "error"
        );

    }
    finally {

        setButtonLoading(
            button,
            false,
            "Save Changes"
        );

    }
}


/* ============================================================
   PREFERENCES
   ============================================================ */

function setupPreferences() {

    const saveButton =
        document.getElementById("savePreferences");


    if (!saveButton) {
        return;
    }


    saveButton.addEventListener(
        "click",
        savePreferences
    );

}


/* ============================================================
   SAVE PREFERENCES
   ============================================================ */

async function savePreferences() {

    /*
       Language and currency are currently not represented
       by AccountController.

       Do not pretend these are being saved to the API yet.
    */

    showMessage(
        "personalMessage",
        "Language and currency preferences are not connected to the API yet.",
        "error"
    );

}


/* ============================================================
   DEACTIVATE ACCOUNT
   ============================================================ */

function setupDeactivateAccount() {

    const button =
        document.getElementById(
            "deactivateAccount"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        deactivateAccount
    );

}


/* ============================================================
   DEACTIVATE
   ============================================================ */

async function deactivateAccount() {

    const confirmed =
        window.confirm(
            "Are you sure you want to deactivate your account?"
        );


    if (!confirmed) {
        return;
    }


    /*
       AccountController currently does not provide
       a deactivate endpoint.

       Therefore we do not send a fake API request.
    */

    alert(
        "Account deactivation is not connected to the API yet."
    );

}


/* ============================================================
   HELPERS
   ============================================================ */

function getValue(id) {

    const element =
        document.getElementById(id);

    return element
        ? element.value.trim()
        : "";
}


function setValue(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.value =
            value ?? "";

    }
}


/* ============================================================
   MESSAGE
   ============================================================ */

function showMessage(
    elementId,
    message,
    type = "success"
) {

    const element =
        document.getElementById(elementId);


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.classList.remove(
        "success",
        "error"
    );


    element.classList.add(
        type
    );


    element.style.display =
        "block";


    clearTimeout(
        element._hideTimer
    );


    element._hideTimer =
        setTimeout(() => {

            element.style.display =
                "";

        }, 5000);

}


/* ============================================================
   BUTTON LOADING
   ============================================================ */

function setButtonLoading(
    button,
    loading,
    loadingText
) {

    if (!button) {
        return;
    }


    if (loading) {

        button.dataset.originalText =
            button.textContent;

        button.disabled =
            true;

        button.textContent =
            loadingText;

    }
    else {

        button.disabled =
            false;

        button.textContent =
            button.dataset.originalText ||
            "Save Changes";

    }

}