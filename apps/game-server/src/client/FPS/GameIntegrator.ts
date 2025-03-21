import { GameController } from "../Controllers/GameController";
import { GameScene } from "../Screens/GameScene";
import { createMinimalFPSScene, MinimalFPSScene } from "./MinimalFPSScene";
import { initFPSScene } from "./index";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import State from "../Screens/Screens";

/**
 * GameIntegrator - Responsible for integrating the FPS system with the existing game
 * This class provides methods for switching between the original game and the FPS mode
 */
export class GameIntegrator {
    private _game: GameController;
    private _originalScene: GameScene;
    private _fpsScene: MinimalFPSScene | null = null;
    private _fpsMode: boolean = false;
    
    constructor(game: GameController) {
        this._game = game;
        this._originalScene = game.gamescene;
        
        // Add toggle key for switching between modes
        this._setupToggleKey();
        
        // Auto-switch to FPS mode on initialization (after a short delay)
        setTimeout(() => {
            this._switchToFPSMode();
            this._fpsMode = true;
            console.log("Auto-switched to FPS mode on startup");
        }, 1000);
    }
    
    /**
     * Set up key listener for toggling between original game and FPS mode
     */
    private _setupToggleKey(): void {
        window.addEventListener("keydown", (evt) => {
            // F key to toggle FPS mode
            if (evt.code === "KeyF" && !evt.repeat) {
                this.toggleMode();
            }
        });
    }
    
    /**
     * Toggle between original game mode and FPS mode
     */
    public toggleMode(): void {
        if (this._fpsMode) {
            this._switchToOriginalMode();
        } else {
            this._switchToFPSMode();
        }
        
        this._fpsMode = !this._fpsMode;
        console.log(`Switched to ${this._fpsMode ? "FPS" : "Original"} mode`);
    }
    
    /**
     * Switch to the FPS mode
     */
    private _switchToFPSMode(): void {
        // Store original scene state if needed
        
        // Initialize FPS scene if not already created
        if (!this._fpsScene) {
            // Pass the existing engine to initFPSScene
            this._fpsScene = initFPSScene(this._game.engine);
        }
        
        // Switch to FPS scene
        this._game.engine.stopRenderLoop();
        this._game.engine.runRenderLoop(() => {
            if (this._fpsScene && this._fpsScene.scene) {
                this._fpsScene.scene.render();
            }
        });
    }
    
    /**
     * Switch back to the original game mode
     */
    private _switchToOriginalMode(): void {
        // Restore original scene state
        
        // Switch back to original scene render loop
        this._game.engine.stopRenderLoop();
        this._game.setScene(State.GAME); // Use the game's existing scene switching mechanism
    }
    
    /**
     * Clean up resources when no longer needed
     */
    public dispose(): void {
        if (this._fpsScene) {
            // Clean up FPS scene resources if needed
        }
    }
} 