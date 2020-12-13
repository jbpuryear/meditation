import Phaser from 'phaser';
import BulletManager from './BulletManager.js';
import isWithin from '../../Utils/isWithin.js';

//textures
import circle from '../../assets/circle.png';
import shadow from '../../assets/shadow.png';
import noise from '../../assets/noise.png';
import shield from '../../assets/shield.png';
import COLORS from '../../COLORS.js'

const PLAYER_SPEED = 150;
const PLAYER_RADIUS = 1;
const BULLET_SPEED = 150;
const DEAD_ZONE = 0.2;
const MIN_ATTACK_DIST = 128;
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
const HEALTH_PICKUP_RAD = 32;


class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'main' });
    this.frag = null;
    this.noise = null;
    this.player = null;
    this.shield = null;
    this.timeScaleTween = null;
    this.shieldTween = null;
    this.healthPickup = null;
    this.healthMeter = null;
    this.keys = null;
    this.bounds = new Phaser.Math.Vector2();
    this.inputv = new Phaser.Math.Vector2();
    this.shieldRadius = 0;
    this.isShieldOn = false;
    this.timeScale = 1;
    this.health = MAX_HEALTH;
  }


  preload() {
    this.load.image('circle', circle);
    this.load.image('shadow', shadow);
    this.load.image('noise', noise);
    this.load.image('shield', shield);
  }


  create() {
    this.bounds.setTo(this.game.scale.gameSize.width, this.game.scale.gameSize.height);
    this.keys = {
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    let n = this.add.tileSprite(0, 0, this.bounds.x, this.bounds.y, 'noise');
    n.setOrigin(0);
    n.alpha = 0.2;

    this.bulletManager = new BulletManager(this);
    this.add.existing(this.bulletManager.miasma);
    this.add.existing(this.bulletManager.bulletShadows);

    this.healthPickup = this.add.image(0, 0, 'shield');
    this.healthPickup.displayWidth = 48;
    this.healthPickup.displayHeight = 48;
    this.healthPickup.tint = COLORS.PLAYER;
    this.spawnHealthPickup();

    this.player = this.add.image(40, 40, 'circle');
    this.player.tint = COLORS.PLAYER;

    this.shield = this.add.image(0, 0, 'shield');
    this.shield.tint = COLORS.PLAYER;
    this.shield.visible = false;
    this.shieldTween = this.tweens.addCounter({
      from: 0.1,
      to: 1,
      duration: 300,
      onUpdate: this.updateShield,
      onUpdateScope: this,
      onComplete: this.stopShield,
      onCompleteScope: this,
      ease: Phaser.Math.Easing.Quintic.InOut,
    });
    this.shieldTween.pause();

    this.timeScaleTween = this.tweens.create({
      targets: [this, this.time],
      timeScale: { from: 0.05, to: 1 },
      duration: 5000,
      ease: Phaser.Math.Easing.Expo.In,
    });

    this.add.existing(this.bulletManager.bulletSprites);
    this.add.existing(this.bulletManager.frag);

    let miasmaCam = this.cameras.add();
    miasmaCam.ignore([n, this.player, this.shield, this.bulletManager.bulletSprites, this.bulletManager.frag]);
    this.cameras.main.ignore([this.bulletManager.miasma, this.bulletManager.bulletShadows]);
    //Swap render order.
    this.cameras.cameras.push(this.cameras.cameras.shift());

    this.noise = this.make.tileSprite({ x: 0, y: 0, width: this.bounds.x, height: this.bounds.y, key: 'noise'}, false);
    this.noise.tileScaleX = 2;
    this.noise.tileScalY = 1.5;
    this.noise.setOrigin(0, 0);
    miasmaCam.setMask(new Phaser.Display.Masks.BitmapMask(this, this.noise));

    this.time.addEvent({
      delay: 50,
      callback: attackLoop,
      callbackScope: this,
    });

    this.shieldRadius = 0;
    this.isShieldOn = false;
    this.timeScale = 1;
    this.health = MAX_HEALTH;
    this.time.timeScale = 1;

    this.healthMeter = this.add.text(20, 20, this.health.toString(), { color: '#000' });
  }


  update(_, dt) {
    let secs = dt / 1000;
    let scaledDt = dt * this.timeScale;
    let shieldOn = this.isShieldOn;
    this.noise.tilePositionX += dt / 20;
    this.noise.tilePositionY += dt / 40;

    this.updateInput();

    if (this.inputv.x || this.inputv.y) {
      this.player.x += this.inputv.x * PLAYER_SPEED * secs;
      this.player.y += this.inputv.y * PLAYER_SPEED * secs;
      this.player.x = Math.max(PLAYER_RADIUS, this.player.x);
      this.player.x = Math.min(this.bounds.x - PLAYER_RADIUS, this.player.x);
      this.player.y = Math.max(PLAYER_RADIUS, this.player.y);
      this.player.y = Math.min(this.bounds.y - PLAYER_RADIUS, this.player.y);
      this.playerStoppedTimer = 0;
    } else {
      this.playerStoppedTimer += dt;
    }

    if (this.healthPickup.visible
          && isWithin(this.healthPickup.x, this.healthPickup.y, this.player.x, this.player.y, HEALTH_PICKUP_RAD + PLAYER_RADIUS)) {
      this.onHealthPickup();
    }

    // TODO This will break if player is ever able to step outside shield.
    let target = shieldOn ? this.shield : this.player;
    let px = target.x;
    let py = target.y;
    let hitRadius = shieldOn ? this.shieldRadius : PLAYER_RADIUS;
    let hasHit = this.bulletManager.updateAndCollide(scaledDt, px, py, hitRadius);
    if (!this.isShieldOn && hasHit) {
      this.health -= 1;
      if (this.health <= 0) {
        this.gameOver();
      }
      this.startShield(this.player.x, this.player.y);
    }
    this.healthMeter.text = this.health.toString();
  }


  updateInput() {
    let pad = this.input.gamepad.total > 0 ? this.input.gamepad.getPad(0) : null;
    let x = 0;
    let y = 0;
    this.inputv.setTo(0);
    if (this.keys.a.isDown || this.keys.left.isDown
         || (pad && pad.left)) {
      x = -1;
    }
    if (this.keys.d.isDown || this.keys.right.isDown
         || (pad && pad.right)) {
      x += 1;
    }
    if (this.keys.w.isDown || this.keys.up.isDown
         || (pad && pad.up)) {
      y = -1;
    }
    if (this.keys.s.isDown || this.keys.down.isDown
         || (pad && pad.down)) {
      y += 1;
    }
    if (pad && pad.axes.length > 0) {
      let padX = pad.axes[0].getValue();
      let padY = pad.axes[1].getValue();
      if (padX*padX + padY*padY > DEAD_ZONE*DEAD_ZONE) {
        x = padX;
        y = padY;
      }
    }
    this.inputv.set(x, y);
    this.inputv.limit(1);
  }


  gameOver() {
    this.time.removeAllEvents();
    this.scene.restart();
  }


  spawnBullet(x, y, vx, vy) {
    if (this.isShieldOn && isWithin(x, y, this.player.x, this.player.y, this.shieldRadius)) {
      return null;
    }
    return this.bulletManager.spawn(x, y, vx, vy);
  }


  spawnHealthPickup() {
    this.healthPickup.x = this.bounds.x * Math.random();
    this.healthPickup.y = this.bounds.y * Math.random();
    this.healthPickup.visible = true;
  }


  onHealthPickup() {
    this.healthPickup.visible = false;
    this.health += 0.25;
    this.time.addEvent({
      delay: 400,
      callback: this.spawnHealthPickup,
      callbackScope: this,
    });
  }


  startShield(x, y) {
    this.isShieldOn = true;
    this.shield.setScale(0);
    this.shield.x = x;
    this.shield.y = y;
    this.shield.visible = true;
    if (this.shieldTween.isPlaying()) {
      this.shieldTween.restart();
    } else {
      this.shieldTween.play();
    }
  }


  stopShield() {
    this.isShieldOn = false;
    this.shield.visible = false;
    if (this.timeScaleTween.isPlaying()) {
      this.timeScaleTween.restart();
    } else {
      this.timeScaleTween.play();
    }
  }


  updateShield(tween) {
    let val = tween.getValue(); 
    this.shield.alpha = 1 - (val * 0.8);
    let r = val * SHIELD_RADIUS;
    this.shield.displayWidth = r * 2;
    this.shield.displayHeight = r * 2;
    this.shieldRadius = r;
  }
}


function attackLoop() {
  let x = 0;
  let y = 0;
  let tries = 0;
  do {
    x = Math.random() * this.bounds.x;
    y = Math.random() * this.bounds.y;
    ++tries;
  } while (isWithin(x, y, this.player.x, this.player.y, MIN_ATTACK_DIST) && tries < 10); // Capping tries isn't just defensive, it's paranoid programming!
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
      scn.spawnBullet(x, y, vx, vy);
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
    scn.spawnBullet(x, y, vx, vy);
    angle += spread;
  }
  c();
  scn.time.addEvent({
    delay: SPIRAL_INTERVAL,
    repeat: count - 1,
    callback: c,
  });
}

export default new MainScene();

