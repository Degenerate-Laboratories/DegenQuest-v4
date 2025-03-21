import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { UserInterface } from "../UserInterface";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { getServerUrl, extractHostname, getLocalStorageItem } from "../../../shared/config/ServerHelper";

/**
 * ServerIndicator displays the currently connected server in the bottom left corner
 */
export class ServerIndicator {
    private _ui: UserInterface;
    private _serverText: TextBlock;
    private _container: Rectangle;

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
        container.widthInPixels = 250;
        container.heightInPixels = 30;
        container.background = "rgba(0, 0, 0, 0.5)";
        container.thickness = 0;
        container.cornerRadius = 5;
        container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        container.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        container.left = "10px";
        container.top = "-10px";
        this._ui.MAIN_ADT.addControl(container);
        this._container = container;

        // Create text block
        const serverText = new TextBlock("serverText", "");
        serverText.color = "white";
        serverText.fontSize = "14px";
        serverText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        serverText.paddingLeftInPixels = 10;
        serverText.paddingRightInPixels = 10;
        container.addControl(serverText);
        this._serverText = serverText;
    }

    /**
     * Update the server info display
     */
    private _updateServerInfo(): void {
        // Get stored server or use default using the helper function
        let serverUrl = getLocalStorageItem('selectedServer') || 'Default Server';
        
        // Format the display text
        let displayText;
        if (serverUrl.startsWith('http://') || serverUrl.startsWith('https://') || 
            serverUrl.startsWith('ws://') || serverUrl.startsWith('wss://')) {
            // Extract hostname using the helper function
            const hostname = extractHostname(serverUrl);
            displayText = `Server: ${hostname}`;
        } else {
            displayText = `Server: ${serverUrl}`;
        }
        
        // Update the text
        this._serverText.text = displayText;
    }

    /**
     * Update the server indicator when server changes
     */
    public update(): void {
        this._updateServerInfo();
    }
} 