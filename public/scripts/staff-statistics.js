let chartInstance = null;
let currentFilter = 'weekly';
let rawStatisticsData = [];

async function toggleStatistics() {
    const statisticsSection = document.getElementById('statisticsSection');
    const btn = document.getElementById('showStatisticsBtn');
    const isShowing = statisticsSection.style.display === 'block';

    if (isShowing) {
        hideStatistics();
        btn.style.background = '#e8f5e9';
        btn.querySelector('span').textContent = 'Show Statistics';
        btn.querySelector('span').style.color = '#2e7d32';
    } else {
        await showStatistics();
        if (statisticsSection.style.display === 'block') {
            btn.style.background = '#ffebee';
            btn.querySelector('span').textContent = 'Hide Statistics';
            btn.querySelector('span').style.color = '#c62828';
        }
    }
}

async function showStatistics() {
    const statisticsSection = document.getElementById('statisticsSection');
    const loading = document.getElementById('statisticsLoading');
    const content = document.getElementById('statisticsContent');
    const selectedStaffName = document.getElementById('staffSelect').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!selectedStaffName) {
        alert('Please select a staff member first');
        return;
    }

    if (!startDate || !endDate) {
        alert('Please load the schedule first');
        return;
    }

    statisticsSection.style.display = 'block';
    loading.style.display = 'block';
    content.style.display = 'none';

    try {

        const response = await fetch(
            `/api/schedule/reports-by-date?serviceBy=${encodeURIComponent(selectedStaffName)}&startDate=${startDate}&endDate=${endDate}`
        );
        const result = await response.json();

        if (result.success && result.data) {
            rawStatisticsData = result.data;
            currentFilter = 'weekly';
            updateFilterButtons();
            displayStatistics(currentFilter);
        } else {
            alert('Failed to load statistics');
            const btn = document.getElementById('showStatisticsBtn');
            btn.style.background = '#e8f5e9';
            btn.querySelector('span').textContent = 'Show Statistics';
            btn.querySelector('span').style.color = '#2e7d32';
            hideStatistics();
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
        alert('Error loading statistics');
        const btn = document.getElementById('showStatisticsBtn');
        btn.style.background = '#e8f5e9';
        btn.querySelector('span').textContent = 'Show Statistics';
        btn.querySelector('span').style.color = '#2e7d32';
        hideStatistics();
    }
}

function updateFilterButtons() {
    document.querySelectorAll('.stats-filter-btn').forEach(btn => {
        const filter = btn.getAttribute('data-filter');
        if (filter === currentFilter) {
            btn.style.background = '#2196F3';
            btn.style.color = 'white';
            btn.style.borderColor = '#2196F3';
        } else {
            btn.style.background = 'white';
            btn.style.color = '#333';
            btn.style.borderColor = '#ddd';
        }
    });
}

function generateAllPeriods(startDate, endDate, filter) {
    const periods = {};
    const start = new Date(startDate);
    const end = new Date(endDate);

    switch(filter) {
        case 'weekly':
            let currentWeekStart = new Date(start);
            const dayOfWeek = currentWeekStart.getDay();
            const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            currentWeekStart.setDate(currentWeekStart.getDate() + diff);

            while (currentWeekStart <= end) {
                const weekYear = currentWeekStart.getFullYear();
                const firstDayOfYear = new Date(weekYear, 0, 1);
                const daysSinceFirstDay = Math.floor((currentWeekStart - firstDayOfYear) / (24 * 60 * 60 * 1000));
                const weekNumber = Math.ceil((daysSinceFirstDay + firstDayOfYear.getDay() + 1) / 7);
                const key = `${weekYear}-W${String(weekNumber).padStart(2, '0')}`;

                periods[key] = { 
                    total: 0,
                    weekStart: new Date(currentWeekStart)
                };
                currentWeekStart.setDate(currentWeekStart.getDate() + 7);
            }
            break;

        case 'monthly':
            let currentMonth = new Date(start.getFullYear(), start.getMonth(), 1);
            while (currentMonth <= end) {
                const key = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

                periods[key] = { 
                    total: 0
                };
                currentMonth.setMonth(currentMonth.getMonth() + 1);
            }
            break;

        case 'yearly':
            for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
                const key = String(year);

                periods[key] = { 
                    total: 0
                };
            }
            break;
    }

    return periods;
}

function groupDataByFilter(data, filter) {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const grouped = generateAllPeriods(startDate, endDate, filter);

    const reportSets = {};
    Object.keys(grouped).forEach(key => {
        reportSets[key] = new Set();
    });

    data.forEach(entry => {
        const date = new Date(entry.Date);
        const reportId = entry.Report_ID;

        let key;

        switch(filter) {
            case 'weekly':
                const weekYear = date.getFullYear();
                const firstDayOfYear = new Date(weekYear, 0, 1);
                const daysSinceFirstDay = Math.floor((date - firstDayOfYear) / (24 * 60 * 60 * 1000));
                const weekNumber = Math.ceil((daysSinceFirstDay + firstDayOfYear.getDay() + 1) / 7);
                key = `${weekYear}-W${String(weekNumber).padStart(2, '0')}`;
                break;
            case 'monthly':
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; 
                break;
            case 'yearly':
                key = String(date.getFullYear()); 
                break;
        }

        if (reportSets[key] && reportId) {
            reportSets[key].add(reportId);
        }
    });

    Object.keys(grouped).forEach(key => {
        grouped[key].total = reportSets[key].size;
    });

    return grouped;
}

