// ===== Email Task Manager - Main JavaScript =====

// Global State
let isDemoMode = false;
let tasks = [];
let emails = [];
let completedTasks = [];
let projects = [];
let meetings = [];
let currentEmailFilter = 'all';
let currentMonth = new Date();
let selectedEmailId = null;
let syncIntervalId = null;
let currentProjectView = 'grid';

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    loadStoredData();
    updateGreeting();
    setTodayDate();
    setupEventListeners();
    checkDailyNotification();
}

function loadStoredData() {
    // Load tasks from localStorage
    const storedTasks = localStorage.getItem('emailTasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    }
    
    const storedCompleted = localStorage.getItem('completedTasks');
    if (storedCompleted) {
        completedTasks = JSON.parse(storedCompleted);
    }
    
    const storedEmails = localStorage.getItem('actionEmails');
    if (storedEmails) {
        emails = JSON.parse(storedEmails);
    }
    
    const storedProjects = localStorage.getItem('taskProjects');
    if (storedProjects) {
        projects = JSON.parse(storedProjects);
    }
    
    // Load settings
    const storedSettings = localStorage.getItem('taskManagerSettings');
    if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        document.getElementById('daily-notification').checked = settings.dailyNotificationEnabled;
        document.getElementById('notification-time').value = settings.notificationTime;
        document.getElementById('sync-interval').value = settings.syncInterval;
        document.getElementById('default-priority').value = settings.defaultPriority;
    }
}

function saveData() {
    localStorage.setItem('emailTasks', JSON.stringify(tasks));
    localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
    localStorage.setItem('actionEmails', JSON.stringify(emails));
    localStorage.setItem('taskProjects', JSON.stringify(projects));
}

function saveSettings() {
    const settings = {
        dailyNotificationEnabled: document.getElementById('daily-notification').checked,
        notificationTime: document.getElementById('notification-time').value,
        syncInterval: parseInt(document.getElementById('sync-interval').value),
        defaultPriority: document.getElementById('default-priority').value
    };
    localStorage.setItem('taskManagerSettings', JSON.stringify(settings));
}

function setupEventListeners() {
    // Settings auto-save
    document.getElementById('daily-notification').addEventListener('change', saveSettings);
    document.getElementById('notification-time').addEventListener('change', saveSettings);
    document.getElementById('sync-interval').addEventListener('change', () => {
        saveSettings();
        setupAutoSync();
    });
    document.getElementById('default-priority').addEventListener('change', saveSettings);
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu')) {
            document.getElementById('user-dropdown').classList.add('hidden');
        }
    });
}

// ===== Demo Mode =====
function loginDemo() {
    isDemoMode = true;
    
    // Set demo user info
    document.getElementById('user-name').textContent = 'Demo User';
    document.getElementById('user-email').textContent = 'demo@example.com';
    
    // Load demo data
    loadDemoData();
    
    // Show dashboard
    showDashboard();
    
    showToast('Welcome to Demo Mode! 👋', 'success');
    
    // Show hot tasks after a brief delay
    setTimeout(() => {
        showHotTasksModal();
    }, 1000);
}

function loadDemoData() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 5);
    
    // Demo emails
    emails = [
        {
            id: 'email1',
            subject: 'URGENT: Contract Review Required by EOD',
            from: 'John Smith',
            fromEmail: 'john.smith@acme.com',
            receivedDate: yesterday.toISOString(),
            body: 'Please review the attached contract and provide your approval by end of day. This is critical for the Q4 project launch.',
            isRead: false,
            importance: 'high'
        },
        {
            id: 'email2',
            subject: 'Project Update Meeting - Action Items',
            from: 'Sarah Johnson',
            fromEmail: 'sarah.j@company.com',
            receivedDate: new Date(today.setHours(today.getHours() - 3)).toISOString(),
            body: 'Following up on today\'s meeting. Please complete the action items assigned to you by Friday.',
            isRead: true,
            importance: 'normal'
        },
        {
            id: 'email3',
            subject: 'Budget Approval Needed',
            from: 'Finance Team',
            fromEmail: 'finance@company.com',
            receivedDate: new Date(today.setHours(today.getHours() - 5)).toISOString(),
            body: 'Your budget request for the new equipment is pending approval. Please provide additional justification.',
            isRead: false,
            importance: 'high'
        },
        {
            id: 'email4',
            subject: 'Client Presentation Feedback Request',
            from: 'Mike Williams',
            fromEmail: 'mike.w@client.com',
            receivedDate: yesterday.toISOString(),
            body: 'Could you please review the presentation deck and send your feedback by tomorrow?',
            isRead: true,
            importance: 'normal'
        },
        {
            id: 'email5',
            subject: 'Security Training Completion Required',
            from: 'HR Department',
            fromEmail: 'hr@company.com',
            receivedDate: new Date(yesterday.setDate(yesterday.getDate() - 2)).toISOString(),
            body: 'This is a reminder to complete your annual security training by the deadline.',
            isRead: true,
            importance: 'normal'
        }
    ];
    
    // Demo tasks
    const todayStr = formatDateForInput(new Date());
    const tomorrowStr = formatDateForInput(tomorrow);
    const yesterdayStr = formatDateForInput(new Date(Date.now() - 86400000));
    const nextWeekStr = formatDateForInput(nextWeek);
    
    tasks = [
        {
            id: 'task1',
            title: 'Review and sign contract for Q4 project',
            description: 'Urgent contract review needed for the Q4 project launch',
            dueDate: todayStr,
            dueTime: '17:00',
            priority: 'urgent',
            emailId: 'email1',
            emailSubject: 'URGENT: Contract Review Required by EOD',
            createdAt: yesterday.toISOString(),
            completed: false
        },
        {
            id: 'task2',
            title: 'Complete project meeting action items',
            description: 'Action items from the project update meeting',
            dueDate: tomorrowStr,
            dueTime: '12:00',
            priority: 'high',
            emailId: 'email2',
            emailSubject: 'Project Update Meeting - Action Items',
            createdAt: new Date().toISOString(),
            completed: false
        },
        {
            id: 'task3',
            title: 'Submit budget justification',
            description: 'Provide additional justification for equipment budget request',
            dueDate: yesterdayStr,
            dueTime: '09:00',
            priority: 'high',
            emailId: 'email3',
            emailSubject: 'Budget Approval Needed',
            createdAt: new Date().toISOString(),
            completed: false
        },
        {
            id: 'task4',
            title: 'Review client presentation deck',
            description: 'Review and provide feedback on the presentation',
            dueDate: tomorrowStr,
            dueTime: '18:00',
            priority: 'medium',
            emailId: 'email4',
            emailSubject: 'Client Presentation Feedback Request',
            createdAt: yesterday.toISOString(),
            completed: false
        },
        {
            id: 'task5',
            title: 'Complete security training',
            description: 'Annual security training completion required',
            dueDate: nextWeekStr,
            dueTime: '23:59',
            priority: 'low',
            emailId: 'email5',
            emailSubject: 'Security Training Completion Required',
            createdAt: new Date().toISOString(),
            completed: false
        }
    ];
    
    // Demo completed tasks
    completedTasks = [
        {
            id: 'task0',
            title: 'Respond to vendor inquiry',
            description: 'Reply to vendor about pricing questions',
            dueDate: yesterdayStr,
            dueTime: '14:00',
            priority: 'medium',
            projectId: 'proj2',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            completedAt: yesterday.toISOString(),
            completed: true
        }
    ];
    
    // Demo projects
    projects = [
        {
            id: 'proj1',
            name: 'Q4 Product Launch',
            description: 'Launch new product features for Q4 2025',
            color: '#007AFF',
            startDate: formatDateForInput(new Date(Date.now() - 1209600000)), // 2 weeks ago
            endDate: formatDateForInput(new Date(Date.now() + 1209600000)), // 2 weeks from now
            deadline: nextWeekStr,
            milestones: [
                { id: 'm1', name: 'IFR', deadlineType: 'IFR', date: formatDateForInput(new Date(Date.now() - 604800000)), completed: true },
                { id: 'm2', name: 'IFC', deadlineType: 'IFC', date: formatDateForInput(new Date(Date.now() + 259200000)), completed: false },
                { id: 'm3', name: 'FINAL', deadlineType: 'FINAL', date: formatDateForInput(new Date(Date.now() + 1209600000)), completed: false }
            ],
            createdAt: new Date(Date.now() - 604800000).toISOString()
        },
        {
            id: 'proj2',
            name: 'Client Onboarding',
            description: 'Onboard new enterprise clients',
            color: '#34C759',
            startDate: formatDateForInput(new Date(Date.now() - 604800000)), // 1 week ago
            endDate: formatDateForInput(new Date(Date.now() + 2419200000)), // 4 weeks from now
            deadline: null,
            milestones: [
                { id: 'm4', name: 'IFP', deadlineType: 'IFP', date: formatDateForInput(new Date(Date.now() - 432000000)), completed: true },
                { id: 'm5', name: 'IFA', deadlineType: 'IFA', date: formatDateForInput(new Date(Date.now() + 604800000)), completed: false }
            ],
            createdAt: new Date(Date.now() - 1209600000).toISOString()
        },
        {
            id: 'proj3',
            name: 'Security Compliance',
            description: 'Annual security training and compliance tasks',
            color: '#FF9500',
            startDate: formatDateForInput(new Date()),
            endDate: formatDateForInput(new Date(Date.now() + 1814400000)), // 3 weeks from now
            deadline: formatDateForInput(new Date(Date.now() + 1209600000)),
            milestones: [
                { id: 'm6', name: 'REVIEW', deadlineType: 'REVIEW', date: formatDateForInput(new Date(Date.now() + 604800000)), completed: false },
                { id: 'm7', name: 'APPROVAL', deadlineType: 'APPROVAL', date: formatDateForInput(new Date(Date.now() + 1209600000)), completed: false }
            ],
            createdAt: new Date(Date.now() - 2419200000).toISOString()
        }
    ];
    
    // Update tasks with project associations
    tasks[0].projectId = 'proj1';
    tasks[1].projectId = 'proj1';
    tasks[2].projectId = 'proj2';
    tasks[4].projectId = 'proj3';
    
    // Demo meetings for today (for available hours display)
    meetings = [
        { id: 'meet1', title: 'Team Standup', startTime: '09:00', endTime: '09:30' },
        { id: 'meet2', title: 'Project Review', startTime: '10:30', endTime: '11:30' },
        { id: 'meet3', title: 'Client Call', startTime: '13:00', endTime: '14:00' }
    ];
    
    saveData();
}

