function getReportIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('reportId');
}

async function loadReportData(reportId) {
    try {
        const response = await fetch(`/api/report/getById/${reportId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return result.report;
    } catch (error) {
        console.error('Error loading report:', error);
        throw error;
    }
}

async function loadDetailsData(reportId) {
    try {
        console.log('Loading details for report ID:', reportId);
        const response = await fetch(`/api/report/getDetails/${reportId}`);
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log('Details API response:', result);
        return result.details || [];
    } catch (error) {
        console.error('Error loading details:', error);
        return [];
    }
}

async function loadSiteInformationData(reportId) {
    try {
        console.log('Loading site information for report ID:', reportId);
        const response = await fetch(`/api/report/edit/${reportId}`);
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log('Site information API response:', result);
        return result.siteInformation || [];
    } catch (error) {
        console.error('Error loading site information:', error);
        return [];
    }
}

