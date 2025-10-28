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

