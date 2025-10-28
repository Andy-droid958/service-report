const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];

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

    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', function(e) {
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

    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.style.backgroundColor = '#e3f2fd';
        uploadArea.style.borderColor = '#2196f3';
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.style.backgroundColor = '';
        uploadArea.style.borderColor = '';
    });

    uploadArea.addEventListener('drop', function(e) {
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

function validateFiles(files) {
    const totalFiles = getTotalFileCount();

    if (totalFiles + files.length > MAX_FILES) {
        return {
            valid: false,
            error: `Too many files. You have ${totalFiles} files already. Maximum ${MAX_FILES} files allowed total.`
        };
    }

    if (files.length > MAX_FILES) {
        return {
            valid: false,
            error: `Too many files. Maximum ${MAX_FILES} files allowed.`
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

        if (file.size > MAX_FILE_SIZE) {
            return {
                valid: false,
                error: `File "${file.name}" is too large (${formatFileSize(file.size)}). Maximum size is 50MB per file.`
            };
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
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

    return { valid: true };
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
    reader.onload = function(e) {
        try {
            imagePreview.src = e.target.result;
            imagePreview.addEventListener('click', () => {
                showImageModal(e.target.result, file.name);
            });
            console.log(`Image preview loaded: ${file.name} (${formatFileSize(file.size)})`);
        } catch (error) {
            console.error(`Error setting image source for ${file.name}:`, error);
            imagePreview.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f8d7da" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="12" text-anchor="middle" fill="%23721c24"%3EError%3C/text%3E%3C/svg%3E';
        }
    };
    reader.onerror = function(e) {
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

    removeBtn.addEventListener('click', function() {
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

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showImageModal(base64Data, filename) {
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
    modalImage.src = base64Data;
    modalImage.style.cssText = `
        max-width: 100%;
        max-height: calc(90vh - 50px);
        width: auto;
        height: auto;
        object-fit: contain;
        border-radius: 8px;
        cursor: pointer;
    `;

    const filenameDisplay = document.createElement('div');
    filenameDisplay.style.cssText = `
        color: white;
        font-size: 14px;
        margin-top: 15px;
        padding: 10px 20px;
        background-color: rgba(0, 0, 0, 0.6);
        border-radius: 4px;
        cursor: pointer;
    `;
    filenameDisplay.textContent = filename;

    modalContent.appendChild(modalImage);
    modalContent.appendChild(filenameDisplay);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    modal.addEventListener('click', function() {
        modal.remove();
    });

    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}