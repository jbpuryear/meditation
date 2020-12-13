import Phaser from 'phaser';
import FixParticleEmitter from './FixParticleEmitter.js';
import List from '../../Utils/List.js';

//textures
import circle from '../../assets/circle.png';
import shadow from '../../assets/shadow.png';
import noise from '../../assets/noise.png';
import shield from '../../assets/shield.png';
import COLORS from '../../COLORS.js'

const BULLET_POOL_SIZE = 2000;
const BULLET_RADIUS = 16;
const BULLET_SPEED = 150;
const PLAYER_SPEED = 150;
const PLAYER_RADIUS = 1;
const DEAD_ZONE = 0.2;
const MIASMA_PER_BULLET = 8;
const MIASMA_LIFESPAN = 500;
const MIASMA_EMIT_INTERVAL = MIASMA_LIFESPAN / MIASMA_PER_BULLET;
const MAX_MIASMA_PARTICLES = 10000;
const MAX_FRAG_PARTICLES = 5000;
const MIN_ATTACK_DIST_SQ = 32 * 32;
const ATTACK_TIME_MAX = 1200;
const ATTACK_TIME_MIN = 40;
const CIRCLE_ATTACK_MIN = 6;
const CIRCLE_ATTACK_MAX = 16;
const CIRCLE_INTERVAL = 400;
const SPIRAL_ATTACK_MIN = 16;
const SPIRAL_ATTACK_MAX = 64;
const SPIRAL_INTERVAL = 150;
const SHIELD_DURATION = 4000;
const SHIELD_RADIUS = 256;
const MAX_HEALTH = 3;


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


class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'main' });
    this.bounds = new Phaser.Math.Vector2();
    this.inputv = new Phaser.Math.Vector2();
    this.frag = null;
    this.noise = null;
    this.deadBullets = [];
    this.liveBullets = new List();
    this.player = null;
    this.shield = null;
    this.shieldRadius = 0;
    this.isShieldOn = false;
    this.shieldTween = null;
  }


  preload() {
    this.load.image('circle', circle);
    this.load.image('shadow', shadow);
    this.load.image('noise', noise);
    this.load.image('shield', shield);
  }


  create() {
    this.bounds.setTo(this.game.scale.gameSize.width, this.game.scale.gameSize.height);

    let miasma = this.add.particles('circle');
    miasma.addEmitter(new FixParticleEmitter(miasma, {
      lifespan: MIASMA_LIFESPAN,
      on: false,
      maxParticles: MAX_MIASMA_PARTICLES,
      scale: { start: 1.5, end: 0.1, ease: 'Circular.InOut' },
      speed: { min: 0, max: 60 },
      tint: COLORS.MIASMA,
    }));
    
    this.player = this.add.image(40, 40, 'circle');
    this.player.tint = COLORS.PLAYER;

    let bulletSprites = this.add.blitter(0, 0, 'circle');
    let bulletShadows = this.add.blitter(0, 0, 'shadow');
    //This next part is a hack to fix bobs not using the correct origin.
    let t = this.game.textures.get('circle').get();
    bulletSprites.x -= t.width/2;
    bulletSprites.y -= t.height/2;
    t = this.game.textures.get('shadow').get();
    bulletShadows.x -= t.width/2;
    bulletShadows.y -= t.height/2;

    this.shield = this.add.image(0, 0, 'shield');
    this.shield.tint = COLORS.PLAYER;
    this.shield.visible = false;
    let expandTime = 300;
    let flickTime = 3000;
    let shieldFlicker = this.tweens.addCounter({
      from: 1,
      to: 0.2,
      duration: flickTime,
      onUpdate: this.updateShield,
      onUpdateScope: this,
      onComplete: this.stopShield,
      onCompleteScope: this,
      ease: Phaser.Math.Easing.Quadratic.In,
    });
    shieldFlicker.pause();
    this.shieldTween = this.tweens.addCounter({
      duration: expandTime,
      onUpdate: this.updateShield,
      onUpdateScope: this,
      onComplete: shieldFlicker.play,
      onCompleteScope: shieldFlicker,
      ease: Phaser.Math.Easing.Quintic.Out,
    });
    this.shieldTween.pause();

    this.frag = this.add.particles('circle');
    this.frag.addEmitter(new FixParticleEmitter(this.frag, {
      //alpha: 0.3,
      lifespan: { min: 100, max: 300 },
      on: false,
      maxParticles: MAX_FRAG_PARTICLES,
      quantity: 10,
      scale: { start: 1.2, end: 0.1, ease: 'Circular.InOut' },
      speed: { min: 100, max: 200 },
      tint: COLORS.BULLET,
    }));

    let miasmaCam = this.cameras.add();
    miasmaCam.ignore([this.player, bulletSprites, this.frag]);
    this.cameras.main.ignore([miasma, bulletShadows, this.shield]);
    //Swap render order.
    this.cameras.cameras.push(this.cameras.cameras.shift());

    this.noise = this.make.tileSprite({ x: 0, y: 0, width: this.bounds.x, height: this.bounds.y, key: 'noise'}, false);
    this.noise.tileScaleX = 2;
    this.noise.tileScalY = 1.5;
    this.noise.setOrigin(0, 0);
    miasmaCam.setMask(new Phaser.Display.Masks.BitmapMask(this, this.noise));

    // Another hack to get around a Phaser bug. Blitter Bob tints have their rgb reversed.
    let miasmaColor = ((COLORS.MIASMA & 0xff0000) >> 16) | (COLORS.MIASMA & 0xff00) | ((COLORS.MIASMA & 0xff) << 16);
    let bulletColor = ((COLORS.BULLET & 0xff0000) >> 16) | (COLORS.BULLET & 0xff00) | ((COLORS.BULLET & 0xff) << 16);
    for (let i = 0; i < BULLET_POOL_SIZE; ++i) {
      let sprite = bulletSprites.create(0, 0);
      sprite.tint = bulletColor;
      let shadow = bulletShadows.create(0, 0);
      shadow.tint = miasmaColor;
      let b = new Bullet(sprite, shadow, miasma);
      b.kill();
      this.deadBullets.push(b);
    }

    this.time.addEvent({
      delay: 50,
      callback: attackLoop,
      callbackScope: this,
    });
  }


  update(_, dt) {
    let secs = dt / 1000;
    let shieldOn = this.isShieldOn;
    this.noise.tilePositionX += dt / 20;
    this.noise.tilePositionY += dt / 40;

    if (this.input.gamepad.total > 0) {
      let pad = this.input.gamepad.getPad(0);
      if (pad.axes.length) {
        this.inputv.set(pad.axes[0].getValue(), pad.axes[1].getValue());
        if (this.inputv.length() > DEAD_ZONE) {
          this.inputv.limit(1)
          this.player.x += this.inputv.x * PLAYER_SPEED * secs;
          this.player.y += this.inputv.y * PLAYER_SPEED * secs;
        }
      }
    }
    if (shieldOn) {
      this.shield.x = this.player.x;
      this.shield.y = this.player.y;
    }

    let c = 0;
    let b = this.liveBullets.tail;
    let px = this.player.x;
    let py = this.player.y;
    let hit = BULLET_RADIUS + (shieldOn ? this.shieldRadius : PLAYER_RADIUS);
    let br = BULLET_RADIUS;
    while(b) {
      c++;
      let b2 = b.prev;
      b.update(dt);
      if (b.x < -br || b.x > this.bounds.x + br || b.y < -br || b.y > this.bounds.y + br) {
        this.killBullet(b);
      } else {
        if (isWithin(px, py, b.x, b.y, hit)) {
          this.killBullet(b);
          this.frag.emitParticleAt(b.x, b.y);
          if (!shieldOn) {
            // TODO Player health
            this.startShield();
          }
        }
      }
      b = b2;
    }
  }


  spawn(x, y, vx, vy) {
    if (this.isShieldOn && isWithin(x, y, this.player.x, this.player.y, BULLET_RADIUS + this.shieldRadius)) {
      return null;
    }
    let b = this.deadBullets.pop()
    if (!b) {
      b = this.liveBullets.shift()
      b.kill();
    }
    b.reset(x, y, vx, vy);
    this.liveBullets.push(b);
    return b;
  }


  killBullet(b) {
    b.kill();
    this.liveBullets.remove(b);
    this.deadBullets.push(b);
  }


  startShield() {
    this.isShieldOn = true;
    this.shield.visible = true;
    this.shield.setScale(0);
    this.shieldTween.play();
  }


  stopShield() {
    this.isShieldOn = false;
    this.shield.visible = false;
  }


  updateShield(tween) {
    let val = tween.getValue(); 
    this.shield.alpha = val;
    let r = val * SHIELD_RADIUS;
    this.shield.displayWidth = r * 2;
    this.shield.displayHeight = r * 2;
    this.shieldRadius = r;
  }
}


