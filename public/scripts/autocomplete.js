class Autocomplete {
    static instances = [];

    constructor(inputElement, options = {}) {
        this.input = inputElement;
        this.options = {
            apiEndpoint: options.apiEndpoint || '',
            minChars: options.minChars || 1,
            debounceTime: options.debounceTime || 300,
            maxResults: options.maxResults || 10,
            onSelect: options.onSelect || null,
            placeholder: options.placeholder || 'Type to search...',
            containerClass: options.containerClass || 'autocomplete-container',
            dropdownClass: options.dropdownClass || 'autocomplete-dropdown',
            getExtraParams: options.getExtraParams || null,
            enableInlineAutocomplete: options.enableInlineAutocomplete !== false
        };

        this.dropdown = null;
        this.selectedIndex = -1;
        this.searchTimeout = null;
        this.isInitialized = false;
        this.currentSuggestion = '';
        this.suggestions = [];

        this.init();
        Autocomplete.instances.push(this);
    }

    init() {
        if (this.isInitialized) return;
        if (!this.input.parentElement.classList.contains(this.options.containerClass)) {
            const container = document.createElement('div');
            container.className = this.options.containerClass;
            this.input.parentNode.insertBefore(container, this.input);
            container.appendChild(this.input);
        }
        this.dropdown = document.createElement('div');
        this.dropdown.className = this.options.dropdownClass;
        this.dropdown.style.display = 'none';
        this.input.parentElement.appendChild(this.dropdown);
        this.input.setAttribute('autocomplete', 'off');
        this.attachEventListeners();

        this.isInitialized = true;
    }

    attachEventListeners() {
        this.input.addEventListener('focus', () => {
            Autocomplete.instances.forEach(instance => {
                if (instance !== this) {
                    instance.hideDropdown();
                }
            });
        });

        this.input.addEventListener('input', (e) => {
            this.handleInput(e);
        });

        this.input.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });

        this.input.addEventListener('blur', () => {
            setTimeout(() => {
                this.hideDropdown();
                this.clearInlineAutocomplete();
            }, 150);
        });

        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target) && !this.dropdown.contains(e.target)) {
                this.hideDropdown();
            }
        });
    }

    handleInput(e) {
        const query = this.input.value.trim();

        clearTimeout(this.searchTimeout);

        if (query.length < this.options.minChars) {
            this.hideDropdown();
            return;
        }

        this.searchTimeout = setTimeout(() => {
            this.search(query);
        }, this.options.debounceTime);
    }

    handleKeydown(e) {
        const items = this.dropdown.querySelectorAll('.autocomplete-item:not(.no-results)');

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
                this.updateSelection(items);
                if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
                    this.showInlineAutocomplete(items[this.selectedIndex].textContent);
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelection(items);
                if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
                    this.showInlineAutocomplete(items[this.selectedIndex].textContent);
                } else {
                    this.clearInlineAutocomplete();
                }
                break;

            case 'Enter':
                e.preventDefault();
                if (this.currentSuggestion) {
                    this.selectItem(this.currentSuggestion);
                } else if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
                    this.selectItem(items[this.selectedIndex].textContent);
                }
                break;

            case 'Tab':
            case 'ArrowRight':
                if (this.currentSuggestion && this.currentSuggestion !== this.input.value) {
                    e.preventDefault();
                    this.selectItem(this.currentSuggestion);
                }
                break;

            case 'Escape':
                this.hideDropdown();
                this.clearInlineAutocomplete();
                break;
        }
    }

    async search(query) {
        try {
            let url = `${this.options.apiEndpoint}?q=${encodeURIComponent(query)}`;

            if (typeof this.options.getExtraParams === 'function') {
                const extraParams = this.options.getExtraParams();
                if (extraParams && typeof extraParams === 'object') {
                    Object.keys(extraParams).forEach(key => {
                        if (extraParams[key]) {
                            url += `&${key}=${encodeURIComponent(extraParams[key])}`;
                        }
                    });
                }
            }
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Search request failed');
            }

            const suggestions = await response.json();
            this.suggestions = suggestions || [];
            this.displaySuggestions(this.suggestions);
            
            if (this.options.enableInlineAutocomplete && this.suggestions.length > 0) {
                const firstMatch = this.suggestions[0];
                if (firstMatch.toLowerCase().startsWith(query.toLowerCase())) {
                    this.showInlineAutocomplete(firstMatch);
                }
            }
        } catch (error) {
            console.error('Autocomplete search error:', error);
            this.hideDropdown();
        }
    }

    displaySuggestions(suggestions) {
        this.dropdown.innerHTML = '';
        this.selectedIndex = -1;

        if (!suggestions || suggestions.length === 0) {
            this.hideDropdown();
            return;
        }

        suggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = suggestion;

            item.addEventListener('click', () => {
                this.selectItem(suggestion);
            });

            item.addEventListener('mouseenter', () => {
                this.selectedIndex = index;
                const items = this.dropdown.querySelectorAll('.autocomplete-item:not(.no-results)');
                this.updateSelection(items);
            });

            this.dropdown.appendChild(item);
        });

        this.dropdown.style.display = 'block';
    }

    updateSelection(items) {
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    selectItem(value) {
        this.input.value = value;
        this.clearInlineAutocomplete();
        this.hideDropdown();
        const event = new Event('change', { bubbles: true });
        this.input.dispatchEvent(event);
        if (typeof this.options.onSelect === 'function') {
            this.options.onSelect(value);
        }
    }

    showInlineAutocomplete(suggestion) {
        if (!this.options.enableInlineAutocomplete) return;
        
        const query = this.input.value;
        if (!suggestion || !query) {
            this.clearInlineAutocomplete();
            return;
        }
        
        if (suggestion.toLowerCase().startsWith(query.toLowerCase())) {
            this.currentSuggestion = suggestion;
            const completion = suggestion.substring(query.length);
            
            const start = this.input.selectionStart;
            const end = this.input.selectionEnd;
            
            this.input.value = query + completion;
            this.input.setSelectionRange(start, this.input.value.length);
        }
    }

    clearInlineAutocomplete() {
        this.currentSuggestion = '';
    }

    hideDropdown() {
        this.dropdown.style.display = 'none';
        this.selectedIndex = -1;
    }

    showDropdown() {
        if (this.dropdown.children.length > 0) {
            this.dropdown.style.display = 'block';
        }
    }

    destroy() {
        if (this.dropdown && this.dropdown.parentNode) {
            this.dropdown.parentNode.removeChild(this.dropdown);
        }
        this.isInitialized = false;
    }
}

