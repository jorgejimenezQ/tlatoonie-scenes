import { EntityStates, EntityTypes } from '../utils/enums';

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

/**
 *
 * @param {EntityStates} stateEnum
 * @returns {string}
 */
const tileSTA = (stateEnum) => {
    switch (stateEnum) {
        case EntityStates.TAKING_DAMAGE:
            return EntityStates.TAKING_DAMAGE;
        case EntityStates.IDLE:
        case EntityStates.UNCOVERED:
            return EntityStates.IDLE;
        default:
            return stateEnum;
    }
};

/**
 *
 * @param {EntityTypes} entityType
 */
const getStateToAnim = (entityType) => {
    switch (entityType) {
        case EntityTypes.PLAYER:
            return playerStateToAnimations;
        case EntityTypes.TILE:
        case EntityTypes.GROUND:
            return tileSTA;
    }
};
export { getStateToAnim };