function isWithin(x, y, x2, y2, dist) {
  let dx = x - x2;
  let dy = y - y2;
  return dx*dx + dy*dy < dist*dist;
}


function attackLoop() {
  let x = 0;
  let y = 0;
  let tries = 0;
  do {
    x = Math.random() * this.bounds.x;
    y = Math.random() * this.bounds.y;
    ++tries;
  } while (isWithin(x, y, this.player.x, this.player.y && tries < 10)); // Capping tries isn't just defensive, it's paranoid programming!
  let roll = Math.random();
  if (roll > 0.25) {
    circleAttack(this, x, y);
  } else {
    spiralAttack(this, x, y);
  }
  this.time.addEvent({
    delay: Math.random() * (ATTACK_TIME_MAX - ATTACK_TIME_MIN) + ATTACK_TIME_MIN,
    callback: attackLoop,
    callbackScope: this,
  });
}

function circleAttack(scn, x, y) {
  let count = Math.floor(Math.random() * (CIRCLE_ATTACK_MAX - CIRCLE_ATTACK_MIN)) + CIRCLE_ATTACK_MIN;
  function c() {
    for (let i = 0; i < count; ++i) {
      let angle = i * 2 * Math.PI / count;
      let vx = Math.cos(angle) * BULLET_SPEED;
      let vy = Math.sin(angle) * BULLET_SPEED;
      scn.spawn(x, y, vx, vy);
    }
  }
  let i = Math.floor(Math.random() * 2);
  c();
  if (i > 0) {
    scn.time.addEvent({
      delay: CIRCLE_INTERVAL,
      repeat: i,
      callback: c,
    });
  }
}

function spiralAttack(scn, x, y) {
  let count = Math.floor(Math.random() * (SPIRAL_ATTACK_MAX - SPIRAL_ATTACK_MIN)) + SPIRAL_ATTACK_MIN;
  let spread = Math.random() * Math.PI * 14/16 + Math.PI/16;
  let angle = Math.random() * 2 * Math.PI;
  function c() {
    let vx = Math.cos(angle) * BULLET_SPEED;
    let vy = Math.sin(angle) * BULLET_SPEED;
    scn.spawn(x, y, vx, vy);
    angle += spread;
  }
  scn.time.addEvent({
    delay: SPIRAL_INTERVAL,
    repeat: count,
    callback: c,
  });
}

export default new MainScene();

