import UI from './UI.js';
import COLORS from '../COLORS.js';


export default function createMenu(scene, x, y) {
  let ui = new UI(scene, x, y);
  let main= new UI.UIList(scene);
  main.addEntry(new UI.Button(scene, 'START', function() {
    scene.startMain();
  }));
  ui.addList('main', main);

  {
  let difficulty = new UI.Spinner(scene, 'MODE', function(value) {
    scene.mySounds.blip.play();
    scene.game.registry.set('difficulty', value);
  });
  const current = scene.game.registry.get('difficulty');
  let i = 0;
  let j = 0;
  let difficulties = { PEACEFUL: 0, NORMAL: 1, MASTERY: 2 };
  for (let k in difficulties) {
    difficulty.addOption(scene, k, difficulties[k]);
    if (current === difficulties[k]) {
      j = i;
    }
    i++;
  }
  difficulty.setOption(j);
  main.addEntry(difficulty);
  }

  {
  let theme = new UI.Spinner(scene, 'THEME', function(value) {
    scene.mySounds.blip.play();
    scene.setColors(value);
  });
  const current = scene.game.registry.get('theme');
  let i = 0;
  let j = 0;
  for (let k in COLORS) {
    theme.addOption(scene, k, COLORS[k]);
    if (current === COLORS[k]) {
      j = i;
    }
    i++;
  }
  theme.setOption(j);
  main.addEntry(theme);
  }

  ui.pushList('main');
  return ui;
}

