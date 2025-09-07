import enums from '../utils/enums';
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
    /**
     * Retrieves the tag associated with this entity.
     * @returns {string} The tag.
     */
    /*******  8279ce70-b1fd-41aa-89c0-e5d3314a6622  *******/
    getTag() {
        return this.#entityTag;
    }

    getId() {
        return this.#entityId;
    }

    hasComponent(component) {
        this.#componentMap.has(component);
    }

    addComponent(component) {
        if (this.#componentMap.has(component)) {
            throw new Error(
                "A component of that type already exists on this entity. Try altering the entity's component instead."
            );
        }

        let newComponent = createComponent(component);
        this.#componentMap.set(component, newComponent);
    }

    /**
     * Retrieves a component of the given type from this entity.
     * @param {Component} component The type of component to retrieve.
     * @returns {Component} The component of the given type associated with this entity, or null if no such component exists.
     */
    getComponent(component) {
        return this.#componentMap.get(component);
    }

    removeComponent(component) {
        this.#componentMap.delete(component);
    }
}
