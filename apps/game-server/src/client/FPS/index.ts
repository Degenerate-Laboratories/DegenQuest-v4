import { Engine } from "@babylonjs/core/Engines/engine";
import { createMinimalFPSScene, MinimalFPSScene } from "./MinimalFPSScene";

/**
 * Initialize the FPS scene using an existing canvas and engine
 * @param engine - The Babylon.js engine
 * @returns The created FPS scene instance
 */
export function initFPSScene(engine?: Engine): MinimalFPSScene {
    // Use the existing engine or create a new one
    if (engine) {
        // Get the existing canvas
        const canvas = engine.getRenderingCanvas();
        if (!canvas) {
            throw new Error("Engine has no rendering canvas");
        }
        
        // Create FPS scene using existing engine and canvas
        const fpsScene = createMinimalFPSScene(canvas, engine);
        console.log("FPS Scene initialized with existing engine");
        return fpsScene;
    } else {
        // Create a new canvas and engine (standalone mode)
        const canvas = document.createElement("canvas");
        canvas.id = "renderCanvas";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.display = "block";
        canvas.style.touchAction = "none";
        
        // Replace existing content or append to body
        const container = document.getElementById("game-container") || document.body;
        container.innerHTML = "";
        container.appendChild(canvas);
        
        // Create new engine and scene
        const newEngine = new Engine(canvas, true);
        const fpsScene = createMinimalFPSScene(canvas, newEngine);
        
        // Set up render loop
        newEngine.runRenderLoop(() => {
            fpsScene.scene.render();
        });
        
        // Handle window resize
        window.addEventListener("resize", () => {
            newEngine.resize();
        });
        
        console.log("Standalone FPS Scene initialized with new engine");
        return fpsScene;
    }
}

// If this file is loaded directly, initialize the FPS scene in standalone mode
if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
        // Only initialize automatically if this is loaded as a standalone module
        if (document.currentScript && (document.currentScript as HTMLScriptElement).src.includes("FPS/index")) {
            initFPSScene();
        }
    });
} 