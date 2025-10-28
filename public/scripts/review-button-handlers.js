let operationInProgress = false;
let currentAbortController = null;

window.addEventListener('beforeunload', function(e) {
    if (operationInProgress) {
        e.preventDefault();
        e.returnValue = 'PDF generation is in progress. Are you sure you want to leave?';
        return e.returnValue;
    }
});

function initializeBackButton() {
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
}

function initializeEditReportButton() {
    const editButton = document.getElementById('editReportButton');
    if (editButton) {
        editButton.addEventListener('click', function() {
            const reportId = getReportIdFromUrl();
            if (reportId) {
                window.location.href = `edit-report.html?reportId=${reportId}`;
            } else {
                alert('Error: Report ID not found');
            }
        });
    }
}

function initializePdfButton() {
    const pdfButton = document.getElementById('generatePdfButton');
    if (pdfButton) {
        pdfButton.addEventListener('click', async function() {
            const reportId = getReportIdFromUrl();
            if (reportId) {
                await generatePDF(reportId);
            } else {
                alert('Error: Report ID not found');
            }
        });
    }
}

async function generatePDF(reportId) {
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

