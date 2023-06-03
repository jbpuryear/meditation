import Phaser from 'phaser';
import UI from '../../UI/UI.js';
import InputMap from '../../InputMap.js';
import BulletManager from './BulletManager.js';
import HealthMeter from './HealthMeter.js';
import HealthPickup from './HealthPickup.js';
import isWithin from '../../Utils/isWithin.js';

const PLAYER_SPEED = 150;
const PLAYER_RADIUS = 4;
const PLAYER_PICKUP_RADIUS = 16;
const BULLET_SPEED = 150;
const MIN_ATTACK_DIST = 160;
const CIRCLE_ATTACK_MIN = 6;
const CIRCLE_ATTACK_MAX = 16;
const CIRCLE_INTERVAL = 400;
const SPIRAL_ATTACK_MIN = 16;
const SPIRAL_ATTACK_MAX = 64;
const SPIRAL_INTERVAL = 150;
const SHIELD_RADIUS = 256;
const MAX_HEALTH = 5;
const START_HEALTH = 3;


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
    this.bounds = new Phaser.Math.Vector2();
    this.shieldRadius = 0;
    this.isShieldOn = false;
    this.timeScale = 1;
    this.health = START_HEALTH;
    this.attackTimeMin = 0;
    this.atackTimeMax = 0;
    this.inputMap = null;
    this.pauseScreen = null;
    this.menu = null;
    this.state = 'RUNNING';
    // Let's us update input for a couple frames so we don't have false button presses when switching scenes.
    this.frame = 0;
  }


  create() {
    this.frame = 0;
    this.state = 'INPUT_FIX';
    this.inputMap = new InputMap(this);
    this.frame = 0;
    const colors = this.game.registry.get('theme');
    const diff = this.game.registry.get('difficulty');
    switch (diff) {
      case 0:
        this.attackTimeMin = 400;
        this.attackTimeMax = 4000;
        break;
      case 1:
        this.attackTimeMin = 80;
        this.attackTimeMax = 1600;
        break;
      case 2:
        this.attackTimeMin = 40;
        this.attackTimeMax = 1200;
        break;
    }

    this.mySounds = {
      start: this.sound.add('start'),
      blip: this.sound.add('blip', { volume: 0.4 }),
      pickup: this.sound.add('pickup', { volume: 1 }),
      hit: this.sound.add('hit', { volume: 0.6 }),
      gameOver: this.sound.add('game-over', { volume: 0.8 }),
      chill: this.sound.add('chill'),
    }

    this.bounds.setTo(this.game.scale.gameSize.width, this.game.scale.gameSize.height);
    this.shieldRadius = 0;
    this.isShieldOn = false;
    this.timeScale = 1;
    this.health = START_HEALTH;
    this.time.timeScale = 1;

    this.bulletManager = new BulletManager(this);
    this.add.existing(this.bulletManager.miasma);
    this.add.existing(this.bulletManager.bulletShadows);

    this.healthPickup = new HealthPickup(this);
    this.healthPickup.kill();
    this.add.existing(this.healthPickup);
    this.add.existing(this.healthPickup.miasma);
    this.add.existing(this.healthPickup.frag);
    this.healthPickup.addListener('killed', this.startHealthSpawnTimer, this);
    this.startHealthSpawnTimer();

    this.player = this.add.image(this.bounds.x/2, this.bounds.y * 2/3, 'spritesheet', 'circle');
    this.player.tint = colors.PLAYER;

    this.shield = this.add.image(0, 0, 'spritesheet', 'shield');
    this.shield.tint = colors.PLAYER;
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
    let sparks = this.add.particles('spritesheet', 'circle');
    this.shieldSparkles = sparks.createEmitter({
      lifespan: { min: 40, max: 1000 },
      on: false,
      scale: { start: 0.3, end: 0.1, ease: 'Circular.InOut' },
      alpha: { start: 1, end: 0.1, ease: 'Circular.InOut' },
      speed: { min: 0, max: 100 },
      tint: colors.PLAYER,
      quantity: 100,
      emitZone: {
        type: 'edge',
        source: new Phaser.Geom.Circle(0, 0, SHIELD_RADIUS),
        quantity: 100,
      }
    });

    this.timeScaleTween = this.tweens.create({
      targets: [this, this.time],
      timeScale: { from: 0.05, to: 1 },
      duration: 5000,
      ease: Phaser.Math.Easing.Expo.In,
    });

    this.add.existing(this.bulletManager.bulletSprites);
    this.add.existing(this.bulletManager.frag);

    this.healthMeter = new HealthMeter(this, MAX_HEALTH);
    for (let i = 0; i < this.healthMeter.hearts.length; ++i) {
      this.add.existing(this.healthMeter.hearts[i]);
    }
    this.healthMeter.setHealth(this.health);

    let flashEffect = this.add.rectangle(0, 0, this.bounds.x, this.bounds.y, 0xffffff);
    flashEffect.setOrigin(0);
    flashEffect.alpha = 0;
    this.flashTween = this.add.tween({
      targets: flashEffect,
      alpha: { from: 0.3, to: 0 },
      ease: 'Cubic.easeOut',
      duration: 500,
      paused: true,
    });

    this.createPauseScreen();

    this.cameras.main.ignore([this.healthPickup.miasma, this.bulletManager.miasma, this.bulletManager.bulletShadows]);
    let miasmaCam = this.cameras.add();
    miasmaCam.ignore([flashEffect, this.healthMeter, this.healthPickup.frag, this.player, this.shield,
      this.bulletManager.bulletSprites, this.bulletManager.frag, this.pauseScreen, this.healthMeter.hearts]);

    //Swap render order.
    this.cameras.cameras.push(this.cameras.cameras.shift());

    this.noise = this.make.tileSprite({ x: 0, y: 0, width: this.bounds.x, height: this.bounds.y, key: 'spritesheet', frame: 'noise'}, false);
    this.noise.tileScaleX = 2;
    this.noise.tileScalY = 1.5;
    this.noise.setOrigin(0, 0);
    if (colors.NOISE) {
      miasmaCam.setMask(new Phaser.Display.Masks.BitmapMask(this, this.noise));
    }

    this.time.addEvent({
      delay: 50,
      callback: attackLoop,
      callbackScope: this,
    });
    this.mySounds.chill.play(undefined, { loop: true });
  }


  createPauseScreen() {
    this.pauseScreen = this.add.container();
    const overlay = this.add.rectangle(0, 0, this.bounds.x, this.bounds.y, 0x000000);
    overlay.setOrigin(0);
    overlay.alpha = 0.8;
    this.pauseScreen.add(overlay);

    const me = this;
    this.menu = new UI(this, this.bounds.x/2, this.bounds.y/2 - 30);
    const list = new UI.UIList(this);
    list.addEntry(new UI.Button(this, 'RESUME', function() {
      me.mySounds.blip.play();
      me.gameResume();
    }));
    list.addEntry(new UI.Button(this, 'MAIN MENU', function() {
      me.mySounds.start.play();
      me.gameOver();
    }));
    this.menu.addList('main', list);
    this.menu.pushList('main');
    this.add.existing(this.menu);

    this.pauseScreen.add(this.menu);

    this.pauseScreen.visible = false;
  }


  update(_, dt) {
    this.inputMap.update();

    if (this.state === 'RUNNING') {
      this.updateRunning(dt);
    } else if (this.state === 'PAUSED') {
      this.updatePaused(dt);
    } else if (this.state === 'INPUT_FIX') {
      if (this.frame > 2) { this.state = 'RUNNING'; }
      this.frame++;
    }
  }


  updateRunning(dt) {
    if (this.inputMap.actions.start.justDown || this.inputMap.actions.cancel.justDown) {
      this.mySounds.blip.play();
      this.gamePause();
      return;
    }

    if (this.waiting) { return; }
    let secs = dt / 1000;
    let scaledDt = dt * this.timeScale;
    let shieldOn = this.isShieldOn;
    this.noise.tilePositionX += dt / 20;
    this.noise.tilePositionY += dt / 40;

    const v = this.inputMap.moveVec;
    if (v.x || v.y) {
      this.player.x += v.x * PLAYER_SPEED * secs;
      this.player.y += v.y * PLAYER_SPEED * secs;
      this.player.x = Math.max(PLAYER_RADIUS, this.player.x);
      this.player.x = Math.min(this.bounds.x - PLAYER_RADIUS, this.player.x);
      this.player.y = Math.max(PLAYER_RADIUS, this.player.y);
      this.player.y = Math.min(this.bounds.y - PLAYER_RADIUS, this.player.y);
    }

    this.healthPickup.update(dt);
    if (this.healthPickup.collide(this.player.x, this.player.y, PLAYER_PICKUP_RADIUS)) {
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
      this.healthMeter.setHealth(this.health);
      this.mySounds.hit.play();
      if (this.health <= 0) {
        this.mySounds.gameOver.play();
        this.gameOver();
      } else {
        if (this.flashTween.isPlaying()) {
          this.flashTween.restart();
        } else {
          this.flashTween.play();
        }
        this.startShield(this.player.x, this.player.y);
      }
    }
    this.healthMeter.text = this.health.toString();
  }


  updatePaused(dt) {
    if (this.inputMap.actions.start.justDown || this.inputMap.actions.cancel.justDown) {
      this.gameResume();
      return
    }

    let imap = this.inputMap.actions;
    if (imap.up.justDown) {
      this.mySounds.blip.play();
      this.menu.handleInput(UI.UP);
    }
    if (imap.down.justDown) {
      this.mySounds.blip.play();
      this.menu.handleInput(UI.DOWN);
    }
    if (imap.action.justDown) { this.menu.handleInput(UI.ACTION); }
  }


  gamePause() {
    this.state = 'PAUSED';
    this.time.paused = true;
    this.tweens.timeScale = 0;
    this.pauseScreen.visible = true;
  }


  gameResume() {
    this.state = 'RUNNING';
    this.time.paused = false;
    this.tweens.timeScale = 1;
    this.pauseScreen.visible = false;
  }


  gameOver() {
    this.cameras.main.fadeOut(0, 255, 255, 255);
    this.time.paused = false;
    this.tweens.timeScale = 1;
    this.mySounds.chill.stop();
    this.time.removeAllEvents();
    this.healthPickup.removeListener('killed', this.startHealthSpawnTimer);
    this.scene.start('menu');
  }


  spawnBullet(x, y, vx, vy) {
    if (this.isShieldOn && isWithin(x, y, this.player.x, this.player.y, this.shieldRadius)) {
      return null;
    }
    return this.bulletManager.spawn(x, y, vx, vy);
  }


  onHealthPickup() {
    this.mySounds.pickup.play();
    this.healthPickup.kill();
    this.health = Math.min(this.health + 0.25, MAX_HEALTH);
    this.healthMeter.setHealth(this.health);
  }


  startHealthSpawnTimer() {
    this.time.addEvent({
      delay: 3000,
      callback: this.healthPickup.spawn,
      callbackScope: this.healthPickup,
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
    this.shieldSparkles.explode(undefined, this.shield.x, this.shield.y);
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
  let tooClose = true;
  let delay = 10;
  do {
    x = Math.random() * this.bounds.x;
    y = Math.random() * this.bounds.y;
    tooClose = isWithin(x, y, this.player.x, this.player.y, MIN_ATTACK_DIST);
    ++tries;
  } while (tooClose && tries < 10); // Capping tries isn't just defensive, it's paranoid programming!
  if (!tooClose) {
    let roll = Math.random();
    if (roll > 0.25) {
      circleAttack(this, x, y);
    } else {
      spiralAttack(this, x, y);
    }
    delay = Math.random() * (this.attackTimeMax - this.attackTimeMin) + this.attackTimeMin;
  }
  this.time.addEvent({
    delay: delay,
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

