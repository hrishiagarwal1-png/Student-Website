// Common utilities — nav highlighting only
// Legacy save/load (shp_*) removed: all data goes through appData

// Initialize app on load
document.addEventListener('DOMContentLoaded', function() {
    // Set active nav item based on page
    const path = window.location.pathname;
    document.querySelectorAll('.nav-item').forEach(item => {
        const link = item.querySelector('.nav-link');
        if (link && link.href.includes(path.split('/').pop())) {
            item.classList.add('active');
        }
    });
});