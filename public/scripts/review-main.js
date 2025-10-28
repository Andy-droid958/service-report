async function initializeReviewReport() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    showLoadingState();
    
    try {
        const reportId = getReportIdFromUrl();
        if (!reportId) {
            hideLoadingState();
            showError('No report ID provided in URL');
            return;
        }
        const reportData = await loadReportData(reportId);
        if (!reportData) {
            hideLoadingState();
            showError('Report not found');
            return;
        }
        
        const detailsData = await loadDetailsData(reportId);
        const siteInformationData = await loadSiteInformationData(reportId);
        
        populateReportForm(reportData);
        populateSiteInformationTable(siteInformationData);
        populateDetailsTable(detailsData);
        
        makeFormReadOnly();
        
        initializeBackButton();
        
        initializeEditReportButton();
        
        initializePdfButton();
        
        hideLoadingState();
        
        window.scrollTo(0, 0);
        
        console.log('Review report loaded successfully');
        
    } catch (error) {
        console.error('Error initializing review report:', error);
        hideLoadingState();
        showError('Error loading report data. Please try again.');
    }
}

if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

window.addEventListener('beforeunload', function() {
    window.scrollTo(0, 0);
});

document.addEventListener('DOMContentLoaded', initializeReviewReport);

