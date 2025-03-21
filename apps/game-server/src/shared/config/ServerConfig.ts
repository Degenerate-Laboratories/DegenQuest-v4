/**
 * ServerConfig.ts
 * 
 * This file centralizes all server connection settings for the game client.
 * Any code that needs to connect to the backend should import from this file.
 */

/**
 * Default server configuration
 */
const SERVER_CONFIG = {
    // Base URL for the game server (HTTP/HTTPS)
    API_BASE_URL: 'http://localhost',
    
    // Default port for HTTP/API connections
    API_PORT: 3000,
    
    // Production API URL
    PRODUCTION_API_URL: 'https://api.degenquest.ai',
    
    // Base URL for WebSocket connections
    WS_BASE_URL: 'ws://localhost',
    
    // WebSocket URL for production
    PRODUCTION_WS_URL: 'wss://api.degenquest.ai',
    
    // Default port for WebSocket connections
    WS_PORT: 3000
};

/**
 * Check if the code is running in a browser environment
 */
export const isBrowser = (): boolean => {
    return typeof window !== 'undefined';
};

/**
 * Safely access localStorage
 */
export const getLocalStorageItem = (key: string): string | null => {
    if (!isBrowser()) {
        return null;
    }
    
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.error('Error accessing localStorage:', e);
        return null;
    }
};

/**
 * Safely set localStorage item
 */
export const setLocalStorageItem = (key: string, value: string): void => {
    if (!isBrowser()) {
        return;
    }
    
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.error('Error setting localStorage item:', e);
    }
};

/**
 * Check if the client is running on localhost
 */
export const isLocal = (): boolean => {
    // In Node.js environment, we're always considering it "local"
    if (!isBrowser()) {
        return true;
    }
    
    // In browser environment, check hostname
    return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
};

/**
 * Special function for Colyseus that handles different behavior than regular isLocal
 * When force_production_colyseus is set, we'll consider the environment as production
 * even when running locally.
 */
export const isLocalForColyseus = (): boolean => {
    // If not in browser, we're in server/node environment
    if (!isBrowser()) {
        return true;
    }
    
    // If we have the force production flag set, always return false to use production settings
    if (getLocalStorageItem('force_production_colyseus') === 'true') {
        return false;
    }
    
    // Otherwise, use the regular isLocal check
    return isLocal();
};

/**
 * Get the API URL for HTTP requests
 */
export const getApiUrl = (port: number | string = SERVER_CONFIG.API_PORT, serverHost: string | null = null): string => {
    // For local development
    if (isLocal() && !serverHost) {
        return `${SERVER_CONFIG.API_BASE_URL}:${port}`;
    }
    
    // Use the server from localStorage if available
    const storedServer = getLocalStorageItem('selectedServer');
    if (serverHost === null && storedServer) {
        return storedServer;
    }
    
    // Production URL if no serverHost provided
    if (!serverHost) {
        return SERVER_CONFIG.PRODUCTION_API_URL;
    }
    
    // Handle provided serverHost
    if (serverHost.includes('localhost')) {
        // Local development can use HTTP
        if (!serverHost.startsWith('http://') && !serverHost.startsWith('https://')) {
            return `http://${serverHost}`;
        }
        return serverHost;
    } else {
        // Production environments must use HTTPS
        if (!serverHost.startsWith('http://') && !serverHost.startsWith('https://')) {
            return `https://${serverHost}`;
        } else if (serverHost.startsWith('http://')) {
            return serverHost.replace('http://', 'https://');
        }
        return serverHost;
    }
};

/**
 * Get the WebSocket URL for Colyseus connections
 */
export const getWsUrl = (port: number | string = SERVER_CONFIG.WS_PORT): string => {
    // Check stored server first for WebSocket connections
    const storedServer = getLocalStorageItem('selectedServer');
    if (storedServer) {
        // Convert HTTP URLs to WebSocket URLs if needed
        if (storedServer.startsWith('http://')) {
            return storedServer.replace('http://', 'ws://');
        } else if (storedServer.startsWith('https://')) {
            return storedServer.replace('https://', 'wss://');
        }
        
        // If it's already a WebSocket URL or just a hostname, return it
        if (storedServer.startsWith('ws://') || storedServer.startsWith('wss://')) {
            return storedServer;
        } else {
            // If it's just a hostname, add the proper protocol
            return (storedServer.includes('localhost') ? 'ws://' : 'wss://') + storedServer;
        }
    }
    
    // Use local or production based on environment
    if (isLocalForColyseus()) {
        return `${SERVER_CONFIG.WS_BASE_URL}:${port}`;
    } else {
        return SERVER_CONFIG.PRODUCTION_WS_URL;
    }
};

/**
 * Clear all local storage data related to server selection
 */
export const clearServerStorage = (): void => {
    try {
        if (isBrowser()) {
            localStorage.removeItem('selectedServer');
            localStorage.removeItem('force_production_colyseus');
            console.log('Server storage settings cleared');
        }
    } catch (error) {
        console.error('Failed to clear server storage settings:', error);
    }
};

export default SERVER_CONFIG; 