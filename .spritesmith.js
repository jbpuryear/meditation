'use strict'

module.exports = [
  {
    src: './src/assets/sprites/**/*.png',
    destImage: './src/assets/spritesheet.png',
    destCSS: './src/assets/sprites.json',
    //engine: 'pixelsmith',
    algorithm: 'binary-tree',
    cssTemplate: require('spritesmith-texturepacker'),
    padding: 2
  },
]

