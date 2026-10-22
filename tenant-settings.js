"use strict";

/* ============================================================
   HAVENGH - TENANT SETTINGS
   Real API Connection
   ============================================================ */

const API_BASE_URL = "https://havenghapi-production.up.railway.app";

const AUTH_ME_API =
    `${API_BASE_URL}/api/Auth/me`;

const CHANGE_PASSWORD_API =
    `${API_BASE_URL}/api/Auth/change-password`;

const TOKEN_KEY =
    "havenGH_token";


/* ============================================================
   AUTHENTICATION
   ============================================================ */

function getToken() {

    return (
        localStorage.getItem(TOKEN_KEY) ||
        sessionStorage.getItem(TOKEN_KEY) ||
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        ""
    );

}


/* ============================================================
   INITIALIZE
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupMobileMenu();

        setupLogout();

        setupChangePassword();

        setupNotificationSettings();

        verifyAuthentication();

    }
);


/* ============================================================
   VERIFY AUTHENTICATION
   ============================================================ */

async function verifyAuthentication() {

    const token = getToken();

    if (!token) {

        redirectToLogin();

        return;

    }


    try {

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


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            logoutUser();

            return;

        }


        if (!response.ok) {

            throw new Error(
                "Unable to verify your account."
            );

        }


        const user =
            await response.json();


        console.log(
            "HavenGH authenticated user:",
            user
        );


    }
    catch (error) {

        console.error(
            "Authentication verification failed:",
            error
        );

    }

}


/* ============================================================
   CHANGE PASSWORD
   ============================================================ */

function setupChangePassword() {

    const openButton =
        document.getElementById(
            "change-password-button"
        );

    const cancelButton =
        document.getElementById(
            "cancel-password-change"
        );

    const form =
        document.getElementById(
            "password-change-form"
        );

    const formContainer =
        document.getElementById(
            "change-password-form"
        );


    if (
        !openButton ||
        !form ||
        !formContainer
    ) {

        return;

    }


    openButton.addEventListener(
        "click",
        () => {

            formContainer.style.display =
                "block";

            openButton.style.display =
                "none";

            const currentPassword =
                document.getElementById(
                    "current-password"
                );

            if (currentPassword) {

                currentPassword.focus();

            }

        }
    );


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            () => {

                form.reset();

                formContainer.style.display =
                    "none";

                openButton.style.display =
                    "";

                hidePasswordMessage();

            }
        );

    }


    form.addEventListener(
        "submit",
        changePassword
    );

}


/* ============================================================
   SUBMIT PASSWORD CHANGE
   ============================================================ */

async function changePassword(event) {

    event.preventDefault();


    const currentPassword =
        document.getElementById(
            "current-password"
        )?.value.trim();


    const newPassword =
        document.getElementById(
            "new-password"
        )?.value;


    const confirmPassword =
        document.getElementById(
            "confirm-password"
        )?.value;


    const submitButton =
        event.target.querySelector(
            'button[type="submit"]'
        );


    if (!currentPassword ||
        !newPassword ||
        !confirmPassword) {

        showPasswordMessage(
            "Please complete all password fields.",
            "error"
        );

        return;

    }


    if (newPassword.length < 8) {

        showPasswordMessage(
            "Your new password must be at least 8 characters.",
            "error"
        );

        return;

    }


    if (newPassword !== confirmPassword) {

        showPasswordMessage(
            "The new passwords do not match.",
            "error"
        );

        return;

    }


    const token =
        getToken();


    if (!token) {

        redirectToLogin();

        return;

    }


    if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
            "Updating...";

    }


    try {

        const response =
            await fetch(
                CHANGE_PASSWORD_API,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({

                        currentPassword:
                            currentPassword,

                        newPassword:
                            newPassword,

                        confirmPassword:
                            confirmPassword

                    })
                }
            );


        let data = null;

        try {

            data =
                await response.json();

        }
        catch {

            data = null;

        }


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            logoutUser();

            return;

        }


        if (!response.ok) {

            const message =
                data?.message ||
                data?.error ||
                data?.title ||
                "Unable to change your password.";

            throw new Error(message);

        }


        showPasswordMessage(
            data?.message ||
            "Your password has been changed successfully.",
            "success"
        );


        event.target.reset();


    }
    catch (error) {

        console.error(
            "HavenGH password change error:",
            error
        );


        showPasswordMessage(
            error.message ||
            "Unable to change your password.",
            "error"
        );

    }
    finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Update Password";

        }

    }

}


