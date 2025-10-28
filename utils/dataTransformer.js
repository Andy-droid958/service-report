const fs = require('fs');
const path = require('path');

const MAX_FILE_SIZE = 5 * 1024 * 1024; 
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];

function validateImageFile(filePath, fileName, fileSize = null) {
    try {

        if (!fs.existsSync(filePath)) {
            console.warn(`[PDF Validation] File not found: ${filePath}`);
            return { valid: false, error: 'File not found' };
        }

        const stats = fs.statSync(filePath);
        const actualFileSize = stats.size;

        if (actualFileSize === 0) {
            console.warn(`[PDF Validation] Empty file (0 bytes): ${fileName}`);
            return { valid: false, error: 'File is empty' };
        }

        if (actualFileSize > MAX_FILE_SIZE) {
            console.warn(`[PDF Validation] File too large: ${fileName} (${actualFileSize} bytes, max ${MAX_FILE_SIZE} bytes)`);
            return { valid: false, error: `File too large: ${(actualFileSize / (1024 * 1024)).toFixed(2)}MB (max 5MB)` };
        }

        const fileExtension = path.extname(fileName).toLowerCase();
        if (!ALLOWED_IMAGE_EXTENSIONS.includes(fileExtension)) {
            console.warn(`[PDF Validation] Invalid file extension: ${fileName} (${fileExtension})`);
            return { valid: false, error: `Invalid file type: ${fileExtension}` };
        }

        if (fileName.length > 255) {
            console.warn(`[PDF Validation] Filename too long: ${fileName}`);
            return { valid: false, error: 'Filename too long (max 255 characters)' };
        }

        const invalidChars = /[<>:"|?*\x00-\x1f]/;
        if (invalidChars.test(fileName)) {
            console.warn(`[PDF Validation] Invalid characters in filename: ${fileName}`);
            return { valid: false, error: 'Filename contains invalid characters' };
        }

        console.log(`[PDF Validation] File validated: ${fileName} (${(actualFileSize / 1024).toFixed(2)}KB)`);
        return { 
            valid: true, 
            fileSize: actualFileSize,
            extension: fileExtension
        };
    } catch (error) {
        console.error(`[PDF Validation] Error validating file ${fileName}:`, error);
        return { valid: false, error: error.message };
    }
}

function transformReportDataForPDF(report, details, siteInformation) {
    const pdfData = {
        customer: report.Customer_Name || '',
        attn: report.Attn || '',
        projectName: report.Project_Name || '',
        yourRef: report.Your_Ref || '',
        reportNo: report.Report_ID || '',
        date: report.Date ? new Date(report.Date).toISOString().split('T')[0] : '',
        serviceBy: report.Service_By || '',
        purpose: report.Purpose_Of_Visit ? [report.Purpose_Of_Visit] : [],
        siteInformation: [],
        details: [],
        customerSignature: '',
        customerName: '',
        customerDate: '',
        generalRemarks: '',
        approvedBy: '',
        approverName: '',
        approverDate: ''
    };

    if (siteInformation && Array.isArray(siteInformation) && siteInformation.length > 0) {
        pdfData.siteInformation = siteInformation.map(site => ({
            name: site.Name || site.System_Machine_Name || site.Machine_Name || '',
            plcHmi: site.PLC_HMI || '',
            brand: site.Brand || '',
            modelNumber: site.Model_Number || '',
            remarks: site.Remarks || ''
        }));
    }

    if (details && Array.isArray(details) && details.length > 0) {
        const detailsMap = new Map();
        details.forEach(detail => {
            const detailIndex = detail.Detail_Index || detail.Detail_ID || 0;

            if (!detailsMap.has(detailIndex)) {
                detailsMap.set(detailIndex, {
                    date: detail.Date ? new Date(detail.Date).toISOString().split('T')[0] : null,
                    outTime: detail.Out_Time || null,
                    startTime: detail.Start_Time || null,
                    endTime: detail.End_Time || null,
                    inTime: detail.In_Time || null,
                    travelTime: detail.Travel_Time_hr !== null && detail.Travel_Time_hr !== undefined ? detail.Travel_Time_hr.toString() : null,
                    workTime: detail.Work_Time_hr !== null && detail.Work_Time_hr !== undefined ? detail.Work_Time_hr.toString() : null,
                    overTime: detail.Over_Time_hr !== null && detail.Over_Time_hr !== undefined ? detail.Over_Time_hr.toString() : null,
                    mileage: detail.Mileage !== null && detail.Mileage !== undefined ? detail.Mileage.toString() : null,
                    toll: detail.Toll_Amount !== null && detail.Toll_Amount !== undefined ? detail.Toll_Amount.toString() : null,
                    hotel: detail.Hotel_Amount !== null && detail.Hotel_Amount !== undefined ? detail.Hotel_Amount.toString() : null,
                    others: detail.Others || null,
                    problemDetails: detail.Problem_Details || '',
                    jobDescription: detail.Job_Description || '',
                    images: []
                });
            }

            const currentDetail = detailsMap.get(detailIndex);

            const UPLOAD_BASE_DIR = path.join(__dirname, '..', 'uploads', 'details');
            const reportId = report.Report_ID;

            if (detail.File_Name && detail.Detail_ID) {
                const imagePath = path.join(UPLOAD_BASE_DIR, `report_${reportId}`, `detail_${detail.Detail_ID}`, detail.File_Name);

                const validation = validateImageFile(imagePath, detail.File_Name, detail.File_Size);

                if (validation.valid) {
                    try {
                        const imageBuffer = fs.readFileSync(imagePath);
                        console.log(`[DataTransformer] Added single image from disk: ${detail.File_Name}`);
                        currentDetail.images.push({
                            fileName: detail.File_Name || 'image.jpg',
                            fileSize: validation.fileSize || imageBuffer.length,
                            fileType: detail.File_Type || 'image/jpeg',
                            fileExtension: validation.extension || detail.File_Extension || 'jpg',
                            buffer: imageBuffer
                        });
                    } catch (error) {
                        console.error(`[DataTransformer] Error reading image file ${imagePath}:`, error);
                    }
                } else {
                    console.warn(`[DataTransformer] Skipping invalid file: ${detail.File_Name} - ${validation.error}`);
                }
            }

            if (detail.images && Array.isArray(detail.images) && detail.images.length > 0) {
                console.log(`[DataTransformer] Processing ${detail.images.length} images from array`);
                detail.images.forEach((img, idx) => {
                    if (img.File_Name && img.Detail_ID) {
                        const imagePath = path.join(UPLOAD_BASE_DIR, `report_${reportId}`, `detail_${img.Detail_ID}`, img.File_Name);

                        const validation = validateImageFile(imagePath, img.File_Name, img.File_Size);

                        if (validation.valid) {
                            try {
                                const imageBuffer = fs.readFileSync(imagePath);
                                console.log(`[DataTransformer] Added image ${idx + 1} from disk: ${img.File_Name}`);
                                currentDetail.images.push({
                                    fileName: img.File_Name || 'image.jpg',
                                    fileSize: validation.fileSize || imageBuffer.length,
                                    fileType: img.File_Type || 'image/jpeg',
                                    fileExtension: validation.extension || img.File_Extension || 'jpg',
                                    buffer: imageBuffer
                                });
                            } catch (error) {
                                console.error(`[DataTransformer] Error reading image file ${imagePath}:`, error);
                            }
                        } else {
                            console.warn(`[DataTransformer] Skipping invalid file ${idx + 1}: ${img.File_Name} - ${validation.error}`);
                        }
                    } else {
                        console.log(`[DataTransformer] Skipping image ${idx + 1}: missing File_Name or Detail_ID`);
                    }
                });
            }
        });

        pdfData.details = Array.from(detailsMap.values());
        console.log('PDF Data Details with Images:');
        pdfData.details.forEach((detail, index) => {
            console.log(`  Detail ${index + 1}: ${detail.images.length} image(s)`);
            detail.images.forEach((img, imgIndex) => {
                console.log(`    Image ${imgIndex + 1}: ${img.fileName} (${img.fileSize} bytes)`);
            });
        });
    }

    return pdfData;
}

function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

function formatTime(time) {
    if (!time) return '';
    return time;
}

function formatCurrency(amount) {
    if (amount === null || amount === undefined || amount === '') return '';
    return `RM ${parseFloat(amount).toFixed(2)}`;
}

function formatWithUnit(value, unit) {
    if (value === null || value === undefined || value === '') return '';
    return `${value} ${unit}`;
}

module.exports = {
    transformReportDataForPDF,
    formatDate,
    formatTime,
    formatCurrency,
    formatWithUnit
};