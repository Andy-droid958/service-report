function initializeBackButton() {
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', function() {
            const confirmed = confirm('Are you sure you want to go back to home? Any unsaved changes will be lost.');
            if (confirmed) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                window.location.href = 'index.html';
            }
        });
    }
}

function initializePurposeOfVisit() {
    const othersRadio = document.getElementById('others');
    const othersTextContainer = document.getElementById('othersTextContainer');
    const othersTextInput = document.getElementById('othersText');
    const allPurposeRadios = document.querySelectorAll('input[name="purpose"]');
    
    if (othersRadio && othersTextContainer && othersTextInput) {
        allPurposeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.id === 'others') {
                    othersTextContainer.style.display = 'block';
                    othersTextInput.focus();
                } else {
                    othersTextContainer.style.display = 'none';
                    othersTextInput.value = ''; 
                }
            });
        });
    }
}

function initializeReviewButton() {
    const reviewButton = document.getElementById('reviewButton');
    if (reviewButton) {
        reviewButton.addEventListener('click', function() {
            const confirmed = confirm('Are you sure you want to go to review page? Any unsaved changes will be lost.');
            if (confirmed) {
                const reportId = getReportIdFromUrl();
                if (reportId) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    window.location.href = `review-report.html?reportId=${reportId}`;
                } else {
                    alert('Error: Report ID not found');
                }
            }
        });
    }
}

function initializeUpdateReportButton() {
    const updateButton = document.getElementById('updateReportButton');
    if (updateButton) {
        updateButton.addEventListener('click', function() {
            updateReport();
        });
    }
}

