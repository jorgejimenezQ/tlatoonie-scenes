import { loadJSON } from '../utils/file';
import { Texture } from '../utils/texture';

class Assets {
    // A map of all textures **loaded** for use in the game.
    #textureMap = new Map();
    #animationMap = new Map();
    #fontMap = new Map();

    // TODO: implement the methods of Assets class
    // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Using_images
    /*
    async function draw() {
  // Wait for all images to be loaded:
  await Promise.all(
    Array.from(document.images).map(
      (image) =>
        new Promise((resolve) => image.addEventListener("load", resolve)),
    ),
  );

  // const ctx = document.getElementById("canvas").getContext("2d");
  // call drawImage() as usual
}
draw();
*/

    // TODO: implement the methods of Assets class
    async loadFromFile(path) {
        const data = await loadJSON(path);
        // Get all the images in the config file and the texture to the map
        // for (const texture of data.assets.textures) {
        //     this.#textureMap.set(texture.name, new Texture(texture.name, texture.atlas, texture.image));
        // }

        // // Get all the animations from the config json file
        // for (const anim of data.assets.textures) {
        // }
        // console.log(data.assets.animation);

        // // for (const texture of data.assets.animation)

        // console.log(this.#textureMap);
    }

    // addTexture(name, path) {}
    addAnimation(name, animation) {}
    addFont(name, path) {}
    getTexture(name) {}
    getAnimation(name) {}
    getFont(name) {}
}

export { Assets };
