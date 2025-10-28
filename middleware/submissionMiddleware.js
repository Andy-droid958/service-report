const { query } = require('../config/db.config');
const CustomerModel = require('../models/customerModel');

class SubmissionMiddleware {
    // Validate report submission data
    static validateReportSubmission(req, res, next) {
        console.log('Validation middleware - Request body:', JSON.stringify(req.body, null, 2));
        
        // Handle both create and update data structures
        let dataToValidate;
        if (req.body.reportData) {
            if (typeof req.body.reportData === 'string') {
                try {
                    dataToValidate = JSON.parse(req.body.reportData);
                } catch (error) {
                    console.error('Error parsing reportData JSON:', error);
                    return res.status(400).json({
                        error: 'Invalid report data format'
                    });
                }
            } else {
                dataToValidate = req.body.reportData;
            }
            console.log('Update request detected, using reportData');
        } else {
       
            dataToValidate = req.body;
            console.log('Create request detected, using direct body');
        }
        
        console.log('Data to validate:', JSON.stringify(dataToValidate, null, 2));

        const {
            reportId,
            customerName,
            date,
            projectName,
            serviceBy,
            purposeOfVisit,
            problemDetails,
            jobDescription,
            attn,
            yourRef
        } = dataToValidate;

        let requiredFields;
        if (req.body.reportData) {
           
            requiredFields = [
                { field: 'customerName', name: 'Customer Name' },
                { field: 'date', name: 'Date' },
                { field: 'projectName', name: 'Project Name' },
                { field: 'serviceBy', name: 'Service By' },
                { field: 'purposeOfVisit', name: 'Purpose of Visit' },
                { field: 'attn', name: 'Attn' },
                { field: 'yourRef', name: 'Your Ref' }
            ];
        } else {
     
            requiredFields = [
            { field: 'reportId', name: 'Report ID' },
            { field: 'customerName', name: 'Customer Name' },
            { field: 'date', name: 'Date' },
            { field: 'projectName', name: 'Project Name' },
            { field: 'serviceBy', name: 'Service By' },
            { field: 'purposeOfVisit', name: 'Purpose of Visit' },
            { field: 'attn', name: 'Attn' },
            { field: 'yourRef', name: 'Your Ref' }
        ];
        }

        const missingFields = [];
        requiredFields.forEach(({ field, name }) => {
            const value = dataToValidate[field];
            console.log(`Checking field '${field}' (${name}):`, value);
            if (!value || value.toString().trim() === '') {
                missingFields.push(name);
                console.log(`Missing field: ${name}`);
            } else {
                console.log(`Field present: ${name}`);
            }
        });

        if (missingFields.length > 0) {
            console.log('Validation failed - missing fields:', missingFields);
            return res.status(400).json({
                error: 'Missing required fields',
                missingFields: missingFields
            });
        }
        
        console.log('All required fields present');

        if (date && !isValidDate(date)) {
            return res.status(400).json({
                error: 'Invalid date format. Please use YYYY-MM-DD format'
            });
        }

        if (reportId && isNaN(parseInt(reportId))) {
            return res.status(400).json({
                error: 'Report ID must be a valid number'
            });
        }

        const purposeOfVisitOthers = dataToValidate.purposeOfVisitOthers;
        const finalPurposeOfVisit = dataToValidate.purposeOfVisit;
        
        if (finalPurposeOfVisit === 'others' && (!purposeOfVisitOthers || purposeOfVisitOthers.trim() === '')) {
            console.log('Purpose of visit validation failed - others selected but no custom text provided');
            return res.status(400).json({
                error: 'Please specify the purpose of visit when selecting "Others"'
            });
        }
        
        console.log('Purpose of visit validation passed');

        const textFields = [
            { field: 'customerName', name: 'Customer Name' },
            { field: 'projectName', name: 'Project Name' },
            { field: 'serviceBy', name: 'Service By' },
            { field: 'purposeOfVisit', name: 'Purpose of Visit' },
            { field: 'purposeOfVisitOthers', name: 'Purpose of Visit (Others)' },
            { field: 'problemDetails', name: 'Problem Details' },
            { field: 'jobDescription', name: 'Job Description' },
            { field: 'attn', name: 'Attn' },
            { field: 'yourRef', name: 'Your Ref' }
        ];

        const textLengthErrors = [];
        textFields.forEach(({ field, name }) => {
            const value = dataToValidate[field];
            if (value && value.toString().length > 255) {
                textLengthErrors.push(`${name} exceeds maximum length of 255 characters (current: ${value.toString().length})`);
            }
        });

        if (textLengthErrors.length > 0) {
            return res.status(400).json({
                error: 'Text field length validation failed',
                details: textLengthErrors
            });
        }

        let details = req.body.details || req.body.reportData?.details;
        console.log('Details validation - details raw:', details);
        console.log('Details type:', typeof details);
        
        if (typeof details === 'string') {
            try {
                details = JSON.parse(details);
                console.log('Details parsed from JSON string:', details);
            } catch (error) {
                console.log('Details validation failed - invalid JSON string');
                return res.status(400).json({
                    error: 'Invalid details data format'
                });
            }
        }
        
        console.log('Details length:', details?.length);
        console.log('Is array:', Array.isArray(details));
        
        if (!details || !Array.isArray(details) || details.length === 0) {
            console.log('Details validation failed - no details provided');
            return res.status(400).json({
                error: 'At least one entry in the Details table is required'
            });
        }
        
        console.log('Details validation passed');

        const requiredDetailFields = [
            'date', 'outTime', 'startTime', 'endTime', 'inTime', 
            'travelTime', 'workTime', 'mil', 'toll', 'hotel', 'others',
            'problemDetails', 'jobDescription'
        ];
        
        // Optional fields 
        const optionalDetailFields = ['overTime', 'image'];

        const incompleteRows = [];
        
        for (let i = 0; i < details.length; i++) {
            const detail = details[i];
            const missingFields = [];

            const hasAnyData = Object.keys(detail).some(key => {
                const value = detail[key];
                return value && value.toString().trim() !== '';
            });
            
            if (hasAnyData) {
                requiredDetailFields.forEach(field => {
                    if (!detail[field] || detail[field].toString().trim() === '') {
                        missingFields.push(field);
                    }
                });

                if (missingFields.length > 0) {
                    incompleteRows.push({
                        rowNumber: i + 1,
                        missingFields: missingFields
                    });
                }
            }
        }
        
        if (incompleteRows.length > 0) {
            const rowNumbers = incompleteRows.map(row => row.rowNumber);
            const allMissingFields = incompleteRows.map(row => 
                `Row ${row.rowNumber}: ${row.missingFields.join(', ')}`
            ).join('; ');
            
            return res.status(400).json({
                error: `Please complete all required fields in the following row(s): ${rowNumbers.join(', ')}`,
                details: allMissingFields,
                incompleteRows: incompleteRows
            });
        }

        const detailsValidationErrors = [];
        
        for (let i = 0; i < details.length; i++) {
            const detail = details[i];
            const rowNumber = i + 1;
            const decimalFields = [
                { field: 'mil', name: 'Mileage' },
                { field: 'toll', name: 'Toll Amount' },
                { field: 'hotel', name: 'Hotel Amount' }
            ];
            
            decimalFields.forEach(({ field, name }) => {
                const value = detail[field];
                if (value && value.toString().trim() !== '') {
                    const numValue = parseFloat(value);
                    if (isNaN(numValue)) {
                        detailsValidationErrors.push(`Row ${rowNumber}: ${name} must be a valid number`);
                    } else {
                       
                        const strValue = numValue.toString();
                        const parts = strValue.split('.');
                        const integerPart = parts[0];
                        const decimalPart = parts[2] || '';
                        
                        if (integerPart.length > 9) {
                            detailsValidationErrors.push(`Row ${rowNumber}: ${name} exceeds maximum value (max 9 digits before decimal point)`);
                        }
                        if (decimalPart.length > 2) {
                            detailsValidationErrors.push(`Row ${rowNumber}: ${name} has too many decimal places (max 2 decimal place)`);
                        }
                    }
                }
            });
            
            const detailsTextFields = [
                { field: 'others', name: 'Others' }
            ];
            
            detailsTextFields.forEach(({ field, name }) => {
                const value = detail[field];
                if (value && value.toString().length > 255) {
                    detailsValidationErrors.push(`Row ${rowNumber}: ${name} exceeds maximum length of 255 characters (current: ${value.toString().length})`);
                }
            });
        }
        
        if (detailsValidationErrors.length > 0) {
            return res.status(400).json({
                error: 'Details table validation failed',
                details: detailsValidationErrors
            });
        }

        let siteInformation = req.body.siteInformation || req.body.reportData?.siteInformation;
        console.log('Site Information validation - siteInformation raw:', siteInformation);
        console.log('Site Information type:', typeof siteInformation);
        
        if (typeof siteInformation === 'string') {
            try {
                siteInformation = JSON.parse(siteInformation);
                console.log('Site Information parsed from JSON string:', siteInformation);
            } catch (error) {
                console.log('Site Information validation failed - invalid JSON string');
                return res.status(400).json({
                    error: 'Invalid site information data format'
                });
            }
        }
        
        console.log('Site Information length:', siteInformation?.length);
        console.log('Is array:', Array.isArray(siteInformation));
        
        if (!siteInformation || !Array.isArray(siteInformation) || siteInformation.length === 0) {
            console.log('Site Information validation failed - no site information provided');
            return res.status(400).json({
                error: 'At least one entry in the Site Information table is required'
            });
        }
        
        console.log('Site Information validation passed - checking individual rows');

        const requiredSiteFields = ['name', 'plcHmi', 'brand', 'modelNumber', 'remarks'];
        
        const incompleteSiteRows = [];
        
        for (let i = 0; i < siteInformation.length; i++) {
            const siteInfo = siteInformation[i];
            const missingSiteFields = [];

            const hasAnyData = Object.keys(siteInfo).some(key => {
                const value = siteInfo[key];
                return value && value.toString().trim() !== '';
            });
            
            if (hasAnyData) {
                requiredSiteFields.forEach(field => {
                    if (!siteInfo[field] || siteInfo[field].toString().trim() === '') {
                        missingSiteFields.push(field);
                    }
                });

                if (missingSiteFields.length > 0) {
                    incompleteSiteRows.push({
                        rowNumber: i + 1,
                        missingFields: missingSiteFields
                    });
                }
            }
        }
        
        if (incompleteSiteRows.length > 0) {
            const rowNumbers = incompleteSiteRows.map(row => row.rowNumber);
            const allMissingSiteFields = incompleteSiteRows.map(row => 
                `Row ${row.rowNumber}: ${row.missingFields.join(', ')}`
            ).join('; ');
            
            return res.status(400).json({
                error: `Please complete all required fields in the Site Information table for row(s): ${rowNumbers.join(', ')}`,
                details: allMissingSiteFields,
                incompleteSiteRows: incompleteSiteRows
            });
        }

        const siteInfoValidationErrors = [];
        
        for (let i = 0; i < siteInformation.length; i++) {
            const siteInfo = siteInformation[i];
            const rowNumber = i + 1;
            
            const siteTextFields = [
                { field: 'name', name: 'System/Machine/Line Name' },
                { field: 'plcHmi', name: 'PLC/HMI' },
                { field: 'brand', name: 'Brand' },
                { field: 'modelNumber', name: 'Model Number' },
                { field: 'remarks', name: 'Remarks' }
            ];
            
            siteTextFields.forEach(({ field, name }) => {
                const value = siteInfo[field];
                if (value && value.toString().length > 255) {
                    siteInfoValidationErrors.push(`Row ${rowNumber}: ${name} exceeds maximum length of 255 characters (current: ${value.toString().length})`);
                }
            });
        }
        
        if (siteInfoValidationErrors.length > 0) {
            return res.status(400).json({
                error: 'Site Information table validation failed',
                details: siteInfoValidationErrors
            });
        }
        
        console.log('Site Information validation completed successfully');

        next();
    }

