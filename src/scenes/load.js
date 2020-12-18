import Phaser from 'phaser';
import spritesheet from '../assets/spritesheet.png';
import atlas from '../assets/sprites.json';


class LoadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'boot' });
  }

  preload() {
    this.load.atlas('spritesheet', spritesheet, atlas);
  }

  create() {
    this.scene.start('menu');
  }
}


export default new LoadScene();

