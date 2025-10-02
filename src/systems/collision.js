import { Entity } from '../entityManager/entityManger';
import { Vector } from 'vecti';
import { ComponentTypes } from '../utils/enums';

class CollisionSystem {
    constructor() {}

    /**
     * Computes the overlap between two entities
     *
     * @param {Entity} entityA - the first entity
     * @param {Entity} entityB - the second entity
     * @returns {{isCollision: boolean, overlapVector: Vector}} object an object containing a boolean (is there a collision?) and a Vector representing the overlap sizes {x: number, y: number} => {dx: number, dy: number}:
     */
    calculateOverlap(a, b) {
        const rectA = a.getComponent(ComponentTypes.CBoundingBox);
        const trA = a.getComponent(ComponentTypes.CTransform);
        const rectB = b.getComponent(ComponentTypes.CBoundingBox);
        const trB = b.getComponent(ComponentTypes.CTransform);

        const dx = Math.abs(trA.position.x - trB.position.x);
        const dy = Math.abs(trA.position.y - trB.position.y);
        const ox = rectA.halfSize.x + rectB.halfSize.x - dx;
        const oy = rectA.halfSize.y + rectB.halfSize.y - dx;

        return {
            isCollision: ox > 0 || oy > 0,
            overlapVector: new Vector(ox, oy),
        };
    }
}

export { CollisionSystem };
