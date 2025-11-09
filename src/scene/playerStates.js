import { Attack } from '../attack/Attack';
import {
    AnimationContainer as CAnimationContainerType,
    Attacks as CAttacksType,
    Gravity as CGravityType,
    State as CStateType,
    Transform as CTransformType,
} from '../components/components';
import { Entity } from '../entityManager/entityManager';
import { ActionEnums, ActionLifeCycle, ComponentTypes, EntityStates } from '../utils/enums';

/**
 * @type {import('../components/components.js').TypeStateCallback}
 */
const inAir = {
    entry: (e) => {},
    exit: (e) => {},
    /**
     *
     * @param {Entity} e
     */
    handleAction: (e, action) => {
        /** @type {CStateType} */
        const cst = e.getComponent(ComponentTypes.CState);

        if (action.name === ActionEnums.RIGHT) {
            const t = e.getComponent(ComponentTypes.CTransform);
            if (action.lifeCycle === ActionLifeCycle.END) {
                t.acceleration.x = 0;
                t.velocity.x = 0;
                return;
            }

            t.scale.x = Math.abs(t.scale.x);
        }
        if (action.name === ActionEnums.LEFT) {
            const t = e.getComponent(ComponentTypes.CTransform);
            if (action.lifeCycle === ActionLifeCycle.END) {
                t.acceleration.x = 0;
                t.velocity.x = 0;
                return;
            }

            t.scale.x = -1 * Math.abs(t.scale.x);
        }

        if (action.name === ActionEnums.ON_GROUND && action.lifeCycle === ActionLifeCycle.START) {
            // /** @type {AnimationContainer} */
            // const ca = e.getComponent(ComponentTypes.CAnimation);
            // ca.popAnimation().reset();
            cst.setState(e, EntityStates.ON_GROUND);
        }
    },
};

/**
 * @type {import('../components/components.js').TypeStateCallback}
 */
const falling = {
    entry: (e) => {
        /** @type {CTransformType} */
        const ctr = e.getComponent(ComponentTypes.CTransform);
        /** @type {CGravityType} */
        const cg = e.getComponent(ComponentTypes.CGravity);
        ctr.acceleration.y += cg.gravity.y;
    },
    exit: (e) => {
        return;
    },
    handleAction: (e, action) => {
        console.log('falling', action);
        inAir.handleAction(e, action);
    },
};

/**
 * @type {import('../components/components.js').TypeStateCallback}
 */
const jumping = {
    entry: (e) => {},
    exit: (e) => {},
    /**
     *
     * @param {Entity} e
     */
    handleAction: (e, action) => {
        /** @type {CStateType} */
        const cst = e.getComponent(ComponentTypes.CState);

        if (action.name === ActionEnums.FALL && action.lifeCycle === ActionLifeCycle.START) {
            cst.setState(e, EntityStates.FALLING);
        }
        inAir.handleAction(e, action);
    },
};

/**
 * @type {import('../components/components.js').TypeStateCallback}
 */
const onGround = {
    entry: (e) => {
        /** @type {CTransformType} */
        const t = e.getComponent(ComponentTypes.CTransform);
        const moving = Math.abs(t.acceleration.x) > 0 || Math.abs(t.velocity.x) > 0;
        /** @type {CStateType} */
        const cst = e.getComponent(ComponentTypes.CState);

        if (moving) {
            cst.setState(e, t.scale.x >= 0 ? EntityStates.WALKING_RIGHT : EntityStates.WALKING_LEFT);
        }
    },
    exit: (e) => {
        return;
    },
    handleAction: (e, action) => {
        /** @type {CStateType} */
        const cst = e.getComponent(ComponentTypes.CState);
        if (action.name === ActionEnums.RIGHT && action.lifeCycle === ActionLifeCycle.START) {
            cst.setState(e, EntityStates.WALKING_RIGHT);
        }
        if (action.name === ActionEnums.LEFT && action.lifeCycle === ActionLifeCycle.START) {
            cst.setState(e, EntityStates.WALKING_LEFT);
        }
        if (action.name === ActionEnums.JUMP && action.lifeCycle === ActionLifeCycle.START) {
            /** @type {CTransformType} */
            const t = e.getComponent(ComponentTypes.CTransform);
            t.velocity.y = -t.vSpeed;
            cst.setState(e, EntityStates.JUMPING);
        }
    },
};

/**
 * @type {import('../components/components.js').TypeStateCallback}
 */
