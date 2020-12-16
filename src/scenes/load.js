import Phaser from 'phaser';

//textures
import circle from '../assets/circle.png';
import bigCircle from '../assets/big-circle.png';
import shadow from '../assets/shadow.png';
import noise from '../assets/noise.png';
import shield from '../assets/shield.png';
import breathe from '../assets/breathe.png';


class LoadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'boot' });
  }

  preload() {
    this.load.image('circle', circle);
    this.load.image('big-circle', bigCircle);
    this.load.image('shadow', shadow);
    this.load.image('noise', noise);
    this.load.image('shield', shield);
    this.load.image('breathe', breathe);
  }

  create() {
    this.cameras.main.fadeOut(0, 255, 255, 255);
    this.scene.start('menu');
  }
}


export default new LoadScene();

