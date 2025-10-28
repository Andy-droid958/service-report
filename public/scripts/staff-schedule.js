let operationInProgress = false;
let currentAbortController = null;

window.addEventListener('beforeunload', function(e) {
    if (operationInProgress) {
        e.preventDefault();
        e.returnValue = 'PDF generation is in progress. Are you sure you want to leave?';
        return e.returnValue;
    }
});

function showLoadingState(message = 'Loading...') {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loadingOverlay';
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.9);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: Arial, sans-serif;
    `;

    const spinner = document.createElement('div');
    spinner.style.cssText = `
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
    `;

    const loadingText = document.createElement('div');
    loadingText.textContent = message;
    loadingText.style.cssText = `
        color: #333;
        font-size: 16px;
        font-weight: 500;
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    if (!document.querySelector('style[data-loading-animation]')) {
        style.setAttribute('data-loading-animation', 'true');
        document.head.appendChild(style);
    }

    loadingOverlay.appendChild(spinner);
    loadingOverlay.appendChild(loadingText);
    document.body.appendChild(loadingOverlay);
}

function hideLoadingState() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let reportDates = [];
let reportDateCounts = {}; 
let scheduleData = [];
let selectedStaff = '';
let selectedStartDate = null;
let selectedEndDate = null;
let reminderDates = []; 

document.addEventListener('DOMContentLoaded', function() {
    console.log('Staff Schedule page initialized');

    initializeDateInputs();
    loadStaffList();

    document.getElementById('loadScheduleBtn').addEventListener('click', loadSchedule);
    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));

    initializeCalendarSwipe();

    document.getElementById('hasReportsLegend').addEventListener('click', showAllReports);
    document.getElementById('hasReportsLegend').addEventListener('mouseenter', function() {
        this.style.background = '#e3f2fd';
    });
    document.getElementById('hasReportsLegend').addEventListener('mouseleave', function() {
        this.style.background = 'transparent';
    });

    document.getElementById('showStatisticsBtn').addEventListener('click', toggleStatistics);
    document.getElementById('showStatisticsBtn').addEventListener('mouseenter', function() {
        const isShowing = document.getElementById('statisticsSection').style.display === 'block';
        this.style.background = isShowing ? '#ffcdd2' : '#c8e6c9';
    });
    document.getElementById('showStatisticsBtn').addEventListener('mouseleave', function() {
        const isShowing = document.getElementById('statisticsSection').style.display === 'block';
        this.style.background = isShowing ? '#ffebee' : '#e8f5e9';
    });

    document.getElementById('hasReportsLegendChart').addEventListener('click', showAllReports);
    document.getElementById('showStatisticsBtnChart').addEventListener('click', toggleStatistics);

    const scheduleSearch = document.getElementById('scheduleSearch');
    const clearScheduleSearch = document.getElementById('clearScheduleSearch');
    const toggleScheduleFilters = document.getElementById('toggleScheduleFilters');
    const scheduleFiltersContainer = document.getElementById('scheduleFiltersContainer');
    const applyScheduleFilters = document.getElementById('applyScheduleFilters');
    const clearScheduleFilters = document.getElementById('clearScheduleFilters');

    scheduleSearch.addEventListener('input', function() {
        clearScheduleSearch.style.display = this.value ? 'block' : 'none';
        applySearchAndFilters();
    });

    scheduleSearch.addEventListener('focus', function() {
        this.style.borderColor = '#007bff';
        this.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
    });

    scheduleSearch.addEventListener('blur', function() {
        this.style.borderColor = '#dee2e6';
        this.style.boxShadow = 'none';
    });

    clearScheduleSearch.addEventListener('click', function() {
        scheduleSearch.value = '';
        this.style.display = 'none';
        applySearchAndFilters();
    });

    toggleScheduleFilters.addEventListener('click', function() {
        const isVisible = scheduleFiltersContainer.style.display === 'block';
        scheduleFiltersContainer.style.display = isVisible ? 'none' : 'block';
        this.classList.toggle('active');

        const svg = this.querySelector('svg').outerHTML;
        if (isVisible) {
            this.innerHTML = svg + ' Show Filters';
        } else {
            this.innerHTML = svg + ' Hide Filters';
        }
    });

    applyScheduleFilters.addEventListener('click', applySearchAndFilters);

    clearScheduleFilters.addEventListener('click', function() {
        document.getElementById('filterScheduleCustomer').value = '';
        document.getElementById('filterScheduleProject').value = '';
        document.getElementById('filterScheduleReportId').value = '';
        document.getElementById('filterScheduleStatus').value = '';
        document.getElementById('filterScheduleReminder').value = '';
        document.getElementById('filterScheduleDate').value = '';
        applySearchAndFilters();
    });

    const viewCalendarBtn = document.getElementById('viewCalendar');
    const viewChartBtn = document.getElementById('viewChart');
    const calendarViewContainer = document.getElementById('calendarViewContainer');
    const chartViewContainer = document.getElementById('chartViewContainer');

    if (viewCalendarBtn && viewChartBtn) {
        viewCalendarBtn.addEventListener('click', function() {

            calendarViewContainer.style.display = 'block';
            chartViewContainer.style.display = 'none';

            this.classList.add('active');
            viewChartBtn.classList.remove('active');
        });

        viewChartBtn.addEventListener('click', function() {

            calendarViewContainer.style.display = 'none';
            chartViewContainer.style.display = 'block';

            this.classList.add('active');
            viewCalendarBtn.classList.remove('active');

            if (window.updateGanttData && scheduleData) {
                window.updateGanttData(scheduleData, selectedStartDate, selectedEndDate);
            }
        });
    }

    initializeMonthPicker();
});

