import { Scene } from './scene';
import { Vector } from 'vecti';
import { EntityManager, Entity } from '../entityManager/entityManager';
import {
    ActionEnums,
    ActionKeys,
    ActionLifeCycle,
    ComponentTypes,
    CustomEventEnums,
    EntityFlags,
    EntityTypes,
    EntityStates,
    ScalePolicies,
    SceneTags,
} from '../utils/enums';
import {
    createComponent,
    Transform as CTransformType,
    Flags as CFlagsType,
    Collision as CCollisionType,
    State as CStateType,
    Gravity as CGravityType,
    Traits as CTraitsType,
    AnimationContainer,
    Attacks as CAttacksType,
    AnimationStackEntry,
    Actions as CActionsType,
    Component,
    Sprite as CSpriteType,
} from '../components/components';
import { Animation } from '../animation/animation';
import { getScaledSpriteSize } from '../utils/sprite';
import { initPlayerFSM } from './playerStates';
import { CollisionSystem } from '../systems/collision';
import { Action } from '../action/action';
import { Attack } from '../attack/Attack';
import { getStateToAnim } from '../config/stackToAnimation';
import { groupEnd, groupStart, log } from '../utils/logging';

/**
 * Play_Scene
 *
 * @description Scene for playing the game
 *
 *
 */
