function addControlsToDetailsContainer() {
    const detailsContainer = document.getElementById('detailsContainer');
    const section4 = document.querySelector('.section-4');
    if (!section4.querySelector('.row-controls')) {
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
    
    if (typeof initializeTimeOptions === 'function') {
        const row = newCard.querySelector('.detailsTableBody tr');
        initializeTimeOptions(row);
    }
    
    if (typeof allowOnlyNumbers === 'function') {
        const numericInputs = newCard.querySelectorAll('.mil-input, .toll-input, .hotel-input');
        numericInputs.forEach(input => allowOnlyNumbers(input));
    }
    
    if (typeof initializeImageUpload === 'function') {
        initializeImageUpload(newCard);
        newCard.dataset.imageUploadInitialized = 'true';
    }
    
    if (typeof initializeTextAreaEnterSupport === 'function') {
        initializeTextAreaEnterSupport(newCard);
    }
}

function deleteLastDetailsCard() {
    const detailsContainer = document.getElementById('detailsContainer');
    const cards = detailsContainer.querySelectorAll('.details-card');
    
    if (cards.length > 1) {
        const lastCard = cards[cards.length - 1];
        const confirmed = confirm('Are you sure you want to delete the last Details card?');
        if (confirmed) {
            lastCard.remove();
        }
    } else {
        alert('Cannot delete the last remaining Details card.');
    }
}

function initializeDetailsContainer() {
    const detailsContainer = document.getElementById('detailsContainer');
    if (!detailsContainer) return;
    
    addControlsToDetailsContainer();
    
    const existingCards = detailsContainer.querySelectorAll('.details-card');
    existingCards.forEach(card => {
        if (typeof initializeImageUpload === 'function' && !card.dataset.imageUploadInitialized) {
            initializeImageUpload(card);
            card.dataset.imageUploadInitialized = 'true';
        }
        
        if (typeof initializeTextAreaEnterSupport === 'function') {
            initializeTextAreaEnterSupport(card);
        }
    });
    
    detailsContainer.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            if (e.target.tagName === 'TEXTAREA') {
                return; 
            }
            
            e.preventDefault();
            const inputs = Array.from(detailsContainer.querySelectorAll('input, select, textarea'));
            const currentIndex = inputs.indexOf(e.target);
            if (currentIndex >= 0 && currentIndex < inputs.length - 1) {
                inputs[currentIndex + 1].focus();
            }
        }
    });
    
    const section4 = document.querySelector('.section-4');
    section4.addEventListener('click', function(e) {
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

