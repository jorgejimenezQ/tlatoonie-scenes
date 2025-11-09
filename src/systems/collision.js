import { Entity } from '../entityManager/entityManager';
import { Vector } from 'vecti';
import { ComponentTypes } from '../utils/enums';
import { BoundingBox, Transform } from '../components/components';

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
 * @typedef {Object} OverlapData
 * @property {boolean} overlapping - True if A and B overlap (i.e., `ox > 0 && oy > 0`).
 * @property {number} ox - Penetration magnitude along X (≥ 0).
 * @property {number} oy - Penetration magnitude along Y (≥ 0).
 * @property {number} dx - Signed center delta X: `A.x - B.x`.
 * @property {number} dy - Signed center delta Y: `A.y - B.y`.
 * @property {'x'|'y'|null} axis - Shallow axis of penetration; `'x'`, `'y'`, or `null` if not overlapping.
 * @property {Vector} mtv - Signed vector to add to **A** to minimally separate from **B`.
 */

class CollisionSystem {
    /**
     * Represents the overlapping for the entity
     */

    constructor() {}

    /**
     * Computes center-based AABB overlap between two entities.
     * @param {Entity} a
     * @param {Entity} b
     * @returns {OverlapData}
     */

    calculateOverlap(a, b) {
        /** @type {BoundingBox} */
        const rectA = a.getComponent(ComponentTypes.CBoundingBox);
        /** @type {Transform} */
        const trA = a.getComponent(ComponentTypes.CTransform);
        /** @type {BoundingBox} */
        const rectB = b.getComponent(ComponentTypes.CBoundingBox);
        /** @type {Transform} */
        const trB = b.getComponent(ComponentTypes.CTransform);
        const dxRaw = trA.position.x - trB.position.x;
        const dyRaw = trA.position.y - trB.position.y;
        const dx = Math.abs(dxRaw);
        const dy = Math.abs(dyRaw);

        const ox = rectA.halfSize.x + rectB.halfSize.x - dx;
        const oy = rectA.halfSize.y + rectB.halfSize.y - dy;

        const overlapping = ox > 0 && oy > 0;

        if (!overlapping) {
            return {
                overlapping: false,
                ox: 0,
                oy: 0,
                dx: dxRaw,
                dy: dyRaw,
                axis: null,
                mtv: new Vector(0, 0), // minimum translation vector
            };
        }

        // Choose the shallow axis and give MTV a SIGN that separates A from B
        // Sign convention: MTV is the vector to ADD to A to separate it from B.
        let mtv, axis;
        if (ox < oy) {
            axis = 'x';
            const sx = dxRaw === 0 ? 0 : dxRaw > 0 ? +1 : -1; // if A is to the right of B, push A further right
            mtv = new Vector(ox * sx, 0);
        } else {
            axis = 'y';
            const sy = dyRaw === 0 ? 0 : dyRaw > 0 ? +1 : -1; // if A is below B, push A further down
            mtv = new Vector(0, oy * sy);
        }

        return {
            overlapping,
            ox,
            oy, // penetration magnitudes
            dx: dxRaw,
            dy: dyRaw, // signed center deltas
            axis, // 'x' or 'y'
            mtv, // signed separation vector for A
        };
    }
}

export { CollisionSystem };
