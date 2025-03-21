import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { EntityActions } from "./Entity/EntityActions";
import { Entity } from "./Entity";
import State from "../../client/Screens/Screens";
import { Ability, EntityState, ServerMsg } from "../../shared/types";
import { GameScene } from "../Screens/GameScene";
import { PlayerAbility } from "./Player/PlayerAbility";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Observable } from "@babylonjs/core/Misc/observable";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Ray } from "@babylonjs/core/Culling/ray";

export class Player extends Entity {
    public game;
    public entities;
    public interval;
    public abilityController: PlayerAbility;

    public onPointerObservable;
    
    // FPS mode properties
    public onCollideObservable: Observable<AbstractMesh>;
    private _isGrounded: boolean = true;
    private _groundCheckRay: Ray;

    public player_data;
    public moveDecal;

    public closestEntity;
    public closestEntityDistance;

    public input_sequence: number = 0;

    // sounds
    public footstepInterval = 400;
    public footstepCurrent = 0;

    constructor(name, scene, gamescene: GameScene, entity) {
        super(name, scene, gamescene, entity);

        this.entities = gamescene._entities;

        this._input = gamescene._input;

        this.type = "player";
        
        // Initialize collision observable for jumping
        this.onCollideObservable = new Observable<AbstractMesh>();
        
        this.spawnPlayer();
    }