function formatLabel(key, filter, weekStartDate) {
    switch(filter) {
        case 'weekly':
            if (weekStartDate) {
                const day = String(weekStartDate.getDate()).padStart(2, '0');
                const month = String(weekStartDate.getMonth() + 1).padStart(2, '0');
                const year = String(weekStartDate.getFullYear());
                return `${day}/${month}/${year}`;
            }
            const [weekYear, weekNum] = key.split('-W');
            return `Week ${weekNum}, ${weekYear}`;
        case 'monthly':
            const [year, month] = key.split('-');
            const monthDate = new Date(year, parseInt(month) - 1);
            return monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        case 'yearly':
            return key;
        default:
            return key;
    }
}

function displayStatistics(filter) {
    if (rawStatisticsData.length === 0) {
        const btn = document.getElementById('showStatisticsBtn');
        btn.style.background = '#e8f5e9';
        btn.querySelector('span').textContent = 'Show Statistics';
        btn.querySelector('span').style.color = '#2e7d32';
        hideStatistics();
        alert('No statistics data available');
        return;
    }

    const loading = document.getElementById('statisticsLoading');
    const content = document.getElementById('statisticsContent');

    loading.style.display = 'none';
    content.style.display = 'block';

    const grouped = groupDataByFilter(rawStatisticsData, filter);
    const sortedKeys = Object.keys(grouped).sort();
    const labels = sortedKeys.map(key => formatLabel(key, filter, grouped[key].weekStart));
    const reportValues = sortedKeys.map(key => grouped[key].total);
    const totalReports = reportValues.reduce((sum, val) => sum + val, 0);
    const chartContainer = document.getElementById('chartContainer');

    chartContainer.style.minWidth = '100%';
    chartContainer.style.width = '100%';

    if (chartInstance) {
        chartInstance.dispose();
    }

    chartInstance = echarts.init(chartContainer);

    let titleText = '';
    switch(filter) {
        case 'weekly':
            titleText = `Weekly Reports (Total: ${totalReports})`;
            break;
        case 'monthly':
            titleText = `Monthly Reports (Total: ${totalReports})`;
            break;
        case 'yearly':
            titleText = `Yearly Reports (Total: ${totalReports})`;
            break;
    }

    let titleFontSize = 14;
    if (window.innerWidth <= 480) {
        titleFontSize = 10;
    } else if (window.innerWidth <= 768) {
        titleFontSize = 11;
    } else if (window.innerWidth <= 1024) {
        titleFontSize = 12;
    }

    const option = {
        title: {
            text: titleText,
            left: 'center',
            top: 10,
            textStyle: {
                fontSize: titleFontSize,
                fontWeight: 'bold',
                color: '#333'
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function(params) {
                let result = params[0].axisValue + '<br/>';
                result += params[0].marker + 'Reports: ' + params[0].value;
                return result;
            }
        },
        dataZoom: labels.length > 10 ? [
            {
                type: 'inside',
                xAxisIndex: 0,
                start: 0,
                end: Math.min(100, (10 / labels.length) * 100),
                zoomOnMouseWheel: false,
                moveOnMouseMove: true,
                moveOnMouseWheel: true
            },
            {
                type: 'slider',
                xAxisIndex: 0,
                start: 0,
                end: Math.min(100, (10 / labels.length) * 100),
                height: 20,
                bottom: 10,
                handleIcon: 'path://M10.7,11.9H9.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4h1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z',
                handleSize: '80%',
                showDetail: false
            }
        ] : [],
        grid: {
            left: 80,
            right: 40,
            bottom: labels.length > 10 ? 50 : 20,
            top: 60,
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: labels,
            axisLabel: {
                fontSize: 11,
                interval: 0,
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            name: 'Reports',
            minInterval: 1,
            axisLabel: {
                fontSize: 12
            }
        },
        series: [
            {
                name: 'Reports',
                type: 'bar',
                data: reportValues,
                itemStyle: {
                    color: '#9C27B0'
                },
                barWidth: '50%'
            }
        ]
    };

    chartInstance.setOption(option);

    const resizeChart = () => {
        if (chartInstance) {

            let newTitleFontSize = 14;
            if (window.innerWidth <= 480) {
                newTitleFontSize = 10;
            } else if (window.innerWidth <= 768) {
                newTitleFontSize = 11;
            } else if (window.innerWidth <= 1024) {
                newTitleFontSize = 12;
            }

            chartInstance.setOption({
                title: {
                    textStyle: {
                        fontSize: newTitleFontSize
                    }
                }
            });

            chartInstance.resize();
        }
    };

    window.removeEventListener('resize', resizeChart);
    window.addEventListener('resize', resizeChart);
}

function changeFilter(filter) {
    currentFilter = filter;
    updateFilterButtons();
    displayStatistics(filter);
}

function hideStatistics() {
    const statisticsSection = document.getElementById('statisticsSection');
    statisticsSection.style.display = 'none';
    if (chartInstance) {
        chartInstance.dispose();
        chartInstance = null;
    }

    rawStatisticsData = [];
}
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('filterWeekly').addEventListener('click', () => changeFilter('weekly'));
    document.getElementById('filterMonthly').addEventListener('click', () => changeFilter('monthly'));
    document.getElementById('filterYearly').addEventListener('click', () => changeFilter('yearly'));
});