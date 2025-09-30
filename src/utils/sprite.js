import { Vector } from 'vecti';
import { ScalePolicies } from './enums';

/**
 * Calculate the scaled size of a sprite given its trimmed opaque bounds,
 * user scale factors, and a policy for handling aspect ratio.
 *
 * @param {Object} tr - Trimmed opaque bounds of the sprite {w, h}
 * @param {Object} scale - User scale factors {x, y}
 * @param {string} policy - Aspect ratio policy
 *     - none: scale each axis independently
 *     - uniformX: scale by X only, preserving aspect
 *     - uniformY: scale by Y only, preserving aspect
 *     - fit: fit the sprite inside the targetBox, preserving aspect
 *     - cover: cover the targetBox, preserving aspect
 * @param {Vector} targetBox - Target box {x, y} for fit and cover policies
 * @returns {Vector} Scaled size of the sprite {x, y}
 */
function getScaledSpriteSize(tr, scale, policy = 'uniformX', targetBox) {
    // tr: {w, h} from trimmedRect (opaque bounds)
    // scale: {x, y} user scale (sign only used for flipping)
    const sx = Math.abs(scale.x ?? 1);
    const sy = Math.abs(scale.y ?? 1);
    // const ar = tr.w > 0 && tr.h > 0 ? tr.w / tr.h : 1; // aspect ratio

    switch (policy) {
        case ScalePolicies.NONE: {
            // No aspect lock: scale each axis independently.
            return new Vector(tr.x * sx, tr.y * sy);
        }
        case ScalePolicies.UNIFORM_X: {
            // Drive by X only; preserve aspect.
            const k = sx;
            return new Vector(tr.x * k, tr.y * k);
        }
        case ScalePolicies.UNIFORM_Y: {
            // Drive by Y only; preserve aspect.
            const k = sy;
            return new Vector(tr.x * k, tr.y * k);
        }
        case ScalePolicies.FIT: {
            // Fit inside targetBox {x,y}, preserving aspect
            const k = Math.min(targetBox.x / tr.x, targetBox.y / tr.y);
            return new Vector(tr.x * k, tr.y * k);
        }
        case ScalePolicies.COVER: {
            // Cover targetBox {x,y}, preserving aspect
            const k = Math.max(targetBox.x / tr.x, targetBox.x / tr.x);
            return new Vector(tr.x * k, tr.y * k);
        }
        default: {
            // default = uniform by X
            const k = sx;
            return new Vector(tr.x * k, tr.h * k); // { w: tr.w * k, h: tr.h * k };
        }
    }
}

/**
 * Position & scale a trimmed sprite inside its scaled logical box.
 *
 * @param {Vector} trimmed        opaque bounds size (w,h) -> {x,y}
 * @param {Vector} logicalSize    original full size incl. padding (w,h) -> {x,y}
 * @param {Vector} scale          user scale (sign only for flipping) -> {x,y}
 * @param {ScalePolicies} policy  NONE | UNIFORM_X | UNIFORM_Y | FIT | COVER
 * @param {Vector} logicalPos     top-left of the *scaled* logical box in world space
 * @param {Vector} [targetBox]    required for FIT/COVER -> {x,y}
 * @param {Vector} [trimOffset]   unscaled offset of trimmed rect inside logical (top-left) -> {x,y}
 * @returns {{
 *   drawSize: Vector,                  // scaled size of trimmed rect
 *   logicalSizeScaled: Vector,         // scaled size of logical/original rect
 *   trimmedTopLeft: Vector,            // top-left to draw the trimmed rect in world space
 * trimmedCenter: Vector,
 *   kx: number, ky: number
 * }}
 */
function getScaledSpriteLayout(
    trimmed,
    logicalSize,
    scale,
    policy = ScalePolicies.UNIFORM_X,
    logicalPos,
    targetBox,
    trimOffset = new Vector(0, 0)
) {
    // Scale sizes using your existing helper (keeps policies consistent)
    const drawSize = getScaledSpriteSize(trimmed, scale, policy, targetBox);
    const logicalSizeScaled = getScaledSpriteSize(logicalSize, scale, policy, targetBox);

    // Final multipliers applied to logical space
    const kx = logicalSizeScaled.x / (logicalSize.x || 1);
    const ky = logicalSizeScaled.y / (logicalSize.y || 1);

    // If a real trim offset is available, use it; otherwise center the trimmed rect
    const hasRealOffset = trimOffset.x !== 0 || trimOffset.y !== 0;
    const logicalCenter = new Vector(logicalPos.x + logicalSizeScaled.x / 2, logicalPos.y + logicalSizeScaled.y / 2);

    const trimmedCenter = hasRealOffset
        ? new Vector(logicalPos.x - trimOffset.x * kx, logicalPos.y + trimOffset.y * ky)
        : new Vector(logicalPos.x - logicalSizeScaled.x / 2, logicalPos.y - logicalSizeScaled.y / 2);

    const trimmedTopLeft = hasRealOffset
        ? new Vector(logicalPos.x - trimOffset.x * kx, logicalPos.y + trimOffset.y * ky)
        : new Vector(
              logicalPos.x - (logicalSizeScaled.x - drawSize.x) / 2,
              logicalPos.y - (logicalSizeScaled.y - drawSize.y) / 2
          );
    return { drawSize, logicalSizeScaled, trimmedTopLeft, trimmedCenter, kx, ky };
}
export { getScaledSpriteSize, getScaledSpriteLayout };
