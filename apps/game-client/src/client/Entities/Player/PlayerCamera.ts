import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { BlackAndWhitePostProcess } from "@babylonjs/core/PostProcesses/blackAndWhitePostProcess";
import { Player } from "../Player";
import { PlayerInput } from "../../Controllers/PlayerInput";
import { RayHelper } from "@babylonjs/core/Debug/rayHelper";
import { Ray } from "@babylonjs/core/Culling/ray";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { KeyboardEventTypes } from "@babylonjs/core/Events/keyboardEvents";

export class PlayerCamera {
    private player: Player;
    public camera;
    private _scene: Scene;
    private _input: PlayerInput;
    public _camRoot;
    public cameraPos;
    private _postProcess: BlackAndWhitePostProcess | null = null;
    private rayHelper;
    
    // FPS mode specific properties
    private _isFPSMode: boolean = true; // Start in FPS mode by default
    private _pointerLocked: boolean = false;
    private _defaultSpeed: number = 2.5;
    private _sprintSpeed: number = 5.0;
    private _lastToggleTime: number = 0;

    constructor(player) {
        this._scene = player._scene;
        this._input = player._input;
        this.init();
        
        // Set up pointer lock for FPS controls
        this._setupPointerLock();
        
        // Set up 'T' key to toggle between camera modes
        this._setupToggleKey();
    }

    public init() {
        console.log("Initializing PlayerCamera...");
        // Root camera parent that handles positioning of the camera to follow the player
        this._camRoot = new TransformNode("camera_root", this._scene);
        this._camRoot.position = new Vector3(0, 1.7, 0); // Head height
        console.log("Camera root position:", this._camRoot.position);
        
        if (this._isFPSMode) {
            console.log("Setting up FPS camera mode");
            // FPS Camera setup - camera only handles rotation, not movement
            // Position camera very far forward to avoid seeing any part of the model
            this.camera = new FreeCamera("fpsCamera", new Vector3(0, 0, -1.0), this._scene);
            this.camera.parent = this._camRoot;
            
            // Configure camera for FPS view
            this.camera.inertia = 0.2;  // Smooth rotation
            this.camera.fov = 0.8;      // Field of view
            this.camera.minZ = 0.5;     // High near clipping plane to avoid seeing any part of own model
            this.camera.speed = 0;      // No speed - movement is handled by player entity
            this.camera.angularSensibility = 400; // Mouse sensitivity
            
            // IMPORTANT: In our setup, the player entity handles physics, not the camera
            this.camera.applyGravity = false;  
            this.camera.checkCollisions = false;
            
            // The camera should not move on its own - only look around
            this.camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
            
            // Clear all movement keys - WASD movement is handled by player input
            this.camera.keysUp = [];
            this.camera.keysDown = [];
            this.camera.keysLeft = [];
            this.camera.keysRight = [];
            
            // Safety check for falling through world - but using the camera's parent instead
            this._scene.registerBeforeRender(() => {
                // Check player position instead of camera position
                if (this.player && this.player.mesh && this.player.mesh.position.y < -10) {
                    console.log("Player fell through the world, resetting position");
                    this.player.mesh.position.y = 2.0;
                }
            });
            
            console.log("FPS camera setup complete");
        } else {
            console.log("Setting up third-person camera mode");
            // Third-person camera setup (legacy)
            // To face the player from behind (180 degrees)
            this._camRoot.rotation = new Vector3(0, (3 / 4) * Math.PI, 0);

            // Rotations along the x-axis (up/down tilting)
            const yTilt = new TransformNode("camera_ytilt");
            yTilt.rotation = new Vector3(0.6, 0, 0);
            yTilt.parent = this._camRoot;

            // Our actual camera that's pointing at our root's position
            this.camera = new UniversalCamera("camera", new Vector3(0, 0, -45), this._scene);
            this.camera.lockedTarget = this._camRoot.position;
            this.camera.fov = 0.35;
            this.camera.parent = yTilt;
            this.camera.inputs.clear();
            this.camera.position.z = -50;
            console.log("Third-person camera setup complete");
        }

        // Set as active camera
        this._scene.activeCamera = this.camera;
        this.cameraPos = this.camera.position;
        console.log("Active camera set, position:", this.camera.position);
        
        // Attach control to the canvas (for mouse look only)
        if (this._isFPSMode) {
            const canvas = this._scene.getEngine().getRenderingCanvas();
            if (canvas) {
                this.camera.attachControl(canvas, true);
                console.log("Camera controls attached to canvas for mouse look");
            } else {
                console.error("Failed to get rendering canvas for camera controls");
            }
        }
    }
    
