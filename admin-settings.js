
"use strict";

/* ============================================================
   HavenGH - ADMIN SETTINGS
   Admin-only Settings Page
   ============================================================ */

const ADMIN_SETTINGS_API = "http://localhost:5073/api";
const ADMIN_ME_ENDPOINT = `${ADMIN_SETTINGS_API}/Auth/me`;
const ADMIN_PASSWORD_ENDPOINT =
    `${ADMIN_SETTINGS_API}/Auth/change-password`;
const ADMIN_LOGOUT_ENDPOINT =
    `${ADMIN_SETTINGS_API}/Auth/logout`;


/* ============================================================
   TOKEN
   Uses HavenGH authentication storage
   ============================================================ */

function getAdminSettingsToken() {

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

function clearAdminSettingsSession() {

    sessionStorage.removeItem("havenGH_token");

    localStorage.removeItem("havenGH_token");
    localStorage.removeItem("token");
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("accessToken");
}


/* ============================================================
   REDIRECT TO LOGIN
   ============================================================ */

function redirectToLogin() {

    clearAdminSettingsSession();

    window.location.href = "login.html";
}


/* ============================================================
   MESSAGE
   ============================================================ */

function showAdminMessage(message, type = "error") {

    let messageBox =
        document.getElementById("admin-settings-message");

    /*
     * Create the message box if the page does not already
     * contain one.
     */

    if (!messageBox) {

        messageBox =
            document.createElement("div");

        messageBox.id =
            "admin-settings-message";

        messageBox.setAttribute(
            "role",
            "alert"
        );

        messageBox.style.padding =
            "12px 16px";

        messageBox.style.marginBottom =
            "20px";

        messageBox.style.borderRadius =
            "8px";

        const content =
            document.querySelector(".dashboard-content");

        if (content) {
            content.prepend(messageBox);
        }
    }


    messageBox.textContent = message;

    messageBox.hidden = false;

    messageBox.style.background =
        type === "success"
            ? "#e8f7ee"
            : "#fdecec";

    messageBox.style.color =
        type === "success"
            ? "#166534"
            : "#991b1b";
}


/* ============================================================
   LOAD CURRENT ADMIN
   ============================================================ */

async function loadAdminUser() {

    const token =
        getAdminSettingsToken();

    if (!token) {

        redirectToLogin();

        return null;
    }


    const response =
        await fetch(
            ADMIN_ME_ENDPOINT,
            {
                method: "GET",

                headers: {
                    "Accept":
                        "application/json",

                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


    /*
     * JWT is no longer valid.
     */

    if (response.status === 401) {

        redirectToLogin();

        return null;
    }


    if (!response.ok) {

        throw new Error(
            "Unable to verify administrator account."
        );
    }


    const user =
        await response.json();


    /*
     * IMPORTANT:
     *
     * Frontend role checking is only a UX check.
     * The API must ALSO enforce:
     *
     * [Authorize(Roles = "Admin")]
     *
     * for any Admin-only endpoints.
     */

    const role =
        String(user.role || "")
            .trim()
            .toLowerCase();


    if (role !== "admin") {

        showAdminMessage(
            "Administrator access is required.",
            "error"
        );

        setTimeout(() => {

            window.location.href =
                "dashboard.html";

        }, 1500);

        return null;
    }


    /*
     * Populate administrator identity where
     * matching elements exist.
     */

    const nameElement =
        document.getElementById(
            "dashboard-user-name"
        );

    const roleElement =
        document.getElementById(
            "dashboard-user-role"
        );


    if (nameElement) {

        nameElement.textContent =
            user.email ||
            "HavenGH Admin";
    }


    if (roleElement) {

        roleElement.textContent =
            "Administrator";
    }


    return user;
}


/* ============================================================
   CHANGE PASSWORD
   PUT /api/Auth/change-password
   ============================================================ */

async function changeAdminPassword(event) {

    event.preventDefault();


    const currentPasswordInput =
        document.getElementById(
            "current-password"
        );

    const newPasswordInput =
        document.getElementById(
            "new-password"
        );

    const confirmPasswordInput =
        document.getElementById(
            "confirm-password"
        );

    const message =
        document.getElementById(
            "password-change-message"
        );


    if (
        !currentPasswordInput ||
        !newPasswordInput ||
        !confirmPasswordInput
    ) {

        return;
    }


    const currentPassword =
        currentPasswordInput.value.trim();

    const newPassword =
        newPasswordInput.value;

    const confirmPassword =
        confirmPasswordInput.value;


    function showPasswordMessage(
        text,
        type = "error"
    ) {

        if (!message) {
            return;
        }

        message.textContent =
            text;

        message.style.display =
            "block";

        message.style.padding =
            "10px 12px";

        message.style.borderRadius =
            "6px";

        message.style.background =
            type === "success"
                ? "#e8f7ee"
                : "#fdecec";

        message.style.color =
            type === "success"
                ? "#166534"
                : "#991b1b";
    }


    if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword
    ) {

        showPasswordMessage(
            "Please complete all password fields."
        );

        return;
    }


    if (newPassword.length < 8) {

        showPasswordMessage(
            "Your new password must be at least 8 characters long."
        );

        return;
    }


    if (newPassword !== confirmPassword) {

        showPasswordMessage(
            "New password and confirmation password do not match."
        );

        return;
    }


    if (currentPassword === newPassword) {

        showPasswordMessage(
            "Your new password must be different from your current password."
        );

        return;
    }


    const token =
        getAdminSettingsToken();


    if (!token) {

        showPasswordMessage(
            "Your session has expired. Please log in again."
        );

        setTimeout(
            redirectToLogin,
            1200
        );

        return;
    }


    const submitButton =
        event.target.querySelector(
            'button[type="submit"]'
        );


    const originalText =
        submitButton
            ? submitButton.textContent
            : "Update Password";


    if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
            "Updating...";
    }


    try {

        const response =
            await fetch(
                ADMIN_PASSWORD_ENDPOINT,
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

                        currentPassword:
                            currentPassword,

                        newPassword:
                            newPassword,

                        confirmPassword:
                            confirmPassword
                    })
                }
            );


        let data = {};

        const responseText =
            await response.text();


        if (responseText) {

            try {

                data =
                    JSON.parse(
                        responseText
                    );

            } catch {

                data = {
                    message:
                        responseText
                };
            }
        }


        if (response.status === 401) {

            clearAdminSettingsSession();

            showPasswordMessage(
                "Your session has expired. Please log in again."
            );

            setTimeout(
                () => {
                    window.location.href =
                        "login.html";
                },
                1200
            );

            return;
        }


        if (!response.ok) {

            showPasswordMessage(
                data.message ||
                "Unable to change your password."
            );

            return;
        }


        showPasswordMessage(
            data.message ||
            "Administrator password changed successfully.",
            "success"
        );


        event.target.reset();


        setTimeout(() => {

            const formContainer =
                document.getElementById(
                    "change-password-form"
                );

            const changeButton =
                document.getElementById(
                    "change-password-button"
                );


            if (formContainer) {

                formContainer.style.display =
                    "none";
            }


            if (changeButton) {

                changeButton.style.display =
                    "";
            }


            if (message) {

                message.textContent = "";

                message.style.display =
                    "none";
            }

        }, 2500);


    } catch (error) {

        console.error(
            "HavenGH admin password error:",
            error
        );

        showPasswordMessage(
            "Unable to connect to HavenGH API. Please make sure the API is running."
        );

    } finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                originalText;
        }
    }
}


