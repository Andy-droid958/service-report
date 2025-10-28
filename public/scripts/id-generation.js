async function generateReportNumber() {
    try {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        const clientDate = `${day}${month}${year}`;
        
        const response = await fetch(`/api/report/next-id?date=${clientDate}`);
        const data = await response.json();
        
        const reportNoInput = document.getElementById('reportNo');
        if (reportNoInput && data.nextReportId) {
            reportNoInput.value = String(data.nextReportId);
            reportNoInput.placeholder = '';
        }
    } catch (error) {
        console.error('Error generating report number:', error);
        const reportNoInput = document.getElementById('reportNo');
        if (reportNoInput) {
            reportNoInput.placeholder = 'Error loading...';
        }
    }
}

function initializeReportAutoGeneration() {
    generateReportNumber();
}

function refreshReportNumber() {
    const reportNoInput = document.getElementById('reportNo');
    if (reportNoInput) {
        reportNoInput.value = '';
        reportNoInput.placeholder = 'Loading...';
        generateReportNumber();
    }
}

document.addEventListener('DOMContentLoaded', initializeReportAutoGeneration);
