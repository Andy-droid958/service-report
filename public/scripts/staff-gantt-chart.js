let ganttChartInstance = null;
let ganttScheduleData = [];
let ganttStartDate = null;
let ganttEndDate = null;

function renderGanttChart() {
    const chartContainer = document.getElementById('ganttChart');
    if (!chartContainer) return;

    if (!ganttChartInstance) {
        ganttChartInstance = echarts.init(chartContainer);

        window.addEventListener('resize', () => {
            if (ganttChartInstance) {
                ganttChartInstance.resize();
            }
        });
    }

    const dateRange = getDateRange();

    if (!dateRange.min || !dateRange.max) {
        ganttChartInstance.setOption({
            title: {
                text: 'No date range selected',
                left: 'center',
                top: 'center',
                textStyle: {
                    color: '#999',
                    fontSize: 16
                }
            }
        });
        return;
    }

    const categories = [];
    const completedData = [];
    const pendingData = [];

    const rangeStart = dateRange.min ? new Date(dateRange.min) : null;
    const rangeEnd = dateRange.max ? new Date(dateRange.max) : null;

    const projectGroups = {};

    if (ganttScheduleData && ganttScheduleData.length > 0) {
        ganttScheduleData.forEach(entry => {

            const entryDate = new Date(entry.Date);
            entryDate.setHours(0, 0, 0, 0);

            if (rangeStart && rangeEnd) {
                if (entryDate < rangeStart || entryDate > rangeEnd) {
                    return; 
                }
            }

            const projectName = entry.Project_Name || 'Unknown Project';

            if (!projectGroups[projectName]) {
                projectGroups[projectName] = [];
            }
            projectGroups[projectName].push(entry);
        });
    }

    const sortedProjects = Object.keys(projectGroups).sort();

    if (sortedProjects.length === 0) {
        categories.push('No Projects');
        completedData.push([]);
        pendingData.push([]);
    }

    sortedProjects.forEach((projectName, idx) => {
        const entries = projectGroups[projectName];
        categories.push(projectName);

        const completedBars = [];
        const pendingBars = [];

        entries.forEach(entry => {
            const workDate = new Date(entry.Date);
            workDate.setHours(0, 0, 0, 0);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isPastDate = workDate < today;

            const startTime = workDate.getTime();
            const endTime = new Date(workDate).setHours(23, 59, 59, 999);

            const barData = {
                value: [idx, startTime, endTime],
                itemStyle: {
                    color: isPastDate ? '#4caf50' : '#2196f3',
                    borderColor: '#fff',
                    borderWidth: 1
                },
                tooltip: {
                    formatter: function() {
                        const workDateStr = new Date(entry.Date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                        });

                        const color = isPastDate ? '#4caf50' : '#2196f3';
                        const status = isPastDate ? 'COMPLETED' : 'PENDING';

                        return `
                            <div style="padding: 8px; min-width: 200px;">
                                <div style="font-weight: bold; margin-bottom: 8px; color: ${color}; font-size: 14px;">
                                    ${entry.Project_Name || 'N/A'}
                                </div>
                                <div style="margin-bottom: 4px;">
                                    <strong>Date:</strong> ${workDateStr}
                                </div>
                                <div style="margin-bottom: 4px;">
                                    <strong>Customer:</strong> ${entry.Customer_Name || 'N/A'}
                                </div>
                                <div style="margin-bottom: 4px;">
                                    <strong>Report ID:</strong> ${entry.Report_ID || 'N/A'}
                                </div>
                                <div style="margin-bottom: 4px;">
                                    <strong>Out Time:</strong> ${formatTime(entry.Out_Time)}
                                </div>
                                <div style="margin-bottom: 4px;">
                                    <strong>In Time:</strong> ${formatTime(entry.In_Time)}
                                </div>
                                ${entry.Start_Time && entry.End_Time ? `
                                    <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #eee;">
                                        <div style="margin-bottom: 4px;">
                                            <strong>Job Start:</strong> ${formatTime(entry.Start_Time)}
                                        </div>
                                        <div style="margin-bottom: 4px;">
                                            <strong>Job End:</strong> ${formatTime(entry.End_Time)}
                                        </div>
                                    </div>
                                ` : ''}
                                ${entry.Job_Description ? `
                                    <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #eee;">
                                        <div style="font-size: 11px; color: #666;">Description:</div>
                                        <div style="font-size: 12px; margin-top: 2px;">${entry.Job_Description}</div>
                                    </div>
                                ` : ''}
                                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                                    <span style="display: inline-block; padding: 2px 8px; background: ${color}; color: white; border-radius: 3px; font-size: 11px;">
                                        ${status}
                                    </span>
                                </div>
                            </div>
                        `;
                    }
                }
            };

            if (isPastDate) {
                completedBars.push(barData);
            } else {
                pendingBars.push(barData);
            }
        });

        completedData.push(completedBars);
        pendingData.push(pendingBars);
    });

    const option = {
        tooltip: {
            trigger: 'item',
            confine: true,
            extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 8px;'
        },
        dataZoom: [
            {
                type: 'slider',
                xAxisIndex: 0,
                filterMode: 'weakFilter',
                height: 20,
                bottom: 10,
                start: 0,
                end: 100,
                handleIcon: 'path://M10.7,11.9H9.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4h1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z',
                handleSize: '80%',
                showDetail: false
            },
            {
                type: 'inside',
                xAxisIndex: 0,
                filterMode: 'weakFilter'
            }
        ],
        grid: {
            left: '15%',
            right: '15%',
            top: window.innerWidth <= 768 ? 100 : 80,
            bottom: window.innerWidth <= 768 ? 60 : 50,
            containLabel: true
        },
        xAxis: {
            type: 'time',
            position: 'top',
            min: dateRange.min.getTime(),
            max: dateRange.max.getTime(),
            interval: 3600 * 1000 * 24,
            splitLine: {
                show: true,
                interval: 'auto',
                lineStyle: {
                    color: '#e0e0e0',
                    type: 'dashed',
                    width: 1
                }
            },
            axisLine: {
                show: true,
                lineStyle: {
                    color: '#999',
                    width: 2
                }
            },
            axisLabel: {
                show: true,
                interval: 'auto',
                formatter: function (value) {
                    const date = new Date(value);
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    return `${day}/${month}/${year}`;
                },
                fontSize: 11,
                color: '#666',
                rotate: window.innerWidth <= 768 ? 45 : 0,
                hideOverlap: true,
                showMinLabel: true,
                showMaxLabel: true
            },
            axisTick: {
                show: true,
                interval: 'auto',
                alignWithLabel: true
            },
            minInterval: 3600 * 1000 * 24
        },
        yAxis: {
            type: 'category',
            data: categories,
            inverse: false,
            axisLine: {
                lineStyle: {
                    color: '#999',
                    width: 2
                }
            },
            axisTick: {
                show: false
            },
            axisLabel: {
                fontSize: 12,
                color: '#333',
                fontWeight: 500,
                formatter: function(value) {
                    return value.length > 30 ? value.substring(0, 30) + '...' : value;
                }
            },
            splitLine: {
                show: true,
                lineStyle: {
                    color: '#f0f0f0',
                    type: 'solid'
                }
            }
        },
        series: [
            {
                name: 'Completed',
                type: 'custom',
                renderItem: renderGanttBar,
                encode: {
                    x: [1, 2],
                    y: 0
                },
                data: completedData.flat(),
                z: 2
            },
            {
                name: 'Pending',
                type: 'custom',
                renderItem: renderGanttBar,
                encode: {
                    x: [1, 2],
                    y: 0
                },
                data: pendingData.flat(),
                z: 2
            }
        ]
    };

    ganttChartInstance.setOption(option, true);
}