/* ============================================================
   PASSWORD FORM
   ============================================================ */

function initializePasswordControls() {

    const changeButton =
        document.getElementById(
            "change-password-button"
        );

    const formContainer =
        document.getElementById(
            "change-password-form"
        );

    const passwordForm =
        document.getElementById(
            "password-change-form"
        );

    const cancelButton =
        document.getElementById(
            "cancel-password-change"
        );


    if (
        !changeButton ||
        !formContainer ||
        !passwordForm
    ) {

        return;
    }


    changeButton.addEventListener(
        "click",
        () => {

            formContainer.style.display =
                "block";

            changeButton.style.display =
                "none";

            const currentPassword =
                document.getElementById(
                    "current-password"
                );

            currentPassword?.focus();
        }
    );


    cancelButton?.addEventListener(
        "click",
        () => {

            passwordForm.reset();

            formContainer.style.display =
                "none";

            changeButton.style.display =
                "";

            const message =
                document.getElementById(
                    "password-change-message"
                );

            if (message) {

                message.textContent =
                    "";

                message.style.display =
                    "none";
            }
        }
    );


    passwordForm.addEventListener(
        "submit",
        changeAdminPassword
    );
}


/* ============================================================
   LOGOUT
   POST /api/Auth/logout
   ============================================================ */

function initializeAdminLogout() {

    /*
     * Only target the Admin Settings logout link.
     * Do not attach to every login.html link on the page.
     */

    const logoutLinks =
        document.querySelectorAll(
            '.dashboard-sidebar-bottom a[href="login.html"], .dashboard-sidebar a.logout'
        );


    if (!logoutLinks.length) {
        return;
    }


    logoutLinks.forEach(
        logoutLink => {

            logoutLink.addEventListener(
                "click",
                async event => {

                    event.preventDefault();


                    const token =
                        getAdminSettingsToken();


                    if (!token) {

                        redirectToLogin();

                        return;
                    }


                    const originalText =
                        logoutLink.textContent;


                    logoutLink.style.pointerEvents =
                        "none";

                    logoutLink.style.opacity =
                        "0.6";

                    logoutLink.textContent =
                        "Logging out...";


                    try {

                        const response =
                            await fetch(
                                ADMIN_LOGOUT_ENDPOINT,
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


                        /*
                         * Whether logout succeeds or
                         * the token is already invalid,
                         * clear local authentication.
                         */

                        if (
                            response.ok ||
                            response.status === 401
                        ) {

                            clearAdminSettingsSession();

                            window.location.href =
                                "login.html";

                            return;
                        }


                        clearAdminSettingsSession();

                        window.location.href =
                            "login.html";

                    } catch (error) {

                        console.error(
                            "HavenGH admin logout error:",
                            error
                        );

                        /*
                         * Local logout still happens if
                         * the API cannot be reached.
                         */

                        clearAdminSettingsSession();

                        window.location.href =
                            "login.html";

                    } finally {

                        logoutLink.style.pointerEvents =
                            "";

                        logoutLink.style.opacity =
                            "";

                        if (
                            logoutLink.textContent ===
                            "Logging out..."
                        ) {

                            logoutLink.textContent =
                                originalText;
                        }
                    }
                }
            );
        }
    );
}


/* ============================================================
   INITIALIZE ADMIN SETTINGS
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const token =
            getAdminSettingsToken();


        if (!token) {

            redirectToLogin();

            return;
        }


        try {

            /*
             * Verify that the authenticated user
             * is actually an Administrator.
             */

            const admin =
                await loadAdminUser();


            if (!admin) {
                return;
            }


            initializePasswordControls();

            initializeAdminLogout();


        } catch (error) {

            console.error(
                "HavenGH admin settings initialization error:",
                error
            );

            showAdminMessage(
                "Unable to load administrator settings. Please try again."
            );
        }
    }
);