const walkingRight = {
    entry: (e) => {
        /** @type {CTransformType} */
        const t = e.getComponent(ComponentTypes.CTransform);
        t.velocity.x = 0;
        t.scale.x = Math.abs(t.scale.x);
        t.acceleration.x = t.hSpeed;
    },
    exit: (e) => {},
    handleAction: (e, action) => {
        /** @type {CTransformType} */
        const t = e.getComponent(ComponentTypes.CTransform);
        /** @type {CAnimationContainerType} */
        const ca = e.getComponent(ComponentTypes.CAnimation);
        /** @type {CStateType} */
        const cst = e.getComponent(ComponentTypes.CState);

        if (action.name === ActionEnums.RIGHT && action.lifeCycle === ActionLifeCycle.END) {
            t.acceleration.x = 0;
            t.velocity.x = 0;
            // ca.peekAnimation().stop();
            ca.popAnimation();
            cst.setState(e, EntityStates.IDLE);
            return;
        }

        onGround.handleAction(e, action);
    },
};

/**
 * @type {import('../components/components.js').TypeStateCallback}
 */
const walkingLeft = {
    entry: (e) => {
        /** @type {CTransformType} */
        const t = e.getComponent(ComponentTypes.CTransform);
        t.velocity.x = 0;
        t.scale.x = -1 * Math.abs(t.scale.x);
        t.acceleration.x = -1 * t.hSpeed;
    },
    exit: (e) => {},
    handleAction: (e, action) => {
        /** @type {CStateType} */
        const cst = e.getComponent(ComponentTypes.CState);
        /** @type {CTransformType} */
        const t = e.getComponent(ComponentTypes.CTransform);
        /** @type {CAnimationContainerType} */
        const ca = e.getComponent(ComponentTypes.CAnimation);
        if (action.name === ActionEnums.LEFT && action.lifeCycle === ActionLifeCycle.END) {
            t.acceleration.x = 0;
            t.velocity.x = 0;
            ca.popAnimation();
            cst.setState(e, EntityStates.IDLE_LEFT);
            return;
        }
        onGround.handleAction(e, action);
    },
};

/**
 * @type {import('../components/components.js').TypeStateCallback}
 */
const idle = {
    entry: (e) => {
        /** @type {CTransformType} */
        const t = e.getComponent(ComponentTypes.CTransform);
        t.scale.x = Math.abs(t.scale.x);
    },
    exit: (e) => {
        return;
    },
    handleAction: (e, action) => {
        /** @type {CStateType} */
        const cst = e.getComponent(ComponentTypes.CState);
        onGround.handleAction(e, action);

        if (action.name === ActionEnums.ATTACK && action.lifeCycle == ActionLifeCycle.START) {
            cst.setState(e, EntityStates.ATTACKING);
        }
    },
};

/**
 * @type {import('../components/components.js').TypeStateCallback}
 */
const attacking = {
    entry: (e) => {
        /** @type {CAnimationContainerType} */
        const ca = e.getComponent(ComponentTypes.CAnimation);
        /** @type {CAttacksType} */
        const cAtt = e.getComponent(ComponentTypes.CAttacks);
        /** @type {CStateType} */
        const cst = e.getComponent(ComponentTypes.CState);
        /** @type {Attack} */
        const attack = cAtt.getSelectedAttack();

        // Reset the state since we changed it to base attacking.
        cst.current = cst.previous;
        cst.setState(e, attack.animation);
    },
    exit: (e) => {},
    handleAction: (e, action) => {},
};

/**
 * @type {import('../components/components.js').TypeStateCallback}
 */
const idleLeft = {
    entry: (e) => {
        /** @type {CTransformType} */
        const t = e.getComponent(ComponentTypes.CTransform);
        t.scale.x = -1 * Math.abs(t.scale.x);
    },
    exit: (e) => {
        return;
    },
    handleAction: (e, action) => {
        /** @type {CStateType} */
        const cst = e.getComponent(ComponentTypes.CState);
        onGround.handleAction(e, action);
        if (action.name === ActionEnums.ATTACK && action.lifeCycle == ActionLifeCycle.START) {
            cst.setState(e, EntityStates.ATTACKING);
        }
    },
};

/**
 *
 * @param {CStateType} cState The entity's Actions component.
 */
const initPlayerFSM = (cState) => {
    cState.registerState(EntityStates.JUMPING, jumping);
    cState.registerState(EntityStates.WALKING_RIGHT, walkingRight);
    cState.registerState(EntityStates.WALKING_LEFT, walkingLeft);
    cState.registerState(EntityStates.IDLE, idle);
    cState.registerState(EntityStates.ON_GROUND, onGround);
    cState.registerState(EntityStates.FALLING, falling);
    cState.registerState(EntityStates.IDLE_LEFT, idleLeft);
    cState.registerState(EntityStates.ATTACKING, attacking);
    cState.registerState(EntityStates.ATTACKING_ONE, cState.nop);
    cState.registerState(EntityStates.ATTACKING_TWO, cState.nop);
};

export { initPlayerFSM };
