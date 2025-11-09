import { EntityStates } from '../utils/enums';

/**
 *
 * @param {EntityStates} stateEnum
 * @returns {string}
 */
const playerStateToAnimations = (stateEnum) => {
    switch (stateEnum) {
        case EntityStates.WALKING_RIGHT:
        case EntityStates.WALKING_LEFT:
            return EntityStates.WALKING;
        case EntityStates.JUMPING:
        case EntityStates.FALLING:
            return EntityStates.JUMPING;
        case EntityStates.IDLE:
        case EntityStates.IDLE_LEFT:
        case EntityStates.ON_GROUND:
            return EntityStates.IDLE;
        default:
            return stateEnum;
    }
};

export { playerStateToAnimations };
