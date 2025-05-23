const { app, BrowserWindow, Menu, screen } = require('electron');
const path = require('path');
require('dotenv').config()

class ScreenShareInvisibleWindow {
    constructor() {
      console.log(process.env.CLAUDE_API_KEY)
        this.window = null;
    }

    async initialize() {
        await app.whenReady();
        app.dock.hide();
        Menu.setApplicationMenu(null);

        // Get primary display info
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.workAreaSize;

        this.window = new BrowserWindow({
            width: width,
            height: height,
            x: 0, // Position in bottom-right corner
            y: 0,
            show: true, // Window is visible to you
            transparent: true, // Transparent background
            frame: false, // No frame at all - this prevents frame capture
            alwaysOnTop: true, // Stay on top
            skipTaskbar: true, // Hide from taskbar to avoid detection
            resizable: false, // Disable resize to avoid detection
            movable: true, // Still allow moving
            minimizable: false,
            maximizable: false,
            focusable: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                hardwareAcceleration: true,
                webgl: true,
                backgroundThrottling: false,
                offscreen: false,
            },
            titleBarStyle: 'hidden',
            trafficLightPosition: { x: -100, y: -100 },
            hasShadow: false,
            thickFrame: false,
            acceptFirstMouse: true,
            disableAutoHideCursor: true
        });

        this.window.setOpacity(0.7)
        this.window.setIgnoreMouseEvents(true)

        if (process.platform === 'win32') {
            this.window.setContentProtection(true);
            this.window.setSkipTaskbar(true);
        } else if (process.platform === 'darwin') {
            this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true});
        }

        this.window.loadFile('private-overlay.html');

        this.setupGlobalShortcuts();

        this.window.show();
    }

    async captureAndAnalyze() {
      const screenshot = require('screenshot-desktop');
          const axios = require('axios');
          const sharp = require('sharp');
          const fs = require('fs');
          const path = require('path');

          try {
              console.log('Taking screenshot...');

              // Capture screenshot
              const imgBuffer = await screenshot({ format: 'png' });

              // Resize to reduce API costs (optional)
              const resizedBuffer = await sharp(imgBuffer)
                  .resize(1200, null, { withoutEnlargement: true })
                  .png()
                  .toBuffer();

              // Convert to base64
              const base64Image = resizedBuffer.toString('base64');

              // Send to Claude API
              await this.sendToClaudeAPI(base64Image);

          } catch (error) {
              console.error('Screenshot error:', error);
          }
    }

    async sendToClaudeAPI(base64Image) {
        const axios = require('axios');

        try {
            const response = await axios.post('https://api.anthropic.com/v1/messages', {
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 1000,
                messages: [{
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Solve this coding problem using Python"
                        },
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: "image/png",
                                data: base64Image
                            }
                        }
                    ]
                }]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.CLAUDE_API_KEY || 'YOUR_API_KEY_HERE',
                    'anthropic-version': '2023-06-01'
                }
            });

            const analysis = response.data.content[0].text;
            this.displayAnalysis(analysis);

        } catch (error) {
            console.error('Claude API error:', error.response.data);
        }
    }

    displayAnalysis(analysis) {
        this.window.webContents.send('ai-analysis', analysis);
    }

    setupGlobalShortcuts() {
        const { globalShortcut } = require('electron');

        globalShortcut.register('CommandOrControl+Shift+H', () => {
            this.window.isVisible() ? this.window.hide() : this.window.show()
        });

        globalShortcut.register('CommandOrControl+Shift+J', () => {
          this.captureAndAnalyze()
        })

        globalShortCut.register('CommandOrControl+Shift+Up', () => {
          this.window.webContents.send('move', 'up');
        })

        globalShortCut.register('CommandOrControl+Shift+Down', () => {
          this.window.webContents.send('move', 'down');
        })
    }
}

const privateWindow = new ScreenShareInvisibleWindow();
privateWindow.initialize();

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        const privateWindow = new ScreenShareInvisibleWindow();
        privateWindow.initialize();
    }
});

app.on('will-quit', () => {
    const { globalShortcut } = require('electron');
    globalShortcut.unregisterAll();
});
