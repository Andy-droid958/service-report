const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

class PDFGenerator {
    constructor() {
        this.browser = null;
    }

    async initialize() {
        if (!this.browser) {
            const fs = require('fs');
            const edgePaths = [
                'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
                'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
            ];
            
            const launchOptions = {
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            };

            let edgeFound = false;
            for (const edgePath of edgePaths) {
                if (fs.existsSync(edgePath)) {
                    console.log(`Using Microsoft Edge for PDF generation: ${edgePath}`);
                    launchOptions.executablePath = edgePath;
                    edgeFound = true;
                    break;
                }
            }
            
            if (!edgeFound) {
                console.log('Edge not found, using default browser for PDF generation');
            }
            
            this.browser = await puppeteer.launch(launchOptions);
        }
    }

    async generateServiceReportPDF(outputPath = null) {
        try {
            await this.initialize();
            const page = await this.browser.newPage();

            const htmlPath = path.join(__dirname, '../public/htmls/pdf-template.html');
            
            if (!fs.existsSync(htmlPath)) {
                throw new Error(`HTML template not found at: ${htmlPath}`);
            }

            await page.goto(`file://${htmlPath}`, {
                waitUntil: 'networkidle0'
            });

            if (!outputPath) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                outputPath = path.join('C:', 'Service Report', 'public', 'uploads', `service-report-${timestamp}.pdf`);
            }

            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            const pdfBuffer = await page.pdf({
                path: outputPath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '15mm',
                    right: '15mm',
                    bottom: '15mm',
                    left: '15mm'
                },
                preferCSSPageSize: false,
                displayHeaderFooter: false
            });

            await page.close();
            
