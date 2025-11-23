/**
 * Enum for component types.
 * @enum {string}
 * @readonly
 */
const ComponentTypes = Object.freeze({
    CActions: 'COMPONENT_TYPE_ACTIONS',
    CAnimation: 'COMPONENT_TYPE_ANIMATION',
    CAttacks: 'COMPONENT_TYPE_ATTACK',
    CBoundingBox: 'COMPONENT_TYPE_BOUNDING_BOX',
    CGravity: 'COMPONENT_TYPE_GRAVITY',
    CInput: 'COMPONENT_TYPE_INPUT',
    CInterpolation: 'COMPONENT_TYPE_INTERPOLATION',
    CLifespan: 'COMPONENT_TYPE_LIFESPAN',
    CScore: 'COMPONENT_TYPE_SCORE',
    CShape: 'COMPONENT_TYPE_SHAPE',
    CState: 'COMPONENT_TYPE_STATE',
    CTransform: 'COMPONENT_TYPE_TRANSFORM',
    CSpriteDimensions: 'COMPONENT_TYPE_SPRITE_DIMENSIONS',
    /** @description The sprite component */
    CSprite: 'COMPONENT_TYPE_SPRITE',
    /** @description Used to store entity flags @see {EntityFlags}  */
    CFlags: 'COMPONENT_TYPE_FLAGS',
    CTraits: 'COMPONENT_TYPE_TRAITS',
    CCollision: 'COMPONENT_TYPE_Collision',
});

/**
 * The player can be in one or more of these state at any time
 *
 * @enum {string}
 * @see {@link }
 * @readonly
 */
const EntityStates = Object.freeze({
    JUMPING: 'ENTITY_STATE_JUMPING',
    ON_GROUND: 'ENTITY_STATE_ON_GROUND',
    WALKING_LEFT: 'ENTITY_STATE_WALKING:LEFT',
    WALKING_RIGHT: 'ENTITY_STATE_WALKING:RIGHT',
    WALKING: 'ENTITY_STATE_WALKING',
    RUNNING: 'ENTITY_STATE_RUNNING',
    HURT: 'ENTITY_STATE_HURT',
    DEFEND: 'ENTITY_STATE_DEFEND',
    FALLING: 'ENTITY_STATE_FALLING',
    TAKING_DAMAGE: 'ENTITY_STATE_TAKING_DAMAGE',
    IDLE: 'ENTITY_STATE_IDLE',
    IDLE_LEFT: 'ENTITY_STATE_IDLE_LEFT',
    IDLE_RIGHT: 'ENTITY_STATE_IDLE_RIGHT',
    ATTACKING_ONE: 'ENTITY_STATE_ATTACKING:ONE',
    ATTACKING_TWO: 'ENTITY_STATE_ATTACKING:TWO',
    ATTACKING: 'ENTITY_STATE_ATTACKING',
    TAKING_DAMAGE: 'ENTITY_STATE_TAKING_DAMAGE',
    UNCOVERED: 'ENTITY_STATE_UNCOVERED',
});

/**
 * The player attacks
 *
 * @enum {string}
 * @see {@link }
 * @readonly
 */
const EntityAttacks = Object.freeze({
    ATTACK_ONE: 'PLAYER_ATTACK_ONE',
    ATTACK_TWO: 'PLAYER_ATTACK_TWO',
});

/**
 * Available types of entities
 *
 * @enum {string}
 * @see {@link EntityManager}
 * @readonly
 */
const EntityTypes = Object.freeze({
    PLAYER: 'ENTITY_TYPE_PLAYER',
    NPC: 'ENTITY_TYPE_NPC',
    TILE: 'ENTITY_TYPE_TILE',
    GROUND: 'ENTITY_TYPE_GROUND',
    DECOR: 'ENTITY_TYPE_DECOR',
    GROUND_ANIMATED: 'ENTITY_TYPE_GROUND_ANIMATED',
});

/**
 * Scale policies
 * @enum {string}
 * @see {@link 'Sprite'}
 * @readonly
 */
