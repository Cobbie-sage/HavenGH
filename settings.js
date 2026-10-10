"use strict";

/* ============================================================
   HavenGH - Settings JavaScript
   Settings Page API Integration
   ============================================================ */

const SETTINGS_API_BASE = "http://localhost:5073/api/Auth";

/* ============================================================
   TOKEN
   Uses the same token storage already used by HavenGH
   ============================================================ */

function getSettingsToken() {
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

function clearSettingsSession() {
    sessionStorage.removeItem("havenGH_token");

    localStorage.removeItem("havenGH_token");
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
}

/* ============================================================
   DOM ELEMENTS
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    const changePasswordButton =
        document.getElementById("change-password-button");

    const changePasswordForm =
        document.getElementById("change-password-form");

    const passwordForm =
        document.getElementById("password-change-form");

    const currentPasswordInput =
        document.getElementById("current-password");

    const newPasswordInput =
        document.getElementById("new-password");

    const confirmPasswordInput =
        document.getElementById("confirm-password");

    const passwordMessage =
        document.getElementById("password-change-message");

    const cancelPasswordButton =
        document.getElementById("cancel-password-change");


    /* ========================================================
       SAFETY CHECK
       Prevent errors on pages where these elements don't exist
       ======================================================== */

    if (
        !changePasswordButton ||
        !changePasswordForm ||
        !passwordForm
    ) {
        return;
    }


    /* ========================================================
       SHOW CHANGE PASSWORD FORM
       ======================================================== */

    changePasswordButton.addEventListener("click", () => {

        changePasswordForm.hidden = false;

        changePasswordButton.hidden = true;

        clearPasswordMessage();

        currentPasswordInput?.focus();
    });


    /* ========================================================
       CANCEL CHANGE PASSWORD
       ======================================================== */

    if (cancelPasswordButton) {

        cancelPasswordButton.addEventListener("click", () => {

            passwordForm.reset();

            changePasswordForm.hidden = true;

            changePasswordButton.hidden = false;

            clearPasswordMessage();
        });
    }


    /* ========================================================
       CHANGE PASSWORD
       ======================================================== */

    passwordForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        clearPasswordMessage();


        /* ====================================================
           GET VALUES
           ==================================================== */

        const currentPassword =
            currentPasswordInput.value.trim();

        const newPassword =
            newPasswordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;


        /* ====================================================
           CLIENT-SIDE VALIDATION
           ==================================================== */

        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {

            showPasswordMessage(
                "Please complete all password fields.",
                "error"
            );

            return;
        }


        if (newPassword.length < 8) {

            showPasswordMessage(
                "Your new password must be at least 8 characters long.",
                "error"
            );

            return;
        }


        if (newPassword !== confirmPassword) {

            showPasswordMessage(
                "New password and confirmation password do not match.",
                "error"
            );

            return;
        }


        if (currentPassword === newPassword) {

            showPasswordMessage(
                "Your new password must be different from your current password.",
                "error"
            );

            return;
        }


        /* ====================================================
           GET JWT TOKEN
           ==================================================== */

        const token = getSettingsToken();

        if (!token) {

            showPasswordMessage(
                "Your session has expired. Please log in again.",
                "error"
            );

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);

            return;
        }


        /* ====================================================
           SUBMIT BUTTON
           ==================================================== */

        const submitButton =
            passwordForm.querySelector(
                'button[type="submit"]'
            );

        const originalButtonText =
            submitButton
                ? submitButton.textContent
                : "";


        if (submitButton) {

            submitButton.disabled = true;

            submitButton.textContent =
                "Changing Password...";
        }


        /* ====================================================
           API REQUEST
           PUT /api/Auth/change-password
           ==================================================== */

        try {

            const response = await fetch(
                `${SETTINGS_API_BASE}/change-password`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        currentPassword: currentPassword,
                        newPassword: newPassword,
                        confirmPassword: confirmPassword
                    })
                }
            );


            /* =================================================
               READ API RESPONSE SAFELY
               ================================================= */

            let data = {};

            const responseText =
                await response.text();

            if (responseText) {

                try {
                    data = JSON.parse(responseText);
                } catch {
                    data = {
                        message: responseText
                    };
                }
            }


            /* =================================================
               UNAUTHORIZED
               ================================================= */

            if (response.status === 401) {

                clearSettingsSession();

                showPasswordMessage(
                    "Your session has expired. Please log in again.",
                    "error"
                );

                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1500);

                return;
            }


            /* =================================================
               API ERROR
               ================================================= */

            if (!response.ok) {

                showPasswordMessage(
                    data.message ||
                    "Unable to change your password. Please try again.",
                    "error"
                );

                return;
            }


            /* =================================================
               SUCCESS
               ================================================= */

            showPasswordMessage(
                data.message ||
                "Password changed successfully.",
                "success"
            );

            passwordForm.reset();


            /* =================================================
               HIDE FORM AFTER SUCCESS
               ================================================= */

            setTimeout(() => {

                changePasswordForm.hidden = true;

                changePasswordButton.hidden = false;

                clearPasswordMessage();

            }, 2500);


        } catch (error) {

            console.error(
                "HavenGH password change error:",
                error
            );

            showPasswordMessage(
                "Unable to connect to HavenGH API. Please make sure the API is running.",
                "error"
            );

        } finally {

            if (submitButton) {

                submitButton.disabled = false;

                submitButton.textContent =
                    originalButtonText ||
                    "Change Password";
            }
        }
    });


    /* ========================================================
       PASSWORD MESSAGE
       ======================================================== */

    function showPasswordMessage(message, type) {

        if (!passwordMessage) {
            return;
        }

        passwordMessage.textContent = message;

        passwordMessage.hidden = false;

        passwordMessage.classList.remove(
            "success",
            "error"
        );

        passwordMessage.classList.add(type);
    }


    /* ========================================================
       CLEAR MESSAGE
       ======================================================== */

    function clearPasswordMessage() {

        if (!passwordMessage) {
            return;
        }

        passwordMessage.textContent = "";

        passwordMessage.hidden = true;

        passwordMessage.classList.remove(
            "success",
            "error"
        );
    }

});
/* ============================================================
   HAVENGH - SETTINGS LOGOUT
   Connected to POST /api/Auth/logout
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    const logoutLinks =
        document.querySelectorAll('a[href="login.html"]');

    if (!logoutLinks.length) {
        return;
    }

    logoutLinks.forEach((logoutLink) => {

        logoutLink.addEventListener("click", async (event) => {

            event.preventDefault();

            const token = getSettingsToken();

            /*
             * If there is no token, simply clear the local
             * session and return to login.
             */
            if (!token) {

                clearSettingsSession();

                window.location.href = "login.html";

                return;
            }

            /*
             * Prevent multiple logout requests.
             */
            logoutLink.style.pointerEvents = "none";
            logoutLink.style.opacity = "0.6";

            const originalText =
                logoutLink.textContent;

            logoutLink.textContent = "Logging out...";

            try {

                const response = await fetch(
                    `${SETTINGS_API_BASE}/logout`,
                    {
                        method: "POST",

                        headers: {
                            "Accept": "application/json",
                            "Authorization": `Bearer ${token}`
                        }
                    }
                );

                /*
                 * Whether the API succeeds or returns 401,
                 * clear the local session.
                 */
                if (
                    response.ok ||
                    response.status === 401
                ) {

                    clearSettingsSession();

                    window.location.href = "login.html";

                    return;
                }

                /*
                 * Unexpected API response.
                 */
                console.error(
                    "HavenGH logout failed:",
                    response.status
                );

                /*
                 * Still clear the local token so the user
                 * is not left apparently logged in.
                 */
                clearSettingsSession();

                window.location.href = "login.html";

            } catch (error) {

                console.error(
                    "HavenGH logout connection error:",
                    error
                );

                /*
                 * Even if the API is temporarily unavailable,
                 * remove the local authentication token.
                 */
                clearSettingsSession();

                window.location.href = "login.html";

            } finally {

                logoutLink.style.pointerEvents = "";
                logoutLink.style.opacity = "";

                if (logoutLink.textContent === "Logging out...") {
                    logoutLink.textContent = originalText;
                }
            }
        });
    });
});
