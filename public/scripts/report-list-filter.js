class ReportListFilter {
    constructor() {
       this.filterInputs = {
          customer: document.getElementById('filterCustomer'),
          reportNo: document.getElementById('filterReportNo'),
          date: document.getElementById('filterDate'),
          serviceBy: document.getElementById('filterServiceBy'),
          system: document.getElementById('filterSystem'),
          plcHmi: document.getElementById('filterPlcHmi'),
          brand: document.getElementById('filterBrand'),
          modelNo: document.getElementById('filterModelNo')
       };
 
       this.toggleButton = document.getElementById('toggleFilters');
       this.filtersContainer = document.getElementById('filtersContainer');
       this.applyButton = document.getElementById('applyFilters');
       this.clearAllButton = document.getElementById('clearAllFilters');
       this.activeFiltersCount = document.getElementById('activeFiltersCount');
 
       this.pendingFilters = {};
       this.activeFilters = {};
       this.filtersVisible = false;
    }
 
    init() {
 
       this.toggleButton.addEventListener('click', () => this.toggleFilters());
 
       this.applyButton.addEventListener('click', () => this.applyFiltersFromInput());
 
       this.clearAllButton.addEventListener('click', () => this.clearAllFilters());
 
       Object.keys(this.filterInputs).forEach(key => {
          const input = this.filterInputs[key];
          if (input) {
             input.addEventListener('input', () => this.handleFilterInput(key, input.value));
 
             input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                   this.applyFiltersFromInput();
                }
             });
 
             if (input.value.trim()) {
                this.pendingFilters[key] = input.value.trim().toLowerCase();
             }
          }
       });
 
       this.updateApplyButtonState();
    }
 
    toggleFilters() {
       this.filtersVisible = !this.filtersVisible;
 
       if (this.filtersVisible) {
          this.filtersContainer.style.display = 'block';
          this.toggleButton.classList.add('active');
          this.toggleButton.innerHTML = `
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                 </svg>
                 Hide Filters
             `;
       } else {
          this.filtersContainer.style.display = 'none';
          this.toggleButton.classList.remove('active');
          this.toggleButton.innerHTML = `
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                 </svg>
                 Show Filters
             `;
       }
    }
 
    handleFilterInput(filterKey, value) {
       const trimmedValue = value.trim();
 
       if (trimmedValue) {
          this.pendingFilters[filterKey] = trimmedValue;
       } else {
          delete this.pendingFilters[filterKey];
       }
 
       this.updateApplyButtonState();
    }
 
    applyFiltersFromInput() {
 
       Object.keys(this.filterInputs).forEach(key => {
          const input = this.filterInputs[key];
          if (input) {
             const trimmedValue = input.value.trim();
             if (trimmedValue) {
                this.pendingFilters[key] = trimmedValue;
             } else {
                delete this.pendingFilters[key];
             }
          }
       });
 
       this.activeFilters = {
          ...this.pendingFilters
       };
 
       Object.keys(this.filterInputs).forEach(key => {
          const input = this.filterInputs[key];
          if (input) {
             if (this.activeFilters[key]) {
                input.classList.add('active');
             } else {
                input.classList.remove('active');
             }
          }
       });
 
       this.updateActiveFiltersCount();
       this.updateApplyButtonState();
       this.applyFilters();
    }
 
    updateApplyButtonState() {
 
       const hasPendingChanges = JSON.stringify(this.pendingFilters) !== JSON.stringify(this.activeFilters);
 
       if (hasPendingChanges) {
          this.applyButton.style.fontWeight = '600';
          this.applyButton.style.boxShadow = '0 0 0 2px rgba(0, 123, 255, 0.3)';
       } else {
          this.applyButton.style.fontWeight = '500';
          this.applyButton.style.boxShadow = 'none';
       }
    }
 
    applyFilters() {
 
       let reports;
       if (window.reportListSearch && window.reportListSearch.getCurrentSearchTerm()) {
 
          const allReports = window.reportListLoader.getAllReports();
          const searchTerm = window.reportListSearch.getCurrentSearchTerm();
 
          reports = allReports.filter(report => {
             const searchableFields = [
                String(report.customer || ''),
                String(report.reportNo || ''),
                String(report.serviceBy || ''),
                String(report.system || ''),
                String(report.plcHmi || ''),
                String(report.brand || ''),
                String(report.modelNo || ''),
                window.reportListLoader.formatDate(report.date)
             ];
 
             return searchableFields.some(field =>
                field && field.toLowerCase().includes(searchTerm)
             );
          });
       } else {
 
          reports = [...window.reportListLoader.getAllReports()];
       }
 
       Object.keys(this.activeFilters).forEach(key => {
          const filterValue = this.activeFilters[key].toLowerCase();
 
          reports = reports.filter(report => {
             let fieldValue = '';
 
             switch (key) {
                case 'customer':
                   fieldValue = String(report.customer || '').toLowerCase();
                   return fieldValue.includes(filterValue);
                case 'reportNo':
                   fieldValue = String(report.reportNo || '').toLowerCase();
                   return fieldValue.includes(filterValue);
                case 'date':
 
                   fieldValue = String(report.date || '').toLowerCase();
                   const formattedDate = window.reportListLoader.formatDate(report.date).toLowerCase();
                   return fieldValue.includes(filterValue) || formattedDate.includes(filterValue);
                case 'serviceBy':
                   fieldValue = String(report.serviceBy || '').toLowerCase();
                   return fieldValue.includes(filterValue);
                case 'system':
                   fieldValue = String(report.system || '').toLowerCase();
                   return fieldValue.includes(filterValue);
                case 'plcHmi':
                   fieldValue = String(report.plcHmi || '').toLowerCase();
                   return fieldValue.includes(filterValue);
                case 'brand':
                   fieldValue = String(report.brand || '').toLowerCase();
                   return fieldValue.includes(filterValue);
                case 'modelNo':
                   fieldValue = String(report.modelNo || '').toLowerCase();
                   return fieldValue.includes(filterValue);
                default:
                   return true;
             }
          });
       });
 
       window.reportListLoader.setFilteredReports(reports);
 
       if (window.reportListPagination) {
          window.reportListPagination.currentPage = 1;
          window.reportListPagination.updatePagination();
       }
    }
 
    clearAllFilters() {
 
       Object.keys(this.filterInputs).forEach(key => {
          const input = this.filterInputs[key];
          if (input) {
             input.value = '';
             input.classList.remove('active');
          }
       });
 
       this.pendingFilters = {};
       this.activeFilters = {};
 
       this.updateActiveFiltersCount();
       this.updateApplyButtonState();
 
       if (window.reportListPagination) {
          window.reportListPagination.currentPage = 1;
       }
 
       this.applyFilters();
    }
 
    updateActiveFiltersCount() {
 
       const count = Object.keys(this.activeFilters).length;
 
       if (this.activeFiltersCount) {
          this.activeFiltersCount.style.display = 'none';
       }
    }
 
    getActiveFilters() {
       return this.activeFilters;
    }
 }
 
 window.reportListFilter = new ReportListFilter();