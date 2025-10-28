function initializeSidebarSearchButtons() {
    const reviewReportBtn = document.getElementById('reviewReportBtn');
    const editReportBtn = document.getElementById('editReportBtn');
    
    if (reviewReportBtn) {
        reviewReportBtn.addEventListener('click', function() {
            showSidebarSearchPopup('review');
        });
    }
    
    if (editReportBtn) {
        editReportBtn.addEventListener('click', function() {
            showSidebarSearchPopup('edit');
        });
    }
}

function showSidebarSearchPopup(type) {
    const isReview = type === 'review';
    const title = isReview ? 'Review Report' : 'Edit Report';
    
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.innerHTML = `
        <div class="popup-content search-popup">
            <div class="popup-header">
                <h3>${title}</h3>
                <button class="close-popup" onclick="closeSidebarSearchPopup()">&times;</button>
            </div>
            <div class="popup-body">
                <div class="search-form">
                    <div class="search-field">
                        <label for="sidebarUnifiedSearch">Search by relevant fields e.g., customer name, date (YYYY-MM-DD), staff name, report no, project name or brand:</label>
                        <input type="text" id="sidebarUnifiedSearch">
                    </div>
                    <div class="search-actions">
                        <button id="sidebarSearchReportsBtn" class="search-btn">Search</button>
                        <button id="sidebarClearSearchBtn" class="clear-btn">Clear</button>
                    </div>
                </div>
                <div id="sidebarSearchResults" class="search-results"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    const unifiedSearchInput = document.getElementById('sidebarUnifiedSearch');
    const searchBtn = document.getElementById('sidebarSearchReportsBtn');
    const clearBtn = document.getElementById('sidebarClearSearchBtn');
    
    searchBtn.addEventListener('click', () => sidebarSearchReports(type));
    clearBtn.addEventListener('click', sidebarClearSearchFields);
    
    unifiedSearchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sidebarSearchReports(type);
        }
    });
    
    let searchTimeout;
    unifiedSearchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.trim();
        
        clearTimeout(searchTimeout);
        
        if (searchTerm.length >= 1) {
            document.getElementById('sidebarSearchResults').innerHTML = '<div class="typing-indicator">Searching...</div>';
            
            searchTimeout = setTimeout(() => {
                performSidebarLiveSearch(searchTerm, type);
            }, 300);
        } else if (searchTerm.length === 0) {
            document.getElementById('sidebarSearchResults').innerHTML = '';
        }
    });
    
    unifiedSearchInput.focus();
}

function closeSidebarSearchPopup() {
    const overlay = document.querySelector('.popup-overlay');
    if (overlay) {
        overlay.remove();
    }
}

function sidebarClearSearchFields() {
    document.getElementById('sidebarUnifiedSearch').value = '';
    document.getElementById('sidebarSearchResults').innerHTML = '';
    document.getElementById('sidebarUnifiedSearch').focus();
}

async function performSidebarLiveSearch(searchTerm, type) {
    const searchResults = document.getElementById('sidebarSearchResults');
    
    try {
        searchResults.innerHTML = '<div class="loading-message">Searching...</div>';
        
        const response = await fetch(`/api/report/search?searchTerm=${encodeURIComponent(searchTerm)}`);
        const result = await response.json();
        
        if (response.ok) {
            displaySidebarLiveSearchResults(result.reports, searchTerm, type);
        } else {
            searchResults.innerHTML = `<div class="error-message">Error: ${result.error}</div>`;
        }
    } catch (error) {
        console.error('Error in live search:', error);
        searchResults.innerHTML = '<div class="error-message">Error searching reports.</div>';
    }
}

async function sidebarSearchReports(type) {
    const unifiedSearchInput = document.getElementById('sidebarUnifiedSearch');
    const searchResults = document.getElementById('sidebarSearchResults');
    const searchBtn = document.getElementById('sidebarSearchReportsBtn');
    
    const searchTerm = unifiedSearchInput.value.trim();
    
    if (!searchTerm) {
        searchResults.innerHTML = '<div class="error-message">Please enter a search term, e.g., customer name, date (YYYY-MM-DD), staff name, report no, project name or brand.</div>';
        return;
    }
    
    searchBtn.textContent = 'Searching...';
    searchBtn.disabled = true;
    searchResults.innerHTML = '<div class="loading-message">Searching reports...</div>';
    
    try {
        const response = await fetch(`/api/report/search?searchTerm=${encodeURIComponent(searchTerm)}`);
        const result = await response.json();
        
        if (response.ok) {
            displaySidebarSearchResults(result.reports, searchTerm, type);
        } else {
            searchResults.innerHTML = `<div class="error-message">Error: ${result.error}</div>`;
        }
    } catch (error) {
        console.error('Error searching reports:', error);
        searchResults.innerHTML = '<div class="error-message">Error searching reports. Please try again.</div>';
    } finally {
        searchBtn.textContent = 'Search';
        searchBtn.disabled = false;
    }
}

function displaySidebarLiveSearchResults(reports, searchTerm, type) {
    const searchResults = document.getElementById('sidebarSearchResults');
    
    if (!reports || reports.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No reports found matching "' + searchTerm + '"</div>';
        return;
    }
    
    const actionText = type === 'review' ? 'Review' : 'Edit';
    
    let html = '<div class="results-header">Found ' + reports.length + ' report(s) matching "' + searchTerm + '":</div>';
    html += '<div class="reports-list live-search-results">';
    
    reports.forEach(report => {
        let formattedDate = 'N/A';
        if (report.Date) {
            const date = new Date(report.Date);
            if (!isNaN(date.getTime())) {
                formattedDate = date.toISOString().split('T')[0];
            }
        }
        
        let customerName = report.Customer_Name || 'N/A';
        if (customerName !== 'N/A' && typeof customerName === 'string' && customerName.trim() !== '') {
            const names = customerName.split(',').map(name => name.trim());
            const uniqueNames = [...new Set(names)];
            customerName = uniqueNames.join(', ');
        }
        
        const brands = report.Brands || 'N/A';
        const highlightedCustomerName = highlightSidebarText(customerName, searchTerm);
        const highlightedProjectName = highlightSidebarText(report.Project_Name || 'N/A', searchTerm);
        const highlightedServiceBy = highlightSidebarText(report.Service_By || 'N/A', searchTerm);
        const highlightedReportId = highlightSidebarText(report.Report_ID.toString(), searchTerm);
        const highlightedDate = highlightSidebarText(formattedDate, searchTerm);
        const highlightedBrands = highlightSidebarText(brands, searchTerm);
        
        html += `
            <div class="report-item live-search-item">
                <div class="report-info">
                    <div class="report-id">Report ID: ${highlightedReportId}</div>
                    <div class="report-customer">Customer: ${highlightedCustomerName}</div>
                    <div class="report-project">Project: ${highlightedProjectName}</div>
                    <div class="report-date">Date: ${highlightedDate}</div>
                    <div class="report-service-by">Service By: ${highlightedServiceBy}</div>
                    <div class="report-brand">Brand: ${highlightedBrands}</div>
                </div>
                <div class="report-actions">
                    <button class="view-btn" onclick="sidebarNavigateToReport(${report.Report_ID}, '${type}')">${actionText}</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    searchResults.innerHTML = html;
}

