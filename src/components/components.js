import { Vector } from 'vecti';
import { Interpolations, ComponentTypes, EntityFlags, EntityAttacks, EntityStates } from '../utils/enums';
import { Animation } from '../animation/animation';
import { Attack } from '../attack/Attack';
import { Entity } from '../entityManager/entityManager';

/**
 * @typedef {Object} TypeStateCallback
 * @property {function} entry - A function called when we set the state.
 * @property {function} exit - A function called when we change the state.
 */

class Component {
    exists = false;
    constructor() {
        // console.log(this);
        this.exists = true;
    }
}

class Interpolation extends Component {
    type = Interpolations.EASEIN_SINE;
    constructor(interpolation) {
        super();
        this.type = interpolation;
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

/**
 * Transform component. Represents the position, velocity, acceleration, and scale of an entity.
 */
class Transform extends Component {
    /**
     * The current position of the entity.
     * @type {Vector}
     */
    position_ = new Vector(0.0, 0.0);

    /**
     * The current velocity of the entity.
     * @type {Vector}
     */
    velocity = new Vector(0.0, 0.0);

    /**
     * The current acceleration of the entity.
     * @type {Vector}
     */
    acceleration = new Vector(0.0, 0.0);

    /**
     * The previous position of the entity.
     * @type {Vector}
     */
    prevPos_ = new Vector(0.0, 0.0);

    /**
     * The scale of the entity.
     * @type {Vector}
     */
    scale = new Vector(1.0, 1.0);

    /**
     * The angle of the entity in radians.
     * @type {number}
     */
    angle = 0.0;

    /**
     * The horizontal speed of the entity.
     * @type {number}
     */
    hSpeed = 0;

    /**
     * The vertical speed of the entity.
     * @type {number}
     */
    vSpeed = 0;

    /**
     * Constructor for Transform.
     * @param {Vector} position - The initial position of the component.
     * @param {Vector} velocity - The initial velocity of the component.
     * @param {Vector} scale - The initial scale of the component.
     * @param {number} angle - The initial angle of the component.
     * @param {number} hSpeed - The initial horizontal speed of the component.
     * @param {number} vSpeed - The initial vertical speed of the component.
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

    /**
     * Gets the current position of the entity.
     * @return {Vector} The current position of the entity.
     */
    get position() {
        return this.position_;
    }

    /**
     * Gets the previous position of the entity.
     * @return {Vector} The previous position of the entity.
     */
    get prevPos() {
        return this.prevPos_;
    }

    /**
     * Sets the current position of the entity.
     * @param {Vector} position - The new position of the entity.
     */
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

class Attacks extends Component {
    /**
     * @type {EntityAttacks}
     */
    selected;
    /**
     * @type {Attack}
     */
    #attacksMap = new Map();

    /**
     *
     * @param {EntityAttacks} initial An initial array of attacks of size greater than.
     */
    constructor(attacks) {
        super();
        attacks.forEach((atk) => this.addAttack(atk));
        this.selected = attacks[0];
        log('was added here');
    }

    /**
     *
     * @param {Attack} attack The attack that we are adding to this entity.
     */
    addAttack(attack) {
        this.#attacksMap.set(attack.name, attack);
    }

    /**
     *
     * @returns {Attack} The currently selected attack.
     */
    getSelectedAttack() {
        return this.#attacksMap.get(this.selected);
    }

    /**
     *
     * @param {EntityAttacks} attack
     * @returns
     */
    setAttack(attack) {
        if (this.#attacksMap.has(attack)) {
            return undefined;
        }

        return this.#attacksMap.get(attack);
    }
}

/**
 * ! TODO: unused
 * */
class Input extends Component {
    up = false;
    down = false;
    left = false;
    right = false;
    attack = false;
    isStart = false;
    isEnd = false;
}

class Flags extends Component {
    /** @type {number} - The current mask value. */
    mask;

    /**
     * Constructor for CFlags.
     * @param {number} [mask=0] - The initial mask value.
     */
    constructor(mask = 0) {
        super();
        this.mask = mask;
    }

    /**
     * Adds a flag to the current mask.
     * @param {EntityFlags} flag - The flag to add.
     * @returns {Flags} - This object.
     */
    add(flag) {
        this.mask |= flag;
        return this;
    }

    /**
     * Removes a flag from the current mask.
     * @param {EntityFlags} flag - The flag to remove.
     * @returns {Flags} - This object.
     */
    remove(flag) {
        this.mask &= ~flag;
        return this;
    }

    /**
     * Toggles a flag in the current mask.
     * If the flag is present in the mask, it will be removed. If it is not present, it will be added.
     * @param {EntityFlags} flag - The flag to toggle.
     * @returns {Flags} - This object.
     */
    toggle(flag) {
        this.mask ^= flag;
        return this;
    }

    /**
     * Checks if a flag is present in the current mask.
     * @param {EntityFlags} flag - The flag to check.
     * @returns {boolean} - True if the flag is present, false otherwise.
     */
    has(flag) {
        return (this.mask & flag) !== 0;
    }

    /**
     * Checks if a flag is present in the current mask.
     * @param {EntityFlags} flag - The flag to check.
     * @returns {boolean} - True if the flag is present, false otherwise.
     */
    static hasFlag(flag, mask) {
        return (mask & flag) !== 0;
    }
}

class Traits extends Component {
    /**
     * Constructs a new Traits object.
     * @param {Array<string>} [initial=[]] - The initial traits to add to the set.
     */
    constructor(initial = []) {
        super();
        this.set = new Set(initial);
    }

    /**
     * Adds a trait to the set.
     * @param {string} t - The trait to add.
     * @returns {Traits} - This object.
     */
    add(t) {
        this.set.add(t);
        return this;
    }

    /**
     * Removes a trait from the set.
     * @param {string} t - The trait to remove.
     * @returns {Traits} - This object.
     */
    remove(t) {
        this.set.delete(t);
        return this;
    }

    /**
     * Checks if the given trait is present in the set.
     * @param {string} t - The trait to check.
     * @returns {boolean} - True if the trait is present, false otherwise.
     */
    has(t) {
        return this.set.has(t);
    }

    /**
     * Returns a JSON representation of the Traits object.
     *
     * @returns {Array<string>} - An array of strings, each representing a trait in the set.
     */
    toJSON() {
        return [...this.set];
    }
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

    /**
     *
     * @param {Vector} rectangle The rectangle dimensions of the bounding box
     * @param {Vector} offset The offset of the bounding box with respect to the sprite's center
     */
    constructor(rectangle, offset) {
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

class AnimationStackEntry {
    /** @type {EntityStates} */
    resumeState = null;
    /** @type {Animation} */
    animation;

    /**
     *
     * @param {Animation} animation The animation clip
     * @param {EntityStates} resumeState Metadata used to set state after a non-looping animation ends.
     */
    constructor(animation, resumeState = null) {
        this.animation = animation;
        this.resumeState = resumeState;

        if (!animation.repeats && resumeState == null)
            throw new Error('non looping animations should include a resume state.');
    }
}

class AnimationContainer extends Component {
    /** @type {AnimationStackEntry[]} */
    animationStack = new Array();
    animationPool = new Map();

    /**
     *
     * @param {Animation} animation
     * @param {boolean} repeat
     */
    constructor() {
        super();
    }

    /**
     *
     * @param {Animation} animation The next animation we want to play.
     * @returns {Animation}
     */
    pushAnimation(animation, resumeState = null) {
        animation.reset();
        this.animationStack.push(new AnimationStackEntry(animation, resumeState));
        return animation;
    }

    /**
     *
     * @returns {Animation} The animation at the top of the stack.
     */
    popAnimation() {
        return this.animationStack.pop();
    }

    peekEntry() {
        return this.animationStack[this.animationStack.length - 1];
    }

    /**
     * Returns, without removing, the animation currently at the top of the animation stack.
     *
     * If the stack is empty this returns undefined.
     *
     * @returns {Animation|undefined} The animation at the top of the stack, or undefined if the stack is empty.
     */
    peekAnimation() {
        return this.animationStack[this.animationStack.length - 1].animation ?? null;
    }
}

class Actions extends Component {
    actionsQueue = [];
    constructor() {
        super();
    }

    /**
     * Adds an action to the end of the action queue.
     * @param {Action} action - The action to add to the queue.
     */
    enqueue(action) {
        this.actionsQueue.push(action);
    }

    /**
     * Removes and returns the first action from the action queue.
     * If the queue is empty, returns null.
     * @returns {Action|null} The first action from the queue, or null if the queue is empty.
     */
    dequeue() {
        let action = this.actionsQueue.shift();
        if (action) return action;
        return null;
    }

    /**
     *
     * @returns {boolean} True if the queue is empty.
     */
    isEmpty() {
        return this.actionsQueue.length == 0;
    }
}

class Gravity extends Component {
    /** @type {Vector} */
    gravity = null;
    isGrounded = false;

    // This variable holds the amount of time the player has been in the air in milliseconds
    timeInAir = 0;

    timeBeforeFalling = 0;

    /**
     *
     * @param {Vector} gravity
     */
    constructor(gravity) {
        super();

        this.gravity = gravity;
    }
}

class State extends Component {
    /**
     * The current state of the player
     *
     * @type {EntityStates}
     *
     */
    #current_ = 'null';
    /**
     * The current state of the player
     *
     * @type {EntityStates}
     *
     */
    previous_ = 'null';
    /**
     * A map storing the callbacks for the state machine
     * @type {Map<EntityStates, TypeStateCallback>}
     */
    stateCallbackMap = new Map();
    /**
     * Maps a state to an animation.
     * @type {function}
     */
    stateToAnimation = null;
    /**
     * @type {TypeStateCallback} A state callback for no operations.
     */
    nop = {
        entry: (e) => {},
        exit: (e) => {},
        handleAction: (e, action) => {},
        update: (entity) => {},
    };

    constructor(state, stateToAnimationCallback) {
        super();
        this.#current_ = state;
        this.previous_ = state;

        if (stateToAnimationCallback) this.stateToAnimation = stateToAnimationCallback;
    }

    /**
     * Set the current state of the player.
     * This will also set the previous state to the current state.
     * @param {EntityStates} state - The new state of the player.
     */
    set current(state) {
        this.previous_ = this.#current_;
        this.#current_ = state;
    }

    get current() {
        return this.#current_;
    }

    get previous() {
        return this.previous_;
    }

    /**
     *
     * @param {EntityStates} state The state we are setting.
     * @param {TypeStateCallback} callback
     */
    registerState(state, callback) {
        this.stateCallbackMap.set(state, callback);
    }

    /**
     *
     * @param {Entity} entity The entity we are working with.
     * @param {EntityStates} next The state we are changing to.
     * @returns
     */
    setState(entity, next) {
        const cState = entity.getComponent(ComponentTypes.CState);
        if (!cState || cState.current === next) return;
        const from = this.stateCallbackMap.get(cState.current);
        const to = this.stateCallbackMap.get(next);

        // exit old
        from?.exit?.(entity);
        // switch
        cState.current = next;
        // enter new
        to?.entry?.(entity);
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
 * Overlap information between two entities, using center-based AABBs.
 *
 * Coordinates & sizes:
 * - Positions are **centers** in world space.
 * - `ox` / `oy` are **non-negative penetration magnitudes** along X/Y.
 * - `dx` / `dy` are **signed center deltas**: (A.position - B.position).
 * - `mtv` is the **signed minimum translation vector** to ADD to A to separate it from B,
 *   chosen along the **shallow axis** (`axis`).
 *
 * When `overlapping` is false:
 * - `ox` and `oy` are 0,
 * - `mtv` is (0, 0),
 * - `axis` is `null`.
 *
 * @typedef {Object} CollisionData
 * @property {boolean} overlapping - True if A and B overlap (i.e., `ox > 0 && oy > 0`).
 * @property {number} ox - Penetration magnitude along X (≥ 0).
 * @property {number} oy - Penetration magnitude along Y (≥ 0).
 * @property {number} dx - Signed center delta X: `A.x - B.x`.
 * @property {number} dy - Signed center delta Y: `A.y - B.y`.
 * @property {'x'|'y'|null} axis - Shallow axis of penetration; `'x'`, `'y'`, or `null` if not overlapping.
 * @property {Vector} mtv - Signed vector to add to **A** to minimally separate from **B`.
 * @property {Entity} other - The other entity that was used in the collision test.
 */

class Collision extends Component {
    /** @type {CollisionData} */
    prevOverlap = {};

    constructor() {
        super();
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
        case ComponentTypes.CActions:
            return new Actions(...args);
        case ComponentTypes.CAttacks:
            return new Attacks(...args);
        case ComponentTypes.CAnimation:
            return new AnimationContainer(...args);
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
        case ComponentTypes.CFlags:
            return new Flags(...args);
        case ComponentTypes.CTraits:
            return new Traits(...args);
        case ComponentTypes.CCollision:
            return new Collision(...args);
    }
};

export {
    createComponent,
    Actions,
    Attacks,
    AnimationContainer,
    AnimationStackEntry,
    BoundingBox,
    Gravity,
    Input,
    Interpolation,
    Lifespan,
    State,
    Transform,
    SpriteDimensions,
    Sprite,
    Flags,
    Traits,
    Collision,
    Component,
};
