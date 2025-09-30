/**
 * Enum for component types.
 * @enum {string}
 * @readonly
 */
const ComponentTypes = Object.freeze({
    CAnimation: 'ANIMATION',
    CBoundingBox: 'BOUNDING-BOX',
    CCollision: 'COLLISION',
    CGravity: 'GRAVITY',
    CInput: 'INPUT',
    CInterpolation: 'INTERPOLATION',
    CLifespan: 'LIFESPAN',
    CScore: 'SCORE',
    CShape: 'SHAPE',
    CState: 'STATE',
    CTransform: 'TRANSFORM',
    CSpriteDimensions: 'SPRITE-DIMENSIONS',
    CSprite: 'SPRITE',
});

/**
 * The player can be in one or more of these state at any time
 *
 * @enum {string}
 * @see {@link }
 * @readonly
 */
const PlayerStates = Object.freeze({
    JUMPING: 'JUMPING',
    WALKING: {
        LEFT: 'WALKING:LEFT',
        RIGHT: 'WALKING:RIGHT',
    },
    RUNNING: 'RUNNING',
    FALLING: 'FALLING',
    TAKING_DAMAGE: 'TAKING_DAMAGE',
    CAN_ATTACK: 'CAN_ATTACK',
    IDLE: 'IDLE',
    ATTACKING: {
        ONE: 'ATTACKING:ONE',
        TWO: 'ATTACKING:TWO',
    },
});

/**
 * Available types of entities
 *
 * @enum {string}
 * @see {@link EntityManager}
 * @readonly
 */
const EntityTypes = Object.freeze({
    PLAYER: 'PLAYER',
    TILE: 'TILE',
    GROUND: 'GROUND',
});

/**
 * Scale policies
 * @enum {string}
 * @see {@link 'Sprite'}
 * @readonly
 */
const ScalePolicies = Object.freeze({
    FREE: 'FREE',
    UNIFORM_X: 'UNIFORM_X',
    UNIFORM_Y: 'UNIFORM_Y',
    FIT: 'FIT',
    COVER: 'COVER',
    NONE: 'NONE',
});

/**
 * Enum for interpolation types.
 * @enum {string}
 * @readonly
 */
const Interpolations = Object.freeze({
    EASEIN_EXPO: 'EASEIN_EXPO',
    EASEIN_SINE: 'EASEIN_SINE',
    EASEINOUT_EXPO: 'EASEINOUT_EXPO',
    EASEINOUT_SINE: 'EASEINOUT_SINE',
    EASEINOUT_ELASTIC: 'EASEINOUT_ELASTIC',
    EASEIN_ELASTIC: 'EASEIN_ELASTIC',
    EASEOUT_ELASTIC: 'EASEOUT_ELASTIC',
    EASEOUT_SINE: 'EASEOUT_SINE',
});

/**
 * Enum for scene names.
 * @enum {string}
 * @readonly
 */
const SceneNames = Object.freeze({
    MENU: 'MENU',
    PLAY: 'PLAY',
});

/**
 * Enum for custom events.
 * @enum {string}
 * @readonly
 */
const CustomEvents = Object.freeze({
    GAME_STOPPED: 'GAME_STOPPED',
    GAME_RESUMED: 'GAME_RESUMED',
    GAME_ENDED: 'GAME_ENDED',
    GAME_STARTED: 'GAME_STARTED',
    MOUSE_DOWN: 'MOUSE_DOWN',
    MOUSE_UP: 'MOUSE_UP',
    KEY_DOWN: 'KEY_DOWN',
    KEY_UP: 'KEY_UP',
    ACTION_START: 'ACTION_START',
    ACTION_END: 'ACTION_END',
    POINTER_DOWN: 'POINTER_DOWN',
    POINTER_UP: 'POINTER_UP',
    POINTER_MOVE: 'POINTER_MOVE',
    WINDOW_RESIZED: 'WINDOW_RESIZED',
    SPRITE: {
        SELECT: 'SPRITE:SELECT',
        DELETE: 'SPRITE:DELETE',
    },
    ENTITIES: {
        UPDATED: 'ENTITIES:UPDATED',
    },
});

/**
 * Enum for action types.
 * @enum {string}
 * @readonly
 */
const ActionEnums = Object.freeze({
    PAUSE: 'PAUSE',
    QUIT: 'QUIT',
    TOGGLE_TEXTURE: 'TOGGLE_TEXTURE',
    TOGGLE_COLLISION: 'TOGGLE_COLLISION',
    TOGGLE_GRID: 'TOGGLE_GRID',
    JUMP: 'JUMP',
    RIGHT: 'RIGHT',
    LEFT: 'LEFT',
    UP: 'UP',
    DOWN: 'DOWN',
    CLICK: 'CLICK',
    PRESS: 'PRESS',
    RELEASE: 'RELEASE',
    GRAB: 'GRAB',
    RELEASE_GRAB: 'RELEASE_GRAB',
    POINTER_POSITION: 'POINTER_POSITION',
});

