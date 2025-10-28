const puppeteer = require('puppeteer');

class BrowserPool {
    constructor(maxBrowsers = 3) {
        this.maxBrowsers = maxBrowsers;
        this.browsers = [];
        this.busyBrowsers = new Set();
        this.queue = [];
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        console.log(`Initializing browser pool with ${this.maxBrowsers} instances...`);
        
        const fs = require('fs');

        const browserPaths = [
            { path: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', name: 'Microsoft Edge' },
            { path: 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe', name: 'Microsoft Edge' },
            { path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', name: 'Google Chrome' },
            { path: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', name: 'Google Chrome' },
            { path: `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`, name: 'Google Chrome' },
            { path: `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`, name: 'Google Chrome' },
            { path: `${process.env['PROGRAMFILES(X86)']}\\Google\\Chrome\\Application\\chrome.exe`, name: 'Google Chrome' }
        ];
        
        const launchOptions = {
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        };

        let browserFound = false;
        for (const browser of browserPaths) {
            if (browser.path && fs.existsSync(browser.path)) {
                launchOptions.executablePath = browser.path;
                console.log(`Using ${browser.name}: ${browser.path}`);
                browserFound = true;
                break;
            }
        }

        if (!browserFound) {
            console.log('No Edge or Chrome found, using Puppeteer bundled Chromium');
        }

        for (let i = 0; i < this.maxBrowsers; i++) {
            try {
                const browser = await puppeteer.launch(launchOptions);
                this.browsers.push(browser);
                console.log(`Browser ${i + 1}/${this.maxBrowsers} initialized`);
            } catch (error) {
                console.error(`Failed to initialize browser ${i + 1}:`, error);
            }
        }

        this.initialized = true;
        console.log(`Browser pool ready with ${this.browsers.length} instances`);
    }

    async acquireBrowser() {
        if (!this.initialized) {
            await this.initialize();
        }

        for (const browser of this.browsers) {
            if (!this.busyBrowsers.has(browser)) {
                this.busyBrowsers.add(browser);
                return browser;
            }
        }

        return new Promise((resolve) => {
            this.queue.push(resolve);
        });
    }

    releaseBrowser(browser) {
        this.busyBrowsers.delete(browser);

        if (this.queue.length > 0) {
            const resolve = this.queue.shift();
            this.busyBrowsers.add(browser);
            resolve(browser);
        }
    }

    async generatePDF(htmlPath) {
        const browser = await this.acquireBrowser();
        
        try {
            const page = await browser.newPage();
            
            await page.goto(`file://${htmlPath}`, { 
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '20mm',
                    bottom: '20mm',
                    left: '20mm'
                }
            });

            await page.close();
            
            return pdfBuffer;
        } finally {
            this.releaseBrowser(browser);
        }
    }

    async close() {
        console.log('Closing browser pool...');
        
        for (const browser of this.browsers) {
            try {
                await browser.close();
            } catch (error) {
                console.error('Error closing browser:', error);
            }
        }
        
        this.browsers = [];
        this.busyBrowsers.clear();
        this.initialized = false;
        
        console.log('Browser pool closed');
    }

    getStats() {
        return {
            total: this.browsers.length,
            busy: this.busyBrowsers.size,
            available: this.browsers.length - this.busyBrowsers.size,
            queued: this.queue.length
        };
    }
}
    
const browserPool = new BrowserPool(3);

module.exports = browserPool;

