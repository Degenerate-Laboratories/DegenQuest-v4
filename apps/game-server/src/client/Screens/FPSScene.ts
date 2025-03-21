import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { FPSController } from "../Controllers/FPSController";

/**
 * FPSScene - A simple scene with an FPS controller
 */
export class FPSScene {
    private _canvas: HTMLCanvasElement;
    private _engine: Engine;
    private _scene: Scene;
    private _fpsController: FPSController;
    
    constructor(canvas: HTMLCanvasElement, engine: Engine) {
        this._canvas = canvas;
        this._engine = engine;
        
        // Create scene
        this._scene = this._createScene();
        
        // Set up render loop
        this._engine.runRenderLoop(() => {
            this._scene.render();
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this._engine.resize();
        });
    }
    
    /**
     * Create the scene with FPS controller
     */
    private _createScene(): Scene {
        // Create scene
        const scene = new Scene(this._engine);
        
        // Set background color
        scene.clearColor = new Color4(0.5, 0.5, 0.5, 1.0);
        
        // Create light
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
        light.intensity = 0.7;
        light.diffuse = new Color3(1, 1, 1);
        light.specular = new Color3(0.1, 0.1, 0.1);
        
        // Create FPS controller
        this._fpsController = new FPSController(scene, this._canvas);
        
        return scene;
    }
    
    /**
     * Get the scene instance
     */
    public get scene(): Scene {
        return this._scene;
    }
    
    /**
     * Get the FPS controller instance
     */
    public get fpsController(): FPSController {
        return this._fpsController;
    }
}

/**
 * Create and return a new FPS scene
 */
export function createFPSScene(canvas: HTMLCanvasElement, engine: Engine): FPSScene {
    return new FPSScene(canvas, engine);
} 