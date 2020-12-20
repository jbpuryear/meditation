import FixParticleEmitter from './FixParticleEmitter.js';
import List from '../../Utils/List.js';
import isWithin from '../../Utils/isWithin.js';

const BULLET_POOL_SIZE = 2000;
const BULLET_RADIUS = 16;
const MIASMA_PER_BULLET = 8;
const MIASMA_LIFESPAN = 500;
const MIASMA_EMIT_INTERVAL = MIASMA_LIFESPAN / MIASMA_PER_BULLET;
const MAX_MIASMA_PARTICLES = 10000;
const MAX_FRAG_PARTICLES = 5000;


class Bullet {
  constructor(spriteBob, shadowBob, emitter) {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.miasma = emitter;
    this.miasmaTimer = 0;
    this.sprite = spriteBob;
    this.shadow = shadowBob;
    this.prev = null;           // For list insertion
    this.next = null;
  }

  kill() {
    this.sprite.visible = false;
    this.shadow.visible = false;
  }

  reset(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.sprite.visible = true;
    this.shadow.visible = true;
    this.miasmaTimer = MIASMA_EMIT_INTERVAL;
  }

  update(dt) {
    this.miasmaTimer -= dt;
    if (this.miasmaTimer <= 0) {
      this.miasma.emitParticleAt(this.x, this.y, 1);
      this.miasmaTimer = MIASMA_EMIT_INTERVAL;
    }
    dt /= 1000;
    this.x = this.shadow.x = this.sprite.x = this.x + this.vx * dt;
    this.y = this.shadow.y = this.sprite.y = this.y + this.vy * dt;
  }
}


export default class BulletManager {
  constructor(scene) {
    const colors = scene.game.registry.get('theme');
    this.bounds = {
      x: scene.game.scale.gameSize.width,
      y: scene.game.scale.gameSize.height
    };

    this.deadBullets = [];
    this.liveBullets = new List();

    this.miasma = scene.make.particles({ key: 'spritesheet', frame: 'circle' });
    this.miasma.addEmitter(new FixParticleEmitter(this.miasma, {
      lifespan: MIASMA_LIFESPAN,
      on: false,
      maxParticles: MAX_MIASMA_PARTICLES,
      scale: { start: 1.5, end: 0.1, ease: 'Circular.InOut' },
      speed: { min: 0, max: 60 },
      tint: colors.MIASMA,
    }));

    this.bulletShadows = scene.make.blitter({ key: 'spritesheet', frame: 'shadow' }, false);
    this.bulletSprites = scene.make.blitter({ key: 'spritesheet', frame: 'circle' }, false);
    //This next part is a hack to fix bobs not using the correct origin.
    let t = scene.game.textures.get('spritesheet').get('circle');
    this.bulletSprites.x -= t.width/2;
    this.bulletSprites.y -= t.height/2;
    t = scene.game.textures.get('spritesheet').get('shadow');
    this.bulletShadows.x -= t.width/2;
    this.bulletShadows.y -= t.height/2;

    this.frag = scene.make.particles({ key: 'spritesheet', frame: 'circle' });
    this.frag.addEmitter(new FixParticleEmitter(this.frag, {
      lifespan: { min: 100, max: 300 },
      on: false,
      maxParticles: MAX_FRAG_PARTICLES,
      quantity: 10,
      scale: { start: 1.2, end: 0.1, ease: 'Circular.InOut' },
      speed: { min: 100, max: 200 },
      tint: colors.BULLET,
    }));

    // Another hack to get around a Phaser bug. Blitter Bob tints have their rgb reversed.
    let miasmaColor = ((colors.MIASMA & 0xff0000) >> 16) | (colors.MIASMA & 0xff00) | ((colors.MIASMA & 0xff) << 16);
    let bulletColor = ((colors.BULLET & 0xff0000) >> 16) | (colors.BULLET & 0xff00) | ((colors.BULLET & 0xff) << 16);
    for (let i = 0; i < BULLET_POOL_SIZE; ++i) {
      let shadow = this.bulletShadows.create(0, 0);
      shadow.tint = miasmaColor;
      let sprite = this.bulletSprites.create(0, 0);
      sprite.tint = bulletColor;
      let b = new Bullet(sprite, shadow, this.miasma);
      b.kill();
      this.deadBullets.push(b);
    }
  }


  updateAndCollide(dt, x, y, radius) {
    let b = this.liveBullets.tail;
    let br = BULLET_RADIUS;
    let hasCollided = false;
    while(b) {
      let b2 = b.prev;
      b.update(dt);
      if (b.x < -br || b.x > this.bounds.x + br || b.y < -br || b.y > this.bounds.y + br) {
        this.killBullet(b, false);
      } else {
        if (isWithin(x, y, b.x, b.y, radius + BULLET_RADIUS)) {
          this.killBullet(b);
          hasCollided = true;
        }
      }
      b = b2;
    }
    return hasCollided;
  }


  collide(x, y, r) {
    let b = this.liveBullets.tail;
    let hasCollided = false;
    while(b) {
      let b2 = b.prev;
        if (isWithin(x, y, b.x, b.y, r + BULLET_RADIUS)) {
          this.killBullet(b);
          hasCollided = true;
        }
      b = b2;
    }
    return hasCollided;
  }


  spawn(x, y, vx, vy) {
    let b = this.deadBullets.pop()
    if (!b) {
      b = this.liveBullets.shift()
      b.kill();
    }
    b.reset(x, y, vx, vy);
    this.liveBullets.push(b);
    return b;
  }


  killBullet(b, particles) {
    if (particles === undefined) { particles = true; }
    b.kill();
    if (particles) { this.frag.emitParticleAt(b.x, b.y); }
    this.liveBullets.remove(b);
    this.deadBullets.push(b);
  }
}

