(function() {
    let reminderModal;
    let connectTelegramModal;
    let staffList = [];
    let botInfo = null;

    document.addEventListener('DOMContentLoaded', function() {
        initializeModals();
        loadStaffForReminder();
        loadBotInfo();
        setupEventListeners();
    });

    function initializeModals() {
        const reminderModalElement = document.getElementById('reminderModal');
        if (reminderModalElement) {
            reminderModal = new bootstrap.Modal(reminderModalElement);
        }

        const connectModalElement = document.getElementById('connectTelegramModal');
        if (connectModalElement) {
            connectTelegramModal = new bootstrap.Modal(connectModalElement);
        }
    }

    async function loadBotInfo() {
        try {
            const response = await fetch('/api/telegram/bot-info');
            const data = await response.json();
            if (data.success && data.data) {
                botInfo = data.data;

                const botUsernameDisplay = document.getElementById('botUsernameDisplay');
                if (botUsernameDisplay && botInfo) {
                    botUsernameDisplay.textContent = `@${botInfo.username}`;
                }
            } else {
                console.warn('Telegram bot not initialized yet.');
            }
        } catch (error) {
            console.warn('Could not load bot info:', error.message);
        }
    }

    function setupEventListeners() {
        document.addEventListener('click', function(e) {
            const reminderBtn = e.target.closest('.btn-reminder, .add-reminder-btn, button[data-action="add-reminder"]');
            if (reminderBtn) {
                e.preventDefault();

                console.log('Reminder button clicked!', reminderBtn);

                let scheduleData = {
                    reportId: reminderBtn.dataset.reportId,
                    detailId: reminderBtn.dataset.detailId,
                    customerName: reminderBtn.dataset.customer,
                    projectName: reminderBtn.dataset.project,
                    date: reminderBtn.dataset.date,
                    outTime: reminderBtn.dataset.outTime,
                    inTime: reminderBtn.dataset.inTime,
                    startTime: reminderBtn.dataset.startTime,
                    endTime: reminderBtn.dataset.endTime
                };

                console.log('Schedule data from button:', scheduleData);

                const mainStaffSelect = document.getElementById('staffSelect');
                let staffName = mainStaffSelect?.value;

                if (!staffName) {
                    alert('Please select a staff member from the dropdown first');
                    return;
                }

                console.log('Staff name:', staffName);

                openReminderModal(staffName, scheduleData);
            }
        });

        const scheduleBtn = document.getElementById('scheduleReminderBtn');
        if (scheduleBtn) {
            scheduleBtn.addEventListener('click', scheduleReminder);
        }

        const connectBtn = document.getElementById('connectTelegramBtn');
        if (connectBtn) {
            connectBtn.addEventListener('click', connectTelegram);
        }

        const mainStaffSelect = document.getElementById('staffSelect');
        if (mainStaffSelect) {
            mainStaffSelect.addEventListener('change', function() {
                const reminderStaffSelect = document.getElementById('reminderStaffSelect');
                if (reminderStaffSelect && this.value) {
                    reminderStaffSelect.value = this.value;
                }
            });
        }
    }

    async function loadStaffForReminder() {
        try {
            const response = await fetch('/api/schedule/staff');
            const data = await response.json();

            if (data.success && data.data) {
                staffList = data.data;
                populateStaffDropdown();
            }
        } catch (error) {
            console.error('Error loading staff list:', error);
        }
    }

    function populateStaffDropdown() {
        const reminderStaffSelect = document.getElementById('reminderStaffSelect');
        if (!reminderStaffSelect) return;
        reminderStaffSelect.innerHTML = '<option value="">-- Select Staff --</option>';

        staffList.forEach(staff => {
            const option = document.createElement('option');
            option.value = staff.Service_By;
            option.textContent = staff.Service_By;
            reminderStaffSelect.appendChild(option);
        });
    }

    async function openReminderModal(staffName = null, scheduleData = {}) {
        const form = document.getElementById('reminderForm');
        if (form) {
            form.reset();

            delete form.dataset.reminderId;
            delete form.dataset.existingReminder;
        }

        const reminderStaffSelect = document.getElementById('reminderStaffSelect');
        const reminderStaffNameDisplay = document.getElementById('reminderStaffName');

        if (staffName) {
            if (reminderStaffSelect) reminderStaffSelect.value = staffName;
            if (reminderStaffNameDisplay) reminderStaffNameDisplay.value = staffName;
        }

        if (scheduleData.detailId) {
            form.dataset.detailId = scheduleData.detailId;
            console.log('Detail ID set for reminder:', scheduleData.detailId);
        }

        if (staffName) {
            await checkTelegramConnection(staffName);
        }

        let hasExistingReminder = false;
        if (scheduleData.detailId) {
            hasExistingReminder = await checkExistingReminder(scheduleData.detailId, scheduleData);
        }

        const messageField = document.getElementById('reminderMessage');
        if (messageField && !hasExistingReminder && scheduleData && Object.keys(scheduleData).some(key => scheduleData[key])) {
            let message = '*SERVICE SCHEDULE REMINDER*\n';
            message += '━━━━━━━━━━━━━━━━━━━━━━\n\n';

            message += '*Job Details:*\n';
            if (scheduleData.customerName) {
                message += `   • Customer: ${scheduleData.customerName}\n`;
            }
            if (scheduleData.projectName) {
                message += `   • Project: ${scheduleData.projectName}\n`;
            }
            if (scheduleData.reportId) {
                message += `   • Report ID: ${scheduleData.reportId}\n`;
            }
            if (scheduleData.date) {
                const dateObj = new Date(scheduleData.date);
                const formattedDate = dateObj.toLocaleDateString('en-GB', { 
                    weekday: 'long',
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                });
                message += `   • Date: ${formattedDate}\n`;
            }

            message += '\n*Schedule Times:*\n';
            if (scheduleData.outTime) {
                message += `   Out: ${formatTime(scheduleData.outTime)}\n`;
            }
            if (scheduleData.startTime) {
                message += `   Start: ${formatTime(scheduleData.startTime)}\n`;
            }
            if (scheduleData.endTime) {
                message += `   End: ${formatTime(scheduleData.endTime)}\n`;
            }
            if (scheduleData.inTime) {
                message += `   In: ${formatTime(scheduleData.inTime)}\n`;
            }

            message += '\n━━━━━━━━━━━━━━━━━━━━━━\n';
            message += 'Please prepare accordingly and arrive on time.\n';
            message += '\n_This is an automated reminder from Service Report System_';
            messageField.value = message;
        }

        const now = new Date();
        now.setHours(now.getHours() + 1);
        const dateTimeInput = document.getElementById('reminderDateTime');
        if (dateTimeInput) {
            dateTimeInput.value = formatDateTimeLocal(now);
            dateTimeInput.min = formatDateTimeLocal(new Date());
        }

        if (reminderModal) {
            reminderModal.show();
        }
    }

    async function checkTelegramConnection(staffName) {
        const statusDiv = document.getElementById('telegramConnectionStatus');
        if (!statusDiv || !staffName) return;

        try {
            const response = await fetch(`/api/telegram/status?staffName=${encodeURIComponent(staffName)}`);
            const data = await response.json();

            if (data.success && data.connected) {
                statusDiv.innerHTML = `
                    <div class="alert alert-success" role="alert" style="border: 2px solid #4caf50; border-radius: 10px; background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); margin-bottom: 0; padding: 15px;">
                        <div style="color: #1b5e20; font-weight: 600; margin-bottom: 4px; text-align: center;">
                            Telegram Connected
                        </div>
                        <div style="color: #2e7d32; font-size: 13px; margin-bottom: 12px; text-align: center;">
                            Reminders will be sent to <strong>${staffName}</strong>'s personal Telegram chat
                        </div>
                        <div style="text-align: center;">
                            <button type="button" class="btn btn-sm" onclick="window.ReminderModule.openConnectModal()" style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; border: none; border-radius: 6px; padding: 6px 16px; font-weight: 600; font-size: 12px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;">
                                    <path d="M12 20h9"></path>
                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                </svg>
                                Reconfigure
                            </button>
                        </div>
                    </div>
                `;
            } else {
                statusDiv.innerHTML = `
                    <div class="alert alert-warning" role="alert" style="border: 2px solid #ff9800; border-radius: 10px; background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); margin-bottom: 0; padding: 15px;">
                        <div style="color: #e65100; font-weight: 600; margin-bottom: 8px;">
                            Telegram Not Connected
                        </div>
                        <div style="color: #ef6c00; font-size: 13px; margin-bottom: 12px;">
                            <strong>${staffName}</strong> needs to connect their Telegram account to receive reminders
                        </div>
                        <button type="button" class="btn btn-sm" onclick="window.ReminderModule.openConnectModal()" style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; border: none; border-radius: 6px; padding: 6px 20px; font-weight: 600; font-size: 13px;">
                            Connect Telegram Now
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error checking connection:', error);
            statusDiv.innerHTML = `
                <div class="alert alert-danger" role="alert" style="border: 2px solid #f44336; border-radius: 10px; background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); margin-bottom: 0; padding: 15px;">
                    <div style="color: #c62828; font-weight: 600;">
                        Error checking Telegram connection status
                    </div>
                </div>
            `;
        }
    }

    async function scheduleReminder() {
        const form = document.getElementById('reminderForm');

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const staffName = document.getElementById('reminderStaffSelect').value;
        const message = document.getElementById('reminderMessage').value.trim();
        const dateTime = document.getElementById('reminderDateTime').value;
        const detailId = form.dataset.detailId || null;

        if (!staffName || !message || !dateTime) {
            alert('Please fill in all required fields');
            return;
        }

        const formattedDateTime = dateTime.replace('T', ' ') + ':00';

        console.log('Local datetime input:', dateTime);
        console.log('Formatted for SQL Server:', formattedDateTime);
        if (detailId) {
            console.log('Detail ID for reminder:', detailId);
        }

        const scheduleBtn = document.getElementById('scheduleReminderBtn');
        const originalText = scheduleBtn.innerHTML;
        scheduleBtn.disabled = true;
        scheduleBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Scheduling...';

        try {
            const requestBody = {
                staffName: staffName,
                message: message,
                scheduledTime: formattedDateTime
            };

            if (detailId) {
                requestBody.detailId = parseInt(detailId);
            }

            const response = await fetch('/api/reminders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert(`Reminder scheduled successfully for ${staffName}!`);

                if (detailId) {
                    const reminderBtn = document.querySelector(`.reminder-btn-${detailId}`);
                    if (reminderBtn) {
                        const btnText = reminderBtn.querySelector('.reminder-btn-text');
                        if (btnText) {
                            btnText.textContent = 'Reminder Added';
                        }
                        reminderBtn.style.background = 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
                        reminderBtn.style.borderColor = '#4caf50';
                        reminderBtn.dataset.hasReminder = 'true';
                    }
                }

                if (reminderModal) {
                    reminderModal.hide();
                }

                form.reset();
                delete form.dataset.detailId;
            } else {
                alert(data.error || 'Failed to schedule reminder');
            }
        } catch (error) {
            console.error('Error scheduling reminder:', error);
            alert('Network error: Could not schedule reminder');
        } finally {
            scheduleBtn.disabled = false;
            scheduleBtn.innerHTML = originalText;
        }
    }

    function formatDateTimeLocal(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    function formatTime(timeString) {
        if (!timeString) return '';

        if (/^\d{2}:\d{2}$/.test(timeString)) {
            return timeString;
        }

        try {
            let dateObj;

            if (timeString.includes('T') || timeString.includes(' ')) {
                dateObj = new Date(timeString);
            } else if (timeString.includes(':')) {
                const timeParts = timeString.split(':');
                const hours = timeParts[0].padStart(2, '0');
                const minutes = timeParts[1].padStart(2, '0');
                return `${hours}:${minutes}`;
            } else {
                return timeString;
            }

            if (dateObj && !isNaN(dateObj)) {
                const hours = String(dateObj.getHours()).padStart(2, '0');
                const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                return `${hours}:${minutes}`;
            }

            return timeString;
        } catch (error) {
            console.error('Error formatting time:', error);
            return timeString;
        }
    }

    async function openConnectTelegramModal() {

        const staffSelect = document.getElementById('staffSelect');
        const selectedStaffName = staffSelect ? staffSelect.value : '';

        if (!selectedStaffName) {
            alert('Please select a staff member first to connect Telegram');
            return;
        }

        if (reminderModal) {
            reminderModal.hide();
        }

        const connectStaffName = document.getElementById('connectStaffName');
        const connectStaffSelect = document.getElementById('connectStaffSelect');
        if (connectStaffName && connectStaffSelect) {
            connectStaffName.value = selectedStaffName;
            connectStaffSelect.value = selectedStaffName;
        }

        const connectCode = document.getElementById('connectCode');
        const connectChatId = document.getElementById('connectChatId');
        if (connectCode) connectCode.value = '';
        if (connectChatId) connectChatId.value = '';

        await checkExistingConnection(selectedStaffName);

        const botUsernameDisplay = document.getElementById('botUsernameDisplay');
        if (botUsernameDisplay && botInfo) {
            botUsernameDisplay.textContent = `@${botInfo.username}`;
        }

        if (connectTelegramModal) {
            connectTelegramModal.show();
        }
    }

    async function connectTelegram() {
        const form = document.getElementById('connectTelegramForm');

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const staffName = document.getElementById('connectStaffSelect').value;
        const code = document.getElementById('connectCode').value.trim();
        const chatId = document.getElementById('connectChatId').value.trim();

        if (!staffName || !code || !chatId) {
            alert('Please fill in all fields');
            return;
        }

        const connectBtn = document.getElementById('connectTelegramBtn');
        const originalText = connectBtn.innerHTML;
        connectBtn.disabled = true;
        connectBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Connecting...';

        try {
            const response = await fetch('/api/telegram/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    staffName: staffName,
                    chatId: chatId,
                    connectionCode: code
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert(`Telegram connected successfully for ${staffName}!`);

                if (connectTelegramModal) {
                    connectTelegramModal.hide();
                }

                form.reset();
            } else {
                alert(data.error || 'Failed to connect Telegram');
            }
        } catch (error) {
            console.error('Error connecting Telegram:', error);
            alert('Network error: Could not connect Telegram');
        } finally {
            connectBtn.disabled = false;
            connectBtn.innerHTML = originalText;
        }
    }

    async function checkExistingReminder(detailId, scheduleData = {}) {
        const reminderWarningDiv = document.getElementById('reminderWarning');
        const form = document.getElementById('reminderForm');

        if (!reminderWarningDiv) {
            console.warn('reminderWarning div not found in modal');
            return;
        }

        try {
            const response = await fetch(`/api/reminders/detail/${detailId}`);
            const data = await response.json();

            if (data.success && data.hasReminder) {
                const reminder = data.data;
                const statusBadge = reminder.Status === 'sent' ? 'success' : 
                                   reminder.Status === 'failed' ? 'danger' : 'warning';

                const now = new Date();
                const scheduledTime = new Date(reminder.Scheduled_Time);
                const canModify = now < scheduledTime && reminder.Status === 'pending';

                form.dataset.reminderId = reminder.Reminder_ID;
                form.dataset.existingReminder = 'true';
                form.dataset.canModify = canModify;

                const messageField = document.getElementById('reminderMessage');
                const dateTimeField = document.getElementById('reminderDateTime');
                if (messageField) messageField.value = reminder.Message;
                if (dateTimeField && canModify) {
                    const schedTime = new Date(reminder.Scheduled_Time);
                    dateTimeField.value = formatDateTimeLocal(schedTime);
                }

                reminderWarningDiv.innerHTML = `
                    <div class="alert alert-info" role="alert" style="border: 2px solid #2196f3; border-radius: 10px; background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); margin-bottom: 15px; padding: 15px;">
                        <div style="color: #0d47a1; font-weight: 600; margin-bottom: 8px;">
                            Reminder Exists
                        </div>
                        <div style="color: #1565c0; font-size: 13px; margin-bottom: 8px;">
                            This schedule detail has a reminder.
                        </div>
                        <div style="font-size: 12px; color: #666;">
                            Status: <span class="badge bg-${statusBadge}">${reminder.Status.toUpperCase()}</span><br>
                            Scheduled: ${new Date(reminder.Scheduled_Time).toLocaleString()}<br>
                            ${canModify ? '<span style="color: #4caf50; font-weight: 600;">Can be edited or removed</span>' : '<span style="color: #f44336; font-weight: 600;">Cannot be modified (already sent or scheduled time passed)</span>'}
                        </div>
                    </div>
                `;

                updateModalButtons(canModify);
                return true; 
            } else {
                reminderWarningDiv.innerHTML = '';
                updateModalButtons(false, true); 
                return false; 
            }
        } catch (error) {
            console.error('Error checking existing reminder:', error);
            reminderWarningDiv.innerHTML = '';
            updateModalButtons(false, true); 
            return false;
        }
    }

    function updateModalButtons(canModify, isNew = false) {
        const scheduleBtn = document.getElementById('scheduleReminderBtn');
        const footer = document.querySelector('#reminderModal .modal-footer');

        if (!footer) return;

        if (isNew) {

            footer.innerHTML = `
                <button type="button" class="clear-btn" data-bs-dismiss="modal">Cancel</button>
                <button type="button" id="scheduleReminderBtn" class="search-btn">
                    <i class="bi bi-bell-fill me-1"></i> Schedule Reminder
                </button>
            `;

            document.getElementById('scheduleReminderBtn').addEventListener('click', scheduleReminder);
        } else if (canModify) {

            footer.innerHTML = `
                <button type="button" class="clear-btn" data-bs-dismiss="modal">Cancel</button>
                <button type="button" id="removeReminderBtn" class="btn-remove">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 5px;">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Remove Reminder
                </button>
                <button type="button" id="updateReminderBtn" class="btn-update">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 5px;">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Update Reminder
                </button>
            `;

            document.getElementById('removeReminderBtn').addEventListener('click', removeReminder);
            document.getElementById('updateReminderBtn').addEventListener('click', updateReminder);
        } else {

            footer.innerHTML = `
                <button type="button" class="clear-btn" data-bs-dismiss="modal">Close</button>
            `;
        }
    }

    async function removeReminder() {
        const form = document.getElementById('reminderForm');
        const reminderId = form.dataset.reminderId;

        if (!reminderId) {
            alert('Reminder ID not found');
            return;
        }

        if (!confirm('Are you sure you want to remove this reminder?')) {
            return;
        }

        const removeBtn = document.getElementById('removeReminderBtn');
        const originalText = removeBtn.innerHTML;
        removeBtn.disabled = true;
        removeBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Removing...';

        try {
            const response = await fetch(`/api/reminders/${reminderId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert('Reminder removed successfully!');

                const detailId = form.dataset.detailId;
                if (detailId) {
                    const reminderBtn = document.querySelector(`.reminder-btn-${detailId}`);
                    if (reminderBtn) {
                        const btnText = reminderBtn.querySelector('.reminder-btn-text');
                        if (btnText) {
                            btnText.textContent = 'Add Reminder';
                        }
                        reminderBtn.style.background = '';
                        reminderBtn.style.borderColor = '';
                        delete reminderBtn.dataset.reminderId;
                        delete reminderBtn.dataset.hasReminder;
                    }
                }

                if (reminderModal) {
                    reminderModal.hide();
                }

                form.reset();
                delete form.dataset.reminderId;
                delete form.dataset.detailId;
            } else {
                alert(data.error || 'Failed to remove reminder');
            }
        } catch (error) {
            console.error('Error removing reminder:', error);
            alert('Network error: Could not remove reminder');
        } finally {
            removeBtn.disabled = false;
            removeBtn.innerHTML = originalText;
        }
    }

    async function updateReminder() {
        const form = document.getElementById('reminderForm');

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const reminderId = form.dataset.reminderId;
        const staffName = document.getElementById('reminderStaffSelect').value;
        const message = document.getElementById('reminderMessage').value.trim();
        const dateTime = document.getElementById('reminderDateTime').value;

        if (!reminderId) {
            alert('Reminder ID not found');
            return;
        }

        if (!staffName || !message || !dateTime) {
            alert('Please fill in all required fields');
            return;
        }

        const formattedDateTime = dateTime.replace('T', ' ') + ':00';

        console.log('Updating reminder:', reminderId);
        console.log('New scheduled time:', formattedDateTime);

        const updateBtn = document.getElementById('updateReminderBtn');
        const originalText = updateBtn.innerHTML;
        updateBtn.disabled = true;
        updateBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';

        try {
            const response = await fetch(`/api/reminders/${reminderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    staffName: staffName,
                    message: message,
                    scheduledTime: formattedDateTime
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert('Reminder updated successfully!');

                if (reminderModal) {
                    reminderModal.hide();
                }

                form.reset();
                delete form.dataset.reminderId;
                delete form.dataset.detailId;
            } else {
                alert(data.error || 'Failed to update reminder');
            }
        } catch (error) {
            console.error('Error updating reminder:', error);
            alert('Network error: Could not update reminder');
        } finally {
            updateBtn.disabled = false;
            updateBtn.innerHTML = originalText;
        }
    }

    async function checkExistingConnection(staffName) {
        const existingConnectionInfo = document.getElementById('existingConnectionInfo');
        const existingConnectionDetails = document.getElementById('existingConnectionDetails');

        if (!existingConnectionInfo || !existingConnectionDetails) return;

        try {
            const response = await fetch(`/api/telegram/connection/${encodeURIComponent(staffName)}`);
            const data = await response.json();

            if (response.ok && data.success && data.data) {

                existingConnectionDetails.innerHTML = `
                    <strong>Chat ID:</strong> ${data.data.Telegram_Chat_ID || 'N/A'}
                `;
                existingConnectionInfo.style.display = 'block';
            } else {
                existingConnectionInfo.style.display = 'none';
            }
        } catch (error) {
            console.error('Error checking existing connection:', error);
            existingConnectionInfo.style.display = 'none';
        }
    }

    window.ReminderModule = {
        openModal: openReminderModal,
        refreshStaffList: loadStaffForReminder,
        openConnectModal: openConnectTelegramModal
    };
})();