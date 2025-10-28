let validCustomers = [];
let selectedCustomerIndex = -1;
let initialCustomerValue = '';
let currentSuggestion = '';

function initializeCustomerAutocomplete() {
   const customerInput = document.getElementById('customer');
   const dropdown = document.getElementById('customerDropdown');

   if (!customerInput || !dropdown) return;

   initialCustomerValue = customerInput.value.trim();
   if (initialCustomerValue) {
      validCustomers = [initialCustomerValue];
   }

   let searchTimeout;

   customerInput.addEventListener('input', function () {
      const query = this.value.trim();

      clearTimeout(searchTimeout);

      if (query.length < 1) {
         hideDropdown();
         return;
      }

      searchTimeout = setTimeout(() => {
         searchCustomers(query);
      }, 300);
   });

   customerInput.addEventListener('keydown', function (e) {
      const items = dropdown.querySelectorAll('.autocomplete-item');
      const dropdownVisible = dropdown.style.display === 'block' && items.length > 0;

      if (e.key === 'ArrowDown' && dropdownVisible) {
         e.preventDefault();
         selectedCustomerIndex = Math.min(selectedCustomerIndex + 1, items.length - 1);
         updateSelection(items);
         if (selectedCustomerIndex >= 0 && items[selectedCustomerIndex]) {
            showInlineAutocomplete(items[selectedCustomerIndex].textContent);
         }
      } else if (e.key === 'ArrowUp' && dropdownVisible) {
         e.preventDefault();
         selectedCustomerIndex = Math.max(selectedCustomerIndex - 1, -1);
         updateSelection(items);
         if (selectedCustomerIndex >= 0 && items[selectedCustomerIndex]) {
            showInlineAutocomplete(items[selectedCustomerIndex].textContent);
         } else {
            clearInlineAutocomplete();
         }
      } else if (e.key === 'Enter') {
         if (currentSuggestion) {
            e.preventDefault();
            selectCustomer(currentSuggestion);
         } else if (dropdownVisible && selectedCustomerIndex >= 0 && items[selectedCustomerIndex]) {
            e.preventDefault();
            selectCustomer(items[selectedCustomerIndex].textContent);
         } else {
            e.preventDefault();
            const allFields = Array.from(document.querySelectorAll('input, select, textarea'));
            const currentIndex = allFields.indexOf(e.target);
            if (currentIndex >= 0 && currentIndex < allFields.length - 1) {
               allFields[currentIndex + 1].focus();
            }
         }
      } else if (e.key === 'Tab' || e.key === 'ArrowRight') {
         if (currentSuggestion && currentSuggestion !== customerInput.value) {
            e.preventDefault();
            selectCustomer(currentSuggestion);
         }
      } else if (e.key === 'Escape') {
         hideDropdown();
         clearInlineAutocomplete();
      }
   });

   customerInput.addEventListener('focus', function () {
      if (typeof Autocomplete !== 'undefined' && Autocomplete.instances) {
         Autocomplete.instances.forEach(instance => {
            instance.hideDropdown();
         });
      }
   });

   customerInput.addEventListener('blur', function () {
      setTimeout(() => {
         hideDropdown();
         clearInlineAutocomplete();
      }, 150);
   });

   document.addEventListener('click', function (e) {
      if (!customerInput.contains(e.target) && !dropdown.contains(e.target)) {
         hideDropdown();
      }
   });
}

async function searchCustomers(query) {
   try {
      const response = await fetch(`/api/customer/search?q=${encodeURIComponent(query)}`);
      const customers = await response.json();

      validCustomers = customers;
      displayCustomers(customers);
      
      if (customers.length > 0) {
         const firstMatch = customers[0];
         if (firstMatch.toLowerCase().startsWith(query.toLowerCase())) {
            showInlineAutocomplete(firstMatch);
         }
      }
   } catch (error) {
      console.error('Error searching customers:', error);
      hideDropdown();
   }
}

function displayCustomers(customers) {
   const dropdown = document.getElementById('customerDropdown');

   dropdown.innerHTML = '';
   selectedCustomerIndex = -1;

   if (customers.length === 0) {
      hideDropdown();
      return;
   }

   customers.forEach((customer, index) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.textContent = customer;

      item.addEventListener('click', function () {
         selectCustomer(customer);
      });

      dropdown.appendChild(item);
   });

   dropdown.style.display = 'block';
}

function updateSelection(items) {
   items.forEach((item, index) => {
      if (index === selectedCustomerIndex) {
         item.classList.add('selected');
      } else {
         item.classList.remove('selected');
      }
   });
}

function selectCustomer(customerName) {
   const customerInput = document.getElementById('customer');
   customerInput.value = customerName;
   initialCustomerValue = customerName;
   clearInlineAutocomplete();
   hideDropdown();
}

function showInlineAutocomplete(suggestion) {
   const customerInput = document.getElementById('customer');
   const query = customerInput.value;
   
   if (!suggestion || !query) {
      clearInlineAutocomplete();
      return;
   }
   
   if (suggestion.toLowerCase().startsWith(query.toLowerCase())) {
      currentSuggestion = suggestion;
      const completion = suggestion.substring(query.length);
      
      const start = customerInput.selectionStart;
      const end = customerInput.selectionEnd;
      
      customerInput.value = query + completion;
      customerInput.setSelectionRange(start, customerInput.value.length);
   }
}

function clearInlineAutocomplete() {
   currentSuggestion = '';
}

function hideDropdown() {
   const dropdown = document.getElementById('customerDropdown');
   dropdown.style.display = 'none';
   selectedCustomerIndex = -1;
}

function updateInitialCustomerValue(customerName) {
   initialCustomerValue = customerName;
   if (customerName) {
      validCustomers = [customerName];
   }
}

document.addEventListener('DOMContentLoaded', initializeCustomerAutocomplete);