            return {
                success: true,
                filePath: outputPath,
                buffer: pdfBuffer
            };

        } catch (error) {
            console.error('Error generating PDF:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async generateServiceReportWithData(data, outputPath = null) {
        try {
            await this.initialize();
            const page = await this.browser.newPage();

            const htmlPath = path.join(__dirname, '../public/htmls/pdf-template.html');
            
            if (!fs.existsSync(htmlPath)) {
                throw new Error(`HTML template not found at: ${htmlPath}`);
            }

            await page.goto(`file://${htmlPath}`, {
                waitUntil: 'networkidle0'
            });

            if (data) {
                await this.fillFormData(page, data);
            }

            if (!outputPath) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                outputPath = path.join('C:', 'Service Report', 'public', 'uploads', `service-report-${timestamp}.pdf`);
            }

            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            const pdfBuffer = await page.pdf({
                path: outputPath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '15mm',
                    right: '15mm',
                    bottom: '15mm',
                    left: '15mm'
                },
                preferCSSPageSize: false,
                displayHeaderFooter: false
            });

            await page.close();
            
            return {
                success: true,
                filePath: outputPath,
                buffer: pdfBuffer
            };

        } catch (error) {
            console.error('Error generating PDF with data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async fillFormData(page, data) {
        try {
            if (data.customer) {
                await page.evaluate((value) => {
                    const fields = document.querySelectorAll('.info-field .input-line');
                    if (fields[0]) fields[0].textContent = value;
                }, data.customer);
            }

            if (data.attn) {
                await page.evaluate((value) => {
                    const fields = document.querySelectorAll('.info-field .input-line');
                    if (fields[1]) fields[1].textContent = value;
                }, data.attn);
            }

            if (data.projectName) {
                await page.evaluate((value) => {
                    const fields = document.querySelectorAll('.info-field .input-line');
                    if (fields[2]) fields[2].textContent = value;
                }, data.projectName);
            }

            if (data.yourRef) {
                await page.evaluate((value) => {
                    const fields = document.querySelectorAll('.info-field .input-line');
                    if (fields[3]) fields[3].textContent = value;
                }, data.yourRef);
            }

            if (data.reportNo) {
                await page.evaluate((value) => {
                    const fields = document.querySelectorAll('.info2-field .input-line');
                    if (fields[0]) fields[0].textContent = value;
                }, data.reportNo);
            }

            if (data.date) {
                await page.evaluate((value) => {
                    const fields = document.querySelectorAll('.info2-field .input-line');
                    if (fields[1]) fields[1].textContent = value;
                }, data.date);
            }

            if (data.serviceBy) {
                await page.evaluate((value) => {
                    const fields = document.querySelectorAll('.info2-field .input-line');
                    if (fields[2]) fields[2].textContent = value;
                }, data.serviceBy);
            }

            if (data.purpose && Array.isArray(data.purpose)) {
                for (const purpose of data.purpose) {
                    await page.evaluate((purposeValue) => {
                        const predefinedPurposes = ['machine-delivery', 'commissioning', 'maintenance', 'calibration', 'repair', 'troubleshooting', 'engineering'];
                        const checkbox = document.getElementById(purposeValue);
                        
                        if (checkbox) {
                            checkbox.checked = true;
                        } else if (!predefinedPurposes.includes(purposeValue)) {
                            const othersCheckbox = document.getElementById('others');
                            if (othersCheckbox) {
                                othersCheckbox.checked = true;
                                const inputLine = othersCheckbox.parentElement.querySelector('.inline-input');
                                if (inputLine) {
                                    inputLine.textContent = purposeValue;
                                }
                            }
                        }
                    }, purpose);
                }
            }

            if (data.siteInformation && Array.isArray(data.siteInformation) && data.siteInformation.length > 0) {
                await page.evaluate((siteData) => {
                    const tbody = document.querySelector('.device-table tbody');
                    if (tbody) {
                        tbody.innerHTML = '';
                        
                        siteData.forEach((site) => {
                            const row = document.createElement('tr');
                            const cells = [
                                site.name || '',
                                site.plcHmi || '',
                                site.brand || '',
                                site.modelNumber || '',
                                site.remarks || ''
                            ];
                            
                            cells.forEach(cellText => {
                                const cell = document.createElement('td');
                                cell.textContent = cellText;
                                row.appendChild(cell);
                            });
                            
                            tbody.appendChild(row);
                        });
                    }
                }, data.siteInformation);
            }
            if (data.details && Array.isArray(data.details) && data.details.length > 0) {
                const detailsWithBase64Images = data.details.map(detail => {
                    const detailCopy = { ...detail };
                    if (detail.images && detail.images.length > 0) {
                        detailCopy.images = detail.images
                            .filter(img => {
                                if (!img.buffer || !Buffer.isBuffer(img.buffer)) {
                                    console.warn(`[PDFGenerator] Skipping image (no buffer): ${img.fileName || 'unknown'}`);
                                    return false;
                                }
                                if (img.buffer.length === 0) {
                                    console.warn(`[PDFGenerator] Skipping empty image: ${img.fileName}`);
                                    return false;
                                }
                                if (img.buffer.length > 5 * 1024 * 1024) {
                                    console.warn(`[PDFGenerator] Skipping oversized image: ${img.fileName} (${(img.buffer.length / (1024 * 1024)).toFixed(2)}MB)`);
                                    return false;
                                }
                                return true;
                            })
                            .map(img => {
                                try {
                                    console.log(`[PDFGenerator] Converting buffer to base64 for: ${img.fileName} (${(img.fileSize / 1024).toFixed(2)}KB)`);
                                    return {
                                        fileName: img.fileName || 'image.jpg',
                                        fileSize: img.fileSize || img.buffer.length,
                                        fileType: img.fileType || 'image/jpeg',
                                        fileExtension: img.fileExtension || 'jpg',
                                        base64Data: img.buffer.toString('base64')
                                    };
                                } catch (error) {
                                    console.error(`[PDFGenerator] Error converting image to base64: ${img.fileName}`, error);
                                    return null;
                                }
                            })
                            .filter(img => img !== null); 
                    }
                    return detailCopy;
                });
                
                await page.evaluate((detailsData) => {
                    const container = document.getElementById('detailsContainer');
                    if (!container) return;
                    
                    container.innerHTML = '';
                    
                    const formatTime = (timeValue) => {
                        if (!timeValue || timeValue === null || timeValue === undefined || timeValue === '') {
                            return 'N/A';
                        }
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
                    };
                    
                    const formatValue = (value, unit = '') => {
                        if (value === null || value === undefined || value === '') {
                            return 'N/A';
                        }
                        return unit ? `${value} ${unit}` : value;
                    };
                    
                    detailsData.forEach((detailData, index) => {
                        const card = document.createElement('div');
                        card.className = 'details-card';
                        card.setAttribute('data-details-index', index + 1);
                        
                        const cardContent = document.createElement('div');
                        cardContent.className = 'details-card-content';
                        
                        const tableWrapper = document.createElement('div');
                        tableWrapper.className = 'details-table';
                        
                        const table = document.createElement('table');
                        table.innerHTML = `
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Out Time</th>
                                    <th>Start Time</th>
                                    <th>End Time</th>
                                    <th>In Time</th>
                                    <th>Travel Time</th>
                                    <th>Work Time</th>
                                    <th>Over Time</th>
                                    <th>Mil</th>
                                    <th>Toll</th>
                                    <th>Hotel</th>
                                    <th>Others</th>
                                </tr>
                            </thead>
                        `;
                        
                        const tbody = document.createElement('tbody');
                        tbody.className = 'detailsTableBody';
                        const row = document.createElement('tr');
                        
                        const cells = [
                            formatValue(detailData.date),          
                            formatTime(detailData.outTime),        
                            formatTime(detailData.startTime),   
                            formatTime(detailData.endTime),        
                            formatTime(detailData.inTime),        
                            formatValue(detailData.travelTime, 'hr'),
                            formatValue(detailData.workTime, 'hr'),  
                            formatValue(detailData.overTime, 'hr'), 
                            formatValue(detailData.mileage, 'km'),    
                            detailData.toll ? `RM ${detailData.toll}` : 'N/A',  
                            detailData.hotel ? `RM ${detailData.hotel}` : 'N/A', 
                            formatValue(detailData.others)         
                        ];
                        
                        cells.forEach(cellText => {
                            const cell = document.createElement('td');
                            cell.textContent = cellText;
                            row.appendChild(cell);
                        });
                        
                        tbody.appendChild(row);
                        table.appendChild(tbody);
                        tableWrapper.appendChild(table);
                        cardContent.appendChild(tableWrapper);
                        const problemField = document.createElement('div');
                        problemField.className = 'description-field';
                        problemField.innerHTML = `
                            <h5 class="details-subtitle">Details of Problem</h5>
                            <div class="text-area-lines">
                                ${detailData.problemDetails ? detailData.problemDetails.split('\n').map(line => 
                                    `<div class="line">${line}</div>`
                                ).join('') : '<div class="line"></div><div class="line"></div><div class="line"></div>'}
                            </div>
                        `;
                        cardContent.appendChild(problemField);
                        
                        const jobField = document.createElement('div');
                        jobField.className = 'description-field';
                        jobField.innerHTML = `
                            <h5 class="details-subtitle">Description of Job Done</h5>
                            <div class="text-area-lines">
                                ${detailData.jobDescription ? detailData.jobDescription.split('\n').map(line => 
                                    `<div class="line">${line}</div>`
                                ).join('') : '<div class="line"></div><div class="line"></div><div class="line"></div>'}
                            </div>
                        `;
                        cardContent.appendChild(jobField);
                        
                            const imageField = document.createElement('div');
                            imageField.className = 'description-field';
                        
                        const hasImages = detailData.images && detailData.images.length > 0;
                        
                        if (hasImages) {
                            const imageDataUrls = detailData.images.map((img, idx) => {
                                if (img.base64Data) {
                                    const mimeType = img.fileType || 'image/jpeg';
                                    console.log(`Creating data URL for image ${idx + 1}: ${img.fileName}, size: ${img.fileSize} bytes`);
                                    return {
                                        dataUrl: `data:${mimeType};base64,${img.base64Data}`,
                                        fileName: img.fileName || 'Unknown File',
                                        fileSize: img.fileSize || 0
                                    };
                                }
                                console.log(`Skipping image ${idx + 1}: no base64 data`);
                                return null;
                            }).filter(img => img !== null);
                            
                            console.log(`Detail card has ${imageDataUrls.length} images to display`);
                            
                            if (imageDataUrls.length > 0) {
                                imageField.innerHTML = `
                                    <h5 class="details-subtitle">Photos / Images (${imageDataUrls.length} file(s))</h5>
                                    <div class="image-preview-container">
                                        ${imageDataUrls.map(img => `
                                            <div class="image-preview-item">
                                                <img src="${img.dataUrl}" alt="${img.fileName}" />
                                                <div class="image-file-info">
                                                    <div class="image-file-name">${img.fileName}</div>
                                                    <div class="image-file-size">${(img.fileSize / 1024).toFixed(2)} KB</div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                `;
                                cardContent.appendChild(imageField);
                            }
                        }
                        
                        card.appendChild(cardContent);
                        container.appendChild(card);
                    });
                }, detailsWithBase64Images);
            }

        } catch (error) {
            console.error('Error filling form data:', error);
            throw error;
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

module.exports = PDFGenerator;
