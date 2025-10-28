let operationInProgress = false;
let currentAbortController = null;

window.addEventListener('beforeunload', function(e) {
    if (operationInProgress) {
        e.preventDefault();
        e.returnValue = 'An update is in progress. Are you sure you want to leave?';
        return e.returnValue;
    }
});

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

function populateReportForm(reportData) {
   if (reportData.Customer_Name) {
      document.getElementById('customer').value = reportData.Customer_Name;
      if (typeof updateInitialCustomerValue === 'function') {
         updateInitialCustomerValue(reportData.Customer_Name);
      }
   }
   if (reportData.Attn) {
      document.getElementById('attn').value = reportData.Attn;
   }
   if (reportData.Project_Name) {
      document.getElementById('projectName').value = reportData.Project_Name;
   }
   if (reportData.Your_Ref) {
      document.getElementById('yourRef').value = reportData.Your_Ref;
   }
   if (reportData.Report_ID) {
      document.getElementById('reportNo').value = reportData.Report_ID;
   }
   if (reportData.Date) {
      const date = new Date(reportData.Date);
      if (!isNaN(date.getTime())) {
         document.getElementById('date').value = date.toISOString().split('T')[0];
      }
   }
   if (reportData.Service_By) {
      document.getElementById('serviceBy').value = reportData.Service_By;
   }
   if (reportData.Purpose_Of_Visit) {
      const predefinedPurposes = ['machine-delivery', 'commissioning', 'maintenance', 'calibration', 'repair', 'troubleshooting', 'engineering'];
      const purposeRadio = document.querySelector(`input[name="purpose"][value="${reportData.Purpose_Of_Visit}"]`);

      if (purposeRadio) {
         purposeRadio.checked = true;
      } else if (!predefinedPurposes.includes(reportData.Purpose_Of_Visit)) {
         const othersRadio = document.querySelector('input[name="purpose"][value="others"]');
         if (othersRadio) {
            othersRadio.checked = true;
            document.getElementById('othersText').value = reportData.Purpose_Of_Visit;
            document.getElementById('othersTextContainer').style.display = 'block';
         }
      }
   }
}

function populateSiteInformationTable(siteInformationData) {
   console.log('Site information data received:', siteInformationData);
   const deviceTableBody = document.getElementById('deviceTableBody');

   if (!deviceTableBody) {
      console.error('Device table body not found');
      return;
   }

   const existingRows = deviceTableBody.querySelectorAll('tr');
   for (let i = 1; i < existingRows.length; i++) {
      existingRows[i].remove();
   }

   if (siteInformationData && siteInformationData.length > 0) {
      console.log('Populating site information table with', siteInformationData.length, 'entries');

      const firstRow = deviceTableBody.querySelector('tr');
      if (firstRow && siteInformationData[0]) {
         populateSiteInformationRow(firstRow, siteInformationData[0]);
      }

      for (let i = 1; i < siteInformationData.length; i++) {
         const newRow = createSiteInformationRow();
         populateSiteInformationRow(newRow, siteInformationData[i]);
         deviceTableBody.appendChild(newRow);
      }
   } else {
      console.log('No site information data to populate');
   }
}

function createSiteInformationRow() {
   const row = document.createElement('tr');
   row.innerHTML = `
        <td><input type="text" class="table-input device-input" placeholder="Enter name"></td>
        <td><input type="text" class="table-input device-input" placeholder="Enter PLC/HMI"></td>
        <td><input type="text" class="table-input device-input" placeholder="Enter brand"></td>
        <td><input type="text" class="table-input device-input" placeholder="Enter model number"></td>
        <td><input type="text" class="table-input device-input" placeholder="Enter remarks"></td>
    `;
   return row;
}

function populateSiteInformationRow(row, siteInfoData) {
   console.log('Populating site information row with data:', siteInfoData);

   const inputs = row.querySelectorAll('.device-input');
   if (inputs.length >= 5) {
      inputs[0].value = siteInfoData.Name || '';
      inputs[1].value = siteInfoData.PLC_HMI || '';
      inputs[2].value = siteInfoData.Brand || '';
      inputs[3].value = siteInfoData.Model_Number || '';
      inputs[4].value = siteInfoData.Remarks || '';
   }
}

function populateDetailsTable(detailsData) {
   console.log('Details data received:', detailsData);
   const detailsContainer = document.getElementById('detailsContainer');

   if (!detailsContainer) {
      console.error('Details container not found');
      return;
   }

   const existingCards = detailsContainer.querySelectorAll('.details-card');
   for (let i = 1; i < existingCards.length; i++) {
      existingCards[i].remove();
   }

   if (detailsData && detailsData.length > 0) {
      console.log('Populating details table with', detailsData.length, 'cards');
      const firstCard = detailsContainer.querySelector('.details-card');
      populateDetailsCard(firstCard, detailsData[0]);

      for (let i = 1; i < detailsData.length; i++) {
         const newCard = firstCard.cloneNode(true);
         newCard.setAttribute('data-details-index', i + 1);
         populateDetailsCard(newCard, detailsData[i]);
         detailsContainer.appendChild(newCard);
      }
   } else {
      console.log('No details data to populate');
   }
}

function populateDetailsCard(card, detailData) {
   console.log('Populating card with data:', detailData);

   if (detailData.Detail_ID) {
      card.setAttribute('data-detail-id', detailData.Detail_ID);
      console.log('Stored detail ID:', detailData.Detail_ID);
      console.log('Card after setting attribute:', card);
      console.log('Attribute value after setting:', card.getAttribute('data-detail-id'));
   } else {
      console.log('No Detail_ID found in detailData:', detailData);
   }

   const row = card.querySelector('tbody tr');
   if (!row) {
      console.error('No table row found in details card');
      return;
   }

   populateDetailsRow(row, detailData);
}

function createDetailsRow() {
   const row = document.createElement('tr');
   row.innerHTML = `
        <td><input type="date" class="table-input date-input"></td>
        <td><select class="table-input time-select" data-type="out-time"><option value="">--</option></select></td>
        <td><select class="table-input time-select" data-type="start-time"><option value="">--</option></select></td>
        <td><select class="table-input time-select" data-type="end-time"><option value="">--</option></select></td>
        <td><select class="table-input time-select" data-type="in-time"><option value="">--</option></select></td>
        <td><input type="text" class="table-input travel-time" readonly placeholder="Auto"></td>
        <td><input type="text" class="table-input work-time" readonly placeholder="Auto"></td>
        <td><input type="text" class="table-input overtime" readonly placeholder="Auto"></td>
        <td><input type="text" class="table-input mil-input" placeholder="km"></td>
        <td><input type="text" class="table-input toll-input" placeholder="RM"></td>
        <td><input type="text" class="table-input hotel-input" placeholder="RM"></td>
        <td><input type="text" class="table-input others-input"></td>
    `;

   initializeTimeOptions(row);

   const numericInputs = row.querySelectorAll('.mil-input, .toll-input, .hotel-input');
   numericInputs.forEach(input => {
      allowOnlyNumbers(input);
   });

   return row;
}