function initializeMonthPicker() {
    const currentMonthYearEl = document.getElementById('currentMonthYear');
    const monthPicker = document.getElementById('monthPicker');
    const pickerYear = document.getElementById('pickerYear');
    const prevYearPicker = document.getElementById('prevYearPicker');
    const nextYearPicker = document.getElementById('nextYearPicker');
    const monthButtons = document.querySelectorAll('.month-picker-btn');

    let pickerYearValue = currentYear;

    currentMonthYearEl.addEventListener('click', function(e) {
        e.stopPropagation();
        const isVisible = monthPicker.style.display === 'block';
        monthPicker.style.display = isVisible ? 'none' : 'block';

        if (!isVisible) {
            pickerYearValue = currentYear;
            updateMonthPicker();
        }
    });

    document.addEventListener('click', function(e) {
        if (!monthPicker.contains(e.target) && e.target !== currentMonthYearEl) {
            monthPicker.style.display = 'none';
        }
    });

    prevYearPicker.addEventListener('click', function(e) {
        e.stopPropagation();
        pickerYearValue--;
        updateMonthPicker();
    });

    nextYearPicker.addEventListener('click', function(e) {
        e.stopPropagation();
        pickerYearValue++;
        updateMonthPicker();
    });

    monthButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const selectedMonth = parseInt(this.getAttribute('data-month'));
            currentMonth = selectedMonth;
            currentYear = pickerYearValue;
            renderCalendar();
            monthPicker.style.display = 'none';
        });
    });

    function updateMonthPicker() {
        pickerYear.textContent = pickerYearValue;

        monthButtons.forEach(btn => {
            const month = parseInt(btn.getAttribute('data-month'));

            btn.classList.remove('active', 'has-data');

            if (month === currentMonth && pickerYearValue === currentYear) {
                btn.classList.add('active');
            }

            if (selectedStartDate && selectedEndDate) {
                const monthStart = new Date(pickerYearValue, month, 1);
                const monthEnd = new Date(pickerYearValue, month + 1, 0);

                const rangeStart = new Date(selectedStartDate);
                const rangeEnd = new Date(selectedEndDate);

                if (monthEnd >= rangeStart && monthStart <= rangeEnd) {
                    btn.classList.add('has-data');
                }
            }
        });
    }
}

function initializeDateInputs() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    document.getElementById('startDate').valueAsDate = firstDay;
    document.getElementById('endDate').valueAsDate = lastDay;
}

async function loadStaffList() {
    try {
        const response = await fetch('/api/schedule/staff');
        const result = await response.json();

        if (result.success && result.data) {
            const staffSelect = document.getElementById('staffSelect');
            staffSelect.innerHTML = '<option value="" disabled selected hidden>-- Select Staff --</option>';

            result.data.forEach(staff => {
                const option = document.createElement('option');
                option.value = staff.Service_By;
                option.textContent = staff.Service_By;
                staffSelect.appendChild(option);
            });

            console.log(`Loaded ${result.data.length} staff members`);
        }
    } catch (error) {
        console.error('Error loading staff list:', error);
        alert('Failed to load staff list. Please refresh the page.');
    }
}

