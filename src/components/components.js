import { Vector } from 'vecti';
import { Interpolations, ComponentTypes, PlayerStates } from '../utils/enums';

class Component {
    exists = false;
    constructor() {
        // console.log(this);
        this.exists = true;
    }
}

class Interpolation extends Component {
    interpolation = Interpolations.EASEIN_SINE;
    constructor(interpolation) {
        super();
        this.interpolation = interpolation;
    }
}

class SpriteDimensions extends Component {
    dimensions = new Vector(0.0, 0.0);
    trimmedRect = new Vector(0.0, 0.0);
    /**
     * Constructor for SpriteDimensions.
     * @param {Vector} rectangle - The sprite's initial size.
     */
    constructor(dimensions, trimmedRectangle) {
        super();
        this.dimensions = dimensions;
        this.trimmedRect = trimmedRectangle;
    }
}

class Transform extends Component {
    position_ = new Vector(0.0, 0.0);
    velocity = new Vector(0.0, 0.0);
    acceleration = new Vector(0.0, 0.0);
    prevPos_ = new Vector(0.0, 0.0);
    scale = new Vector(1.0, 1.0);
    angle = 0.0;
    hSpeed = 0;
    vSpeed = 0;

    /**
     * Constructor for Transform.
     * @param {Vector} position - The initial position of the component.
     * @param {Vector} velocity - The initial velocity of the component.
     * @param {Vector} scale - The initial scale of the component.
     * @param {number} angle - The initial angle of the component.
     */
    constructor(position, velocity, scale, angle, hSpeed, vSpeed) {
        super();

        this.position_ = position;
        this.prevPos_ = position;
        this.velocity = velocity;
        this.scale = scale;
        this.angle = angle;
        this.hSpeed = hSpeed;
        this.vSpeed = vSpeed;
    }

    get position() {
        return this.position_;
    }

    get prevPos_() {
        return this.prevPos_;
    }

    set position(position) {
        this.prevPos_ = this.position_;
        this.position_ = position;
    }
}

class Lifespan extends Component {
    duration = 0.0;
    frameCreated = 0;

    constructor(duration, frame) {
        super();

        this.duration = duration;
        this.frameCreated = frame;
    }
}

class Input extends Component {
    up = false;
    down = false;
    left = false;
    right = false;
    attack = false;
    isStart = false;
    isEnd = false;
}

class BoundingBox extends Component {
    /**
     * Constructor for BoundingBox.
     * @param {Vector} rectangle - The bounding box's initial size.
     */
    rectangle = new Vector(0, 0);

    /**
     * Constructor for BoundingBox.
     * @param {Vector} rectangle - The bounding box's initial size.
     */
    halfSize = new Vector(0, 0);

    /**
     * Constructor for BoundingBox.
     * @param {Vector} rectangle - The bounding box's initial size.
     */
    offset = new Vector(0, 0);

    /**
     * Constructor for BoundingBox.
     * @param {Vector} rectangle - The bounding box's initial size.
     */
    topLeft = null;
    position = null;
    size_ = null;

    constructor(rectangle, offset, topLeft, center, size) {
        super();
        this.rectangle = rectangle;
        this.offset = offset;
        this.halfSize = this.rectangle.divide(2);
    }

    get size() {
        return this.size_ || this.rectangle;
    }

    set size(size) {
        this.rectangle = size;
        this.halfSize = size.divide(2);
        this.size_ = size;
    }
}

class Animation extends Component {
    animation;
    repeat = false;

    constructor(animation, repeat) {
        super();
        this.animation = animation;
        this.repeat = repeat;
    }
}

class Gravity extends Component {
    gravity = 0;
    fallingThreshold;
    constructor(gravity) {
        super();

        this.gravity = gravity;
    }
}

class State extends Component {
    /**
     * The current state of the player
     *
     * @type {PlayerStates}
     *
     */
    #current_ = 'null';
    previous_ = 'null';
    changeAnimation = false;
    canJump = true;

    constructor(state) {
        super();
        this.#current_ = state;
        this.previous_ = state;
    }

    /**
     * Set the current state of the player.
     * This will also set the previous state to the current state.
     * @param {PlayerStates} state - The new state of the player.
     */
    set current(state) {
        this.previous_ = this.#current_;
        this.#current_ = state;
    }

    get current() {
        return this.#current_;
    }
}

class Sprite extends Component {
    sheetId;
    frame;
    constructor(sheetId, frame) {
        super();
        this.sheetId = sheetId;
        this.frame = frame;
    }
}

/**
 * Creates a new component of the given type.
 *
 * @param {string} componentType The type of component to create. This should be one of the values from the ComponentTypes enum.
 * @param {...*} args The arguments to pass to the component's constructor.
 *
 *
 * @returns {Component} The newly created component.
 *
 * @throws {Error} If the component type is invalid.
 *
 * @example
 * const transform = createComponent(ComponentTypes.CTransform, new Vector(0, 0), new Vector(0, 0), new Vector(1, 1), 0);
 * console.log(transform);
 *
 *
 */
const createComponent = (componentType, ...args) => {
    switch (componentType) {
        case ComponentTypes.CAnimation:
            return new Animation(...args);
        case ComponentTypes.CBoundingBox:
            return new BoundingBox(...args);
        case ComponentTypes.CGravity:
            return new Gravity(...args);
        case ComponentTypes.CInput:
            return new Input();
        case ComponentTypes.CInterpolation:
            return new Interpolation(...args);
        case ComponentTypes.CLifespan:
            return new Lifespan(...args);
        case ComponentTypes.CState:
            return new State(...args);
        case ComponentTypes.CTransform:
            return new Transform(...args);
        case ComponentTypes.CSpriteDimensions:
            return new SpriteDimensions(...args);
        case ComponentTypes.CSprite:
            return new Sprite(...args);
    }
};

export { createComponent };