function populateDetailsRow(row, detailData) {
   console.log('Populating row with data:', detailData);
   console.log('Row element:', row);
   console.log('Database calculated fields:', {
      Travel_Time_hr: detailData.Travel_Time_hr,
      Work_Time_hr: detailData.Work_Time_hr,
      Over_Time_hr: detailData.Over_Time_hr
   });

   generateTimeOptionsForRow(row);

   setTimeout(() => {
      const dateInput = row.querySelector('.date-input');
      const outTimeSelect = row.querySelector('[data-type="out-time"]');
      const startTimeSelect = row.querySelector('[data-type="start-time"]');
      const endTimeSelect = row.querySelector('[data-type="end-time"]');
      const inTimeSelect = row.querySelector('[data-type="in-time"]');
      const milInput = row.querySelector('.mil-input');
      const tollInput = row.querySelector('.toll-input');
      const hotelInput = row.querySelector('.hotel-input');
      const othersInput = row.querySelector('.others-input');

      console.log('Found elements:');
      console.log('dateInput:', dateInput);
      console.log('outTimeSelect:', outTimeSelect);
      console.log('startTimeSelect:', startTimeSelect);
      console.log('endTimeSelect:', endTimeSelect);
      console.log('inTimeSelect:', inTimeSelect);
      console.log('milInput:', milInput);
      console.log('tollInput:', tollInput);
      console.log('hotelInput:', hotelInput);
      console.log('othersInput:', othersInput);

      if (detailData.Date && dateInput) {
         const date = new Date(detailData.Date);
         if (!isNaN(date.getTime())) {
            dateInput.value = date.toISOString().split('T')[0];
         }
      }

      if (detailData.Out_Time && outTimeSelect) {
         const outTime = formatTimeForSelect(detailData.Out_Time);
         outTimeSelect.value = outTime;
         console.log('Set Out_Time to:', outTime);
      }
      if (detailData.Start_Time && startTimeSelect) {
         const startTime = formatTimeForSelect(detailData.Start_Time);
         startTimeSelect.value = startTime;
         console.log('Set Start_Time to:', startTime);
      }
      if (detailData.End_Time && endTimeSelect) {
         const endTime = formatTimeForSelect(detailData.End_Time);
         endTimeSelect.value = endTime;
         console.log('Set End_Time to:', endTime);
      }
      if (detailData.In_Time && inTimeSelect) {
         const inTime = formatTimeForSelect(detailData.In_Time);
         inTimeSelect.value = inTime;
         console.log('Set In_Time to:', inTime);
      }

      const travelTimeInput = row.querySelector('.travel-time');
      const workTimeInput = row.querySelector('.work-time');
      const overtimeInput = row.querySelector('.overtime');

      if (detailData.Travel_Time_hr !== null && detailData.Travel_Time_hr !== undefined && travelTimeInput) {
         travelTimeInput.value = parseFloat(detailData.Travel_Time_hr).toFixed(2) + ' hrs';
         console.log('Set travel time from database:', travelTimeInput.value);
      } else if (travelTimeInput) {
         travelTimeInput.value = '';
      }

      if (detailData.Work_Time_hr !== null && detailData.Work_Time_hr !== undefined && workTimeInput) {
         workTimeInput.value = parseFloat(detailData.Work_Time_hr).toFixed(2) + ' hrs';
         console.log('Set work time from database:', workTimeInput.value);
      } else if (workTimeInput) {
         workTimeInput.value = '';
      }

      if (detailData.Over_Time_hr !== null && detailData.Over_Time_hr !== undefined && overtimeInput) {
         overtimeInput.value = parseFloat(detailData.Over_Time_hr).toFixed(2) + ' hrs';
         console.log('Set overtime from database:', overtimeInput.value);
      } else if (overtimeInput) {
         overtimeInput.value = '';
      }

      console.log('Populated calculated fields from database');
      console.log('Attempting to populate other fields:');
      console.log('Mileage:', detailData.Mileage, 'milInput:', milInput);
      console.log('Toll_Amount:', detailData.Toll_Amount, 'tollInput:', tollInput);
      console.log('Hotel_Amount:', detailData.Hotel_Amount, 'hotelInput:', hotelInput);
      console.log('Others:', detailData.Others, 'othersInput:', othersInput);

      if (detailData.Mileage !== null && detailData.Mileage !== undefined && milInput) {
         milInput.value = parseFloat(detailData.Mileage).toFixed(2);
         console.log('Set mileage to:', milInput.value);
      }
      if (detailData.Toll_Amount !== null && detailData.Toll_Amount !== undefined && tollInput) {
         tollInput.value = parseFloat(detailData.Toll_Amount).toFixed(2);
         console.log('Set toll to:', tollInput.value);
      }
      if (detailData.Hotel_Amount !== null && detailData.Hotel_Amount !== undefined && hotelInput) {
         hotelInput.value = parseFloat(detailData.Hotel_Amount).toFixed(2);
         console.log('Set hotel to:', hotelInput.value);
      }
      if (detailData.Others !== null && detailData.Others !== undefined && othersInput) {
         othersInput.value = detailData.Others;
         console.log('Set others to:', othersInput.value);
      }

      calculateRowTimes(row);

      const detailsCard = row.closest('.details-card');
      if (detailsCard) {
         const problemDetailsTextarea = detailsCard.querySelector('.problem-details');
         const jobDescriptionTextarea = detailsCard.querySelector('.job-description');

         if (problemDetailsTextarea && detailData.Problem_Details) {
            problemDetailsTextarea.value = detailData.Problem_Details;
            console.log('Set problem details:', detailData.Problem_Details);
         }

         if (jobDescriptionTextarea && detailData.Job_Description) {
            jobDescriptionTextarea.value = detailData.Job_Description;
            console.log('Set job description:', detailData.Job_Description);
         }

         console.log('Checking for file data:', {
            fileName: detailData.File_Name,
            fileSize: detailData.File_Size,
            fileType: detailData.File_Type,
            fileExtension: detailData.File_Extension,
            hasImage: !!detailData.Image,
            detailImageId: detailData.Image_ID
         });

         if (detailData.Image_ID && detailData.File_Name) {
            console.log('Single image found with ID:', detailData.Image_ID, 'File:', detailData.File_Name);
            populateImagePreview(detailsCard, detailData.Image_ID, detailData.File_Name);
         }

         if (detailData.images && Array.isArray(detailData.images)) {
            if (detailData.images.length > 0) {
               console.log('Multiple images found:', detailData.images.length, 'images');
               populateMultipleImagePreview(detailsCard, detailData.images);
            } else {
               console.log('Detail has no images (empty images array)');
               const imagePreviewContainer = detailsCard.querySelector('.image-preview-container');
               if (imagePreviewContainer) {
                  imagePreviewContainer.innerHTML = '<div style="color: #666; font-style: italic; padding: 10px;">No images uploaded for this detail</div>';
               }
            }
         }

         if (detailData.File_Name || detailData.File_Size || detailData.File_Type || detailData.File_Extension) {
            console.log('Populating file details card with click-to-preview');
            populateFileDetailsCardWithPreview(detailsCard, detailData);
         }

         if (detailData.images && Array.isArray(detailData.images) && detailData.images.length > 0) {
            populateMultipleFileDetailsCard(detailsCard, detailData.images);
         }
      }
   }, 100);
}

function populateImagePreview(detailsCard, imageId, filename = 'Image') {
  const imagePreviewContainer = detailsCard.querySelector('.image-preview-container');
  if (!imagePreviewContainer) {
     console.error('Image preview container not found');
     return;
  }

  try {
     const imageElement = document.createElement('img');

     imageElement.src = `/api/reports/image/${imageId}`;
     imageElement.setAttribute('data-file-name', filename);
     imageElement.style.cssText = `
        max-width: 100px;
        max-height: 100px;
        object-fit: cover;
        border: 1px solid #ddd;
        border-radius: 4px;
        margin: 5px;
        cursor: pointer;
     `;

     imageElement.onerror = function () {
        console.error('Failed to load image:', filename || imageId, 'Image_ID:', imageId);

        this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f8d7da" width="100" height="100"/%3E%3Ctext x="50" y="45" font-size="12" text-anchor="middle" fill="%23721c24"%3EImage%3C/text%3E%3Ctext x="50" y="60" font-size="12" text-anchor="middle" fill="%23721c24"%3ENot Found%3C/text%3E%3C/svg%3E';
        this.style.border = '2px solid #f5c6cb';
        this.title = `Image not found: ${filename || 'Unknown'} (ID: ${imageId})`;
        this.style.cursor = 'not-allowed';
     };

     imageElement.onload = function () {
        console.log('Image loaded successfully:', filename);
     };

     imageElement.addEventListener('click', () => {
        console.log('Clicking image:', filename);
        showImageModalByUrl(`/api/reports/image/${imageId}`, filename);
     });

     let imagesWrapper = imagePreviewContainer.querySelector('.images-wrapper');
     if (!imagesWrapper) {
        imagesWrapper = document.createElement('div');
        imagesWrapper.className = 'images-wrapper';
        imagesWrapper.style.cssText = `
           display: flex;
           flex-wrap: wrap;
           gap: 5px;
           max-width: 100%;
        `;
        imagePreviewContainer.innerHTML = '';
        imagePreviewContainer.appendChild(imagesWrapper);
     }

     imagesWrapper.appendChild(imageElement);
     console.log('Image preview populated successfully');
  } catch (error) {
     console.error('Error populating image preview:', error);
  }
}

function populateMultipleImagePreview(detailsCard, imagesArray) {
  const imagePreviewContainer = detailsCard.querySelector('.image-preview-container');
  if (!imagePreviewContainer) {
     console.error('Image preview container not found');
     return;
  }

  console.log('Populating multiple images:', imagesArray.length);

  imagePreviewContainer.innerHTML = '';

  const imagesWrapper = document.createElement('div');
  imagesWrapper.className = 'images-wrapper';
  imagesWrapper.style.cssText = `
     display: flex;
     flex-wrap: wrap;
     gap: 5px;
     max-width: 100%;
  `;

  imagesArray.forEach((imageData, index) => {
     try {
        if (!imageData.Image_ID) {
           console.error(`Image ${index + 1} has no Image_ID`);
           return;
        }

        const imageElement = document.createElement('img');

        imageElement.src = `/api/reports/image/${imageData.Image_ID}`;
        imageElement.setAttribute('data-file-name', imageData.File_Name || `Image ${index + 1}`);
        imageElement.style.cssText = `
           max-width: 100px;
           max-height: 100px;
           object-fit: cover;
           border: 1px solid #ddd;
           border-radius: 4px;
           margin: 2px;
           cursor: pointer;
        `;

        imageElement.onerror = function () {
           console.error(`Failed to load image ${index + 1}:`, imageData.File_Name || `Image ${index + 1}`, 'Image_ID:', imageData.Image_ID);

           this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f8d7da" width="100" height="100"/%3E%3Ctext x="50" y="45" font-size="12" text-anchor="middle" fill="%23721c24"%3EImage%3C/text%3E%3Ctext x="50" y="60" font-size="12" text-anchor="middle" fill="%23721c24"%3ENot Found%3C/text%3E%3C/svg%3E';
           this.style.border = '2px solid #f5c6cb';
           this.title = `Image not found: ${imageData.File_Name || 'Unknown'} (ID: ${imageData.Image_ID})`;
           this.style.cursor = 'not-allowed';
        };

        imageElement.onload = function () {
           console.log(`Successfully loaded image ${index + 1}:`, imageData.File_Name || `Image ${index + 1}`);
        };

        imageElement.addEventListener('click', () => {
           console.log(`Clicking image ${index + 1}:`, imageData.File_Name || `Image ${index + 1}`);
           showImageModalByUrl(`/api/reports/image/${imageData.Image_ID}`, imageData.File_Name || `Image ${index + 1}`);
        });

        imageElement.title = imageData.File_Name || `Image ${index + 1}`;

        imagesWrapper.appendChild(imageElement);
        console.log(`Image ${index + 1} added successfully`);

     } catch (error) {
        console.error(`Error processing image ${index + 1}:`, error);
     }
  });

  imagePreviewContainer.appendChild(imagesWrapper);
  console.log('Multiple images populated successfully');
}