class PlayScene extends Scene {
    /*
     * TODO (anchors): Use CENTER as the single source of truth in CTransform.
     *
     * - Physics & interpolation operate on center (world space).
     * - Rendering/UI need top-left → derive it from center + scaled logical size (+ scaled offsets).
     * - Do NOT store both center and top-left; compute one from the other to avoid drift.
     *
     * Helpers:
     * edit the current centeredBoundingRect method
     *
     * Tiles placed by top-left? Convert once at spawn:
     *   transform.position = topLeftToCenter(tileTopLeft, scaledTileSize);
     *
     */
    #playerAnimationMap = new Map();
    #mapConfig = {
        tileSize: new Vector(64, 64),
        numTiles: 0,
    };

    #player = new Entity();
    #drawCollisions = true;
    #drawGrid = true;
    #drawHoverTile = true;
    #pointerX = null;
    #pointerY = null;
    #camera = new Vector(0, 0);

    drawTexture = false;

    #gridPattern = null; // CanvasPattern
    #gridPatternCanvas = null; // OffscreenCanvas | HTMLCanvasElement (debug/cleanup)
    #gridPatternTile = { x: 0, y: 0 }; // the tile size used to build the pattern
    #gridPatternDPR = 0; // so we can rebuild when DPR changes
    #gridMajorEvery = 1; // draw a stronger line every N cells

    collisions = new CollisionSystem();

    constructor(gameEngine) {
        super(gameEngine, SceneTags.PLAY);

        this.registerAction(ActionKeys.p, ActionEnums.PAUSE);
        this.registerAction(ActionKeys.l, ActionEnums.ATTACK);
        this.registerAction(ActionKeys.escape, ActionEnums.QUIT);
        this.registerAction(ActionKeys.num_0, ActionEnums.TOGGLE_TEXTURE);
        this.registerAction(ActionKeys.num_1, ActionEnums.TOGGLE_COLLISION);
        this.registerAction(ActionKeys.num_2, ActionEnums.TOGGLE_GRID);
        this.registerAction(ActionKeys.space, ActionEnums.JUMP);
        this.registerAction(ActionKeys.a, ActionEnums.LEFT);
        this.registerAction(ActionKeys.d, ActionEnums.RIGHT);
        this.registerAction(ActionKeys.s, ActionEnums.DOWN);
        this.registerAction(ActionKeys.w, ActionEnums.JUMP);
        this.registerAction(ActionKeys.pointerDown, ActionEnums.CLICK);
        this.registerAction(ActionKeys.pointerMove, ActionEnums.POINTER_POSITION);

        this.#mapConfig.numTiles = new Vector(
            this.gameEngine.logicalWidth / this.#mapConfig.tileSize.x,
            this.gameEngine.logicalHeight / this.#mapConfig.tileSize.y
        );

        // create a ready animation for each
        groupStart('-------------------------------------\nAnimation pool');
        log({ msg: 'create an animation pool for the player to re-use' });
        for (let anim of gameEngine.getAnimations().keys()) {
            this.#playerAnimationMap.set(anim, new Animation(anim, gameEngine.getAnimation(anim), gameEngine));
        }

        log({ msg: this.#playerAnimationMap });
        groupEnd();

        this.entityManager = new EntityManager();
        this.#loadLevel();

        /** @type {CFlagsType} */
        const flags = this.#player.getComponent(ComponentTypes.CFlags);
        log(flags.mask.toString(2));
        let str = '';
        for (let flagKey in EntityFlags) {
            str += `${flagKey} : ${flags.has(flagKey)} | `.toString();
        }
        log(str);
    }

    #loadLevel() {
        const playSceneData = this.gameEngine.getAssets().sceneData.playScene;
        for (const e of playSceneData.entities) {
            let entity = this.#addPlayerEntity(e);
            if (e.tag == EntityTypes.PLAYER) {
                this.#player = entity;
            }
        }
    }

    #addPlayerEntity(e) {
        let attacks = [];
        let components;
        /** @type {Animation} */
        let animation;
        const ts = e[ComponentTypes.CTransform];
        const flags = e[ComponentTypes.CFlags];
        const canFall = CFlagsType.hasFlag(EntityFlags.CAN_FALL, flags);
        const isStatic = CFlagsType.hasFlag(EntityFlags.STATIC, flags);
        const animated = CFlagsType.hasFlag(EntityFlags.ANIMATED, flags);
        const canAttack = CFlagsType.hasFlag(EntityFlags.CAN_ATTACK, flags);
        const collides = CFlagsType.hasFlag(EntityFlags.COLLIDES, flags);

        // Create the components array for the entity
        {
            const playSceneData = this.gameEngine.getAssets().sceneData.playScene;
            const entityConfig = playSceneData.entityTypes[e.tag];
            if (!entityConfig) throw new Error(`Unknown entity tag: ${e.tag}`);

            const playerSTA = getStateToAnim(e.tag);
            const spriteD = e[ComponentTypes.CSpriteDimensions];
            const bb = e[ComponentTypes.CBoundingBox];
            const gravity = e[ComponentTypes.CGravity] ?? null;
            const sprite = e[ComponentTypes.CSprite] ?? null;
            if (CFlagsType.hasFlag(EntityFlags.CAN_ATTACK, flags)) {
                for (let i = 0; i < entityConfig.attacks.length; i++) {
                    attacks.push(
                        new Attack(
                            entityConfig.attacks[i],
                            this.gameEngine.levelConfig.attacks[entityConfig.attacks[i]]
                        )
                    );
                }
            }

            animation = CFlagsType.hasFlag(EntityFlags.ANIMATED, flags)
                ? this.#playerAnimationMap.get(playerSTA(entityConfig.initialState))
                : null;

            components = {
                [ComponentTypes.CActions]: [],
                [ComponentTypes.CSpriteDimensions]: [
                    new Vector(spriteD.dimensions.x, spriteD.dimensions.y),
                    new Vector(spriteD.trimmedRectangle.x, spriteD.trimmedRectangle.y),
                ],
                [ComponentTypes.CTransform]: [
                    new Vector(ts.position.x, ts.position.y),
                    new Vector(ts.velocity.x, ts.velocity.y),
                    new Vector(ts.scale.x, ts.scale.y),
                    ts.angle,
                    ts.hSpeed,
                    ts.vSpeed,
                ],
                [ComponentTypes.CBoundingBox]: [
                    new Vector(bb.rectangle.x, bb.rectangle.y),
                    new Vector(bb.offset.x, bb.offset.y),
                ],
                [ComponentTypes.CState]: [entityConfig.initialState, playerSTA],
                [ComponentTypes.CFlags]: [flags],
            };

            if (animated) components[ComponentTypes.CAnimation] = [animation ? animation.repeats : true];
            if (!isStatic) components[ComponentTypes.CGravity] = [new Vector(gravity.x, gravity.y)];
            if (collides) components[ComponentTypes.CCollision] = [];
            if (canAttack) components[ComponentTypes.CAttacks] = [attacks];
            if (!!sprite) components[ComponentTypes.CSprite] = [sprite.sheetId, sprite.frame];
        }
        // Create the entity
        const entity = this.#spawnEntity(components, e.tag, ts.grid.x, ts.grid.y);
        /** @type {CStateType} */
        const cst = entity.getComponent(ComponentTypes.CState);

        if (canFall && !isStatic) {
            /** @type {CGravityType} */
            const cg = entity.getComponent(ComponentTypes.CGravity) ?? new Vector(0, 0);
            cg.timeBeforeFalling = 0.5;
        }
        if (animated && animation) {
            /** @type {AnimationContainer} */
            const cAnim = entity.getComponent(ComponentTypes.CAnimation);
            // Add a pointer to an animation pool
            cAnim.animationPool = this.#playerAnimationMap;
            cAnim.pushAnimation(animation);
        }
        if (!isStatic) {
            initPlayerFSM(cst);
        }

        return entity;
    }

    /**
     * @returns {Map<string, Action>} - A Map of action name to Action object.
     */
    getActions() {
        return this.actionMap;
    }

    #spawnPlayer() {}
    #spawnBullet(entity) {}

    /**********************************************************************
     *  Systems
     *********************************************************************/
    /* Move the entity based on its current state */
    #sMovement(entity, dt) {
        /** @type {CTransformType} */
        const ctr = entity.getComponent(ComponentTypes.CTransform);

        ctr.velocity = ctr.velocity.add(ctr.acceleration); // Acceleration => Velocity
        ctr.position = ctr.position.add(ctr.velocity.multiply(dt)); // Velocity => Position
        ctr.acceleration = ctr.acceleration.multiply(0); // Clear per-Frame forces
    }

    /**
     *
     * @param {Entity} entity The entity we are applying the force on.
     * @param {Vector} force The force we are applying to the entity.
     */
    #sApplyForce(dt, entity, force) {
        /** @type {CTransformType} */
        let ctr = entity.getComponent(ComponentTypes.CTransform);
        ctr.acceleration = ctr.acceleration.add(force);
        ctr.acceleration = ctr.acceleration.multiply(dt);
    }

    #sLifespan(entity) {}
    #sAnimation(entity) {
        // TODO: handle non repeating animations and state changes
        /** @type {CStateType} */
        const cst = entity.getComponent(ComponentTypes.CState);
        /** @type {AnimationContainer} */
        const ca = entity.getComponent(ComponentTypes.CAnimation);
        /** @type {AnimationStackEntry} */
        let current = ca.peekAnimation();

        // Ensure there is a base animation.
        if (!current) {
            const key = cst.stateToAnimation(cst.current);
            const base = ca.animationPool.get(key);
            ca.pushAnimation(base);
            current = ca.peekAnimation();
        }

        if (current.hasEnded()) {
            cst.current = cst.previous;
        }

        const nextAnim = ca.animationPool.get(cst.stateToAnimation(cst.current));
        current = ca.peekAnimation();
        if (current.name !== nextAnim.name) {
            ca.pushAnimation(nextAnim, cst.previous);
        }
    }

    fixedUpdate(dt) {
        if (this.paused) return;

        for (let entity of this.entityManager.getAllEntities()) {
            /** @type {CFlagsType} */
            const cf = entity.getComponent(ComponentTypes.CFlags);
            if (cf.has(EntityFlags.DECORATION)) continue;

            /** @type {CStateType} */
            const cs = entity.getComponent(ComponentTypes.CState);
            /** @type { BoundingBox} */
            const bBox = entity.getComponent(ComponentTypes.CBoundingBox);
            /** @type { CTransformType } */
            const tr = entity.getComponent(ComponentTypes.CTransform);
            if (cf.has(EntityFlags.ANIMATED)) this.#sAnimation(entity);
            if (!cf.has(EntityFlags.STATIC)) this.sActions(entity);
            if (cf.has(EntityFlags.CAN_FALL) && cs.current == EntityStates.JUMPING) {
                /** @type {CGravityType} */
                const cg = entity.getComponent(ComponentTypes.CGravity);
                /** @type {CActionsType} */
                const ca = entity.getComponent(ComponentTypes.CActions);
                this.#sApplyForce(dt, entity, cg.gravity);
                // Has the entity reached the apex from velocity, bring it down
                if (tr.velocity.y >= 0) {
                    log({ msg: '******************************************************************************' });
                    ca.enqueue(new Action(ActionEnums.FALL, ActionLifeCycle.START));
                }
            }

            // Run collision tests
            if (!cf.has(EntityFlags.STATIC) && cf.has(EntityFlags.COLLIDES)) {
                this.#sMovement(entity, dt);
                this.sCollision(entity);

                // update the position of the bounding box
                bBox.position = tr.position;
            }
        }

        let changed = this.entityManager.update();
        if (changed) {
            this.gameEngine.dispatchEvent(
                new CustomEvent(CustomEventEnums.ENTITIES.UPDATED, {
                    detail: {
                        count: this.entityManager.getAllEntities().length,
                        entities: this.entityManager.getAllEntities(),
                    },
                })
            );
        }
    }

    onFrameEnd(elapsedTime, numUpdateSteps) {
        for (let entity of this.entityManager.getAllEntities()) {
            /** @type {CFlagsType} */
            const cf = entity.getComponent(ComponentTypes.CFlags);
            if (cf.has(EntityFlags.ANIMATED)) {
                /** @type {AnimationContainer} */
                const ca = entity.getComponent(ComponentTypes.CAnimation);
                ca.peekAnimation().update(elapsedTime);
            }
        }
    }

    async sRender(alpha) {
        if (this.paused) return;
        if (this.#drawGrid) this.#renderGridPattern(this.gameEngine.ctx);

        for (let entity of this.entityManager.getAllEntities()) {
            /** @type {CTransformType} */
            let tr = entity.getComponent(ComponentTypes.CTransform);
            /** @type {CFlagsType} */
            let bBox = entity.getComponent(ComponentTypes.CBoundingBox);
            // log({ msg: entity });
            // show the sprite
            if (this.drawTexture && entity.getComponent(ComponentTypes.CAnimation)) {
                /** @type {AnimationContainer} */
                const ca = entity.getComponent(ComponentTypes.CAnimation);
                let { sheetId, frame } = ca.peekAnimation().getCurrentFrame();
                if (!tr.scale) {
                    tr.scale = new Vector(1, 1);
                }

                // TODO: Rendering stalls risk. sRender awaits drawSprite inside the frame loop, serializing draws and inviting jank. Batch draws or ensure drawSprite is synchronous after assets are loaded.
                await this.gameEngine.drawSprite(sheetId, frame, tr.position, tr.scale);
            } else if (this.drawTexture) {
                /** @type {CSpriteType} */
                let cSprite = entity.getComponent(ComponentTypes.CSprite);
                if (!cSprite) {
                    continue;
                }
                if (!tr.scale) {
                    tr.scale = new Vector(1, 1);
                }
                await this.gameEngine.drawSprite(cSprite.sheetId, cSprite.frame, tr.position, tr.scale);
            }

            // show the center of the bounding box
            if (this.#drawCollisions) {
                // draw based on entity position
                let rectCentered = Vector.of([tr.position.x, tr.position.y]);
                rectCentered = rectCentered.subtract(bBox.halfSize);
                this.gameEngine.drawRect(rectCentered, bBox.size, 'rgba(205, 29, 41, 1)');
                this.gameEngine.drawCircleFilled(tr.position, 2, 'rgba(89, 255, 252, 1)');
                // draw based on entity's bounding box position
            }
        }

        if (this.#drawHoverTile && this.#pointerX && this.#pointerY) {
            let tile = this.#getTileUnderMouse();

            this.gameEngine.drawRect(
                new Vector(tile.x * this.#mapConfig.tileSize.x, tile.y * this.#mapConfig.tileSize.y),
                this.#mapConfig.tileSize,
                'rgba(145, 0, 0, 0.5)',
                'rgba(243, 157, 95, 0.57)'
            );
        }

        // this.gameEngine.drawCircleFilled(this.#gridToWorld(1, 4), 4, 'rgba(255, 0, 217, 1)');
        // this.gameEngine.drawCircleFilled(this.#gridToWorldCentered(1, 4), 4, 'rgba(255, 0, 217, 1)');
    }

    /**
     * Check for collisions between the given entity and all other entities.
     * If a collision is found, the entity's position will be adjusted to avoid the collision.
     * @param {Entity} entity - The entity to check for collisions.
     */
    sCollision(entity) {
        /** @type {CTransformType} */
        const tr = entity.getComponent(ComponentTypes.CTransform);
        /** @type {CCollisionType} */
        const cc = entity.getComponent(ComponentTypes.CCollision);
        /** @type {BoundingBox} */
        const bb = entity.getComponent(ComponentTypes.CBoundingBox);

        const prevOverlap = { ...cc.prevOverlap };
        for (let other of this.entityManager.getAllEntities()) {
            // Guards
            if (entity.id === other.id) continue;
            if (!other.getComponent(ComponentTypes.CFlags).has(EntityFlags.COLLIDES)) continue;
            if (!other.getComponent(ComponentTypes.CBoundingBox)) continue;
            /** @type {CTransformType} */
            const otherTr = other.getComponent(ComponentTypes.CTransform);
            const result = this.collisions.calculateOverlap(entity, other);
            // "Cache" results
            cc.prevOverlap = { ...result };
            cc.prevOverlap.other = other;
            /** @type {CActionsType} */
            const ca = entity.getComponent(ComponentTypes.CActions);

            if (!result.overlapping) continue;

            // 🤖
            // 1) separate along MTV
            tr.position.x += result.mtv.x;
            tr.position.y += result.mtv.y;

            // 2) kill velocity on the resolved axis (prevents jitter)
            if (result.axis === 'x') {
                tr.velocity.x = 0;
            } else if (tr.position.y > otherTr.position.y) {
                log({ msg: 'hit top' });
                ca.enqueue(new Action(ActionEnums.FALL, ActionLifeCycle.START));
            } else {
                tr.velocity.y = 0;
                ca.enqueue(new Action(ActionEnums.ON_GROUND, ActionLifeCycle.START));
            }

            // 3) keep bbox center in sync
            bb.position.x = tr.position.x;
            bb.position.y = tr.position.y;
        }
    }

    /**
     * Process all queued actions.
     * Actions are processed in the order they were received, and are processed until the queue is empty.
     * This function is responsible for updating the player's state based on the actions it receives.
     */
    sActions(entity) {
        /** @type {CActionsType} */
        const actionsQ = entity.getComponent(ComponentTypes.CActions);
        if (!actionsQ) {
            // log('Actions should not be called', 'error');
            return;
        }
        // Nothing to do.
        if (actionsQ.isEmpty()) return;

        // The player's current state
        /** @type {CStateType} */
        let cState = entity.getComponent(ComponentTypes.CState);
        let state_ = cState.stateCallbackMap.get(cState.current);

        let action = actionsQ.dequeue();
        while (action) {
            state_ = cState.stateCallbackMap.get(cState.current);
            state_.handleAction(this.#player, action);
            action = actionsQ.dequeue();
        }
    }

    addAction(action) {
        /**
         * @type {CActionsType}
         */
        const cActions = this.#player.getComponent(ComponentTypes.CActions);
        cActions.enqueue(action);
    }

    /**
     * Processes an immediate action.
     * Immediate actions are processed immediately, and are not queued.
     * This function is used to process actions that are not related to the player's state, such as mouse movements.
     *
     * @param {Action} action - The action to process.
     */
    doActionImm(action) {
        switch (action.name) {
            case ActionEnums.POINTER_POSITION:
                this.#pointerX = action.payload.x;
                this.#pointerY = action.payload.y;
                break;
            case ActionEnums.CLICK:
                this.#pointerX = action.payload.x;
                this.#pointerY = action.payload.y;
                // get grid coords
                const coords = this.#getTileUnderMouse();
                break;
            default:
                break;
        }
    }

    sApplyGravity() {}

    onEnd() {
        log({ msg: 'end' });
    }
    changePlayerStateTo(state) {}

    setPaused(isPaused) {
        log({ msg: ['setPaused', isPaused] });
        this.paused = isPaused;
    }

    /**
     * Spawns an entity with no animation at the given grid coordinates with the given components.
     * @param {Component[]} components - A map of component type to component arguments.
     * @param {EntityTypes} type - The type of entity to spawn.
     * @param {number} gridX - The x coordinate in the grid.
     * @param {number} gridY - The y coordinate in the grid.
     * @param {EntityFlags} flags - The flags for the entity.
     * @param {string} sheetId - The id of the sprite sheet to use.
     * @param {string} frame - The id of the frame to use.
     * @param {boolean} isStatic - Whether the entity is static.
     * @returns {Entity} The entity that was spawned.
     *
     */
    placeSpriteEntityGrid(type, x = 0, y = 0, flags, traits = [], sheetId, frame) {
        let dims = this.gameEngine.getSpriteDimensions(sheetId);
        dims = new Vector(dims.w, dims.h);
        let trimmedRect = this.gameEngine.getSpriteTrimmedRect(sheetId);
        let hasTrimmedRect = trimmedRect != null;
        if (trimmedRect) trimmedRect = new Vector(trimmedRect.width, trimmedRect.height);
        else trimmedRect = new Vector(1, 1);

        let scale = new Vector(this.#mapConfig.tileSize.x / dims.x, this.#mapConfig.tileSize.y / dims.y);
        let pos = new Vector(x, y);
        let gridPos = this.#worldToGrid(new Vector(x, y));
        let components = {
            [ComponentTypes.CSprite]: [sheetId, frame],
            [ComponentTypes.CSpriteDimensions]: [dims, trimmedRect],
            [ComponentTypes.CTransform]: [pos, new Vector(0, 0), scale, 0],
            [ComponentTypes.CBoundingBox]: [hasTrimmedRect ? trimmedRect : dims, new Vector(0, 0)],
            [ComponentTypes.CFlags]: [flags],
            [ComponentTypes.CTraits]: [],
            [ComponentTypes.CState]: [EntityStates.IDLE],
        };

        let entity = this.#spawnEntity(components, type, gridPos.x, gridPos.y);

        // if (flags.length > 0) {
        //     /** @type { CFlagsType} */
        //     let cf = entity.getComponent(ComponentTypes.CFlags);
        //     for (let i = 0; i < flags.length; i++) {
        //         cf.add(flags[i]);
        //     }
        // }

        if (traits.length > 0) {
            /** @type {CTraitsType} */
            let cTraits = entity.getComponent(ComponentTypes.CTraits);
            for (let i = 0; i < traits.length; i++) {
                cTraits.add(traits[i]);
            }
        }
        return entity;
    }

    placeEntityWithAnim() {}

    /**
     * Gets the tile coordinates of the given entity.
     * @param {Entity} e - The entity to get the tile coordinates of.
     * @returns {Vector} The tile coordinates of the entity.
     */
    getEntityTile(e) {
        /** @type {CTransformType} */
        const tr = e.getComponent(ComponentTypes.CTransform);
        return this.#worldToGrid(tr.position);
    }

    /****************************************************************************
     * HELPER FUNCTIONS
     ***************************************************************************/

    #isOverlapping() {}
    /**
     *
     * @param {number} gridX the x coordinate in the grid
     * @param {number} gridY the y coordinate in the grid
     * @returns {Vector} The in game world coordinated for the grid
     */
    #gridToWorld(gridX, gridY) {
        let worldX = gridX * this.#mapConfig.tileSize.x;
        let worldY = gridY * this.#mapConfig.tileSize.y;
        return new Vector(worldX, worldY);
    }

    /**
     *
     * @param {number} gridX the x coordinate in the grid
     * @param {number} gridY the y coordinate in the grid
     * @returns
     */
    #gridToWorldCentered(gridX, gridY) {
        let worldX = gridX * this.#mapConfig.tileSize.x;
        let worldY = gridY * this.#mapConfig.tileSize.y;
        return new Vector(worldX + this.#mapConfig.tileSize.x / 2, worldY + this.#mapConfig.tileSize.y / 2);
    }

    #getTileUnderMouse() {
        let gridX, gridY;
        if (this.#pointerX > 0) {
            gridX = (this.#pointerX / this.gameEngine.logicalWidth) * this.#mapConfig.numTiles.x;
        } else {
            gridX = 0;
        }

        if (this.#pointerY > 0) {
            gridY = (this.#pointerY / this.gameEngine.logicalHeight) * this.#mapConfig.numTiles.y;
        } else {
            gridY = 0;
        }

        gridX = Math.floor(gridX);
        gridY = Math.floor(gridY);
        return this.#worldToGrid(new Vector(this.#pointerX, this.#pointerY));
    }

    /** @param {Vector} worldPos */
    #worldToGrid(worldPos) {
        let gridX, gridY;
        if (worldPos.x > 0) {
            gridX = (worldPos.x / this.gameEngine.logicalWidth) * this.#mapConfig.numTiles.x;
        } else {
            gridX = 0;
        }

        if (worldPos.y > 0) {
            gridY = (worldPos.y / this.gameEngine.logicalHeight) * this.#mapConfig.numTiles.y;
        } else {
            gridY = 0;
        }

        gridX = Math.floor(gridX);
        gridY = Math.floor(gridY);
        return new Vector(gridX, gridY);
    }

    #scaleBoundingRect(entity) {
        /** @type { CTraitsType } */
        let transform = entity.getComponent(ComponentTypes.CTransform);
        // / Get the bounding box
        /** @type { BoundingBox } */
        let cBoundingBox = entity.getComponent(ComponentTypes.CBoundingBox);
        let bBoxRect = cBoundingBox.rectangle;

        // Scale the bounding box
        let scaledRect = getScaledSpriteSize(bBoxRect, transform.scale, ScalePolicies.UNIFORM_Y, null);
        let halfSize = scaledRect.divide(2);

        // Find the center and top left of the sprite
        let center = new Vector(
            transform.position.x - halfSize.x + scaledRect.x / 2,
            transform.position.y - halfSize.y + scaledRect.y / 2
        );

        // The collision box is offset from the sprite
        // topLeft = topLeft.add(cBoundingBox.offset);

        // center = topLeft.add(halfSize);
        return { scaledRect, position: center };
    }

    #centerToTopLeft(bBox) {
        let halfSize = bBox.halfSize;
        return bBox.position.subtract(halfSize);
    }

    #renderGridPattern(ctx) {
        this.#ensureGridPattern();
        if (!this.#gridPattern) return;
        const w = Math.max(0, this.gameEngine.logicalWidth | 0);
        const h = Math.max(0, this.gameEngine.logicalHeight | 0);
        const tsX = this.#mapConfig.tileSize.x | 0;
        const tsY = this.#mapConfig.tileSize.y | 0;

        // Guard: bail if anything is invalid
        if (!isFinite(w) || !isFinite(h) || tsX < 2 || tsY < 1) return;

        // Camera/world offset (update when you add a camera)
        const camX = this.#camera.x,
            camY = this.#camera.y;

        // Align to world grid
        const offX = -(camX % tsX);
        const offY = -(camY % tsY);

        ctx.save();
        ctx.translate(offX | 0, offY | 0); // integer translate keeps 0.5 lines crisp
        ctx.fillStyle = this.#gridPattern;

        // Bleed 1 tile so seams never show at edges
        ctx.fillRect(-tsX, -tsY, w + tsX * 2, h + tsY * 2);

        // DEBUG ONE-FRAME OUTLINE: uncomment to verify we are drawing
        ctx.strokeStyle = 'magenta';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, 64, 64);
        ctx.restore();

        // ===== Optional: major lines and sparse labels =====
        const majorEvery = this.#gridMajorEvery | 0;
        if (majorEvery > 0) {
            const startCol = Math.floor(camX / tsX);
            const startRow = Math.floor(camY / tsY);

            // Count how many lines we actually need on-screen (+2 for bleed)
            const cols = Math.ceil((w - offX) / tsX) + 2;
            const rows = Math.ceil((h - offY) / tsY) + 2;

            const major = new Path2D();
            // Vertical majors
            for (let i = 0; i <= cols; i++) {
                const col = startCol + i;
                if (col % majorEvery !== 0) continue;
                const x = Math.round(offX + i * tsX) + 0.5;
                major.moveTo(x, 0);
                major.lineTo(x, h);
            }

            // Horizontal majors
            for (let j = 0; j <= rows; j++) {
                const row = startRow + j;
                if (row % majorEvery !== 0) continue;
                const y = Math.round(offY + j * tsY) + 0.5;
                major.moveTo(0, y);
                major.lineTo(w, y);
            }

            ctx.save();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
            ctx.stroke(major);

            // Sparse labels at major intersections
            ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
            ctx.fillStyle = 'rgba(28, 16, 16, 0.87)';
            for (let i = 0; i <= cols; i += majorEvery) {
                const col = startCol + i;
                const x = Math.round(offX + i * tsX) + 4;
                for (let j = 0; j <= rows; j += majorEvery) {
                    const row = startRow + j;
                    const y = Math.round(offY + j * tsY) + 12;
                    if (x <= w && y <= h) ctx.fillText(`${col},${row}`, x, y);
                }
            }
            ctx.restore();
        }
    }

    #ensureGridPattern() {
        const tsX = this.#mapConfig.tileSize.x;
        const tsY = this.#mapConfig.tileSize.y;

        if (tsX < 1 || tsY < 1) {
            this.#gridPattern = null;
            return;
        }

        if (this.#gridPattern && this.#gridPatternTile.x === tsX && this.#gridPatternTile.y === tsY) return;

        this.#gridPattern = null;
        this.#gridPatternCanvas = null;

        const pxW = Math.max(1, Math.round(tsX));
        const pxH = Math.max(1, Math.round(tsY));

        const makeCanvas = (w, h) => {
            if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
            const c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            return c;
        };

        const off = makeCanvas(pxW, pxH);
        const octx = off.getContext('2d');
        octx.imageSmoothingEnabled = false;
        octx.clearRect(0, 0, pxW, pxH);

        // draw crisp 1px lines in device pixels (top & left only)
        octx.lineWidth = 1;
        octx.strokeStyle = 'rgba(255,255,255,0.15)';
        octx.beginPath();
        octx.moveTo(0.5, 0);
        octx.lineTo(0.5, pxH); // left edge
        octx.moveTo(0, 0.5);
        octx.lineTo(pxW, 0.5); // top edge
        octx.stroke();

        let pattern = this.gameEngine.ctx.createPattern(off, 'repeat');

        if (!pattern) {
            const dom = document.createElement('canvas');
            dom.width = pxW;
            dom.height = pxH;
            dom.getContext('2d').drawImage(off, 0, 0);
            pattern = this.gameEngine.ctx.createPattern(dom, 'repeat');
            this.#gridPatternCanvas = dom;
        } else {
            this.#gridPatternCanvas = off;
        }

        this.#gridPattern = pattern;
        this.#gridPatternTile = { x: tsX, y: tsY };
        // this.#gridPatternDPR ;
    }

    #spawnEntity(components = {}, type, gridX = 0, gridY = 0) {
        /** @type {Entity} */
        let entity = this.entityManager.addEntity(type);
        for (let [componentType, args] of Object.entries(components)) {
            entity.addComponent(createComponent(componentType, ...args), componentType);
        }

        let worldCoords = this.#gridToWorldCentered(gridX, gridY);
        entity.getComponent(ComponentTypes.CTransform).position = worldCoords;
        let scaledBBox = this.#scaleBoundingRect(entity);
        let bBox = entity.getComponent(ComponentTypes.CBoundingBox);
        bBox.position = worldCoords;
        bBox.size = scaledBBox.scaledRect;

        return entity;
    }
}

export { PlayScene };