async function loadSchedule() {
    const staffSelect = document.getElementById('staffSelect');
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const loadBtn = document.getElementById('loadScheduleBtn');

    const viewCalendarBtn = document.getElementById('viewCalendar');
    const viewChartBtn = document.getElementById('viewChart');
    const calendarViewContainer = document.getElementById('calendarViewContainer');
    const chartViewContainer = document.getElementById('chartViewContainer');

    if (viewCalendarBtn && viewChartBtn && calendarViewContainer && chartViewContainer) {
        calendarViewContainer.style.display = 'block';
        chartViewContainer.style.display = 'none';
        viewCalendarBtn.classList.add('active');
        viewChartBtn.classList.remove('active');
    }

    if (!staffSelect.value) {
        loadBtn.disabled = true;
        alert('Please select a staff member');
        loadBtn.disabled = false;
        return;
    }

    if (!startDate || !endDate) {
        loadBtn.disabled = true;
        alert('Please select both start and end dates');
        loadBtn.disabled = false;
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        loadBtn.disabled = true;
        alert('Start date must be before end date');
        loadBtn.disabled = false;
        return;
    }

    selectedStaff = staffSelect.value;
    selectedStartDate = startDate;
    selectedEndDate = endDate;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    showLoading(true);
    document.getElementById('emptyState').style.display = 'none';

    try {

        const datesResponse = await fetch(
            `/api/schedule/report-dates?serviceBy=${encodeURIComponent(selectedStaff)}&startDate=${startDate}&endDate=${endDate}`
        );
        const datesResult = await datesResponse.json();

        const scheduleResponse = await fetch(
            `/api/schedule/schedule?serviceBy=${encodeURIComponent(selectedStaff)}&startDate=${startDate}&endDate=${endDate}`
        );
        const scheduleResult = await scheduleResponse.json();

        if (datesResult.success && scheduleResult.success) {
            reportDates = datesResult.data.map(d => new Date(d.ReportDate).toISOString().split('T')[0]);

            reportDateCounts = {};
            datesResult.data.forEach(d => {
                const dateKey = new Date(d.ReportDate).toISOString().split('T')[0];
                reportDateCounts[dateKey] = d.ReportCount;
            });

            scheduleData = scheduleResult.data;

            console.log(`Found ${reportDates.length} dates with reports`);
            console.log(`Found ${scheduleData.length} schedule entries`);

            await fetchReminderDatesForCalendar();

            const start = new Date(startDate);
            currentMonth = start.getMonth();
            currentYear = start.getFullYear();

            renderCalendar();
            renderScheduleDetails();

            document.getElementById('calendarSection').style.display = 'block';

            const statisticsSection = document.getElementById('statisticsSection');
            if (statisticsSection && statisticsSection.style.display === 'block') {
                if (typeof showStatistics === 'function') {
                    await showStatistics();
                }
            }
        } else {
            throw new Error('Failed to fetch schedule data');
        }
    } catch (error) {
        console.error('Error loading schedule:', error);
        alert('Failed to load schedule. Please try again.');
    } finally {
        showLoading(false);
    }
}

function changeMonth(delta) {
    const calendarGrid = document.getElementById('calendarGrid');

    if (calendarGrid) {
        calendarGrid.style.opacity = '0';
        calendarGrid.style.transform = `translateX(${delta > 0 ? '-20px' : '20px'})`;
    }

    currentMonth += delta;

    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }

    setTimeout(() => {
        renderCalendar();

        if (calendarGrid) {
            calendarGrid.style.opacity = '1';
            calendarGrid.style.transform = 'translateX(0)';
        }
    }, 150);
}

function initializeCalendarSwipe() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;

    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;

    const minSwipeDistance = 50; 

    calendarGrid.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    calendarGrid.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipeGesture();
    }, { passive: true });

    let mouseStartX = 0;
    let mouseEndX = 0;
    let mouseStartY = 0;
    let mouseEndY = 0;
    let isDragging = false;

    calendarGrid.addEventListener('mousedown', (e) => {
        isDragging = true;
        mouseStartX = e.screenX;
        mouseStartY = e.screenY;
        calendarGrid.style.cursor = 'grabbing';
    });

    calendarGrid.addEventListener('mousemove', (e) => {
        if (isDragging) {
            e.preventDefault();
        }
    });

    calendarGrid.addEventListener('mouseup', (e) => {
        if (isDragging) {
            mouseEndX = e.screenX;
            mouseEndY = e.screenY;
            isDragging = false;
            calendarGrid.style.cursor = 'grab';
            handleMouseSwipe();
        }
    });

    calendarGrid.addEventListener('mouseleave', () => {
        isDragging = false;
        calendarGrid.style.cursor = 'grab';
    });

    calendarGrid.style.cursor = 'grab';

    function handleSwipeGesture() {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {

                changeMonth(-1);
            } else {

                changeMonth(1);
            }
        }
    }

    function handleMouseSwipe() {
        const deltaX = mouseEndX - mouseStartX;
        const deltaY = mouseEndY - mouseStartY;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {

                changeMonth(-1);
            } else {

                changeMonth(1);
            }
        }
    }
}

