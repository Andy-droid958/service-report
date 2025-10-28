function populateReportForm(reportData) {
    if (reportData.Customer_Name) {
        document.getElementById('customer').value = reportData.Customer_Name;
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
    
    deviceTableBody.innerHTML = '';
    
    if (siteInformationData && siteInformationData.length > 0) {
        console.log('Populating site information table with', siteInformationData.length, 'entries');
        
        siteInformationData.forEach((siteInfo, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="text" class="table-input device-input" readonly></td>
                <td><input type="text" class="table-input device-input" readonly></td>
                <td><input type="text" class="table-input device-input" readonly></td>
                <td><input type="text" class="table-input device-input" readonly></td>
                <td><input type="text" class="table-input device-input" readonly></td>
            `;
            
            const inputs = row.querySelectorAll('.device-input');
            if (inputs.length >= 5) {
                inputs[0].value = siteInfo.Name || '';
                inputs[1].value = siteInfo.PLC_HMI || '';
                inputs[2].value = siteInfo.Brand || '';
                inputs[3].value = siteInfo.Model_Number || '';
                inputs[4].value = siteInfo.Remarks || '';
            }
            
            deviceTableBody.appendChild(row);
            console.log(`Site information row ${index + 1} added:`, siteInfo);
        });
    } else {
        console.log('No site information data to populate, adding empty row');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" class="table-input device-input" placeholder="No data" readonly></td>
            <td><input type="text" class="table-input device-input" placeholder="No data" readonly></td>
            <td><input type="text" class="table-input device-input" placeholder="No data" readonly></td>
            <td><input type="text" class="table-input device-input" placeholder="No data" readonly></td>
            <td><input type="text" class="table-input device-input" placeholder="No data" readonly></td>
        `;
        deviceTableBody.appendChild(row);
    }
}


function populateDetailsTable(detailsData) {
    console.log('Details data received:', detailsData);
    console.log('Details data type:', typeof detailsData);
    console.log('Details data length:', detailsData ? detailsData.length : 'undefined');
    console.log('Details data is array:', Array.isArray(detailsData));
    
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
        if (!firstCard) {
            console.error('First details card not found');
            return;
        }
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

function replaceTimeSelectorsWithInputs(row) {
    const timeSelects = row.querySelectorAll('.time-select');
    timeSelects.forEach(select => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'table-input time-display';
        input.readOnly = true;
        input.style.textAlign = 'center';
        input.style.backgroundColor = '#f8f9fa';
        input.style.border = '1px solid #dee2e6';
        input.style.color = '#495057';
        input.placeholder = '--';
        
        select.parentNode.replaceChild(input, select);
    });
}

function populateDetailsCard(card, detailData) {
    console.log('Populating card with data:', detailData);
    const row = card.querySelector('tbody tr');
    if (!row) {
        console.error('No table row found in details card');
        return;
    }
    
    populateDetailsRow(row, detailData);
}

function populateDetailsRow(row, detailData) {
    console.log('Populating row with data:', detailData);
    

    replaceTimeSelectorsWithInputs(row);
    
    const inputs = row.querySelectorAll('input');
    
    inputs.forEach((input, index) => {
        let fieldName;
        if (input.type === 'date') {
            fieldName = 'Date';
        } else if (input.classList.contains('time-display')) {
            const allInputs = Array.from(row.querySelectorAll('input'));
            const inputIndex = allInputs.indexOf(input);
            if (inputIndex === 1) fieldName = 'Out_Time';
            else if (inputIndex === 2) fieldName = 'Start_Time';
            else if (inputIndex === 3) fieldName = 'End_Time';
            else if (inputIndex === 4) fieldName = 'In_Time';
        } else if (input.classList.contains('travel-time')) {
            fieldName = 'Travel_Time_hr';
        } else if (input.classList.contains('work-time')) {
            fieldName = 'Work_Time_hr';
        } else if (input.classList.contains('overtime')) {
            fieldName = 'Over_Time_hr';
        } else if (input.classList.contains('mil-input')) {
            fieldName = 'Mileage';
        } else if (input.classList.contains('toll-input')) {
            fieldName = 'Toll_Amount';
        } else if (input.classList.contains('hotel-input')) {
            fieldName = 'Hotel_Amount';
        } else if (input.classList.contains('others-input')) {
            fieldName = 'Others';
        }
        
        if (fieldName && detailData[fieldName] !== null && detailData[fieldName] !== undefined) {
            if (input.type === 'date') {
                const date = new Date(detailData[fieldName]);
                if (!isNaN(date.getTime())) {
                    input.value = date.toISOString().split('T')[0];
                }
            } else if (fieldName.includes('Time_hr')) {
                input.value = detailData[fieldName] + ' hrs';
            } else if (input.classList.contains('time-display')) {
                console.log(`Raw ${fieldName} value:`, detailData[fieldName], 'Type:', typeof detailData[fieldName]);
                let timeValue = detailData[fieldName];
                if (timeValue && timeValue instanceof Date) {
                    const hours = timeValue.getHours().toString().padStart(2, '0');
                    const minutes = timeValue.getMinutes().toString().padStart(2, '0');
                    timeValue = `${hours}:${minutes}`;
                } else if (timeValue && typeof timeValue === 'string' && timeValue.includes('T')) {
      
                    const date = new Date(timeValue);

                    const hours = date.getUTCHours().toString().padStart(2, '0');
                    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
                    timeValue = `${hours}:${minutes}`;
                }
                input.value = timeValue || '--';
                console.log(`Setting ${fieldName} to:`, input.value);
            } else if (input.classList.contains('mil-input') || 
                       input.classList.contains('toll-input') || 
                       input.classList.contains('hotel-input')) {
                const numValue = parseFloat(detailData[fieldName]);
                input.value = !isNaN(numValue) ? numValue.toFixed(2) : detailData[fieldName];
            } else {
                input.value = detailData[fieldName];
            }
        }
    });
    
    const detailsCard = row.closest('.details-card');
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

    const imagePreviewContainer = detailsCard.querySelector('.image-preview-container');
    if (imagePreviewContainer) {
        imagePreviewContainer.innerHTML = '';
    }
    
    if (detailData.Image_ID && detailData.File_Name) {
        console.log('Single image found with ID:', detailData.Image_ID, 'File:', detailData.File_Name);
        populateImagePreview(detailsCard, detailData.Image_ID, detailData.File_Name);
    }
    else if (detailData.images && Array.isArray(detailData.images) && detailData.images.length > 0) {
        console.log('Multiple images found:', detailData.images.length, 'images');
        populateMultipleImagePreview(detailsCard, detailData.images);
    }
    else {
        console.log('Detail has no images');
        if (imagePreviewContainer) {
            imagePreviewContainer.innerHTML = '';
        }
    }
    
    if (detailData.File_Name || detailData.File_Size || detailData.File_Type || detailData.File_Extension) {
        populateFileDetailsCard(detailsCard, detailData);
    }
    
    if (detailData.images && Array.isArray(detailData.images) && detailData.images.length > 0) {
        populateMultipleFileDetailsCard(detailsCard, detailData.images);
    }
}

