const express = require('express');
const path = require('path');
const browserPool = require('./utils/browserPool');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'htmls', 'index.html'));
});

app.get('/review-report.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'htmls', 'review-report.html'));
});

app.get('/edit-report.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'htmls', 'edit-report.html'));
});

app.get('/report-list.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'htmls', 'report-list.html'));
});

app.get('/staff-schedule.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'htmls', 'staff-schedule.html'));
});

app.get('/generate-pdf', async (req, res) => {
    try {
        console.log('Starting PDF generation using browser pool.');
        const stats = browserPool.getStats();
        console.log(`Browser pool stats - Total: ${stats.total}, Busy: ${stats.busy}, Available: ${stats.available}, Queued: ${stats.queued}`);
        
        const htmlPath = path.join(__dirname, 'public', 'htmls', 'pdf-template.html');
        console.log('Loading HTML template from:', htmlPath);
        
        const pdfBuffer = await browserPool.generatePDF(htmlPath);
        
        console.log('PDF generated successfully, buffer size:', pdfBuffer.length);

        // Tell browser this is a PDF stream, not a file download
        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
            'Content-Disposition': 'inline; filename="service-report.pdf"',
            'Accept-Ranges': 'bytes'
        });

        res.end(pdfBuffer);
        console.log('PDF sent to browser successfully.');

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF');
    }
});

const routes = [
    { path: '/api/customer', module: './routes/customerRoute' },
    { path: '/api/reports', module: './routes/reportRoute' },
    { path: '/api/report', module: './routes/reportRoute' },
    { path: '/api/schedule', module: './routes/scheduleRoute' },
    { path: '/api/autocomplete', module: './routes/autocompleteRoute' },
    { path: '/api/reminders', module: './routes/reminderRoute' },
    { path: '/api/telegram', module: './routes/telegramConnectionRoute' }
];

routes.forEach(route => {
    app.use(route.path, require(route.module));
});

app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
