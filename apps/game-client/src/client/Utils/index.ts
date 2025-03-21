import { isLocalEnvironment, getServerUrl, clearServerStorage } from "../../shared/config/ServerHelper";

// Re-export isLocalEnvironment as isLocal for backward compatibility
const isLocal = function (): boolean {
    return isLocalEnvironment();
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

/**
 * Get the API URL for HTTP requests
 * @param port - The port to use (if applicable)
 * @param serverHost - Optional server host override
 * @returns Properly formatted API URL
 */
const apiUrl = function (port: number | string, serverHost: string | null = null): string {
    // If server host is explicitly provided, use it with the appropriate protocol
    if (serverHost) {
        return getServerUrl('http', true, typeof port === 'number' ? port : parseInt(port as string, 10));
    }
    
    // Otherwise use the universal helper with port
    return getServerUrl('http', true, typeof port === 'number' ? port : parseInt(port as string, 10));
};

/**
 * Clear all local storage data related to server selection and game state
 */
const clearLocalStorage = function (): void {
    clearServerStorage();
    
    // Add other keys that should be cleared here if needed
    // localStorage.removeItem('other_key');
    
    console.log('Local storage cleared');
};

export { isLocal, isLocalForColyseus, apiUrl, clearLocalStorage };
