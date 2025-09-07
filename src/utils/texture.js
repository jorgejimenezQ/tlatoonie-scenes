class Texture {
    // TODO: implement the Texture class
    #image = new Image();
    #atlas = {};
    #name = '';

    constructor(name, atlas, imagePath) {
        this.#name = name;
        this.#atlas = atlas;
        this.#image.src = imagePath;
    }

    // TODO: finish implementing methods
    drawImage() {}
    getSize() {}
}

export { Texture };
