const { query } = require('../config/db.config');
const { moveFileToFinalLocation, deleteFile } = require('../middleware/uploadMiddleware');

class DetailsModel {
    static async createDetails(reportId, detailsData) {
        try {
            if (!detailsData || !Array.isArray(detailsData) || detailsData.length === 0) {
                return { success: true, message: 'No details to insert' };
            }

            const results = [];
            
            for (const detail of detailsData) {
                const {
                    date,
                    outTime,
                    startTime,
                    endTime,
                    inTime,
                    travelTime,
                    workTime,
                    overTime,
                    mileage,
                    tollAmount,
                    hotelAmount,
                    others,
                    problemDetails,
                    jobDescription,
                    image,
                    fileName,
                    fileSize,
                    fileType,
                    fileExtension
                } = detail;

                if (!date) {
                    continue;
                }

                const parseTimeValue = (value) => {
                    if (!value) return null;
                    const numericValue = parseFloat(value.toString().replace(' hrs', ''));
                    return isNaN(numericValue) ? null : numericValue;
                };

                const sqlQuery = `
                    INSERT INTO Details (
                        Report_ID, Date, Out_Time, Start_Time, End_Time, In_Time,
                        Travel_Time_hr, Work_Time_hr, Over_Time_hr,
                        Mileage, Toll_Amount, Hotel_Amount, Others, Problem_Details, Job_Description
                    ) 
                    OUTPUT INSERTED.Detail_ID
                    VALUES (
                        @reportId, @date, @outTime, @startTime, @endTime, @inTime,
                        @travelTime, @workTime, @overTime,
                        @mileage, @tollAmount, @hotelAmount, @others, @problemDetails, @jobDescription
                    )
                `;

                const params = {
                    reportId: parseInt(reportId),
                    date: date,
                    outTime: outTime || null,
                    startTime: startTime || null,
                    endTime: endTime || null,
                    inTime: inTime || null,
                    travelTime: parseTimeValue(travelTime),
                    workTime: parseTimeValue(workTime),
                    overTime: parseTimeValue(overTime),
                    mileage: mileage ? parseFloat(mileage) : null,
                    tollAmount: tollAmount ? parseFloat(tollAmount) : null,
                    hotelAmount: hotelAmount ? parseFloat(hotelAmount) : null,
                    others: others || null,
                    problemDetails: problemDetails || null,
                    jobDescription: jobDescription || null
                };

                const result = await query(sqlQuery, params);
                const detailId = result.recordset[0].Detail_ID;
                console.log('Inserted Detail_ID:', detailId);
                

                if (image || fileName || fileSize || fileType || fileExtension) {
                    console.log('Inserting single image metadata for Detail_ID:', detailId);
                    const imageQuery = `
                        INSERT INTO Detail_Images (
                            Detail_ID, File_Name, File_Type, File_Size, File_Extension, Uploaded_Date
                        ) VALUES (
                            @detailId, @fileName, @fileType, @fileSize, @fileExtension, GETDATE()
                        )
                    `;
                    
                    const imageParams = {
                        detailId: detailId,
                        fileName: fileName || null,
                        fileType: fileType || null,
                        fileSize: fileSize || null,
                        fileExtension: fileExtension || null
                    };
                    
                    await query(imageQuery, imageParams);
                    console.log('Single image metadata inserted successfully');
                }

                if (detail.images && Array.isArray(detail.images) && detail.images.length > 0) {
                    console.log(`Adding ${detail.images.length} new images to detail ${detailId}`);
                    
                    for (const imageData of detail.images) {
                        if (imageData.tempPath) {
                            try {
                                const finalFilePath = await moveFileToFinalLocation(
                                    imageData.tempPath, 
                                    reportId, 
                                    detailId, 
                                    imageData.fileName
                                );
                                console.log('File moved to:', finalFilePath);
                            } catch (moveError) {
                                console.error('Error moving file:', moveError);
                                throw moveError;
                            }
                        } else {
                            console.warn('No tempPath found for image:', imageData.fileName);
                        }
                        
                        const imageQuery = `
                            INSERT INTO Detail_Images (
                                Detail_ID, File_Name, File_Type, File_Size, File_Extension, Uploaded_Date
                            ) VALUES (
                                @detailId, @fileName, @fileType, @fileSize, @fileExtension, GETDATE()
                            )
                        `;
                        
                        const imageParams = {
                            detailId: detailId,
                            fileName: imageData.fileName || null,
                            fileType: imageData.fileType || null,
                            fileSize: imageData.fileSize || null,
                            fileExtension: imageData.fileExtension || null
                        };
                        
                        await query(imageQuery, imageParams);
                        console.log('Image metadata inserted successfully for file:', imageData.fileName);
                    }
                }
                
                results.push({ date, success: true, detailId: detailId });
            }

            return {
                success: true,
                message: `${results.length} detail entries created successfully`,
                insertedCount: results.length
            };
        } catch (error) {
            throw new Error(`Error creating details: ${error.message}`);
        }
    }

