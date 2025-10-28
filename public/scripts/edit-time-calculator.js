function formatTimeForSelect(timeValue) {
    if (!timeValue) return '';
    
    if (timeValue instanceof Date || (typeof timeValue === 'string' && timeValue.includes('T'))) {
        try {
            const date = new Date(timeValue);
            if (!isNaN(date.getTime())) {
                const hours = date.getUTCHours().toString().padStart(2, '0');
                const minutes = date.getUTCMinutes().toString().padStart(2, '0');
                return `${hours}:${minutes}`;
            }
        } catch (error) {
            console.warn('Could not parse datetime:', timeValue);
        }
    }
    
    if (typeof timeValue === 'string') {
        if (/^\d{2}:\d{2}$/.test(timeValue)) {
            return timeValue;
        }
        
        if (/^\d{2}:\d{2}:\d{2}$/.test(timeValue)) {
            return timeValue.substring(0, 5);
        }

        if (/^\d{1}:\d{2}$/.test(timeValue)) {
            return '0' + timeValue;
    }
    
    try {
            const date = new Date('2000-01-01 ' + timeValue);
        if (!isNaN(date.getTime())) {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        }
        } catch (error) {
            console.warn('Could not parse time string:', timeValue);
        }
    }
    
    return '';
}

function generateTimeOptionsForRow(row) {
    const timeSelects = row.querySelectorAll('.time-select');
    console.log('Generating time options for row, found', timeSelects.length, 'time selects');
    
    timeSelects.forEach((select, index) => {
        console.log('Generating options for time select', index, ':', select);
        select.innerHTML = '<option value="">--</option>';
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const option = document.createElement('option');
                option.value = timeString;
                option.textContent = timeString;
                select.appendChild(option);
            }
        }
        console.log('Generated', select.options.length, 'options for time select', index);
    });
}

function initializeTimeOptions(row) {
    generateTimeOptionsForRow(row);
    const timeSelects = row.querySelectorAll('.time-select');
    timeSelects.forEach(select => {
        select.addEventListener('change', function() {
            calculateRowTimes(row);
        });
    });
}

function addTimeCalculationListeners(row) {
    const timeSelects = row.querySelectorAll('.time-select');
    console.log('Adding time calculation listeners to row, found', timeSelects.length, 'time selects');
    
    timeSelects.forEach((select, index) => {
        console.log('Adding listener to time select', index, ':', select);
        select.addEventListener('change', () => {
            console.log('Time select changed, calling calculateRowTimes');
            calculateRowTimes(row);
        });
    });
}

function calculateRowTimes(row) {
    console.log('calculateRowTimes called for row:', row);
    
    const outTimeRaw = row.querySelector('[data-type="out-time"]').value;
    const startTimeRaw = row.querySelector('[data-type="start-time"]').value;
    const endTimeRaw = row.querySelector('[data-type="end-time"]').value;
    const inTimeRaw = row.querySelector('[data-type="in-time"]').value;
    const outTime = outTimeRaw && outTimeRaw !== '--' ? outTimeRaw : null;
    const startTime = startTimeRaw && startTimeRaw !== '--' ? startTimeRaw : null;
    const endTime = endTimeRaw && endTimeRaw !== '--' ? endTimeRaw : null;
    const inTime = inTimeRaw && inTimeRaw !== '--' ? inTimeRaw : null;
    
    console.log('Calculating times for row:', {
        outTime: outTime,
        startTime: startTime,
        endTime: endTime,
        inTime: inTime
    });

    let travelTime = 0;
    if (outTime && startTime) {
        travelTime += calculateTimeDifference(outTime, startTime);
    }
    if (endTime && inTime) {
        travelTime += calculateTimeDifference(endTime, inTime);
    }
    
    // Calculate Work Time: end time - start time
    const workTime = (startTime && endTime) ? calculateTimeDifference(startTime, endTime) : 0;
    
    // Calculate Overtime: if end time > 18:00, then (end time - 18:00)
    let overtime = 0;
    if (endTime) {
        const endTimeObj = new Date(`2000-01-01T${endTime}:00`);
        const normalEndTime = new Date(`2000-01-01T18:00:00`);
        if (endTimeObj > normalEndTime) {
            overtime = calculateTimeDifference('18:00', endTime);
        }
    }
    
    console.log('Calculated values:', {
        travelTime: travelTime,
        workTime: workTime,
        overtime: overtime
    });

    row.querySelector('.travel-time').value = travelTime > 0 ? travelTime.toFixed(2) + ' hrs' : '';
    row.querySelector('.work-time').value = workTime > 0 ? workTime.toFixed(2) + ' hrs' : '';
    row.querySelector('.overtime').value = overtime > 0 ? overtime.toFixed(2) + ' hrs' : '';
}

function calculateTimeDifference(startTime, endTime) {
    if (!startTime || !endTime || startTime === '--' || endTime === '--') return null;
    
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    
    return (end - start) / (1000 * 60 * 60);
}

function formatToTwoDecimals(input) {
    const value = parseFloat(input.value);
    if (!isNaN(value)) {
        input.value = value.toFixed(2);
    }
}

function allowOnlyNumbers(input) {
    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/[^0-9.]/g, '');
        
        e.target.value = value;
    });
    
    input.addEventListener('blur', function() {
        if (this.value && !isNaN(parseFloat(this.value))) {
            formatToTwoDecimals(this);
        }
    });
}

