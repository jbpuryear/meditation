import Phaser from 'phaser';
import spritesheet from '../assets/spritesheet.png';
import atlas from '../assets/sprites.json';
import COLORS from '../COLORS.js';


class LoadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'boot' });
  }

  preload() {
    this.load.atlas('spritesheet', spritesheet, atlas);
  }

  create() {
    this.game.registry.set('theme', COLORS.DEFAULT);
    this.game.registry.set('difficulty', 1);
    this.scene.start('menu');
  }
}


export default new LoadScene();

