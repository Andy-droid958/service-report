function generateTimeOptions() {
    const timeSelects = document.querySelectorAll('.time-select');
    timeSelects.forEach(select => {
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
    });
}

function calculateTimeDifference(startTime, endTime) {
    if (!startTime || !endTime || startTime === '--' || endTime === '--') return null;
    
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    
    return (end - start) / (1000 * 60 * 60); 
}

function calculateRowTimes(row) {
    const outTimeRaw = row.querySelector('[data-type="out-time"]').value;
    const startTimeRaw = row.querySelector('[data-type="start-time"]').value;
    const endTimeRaw = row.querySelector('[data-type="end-time"]').value;
    const inTimeRaw = row.querySelector('[data-type="in-time"]').value;
    
    const outTime = outTimeRaw && outTimeRaw !== '--' ? outTimeRaw : null;
    const startTime = startTimeRaw && startTimeRaw !== '--' ? startTimeRaw : null;
    const endTime = endTimeRaw && endTimeRaw !== '--' ? endTimeRaw : null;
    const inTime = inTimeRaw && inTimeRaw !== '--' ? inTimeRaw : null;
    
    // Calculate Travel Time: (start time - out time) + (in time - end time)
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
    
    row.querySelector('.travel-time').value = travelTime > 0 ? travelTime.toFixed(2) + ' hrs' : '';
    row.querySelector('.work-time').value = workTime > 0 ? workTime.toFixed(2) + ' hrs' : '';
    row.querySelector('.overtime').value = overtime > 0 ? overtime.toFixed(2) + ' hrs' : '';
}

function initializeTimeOptions(row) {
    const timeSelects = row.querySelectorAll('.time-select');
    timeSelects.forEach(select => {
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
        
        select.addEventListener('change', function() {
            const row = this.closest('tr');
            calculateRowTimes(row);
        });
    });
}

