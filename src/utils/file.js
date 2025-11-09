/**
 * Loads a JSON file from the given URL asynchronously.
 *
 * @param {string} url URL of the JSON file to load.
 *
 * @returns {Promise<Object>} A Promise that resolves with the loaded JSON data.
 *
 * @throws {Error} If the fetch request fails, or if the response status is not OK.
 */
async function loadJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (err) {
        console.error('(loadJSON)Error loading JSON: ', err);
    }
}

/**
 * Waits for all images on the page to finish loading asynchronously.
 *
 * @returns {Promise<void>} A Promise that resolves when all images have finished loading.
 */
async function resolveImages() {
    // console.log('loading images: ', document.images);

    await Promise.all(
        Array.from(document.images).map((image) => {
            return new Promise((resolve) => {
                if (image.complete) {
                    // Already loaded (cached)
                    resolve();
                } else {
                    image.addEventListener('load', resolve);
                    image.addEventListener('error', resolve); // prevent hanging forever
                }
            });
        })
    );

    console.log('all images loaded');
}

async function resolveConfiguration(configJsonPath) {
    //TODO : use a the function buildMaskAndTrimmedBounds to get the trimmedRect and create a cli option https://chatgpt.com/c/68bdd016-fe00-832f-8907-915b800dfd3b
    try {
        const data = await loadJSON(configJsonPath);
        const animationMap = new Map();
        const spriteSheetMap = new Map();
        const levelData = {};

        const assets = {
            animations: animationMap,
            spriteSheets: spriteSheetMap,
            images: [],
            levelData,
            // fonts: fontMap,
        };

        let assetsPath = configJsonPath.split('/');
        assetsPath.pop();
        assetsPath = assetsPath.join('/');
        for (const e of data.assets.spriteSheets) {
            // get the actual atlas from the path
            const atlas = await loadJSON(assetsPath + e.atlasPath); // await works here
            // delete unnecessary properties
            delete atlas.meta;

            let image = new Image();
            image.src = assetsPath + e.imagePath;
            // create an object with each frame of the sprite sheet for faster access
            var frameMap = new Map();
            for (const frame of atlas.frames) {
                frame.frameName = frame.filename;
                delete frame.filename;
                frameMap.set(frame.frameName, {
                    frame: frame.frame,
                    anchor: frame.anchor,
                });
            }
            // add atlas and the image path to the config object
            assets.spriteSheets.set(e.id, {
                ...atlas,
                imagePath: assetsPath + e.imagePath,
                frameMap: frameMap,
                image,
                trimmedRect: e.trimmedRect || null,
            });
        }

        let animSheets = [];
        // do the same for the animations
        for (const e of data.assets.animations) {
            animSheets.push(e.sheetId);
            // get the json obj from the animation config
            const animConfig = await loadJSON(assetsPath + e.animationPath);
            for (let animation of animConfig.anims) {
                // console.log(animation);
                assets.animations.set(animation.state, {
                    key: animation.key,
                    speed: e.speed,
                    sheetId: e.sheetId,
                    frames: [...animation.frames],
                    key: animation.key,
                    type: animation.type,
                    repeat: animation.repeat,
                    frameRate: animation.frameRate,
                    //TODO: duration: animation.frames.length / animation.frameRate,
                });
            }
        }

        levelData.playerConfig = {
            attacks: new Map(),
        };

        for (const attack of data.levelConfig.attacks) {
            levelData.playerConfig.attacks.set(attack.key, {
                animationId: attack.animationId,
            });
        }
        assets.sheets = animSheets;

        return { assets, config: levelData };
    } catch (err) {
        console.error('(function => resolveConfiguration): ', err);
    }
}

