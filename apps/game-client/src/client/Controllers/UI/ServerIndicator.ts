import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { UserInterface } from "../UserInterface";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { isLocal } from "../../Utils";
import { Ellipse } from "@babylonjs/gui/2D/controls/ellipse";

/**
 * ServerIndicator displays the currently connected server in the bottom left corner
 */
export class ServerIndicator {
    private _ui: UserInterface;
    private _serverText: TextBlock;
    private _container: Rectangle;
    private _statusIndicator: Ellipse;

    constructor(ui) {
        this._ui = ui;
        this._createUI();
        this._updateServerInfo();
    }

    /**
     * Create the UI elements for the server indicator
     */
    private _createUI(): void {
        // Create container
        const container = new Rectangle("serverIndicator");
        container.widthInPixels = 220;
        container.heightInPixels = 24;
        container.background = "rgba(0, 0, 0, 0.7)";
        container.thickness = 0;
        container.cornerRadius = 3;
        container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        container.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        container.left = "5px";
        container.top = "-5px";
        this._ui.MAIN_ADT.addControl(container);
        this._container = container;

        // Create status indicator
        const statusIndicator = new Ellipse("statusIndicator");
        statusIndicator.width = "10px";
        statusIndicator.height = "10px";
        statusIndicator.background = "#4CAF50"; // Green color
        statusIndicator.thickness = 0;
        statusIndicator.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        statusIndicator.left = "8px";
        container.addControl(statusIndicator);
        this._statusIndicator = statusIndicator;

        // Create text block
        const serverText = new TextBlock("serverText", "");
        serverText.color = "white";
        serverText.fontSize = "12px";
        serverText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        serverText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        serverText.left = "24px"; // Position text after the indicator
        serverText.paddingRightInPixels = 5;
        container.addControl(serverText);
        this._serverText = serverText;
    }

    /**
     * Get the default server URL based on environment
     */
    private _getDefaultServerUrl(): string {
        // If running locally, default to localhost
        if (isLocal()) {
            return `http://localhost:${this._ui._game.config.port}`;
        }
        
        // Production default
        return 'https://api.degenquest.ai';
    }

    /**
     * Update the server info display
     */
    private _updateServerInfo(): void {
        // Get server URL from localStorage or use default
        const serverUrl = localStorage.getItem('selectedServer') || this._getDefaultServerUrl();
        
        // Format the display text
        let displayText;
        if (serverUrl.startsWith('http://') || serverUrl.startsWith('https://')) {
            // Extract hostname and port from URL
            try {
                const url = new URL(serverUrl);
                // If it's localhost or 127.0.0.1, include the port
                if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
                    displayText = `Server: ${url.hostname}:${url.port || this._ui._game.config.port}`;
                } else {
                    displayText = `Server: ${url.hostname}`;
                }
            } catch (e) {
                displayText = `Server: ${serverUrl}`;
            }
        } else {
            displayText = `Server: ${serverUrl}`;
        }
        
        // Update the text
        this._serverText.text = displayText;
        
        // Update status indicator color - always green
        // Use green for all servers as requested
        this._statusIndicator.background = "#4CAF50"; // Green for all servers
    }

    /**
     * Update the server indicator when server changes
     */
    public update(): void {
        this._updateServerInfo();
    }
} 