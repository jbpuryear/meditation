import UI from './UI.js';
import COLORS from '../COLORS.js';


export default function createMenu(scene, x, y) {
  let ui = new UI(scene, x, y);
  let main= new UI.UIList(scene);
  main.addEntry(new UI.Button(scene, 'START', function() {
    scene.scene.start('main');
  }));
  main.addEntry(new UI.Button(scene, 'OPTIONS', function() {
    ui.pushList('options');
  }));
  ui.addList('main', main);

  let options = new UI.UIList(scene);
  let theme = new UI.Spinner(scene, 'THEME', function(value) {
    console.log(value);
  });
  theme.addOption(scene, 'DEFAULT', COLORS);
  theme.setOption(0);

  options.addEntry(theme);
  ui.addList('options', options);


  ui.pushList('main');
  return ui;
}

