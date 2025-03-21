const isLocal = function (): boolean {
    return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
};

/**
 * Special function for Colyseus that handles different behavior than regular isLocal
 * When force_production_colyseus is set, we'll consider the environment as production
 * even when running locally.
 */
const isLocalForColyseus = function (): boolean {
    // If we have the force production flag set, always return false to use production settings
    if (localStorage.getItem('force_production_colyseus') === 'true') {
        return false;
    }
    
    // Otherwise, use the regular isLocal check
    return isLocal();
};

const apiUrl = function (port: number | string, serverHost: string | null = null): string {
    // For local development
    if (isLocal() && !serverHost) {
        return `http://localhost:${port}`;
    }
    
    // Use the server from localStorage if available
    const storedServer = localStorage.getItem('selectedServer');
    if (serverHost === null && storedServer) {
        return storedServer;
    }
    
    // Production URL if no serverHost provided
    if (!serverHost) {
        return 'https://api.degenquest.ai';
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
 * Clear all local storage data related to server selection and game state
 */
const clearLocalStorage = function (): void {
    try {
        localStorage.removeItem('selectedServer');
        localStorage.removeItem('force_production_colyseus');
        // Add other keys that should be cleared here
        console.log('Local storage cleared');
    } catch (error) {
        console.error('Failed to clear local storage:', error);
    }
};

export { isLocal, isLocalForColyseus, apiUrl, clearLocalStorage };
