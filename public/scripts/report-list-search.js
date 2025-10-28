class ReportListSearch {
    constructor() {
        this.searchInput = document.getElementById('globalSearch');
        this.clearButton = document.getElementById('clearSearch');
        this.currentSearchTerm = '';
    }

    init() {
        if (!this.searchInput || !this.clearButton) {
            console.error('Search elements not found');
            return;
        }

        this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
        this.clearButton.addEventListener('click', () => this.clearSearch());

        this.searchInput.addEventListener('input', (e) => {
            this.clearButton.style.display = e.target.value ? 'flex' : 'none';
        });

        setTimeout(() => {
            if (this.searchInput) {
                this.searchInput.focus();
            }
        }, 100);
    }

    handleSearch(event) {
        this.currentSearchTerm = event.target.value.toLowerCase().trim();

        const allReports = window.reportListLoader.getAllReports();

        let filteredReports = allReports;

        if (this.currentSearchTerm) {
            filteredReports = allReports.filter(report => {

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
                    field && field.toLowerCase().includes(this.currentSearchTerm)
                );
            });
        }

        window.reportListLoader.setFilteredReports(filteredReports);

        if (window.reportListPagination) {
            window.reportListPagination.currentPage = 1;
        }

        if (window.reportListFilter) {
            window.reportListFilter.applyFilters();
        } else {

            if (window.reportListPagination) {
                window.reportListPagination.updatePagination();
            }
        }
    }

    clearSearch() {
        this.searchInput.value = '';
        this.currentSearchTerm = '';
        this.clearButton.style.display = 'none';

        const allReports = window.reportListLoader.getAllReports();
        window.reportListLoader.setFilteredReports(allReports);

        if (window.reportListPagination) {
            window.reportListPagination.currentPage = 1;
        }

        if (window.reportListFilter) {
            window.reportListFilter.applyFilters();
        } else {
            if (window.reportListPagination) {
                window.reportListPagination.updatePagination();
            }
        }

        this.searchInput.focus();
    }

    getCurrentSearchTerm() {
        return this.currentSearchTerm;
    }
}

window.reportListSearch = new ReportListSearch();