function renderCalendar() {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthYearText = document.getElementById('monthYearText');
    if (monthYearText) {
        monthYearText.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); 

    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    calendarGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 6px;
        max-width: 800px;
        margin: 0 auto;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        touch-action: pan-y pinch-zoom;
        cursor: grab;
        transition: opacity 0.2s ease-out, transform 0.2s ease-out;
        opacity: 1;
        transform: translateX(0);
    `;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach((day, index) => {
        const dayHeader = document.createElement('div');
        dayHeader.textContent = day;
        dayHeader.className = 'calendar-day-header';
        dayHeader.style.cssText = `
            text-align: center;
            font-weight: 700;
            color: ${index === 0 || index === 6 ? '#dc3545' : '#495057'};
            padding: 10px 6px;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
            border-radius: 4px;
        `;
        calendarGrid.appendChild(dayHeader);
    });

    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.style.cssText = `
            aspect-ratio: 1;
            background: transparent;
        `;
        calendarGrid.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasReport = reportDates.includes(dateStr);
        const reportCount = reportDateCounts[dateStr] || 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const cellDate = new Date(dateStr);
        cellDate.setHours(0, 0, 0, 0);
        const isPastDate = cellDate < today;
        const dayOfWeek = cellDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        let backgroundColor = isWeekend ? '#fafafa' : '#fff';
        let textColor = isWeekend ? '#dc3545' : '#333';
        let borderColor = '#dee2e6';

        if (hasReport) {
            if (isPastDate) {

                if (reportCount === 1) {
                    backgroundColor = '#81c784'; 
                    textColor = '#1b5e20';
                    borderColor = '#66bb6a';
                } else if (reportCount === 2) {
                    backgroundColor = '#66bb6a'; 
                    textColor = '#fff';
                    borderColor = '#4caf50';
                } else if (reportCount >= 3) {
                    backgroundColor = '#4caf50'; 
                    textColor = '#fff';
                    borderColor = '#2e7d32';
                }
            } else {

            if (reportCount === 1) {
                backgroundColor = '#90caf9'; 
                textColor = '#1565c0';
                borderColor = '#64b5f6';
            } else if (reportCount === 2) {
                backgroundColor = '#42a5f5'; 
                textColor = '#fff';
                borderColor = '#2196f3';
            } else if (reportCount >= 3) {
                backgroundColor = '#1976d2'; 
                textColor = '#fff';
                borderColor = '#0d47a1';
                }
            }
        }

        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day-cell';
        dayCell.style.cssText = `
            aspect-ratio: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 2px solid ${borderColor};
            background: ${backgroundColor};
            color: ${textColor};
            border-radius: 8px;
            cursor: ${hasReport ? 'pointer' : 'default'};
            font-weight: ${hasReport ? '700' : '500'};
            transition: all 0.3s ease;
            position: relative;
            padding: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        `;

        const dayNumber = document.createElement('div');
        dayNumber.textContent = day;
        dayNumber.style.cssText = `
            font-size: 16px;
            line-height: 1;
        `;
        dayCell.appendChild(dayNumber);

        if (hasReport && reportCount > 0) {
            const badge = document.createElement('div');
            badge.textContent = `${reportCount}`;
            badge.style.cssText = `
                position: absolute;
                top: 4px;
                right: 4px;
                background: ${isPastDate ? '#fff' : '#fff'};
                color: ${isPastDate ? '#2e7d32' : '#0d47a1'};
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: 700;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            `;
            dayCell.appendChild(badge);

            const hasReminder = reminderDates.includes(dateStr);
            if (hasReminder) {
                const bookmark = document.createElement('div');
                bookmark.className = 'reminder-bookmark';
                bookmark.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#ff9800" stroke="none">
                        <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                    </svg>
                `;
                bookmark.style.cssText = `
                    position: absolute;
                    top: 2px;
                    left: 4px;
                    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
                `;
                bookmark.title = 'Has reminder(s)';
                dayCell.appendChild(bookmark);
            }

            const reportText = document.createElement('div');
            reportText.textContent = reportCount === 1 ? 'report' : 'reports';
            reportText.style.cssText = `
                font-size: 9px;
                margin-top: 3px;
                opacity: 0.95;
                font-weight: 600;
            `;
            dayCell.appendChild(reportText);

            dayCell.title = `${reportCount} ${reportCount === 1 ? 'report' : 'reports'} on ${dateStr}`;
        }

        if (hasReport) {
            dayCell.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-4px) scale(1.05)';
                this.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                this.style.zIndex = '10';
            });

            dayCell.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
                this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                this.style.zIndex = '1';
            });

            dayCell.addEventListener('click', function() {
                filterScheduleByDate(dateStr);

                document.querySelectorAll('.calendar-day-cell').forEach(cell => {
                    cell.style.outline = 'none';
                    cell.style.outlineOffset = '0';
                });
                this.style.outline = '3px solid #ff6b6b';
                this.style.outlineOffset = '2px';
            });
        }

        calendarGrid.appendChild(dayCell);
    }
}