function populateMultipleFileDetailsCard(detailsCard, imagesArray) {
   console.log('Populating multiple file details cards:', imagesArray.length);
   console.log('Images array data:', imagesArray);
   imagesArray.forEach((imageData, index) => {
      console.log(`Image ${index} data:`, imageData);
      console.log(`Image ${index} Image_ID:`, imageData.Image_ID);
   });

   let fileDetailsContainer = detailsCard.querySelector('.file-details-container');
   if (!fileDetailsContainer) {
      fileDetailsContainer = document.createElement('div');
      fileDetailsContainer.className = 'file-details-container';
      fileDetailsContainer.style.cssText = `
            margin-top: 10px;
            max-width: 100%;
        `;

      const imagePreviewContainer = detailsCard.querySelector('.image-preview-container');
      if (imagePreviewContainer && imagePreviewContainer.parentNode) {
         imagePreviewContainer.parentNode.insertBefore(fileDetailsContainer, imagePreviewContainer.nextSibling);
      }
   }

  imagesArray.forEach((imageData, index) => {
     const fileDetailCard = document.createElement('div');
     fileDetailCard.className = 'file-detail-card';
     fileDetailCard.setAttribute('data-file-name', imageData.File_Name);
     fileDetailCard.style.cssText = `
           display: flex;
           justify-content: space-between;
           align-items: center;
           padding: 8px 12px;
           margin: 5px 0;
           background-color: #f8f9fa;
           border: 1px solid #dee2e6;
           border-radius: 4px;
           font-size: 14px;
       `;

     const fileInfo = document.createElement('div');
     fileInfo.className = 'file-detail-info';
     fileInfo.style.cssText = 'flex: 1;';

     const fileName = document.createElement('div');
     fileName.className = 'file-detail-name';
     fileName.textContent = imageData.File_Name || `Image ${index + 1}`;
     fileName.style.cssText = 'font-weight: 500; color: #333; margin-bottom: 2px;';

      const fileSize = document.createElement('div');
      fileSize.className = 'file-detail-size';
      fileSize.textContent = formatFileSize(imageData.File_Size || 0);
      fileSize.style.cssText = 'color: #666; font-size: 12px;';

      fileInfo.appendChild(fileName);
      fileInfo.appendChild(fileSize);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'file-detail-remove';
      removeBtn.innerHTML = '×';
      removeBtn.type = 'button';

      fileDetailCard.appendChild(fileInfo);
      fileDetailCard.appendChild(removeBtn);

     removeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        console.log('Removing file detail card for:', imageData.File_Name);

        if (imageData.Image_ID) {
           if (!window.deletedFiles) {
              window.deletedFiles = [];
           }
           window.deletedFiles.push({
              detailImageId: imageData.Image_ID,
              fileName: imageData.File_Name
           });
           console.log('Added to deleted files list:', imageData.Image_ID);
        }

        const imagesWrapper = detailsCard.querySelector('.images-wrapper');
        console.log('Found images wrapper:', imagesWrapper);
        if (imagesWrapper) {
           const correspondingImage = imagesWrapper.querySelector(`img[data-file-name="${imageData.File_Name}"]`);
           console.log('Found corresponding image:', correspondingImage);
           if (correspondingImage) {
              correspondingImage.remove();
              console.log('Image removed successfully');
           } else {
              console.log('No corresponding image found for:', imageData.File_Name);
           }
           if (imagesWrapper.children.length === 0) {
              imagesWrapper.remove();
              console.log('Images wrapper removed');
           }
        } else {
           console.log('No images wrapper found');
        }

        fileDetailCard.remove();
        console.log(`File detail card for "${imageData.File_Name}" removed. File will be excluded from submission.`);
     });

      fileDetailsContainer.appendChild(fileDetailCard);
   });

   console.log('Multiple file details cards populated successfully');
}

function populateFileDetailsCard(detailsCard, detailData) {
   let fileDetailsContainer = detailsCard.querySelector('.file-details-container');
   if (!fileDetailsContainer) {
      fileDetailsContainer = document.createElement('div');
      fileDetailsContainer.className = 'file-details-container';
      fileDetailsContainer.style.cssText = `
            margin-top: 10px;
            max-width: 100%;
        `;

      const imagePreviewContainer = detailsCard.querySelector('.image-preview-container');
      if (imagePreviewContainer && imagePreviewContainer.parentNode) {
         imagePreviewContainer.parentNode.insertBefore(fileDetailsContainer, imagePreviewContainer.nextSibling);
      }
   }

  const fileDetailCard = document.createElement('div');
  fileDetailCard.className = 'file-detail-card';
  fileDetailCard.setAttribute('data-file-name', detailData.File_Name);

  const fileInfo = document.createElement('div');
  fileInfo.className = 'file-detail-info';

  const fileName = document.createElement('div');
  fileName.className = 'file-detail-name';
  fileName.textContent = detailData.File_Name || 'Unknown file';

  const fileSize = document.createElement('div');
  fileSize.className = 'file-detail-size';
  fileSize.textContent = detailData.File_Size ? formatFileSize(detailData.File_Size) : 'Unknown size';

  fileInfo.appendChild(fileName);
  fileInfo.appendChild(fileSize);
  fileDetailCard.appendChild(fileInfo);

  const removeBtn = document.createElement('button');
  removeBtn.className = 'file-detail-remove';
  removeBtn.innerHTML = '×';
  removeBtn.type = 'button';
  removeBtn.addEventListener('click', function () {
     if (detailData.Image_ID) {
        if (!window.deletedFiles) {
           window.deletedFiles = [];
        }
        window.deletedFiles.push({
           detailImageId: detailData.Image_ID,
           fileName: detailData.File_Name
        });
        console.log('Added to deleted files list:', detailData.Image_ID);
     }
     fileDetailCard.remove();
  });
   fileDetailCard.appendChild(removeBtn);
   fileDetailsContainer.appendChild(fileDetailCard);

   console.log('File details card populated successfully');
}

function populateFileDetailsCardWithPreview(detailsCard, detailData) {
   console.log('populateFileDetailsCardWithPreview called with detailData:', detailData);
   console.log('Image_ID in detailData:', detailData.Image_ID);

   let fileDetailsContainer = detailsCard.querySelector('.file-details-container');
   if (!fileDetailsContainer) {
      fileDetailsContainer = document.createElement('div');
      fileDetailsContainer.className = 'file-details-container';
      fileDetailsContainer.style.cssText = `
            margin-top: 10px;
            max-width: 100%;
        `;

      const imagePreviewContainer = detailsCard.querySelector('.image-preview-container');
      if (imagePreviewContainer && imagePreviewContainer.parentNode) {
         imagePreviewContainer.parentNode.insertBefore(fileDetailsContainer, imagePreviewContainer.nextSibling);
      }
   }

  const fileDetailCard = document.createElement('div');
  fileDetailCard.className = 'file-detail-card';
  fileDetailCard.setAttribute('data-file-name', detailData.File_Name);
  fileDetailCard.style.cursor = 'pointer';

  const fileInfo = document.createElement('div');
  fileInfo.className = 'file-detail-info';

  const fileName = document.createElement('div');
  fileName.className = 'file-detail-name';
  fileName.textContent = detailData.File_Name || 'Unknown file';

   const fileSize = document.createElement('div');
   fileSize.className = 'file-detail-size';
   fileSize.textContent = detailData.File_Size ? formatFileSize(detailData.File_Size) : 'Unknown size';

   fileInfo.appendChild(fileName);
   fileInfo.appendChild(fileSize);
   fileDetailCard.appendChild(fileInfo);

   const removeBtn = document.createElement('button');
   removeBtn.className = 'file-detail-remove';
   removeBtn.innerHTML = '×';
   removeBtn.type = 'button';
   removeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      console.log('Removing single image file detail card for:', detailData.File_Name);

      if (detailData.Image_ID) {
         if (!window.deletedFiles) {
            window.deletedFiles = [];
         }
         window.deletedFiles.push({
            detailImageId: detailData.Image_ID,
            fileName: detailData.File_Name
         });
         console.log('Added to deleted files list:', detailData.Image_ID);
      }

      const imagePreviewContainer = detailsCard.querySelector('.image-preview-container');
      if (imagePreviewContainer) {
         const correspondingImage = imagePreviewContainer.querySelector(`img[data-file-name="${detailData.File_Name}"]`);
         console.log('Found corresponding single image:', correspondingImage);
         if (correspondingImage) {
            correspondingImage.remove();
            console.log('Single image removed successfully');
         } else {
            console.log('No corresponding single image found for:', detailData.File_Name);
         }
      } else {
         console.log('No image preview container found');
      }

      fileDetailCard.remove();
      console.log(`File detail card for "${detailData.File_Name}" removed. File will be excluded from submission.`);
   });
   fileDetailCard.appendChild(removeBtn);

   if (detailData.Image) {
      fileDetailCard.addEventListener('click', function () {
         showImagePreview(detailData.Image, detailData.File_Name || 'Image');
      });
   }

   fileDetailsContainer.appendChild(fileDetailCard);

   console.log('File details card with click-to-preview populated successfully');
}