    static async validateCustomer(req, res, next) {
        try {
  
            let dataToValidate;
            if (req.body.reportData) {
                if (typeof req.body.reportData === 'string') {
                    try {
                        dataToValidate = JSON.parse(req.body.reportData);
                    } catch (error) {
                        console.error('Error parsing reportData JSON in validateCustomer:', error);
                        return res.status(400).json({
                            error: 'Invalid report data format'
                        });
                    }
                } else {
                    dataToValidate = req.body.reportData;
                }
            } else {
    
                dataToValidate = req.body;
            }
            
            const { customerName } = dataToValidate;
            
            console.log('Validating customer:', customerName);
            
            if (!customerName || customerName.trim().length === 0) {
                return res.status(400).json({
                    error: 'Customer name is required'
                });
            }

            const trimmedCustomerName = customerName.trim();
            if (trimmedCustomerName.length > 255) {
                return res.status(400).json({
                    error: 'Customer name is too long (maximum 255 characters)'
                });
            }

            let customerId = await CustomerModel.getCustomerIdByName(trimmedCustomerName);
            
            console.log('Customer ID found:', customerId);

            if (!customerId) {
                console.log('Customer not found, creating new customer:', trimmedCustomerName);
                customerId = await CustomerModel.createCustomer(trimmedCustomerName);
                console.log('New customer created with ID:', customerId);
            }

            req.customerId = customerId;
            console.log('Customer ID stored in req:', req.customerId);
            next();
        } catch (error) {
            console.error('Error validating customer:', error);
            return res.status(500).json({
                error: 'Error validating customer. Please try again.'
            });
        }
    }

