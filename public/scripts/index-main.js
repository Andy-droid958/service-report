if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

function initializeServiceReport() {
    window.scrollTo(0, 0);
    
    generateTimeOptions();
    
    const timeSelects = document.querySelectorAll('.time-select');
    timeSelects.forEach(select => {
        select.addEventListener('change', function() {
            const row = this.closest('tr');
            calculateRowTimes(row);
        });
    });
    
    const numericInputs = document.querySelectorAll('.mil-input, .toll-input, .hotel-input');
    numericInputs.forEach(input => {
        allowOnlyNumbers(input);
    });
    
    initializeFormSubmission();
    
    initializeDetailsContainer();
    
    initializeDeviceTable();
    
    setDefaultDate();
    
    initializePurposeOfVisit();
    
    initializeCreateNewButton();
    
    preventEnterSubmit();
}

function preventEnterSubmit() {
    const section1Fields = document.querySelectorAll('.section-1 input[type="text"], .section-1 input[type="date"]');
    section1Fields.forEach(field => {
        field.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const allFields = Array.from(document.querySelectorAll('input, select, textarea'));
                const currentIndex = allFields.indexOf(e.target);
                if (currentIndex >= 0 && currentIndex < allFields.length - 1) {
                    allFields[currentIndex + 1].focus();
                }
            }
        });
    });
    
    const othersText = document.getElementById('othersText');
    if (othersText) {
        othersText.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const allFields = Array.from(document.querySelectorAll('input, select, textarea'));
                const currentIndex = allFields.indexOf(e.target);
                if (currentIndex >= 0 && currentIndex < allFields.length - 1) {
                    allFields[currentIndex + 1].focus();
                }
            }
        });
    }
    
    const purposeRadios = document.querySelectorAll('input[name="purpose"]');
    purposeRadios.forEach(radio => {
        radio.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (!this.checked) {
                    this.checked = true;
                    const event = new Event('change', { bubbles: true });
                    this.dispatchEvent(event);
                }
            }
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeServiceReport);
} else {
    initializeServiceReport();
}

