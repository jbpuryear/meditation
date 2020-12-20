import Phaser from 'phaser';

const PADDING = 40;
const SPACING = 16;
const SIZE = 32;


export default class HealthMeter {
  constructor(scene, maxHealth) {
    const colors = scene.game.registry.get('theme');
    this.maxHealth = maxHealth;
    this.hearts = new Array(maxHealth);
    for (let i = 0; i < maxHealth; ++i) {
      let heart = scene.make.image({ x: PADDING + (SIZE + SPACING) * i, y: PADDING, key: 'spritesheet', frame: 'heart' });
      heart.displayWidth = SIZE;
      heart.displayHeight = SIZE;
      heart.tint = colors.PLAYER;
      this.hearts[i] = heart;
    }
  }

  setHealth(health) {
    for (let i = 0, c = this.hearts.length; i < c; ++i) {
      let heart = this.hearts[i];
      if (health >= 1) {
        heart.setFrame('heart');
        heart.visible = true;
        health--;
        continue;
      }
      if (health === 0.75) {
        heart.setFrame('heart3');
        heart.visible = true;
      } else if (health === 0.5) {
        heart.setFrame('heart2');
      } else if (health === 0.25) {
        heart.setFrame('heart1');
        heart.visible = true;
      } else {
        heart.visible = false;
      }
      health = 0;
    }
  }
}

