import Phaser from 'phaser';


export default class InputMap {
  constructor(scene) {
    this.scene = scene;
    this.deadZone = 0.2;
    this.actions = {
      up: {
        wasDown: false, isDown: false, justDown: false, timeDown: 0,
        keys: [
          scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
          scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        ],
      },
      down: {
        wasDown: false, isDown: false, justDown: false, timeDown: 0,
        keys: [
          scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
          scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        ],
      },
      left: {
        wasDown: false, isDown: false, justDown: false, timeDown: 0,
        keys: [
          scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
          scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        ],
      },
      right: {
        wasDown: false, isDown: false, justDown: false, timeDown: 0,
        keys: [
          scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
          scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        ],
      },
      action: {
        wasDown: false, isDown: false, justDown: false, timeDown: 0,
        keys: [
          scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
          scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
          scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
        ],
      },
      cancel: {
        wasDown: false, isDown: false, justDown: false, timeDown: 0,
        keys: [
          scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE),
          scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
        ],
      },
      start: {
        wasDown: false, isDown: false, justDown: false, timeDown: 0,
        keys: [],
      },
    }
    this.moveVec = new Phaser.Math.Vector2();
  }


  update() {
    let actions = this.actions;
    Object.values(actions).forEach((input)=> {
      input.wasDown = input.isDown;
      input.isDown = input.keys.some((k)=> k.isDown);
    })

    const pad = this.scene.input.gamepad.total > 0 ? this.scene.input.gamepad.getPad(0) : null;
    let length = pad ? pad.leftStick.length() : 0;
    if (pad) {
      if (length < this.deadZone) {
        pad.leftStick.setTo(0);
        length = 0;
      } else {
        pad.leftStick.limit(1);
      }
      const buttonTotal = pad.getButtonTotal(); 
      actions.left.isDown = actions.left.isDown || pad.left || pad.leftStick.x < -this.deadZone;
      actions.right.isDown = actions.right.isDown || pad.right || pad.leftStick.x > this.deadZone;
      actions.up.isDown = actions.up.isDown || pad.up || pad.leftStick.y < -this.deadZone;
      actions.down.isDown = actions.down.isDown || pad.down || pad.leftStick.y > this.deadZone;
      actions.action.isDown = actions.action.isDown || pad.A;
      actions.cancel.isDown = actions.cancel.isDown || (buttonTotal > 1 && pad.getButtonValue(1));
      actions.start.isDown = buttonTotal > 9 && pad.getButtonValue(9);
    }

    Object.values(actions).forEach((input)=> {
      input.justDown = input.isDown && !input.wasDown;
      if (input.justDown) { input.timeDown = this.scene.time.now; }
    });

    if (length > 0) {
      this.moveVec.setFromObject(pad.leftStick);
    } else {
      if (actions.right.isDown && actions.left.isDown) {
        this.moveVec.x = actions.right.timeDown > actions.left.timeDown ? 1 : -1;
      } else {
        this.moveVec.x = (actions.right.isDown ? 1 : 0) - (actions.left.isDown ? 1 : 0);
      }
      if (actions.down.isDown && actions.up.isDown) {
        this.moveVec.y = actions.down.timeDown > actions.up.timeDown ? 1 : -1;
      } else {
        this.moveVec.y = (actions.down.isDown ? 1 : 0) - (actions.up.isDown ? 1 : 0);
      }
      this.moveVec.limit(1);
    }
  }
}

