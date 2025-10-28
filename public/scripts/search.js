function initializeSearchPopupButtons() {
    const isIndexPage = !document.getElementById('updateReportButton');
    
    const reviewButton = document.getElementById('reviewButton');
    if (reviewButton && isIndexPage) {
        reviewButton.addEventListener('click', function() {
            showReportSearchPopup();
        });
    }
    

    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            showReportSearchPopup();
        });
    }
}

function showReportSearchPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.innerHTML = `
        <div class="popup-content search-popup">
            <div class="popup-header">
                <h3>Search Reports</h3>
                <button class="close-popup" onclick="closeReportSearchPopup()">&times;</button>
            </div>
            <div class="popup-body">
                <div class="search-form">
                    <div class="search-field">
                        <label for="unifiedSearch">Search by relevant fields e.g., customer name, date (YYYY-MM-DD), staff name, report no, project name or brand:</label>
                        <input type="text" id="unifiedSearch">
                    </div>
                    <div class="search-actions">
                    <button id="searchReportsBtn" class="search-btn">Search</button>
                        <button id="clearSearchBtn" class="clear-btn">Clear</button>
                    </div>
                </div>
                <div id="searchResults" class="search-results"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    const unifiedSearchInput = document.getElementById('unifiedSearch');
    const searchBtn = document.getElementById('searchReportsBtn');
    const clearBtn = document.getElementById('clearSearchBtn');
    
    searchBtn.addEventListener('click', searchReports);
    clearBtn.addEventListener('click', clearSearchFields);
    
    unifiedSearchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchReports();
        }
    });
    
    let searchTimeout;
    unifiedSearchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.trim();
        
        clearTimeout(searchTimeout);
        
        if (searchTerm.length >= 1) {
      
            document.getElementById('searchResults').innerHTML = '<div class="typing-indicator">Searching...</div>';
        
            searchTimeout = setTimeout(() => {
                performLiveSearch(searchTerm);
            }, 300);
        } else if (searchTerm.length === 0) {
            document.getElementById('searchResults').innerHTML = '';
        }
    });
    
    unifiedSearchInput.focus();
}

function closeReportSearchPopup() {
    const overlay = document.querySelector('.popup-overlay');
    if (overlay) {
        overlay.remove();
    }
}

function clearSearchFields() {
    document.getElementById('unifiedSearch').value = '';
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('unifiedSearch').focus();
}

async function performLiveSearch(searchTerm) {
    const searchResults = document.getElementById('searchResults');
    
    try {
        searchResults.innerHTML = '<div class="loading-message">Searching...</div>';
        
        const response = await fetch(`/api/report/search?searchTerm=${encodeURIComponent(searchTerm)}`);
        const result = await response.json();
        
        if (response.ok) {
            displayLiveSearchResults(result.reports, searchTerm);
        } else {
            searchResults.innerHTML = `<div class="error-message">Error: ${result.error}</div>`;
        }
    } catch (error) {
        console.error('Error in live search:', error);
        searchResults.innerHTML = '<div class="error-message">Error searching reports.</div>';
    }
}

async function searchReports() {
    const unifiedSearchInput = document.getElementById('unifiedSearch');
    const searchResults = document.getElementById('searchResults');
    const searchBtn = document.getElementById('searchReportsBtn');
    
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
            displaySearchResults(result.reports);
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

function displayLiveSearchResults(reports, searchTerm) {
    const searchResults = document.getElementById('searchResults');
    
    if (!reports || reports.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No reports found matching "' + searchTerm + '"</div>';
        return;
    }
    
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
        const highlightedCustomerName = highlightText(customerName, searchTerm);
        const highlightedProjectName = highlightText(report.Project_Name || 'N/A', searchTerm);
        const highlightedServiceBy = highlightText(report.Service_By || 'N/A', searchTerm);
        const highlightedReportId = highlightText(report.Report_ID.toString(), searchTerm);
        const highlightedDate = highlightText(formattedDate, searchTerm);
        const highlightedBrands = highlightText(brands, searchTerm);
        
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
                    <button class="view-btn" onclick="viewReport(${report.Report_ID})">View</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    searchResults.innerHTML = html;
}

function displaySearchResults(reports) {
    const searchResults = document.getElementById('searchResults');
    
    if (!reports || reports.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No reports found.</div>';
        return;
    }
    
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
        
        const searchTerm = document.getElementById('unifiedSearch').value.trim();
        const brands = report.Brands || 'N/A';
        
        const highlightedCustomerName = highlightText(customerName, searchTerm);
        const highlightedProjectName = highlightText(report.Project_Name || 'N/A', searchTerm);
        const highlightedServiceBy = highlightText(report.Service_By || 'N/A', searchTerm);
        const highlightedReportId = highlightText(report.Report_ID.toString(), searchTerm);
        const highlightedDate = highlightText(formattedDate, searchTerm);
        const highlightedBrands = highlightText(brands, searchTerm);
        
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
                    <button class="view-btn" onclick="viewReport(${report.Report_ID})">View</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    searchResults.innerHTML = html;
}

function highlightText(text, searchTerm) {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

function viewReport(reportId) {
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.disabled = true;
        button.style.opacity = '0.6';
        button.style.cursor = 'not-allowed';
        button.style.backgroundColor = '#f8f9fa';
        button.style.color = '#6c757d';
        button.style.border = '1px solid #dee2e6';
    });
    
    const confirmed = confirm(`Are you sure you want to go to the review page? All data that haven't been submitted will be cleared.`);
    
    if (confirmed) {
        closeReportSearchPopup();
        window.location.href = `review-report.html?reportId=${reportId}`;
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

document.addEventListener('DOMContentLoaded', initializeSearchPopupButtons);