function showImagePreview(imageData, fileName) {
   console.log('Showing image preview for:', fileName);
   console.log('Image data received:', {
      type: typeof imageData,
      constructor: imageData ? imageData.constructor.name : 'null',
      length: imageData ? imageData.length : 'no length',
      isArray: Array.isArray(imageData),
      keys: imageData && typeof imageData === 'object' ? Object.keys(imageData).slice(0, 5) : 'not object'
   });

   let base64Data;
   try {
      console.log('Converting image data:', {
         type: typeof imageData,
         isArrayBuffer: imageData instanceof ArrayBuffer,
         isUint8Array: imageData instanceof Uint8Array,
         isObject: typeof imageData === 'object',
         hasLength: imageData && imageData.length !== undefined,
         length: imageData && imageData.length
      });

      if (typeof imageData === 'string') {
         console.log('Image data is string, using directly');
         base64Data = imageData;
      } else if (imageData instanceof ArrayBuffer || imageData instanceof Uint8Array) {
         console.log('Image data is ArrayBuffer/Uint8Array, converting...');
         const bytes = new Uint8Array(imageData);
         const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
         base64Data = btoa(binary);
         console.log('Converted to base64, length:', base64Data.length);
      } else if (imageData && typeof imageData === 'object') {
         console.log('Image data is object, converting...');
         console.log('Object keys:', Object.keys(imageData));
         console.log('Object values sample:', Object.values(imageData));
         console.log('Full object structure:', imageData);

         if (imageData.data && Array.isArray(imageData.data)) {
            console.log('Found data array, length:', imageData.data.length);
            const bytes = new Uint8Array(imageData.data);
            const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
            base64Data = btoa(binary);
            console.log('Converted data array to base64, length:', base64Data.length);
         } else if (imageData.type === 'Buffer' && Array.isArray(imageData.data)) {
            console.log('Found Buffer object, data length:', imageData.data.length);
            const bytes = new Uint8Array(imageData.data);
            const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
            base64Data = btoa(binary);
            console.log('Converted Buffer to base64, length:', base64Data.length);
         } else {
            console.log('Trying to convert object values directly...');
            const values = Object.values(imageData);
            console.log('Values length:', values.length);
            console.log('First few values:', values.slice(0, 10));

            if (values.length > 0 && typeof values[0] === 'number') {
               const bytes = new Uint8Array(values);
               const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
               base64Data = btoa(binary);
               console.log('Converted numeric values to base64, length:', base64Data.length);
            } else {
               console.error('Cannot convert object - values are not numbers:', typeof values[0]);
               return;
            }
         }
      } else {
         console.error('Unsupported image data type:', typeof imageData, imageData);
         return;
      }

      console.log('Setting image src with base64 data (first 100 chars):', base64Data.substring(0, 100));
   } catch (error) {
      console.error('Error converting image data:', error);
      return;
   }

   const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');

   if (!newWindow) {
      alert('Please allow popups for this site to view images');
      return;
   }

   const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Image Preview - ${fileName}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                background-color: #000;
        display: flex;
                justify-content: center;
        align-items: center;
                height: 100vh;
                overflow: hidden;
                font-family: Arial, sans-serif;
            }

            .image-container {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                overflow: hidden;
            }

            .image-wrapper {
                position: relative;
                transform-origin: center center;
                transition: transform 0.1s ease-out;
                overflow: hidden;
            }

            .image {
                width: 100%;
                height: auto;
                max-width: none;
                max-height: none;
                display: block;
                object-fit: contain;
                cursor: default;
                user-select: none;
                -webkit-user-drag: none;
                image-rendering: -webkit-optimize-contrast;
                image-rendering: -moz-crisp-edges;
                image-rendering: crisp-edges;
                image-rendering: auto;
                -ms-interpolation-mode: bicubic;
            }

            .image.zoomed {
                cursor: grab;
            }

            .image.dragging {
                cursor: grabbing;
            }

            .controls {
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-size: 12px;
                z-index: 1000;
            }

        </style>
    </head>
    <body>
        <div class="controls">
            <div>Scroll to zoom</div>
            <div>Drag to pan when zoomed</div>
            <div>Press Escape to close</div>
        </div>
        <div class="image-container">
            <div class="image-wrapper">
                <img class="image" src="data:image/jpeg;base64,${base64Data}" alt="${fileName}">
            </div>
        </div>

        <script>

            let scale = 1;
            let isDragging = false;
            let startX = 0;
            let startY = 0;
            let translateX = 0;
            let translateY = 0;

            const image = document.querySelector('.image');
            const imageWrapper = document.querySelector('.image-wrapper');
            const container = document.querySelector('.image-container');

            image.onload = function() {
                const containerRect = container.getBoundingClientRect();
                const imageAspectRatio = image.naturalWidth / image.naturalHeight;
                const containerAspectRatio = containerRect.width / containerRect.height;

                let displayWidth, displayHeight;

                if (imageAspectRatio > containerAspectRatio) {

                    displayWidth = containerRect.width;
                    displayHeight = containerRect.width / imageAspectRatio;
                } else {

                    displayHeight = containerRect.height;
                    displayWidth = containerRect.height * imageAspectRatio;
                }

                imageWrapper.style.width = displayWidth + 'px';
                imageWrapper.style.height = displayHeight + 'px';

                image.style.width = '100%';
                image.style.height = '100%';

                console.log('Image loaded at natural size:', image.naturalWidth, 'x', image.naturalHeight);
                console.log('Display size:', displayWidth, 'x', displayHeight);
            };

            function updateTransform() {
                const containerRect = container.getBoundingClientRect();
                const wrapperRect = imageWrapper.getBoundingClientRect();
                const scaledWidth = wrapperRect.width * scale;
                const scaledHeight = wrapperRect.height * scale;

                const maxTranslateX = Math.max(0, (scaledWidth - containerRect.width) / 2);
                const maxTranslateY = Math.max(0, (scaledHeight - containerRect.height) / 2);

                translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX));
                translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY));

                imageWrapper.style.transform = \`scale(\${scale}) translate(\${translateX / scale}px, \${translateY / scale}px)\`;
            }

            function updateCursor() {
                if (scale > 1) {
                    image.classList.add('zoomed');
                    image.classList.remove('dragging');
                    if (isDragging) {
                        image.classList.add('dragging');
                    }
                } else {
                    image.classList.remove('zoomed', 'dragging');
                }
            }

            container.addEventListener('wheel', function(e) {
                e.preventDefault();
                e.stopPropagation();

                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                const newScale = Math.max(1, Math.min(5, scale * delta));

                if (newScale !== scale) {
                    scale = newScale;

                    if (scale === 1) {
                        translateX = 0;
                        translateY = 0;
                    }

                    updateTransform();
                    updateCursor();
                }
            });

            image.addEventListener('mousedown', function(e) {
                if (scale > 1) {
                    e.preventDefault();
                    e.stopPropagation();
                    isDragging = true;
                    startX = e.clientX - translateX;
                    startY = e.clientY - translateY;
                    updateCursor();
                }
            });

            document.addEventListener('mousemove', function(e) {
                if (isDragging && scale > 1) {
                    e.preventDefault();
                    translateX = e.clientX - startX;
                    translateY = e.clientY - startY;
                    updateTransform();
                }
            });

            document.addEventListener('mouseup', function() {
                if (isDragging) {
                    isDragging = false;
                    updateCursor();
                }
            });

            let lastTouchDistance = 0;

            container.addEventListener('touchstart', function(e) {
                e.preventDefault();
                e.stopPropagation();

                if (e.touches.length === 2) {

                    const touch1 = e.touches[0];
                    const touch2 = e.touches[1];
                    lastTouchDistance = Math.sqrt(
                        Math.pow(touch2.clientX - touch1.clientX, 2) + 
                        Math.pow(touch2.clientY - touch1.clientY, 2)
                    );
                } else if (e.touches.length === 1 && scale > 1) {

                    isDragging = true;
                    const touch = e.touches[0];
                    startX = touch.clientX - translateX;
                    startY = touch.clientY - translateY;
                }
            });

            container.addEventListener('touchmove', function(e) {
                e.preventDefault();
                e.stopPropagation();

                if (e.touches.length === 2) {

                    const touch1 = e.touches[0];
                    const touch2 = e.touches[1];
                    const currentDistance = Math.sqrt(
                        Math.pow(touch2.clientX - touch1.clientX, 2) + 
                        Math.pow(touch2.clientY - touch1.clientY, 2)
                    );

                    if (lastTouchDistance > 0) {
                        const delta = currentDistance / lastTouchDistance;
                        const newScale = Math.max(1, Math.min(5, scale * delta));
                        scale = newScale;
                        updateTransform();
                        updateCursor();
                    }

                    lastTouchDistance = currentDistance;
                } else if (e.touches.length === 1 && isDragging && scale > 1) {

                    const touch = e.touches[0];
                    translateX = touch.clientX - startX;
                    translateY = touch.clientY - startY;
                    updateTransform();
                }
            });

            container.addEventListener('touchend', function(e) {
                e.preventDefault();
                e.stopPropagation();

                if (e.touches.length === 0) {
                    isDragging = false;
                    lastTouchDistance = 0;
                }
            });

            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    window.close();
                }
            });
        </script>
    </body>
    </html>
    `;

   newWindow.document.write(htmlContent);
   newWindow.document.close();

   console.log('Image preview window created');
}

function formatFileSize(bytes) {
   if (bytes === 0) return '0 Bytes';

   const k = 1024;
   const sizes = ['Bytes', 'KB', 'MB', 'GB'];
   const i = Math.floor(Math.log(bytes) / Math.log(k));

   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTimeForSelect(timeValue) {
   if (!timeValue) return '';

   if (timeValue instanceof Date || (typeof timeValue === 'string' && timeValue.includes('T'))) {
      try {
         const date = new Date(timeValue);
         if (!isNaN(date.getTime())) {
            const hours = date.getUTCHours().toString().padStart(2, '0');
            const minutes = date.getUTCMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
         }
      } catch (error) {
         console.warn('Could not parse datetime:', timeValue);
      }
   }

   if (typeof timeValue === 'string') {
      if (/^\d{2}:\d{2}$/.test(timeValue)) {
         return timeValue;
      }

      if (/^\d{2}:\d{2}:\d{2}$/.test(timeValue)) {
         return timeValue.substring(0, 5);
      }

      if (/^\d{1}:\d{2}$/.test(timeValue)) {
         return '0' + timeValue;
      }

      try {
         const date = new Date('2000-01-01 ' + timeValue);
         if (!isNaN(date.getTime())) {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
         }
      } catch (error) {
         console.warn('Could not parse time string:', timeValue);
      }
   }

   return '';
}

function generateTimeOptionsForRow(row) {
   const timeSelects = row.querySelectorAll('.time-select');
   console.log('Generating time options for row, found', timeSelects.length, 'time selects');

   timeSelects.forEach((select, index) => {
      console.log('Generating options for time select', index, ':', select);

      select.innerHTML = '<option value="">--</option>';

      for (let hour = 0; hour < 24; hour++) {
         for (let minute = 0; minute < 60; minute += 30) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const option = document.createElement('option');
            option.value = timeString;
            option.textContent = timeString;
            select.appendChild(option);
         }
      }
      console.log('Generated', select.options.length, 'options for time select', index);
   });
}

function initializeTimeOptions(row) {
   generateTimeOptionsForRow(row);
   const timeSelects = row.querySelectorAll('.time-select');
   timeSelects.forEach(select => {
      select.addEventListener('change', function () {
         calculateRowTimes(row);
      });
   });
}

function addTimeCalculationListeners(row) {
   const timeSelects = row.querySelectorAll('.time-select');
   console.log('Adding time calculation listeners to row, found', timeSelects.length, 'time selects');

   timeSelects.forEach((select, index) => {
      console.log('Adding listener to time select', index, ':', select);
      select.addEventListener('change', () => {
         console.log('Time select changed, calling calculateRowTimes');
         calculateRowTimes(row);
      });
   });
}

