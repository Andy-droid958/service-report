function addDeviceControlsToTable() {
    const section = document.querySelector('.section-device');
    if (section && !section.querySelector('.row-controls')) {
        const controls = document.createElement('div');
        controls.className = 'row-controls';
        controls.innerHTML = `
            <button type="button" id="addDeviceRow" class="row-control-btn add-btn" title="Add Device Row">+</button>
            <button type="button" id="removeDeviceRow" class="row-control-btn delete-btn" title="Remove Device Row">×</button>
        `;
        const table = section.querySelector('.device-table');
        table.insertAdjacentElement('afterend', controls);
    }
}

function addNewDeviceRow(referenceRow) {
    const tbody = document.getElementById('deviceTableBody');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td>
            <div class="autocomplete-container">
                <input type="text" class="table-input device-input" placeholder="Enter name" autocomplete="off">
                <div class="autocomplete-dropdown"></div>
            </div>
        </td>
        <td>
            <div class="autocomplete-container">
                <input type="text" class="table-input device-input" placeholder="Enter PLC/HMI" autocomplete="off">
                <div class="autocomplete-dropdown"></div>
            </div>
        </td>
        <td>
            <div class="autocomplete-container">
                <input type="text" class="table-input device-input" placeholder="Enter brand" autocomplete="off">
                <div class="autocomplete-dropdown"></div>
            </div>
        </td>
        <td>
            <div class="autocomplete-container">
                <input type="text" class="table-input device-input" placeholder="Enter model number" autocomplete="off">
                <div class="autocomplete-dropdown"></div>
            </div>
        </td>
        <td>
            <div class="autocomplete-container">
                <input type="text" class="table-input device-input" placeholder="Enter remarks" autocomplete="off">
                <div class="autocomplete-dropdown"></div>
            </div>
        </td>
    `;
    
    tbody.appendChild(newRow);
}

function deleteDeviceRow(row) {
    const tbody = document.getElementById('deviceTableBody');
    const rows = tbody.querySelectorAll('tr');
    
    if (rows.length > 1) {
        const confirmed = confirm('Are you sure you want to delete the last row?');
        if (confirmed) {
            row.remove();
        }
    } else {
        alert('Cannot delete the last remaining device row.');
    }
}

function initializeDeviceTable() {
    const deviceTableBody = document.getElementById('deviceTableBody');
    if (!deviceTableBody) return;
    
    addDeviceControlsToTable();
    
    const sectionDevice = document.querySelector('.section-device');
    sectionDevice.addEventListener('click', function(e) {
        if (e.target.id === 'addDeviceRow') {
            e.preventDefault();
            e.stopPropagation();
            const tbody = document.getElementById('deviceTableBody');
            const lastRow = tbody.lastElementChild;
            addNewDeviceRow(lastRow);
        } else if (e.target.id === 'removeDeviceRow') {
            e.preventDefault();
            e.stopPropagation();
            const tbody = document.getElementById('deviceTableBody');
            const lastRow = tbody.lastElementChild;
            deleteDeviceRow(lastRow);
        }
    });
    
    const deviceTable = document.querySelector('.device-table');
    if (deviceTable) {
        deviceTable.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
                e.preventDefault();
                const allInputs = Array.from(deviceTable.querySelectorAll('input'));
                const currentIndex = allInputs.indexOf(e.target);
                if (currentIndex >= 0 && currentIndex < allInputs.length - 1) {
                    allInputs[currentIndex + 1].focus();
                }
            }
        });
    }
}