// ===== Available Hours =====
function renderAvailableHours() {
    const container = document.getElementById('available-hours-container');
    if (!container) return;
    
    const workdayStart = 7; // 7 AM
    const workdayEnd = 15; // 3 PM
    const slotMinutes = 30; // 30 minute intervals
    
    // Build 30-minute interval rows
    let html = '';
    let totalAvailable = 0;
    let totalMeetingTime = 0;
    
    for (let hour = workdayStart; hour < workdayEnd; hour++) {
        for (let halfHour = 0; halfHour < 2; halfHour++) {
            const slotStartMin = hour * 60 + (halfHour * 30);
            const slotEndMin = slotStartMin + 30;
            const slotLabel = formatTimeLabel30(hour, halfHour * 30);
            
            // Find meetings that overlap with this 30-min slot
            const slotMeetings = meetings.filter(m => {
                const meetStart = timeToMinutes(m.startTime);
                const meetEnd = timeToMinutes(m.endTime);
                return meetStart < slotEndMin && meetEnd > slotStartMin;
            });
            
            // Calculate slots for this 30-minute interval
            let slotsHtml = '';
            let currentMinute = 0; // relative to slot start (0-30)
            
            if (slotMeetings.length === 0) {
                // Entire slot is available
                slotsHtml = `<div class="hour-slot available" style="left: 0%; width: 100%;" title="Available: ${slotLabel}"></div>`;
                totalAvailable += 30;
            } else {
                // Sort meetings by start time
                const sortedMeetings = slotMeetings.map(m => ({
                    ...m,
                    startMin: Math.max(timeToMinutes(m.startTime) - slotStartMin, 0),
                    endMin: Math.min(timeToMinutes(m.endTime) - slotStartMin, 30)
                })).sort((a, b) => a.startMin - b.startMin);
                
                sortedMeetings.forEach(meeting => {
                    // Add available slot before meeting if there's a gap
                    if (meeting.startMin > currentMinute) {
                        const availableWidth = ((meeting.startMin - currentMinute) / 30) * 100;
                        slotsHtml += `<div class="hour-slot available" style="left: ${(currentMinute / 30) * 100}%; width: ${availableWidth}%;" title="Available"></div>`;
                        totalAvailable += (meeting.startMin - currentMinute);
                    }
                    
                    // Add meeting slot
                    const meetingWidth = ((meeting.endMin - meeting.startMin) / 30) * 100;
                    slotsHtml += `<div class="hour-slot meeting" style="left: ${(meeting.startMin / 30) * 100}%; width: ${meetingWidth}%;" title="${escapeHtml(meeting.title)}">${escapeHtml(meeting.title)}</div>`;
                    totalMeetingTime += (meeting.endMin - meeting.startMin);
                    currentMinute = meeting.endMin;
                });
                
                // Add available slot after last meeting if there's time left
                if (currentMinute < 30) {
                    const availableWidth = ((30 - currentMinute) / 30) * 100;
                    slotsHtml += `<div class="hour-slot available" style="left: ${(currentMinute / 30) * 100}%; width: ${availableWidth}%;" title="Available"></div>`;
                    totalAvailable += (30 - currentMinute);
                }
            }
            
            html += `
                <div class="hour-row half-hour">
                    <span class="hour-label">${slotLabel}</span>
                    <div class="hour-bar">
                        ${slotsHtml}
                    </div>
                </div>
            `;
        }
    }
    
    // Add legend
    html += `
        <div class="time-legend">
            <div class="time-legend-item">
                <div class="time-legend-dot available"></div>
                <span>Available</span>
            </div>
            <div class="time-legend-item">
                <div class="time-legend-dot meeting"></div>
                <span>Meeting</span>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Update summary stats
    const availableHoursEl = document.getElementById('total-available-hours');
    const meetingHoursEl = document.getElementById('total-meeting-hours');
    
    if (availableHoursEl) {
        availableHoursEl.textContent = (totalAvailable / 60).toFixed(1);
        availableHoursEl.classList.add('available');
    }
    if (meetingHoursEl) {
        meetingHoursEl.textContent = (totalMeetingTime / 60).toFixed(1);
        meetingHoursEl.classList.add('meeting');
    }
}

function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function formatTimeLabel(hour) {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
}

function formatTimeLabel30(hour, minutes) {
    const suffix = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
    const displayMin = minutes.toString().padStart(2, '0');
    return `${displayHour}:${displayMin} ${suffix}`;
}

// ===== Milestone Functions =====
// Common deadline type options
const DEADLINE_TYPES = [
    { value: 'custom', label: 'Custom' },
    { value: 'IFP', label: 'IFP - Issued for Pricing' },
    { value: 'IFC', label: 'IFC - Issued for Construction' },
    { value: 'IFR', label: 'IFR - Issued for Review' },
    { value: 'IFA', label: 'IFA - Issued for Approval' },
    { value: 'IFB', label: 'IFB - Issued for Bid' },
    { value: 'IFD', label: 'IFD - Issued for Design' },
    { value: 'IFI', label: 'IFI - Issued for Information' },
    { value: 'AFC', label: 'AFC - Approved for Construction' },
    { value: 'FINAL', label: 'Final Submission' },
    { value: 'MILESTONE', label: 'Project Milestone' },
    { value: 'REVIEW', label: 'Review Deadline' },
    { value: 'APPROVAL', label: 'Approval Deadline' }
];

function addMilestoneInput(name = '', date = '', completed = false, deadlineType = 'custom') {
    const container = document.getElementById('milestones-container');
    const id = 'ms_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const typeOptions = DEADLINE_TYPES.map(t => 
        `<option value="${t.value}" ${deadlineType === t.value ? 'selected' : ''}>${t.label}</option>`
    ).join('');
    
    const row = document.createElement('div');
    row.className = 'milestone-input-row';
    row.dataset.milestoneId = id;
    row.innerHTML = `
        <select class="milestone-type" onchange="handleDeadlineTypeChange(this)">
            ${typeOptions}
        </select>
        <input type="text" placeholder="Deadline name" value="${escapeHtml(name)}" class="milestone-name" ${deadlineType !== 'custom' ? 'readonly' : ''}>
        <input type="date" value="${date}" class="milestone-date">
        <select class="milestone-status">
            <option value="pending" ${!completed ? 'selected' : ''}>Pending</option>
            <option value="completed" ${completed ? 'selected' : ''}>Completed</option>
        </select>
        <button type="button" class="milestone-remove-btn" onclick="removeMilestone(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(row);
}

