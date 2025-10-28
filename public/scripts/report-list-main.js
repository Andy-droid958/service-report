document.addEventListener('DOMContentLoaded', async function () {

    window.reportListSearch.init();
    window.reportListFilter.init();
    window.reportListPagination.init();
 
    setupTableSorting();
 
    await loadReportsData();
 });
 
 async function loadReportsData() {
    try {
 
       const tbody = document.getElementById('reportsTableBody');
       tbody.innerHTML = `
             <tr class="loading-row">
                 <td colspan="9" class="text-center">
                     <div class="spinner"></div>
                     <p>Loading reports...</p>
                 </td>
             </tr>
         `;
 
       await window.reportListLoader.loadReports();
 
       window.reportListPagination.updatePagination();
 
    } catch (error) {
       console.error('Error loading reports:', error);
 
       const tbody = document.getElementById('reportsTableBody');
       tbody.innerHTML = `
             <tr>
                 <td colspan="9" class="text-center" style="padding: 60px 20px;">
                     <div style="color: #dc3545; margin-bottom: 10px;">
                         <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                             <circle cx="12" cy="12" r="10"></circle>
                             <line x1="12" y1="8" x2="12" y2="12"></line>
                             <line x1="12" y1="16" x2="12.01" y2="16"></line>
                         </svg>
                     </div>
                     <h3 style="color: #495057; font-size: 18px; margin-bottom: 10px;">Error Loading Reports</h3>
                     <p style="color: #6c757d; font-size: 14px;">Unable to load reports from the server. Please try again later.</p>
                     <button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                         Retry
                     </button>
                 </td>
             </tr>
         `;
 
       document.getElementById('paginationContainer').style.display = 'none';
    }
 }
 
 function setupTableSorting() {
    const sortableHeaders = document.querySelectorAll('.sortable');
    let currentSortColumn = null;
    let currentSortDirection = null;
 
    sortableHeaders.forEach(header => {
       header.addEventListener('click', () => {
          const column = header.dataset.column;
 
          if (currentSortColumn === column) {
 
             currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
          } else {
 
             currentSortDirection = 'asc';
          }
 
          currentSortColumn = column;
 
          updateSortHeaderUI(header, currentSortDirection);
 
          sortData(column, currentSortDirection);
       });
    });
 }
 
 function updateSortHeaderUI(activeHeader, direction) {
 
    document.querySelectorAll('.sortable').forEach(header => {
       header.classList.remove('sorted-asc', 'sorted-desc');
       const icon = header.querySelector('.sort-icon');
       if (icon) {
          icon.innerHTML = '⇅';
       }
    });
 
    activeHeader.classList.add(direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
 }
 
 function sortData(column, direction) {
    let reports = window.reportListLoader.getFilteredReports();
 
    reports.sort((a, b) => {
       let aValue = a[column] || '';
       let bValue = b[column] || '';
 
       if (column === 'date') {
          aValue = new Date(aValue || '1970-01-01');
          bValue = new Date(bValue || '1970-01-01');
       } else {
 
          aValue = aValue.toString().toLowerCase();
          bValue = bValue.toString().toLowerCase();
       }
 
       if (aValue < bValue) {
          return direction === 'asc' ? -1 : 1;
       }
       if (aValue > bValue) {
          return direction === 'asc' ? 1 : -1;
       }
       return 0;
    });
 
    window.reportListLoader.setFilteredReports(reports);
 
    window.reportListPagination.currentPage = 1;
    window.reportListPagination.updatePagination();
 }
 
 const createReportBtn = document.getElementById('createReportBtn');
 const reportListBtn = document.getElementById('reportListBtn');
 
 if (createReportBtn) {
    createReportBtn.addEventListener('click', () => {
       window.location.href = 'index.html';
    });
 }
 
 if (reportListBtn) {
    reportListBtn.addEventListener('click', () => {
       window.location.href = 'report-list.html';
    });
 }