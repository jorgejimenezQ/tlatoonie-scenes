import { Vector } from 'vecti';
import { Interpolations, ComponentTypes } from '../utils/enums';

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

    /**
     * Constructor for SpriteDimensions.
     * @param {Vector} rectangle - The sprite's initial size.
     */
    constructor(dimensions) {
        super();
        this.dimensions = dimensions;
    }
}

class Transform extends Component {
    position = new Vector(0.0, 0.0);
    prevPos = new Vector(0.0, 0.0);
    velocity = new Vector(0.0, 0.0);
    scale = new Vector(1.0, 1.0);
    angle = 0.0;

    /**
     * Constructor for Transform.
     * @param {Vector} position - The initial position of the component.
     * @param {Vector} velocity - The initial velocity of the component.
     * @param {Vector} scale - The initial scale of the component.
     * @param {number} angle - The initial angle of the component.
     */
    constructor(position, velocity, scale, angle) {
        super();

        this.position = position;
        this.velocity = velocity;
        this.scale = scale;
        this.angle = angle;
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
    shoot = false;
    canShoot = false;
    canJump = false;
}

class BoundingBox extends Component {
    rectangle = new Vector(0, 0);
    halfSize = new Vector(0, 0);
    offset = new Vector(0, 0);

    constructor(rectangle, offset) {
        super();
        this.rectangle = rectangle;
        this.halfSize = this.rectangle.divide(2);
        this.offset = offset;
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

    constructor(gravity) {
        super();

        this.gravity = gravity;
    }
}

class State extends Component {
    current = 'null';
    previous = 'null';
    changeAnimation = false;

    constructor(state) {
        super();
        this.current = state;
        this.previous = state;
    }
}

class Sprite extends Component {
    atlasKey = '';
    constructor(atlasKey) {
        super();
        this.atlasKey = atlasKey;
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
            return new Input(...args);
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
    }
};

export {
    Transform,
    Lifespan,
    Input,
    BoundingBox,
    Animation,
    Gravity,
    State,
    Interpolation,
    createComponent,
    SpriteDimensions,
};
