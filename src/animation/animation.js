import { Vector } from 'vecti';
import { GameEngine } from '../gameEngine/gameEngine';

class Animation {
    #sprite;
    #numberOfFrames = 1;
    #currentFrame = 0;
    #speed = 8; // frames between frames
    #frameSize = new Vector(1, 1);
    #animFPS = 10;

    #name = '';
    #animationConfig;

    /**
     * @type {GameEngine}
     */
    #gameEngine;
    #frameIndex = 0;

    /**
     * Constructs a new Animation with the given name and animation config
     * @param {string} name - the name of the animation
     * @param {Object} animationConfig - an object containing the configuration for the animation
     */
    constructor(name, animationConfig, gameEngine) {
        // console.log('from Animation', animationConfig);
        this.#gameEngine = gameEngine;
        this.#name = name;
        this.#animationConfig = animationConfig;
        this.#animFPS = animationConfig.frameRate;
        this.#numberOfFrames = animationConfig.frames.length;
        this.#speed = animationConfig.speed;
    }

    // 60ps / 10ps = 6ps

    update(dt) {
        // TODO: switch the animations
        this.#currentFrame++;

        this.#frameIndex = (this.#currentFrame / this.#speed) % this.#numberOfFrames;

        this.#frameIndex = Math.floor(this.#frameIndex);

        // console.log(this.#currentFrame, this.#numberOfFrames, this.#currentFrame, this.#speed);

        // console.log(frameIndex, this.#animationConfig.frames[frameIndex].frame);

        // this.#gameEngine.drawLine(
        //     new Vector(0, 0),
        //     new Vector(this.#gameEngine.getWidth(), this.#gameEngine.getHeight())
        // );
    }

    /**
     * Render the current frame of the animation at the given position and scale.
     *
     * @param {Vector} position - the position at which to render the animation
     * @param {Vector} scale - the scale at which to render the animation
     */
    renderAnimation(position, scale) {
        // console.log(this.#animationConfig);
        let frameData = this.#gameEngine.getSpriteData(
            this.#animationConfig.sheetId,
            this.#animationConfig.frames[this.#frameIndex].frame
        );

        console.log(this.#animationConfig);
        let framePos = new Vector(frameData.x, frameData.y);

        // let sprite = this.#gameEngine
        //     .getAssets()
        //     .spriteSheets.get(this.#animationConfig.sheetId)
        //     .frameMap.get(this.#animationConfig.frames[this.#frameIndex].frame);
    }

    getCurrentFrame() {
        return {
            frame: this.#animationConfig.frames[this.#frameIndex].frame,
            sheetId: this.#animationConfig.sheetId,
        };
    }

    hasEnded() {
        // TODO: detect when the animation has ended (last frame was played)
    }

    getName() {
        return this.#name;
    }

    getSprite() {
        return this.#sprite;
    }
}

export { Animation };