const ScalePolicies = Object.freeze({
    FREE: 'SCALE_POLICIES_FREE',
    UNIFORM_X: 'SCALE_POLICIES_UNIFORM_X',
    UNIFORM_Y: 'SCALE_POLICIES_UNIFORM_Y',
    FIT: 'SCALE_POLICIES_FIT',
    COVER: 'SCALE_POLICIES_COVER',
    NONE: 'SCALE_POLICIES_NONE',
});

/**
 * Enum for interpolation types.
 * @enum {string}
 * @readonly
 */
const Interpolations = Object.freeze({
    EASEIN_EXPO: 'INTERPOLATION_EASEIN_EXPO',
    EASEIN_SINE: 'INTERPOLATION_EASEIN_SINE',
    EASEINOUT_EXPO: 'INTERPOLATION_EASEINOUT_EXPO',
    EASEINOUT_SINE: 'INTERPOLATION_EASEINOUT_SINE',
    EASEINOUT_ELASTIC: 'INTERPOLATION_EASEINOUT_ELASTIC',
    EASEIN_ELASTIC: 'INTERPOLATION_EASEIN_ELASTIC',
    EASEOUT_ELASTIC: 'INTERPOLATION_EASEOUT_ELASTIC',
    EASEOUT_SINE: 'INTERPOLATION_EASEOUT_SINE',
});

/**
 * Enum for the ui tab ids
 * @enum {string}
 * @readonly
 */
const TabsEnum = Object.freeze({
    ID: {
        SPRITES: 'TABS:ID_SPRITES',
        ENTITIES: 'TABS:ID_ENTITIES',
    },
});

/**
 * Enum for scene names.
 * @enum {string}
 * @readonly
 */
const SceneTags = Object.freeze({
    MENU: 'SCENE_NAME_MENU',
    PLAY: 'SCENE_NAME_PLAY',
    SIMPLE: 'SIMPLE',
});

/**
 * Enum for custom events.
 * @enum {string}
 * @readonly
 */
const CustomEventEnums = Object.freeze({
    GAME_STOPPED: 'CUSTOM_EVENT_GAME_STOPPED',
    GAME_RESUMED: 'CUSTOM_EVENT_GAME_RESUMED',
    GAME_ENDED: 'CUSTOM_EVENT_GAME_ENDED',
    GAME_STARTED: 'CUSTOM_EVENT_GAME_STARTED',
    MOUSE_DOWN: 'CUSTOM_EVENT_MOUSE_DOWN',
    MOUSE_UP: 'CUSTOM_EVENT_MOUSE_UP',
    KEY_DOWN: 'CUSTOM_EVENT_KEY_DOWN',
    KEY_UP: 'CUSTOM_EVENT_KEY_UP',
    ACTION_START: 'CUSTOM_EVENT_ACTION_START',
    ACTION_END: 'CUSTOM_EVENT_ACTION_END',
    POINTER_DOWN: 'CUSTOM_EVENT_POINTER_DOWN',
    POINTER_UP: 'CUSTOM_EVENT_POINTER_UP',
    POINTER_MOVE: 'CUSTOM_EVENT_POINTER_MOVE',
    WINDOW_RESIZED: 'CUSTOM_EVENT_WINDOW_RESIZED',
    SPRITE: {
        SELECT: 'CUSTOM_EVENT_SPRITE:SELECT',
        DELETE: 'CUSTOM_EVENT_SPRITE:DELETE',
        CLEAR_SELECTION: 'CUSTOM_EVENT_SPRITE:CLEAR_SELECTION',
    },
    ENTITIES: {
        UPDATED: 'CUSTOM_EVENT_ENTITIES:UPDATED',
    },
    TAB: {
        SELECTED: 'CUSTOM_EVENT_TAB:SELECTED',
    },
});

/**
 * Enum for action types.
 * @enum {string}
 * @readonly
 */
