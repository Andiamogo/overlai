const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

class ScreenShareInvisibleWindow {
    constructor() {
        this.window = null;
    }

    async initialize() {
        await app.whenReady();
        
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
            this.window.setVisibleOnAllWorkspaces(false);
        }
        
        this.window.loadFile('private-overlay.html');
        
        this.setupGlobalShortcuts();
        
        this.window.show();
    }

    setupGlobalShortcuts() {
        const { globalShortcut } = require('electron');
        
        globalShortcut.register('CommandOrControl+Shift+H', () => {
            this.window.isVisible() ? this.window.hide() : this.window.show()
        });

        globalShortcut.register('CommandOrControl+Shift+T', () => {
            const isOnTop = this.window.isAlwaysOnTop();
            this.window.setAlwaysOnTop(!isOnTop);
            console.log(`Always on top: ${!isOnTop}`);
        });
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