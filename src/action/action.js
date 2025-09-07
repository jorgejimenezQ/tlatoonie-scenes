class Action {
    name;
    type;
    #payload = null;

    constructor(name, type) {
        this.type = type;
        this.name = name;
    }

    getName() {
        return this.name;
    }

    getType() {
        return this.type;
    }

    get name() {
        return this.name;
    }

    get type() {
        return this.type;
    }

    set payload(data) {
        this.#payload = data;
    }

    get payload() {
        return this.#payload;
    }
}

export { Action };
