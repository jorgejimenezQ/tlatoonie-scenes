import { EntityStates, EntityAttacks } from '../utils/enums';

class Attack {
    /** @type {AttackComponent[]} */
    attackComponents = new Array();

    /**
     *
     * @param {EntityAttacks} name The tag that identifies the attack.
     * @param {EntityStates} animation The name of the animation to run with this attack.
     */
    constructor(name, animation) {
        this.name = name;
        this.animation = animation;
    }
}

export { Attack };
