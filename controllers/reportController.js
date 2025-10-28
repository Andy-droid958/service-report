const ReportModel = require('../models/reportModel');
const CustomerModel = require('../models/customerModel');
const DetailsModel = require('../models/detailsModel');
const SiteInformationModel = require('../models/siteInformationModel');
const PDFGenerator = require('../utils/pdfGenerator');
const { transformReportDataForPDF } = require('../utils/dataTransformer');
const { validateFileData } = require('../middleware/uploadMiddleware');
const path = require('path');

class ReportController {
  
    static async getNextReportId(req, res) {
        try {
            const clientDate = req.query.date || null;
            const nextId = await ReportModel.getNextReportId(clientDate);
            res.json({ nextReportId: nextId });
        } catch (error) {
            console.error('Error in getNextReportId:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async createReport(req, res) {
        try {
            const {
                reportId,
                customerName,
                date,
                yourRef,
                projectName,
                serviceBy,
                purposeOfVisit,
                purposeOfVisitOthers,
                problemDetails,
                jobDescription,
                attn,
                details: rawDetails,
                siteInformation: rawSiteInformation
            } = req.body;

            let details = rawDetails;
            if (typeof rawDetails === 'string') {
                try {
                    details = JSON.parse(rawDetails);
                } catch (error) {
                    console.error('Error parsing details JSON:', error);
                    return res.status(400).json({
                        error: 'Invalid details data format'
                    });
                }
            }

            let siteInformation = rawSiteInformation;
            if (typeof rawSiteInformation === 'string') {
                try {
                    siteInformation = JSON.parse(rawSiteInformation);
                } catch (error) {
                    console.error('Error parsing site information JSON:', error);
                    return res.status(400).json({
                        error: 'Invalid site information data format'
                    });
                }
            }

            const customerId = req.customerId;

            console.log('FILE UPLOAD DEBUG');
            console.log('req.files exists:', !!req.files);
            console.log('req.files:', req.files);
            console.log('req.files.images exists:', !!(req.files && req.files.images));
            if (req.files && req.files.images) {
                console.log('req.files.images count:', Array.isArray(req.files.images) ? req.files.images.length : 1);
                console.log('req.files.images:', req.files.images);
            }
            console.log('req.body.filesByDetail:', req.body.filesByDetail);
            console.log('');

            let uploadedFiles = [];
            if (req.files && req.files.images) {
                const fileValidation = validateFileData(req.files.images);
                if (!fileValidation.valid) {
                    return res.status(400).json({
                        error: 'File validation failed',
                        details: fileValidation.errors
                    });
                }
                uploadedFiles = fileValidation.files;
                console.log('Validated uploaded files count:', uploadedFiles.length);
            } else {
                console.log('No files uploaded or req.files.images is undefined');
            }
  
            let finalPurposeOfVisit = purposeOfVisit;
            if (purposeOfVisit === 'others' && purposeOfVisitOthers) {
                finalPurposeOfVisit = purposeOfVisitOthers;
            }

            const reportData = {
                reportId: parseInt(reportId),
                customerId,
                customerName,
                date,
                yourRef,
                projectName,
                serviceBy,
                purposeOfVisit: finalPurposeOfVisit,
                attn
            };

            const result = await ReportModel.createReport(reportData);

            let detailsResult = null;
            if (details && Array.isArray(details) && details.length > 0) {
                let filesByDetail = null;
                if (req.body.filesByDetail) {
                    try {
                        filesByDetail = JSON.parse(req.body.filesByDetail);
                    } catch (error) {
                        console.error('Error parsing filesByDetail JSON:', error);
                    }
                }
                
                const processedDetails = await ReportController.processDetailsWithFiles(details, uploadedFiles, filesByDetail, req);
                detailsResult = await DetailsModel.createDetails(result.reportId, processedDetails);
            }

            let siteInformationResult = null;
            if (siteInformation && Array.isArray(siteInformation) && siteInformation.length > 0) {
                const siteInfoPromises = siteInformation.map(siteInfo => {
                    if (siteInfo.name || siteInfo.plcHmi || siteInfo.modelNumber || siteInfo.brand || siteInfo.remarks) {
                        return SiteInformationModel.createSiteInformation(result.reportId, siteInfo);
                    }
                    return null;
                }).filter(promise => promise !== null);
                
                if (siteInfoPromises.length > 0) {
                    siteInformationResult = await Promise.all(siteInfoPromises);
                }
            }
            
            res.json({
                success: true,
                message: 'Report saved successfully',
                reportId: result.reportId,
                details: detailsResult,
                siteInformation: siteInformationResult,
                uploadedFiles: uploadedFiles.length
            });
        } catch (error) {
            console.error('Error in createReport:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getReportById(req, res) {
        try {
            const { reportId } = req.params;
            if (!reportId) {
                return res.status(400).json({ error: 'Report ID is required' });
            }
            const report = await ReportModel.getReportById(parseInt(reportId));
            if (!report) {
                return res.status(404).json({ error: 'Report not found' });
            }
            res.json({ success: true, report });
        } catch (error) {
            console.error('Error in getReportById:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getAllReports(req, res) {
        try {
            const reports = await ReportModel.getAllReports();
            res.json(reports);
        } catch (error) {
            console.error('Error in getAllReports:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
 
    static async searchReportsByServiceBy(req, res) {
        try {
            const { serviceBy } = req.query;
            if (!serviceBy) {
                return res.status(400).json({ error: 'Service By parameter is required' });
            }
            const reports = await ReportModel.searchReportsByServiceBy(serviceBy);
            res.json({
                success: true,
                serviceBy: serviceBy,
                reports: reports,
                count: reports.length
            });
        } catch (error) {
            console.error('Error in searchReportsByServiceBy:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async searchReports(req, res) {
        try {
            const { searchTerm } = req.query;
            
            if (!searchTerm) {
                return res.status(400).json({ 
                    error: 'Search term is required' 
                });
            }
            
            const reports = await ReportModel.searchReports(searchTerm);
            res.json({
                success: true,
                searchTerm: searchTerm,
                reports: reports,
                count: reports.length
            });
        } catch (error) {
            console.error('Error in searchReports:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async searchReportsByReportId(req, res) {
        try {
            const { reportId } = req.query;
            
            if (!reportId) {
                return res.status(400).json({ 
                    error: 'Report ID is required' 
                });
            }

            if (isNaN(parseInt(reportId))) {
                return res.status(400).json({ 
                    error: 'Report ID must be a valid number' 
                });
            }
            
            const reports = await ReportModel.searchReportsByReportId(reportId);
            res.json({
                success: true,
                reportId: reportId,
                reports: reports,
                count: reports.length
            });
        } catch (error) {
            console.error('Error in searchReportsByReportId:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
   
    static async updateReport(req, res) {
        try {
            const { reportId } = req.params;
            const { reportData: rawReportData, details: rawDetails, siteInformation: rawSiteInformation } = req.body;

            let reportData = rawReportData;
            if (typeof rawReportData === 'string') {
                try {
                    reportData = JSON.parse(rawReportData);
                } catch (error) {
                    console.error('Error parsing reportData JSON:', error);
                    return res.status(400).json({
                        error: 'Invalid report data format'
                    });
                }
            }

            let details = rawDetails;
            if (typeof rawDetails === 'string') {
                try {
                    details = JSON.parse(rawDetails);
                } catch (error) {
                    console.error('Error parsing details JSON:', error);
                    return res.status(400).json({
                        error: 'Invalid details data format'
                    });
                }
            }

            let siteInformation = rawSiteInformation;
            if (typeof rawSiteInformation === 'string') {
                try {
                    siteInformation = JSON.parse(rawSiteInformation);
                } catch (error) {
                    console.error('Error parsing site information JSON:', error);
                    return res.status(400).json({
                        error: 'Invalid site information data format'
                    });
                }
            }

            if (!reportId) {
                return res.status(400).json({ error: 'Report ID is required' });
            }

            let uploadedFiles = [];
            if (req.files && req.files.images) {
                const fileValidation = validateFileData(req.files.images);
                if (!fileValidation.valid) {
                    return res.status(400).json({
                        error: 'File validation failed',
                        details: fileValidation.errors
                    });
                }
                uploadedFiles = fileValidation.files;
            }

            if (reportData && reportData.customerName) {
                const customerId = await CustomerModel.getCustomerIdByName(reportData.customerName);
                if (!customerId) {
                    return res.status(400).json({ error: 'Customer not found' });
                }
                reportData.customerId = customerId;
            } else if (req.customerId) {
                reportData = reportData || {};
                reportData.customerId = req.customerId;
            }

            const result = await ReportModel.updateReport(parseInt(reportId), reportData);

            let detailsResult = null;
            if (details && Array.isArray(details)) {
                if (req.body.deletedFiles) {
                    try {
                        const deletedFiles = JSON.parse(req.body.deletedFiles);
                        if (deletedFiles.length > 0) {
                            console.log('Deleting old files BEFORE processing new uploads...');
                            const detailImageIds = deletedFiles.map(file => file.detailImageId);
                            await DetailsModel.deleteDetailImages(detailImageIds);
                            console.log(`Deleted ${deletedFiles.length} old files from database`);
                        }
                    } catch (error) {
                        console.error('Error parsing deleted files:', error);
                    }
                }
                
                let filesByDetail = null;
                if (req.body.filesByDetail) {
                    try {
                        filesByDetail = JSON.parse(req.body.filesByDetail);
                    } catch (error) {
                        console.error('Error parsing filesByDetail JSON:', error);
                    }
                }
                
                const processedDetails = await ReportController.processDetailsWithFiles(details, uploadedFiles, filesByDetail, req);
                
                for (let i = 0; i < processedDetails.length; i++) {
                    const detail = processedDetails[i];
                    
                    if (detail.detailId) {
                        const { detailId, ...detailData } = detail;
                        await DetailsModel.updateDetail(detailId, detailData);
                        console.log(`Updated detail ID: ${detailId}`);
                    } else {
                        const createResult = await DetailsModel.createDetails(parseInt(reportId), [detail]);
                        console.log(`Created new detail for card ${i}`);
                    }
                }
            }

            let siteInformationResult = null;
            if (siteInformation && Array.isArray(siteInformation)) {
                await SiteInformationModel.deleteSiteInformationByReportId(parseInt(reportId));
                if (siteInformation.length > 0) {
                    const siteInfoPromises = siteInformation.map(siteInfo => {
                        if (siteInfo.name || siteInfo.plcHmi || siteInfo.modelNumber || siteInfo.brand || siteInfo.remarks) {
                            return SiteInformationModel.createSiteInformation(parseInt(reportId), siteInfo);
                        }
                        return null;
                    }).filter(promise => promise !== null);
                    
                    if (siteInfoPromises.length > 0) {
                        siteInformationResult = await Promise.all(siteInfoPromises);
                    }
                }
            }

            res.json({
                success: true,
                message: 'Report updated successfully',
                reportId: parseInt(reportId),
                details: detailsResult,
                siteInformation: siteInformationResult,
                uploadedFiles: uploadedFiles.length
            });
        } catch (error) {
            console.error('Error in updateReport:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async deleteReport(req, res) {
        try {
            const { reportId } = req.params;

            if (!reportId) {
                return res.status(400).json({ error: 'Report ID is required' });
            }

            const result = await ReportModel.deleteReport(parseInt(reportId));

            res.json({
                success: true,
                message: 'Report deleted successfully'
            });
        } catch (error) {
            console.error('Error in deleteReport:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getReportDetails(req, res) {
        try {
            const { reportId } = req.params;
            console.log('getReportDetails called with reportId:', reportId);
            if (!reportId) {
                return res.status(400).json({ error: 'Report ID is required' });
            }
            
            try {
                const { query } = require('../config/db.config');
                const testQuery = 'SELECT 1 as test';
                await query(testQuery);
                console.log('Database connection test successful');
            } catch (dbError) {
                console.error('Database connection test failed:', dbError);
                return res.status(500).json({ error: 'Database connection failed', details: dbError.message });
            }
            
            const details = await DetailsModel.getDetailsByReportId(reportId);
            console.log('Details retrieved:', details);
            res.json({ success: true, details });
        } catch (error) {
            console.error('Error in getReportDetails:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }

    static async getReportForEdit(req, res) {
        try {
            const { reportId } = req.params;
            if (!reportId) {
                return res.status(400).json({ error: 'Report ID is required' });
            }

            const report = await ReportModel.getReportById(reportId);
            if (!report) {
                return res.status(404).json({ error: 'Report not found' });
            }

            const details = await DetailsModel.getDetailsByReportId(reportId);
            const siteInformation = await SiteInformationModel.getSiteInformationByReportId(reportId);
            
            console.log('Details retrieved for edit:', details);
            details.forEach((detail, index) => {
                const hasSingleImage = !!(detail.Image_ID && detail.File_Name);
                const hasMultipleImages = !!(detail.images && detail.images.length > 0);
                const hasImages = hasSingleImage || hasMultipleImages;
                const imagesCount = hasMultipleImages ? detail.images.length : (hasSingleImage ? 1 : 0);
                
                console.log(`Detail ${index}:`, {
                    Detail_ID: detail.Detail_ID,
                    File_Name: detail.File_Name,
                    Image_ID: detail.Image_ID,
                    hasImages: hasImages,
                    imagesCount: imagesCount,
                    imageType: hasMultipleImages ? 'multiple' : (hasSingleImage ? 'single' : 'none')
                });
            });

            console.log('Site information retrieved for edit:', siteInformation);

            res.json({
                success: true,
                report: report,
                details: details,
                siteInformation: siteInformation,
                message: 'Report data retrieved for editing'
            });
        } catch (error) {
            console.error('Error in getReportForEdit:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async generateReportPDF(req, res) {
        const pdfGenerator = new PDFGenerator();
        
        try {
            const { reportId } = req.params;

            if (!reportId) {
                return res.status(400).json({ error: 'Report ID is required' });
            }

            const report = await ReportModel.getReportById(reportId);
            if (!report) {
                return res.status(404).json({ error: 'Report not found' });
            }

            const details = await DetailsModel.getDetailsByReportId(reportId);
            
            const siteInformation = await SiteInformationModel.getSiteInformationByReportId(reportId);

            const pdfData = transformReportDataForPDF(report, details, siteInformation);

            await pdfGenerator.initialize();
            const page = await pdfGenerator.browser.newPage();

            const htmlPath = path.join(__dirname, '..', 'public', 'htmls', 'pdf-template.html');
            await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

            if (pdfData) {
                await pdfGenerator.fillFormData(page, pdfData);
            }

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '15mm',
                    right: '15mm',
                    bottom: '15mm',
                    left: '15mm'
                }
            });

            await page.close();

            // Tell browser this is a PDF stream
            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Length': pdfBuffer.length,
                'Content-Disposition': `inline; filename="service-report-${reportId}.pdf"`,
                'Accept-Ranges': 'bytes'
            });

            res.end(pdfBuffer);

        } catch (error) {
            console.error('Error generating PDF:', error);
            res.status(500).send('Error generating PDF: ' + error.message);
        } finally {
            await pdfGenerator.close();
        }
    }

    static async processDetailsWithFiles(details, uploadedFiles, filesByDetail = null, req = null) {
        if (!uploadedFiles || uploadedFiles.length === 0) {
            return details.map(detail => ReportController.mapDetailFields(detail));
        }

        const processedDetails = [...details];
        
        if (processedDetails.length === 0) {
            return processedDetails;
        }

        // Initialize images array for all details
        processedDetails.forEach(detail => {
            detail.images = [];
        });

        if (filesByDetail && Array.isArray(filesByDetail)) {
            console.log('Using file-to-detail associations:', filesByDetail);
            
            const fileToDetailMap = {};
            if (req) {
                Object.keys(req.body).forEach(key => {
                    if (key.startsWith('detailIndex_')) {
                        const fileIndex = parseInt(key.replace('detailIndex_', ''));
                        const detailIndex = parseInt(req.body[key]);
                        fileToDetailMap[fileIndex] = detailIndex;
                    }
                });
            }
        
            const filesByDetailIndex = {};
            console.log('File to detail map:', fileToDetailMap);
            console.log('Uploaded files count:', uploadedFiles.length);
            uploadedFiles.forEach((file, fileIndex) => {
                const detailIndex = fileToDetailMap[fileIndex];
                console.log(`File ${fileIndex} (${file.originalname}) -> Detail ${detailIndex}`);
                if (detailIndex !== undefined) {
                    if (!filesByDetailIndex[detailIndex]) {
                        filesByDetailIndex[detailIndex] = [];
                    }
                    filesByDetailIndex[detailIndex].push(file);
                }
            });
            
            Object.keys(filesByDetailIndex).forEach(detailIndex => {
                const detailIdx = parseInt(detailIndex);
                const files = filesByDetailIndex[detailIdx];
                
                if (detailIdx >= 0 && detailIdx < processedDetails.length && files.length > 0) {
                    processedDetails[detailIdx].images = files.map(file => ({
                        tempPath: file.path,  
                        fileName: file.originalname,
                        fileSize: file.size,
                        fileType: file.mimetype,
                        fileExtension: file.originalname.split('.').pop().toLowerCase()
                    }));
                    
                    console.log(`Assigned ${files.length} files to detail ${detailIdx + 1}:`, 
                        files.map(f => f.originalname));
                }
            });
        } else {
            console.log('No file associations provided, using round-robin distribution');
            const filesPerDetail = Math.floor(uploadedFiles.length / processedDetails.length);
            const remainingFiles = uploadedFiles.length % processedDetails.length;
            
            let fileIndex = 0;
            
            for (let i = 0; i < processedDetails.length; i++) {
                const filesForThisDetail = filesPerDetail + (i < remainingFiles ? 1 : 0);
                const detailFiles = uploadedFiles.slice(fileIndex, fileIndex + filesForThisDetail);
                fileIndex += filesForThisDetail;
                
                if (detailFiles.length > 0) {
                    processedDetails[i].images = detailFiles.map(file => ({
                        tempPath: file.path,  
                        fileName: file.originalname,
                        fileSize: file.size,
                        fileType: file.mimetype,
                        fileExtension: file.originalname.split('.').pop().toLowerCase()
                    }));
                    
                    console.log(`Assigned ${detailFiles.length} files to detail ${i + 1}:`, 
                        detailFiles.map(f => f.originalname));
                } else {
                    processedDetails[i].images = [];
                    console.log(`Detail ${i + 1} has no files assigned`);
                }
            }
        }

        return processedDetails.map(detail => ReportController.mapDetailFields(detail));
    }

    static mapDetailFields(detail) {
        const mappedDetail = { ...detail };
        
        if (mappedDetail.mil !== undefined) {
            mappedDetail.mileage = mappedDetail.mil;
            delete mappedDetail.mil;
        }
        
        if (mappedDetail.toll !== undefined) {
            mappedDetail.tollAmount = mappedDetail.toll;
            delete mappedDetail.toll;
        }
        
        if (mappedDetail.hotel !== undefined) {
            mappedDetail.hotelAmount = mappedDetail.hotel;
            delete mappedDetail.hotel;
        }
        
        if (mappedDetail.overtime !== undefined) {
            mappedDetail.overTime = mappedDetail.overtime;
            delete mappedDetail.overtime;
        }
        return mappedDetail;
    }

    static async uploadFiles(req, res) {
        try {
            if (!req.files || !req.files.images) {
                return res.status(400).json({
                    error: 'No files uploaded',
                    message: 'Please select files to upload'
                });
            }

            const fileValidation = validateFileData(req.files.images);
            if (!fileValidation.valid) {
                return res.status(400).json({
                    error: 'File validation failed',
                    details: fileValidation.errors
                });
            }

            const uploadedFiles = fileValidation.files;
            const fileInfo = uploadedFiles.map(file => ({
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                fieldname: file.fieldname
            }));

            res.json({
                success: true,
                message: `${uploadedFiles.length} file(s) uploaded successfully`,
                files: fileInfo,
                totalSize: uploadedFiles.reduce((total, file) => total + file.size, 0)
            });
        } catch (error) {
            console.error('Error in uploadFiles:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async generatePDFFromDatabase(req, res) {
        const pdfGenerator = new PDFGenerator();
        
        try {
            const { reportId } = req.params;
            
            if (!reportId) {
                return res.status(400).json({ error: 'Report ID is required' });
            }

            const report = await ReportModel.getReportById(parseInt(reportId));
            if (!report) {
                return res.status(404).json({ error: 'Report not found' });
            }

            const details = await DetailsModel.getDetailsByReportId(parseInt(reportId));
            
            const siteInformation = await SiteInformationModel.getSiteInformationByReportId(parseInt(reportId));

            const pdfData = transformReportDataForPDF(report, details, siteInformation);

            const outputPath = path.join('C:', 'Service Report', 'public', 'uploads', `report-${reportId}.pdf`);
            const result = await pdfGenerator.generateServiceReportWithData(pdfData, outputPath);

            if (result.success) {
                res.json({
                    success: true,
                    message: 'PDF generated successfully',
                    filePath: result.filePath,
                    reportId: reportId
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to generate PDF',
                    details: result.error
                });
            }

        } catch (error) {
            console.error('Error in generatePDFFromDatabase:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                details: error.message 
            });
        } finally {
            await pdfGenerator.close();
        }
    }

    static async downloadPDF(req, res) {
        try {
            const { reportId } = req.params;
            
            if (!reportId) {
                return res.status(400).json({ error: 'Report ID is required' });
            }

            const filePath = path.join('C:', 'Service Report', 'public', 'uploads', `report-${reportId}.pdf`);
            
            const fs = require('fs');
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'PDF file not found. Please generate it first.' });
            }

            res.download(filePath, `service-report-${reportId}.pdf`, (err) => {
                if (err) {
                    console.error('Error downloading PDF:', err);
                    if (!res.headersSent) {
                        res.status(500).json({ error: 'Error downloading PDF' });
                    }
                }
            });

        } catch (error) {
            console.error('Error in downloadPDF:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async serveImage(req, res) {
        try {
            const { imageId } = req.params;
            const fs = require('fs');
            
            console.log('serveImage called for Image_ID:', imageId);
            
            if (!imageId) {
                return res.status(400).json({ error: 'Image ID is required' });
            }

            // Get image metadata and reconstruct file path
            const { query } = require('../config/db.config');
            const imageQuery = `
                SELECT di.File_Name, di.File_Type, di.Detail_ID, d.Report_ID 
                FROM Detail_Images di
                INNER JOIN Details d ON di.Detail_ID = d.Detail_ID
                WHERE di.Image_ID = @imageId
            `;
            const result = await query(imageQuery, { imageId: parseInt(imageId) });
            
            console.log('Database query result:', result.recordset);
            
            if (!result.recordset || result.recordset.length === 0) {
                console.error('Image not found in database for Image_ID:', imageId);
                return res.status(404).json({ error: 'Image not found in database' });
            }

            const imageData = result.recordset[0];
            console.log('Image metadata:', imageData);
            const { UPLOAD_BASE_DIR } = require('../middleware/uploadMiddleware');
            const filePath = path.join(
                UPLOAD_BASE_DIR, 
                `report_${imageData.Report_ID}`, 
                `detail_${imageData.Detail_ID}`, 
                imageData.File_Name
            );
            
            console.log('Reconstructed file path:', filePath);
            console.log('File exists?', fs.existsSync(filePath));
            
            if (!fs.existsSync(filePath)) {
                console.error('Image file not found on disk:', filePath);
                console.error('Expected location breakdown:', {
                    baseDir: UPLOAD_BASE_DIR,
                    reportFolder: `report_${imageData.Report_ID}`,
                    detailFolder: `detail_${imageData.Detail_ID}`,
                    fileName: imageData.File_Name
                });
                
                try {
                    const uploadContents = fs.readdirSync(UPLOAD_BASE_DIR);
                    console.log('Contents of UPLOAD_BASE_DIR:', uploadContents);
                } catch (e) {
                    console.log('Could not read UPLOAD_BASE_DIR');
                }
                
                return res.status(404).json({ 
                    error: 'Image file not found on disk',
                    expectedPath: filePath
                });
            }

            console.log('File found, serving image');

            const contentType = imageData.File_Type || 'image/jpeg';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=86400'); 

            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
            
            fileStream.on('error', (error) => {
                console.error('Error streaming file:', error);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error serving image' });
                }
            });

        } catch (error) {
            console.error('Error in serveImage:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
}

module.exports = ReportController;
