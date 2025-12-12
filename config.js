// ===== Microsoft Authentication Configuration =====
// To use with real Outlook, register an app at https://portal.azure.com
// and update these values

const msalConfig = {
    auth: {
        clientId: "5bfed9f4-bbb5-4b7f-99f9-ba598fac4111",
        authority: "https://login.microsoftonline.com/common",
        redirectUri: "https://cstarr2.github.io/email-task-manager"
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false
    }
};

// Microsoft Graph API scopes needed for Outlook access
const graphScopes = [
    "User.Read",
    "Mail.Read",
    "Mail.ReadWrite",
    "Calendars.Read"
];

// Outlook folder name to monitor
const ACTION_REQUIRED_FOLDER = "Action Required";

// Default settings
const defaultSettings = {
    dailyNotificationEnabled: true,
    notificationTime: "09:00",
    syncInterval: 15, // minutes
    defaultPriority: "medium"
};
