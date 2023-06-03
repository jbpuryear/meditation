import Phaser from 'phaser';
import spritesheet from '../assets/spritesheet.png';
import atlas from '../assets/sprites.json';
import start from '../assets/audio/start.ogg';
import startMp3 from '../assets/audio/start.mp3';
import blip from '../assets/audio/blip.ogg';
import blipMp3 from '../assets/audio/blip.mp3';
import hit from '../assets/audio/hit.ogg';
import hitMp3 from '../assets/audio/hit.mp3';
import gameOver from '../assets/audio/game-over.ogg';
import gameOverMp3 from '../assets/audio/game-over.mp3';
import pickup from '../assets/audio/pickup.ogg';
import pickupMp3 from '../assets/audio/pickup.mp3';
import balance from '../assets/audio/Komiku_-_01_-_Balance.ogg';
import balanceMp3 from '../assets/audio/Komiku_-_01_-_Balance.mp3';
import chill from '../assets/audio/Komiku_-_02_-_Chill_Out_Theme.ogg';
import chillMp3 from '../assets/audio/Komiku_-_02_-_Chill_Out_Theme.mp3';
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
    this.load.audio('start', [ start, startMp3 ]);
    this.load.audio('blip', [ blip, blipMp3 ]);
    this.load.audio('hit', [ hit, hitMp3 ]);
    this.load.audio('game-over', [ gameOver, gameOverMp3 ]);
    this.load.audio('pickup', [ pickup, pickupMp3 ]);
    this.load.audio('balance', [ balance, balanceMp3 ]);
    this.load.audio('chill', [ chill, chillMp3 ]);
  }

  create() {
    this.game.registry.set('theme', COLORS.DEFAULT);
    this.game.registry.set('difficulty', 1);
    this.scene.start('menu');
  }
}


export default new LoadScene();