function calculateRowTimes(row) {
   console.log('calculateRowTimes called for row:', row);

   const outTimeRaw = row.querySelector('[data-type="out-time"]').value;
   const startTimeRaw = row.querySelector('[data-type="start-time"]').value;
   const endTimeRaw = row.querySelector('[data-type="end-time"]').value;
   const inTimeRaw = row.querySelector('[data-type="in-time"]').value;
   const outTime = outTimeRaw && outTimeRaw !== '--' ? outTimeRaw : null;
   const startTime = startTimeRaw && startTimeRaw !== '--' ? startTimeRaw : null;
   const endTime = endTimeRaw && endTimeRaw !== '--' ? endTimeRaw : null;
   const inTime = inTimeRaw && inTimeRaw !== '--' ? inTimeRaw : null;

   console.log('Calculating times for row:', {
      outTime: outTime,
      startTime: startTime,
      endTime: endTime,
      inTime: inTime
   });

   let travelTime = 0;
   if (outTime && startTime) {
      travelTime += calculateTimeDifference(outTime, startTime);
   }
   if (endTime && inTime) {
      travelTime += calculateTimeDifference(endTime, inTime);
   }

   const workTime = (startTime && endTime) ? calculateTimeDifference(startTime, endTime) : 0;

   let overtime = 0;
   if (endTime) {
      const endTimeObj = new Date(`2000-01-01T${endTime}:00`);
      const normalEndTime = new Date(`2000-01-01T18:00:00`);
      if (endTimeObj > normalEndTime) {
         overtime = calculateTimeDifference('18:00', endTime);
      }
   }

   console.log('Calculated values:', {
      travelTime: travelTime,
      workTime: workTime,
      overtime: overtime
   });

   row.querySelector('.travel-time').value = travelTime > 0 ? travelTime.toFixed(2) + ' hrs' : '';
   row.querySelector('.work-time').value = workTime > 0 ? workTime.toFixed(2) + ' hrs' : '';
   row.querySelector('.overtime').value = overtime > 0 ? overtime.toFixed(2) + ' hrs' : '';
}

function calculateTimeDifference(startTime, endTime) {
   if (!startTime || !endTime || startTime === '--' || endTime === '--') return null;

   const start = new Date(`2000-01-01T${startTime}:00`);
   const end = new Date(`2000-01-01T${endTime}:00`);

   return (end - start) / (1000 * 60 * 60);
}

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

function initializeBackButton() {
  const backButton = document.getElementById('backButton');
  if (backButton) {
     backButton.addEventListener('click', function () {
        const confirmed = confirm('Are you sure you want to go back to home? Any unsaved changes will be lost.');
        if (confirmed) {
           window.scrollTo(0, 0);
           window.location.href = 'index.html';
        }
      });
   }
}

function addControlsToTable() {
   console.log('Row controls within cards removed - following index.js pattern');
}

function addControlsToDetailsContainer() {
   const detailsContainer = document.getElementById('detailsContainer');
   if (detailsContainer && !document.querySelector('.row-controls')) {
      const controls = document.createElement('div');
      controls.className = 'row-controls';
      controls.innerHTML = `
            <button type="button" class="row-control-btn add-btn" title="Add Details Card">+</button>
            <button type="button" class="row-control-btn delete-btn" title="Delete Details Card">×</button>
        `;
      detailsContainer.insertAdjacentElement('afterend', controls);
   }
}

function addNewDetailsCard() {
   const detailsContainer = document.getElementById('detailsContainer');
   const existingCards = detailsContainer.querySelectorAll('.details-card');
   const newIndex = existingCards.length + 1;

   const newCard = document.createElement('div');
   newCard.className = 'details-card';
   newCard.setAttribute('data-details-index', newIndex);

   newCard.innerHTML = `
        <div class="details-card-content">
            <div class="details-table">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Out Time</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                            <th>In Time</th>
                            <th>Travel Time</th>
                            <th>Work Time</th>
                            <th>Over Time</th>
                            <th>Mil</th>
                            <th>Toll</th>
                            <th>Hotel</th>
                            <th>Others</th>
                        </tr>
                    </thead>
                    <tbody class="detailsTableBody">
                        <tr>
                            <td><input type="date" class="table-input date-input"></td>
                            <td><select class="table-input time-select" data-type="out-time"><option value="">--</option></select></td>
                            <td><select class="table-input time-select" data-type="start-time"><option value="">--</option></select></td>
                            <td><select class="table-input time-select" data-type="end-time"><option value="">--</option></select></td>
                            <td><select class="table-input time-select" data-type="in-time"><option value="">--</option></select></td>
                            <td><input type="text" class="table-input travel-time" readonly placeholder="Auto"></td>
                            <td><input type="text" class="table-input work-time" readonly placeholder="Auto"></td>
                            <td><input type="text" class="table-input overtime" readonly placeholder="Auto"></td>
                            <td><input type="text" class="table-input mil-input" placeholder="km"></td>
                            <td><input type="text" class="table-input toll-input" placeholder="RM"></td>
                            <td><input type="text" class="table-input hotel-input" placeholder="RM"></td>
                            <td><input type="text" class="table-input others-input"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="description-field">
                <h5 class="details-subtitle">Details of Problem</h5>
                <textarea class="text-area problem-details" rows="3" placeholder="Describe the problem details..."></textarea>
            </div>
            <div class="description-field">
                <h5 class="details-subtitle">Description of Job Done</h5>
                <textarea class="text-area job-description" rows="3" placeholder="Describe the work performed..."></textarea>
            </div>
            <div class="description-field">
                <h5 class="details-subtitle">Photos / Images (Optional)</h5>
                <div class="image-upload-container">
                    <input type="file" class="image-upload-input" multiple accept="image/*" style="display: none;">
                    <div class="image-upload-area">
                        <img src="../statics/Upload Icon.png" alt="Upload" class="upload-icon">
                        <span class="upload-text">Click to upload images</span>
                        <div class="upload-info">
                            <small>Max 10 files, 50MB each. Supported: JPEG, PNG, GIF, WebP, BMP, TIFF</small>
                        </div>
                    </div>
                    <div class="image-preview-container"></div>
                </div>
            </div>
        </div>
    `;

   detailsContainer.appendChild(newCard);

   const newCardTable = newCard.querySelector('.detailsTableBody tr');
   initializeTimeOptions(newCardTable);

   const numericInputs = newCard.querySelectorAll('.mil-input, .toll-input, .hotel-input');
   numericInputs.forEach(input => {
      allowOnlyNumbers(input);
   });

   initializeImageUpload(newCard);
   initializeTextAreaEnterSupport(newCard);
}

function deleteLastDetailsCard() {
   const detailsContainer = document.getElementById('detailsContainer');
   const cards = detailsContainer.querySelectorAll('.details-card');

   if (cards.length > 1) {
      const confirmed = confirm('Are you sure you want to delete the last Details card?');
      if (confirmed) {
         const lastCard = cards[cards.length - 1];
         const detailId = lastCard.getAttribute('data-detail-id');
         console.log('Deleting card with detail ID:', detailId);
         lastCard.remove();
      }
   } else {
      alert('Cannot delete the last card. At least one Details card is required.');
   }
}

function initializeImageUpload(card) {
  const uploadArea = card.querySelector('.image-upload-area');
  const fileInput = card.querySelector('.image-upload-input');
  const previewContainer = card.querySelector('.image-preview-container');

  if (!uploadArea || !fileInput || !previewContainer) {
     console.warn('Missing upload elements in card');
     return;
  }

  if (fileInput.dataset.uploadInitialized === 'true') {
     console.log('File input already initialized, skipping');
     return;
  }

  fileInput.dataset.uploadInitialized = 'true';

  if (!fileInput.customFiles) {
     fileInput.customFiles = [];
  }

  fileInput.syncFiles = function() {
     const dt = new DataTransfer();
     this.customFiles.forEach(file => {
        dt.items.add(file);
     });
     this.files = dt.files;
  };

  console.log('Initializing image upload for card');

  uploadArea.addEventListener('click', function () {
     fileInput.click();
  });

  fileInput.addEventListener('change', function (e) {
     console.log('File input changed, files selected:', e.target.files.length);
     const files = Array.from(e.target.files);
     const validationResult = validateFiles(files);

     if (!validationResult.valid) {
        alert(validationResult.error);

        e.target.value = '';
        return;
     }

     files.forEach(file => {
        if (file.type.startsWith('image/')) {
           addFileToContainer(previewContainer, file, fileInput);
        }
     });

     e.target.value = '';
  });

   uploadArea.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.stopPropagation();
      uploadArea.style.backgroundColor = '#e3f2fd';
      uploadArea.style.borderColor = '#2196f3';
   });

   uploadArea.addEventListener('dragleave', function (e) {
      e.preventDefault();
      e.stopPropagation();
      uploadArea.style.backgroundColor = '';
      uploadArea.style.borderColor = '';
   });

  uploadArea.addEventListener('drop', function (e) {
     e.preventDefault();
     e.stopPropagation();
     uploadArea.style.backgroundColor = '';
     uploadArea.style.borderColor = '';

     const files = Array.from(e.dataTransfer.files);
     const validationResult = validateFiles(files);

     if (!validationResult.valid) {
        alert(validationResult.error);
        return;
     }

     files.forEach(file => {
        if (file.type.startsWith('image/')) {
           addFileToContainer(previewContainer, file, fileInput);
        }
     });
  });
}

function initializeTextAreaEnterSupport(card) {
   const problemDetails = card.querySelector('.problem-details');
   const jobDescription = card.querySelector('.job-description');

   if (problemDetails) {
      problemDetails.addEventListener('keydown', function (e) {
         if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            const start = this.selectionStart;
            const end = this.selectionEnd;
            const value = this.value;
            this.value = value.substring(0, start) + '\n' + value.substring(end);
            this.selectionStart = this.selectionEnd = start + 1;
         }
      });
   }

   if (jobDescription) {
      jobDescription.addEventListener('keydown', function (e) {
         if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            const start = this.selectionStart;
            const end = this.selectionEnd;
            const value = this.value;
            this.value = value.substring(0, start) + '\n' + value.substring(end);
            this.selectionStart = this.selectionEnd = start + 1;
         }
      });
   }
}