    static async getDetailsByReportId(reportId) {
        try {
            console.log('Getting details for report ID:', reportId);
            
            const checkQuery = `SELECT COUNT(*) as count FROM Details WHERE Report_ID = @reportId`;
            const checkResult = await query(checkQuery, { reportId: parseInt(reportId) });
            console.log('Details count for report', reportId, ':', checkResult.recordset[0].count);
            
            const tableCheckQuery = `SELECT COUNT(*) as total_count FROM Details`;
            const tableCheckResult = await query(tableCheckQuery);
            console.log('Total details count in database:', tableCheckResult.recordset[0].total_count);
            
            const detailsQuery = `
                SELECT 
                    Detail_ID,
                    Report_ID,
                    Date,
                    Out_Time,
                    Start_Time,
                    End_Time,
                    In_Time,
                    Travel_Time_hr,
                    Work_Time_hr,
                    Over_Time_hr,
                    Mileage,
                    Toll_Amount,
                    Hotel_Amount,
                    Others,
                    Problem_Details,
                    Job_Description
                FROM Details
                WHERE Report_ID = @reportId 
                ORDER BY Detail_ID
            `;
            const detailsResult = await query(detailsQuery, { reportId: parseInt(reportId) });
            
            if (detailsResult.recordset.length > 0) {
                const detailIds = detailsResult.recordset.map(detail => detail.Detail_ID);
                const imagesQuery = `
                    SELECT 
                        Image_ID,
                        Detail_ID,
                        Image,
                        File_Name,
                        File_Size,
                        File_Type,
                        File_Extension
                    FROM Detail_Images
                    WHERE Detail_ID IN (${detailIds.join(',')})
                    ORDER BY Detail_ID
                `;
                const imagesResult = await query(imagesQuery);
                const imagesByDetailId = {};
                imagesResult.recordset.forEach(image => {
                    if (!imagesByDetailId[image.Detail_ID]) {
                        imagesByDetailId[image.Detail_ID] = [];
                    }
                imagesByDetailId[image.Detail_ID].push({
                    Image_ID: image.Image_ID,
                    Detail_ID: image.Detail_ID, 
                    Image: image.Image,
                    File_Name: image.File_Name,
                    File_Size: image.File_Size,
                    File_Type: image.File_Type,
                    File_Extension: image.File_Extension
                });
                });
                
                const combinedResult = detailsResult.recordset.map(detail => {
                    const images = imagesByDetailId[detail.Detail_ID] || [];
                    
                    if (images.length === 1) {
                        return {
                            ...detail,
                            Image_ID: images[0].Image_ID,
                            Image: images[0].Image,
                            File_Name: images[0].File_Name,
                            File_Size: images[0].File_Size,
                            File_Type: images[0].File_Type,
                            File_Extension: images[0].File_Extension
                        };
                    } else if (images.length > 1) {
                        console.log(`Detail ${detail.Detail_ID} has ${images.length} images:`, images);
                        return {
                            ...detail,
                            images: images
                        };
                    } else {
                        return detail;
                    }
                });
                
                console.log('Details query result:', combinedResult);
                return combinedResult;
            } else {
                console.log('No details found for report ID:', reportId);
                return [];
            }
        } catch (error) {
            console.error('Error in getDetailsByReportId:', error);
            throw new Error(`Error getting details by report ID: ${error.message}`);
        }
    }