// --- helpers ---
function waitForImage(img, { timeoutMs = 15000 } = {}) {
    return new Promise((resolve, reject) => {
        if (img.complete && img.naturalWidth > 0) return resolve();

        let timer = null;
        const cleanup = () => {
            img.removeEventListener('load', onLoad);
            img.removeEventListener('error', onError);
            if (timer) clearTimeout(timer);
        };
        const onLoad = () => {
            cleanup();
            resolve();
        };
        const onError = () => {
            cleanup();
            reject(new Error(`Image failed: ${img.src || '[blob]'}`));
        };

        img.addEventListener('load', onLoad, { once: true });
        img.addEventListener('error', onError, { once: true });

        if (timeoutMs) {
            timer = setTimeout(() => {
                cleanup();
                reject(new Error(`Image load timed out: ${img.src || '[blob]'}`));
            }, timeoutMs);
        }
    });
}

async function waitForSpriteSheets(assets, { timeoutMs = 15000 } = {}) {
    // assumes: assets.spriteSheets is a Map<string, { image: HTMLImageElement, ... }>
    const images = Array.from(assets.spriteSheets.values()).map((s) => s.image);
    await Promise.all(images.map((img) => waitForImage(img, { timeoutMs })));
}

/**
 * Builds a bit mask and trimmed bounding box for an image.
 * The bit mask is an array of bytes where each bit corresponds to a pixel in the image.
 * A set bit (1) indicates that the pixel is visible (alpha >= thresholdAlpha).
 * The trimmed bounding box is the smallest rectangle that encloses all visible pixels.
 * If no visible pixels are found, the trimmed bounds are set to {x: 0, y: 0, w: 0, h: 0}.
 *
 * @param {ImageData} imageData - The image data to process.
 * @param {number} [thresholdAlpha=1] - The minimum alpha value for a pixel to be considered visible.
 * @returns {{mask: Uint8Array, width: number, height: number, trimmedBounds: {x: number, y: number, w: number, h: number}}}
 */
function buildMaskAndTrimmedBounds(imageData, thresholdAlpha = 1) {
    const { data, width, height } = imageData;
    const bitlen = width * height;
    const bytelength = ((bitlen + 7) >> 3) >>> 0;
    const mask = new Uint8Array(bytelength);

    let minX = width,
        minY = height,
        maxX = -1,
        maxY = -1;

    // Walk pixels once
    for (let y = 0, i = 0; y < height; y++) {
        for (let x = 0; x < width; x++, i++) {
            const a = data[(i << 2) + 3]; // RGBA -> alpha at +3
            if (a >= thresholdAlpha) {
                // set bit
                mask[i >> 3] |= 1 << (i & 7);

                // expand bounds
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }
        }
    }

    const hasVisible = maxX >= 0;
    const trimmedBounds = hasVisible
        ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
        : { x: 0, y: 0, w: 0, h: 0 };

    return { mask, width, height, trimmedBounds };
}

// helpers
function maskTest(mask, w, x, y) {
    const i = y * w + x;
    return (mask[i >> 3] >>> (i & 7)) & 1;
}

// axis-aligned mask-vs-mask collision (same scale, same orientation):
function masksOverlap(m1, w1, h1, m2, w2, h2, dx, dy) {
    // test if any visible pixels overlap when m2 is placed at (dx,dy) relative to m1
    const x0 = Math.max(0, dx),
        y0 = Math.max(0, dy);
    const x1 = Math.min(w1, dx + w2),
        y1 = Math.min(h1, dy + h2);
    if (x1 <= x0 || y1 <= y0) return false;

    for (let y = y0; y < y1; y++) {
        const r1 = y * w1,
            r2 = (y - dy) * w2 - dx;
        // walk row in chunks of bits for speed (here: fall back to per-pixel for clarity)
        for (let x = x0; x < x1; x++) {
            const i1 = r1 + x,
                i2 = r2 + x;
            const b1 = (m1[i1 >> 3] >>> (i1 & 7)) & 1;
            if (!b1) continue;
            const b2 = (m2[i2 >> 3] >>> (i2 & 7)) & 1;
            if (b2) return true;
        }
    }
    return false;
}

/****************************************************************************************/
/** JSON file helpers */
/****************************************************************************************/

const printJSON = (obj) => {
    console.log(JSON.stringify(obj, null, 2));
};

const printJSONToFile = (obj) => {
    const json = JSON.stringify(obj, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
};

export { loadJSON, waitForSpriteSheets, resolveConfiguration, printJSON, printJSONToFile };
