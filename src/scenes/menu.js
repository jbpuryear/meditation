import InputMap from '../InputMap.js';
import UI from '../UI/UI.js';
import COLORS from '../COLORS.js';
import createMenu from '../UI/createMenu.js';


class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'menu' });
  }

  create() {
    this.inputMap = new InputMap(this);
    let size = this.game.scale.gameSize;

    let c = { x: size.width/2, y: size.height/3 };
    let miasma = this.add.particles('spritesheet', 'big-circle');
    this.miasmaEmitter = miasma.createEmitter({
      x: c.x,
      y: c.y,
      lifespan: 500,
      angle: { min: 270, max: 325 },
      frequency: 40,
      scale: { start: 1, end: 0, ease: 'Circular.InOut' },
      speed: { min: 400, max: 600 },
      tint: COLORS.MIASMA,
    });
    this.bulletShadow = this.add.image(c.x, c.y, 'spritesheet', 'big-circle');
    this.bulletShadow.displayWidth = 256;
    this.bulletShadow.displayHeight = 256;

    this.noise = this.make.tileSprite({ x: size.width/2, y: 100, width: 800, height: 800, key: 'spritesheet', frame: 'noise'}, false);
    this.noise.tileScaleX = 4;
    this.noise.tileScaleY = 3;

    let miasmaCam = this.cameras.add();
    this.miasmaCam = miasmaCam;
    // Swap render order
    this.cameras.cameras.push(this.cameras.cameras.shift());
    this.mask = new Phaser.Display.Masks.BitmapMask(this, this.noise);

    this.bullet = this.add.image(c.x, c.y, 'spritesheet', 'big-circle');
    this.bullet.displayWidth = 184;
    this.bullet.displayHeight = 184;

    this.breathe = this.add.image(size.width/2 - 30, size.height*5/12, 'spritesheet', 'breathe');

    this.menu = createMenu(this, c.x, 720);
    this.add.existing(this.menu);
    this.menu.visible = false;

    miasmaCam.ignore([ this.breathe, this.bullet, this.menu ]);
    this.cameras.main.ignore([ miasma, this.bulletShadow ]);

    this.state = 'FADE_IN';
    this.cameras.main.once('camerafadeincomplete', function (camera) {
      this.clearFadeIn();
    }, this);
    this.cameras.main.fadeIn(5000, 255, 255, 255);

    this.mySounds = {
      start: this.sound.add('start'),
      blip: this.sound.add('blip', { volume: 0.4 }),
      balance: this.sound.add('balance'),
    };
    // Another Phaser bug. If we don't call this when we reenter the scene the gamepad will
    // still have the same values as when we exited, i.e. it will think A or start is still pushed.
    this.input.gamepad.update();
    this.updateColors();

    // Let's us update input for a couple frames so we don't have false button presses when switching scenes.
    this.frame = 0;
  }


  update(_, dt) {
    this.noise.tilePositionX += dt / 40;
    this.noise.tilePositionY += dt / 60;
    this.inputMap.update();

    if (this.frame < 2) {
      this.frame++;
      return;
    }

    if (this.state === 'FADE_IN') {
      if (this.inputMap.actions.action.justDown) {
        this.clearFadeIn();
      }
    } else if (this.state === 'MAIN') {
      let imap = this.inputMap.actions;
      if (imap.start.justDown) {
        this.startMain();
        return;
      }
      if (imap.up.justDown) {
        this.mySounds.blip.play();
        this.menu.handleInput(UI.UP);
      }
      if (imap.down.justDown) {
        this.mySounds.blip.play();
        this.menu.handleInput(UI.DOWN);
      }
      if (imap.left.justDown) { this.menu.handleInput(UI.LEFT); }
      if (imap.right.justDown) { this.menu.handleInput(UI.RIGHT); }
      if (imap.action.justDown) { this.menu.handleInput(UI.ACTION); }
      if (imap.cancel.justDown) { this.menu.handleInput(UI.CANCEL); }
    }
  }


  clearFadeIn() {
    this.mySounds.balance.play();
    this.cameras.main.removeListener(this.clearFadeIn);
    this.cameras.main.fadeEffect.reset();
    this.menu.visible = true;
    this.state = 'MAIN';
  }


  setColors(theme) {
    this.game.registry.set('theme', theme);
    this.updateColors();
  }


  updateColors() {
    const colors = this.game.registry.get('theme');
    this.game.config.backgroundColor = Phaser.Display.Color.ValueToColor(colors.BACKGROUND);
    this.game.renderer.config.backgroundColor = this.game.config.backgroundColor;
    this.miasmaEmitter.setTint(colors.MIASMA);
    this.bulletShadow.tint = colors.MIASMA;
    this.bullet.tint = colors.BULLET;
    this.breathe.tint = colors.PLAYER;
    this.miasmaCam.setMask(colors.NOISE ? this.mask : null);
    this.updateMenuColors();
  }


  updateMenuColors(target) {
    target = target || this.menu;
    const color = this.game.registry.get('theme').TEXT;
    if (target instanceof Phaser.GameObjects.Container) {
      target.iterate(this.updateMenuColors, this);
    } else if (target.setTint) {
      target.setTint(color);
    }
  }


  startMain() {
    const bal = this.mySounds.balance;
    if ('volume' in bal) {
      this.add.tween({
        targets: bal,
        volume: 0,
        duration: 500,
        callback: bal.stop,
        callbackScope: bal,
      });
    } else {
      this.mySounds.balance.stop();
    }
    this.state = 'FADE_OUT';
    this.mySounds.start.play();
    this.cameras.main.once('camerafadeoutcomplete', function() {
      this.scene.start('main');
    }, this);
    this.cameras.main.fadeOut(1000, 255, 255, 255);
  }
}


export default new MenuScene();