    static async updateDetail(detailId, detailData) {
        try {
            const {
                date,
                outTime,
                startTime,
                endTime,
                inTime,
                travelTime,
                workTime,
                overTime,
                mileage,
                tollAmount,
                hotelAmount,
                others,
                problemDetails,
                jobDescription,
                image,
                fileName,
                fileSize,
                fileType,
                fileExtension
            } = detailData;

            const parseTimeValue = (value) => {
                if (!value) return null;
                const numericValue = parseFloat(value.toString().replace(' hrs', ''));
                return isNaN(numericValue) ? null : numericValue;
            };

            const sqlQuery = `
                UPDATE Details SET
                    Date = @date,
                    Out_Time = @outTime,
                    Start_Time = @startTime,
                    End_Time = @endTime,
                    In_Time = @inTime,
                    Travel_Time_hr = @travelTime,
                    Work_Time_hr = @workTime,
                    Over_Time_hr = @overTime,
                    Mileage = @mileage,
                    Toll_Amount = @tollAmount,
                    Hotel_Amount = @hotelAmount,
                    Others = @others,
                    Problem_Details = @problemDetails,
                    Job_Description = @jobDescription
                WHERE Detail_ID = @detailId
            `;

            const params = {
                detailId: parseInt(detailId),
                date: date,
                outTime: outTime || null,
                startTime: startTime || null,
                endTime: endTime || null,
                inTime: inTime || null,
                travelTime: parseTimeValue(travelTime),
                workTime: parseTimeValue(workTime),
                overTime: parseTimeValue(overTime),
                mileage: mileage ? parseFloat(mileage) : null,
                tollAmount: tollAmount ? parseFloat(tollAmount) : null,
                hotelAmount: hotelAmount ? parseFloat(hotelAmount) : null,
                others: others || null,
                problemDetails: problemDetails || null,
                jobDescription: jobDescription || null
            };
            

            await query(sqlQuery, params);
            
            if (detailData.images && Array.isArray(detailData.images) && detailData.images.length > 0) {
                console.log(`Adding ${detailData.images.length} new images to detail ${detailId}`);
                
                const reportIdQuery = 'SELECT Report_ID FROM Details WHERE Detail_ID = @detailId';
                const reportIdResult = await query(reportIdQuery, { detailId: parseInt(detailId) });
                const reportId = reportIdResult.recordset[0].Report_ID;
                
                for (const imageData of detailData.images) {
                    if (imageData.tempPath) {
                        const finalFilePath = await moveFileToFinalLocation(
                            imageData.tempPath, 
                            reportId, 
                            detailId, 
                            imageData.fileName
                        );
                        console.log('File moved to:', finalFilePath);
                    }
                    
                    const imageQuery = `
                        INSERT INTO Detail_Images (
                            Detail_ID, File_Name, File_Type, File_Size, File_Extension, Uploaded_Date
                        ) VALUES (
                            @detailId, @fileName, @fileType, @fileSize, @fileExtension, GETDATE()
                        )
                    `;
                    
                    const imageParams = {
                        detailId: parseInt(detailId),
                        fileName: imageData.fileName || null,
                        fileType: imageData.fileType || null,
                        fileSize: imageData.fileSize || null,
                        fileExtension: imageData.fileExtension || null
                    };
                    
                    await query(imageQuery, imageParams);
                    console.log(`Added new image metadata: ${imageData.fileName}`);
                }
            }
            
            return { success: true, message: 'Detail updated successfully' };
        } catch (error) {
            throw new Error(`Error updating detail: ${error.message}`);
        }
    }

