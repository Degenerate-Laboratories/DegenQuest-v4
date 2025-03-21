import { Scene } from "@babylonjs/core/scene";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { KeyboardEventTypes } from "@babylonjs/core/Events/keyboardEvents";
import { GameController } from "./GameController";
import { UserInterface } from "./UserInterface";
import { GameScene } from "../Screens/GameScene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { ServerMsg } from "../../shared/types";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Matrix } from "@babylonjs/core/Maths/math.vector";

export class PlayerInput {
    private _gameScene: GameScene;
    private _scene: Scene;
    private _game: GameController;
    private _room;
    private _ui: UserInterface;

    // Simple movement (legacy)
    public angle: number = 0;
    public horizontal: number = 0;
    public vertical: number = 0;

    // FPS movement keys
    public key_w: boolean = false;
    public key_a: boolean = false;
    public key_s: boolean = false;
    public key_d: boolean = false;
    public key_space: boolean = false;
    public key_shift: boolean = false;
    
    // Jumping properties
    public canJump: boolean = true;
    public jumpForce: number = 0.7;
    
    // Directional movement for FPS
    public moveForward: number = 0;
    public moveRight: number = 0;
    public moveDirection: Vector3 = new Vector3();

    // Legacy keyboard
    public top_arrow: boolean = false;
    public down_arrow: boolean = false;
    public left_arrow: boolean = false;
    public right_arrow: boolean = false;

    // Mouse
    public left_click: boolean;
    public right_click: boolean;
    public middle_click: boolean;
    public mouse_moving: boolean = false;
    public left_alt_pressed: boolean = false;
    public keyboard_c: boolean = false;

    // Movement control flags
    public player_can_move: boolean = true; // Default to true for FPS
    
    // Digits
    public digit_pressed: number = 0;

    public movementX: number = 0;
    public movementY: number = 0;

    // Timers
    public movementTimer;
    public movementTimerNow: number = 0;
    public movementTimerDelay: number = 200;

    constructor(gameScene: GameScene) {
        this._gameScene = gameScene;
        this._game = gameScene._game;
        this._scene = gameScene._scene;
        this._room = this._game.currentRoom;
        this._ui = gameScene._ui;

        // Initialize input handlers
        this._setupMouseInputs();
        this._setupKeyboardInputs();
        
        // Set up rendering observable for movement direction calculation
        this._scene.onBeforeRenderObservable.add(() => {
            this._updateMovementDirection();
        });
    }

    private _setupMouseInputs(): void {
        // Detect mouse movement
        this._scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                // Left click
                if (pointerInfo.event.button == 0) {
                    this.left_click = true;
                    this.startMovementTimer();
                }

                // Middle click
                if (pointerInfo.event.button == 1) {
                    this.middle_click = true;
                }

                // Right click
                if (pointerInfo.event.button == 2) {
                    this.right_click = true;
                }
            }

            if (pointerInfo.type === PointerEventTypes.POINTERUP) {
                // Left click
                if (pointerInfo.event.button == 0) {
                    this.left_click = false;
                    
                    // Only reset these for legacy mode
                    // this.angle = 0;
                    // this.vertical = 0;
                    // this.horizontal = 0;

                    if (this.movementTimer) {
                        this.movementTimerNow = 0;
                        clearInterval(this.movementTimer);
                    }
                }

                // Middle click
                if (pointerInfo.event.button == 1) {
                    this.middle_click = false;
                }

                // Right click
                if (pointerInfo.event.button == 2) {
                    this.right_click = false;
                }

                this.mouse_moving = false;
            }

            // Mouse movement handling
            if (this.left_click) {
                let dpi = window.devicePixelRatio;
                const x = ((pointerInfo.event.clientX * dpi) / pointerInfo.event.target.width) * 2 - 1;
                const y = ((pointerInfo.event.clientY * dpi) / pointerInfo.event.target.height) * 2 - 1;
                this.angle = Math.atan2(x, y);
                this.calculateVelocityForces();
            }

            if (this.right_click) {
                this.mouse_moving = true;
            }

