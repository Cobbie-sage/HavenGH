"use strict";

/* ============================================================
   HavenGH Stay Host Profile
   Complete API Integration
   ============================================================ */

const HOST_PROFILE_API = "http://localhost:5073/api/Auth";


/* ============================================================
   AUTH
   ============================================================ */

function getHostProfileToken() {
    return (
        sessionStorage.getItem("havenGH_token") ||
        localStorage.getItem("havenGH_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken")
    );
}


function clearHostProfileSession() {
    sessionStorage.removeItem("havenGH_token");
    sessionStorage.removeItem("token");

    localStorage.removeItem("havenGH_token");
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
}


function redirectHostToLogin() {
    clearHostProfileSession();
    window.location.href = "login.html";
}


/* ============================================================
   API REQUEST
   ============================================================ */

async function hostProfileRequest(endpoint, options = {}) {

    const token = getHostProfileToken();

    if (!token) {
        redirectHostToLogin();
        throw new Error("Authentication required.");
    }

    const headers = {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
    };

    if (options.body) {
        headers["Content-Type"] = "application/json";
    }

    if (options.headers) {
        Object.assign(headers, options.headers);
    }

    const response = await fetch(
        `${HOST_PROFILE_API}${endpoint}`,
        {
            ...options,
            headers
        }
    );

    /* --------------------------------------------------------
       AUTHENTICATION FAILURE
       -------------------------------------------------------- */

    if (response.status === 401) {
        redirectHostToLogin();
        throw new Error("Your session has expired.");
    }

    /* --------------------------------------------------------
       READ RESPONSE
       -------------------------------------------------------- */

    let data = null;

    try {
        data = await response.json();
    }
    catch {
        data = null;
    }

    /* --------------------------------------------------------
       OTHER API ERRORS
       -------------------------------------------------------- */

    if (!response.ok) {

        throw new Error(
            data?.message ||
            data?.error ||
            "Unable to complete the request."
        );
    }

    return data;
}


/* ============================================================
   INITIALIZE
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    const form =
        document.getElementById("hostProfileForm");

    if (!form) {
        return;
    }

    loadHostProfile();

    form.addEventListener(
        "submit",
        saveHostProfile
    );

    setupAvatar();

    setupLogout();

});


/* ============================================================
   LOAD PROFILE
   GET /api/Auth/me
   ============================================================ */

async function loadHostProfile() {

    setPageLoading(true);

    try {

        const account =
            await hostProfileRequest(
                "/me",
                {
                    method: "GET"
                }
            );

        populateHostProfile(account);

    }
    catch (error) {

        console.error(
            "Host profile loading error:",
            error
        );

        showMessage(
            "Unable to load your profile. " +
            error.message,
            "error"
        );

    }
    finally {

        setPageLoading(false);

    }
}


/* ============================================================
   POPULATE PROFILE
   ============================================================ */

function populateHostProfile(account) {

    /*
       The existing /api/Auth/me response may expose
       profile information through "profile".
    */

    const profile =
        account?.profile || {};

    const fullName =
        profile.fullName ||
        account?.fullName ||
        "";

    /* --------------------------------------------------------
       SPLIT FULL NAME
       -------------------------------------------------------- */

    const parts =
        fullName
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    const firstName =
        parts[0] || "";

    const lastName =
        parts.slice(1).join(" ") || "";


    /* --------------------------------------------------------
       PERSONAL INFORMATION
       -------------------------------------------------------- */

    setValue(
        "firstName",
        firstName
    );

    setValue(
        "lastName",
        lastName
    );


    /* --------------------------------------------------------
       EMAIL
       READ ONLY
       -------------------------------------------------------- */

    setValue(
        "email",
        account?.email || ""
    );


    /* --------------------------------------------------------
       PHONE
       -------------------------------------------------------- */

    setValue(
        "phone",
        account?.phone ||
        profile.phone ||
        ""
    );


    /* --------------------------------------------------------
       BIO / ABOUT
       -------------------------------------------------------- */

    setValue(
        "bio",
        profile.about ||
        account?.about ||
        ""
    );


    /* --------------------------------------------------------
       BUSINESS NAME
       -------------------------------------------------------- */

    setValue(
        "businessName",
        profile.businessName ||
        account?.businessName ||
        ""
    );


    /* --------------------------------------------------------
       WHATSAPP
       -------------------------------------------------------- */

    setValue(
        "whatsapp",
        profile.whatsAppNumber ||
        account?.whatsAppNumber ||
        ""
    );


    /* --------------------------------------------------------
       HEADER NAME
       -------------------------------------------------------- */

    const displayName =
        profile.businessName ||
        account?.businessName ||
        fullName ||
        "Stay Host";

    const profileName =
        document.getElementById(
            "profileName"
        );

    if (profileName) {

        profileName.textContent =
            displayName;

    }


    /* --------------------------------------------------------
       HEADER EMAIL
       -------------------------------------------------------- */

    const profileEmail =
        document.getElementById(
            "profileEmail"
        );

    if (profileEmail) {

        profileEmail.textContent =
            account?.email ||
            "Host account";

    }


    /* --------------------------------------------------------
       AVATAR
       -------------------------------------------------------- */

    updateAvatar(
        firstName,
        lastName
    );


    /* --------------------------------------------------------
       VERIFICATION
       -------------------------------------------------------- */

    updateVerification(
        account
    );


    /* --------------------------------------------------------
       ACCOUNT STATUS
       -------------------------------------------------------- */

    updateAccountStatus(
        account
    );


    /* --------------------------------------------------------
       MEMBER SINCE
       -------------------------------------------------------- */

    updateMemberSince(
        account?.createdAt
    );

}