function filterScheduleByDate(dateStr) {
    const filtered = scheduleData.filter(entry => {
        const entryDate = new Date(entry.Date).toISOString().split('T')[0];
        return entryDate === dateStr;
    });

    renderScheduleDetails(filtered);

    document.getElementById('scheduleDetails').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
    });
}

async function applySearchAndFilters() {
    const searchTerm = document.getElementById('scheduleSearch').value.toLowerCase();
    const filterCustomer = document.getElementById('filterScheduleCustomer').value.toLowerCase();
    const filterProject = document.getElementById('filterScheduleProject').value.toLowerCase();
    const filterReportId = document.getElementById('filterScheduleReportId').value.toLowerCase();
    const filterStatus = document.getElementById('filterScheduleStatus').value;
    const filterReminder = document.getElementById('filterScheduleReminder').value;
    const filterDate = document.getElementById('filterScheduleDate').value;

    let filtered = [...scheduleData];

    if (searchTerm) {
        filtered = filtered.filter(entry => {
            let dateSearchable = '';
            if (entry.Date) {
                const date = new Date(entry.Date);
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const dd = String(date.getDate()).padStart(2, '0');

                dateSearchable = `${yyyy}-${mm}-${dd} ${dd}/${mm}/${yyyy} ${dd}-${mm}-${yyyy}`;
            }

            return (
                (entry.Customer_Name || '').toLowerCase().includes(searchTerm) ||
                (entry.Project_Name || '').toLowerCase().includes(searchTerm) ||
                (entry.Report_ID || '').toString().toLowerCase().includes(searchTerm) ||
                (entry.Problem_Details || '').toLowerCase().includes(searchTerm) ||
                (entry.Job_Description || '').toLowerCase().includes(searchTerm) ||
                dateSearchable.toLowerCase().includes(searchTerm)
            );
        });
    }

    if (filterCustomer) {
        filtered = filtered.filter(entry => 
            (entry.Customer_Name || '').toLowerCase().includes(filterCustomer)
        );
    }

    if (filterProject) {
        filtered = filtered.filter(entry => 
            (entry.Project_Name || '').toLowerCase().includes(filterProject)
        );
    }

    if (filterReportId) {
        filtered = filtered.filter(entry => 
            (entry.Report_ID || '').toString().toLowerCase().includes(filterReportId)
        );
    }

    if (filterDate) {
        filtered = filtered.filter(entry => {
            if (entry.Date) {
                const entryDate = new Date(entry.Date).toISOString().split('T')[0];
                return entryDate === filterDate;
            }
            return false;
        });
    }

    if (filterStatus) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        filtered = filtered.filter(entry => {
            const entryDate = new Date(entry.Date);
            entryDate.setHours(0, 0, 0, 0);
            const isCompleted = entryDate < today;

            if (filterStatus === 'completed') {
                return isCompleted;
            } else if (filterStatus === 'pending') {
                return !isCompleted;
            }
            return true;
        });
    }

    if (filterReminder) {

        const remindersMap = await fetchAllRemindersForDetails(filtered);

        filtered = filtered.filter(entry => {
            const hasReminder = remindersMap[entry.Detail_ID];

            if (filterReminder === 'has-reminder') {
                return hasReminder;
            } else if (filterReminder === 'no-reminder') {
                return !hasReminder;
            }
            return true;
        });
    }

    renderScheduleDetails(filtered);
}

