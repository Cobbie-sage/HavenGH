
"use strict";

/* ============================================================
   HAVENGH — MY PLAN
   ============================================================ */

const API_BASE_URL = "http://localhost:5073/api";

const PLANS_API = `${API_BASE_URL}/Plans`;
const MY_PLAN_API = `${API_BASE_URL}/Plans/my`;
const MY_USAGE_API = `${API_BASE_URL}/Plans/my/usage`;

const TOKEN_KEY = "havenGH_token";


/* ============================================================
   INITIALIZE
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    initializeMyPlan();
});


/* ============================================================
   MAIN INITIALIZATION
   ============================================================ */

async function initializeMyPlan() {

    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    setupMobileNavigation();
    setupLogout();
    loadDashboardUser(token);

    try {

        const [
            plans,
            currentPlanData,
            usageData
        ] = await Promise.all([

            loadPlans(token),

            loadCurrentPlan(token),

            loadPlanUsage(token)

        ]);


        /*
         * Render everything returned by the API.
         */

        renderCurrentPlan(
            currentPlanData,
            usageData
        );

        renderPlans(
            plans,
            currentPlanData
        );

        setupUpgradeButtons();


    }
    catch (error) {

        console.error(
            "HavenGH My Plan error:",
            error
        );


        if (error.status === 401) {

            localStorage.removeItem(
                TOKEN_KEY
            );

            window.location.href =
                "login.html";

            return;
        }


        showPlanError(
            error.message ||
            "Unable to load your subscription information."
        );

    }

}


/* ============================================================
   API REQUEST
   ============================================================ */

async function apiRequest(
    url,
    token,
    options = {}
) {

    const response = await fetch(
        url,
        {
            ...options,

            headers: {

                "Accept":
                    "application/json",

                ...(options.body
                    ? {
                        "Content-Type":
                            "application/json"
                    }
                    : {}),

                "Authorization":
                    `Bearer ${token}`,

                ...(options.headers || {})

            }
        }
    );


    if (!response.ok) {

        const error = new Error(
            `API request failed (${response.status}).`
        );

        error.status =
            response.status;


        try {

            const data =
                await response.json();

            if (data.message) {

                error.message =
                    data.message;

            }

        }
        catch {
            // Response was not JSON.
        }


        throw error;

    }


    if (response.status === 204) {

        return null;

    }


    return await response.json();

}


/* ============================================================
   LOAD PLANS
   GET /api/Plans
   ============================================================ */

async function loadPlans(token) {

    const data =
        await apiRequest(
            PLANS_API,
            token
        );


    if (!Array.isArray(data)) {

        throw new Error(
            "Invalid plans data returned by the API."
        );

    }


    return data;

}


/* ============================================================
   LOAD CURRENT PLAN
   GET /api/Plans/my
   ============================================================ */

async function loadCurrentPlan(token) {

    return await apiRequest(
        MY_PLAN_API,
        token
    );

}


/* ============================================================
   LOAD USAGE
   GET /api/Plans/my/usage
   ============================================================ */

async function loadPlanUsage(token) {

    return await apiRequest(
        MY_USAGE_API,
        token
    );

}


/* ============================================================
   RENDER CURRENT PLAN
   ============================================================ */