/* ============================================================
   SAVE PROFILE
   PUT /api/Auth/profile
   ============================================================ */

async function saveHostProfile(event) {

    event.preventDefault();

    const firstName =
        getValue("firstName");

    const lastName =
        getValue("lastName");

    const phone =
        getValue("phone");

    const bio =
        getValue("bio");

    const businessName =
        getValue("businessName");

    const whatsapp =
        getValue("whatsapp");


    /* --------------------------------------------------------
       BUILD FULL NAME
       -------------------------------------------------------- */

    const fullName =
        `${firstName} ${lastName}`
            .trim();


    /* --------------------------------------------------------
       VALIDATION
       -------------------------------------------------------- */

    if (!firstName) {

        showMessage(
            "Please enter your first name.",
            "error"
        );

        return;
    }


    if (!lastName) {

        showMessage(
            "Please enter your last name.",
            "error"
        );

        return;
    }


    /* --------------------------------------------------------
       SAVE BUTTON
       -------------------------------------------------------- */

    const saveButton =
        document.querySelector(
            "#hostProfileForm .save-btn"
        );

    setButtonLoading(
        saveButton,
        true
    );


    try {

        /*
           IMPORTANT:

           Email is intentionally NOT included.

           Email is read-only and should not be changed
           through this profile endpoint.
        */

        const result =
            await hostProfileRequest(
                "/profile",
                {
                    method: "PUT",

                    body: JSON.stringify({

                        fullName:

                            fullName,

                        businessName:

                            businessName ||
                            null,

                        phone:

                            phone ||
                            null,

                        about:

                            bio ||
                            null,

                        whatsAppNumber:

                            whatsapp ||
                            null

                    })
                }
            );


        /* ----------------------------------------------------
           SUCCESS
           ---------------------------------------------------- */

        showMessage(
            result?.message ||
            "Profile information saved successfully.",
            "success"
        );


        /*
           Reload from the API.

           This ensures that what we display is what
           the server actually saved.
        */

        await loadHostProfile();

    }
    catch (error) {

        console.error(
            "Host profile save error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to save your profile.",
            "error"
        );

    }
    finally {

        setButtonLoading(
            saveButton,
            false
        );

    }
}


/* ============================================================
   VERIFICATION STATUS
   ============================================================ */

function updateVerification(account) {

    /*
       Supports either of the classes used by the page.
    */

    const badge =
        document.querySelector(
            ".verified-host"
        ) ||
        document.querySelector(
            ".verified-badge"
        );

    if (!badge) {
        return;
    }


    /* --------------------------------------------------------
       IDENTITY VERIFIED
       -------------------------------------------------------- */

    if (account?.isIdentityVerified === true) {

        badge.textContent =
            "✓ Identity Verified";

        badge.classList.add(
            "verified"
        );

        return;
    }


    /* --------------------------------------------------------
       EMAIL VERIFIED
       -------------------------------------------------------- */

    if (account?.isEmailVerified === true) {

        badge.textContent =
            "✓ Email Verified";

        badge.classList.add(
            "verified"
        );

        return;
    }


    /* --------------------------------------------------------
       NOT VERIFIED
       -------------------------------------------------------- */

    badge.textContent =
        "Verification Pending";

    badge.classList.remove(
        "verified"
    );

}


