class ReportListPagination {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 25;
        this.totalRecords = 0;

        this.pageSizeSelect = document.getElementById('pageSize');
        this.paginationContainer = document.getElementById('pagination');
        this.resultsCount = document.getElementById('resultsCount');
        this.showingStart = document.getElementById('showingStart');
        this.showingEnd = document.getElementById('showingEnd');
        this.totalRecordsSpan = document.getElementById('totalRecords');
    }

    init() {

        this.pageSizeSelect.addEventListener('change', (e) => {
            this.pageSize = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
            this.currentPage = 1; 
            this.updatePagination();
        });
    }

    updatePagination() {
        const filteredReports = window.reportListLoader.getFilteredReports();
        this.totalRecords = filteredReports.length;

        this.updateResultsInfo();

        const paginatedData = this.getPaginatedData(filteredReports);

        const searchTerm = window.reportListSearch ? window.reportListSearch.getCurrentSearchTerm() : '';
        window.reportListLoader.renderTable(paginatedData, searchTerm);

        this.renderPaginationControls();
    }

    getPaginatedData(data) {
        if (this.pageSize === 'all') {
            return data;
        }

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;

        return data.slice(startIndex, endIndex);
    }

    getTotalPages() {
        if (this.pageSize === 'all') {
            return 1;
        }
        return Math.ceil(this.totalRecords / this.pageSize);
    }

    updateResultsInfo() {

        this.resultsCount.textContent = `${this.totalRecords} record${this.totalRecords !== 1 ? 's' : ''} found`;
        this.totalRecordsSpan.textContent = this.totalRecords;

        if (this.totalRecords === 0) {
            this.showingStart.textContent = '0';
            this.showingEnd.textContent = '0';
        } else {
            if (this.pageSize === 'all') {
                this.showingStart.textContent = '1';
                this.showingEnd.textContent = this.totalRecords;
            } else {
                const startIndex = ((this.currentPage - 1) * this.pageSize) + 1;
                const endIndex = Math.min(this.currentPage * this.pageSize, this.totalRecords);
                this.showingStart.textContent = startIndex;
                this.showingEnd.textContent = endIndex;
            }
        }
    }

    renderPaginationControls() {
        const totalPages = this.getTotalPages();

        this.paginationContainer.innerHTML = '';

        if (totalPages <= 1) {
            return;
        }

        const prevButton = this.createPageButton('Previous', this.currentPage - 1, this.currentPage === 1);
        this.paginationContainer.appendChild(prevButton);

        const pageNumbers = this.getPageNumbers(totalPages);
        pageNumbers.forEach(pageNum => {
            if (pageNum === '...') {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'page-ellipsis';
                ellipsis.style.padding = '8px';
                this.paginationContainer.appendChild(ellipsis);
            } else {
                const pageButton = this.createPageButton(
                    pageNum.toString(),
                    pageNum,
                    false,
                    pageNum === this.currentPage
                );
                this.paginationContainer.appendChild(pageButton);
            }
        });

        const nextButton = this.createPageButton('Next', this.currentPage + 1, this.currentPage === totalPages);
        this.paginationContainer.appendChild(nextButton);
    }

    getPageNumbers(totalPages) {
        const pages = [];
        const maxVisiblePages = 7;

        if (totalPages <= maxVisiblePages) {

            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {

            pages.push(1);

            let startPage = Math.max(2, this.currentPage - 2);
            let endPage = Math.min(totalPages - 1, this.currentPage + 2);

            if (startPage > 2) {
                pages.push('...');
            }

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            if (endPage < totalPages - 1) {
                pages.push('...');
            }

            pages.push(totalPages);
        }

        return pages;
    }

    createPageButton(text, pageNum, disabled = false, active = false) {
        const button = document.createElement('button');
        button.className = 'page-btn';
        button.textContent = text;
        button.disabled = disabled;

        if (active) {
            button.classList.add('active');
        }

        if (!disabled) {
            button.addEventListener('click', () => {
                this.goToPage(pageNum);
            });
        }

        return button;
    }

    goToPage(pageNum) {
        const totalPages = this.getTotalPages();

        if (pageNum < 1 || pageNum > totalPages) {
            return;
        }

        this.currentPage = pageNum;
        this.updatePagination();

        document.querySelector('.table-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    reset() {
        this.currentPage = 1;
        this.updatePagination();
    }
}

window.reportListPagination = new ReportListPagination();