    /**
     * Set up pointer lock for better FPS controls
     */
    private _setupPointerLock(): void {
        // Only set up if in FPS mode
        if (!this._isFPSMode) return;
        
        const canvas = this._scene.getEngine().getRenderingCanvas();
        if (!canvas) {
            console.error("Cannot get rendering canvas");
            return;
        }
        
        // Handle pointer down
        this._scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                if (!this._pointerLocked) {
                    canvas.requestPointerLock = canvas.requestPointerLock || 
                                               (canvas as any).mozRequestPointerLock || 
                                               (canvas as any).webkitRequestPointerLock;
                    if (canvas.requestPointerLock) {
                        canvas.requestPointerLock();
                    }
                }
            }
        });
        
        // Handle pointer lock change
        const pointerLockChange = () => {
            this._pointerLocked = (
                document.pointerLockElement === canvas ||
                (document as any).mozPointerLockElement === canvas ||
                (document as any).webkitPointerLockElement === canvas
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
    
    /**
     * Set up key listener for toggling camera modes
     */
    private _setupToggleKey(): void {
        this._scene.onKeyboardObservable.add((kbInfo) => {
            if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
                // 'T' key for toggling camera view
                if (kbInfo.event.code === "KeyT") {
                    // Check for repeat using the key state
                    if (!this._lastToggleTime || Date.now() - this._lastToggleTime > 500) {
                        console.log("Toggle camera mode");
                        this.toggleMode();
                        this._lastToggleTime = Date.now();
                    }
                }
            }
        });
    }

    public attach(player: Player) {
        console.log("Attaching camera to player:", player ? player.sessionId : "unknown");
        this.player = player;
        
        // Make sure the player exists
        if (!player) {
            console.error("Cannot attach camera to null player");
            return;
        }
        
        // IMPORTANT: For FPS mode, we want the camera to be parented directly to the player entity,
        // not to the mesh, as the mesh may be invisible or have its own animations.
        // This ensures the camera follows the player's movement smoothly.
        if (this._isFPSMode) {
            // In FPS mode, attach directly to the player entity
            this._camRoot.parent = player;
            console.log("FPS mode: Camera root attached directly to player entity");
            
            // COMPLETELY disable player model rendering in FPS mode
            if (player.mesh && player.isCurrentPlayer) {
                // ---------------------------------------------------------------
                // TODO: Implement headless character model for FPS mode
                // Options:
                // 1. Create a special "headless" model variant for first-person view
                // 2. Use a shader to cull only the head portion of the model
                // 3. Implement arms-only view (like typical FPS games)
                // ---------------------------------------------------------------
                
                // For now, completely hide the player model
                player.mesh.isVisible = false;
                
                // If player has children meshes, hide those too (be thorough)
                if (player.mesh.getChildMeshes) {
                    const childMeshes = player.mesh.getChildMeshes();
                    childMeshes.forEach(mesh => {
                        mesh.isVisible = false;
                        console.log(`Hiding child mesh: ${mesh.name}`);
                    });
                }
                
                // Move camera very far forward to ensure we're well outside the head
                this._camRoot.position = new Vector3(0, 1.7, 0);  // Head height
                this.camera.position = new Vector3(0, 0, -1.0);   // Far in front of face
                
                console.log("Player mesh completely hidden in FPS mode");
            }
        } else {
            // In third-person mode, we can attach to the mesh if available
            if (player.mesh) {
                this._camRoot.parent = player.mesh;
                console.log("Third-person mode: Camera root attached to player mesh");
            } else {
                this._camRoot.parent = player;
                console.log("Third-person mode fallback: Camera root attached to player entity");
            }
        }
        
        // Force position update immediately to sync positions
        if (!this._isFPSMode) {
            this._camRoot.position = new Vector3(0, 1.7, 0); // Standard head height for third-person
        }
        
        console.log("Camera attached successfully");
        console.log("Player position:", player.getPosition());
        console.log("Camera root position:", this._camRoot.position);
        console.log("Camera position:", this.camera.position);
    }

    public update(): void {
        if (this._isFPSMode) {
            // Ensure player model remains hidden
            this._ensurePlayerModelHidden();
            
            // FPS camera update logic
            if (this.player && this.player.mesh) {
                // Get player's current position
                const playerPos = this.player.getPosition();
                
                // CRITICAL FIX: Update camera position to match player
                // This ensures the camera moves with the player
                if (this._camRoot) {
                    // Update the camera root to match player position
                    // But maintain the camera's offset height
                    this._camRoot.position = new Vector3(
                        0, // Local offset X
                        1.7, // Head height
                        0  // Local offset Z
                    );
                    
                    // Ensure camera doesn't fall through world by syncing
                    // its world position Y component
                    if (this.camera && this.camera.position.y < 0) {
                        // Force reset camera position
                        this.camera.position.y = 0;
                    }
                    
                    // Log position periodically for debugging
                    if (Math.random() < 0.01) { // Log approximately 1% of frames
                        console.log("Player position:", playerPos);
                        console.log("Camera root local position:", this._camRoot.position);
                        console.log("Camera global position:", this.camera.globalPosition || this.camera.position);
                    }
                }
            } else {
                console.warn("Player or player mesh not available for camera tracking");
            }
            
            // Handle sprinting speed (though this is less relevant since we're not using camera movement)
            this.camera.speed = this._input.key_shift ? this._sprintSpeed : this._defaultSpeed;
            
            // Cast ray for hiding objects in front of camera
            this.castRay();
        } else {
            // Legacy third-person camera update
            let preventVertical = false;

            // Rotate camera around the Y position if right click is true
            if (!this._input.middle_click) {
                return;
            }

            // Only do vertical if allowed
            let rotationX = 0;
            if (!preventVertical) {
                rotationX =
                    Math.abs(this._camRoot.rotation.x + this._input.movementY) < 0.5 ? this._camRoot.rotation.x + this._input.movementY : this._camRoot.rotation.x;
            }

            // Set camera delta
            this.player._game.deltaCamY = this.player._game.deltaCamY + this._input.movementX;

            // Set horizontal rotation
            const rotationY = this._camRoot.rotation.y + this._input.movementX;

            // Apply camera rotation
            this._camRoot.rotation = new Vector3(rotationX, rotationY, 0);

            // Cast ray
            this.castRay();
        }
    }

    /**
     * Toggle between FPS and third-person view
     */
    public toggleMode(): void {
        this._isFPSMode = !this._isFPSMode;
        
        // Clean up existing camera
        if (this.camera) {
            this.camera.detachControl();
            this.camera.dispose();
        }
        
        // Re-initialize the camera with the new mode
        this.init();
        this.attach(this.player);
        
        console.log(`Switched to ${this._isFPSMode ? 'first' : 'third'}-person mode`);
    }

    public zoom(deltaY): void {
        if (!this._isFPSMode) {
            // Only allow zooming in third-person mode
            if (deltaY > 0 && this.camera.position.z > -50) this.camera.position.z -= 2;
            if (deltaY < 0 && this.camera.position.z < -20) this.camera.position.z += 2;
        }
    }

    public vecToLocal(vector, mesh){
        var m = mesh.getWorldMatrix();
        var v = Vector3.TransformCoordinates(vector, m);
		return v;		 
    }

    public castRay(){       
        /*
        todo: WIP
        if(this.rayHelper){
            this.rayHelper.dispose()
        }

        const ray = this.camera.getForwardRay(50) as Ray;
        this.rayHelper = new RayHelper(ray);		
		this.rayHelper.show(this._scene);		

        var pickInfos = ray.intersectsMeshes(this._scene.meshes)
        if(pickInfos.length > 0){
            pickInfos.forEach((m:any) => {
                console.log('hiding', m.pickedMesh.name);
                m.pickedMesh.setEnabled(false);
            } );
        }
            */
    }

    // post processing effect black and white
    // used when current player dies and click ressurects
    public vfx_black_and_white_on() {
        try {
            // Dispose of existing post-process if it exists
            if (this._postProcess) {
                this._postProcess.dispose();
                this._postProcess = null;
            }
            
            // Create new black and white effect
            this._postProcess = new BlackAndWhitePostProcess("bandw", 1.0, this.camera);
            console.log("Black and white effect applied");
        } catch (error) {
            console.error("Error applying black and white effect:", error);
        }
    }

    public vfx_black_and_white_off() {
        try {
            // Clean up post-process effect
            if (this._postProcess) {
                this._postProcess.dispose();
                this._postProcess = null;
                console.log("Black and white effect removed");
            }
        } catch (error) {
            console.error("Error removing black and white effect:", error);
        }
    }

    /**
     * Public method to get the camera root - safer than direct property access
     */
    public getCameraRoot() {
        return this._camRoot;
    }

    /**
     * Public method to rotate the camera root
     */
    public rotateCameraRoot(yRotation: number) {
        if (this._camRoot) {
            this._camRoot.rotation.y = yRotation;
        }
    }

    /**
     * Public method to check if camera is in FPS mode
     */
    public isFPSMode(): boolean {
        return this._isFPSMode;
    }

    /**
     * Make sure all player model components are hidden in FPS mode
     * Called whenever there's a risk the model might become visible
     */
    private _ensurePlayerModelHidden(): void {
        if (!this._isFPSMode || !this.player || !this.player.isCurrentPlayer) {
            return; // Only apply in FPS mode for current player
        }
        
        // Hide the main mesh
        if (this.player.mesh) {
            this.player.mesh.isVisible = false;
            
            // Hide all child meshes too
            if (this.player.mesh.getChildMeshes) {
                const childMeshes = this.player.mesh.getChildMeshes();
                childMeshes.forEach(mesh => {
                    mesh.isVisible = false;
                });
            }
        }
        
        // In the update method, also ensure model stays hidden
        if (Math.random() < 0.01) { // Only check occasionally for performance reasons
            console.log("Ensuring player model remains hidden in FPS mode");
        }
    }
}
