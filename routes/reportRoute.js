const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const SubmissionMiddleware = require('../middleware/submissionMiddleware');
const { uploadMultipleImages, uploadMultipleFiles, handleUploadError, validateFileData } = require('../middleware/uploadMiddleware');

router.get('/next-id', reportController.getNextReportId);

router.post('/create',
    uploadMultipleFiles,
    handleUploadError,
    SubmissionMiddleware.sanitizeInput,
    SubmissionMiddleware.logSubmission,
    SubmissionMiddleware.validateReportSubmission,
    SubmissionMiddleware.validateCustomer,
    SubmissionMiddleware.checkDuplicateSubmission,
    SubmissionMiddleware.createSubmissionRateLimit(15 * 60 * 1000, 5),
    reportController.createReport,
    SubmissionMiddleware.handleSubmissionError
);

router.get('/getById/:reportId', reportController.getReportById);
router.get('/getDetails/:reportId', reportController.getReportDetails);
router.get('/generatePDF/:reportId', reportController.generateReportPDF);
router.get('/getAllReports', reportController.getAllReports);
router.get('/searchByServiceBy', reportController.searchReportsByServiceBy);
router.get('/search', reportController.searchReports);
router.get('/searchByReportId', reportController.searchReportsByReportId);
router.get('/edit/:reportId', reportController.getReportForEdit);
router.put('/update/:reportId',
    uploadMultipleFiles,
    handleUploadError,
    SubmissionMiddleware.sanitizeInput,
    SubmissionMiddleware.logSubmission,
    SubmissionMiddleware.validateReportSubmission,
    SubmissionMiddleware.validateCustomer,
    SubmissionMiddleware.createSubmissionRateLimit(15 * 60 * 1000, 5),
    reportController.updateReport,
    SubmissionMiddleware.handleSubmissionError
);
router.delete('/delete/:reportId', reportController.deleteReport);

router.post('/upload-files',
    uploadMultipleFiles,
    handleUploadError,
    reportController.uploadFiles
);

router.get('/generate-pdf-from-db/:reportId', reportController.generatePDFFromDatabase);
router.get('/download-pdf/:reportId', reportController.downloadPDF);
router.get('/image/:imageId', reportController.serveImage);

module.exports = router;