function renderGanttBar(params, api) {
    const categoryIndex = api.value(0);
    const start = api.coord([api.value(1), categoryIndex]);
    const end = api.coord([api.value(2), categoryIndex]);
    const height = api.size([0, 1])[1] * 0.6;

    const rectShape = echarts.graphic.clipRectByRect({
        x: start[0],
        y: start[1] - height / 2,
        width: Math.max(end[0] - start[0], 1),
        height: height
    }, {
        x: params.coordSys.x,
        y: params.coordSys.y,
        width: params.coordSys.width,
        height: params.coordSys.height
    });

    return rectShape && {
        type: 'rect',
        transition: ['shape'],
        shape: rectShape,
        style: api.style({
            fill: api.visual('color'),
            stroke: '#fff',
            lineWidth: 1
        })
    };
}

function formatTime(timeValue) {
    if (!timeValue) return 'N/A';

    if (timeValue.includes('T') || timeValue.includes(' ')) {
        const timePart = timeValue.split('T')[1] || timeValue.split(' ')[1];
        if (timePart) {
            return timePart.substring(0, 5); 
        }
    }

    if (timeValue.includes(':')) {
        return timeValue.substring(0, 5);
    }

    return timeValue;
}

function getDateRange() {
    if (!ganttStartDate || !ganttEndDate) {
        return {
            min: null,
            max: null
        };
    }

    const minDate = new Date(ganttStartDate);
    minDate.setHours(0, 0, 0, 0);

    const maxDate = new Date(ganttEndDate);
    maxDate.setHours(23, 59, 59, 999);

    return {
        min: minDate,
        max: maxDate
    };
}

window.updateGanttData = function(scheduleData, startDate, endDate) {
    ganttScheduleData = scheduleData || [];
    ganttStartDate = startDate;
    ganttEndDate = endDate;

    console.log('Gantt chart updated with:', {
        dataLength: ganttScheduleData.length,
        startDate: ganttStartDate,
        endDate: ganttEndDate
    });

    if (document.getElementById('chartViewContainer').style.display !== 'none') {
        renderGanttChart();
    }
};

window.renderGanttChart = renderGanttChart;