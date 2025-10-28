function formatToTwoDecimals(input) {
    const value = parseFloat(input.value);
    if (!isNaN(value)) {
       input.value = value.toFixed(2);
    }
 }
 
 function allowOnlyNumbers(input) {
    input.addEventListener('input', function (e) {
       let value = e.target.value.replace(/[^0-9.]/g, '');
       e.target.value = value;
    });
 
    input.addEventListener('blur', function () {
       if (this.value && !isNaN(parseFloat(this.value))) {
          formatToTwoDecimals(this);
       }
    });
 }
 
 function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateField = document.getElementById('date');
    if (dateField) {
       dateField.value = today;
    }
 }
 
 function initializePurposeOfVisit() {
    const othersRadio = document.getElementById('others');
    const othersTextContainer = document.getElementById('othersTextContainer');
    const othersText = document.getElementById('othersText');
 
    if (othersRadio && othersTextContainer && othersText) {
 
       if (!othersRadio.checked) {
          othersTextContainer.style.display = 'none';
          othersText.disabled = true;
       }
 
       const allRadios = document.querySelectorAll('input[name="purpose"]');
       allRadios.forEach(radio => {
          radio.addEventListener('change', function () {
             if (this.id === 'others' && this.checked) {
                othersTextContainer.style.display = 'block';
                othersText.disabled = false;
                othersText.focus();
             } else {
                othersTextContainer.style.display = 'none';
                othersText.disabled = true;
                othersText.value = '';
             }
          });
       });
    }
 }
 
 function initializeCreateNewButton() {
    const createNewButton = document.getElementById('createNewButton');
    if (createNewButton) {
       createNewButton.addEventListener('click', function () {
          const confirmed = confirm('Are you sure you want to clear the form and create a new report?');
          if (confirmed) {
             clearReport();
          }
       });
    }
 }
 
function clearReport() {
    const form = document.getElementById('serviceReportForm');
    if (form) {
       form.reset();

       const detailsContainer = document.getElementById('detailsContainer');
       if (detailsContainer) {
          const allCards = detailsContainer.querySelectorAll('.details-card');
          allCards.forEach((card, index) => {
             if (index > 0) {
                card.remove();
             }
          });

          const firstCard = detailsContainer.querySelector('.details-card');
          if (firstCard) {
             const inputs = firstCard.querySelectorAll('input, select, textarea');
             inputs.forEach(input => {
                if (input.tagName === 'SELECT') {
                   input.value = '';
                } else {
                   input.value = '';
                }
             });

             const imagePreview = firstCard.querySelector('.image-preview-container');
             if (imagePreview) {
                imagePreview.innerHTML = '';
             }
          }
       }

       const deviceTableBody = document.getElementById('deviceTableBody');
       if (deviceTableBody) {
          const allRows = deviceTableBody.querySelectorAll('tr');
          allRows.forEach((row, index) => {
             if (index > 0) {
                row.remove();
             } else {
                const inputs = row.querySelectorAll('input');
                inputs.forEach(input => input.value = '');
             }
          });
       }

       setDefaultDate();

       const othersTextContainer = document.getElementById('othersTextContainer');
       if (othersTextContainer) {
          othersTextContainer.style.display = 'none';
       }

       const othersText = document.getElementById('othersText');
       if (othersText) {
          othersText.value = '';
          othersText.disabled = true;
       }

       if (typeof refreshReportNumber === 'function') {
          refreshReportNumber();
       } else if (typeof generateReportNumber === 'function') {
          generateReportNumber();
       }

       window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}