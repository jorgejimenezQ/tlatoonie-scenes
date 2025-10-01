import { Scene } from './scene';
import { Vector } from 'vecti';
import { EntityManager, Entity } from '../entityManager/entityManger';
import {
    ActionEnums,
    ActionKeys,
    ActionTypes,
    ComponentTypes,
    CustomEvents,
    EntityTypes,
    PlayerStates,
    ScalePolicies,
} from '../utils/enums';
import { createComponent } from '../components/components';
import { Animation } from '../animation/animation';
import { getScaledSpriteSize } from '../utils/sprite';
import playerStateCallbacks from '../playerStates';

/**
 * TODO: Refactor entity configs out into JSON files
 *
 * GOAL
 * - Move hardcoded entity setup (player, tiles, NPCs, etc.) into data-driven JSON.
 * - Keep code generic: read JSON → build components → spawn entities.
 *
 * FILE LAYOUT (proposed)
 * - /assets/config.json                      → root index (lists packs/files, version)
 * - /assets/entities/player.json             → a single entity archetype
 * - /assets/entities/tile.json               → tile archetype(s)
 * - /assets/entities/*.json                  → other archetypes
 * - /assets/animations/*.json                → animation clips (or inside entity)
 * - /assets/spritesheets/*.json              → atlas metadata (if not already)
 *
 * JSON SCHEMA (entity) – v1
 * {
 *   "version": 1,
 *   "entityType": "PLAYER",                // maps to EntityTypes.*
 *   "tag": "PLAYER",
 *   "spawn": { "grid": [1,1] },            // or "world": [x,y]
 *   "components": {
 *     "CTransform": {
 *       "position": { "x": 0, "y": 0 },   // CENTER in world space (source of truth)
 *       "velocity": { "x": 5, "y": 3 },
 *       "scale":    { "x": 1, "y": 1 },
 *       "angle": 0
 *     },
 *     "CSprite": {
 *       "sheetId": "knight",               // must exist in assets.spriteSheets
 *       "frame":   "idle_000"
 *     },
 *     "CSpriteDimensions": {
 *       "logical": { "x": 64, "y": 64 },   // original (incl. padding)
 *       "trimmed": { "x": 16, "y": 16 }    // opaque area; optional, infer from atlas if missing
 *     },
 *     "CBoundingBox": {
 *       "rectangle": { "x": 15, "y": 34 }, // unscaled logical bbox
 *       "offset":    { "x": 0,  "y": 0 }   // logical units; scaled at runtime
 *     },
 *     "CAnimation": {
 *       "clip": "idle",                    // default clip name
 *       "clips": ["idle","walk","jump"],   // optional preloaded pool for this entity
 *       "fps": 12,                         // default if clip lacks fps
 *       "loop": true
 *     },
 *     "CInput": {},
 *     "CState": { "current": "IDLE" },
 *     "CPhysics": {
 *       "horizontalSpeed": 5,
 *       "jumpSpeed": 15,
 *       "maxSpeed": 20,
 *       "gravity": 1
 *     }
 *   }
 * }
 *
 */

//Player *1 1 64 64* 5 15 20 1 Buster
/**
 * Play_Scene
 *
 * @description Scene for playing the game
 *
 *
 */
class Play_Scene extends Scene {
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

