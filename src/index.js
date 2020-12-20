import Phaser from 'phaser';

import monumentValley from './assets/fonts/MonumentValley.otf';
import COLORS from './COLORS.js';
import load from './scenes/load.js';
import menu from './scenes/menu.js';
import main from './scenes/main/main.js';


// Weird little workaround to get fonts to work.
let element = document.createElement('style');
document.head.appendChild(element);
let sheet = element.sheet;
let styles = `@font-face { font-family: "monument-valley"; src: url("${monumentValley}") format("opentype"); }\n`;
sheet.insertRule(styles, 0);
let div = document.createElement('div');
div.style = 'font-family: monument-valley; position: absolute; left:-1000px; visibility:hidden;';
div.innerHTML = 'hello WORLD';
document.body.appendChild(div);


const config = {
  type: Phaser.WEBGL,
  width: 1920,
  height: 1080,
  render: { batchSize: 4096 },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: document.body,
  },
  input: { gamepad: true },
  scene: [ load, menu, main ],
};

const game = new Phaser.Game(config);

