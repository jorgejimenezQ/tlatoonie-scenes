export class Tabs extends EventTarget {
    /**
     * @param {HTMLElement} container  Wrapper element where the tabs UI will render.
     * @param {{title?:string, storageKey?:string}} [opts]
     */
    constructor(container, opts = {}) {
        super();
        this.container = container;
        this.title = opts.title ?? 'Panels';
        this.storageKey = opts.storageKey ?? 'ui.tabs.v2';
        this.tabs = new Map(); // id -> meta
        this.order = []; // tab id order
        this.activeId = null;

        this.#buildShell();
        this.#restore();
        this.#wireKeyboardNav();
    }

    // ---------- Public API ----------

    /**
     * Add a tab.
     * @param {{
     *   id:string, title:string, icon?:string, tooltip?:string,
     *   closable?:boolean, badge?:string|number,
     *   mount?:(root:HTMLElement)=>void, unmount?:(root:HTMLElement)=>void,
     *   onShow?:(root:HTMLElement)=>void, onHide?:(root:HTMLElement)=>void,
     *   active?:boolean
     * }} conf
     */
    addTab(conf) {
        if (!conf?.id || !conf?.title) throw new Error('addTab requires {id, title}');
        if (this.tabs.has(conf.id)) throw new Error(`Tab '${conf.id}' already exists`);

        // Elements
        const btn = document.createElement('button');
        btn.className = 'tab-links';
        btn.type = 'button';
        btn.role = 'tab';
        btn.id = `tab-${conf.id}`;
        btn.dataset.tabId = conf.id;
        btn.setAttribute('aria-selected', 'false');
        btn.setAttribute('tabindex', '-1');
        if (conf.tooltip) btn.title = conf.tooltip;

        const label = document.createElement('span');
        label.className = 'tab-title';
        label.textContent = conf.title;

        if (conf.icon) {
            const ic = document.createElement('span');
            ic.className = 'tab-icon';
            ic.textContent = conf.icon;
            btn.append(ic);
        }
        btn.append(label);

        const badge = document.createElement('span');
        badge.className = 'tab-badge';
        if (conf.badge != null) {
            badge.textContent = String(conf.badge);
            btn.append(badge);
        }

        let closeBtn = null;
        if (conf.closable) {
            closeBtn = document.createElement('button');
            closeBtn.className = 'tab-close';
            closeBtn.type = 'button';
            closeBtn.setAttribute('aria-label', `Close ${conf.title}`);
            closeBtn.textContent = '×';
            btn.append(closeBtn);
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeTab(conf.id);
            });
        }

        const panel = document.createElement('div');
        panel.className = 'tab-content';
        panel.id = conf.id;
        panel.role = 'tabpanel';
        panel.setAttribute('aria-labelledby', btn.id);
        panel.hidden = true;

        this.tablist.append(btn);
        this.contentRegion.append(panel);

        const meta = {
            ...conf,
            button: btn,
            badgeEl: badge,
            panel,
            mounted: false,
        };
        this.tabs.set(conf.id, meta);
        this.order.push(conf.id);

        btn.addEventListener('click', () => this.select(conf.id));

        this.#persist();

        this.dispatchEvent(new CustomEvent('tab:add', { detail: { id: conf.id } }));

        const shouldAutoSelect =
            conf.active || (this.activeId == null && (!this._restoredActiveId || this._restoredActiveId === conf.id));

        if (shouldAutoSelect) this.select(conf.id);

        if (!this.order.includes(conf.id)) this.order.push(conf.id);
    }

    /** Remove a tab by id. */
    removeTab(id) {
        const meta = this.tabs.get(id);
        if (!meta) return;
        if (meta.unmount && meta.mounted) meta.unmount(meta.panel);
        meta.button.remove();
        meta.panel.remove();
        this.tabs.delete(id);
        this.order = this.order.filter((x) => x !== id);

        if (this.activeId === id) {
            const next = this.order[this.order.length - 1] || null; // select previous tab if any
            this.activeId = null;
            if (next) this.select(next);
        }
        this.#persist();
        this.dispatchEvent(new CustomEvent('tab:remove', { detail: { id } }));
    }

    /** Select a tab by id. */
    select(id) {
        if (!this.tabs.has(id)) return;

        const prev = this.activeId ? this.tabs.get(this.activeId) : null;
        const next = this.tabs.get(id);

        // Deactivate previous
        if (prev) {
            prev.button.classList.remove('active');
            prev.button.setAttribute('aria-selected', 'false');
            prev.button.setAttribute('tabindex', '-1');
            prev.panel.hidden = true;
            prev.panel.classList.remove('active');
            prev.onHide?.(prev.panel);
        }

        // Activate next
        this.activeId = id;
        next.button.classList.add('active');
        next.button.setAttribute('aria-selected', 'true');
        next.button.setAttribute('tabindex', '0');
        next.panel.hidden = false;
        next.panel.classList.add('active');
        next.button.focus({ preventScroll: true });

        // Lazy mount
        if (!next.mounted && next.mount) {
            next.mount(next.panel);
            next.mounted = true;
        }
        next.onShow?.(next.panel);

        this.#persist();
        this.dispatchEvent(new CustomEvent('tab:select', { detail: { id } }));
    }

    /** Update tab metadata: title, icon, badge, tooltip. */
    update(id, patch = {}) {
        const t = this.tabs.get(id);
        if (!t) return;
        if (patch.title) t.panel.setAttribute('aria-label', patch.title);
        if (patch.title) t.button.querySelector('.tab-title').textContent = patch.title;
        if (patch.icon != null) {
            let ic = t.button.querySelector('.tab-icon');
            if (patch.icon === '' || patch.icon === false) {
                ic?.remove();
            } else {
                if (!ic) {
                    ic = document.createElement('span');
                    ic.className = 'tab-icon';
                    t.button.prepend(ic);
                }
                ic.textContent = patch.icon;
            }
        }
        if ('badge' in patch) {
            if (patch.badge == null || patch.badge === '') {
                t.badgeEl.textContent = '';
                t.badgeEl.style.display = 'none';
            } else {
                t.badgeEl.textContent = String(patch.badge);
                t.badgeEl.style.display = '';
            }
        }
        if (patch.tooltip != null) t.button.title = patch.tooltip;
    }

    /** Returns the active tab id or null. */
    get active() {
        return this.activeId;
    }

    /** Reorder tabs by array of ids. */
    reorder(ids) {
        if (!Array.isArray(ids)) return;
        // keep only known ids in given order + append any missing
        const set = new Set(ids.filter((id) => this.tabs.has(id)));
        this.order = [...set, ...this.order.filter((id) => !set.has(id))];
        // apply DOM order
        this.order.forEach((id) => this.tablist.append(this.tabs.get(id).button));
        this.#persist();
        this.dispatchEvent(new CustomEvent('tab:reorder', { detail: { order: this.order.slice() } }));
    }

    // ---------- Private ----------

    #buildShell() {
        this.container.classList.add('tab-container');
        // Optional title bar
        const titleBar = document.createElement('div');
        titleBar.className = 'tab-titlebar';
        titleBar.textContent = this.title;

        const tablist = document.createElement('div');
        tablist.className = 'tabs';
        tablist.role = 'tablist';
        tablist.setAttribute('aria-label', this.title);

        const content = document.createElement('div');
        content.className = 'tab-contents';

        this.container.replaceChildren(titleBar, tablist, content);
        this.tablist = tablist;
        this.contentRegion = content;
    }

    #wireKeyboardNav() {
        this.tablist.addEventListener('keydown', (e) => {
            const ids = this.order;
            if (!ids.length) return;
            const idx = ids.indexOf(this.activeId);
            if (e.key === 'ArrowRight') {
                this.select(ids[(idx + 1) % ids.length]);
                e.preventDefault();
            } else if (e.key === 'ArrowLeft') {
                this.select(ids[(idx - 1 + ids.length) % ids.length]);
                e.preventDefault();
            } else if (e.key === 'Home') {
                this.select(ids[0]);
                e.preventDefault();
            } else if (e.key === 'End') {
                this.select(ids[ids.length - 1]);
                e.preventDefault();
            } else if (e.ctrlKey && e.key === 'Tab') {
                this.select(ids[(idx + (e.shiftKey ? -1 : 1) + ids.length) % ids.length]);
                e.preventDefault();
            }
        });
    }

    #persist() {
        try {
            const data = { order: this.order, activeId: this.activeId };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch {}
    }

    #restore() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) return;
            const { order, activeId } = JSON.parse(raw);
            if (Array.isArray(order)) {
                // keep unique strings only
                this.order = [...new Set(order.filter((id) => typeof id === 'string'))];
            }
            // don't set active yet; just remember it
            this._restoredActiveId = typeof activeId === 'string' ? activeId : null;
            this.activeId = null;
        } catch {}
    }
}
