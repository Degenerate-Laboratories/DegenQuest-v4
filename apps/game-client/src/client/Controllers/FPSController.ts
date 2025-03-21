import { Scene } from "@babylonjs/core/scene";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3, Matrix } from "@babylonjs/core/Maths/math.vector";
import { KeyboardEventTypes } from "@babylonjs/core/Events/keyboardEvents";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PlayerInput } from "./PlayerInput";
import { Player } from "../Entities/Player";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";

/**
 * FPSController - A first-person camera and movement controller that integrates with the game's player entity system
 */
export class FPSController {
    private _scene: Scene;
    private _canvas: HTMLCanvasElement;
    private _camera: FreeCamera;
    private _player: Player;
    private _input: PlayerInput;
    
    // Camera roots for different view modes
    private _fpsCamRoot: TransformNode;
    private _tpsCamRoot: TransformNode;
    private _camRoot: TransformNode;
    
    // Movement state
    private _keys = {
        w: false,
        a: false,
        s: false,
        d: false,
        space: false,
        shift: false
    };
    
    // Movement settings
    private _defaultSpeed: number = 2.5;
    private _sprintSpeed: number = 5.0;
    private _jumpForce: number = 0.7;
    private _canJump: boolean = true;
    private _pointerLocked: boolean = false;
    private _isFirstPerson: boolean = true;
    
    constructor(scene: Scene, canvas: HTMLCanvasElement, player: Player, input: PlayerInput) {
        this._scene = scene;
        this._canvas = canvas;
        this._player = player;
        this._input = input;
        
        this._setupCameraRoots();
        this._setupInputControls();
        this._setupPointerLock();
        
        // Register update loop
        this._scene.registerBeforeRender(() => this._update());
    }
    
    /**
     * Set up camera roots for different view modes
     */
    private _setupCameraRoots(): void {
        // Create third-person camera root - positioned behind and above the player
        this._tpsCamRoot = new TransformNode("tps_camera_root", this._scene);
        this._tpsCamRoot.position = new Vector3(0, 2.0, -5.0);
        this._tpsCamRoot.rotation = new Vector3(0.3, 0, 0);

        // First-person camera root - at eye level
        this._fpsCamRoot = new TransformNode("fps_camera_root", this._scene);
        this._fpsCamRoot.position = new Vector3(0, 1.8, 0);
        this._fpsCamRoot.rotation = new Vector3(0, 0, 0);

        // Set active camera root based on view mode
        this._camRoot = this._isFirstPerson ? this._fpsCamRoot : this._tpsCamRoot;
        
        // Create the actual camera
        this._camera = new FreeCamera("fpsCamera", new Vector3(0, 0, 0), this._scene);
        this._camera.fov = this._isFirstPerson ? 1.5 : 0.8;
        this._camera.parent = this._camRoot;
        this._camera.inertia = 0.2;
        this._camera.angularSensibility = 500;
        
        // Apply physics properties
        this._camera.checkCollisions = this._isFirstPerson;
        this._camera.applyGravity = this._isFirstPerson;
        this._camera.ellipsoid = new Vector3(0.25, 1.5, 0.25);
        
        // Access private property via any cast to ensure gravity works with movement
        (this._camera as any)._needMoveForGravity = true;
        
        // Disable standard WASD controls - we'll implement our own
        this._camera.inputs.clear();
        
        // Make active camera
        this._scene.activeCamera = this._camera;
        
        // Attach camera root to player
        this._camRoot.parent = this._player;
    }
    
    /**
     * Set up keyboard input handlers
     */
    private _setupInputControls(): void {
        // Handle key press events through our input system
        // We'll use the existing PlayerInput for consistency
        
        // Use the existing collision detection for jumping
        this._player.onCollideObservable.add((collidedMesh) => {
            if (collidedMesh.position.y < this._player.position.y) {
                this._canJump = true;
            }
        });
    }
    
    /**
     * Set up pointer lock for mouse control
     */
    private _setupPointerLock(): void {
        // Request pointer lock when canvas is clicked
        this._canvas.onclick = () => {
            if (!this._isFirstPerson) return;
            
            this._canvas.requestPointerLock = this._canvas.requestPointerLock || 
                                             (this._canvas as any).mozRequestPointerLock || 
                                             (this._canvas as any).webkitRequestPointerLock;
            
            if (this._canvas.requestPointerLock) {
                this._canvas.requestPointerLock();
            }
        };
        
        // Handle pointer lock change
        document.addEventListener('pointerlockchange', this._handlePointerLockChange.bind(this), false);
        document.addEventListener('mozpointerlockchange', this._handlePointerLockChange.bind(this), false);
        document.addEventListener('webkitpointerlockchange', this._handlePointerLockChange.bind(this), false);
    }
    
