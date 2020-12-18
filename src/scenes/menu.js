import UI from '../UI/UI.js';
import COLORS from '../COLORS.js';
import createMenu from '../UI/createMenu.js';


class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'menu' });
  }

  create() {
    let size = this.game.scale.gameSize;
    let n = this.add.tileSprite(0, 0, size.width, size.height, 'spritesheet', 'noise');
    n.setOrigin(0);
    n.alpha = 0.2;

    let c = { x: size.width/2, y: size.height/3 };
    let miasma = this.add.particles('spritesheet', 'big-circle');
    miasma.createEmitter({
      x: c.x,
      y: c.y,
      lifespan: 500,
      angle: { min: 270, max: 325 },
      frequency: 40,
      scale: { start: 1, end: 0, ease: 'Circular.InOut' },
      speed: { min: 400, max: 600 },
      tint: COLORS.MIASMA,
    });
    let g = this.add.graphics();
    g.fillStyle(COLORS.MIASMA, 1);
    g.fillCircle(c.x, c.y, 128);
    let noise = this.make.tileSprite({ x: size.width/2, y: 100, width: 800, height: 800, key: 'spritesheet', frame: 'noise'}, false);
    noise.tileScaleX = 4;
    noise.tileScaleY = 3;
    this.noise = noise;
    let miasmaCam = this.cameras.add();
    // Swap render order
    this.cameras.cameras.push(this.cameras.cameras.shift());
    miasmaCam.setMask(new Phaser.Display.Masks.BitmapMask(this, noise));

    let g2 = this.add.graphics();
    g2.fillStyle(COLORS.BULLET, 1);
    g2.fillCircle(c.x, c.y, 92);

    let breathe = this.add.image(size.width/2 - 30, size.height*5/12, 'spritesheet', 'breathe');
    breathe.tint = COLORS.PLAYER;

    this.menu = createMenu(this, c.x, 720);
    this.add.existing(this.menu);
    this.menu.visible = false;
    this.menu.tint = COLORS.TEXT;

    miasmaCam.ignore([ n, breathe, g2 ]);
    this.cameras.main.ignore([ miasma, g ]);

    this.inputMap = {
      up: {
        wasDown: false, isDown: false, justDown: false,
        keys: [
          this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
          this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        ],
      },
      down: {
        wasDown: false, isDown: false, justDown: false,
        keys: [
          this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
          this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        ],
      },
      left: {
        wasDown: false, isDown: false, justDown: false,
        keys: [
          this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
          this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        ],
      },
      right: {
        wasDown: false, isDown: false, justDown: false,
        keys: [
          this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
          this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        ],
      },
      action: {
        wasDown: false, isDown: false, justDown: false,
        keys: [
          this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
          this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
          this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
        ],
      },
      cancel: {
        wasDown: false, isDown: false, justDown: false,
        keys: [
          this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
        ],
      },
    }
    this.state = 'FADE_IN';
    this.cameras.main.once('camerafadeincomplete', function (camera) {
      this.clearFadeIn();
    }, this);
    this.cameras.main.fadeIn(5000, 255, 255, 255);

    // Another Phaser bug. If we don't call this when we reenter the scene the gamepad will
    // still have the same values as when we exited, i.e. it will think A or start is still pushed.
    this.input.gamepad.update();
  }


  update(_, dt) {
    this.noise.tilePositionX += dt / 40;
    this.noise.tilePositionY += dt / 60;
    this.updateInput();

    if (this.state === 'FADE_IN') {
      if (this.inputMap.action.justDown) {
        this.clearFadeIn();
      }
    } else if (this.state === 'MAIN') {
      let imap = this.inputMap;
      if (imap.up.justDown) { this.menu.handleInput(UI.UP); }
      if (imap.down.justDown) { this.menu.handleInput(UI.DOWN); }
      if (imap.left.justDown) { this.menu.handleInput(UI.LEFT); }
      if (imap.right.justDown) { this.menu.handleInput(UI.RIGHT); }
      if (imap.action.justDown) { this.menu.handleInput(UI.ACTION); }
      if (imap.cancel.justDown) { this.menu.handleInput(UI.CANCEL); }
    }
  }


  updateInput() {
    let imap = this.inputMap;
    Object.values(imap).forEach((input)=> {
      input.wasDown = input.isDown;
      input.isDown = input.keys.some((k)=> k.isDown);
    })
    let pad = this.input.gamepad.total > 0 ? this.input.gamepad.getPad(0) : null;
    if (pad) {
      let threshold = 0.8;
      let axes = pad.getAxisTotal() >= 2;
      imap.left.isDown = imap.left.isDown || pad.left || (axes && pad.getAxisValue(0) < -threshold);
      imap.right.isDown = imap.right.isDown || pad.right || (axes && pad.getAxisValue(0) > threshold);
      imap.up.isDown = imap.up.isDown || pad.up || (axes && pad.getAxisValue(1) < -threshold);
      imap.down.isDown = imap.down.isDown || pad.down || (axes && pad.getAxisValue(1) > threshold);
      imap.action.isDown = imap.action.isDown || pad.A;
      imap.cancel.isDown = imap.cancel.isDown || (pad.getButtonTotal() >= 2 && pad.getButtonValue(1));
    }
    Object.values(imap).forEach((input)=> {
      input.justDown = input.isDown && !input.wasDown;
    });
  }


  clearFadeIn() {
    this.cameras.main.removeListener(this.clearFadeIn);
    this.cameras.main.fadeEffect.reset();
    this.menu.visible = true;
    this.state = 'MAIN';
  }
}


export default new MenuScene();

