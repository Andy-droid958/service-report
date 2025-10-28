let operationInProgress = false;
let currentAbortController = null;

window.addEventListener('beforeunload', function(e) {
    if (operationInProgress) {
        e.preventDefault();
        e.returnValue = 'A submission is in progress. Are you sure you want to leave?';
        return e.returnValue;
    }
});

function showLoadingState(message = 'Loading...') {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loadingOverlay';
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.9);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: Arial, sans-serif;
    `;
    
    const spinner = document.createElement('div');
    spinner.style.cssText = `
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
    `;
    
    const loadingText = document.createElement('div');
    loadingText.textContent = message;
    loadingText.style.cssText = `
        color: #333;
        font-size: 16px;
        font-weight: 500;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    if (!document.querySelector('style[data-loading-animation]')) {
        style.setAttribute('data-loading-animation', 'true');
        document.head.appendChild(style);
    }
    
    loadingOverlay.appendChild(spinner);
    loadingOverlay.appendChild(loadingText);
    document.body.appendChild(loadingOverlay);
}

function hideLoadingState() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

function collectDetailsData() {
    const detailsData = [];
    const incompleteCards = [];
    const detailsCards = document.querySelectorAll('.details-card');
 
    const requiredFields = ['date', 'outTime', 'startTime', 'endTime', 'inTime', 'travelTime', 'workTime', 'mil', 'toll', 'hotel', 'others', 'problemDetails', 'jobDescription'];
 
    detailsCards.forEach((card, cardIndex) => {
       const cardData = {};
       const tableRow = card.querySelector('.detailsTableBody tr');
 
       if (tableRow) {
          const inputs = tableRow.querySelectorAll('input, select');
          const headers = ['date', 'outTime', 'startTime', 'endTime', 'inTime', 'travelTime', 'workTime', 'overTime', 'mil', 'toll', 'hotel', 'others'];
 
          inputs.forEach((input, index) => {
             if (input.value && input.value !== '--') {
                cardData[headers[index]] = input.value;
             }
          });
       }
 
       const problemDetails = card.querySelector('.problem-details');
       const jobDescription = card.querySelector('.job-description');
       if (problemDetails) {
          cardData.problemDetails = problemDetails.value.trim();
       }
       if (jobDescription) {
          cardData.jobDescription = jobDescription.value.trim();
       }
 
      const fileInput = card.querySelector('.image-upload-input');
      const availableFiles = fileInput && fileInput.customFiles && fileInput.customFiles.length > 0 
         ? fileInput.customFiles 
         : (fileInput && fileInput.files ? Array.from(fileInput.files) : []);
      
      if (availableFiles.length > 0) {
         cardData.hasImage = true;
         cardData.imageFiles = availableFiles;
      }
 
       const hasAnyData = Object.keys(cardData).some(key => {
          const value = cardData[key];
          return value && value.toString().trim() !== '';
       });
 
       if (hasAnyData) {
          const hasAllRequiredFields = requiredFields.every(field =>
             cardData[field] && cardData[field].toString().trim() !== ''
          );
 
          if (hasAllRequiredFields) {
             detailsData.push(cardData);
          } else {
             incompleteCards.push(cardIndex + 1);
          }
       }
    });
 
    return {
       detailsData,
       incompleteCards
    };
 }
 
 function collectSiteInformationData() {
    const siteInformationData = [];
    const deviceRows = document.querySelectorAll('.device-table tbody tr');
 
    deviceRows.forEach((row, rowIndex) => {
       const rowData = {};
       const inputs = row.querySelectorAll('input');
       const headers = ['name', 'plcHmi', 'brand', 'modelNumber', 'remarks'];
 
       inputs.forEach((input, index) => {
          if (input.value && input.value.trim() !== '') {
             rowData[headers[index]] = input.value.trim();
          }
       });
 
       if (Object.keys(rowData).length > 0) {
          siteInformationData.push(rowData);
       }
    });
 
    return siteInformationData;
 }
 
 function prepareFormData(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
 
    const purposeRadio = document.querySelector('input[name="purpose"]:checked');
    if (purposeRadio) {
       data.purposeOfVisit = purposeRadio.value;
       if (purposeRadio.value === 'others') {
          const othersText = document.getElementById('othersText').value;
          if (othersText) {
             data.purposeOfVisitOthers = othersText;
          }
       }
    }
 
    const {
       detailsData,
       incompleteCards
    } = collectDetailsData();
 
    if (incompleteCards.length > 0) {
       throw new Error(`Please complete all required fields in the following Details cards: ${incompleteCards.join(', ')}\n\nAll cards with data must have all required fields filled.`);
    }
 
    if (detailsData.length === 0) {
       throw new Error('Please fill in at least one complete Details card.');
    }
 
    data.details = detailsData;
 
    data.siteInformation = collectSiteInformationData();
 
    return data;
 }
 
 async function submitReportData(data) {
    const formData = new FormData();
 
    if (data.reportNo) {
       formData.append('reportId', data.reportNo);
    }
    if (data.customer) {
       formData.append('customerName', data.customer);
    }
 
    for (const key in data) {
       if (key === 'details' || key === 'siteInformation') {
          formData.append(key, JSON.stringify(data[key]));
       } else if (key !== 'reportNo' && key !== 'customer') {
 
          formData.append(key, data[key]);
       }
    }
 
    currentAbortController = new AbortController();
    operationInProgress = true;
 
    const detailsCards = document.querySelectorAll('.details-card');
    const cardIndexToDetailIndex = new Map();
    const requiredFields = ['date', 'outTime', 'startTime', 'endTime', 'inTime', 'travelTime', 'workTime', 'mil', 'toll', 'hotel', 'others', 'problemDetails', 'jobDescription'];
 
    if (data.details && Array.isArray(data.details)) {
       let detailDataIndex = 0;
       detailsCards.forEach((card, cardIndex) => {
          const cardData = {};
          const tableRow = card.querySelector('.detailsTableBody tr');
 
          if (tableRow) {
             const inputs = tableRow.querySelectorAll('input, select');
             const headers = ['date', 'outTime', 'startTime', 'endTime', 'inTime', 'travelTime', 'workTime', 'overTime', 'mil', 'toll', 'hotel', 'others'];
 
             inputs.forEach((input, index) => {
                if (input.value && input.value !== '--') {
                   cardData[headers[index]] = input.value;
                }
             });
          }
 
          const problemDetails = card.querySelector('.problem-details');
          const jobDescription = card.querySelector('.job-description');
          if (problemDetails) {
             cardData.problemDetails = problemDetails.value.trim();
          }
          if (jobDescription) {
             cardData.jobDescription = jobDescription.value.trim();
          }
 
          const hasAnyData = Object.keys(cardData).some(key => {
             const value = cardData[key];
             return value && value.toString().trim() !== '';
          });
 
          if (hasAnyData) {
 
             const hasAllRequiredFields = requiredFields.every(field =>
                cardData[field] && cardData[field].toString().trim() !== ''
             );
 
             if (hasAllRequiredFields && detailDataIndex < data.details.length) {
                cardIndexToDetailIndex.set(cardIndex, detailDataIndex);
                console.log(`Card ${cardIndex} has complete data -> mapped to Detail ${detailDataIndex}`);
                detailDataIndex++;
             } else {
                console.log(`Card ${cardIndex} has incomplete data -> not mapped`);
             }
          } else {
             console.log(`Card ${cardIndex} has no data -> not mapped`);
          }
       });
    }
 
    console.log('Final card index to detail index mapping:', Array.from(cardIndexToDetailIndex.entries()));
 
    let fileIndex = 0;
    const filesByDetail = [];
 
    detailsCards.forEach((card, cardIndex) => {
 
       if (!cardIndexToDetailIndex.has(cardIndex)) {
          console.log(`Card ${cardIndex}: Skipped (no detail data)`);
          return;
       }
 
       const detailIndex = cardIndexToDetailIndex.get(cardIndex);
 
      const fileDetailCards = card.querySelectorAll('.file-detail-card');
      const fileInput = card.querySelector('.image-upload-input');
      const availableFiles = fileInput && fileInput.customFiles && fileInput.customFiles.length > 0 
         ? fileInput.customFiles 
         : (fileInput && fileInput.files ? Array.from(fileInput.files) : []);

      console.log(`Card ${cardIndex} -> Detail ${detailIndex}:`, {
         hasFileInput: !!fileInput,
         filesInInput: availableFiles.length,
         fileDetailCardsCount: fileDetailCards.length,
         usingCustomFiles: !!(fileInput && fileInput.customFiles && fileInput.customFiles.length > 0)
      });

      if (availableFiles.length > 0) {
         console.log(`  Files available:`, availableFiles.map(f => f.name));

         if (fileDetailCards.length > 0) {

            const keepFileNames = Array.from(fileDetailCards).map(fdc =>
               fdc.getAttribute('data-file-name')
            );

            console.log(`  File detail card names:`, keepFileNames);

            const cardFiles = availableFiles.filter(file =>
               keepFileNames.includes(file.name)
            );

            console.log(`  Files after filtering:`, cardFiles.map(f => f.name));
 
             if (cardFiles.length > 0) {
                filesByDetail.push({
                   detailIndex: detailIndex,
                   fileCount: cardFiles.length
                });
 
                cardFiles.forEach((file) => {
                   formData.append('images', file);
                   formData.append(`detailIndex_${fileIndex}`, detailIndex);
                   fileIndex++;
                });
 
                console.log(`Submitting ${cardFiles.length} files`);
             } else {
                console.log(`No files to submit (filtered out)`);
             }
          } else {
             console.log(`No file detail cards found`);
          }
       } else {
          console.log(`No files in input or input not found`);
       }
    });
 
    if (filesByDetail.length > 0) {
       formData.append('filesByDetail', JSON.stringify(filesByDetail));
       console.log(`Submitting ${fileIndex} files with detail associations:`, filesByDetail);
    } else {
       console.log('No files to submit');
    }
 
    try {
       const response = await fetch('/api/report/create', {
          method: 'POST',
          body: formData,
          signal: currentAbortController.signal
       });

      const result = await response.json();

      if (response.ok && result.success) {
         operationInProgress = false;
         currentAbortController = null;
         return result;
      } else {
         operationInProgress = false;
         currentAbortController = null;
         throw new Error(result.error || 'Failed to submit report');
      }
   } catch (error) {
      console.error('Error submitting report:', error);
      operationInProgress = false;
      currentAbortController = null;

      if (error.name === 'AbortError') {
         throw new Error('Submission was cancelled');
      }
      throw error;
   }
}
 
 function initializeFormSubmission() {
    const form = document.getElementById('serviceReportForm');
    if (!form) return;
 
    form.addEventListener('submit', async function (e) {
       e.preventDefault();
 
       const confirmed = confirm('Are you sure you want to submit this service report?');
       if (!confirmed) {
          return;
       }
 
       showLoadingState('Submitting report...');
 
       try {
          const data = prepareFormData(this);
          const result = await submitReportData(data);
          hideLoadingState();
          await new Promise(resolve => setTimeout(resolve, 100));
          alert('Report submitted successfully!');
          
          if (typeof clearReport === 'function') {
             clearReport();
          }
          
          window.scrollTo({
             top: 0,
             behavior: 'smooth'
          });
       } catch (error) {
          hideLoadingState();
          await new Promise(resolve => setTimeout(resolve, 100));
          
          if (error.message) {
             alert(error.message);
          }
       }
    });
 }