function validateFiles(files) {
  const maxFiles = 10;
  const maxFileSize = 50 * 1024 * 1024;
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];

  const totalFiles = getTotalFileCount();
  if (totalFiles + files.length > maxFiles) {
     return {
        valid: false,
        error: `Too many files. You have ${totalFiles} files already. Maximum ${maxFiles} files allowed total.`
     };
  }

  if (files.length > maxFiles) {
     return {
        valid: false,
        error: `Too many files. Maximum ${maxFiles} files allowed.`
     };
  }

  for (let i = 0; i < files.length; i++) {
     const file = files[i];

     if (file.size === 0) {
        return {
           valid: false,
           error: `File "${file.name}" is empty (0 bytes).`
        };
     }

     if (file.size > maxFileSize) {
        return {
           valid: false,
           error: `File "${file.name}" is too large (${formatFileSize(file.size)}). Maximum size is 50MB per file.`
        };
     }

     if (!allowedTypes.includes(file.type)) {
        return {
           valid: false,
           error: `File "${file.name}" is not a supported image type (${file.type || 'unknown'}). Supported types: JPEG, PNG, GIF, WebP, BMP, TIFF.`
        };
     }

     const invalidChars = /[<>:"|?*\x00-\x1f]/;
     if (invalidChars.test(file.name)) {
        return {
           valid: false,
           error: `File "${file.name}" contains invalid characters. Please rename the file.`
        };
     }

     if (file.name.length > 255) {
        return {
           valid: false,
           error: `File "${file.name}" has a name that is too long. Maximum 255 characters.`
        };
     }
  }

  return {
     valid: true
  };
}

function getTotalFileCount() {
  let totalFiles = 0;
  const detailCards = document.querySelectorAll('.details-card');
  detailCards.forEach(card => {
     const fileInput = card.querySelector('.image-upload-input');

     if (fileInput && fileInput.customFiles) {
        totalFiles += fileInput.customFiles.length;
     } else if (fileInput && fileInput.files) {
        totalFiles += fileInput.files.length;
     }
  });
  return totalFiles;
}

function isFileDuplicate(container, file) {

  const existingImages = container.querySelectorAll('img[data-file-name]');
  for (let img of existingImages) {
     if (img.getAttribute('data-file-name') === file.name) {
        return true;
     }
  }

  const card = container.closest('.details-card');
  if (card) {
     const fileInput = card.querySelector('.image-upload-input');
     if (fileInput && fileInput.customFiles) {
        for (let existingFile of fileInput.customFiles) {
           if (existingFile.name === file.name) {
              return true;
           }
        }
     }
  }

  return false;
}

function addFileToContainer(container, file, fileInput) {
  console.log(`Adding file to container: ${file.name}`);

  if (isFileDuplicate(container, file)) {
     alert(`File "${file.name}" has already been uploaded to this detail card.`);
     return;
  }

  if (fileInput && fileInput.customFiles) {
     fileInput.customFiles.push(file);
     console.log(`Added to customFiles. Total files: ${fileInput.customFiles.length}`);

     if (fileInput.syncFiles) {
        fileInput.syncFiles();
     }
  }

  let imagesWrapper = container.querySelector('.images-wrapper');
  console.log('Images wrapper exists:', !!imagesWrapper);
  if (!imagesWrapper) {
     imagesWrapper = document.createElement('div');
     imagesWrapper.className = 'images-wrapper';
     imagesWrapper.style.cssText = `
           display: flex;
           flex-wrap: wrap;
           gap: 5px;
           max-width: 100%;
           margin-bottom: 10px;
       `;
     container.appendChild(imagesWrapper);
     console.log('Created new images wrapper');
  }

  const imagePreview = document.createElement('img');
  imagePreview.style.cssText = `
       max-width: 100px;
       max-height: 100px;
       object-fit: cover;
       border: 1px solid #ddd;
       border-radius: 4px;
       margin: 2px;
       cursor: pointer;
   `;
  imagePreview.setAttribute('data-file-name', file.name);

  imagesWrapper.appendChild(imagePreview);

  const reader = new FileReader();
  reader.onload = function (e) {
     try {
        imagePreview.src = e.target.result;
        imagePreview.addEventListener('click', () => {
           const base64Data = e.target.result.split(',')[1];
           showImageModal(base64Data, file.name);
        });
        console.log(`Image preview loaded: ${file.name} (${formatFileSize(file.size)})`);
     } catch (error) {
        console.error(`Error setting image source for ${file.name}:`, error);
        imagePreview.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f8d7da" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="12" text-anchor="middle" fill="%23721c24"%3EError%3C/text%3E%3C/svg%3E';
     }
  };
  reader.onerror = function (e) {
     console.error(`Error reading file ${file.name}:`, e);

     imagePreview.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f8d7da" width="100" height="100"/%3E%3Ctext x="50" y="45" font-size="10" text-anchor="middle" fill="%23721c24"%3ERead%3C/text%3E%3Ctext x="50" y="60" font-size="10" text-anchor="middle" fill="%23721c24"%3EError%3C/text%3E%3C/svg%3E';
     imagePreview.style.border = '2px solid #f5c6cb';
     imagePreview.alt = 'Error reading file';
     imagePreview.title = `Failed to read: ${file.name}`;
  };

  try {
     reader.readAsDataURL(file);
  } catch (error) {
     console.error(`Failed to start reading file ${file.name}:`, error);
     imagePreview.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f8d7da" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="12" text-anchor="middle" fill="%23721c24"%3EFailed%3C/text%3E%3C/svg%3E';
  }

  addFileDetailCard(container, file, fileInput);
}

function addFileDetailCard(container, file, fileInput) {
  const fileDetailCard = document.createElement('div');
  fileDetailCard.className = 'file-detail-card';
  fileDetailCard.setAttribute('data-file-name', file.name);

  const fileInfo = document.createElement('div');
  fileInfo.className = 'file-detail-info';

  const fileName = document.createElement('div');
  fileName.className = 'file-detail-name';
  fileName.textContent = file.name;

  const fileSize = document.createElement('div');
  fileSize.className = 'file-detail-size';
  fileSize.textContent = formatFileSize(file.size);

  const removeBtn = document.createElement('button');
  removeBtn.className = 'file-detail-remove';
  removeBtn.innerHTML = '×';
  removeBtn.type = 'button';

  fileInfo.appendChild(fileName);
  fileInfo.appendChild(fileSize);
  fileDetailCard.appendChild(fileInfo);
  fileDetailCard.appendChild(removeBtn);

  removeBtn.addEventListener('click', function () {
     console.log(`Removing file: "${file.name}"`);

     if (fileInput && fileInput.customFiles) {
        const index = fileInput.customFiles.findIndex(f => f.name === file.name);
        if (index > -1) {
           fileInput.customFiles.splice(index, 1);
           console.log(`Removed from customFiles array. Remaining files:`, fileInput.customFiles.length);

           if (fileInput.syncFiles) {
              fileInput.syncFiles();
              console.log('Files synced to input');
           }
        }
     }

     const imagesWrapper = container.querySelector('.images-wrapper');
     if (imagesWrapper) {
        const correspondingImage = imagesWrapper.querySelector(`img[data-file-name="${file.name}"]`);
        if (correspondingImage) {
           correspondingImage.remove();
           console.log('Image preview removed');
        } else {
           console.log('No corresponding image preview found');
        }

        if (imagesWrapper.children.length === 0) {
           imagesWrapper.remove();
           console.log('Images wrapper removed (was empty)');
        }
     } else {
        console.log('No images wrapper found in container');
     }

     fileDetailCard.remove();
     console.log(`File detail card removed. File will be excluded from submission.`);
  });

  container.appendChild(fileDetailCard);
}

