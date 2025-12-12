// ===== Microsoft Authentication Module =====
// This file handles Microsoft OAuth authentication using MSAL

let msalInstance = null;
let currentUser = null;
let accessToken = null;

// Initialize MSAL instance
async function initializeMSAL() {
    try {
        // Load MSAL library dynamically if needed
        if (typeof msal === 'undefined') {
            await loadScript('https://alcdn.msauth.net/browser/2.38.0/js/msal-browser.min.js');
        }
        
        msalInstance = new msal.PublicClientApplication(msalConfig);
        
        // Handle redirect response
        const response = await msalInstance.handleRedirectPromise();
        if (response) {
            handleLoginResponse(response);
        }
        
        // Check for existing session
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            currentUser = accounts[0];
            await acquireTokenSilent();
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('MSAL initialization error:', error);
        return false;
    }
}

// Load external script dynamically
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Sign in with Microsoft
async function signInWithMicrosoft() {
    try {
        // Check if MSAL is configured
        if (msalConfig.auth.clientId === "YOUR_CLIENT_ID_HERE") {
            showToast('Microsoft authentication not configured. Using demo mode.', 'warning');
            loginDemo();
            return;
        }
        
        await initializeMSAL();
        
        const loginRequest = {
            scopes: graphScopes
        };
        
        // Use popup login for better UX
        const response = await msalInstance.loginPopup(loginRequest);
        handleLoginResponse(response);
        
    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed. Please try again.', 'error');
    }
}

// Handle login response
function handleLoginResponse(response) {
    if (response) {
        currentUser = response.account;
        accessToken = response.accessToken;
        
        // Update UI with user info
        document.getElementById('user-name').textContent = currentUser.name || 'User';
        document.getElementById('user-email').textContent = currentUser.username || '';
        
        // Show dashboard
        showDashboard();
        
        // Sync emails and calendar
        syncEmails();
        syncCalendarEvents();
    }
}

// Acquire token silently
async function acquireTokenSilent() {
    try {
        const tokenRequest = {
            scopes: graphScopes,
            account: currentUser
        };
        
        const response = await msalInstance.acquireTokenSilent(tokenRequest);
        accessToken = response.accessToken;
        return accessToken;
        
    } catch (error) {
        // If silent acquisition fails, try interactive
        if (error instanceof msal.InteractionRequiredAuthError) {
            return await acquireTokenInteractive();
        }
        throw error;
    }
}

// Acquire token interactively
async function acquireTokenInteractive() {
    try {
        const tokenRequest = {
            scopes: graphScopes
        };
        
        const response = await msalInstance.acquireTokenPopup(tokenRequest);
        accessToken = response.accessToken;
        return accessToken;
        
    } catch (error) {
        console.error('Interactive token acquisition failed:', error);
        throw error;
    }
}

// Sign out
function signOut() {
    if (msalInstance && currentUser) {
        msalInstance.logout({
            account: currentUser
        });
    }
    
    // Clear local state
    currentUser = null;
    accessToken = null;
    
    // Clear stored data
    localStorage.removeItem('emailTasks');
    localStorage.removeItem('actionEmails');
    
    // Show login screen
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    
    showToast('You have been signed out', 'success');
}

// Check if authenticated
function isAuthenticated() {
    return currentUser !== null || isDemoMode;
}

// Get access token for API calls
async function getAccessToken() {
    if (isDemoMode) return null;
    
    if (!accessToken) {
        await acquireTokenSilent();
    }
    return accessToken;
}

// Microsoft Graph API call helper
async function callMicrosoftGraph(endpoint, method = 'GET', body = null) {
    const token = await getAccessToken();
    
    if (!token) {
        throw new Error('No access token available');
    }
    
    const options = {
        method: method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, options);
    
    if (!response.ok) {
        throw new Error(`Graph API error: ${response.status}`);
    }
    
    return await response.json();
}

// Get emails from Action Required folder
async function getActionRequiredEmails() {
    try {
        // First, find the Action Required folder
        const folders = await callMicrosoftGraph('/me/mailFolders');
        const actionFolder = folders.value.find(f => 
            f.displayName.toLowerCase() === ACTION_REQUIRED_FOLDER.toLowerCase()
        );
        
        if (!actionFolder) {
            showToast(`Folder "${ACTION_REQUIRED_FOLDER}" not found in Outlook`, 'warning');
            return [];
        }
        
        // Get emails from that folder
        const emails = await callMicrosoftGraph(
            `/me/mailFolders/${actionFolder.id}/messages?$top=50&$orderby=receivedDateTime desc`
        );
        
        return emails.value.map(email => ({
            id: email.id,
            subject: email.subject,
            from: email.from.emailAddress.name || email.from.emailAddress.address,
            fromEmail: email.from.emailAddress.address,
            receivedDate: email.receivedDateTime,
            body: email.bodyPreview,
            isRead: email.isRead,
            importance: email.importance,
            webLink: email.webLink
        }));
        
    } catch (error) {
        console.error('Error fetching emails:', error);
        throw error;
    }
}

// Get today's calendar events for available hours display
async function getTodayCalendarEvents() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const startDateTime = today.toISOString();
        const endDateTime = tomorrow.toISOString();
        
        const events = await callMicrosoftGraph(
            `/me/calendarView?startDateTime=${startDateTime}&endDateTime=${endDateTime}&$select=subject,start,end,showAs&$orderby=start/dateTime`
        );
        
        // Filter to only busy events (not free/tentative) and convert to our format
        return events.value
            .filter(event => event.showAs === 'busy' || event.showAs === 'oof' || event.showAs === 'workingElsewhere')
            .map(event => {
                const startTime = new Date(event.start.dateTime + 'Z');
                const endTime = new Date(event.end.dateTime + 'Z');
                
                return {
                    id: event.id,
                    title: event.subject || 'Busy',
                    startTime: `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`,
                    endTime: `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`
                };
            });
        
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        return [];
    }
}

// Sync calendar events to update meetings array
async function syncCalendarEvents() {
    try {
        const calendarEvents = await getTodayCalendarEvents();
        meetings = calendarEvents;
        renderAvailableHours();
        console.log(`Synced ${calendarEvents.length} calendar events`);
        return calendarEvents;
    } catch (error) {
        console.error('Calendar sync error:', error);
        return [];
    }
}