            if (this.middle_click) {
                this.movementX = pointerInfo.event.movementX / 100;
                this.movementY = pointerInfo.event.movementY / 75;
            }
        });
    }

    private _setupKeyboardInputs(): void {
        this._scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    // FPS controls - WASD
                    if (kbInfo.event.code === "KeyW") this.key_w = true;
                    if (kbInfo.event.code === "KeyA") this.key_a = true;
                    if (kbInfo.event.code === "KeyS") this.key_s = true;
                    if (kbInfo.event.code === "KeyD") this.key_d = true;
                    
                    // Jump
                    if (kbInfo.event.code === "Space") {
                        this.key_space = true;
                        this._handleJump();
                    }
                    
                    // Sprint
                    if (kbInfo.event.code === "ShiftLeft" || kbInfo.event.code === "ShiftRight") {
                        this.key_shift = true;
                    }
                    
                    // Game UI and chat controls
                    if (kbInfo.event.code === "Enter") {
                        if (this._ui && this._ui._ChatBox) {
                            this._ui._ChatBox.chatInput.focus();
                        }
                    }

                    // Digit keys for hotbar and abilities
                    this._handleDigitPress(kbInfo.event.code);
                    
                    // Debug and special commands
                    this._handleSpecialCommands(kbInfo.event.code);
                    
                    break;

                case KeyboardEventTypes.KEYUP:
                    // FPS controls - WASD
                    if (kbInfo.event.code === "KeyW") this.key_w = false;
                    if (kbInfo.event.code === "KeyA") this.key_a = false;
                    if (kbInfo.event.code === "KeyS") this.key_s = false;
                    if (kbInfo.event.code === "KeyD") this.key_d = false;
                    if (kbInfo.event.code === "Space") this.key_space = false;
                    
                    // Sprint
                    if (kbInfo.event.code === "ShiftLeft" || kbInfo.event.code === "ShiftRight") {
                        this.key_shift = false;
                    }

                    // Legacy movement reset
                    if (
                        kbInfo.event.code === "ArrowUp" ||
                        kbInfo.event.code === "ArrowLeft" ||
                        kbInfo.event.code === "ArrowRight" ||
                        kbInfo.event.code === "ArrowDown"
                    ) {
                        // Only reset legacy movement
                        this.vertical = 0;
                        this.horizontal = 0;
                        this.angle = 0;
                    }

                    // Other key releases
                    if (kbInfo.event.code === "KeyC") {
                        this.keyboard_c = false;
                    }

                    if (kbInfo.event.code === "ControlLeft") {
                        this.left_alt_pressed = false;
                    }
                    break;
            }
        });
    }
    
    /**
     * Handle jump functionality
     */
    private _handleJump(): void {
        if (this.canJump && this._gameScene && this._gameScene._scene) {
            // Apply upward force for jump
            this._gameScene._scene.gravity = new Vector3(0, this.jumpForce, 0);
            this.canJump = false;
            
            // Debug
            console.log("Jump initiated");
        }
    }
    
    /**
     * Handle digit key presses (1-9)
     */
    private _handleDigitPress(keyCode: string): void {
        if (keyCode === "Digit1") this.digit_pressed = 1;
        if (keyCode === "Digit2") this.digit_pressed = 2;
        if (keyCode === "Digit3") this.digit_pressed = 3;
        if (keyCode === "Digit4") this.digit_pressed = 4;
        if (keyCode === "Digit5") this.digit_pressed = 5;
        if (keyCode === "Digit6") this.digit_pressed = 6;
        if (keyCode === "Digit7") this.digit_pressed = 7;
        if (keyCode === "Digit8") this.digit_pressed = 8;
        if (keyCode === "Digit9") this.digit_pressed = 9;
    }
    
    /**
     * Handle special command keys
     */
    private _handleSpecialCommands(keyCode: string): void {
        // Debug commands
        if (keyCode === "KeyJ") {
            this._game.sendMessage(ServerMsg.DEBUG_REMOVE_ENTITIES);
        }
        if (keyCode === "NumpadAdd") {
            this._game.sendMessage(ServerMsg.DEBUG_INCREASE_ENTITIES);
        }
        if (keyCode === "NumpadSubtract") {
            this._game.sendMessage(ServerMsg.DEBUG_DECREASE_ENTITIES);
        }
        if (keyCode === "NumpadEnter") {
            this._game.sendMessage(ServerMsg.DEBUG_BOTS);
        }
        if (keyCode === "Home") {
            if (this._ui && this._ui._MainMenu) {
                this._ui._MainMenu.takeScreenshot();
            }
        }
        if (keyCode === "KeyN") {
            if (this._gameScene && this._gameScene._navMeshDebug) {
                this._gameScene._navMeshDebug.isVisible = !this._gameScene._navMeshDebug.isVisible;
            }
        }
        if (keyCode === "KeyD") {
            if (this._ui && this._ui._DebugBox) {
                this._ui._DebugBox._debugPanel.isVisible = !this._ui._DebugBox._debugPanel.isVisible;
            }
        }
        if (keyCode === "KeyH") {
            let assetKey = "ENV_" + this._game.currentLocationKey;
            let allMeshes = this._game._loadedAssets[assetKey];
            if (allMeshes && allMeshes.loadedMeshes) {
                let isVisible = !allMeshes.loadedMeshes[0].isVisible;
                allMeshes.loadedMeshes.forEach((m: Mesh) => {
                    m.isVisible = isVisible;
                });
            }
        }
        
        // Show items toggle
        if (keyCode === "ControlLeft") {
            this.left_alt_pressed = true;
        }
    }

    /**
     * Update movement direction based on camera orientation
     * This is key to FPS-style movement where you move in the direction you're facing
     */
    private _updateMovementDirection(): void {
        // Get the camera
        const camera = this._gameScene._camera?.camera;
        if (!camera) return;
        
        // Calculate forward and right vectors based on camera direction
        const cameraRotationMatrix = Matrix.RotationYawPitchRoll(
            camera.rotation.y, 
            camera.rotation.x, 
            0
        );
        
        // Direction vectors
        const forward = Vector3.TransformCoordinates(new Vector3(0, 0, 1), cameraRotationMatrix);
        const right = Vector3.TransformCoordinates(new Vector3(1, 0, 0), cameraRotationMatrix);
        
        // Reset movement values
        this.moveForward = 0;
        this.moveRight = 0;
        
        // Determine movement direction based on WASD keys
        if (this.key_w) this.moveForward += 1;
        if (this.key_s) this.moveForward -= 1;
        if (this.key_d) this.moveRight += 1;
        if (this.key_a) this.moveRight -= 1;
        
        // Calculate final movement direction
        this.moveDirection = forward.scale(this.moveForward).add(right.scale(this.moveRight));
        
        // Normalize if movement exists to ensure consistent speed in all directions
        if (this.moveDirection.length() > 0.1) {
            this.moveDirection.normalize();
            
            // Set legacy horizontal/vertical for compatibility with existing code
            this.horizontal = this.moveDirection.x;
            this.vertical = this.moveDirection.z;
        } else if (this.moveForward === 0 && this.moveRight === 0) {
            // Reset when no movement keys are pressed
            this.horizontal = 0;
            this.vertical = 0;
        }
    }

    /**
     * Start movement timer for legacy click-to-move system
     */
    private startMovementTimer() {
        let amount = 100;
        this.movementTimer = setInterval(() => {
            this.movementTimerNow += amount;
            if (this.movementTimerNow >= this.movementTimerDelay) {
                this.player_can_move = true;
                this.movementTimerNow = 0;
                clearInterval(this.movementTimer);
            }
        }, 100);
    }

    /**
     * Calculate velocity forces for legacy movement
     */
    private calculateVelocityForces() {
        if (this.angle !== 0) {
            this.vertical = -Math.cos(this.angle + Math.PI - this._game.deltaCamY);
            this.horizontal = Math.sin(this.angle + Math.PI - this._game.deltaCamY);
        }
    }
}
