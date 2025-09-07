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
        if (!response.ok) throw new Error('HTTP error! Status: ${response.status}');
        const data = await response.json();
        return data;
    } catch (err) {
        console.error('Error loading JSON: ', err);
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
    try {
        const data = await loadJSON(configJsonPath);

        /*

        */
        const animationMap = new Map();
        const spriteSheetMap = new Map();
        const assets = {
            animations: animationMap,
            spriteSheets: spriteSheetMap,
            images: [],
            // fonts: fontMap,
        };

        for (const e of data.assets.spriteSheets) {
            // console.log(e);
            // get the actual atlas from the path
            const atlas = await loadJSON('../../assets' + e.atlasPath); // await works here

            // delete unnecessary properties
            delete atlas.meta;

            let image = new Image();
            image.src = '../../assets' + e.imagePath;

            // create an object with each frame of the sprite sheet for faster access
            var frameMap = new Map();
            for (const frame of atlas.frames) {
                frameMap.set(frame.filename, {
                    frame: frame.frame,
                    anchor: frame.anchor,
                });
            }
            // add atlas and the image path to the config object
            assets.spriteSheets.set(e.id, {
                ...atlas,
                imagePath: e.imagePath,
                frameMap: frameMap,
                image,
            });
        }
        // console.log('unpacked sprite sheets from config file: ', assets.spriteSheets);
        let animSheets = [];
        // do the same for the animations
        for (const e of data.assets.animations) {
            animSheets.push(e.sheetId);
            // get the json obj from the animation config
            const animConfig = await loadJSON('../../assets' + e.animationPath);
            for (let animation of animConfig.anims) {
                // console.log(animation);
                assets.animations.set(animation.key, {
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

        // console.log('assets', assets);
        // console.log('sample animation', assets.animations.get('knight_walk'));
        // console.log('sample sheet', assets.spriteSheets.get('knight'));

        // const animationFrame = assets.animations.get('knight_walk').frames[0];

        // console.log('animation frame', animationFrame);
        // console.log(
        //     'animation and sprite sheet used together',
        //     assets.spriteSheets.get(animationFrame.key).frameMap.get(animationFrame.frame)
        // );
        assets.sheets = animSheets;
        // console.log(animSheets);
        return assets;
    } catch (err) {
        console.error(err);
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

export { loadJSON, waitForSpriteSheets, resolveConfiguration };