const ActionEnums = Object.freeze({
    PAUSE: 'ACTION_ENUM_PAUSE',
    QUIT: 'ACTION_ENUM_QUIT',
    TOGGLE_TEXTURE: 'ACTION_ENUM_TOGGLE_TEXTURE',
    TOGGLE_COLLISION: 'ACTION_ENUM_TOGGLE_COLLISION',
    TOGGLE_GRID: 'ACTION_ENUM_TOGGLE_GRID',
    RIGHT: 'ACTION_ENUM_RIGHT',
    LEFT: 'ACTION_ENUM_LEFT',
    UP: 'ACTION_ENUM_UP',
    DOWN: 'ACTION_ENUM_DOWN',
    CLICK: 'ACTION_ENUM_CLICK',
    PRESS: 'ACTION_ENUM_PRESS',
    RELEASE: 'ACTION_ENUM_RELEASE',
    GRAB: 'ACTION_ENUM_GRAB',
    RELEASE_GRAB: 'ACTION_ENUM_RELEASE_GRAB',
    POINTER_POSITION: 'ACTION_ENUM_POINTER_POSITION',
    JUMP: 'ACTION_ENUM_JUMP',
    FALL: 'ACTION_ENUM_FALL',
    ON_GROUND: 'ACTION_ENUM_ON_GROUND',
    ATTACK: 'ACTION_ENUM_ATTACK',
});

/**
 * Enum for entity flags.
 * @enum {number}
 * @readonly
 */
const EntityFlags = Object.freeze({
    STATIC: 1 << 0, // doesn't move (e.g., walls)
    DECORATION: 1 << 1, // visual only
    COLLIDES: 1 << 2, // participates in collision tests
    TRIGGER: 1 << 3, // overlaps but no physical response
    INTERACTIVE: 1 << 4, // can be clicked/used
    AI: 1 << 5, // has AI logic
    PLAYER: 1 << 6, // player-owned/controlled
    ENEMY: 1 << 7, // enemy faction
    ANIMATED: 1 << 8, // the entity has animation/s
    CAN_DIE: 1 << 9, // can die and be deleted from the game
    CAN_FALL: 1 << 10, // the entity can fall
    CAN_ATTACK: 1 << 11, // the entity has attacks
});

/**
 * Human readable flags/traits
 * @enum {string}
 * @readonly
 */
const EntityTraits = Object.freeze({
    STATIC: 'ENTITY_TRAIT_STATIC', // doesn't move (e.g., walls)
    DECORATION: 'ENTITY_TRAIT_DECORATION', // visual only
    COLLIDES: 'ENTITY_TRAIT_COLLIDES', // participates in collision tests
    TRIGGER: 'ENTITY_TRAIT_TRIGGER', // overlaps but no physical response
    INTERACTIVE: 'ENTITY_TRAIT_INTERACTIVE', // can be clicked/used
    AI: 'ENTITY_TRAIT_AI', // has AI logic
    PLAYER: 'ENTITY_TRAIT_PLAYER', // player-owned/controlled
    ENEMY: 'ENTITY_TRAIT_ENEMY', // enemy faction
    ANIMATED: 'ENTITY_TRAIT_ANIMATED', // has animation/s
    CAN_DIE: 'ENTITY_TRAIT_CAN_DIE', // can die and be deleted from the game
});

/**
 * Enum for action keys.
 * @enum {string}
 * @readonly
 */
const KeyCodes = Object.freeze({
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
const ActionLifeCycle = Object.freeze({
    START: 'ACTION_TYPE_START',
    END: 'ACTION_TYPE_END',
    MOUSE: 'ACTION_TYPE_MOUSE',
});

/**
 * @enum {string}
 * @readonly
 */
const ActionKeys = Object.freeze({ ...KeyCodes, MISC_MANUAL: 'MISC_MANUAL_KEY_ACTION' });

export {
    Interpolations,
    ComponentTypes,
    SceneTags,
    CustomEventEnums,
    ActionEnums,
    ActionKeys,
    KeyCodes,
    ActionLifeCycle,
    ScalePolicies,
    EntityTypes,
    EntityStates,
    EntityFlags,
    EntityTraits,
    TabsEnum,
    EntityAttacks,
};
