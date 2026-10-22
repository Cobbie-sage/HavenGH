
// =====================================================
// HAVENGH LOGIN
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.querySelector(".auth-form");

    if (!loginForm) {
        console.warn("HavenGH login form was not found.");
        return;
    }


    // =================================================
    // API
    // =================================================

    const API_BASE_URL = "https://havenghapi-production.up.railway.app";


    // =================================================
    // LOGIN SUBMISSION
    // =================================================

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();


        // =================================================
        // GET LOGIN FIELDS
        // =================================================

        const emailInput =
            document.getElementById("email");

        const passwordInput =
            document.getElementById("password");


        if (!emailInput || !passwordInput) {

            console.error(
                "Login email or password field was not found."
            );

            alert(
                "Login form configuration error."
            );

            return;
        }


        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;


        // =================================================
        // VALIDATION
        // =================================================

        if (!email || !password) {

            alert(
                "Please enter your email and password."
            );

            return;
        }


        // =================================================
        // LOGIN BUTTON
        // =================================================

        const loginButton =
            loginForm.querySelector(
                'button[type="submit"]'
            );


        const originalButtonText =
            loginButton
                ? loginButton.textContent
                : "Log In";


        if (loginButton) {

            loginButton.disabled = true;

            loginButton.textContent =
                "Logging in...";
        }


        try {

            // =================================================
            // CALL HAVENGH API
            // =================================================

            const response = await fetch(
                `${API_BASE_URL}/api/Auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },

                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );


            // =================================================
            // HANDLE UNAUTHORIZED LOGIN
            // =================================================

            if (response.status === 401) {

                alert(
                    "Invalid email or password."
                );

                return;
            }


            // =================================================
            // HANDLE OTHER API ERRORS
            // =================================================

            if (!response.ok) {

                let errorMessage =
                    "Login failed. Please try again.";

                try {

                    const errorData =
                        await response.json();

                    if (errorData.message) {

                        errorMessage =
                            errorData.message;
                    }

                }
                catch {
                    // API did not return JSON.
                }


                throw new Error(
                    errorMessage
                );
            }


            // =================================================
            // READ LOGIN RESPONSE
            // =================================================

            const data =
                await response.json();


            // =================================================
            // TWO-FACTOR AUTHENTICATION
            // =================================================

            if (data.requiresTwoFactor === true) {

                console.log(
                    "HavenGH requires two-factor authentication."
                );


                if (!data.challenge) {

                    console.error(
                        "2FA was required but no challenge was returned.",
                        data
                    );

                    alert(
                        "Two-factor authentication could not be started. Please try again."
                    );

                    return;
                }


                // Show the 2FA screen
                showTwoFactorForm(
                    data.challenge
                );


                return;
            }


            // =================================================
            // NORMAL LOGIN
            // =================================================

            await completeLogin(data);

        }
        catch (error) {

            console.error(
                "HavenGH login error:",
                error
            );


            alert(
                error.message ||
                "Unable to connect to the HavenGH API."
            );

        }
        finally {

            // =================================================
            // RESTORE LOGIN BUTTON
            // =================================================

            if (loginButton) {

                loginButton.disabled = false;

                loginButton.textContent =
                    originalButtonText;
            }

        }

    });


    // =====================================================
    // SHOW TWO-FACTOR FORM
    // =====================================================

    function showTwoFactorForm(challenge) {

        const authCard =
            document.querySelector(".auth-card");

        if (!authCard) {

            alert(
                "Unable to open two-factor authentication."
            );

            return;
        }


        // Hide normal login form
        loginForm.style.display = "none";


        // Hide normal footer
        const authFooter =
            authCard.querySelector(".auth-footer");

        if (authFooter) {
            authFooter.style.display = "none";
        }


        // Check if 2FA form already exists
        let twoFactorForm =
            document.getElementById(
                "two-factor-form"
            );


        if (twoFactorForm) {

            twoFactorForm.remove();
        }


        // =================================================
        // CREATE 2FA FORM
        // =================================================

        twoFactorForm =
            document.createElement("form");

        twoFactorForm.id =
            "two-factor-form";

        twoFactorForm.className =
            "auth-form";


        twoFactorForm.innerHTML = `

            <div class="form-group">

                <label for="two-factor-code">
                    Authentication Code
                </label>

                <input
                    type="text"
                    id="two-factor-code"
                    name="code"
                    inputmode="numeric"
                    autocomplete="one-time-code"
                    maxlength="6"
                    pattern="[0-9]{6}"
                    placeholder="Enter 6-digit code"
                    required
                >

            </div>


            <button
                type="submit"
                class="auth-submit"
                id="verify-two-factor-button"
            >
                Verify Code
            </button>


            <button
                type="button"
                id="back-to-login"
                style="
                    width:100%;
                    margin-top:12px;
                    padding:12px;
                    border:1px solid #c8a45d;
                    background:transparent;
                    color:inherit;
                    border-radius:8px;
                    cursor:pointer;
                "
            >
                Back to Login
            </button>

        `;


        authCard.appendChild(
            twoFactorForm
        );


        // =================================================
        // 2FA SUBMISSION
        // =================================================

        twoFactorForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const codeInput =
                    document.getElementById(
                        "two-factor-code"
                    );

                const verifyButton =
                    document.getElementById(
                        "verify-two-factor-button"
                    );


                const code =
                    codeInput.value.trim();


                // =================================================
                // VALIDATE CODE
                // =================================================

                if (!/^\d{6}$/.test(code)) {

                    alert(
                        "Please enter the 6-digit authentication code."
                    );

                    codeInput.focus();

                    return;
                }


                if (verifyButton) {

                    verifyButton.disabled = true;

                    verifyButton.textContent =
                        "Verifying...";
                }


                try {

                    // =================================================
                    // VERIFY 2FA
                    // =================================================

                    const response = await fetch(
                        `${API_BASE_URL}/api/Auth/verify-2fa`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type": "application/json",
                                "Accept": "application/json"
                            },

                            body: JSON.stringify({
                                challenge: challenge,
                                code: code
                            })
                        }
                    );


                    // =================================================
                    // READ RESPONSE
                    // =================================================

                    let data = {};

                    try {

                        data =
                            await response.json();

                    }
                    catch {
                        // API returned no JSON.
                    }


                    // =================================================
                    // INVALID 2FA CODE
                    // =================================================

                    if (!response.ok) {

                        alert(
                            data.message ||
                            "Invalid authentication code."
                        );

                        codeInput.value = "";

                        codeInput.focus();

                        return;
                    }


                    // =================================================
                    // COMPLETE LOGIN
                    // =================================================

                    if (!data.token) {

                        console.error(
                            "2FA verification succeeded but no JWT token was returned.",
                            data
                        );

                        alert(
                            "Authentication succeeded, but no login token was returned."
                        );

                        return;
                    }


                    await completeLogin(data);

                }
                catch (error) {

                    console.error(
                        "HavenGH 2FA verification error:",
                        error
                    );


                    alert(
                        error.message ||
                        "Unable to connect to the HavenGH API."
                    );

                }
                finally {

                    if (verifyButton) {

                        verifyButton.disabled = false;

                        verifyButton.textContent =
                            "Verify Code";
                    }

                }

            }
        );


        // =================================================
        // BACK TO LOGIN
        // =================================================

        const backButton =
            document.getElementById(
                "back-to-login"
            );


        if (backButton) {

            backButton.addEventListener(
                "click",
                function () {

                    twoFactorForm.remove();

                    loginForm.style.display =
                        "";

                    if (authFooter) {

                        authFooter.style.display =
                            "";
                    }

                    if (loginButton) {

                        loginButton.disabled =
                            false;

                        loginButton.textContent =
                            originalButtonText;
                    }

                }
            );

        }


        // Focus code field
        const codeInput =
            document.getElementById(
                "two-factor-code"
            );

        if (codeInput) {

            codeInput.focus();
        }

    }


    // =====================================================
    // COMPLETE LOGIN
    // =====================================================

    async function completeLogin(data) {

        // =================================================
        // CHECK JWT TOKEN
        // =================================================

        if (!data.token) {

            console.error(
                "API login response did not contain a token.",
                data
            );

            alert(
                "Login succeeded, but no authentication token was returned."
            );

            return;
        }


        // =================================================
        // STORE JWT
        // =================================================

        localStorage.setItem(
            "havenGH_token",
            data.token
        );


        // =================================================
        // GET USER ROLE
        // =================================================

        const role =
            (
                data.role ||
                data.user?.role ||
                data.user?.Role ||
                ""
            )
            .toString()
            .trim()
            .toLowerCase();


        console.log(
            "Logged-in role:",
            role
        );


        // =================================================
        // ADMIN
        // =================================================

        if (role === "admin") {

            console.log(
                "Admin detected. Opening Admin Dashboard."
            );

            window.location.href =
                "admin-dashboard.html";

            return;
        }


        // =================================================
        // AGENT
        // =================================================

        if (role === "agent") {

            window.location.href =
                "dashboard.html";

            return;
        }


        // =================================================
        // LANDLORD
        // =================================================

        if (role === "landlord") {

            window.location.href =
                "dashboard.html";

            return;
        }


        // =================================================
        // TENANT
        // =================================================

        if (role === "tenant") {

            window.location.href =
                "tenant-dashboard.html";

            return;
        }


        // =================================================
        // UNKNOWN ROLE
        // =================================================

        console.warn(
            "Login succeeded but the API returned an unknown role:",
            role
        );


        window.location.href =
            "index.html";

    }

});

