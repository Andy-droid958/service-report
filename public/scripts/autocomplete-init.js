document.addEventListener('DOMContentLoaded', function() {
    initializeSection1Autocomplete();
    initializeSiteInformationAutocomplete();
    observeSiteInformationTableChanges();
    initializeCustomerChangeListener();
});

function initializeSection1Autocomplete() {
    const getCustomerName = () => {
        const customerInput = document.getElementById('customer');
        return customerInput ? customerInput.value.trim() : '';
    };

    const attnInput = document.getElementById('attn');
    if (attnInput) {
        new Autocomplete(attnInput, {
            apiEndpoint: '/api/autocomplete/attn',
            minChars: 1,
            debounceTime: 300,
            getExtraParams: () => ({ customer: getCustomerName() }),
            enableInlineAutocomplete: true
        });
    }

    const projectNameInput = document.getElementById('projectName');
    if (projectNameInput) {
        new Autocomplete(projectNameInput, {
            apiEndpoint: '/api/autocomplete/projectName',
            minChars: 1,
            debounceTime: 300,
            getExtraParams: () => ({ customer: getCustomerName() }),
            enableInlineAutocomplete: true
        });
    }

    const yourRefInput = document.getElementById('yourRef');
    if (yourRefInput) {
        new Autocomplete(yourRefInput, {
            apiEndpoint: '/api/autocomplete/yourRef',
            minChars: 1,
            debounceTime: 300,
            getExtraParams: () => ({ customer: getCustomerName() }),
            enableInlineAutocomplete: true
        });
    }

    const serviceByInput = document.getElementById('serviceBy');
    if (serviceByInput) {
        new Autocomplete(serviceByInput, {
            apiEndpoint: '/api/autocomplete/serviceBy',
            minChars: 1,
            debounceTime: 300,
            getExtraParams: () => ({ customer: getCustomerName() }),
            enableInlineAutocomplete: true
        });
    }
}

function initializeSiteInformationAutocomplete() {
    const deviceTableBody = document.getElementById('deviceTableBody');

    if (!deviceTableBody) return;

    const rows = deviceTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        initializeRowAutocomplete(row);
    });
}

function initializeRowAutocomplete(row) {
    const getCustomerName = () => {
        const customerInput = document.getElementById('customer');
        return customerInput ? customerInput.value.trim() : '';
    };

    const inputs = row.querySelectorAll('input.table-input.device-input');

    inputs.forEach((input, index) => {

        if (input.dataset.autocompleteInitialized === 'true') {
            return;
        }

        let endpoint = '';

        switch(index) {
            case 0: 
                endpoint = '/api/autocomplete/systemName';
                break;
            case 1: 
                endpoint = '/api/autocomplete/plcHmi';
                break;
            case 2: 
                endpoint = '/api/autocomplete/brand';
                break;
            case 3: 
                endpoint = '/api/autocomplete/modelNumber';
                break;
            case 4: 
                endpoint = '/api/autocomplete/remarks';
                break;
        }

        if (endpoint) {
            new Autocomplete(input, {
                apiEndpoint: endpoint,
                minChars: 1,
                debounceTime: 300,
                getExtraParams: () => ({ customer: getCustomerName() }),
                enableInlineAutocomplete: true
            });
            input.dataset.autocompleteInitialized = 'true';
        }
    });
}

function observeSiteInformationTableChanges() {
    const deviceTableBody = document.getElementById('deviceTableBody');

    if (!deviceTableBody) return;

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {

                    if (node.nodeName === 'TR') {
                        initializeRowAutocomplete(node);
                    }
                });
            }
        });
    });

    observer.observe(deviceTableBody, {
        childList: true,
        subtree: false
    });
}

window.initializeSiteInfoRowAutocomplete = function(row) {
    if (row && row.nodeName === 'TR') {
        initializeRowAutocomplete(row);
    }
};

function initializeCustomerChangeListener() {
    const customerInput = document.getElementById('customer');
    
    if (!customerInput) return;

    customerInput.addEventListener('change', function() {
        console.log('Customer changed to:', this.value);
    });
}