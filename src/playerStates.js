import { ComponentTypes, PlayerStates, ActionTypes, ActionEnums } from './utils/enums';
import { Entity } from './entityManager/entityManger';

const playerStateCallbacks = new Map();
const stateSet = new Set();

const jumping = {
    update: (entity) => {},
    handleAction: (entity, action) => {
        let cState = entity.getComponent(ComponentTypes.CState);
        let isStart = action.type == ActionTypes.START;
        let ctr = entity.getComponent(ComponentTypes.CTransform);

        switch (action.name) {
            case ActionEnums.UP:
                if (isStart) return;
                console.log('up; ', ctr.vSpeed);
                ctr.velocity.y = 0;
                cState.current = PlayerStates.IDLE;
                break;
            default:
                break;
        }
    },
    entry: () => {},
    exit: () => {},
};

const idle = {
    // entry: (e) => {
    //     const t = e.getComponent(ComponentTypes.CTransform);
    //     t.velocity.x = 0;
    // },
    // exit: (e) => {
    //     const t = e.getComponent(ComponentTypes.CTransform);
    //     t.velocity.x = 0;
    // },
    handleAction: (e, action) => {
        if (action.name === ActionEnums.RIGHT && action.type === ActionTypes.START) {
            setPlayerState(e, PlayerStates.WALKING.RIGHT);
        }
        if (action.name === ActionEnums.LEFT && action.type === ActionTypes.START) {
            setPlayerState(e, PlayerStates.WALKING.LEFT);
        }
        if (action.name === ActionEnums.UP && action.type === ActionTypes.START) {
            const t = e.getComponent(ComponentTypes.CTransform);
            t.velocity.y = -t.vSpeed;
            setPlayerState(e, PlayerStates.JUMPING);
        }
    },
    update: (entity) => {},
};

const walkingRight = {
    entry: (e) => {
        const t = e.getComponent(ComponentTypes.CTransform);
        t.scale.x = Math.abs(t.scale.x);
        t.velocity.x = t.hSpeed;
    },
    exit: (e) => {
        const t = e.getComponent(ComponentTypes.CTransform);
        t.velocity.x = 0;
    },
    handleAction: (e, action) => {
        if (action.name === ActionEnums.RIGHT && action.type === ActionTypes.END) {
            setPlayerState(e, PlayerStates.IDLE);
        }
        if (action.name === ActionEnums.LEFT && action.type === ActionTypes.START) {
            setPlayerState(e, PlayerStates.WALKING.LEFT);
        }
        if (action.name === ActionEnums.UP && action.type === ActionTypes.START) {
            const t = e.getComponent(ComponentTypes.CTransform);
            t.velocity.y = -t.vSpeed;
            setPlayerState(e, PlayerStates.JUMPING);
        }
    },
    update: () => {},
};

const walkingLeft = {
    entry: (e) => {
        const t = e.getComponent(ComponentTypes.CTransform);
        t.scale.x = -1 * Math.abs(t.scale.x);
        t.velocity.x = -1 * t.hSpeed;
    },
    exit: (e) => {
        const t = e.getComponent(ComponentTypes.CTransform);
        t.velocity.x = 0;
    },
    handleAction: (e, action) => {
        if (action.name === ActionEnums.LEFT && action.type === ActionTypes.END) {
            setPlayerState(e, PlayerStates.IDLE);
        }
        if (action.name === ActionEnums.RIGHT && action.type === ActionTypes.START) {
            setPlayerState(e, PlayerStates.WALKING.RIGHT);
        }
        if (action.name === ActionEnums.UP && action.type === ActionTypes.START) {
            const t = e.getComponent(ComponentTypes.CTransform);
            t.velocity.y = -t.vSpeed;
            setPlayerState(e, PlayerStates.JUMPING);
        }
    },
    update: () => {},
};

playerStateCallbacks.set(PlayerStates.JUMPING, jumping);
playerStateCallbacks.set(PlayerStates.WALKING.RIGHT, walkingRight);
playerStateCallbacks.set(PlayerStates.WALKING.LEFT, walkingLeft);
playerStateCallbacks.set(PlayerStates.IDLE, idle);

function setPlayerState(entity, next) {
    const cState = entity.getComponent(ComponentTypes.CState);
    if (!cState || cState.current === next) return;

    const from = playerStateCallbacks.get(cState.current);
    const to = playerStateCallbacks.get(next);

    // exit old
    from?.exit?.(entity);

    // switch
    cState.current = next;

    // enter new
    to?.entry?.(entity);
}

export default playerStateCallbacks;