function handleDeadlineTypeChange(select) {
    const row = select.closest('.milestone-input-row');
    const nameInput = row.querySelector('.milestone-name');
    const selectedType = select.value;
    
    if (selectedType === 'custom') {
        nameInput.readOnly = false;
        nameInput.value = '';
        nameInput.placeholder = 'Enter deadline name';
    } else {
        const typeInfo = DEADLINE_TYPES.find(t => t.value === selectedType);
        nameInput.readOnly = true;
        nameInput.value = typeInfo ? typeInfo.value : selectedType;
    }
}

function removeMilestone(button) {
    const row = button.closest('.milestone-input-row');
    if (row) {
        row.remove();
    }
}

function getMilestonesFromForm() {
    const container = document.getElementById('milestones-container');
    const rows = container.querySelectorAll('.milestone-input-row');
    const milestones = [];
    
    rows.forEach(row => {
        const deadlineType = row.querySelector('.milestone-type').value;
        const name = row.querySelector('.milestone-name').value.trim();
        const date = row.querySelector('.milestone-date').value;
        const status = row.querySelector('.milestone-status').value;
        
        if (name && date) {
            milestones.push({
                id: row.dataset.milestoneId || 'ms_' + Date.now(),
                deadlineType,
                name,
                date,
                completed: status === 'completed'
            });
        }
    });
    
    return milestones;
}

function renderMilestonesInForm(milestones) {
    const container = document.getElementById('milestones-container');
    container.innerHTML = '';
    
    if (milestones && milestones.length > 0) {
        milestones.forEach(m => {
            addMilestoneInput(m.name, m.date, m.completed, m.deadlineType || 'custom');
        });
    }
}