function renderCurrentPlan(
    currentPlanData,
    usageData
) {

    const currentPlan =
        currentPlanData?.plan ||
        usageData?.plan;


    const usage =
        usageData?.usage;


    /*
     * Current plan name
     */

    const planHeading =
        document.querySelector(
            ".current-plan-card h2"
        );


    if (planHeading) {

        planHeading.textContent =
            currentPlan?.planName ||
            "Free";

    }


    /*
     * Current plan description
     */

    const description =
        document.querySelector(
            ".current-plan-card p"
        );


    if (description) {

        if (currentPlan) {

            description.textContent =
                `You are currently using the ${currentPlan.planName} plan.`;

        }
        else {

            description.textContent =
                "You are currently using the Free plan.";

        }

    }


    /*
     * Listing usage
     */

    const usageStrong =
        document.querySelector(
            ".plan-usage .usage-top strong"
        );


    if (usageStrong) {

        const listings =
            usage?.propertyListings ?? 0;

        const limit =
            usage?.listingLimit ?? 0;


        usageStrong.textContent =
            `${listings} / ${limit}`;

    }


    /*
     * Usage bar
     */

    const usageBar =
        document.querySelector(
            ".usage-bar span"
        );


    if (usageBar) {

        const percentage =
            Number(
                usage?.percentage ?? 0
            );


        usageBar.style.width =
            `${Math.min(100, Math.max(0, percentage))}%`;

    }


    /*
     * Usage message
     */

    const usageMessage =
        document.querySelector(
            ".plan-usage small"
        );


    if (usageMessage) {

        const listings =
            usage?.propertyListings ?? 0;

        const limit =
            usage?.listingLimit ?? 0;


        if (
            limit > 0 &&
            listings >= limit
        ) {

            usageMessage.textContent =
                "You have reached your property listing limit.";

        }
        else {

            const remaining =
                Math.max(
                    0,
                    limit - listings
                );


            usageMessage.textContent =
                remaining === 1
                    ? "You have 1 property listing remaining."
                    : `You have ${remaining} property listings remaining.`;

        }

    }


    /*
     * Current plan label
     */

    const label =
        document.querySelector(
            ".current-plan-label"
        );


    if (label) {

        label.textContent =
            "CURRENT PLAN";

    }

}


/* ============================================================
   RENDER PLAN CARDS
   ============================================================ */

function renderPlans(
    plans,
    currentPlanData
) {

    const container =
        document.querySelector(
            ".plans-grid"
        );


    if (!container) {

        return;

    }


    const currentPlanId =
        currentPlanData?.plan?.planId ??
        null;


    container.innerHTML = "";


    plans.forEach(
        plan => {

            const card =
                createPlanCard(
                    plan,
                    currentPlanId
                );


            container.appendChild(
                card
            );

        }
    );

}


/* ============================================================
   CREATE PLAN CARD
   ============================================================ */

function createPlanCard(
    plan,
    currentPlanId
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "plan-card";


    const planName =
        String(
            plan.planName || ""
        ).trim();


    const normalizedName =
        planName.toLowerCase();


    /*
     * Standard is our featured plan.
     */

    if (
        normalizedName ===
        "standard"
    ) {

        card.classList.add(
            "plan-featured"
        );

    }


    /*
     * Popular badge
     */

    if (
        normalizedName ===
        "standard"
    ) {

        const popular =
            document.createElement(
                "span"
            );


        popular.className =
            "popular-plan";


        popular.textContent =
            "MOST POPULAR";


        card.appendChild(
            popular
        );

    }


    /*
     * Top section
     */

    const top =
        document.createElement(
            "div"
        );


    top.className =
        "plan-card-top";


    const name =
        document.createElement(
            "span"
        );


    name.className =
        "plan-name";


    name.textContent =
        planName.toUpperCase();


    const heading =
        document.createElement(
            "h2"
        );


    const price =
        Number(
            plan.price ?? 0
        );


    heading.textContent =
        formatPrice(
            price
        );


    if (
        plan.billingPeriod &&
        plan.billingPeriod.toLowerCase() !==
        "none"
    ) {

        const period =
            document.createElement(
                "small"
            );


        period.textContent =
            ` / ${plan.billingPeriod}`;


        heading.appendChild(
            period
        );

    }


    const description =
        document.createElement(
            "p"
        );


    description.textContent =
        getPlanDescription(
            normalizedName
        );


    top.appendChild(
        name
    );

    top.appendChild(
        heading
    );

    top.appendChild(
        description
    );


    /*
     * Features
     */

    const features =
        document.createElement(
            "ul"
        );


    features.className =
        "plan-features";


    getPlanFeatures(
        normalizedName
    )
    .forEach(
        feature => {

            const item =
                document.createElement(
                    "li"
                );


            item.textContent =
                feature;


            features.appendChild(
                item
            );

        }
    );


    /*
     * Button
     */

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    const isCurrent =
        Number(plan.planId) ===
        Number(currentPlanId);


    if (isCurrent) {

        button.className =
            "plan-current-button";


        button.disabled =
            true;


        button.textContent =
            "Current Plan";

    }
    else {

        button.className =
            "plan-upgrade-button";


        button.dataset.planId =
            plan.planId;


        button.dataset.plan =
            planName;


        button.textContent =
            Number(price) === 0
                ? "Select Free Plan"
                : `Upgrade to ${planName}`;

    }


    card.appendChild(
        top
    );

    card.appendChild(
        features
    );

    card.appendChild(
        button
    );


    return card;

}