    static async deleteDetail(detailId) {
        try {
            const sqlQuery = `
                DELETE FROM Details 
                WHERE Detail_ID = @detailId
            `;
            await query(sqlQuery, { detailId: parseInt(detailId) });
            return { success: true, message: 'Detail deleted successfully' };
        } catch (error) {
            throw new Error(`Error deleting detail: ${error.message}`);
        }
    }

    static async deleteDetailsByReportId(reportId) {
        try {
            const getDetailsQuery = `SELECT Detail_ID FROM Details WHERE Report_ID = @reportId`;
            const detailsResult = await query(getDetailsQuery, { reportId: parseInt(reportId) });
            
            if (detailsResult.recordset.length > 0) {
                const detailIds = detailsResult.recordset.map(row => row.Detail_ID);
                const getImagesQuery = `
                    SELECT di.File_Name, di.Detail_ID 
                    FROM Detail_Images di
                    WHERE di.Detail_ID IN (${detailIds.map(id => `'${id}'`).join(',')})
                `;
                const imagesResult = await query(getImagesQuery);
                
                const path = require('path');
                const { UPLOAD_BASE_DIR } = require('../middleware/uploadMiddleware');
                
                for (const row of imagesResult.recordset) {
                    if (row.File_Name && row.Detail_ID) {
                        const filePath = path.join(UPLOAD_BASE_DIR, `report_${reportId}`, `detail_${row.Detail_ID}`, row.File_Name);
                        await deleteFile(filePath);
                    }
                }

                const deleteImagesQuery = `DELETE FROM Detail_Images WHERE Detail_ID IN (${detailIds.map(id => `'${id}'`).join(',')})`;
                await query(deleteImagesQuery);
            }
            
            const sqlQuery = `
                DELETE FROM Details 
                WHERE Report_ID = @reportId
            `;
            await query(sqlQuery, { reportId: parseInt(reportId) });
            return { success: true, message: 'All details deleted successfully' };
        } catch (error) {
            throw new Error(`Error deleting details by report ID: ${error.message}`);
        }
    }

    static async deleteDetailImages(detailImageIds) {
        try {
            console.log('deleteDetailImages called with IDs:', detailImageIds);
            
            if (!detailImageIds || detailImageIds.length === 0) {
                console.log('No images to delete');
                return { success: true, message: 'No images to delete' };
            }

            const selectQuery = `
                SELECT di.Image_ID, di.Detail_ID, di.File_Name, d.Report_ID 
                FROM Detail_Images di
                INNER JOIN Details d ON di.Detail_ID = d.Detail_ID
                WHERE di.Image_ID IN (${detailImageIds.map(id => `'${id}'`).join(',')})
            `;
            const selectResult = await query(selectQuery);
            
            const path = require('path');
            const { UPLOAD_BASE_DIR } = require('../middleware/uploadMiddleware');

            for (const row of selectResult.recordset) {
                if (row.File_Name && row.Report_ID && row.Detail_ID) {
                    const filePath = path.join(UPLOAD_BASE_DIR, `report_${row.Report_ID}`, `detail_${row.Detail_ID}`, row.File_Name);
                    await deleteFile(filePath);
                }
            }

            const deleteQuery = `DELETE FROM Detail_Images WHERE Image_ID IN (${detailImageIds.map(id => `'${id}'`).join(',')})`;
            console.log('Executing delete query:', deleteQuery);
            
            const result = await query(deleteQuery);
            console.log('Delete query result:', result);
            
            console.log(`Deleted ${detailImageIds.length} detail images`);
            return { success: true, message: `${detailImageIds.length} images deleted successfully` };
        } catch (error) {
            console.error('Error in deleteDetailImages:', error);
            throw new Error(`Error deleting detail images: ${error.message}`);
        }
    }
}

module.exports = DetailsModel;