    /**
     * Handle pointer lock change event
     */
    private _handlePointerLockChange(): void {
        if (document.pointerLockElement === this._canvas ||
            (document as any)['mozPointerLockElement'] === this._canvas ||
            (document as any)['webkitPointerLockElement'] === this._canvas) {
            // Pointer is locked
            this._pointerLocked = true;
            this._canvas.addEventListener("mousemove", this._handleMouseMove.bind(this), false);
        } else {
            // Pointer is unlocked
            this._pointerLocked = false;
            this._canvas.removeEventListener("mousemove", this._handleMouseMove.bind(this), false);
        }
    }
    
    /**
     * Handle mouse movement for camera rotation
     */
    private _handleMouseMove(event: MouseEvent): void {
        if (!this._pointerLocked || !this._isFirstPerson) return;
        
        // Get mouse movement
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;
        
        // Update input controller values
        this._input.movementX = movementX / 500;
        this._input.movementY = movementY / 500;
        
        // In first-person mode, player rotation follows camera
        if (this._isFirstPerson) {
            // Fix for inverted horizontal look by negating movementX
            const horizontalLook = -this._input.movementX;
            this._player.rotation.y += horizontalLook;
            
            // Fix for vertical look (up/down)
            const verticalLook = this._input.movementY;
            const newRotationX = this._camRoot.rotation.x + verticalLook;
            
            // Clamp vertical rotation to prevent flipping
            if (Math.abs(newRotationX) < 0.85) {
                this._camRoot.rotation.x = newRotationX;
            }
        }
    }
    
    /**
     * Handle jumping logic
     */
    public handleJump(): void {
        if (!this._canJump) return;
        
        // Apply upward force
        if (this._scene.gravity) {
            this._scene.gravity = new Vector3(0, this._jumpForce, 0);
            this._canJump = false;
            
            // Reset gravity after a short delay
            setTimeout(() => {
                this._scene.gravity = new Vector3(0, -0.6, 0);
            }, 100);
        }
    }
    
    /**
     * Update camera and movement based on input
     */
    private _update(): void {
        // No need to implement movement here - it's handled by the EntityMove system
    }
    
    /**
     * Toggle camera mode between first-person and third-person
     */
    public toggleCameraMode(): void {
        this._isFirstPerson = !this._isFirstPerson;
        
        if (this._isFirstPerson) {
            this._switchToFirstPerson();
        } else {
            this._switchToThirdPerson();
        }
        
        console.log(`Camera toggled to ${this._isFirstPerson ? 'first' : 'third'}-person mode`);
    }
    
    /**
     * Switch to first-person view
     */
    private _switchToFirstPerson(): void {
        this._camRoot = this._fpsCamRoot;
        this._camera.parent = this._camRoot;
        this._camera.fov = 1.5;
        
        // Enable collisions and gravity for FPS mode
        this._camera.checkCollisions = true;
        this._camera.applyGravity = true;
        
        // Auto-request pointer lock when switching to FPS mode
        if (this._canvas.requestPointerLock) {
            this._canvas.requestPointerLock();
        }
    }
    
    /**
     * Switch to third-person view
     */
    private _switchToThirdPerson(): void {
        this._camRoot = this._tpsCamRoot;
        this._camera.parent = this._camRoot;
        this._camera.fov = 0.8;
        
        // Disable collisions and gravity for third-person mode
        this._camera.checkCollisions = false;
        this._camera.applyGravity = false;
        
        // Exit pointer lock when switching to third-person
        document.exitPointerLock = document.exitPointerLock || 
                                  (document as any)['mozExitPointerLock'] || 
                                  (document as any)['webkitExitPointerLock'];
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
    }
    
    /**
     * Attach to player entity
     */
    public attach(player: Player): void {
        this._player = player;
        this._camRoot.parent = player;
    }
    
    /**
     * Get the current camera instance
     */
    public get camera(): FreeCamera {
        return this._camera;
    }
    
    /**
     * Get the camera root transform node
     */
    public get camRoot(): TransformNode {
        return this._camRoot;
    }
    
    /**
     * Get whether the camera is in first-person mode
     */
    public get isFirstPerson(): boolean {
        return this._isFirstPerson;
    }
    
    /**
     * Handle camera zooming (for third-person mode)
     */
    public zoom(deltaY: number): void {
        if (!this._isFirstPerson) {
            // Only allow zooming in third-person mode
            if (deltaY > 0 && this._camera.position.z > -50) {
                this._camera.position.z -= 2;
            }
            if (deltaY < 0 && this._camera.position.z < -20) {
                this._camera.position.z += 2;
            }
        }
    }
    
    /**
     * Enable black and white post-processing effect
     */
    public vfx_black_and_white_on(): void {
        // We could implement this with a post-process if needed
        console.log("Black and white effect enabled");
    }
    
    /**
     * Disable black and white post-processing effect
     */
    public vfx_black_and_white_off(): void {
        // We could implement this with a post-process if needed
        console.log("Black and white effect disabled");
    }
} 