function initializeTableRowAutocomplete(row) {
    const fieldMappings = [
        { selector: '.device-input:nth-child(1) input, input.device-input:nth-of-type(1)', endpoint: '/api/autocomplete/systemName' },
        { selector: '.device-input:nth-child(2) input, input.device-input:nth-of-type(2)', endpoint: '/api/autocomplete/plcHmi' },
        { selector: '.device-input:nth-child(3) input, input.device-input:nth-of-type(3)', endpoint: '/api/autocomplete/brand' },
        { selector: '.device-input:nth-child(4) input, input.device-input:nth-of-type(4)', endpoint: '/api/autocomplete/modelNumber' },
        { selector: '.device-input:nth-child(5) input, input.device-input:nth-of-type(5)', endpoint: '/api/autocomplete/remarks' }
    ];

    const getCustomerName = () => {
        const customerInput = document.getElementById('customer');
        return customerInput ? customerInput.value.trim() : '';
    };

    const inputs = row.querySelectorAll('input.table-input.device-input');
    
    inputs.forEach((input, index) => {
        if (!input.dataset.autocompleteInitialized) {
            let endpoint = '';
     
            switch(index) {
                case 0: endpoint = '/api/autocomplete/systemName'; break;
                case 1: endpoint = '/api/autocomplete/plcHmi'; break;
                case 2: endpoint = '/api/autocomplete/brand'; break;
                case 3: endpoint = '/api/autocomplete/modelNumber'; break;
                case 4: endpoint = '/api/autocomplete/remarks'; break;
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
        }
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Autocomplete, initializeTableRowAutocomplete };
}

