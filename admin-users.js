
"use strict";

/* ============================================================
   HavenGH - Admin Users
   Administrator User Management
   Direct ASP.NET Core API connection
============================================================ */

(function () {

    /* ============================================================
       API
    ============================================================ */

    const ADMIN_USERS_API_BASE_URL =
        "https://havenghapi-production.up.railway.app";


    /* ============================================================
       STATE
    ============================================================ */

    let allUsers = [];
    let filteredUsers = [];
    let currentAdminId = null;
    let actionInProgress = false;


    /* ============================================================
       DOM
    ============================================================ */

    const dateElement =
        document.getElementById("adminUsersDate");

    const notificationElement =
        document.getElementById("adminUsersNotificationCount");

    const totalElement =
        document.getElementById("usersTotalCount");

    const tenantElement =
        document.getElementById("usersTenantCount");

    const landlordElement =
        document.getElementById("usersLandlordCount");

    const agentElement =
        document.getElementById("usersAgentCount");

    const activeElement =
        document.getElementById("usersActiveCount");

    const searchInput =
        document.getElementById("userSearchInput");

    const roleFilter =
        document.getElementById("userRoleFilter");

    const statusFilter =
        document.getElementById("userStatusFilter");

    const tableContainer =
        document.getElementById("usersTableContainer");


    /* ============================================================
       TOKEN
    ============================================================ */

    function getToken() {

        return localStorage.getItem(
            "havenGH_token"
        );

    }


    /* ============================================================
       AUTHENTICATED API REQUEST
    ============================================================ */

    async function apiRequest(endpoint, options = {}) {

        const token = getToken();

        if (!token) {

            localStorage.removeItem(
                "havenGH_token"
            );

            window.location.href =
                "login.html";

            throw new Error(
                "Your administrator session has expired."
            );

        }


        const headers = {

            "Accept":
                "application/json",

            ...(options.body
                ? {
                    "Content-Type":
                        "application/json"
                }
                : {}),

            "Authorization":
                `Bearer ${token}`

        };


        let response;

        try {

            response =
                await fetch(
                    `${ADMIN_USERS_API_BASE_URL}${endpoint}`,
                    {
                        ...options,
                        headers
                    }
                );

        }
        catch (error) {

            throw new Error(
                "Unable to connect to the HavenGH API. Make sure the API is running."
            );

        }


        /* ========================================================
           AUTHORIZATION
        ======================================================== */

        if (response.status === 401) {

            localStorage.removeItem(
                "havenGH_token"
            );

            window.location.href =
                "login.html";

            throw new Error(
                "Your administrator session has expired."
            );

        }


        if (response.status === 403) {

            throw new Error(
                "Administrator access is required."
            );

        }


        /* ========================================================
           RESPONSE
        ======================================================== */

        let data = null;

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        }
        else {

            const text =
                await response.text();

            data =
                text
                    ? {
                        message: text
                    }
                    : null;

        }


        /* ========================================================
           API ERROR
        ======================================================== */

        if (!response.ok) {

            throw new Error(
                data?.message ||
                data?.title ||
                `Request failed with status ${response.status}.`
            );

        }


        return data;

    }


    /* ============================================================
       DATE
    ============================================================ */

    function renderDate() {

        if (!dateElement) {
            return;
        }


        const now =
            new Date();


        dateElement.textContent =
            now.toLocaleDateString(
                "en-GH",
                {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            );

    }


    /* ============================================================
       NORMALIZE USERS
    ============================================================ */

    function normalizeUsers(data) {

        if (Array.isArray(data)) {

            return data;

        }


        if (
            Array.isArray(
                data?.users
            )
        ) {

            return data.users;

        }


        if (
            Array.isArray(
                data?.data
            )
        ) {

            return data.data;

        }


        if (
            Array.isArray(
                data?.items
            )
        ) {

            return data.items;

        }


        return [];

    }


    /* ============================================================
       ROLE
    ============================================================ */

    function getRole(user) {

        const role =
            user?.roleName ||
            user?.role ||
            user?.Role ||
            user?.RoleName ||
            "";


        return String(role)
            .trim()
            .toLowerCase();

    }


    /* ============================================================
       USER ID
    ============================================================ */

    function getUserId(user) {

        return (
            user?.userId ??
            user?.UserId ??
            user?.id ??
            user?.Id ??
            ""
        );

    }


    /* ============================================================
       EMAIL
    ============================================================ */

    function getEmail(user) {

        return (
            user?.email ??
            user?.Email ??
            "—"
        );

    }


    /* ============================================================
       PHONE
    ============================================================ */

    function getPhone(user) {

        return (
            user?.phone ??
            user?.Phone ??
            "No phone"
        );

    }


    /* ============================================================
       ACTIVE
    ============================================================ */

    function isActive(user) {

        return (
            user?.isActive ??
            user?.IsActive ??
            false
        ) === true;

    }


    /* ============================================================
       LOCKED
    ============================================================ */

    function isLocked(user) {

        return (
            user?.isLocked ??
            user?.IsLocked ??
            false
        ) === true;

    }


    /* ============================================================
       EMAIL VERIFIED
    ============================================================ */

    function isEmailVerified(user) {

        return (
            user?.isEmailVerified ??
            user?.IsEmailVerified ??
            false
        ) === true;

    }


    /* ============================================================
       PHONE VERIFIED
    ============================================================ */

    function isPhoneVerified(user) {

        return (
            user?.isPhoneVerified ??
            user?.IsPhoneVerified ??
            false
        ) === true;

    }


    /* ============================================================
       IDENTITY VERIFIED
    ============================================================ */

    function isIdentityVerified(user) {

        return (
            user?.isIdentityVerified ??
            user?.IsIdentityVerified ??
            false
        ) === true;

    }


    /* ============================================================
       CREATED DATE
    ============================================================ */

    function getCreatedDate(user) {

        return (
            user?.createdAt ??
            user?.CreatedAt ??
            null
        );

    }


    /* ============================================================
       LAST LOGIN
    ============================================================ */

    function getLastLogin(user) {

        return (
            user?.lastLoginAt ??
            user?.LastLoginAt ??
            null
        );

    }


    /* ============================================================
       DATE FORMAT
    ============================================================ */

    function formatDate(value) {

        if (!value) {
            return "Never";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "—";

        }


        return date.toLocaleDateString(
            "en-GH",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    }


    /* ============================================================
       DATE + TIME FORMAT
    ============================================================ */

    function formatDateTime(value) {

        if (!value) {
            return "Never";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "—";

        }


        return date.toLocaleString(
            "en-GH",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    /* ============================================================
       AVATAR INITIALS
    ============================================================ */

    function getInitials(user) {

        const email =
            getEmail(user);


        if (
            email &&
            email !== "—"
        ) {

            return email
                .charAt(0)
                .toUpperCase();

        }


        const phone =
            getPhone(user);


        if (
            phone &&
            phone !== "No phone"
        ) {

            return phone
                .charAt(0);

        }


        return "U";

    }


    /* ============================================================
       ROLE LABEL
    ============================================================ */

    function roleLabel(role) {

        switch (role) {

            case "tenant":
                return "Tenant";

            case "landlord":
                return "Landlord";

            case "agent":
                return "Agent";

            case "admin":
            case "administrator":
                return "Admin";

            case "stayhost":
                return "Stay Host";

            case "stayguest":
                return "Stay Guest";

            default:

                return role
                    ? role.charAt(0).toUpperCase() +
                      role.slice(1)
                    : "Unknown";

        }

    }


    /* ============================================================
       ROLE CLASS
    ============================================================ */

    function roleClass(role) {

        switch (role) {

            case "tenant":
                return "role-tenant";

            case "landlord":
                return "role-landlord";

            case "agent":
                return "role-agent";

            case "admin":
            case "administrator":
                return "role-admin";

            case "stayhost":
                return "role-stayhost";

            case "stayguest":
                return "role-stayguest";

            default:
                return "";

        }

    }


    /* ============================================================
       UPDATE STATISTICS
    ============================================================ */

    function updateStatistics() {

        const tenants =
            allUsers.filter(
                user =>
                    getRole(user) === "tenant"
            ).length;


        const landlords =
            allUsers.filter(
                user =>
                    getRole(user) === "landlord"
            ).length;


        const agents =
            allUsers.filter(
                user =>
                    getRole(user) === "agent"
            ).length;


        const active =
            allUsers.filter(
                user =>
                    isActive(user) &&
                    !isLocked(user)
            ).length;


        const locked =
            allUsers.filter(
                user =>
                    isLocked(user)
            ).length;


        if (totalElement) {

            totalElement.textContent =
                allUsers.length.toLocaleString();

        }


        if (tenantElement) {

            tenantElement.textContent =
                tenants.toLocaleString();

        }


        if (landlordElement) {

            landlordElement.textContent =
                landlords.toLocaleString();

        }


        if (agentElement) {

            agentElement.textContent =
                agents.toLocaleString();

        }


        if (activeElement) {

            activeElement.textContent =
                active.toLocaleString();

        }


        if (notificationElement) {

            notificationElement.textContent =
                locked.toString();

        }

    }


    /* ============================================================
       FILTER USERS
    ============================================================ */

    function applyFilters() {

        const search =
            (
                searchInput?.value ||
                ""
            )
                .trim()
                .toLowerCase();


        const selectedRole =
            roleFilter?.value ||
            "all";


        const selectedStatus =
            statusFilter?.value ||
            "all";


        filteredUsers =
            allUsers.filter(
                user => {

                    const role =
                        getRole(user);


                    const email =
                        String(
                            getEmail(user)
                        )
                            .toLowerCase();


                    const phone =
                        String(
                            getPhone(user)
                        )
                            .toLowerCase();


                    const userId =
                        String(
                            getUserId(user)
                        )
                            .toLowerCase();


                    const matchesSearch =
                        !search ||
                        email.includes(search) ||
                        phone.includes(search) ||
                        userId.includes(search);


                    const matchesRole =
                        selectedRole === "all" ||
                        role === selectedRole;


                    let matchesStatus =
                        true;


                    if (
                        selectedStatus ===
                        "active"
                    ) {

                        matchesStatus =
                            isActive(user) &&
                            !isLocked(user);

                    }


                    if (
                        selectedStatus ===
                        "inactive"
                    ) {

                        matchesStatus =
                            !isActive(user);

                    }


                    if (
                        selectedStatus ===
                        "locked"
                    ) {

                        matchesStatus =
                            isLocked(user);

                    }


                    return (
                        matchesSearch &&
                        matchesRole &&
                        matchesStatus
                    );

                }
            );


        renderUsers();

    }


    /* ============================================================
       ESCAPE HTML
    ============================================================ */

    function escapeHtml(value) {

        return String(value ?? "")
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );

    }


    /* ============================================================
       ACTION BUTTON
    ============================================================ */

    function actionButton(
        action,
        userId,
        label,
        className = ""
    ) {

        return `
            <button
                type="button"
                class="admin-user-action ${className}"
                data-user-action="${escapeHtml(action)}"
                data-user-id="${escapeHtml(userId)}">

                ${escapeHtml(label)}

            </button>
        `;

    }


    /* ============================================================
       BUILD USER ACTIONS
    ============================================================ */

    function buildUserActions(user) {

        const userId =
            getUserId(user);


        const role =
            getRole(user);


        const active =
            isActive(user);


        const locked =
            isLocked(user);


        const isCurrentAdmin =
            String(userId) ===
            String(currentAdminId);


        let actions = "";


        /* --------------------------------------------------------
           VIEW
        -------------------------------------------------------- */

        actions +=
            actionButton(
                "view",
                userId,
                "View",
                "action-view"
            );
              /* --------------------------------------------------------
   IDENTITY VERIFICATION
-------------------------------------------------------- */

const identityVerified =
    isIdentityVerified(user);

if (!identityVerified) {

    actions +=
        actionButton(
            "verify-identity",
            userId,
            "Verify Identity",
            "action-success"
        );

}
else {

    actions += `
        <span
            class="admin-user-self-label"
            title="Identity already verified">

            Verified ✓

        </span>
    `;

}

        /* --------------------------------------------------------
           ADMIN SELF PROTECTION
        -------------------------------------------------------- */

        if (isCurrentAdmin) {

            return `
                <div class="admin-user-actions">

                    ${actions}

                    <span
                        class="admin-user-self-label">

                        You

                    </span>

                </div>
            `;

        }


        /* --------------------------------------------------------
           ACTIVATE / DEACTIVATE
        -------------------------------------------------------- */

        if (active) {

            actions +=
                actionButton(
                    "deactivate",
                    userId,
                    "Deactivate",
                    "action-danger"
                );

        }
        else {

            actions +=
                actionButton(
                    "activate",
                    userId,
                    "Activate",
                    "action-success"
                );

        }


        /* --------------------------------------------------------
           LOCK / UNLOCK
        -------------------------------------------------------- */

        if (locked) {

            actions +=
                actionButton(
                    "unlock",
                    userId,
                    "Unlock",
                    "action-success"
                );

        }
        else {

            actions +=
                actionButton(
                    "lock",
                    userId,
                    "Lock",
                    "action-warning"
                );

        }


        return `
            <div class="admin-user-actions">

                ${actions}

            </div>
        `;

    }


    /* ============================================================
       RENDER USERS
    ============================================================ */

    function renderUsers() {

        if (!tableContainer) {
            return;
        }


        if (!filteredUsers.length) {

            tableContainer.innerHTML = `

                <div class="admin-users-message">

                    <strong>
                        No users found
                    </strong>

                    <span>
                        Try changing your search or filters.
                    </span>

                </div>

            `;

            return;

        }


        const rows =
            filteredUsers
                .map(user => {

                    const role =
                        getRole(user);


                    const active =
                        isActive(user);


                    const locked =
                        isLocked(user);


                    const emailVerified =
                        isEmailVerified(user);


                    const phoneVerified =
                        isPhoneVerified(user);


                    const identityVerified =
                        isIdentityVerified(user);


                    const statusText =
                        locked
                            ? "Locked"
                            : active
                                ? "Active"
                                : "Inactive";


                    const statusClass =
                        locked
                            ? "status-locked"
                            : active
                                ? "status-active"
                                : "status-locked";


                    const verificationText =
                        identityVerified
                            ? "Identity Verified"
                            : emailVerified &&
                              phoneVerified
                                ? "Verified"
                                : "Partial";


                    const verificationClass =
                        identityVerified
                            ? "verified"
                            : emailVerified &&
                              phoneVerified
                                ? "verified"
                                : "unverified";


                    const userId =
                        getUserId(user);


                    return `

                        <tr>

                            <td>

                                <div class="admin-user-cell">

                                    <div class="admin-user-avatar">

                                        ${escapeHtml(
                                            getInitials(user)
                                        )}

                                    </div>

                                    <div>

                                        <span
                                            class="admin-user-name">

                                            User #${escapeHtml(
                                                userId
                                            )}

                                        </span>

                                        <span
                                            class="admin-user-email">

                                            ${escapeHtml(
                                                getEmail(user)
                                            )}

                                        </span>

                                    </div>

                                </div>

                            </td>


                            <td>

                                <span
                                    class="
                                        admin-user-badge
                                        ${roleClass(role)}
                                    ">

                                    ${escapeHtml(
                                        roleLabel(role)
                                    )}

                                </span>

                            </td>


                            <td>

                                ${escapeHtml(
                                    getPhone(user)
                                )}

                            </td>


                            <td>

                                <span
                                    class="
                                        admin-user-badge
                                        ${statusClass}
                                    ">

                                    ${escapeHtml(
                                        statusText
                                    )}

                                </span>

                            </td>


                            <td>

                                <span
                                    class="
                                        admin-user-badge
                                        ${verificationClass}
                                    ">

                                    ${escapeHtml(
                                        verificationText
                                    )}

                                </span>

                            </td>


                            <td>

                                ${formatDate(
                                    getCreatedDate(user)
                                )}

                            </td>


                            <td>

                                ${formatDate(
                                    getLastLogin(user)
                                )}

                            </td>


                            <td>

                                ${buildUserActions(user)}

                            </td>

                        </tr>

                    `;

                })
                .join("");


        tableContainer.innerHTML = `

            <table class="admin-users-table">

                <thead>

                    <tr>

                        <th>
                            User
                        </th>

                        <th>
                            Role
                        </th>

                        <th>
                            Phone
                        </th>

                        <th>
                            Status
                        </th>

                        <th>
                            Verification
                        </th>

                        <th>
                            Registered
                        </th>

                        <th>
                            Last Login
                        </th>

                        <th>
                            Actions
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${rows}

                </tbody>

            </table>

        `;

    }


    /* ============================================================
       FIND USER
    ============================================================ */

    function findUser(userId) {

        return allUsers.find(
            user =>
                String(
                    getUserId(user)
                ) === String(userId)
        );

    }


    /* ============================================================
       GET CURRENT ADMIN
    ============================================================ */

    async function loadCurrentAdmin() {

        try {

            const data =
                await apiRequest(
                    "/api/Auth/me"
                );


            currentAdminId =
                data?.userId ??
                data?.UserId ??
                data?.id ??
                data?.Id ??
                null;


        }
        catch (error) {

            console.warn(
                "Unable to determine current administrator:",
                error
            );

        }

    }


    /* ============================================================
       CONFIRM ACTION
    ============================================================ */

    function confirmAction(
        action,
        user
    ) {

        const email =
            getEmail(user);


        const userId =
            getUserId(user);


        switch (action) {

            case "deactivate":

                return window.confirm(
                    `Deactivate ${email} (User #${userId})?\n\nThis user will no longer have an active account.`
                );


            case "activate":

                return window.confirm(
                    `Activate ${email} (User #${userId})?`
                );


            case "lock":

                return window.confirm(
                    `Lock ${email} (User #${userId})?\n\nThe user will be prevented from accessing their account until unlocked.`
                );


            case "unlock":

                return window.confirm(
                    `Unlock ${email} (User #${userId})?`
                );

                case "verify-identity":

        return window.confirm(
                 `Verify the identity of ${email} (User #${userId})?\n\nThis will mark the user's identity as verified.`
           );


            default:

                return true;

        }

    }


    /* ============================================================
       USER ACTION API
    ============================================================ */

    async function performUserAction(
        action,
        userId
    ) {

        if (actionInProgress) {
            return;
        }


        const user =
            findUser(userId);


        if (!user) {

            alert(
                "User could not be found."
            );

            return;

        }


        /* --------------------------------------------------------
           Prevent self-protection bypass
        -------------------------------------------------------- */

        if (
            String(userId) ===
            String(currentAdminId) &&
            (
                action === "lock" ||
                action === "deactivate"
            )
        ) {

            alert(
                "You cannot lock or deactivate your own administrator account."
            );

            return;

        }


        if (
            !confirmAction(
                action,
                user
            )
        ) {

            return;

        }

       const endpointMap = {

    activate:
        `/api/Users/${encodeURIComponent(userId)}/activate`,

    deactivate:
        `/api/Users/${encodeURIComponent(userId)}/deactivate`,

    lock:
        `/api/Users/${encodeURIComponent(userId)}/lock`,

    unlock:
        `/api/Users/${encodeURIComponent(userId)}/unlock`,

    "verify-identity":
        `/api/Users/${encodeURIComponent(userId)}/verify-identity`

};
      

        const endpoint =
            endpointMap[action];


        if (!endpoint) {

            return;

        }


        actionInProgress = true;


        setActionButtonsDisabled(
            true
        );


        try {

            const result =
                await apiRequest(
                    endpoint,
                    {
                        method: "PUT"
                    }
                );


            console.log(
                `HavenGH Admin Users - ${action}:`,
                result
            );


            await loadUsers();


            showActionMessage(
                result?.message ||
                "User account updated successfully."
            );

        }
        catch (error) {

            console.error(
                `HavenGH Admin Users - ${action} Error:`,
                error
            );


            showActionMessage(
                error.message ||
                "Unable to update the user account.",
                true
            );

        }
        finally {

            actionInProgress = false;

            setActionButtonsDisabled(
                false
            );

        }

    }


    /* ============================================================
       DISABLE ACTION BUTTONS
    ============================================================ */

    function setActionButtonsDisabled(
        disabled
    ) {

        const buttons =
            document.querySelectorAll(
                ".admin-user-action"
            );


        buttons.forEach(
            button => {

                button.disabled =
                    disabled;

            }
        );

    }


    /* ============================================================
       ACTION MESSAGE
    ============================================================ */

    function showActionMessage(
        message,
        isError = false
    ) {

        const existing =
            document.getElementById(
                "adminUsersActionMessage"
            );


        if (existing) {
            existing.remove();
        }


        const messageElement =
            document.createElement(
                "div"
            );


        messageElement.id =
            "adminUsersActionMessage";


        messageElement.className =
            isError
                ? "admin-users-action-message error"
                : "admin-users-action-message success";


        messageElement.textContent =
            message;


        document.body.appendChild(
            messageElement
        );


        window.setTimeout(
            () => {

                messageElement.classList.add(
                    "is-hidden"
                );


                window.setTimeout(
                    () => {

                        messageElement.remove();

                    },
                    250
                );

            },
            3500
        );

    }


    /* ============================================================
       VIEW USER
    ============================================================ */

    function viewUser(userId) {

        const user =
            findUser(userId);


        if (!user) {

            alert(
                "User could not be found."
            );

            return;

        }


        const role =
            getRole(user);


        const active =
            isActive(user);


        const locked =
            isLocked(user);


        const emailVerified =
            isEmailVerified(user);


        const phoneVerified =
            isPhoneVerified(user);


        const identityVerified =
            isIdentityVerified(user);


        const existingModal =
            document.getElementById(
                "adminUserDetailsModal"
            );


        existingModal?.remove();


        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "adminUserDetailsModal";


        modal.className =
            "admin-user-modal";


        modal.innerHTML = `

            <div
                class="admin-user-modal-backdrop"
                data-close-user-modal>
            </div>


            <div
                class="admin-user-modal-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="adminUserDetailsTitle">

                <button
                    type="button"
                    class="admin-user-modal-close"
                    data-close-user-modal
                    aria-label="Close">

                    &times;

                </button>


                <div
                    class="admin-user-modal-header">

                    <div
                        class="admin-user-modal-avatar">

                        ${escapeHtml(
                            getInitials(user)
                        )}

                    </div>


                    <div>

                        <span
                            class="admin-user-modal-kicker">

                            HavenGH User

                        </span>

                        <h2
                            id="adminUserDetailsTitle">

                            User #${escapeHtml(
                                userId
                            )}

                        </h2>

                        <p>

                            ${escapeHtml(
                                getEmail(user)
                            )}

                        </p>

                    </div>

                </div>


                <div
                    class="admin-user-modal-status">

                    <span
                        class="
                            admin-user-badge
                            ${roleClass(role)}
                        ">

                        ${escapeHtml(
                            roleLabel(role)
                        )}

                    </span>


                    <span
                        class="
                            admin-user-badge
                            ${
                                locked
                                    ? "status-locked"
                                    : active
                                        ? "status-active"
                                        : "status-locked"
                            }
                        ">

                        ${
                            locked
                                ? "Locked"
                                : active
                                    ? "Active"
                                    : "Inactive"
                        }

                    </span>

                </div>


                <div
                    class="admin-user-details-grid">

                    <div>

                        <span>
                            Email
                        </span>

                        <strong>
                            ${escapeHtml(
                                getEmail(user)
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Phone
                        </span>

                        <strong>
                            ${escapeHtml(
                                getPhone(user)
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Role
                        </span>

                        <strong>
                            ${escapeHtml(
                                roleLabel(role)
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            User ID
                        </span>

                        <strong>
                            #${escapeHtml(
                                userId
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Email Verification
                        </span>

                        <strong>

                            ${
                                emailVerified
                                    ? "Verified"
                                    : "Not verified"
                            }

                        </strong>

                    </div>


                    <div>

                        <span>
                            Phone Verification
                        </span>

                        <strong>

                            ${
                                phoneVerified
                                    ? "Verified"
                                    : "Not verified"
                            }

                        </strong>

                    </div>


                    <div>

                        <span>
                            Identity Verification
                        </span>

                        <strong>

                            ${
                                identityVerified
                                    ? "Verified"
                                    : "Not verified"
                            }

                        </strong>

                    </div>


                    <div>

                        <span>
                            Failed Login Attempts
                        </span>

                        <strong>

                            ${escapeHtml(
                                user?.failedLoginCount ??
                                user?.FailedLoginCount ??
                                0
                            )}

                        </strong>

                    </div>


                    <div>

                        <span>
                            Registered
                        </span>

                        <strong>

                            ${escapeHtml(
                                formatDateTime(
                                    getCreatedDate(user)
                                )
                            )}

                        </strong>

                    </div>


                    <div>

                        <span>
                            Last Login
                        </span>

                        <strong>

                            ${escapeHtml(
                                formatDateTime(
                                    getLastLogin(user)
                                )
                            )}

                        </strong>

                    </div>


                    <div>

                        <span>
                            Last Updated
                        </span>

                        <strong>

                            ${escapeHtml(
                                formatDateTime(
                                    user?.updatedAt ??
                                    user?.UpdatedAt ??
                                    null
                                )
                            )}

                        </strong>

                    </div>

                </div>


                <div
                    class="admin-user-modal-footer">

                    <button
                        type="button"
                        class="admin-user-modal-button"
                        data-close-user-modal>

                        Close

                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(
            modal
        );


        requestAnimationFrame(
            () => {

                modal.classList.add(
                    "is-visible"
                );

            }
        );


        modal
            .querySelectorAll(
                "[data-close-user-modal]"
            )
            .forEach(
                element => {

                    element.addEventListener(
                        "click",
                        closeUserModal
                    );

                }
            );


        document.addEventListener(
            "keydown",
            handleModalEscape
        );

    }


    /* ============================================================
       CLOSE USER MODAL
    ============================================================ */

    function closeUserModal() {

        const modal =
            document.getElementById(
                "adminUserDetailsModal"
            );


        if (!modal) {
            return;
        }


        modal.classList.remove(
            "is-visible"
        );


        window.setTimeout(
            () => {

                modal.remove();

            },
            200
        );


        document.removeEventListener(
            "keydown",
            handleModalEscape
        );

    }


    /* ============================================================
       ESCAPE MODAL
    ============================================================ */

    function handleModalEscape(event) {

        if (
            event.key ===
            "Escape"
        ) {

            closeUserModal();

        }

    }


    /* ============================================================
       ACTION CLICK EVENTS
    ============================================================ */

    function setupUserActions() {

        if (!tableContainer) {
            return;
        }


        tableContainer.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-user-action]"
                    );


                if (!button) {
                    return;
                }


                const action =
                    button.dataset.userAction;


                const userId =
                    button.dataset.userId;


                if (
                    action ===
                    "view"
                ) {

                    viewUser(
                        userId
                    );

                    return;

                }


                performUserAction(
                    action,
                    userId
                );

            }
        );

    }


    /* ============================================================
       LOAD USERS
    ============================================================ */

    async function loadUsers() {

        if (!tableContainer) {
            return;
        }


        tableContainer.innerHTML = `

            <div class="admin-users-message">

                <strong>
                    Loading users...
                </strong>

                <span>
                    Connecting securely to the HavenGH API.
                </span>

            </div>

        `;


        try {

            const data =
                await apiRequest(
                    "/api/Users"
                );


            allUsers =
                normalizeUsers(data);


            updateStatistics();


            applyFilters();


            console.log(
                "HavenGH Admin Users:",
                allUsers
            );

        }
        catch (error) {

            console.error(
                "HavenGH Admin Users Error:",
                error
            );


            tableContainer.innerHTML = `

                <div class="admin-users-error">

                    <strong>
                        Unable to load users
                    </strong>

                    <span>
                        ${escapeHtml(
                            error.message ||
                            "An unexpected error occurred."
                        )}
                    </span>


                    <button
                        type="button"
                        class="admin-users-retry"
                        id="retryUsersButton">

                        Try Again

                    </button>

                </div>

            `;


            document
                .getElementById(
                    "retryUsersButton"
                )
                ?.addEventListener(
                    "click",
                    loadUsers
                );

        }

    }


    /* ============================================================
       FILTER EVENTS
    ============================================================ */

    function setupFilters() {

        searchInput?.addEventListener(
            "input",
            applyFilters
        );


        roleFilter?.addEventListener(
            "change",
            applyFilters
        );


        statusFilter?.addEventListener(
            "change",
            applyFilters
        );

    }


    /* ============================================================
       INITIALIZE
    ============================================================ */

    async function initialize() {

        renderDate();

        setupFilters();

        setupUserActions();

        await loadCurrentAdmin();

        await loadUsers();

    }


    /* ============================================================
       DOM READY
    ============================================================ */

    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );


})();

