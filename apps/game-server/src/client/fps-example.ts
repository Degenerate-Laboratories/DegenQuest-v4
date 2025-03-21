import { Engine } from "@babylonjs/core/Engines/engine";
import { createFPSScene } from "./Screens/FPSScene";

/**
 * Entry point for the FPS example
 */
window.addEventListener("DOMContentLoaded", () => {
    // Get the canvas element
    const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
    if (!canvas) {
        console.error("Canvas element not found");
        return;
    }
    
    // Create the engine
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    
    // Create the FPS scene
    const fpsScene = createFPSScene(canvas, engine);
    
    // Log instructions
    console.log("FPS Controls:");
    console.log("- WASD: Movement");
    console.log("- Mouse: Look around");
    console.log("- Space: Jump");
    console.log("- Shift: Sprint");
    console.log("- Click canvas to enable mouse look (pointer lock)");
}); 