import Phaser from 'phaser';
import spritesheet from '../assets/spritesheet.png';
import start from '../assets/audio/start.ogg';
import blip from '../assets/audio/blip.ogg';
import hit from '../assets/audio/hit.ogg';
import gameOver from '../assets/audio/game-over.ogg';
import pickup from '../assets/audio/pickup.ogg';
import balance from '../assets/audio/Komiku_-_01_-_Balance.ogg';
import chill from '../assets/audio/Komiku_-_02_-_Chill_Out_Theme.ogg';
import atlas from '../assets/sprites.json';
import COLORS from '../COLORS.js';


class LoadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'boot' });
  }

  preload() {
    let progress = this.add.text(this.game.scale.gameSize.width/2, this.game.scale.gameSize.height/2, 'Loading...', { fontSize: '32px' });
    progress.setOrigin(0.5);
    this.load.on('progress', (val) => { progress.text = `Loading... ${Math.floor(val)}%`; });
    this.load.atlas('spritesheet', spritesheet, atlas);
    this.load.audio('start', start);
    this.load.audio('blip', blip);
    this.load.audio('hit', hit);
    this.load.audio('game-over', gameOver);
    this.load.audio('pickup', pickup);
    this.load.audio('balance', balance);
    this.load.audio('chill', chill);
  }

  create() {
    this.game.registry.set('theme', COLORS.DEFAULT);
    this.game.registry.set('difficulty', 1);
    this.scene.start('menu');
  }
}


export default new LoadScene();
