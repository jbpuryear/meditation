import Phaser from 'phaser';
import COLORS from '../COLORS.js';


const STYLE = { color: '#'+COLORS.TEXT.toString(16), fontFamily: 'monument-valley', fontSize: '72px' }


class Button extends Phaser.GameObjects.Text {
  constructor(scene, text, callback) {
    super(scene, 0, 0, text, STYLE)
    this.callback = callback;
    this.setOrigin(0.5);
  }


  handleInput(i) {
    if (i === UI.ACTION && this.callback) { this.callback(); }
  }
}


class Spinner extends Phaser.GameObjects.Container {
  constructor(scene, label, callback) {
    super(scene);
    this.label = scene.make.text({ style: STYLE, text: label + ': ' }, false);
    this.label.setOrigin(1, 0.5);
    this.add(this.label);
    this.options = [];
    this.currentOption = 0;
    this.callback = callback;
  }


  addOption(scene, label, value) {
    const o = scene.make.text({ style: STYLE, text: label }, false);
    o.value = value;
    o.visible = false;
    o.setOrigin(0, 0.5);
    this.options.push(o);
    this.add(o);
  }


  setOption(i) {
    this.options.forEach((o)=> o.visible = false);
    this.currentOption = i;
    if (this.options[i]) {
      this.options[i].visible = true;
      console.log('kweh');
    }
  }


  handleInput(i) {
    if (i === UI.LEFT) {
      this.currentOption = this.currentOption > 0 ? this.currentOption - 1 : this.options.length -1;
      this.setOption(this.currentOption);
      if (this.callback) { this.callback(this.options[this.currentOption].value); }
    } else if (i === UI.RIGHT) {
      this.currentOption = (this.currentOption + 1) % this.options.length;
      this.setOption(this.currentOption);
      if (this.callback) { this.callback(this.options[this.currentOption].value); }
    }
  }


  getLeftCenter() {
    return this.label.getLeftCenter();
  }
}


class UIList extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene);
    this.entries = [];
    this.currentEntry = 0;
    this.cursor = scene.make.image({ x: 0, y: 0, key: 'spritesheet', frame: 'circle' }, false);
    this.cursor.tint = COLORS.TEXT;
    this.cursor.setScale(0.4);
    this.add(this.cursor);
  }


  addEntry(entry) {
    entry.x = 0;
    entry.y = this.entries.length ? this.entries[this.entries.length-1].y + 72 : 0;
    this.entries.push(entry);
    this.add(entry);
  }


  show() {
    this.setCursor();
    this.visible = true;
  }


  hide() {
    this.visible = false;
  }


  setCursor() {
    let entry = this.entries[this.currentEntry];
    if (!entry) {
      this.cursor.visible = false;
      return;
    }
    let p = entry.getLeftCenter();
    this.cursor.x = p.x - 24;
    this.cursor.y = p.y - 4;
  }


  handleInput(i) {
    let l = this.entries.length;
    if (i === UI.UP) {
      if (l > 0) {
        this.currentEntry = (this.currentEntry + 1) % l;
        this.setCursor();
      }
      return;
    }
    if (i === UI.DOWN) {
      if (l > 0) {
        this.currentEntry = this.currentEntry > 0 ? this.currentEntry -1 : l-1;
        this.setCursor();
      }
      return;
    }
    let entry = this.entries[this.currentEntry];
    if (entry) { entry.handleInput(i); }
  }
}


export default class UI extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    this.uiLists = {};
    this.currentUIList = null;
  }


  addList(key, uilist) {
    this.add(uilist);
    this.uiLists[key] = uilist;
    this.stack = [];
  }


  changeCurrentList(key) {
    this.currentUIList = this.uiLists[key];
    for (const l in this.uiLists) {
      this.uiLists[l].hide();
    }
    if (this.currentUIList) {
      this.currentUIList.show();
    }
  }


  pushList(key) {
    this.stack.push(key);
    this.changeCurrentList(key);
  }


  popList() {
    this.stack.pop();
    this.changeCurrentList(this.stack[this.stack.length-1]);
  }


  handleInput(i) {
    if (i === UI.CANCEL) {
      if (this.stack.length > 1) { this.popList(); }
    } else if (this.currentUIList) {
      this.currentUIList.handleInput(i);
    }
  }
}


UI.Button = Button;
UI.Spinner = Spinner;
UI.UIList = UIList;
UI.UP = 'up';
UI.DOWN = 'down';
UI.LEFT = 'left';
UI.RIGHT = 'right';
UI.ACTION = 'action';
UI.CANCEL = 'cancel';

