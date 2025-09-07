import { Scene } from './scene';
import { Vector } from 'vecti';
import { EntityManager, Entity } from '../entityManager/entityManger';
import { ActionEnums, ActionKeys, ActionTypes, ComponentTypes } from '../utils/enums';
import { createComponent } from '../components/components';
import { Animation } from '../animation/animation';

//Player *1 1 64 64* 5 15 20 1 Buster
/**
 * Play_Scene
 *
 * @description Scene for playing the game
 *
 *
 */
class Play_Scene extends Scene {
    #playerConfig = {
        gridPos: new Vector(1, 1),
        boundingBox: new Vector(15, 34),
        boundingBoxOffset: new Vector(5, 5),
        horizontalSpeed: 5,
        jumpSpeed: 15,
        maxSpeed: 20,
        gravity: 1,
        spriteRectangle: new Vector(16, 16),
        animation: 'walk',
        sprite: 'knight',
        initialPosition: new Vector(0, 0),
        initialVelocity: new Vector(0, 0),
        initialScale: new Vector(2, 2),
    };

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

        console.log('the tile map config');
        console.log(this.#mapConfig);
        this.#mapConfig.numTiles = new Vector(
            this.gameEngine.width / this.#mapConfig.tileSize.x,
            this.gameEngine.height / this.#mapConfig.tileSize.y
        );
        // this.#gridTiles = new Array(this.#mapConfig.numTiles);

        this.#loadLevel();
    }

    #loadLevel() {
        this.entityManager = new EntityManager();

        this.#player = this.entityManager.addEntity('player');

        // animation
        // TODO: Use configuration files to create the components
        let animation = new Animation(
            this.#playerConfig.animation,
            this.gameEngine.getAnimations().get(this.#playerConfig.animation),
            this.gameEngine
        );

        // animation
        let cAnimation = createComponent(ComponentTypes.CAnimation, animation, true);
        this.#player.addComponent(cAnimation, ComponentTypes.CAnimation);

        // transform
        let pos = this.#playerConfig.initialPosition;
        let vel = this.#playerConfig.initialVelocity;
        let scale = this.#playerConfig.initialScale;
        let trans = createComponent(ComponentTypes.CTransform, pos, vel, scale);
        trans;
        let angle = 0;
        let cTransform = createComponent(ComponentTypes.CTransform, pos, vel, scale, angle);
        this.#player.addComponent(cTransform, ComponentTypes.CTransform);

        // boundingBox
        let cBoundingBox = createComponent(
            ComponentTypes.CBoundingBox,
            this.#playerConfig.boundingBox,
            this.#playerConfig.boundingBoxOffset
        );
        this.#player.addComponent(cBoundingBox, ComponentTypes.CBoundingBox);

        let cInput = createComponent(ComponentTypes.CInput);
        this.#player.addComponent(cInput, ComponentTypes.CInput);

        // sprite dimensions
        let spriteDimensions = this.gameEngine.getSpriteDimensions(this.#playerConfig.sprite);

        let cSpriteDimensions = createComponent(
            ComponentTypes.CSpriteDimensions,
            new Vector(spriteDimensions.w, spriteDimensions.h)
        );

        this.#player.addComponent(cSpriteDimensions, ComponentTypes.CSpriteDimensions);
        // this.entityManager.addEntity('player', this.#player);

        console.log('player', this.#player, this.#playerConfig);
    }

    /**
     * @returns {Map<string, Action>} - A Map of action name to Action object.
     */
    getActions() {
        return this.actionMap;
    }

    #spawnPlayer() {}
    #spawnBullet(entity) {}
    #sMovement() {}
    #sLifespan() {}
    #sCollision() {}
    #sAnimation() {}

    async sRender(alpha) {
        if (this.paused) return;

        if (this.#drawGrid) this.#renderGridPattern(this.gameEngine.ctx);

        for (let entity of this.entityManager.getAllEntities()) {
            let { sheetId, frame } = entity.getComponent(ComponentTypes.CAnimation).animation.getCurrentFrame();
            let transform = entity.getComponent(ComponentTypes.CTransform);

            if (this.#drawCollisions) {
                let bBoxRect = this.#centeredBoundingRect(entity);
                // this.gameEngine.drawRect(bBoxRect.topLeft, bBoxRect.size, 'rgba(205, 29, 41, 1)');
                this.gameEngine.drawRect(new Vector(0, 0), new Vector(192, 168), 'rgba(205, 29, 41, 1)');
            }

            if (this.drawTexture) {
                await this.gameEngine.drawSprite(sheetId, frame, transform.position, transform.scale);
            }

            if (this.#drawCollisions) {
                let bBoxRect = this.#centeredBoundingRect(entity);
                this.gameEngine.drawCircleFilled(bBoxRect.center, 2, 'rgba(89, 255, 252, 1)');
            }
        }

        if (this.#drawHoverTile && this.#pointerX && this.#pointerY) {
            let gridX, gridY;
            if (this.#pointerX > 0) {
                gridX = (this.#pointerX / this.gameEngine.width) * this.#mapConfig.numTiles.x;
            } else {
                gridX = 0;
            }
            // this.gameEngine.drawRect();
        }
    }
    /**
     * Updates the player's input according to the given action.
     * If the action is a START type, it enables the corresponding input.
     * If the action is an END type, it disables the corresponding input.
     * @param {Action} action - The action to process.
     */
    sDoAction(action) {
        let input = this.#player.getComponent(ComponentTypes.CInput);
        let isStart = action.type == ActionTypes.START;
        switch (action.name) {
            case ActionEnums.UP:
                if (input.canJump) {
                    input.up = isStart;
                }
                break;
            case ActionEnums.LEFT:
                input.left = isStart;
                break;
            case ActionEnums.RIGHT:
                input.right = isStart;
                break;
            case ActionEnums.POINTER_POSITION:
                this.#pointerX = action.payload.x;
                this.#pointerY = action.payload.y;
                break;
            case ActionEnums.CLICK:
                console.log('pointer down', action.payload);
                this.#pointerX = action.payload.x;
                this.#pointerY = action.payload.y;
                break;
            default:
                break;
        }

        // console.log(this.#player.getComponent(ComponentTypes.CInput));
    }
    #onEnd() {
        console.log('end');
    }
    #changePlayerStateTo(state) {}

    setPaused(isPaused) {
        console.log('setPaused', isPaused);
        this.paused = isPaused;
    }

    update(dt) {
        if (this.paused) return;
        this.#player.getComponent(ComponentTypes.CAnimation).animation.update();
        this.entityManager.update();
    }
    /****************************************************************************
     * HELPER FUNCTIONS
     ***************************************************************************/

    #centeredBoundingRect(entity) {
        let transform = entity.getComponent(ComponentTypes.CTransform);
        let spriteDims = entity.getComponent(ComponentTypes.CSpriteDimensions).dimensions;

        // Get the bounding box
        let cBoundingBox = entity.getComponent(ComponentTypes.CBoundingBox);
        let bBoxRect = cBoundingBox.rectangle;

        // Scale the bounding box
        bBoxRect = new Vector(bBoxRect.x * transform.scale.x, bBoxRect.y * transform.scale.y);
        let halfSize = bBoxRect.divide(2);

        // Find the center of the sprite and draw the collision box there
        let center = new Vector(
            transform.position.x - halfSize.x + (spriteDims.x * transform.scale.x) / 2,
            transform.position.y - halfSize.y + (spriteDims.y * transform.scale.y) / 2
        );

        center = center.add(cBoundingBox.offset);
        let topLeft = center;
        center = center.add(halfSize);
        return { size: bBoxRect, topLeft, center };
    }

    #renderGridPattern(ctx) {
        this.#ensureGridPattern();
        if (!this.#gridPattern) return;
        // console.log('rendering grid pattern');
        const w = Math.max(0, this.gameEngine.width | 0);
        const h = Math.max(0, this.gameEngine.height | 0);
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
        const tsX = this.#mapConfig.tileSize.x | 0;
        const tsY = this.#mapConfig.tileSize.y | 0;
        const dpr = window.devicePixelRatio || 1;

        if (tsX < 1 || tsY < 1) {
            this.#gridPattern = null;
            return;
        }

        if (
            this.#gridPattern &&
            this.#gridPatternTile.x === tsX &&
            this.#gridPatternTile.y === tsY &&
            this.#gridPatternDPR === dpr
        )
            return;

        this.#gridPattern = null;
        this.#gridPatternCanvas = null;

        const pxW = Math.max(1, Math.round(tsX * dpr));
        const pxH = Math.max(1, Math.round(tsY * dpr));

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
        if (pattern && 'setTransform' in pattern) {
            const m = new DOMMatrix();
            m.a = 1 / dpr; // scaleX
            m.d = 1 / dpr; // scaleY
            pattern.setTransform(m);
        }

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
        this.#gridPatternDPR = dpr;
    }
}

export { Play_Scene };

// drawSprite
// Object { x: 192, y: 168 }
// Object ​
// {
//   "size": {
//     "x": 30,
//     "y": 68
//   },
//   "topLeft": {
//     "x": 86,
//     "y": 55
//   },
//   "center": {
//     "x": 101,
//     "y": 89
//   }
// }
