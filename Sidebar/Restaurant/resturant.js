document.addEventListener('DOMContentLoaded', function() {
    const displayBtn = document.getElementById('displayProfessorsBtn');
    const tableContainer = document.getElementById('professorsTableContainer');
    const searchInput = document.getElementById('professorSearch');
    const searchBtn = document.getElementById('searchBtn');
    const autocompleteResults = document.getElementById('autocompleteResults');
    
    let tableLoaded = false;
    let isVisible = false;
    let allProfessors = []; // Store all professors data
    let currentFocus = -1; // Track keyboard navigation in autocomplete

// Toggle sidebar function
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.style.width === "250px") {
        sidebar.style.width = "0";
    } else {
        sidebar.style.width = "250px";
    }
}

// Initialize sidebar toggle
if (document.getElementById('menuToggle')) {
    document.getElementById('menuToggle').addEventListener('click', toggleSidebar);
}
// Initialize close button
if (document.querySelector('.close-btn')) {
    document.querySelector('.close-btn').addEventListener('click', function() {
        const sidebar = document.getElementById('sidebar');
        sidebar.style.width = "0";
    });
}

    // Function to load professors data
    function loadProfessorsData() {
        return fetch('resturant.xlsx')
            .then(res => res.arrayBuffer())
            .then(data => {
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                
                // Store all professors data
                allProfessors = rows.slice(1).filter(row => row[0] && row[1]);
                tableLoaded = true;
                
                return allProfessors;
            });
    }

    // Function to display professors based on filtered data
    function displayProfessors(professors) {
        let html = '<table><tr><th>Name</th><th>Location</th></tr>';
        
        if (professors.length === 0) {
            html += '<tr><td colspan="2">No resturants found</td></tr>';
        } else {
            professors.forEach(row => {
                const [name, location] = row;
                html += `<tr><td>${name}</td><td>${location}</td></tr>`;
            });
        }
        
        html += '</table>';
        tableContainer.innerHTML = html;
    }

    // Show all professors button - COMPLETELY INDEPENDENT OF SEARCH
    if (displayBtn) {
        displayBtn.addEventListener('click', function(event) {
            event.stopPropagation();
            
            // Show loading indicator
            tableContainer.innerHTML = '<p>Loading resturants...</p>';
            tableContainer.classList.remove('fade-out');
            tableContainer.classList.add('fade-in');
            tableContainer.style.display = 'block';
            isVisible = true;
            
            // Always load fresh data from Excel
            if (!tableLoaded) {
                loadProfessorsData().then(professors => {
                    displayProfessors(professors);
                });
            } else {
                // Use cached data if already loaded
                displayProfessors(allProfessors);
            }
        });
    }

    // Search functionality - only triggered by button or Enter key
    function searchProfessors() {
        // Show loading indicator
        tableContainer.innerHTML = '<p>Searching...</p>';
        tableContainer.classList.remove('fade-out');
        tableContainer.classList.add('fade-in');
        tableContainer.style.display = 'block';
        isVisible = true;
        
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        // Load data if not already loaded
        const dataPromise = !tableLoaded ? 
            loadProfessorsData() : 
            Promise.resolve(allProfessors);
        
        dataPromise.then(professors => {
            if (searchTerm === '') {
                displayProfessors(professors);
            } else {
                const filteredProfessors = professors.filter(row => {
                    const name = String(row[0]).toLowerCase();
                    return name.includes(searchTerm);
                });
                
                displayProfessors(filteredProfessors);
            }
        });
        
        // Close autocomplete
        closeAutocomplete();
    }

    // Google-like autocomplete functionality
    function showAutocomplete(input) {
        if (!autocompleteResults) return;
        
        const val = input.value.trim().toLowerCase();
        
        // Close any already open lists
        closeAutocomplete();
        
        if (!val) return false;
        
        // If data not loaded, load it first
        if (!tableLoaded) {
            loadProfessorsData().then(() => {
                showAutocomplete(input);
            });
            return;
        }
        
        // Find matching professors - ONLY those STARTING with the search term
        const matches = allProfessors
            .filter(row => {
                const name = String(row[0]).toLowerCase();
                
                // Extract first name (assuming format is "Title FirstName LastName" or "FirstName LastName")
                let firstName = name;
                
                // Remove title if present (Dr., Prof., etc.)
                if (firstName.startsWith('dr.') || firstName.startsWith('prof.')) {
                    firstName = firstName.split(' ').slice(1).join(' ');
                }
                
                // Get the first word which should be the first name
                firstName = firstName.split(' ')[0];
                
                // Only match if the first name STARTS with the search term
                return firstName.startsWith(val);
            })
            .map(row => row[0])
            .slice(0, 5); // Limit to top 5 matches
        
        if (matches.length === 0) {
            return;
        }
        
        // Create a DIV element that will contain the autocomplete items
        autocompleteResults.style.display = "block";
        
        matches.forEach((match, index) => {
            // Create a DIV element for each matching element
            const item = document.createElement("DIV");
            item.setAttribute("class", "autocomplete-item");
            
            // Add search icon
            const icon = document.createElement("I");
            icon.innerHTML = "🔍";
            item.appendChild(icon);
            
            // Add suggestion text with highlighting
            const text = document.createElement("SPAN");
            text.className = "suggestion-text";
            
            // Extract first name for highlighting
            let displayName = match;
            let firstName = displayName;
            
            // Remove title if present
            if (firstName.toLowerCase().startsWith('dr.') || firstName.toLowerCase().startsWith('prof.')) {
                firstName = firstName.split(' ').slice(1).join(' ');
            }
            
            // Get first word as first name
            firstName = firstName.split(' ')[0];
            
            // Highlight the matching part (start of first name)
            const matchPos = displayName.toLowerCase().indexOf(firstName.toLowerCase());
            if (matchPos >= 0) {
                // Highlight just the matching part at the beginning of the first name
                const highlightEnd = matchPos + val.length;
                text.innerHTML = displayName.substring(0, matchPos);
                text.innerHTML += "<strong>" + displayName.substring(matchPos, highlightEnd) + "</strong>";
                text.innerHTML += displayName.substring(highlightEnd);
            } else {
                text.textContent = displayName;
            }
            
            item.appendChild(text);
            
            // Store the full name value
            const hiddenInput = document.createElement("INPUT");
            hiddenInput.type = "hidden";
            hiddenInput.value = match;
            item.appendChild(hiddenInput);
            
            // Execute a function when someone clicks on an item value
            item.addEventListener("click", function(e) {
                // Insert the value into the input field
                input.value = this.querySelector("input[type='hidden']").value;
                
                // Close the autocomplete list
                closeAutocomplete();
                
                // Perform search with the selected name
                searchProfessors();
                
                // Prevent the click from propagating
                e.stopPropagation();
            });
            
            autocompleteResults.appendChild(item);
        });
    }

    // Close the autocomplete dropdown
    function closeAutocomplete() {
        if (autocompleteResults) {
            autocompleteResults.innerHTML = "";
            autocompleteResults.style.display = "none";
            currentFocus = -1;
        }
    }

    // Keyboard navigation for autocomplete
    function navigateAutocomplete(e) {
        if (!autocompleteResults) return;
        
        let items = autocompleteResults.getElementsByClassName("autocomplete-item");
        if (!items.length) return;
        
        // Arrow DOWN key
        if (e.keyCode === 40) {
            currentFocus++;
            addActive(items);
        } 
        // Arrow UP key
        else if (e.keyCode === 38) {
            currentFocus--;
            addActive(items);
        } 
        // ENTER key
        else if (e.keyCode === 13) {
            e.preventDefault();
            if (currentFocus > -1) {
                // Simulate a click on the "active" item
                if (items[currentFocus]) {
                    items[currentFocus].click();
                }
            } else {
                // If no item is selected, perform search with current input
                searchProfessors();
            }
        }
    }

    // Add "active" class to autocomplete item
    function addActive(items) {
        if (!items) return false;
        
        // Remove "active" class from all items
        for (let i = 0; i < items.length; i++) {
            items[i].classList.remove("active");
        }
        
        // Adjust currentFocus if out of bounds
        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (items.length - 1);
        
        // Add "active" class to current item
        items[currentFocus].classList.add("active");
    }

    // Add event listeners for search and autocomplete
    if (searchBtn) {
        searchBtn.addEventListener('click', function(event) {
            event.stopPropagation();
            searchProfessors();
        });
    }

    if (searchInput) {
        // Input event for autocomplete ONLY
        searchInput.addEventListener('input', function() {
            showAutocomplete(this);
        });
        
        // Keyboard navigation
        searchInput.addEventListener('keydown', navigateAutocomplete);
        
        // Enter key for search
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                searchProfessors();
            }
        });
    }

    // Click outside closes autocomplete
    document.addEventListener("click", function(e) {
        if (searchInput && e.target !== searchInput && autocompleteResults) {
            closeAutocomplete();
        }
    });

    // Hide with fade-out on click anywhere else
    document.addEventListener('click', function(event) {
        if (
            isVisible &&
            !event.target.closest('#displayProfessorsBtn') &&
            !event.target.closest('#searchBtn') &&
            !event.target.closest('#professorSearch') &&
            !event.target.closest('#professorsTableContainer')
        ) {
            tableContainer.classList.remove('fade-in');
            tableContainer.classList.add('fade-out');
            isVisible = false;
        }
    });

    // After fade-out transition, hide the table
    if (tableContainer) {
        tableContainer.addEventListener('transitionend', function(e) {
            if (!isVisible && tableContainer.classList.contains('fade-out')) {
                tableContainer.style.display = 'none';
            }
        });
    }
});