/**
 * Enum for action keys.
 * @enum {string}
 * @readonly
 */
const ActionKeys = Object.freeze({
    // Letters (lowercase)
    a: 'a',
    b: 'b',
    c: 'c',
    d: 'd',
    e: 'e',
    f: 'f',
    g: 'g',
    h: 'h',
    i: 'i',
    j: 'j',
    k: 'k',
    l: 'l',
    m: 'm',
    n: 'n',
    o: 'o',
    p: 'p',
    q: 'q',
    r: 'r',
    s: 's',
    t: 't',
    u: 'u',
    v: 'v',
    w: 'w',
    x: 'x',
    y: 'y',
    z: 'z',

    // Letters (uppercase)
    A: 'A',
    B: 'B',
    C: 'C',
    D: 'D',
    E: 'E',
    F: 'F',
    G: 'G',
    H: 'H',
    I: 'I',
    J: 'J',
    K: 'K',
    L: 'L',
    M: 'M',
    N: 'N',
    O: 'O',
    P: 'P',
    Q: 'Q',
    R: 'R',
    S: 'S',
    T: 'T',
    U: 'U',
    V: 'V',
    W: 'W',
    X: 'X',
    Y: 'Y',
    Z: 'Z',

    // Digits (top row)
    num_0: '0',
    num_1: '1',
    num_2: '2',
    num_3: '3',
    num_4: '4',
    num_5: '5',
    num_6: '6',
    num_7: '7',
    num_8: '8',
    num_9: '9',

    // Arrows
    ArrowUp: 'ArrowUp',
    ArrowDown: 'ArrowDown',
    ArrowLeft: 'ArrowLeft',
    ArrowRight: 'ArrowRight',

    // Controls / modifiers
    space: 'space',
    enter: 'enter',
    escape: 'escape',
    tab: 'tab',
    backspace: 'backspace',
    shift: 'shift',
    control: 'control',
    alt: 'alt',
    meta: 'meta', // meta = Cmd on Mac, Win on Windows
    capslock: 'capslock',
    contextmenu: 'contextmenu',

    // Navigation / editing
    insert: 'insert',
    delete: 'delete',
    home: 'home',
    end: 'end',
    pageup: 'pageup',
    pagedown: 'pagedown',

    // Function keys
    F1: 'F1',
    F2: 'F2',
    F3: 'F3',
    F4: 'F4',
    F5: 'F5',
    F6: 'F6',
    F7: 'F7',
    F8: 'F8',
    F9: 'F9',
    F10: 'F10',
    F11: 'F11',
    F12: 'F12',

    // Numpad (treat as logical actions; actual KeyboardEvent.key may vary)
    numpad0: 'numpad0',
    numpad1: 'numpad1',
    numpad2: 'numpad2',
    numpad3: 'numpad3',
    numpad4: 'numpad4',
    numpad5: 'numpad5',
    numpad6: 'numpad6',
    numpad7: 'numpad7',
    numpad8: 'numpad8',
    numpad9: 'numpad9',
    numpadAdd: 'numpadAdd',
    numpadSubtract: 'numpadSubtract',
    numpadMultiply: 'numpadMultiply',
    numpadDivide: 'numpadDivide',
    numpadDecimal: 'numpadDecimal',
    numpadEnter: 'numpadEnter',

    // Common punctuation (friendly names)
    minus: 'minus',
    equal: 'equal',
    bracketLeft: 'bracketLeft',
    bracketRight: 'bracketRight',
    backslash: 'backslash',
    semicolon: 'semicolon',
    quote: 'quote',
    comma: 'comma',
    period: 'period',
    slash: 'slash',
    backquote: 'backquote',
    pointerDown: 'mouseDown',
    pointerUp: 'mouseUp',
    pointerMove: 'mouseMove',
});

/**
 * Enum for action types.
 * @enum {string}
 * @readonly
 */
const ActionTypes = Object.freeze({
    START: 'START',
    END: 'END',
    MOUSE: 'MOUSE',
});

export {
    Interpolations,
    ComponentTypes,
    SceneNames,
    CustomEvents,
    ActionEnums,
    ActionKeys,
    ActionTypes,
    ScalePolicies,
    EntityTypes,
    PlayerStates,
};
