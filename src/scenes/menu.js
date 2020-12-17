import Phaser from 'phaser';
import COLORS from '../COLORS.js';


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

    miasmaCam.ignore([ n, breathe, g2 ]);
    this.cameras.main.ignore([ miasma, g ]);

    this.keys = {
      start: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
    }
    this.ready = false;
    this.cameras.main.fadeOut(0, 255, 255, 255);
    this.cameras.main.once('camerafadeincomplete', function (camera) {
      this.ready = true;
    }, this);
    this.time.addEvent({
      delay: 1000,
      callback: function() {
        //this.cameras.main.fadeIn(6000, 255, 255, 255);
        this.cameras.main.fadeIn(60, 255, 255, 255);
      },
      callbackScope: this,
    });
  }


  update(_, dt) {
    this.noise.tilePositionX += dt / 40;
    this.noise.tilePositionY += dt / 60;

    let pad = this.input.gamepad.total > 0 ? this.input.gamepad.getPad(0) : null;
    if (this.ready && (this.keys.start.isDown || (pad && pad.A))) {
      this.scene.start('main');
    }
  }
}


export default new MenuScene();