function initializeDetailsTable() {
   console.log('initializeDetailsTable called');

   addControlsToDetailsContainer();

   if (detailsContainer) {
      const existingCards = detailsContainer.querySelectorAll('.details-card');
      existingCards.forEach(card => {
         initializeImageUpload(card);
      });
   }

   const detailsCards = document.querySelectorAll('.details-card');
   console.log('Found', detailsCards.length, 'details cards');

   detailsCards.forEach((card, cardIndex) => {
      console.log('Processing details card', cardIndex, ':', card);

      const detailsTable = card.querySelector('.details-table');
      if (detailsTable) {
         const detailsTableBody = detailsTable.querySelector('tbody');
         if (detailsTableBody) {
            console.log('Found detailsTableBody in card', cardIndex, ':', detailsTableBody);
            const existingRows = detailsTableBody.querySelectorAll('tr');
            console.log('Found', existingRows.length, 'existing rows in card', cardIndex);

            existingRows.forEach((row, index) => {
               console.log('Processing row', index, 'in card', cardIndex, ':', row);
               generateTimeOptionsForRow(row);
               addTimeCalculationListeners(row);
            });
         } else {
            console.log('No tbody found in details table for card', cardIndex);
         }
      } else {
         console.log('No details-table found in card', cardIndex);
      }
   });

   const allNumericInputs = document.querySelectorAll('.mil-input, .toll-input, .hotel-input');
   allNumericInputs.forEach(input => {
      allowOnlyNumbers(input);
   });

   if (detailsContainer) {
      detailsContainer.addEventListener('keydown', function (e) {
         if (e.key === 'Enter') {
            e.preventDefault();
            const inputs = Array.from(detailsContainer.querySelectorAll('input, select, textarea'));
            const currentIndex = inputs.indexOf(e.target);
            if (currentIndex >= 0 && currentIndex < inputs.length - 1) {
               inputs[currentIndex + 1].focus();
            }
         }
      });
   }

   const rowControls = document.querySelector('.row-controls');
   if (rowControls) {
      rowControls.addEventListener('click', function (e) {
         if (e.target.classList.contains('add-btn')) {
            e.preventDefault();
            e.stopPropagation();
            addNewDetailsCard();
         } else if (e.target.classList.contains('delete-btn')) {
            e.preventDefault();
            e.stopPropagation();
            deleteLastDetailsCard();
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
        radio.addEventListener('change', function () {
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

function initializeReviewButton() {
   const reviewButton = document.getElementById('reviewButton');
   if (reviewButton) {
      reviewButton.addEventListener('click', function () {
         const confirmed = confirm('Are you sure you want to go to review page? Any unsaved changes will be lost.');
         if (confirmed) {
            const reportId = getReportIdFromUrl();
            if (reportId) {
               window.scrollTo({
                  top: 0,
                  behavior: 'smooth'
               });
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
      updateButton.addEventListener('click', function () {
         updateReport();
      });
   }
}

async function updateReport() {
   try {
      const reportId = getReportIdFromUrl();
      if (!reportId) {
         alert('Error: Report ID not found');
         return;
      }

      const purposeOfVisit = document.querySelector('input[name="purpose"]:checked')?.value || '';
      const purposeOfVisitOthers = document.getElementById('othersText').value || '';

      console.log('Purpose of visit:', purposeOfVisit);
      console.log('Purpose of visit others text:', purposeOfVisitOthers);

      const finalPurposeOfVisit = (purposeOfVisit === 'others' && purposeOfVisitOthers) ?
         purposeOfVisitOthers :
         purposeOfVisit;

      console.log('Final purpose of visit:', finalPurposeOfVisit);

      const reportData = {
         customerName: document.getElementById('customer').value,
         attn: document.getElementById('attn').value,
         projectName: document.getElementById('projectName').value,
         yourRef: document.getElementById('yourRef').value,
         date: document.getElementById('date').value,
         serviceBy: document.getElementById('serviceBy').value,
         purposeOfVisit: finalPurposeOfVisit,
         purposeOfVisitOthers: purposeOfVisitOthers
      };

      const details = collectDetailsData();
      const siteInformation = collectSiteInformationData();

      showLoadingState('Updating report...');

      currentAbortController = new AbortController();
      operationInProgress = true;

      const submitFormData = new FormData();
      submitFormData.append('reportId', reportId);
      submitFormData.append('reportData', JSON.stringify(reportData));
      submitFormData.append('details', JSON.stringify(details));
      submitFormData.append('siteInformation', JSON.stringify(siteInformation));

      const detailsCards = document.querySelectorAll('.details-card');
      const filesByDetail = [];
      const allFiles = [];

     detailsCards.forEach((card, cardIndex) => {

        const fileDetailCards = card.querySelectorAll('.file-detail-card');
        const fileInput = card.querySelector('.image-upload-input');
        const detailId = card.getAttribute('data-detail-id');

        const availableFiles = fileInput && fileInput.customFiles && fileInput.customFiles.length > 0 
           ? fileInput.customFiles 
           : (fileInput && fileInput.files ? Array.from(fileInput.files) : []);

        console.log(`Card ${cardIndex}: fileInput found:`, !!fileInput);
        console.log(`Card ${cardIndex}: files available:`, availableFiles.length);
        console.log(`Card ${cardIndex}: file detail cards:`, fileDetailCards.length);
        console.log(`Card ${cardIndex}: detailId:`, detailId);
        console.log(`Card ${cardIndex}: using customFiles:`, !!(fileInput && fileInput.customFiles && fileInput.customFiles.length > 0));

        if (availableFiles.length > 0 && fileDetailCards.length > 0) {

           const keepFileNames = Array.from(fileDetailCards).map(fdc =>
              fdc.getAttribute('data-file-name')
           );

           console.log(`Card ${cardIndex}: file detail card names:`, keepFileNames);

           const cardFiles = availableFiles.filter(file =>
              keepFileNames.includes(file.name)
           );

           console.log(`Card ${cardIndex}: files after filtering:`, cardFiles.map(f => f.name));

            if (cardFiles.length > 0) {
               filesByDetail.push({
                  detailIndex: cardIndex,
                  fileCount: cardFiles.length,
                  detailId: detailId
               });

               cardFiles.forEach((file, fileIndex) => {
                  console.log(`Adding file ${allFiles.length}: ${file.name} to detail ${cardIndex} (detailId: ${detailId})`);
                  submitFormData.append('images', file);
                  submitFormData.append(`detailIndex_${allFiles.length}`, cardIndex);
                  allFiles.push(file);
               });
            }
         }
      });

      if (filesByDetail.length > 0) {
         submitFormData.append('filesByDetail', JSON.stringify(filesByDetail));
      }

      if (window.deletedFiles && window.deletedFiles.length > 0) {
         submitFormData.append('deletedFiles', JSON.stringify(window.deletedFiles));
         console.log('Sending deleted files:', window.deletedFiles);
      }

      console.log(`Sending update request with ${allFiles.length} files`);

      const response = await fetch(`/api/report/update/${reportId}`, {
         method: 'PUT',
         body: submitFormData,
         signal: currentAbortController.signal
      });

      if (!response.ok) {
         const errorData = await response.json();
         console.error('Server error response:', errorData);
         let errorMessage = errorData.error || 'Unknown error';
         if (errorData.missingFields && errorData.missingFields.length > 0) {
            errorMessage = `Missing required fields: ${errorData.missingFields.join(', ')}`;
         }
         if (errorData.details && Array.isArray(errorData.details)) {
            errorMessage += `\n\nDetails: ${errorData.details.join('\n')}`;
         }

         operationInProgress = false;
         currentAbortController = null;
         hideLoadingState();

         await new Promise(resolve => setTimeout(resolve, 100));

         alert(`Error updating report:\n\n${errorMessage}`);
         return;
      }

      const result = await response.json();

      if (result.success) {
         operationInProgress = false;
         currentAbortController = null;
         hideLoadingState();

         await new Promise(resolve => setTimeout(resolve, 100));

         alert(`Report updated successfully! ${result.uploadedFiles ? `(${result.uploadedFiles} files uploaded)` : ''}`);

         window.scrollTo(0, 0);
         document.documentElement.scrollTop = 0;
         document.body.scrollTop = 0;

         if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
         }

         window.location.reload();

      } else {
         operationInProgress = false;
         currentAbortController = null;
         hideLoadingState();

         await new Promise(resolve => setTimeout(resolve, 100));

         alert('Error updating report: ' + (result.error || 'Unknown error'));
      }

   } catch (error) {
      console.error('Error updating report:', error);
      operationInProgress = false;
      currentAbortController = null;
      hideLoadingState();

      await new Promise(resolve => setTimeout(resolve, 100));

      let errorMessage = 'Error updating report. Please try again.';
      if (error.name === 'AbortError') {
         errorMessage = 'Update was cancelled';
      } else if (error.message && error.message.includes('HTTP error!')) {
         const parts = error.message.split(' - ');
         if (parts.length > 1) {
            errorMessage = parts[1];
         }
      }

      alert(`Error updating report:\n\n${errorMessage}`);
   }
}

function collectDetailsData() {
   const details = [];
   const detailsCards = document.querySelectorAll('.details-card');

   detailsCards.forEach((card, cardIndex) => {
      const row = card.querySelector('tbody tr');
      if (!row) return;

      const dateInput = row.querySelector('.date-input');
      const outTimeSelect = row.querySelector('[data-type="out-time"]');
      const startTimeSelect = row.querySelector('[data-type="start-time"]');
      const endTimeSelect = row.querySelector('[data-type="end-time"]');
      const inTimeSelect = row.querySelector('[data-type="in-time"]');
      const travelTimeInput = row.querySelector('.travel-time');
      const workTimeInput = row.querySelector('.work-time');
      const overtimeInput = row.querySelector('.overtime');
      const milInput = row.querySelector('.mil-input');
      const tollInput = row.querySelector('.toll-input');
      const hotelInput = row.querySelector('.hotel-input');
      const othersInput = row.querySelector('.others-input');
      const problemDetails = card.querySelector('.problem-details');
      const jobDescription = card.querySelector('.job-description');
      const fileInput = card.querySelector('.image-upload-input');
      const fileDetailCards = card.querySelectorAll('.file-detail-card');

      if (dateInput.value) {
         const detail = {
            date: dateInput.value,
            outTime: outTimeSelect.value || '',
            startTime: startTimeSelect.value || '',
            endTime: endTimeSelect.value || '',
            inTime: inTimeSelect.value || '',
            travelTime: travelTimeInput ? travelTimeInput.value || '' : '',
            workTime: workTimeInput ? workTimeInput.value || '' : '',
            overtime: overtimeInput ? overtimeInput.value || '' : '',
            mil: milInput.value || '',
            toll: tollInput.value || '',
            hotel: hotelInput.value || '',
            others: othersInput.value || '',
            problemDetails: problemDetails ? problemDetails.value.trim() : '',
            jobDescription: jobDescription ? jobDescription.value.trim() : ''
         };

         const detailId = card.getAttribute('data-detail-id');
         console.log('Card element:', card);
         console.log('Detail ID attribute:', detailId);
         console.log('All attributes:', card.attributes);
         if (detailId) {
            detail.detailId = parseInt(detailId);
            console.log('Including detail ID in update:', detailId);
         } else {
            console.log('No detail ID found for card', cardIndex);
         }

         if (fileInput && fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            detail.fileName = file.name;
            detail.fileSize = file.size;
            detail.fileType = file.type;
            detail.fileExtension = file.name.split('.').pop().toLowerCase();
         } else if (fileDetailCards.length > 0) {
            const fileDetailCard = fileDetailCards[0];
            const fileName = fileDetailCard.querySelector('.file-detail-name');
            const fileSize = fileDetailCard.querySelector('.file-detail-size');

            if (fileName && fileSize) {
               detail.fileName = fileName.textContent;
               detail.fileSize = parseFileSize(fileSize.textContent);
               detail.fileType = 'image/jpeg';
               detail.fileExtension = fileName.textContent.split('.').pop().toLowerCase();
            }
         }

         details.push(detail);
      }
   });

   console.log('Collected details data:', details);
   console.log('Details with detailId:', details.filter(d => d.detailId));
   console.log('Details without detailId:', details.filter(d => !d.detailId));

   return details;
}

function collectSiteInformationData() {
   const siteInformation = [];
   const deviceTableBody = document.getElementById('deviceTableBody');

   if (!deviceTableBody) {
      console.log('Device table body not found');
      return siteInformation;
   }

   const rows = deviceTableBody.querySelectorAll('tr');
   console.log('Found', rows.length, 'site information rows');

   rows.forEach((row, index) => {
      const inputs = row.querySelectorAll('.device-input');
      if (inputs.length >= 5) {
         const name = inputs[0].value.trim();
         const plcHmi = inputs[1].value.trim();
         const brand = inputs[2].value.trim();
         const modelNumber = inputs[3].value.trim();
         const remarks = inputs[4].value.trim();

         if (name || plcHmi || brand || modelNumber || remarks) {
            siteInformation.push({
               name: name || null,
               plcHmi: plcHmi || null,
               brand: brand || null,
               modelNumber: modelNumber || null,
               remarks: remarks || null
            });
            console.log(`Site information row ${index + 1}:`, {
               name,
               plcHmi,
               brand,
               modelNumber,
               remarks
            });
         }
      }
   });

   console.log('Collected site information data:', siteInformation);
   return siteInformation;
}

function parseFileSize(sizeString) {
   const size = parseFloat(sizeString);
   const unit = sizeString.replace(/[0-9.]/g, '').trim();

   const multipliers = {
      'Bytes': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
   };

   return Math.round(size * (multipliers[unit] || 1));
}

function showError(message) {
   console.error('Error:', message);
   alert(`Error: ${message}`);
}

function showLoadingState(message = 'Loading report data...') {
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

function clearAllImagePreviews() {
   const detailsCards = document.querySelectorAll('.details-card');

   detailsCards.forEach(card => {

      const imagePreviewContainer = card.querySelector('.image-preview-container');
      if (imagePreviewContainer) {
         imagePreviewContainer.innerHTML = '';
      }

      const fileInput = card.querySelector('.image-upload-input');
      if (fileInput) {

         fileInput.value = '';

         const newFileInput = fileInput.cloneNode(true);
         newFileInput.value = '';

         fileInput.parentNode.replaceChild(newFileInput, fileInput);

         initializeImageUpload(card);
      }
   });

   console.log('All image previews and file inputs cleared and reset');
}

function clearFileInput(card) {
   const fileInput = card.querySelector('.image-upload-input');
   if (fileInput) {
      fileInput.value = '';

      const newFileInput = fileInput.cloneNode(true);
      newFileInput.value = '';

      fileInput.parentNode.replaceChild(newFileInput, fileInput);

      initializeImageUpload(card);

      console.log('File input cleared and reset for card');
   }
}

function initializeSiteInformationControls() {
   const deviceTableBody = document.getElementById('deviceTableBody');
   if (deviceTableBody) {
      addSiteInformationControlsToTable();
      const sectionDevice = document.querySelector('.section-device');
      if (sectionDevice) {
         sectionDevice.addEventListener('click', function (e) {
            if (e.target.id === 'addSiteInfoRow') {
               e.preventDefault();
               e.stopPropagation();
               const tbody = document.getElementById('deviceTableBody');
               const lastRow = tbody.lastElementChild;
               addNewSiteInformationRow(lastRow);
            } else if (e.target.id === 'removeSiteInfoRow') {
               e.preventDefault();
               e.stopPropagation();
               const tbody = document.getElementById('deviceTableBody');
               const lastRow = tbody.lastElementChild;
               deleteSiteInformationRow(lastRow);
            }
         });
      }
   }
}

function addSiteInformationControlsToTable() {
   const deviceTable = document.querySelector('.device-table');
   const sectionDevice = document.querySelector('.section-device');
   if (sectionDevice && !sectionDevice.querySelector('.row-controls')) {
      const controls = document.createElement('div');
      controls.className = 'row-controls';
      controls.innerHTML = `
            <button type="button" class="row-control-btn add-btn" id="addSiteInfoRow" title="Add Site Information Row">+</button>
            <button type="button" class="row-control-btn delete-btn" id="removeSiteInfoRow" title="Remove Site Information Row">×</button>
        `;
      deviceTable.insertAdjacentElement('afterend', controls);
   }
}

function addNewSiteInformationRow(afterRow) {
   const tbody = document.getElementById('deviceTableBody');
   const newRow = document.createElement('tr');

   newRow.innerHTML = `
        <td><input type="text" class="table-input device-input" placeholder="Enter name"></td>
        <td><input type="text" class="table-input device-input" placeholder="Enter PLC/HMI"></td>
        <td><input type="text" class="table-input device-input" placeholder="Enter brand"></td>
        <td><input type="text" class="table-input device-input" placeholder="Enter model number"></td>
        <td><input type="text" class="table-input device-input" placeholder="Enter remarks"></td>
    `;

   afterRow.parentNode.insertBefore(newRow, afterRow.nextSibling);

   console.log('New site information row added');
}

function deleteSiteInformationRow(rowToDelete) {
   const tbody = document.getElementById('deviceTableBody');
   if (tbody.children.length > 1) {
      const confirmed = confirm('Are you sure you want to delete the last row?');
      if (confirmed) {
         rowToDelete.remove();
         console.log('Site information row deleted');
      }
   } else {
      alert('Cannot delete the last row. At least one row is required.');
   }
}

async function initializeEditReport() {

   window.scrollTo(0, 0);
   document.documentElement.scrollTop = 0;
   document.body.scrollTop = 0;

   if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
   }

   showLoadingState();

   try {
      const reportId = getReportIdFromUrl();
      console.log('Report ID from URL:', reportId);

      if (!reportId) {
         hideLoadingState();
         showError('No report ID provided in URL');
         return;
      }

      console.log('Loading report data...');
      const data = await loadReportData(reportId);
      console.log('Data received:', data);

      if (!data.success) {
         console.error('API returned success: false');
         hideLoadingState();
         showError(`Error loading report data: ${data.error || 'Unknown error'}`);
         return;
      }

      console.log('Populating report form...');
      populateReportForm(data.report);

      console.log('Populating site information table...');
      populateSiteInformationTable(data.siteInformation);

      console.log('Populating details table...');
      populateDetailsTable(data.details);

     console.log('Initializing components...');
     initializeBackButton();
     initializeDetailsTable();
     initializeSiteInformationControls();
     initializeDeviceTable();
     initializePurposeOfVisit();
     preventEnterSubmit();
     initializeUpdateReportButton();
     initializeReviewButton();

      const detailCards = document.querySelectorAll('.details-card');
      detailCards.forEach(card => {
         initializeTextAreaEnterSupport(card);
      });

      hideLoadingState();

      window.scrollTo({
         top: 0,
         behavior: 'smooth'
      });

      console.log('Edit report loaded successfully');

   } catch (error) {
      console.error('Error initializing edit report:', error);
      hideLoadingState();
      showError(`Error loading report data: ${error.message}`);
   }
}

function showImageModalByUrl(imageUrl, filename) {
   console.log('showImageModalByUrl called with:', {
       filename: filename,
       imageUrl: imageUrl
   });

   const modal = document.createElement('div');
   modal.style.cssText = `
       position: fixed;
       top: 0;
       left: 0;
       width: 100%;
       height: 100%;
       background-color: rgba(0, 0, 0, 0.8);
       display: flex;
       justify-content: center;
       align-items: center;
       z-index: 1000;
       cursor: pointer;
   `;

   const modalContent = document.createElement('div');
   modalContent.style.cssText = `
       max-width: 90vw;
       max-height: 90vh;
       position: relative;
       cursor: default;
       display: flex;
       flex-direction: column;
       align-items: center;
       justify-content: center;
   `;

   const modalImage = document.createElement('img');
   modalImage.src = imageUrl;
   modalImage.style.cssText = `
       max-width: 100%;
       max-height: 85vh;
       object-fit: contain;
       border-radius: 4px;
   `;

   const filenameLabel = document.createElement('div');
   filenameLabel.textContent = filename;
   filenameLabel.style.cssText = `
       color: white;
       margin-top: 10px;
       font-size: 14px;
       text-align: center;
   `;

   modalContent.appendChild(modalImage);
   modalContent.appendChild(filenameLabel);
   modal.appendChild(modalContent);
   document.body.appendChild(modal);

   modal.addEventListener('click', (e) => {
       if (e.target === modal) {
           document.body.removeChild(modal);
       }
   });

   modalImage.onerror = function() {
       console.error('Failed to load full-size image:', filename);
       alert('Failed to load image');
       document.body.removeChild(modal);
   };
}

function showImageModal(base64Data, filename) {
   console.log('showImageModal called with:', {
      filename: filename,
      base64Length: base64Data ? base64Data.length : 0,
      hasBase64: !!base64Data
   });

   if (!base64Data || base64Data.length === 0) {
      console.error('Invalid base64Data provided to showImageModal');
      alert('Unable to display image: Invalid image data');
      return;
   }

   const modal = document.createElement('div');
   modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        cursor: pointer;
    `;

   const modalContent = document.createElement('div');
   modalContent.style.cssText = `
        max-width: 90vw;
        max-height: 90vh;
        position: relative;
        cursor: default;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    `;

   const modalImage = document.createElement('img');
   modalImage.src = `data:image/jpeg;base64,${base64Data}`;
   modalImage.style.cssText = `
        max-width: 100%;
        max-height: calc(90vh - 50px);
        width: auto;
        height: auto;
        object-fit: contain;
        border-radius: 8px;
        cursor: default;
    `;

   modalImage.onerror = function () {
      console.error('Failed to load image in modal:', filename);
      modalContent.innerHTML = `
            <div style="color: white; text-align: center; padding: 20px;">
                <h3>Unable to display image</h3>
                <p>Filename: ${filename}</p>
                <p>The image data may be corrupted or in an unsupported format.</p>
            </div>
        `;
   };

   modalImage.onload = function () {
      console.log('Modal image loaded successfully');
   };

   const filenameDisplay = document.createElement('div');
   filenameDisplay.textContent = filename;
   filenameDisplay.style.cssText = `
        color: white;
        font-size: 14px;
        background: rgba(0, 0, 0, 0.7);
        padding: 5px 10px;
        border-radius: 4px;
        margin-top: 10px;
        text-align: center;
        max-width: 100%;
        word-wrap: break-word;
    `;

   modalContent.appendChild(modalImage);
   modalContent.appendChild(filenameDisplay);
   modal.appendChild(modalContent);
   modal.addEventListener('click', () => {
      document.body.removeChild(modal);
   });

   document.body.appendChild(modal);
}

document.addEventListener('DOMContentLoaded', initializeEditReport);