import { Tabs } from './tabs';
import { ComponentTypes, CustomEvents, PlayerStates } from '../../utils/enums';
import { GameEngine } from '../../gameEngine/gameEngine';
import { EntityManager } from '../../entityManager/entityManger';

/**
 * Creates the default tabs for the editor.
 * @param {Tab} tab - an object with the following properties:
 *   id: string, title: string, icon?: string, tooltip?: string,
 *   closable?: boolean, badge?: string|number,
 *   mount?: (root: HTMLElement)=>void, unmount?: (root: HTMLElement)=>void,
 *   onShow?: (root: HTMLElement)=>void, onHide?: (root: HTMLElement)=>void,
 *   active?: boolean
 * @param {GameEngine} gameEngine - The game engine
 * @param {Object} payload - an object containing the EntityManager instance
 * @param {EntityManager} payload.entityManager - The entity manager instance
 * @returns {Tabs} - the created tabs instance
 */
function createTabs(tab, gameEngine, payload) {
    tab.addTab({
        id: 'entities',
        title: 'Entities',
        icon: '️🧸',
        tooltip: 'Browse & Edit Entities',
        active: true,
        // closable: true,
        async mount(root) {
            // Entity manager
            // let entityManager = payload.entityManager;
            root.innerHTML = `
            <!-- List -->
            <ul class="entity-list" id="entityList" aria-live="polite">
                <!-- Filled dynamically -->
            </ul>`;

            const onUpdate = ({ detail }) => {
                detail.entities.forEach((entity) => {
                    console.log(entity);
                    const tr = entity.getComponent(ComponentTypes.CTransform);
                    const st = entity.getComponent(ComponentTypes.CState);

                    let elState = undefined;
                    if (st) {
                        let stOptions = '';
                        for (let option of Object.values(PlayerStates)) {
                            stOptions += `<option value="${option}">${option}</option>`;
                        }
                        elState = `
                        <!-- CState (simplified) -->
                        <section class="component" data-component="CState">
                            <h4>State</h4>
                            <form data-component-form="CState">
                                <div class="row">
                                    <label>current
                                    <select data-field="current">
                                    ${stOptions}
                                    </select>
                                    </label>
                                </div>
                                <div class="row">
                                    <label>previous <input type="text" data-field="previous" value="${st.previous} /> </label>
                                </div>
                                <div class="row">
                                    <label><input type="checkbox" data-field="canJump" checked="${st.canJump}" /> canJump</label>
                                </div>
                            </form>
                        </section>
                    `;
                    }

                    let elEntity = `<li class="entity-card" data-entity-id="">
                    <article>
                        <header class='entity-header'>
                            <strong>
                                <span data-entity-tag>${entity.tag}</span>
                                <span>(entity id#<span data-entity-id> ${entity.id})</span></span>
                            </strong>
                            <small>
                                <label>
                                    <input type="checkbox" data-field="active" checked="${entity.isActive()}" />
                                </label>
                            </small>
                        </header>

                        <!-- CTransform (simplified) -->
                        <section class="component" data-component="CTransform">
                            <h4>Transform</h4>
                            <form data-component-form="CTransform">
                                <div class="row">
                                        <label>x <input class="hidden" type="number" step="0.01" data-field="position.x" value="${
                                            tr.position.x
                                        }" /></label>
                                        <label>y <input class="hidden" type="number" step="0.01" data-field="position.y" value="${
                                            tr.position.y
                                        }" /></label>
                                        <label>vx <input class="hidden" type="number" step="0.01" data-field="velocity.x" value="${
                                            tr.velocity.x
                                        }" /></label>
                                        <label>vy <input class="hidden" type="number" step="0.01" data-field="velocity.y" value="${
                                            tr.velocity.y
                                        }" /></label>
                                </div>
                                <div class="row">
                                    <label>sx <input class="hidden" type="number" step="0.01" data-field="scale.x" value="${
                                        tr.scale.x
                                    }" /></label>
                                    <label>sy <input class="hidden" type="number" step="0.01" data-field="scale.y" value="${
                                        tr.scale.y
                                    }" /></label>
                                    <label>rot° <input class="hidden" type="number" step="0.1" data-field="rotation" value="${
                                        tr.angle
                                    }"  /></label>
                                    <label>grounded<input class="hidden" type="checkbox" data-field="grounded" checked="${
                                        tr.grounded
                                    }" /> </label>
                                </div>
                            </div>
                            </form>
                        </section>

                        ${st ? elState : ''}

                        <section>
                                <div class="actions">
                                    <button type="submit" data-action="save-component">Save</button>
                                    <button type="submit" data-action="refresh-component">Refresh</button>
                                    <button type="submit" data-action="delete-component"><i class="iconoir-xmark-circle-solid text-red icon-large"></i></button>
                        </section>
                    </article>
                    </li>`;

                    $('#entityList').append(elEntity);
                });
            };

            gameEngine.addEventListener(CustomEvents.ENTITIES.UPDATED, onUpdate);
        },
    });
    // Sprites panel
    tab.addTab({
        id: 'sprites',
        title: 'Sprites',
        icon: '🖼️',
        tooltip: 'Browse sprites',
        active: false,
        // closable: true,

        async mount(root) {
            root.innerHTML = `
        <div class="panel-row">
            <div><label>Filter</label><input id="spriteFilter" placeholder="name"></div>
            <div id="spriteGrid" style="display:grid;grid-template-columns:repeat(auto-fill,72px);margin-top:10px;"></div>
        </div>`;

            async function loadSprites() {
                try {
                    let spriteBlob = [];
                    const sheets = gameEngine.assets.spriteSheets;
                    for (let sheetId of sheets.keys()) {
                        const sheet = sheets.get(sheetId);
                        for (let i = 0; i < sheet.frames.length; i++) {
                            const frame = sheet.frames[i].frame;
                            const osCanvas = new OffscreenCanvas(frame.w, frame.h);
                            const ctx2d = osCanvas.getContext('2d');
                            ctx2d.imageSmoothingEnabled = false;
                            const bmp = await gameEngine.spriteCache.get(
                                sheet.image,
                                frame.x,
                                frame.y,
                                frame.w,
                                frame.h,
                                'none'
                            );

                            ctx2d.drawImage(bmp, 0, 0);
                            const blob = await osCanvas.convertToBlob({ type: 'image/png' });

                            spriteBlob.push({
                                url: URL.createObjectURL(blob),
                                sheetId: sheetId,
                                sheet,
                                frame: sheet.frames[i],
                            });
                        }
                    }
                    return spriteBlob;
                } catch (e) {
                    console.error(e);
                }
            }

            const elSpriteGrid = $('#spriteGrid');
            const blobs = await loadSprites();
            console.log(blobs);
            for (let blob of blobs) {
                const box = document.createElement('div');
                box.style.width = '100%';
                box.style.aspectRatio = '1 / 1';
                box.style.display = 'grid';
                box.style.placeItems = 'center';
                box.style.background = 'var(--ui-bg-muted, rgba(0,0,0,.04))';
                box.style.border = '1px solid var(--ui-border, rgba(0,0,0,.12))';
                box.style.borderRadius = '6px';
                box.style.cursor = 'pointer';

                const img = new Image();
                img.src = blob.url;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.imageRendering = 'pixelated';
                img.style.objectFit = 'fill';
                img.style.objectPosition = 'center';
                img.decoding = 'async';
                img.loading = 'lazy';
                box.appendChild(img);
                elSpriteGrid.append(box);

                // console.log('event', { sheetId: blob.key, sheet: blob.sheet });
                box.addEventListener('click', (e) => {
                    gameEngine.width;
                    // console.log('event', { sheetId: blob.key, sheet: blob.sheet, frame: blob.frame });
                    gameEngine.dispatchEvent(
                        new CustomEvent(CustomEvents.SPRITE.SELECT, {
                            detail: {
                                sheetId: blob.sheetId,
                                sheet: blob.sheet,
                                frame: blob.frame,
                            },
                        })
                    );
                });
            }
        },
        onShow(root) {
            /* refresh if needed */
        },
    });

    // Animations panel
    tab.addTab({
        id: 'animations',
        title: 'Animations',
        icon: '🎞️',
        tooltip: 'Browse animations',
        mount(root) {
            root.innerHTML = `
        <div>
            <button id="btnPlay">Play</button>
            <button id="btnPause">Pause</button>
            <div id="animPreview" style="height:160px;border:1px solid var(--ui-border);margin-top:8px;border-radius:8px;"></div>
        </div>`;
            // Hook your engine’s preview canvas here…
        },
    });

    tab.addTab({
        id: 'actions',
        title: 'Actions',
        icon: '⚙️',
        tooltip: 'Browse actions',
        mount(root) {
            root.innerHTML = `
        <div>
            <button id="btnPlay">Play</button>
            <button id="btnPause">Pause</button>
            <div id="animPreview" style="height:160px;border:1px solid var(--ui-border);margin-top:8px;border-radius:8px;"></div>
        </div>`;
            // Hook your engine’s preview canvas here...
        },
    });

    // Tiles panel
    tab.addTab({
        id: 'tiles',
        title: 'Tiles',
        icon: '🧱',
        badge: 0,
        tooltip: 'Tile editor',
        mount(root) {
            root.innerHTML = `<div id="tileset" style="display:flex; gap:10px;">
        <canvas id="tilesetCanvas" width="256" height="256" style="border:1px solid var(--ui-border)"></canvas>
        <div>
            <label>Brush Size</label>
            <select id="brush"><option>1×1</option><option>2×2</option><option>3×3</option></select>
            <div style="margin-top:8px"><button id="place">Place</button> <button id="erase">Erase</button></div>
        </div>
        </div>`;
        },
    });

    // Listen to tab lifecycle if you need cross-module behavior
    tab.addEventListener('tab:select', (e) => {
        // e.detail.id -> 'sprites' | 'animations' | 'tiles'
    });
}

export { createTabs };
