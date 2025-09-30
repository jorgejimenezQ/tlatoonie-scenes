// flippedCacheGpu.js
// GPU-friendly cache for pre-rendered sprite frames (normal + flipped).
// Stores ImageBitmaps (when supported) for fast, predictable draws.
//
// API:
//   const cache = new FlipCacheGPU(64 * 1024 * 1024); // 64MB budget
//   await cache.prewarm(image, framesArray, 'none');  // frames: [{sx,sy,sw,sh}, ...]
//   await cache.prewarm(image, framesArray, 'flipX'); // flipped variant
//   const bmp = await cache.get(image, sx, sy, sw, sh, 'flipX'); // use in drawImage
//
// Notes:
// - Byte accounting is heuristic: sw * sh * 4 (RGBA).
// - If createImageBitmap is unavailable, falls back to HTMLCanvasElement.
// - LRU eviction keeps memory bounded; oldest entries drop first.
// - Concurrent requests for the same key are coalesced (single build).

export class SpriteCacheGPU {
    /**
     * @param {number} maxBytes Approximate memory budget for cached frames (bytes).
     */
    constructor(maxBytes = 64 * 1024 * 1024) {
        this.maxBytes = maxBytes;
        this.bytes = 0;
        this.map = new Map(); // key -> { bmp, w, h, bytes }
        this.inflight = new Map(); // key -> Promise<bitmap>
    }

    /**
     * Build and cache a list of frames for one mode.
     * @param {CanvasImageSource} image  Source spritesheet image (HTMLImageElement/HTMLCanvasElement/OffscreenCanvas)
     * @param {{sx:number,sy:number,sw:number,sh:number}[]} frames
     * @param {'none'|'flipX'} mode
     */
    async prewarm(image, frames, mode = 'none') {
        for (const f of frames) {
            await this.#ensure(image, f.sx, f.sy, f.sw, f.sh, mode);
        }
    }

    /**
     * Get a cached bitmap for the given source rect + mode; build if missing.
     * @returns {Promise<ImageBitmap|HTMLCanvasElement>}
     */
    async get(image, sx, sy, sw, sh, mode = 'none') {
        const key = this.#key(image, sx, sy, sw, sh, mode);
        const hit = this.map.get(key);
        if (hit) {
            // LRU bump
            this.map.delete(key);
            this.map.set(key, hit);
            return hit.bmp;
        }
        // Coalesce concurrent builds
        if (this.inflight.has(key)) return this.inflight.get(key);

        const p = (async () => {
            const bmp = await this.#make(image, sx, sy, sw, sh, mode);
            this.#insert(key, { bmp, w: sw, h: sh, bytes: sw * sh * 4 });
            return bmp;
        })();

        this.inflight.set(key, p);
        try {
            const bmp = await p;
            return bmp;
        } finally {
            this.inflight.delete(key);
        }
    }

    /** Clear all cached entries and free resources where possible. */
    clear() {
        for (const { bmp } of this.map.values()) {
            try {
                bmp.close?.();
            } catch {}
        }
        this.map.clear();
        this.bytes = 0;
        // Reject/ignore inflight callers gracefully on next await, if any were left.
        this.inflight.clear();
    }

    // ---------------- internal helpers ----------------

    async #ensure(image, sx, sy, sw, sh, mode) {
        const key = this.#key(image, sx, sy, sw, sh, mode);
        if (this.map.has(key)) return;
        if (this.inflight.has(key)) {
            await this.inflight.get(key);
            return;
        }

        const p = (async () => {
            const bmp = await this.#make(image, sx, sy, sw, sh, mode);
            this.#insert(key, { bmp, w: sw, h: sh, bytes: sw * sh * 4 });
            return bmp;
        })();

        this.inflight.set(key, p);
        try {
            await p;
        } finally {
            this.inflight.delete(key);
        }
    }

    #key(image, sx, sy, sw, sh, mode) {
        // Prefer URL; otherwise attach a stable object id on first use.
        const srcId = image?.src || image?._id || (image._id = `img@${Math.random().toString(36).slice(2)}`);
        return `${srcId}|${sx},${sy},${sw},${sh}|${mode}`;
    }

    async #make(image, sx, sy, sw, sh, mode) {
        const hasOffscreen = typeof OffscreenCanvas !== 'undefined';
        const off = hasOffscreen
            ? new OffscreenCanvas(sw, sh)
            : Object.assign(document.createElement('canvas'), { width: sw, height: sh });
        const ctx = off.getContext('2d');
        // Pixel art friendly; harmless for HD art.
        ctx.imageSmoothingEnabled = false;

        if (mode === 'flipX') {
            ctx.translate(sw, 0);
            ctx.scale(-1, 1);
        }
        // Draw the frame sub-rect into (0,0)-(sw,sh)
        ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);

        // Promote to ImageBitmap if available (usually GPU-backed & fast to draw).
        if (typeof createImageBitmap === 'function') {
            return await createImageBitmap(off);
        }
        // Fallback: return the canvas itself.
        return off;
    }

    #insert(key, entry) {
        // Evict oldest until within budget
        while (this.bytes + entry.bytes > this.maxBytes && this.map.size) {
            const [oldKey, old] = this.map.entries().next().value;
            this.map.delete(oldKey);
            this.bytes -= old.bytes || 0;
            try {
                old.bmp.close?.();
            } catch {}
        }
        this.map.set(key, entry);
        this.bytes += entry.bytes;
    }
}

function human(bytes) {
    return bytes < 1024
        ? `${bytes} B`
        : bytes < 1024 * 1024
        ? `${(bytes / 1024).toFixed(1)} KB`
        : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function printSpriteCacheStats(cache) {
    const byMode = new Map(); // mode -> {count, bytes}
    const bySheet = new Map(); // sheetId/url -> {count, bytes}

    for (const [key, entry] of cache.map.entries()) {
        // key format: `${srcId}|${sx},${sy},${sw},${sh}|${mode}`
        const [srcAndRect, mode] =
            key.split('|flipX').length > 1 ? [key.replace(/\|flipX$/, ''), 'flipX'] : key.split(/\|(none|flipX)$/); // works with both 'none' and 'flipX'
        const srcId = srcAndRect.split('|')[0];

        const m = byMode.get(mode) || { count: 0, bytes: 0 };
        m.count++;
        m.bytes += entry.bytes;
        byMode.set(mode, m);

        const s = bySheet.get(srcId) || { count: 0, bytes: 0 };
        s.count++;
        s.bytes += entry.bytes;
        bySheet.set(srcId, s);
    }

    let total = 0;
    for (const v of byMode.values()) total += v.bytes;

    console.group('SpriteCache Stats');
    console.info('Total:', human(total), `(entries: ${cache.map.size})`);
    console.group('By mode');
    for (const [mode, v] of byMode.entries()) {
        console.info(`  ${mode}: ${human(v.bytes)} (${v.count} frames)`);
    }
    console.groupEnd();
    console.group('By sheet');
    for (const [sheet, v] of bySheet.entries()) {
        console.info(`  ${sheet}: ${human(v.bytes)} (${v.count} frames)`);
    }
    console.groupEnd();
    console.groupEnd();
}

export { printSpriteCacheStats };
