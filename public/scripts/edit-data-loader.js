function getReportIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('reportId');
}

async function loadReportData(reportId) {
    try {
        console.log('Loading report data for ID:', reportId);
        const response = await fetch(`/api/report/edit/${reportId}`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Report data loaded successfully:', result);
        return result;
    } catch (error) {
        console.error('Error loading report:', error);
        throw error;
    }
}