/* ============================================================
   PLAN DESCRIPTIONS
   ============================================================ */

function getPlanDescription(
    planName
) {

    switch (planName) {

        case "free":

            return "Perfect for landlords who are just getting started.";

        case "standard":

            return "For landlords and agents with more properties.";

        case "business":

            return "Designed for professional property agents.";

        default:

            return "Choose a plan that fits your property business.";

    }

}


/* ============================================================
   PLAN FEATURES
   ============================================================ */

function getPlanFeatures(
    planName
) {

    switch (planName) {

        case "free":

            return [
                "✓ 5 active property listings",
                "✓ Property photo gallery",
                "✓ WhatsApp contact",
                "✓ Phone contact",
                "✓ Rental requests",
                "✓ Basic profile",
                "× Featured listings",
                "× Priority placement"
            ];


        case "standard":

            return [
                "✓ 10 active property listings",
                "✓ Unlimited property photos",
                "✓ WhatsApp contact",
                "✓ Phone contact",
                "✓ Rental requests",
                "✓ Professional profile",
                "✓ Featured listings",
                "✓ Priority placement"
            ];


        case "business":

            return [
                "✓ 30 active property listings",
                "✓ Unlimited property photos",
                "✓ WhatsApp contact",
                "✓ Phone contact",
                "✓ Rental requests",
                "✓ Professional agent profile",
                "✓ Featured listings",
                "✓ Priority placement"
            ];


        default:

            return [];

    }

}


/* ============================================================
   UPGRADE BUTTONS
   ============================================================ */

/* ============================================================
   UPGRADE BUTTONS — PAYSTACK
   ============================================================ */

function setupUpgradeButtons() {

    const buttons =
        document.querySelectorAll(
            ".plan-upgrade-button"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            async () => {

                const planId =
                    Number(button.dataset.planId);

                const planName =
                    button.dataset.plan;


                // ---------------------------------------------
                // Validate plan
                // ---------------------------------------------

                if (!planId) {

                    alert(
                        "Invalid plan selected."
                    );

                    return;
                }


                // ---------------------------------------------
                // Get authentication token
                // ---------------------------------------------

                const token =
                    localStorage.getItem(
                        TOKEN_KEY
                    );


                if (!token) {

                    window.location.href =
                        "login.html";

                    return;
                }


                // ---------------------------------------------
                // Prevent double-clicking
                // ---------------------------------------------

                button.disabled = true;


                const originalText =
                    button.textContent;


                button.textContent =
                    "Connecting to Paystack...";


                try {

                    // -----------------------------------------
                    // Initialize Paystack payment
                    // -----------------------------------------

                    const result =
                        await apiRequest(
                            `${API_BASE_URL}/Subscriptions/initialize`,
                            token,
                            {
                                method: "POST",

                                body: JSON.stringify({
                                    planId: planId
                                })
                            }
                        );


                    console.log(
                        "Paystack initialization response:",
                        result
                    );


                    // -----------------------------------------
                    // Make sure Paystack returned a checkout URL
                    // -----------------------------------------

                    if (
                        !result?.authorizationUrl
                    ) {

                        throw new Error(
                            "Paystack did not return a payment URL."
                        );

                    }


                    // -----------------------------------------
                    // Redirect user to Paystack
                    // -----------------------------------------

                    button.textContent =
                        "Redirecting...";


                    window.location.href =
                        result.authorizationUrl;

                }
                catch (error) {

                    console.error(
                        "Paystack payment initialization error:",
                        error
                    );


                    // -----------------------------------------
                    // Session expired
                    // -----------------------------------------

                    if (
                        error.status === 401
                    ) {

                        localStorage.removeItem(
                            TOKEN_KEY
                        );


                        window.location.href =
                            "login.html";


                        return;
                    }


                    // -----------------------------------------
                    // Show error
                    // -----------------------------------------

                    alert(
                        error.message ||
                        `Unable to start payment for the ${planName} plan.`
                    );


                    button.disabled =
                        false;


                    button.textContent =
                        originalText;

                }

            }
        );

    });

}