function getMilestoneBadgesHtml(milestones) {
    if (!milestones || milestones.length === 0) return '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return `
        <div class="project-milestones">
            ${milestones.slice(0, 3).map(m => {
                const mDate = new Date(m.date);
                mDate.setHours(0, 0, 0, 0);
                
                let statusClass = '';
                if (m.completed) {
                    statusClass = 'completed';
                } else if (mDate < today) {
                    statusClass = 'overdue';
                } else if (mDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
                    statusClass = 'upcoming';
                }
                
                return `
                    <span class="milestone-badge ${statusClass}" title="${escapeHtml(m.name)}: ${formatDate(m.date)}">
                        <i class="fas ${m.completed ? 'fa-check-circle' : 'fa-flag'}"></i>
                        ${escapeHtml(m.name)}
                    </span>
                `;
            }).join('')}
            ${milestones.length > 3 ? `<span class="milestone-badge">+${milestones.length - 3} more</span>` : ''}
        </div>
    `;
}

// ===== Dashboard Display =====
function showDashboard() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    
    // Update all displays
    updateDashboard();
    renderEmails();
    renderTasks();
    renderCompletedTasks();
    renderCalendar();
    renderProjects();
    populateProjectDropdown();
    
    // Setup auto-sync
    setupAutoSync();
}

function updateDashboard() {
    updateStats();
    renderPriorityTasks();
    renderRecentEmails();
    renderTimeline();
    updateTaskChart();
    updateBadges();
    renderAvailableHours();
}

function updateStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Count hot/urgent tasks (due today or overdue)
    const hotTasks = tasks.filter(t => {
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate <= today;
    });
    
    // Count pending tasks
    const pendingTasks = tasks.length;
    
    // Count completed today
    const completedToday = completedTasks.filter(t => {
        const completedDate = new Date(t.completedAt);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === today.getTime();
    }).length;
    
    document.getElementById('stat-urgent').textContent = hotTasks.length;
    document.getElementById('stat-pending').textContent = pendingTasks;
    document.getElementById('stat-completed').textContent = completedToday;
    
    // Update hot notification dot
    const hotDot = document.getElementById('hot-notification-dot');
    if (hotTasks.length > 0) {
        hotDot.classList.add('active');
    } else {
        hotDot.classList.remove('active');
    }
}

function updateBadges() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    
    // Count by category
    let overdueCount = 0;
    let todayCount = 0;
    let weekCount = 0;
    
    tasks.forEach(t => {
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        if (dueDate < today) {
            overdueCount++;
        } else if (dueDate.getTime() === today.getTime()) {
            todayCount++;
        } else if (dueDate <= endOfWeek) {
            weekCount++;
        }
    });
    
    document.getElementById('email-count').textContent = emails.length;
    document.getElementById('task-count').textContent = tasks.length;
    document.getElementById('overdue-count').textContent = overdueCount;
    document.getElementById('today-count').textContent = todayCount;
    document.getElementById('week-count').textContent = weekCount;
    document.getElementById('project-count').textContent = projects.length;
}

function renderPriorityTasks() {
    const container = document.getElementById('priority-tasks-list');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get priority tasks (overdue and due today, sorted by priority)
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const priorityTasks = tasks
        .filter(t => {
            const dueDate = new Date(t.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate <= today;
        })
        .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
        .slice(0, 5);
    
    if (priorityTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h3>All caught up!</h3>
                <p>No urgent tasks for today</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = priorityTasks.map(task => {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const isOverdue = dueDate < today;
        const isToday = dueDate.getTime() === today.getTime();
        const project = task.projectId ? projects.find(p => p.id === task.projectId) : null;
        
        return `
            <div class="task-item" onclick="openEditTaskModal('${task.id}')">
                <div class="task-checkbox" onclick="event.stopPropagation(); toggleTaskComplete('${task.id}')">
                    <i class="fas fa-check" style="display: none;"></i>
                </div>
                <div class="task-content">
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    <div class="task-meta">
                        <span class="priority-badge ${task.priority}">${task.priority}</span>
                        ${project ? `<span class="task-project-badge" style="background: ${project.color};"><i class="fas fa-folder"></i> ${escapeHtml(project.name)}</span>` : ''}
                        <span class="due-date ${isOverdue ? 'overdue' : isToday ? 'today' : ''}">
                            <i class="fas fa-clock"></i>
                            ${isOverdue ? 'Overdue' : isToday ? 'Due today' : formatDate(task.dueDate)}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderRecentEmails() {
    const container = document.getElementById('recent-emails-list');
    const recentEmails = emails.slice(0, 4);
    
    if (recentEmails.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>No emails</h3>
                <p>Sync to check for new emails</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentEmails.map(email => `
        <div class="email-item" onclick="openEmailModal('${email.id}')">
            <div class="email-content">
                <div class="email-subject">${escapeHtml(email.subject)}</div>
                <div class="email-meta">
                    <span class="email-sender">${escapeHtml(email.from)}</span>
                    <span>${formatRelativeTime(email.receivedDate)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderTimeline() {
    const container = document.getElementById('timeline-list');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Sort tasks by due date
    const upcomingTasks = [...tasks]
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);
    
    if (upcomingTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-check"></i>
                <h3>No upcoming deadlines</h3>
                <p>Add tasks to see them here</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = upcomingTasks.map(task => {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const isOverdue = dueDate < today;
        const isToday = dueDate.getTime() === today.getTime();
        
        return `
            <div class="timeline-item ${isOverdue ? 'overdue' : isToday ? 'today' : ''}">
                <div class="timeline-date">${isOverdue ? 'Overdue' : isToday ? 'Today' : formatDate(task.dueDate)}</div>
                <div class="timeline-title">${escapeHtml(task.title)}</div>
            </div>
        `;
    }).join('');
}

function updateTaskChart() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    
    let overdue = 0, dueToday = 0, thisWeek = 0, later = 0;
    
    tasks.forEach(t => {
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        if (dueDate < today) overdue++;
        else if (dueDate.getTime() === today.getTime()) dueToday++;
        else if (dueDate <= endOfWeek) thisWeek++;
        else later++;
    });
    
    const total = tasks.length;
    document.getElementById('total-tasks-chart').textContent = total;
    
    // Update chart percentages (CSS-based donut chart)
    // This is a simplified representation
}

// ===== Email Functions =====
function renderEmails() {
    const container = document.getElementById('emails-container');
    
    let filteredEmails = emails;
    if (currentEmailFilter === 'unread') {
        filteredEmails = emails.filter(e => !e.isRead);
    } else if (currentEmailFilter === 'flagged') {
        filteredEmails = emails.filter(e => e.importance === 'high');
    }
    
    if (filteredEmails.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>No emails found</h3>
                <p>${currentEmailFilter === 'all' ? 'Sync to check for new emails in your Action Required folder' : 'No emails match this filter'}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredEmails.map(email => {
        const initials = email.from.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const hasTask = tasks.some(t => t.emailId === email.id);
        
        return `
            <div class="email-card ${!email.isRead ? 'unread' : ''}" onclick="openEmailModal('${email.id}')">
                <div class="email-avatar">${initials}</div>
                <div class="email-details">
                    <div class="email-header">
                        <span class="email-sender-name">${escapeHtml(email.from)}</span>
                        <span class="email-time">${formatRelativeTime(email.receivedDate)}</span>
                    </div>
                    <div class="email-subject-line">${escapeHtml(email.subject)}</div>
                    <div class="email-preview">${escapeHtml(email.body)}</div>
                </div>
                <div class="email-actions">
                    ${hasTask ? 
                        '<button class="action-btn" title="Task Created"><i class="fas fa-check"></i></button>' : 
                        `<button class="action-btn convert-btn" title="Convert to Task" onclick="event.stopPropagation(); quickConvertToTask('${email.id}')"><i class="fas fa-tasks"></i></button>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

function setEmailFilter(filter) {
    currentEmailFilter = filter;
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase() === filter);
    });
    
    renderEmails();
}

async function syncEmails() {
    const syncIcon = document.getElementById('sync-icon');
    const syncStatusText = document.getElementById('sync-status-text');
    
    syncIcon.classList.add('syncing');
    syncStatusText.textContent = 'Syncing...';
    
    try {
        if (!isDemoMode && isAuthenticated()) {
            // Real sync with Microsoft Graph
            emails = await getActionRequiredEmails();
            saveData();
        }
        
        // Update UI
        renderEmails();
        renderRecentEmails();
        updateBadges();
        
        syncStatusText.textContent = `Last sync: ${formatTime(new Date())}`;
        showToast('Emails synced successfully', 'success');
        
    } catch (error) {
        console.error('Sync error:', error);
        syncStatusText.textContent = 'Sync failed';
        showToast('Failed to sync emails', 'error');
    } finally {
        syncIcon.classList.remove('syncing');
    }
}

function setupAutoSync() {
    // Clear existing interval
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
    }
    
    // Get sync interval from settings
    const interval = parseInt(document.getElementById('sync-interval').value) * 60 * 1000;
    
    // Set up new interval
    syncIntervalId = setInterval(() => {
        if (!isDemoMode && isAuthenticated()) {
            syncEmails();
        }
    }, interval);
}

// ===== Task Functions =====
function renderTasks() {
    const container = document.getElementById('tasks-container');
    
    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>No tasks yet</h3>
                <p>Convert emails to tasks or add new ones</p>
            </div>
        `;
        return;
    }
    
    // Sort tasks
    const sortBy = document.getElementById('task-sort').value;
    const sortedTasks = [...tasks].sort((a, b) => {
        if (sortBy === 'dueDate') {
            return new Date(a.dueDate) - new Date(b.dueDate);
        } else if (sortBy === 'priority') {
            const order = { urgent: 0, high: 1, medium: 2, low: 3 };
            return order[a.priority] - order[b.priority];
        } else {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    container.innerHTML = sortedTasks.map(task => {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const isOverdue = dueDate < today;
        const isToday = dueDate.getTime() === today.getTime();
        const project = task.projectId ? projects.find(p => p.id === task.projectId) : null;
        
        return `
            <div class="task-card" onclick="openEditTaskModal('${task.id}')">
                <div class="task-priority-bar ${task.priority}"></div>
                <div class="task-card-content">
                    <div class="task-checkbox" onclick="event.stopPropagation(); toggleTaskComplete('${task.id}')">
                        <i class="fas fa-check" style="display: none;"></i>
                    </div>
                    <div class="task-details">
                        <div class="task-title-line">${escapeHtml(task.title)}</div>
                        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                        <div class="task-footer">
                            <span class="priority-badge ${task.priority}">${task.priority}</span>
                            ${project ? `<span class="task-project-badge" style="background: ${project.color};"><i class="fas fa-folder"></i> ${escapeHtml(project.name)}</span>` : ''}
                            <span class="task-due ${isOverdue ? 'overdue' : isToday ? 'today' : ''}">
                                <i class="fas fa-clock"></i>
                                ${isOverdue ? 'Overdue: ' : ''}${formatDate(task.dueDate)}${task.dueTime ? ' at ' + formatTime12h(task.dueTime) : ''}
                            </span>
                            ${task.emailSubject ? `
                                <span class="task-email-link" onclick="event.stopPropagation(); openEmailModal('${task.emailId}')">
                                    <i class="fas fa-envelope"></i>
                                    Linked email
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderCompletedTasks() {
    const container = document.getElementById('completed-container');
    
    if (completedTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h3>No completed tasks</h3>
                <p>Completed tasks will appear here</p>
            </div>
        `;
        return;
    }
    
    const sortedCompleted = [...completedTasks].sort((a, b) => 
        new Date(b.completedAt) - new Date(a.completedAt)
    );
    
    container.innerHTML = sortedCompleted.map(task => `
        <div class="task-card completed">
            <div class="task-priority-bar ${task.priority}"></div>
            <div class="task-card-content">
                <div class="task-checkbox checked">
                    <i class="fas fa-check"></i>
                </div>
                <div class="task-details">
                    <div class="task-title-line" style="text-decoration: line-through; opacity: 0.7;">${escapeHtml(task.title)}</div>
                    <div class="task-footer">
                        <span class="task-due">
                            <i class="fas fa-check-circle"></i>
                            Completed ${formatRelativeTime(task.completedAt)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function sortTasks(sortBy) {
    renderTasks();
}

function toggleTaskComplete(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    const task = tasks[taskIndex];
    task.completed = true;
    task.completedAt = new Date().toISOString();
    
    // Move to completed
    completedTasks.unshift(task);
    tasks.splice(taskIndex, 1);
    
    saveData();
    updateDashboard();
    renderTasks();
    renderCompletedTasks();
    
    showToast('Task completed! 🎉', 'success');
}

function openAddTaskModal() {
    document.getElementById('task-modal-title').textContent = 'Add New Task';
    document.getElementById('task-form').reset();
    document.getElementById('task-id').value = '';
    document.getElementById('task-due-date').value = formatDateForInput(new Date());
    document.getElementById('task-email-link').value = '';
    document.getElementById('task-project').value = '';
    selectedEmailId = null;
    populateProjectDropdown();
    
    document.getElementById('task-modal').classList.remove('hidden');
}

function openEditTaskModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    populateProjectDropdown();
    
    document.getElementById('task-modal-title').textContent = 'Edit Task';
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-due-date').value = task.dueDate;
    document.getElementById('task-due-time').value = task.dueTime || '';
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-project').value = task.projectId || '';
    document.getElementById('task-email-link').value = task.emailSubject || '';
    selectedEmailId = task.emailId;
    
    document.getElementById('task-modal').classList.remove('hidden');
}

function closeTaskModal() {
    document.getElementById('task-modal').classList.add('hidden');
}

function saveTask() {
    const taskId = document.getElementById('task-id').value;
    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const dueDate = document.getElementById('task-due-date').value;
    const dueTime = document.getElementById('task-due-time').value;
    const priority = document.getElementById('task-priority').value;
    const projectId = document.getElementById('task-project').value || null;
    
    if (!title || !dueDate) {
        showToast('Please fill in required fields', 'error');
        return;
    }
    
    if (taskId) {
        // Edit existing task
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = {
                ...tasks[taskIndex],
                title,
                description,
                dueDate,
                dueTime,
                priority,
                projectId
            };
        }
        showToast('Task updated', 'success');
    } else {
        // Create new task
        const newTask = {
            id: 'task_' + Date.now(),
            title,
            description,
            dueDate,
            dueTime,
            priority,
            projectId,
            emailId: selectedEmailId,
            emailSubject: selectedEmailId ? emails.find(e => e.id === selectedEmailId)?.subject : null,
            createdAt: new Date().toISOString(),
            completed: false
        };
        tasks.push(newTask);
        showToast('Task created', 'success');
    }
    
    saveData();
    closeTaskModal();
    updateDashboard();
    renderTasks();
    renderCalendar();
    renderProjects();
}

function quickConvertToTask(emailId) {
    const email = emails.find(e => e.id === emailId);
    if (!email) return;
    
    const defaultPriority = document.getElementById('default-priority').value;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const newTask = {
        id: 'task_' + Date.now(),
        title: email.subject,
        description: email.body,
        dueDate: formatDateForInput(tomorrow),
        dueTime: '17:00',
        priority: email.importance === 'high' ? 'high' : defaultPriority,
        emailId: email.id,
        emailSubject: email.subject,
        createdAt: new Date().toISOString(),
        completed: false
    };
    
    tasks.push(newTask);
    saveData();
    
    updateDashboard();
    renderEmails();
    renderTasks();
    renderCalendar();
    
    showToast('Email converted to task', 'success');
}

function convertAllToTasks() {
    const unconvertedEmails = emails.filter(e => !tasks.some(t => t.emailId === e.id));
    
    if (unconvertedEmails.length === 0) {
        showToast('All emails already have tasks', 'info');
        return;
    }
    
    const defaultPriority = document.getElementById('default-priority').value;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    unconvertedEmails.forEach(email => {
        const newTask = {
            id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            title: email.subject,
            description: email.body,
            dueDate: formatDateForInput(tomorrow),
            dueTime: '17:00',
            priority: email.importance === 'high' ? 'high' : defaultPriority,
            emailId: email.id,
            emailSubject: email.subject,
            createdAt: new Date().toISOString(),
            completed: false
        };
        tasks.push(newTask);
    });
    
    saveData();
    updateDashboard();
    renderEmails();
    renderTasks();
    renderCalendar();
    
    showToast(`${unconvertedEmails.length} emails converted to tasks`, 'success');
}

function clearCompleted() {
    if (completedTasks.length === 0) return;
    
    if (confirm('Are you sure you want to clear all completed tasks?')) {
        completedTasks = [];
        saveData();
        renderCompletedTasks();
        showToast('Completed tasks cleared', 'success');
    }
}

function filterTasks(filter) {
    showSection('tasks');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    
    // Apply filter to task display
    const container = document.getElementById('tasks-container');
    const filteredTasks = tasks.filter(t => {
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        switch (filter) {
            case 'overdue':
                return dueDate < today;
            case 'today':
                return dueDate.getTime() === today.getTime();
            case 'week':
                return dueDate > today && dueDate <= endOfWeek;
            default:
                return true;
        }
    });
    
    if (filteredTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h3>No ${filter} tasks</h3>
                <p>Great job staying on top of things!</p>
            </div>
        `;
        return;
    }
    
    // Render filtered tasks
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const sortedTasks = filteredTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    container.innerHTML = sortedTasks.map(task => {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const isOverdue = dueDate < today;
        const isToday = dueDate.getTime() === today.getTime();
        
        return `
            <div class="task-card" onclick="openEditTaskModal('${task.id}')">
                <div class="task-priority-bar ${task.priority}"></div>
                <div class="task-card-content">
                    <div class="task-checkbox" onclick="event.stopPropagation(); toggleTaskComplete('${task.id}')">
                        <i class="fas fa-check" style="display: none;"></i>
                    </div>
                    <div class="task-details">
                        <div class="task-title-line">${escapeHtml(task.title)}</div>
                        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                        <div class="task-footer">
                            <span class="priority-badge ${task.priority}">${task.priority}</span>
                            <span class="task-due ${isOverdue ? 'overdue' : isToday ? 'today' : ''}">
                                <i class="fas fa-clock"></i>
                                ${isOverdue ? 'Overdue: ' : ''}${formatDate(task.dueDate)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function searchTasks(query) {
    if (!query.trim()) {
        renderTasks();
        return;
    }
    
    const searchLower = query.toLowerCase();
    const filtered = tasks.filter(t => 
        t.title.toLowerCase().includes(searchLower) ||
        (t.description && t.description.toLowerCase().includes(searchLower))
    );
    
    const container = document.getElementById('tasks-container');
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No matching tasks</h3>
                <p>Try a different search term</p>
            </div>
        `;
        return;
    }
    
    // Render filtered tasks (simplified)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    container.innerHTML = filtered.map(task => {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const isOverdue = dueDate < today;
        
        return `
            <div class="task-card" onclick="openEditTaskModal('${task.id}')">
                <div class="task-priority-bar ${task.priority}"></div>
                <div class="task-card-content">
                    <div class="task-checkbox" onclick="event.stopPropagation(); toggleTaskComplete('${task.id}')">
                        <i class="fas fa-check" style="display: none;"></i>
                    </div>
                    <div class="task-details">
                        <div class="task-title-line">${escapeHtml(task.title)}</div>
                        <div class="task-footer">
                            <span class="priority-badge ${task.priority}">${task.priority}</span>
                            <span class="task-due ${isOverdue ? 'overdue' : ''}">
                                <i class="fas fa-clock"></i>
                                ${formatDate(task.dueDate)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== Email Modal =====
function openEmailModal(emailId) {
    const email = emails.find(e => e.id === emailId);
    if (!email) return;
    
    selectedEmailId = emailId;
    
    document.getElementById('email-subject').textContent = email.subject;
    document.getElementById('email-from').textContent = `${email.from} <${email.fromEmail}>`;
    document.getElementById('email-date').textContent = formatFullDate(email.receivedDate);
    document.getElementById('email-body').innerHTML = escapeHtml(email.body);
    
    // Mark as read
    email.isRead = true;
    saveData();
    renderEmails();
    
    document.getElementById('email-modal').classList.remove('hidden');
}

function closeEmailModal() {
    document.getElementById('email-modal').classList.add('hidden');
    selectedEmailId = null;
}

function convertEmailToTask() {
    if (!selectedEmailId) return;
    
    const email = emails.find(e => e.id === selectedEmailId);
    if (!email) return;
    
    // Check if task already exists
    if (tasks.some(t => t.emailId === selectedEmailId)) {
        showToast('Task already exists for this email', 'warning');
        closeEmailModal();
        return;
    }
    
    // Open task modal with email data pre-filled
    closeEmailModal();
    
    document.getElementById('task-modal-title').textContent = 'Create Task from Email';
    document.getElementById('task-id').value = '';
    document.getElementById('task-title').value = email.subject;
    document.getElementById('task-description').value = email.body;
    document.getElementById('task-due-date').value = formatDateForInput(new Date(Date.now() + 86400000)); // Tomorrow
    document.getElementById('task-due-time').value = '17:00';
    document.getElementById('task-priority').value = email.importance === 'high' ? 'high' : 'medium';
    document.getElementById('task-email-link').value = email.subject;
    
    document.getElementById('task-modal').classList.remove('hidden');
}

// ===== Calendar Functions =====
function renderCalendar() {
    const container = document.getElementById('calendar-grid');
    const monthDisplay = document.getElementById('current-month');
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    monthDisplay.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentMonth);
    
    // Get first day of month and total days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    // Get today for highlighting
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Build calendar HTML
    let html = '';
    
    // Previous month days
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        html += `<div class="calendar-day other-month"><span class="day-number">${day}</span></div>`;
    }
    
    // Current month days
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        const isToday = date.getTime() === today.getTime();
        const dateStr = formatDateForInput(date);
        
        // Get tasks for this day
        const dayTasks = tasks.filter(t => t.dueDate === dateStr);
        
        html += `
            <div class="calendar-day ${isToday ? 'today' : ''}" onclick="showDayTasks('${dateStr}')">
                <span class="day-number">${day}</span>
                <div class="day-tasks">
                    ${dayTasks.slice(0, 3).map(t => `
                        <div class="day-task ${t.priority}">${escapeHtml(t.title.substring(0, 15))}${t.title.length > 15 ? '...' : ''}</div>
                    `).join('')}
                    ${dayTasks.length > 3 ? `<div class="day-task">+${dayTasks.length - 3} more</div>` : ''}
                </div>
            </div>
        `;
    }
    
    // Next month days
    const remainingCells = 42 - (startingDay + totalDays);
    for (let day = 1; day <= remainingCells; day++) {
        html += `<div class="calendar-day other-month"><span class="day-number">${day}</span></div>`;
    }
    
    container.innerHTML = html;
}

function prevMonth() {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderCalendar();
}

function showDayTasks(dateStr) {
    // Filter tasks for this date and show them
    const dayTasks = tasks.filter(t => t.dueDate === dateStr);
    
    if (dayTasks.length === 0) {
        showToast('No tasks on this day', 'info');
        return;
    }
    
    // Switch to tasks view with filter
    showSection('tasks');
    
    const container = document.getElementById('tasks-container');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    container.innerHTML = `
        <div style="margin-bottom: 16px;">
            <button class="btn btn-secondary" onclick="renderTasks()">
                <i class="fas fa-arrow-left"></i> Show All Tasks
            </button>
            <span style="margin-left: 12px; color: var(--text-secondary);">Showing tasks for ${formatDate(dateStr)}</span>
        </div>
    ` + dayTasks.map(task => {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const isOverdue = dueDate < today;
        
        return `
            <div class="task-card" onclick="openEditTaskModal('${task.id}')">
                <div class="task-priority-bar ${task.priority}"></div>
                <div class="task-card-content">
                    <div class="task-checkbox" onclick="event.stopPropagation(); toggleTaskComplete('${task.id}')">
                        <i class="fas fa-check" style="display: none;"></i>
                    </div>
                    <div class="task-details">
                        <div class="task-title-line">${escapeHtml(task.title)}</div>
                        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                        <div class="task-footer">
                            <span class="priority-badge ${task.priority}">${task.priority}</span>
                            <span class="task-due ${isOverdue ? 'overdue' : ''}">
                                <i class="fas fa-clock"></i>
                                ${task.dueTime ? formatTime12h(task.dueTime) : 'All day'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== Hot Tasks Modal =====
function showHotTasksModal() {
    const modal = document.getElementById('hot-tasks-modal');
    const container = document.getElementById('hot-tasks-list');
    
    // Set today's date
    document.getElementById('today-date').textContent = new Intl.DateTimeFormat('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
    }).format(new Date());
    
    // Get hot tasks (overdue and due today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const hotTasks = tasks
        .filter(t => {
            const dueDate = new Date(t.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate <= today;
        })
        .sort((a, b) => {
            // Sort by priority first, then by due date
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
    
    if (hotTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle" style="color: var(--success);"></i>
                <h3>All caught up!</h3>
                <p>No urgent tasks for today. Enjoy your day!</p>
            </div>
        `;
    } else {
        container.innerHTML = hotTasks.map((task, index) => {
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const isOverdue = dueDate < today;
            
            return `
                <div class="hot-task-item ${task.priority === 'urgent' ? '' : 'high'}">
                    <div class="hot-task-number">${index + 1}</div>
                    <div class="hot-task-info">
                        <div class="hot-task-title">${escapeHtml(task.title)}</div>
                        <div class="hot-task-due">
                            <i class="fas fa-clock"></i>
                            ${isOverdue ? 'Overdue since ' + formatDate(task.dueDate) : 'Due today'}
                            ${task.dueTime ? ' at ' + formatTime12h(task.dueTime) : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    modal.classList.remove('hidden');
}

function closeHotTasksModal() {
    document.getElementById('hot-tasks-modal').classList.add('hidden');
}

function checkDailyNotification() {
    const enabled = document.getElementById('daily-notification').checked;
    if (!enabled) return;
    
    // Check if we should show the notification based on stored last shown date
    const lastShown = localStorage.getItem('lastHotTasksNotification');
    const today = new Date().toDateString();
    
    if (lastShown !== today) {
        // Will show after login
        localStorage.setItem('lastHotTasksNotification', today);
    }
}

// ===== Navigation =====
function showSection(section) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === section);
    });
    
    // Update page sections
    document.querySelectorAll('.page-section').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(`section-${section}`).classList.add('active');
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('open');
}

function toggleSettings() {
    document.getElementById('settings-panel').classList.toggle('hidden');
}

function toggleUserMenu() {
    document.getElementById('user-dropdown').classList.toggle('hidden');
}

// ===== Utility Functions =====
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good Morning!';
    
    if (hour >= 12 && hour < 17) {
        greeting = 'Good Afternoon!';
    } else if (hour >= 17) {
        greeting = 'Good Evening!';
    }
    
    document.getElementById('greeting').textContent = greeting;
}

function setTodayDate() {
    const today = new Date();
    document.getElementById('today-date').textContent = new Intl.DateTimeFormat('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
    }).format(today);
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function formatFullDate(dateStr) {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    }).format(date);
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatTime(date) {
    return new Intl.DateTimeFormat('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
    }).format(date);
}

function formatTime12h(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

function formatRelativeTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return formatDate(dateStr);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== Project Functions =====
function populateProjectDropdown() {
    const select = document.getElementById('task-project');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">No Project</option>' + 
        projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    
    select.value = currentValue;
}

function renderProjects() {
    const container = document.getElementById('projects-container');
    const timelineContainer = document.getElementById('projects-timeline');
    const ganttContainer = document.getElementById('projects-gantt');
    
    // Show/hide containers based on view
    container.classList.toggle('hidden', currentProjectView !== 'grid');
    timelineContainer.classList.toggle('hidden', currentProjectView !== 'timeline');
    ganttContainer.classList.toggle('hidden', currentProjectView !== 'gantt');
    
    if (projects.length === 0) {
        const emptyHtml = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-folder-open"></i>
                <h3>No projects yet</h3>
                <p>Create a project to organize your tasks</p>
                <button class="btn btn-primary" onclick="openAddProjectModal()" style="margin-top: 16px;">
                    <i class="fas fa-plus"></i> Create Project
                </button>
            </div>
        `;
        container.innerHTML = emptyHtml;
        timelineContainer.innerHTML = emptyHtml;
        ganttContainer.innerHTML = emptyHtml;
        return;
    }
    
    // Render based on current view
    if (currentProjectView === 'grid') {
        renderProjectsGrid();
    } else if (currentProjectView === 'timeline') {
        renderProjectsTimeline();
    } else if (currentProjectView === 'gantt') {
        renderProjectsGantt();
    }
}

function setProjectView(view) {
    currentProjectView = view;
    
    // Update button states
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.view-btn').classList.add('active');
    
    renderProjects();
}

function renderProjectsGrid() {
    const container = document.getElementById('projects-container');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    container.innerHTML = projects.map(project => {
        // Count tasks for this project
        const projectTasks = tasks.filter(t => t.projectId === project.id);
        const completedProjectTasks = completedTasks.filter(t => t.projectId === project.id);
        const totalTasks = projectTasks.length + completedProjectTasks.length;
        const completedCount = completedProjectTasks.length;
        const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
        
        // Check deadline status
        let deadlineClass = '';
        let deadlineText = '';
        if (project.deadline) {
            const deadline = new Date(project.deadline);
            deadline.setHours(0, 0, 0, 0);
            const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntil < 0) {
                deadlineClass = 'overdue';
                deadlineText = `Overdue by ${Math.abs(daysUntil)} days`;
            } else if (daysUntil <= 7) {
                deadlineClass = 'soon';
                deadlineText = daysUntil === 0 ? 'Due today' : `${daysUntil} days left`;
            } else {
                deadlineText = formatDate(project.deadline);
            }
        }
        
        // Calculate schedule info
        let scheduleHtml = '';
        if (project.startDate && project.endDate) {
            const startDate = new Date(project.startDate);
            const endDate = new Date(project.endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            
            const totalDuration = endDate - startDate;
            const elapsed = today - startDate;
            const remaining = endDate - today;
            
            const timeProgress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
            const todayPosition = timeProgress;
            
            const daysRemaining = Math.ceil(remaining / (1000 * 60 * 60 * 24));
            const totalDays = Math.ceil(totalDuration / (1000 * 60 * 60 * 24));
            const daysElapsed = Math.max(0, totalDays - daysRemaining);
            
            let remainingClass = 'plenty';
            if (daysRemaining <= 0) {
                remainingClass = 'urgent';
            } else if (daysRemaining <= 7) {
                remainingClass = 'moderate';
            }
            
            scheduleHtml = `
                <div class="project-schedule">
                    <div class="schedule-dates">
                        <span>${formatDate(project.startDate)}</span>
                        <span>${formatDate(project.endDate)}</span>
                    </div>
                    <div class="schedule-progress-bar">
                        <div class="schedule-progress-fill" style="width: ${timeProgress}%; background: ${project.color};"></div>
                        ${todayPosition > 0 && todayPosition < 100 ? `<div class="schedule-progress-today" style="left: ${todayPosition}%;"></div>` : ''}
                    </div>
                    <div class="schedule-time-info">
                        <span class="time-elapsed">${daysElapsed} of ${totalDays} days</span>
                        <span class="time-remaining ${remainingClass}">
                            ${daysRemaining <= 0 ? 'Schedule ended' : `${daysRemaining} days remaining`}
                        </span>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="project-card" onclick="showProjectTasks('${project.id}')">
                <div class="project-card-header" style="background: ${project.color};">
                    <h3>${escapeHtml(project.name)}</h3>
                    <p>${escapeHtml(project.description || 'No description')}</p>
                    <div class="project-card-actions">
                        <button onclick="event.stopPropagation(); openEditProjectModal('${project.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="event.stopPropagation(); deleteProject('${project.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="project-card-body">
                    <div class="project-stats">
                        <div class="project-stat">
                            <span class="project-stat-value">${projectTasks.length}</span>
                            <span class="project-stat-label">Active Tasks</span>
                        </div>
                        <div class="project-stat">
                            <span class="project-stat-value">${completedCount}</span>
                            <span class="project-stat-label">Completed</span>
                        </div>
                    </div>
                    <div class="project-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%; background: ${project.color};"></div>
                        </div>
                        <div class="progress-label">
                            <span>Task Progress</span>
                            <span>${progress}%</span>
                        </div>
                    </div>
                    ${project.deadline ? `
                        <div class="project-deadline ${deadlineClass}">
                            <i class="fas fa-flag"></i>
                            Deadline: ${deadlineText}
                        </div>
                    ` : ''}
                    ${scheduleHtml}
                    ${getMilestoneBadgesHtml(project.milestones)}
                </div>
            </div>
        `;
    }).join('');
}

function renderProjectsTimeline() {
    const container = document.getElementById('projects-timeline');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    container.innerHTML = projects.map(project => {
        const projectTasks = tasks.filter(t => t.projectId === project.id);
        const completedProjectTasks = completedTasks.filter(t => t.projectId === project.id);
        const totalTasks = projectTasks.length + completedProjectTasks.length;
        const completedCount = completedProjectTasks.length;
        const taskProgress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
        
        // Calculate schedule status
        let scheduleStatus = 'on-track';
        let statusText = 'On Track';
        let statusIcon = 'fa-check-circle';
        let scheduleBarHtml = '<div style="padding: 20px; text-align: center; color: var(--text-tertiary);">No schedule set</div>';
        
        if (project.startDate && project.endDate) {
            const startDate = new Date(project.startDate);
            const endDate = new Date(project.endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            
            const totalDuration = endDate - startDate;
            const elapsed = today - startDate;
            const timeProgress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
            
            // Compare time progress with task progress
            if (today > endDate) {
                if (taskProgress < 100) {
                    scheduleStatus = 'behind';
                    statusText = 'Behind Schedule';
                    statusIcon = 'fa-exclamation-circle';
                } else {
                    scheduleStatus = 'completed';
                    statusText = 'Completed';
                    statusIcon = 'fa-check-circle';
                }
            } else if (timeProgress > taskProgress + 20) {
                scheduleStatus = 'behind';
                statusText = 'Behind Schedule';
                statusIcon = 'fa-exclamation-circle';
            } else if (timeProgress > taskProgress + 10) {
                scheduleStatus = 'at-risk';
                statusText = 'At Risk';
                statusIcon = 'fa-exclamation-triangle';
            }
            
            const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            
            scheduleBarHtml = `
                <div class="schedule-bar-container">
                    <div class="schedule-bar" style="left: 0; width: 100%; background: ${project.color};">
                        <div class="schedule-bar-progress" style="width: ${taskProgress}%;"></div>
                        ${formatDate(project.startDate)} — ${formatDate(project.endDate)}
                    </div>
                    ${timeProgress > 0 && timeProgress < 100 ? `<div class="schedule-today-marker" style="left: ${timeProgress}%;"></div>` : ''}
                </div>
                <div class="schedule-info">
                    <span>${daysRemaining > 0 ? `${daysRemaining} days remaining` : daysRemaining === 0 ? 'Ends today' : 'Schedule ended'}</span>
                    <span class="schedule-status ${scheduleStatus}">
                        <i class="fas ${statusIcon}"></i>
                        ${statusText}
                    </span>
                </div>
            `;
        }
        
        return `
            <div class="timeline-project-card">
                <div class="timeline-project-header">
                    <div class="timeline-project-color" style="background: ${project.color};"></div>
                    <span class="timeline-project-name">${escapeHtml(project.name)}</span>
                    <span class="timeline-project-dates">
                        <i class="fas fa-tasks"></i>
                        ${taskProgress}% complete (${completedCount}/${totalTasks} tasks)
                    </span>
                </div>
                <div class="timeline-project-body">
                    ${scheduleBarHtml}
                </div>
            </div>
        `;
    }).join('');
}

function renderProjectsGantt() {
    const container = document.getElementById('projects-gantt');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Determine date range for Gantt chart (3 months view)
    const startMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endMonth = new Date(today.getFullYear(), today.getMonth() + 4, 0);
    const months = [];
    
    for (let d = new Date(startMonth); d <= endMonth; d.setMonth(d.getMonth() + 1)) {
        months.push(new Date(d));
    }
    
    const totalDays = Math.ceil((endMonth - startMonth) / (1000 * 60 * 60 * 24));
    
    // Calculate today position
    const todayOffset = Math.ceil((today - startMonth) / (1000 * 60 * 60 * 24));
    const todayPercent = (todayOffset / totalDays) * 100;
    
    // Build header
    const headerHtml = `
        <div class="gantt-header">
            <div class="gantt-header-project">Project</div>
            <div class="gantt-header-timeline">
                ${months.map(m => {
                    const isCurrent = m.getMonth() === today.getMonth() && m.getFullYear() === today.getFullYear();
                    return `<div class="gantt-month ${isCurrent ? 'current' : ''}">${m.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>`;
                }).join('')}
            </div>
        </div>
    `;
    
    // Build rows
    const rowsHtml = projects.map(project => {
        const projectTasks = tasks.filter(t => t.projectId === project.id);
        const completedProjectTasks = completedTasks.filter(t => t.projectId === project.id);
        const totalTasks = projectTasks.length + completedProjectTasks.length;
        const completedCount = completedProjectTasks.length;
        const taskProgress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
        
        let barHtml = '';
        let deadlineHtml = '';
        
        if (project.startDate && project.endDate) {
            const startDate = new Date(project.startDate);
            const endDate = new Date(project.endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            
            const barStart = Math.max(0, Math.ceil((startDate - startMonth) / (1000 * 60 * 60 * 24)));
            const barEnd = Math.ceil((endDate - startMonth) / (1000 * 60 * 60 * 24));
            const barWidth = Math.min(barEnd - barStart, totalDays - barStart);
            
            const barStartPercent = (barStart / totalDays) * 100;
            const barWidthPercent = (barWidth / totalDays) * 100;
            
            if (barWidthPercent > 0 && barStartPercent < 100) {
                barHtml = `
                    <div class="gantt-bar" style="left: ${barStartPercent}%; width: ${barWidthPercent}%; background: ${project.color};" 
                         onclick="event.stopPropagation(); showProjectTasks('${project.id}')">
                        <div class="gantt-bar-progress" style="width: ${taskProgress}%;"></div>
                        ${barWidthPercent > 10 ? escapeHtml(project.name) : ''}
                    </div>
                `;
            }
        }
        
        if (project.deadline) {
            const deadline = new Date(project.deadline);
            deadline.setHours(0, 0, 0, 0);
            const deadlineOffset = Math.ceil((deadline - startMonth) / (1000 * 60 * 60 * 24));
            const deadlinePercent = (deadlineOffset / totalDays) * 100;
            
            if (deadlinePercent >= 0 && deadlinePercent <= 100) {
                deadlineHtml = `
                    <div class="gantt-deadline-marker" style="left: ${deadlinePercent}%;" title="Deadline: ${formatDate(project.deadline)}">
                        <i class="fas fa-flag"></i>
                    </div>
                `;
            }
        }
        
        // Build milestone markers for Gantt
        let milestonesHtml = '';
        if (project.milestones && project.milestones.length > 0) {
            milestonesHtml = project.milestones.map(m => {
                const mDate = new Date(m.date);
                mDate.setHours(0, 0, 0, 0);
                const mOffset = Math.ceil((mDate - startMonth) / (1000 * 60 * 60 * 24));
                const mPercent = (mOffset / totalDays) * 100;
                
                if (mPercent >= 0 && mPercent <= 100) {
                    let statusClass = '';
                    if (m.completed) {
                        statusClass = 'completed';
                    } else if (mDate < today) {
                        statusClass = 'overdue';
                    }
                    return `<div class="gantt-milestone-marker ${statusClass}" style="left: ${mPercent}%;" title="${escapeHtml(m.name)}: ${formatDate(m.date)}${m.completed ? ' ✓' : ''}"></div>`;
                }
                return '';
            }).join('');
        }
        
        return `
            <div class="gantt-row">
                <div class="gantt-project-cell" onclick="showProjectTasks('${project.id}')">
                    <div class="gantt-project-color" style="background: ${project.color};"></div>
                    <div class="gantt-project-info">
                        <div class="gantt-project-title">${escapeHtml(project.name)}</div>
                        <div class="gantt-project-tasks">${totalTasks} tasks • ${taskProgress}%</div>
                    </div>
                </div>
                <div class="gantt-timeline-cell">
                    ${barHtml}
                    ${deadlineHtml}
                    ${milestonesHtml}
                    ${todayPercent >= 0 && todayPercent <= 100 ? `<div class="gantt-today-line" style="left: ${todayPercent}%;"></div>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    // Build legend
    const legendHtml = `
        <div class="gantt-legend">
            <div class="gantt-legend-item">
                <div class="gantt-legend-bar" style="background: var(--primary);"></div>
                <span>Project Duration</span>
            </div>
            <div class="gantt-legend-item">
                <div class="gantt-legend-bar" style="background: rgba(0,0,0,0.2);"></div>
                <span>Progress</span>
            </div>
            <div class="gantt-legend-item">
                <div class="gantt-legend-line" style="background: var(--danger);"></div>
                <span>Today</span>
            </div>
            <div class="gantt-legend-item">
                <i class="fas fa-flag" style="color: var(--danger);"></i>
                <span>Deadline</span>
            </div>
            <div class="gantt-legend-item">
                <div class="gantt-legend-diamond"></div>
                <span>Milestone</span>
            </div>
        </div>
    `;
    
    container.innerHTML = headerHtml + '<div class="gantt-body">' + rowsHtml + '</div>' + legendHtml;
}

function openAddProjectModal() {
    document.getElementById('project-modal-title').textContent = 'Add New Project';
    document.getElementById('project-form').reset();
    document.getElementById('project-id').value = '';
    document.getElementById('project-start-date').value = formatDateForInput(new Date());
    document.getElementById('project-end-date').value = '';
    document.getElementById('project-deadline').value = '';
    document.querySelector('input[name="project-color"][value="#007AFF"]').checked = true;
    
    // Clear milestones
    document.getElementById('milestones-container').innerHTML = '';
    
    document.getElementById('project-modal').classList.remove('hidden');
}

function openEditProjectModal(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    document.getElementById('project-modal-title').textContent = 'Edit Project';
    document.getElementById('project-id').value = project.id;
    document.getElementById('project-name').value = project.name;
    document.getElementById('project-description').value = project.description || '';
    document.getElementById('project-start-date').value = project.startDate || '';
    document.getElementById('project-end-date').value = project.endDate || '';
    document.getElementById('project-deadline').value = project.deadline || '';
    
    // Set color
    const colorInput = document.querySelector(`input[name="project-color"][value="${project.color}"]`);
    if (colorInput) {
        colorInput.checked = true;
    }
    
    // Load milestones
    renderMilestonesInForm(project.milestones || []);
    
    document.getElementById('project-modal').classList.remove('hidden');
}

function closeProjectModal() {
    document.getElementById('project-modal').classList.add('hidden');
}

function saveProject() {
    const projectId = document.getElementById('project-id').value;
    const name = document.getElementById('project-name').value.trim();
    const description = document.getElementById('project-description').value.trim();
    const startDate = document.getElementById('project-start-date').value || null;
    const endDate = document.getElementById('project-end-date').value || null;
    const deadline = document.getElementById('project-deadline').value || null;
    const color = document.querySelector('input[name="project-color"]:checked')?.value || '#007AFF';
    const milestones = getMilestonesFromForm();
    
    if (!name) {
        showToast('Please enter a project name', 'error');
        return;
    }
    
    // Validate dates
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        showToast('End date must be after start date', 'error');
        return;
    }
    
    if (projectId) {
        // Edit existing project
        const projectIndex = projects.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) {
            projects[projectIndex] = {
                ...projects[projectIndex],
                name,
                description,
                startDate,
                endDate,
                deadline,
                color,
                milestones
            };
        }
        showToast('Project updated', 'success');
    } else {
        // Create new project
        const newProject = {
            id: 'proj_' + Date.now(),
            name,
            description,
            color,
            startDate,
            endDate,
            deadline,
            milestones,
            createdAt: new Date().toISOString()
        };
        projects.push(newProject);
        showToast('Project created', 'success');
    }
    
    saveData();
    closeProjectModal();
    renderProjects();
    updateBadges();
    populateProjectDropdown();
}

function deleteProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    
    let message = `Are you sure you want to delete "${project.name}"?`;
    if (projectTasks.length > 0) {
        message += `\n\nThis project has ${projectTasks.length} active task(s). They will be unassigned from the project.`;
    }
    
    if (confirm(message)) {
        // Remove project
        projects = projects.filter(p => p.id !== projectId);
        
        // Unassign tasks from this project
        tasks.forEach(t => {
            if (t.projectId === projectId) {
                t.projectId = null;
            }
        });
        completedTasks.forEach(t => {
            if (t.projectId === projectId) {
                t.projectId = null;
            }
        });
        
        saveData();
        renderProjects();
        renderTasks();
        updateBadges();
        populateProjectDropdown();
        
        showToast('Project deleted', 'success');
    }
}

function showProjectTasks(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    showSection('tasks');
    
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const container = document.getElementById('tasks-container');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (projectTasks.length === 0) {
        container.innerHTML = `
            <div style="margin-bottom: 16px;">
                <button class="btn btn-secondary" onclick="renderTasks()">
                    <i class="fas fa-arrow-left"></i> Show All Tasks
                </button>
                <span class="task-project-badge" style="background: ${project.color}; margin-left: 12px;">
                    <i class="fas fa-folder"></i> ${escapeHtml(project.name)}
                </span>
            </div>
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>No tasks in this project</h3>
                <p>Add tasks and assign them to this project</p>
            </div>
        `;
        return;
    }
    
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const sortedTasks = projectTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    container.innerHTML = `
        <div style="margin-bottom: 16px;">
            <button class="btn btn-secondary" onclick="renderTasks()">
                <i class="fas fa-arrow-left"></i> Show All Tasks
            </button>
            <span class="task-project-badge" style="background: ${project.color}; margin-left: 12px; padding: 6px 12px; font-size: 13px;">
                <i class="fas fa-folder"></i> ${escapeHtml(project.name)} (${projectTasks.length} tasks)
            </span>
        </div>
    ` + sortedTasks.map(task => {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const isOverdue = dueDate < today;
        const isToday = dueDate.getTime() === today.getTime();
        
        return `
            <div class="task-card" onclick="openEditTaskModal('${task.id}')">
                <div class="task-priority-bar ${task.priority}"></div>
                <div class="task-card-content">
                    <div class="task-checkbox" onclick="event.stopPropagation(); toggleTaskComplete('${task.id}')">
                        <i class="fas fa-check" style="display: none;"></i>
                    </div>
                    <div class="task-details">
                        <div class="task-title-line">${escapeHtml(task.title)}</div>
                        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                        <div class="task-footer">
                            <span class="priority-badge ${task.priority}">${task.priority}</span>
                            <span class="task-due ${isOverdue ? 'overdue' : isToday ? 'today' : ''}">
                                <i class="fas fa-clock"></i>
                                ${isOverdue ? 'Overdue: ' : ''}${formatDate(task.dueDate)}${task.dueTime ? ' at ' + formatTime12h(task.dueTime) : ''}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}