    static logSubmission(req, res, next) {
        const timestamp = new Date().toISOString();
        const clientIP = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent') || 'Unknown';

        console.log(`[${timestamp}] Report Submission Attempt:`);
        console.log(`  - IP: ${clientIP}`);
        console.log(`  - User Agent: ${userAgent}`);
        console.log(`  - Report ID: ${req.body.reportId || 'N/A'}`);
        console.log(`  - Customer: ${req.body.customerName || 'N/A'}`);
        console.log(`  - Project: ${req.body.projectName || 'N/A'}`);

        req.submissionLog = {
            timestamp,
            clientIP,
            userAgent,
            reportId: req.body.reportId,
            customerName: req.body.customerName,
            projectName: req.body.projectName
        };

        next();
    }

    static async checkDuplicateSubmission(req, res, next) {
        try {
            const { reportId } = req.body;

            if (!reportId) {
                return next();
            }

            const sqlQuery = `
                SELECT Report_ID 
                FROM Report 
                WHERE Report_ID = @reportId
            `;

            const result = await query(sqlQuery, { reportId: parseInt(reportId) });

            if (result.recordset.length > 0) {
                return res.status(409).json({
                    error: 'Report with this ID already exists',
                    reportId: reportId
                });
            }

            next();
        } catch (error) {
            console.error('Error checking duplicate submission:', error);
            next();
        }
    }

