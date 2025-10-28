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

class ReportListLoader {
    constructor() {
       this.allReports = [];
       this.filteredReports = [];
    }
 
    async loadReports() {
       try {
          const response = await fetch('/api/report/getAllReports');
 
          if (!response.ok) {
             throw new Error('Failed to fetch reports');
          }
 
          const data = await response.json();
 
          this.allReports = this.processReports(data);
          this.filteredReports = [...this.allReports];
 
          return this.allReports;
       } catch (error) {
          console.error('Error loading reports:', error);
 
          this.allReports = [];
          this.filteredReports = [];
          return [];
       }
    }
 
    processReports(reports) {
       const processedReports = [];
 
       if (!Array.isArray(reports)) {
          console.error('Expected reports to be an array, got:', typeof reports);
          return [];
       }
 
       reports.forEach(row => {
 
          const reportId = row.Report_ID || row.reportId || row.id || '';
 
          processedReports.push({
             id: reportId,
             customer: row.Customer_Name || '',
             reportNo: reportId,
             date: row.Date || '',
             serviceBy: row.Service_By || '',
             system: row.System_Name || '',
             plcHmi: row.PLC_HMI || '',
             brand: row.Brand || '',
             modelNo: row.Model_Number || '',
 
             _fullReport: row,
             _infoId: row.Info_ID
          });
       });
 
       return processedReports;
    }
 
    getAllReports() {
       return this.allReports;
    }
 
    getFilteredReports() {
       return this.filteredReports;
    }
 
    setFilteredReports(reports) {
       this.filteredReports = reports;
    }
 
    formatDate(dateString) {
       if (!dateString) return '';
 
       const date = new Date(dateString);
       const day = String(date.getDate()).padStart(2, '0');
       const month = String(date.getMonth() + 1).padStart(2, '0');
       const year = date.getFullYear();
 
       return `${day}/${month}/${year}`;
    }
 
    renderTableRow(report, searchTerm = '') {
       const tr = document.createElement('tr');
       tr.dataset.reportId = report.id;
 
       if (!report.id) {
          console.warn('Report missing ID:', report);
       }
 
       const highlightText = (text, term) => {
          if (!term || !text) return text || '';
 
          const textStr = String(text);
 
          const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          return textStr.replace(regex, '<span class="highlight">$1</span>');
       };
 
       const formattedDate = this.formatDate(report.date);
 
       tr.innerHTML = `
             <td>${highlightText(report.customer || '', searchTerm)}</td>
             <td>${highlightText(String(report.reportNo || ''), searchTerm)}</td>
             <td>${highlightText(formattedDate, searchTerm)}</td>
             <td>${highlightText(report.serviceBy || '', searchTerm)}</td>
             <td>${highlightText(report.system || '', searchTerm)}</td>
             <td>${highlightText(report.plcHmi || '', searchTerm)}</td>
             <td>${highlightText(report.brand || '', searchTerm)}</td>
             <td>${highlightText(report.modelNo || '', searchTerm)}</td>
            <td class="actions-column">
                <div class="action-buttons">
                    <button class="btn-action btn-view" data-action="view" data-id="${report.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View
                    </button>
                    <button class="btn-action btn-edit" data-action="edit" data-id="${report.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit
                    </button>
                    <button class="btn-action btn-pdf" data-action="pdf" data-id="${report.id}">
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
            </td>
         `;
 
       return tr;
    }
 
    renderTable(reports, searchTerm = '') {
       const tbody = document.getElementById('reportsTableBody');
       const emptyState = document.getElementById('emptyState');
 
       tbody.innerHTML = '';
 
       if (reports.length === 0) {
 
          tbody.style.display = 'none';
          emptyState.style.display = 'block';
          return;
       }
 
       tbody.style.display = '';
       emptyState.style.display = 'none';
 
       reports.forEach(report => {
          const row = this.renderTableRow(report, searchTerm);
          tbody.appendChild(row);
       });
 
       this.attachActionListeners();
    }
 
   attachActionListeners() {
      const viewButtons = document.querySelectorAll('.btn-view');
      const editButtons = document.querySelectorAll('.btn-edit');
      const pdfButtons = document.querySelectorAll('.btn-pdf');

      viewButtons.forEach(button => {
         button.addEventListener('click', (e) => {
            const reportId = e.currentTarget.dataset.id;
            this.viewReport(reportId);
         });
      });

      editButtons.forEach(button => {
         button.addEventListener('click', (e) => {
            const reportId = e.currentTarget.dataset.id;
            this.editReport(reportId);
         });
      });

      pdfButtons.forEach(button => {
         button.addEventListener('click', (e) => {
            const reportId = e.currentTarget.dataset.id;
            this.generatePDF(reportId, e.currentTarget);
         });
      });
   }
 
    viewReport(reportId) {
 
       if (!reportId || reportId === 'undefined' || reportId === 'null') {
          console.error('Invalid report ID:', reportId);
          alert('Error: Unable to load report. Invalid report ID.');
          return;
       }
 
       const reportIdStr = String(reportId);
       console.log('Viewing report ID:', reportIdStr);
       sessionStorage.setItem('currentReportId', reportIdStr);
 
       window.location.href = `review-report.html?reportId=${reportIdStr}`;
    }
 
   editReport(reportId) {

      if (!reportId || reportId === 'undefined' || reportId === 'null') {
         console.error('Invalid report ID:', reportId);
         alert('Error: Unable to edit report. Invalid report ID.');
         return;
      }

      const reportIdStr = String(reportId);
      console.log('Editing report ID:', reportIdStr);
      sessionStorage.setItem('editReportId', reportIdStr);

      window.location.href = `edit-report.html?reportId=${reportIdStr}`;
   }

   async generatePDF(reportId, buttonElement) {
      if (!reportId || reportId === 'undefined' || reportId === 'null') {
         console.error('Invalid report ID:', reportId);
         alert('Error: Unable to generate PDF. Invalid report ID.');
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
}

window.reportListLoader = new ReportListLoader();