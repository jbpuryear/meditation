import Phaser from 'phaser';

import COLORS from './COLORS.js';
import main from './scenes/main/main.js';


const config = {
  type: Phaser.WEBGL,
  width: 1920,
  height: 1080,
  backgroundColor: COLORS.BACKGROUND,
  render: { batchSize: 4096 },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: document.body,
  },
  input: { gamepad: true },
  scene: main,
};

const game = new Phaser.Game(config);


