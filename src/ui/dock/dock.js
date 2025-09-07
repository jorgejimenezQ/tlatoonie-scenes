// dock.js
// Minimal dock system: resizable left/right areas that host Tabs instances.

import { Tabs } from './tabs.js';

export class DockManager extends EventTarget {
    /**
     * @param {HTMLElement} root  Container that should fill the screen/parent.
     * @param {{storageKey?:string, withRight?:boolean}} [opts]
     */
    constructor(root, opts = {}) {
        super();
        this.root = root;
        this.storageKey = opts.storageKey ?? 'ui.dock.v1';
        this.withRight = opts.withRight ?? true;

        this.#buildLayout();
        this.#restoreSizes();
        this.#wireSplitters();
    }

    /** Accessors for the embedded Tabs instances */
    get leftTabs() {
        return this._leftTabs;
    }
    get rightTabs() {
        return this._rightTabs;
    } // may be undefined if withRight=false

    /** Programmatically set the left/right sizes (in px) and persist */
    setSize(which, px) {
        const min = 200,
            max = 700;
        px = Math.max(min, Math.min(max, Math.round(px)));
        if (which === 'left') this.root.style.setProperty('--dock-size-left', px + 'px');
        if (which === 'right') this.root.style.setProperty('--dock-size-right', px + 'px');
        this.#persistSizes();
    }

    // ---------- internal ----------

    #buildLayout() {
        this.root.classList.add('dock-root');

        // Left dock
        const left = document.createElement('div');
        left.className = 'dock-left';
        const splitL = document.createElement('div');
        splitL.className = 'dock-splitter vertical';
        splitL.dataset.side = 'left';

        // Center (canvas goes here)
        const center = document.createElement('div');
        center.className = 'dock-center';

        // Right dock (optional)
        const splitR = document.createElement('div');
        let right = null;
        if (this.withRight) {
            splitR.className = 'dock-splitter vertical';
            splitR.dataset.side = 'right';
            right = document.createElement('div');
            right.className = 'dock-right';
        }

        // Grid slots
        // columns: left | splitL | center | splitR | right
        this.root.append(left, splitL, center);
        if (this.withRight) this.root.append(splitR, right);

        // Create Tabs inside left/right
        const leftShell = document.createElement('div');
        leftShell.className = 'dock-shell';
        left.appendChild(leftShell);
        this._leftTabs = new Tabs(leftShell, { title: 'Left Dock', storageKey: this.storageKey + '.left' });

        if (this.withRight) {
            const rightShell = document.createElement('div');
            rightShell.className = 'dock-shell';
            right.appendChild(rightShell);
            this._rightTabs = new Tabs(rightShell, { title: 'Right Dock', storageKey: this.storageKey + '.right' });
        }

        // Expose center for your canvas
        this.centerEl = center;
    }

    #wireSplitters() {
        const onDown = (e) => {
            const side = e.currentTarget.dataset.side;
            const rect = this.root.getBoundingClientRect();
            const startX = e.clientX;
            const startLeft = parseFloat(getComputedStyle(this.root).getPropertyValue('--dock-size-left'));
            const startRight = parseFloat(getComputedStyle(this.root).getPropertyValue('--dock-size-right'));

            const onMove = (ev) => {
                if (side === 'left') {
                    const delta = ev.clientX - startX;
                    this.setSize('left', startLeft + delta);
                } else if (side === 'right') {
                    const delta = startX - ev.clientX;
                    this.setSize('right', startRight + delta);
                }
                ev.preventDefault();
            };
            const onUp = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
            e.preventDefault();
        };

        this.root.querySelectorAll('.dock-splitter.vertical').forEach((s) => {
            s.addEventListener('mousedown', onDown);
        });
    }

    #persistSizes() {
        try {
            const styles = getComputedStyle(this.root);
            const left = parseInt(styles.getPropertyValue('--dock-size-left')) || 320;
            const right = parseInt(styles.getPropertyValue('--dock-size-right')) || 360;
            localStorage.setItem(this.storageKey + '.sizes', JSON.stringify({ left, right }));
        } catch {}
    }

    #restoreSizes() {
        try {
            const raw = localStorage.getItem(this.storageKey + '.sizes');
            if (!raw) return;
            const { left, right } = JSON.parse(raw);
            if (left) this.root.style.setProperty('--dock-size-left', left + 'px');
            if (right) this.root.style.setProperty('--dock-size-right', right + 'px');
        } catch {}
    }
}