function displaySidebarSearchResults(reports, searchTerm, type) {
    const searchResults = document.getElementById('sidebarSearchResults');
    
    if (!reports || reports.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No reports found.</div>';
        return;
    }
    
    const actionText = type === 'review' ? 'Review' : 'Edit';
    
    let html = '<div class="results-header">Found ' + reports.length + ' report(s):</div>';
    html += '<div class="reports-list">';
    
    reports.forEach(report => {
        let formattedDate = 'N/A';
        if (report.Date) {
            const date = new Date(report.Date);
            if (!isNaN(date.getTime())) {
                formattedDate = date.toISOString().split('T')[0];
            }
        }
        
        let customerName = report.Customer_Name || 'N/A';
        if (customerName !== 'N/A' && typeof customerName === 'string' && customerName.trim() !== '') {
            const names = customerName.split(',').map(name => name.trim());
            const uniqueNames = [...new Set(names)];
            customerName = uniqueNames.join(', ');
        }
        
        const brands = report.Brands || 'N/A';
        
        const highlightedCustomerName = highlightSidebarText(customerName, searchTerm);
        const highlightedProjectName = highlightSidebarText(report.Project_Name || 'N/A', searchTerm);
        const highlightedServiceBy = highlightSidebarText(report.Service_By || 'N/A', searchTerm);
        const highlightedReportId = highlightSidebarText(report.Report_ID.toString(), searchTerm);
        const highlightedDate = highlightSidebarText(formattedDate, searchTerm);
        const highlightedBrands = highlightSidebarText(brands, searchTerm);
        
        html += `
            <div class="report-item">
                <div class="report-info">
                    <div class="report-id">Report ID: ${highlightedReportId}</div>
                    <div class="report-customer">Customer: ${highlightedCustomerName}</div>
                    <div class="report-project">Project: ${highlightedProjectName}</div>
                    <div class="report-date">Date: ${highlightedDate}</div>
                    <div class="report-service-by">Service By: ${highlightedServiceBy}</div>
                    <div class="report-brand">Brand: ${highlightedBrands}</div>
                </div>
                <div class="report-actions">
                    <button class="view-btn" onclick="sidebarNavigateToReport(${report.Report_ID}, '${type}')">${actionText}</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    searchResults.innerHTML = html;
}

function highlightSidebarText(text, searchTerm) {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

function sidebarNavigateToReport(reportId, type) {
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.disabled = true;
        button.style.opacity = '0.6';
        button.style.cursor = 'not-allowed';
        button.style.backgroundColor = '#f8f9fa';
        button.style.color = '#6c757d';
        button.style.border = '1px solid #dee2e6';
    });
    
    const pageName = type === 'review' ? 'review' : 'edit';
    const confirmed = confirm(`Are you sure you want to go to the ${pageName} page? All data that haven't been submitted will be cleared.`);
    
    if (confirmed) {
        closeSidebarSearchPopup();
        if (type === 'review') {
            window.location.href = `review-report.html?reportId=${reportId}`;
        } else {
            window.location.href = `edit-report.html?reportId=${reportId}`;
        }
    } else {
        viewButtons.forEach(button => {
            button.disabled = false;
            button.style.opacity = '';
            button.style.cursor = '';
            button.style.backgroundColor = '';
            button.style.color = '';
            button.style.border = '';
        });
    }
}

document.addEventListener('DOMContentLoaded', initializeSidebarSearchButtons);

