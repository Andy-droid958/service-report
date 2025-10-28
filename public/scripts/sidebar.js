function initializeSidebar() {
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');

    if (hamburgerMenu && sidebar && sidebarOverlay) {
        hamburgerMenu.addEventListener('click', function() {
            hamburgerMenu.classList.toggle('active');
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        });

        sidebarOverlay.addEventListener('click', function() {
            hamburgerMenu.classList.remove('active');
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });

        const menuItems = document.querySelectorAll('.sidebar-menu li a');
        menuItems.forEach(item => {
            item.addEventListener('click', function() {
                hamburgerMenu.classList.remove('active');
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            });
        });
    }
}

function handleCreateReport() {
    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        location.reload();
    } else {
        window.location.href = 'index.html';
    }
}

function handleReportList() {
    window.location.href = 'report-list.html';
}

function handleStaffSchedule() {
    window.location.href = 'staff-schedule.html';
}

function highlightActivePage() {
    const currentPath = window.location.pathname;
    const createReportBtn = document.querySelector('#createReportBtn');
    const reportListBtn = document.querySelector('#reportListBtn');
    const staffScheduleBtn = document.querySelector('#staffScheduleBtn');
    const reviewReportBtn = document.querySelector('#reviewReportBtn');
    const editReportBtn = document.querySelector('#editReportBtn');
    const menuItems = document.querySelectorAll('.sidebar-menu li a');
    menuItems.forEach(item => item.classList.remove('active'));
    
    if (currentPath.includes('index.html') || currentPath.endsWith('/')) {
        if (createReportBtn) {
            createReportBtn.classList.add('active');
        }
    } else if (currentPath.includes('report-list.html')) {
        if (reportListBtn) {
            reportListBtn.classList.add('active');
        }
    } else if (currentPath.includes('staff-schedule.html')) {
        if (staffScheduleBtn) {
            staffScheduleBtn.classList.add('active');
        }
    } else if (currentPath.includes('review-report.html')) {
        if (reviewReportBtn) {
            reviewReportBtn.classList.add('active');
        }
    } else if (currentPath.includes('edit-report.html')) {
        if (editReportBtn) {
            editReportBtn.classList.add('active');
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeSidebar();
    highlightActivePage();
    
    const createReportBtn = document.getElementById('createReportBtn');
    const reportListBtn = document.getElementById('reportListBtn');
    const staffScheduleBtn = document.getElementById('staffScheduleBtn');
    
    if (createReportBtn) {
        createReportBtn.addEventListener('click', handleCreateReport);
    }
    
    if (reportListBtn) {
        reportListBtn.addEventListener('click', handleReportList);
    }
    
    if (staffScheduleBtn) {
        staffScheduleBtn.addEventListener('click', handleStaffSchedule);
    }
    
    const topbarLogo = document.querySelector('.topbar-logo');
    if (topbarLogo) {
        topbarLogo.style.cursor = 'pointer';
        topbarLogo.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            window.location.href = 'index.html';
        });
    }
});