/* ============================================================
   PASSWORD MESSAGE
   ============================================================ */

function showPasswordMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "password-change-message"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;

    element.className =
        `password-message ${type}`;

    element.style.display =
        "block";

}


function hidePasswordMessage() {

    const element =
        document.getElementById(
            "password-change-message"
        );


    if (!element) {
        return;
    }


    element.textContent =
        "";

    element.style.display =
        "none";

}


/* ============================================================
   LOGOUT
   ============================================================ */

function setupLogout() {

    const logoutLinks =
        document.querySelectorAll(
            '[data-action="logout"]'
        );


    logoutLinks.forEach(
        logoutLink => {

            logoutLink.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    logoutUser();

                }
            );

        }
    );


    const accountLogoutButton =
        document.getElementById(
            "account-logout-button"
        );


    if (accountLogoutButton) {

        accountLogoutButton.addEventListener(
            "click",
            () => {

                logoutUser();

            }
        );

    }

}


/* ============================================================
   CLEAR AUTHENTICATION
   ============================================================ */

function logoutUser() {

    /*
        Remove the main HavenGH JWT.
    */

    localStorage.removeItem(
        "havenGH_token"
    );

    sessionStorage.removeItem(
        "havenGH_token"
    );


    /*
        Remove older fallback keys.
    */

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "accessToken"
    );


    /*
        Clear temporary HavenGH
        authentication/session information.
    */

    sessionStorage.removeItem(
        "token"
    );

    sessionStorage.removeItem(
        "accessToken"
    );


    redirectToLogin();

}


/* ============================================================
   REDIRECT TO LOGIN
   ============================================================ */

function redirectToLogin() {

    window.location.replace(
        "login.html"
    );

}


/* ============================================================
   NOTIFICATION SETTINGS
   ============================================================ */

function setupNotificationSettings() {

    const toggles =
        document.querySelectorAll(
            '.settings-card input[type="checkbox"]'
        );


    if (!toggles.length) {
        return;
    }


    const STORAGE_PREFIX =
        "havenGH_setting_";


    toggles.forEach(
        (toggle, index) => {

            const key =
                `${STORAGE_PREFIX}${index}`;


            const saved =
                localStorage.getItem(key);


            if (saved !== null) {

                toggle.checked =
                    saved === "true";

            }


            toggle.addEventListener(
                "change",
                () => {

                    localStorage.setItem(
                        key,
                        String(toggle.checked)
                    );

                }
            );

        }
    );

}


/* ============================================================
   MOBILE MENU
   ============================================================ */

function setupMobileMenu() {

    const menuButton =
        document.querySelector(
            ".dashboard-menu-button"
        );


    const sidebar =
        document.querySelector(
            ".dashboard-sidebar"
        );


    if (
        !menuButton ||
        !sidebar
    ) {

        return;

    }


    menuButton.addEventListener(
        "click",
        () => {

            const isOpen =
                sidebar.classList.toggle(
                    "mobile-open"
                );


            menuButton.setAttribute(
                "aria-expanded",
                isOpen
                    ? "true"
                    : "false"
            );

        }
    );


    sidebar
        .querySelectorAll("a")
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        sidebar.classList.remove(
                            "mobile-open"
                        );

                        menuButton.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }
                );

            }
        );

}