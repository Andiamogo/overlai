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
                backgroundThrottling: false, // Keep running when not focused
                offscreen: false,
            },
            // Additional stealth properties
            titleBarStyle: 'hidden',
            trafficLightPosition: { x: -100, y: -100 }, // Hide traffic lights off-screen
            hasShadow: false, // No shadow to avoid detection
            thickFrame: false, // No thick frame
            acceptFirstMouse: true,
            disableAutoHideCursor: true
        });

        this.window.setOpacity(0.7)
        this.window.setIgnoreMouseEvents(true)

        // Prevent window from being captured by screen sharing
        if (process.platform === 'win32') {
            // Windows specific: Set window to be excluded from capture
            this.window.setContentProtection(true);
            // Additional Windows-specific stealth
            this.window.setSkipTaskbar(true);
        } else if (process.platform === 'darwin') {
            // macOS specific stealth settings
            this.window.setVisibleOnAllWorkspaces(false);
        }
        
        // Make window draggable since we removed the frame
        this.window.loadFile('private-overlay.html');
        
        // Optional: Add keyboard shortcut to toggle visibility
        this.setupGlobalShortcuts();
        
        this.window.show();
    }

    setupGlobalShortcuts() {
        const { globalShortcut } = require('electron');
        
        // Ctrl+Shift+H to toggle window visibility
        globalShortcut.register('CommandOrControl+Shift+H', () => {
            if (this.window.isVisible()) {
                this.window.hide();
                console.log('Window hidden');
            } else {
                this.window.show();
                console.log('Window shown');
            }
        });

        // Ctrl+Shift+T to toggle always on top
        globalShortcut.register('CommandOrControl+Shift+T', () => {
            const isOnTop = this.window.isAlwaysOnTop();
            this.window.setAlwaysOnTop(!isOnTop);
            console.log(`Always on top: ${!isOnTop}`);
        });
    }
}

// Usage
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
    // Unregister all shortcuts
    const { globalShortcut } = require('electron');
    globalShortcut.unregisterAll();
});