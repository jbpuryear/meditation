import Phaser from 'phaser';
import isWithin from '../../Utils/isWithin.js';


const SIZE = 48;
const PART_FREQ = 100;
const SPEED = 20 / 1000;
const LIFETIME = 10000;


export default class HealthPickup extends Phaser.GameObjects.Image {
  constructor(scene) {
    super(scene, 0, 0, 'spritesheet', 'heart');
    const colors = scene.game.registry.get('theme');
    this.displayWidth = SIZE;
    this.displayHeight = SIZE;
    this.tint = colors.PLAYER;
    this.vx = 0;
    this.vy = 0;
    this.lifetime = LIFETIME;
    this.bounds = scene.bounds;
    this.miasma = scene.make.particles({ key: 'spritesheet', frame: 'heart' });
    this.frag = scene.make.particles({ key: 'spritesheet', frame: 'heart' });
    this.parts = this.miasma.createEmitter({
      lifespan: 2000,
      scale: { start: 0.75, end: 0.1, ease: 'Circular.InOut' },
      speed: { min: 0, max: 30 },
      tint: colors.PLAYER,
      frequency: 500/2,
      follow: this,
    });
    this.fragParts = this.frag.createEmitter({
      lifespan: { min: 200, max: 500 },
      scale: { start: 0.75, end: 0.1, ease: 'Circular.InOut' },
      speed: { min: 40, max: 80 },
      tint: colors.PLAYER,
      quantity: 20,
      on: false,
      follow: this,
    });
  }


  update(dt) {
    if (!this.visible) { return; }
    this.lifetime -= dt;
    this.alpha = this.lifetime / LIFETIME;
    if (this.lifetime < 0) {
      this.kill();
      return;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < 0 || this.x > this.bounds.x || this.y < 0 || this.y > this.bounds.y) {
      this.kill();
    }
  }


  collide(x, y, r) {
    if (!this.visible) { return false; }
    let collided = isWithin(this.x, this.y, x, y, r + SIZE/3);
    if (collided) {
      this.fragParts.explode();
      this.kill();
    }
    return collided;
  }


  spawn(x, y) {
    this.x = this.bounds.x * 0.8 * Math.random() + this.bounds.x * 0.1;
    this.y = this.bounds.y * 0.8 * Math.random() + this.bounds.y * 0.1;
    this.visible = true;
    this.parts.flow(PART_FREQ);
    
    let theta = Math.PI * 2 * Math.random();
    this.vx = Math.cos(theta) * SPEED;
    this.vy = Math.sin(theta) * SPEED;

    this.lifetime = LIFETIME;
  }


  kill() {
    this.visible = false;
    this.parts.on = false;
    this.emit('killed');
  }
}