    static createSubmissionRateLimit(windowMs = 15 * 60 * 1000, maxSubmissions = 10) {
        const submissions = new Map();

        return (req, res, next) => {
            const clientIP = req.ip || req.connection.remoteAddress;
            const now = Date.now();
            const windowStart = now - windowMs;

            if (submissions.has(clientIP)) {
                const clientSubmissions = submissions.get(clientIP).filter(time => time > windowStart);
                submissions.set(clientIP, clientSubmissions);
            }

            const clientSubmissions = submissions.get(clientIP) || [];
            if (clientSubmissions.length >= maxSubmissions) {
                return res.status(429).json({
                    error: 'Too many submissions. Please try again later.',
                    retryAfter: Math.ceil(windowMs / 1000)
                });
            }

            clientSubmissions.push(now);
            submissions.set(clientIP, clientSubmissions);

            next();
        };
    }

    static sanitizeInput(req, res, next) {
        let dataToSanitize = req.body.reportData ? 
            (typeof req.body.reportData === 'string' ? JSON.parse(req.body.reportData) : req.body.reportData) : 
            req.body;
       
        const stringFields = [
            'customerName', 'yourRef', 'projectName', 'serviceBy',
            'purposeOfVisit', 'purposeOfVisitOthers', 'problemDetails',
            'jobDescription', 'attn'
        ];

        stringFields.forEach(field => {
            if (req.body[field]) {
                req.body[field] = sanitizeString(req.body[field]);
            }
        });

        if (dataToSanitize && req.body.reportData) {
            stringFields.forEach(field => {
                if (dataToSanitize[field]) {
                    dataToSanitize[field] = sanitizeString(dataToSanitize[field]);
                }
            });
            req.body.reportData = JSON.stringify(dataToSanitize);
        }

        let siteInformation = req.body.siteInformation;
        if (typeof siteInformation === 'string') {
            try {
                siteInformation = JSON.parse(siteInformation);
            } catch (error) {
            }
        }
        
        if (siteInformation && Array.isArray(siteInformation)) {
            siteInformation.forEach(siteInfo => {
                if (siteInfo.name) siteInfo.name = sanitizeString(siteInfo.name);
                if (siteInfo.plcHmi) siteInfo.plcHmi = sanitizeString(siteInfo.plcHmi);
                if (siteInfo.brand) siteInfo.brand = sanitizeString(siteInfo.brand);
                if (siteInfo.modelNumber) siteInfo.modelNumber = sanitizeString(siteInfo.modelNumber);
                if (siteInfo.remarks) siteInfo.remarks = sanitizeString(siteInfo.remarks);
            });
            req.body.siteInformation = JSON.stringify(siteInformation);
        }

        let details = req.body.details;
        if (typeof details === 'string') {
            try {
                details = JSON.parse(details);
            } catch (error) {
            }
        }
        
        if (details && Array.isArray(details)) {
            details.forEach(detail => {
                if (detail.problemDetails) detail.problemDetails = sanitizeString(detail.problemDetails);
                if (detail.jobDescription) detail.jobDescription = sanitizeString(detail.jobDescription);
                if (detail.others) detail.others = sanitizeString(detail.others);
            });
            req.body.details = JSON.stringify(details);
        }

        next();
    }

    static handleSubmissionError(err, req, res, next) {
        console.error('Submission Error:', err);

    
        if (req.submissionLog) {
            console.error('Submission Context:', req.submissionLog);
        }


        if (err.code === 'EREQUEST') {
            return res.status(500).json({
                error: 'Database error occurred during submission',
                message: 'Please try again.'
            });
        }

        if (err.code === 'ECONNREFUSED') {
            return res.status(503).json({
                error: 'Service temporarily unavailable',
                message: 'Database connection failed. Please try again later.'
            });
        }

        res.status(500).json({
            error: 'Internal server error',
            message: 'An unexpected error occurred. Please try again.'
        });
    }
}

function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
}

function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    
    return str
        .trim()
        .replace(/[<>]/g, '') 
        .replace(/javascript:/gi, '') 
        .substring(0, 1000); 
}

module.exports = SubmissionMiddleware;