    private async spawnPlayer() {
        console.log("Spawning player mesh...");
        
        // get race data using public method instead of private property
        let raceData = this._game.getGameData("race", this.entity.race);
        console.log("Player race:", raceData ? raceData.key : "Unknown");

        // get race mesh
        let raceMesh = this._game._loadedAssets["RACE_" + this.entity.race];
        if (!raceMesh) {
            console.error("Failed to load race mesh for:", this.entity.race);
            return;
        }
        console.log("Race mesh loaded:", raceMesh);

        // clone mesh
        this.mesh = raceMesh.meshes[0].clone(this.entity.name);
        console.log("Player mesh created:", this.mesh.name);

        // set position
        this.mesh.position = new Vector3(this.entity.x, this.entity.y, this.entity.z);
        console.log("Player position set:", this.mesh.position);

        // Make player mesh invisible in first person mode
        if (this._gamescene._camera && this._gamescene._camera.isFPSMode()) {
            console.log("FPS mode detected - making player mesh invisible to avoid camera obstruction");
            this.mesh.isVisible = false;
        }

        // set metadata
        this.mesh.metadata = {
            type: "player",
            id: this.entity.id,
            sessionId: this.entity.sessionId,
        };

        // set player mesh
        this.mesh.isPickable = true;
        this.mesh.checkCollisions = true;
        this.mesh.ellipsoid = new Vector3(0.5, 1, 0.5);
        this.mesh.ellipsoidOffset = new Vector3(0, 0, 0);

        // setup collision detection for jumping
        this._setupCollisionDetection();
        
        // add shadow
        if (this._game.config.SHADOW_ON === true && this._gamescene._shadow) {
            this._gamescene._shadow.addShadowCaster(this.mesh);
            console.log("Shadow added to player mesh");
        }

        // add camera
        this._gamescene._camera.attach(this);
        console.log("Camera attached to player");
        // Set the cameraController property
        this.cameraController = this._gamescene._camera;
        console.log("Camera controller assigned:", this.cameraController ? "Success" : "Failed");

        // add ability controller
        this.abilityController = new PlayerAbility(this);

        // add pointer observer
        this.onPointerObservable = this._scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                if (pointerInfo.event.button === 0) {
                    this.leftClick(pointerInfo);
                } else if (pointerInfo.event.button === 2) {
                    this.rightClick(pointerInfo);
                }
            }
        });

        console.log("Player spawn complete");
    }

    /**
     * Set up ground collision detection using raycasting
     */
    private _setupCollisionDetection(): void {
        // Create a ray for ground detection
        const origin = new Vector3(0, 0, 0);
        const direction = new Vector3(0, -1, 0);
        this._groundCheckRay = new Ray(origin, direction, 1.5); // 1.5 units down
        
        // Check for ground collision on each frame
        this._scene.registerBeforeRender(() => {
            this._checkGroundCollision();
        });
    }
    
    /**
     * Check if the player is on the ground
     */
    private _checkGroundCollision(): void {
        // Update ray position to match player
        this._groundCheckRay.origin = new Vector3(
            this.position.x,
            this.position.y + 0.5, // Slightly above player position
            this.position.z
        );
        
        // Cast ray downward to detect ground
        const hit = this._scene.pickWithRay(this._groundCheckRay);
        
        // If we hit something and it's close enough, we're grounded
        if (hit && hit.hit && hit.distance < 1.5) {
            this._isGrounded = true;
            
            // Allow jumping again
            if (this._input && !this._input.canJump) {
                this._input.canJump = true;
                
                // Restore normal gravity
                if (this._scene.gravity.y > -0.5) {
                    this._scene.gravity = new Vector3(0, -0.6, 0);
                }
            }
        } else {
            this._isGrounded = false;
        }
    }

    getMeshMetadata(pointerInfo) {
        if (!pointerInfo._pickInfo.pickedMesh) return false;

        if (!pointerInfo._pickInfo.pickedMesh.metadata) return false;

        if (pointerInfo._pickInfo.pickedMesh.metadata === null) return false;

        return pointerInfo._pickInfo.pickedMesh.metadata;
    }

    public rightClick(pointerInfo) {
        let metadata = this.getMeshMetadata(pointerInfo);

        if (!metadata) return false;

        if (metadata.type === "entity") {
            let target = this.entities[metadata.sessionId];
        }
    }

    // process left click for player
    public leftClick(pointerInfo) {
        let metadata = this.getMeshMetadata(pointerInfo);

        if (!metadata) return false;

        // select entity
        if (metadata.type === "player" || metadata.type === "entity") {
            // select entity
            let targetSessionId = metadata.sessionId;
            let target = this.entities.get(targetSessionId);
            this._ui._targetEntitySelectedBar.setTarget(target);

            // display nameplate for a certain time for any entity right clicked
            if (target.characterLabel) {
                target.characterLabel.isVisible = true;
            }

            // if spawninfo available
            if (!target.spawnInfo) return false;

            /*
            // if targets is aggressive, clicking on with will trigger move & attack
            // note: need to find a better way to do this, not linked to hotbar
            if (target.spawnInfo.aggressive) {
                // send to server
                this._game.sendMessage(ServerMsg.PLAYER_HOTBAR_ACTIVATED, {
                    senderId: this._room.sessionId,
                    targetId: target ? target.sessionId : false,
                    digit: 1,
                });
                return false;
            }*/

            // if interactable target
            if (!target.spawnInfo.interactable) return false;

            // if close enough, open dialog
            let playerPos = this.getPosition();
            let entityPos = target.getPosition();
            let distanceBetween = Vector3.Distance(playerPos, entityPos);
            if (distanceBetween < this._game.config.PLAYER_INTERACTABLE_DISTANCE) {
                this._ui.panelDialog.open(target);

                // stop any movement
                // todo: improve
                this._input.left_click = false;
                this._input.vertical = 0;
                this._input.horizontal = 0;
                this._input.player_can_move = false;
            }
        }

        // pick up item
        if (metadata.type === "item") {
            this._game.sendMessage(ServerMsg.PLAYER_PICKUP, {
                sessionId: metadata.sessionId,
            });
        }

        // move to clicked point
        if (metadata.type === "environment" && !this.isDead) {
            /*
            // deselect any entity
            this._game.selectedEntity = false;

            // removed click to move
            // todo: add client prediction.
            let destination = pointerInfo._pickInfo.pickedPoint;
            let pickedMesh = pointerInfo._pickInfo.pickedMesh;

            console.log("[LEFT CLICK]", destination);

            const foundPath = this._navMesh.getRegionForPoint(destination);
            if (foundPath) {
                // remove decal if already exist
                if (this.moveDecal) {
                    this.moveDecal.dispose();
                }

                // add decal to show destination
                var decalMaterial = this._scene.getMaterialByName("decal_target");
                this.moveDecal = MeshBuilder.CreateDecal("decal", pickedMesh, { position: destination });
                this.moveDecal.material = decalMaterial;

                // remove decal after 1 second
                setTimeout(() => {
                    this.moveDecal.dispose();
                }, 1000);

                // send to server
                this._game.sendMessage(ServerMsg.PLAYER_MOVE_TO, {
                    x: destination._x,
                    y: destination._y,
                    z: destination._z,
                });
            }
            */
        }
    }

    // update at engine rate 60fps
    public update(delta) {
        // run super function first
        super.update(delta);

        // action controller
        if (this.actionsController) {
            this.actionsController.update();
        }

        // update camera
        const cameraController = this.getCameraController();
        if (cameraController) {
            cameraController.update();
        } else {
            console.warn('Camera controller not available for player update');
        }
    }

    // update at server rate
    public updateServerRate(delta) {
        // run super function first
        super.updateServerRate(delta);

        if (this.moveController) {
            // process player movement
            this.moveController.processMove();
        }

        if (this.abilityController) {
            this.abilityController.update(delta);
        }
        // if dead, show ressurect panel
        if (!this.isDeadUI && this.health < 1) {
            this._ui._RessurectBox.open();
            if (this.cameraController) {
                this.cameraController.vfx_black_and_white_on();
            }
            this.isDeadUI = true;
        }

        // if ressurected, hide panel
        if (this.isDeadUI && this.health > 0) {
            if (this.cameraController) {
                this.cameraController.vfx_black_and_white_off();
            }
            this._ui._RessurectBox.close();
            this.isDeadUI = false;
        }

        // sounds
        if (this.isMoving && this.footstepCurrent > this.footstepInterval) {
            this._gamescene._sound.play("SOUND_player_walking");
            this.footstepCurrent = 0;
        }
        this.footstepCurrent += delta;
    }

    public updateSlowRate(delta: any): void {
        // run super function first
        super.updateSlowRate(delta);

        ///////////// DIALOG ///////////////////////////
        // only if moving, look for the closest interactable entities.
        if (this.isMoving) {
            // look for closest npc
            // todo: maybe this is a silly way?
            //this.findCloseToInteractableEntity();

            // if close enough, show interactable button
            if (this.closestEntityDistance < 5 && this.closestEntity.interactableButtons) {
                this.closestEntity.interactableButtons.isVisible = true;
            }

            // if far enough, hide interactable button & any open dialog
            if (this.closestEntityDistance > 5 && this.closestEntity.interactableButtons) {
                this._ui.panelDialog.close();
            }

            ///////////// ENVIRONMENT LOD ///////////////////////////
            // only show meshes close to us
            let currentPos = this.getPosition();
            let key = "ENV_" + this._game.currentLocation.mesh;
            let allMeshes = this._game._loadedAssets[key]?.loadedMeshes ?? [];
            allMeshes.forEach((element) => {
                if (element.name !== "__root__") {
                    let distanceTo = Vector3.Distance(element.getAbsolutePosition(), currentPos);
                    if (distanceTo < 50) {
                        element.setEnabled(true);
                    } else {
                        element.setEnabled(false);
                    }
                }
            });
        }
    }

    /**
     * This function is called every time the player moves, so that
     * the closest interactable entity can be highlighted on screen.
     */
    public findCloseToInteractableEntity() {
        let minDistanceSquared = Infinity;
        let playerPos = this.getPosition();
        this.entities.forEach((entity) => {
            if (entity.type === "entity" && entity.interactableButtons && entity.health > 0) {
                entity.interactableButtons.isVisible = false;
                let entityPos = entity.getPosition();
                let distanceSquared = Vector3.Distance(playerPos, entityPos);
                if (distanceSquared < minDistanceSquared) {
                    this.closestEntity = entity;
                    this.closestEntityDistance = distanceSquared;
                    minDistanceSquared = distanceSquared;
                }
            }
        });
    }

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // server message handler

    public registerServerMessages() {
        this._room.onMessage(ServerMsg.SERVER_MESSAGE, (data) => {
            console.log("ServerMsg.SERVER_MESSAGE", data);
            this._ui._ChatBox.addNotificationMessage(data.type, data.message, data.message);
        });

        // on teleport confirmation
        this._room.onMessage(ServerMsg.PLAYER_TELEPORT, (location) => {
            console.log("ServerMsg.PLAYER_TELEPORT", location);
            this.teleport(location);
        });

        // server confirm player can start casting
        this._room.onMessage(ServerMsg.PLAYER_CASTING_START, (data) => {
            console.log("ServerMsg.PLAYER_CASTING_START", data);
            this.abilityController.startCasting(data);
        });

        this._room.onMessage(ServerMsg.PLAYER_CASTING_CANCEL, (data) => {
            console.log("ServerMsg.PLAYER_CASTING_CANCEL", data);
            this.abilityController.stopCasting(data);
        });

        // server confirms ability can be cast
        this._room.onMessage(ServerMsg.PLAYER_ABILITY_CAST, (data) => {
            console.log("ServerMsg.PLAYER_ABILITY_CAST", data);
            this.abilityController.processServerCasting(data);
        });
    }

    public async remove() {
        super.remove();

        // remove any pointer event
        if (this.onPointerObservable && this._scene.onPointerObservable.hasObservers()) {
            this._scene.onBeforeRenderObservable.remove(this.onPointerObservable);
        }
    }

    /**
     * when current player quits the game
     */
    public async quit() {
        // leave colyseus rooms
        if (this._room) {
            await this._room.leave();
        }

        if (this._game.currentChat) {
            await this._game.currentChat.leave();
        }

        // clear cached chats
        this._game.currentChats = [];

        // switch scene
        this._game.setScene(State.CHARACTER_SELECTION);
    }

    public async teleport(location) {
        // leave colyseus room
        if (this._room) {
            await this._room.leave();
        }

        // update auth data
        this._game.setLocation(location);

        // switch scene
        this._game.setScene(State.GAME);
    }
}