async function fetchAllRemindersForDetails(entries) {
    const remindersMap = {};

    const detailIds = [...new Set(entries.map(e => e.Detail_ID).filter(id => id))];

    try {
        const promises = detailIds.map(async (detailId) => {
            const response = await fetch(`/api/reminders/detail/${detailId}`);
            const data = await response.json();
            if (data.success && data.hasReminder) {
                remindersMap[detailId] = true;
            }
        });

        await Promise.all(promises);
    } catch (error) {
        console.error('Error fetching reminders:', error);
    }

    return remindersMap;
}

function highlightText(text, searchTerm) {
    if (!searchTerm || !text) return text || '';

    const textStr = String(text);
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return textStr.replace(regex, '<span class="highlight">$1</span>');
}

function renderScheduleDetails(filteredData = null) {
    const data = filteredData || scheduleData;
    const scheduleList = document.getElementById('scheduleList');
    const searchTerm = document.getElementById('scheduleSearch').value.toLowerCase();

    if (data.length === 0) {
        scheduleList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <p>No reports found matching your search criteria.</p>
            </div>
        `;
        return;
    }

    scheduleList.innerHTML = '';

    const groupedByDate = {};
    data.forEach(entry => {
        const dateKey = new Date(entry.Date).toISOString().split('T')[0];
        if (!groupedByDate[dateKey]) {
            groupedByDate[dateKey] = [];
        }
        groupedByDate[dateKey].push(entry);
    });

    Object.keys(groupedByDate).sort().reverse().forEach(dateKey => {
        const entries = groupedByDate[dateKey];
        const dateObj = new Date(dateKey);
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        const dateGroup = document.createElement('div');
        dateGroup.style.cssText = `
            margin-bottom: 25px;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            overflow: hidden;
        `;

        const dateHeader = document.createElement('div');
        dateHeader.textContent = formattedDate;
        dateHeader.style.cssText = `
            background: #f8f9fa;
            padding: 12px 15px;
            font-weight: 600;
            color: #333;
            border-bottom: 1px solid #dee2e6;
        `;
        dateGroup.appendChild(dateHeader);

        entries.forEach(async (entry, index) => {
            console.log('Rendering entry:', {
                Report_ID: entry.Report_ID,
                Customer_Name: entry.Customer_Name,
                Date: entry.Date,
                Detail_ID: entry.Detail_ID
            });

            const entryCard = document.createElement('div');
            entryCard.style.cssText = `
                padding: 15px;
                ${index < entries.length - 1 ? 'border-bottom: 1px solid #e9ecef;' : ''}
                background: white;
            `;

            const formatTime = (timeValue) => {
                if (!timeValue) return 'N/A';

                if (timeValue.includes('T') || timeValue.includes(' ')) {
                    const timePart = timeValue.split('T')[1] || timeValue.split(' ')[1];
                    if (timePart) {
                        return timePart.substring(0, 5); 
                    }
                }

                if (timeValue.includes(':')) {
                    return timeValue.substring(0, 5);
                }
                return timeValue;
            };

            const outTime = formatTime(entry.Out_Time);
            const inTime = formatTime(entry.In_Time);
            const startTime = formatTime(entry.Start_Time);
            const endTime = formatTime(entry.End_Time);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const entryDate = new Date(entry.Date);
            entryDate.setHours(0, 0, 0, 0);
            const isCompleted = entryDate < today;

            const statusBadge = isCompleted 
                ? '<span style="background: #4caf50; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600;">COMPLETED</span>'
                : '<span style="background: #2196f3; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600;">PENDING</span>';

            const detailId = entry.Detail_ID;

            entryCard.innerHTML = `
                <div style="background: linear-gradient(to right, #f8f9fa, #ffffff); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${isCompleted ? '#4caf50' : '#2196f3'};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <div style="flex: 1;">
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                    <div>
                                    <div style="color: #666; font-size: 11px; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Customer</div>
                                    <div style="color: #333; font-size: 15px; font-weight: 600;">${highlightText(entry.Customer_Name || 'N/A', searchTerm)}</div>
                    </div>
                    <div>
                                    <div style="color: #666; font-size: 11px; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Project Name</div>
                                    <div style="color: #333; font-size: 15px; font-weight: 600;">${highlightText(entry.Project_Name || 'N/A', searchTerm)}</div>
                    </div>
                    <div>
                                    <div style="color: #666; font-size: 11px; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Report ID</div>
                                    <div style="color: #007bff; font-size: 15px; font-weight: 700;">${highlightText(String(entry.Report_ID || ''), searchTerm)}</div>
                    </div>
                        </div>
                    </div>
                        <div style="margin-left: 20px;">
                        ${statusBadge}
                    </div>
                </div>

                    <div style="display: grid; grid-template-columns: auto 1fr; gap: 20px; background: white; padding: 15px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <div style="display: grid; grid-template-columns: repeat(2, auto); gap: 15px 25px; align-items: center; border-right: 2px solid #e9ecef; padding-right: 20px;">
                            <div style="text-align: right;">
                                <div style="color: #666; font-size: 10px; text-transform: uppercase; font-weight: 600; margin-bottom: 3px;">Out</div>
                                <div style="color: #333; font-size: 18px; font-weight: 700; font-family: 'Courier New', monospace;">${outTime}</div>
                    </div>
                            <div>
                                <div style="color: #666; font-size: 10px; text-transform: uppercase; font-weight: 600; margin-bottom: 3px;">In</div>
                                <div style="color: #333; font-size: 18px; font-weight: 700; font-family: 'Courier New', monospace;">${inTime}</div>
                </div>
                            <div style="text-align: right;">
                                <div style="color: #666; font-size: 10px; text-transform: uppercase; font-weight: 600; margin-bottom: 3px;">Start</div>
                                <div style="color: #28a745; font-size: 18px; font-weight: 700; font-family: 'Courier New', monospace;">${startTime}</div>
                            </div>
                            <div>
                                <div style="color: #666; font-size: 10px; text-transform: uppercase; font-weight: 600; margin-bottom: 3px;">End</div>
                                <div style="color: #dc3545; font-size: 18px; font-weight: 700; font-family: 'Courier New', monospace;">${endTime}</div>
                            </div>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${entry.Problem_Details ? `
                                <div>
                                    <div style="color: #dc3545; font-size: 11px; text-transform: uppercase; font-weight: 700; margin-bottom: 5px; display: flex; align-items: center; gap: 5px;">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="8" x2="12" y2="12"></line>
                                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                        </svg>
                                        Problem Details
                                    </div>
                                    <div style="color: #495057; font-size: 14px; line-height: 1.6; padding-left: 17px;">${highlightText(entry.Problem_Details, searchTerm)}</div>
                            </div>
                        ` : ''}
                        ${entry.Job_Description ? `
                            <div>
                                    <div style="color: #28a745; font-size: 11px; text-transform: uppercase; font-weight: 700; margin-bottom: 5px; display: flex; align-items: center; gap: 5px;">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        Job Description
                            </div>
                                    <div style="color: #495057; font-size: 14px; line-height: 1.6; padding-left: 17px;">${highlightText(entry.Job_Description, searchTerm)}</div>
                    </div>
                ` : ''}
                        </div>
                    </div>
                </div>
                <div class="action-buttons">
                    ${!isCompleted ? `
                    <button class="btn-action btn-reminder reminder-btn-${entry.Detail_ID}" data-report-id="${entry.Report_ID}" data-detail-id="${entry.Detail_ID}" data-customer="${entry.Customer_Name}" data-project="${entry.Project_Name}" data-date="${entry.Date}" data-out-time="${outTime}" data-in-time="${inTime}" data-start-time="${startTime}" data-end-time="${endTime}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span class="reminder-btn-text">Add Reminder</span>
                    </button>
                    ` : ''}
                    <button class="btn-action btn-view" data-report-id="${entry.Report_ID}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View
                    </button>
                    <button class="btn-action btn-edit" data-report-id="${entry.Report_ID}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit
                    </button>
                    <button class="btn-action btn-pdf" data-report-id="${entry.Report_ID}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        PDF
                    </button>
                </div>
            `;

            dateGroup.appendChild(entryCard);

            const viewBtn = entryCard.querySelector('.btn-view');
            const editBtn = entryCard.querySelector('.btn-edit');
            const pdfBtn = entryCard.querySelector('.btn-pdf');

            if (viewBtn) {
                const reportId = viewBtn.getAttribute('data-report-id');
                console.log('Button created with Report_ID:', reportId);

                viewBtn.addEventListener('click', function() {
                    const btnReportId = this.getAttribute('data-report-id');
                    console.log('View button clicked, Report_ID:', btnReportId);
                    viewReport(btnReportId);
                });
            } else {
                console.error('View report button not found for entry:', entry);
            }

            if (editBtn) {
                editBtn.addEventListener('click', function() {
                    const btnReportId = this.getAttribute('data-report-id');
                    console.log('Edit button clicked, Report_ID:', btnReportId);
                    editReport(btnReportId);
                });
            }

            if (pdfBtn) {
                pdfBtn.addEventListener('click', function() {
                    const btnReportId = this.getAttribute('data-report-id');
                    console.log('PDF button clicked, Report_ID:', btnReportId);
                    generatePDF(btnReportId, this);
                });
            }

            if (!isCompleted && detailId) {
                checkAndUpdateReminderButton(detailId);
            }
        });

        scheduleList.appendChild(dateGroup);
    });
}

async function checkAndUpdateReminderButton(detailId) {
    try {
        const response = await fetch(`/api/reminders/detail/${detailId}`);
        const data = await response.json();

        const reminderBtn = document.querySelector(`.reminder-btn-${detailId}`);
        if (!reminderBtn) return;

        if (data.success && data.hasReminder) {

            const btnText = reminderBtn.querySelector('.reminder-btn-text');
            if (btnText) {
                btnText.textContent = 'Reminder Added';
            }
            reminderBtn.style.background = 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
            reminderBtn.style.borderColor = '#4caf50';

            reminderBtn.dataset.reminderId = data.data.Reminder_ID;
            reminderBtn.dataset.hasReminder = 'true';
        }
    } catch (error) {
        console.error('Error checking reminder status:', error);
    }
}

async function fetchReminderDatesForCalendar() {
    reminderDates = [];

    try {

        const detailIds = scheduleData.map(entry => entry.Detail_ID).filter(id => id);

        const promises = detailIds.map(async (detailId) => {
            const response = await fetch(`/api/reminders/detail/${detailId}`);
            const data = await response.json();
            if (data.success && data.hasReminder) {

                const entry = scheduleData.find(e => e.Detail_ID === detailId);
                if (entry && entry.Date) {
                    const dateStr = new Date(entry.Date).toISOString().split('T')[0];
                    if (!reminderDates.includes(dateStr)) {
                        reminderDates.push(dateStr);
                    }
                }
            }
        });

        await Promise.all(promises);
        console.log('Dates with reminders:', reminderDates);
    } catch (error) {
        console.error('Error fetching reminder dates:', error);
    }
}

function viewReport(reportId) {
    console.log('viewReport called with:', reportId);
    if (!reportId) {
        console.error('No Report ID provided');
        alert('Error: No Report ID provided');
        return;
    }
    window.location.href = `review-report.html?reportId=${reportId}`;
}

function editReport(reportId) {
    console.log('editReport called with:', reportId);
    if (!reportId) {
        console.error('No Report ID provided');
        alert('Error: No Report ID provided');
        return;
    }
    window.location.href = `edit-report.html?reportId=${reportId}`;
}

async function generatePDF(reportId, buttonElement) {
    console.log('generatePDF called with:', reportId);
    if (!reportId) {
        console.error('No Report ID provided');
        alert('Error: No Report ID provided');
        return;
    }

    try {
        showLoadingState('Generating PDF...');

        currentAbortController = new AbortController();
        operationInProgress = true;

        const response = await fetch(`/api/report/generatePDF/${reportId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: currentAbortController.signal
        });

        if (!response.ok) {
            operationInProgress = false;
            currentAbortController = null;
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const pdfBlob = await response.blob();
        const url = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `service-report-${reportId}.pdf`;
        document.body.appendChild(a);
        a.click();

        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        operationInProgress = false;
        currentAbortController = null;
        hideLoadingState();

        console.log('PDF generated and downloaded successfully');
    } catch (error) {
        console.error('Error generating PDF:', error);
        operationInProgress = false;
        currentAbortController = null;
        hideLoadingState();

        if (error.name === 'AbortError') {
            alert('PDF generation was cancelled');
        } else {
            alert('Error generating PDF. Please try again.');
        }
    }
}

function showLoading(show) {
    document.getElementById('loadingIndicator').style.display = show ? 'block' : 'none';
}

function showAllReports() {
    if (scheduleData.length === 0) {
        return; 
    }

    console.log('Showing all reports (unfiltered)');

    document.querySelectorAll('.calendar-grid > div').forEach(cell => {
        cell.style.outline = 'none';
    });

    renderScheduleDetails();

    document.getElementById('scheduleDetails').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
    });
}