/* ============================================================
   LOAD LOGGED-IN USER
   GET /api/Auth/me
   ============================================================ */

async function loadDashboardUser(token) {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/Auth/me`,
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


        if (!response.ok) {

            return;

        }


        const user =
            await response.json();


        /* ========================================================
           USER NAME
        ======================================================== */

        const nameElement =
            document.getElementById(
                "dashboard-user-name"
            );


        if (nameElement) {

            nameElement.textContent =
                user.fullName ||
                user.businessName ||
                user.email ||
                "HavenGH User";

        }


        /* ========================================================
           USER ROLE
        ======================================================== */

        const roleElement =
            document.getElementById(
                "dashboard-user-role"
            );


        if (roleElement) {

            const role =
                String(
                    user.role || ""
                ).trim();


            roleElement.textContent =
                role
                    ? role.charAt(0).toUpperCase() +
                      role.slice(1).toLowerCase()
                    : "HavenGH User";

        }


        /* ========================================================
           USER AVATAR
        ======================================================== */

        const avatarElement =
            document.getElementById(
                "dashboard-user-avatar-img"
            );


        const avatarFallback =
            document.getElementById(
                "dashboard-user-avatar-fallback"
            );


        if (
            avatarElement &&
            user.avatarUrl
        ) {

            avatarElement.src =
                user.avatarUrl;

            avatarElement.hidden =
                false;


            if (avatarFallback) {

                avatarFallback.hidden =
                    true;

            }

        }

    }
    catch (error) {

        console.error(
            "HavenGH: Unable to load dashboard user:",
            error
        );

    }

}


/* ============================================================
   MOBILE NAVIGATION
   ============================================================ */

function setupMobileNavigation() {

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

            const open =
                sidebar.classList.toggle(
                    "mobile-open"
                );


            menuButton.setAttribute(
                "aria-expanded",
                String(open)
            );

        }
    );


    sidebar
        .querySelectorAll(
            ".dashboard-link"
        )
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


/* ============================================================
   LOGOUT
   ============================================================ */

function setupLogout() {

    const logoutButton =
        document.getElementById(
            "logout-button"
        );


    if (!logoutButton) {

        return;

    }


    logoutButton.addEventListener(
        "click",
        event => {

            event.preventDefault();


            localStorage.removeItem(
                TOKEN_KEY
            );


            window.location.href =
                "login.html";

        }
    );

}


/* ============================================================
   PRICE FORMAT
   ============================================================ */

function formatPrice(
    price
) {

    return `GH₵${Number(price).toLocaleString(
        "en-GH",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    )}`;

}


/* ============================================================
   ERROR DISPLAY
   ============================================================ */

function showPlanError(
    message
) {

    const content =
        document.querySelector(
            ".dashboard-content"
        );


    if (!content) {

        return;

    }


    const error =
        document.createElement(
            "div"
        );


    error.className =
        "dashboard-api-error";


    error.textContent =
        message;


    content.prepend(
        error
    );

}