    //TODO: refactor configs out into json files (entity)
    #playerConfig = {
        gridPos: new Vector(1, 1),
        boundingBox: new Vector(15, 34),
        boundingBoxOffset: new Vector(0, 0),
        horizontalSpeed: 200,
        verticalSpeed: 200,
        jumpSpeed: 15,
        maxSpeed: 20,
        gravity: 1,
        spriteRectangle: new Vector(16, 16),
        animation: PlayerStates.IDLE,
        sprite: 'knight',
        initialPosition: new Vector(0, 0),
        initialVelocity: new Vector(5, 3),
        size: new Vector(64, 64),
        initialScale: new Vector(26, 34),
    };

    #entityConfig = {
        [EntityTypes.PLAYER]: this.#playerConfig,
        [EntityTypes.TILE]: {
            gridPos: new Vector(1, 1),
            boundingBox: null,
            boundingBoxOffset: new Vector(0, 0),
            horizontalSpeed: null,
            jumpSpeed: 15,
            maxSpeed: 20,
            gravity: 1,
            // spriteRectangle: new Vector(16, 16),
            // animation: 'jump',
            // sprite: 'knight',
            // initialPosition: new Vector(0, 0),
            // initialVelocity: new Vector(5, 3),
            // size: new Vector(64, 64),
            // initialScale: new Vector(26, 34),
        },
    };

    #actionsQueue = [];

    #playerAnimationMap = new Map();

    #simTime = 0;

    #mapConfig = {
        tileSize: new Vector(64, 64),
        numTiles: 0,
    };

    #player = new Entity();
    #drawTextures = true;
    #drawCollisions = true;
    #drawGrid = true;
    #drawHoverTile = true;
    #gridText;
    #gridTiles = new Map();
    #pointerX = null;
    #pointerY = null;
    #camera = new Vector(0, 0);
    #fallingThreshold = 1; // in seconds

    drawTexture = true;

    #gridPattern = null; // CanvasPattern
    #gridPatternCanvas = null; // OffscreenCanvas | HTMLCanvasElement (debug/cleanup)
    #gridPatternTile = { x: 0, y: 0 }; // the tile size used to build the pattern
    #gridPatternDPR = 0; // so we can rebuild when DPR changes
    #gridMajorEvery = 1; // draw a stronger line every N cells

    constructor(gameEngine) {
        super(gameEngine);

        this.registerAction(ActionKeys.p, ActionEnums.PAUSE);
        this.registerAction(ActionKeys.escape, ActionEnums.QUIT);
        this.registerAction(ActionKeys.num_0, ActionEnums.TOGGLE_TEXTURE);
        this.registerAction(ActionKeys.num_1, ActionEnums.TOGGLE_COLLISION);
        this.registerAction(ActionKeys.num_2, ActionEnums.TOGGLE_GRID);
        this.registerAction(ActionKeys.space, ActionEnums.JUMP);
        this.registerAction(ActionKeys.a, ActionEnums.LEFT);
        this.registerAction(ActionKeys.d, ActionEnums.RIGHT);
        this.registerAction(ActionKeys.s, ActionEnums.DOWN);
        this.registerAction(ActionKeys.w, ActionEnums.UP);
        this.registerAction(ActionKeys.pointerDown, ActionEnums.CLICK);
        this.registerAction(ActionKeys.pointerMove, ActionEnums.POINTER_POSITION);

        this.#mapConfig.numTiles = new Vector(
            this.gameEngine.logicalWidth / this.#mapConfig.tileSize.x,
            this.gameEngine.logicalHeight / this.#mapConfig.tileSize.y
        );

        // create a ready animation for each
        console.log('create an animation pool for the player to re-use');
        for (let anim of gameEngine.getAnimations().keys()) {
            this.#playerAnimationMap.set(anim, new Animation(anim, gameEngine.getAnimation(anim), gameEngine));
        }

        console.log(this.#playerAnimationMap);
        this.#loadLevel();
    }

    #loadLevel() {
        this.entityManager = new EntityManager();
        // TODO: Use configuration files to create the components and entities

        // sprite dimensions
        let spriteDimensions = this.gameEngine.getSpriteDimensions(this.#playerConfig.sprite);
        let trimmedRect = this.gameEngine.getSpriteTrimmedRect(this.#playerConfig.sprite);

        // initial transformations
        let pos = this.#playerConfig.initialPosition;
        let vel = new Vector(0, 0);
        let scale = new Vector(
            this.#playerConfig.size.x / trimmedRect.width,
            this.#playerConfig.size.y / trimmedRect.height
        );
        let angle = 0;
        let hSpeed = this.#playerConfig.horizontalSpeed;
        let vSpeed = this.#playerConfig.verticalSpeed;

        // animation
        let animFrame = this.#playerStateToAnimation(this.#playerConfig.animation);
        const animation = this.#playerAnimationMap.get(animFrame);
        console.log('The initial animation', animation);

        this.#player = this.#spawnEntity(
            {
                [ComponentTypes.CAnimation]: [animation, false],
                [ComponentTypes.CSpriteDimensions]: [
                    new Vector(spriteDimensions.w, spriteDimensions.h),
                    new Vector(trimmedRect.width, trimmedRect.height),
                ],
                [ComponentTypes.CTransform]: [pos, vel, scale, angle, hSpeed, vSpeed],
                [ComponentTypes.CBoundingBox]: [
                    new Vector(trimmedRect.width, trimmedRect.height),
                    this.#playerConfig.boundingBoxOffset,
                ],
                [ComponentTypes.CInput]: [],
                [ComponentTypes.CState]: [PlayerStates.IDLE],
            },
            'PLAYER',
            0,
            0
        );

        console.log('player ', this.#player);
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
        let ctr = entity.getComponent(ComponentTypes.CTransform);
        // Reset the current velocity and set based on the entity's current state
        ctr.position = ctr.position.add(ctr.velocity.multiply(dt));
    }
    #sLifespan(entity) {}
    #sAnimation(entity) {
        // TODO: handle non repeating animations and state changes
        const cst = entity.getComponent(ComponentTypes.CState);
        const ctr = entity.getComponent(ComponentTypes.CTransform);
        const ca = entity.getComponent(ComponentTypes.CAnimation);
        let animFrame;
        animFrame = this.#playerStateToAnimation(cst.current);
        if (ca.animation.name !== animFrame) {
            ca.animation = this.#playerAnimationMap.get(animFrame);
            ca.animation.reset();
        }
    }

    fixedUpdate(dt) {
        if (this.paused) return;
        this.#simTime += dt;

        for (let entity of this.entityManager.getAllEntities()) {
            this.#sMovement(entity, dt);
            if (entity.getComponent(ComponentTypes.CAnimation)) this.#sAnimation(entity);
            this.sActions();

            // update the position of the bounding box
            entity.getComponent(ComponentTypes.CBoundingBox).position = entity.getComponent(
                ComponentTypes.CTransform
            ).position;
        }

        let changed = this.entityManager.update();
        if (changed)
            this.gameEngine.dispatchEvent(
                new CustomEvent(CustomEvents.ENTITIES.UPDATED, {
                    detail: {
                        count: this.entityManager.getAllEntities().length,
                        entities: this.entityManager.getAllEntities(),
                    },
                })
            );
    }

    onFrameEnd(elapsedTime, numUpdateSteps) {
        for (let entity of this.entityManager.getAllEntities()) {
            if (entity.getComponent(ComponentTypes.CAnimation))
                entity.getComponent(ComponentTypes.CAnimation).animation.update(elapsedTime);
        }
    }

    async sRender(alpha) {
        if (this.paused) return;

        if (this.#drawGrid) this.#renderGridPattern(this.gameEngine.ctx);

        for (let entity of this.entityManager.getAllEntities()) {
            let transform = entity.getComponent(ComponentTypes.CTransform);
            let bBox = entity.getComponent(ComponentTypes.CBoundingBox);

            // show the bounding box

            // show the sprite
            if (this.drawTexture && entity.getComponent(ComponentTypes.CAnimation)) {
                let { sheetId, frame } = entity.getComponent(ComponentTypes.CAnimation).animation.getCurrentFrame();
                if (!transform.scale) {
                    transform.scale = new Vector(1, 1);
                }

                await this.gameEngine.drawSprite(sheetId, frame, transform.position, transform.scale);
            } else if (this.drawTexture) {
                let cSprite = entity.getComponent(ComponentTypes.CSprite);
                if (!transform.scale) {
                    transform.scale = new Vector(1, 1);
                }
                await this.gameEngine.drawSprite(cSprite.sheetId, cSprite.frame, transform.position, transform.scale);
            }

            // show the center of the bounding box
            if (this.#drawCollisions) {
                this.gameEngine.drawRect(this.#centerToTopLeft(bBox), bBox.size, 'rgba(205, 29, 41, 1)');
                this.gameEngine.drawCircleFilled(bBox.position, 2, 'rgba(89, 255, 252, 1)');
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
    }

    sCollision(entity) {
        let bBox = entity.getComponent(ComponentTypes.CBoundingBox);

        for (let other of this.entityManager.getAllEntities()) {
            this.#isOverlapping(entity, other);
        }
    }

    sActions() {
        // The player's current state
        let cState = this.#player.getComponent(ComponentTypes.CState);
        let state_ = playerStateCallbacks.get(cState.current);

        let action = this.actionsDequeue();
        while (action) {
            state_ = playerStateCallbacks.get(cState.current);
            state_.handleAction(this.#player, action);
            action = this.actionsDequeue();
        }
    }

    /**
     * Processes an immediate action.
     * Immediate actions are processed immediately, and are not queued.
     * This function is used to process actions that are not related to the player's state, such as mouse movements.
     *
     * @param {Action} action - The action to process.
     */
    sDoActionImm(action) {
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
                console.log(coords, { x: this.#pointerX, y: this.#pointerY });
                break;
            default:
                break;
        }
    }

    sApplyGravity() {}

    onEnd() {
        console.log('end');
    }
    changePlayerStateTo(state) {}

    setPaused(isPaused) {
        console.log('setPaused', isPaused);
        this.paused = isPaused;
    }

    /**
     * Spawns an entity with no animation at the given grid coordinates with the given components.
     * @param {Component[]} components - A map of component type to component arguments.
     * @param {string} type - The type of entity to spawn.
     * @param {number} gridX - The x coordinate in the grid.
     * @param {number} gridY - The y coordinate in the grid.
     */
    placeSpriteEntityGrid(type, x = 0, y = 0, sheetId, frame) {
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
        };
        this.#spawnEntity(components, type, gridPos.x, gridPos.y);
    }

    /**
     * Adds an action to the end of the action queue.
     * @param {Action} action - The action to add to the queue.
     */
    actionEnqueue(action) {
        this.#actionsQueue.push(action);
    }

    /**
     * Removes and returns the first action from the action queue.
     * If the queue is empty, returns null.
     * @returns {Action|null} The first action from the queue, or null if the queue is empty.
     */
    actionsDequeue() {
        let action = this.#actionsQueue.shift();
        if (action) return action;
        return null;
    }

    /****************************************************************************
     * HELPER FUNCTIONS
     ***************************************************************************/

    #isOverlapping() {}
    /**
     *
     * @param {number} gridX the x coordinate in the grid
     * @param {number} gridY the y coordinate in the grid
     * @returns
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
        return new Vector(worldX + this.#mapConfig.tileSize.x / 2, worldY + this.#mapConfig.tileSize.x / 2);
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
        let transform = entity.getComponent(ComponentTypes.CTransform);
        // / Get the bounding box
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

        // If supported, neutralize DPR so each cell is tsX×tsY in user space
        // if (pattern && 'setTransform' in pattern) {
        //     const m = new DOMMatrix();
        //     m.a = 1 ; // scaleX
        //     m.d = 1 ; // scaleY
        //     pattern.setTransform(m);
        // }

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
        console.log('spawn entity');
        console.log(components);
        // console.log(entity);
        return entity;
    }

    #playerStateToAnimation(stateEnum) {
        switch (stateEnum) {
            case PlayerStates.WALKING.RIGHT:
                return 'walk';
            case PlayerStates.WALKING.LEFT:
                return 'walk';
            case PlayerStates.JUMPING:
                return 'jump';
            case PlayerStates.ATTACKING.ONE:
                return 'attack_1';
            case PlayerStates.ATTACKING.TWO:
                return 'attack_2';
            case PlayerStates.IDLE:
                return 'idle';
        }
    }
}

export { Play_Scene };
