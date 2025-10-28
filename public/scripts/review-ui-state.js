function makeFormReadOnly() {
    const form = document.getElementById('serviceReportForm');
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        input.readOnly = true;
        input.disabled = true;
    });
    
    const radioButtons = form.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
        radio.disabled = true;
    });
    
    const imageUploadAreas = form.querySelectorAll('.image-upload-area');
    imageUploadAreas.forEach(area => {
        area.style.pointerEvents = 'none';
        area.style.opacity = '0.6';
        area.style.cursor = 'not-allowed';
    });
    
    const imageUploadInputs = form.querySelectorAll('.image-upload-input');
    imageUploadInputs.forEach(input => {
        input.disabled = true;
        input.style.display = 'none';
    });
}

function showError(message) {
    const form = document.getElementById('serviceReportForm');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        background-color: #f8d7da;
        color: #721c24;
        padding: 15px;
        margin: 20px;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        text-align: center;
    `;
    errorDiv.textContent = message;
    form.insertBefore(errorDiv, form.firstChild);
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

