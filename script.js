/* Copyright © 2025 George Anton. All Rights Reserved.
   Authorized use only for Egypt-Japan University of Science and Technology. */
/* Updated script.js */
document.getElementById("menuToggle").addEventListener("click", toggleSidebar);

document.addEventListener("click", function(event) {
    let sidebar = document.getElementById("sidebar");
    let menuButton = document.getElementById("menuToggle");
    if (!sidebar.contains(event.target) && event.target !== menuButton) {
        closeSidebar();
    }
});

function toggleSidebar() {
    let sidebar = document.getElementById("sidebar");
    if (sidebar.style.width === "250px") {
        sidebar.style.width = "0";
    } else {
        sidebar.style.width = "250px";
    }
}

function closeSidebar() {
    document.getElementById("sidebar").style.width = "0";
}

function navigateTo(section) {
    let pages = {
        'map': 'map.html',
        'professors': 'professors.html',
        'labs': 'labs.html',
        'restaurants': 'restaurants.html'
    };
    
    if (pages[section]) {
        window.location.href = pages[section];
    }
}