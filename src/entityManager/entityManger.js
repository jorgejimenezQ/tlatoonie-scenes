import { createComponent } from '../components/components';

class Entity {
    #componentMap = new Map();
    #isActive = true;
    #entityId = 0;
    #entityTag = '';

    constructor(id, tag) {
        this.#entityId = id;
        this.#entityTag = tag;
    }

    destroy() {
        this.#isActive = false;
    }

    isActive() {
        return this.#isActive;
    }

    /*************  ✨ Windsurf Command ⭐  *************/
    /*******  8279ce70-b1fd-41aa-89c0-e5d3314a6622  *******/
    getTag() {
        return this.#entityTag;
    }

    hasComponent(component) {
        this.#componentMap.has(component);
    }

    addComponent(component, tag) {
        // if (this.#componentMap.has(component)) {
        //     throw new Error(
        //         "A component of that type already exists on this entity. Try altering the entity's component instead."
        //     );
        // }

        this.#componentMap.set(tag, component);
    }

    /**
     * Retrieves a component from the entity's component map.
     * @param {string} component the type of component to retrieve
     * @returns {Object} the component if it exists, otherwise undefined
     */
    getComponent(component) {
        return this.#componentMap.get(component);
    }

    removeComponent(component) {
        this.#componentMap.delete(component);
    }
}

class EntityManager {
    #entityList = new Array();
    #entityListToAdd = new Array();
    #entityListMap = new Map();
    #totalEntities = 0;

    #removeDeadEntities() {}

    update() {
        // 1) Move queued entities into live lists
        for (const entity of this.#entityListToAdd) {
            this.#entityList.push(entity);

            const tag = entity.getTag();
            if (!this.#entityListMap.has(tag)) this.#entityListMap.set(tag, []);
            this.#entityListMap.get(tag).push(entity);
        }
        this.#entityListToAdd.length = 0;

        // 2) Cull dead from the flat list
        this.#entityList = this.#entityList.filter((e) => e.isActive());

        // 3) Cull dead from each tag bucket (and drop empty buckets)
        for (const [tag, list] of this.#entityListMap) {
            const filtered = list.filter((e) => e.isActive());
            if (filtered.length) {
                this.#entityListMap.set(tag, filtered);
            } else {
                this.#entityListMap.delete(tag);
            }
        }
    }

    addEntity(tag) {
        // add to flat list
        let entity = new Entity(this.#totalEntities++, tag);
        this.#entityListToAdd.push(entity);

        return entity;
    }

    /**
     * Retrieves all entities in the entity manager.
     *
     * @returns {Entity[]} A list of all entities.
     */
    getAllEntities() {
        return this.#entityList;
    }

    getEntitiesWithTag(tag) {
        return this.#entityListMap.get(tag);
    }

    getEntitiesMap() {
        return this.#entityListMap;
    }
}

export { EntityManager, Entity };