/* ============================================================
   ACCOUNT STATUS
   ============================================================ */

function updateAccountStatus(account) {

    const statusElements =
        document.querySelectorAll(
            ".profile-item strong"
        );

    if (!statusElements.length) {
        return;
    }


    /*
       Existing sidebar:

       0 = Verification
       1 = Host Status
       2 = Subscription
       3 = Member Since

       Subscription is intentionally NOT modified because
       the confirmed /api/Auth/me response does not provide
       Stay Host subscription information.
    */


    /* --------------------------------------------------------
       VERIFICATION
       -------------------------------------------------------- */

    if (statusElements[0]) {

        if (
            account?.isIdentityVerified === true
        ) {

            statusElements[0].textContent =
                "Verified";

        }
        else if (
            account?.isEmailVerified === true
        ) {

            statusElements[0].textContent =
                "Email Verified";

        }
        else {

            statusElements[0].textContent =
                "Pending";

        }

    }


    /* --------------------------------------------------------
       HOST STATUS
       -------------------------------------------------------- */

    if (statusElements[1]) {

        const active =
            account?.isActive !== false;

        statusElements[1].textContent =
            active
                ? "Active"
                : "Inactive";

        statusElements[1].classList.toggle(
            "status",
            active
        );

    }

}


/* ============================================================
   MEMBER SINCE
   ============================================================ */

function updateMemberSince(createdAt) {

    if (!createdAt) {
        return;
    }

    const date =
        new Date(createdAt);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return;
    }


    const elements =
        document.querySelectorAll(
            ".profile-item strong"
        );

    if (elements[3]) {

        elements[3].textContent =
            date.toLocaleDateString(
                "en-GH",
                {
                    month: "short",
                    year: "numeric"
                }
            );

    }

}


/* ============================================================
   AVATAR
   ============================================================ */

function setupAvatar() {

    const firstName =
        document.getElementById(
            "firstName"
        );

    const lastName =
        document.getElementById(
            "lastName"
        );


    if (!firstName || !lastName) {
        return;
    }


    firstName.addEventListener(
        "input",
        updateAvatarFromInputs
    );

    lastName.addEventListener(
        "input",
        updateAvatarFromInputs
    );

}


function updateAvatarFromInputs() {

    updateAvatar(
        getValue("firstName"),
        getValue("lastName")
    );

}


function updateAvatar(
    firstName,
    lastName
) {

    const avatar =
        document.getElementById(
            "hostAvatar"
        );

    if (!avatar) {
        return;
    }


    const first =
        (firstName || "")
            .trim()
            .charAt(0);

    const last =
        (lastName || "")
            .trim()
            .charAt(0);


    let initials =
        `${first}${last}`
            .toUpperCase();


    if (!initials) {
        initials = "HG";
    }


    avatar.textContent =
        initials;

}


/* ============================================================
   LOG OUT
   ============================================================ */

function setupLogout() {

    const logoutLinks =
        document.querySelectorAll(
            ".logout-link"
        );

    if (!logoutLinks.length) {
        return;
    }


    logoutLinks.forEach(
        logoutLink => {

            logoutLink.addEventListener(
                "click",
                function(event) {

                    event.preventDefault();

                    clearHostProfileSession();

                    window.location.href =
                        "login.html";

                }
            );

        }
    );

}


/* ============================================================
   UI HELPERS
   ============================================================ */

function getValue(id) {

    const element =
        document.getElementById(id);

    return element
        ? element.value.trim()
        : "";

}


function setValue(
    id,
    value
) {

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
    message,
    type = "success"
) {

    const element =
        document.getElementById(
            "successMessage"
        );

    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        "success-message";


    element.classList.add(
        type
    );


    element.style.display =
        "block";


    clearTimeout(
        element._timer
    );


    element._timer =
        setTimeout(
            () => {

                element.style.display =
                    "none";

            },
            5000
        );

}


/* ============================================================
   BUTTON LOADING
   ============================================================ */

function setButtonLoading(
    button,
    loading
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
            "Saving...";

    }
    else {

        button.disabled =
            false;

        button.textContent =
            button.dataset.originalText ||
            "Save Profile";

    }

}


/* ============================================================
   PAGE LOADING
   ============================================================ */

function setPageLoading(
    loading
) {

    const form =
        document.getElementById(
            "hostProfileForm"
        );

    if (!form) {
        return;
    }


    if (loading) {

        form.classList.add(
            "loading"
        );

    }
    else {

        form.classList.remove(
            "loading"
        );

    }

}