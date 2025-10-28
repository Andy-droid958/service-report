const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_BASE_DIR = path.join(__dirname, '..', 'uploads', 'details');

if (!fs.existsSync(UPLOAD_BASE_DIR)) {
    fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const tempDir = path.join(UPLOAD_BASE_DIR, 'temp', Date.now().toString());
        
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        const sanitizedBasename = basename.replace(/[^a-zA-Z0-9]/g, '_');
        
        cb(null, sanitizedBasename + '-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        'image/tiff'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed! Supported formats: JPEG, PNG, GIF, WebP, BMP, TIFF'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit per file since VARBINARY(MAX) supports up to 2GB
        files: 10, // Maximum 10 files per request
        fieldSize: 100 * 1024 * 1024 // 100MB total field size limit
    }
});

const uploadSingleImage = upload.single('image');

const uploadMultipleImages = upload.array('images', 10);

const uploadMultipleFiles = upload.fields([
    { name: 'images', maxCount: 10 }
]);

const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                error: 'File too large. Maximum size is 50MB per file.' 
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ 
                error: 'Too many files. Maximum 10 files allowed per request.' 
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ 
                error: 'Unexpected field name. Use "images" field for file uploads.' 
            });
        }
        if (error.code === 'LIMIT_FIELD_SIZE') {
            return res.status(400).json({ 
                error: 'Total upload size too large. Maximum 100MB total.' 
            });
        }
    }
    
    if (error.message && error.message.includes('Only image files are allowed!')) {
        return res.status(400).json({ 
            error: error.message 
        });
    }
    
    next(error);
};

const validateFileData = (files) => {
    if (!files || files.length === 0) {
        return { valid: true, files: [] };
    }
    
    const validFiles = [];
    const errors = [];
    
    files.forEach((file, index) => {
        if (file.size > 50 * 1024 * 1024) {
            errors.push(`File ${index + 1} (${file.originalname}) exceeds 50MB limit`);
            return;
        }
        
        if (!file.path || file.size === 0) {
            errors.push(`File ${index + 1} (${file.originalname}) is empty or has no path`);
            return;
        }
        
        validFiles.push({
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            filename: file.filename,
            fieldname: file.fieldname
        });
    });
    
    return {
        valid: errors.length === 0,
        files: validFiles,
        errors: errors
    };
};

const moveFileToFinalLocation = async (tempPath, reportId, detailId, filename) => {
    try {
        console.log('moveFileToFinalLocation called with:', {
            tempPath,
            reportId,
            detailId,
            filename
        });
        
        const finalDir = path.join(UPLOAD_BASE_DIR, `report_${reportId}`, `detail_${detailId}`);
        console.log('Final directory will be:', finalDir);
        
        if (!fs.existsSync(finalDir)) {
            console.log('Creating directory:', finalDir);
            fs.mkdirSync(finalDir, { recursive: true });
        }
        
        const finalPath = path.join(finalDir, filename);
        console.log('Final file path will be:', finalPath);
        
        if (!fs.existsSync(tempPath)) {
            throw new Error(`Temp file does not exist: ${tempPath}`);
        }
        
        fs.renameSync(tempPath, finalPath);
        console.log('File successfully renamed/moved');
        
        if (!fs.existsSync(finalPath)) {
            throw new Error(`File move verification failed. File not found at: ${finalPath}`);
        }
        
        console.log('File verified at final location');
        return finalPath;
    } catch (error) {
        console.error('Error moving file to final location:', error);
        console.error('Error details:', {
            tempPath,
            reportId,
            detailId,
            filename,
            error: error.message
        });
        throw error;
    }
};

const deleteFile = async (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Deleted file:', filePath);
        }
    } catch (error) {
        console.error('Error deleting file:', error);
    }
};

module.exports = {
    uploadSingleImage,
    uploadMultipleImages,
    uploadMultipleFiles,
    handleUploadError,
    validateFileData,
    moveFileToFinalLocation,
    deleteFile,
    UPLOAD_BASE_DIR
};
