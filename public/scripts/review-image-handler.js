function populateImagePreview(detailsCard, imageId, fileName) {
    const imagePreviewContainer = detailsCard.querySelector('.image-preview-container');
    if (!imagePreviewContainer) {
        console.error('Image preview container not found');
        return;
    }
    
    try {
        const imageElement = document.createElement('img');
        imageElement.src = `/api/reports/image/${imageId}`;
        imageElement.style.cssText = `
            max-width: 100px;
            max-height: 100px;
            object-fit: cover;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin: 5px;
            cursor: pointer;
        `;
        
        imageElement.addEventListener('click', () => {
            console.log('Clicking single image:', fileName || 'Image');
            showImageModalByUrl(`/api/reports/image/${imageId}`, fileName || 'Image');
        });
        
        imageElement.onerror = function() {
            console.error('Failed to load image:', fileName || imageId);
            this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f8d7da" width="100" height="100"/%3E%3Ctext x="50" y="45" font-size="12" text-anchor="middle" fill="%23721c24"%3EImage%3C/text%3E%3Ctext x="50" y="60" font-size="12" text-anchor="middle" fill="%23721c24"%3ENot Found%3C/text%3E%3C/svg%3E';
            this.style.border = '2px solid #f5c6cb';
            this.title = `Image not found: ${fileName || 'Unknown'} (ID: ${imageId})`;
            this.style.cursor = 'not-allowed';
        };
        
        imagePreviewContainer.innerHTML = '';
        imagePreviewContainer.appendChild(imageElement);
        
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

    console.log('Populating multiple images (server fetch method):', imagesArray.length);
    imagePreviewContainer.innerHTML = '';

    const imagesWrapper = document.createElement('div');
    imagesWrapper.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        max-width: 100%;
    `;

    imagesArray.forEach((imageData, index) => {
        try {
            if (!imageData || !imageData.Image_ID) {
                console.error(`Image ${index + 1} missing Image_ID field`, imageData);
                return;
            }

            const imageId = imageData.Image_ID;
            const fileName = imageData.File_Name || `Image ${index + 1}`;
            const imageUrl = `/api/reports/image/${imageId}`;

            const imageElement = document.createElement('img');
            imageElement.src = imageUrl;
            imageElement.alt = fileName;
            imageElement.title = fileName;
            imageElement.style.cssText = `
                max-width: 100px;
                max-height: 100px;
                object-fit: cover;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin: 2px;
                cursor: pointer;
            `;

            imageElement.addEventListener('click', () => {
                console.log(`Clicking image ${index + 1}:`, fileName);
                showImageModalByUrl(imageUrl, fileName);
            });

            imageElement.onerror = function () {
                console.error(`Failed to load image ${index + 1}:`, fileName, 'Image_ID:', imageData.Image_ID);
                this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f8d7da" width="100" height="100"/%3E%3Ctext x="50" y="45" font-size="12" text-anchor="middle" fill="%23721c24"%3EImage%3C/text%3E%3Ctext x="50" y="60" font-size="12" text-anchor="middle" fill="%23721c24"%3ENot Found%3C/text%3E%3C/svg%3E';
                this.style.border = '2px solid #f5c6cb';
                this.title = `Image not found: ${fileName} (ID: ${imageData.Image_ID})`;
                this.style.cursor = 'not-allowed';
            };

            imagesWrapper.appendChild(imageElement);
            console.log(`Image ${index + 1} preview added successfully:`, imageUrl);
        } catch (error) {
            console.error(`Error processing image ${index + 1}:`, error);
        }
    });

    imagePreviewContainer.appendChild(imagesWrapper);
    console.log('All multiple image previews populated successfully.');
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
    
    modalImage.onerror = function() {
        console.error('Failed to load image in modal:', filename);
        modalContent.innerHTML = `
            <div style="color: white; text-align: center; padding: 20px;">
                <h3>Unable to display image</h3>
                <p>File: ${filename}</p>
                <p>The image data appears to be corrupted or invalid.</p>
            </div>
        `;
    };
    
    modalImage.onload = function() {
        console.log('Successfully loaded image in modal:', filename);
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

function populateFileDetailsCard(detailsCard, detailData) {
    const imagePreviewContainer = detailsCard.querySelector('.image-preview-container');
    if (!imagePreviewContainer) {
        console.error('Image preview container not found');
        return;
    }
    
    const fileDetailCard = document.createElement('div');
    fileDetailCard.className = 'file-detail-card';
    
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
    removeBtn.style.pointerEvents = 'none';
    removeBtn.style.opacity = '0.5';
    removeBtn.style.cursor = 'not-allowed';
    fileDetailCard.appendChild(removeBtn);
    
    imagePreviewContainer.appendChild(fileDetailCard);
    
    console.log('File details card populated successfully');
}

function populateMultipleFileDetailsCard(detailsCard, imagesArray) {
    const imagePreviewContainer = detailsCard.querySelector('.image-preview-container');
    if (!imagePreviewContainer) {
        console.error('Image preview container not found');
        return;
    }
    
    console.log('Populating multiple file details cards for:', imagesArray.length, 'images');
    
    const fileDetailsContainer = document.createElement('div');
    fileDetailsContainer.className = 'multiple-file-details-container';
    fileDetailsContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 5px;
        margin-top: 10px;
        max-width: 100%;
    `;
    
    imagesArray.forEach((imageData, index) => {
        const fileDetailCard = document.createElement('div');
        fileDetailCard.className = 'file-detail-card';
        fileDetailCard.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            margin: 2px 0;
        `;
        
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-detail-info';
        fileInfo.style.cssText = `
            display: flex;
            flex-direction: column;
            flex: 1;
        `;
        
        const fileName = document.createElement('div');
        fileName.className = 'file-detail-name';
        fileName.textContent = imageData.File_Name || `Image ${index + 1}`;
        fileName.style.cssText = `
            font-weight: 500;
            color: #333;
            margin-bottom: 2px;
        `;
        
        const fileSize = document.createElement('div');
        fileSize.className = 'file-detail-size';
        fileSize.textContent = imageData.File_Size ? formatFileSize(imageData.File_Size) : 'Unknown size';
        fileSize.style.cssText = `
            font-size: 12px;
            color: #666;
        `;
        
        fileInfo.appendChild(fileName);
        fileInfo.appendChild(fileSize);
        fileDetailCard.appendChild(fileInfo);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'file-detail-remove';
        removeBtn.innerHTML = '×';
        removeBtn.type = 'button';
        removeBtn.style.pointerEvents = 'none';
        removeBtn.style.opacity = '0.5';
        removeBtn.style.cursor = 'not-allowed';
        fileDetailCard.appendChild(removeBtn);
        
        fileDetailsContainer.appendChild(fileDetailCard);
        console.log(`File details card ${index + 1} created for:`, imageData.File_Name || `Image ${index + 1}`);
    });
    
    imagePreviewContainer.appendChild(fileDetailsContainer);
    console.log('Multiple file details cards populated successfully');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

