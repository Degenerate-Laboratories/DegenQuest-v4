import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { KeyboardEventTypes } from "@babylonjs/core/Events/keyboardEvents";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";

/**
 * MinimalFPSScene - A bare-bones FPS camera and movement implementation
 * This provides a clean, standalone FPS experience without any dependencies on the game's systems
 */
export class MinimalFPSScene {
    // Core components
    private _scene: Scene;
    private _canvas: HTMLCanvasElement;
    private _engine: Engine;
    private _camera: FreeCamera;
    
    // Movement states
    private _keys = {
        w: false,
        a: false,
        s: false,
        d: false,
        space: false,
        shift: false
    };
    
    // Physics parameters
    private _canJump: boolean = true;
    private _gravity: number = -0.6;
    private _jumpForce: number = 0.7;
    private _defaultSpeed: number = 2.5;
    private _sprintSpeed: number = 5.0;
    
    // Ground reference (for collision detection)
    private _ground: any;
    
    // Pointer lock state
    private _pointerLocked: boolean = false;
    
    constructor(canvas: HTMLCanvasElement, engine: Engine) {
        this._canvas = canvas;
        this._engine = engine;
        this._scene = this._createScene();
        
        // Setup pointer lock for better FPS controls
        this._setupPointerLock();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this._engine.resize();
        });
    }
    
    private _createScene(): Scene {
        // Create scene
        const scene = new Scene(this._engine);
        
        // Set sky color
        scene.clearColor = new Color4(0.4, 0.6, 0.9, 1.0);
        
        // Create and configure the FPS camera
        this._camera = new FreeCamera("fpsCamera", new Vector3(0, 5, -10), scene);
        
        // Explicitly set WASD keys
        this._camera.keysUp = [87]; // W
        this._camera.keysDown = [83]; // S
        this._camera.keysLeft = [65]; // A
        this._camera.keysRight = [68]; // D
        
        // Attach control to the canvas
        this._camera.attachControl(this._canvas, true);
        
        // Configure camera properties
        this._camera.inertia = 0.2;  // Smooth movement
        this._camera.fov = 0.8;      // Field of view
        this._camera.minZ = 0.1;     // Near clipping plane
        this._camera.speed = this._defaultSpeed;  // Default movement speed
        this._camera.angularSensibility = 400;    // Mouse sensitivity
        
        // Enable gravity and collisions
        scene.gravity = new Vector3(0, this._gravity, 0);
        scene.collisionsEnabled = true;
        this._camera.checkCollisions = true;
        this._camera.applyGravity = true;
        this._camera.ellipsoid = new Vector3(0.25, 1.5, 0.25); // Collision volume
        (this._camera as any)._needMoveForGravity = true; // Ensure gravity works with movement
        
        // Add a light
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
        light.intensity = 0.7;
        
        // Create a ground for walking
        this._ground = MeshBuilder.CreateGround("ground", { width: 250, height: 250, subdivisions: 2 }, scene);
        const groundMaterial = new StandardMaterial("groundMat", scene);
        groundMaterial.diffuseColor = new Color3(0.2, 0.6, 0.2);
        this._ground.material = groundMaterial;
        this._ground.checkCollisions = true;
        
        // Add some obstacles
        this._createObstacles(scene);
        
        // Set up input handling
        this._setupInputHandling(scene);
        
        // Update loop for jump physics and movement
        scene.registerBeforeRender(() => {
            this._updateBeforeRender();
        });
        
        return scene;
    }
    
    /**
     * Set up pointer lock for better FPS controls
     */
    private _setupPointerLock(): void {
        // Handle pointer down
        this._scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                if (!this._pointerLocked) {
                    this._canvas.requestPointerLock = this._canvas.requestPointerLock || 
                                                     (this._canvas as any).mozRequestPointerLock || 
                                                     (this._canvas as any).webkitRequestPointerLock;
                    if (this._canvas.requestPointerLock) {
                        this._canvas.requestPointerLock();
                    }
                }
            }
        });
        
        // Handle pointer lock change
        const pointerLockChange = () => {
            this._pointerLocked = (
                document.pointerLockElement === this._canvas ||
                (document as any).mozPointerLockElement === this._canvas ||
                (document as any).webkitPointerLockElement === this._canvas
            );
            
            if (this._pointerLocked) {
                console.log("Pointer locked - FPS controls active");
            } else {
                console.log("Pointer unlocked - FPS controls inactive");
            }
        };
        
        // Listen for pointer lock events
        document.addEventListener("pointerlockchange", pointerLockChange, false);
        document.addEventListener("mozpointerlockchange", pointerLockChange, false);
        document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
    }
    
    private _createObstacles(scene: Scene): void {
        // Create some boxes for collision testing
        for (let i = 0; i < 20; i++) {
            const box = MeshBuilder.CreateBox(`box${i}`, { size: 2 }, scene);
            box.position = new Vector3(
                (Math.random() - 0.5) * 100,
                1,
                (Math.random() - 0.5) * 100
            );
            
            // Random color for each box
            const boxMaterial = new StandardMaterial(`boxMat${i}`, scene);
            boxMaterial.diffuseColor = new Color3(
                Math.random(),
                Math.random(),
                Math.random()
            );
            box.material = boxMaterial;
            box.checkCollisions = true;
        }
    }
    
    private _setupInputHandling(scene: Scene): void {
        // Keyboard event handling
        scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    if (kbInfo.event.code === "KeyW") this._keys.w = true;
                    if (kbInfo.event.code === "KeyA") this._keys.a = true;
                    if (kbInfo.event.code === "KeyS") this._keys.s = true;
                    if (kbInfo.event.code === "KeyD") this._keys.d = true;
                    if (kbInfo.event.code === "Space") {
                        this._keys.space = true;
                        this._handleJump();
                    }
                    if (kbInfo.event.code === "ShiftLeft" || kbInfo.event.code === "ShiftRight") {
                        this._keys.shift = true;
                        this._camera.speed = this._sprintSpeed;
                    }
                    break;
                    
                case KeyboardEventTypes.KEYUP:
                    if (kbInfo.event.code === "KeyW") this._keys.w = false;
                    if (kbInfo.event.code === "KeyA") this._keys.a = false;
                    if (kbInfo.event.code === "KeyS") this._keys.s = false;
                    if (kbInfo.event.code === "KeyD") this._keys.d = false;
                    if (kbInfo.event.code === "Space") this._keys.space = false;
                    if (kbInfo.event.code === "ShiftLeft" || kbInfo.event.code === "ShiftRight") {
                        this._keys.shift = false;
                        this._camera.speed = this._defaultSpeed;
                    }
                    break;
            }
        });
        
        // Collision detection for landing
        this._camera.onCollide = (colMesh) => {
            if (colMesh === this._ground) {
                this._canJump = true; // Allow jumping again when on ground
            }
        };
    }
    
    private _handleJump(): void {
        if (this._canJump) {
            // Apply upward gravity for jumping
            this._scene.gravity = new Vector3(0, this._jumpForce, 0);
            this._canJump = false;
        }
    }
    
    private _updateBeforeRender(): void {
        // Debug info - update every 100 frames
        if (Math.floor(this._scene.getEngine().getFps()) % 100 === 0) {
            console.log("FPS Camera position:", this._camera.position);
            console.log("WASD keys:", this._keys);
            console.log("Pointer locked:", this._pointerLocked);
        }
        
        // Manual movement handling if needed
        // Note: We're still letting the built-in WASD controls work,
        // this is just for debugging and additional control
        
        // Gradually return gravity to normal after jumping
        if (this._scene.gravity.y > this._gravity) {
            this._scene.gravity.y -= 0.05;
            
            // Once we're back to normal gravity, reset it exactly
            if (this._scene.gravity.y < this._gravity) {
                this._scene.gravity.y = this._gravity;
            }
        }
    }
    
    /**
     * Get the scene instance
     */
    public get scene(): Scene {
        return this._scene;
    }
    
    /**
     * Get the camera instance
     */
    public get camera(): FreeCamera {
        return this._camera;
    }
}

/**
 * Create and return a new minimal FPS scene
 */
export function createMinimalFPSScene(canvas: HTMLCanvasElement, engine: Engine): MinimalFPSScene {
    return new MinimalFPSScene(canvas, engine);
} 