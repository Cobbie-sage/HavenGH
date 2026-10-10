
"use strict";

/* ============================================================
   HAVENGH — PAYMENT CALLBACK
   Paystack payment verification
   ============================================================ */

const API_BASE_URL = "http://localhost:5073/api";
const TOKEN_KEY = "havenGH_token";


/* ============================================================
   VERIFY PAYMENT
   ============================================================ */

async function verifyPayment() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const reference =
        params.get("reference");


    /* ========================================================
       PAYSTACK REFERENCE
       ======================================================== */

    if (!reference) {

        showError(
            "No Paystack transaction reference was found."
        );

        return;
    }


    console.log(
        "HavenGH Paystack reference:",
        reference
    );


    /* ========================================================
       AUTHENTICATION
       ======================================================== */

    const token =
        localStorage.getItem(
            TOKEN_KEY
        );


    if (!token) {

        showError(
            "Your login session has expired. Please log in again."
        );

        return;
    }


    /* ========================================================
       VERIFY PAYMENT WITH HAVENGH API
       ======================================================== */

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/Subscriptions/verify/${encodeURIComponent(reference)}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Accept":
                            "application/json"
                    }
                }
            );


        /* ====================================================
           READ RESPONSE
           ==================================================== */

        let data = null;

        try {

            data =
                await response.json();

        }
        catch {

            data = null;
        }


        console.log(
            "HavenGH payment verification response:",
            data
        );


        /* ====================================================
           AUTHENTICATION FAILURE
           ==================================================== */

        if (response.status === 401) {

            localStorage.removeItem(
                TOKEN_KEY
            );

            showError(
                "Your login session has expired. Please log in again."
            );

            return;
        }


        /* ====================================================
           API ERROR
           ==================================================== */

        if (!response.ok) {

            console.error(
                "HavenGH payment verification failed:",
                data
            );

            showError(
                data?.message ||
                `Payment verification failed. HTTP ${response.status}.`
            );

            return;
        }


        /* ====================================================
           PAYMENT SUCCESS
           ==================================================== */

        if (
            data?.subscriptionActivated === true
        ) {

            document.getElementById(
                "loading"
            ).style.display = "none";


            document.getElementById(
                "success"
            ).style.display = "block";


            /* ================================================
               BUILD SUCCESS MESSAGE
               ================================================ */

            const successMessage =
                document.getElementById(
                    "successMessage"
                );


            const planName =
                data?.subscription?.planName ||
                "selected";


            const restoredCount =
                Number(
                    data?.restoredPropertyCount ?? 0
                );


            let message =
                `Payment verified successfully. Your ${planName} subscription is now active.`;


            if (restoredCount > 0) {

                message +=
                    ` ${restoredCount} previously published ` +
                    `property ${restoredCount === 1 ? "has" : "have"} ` +
                    `been automatically restored.`;

            }
            else {

                message +=
                    " No previously published properties required restoration.";

            }


            if (successMessage) {

                successMessage.textContent =
                    message;

            }


            console.log(
                "HavenGH subscription activated:",
                data
            );


            return;
        }


        /* ====================================================
           PAYMENT NOT ACTIVATED
           ==================================================== */

        showError(
            data?.message ||
            "Payment was verified, but the subscription could not be activated."
        );

    }
    catch (error) {

        console.error(
            "HavenGH payment verification error:",
            error
        );


        showError(
            "Unable to connect to HavenGH. Please try again."
        );
    }
}


/* ============================================================
   SHOW ERROR
   ============================================================ */

function showError(message) {

    const loading =
        document.getElementById(
            "loading"
        );


    const success =
        document.getElementById(
            "success"
        );


    const error =
        document.getElementById(
            "error"
        );


    const errorMessage =
        document.getElementById(
            "errorMessage"
        );


    if (loading) {

        loading.style.display =
            "none";

    }


    if (success) {

        success.style.display =
            "none";

    }


    if (error) {

        error.style.display =
            "block";

    }


    if (errorMessage) {

        errorMessage.textContent =
            message;

    }
}


/* ============================================================
   START
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        verifyPayment();

    }
);

