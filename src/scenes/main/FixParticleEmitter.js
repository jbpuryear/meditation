export default class FixParticleEmitter extends Phaser.GameObjects.Particles.ParticleEmitter {
  atLimit() {
    // :( Another hack. Phaser's emitter stops emitting forever when it hits it's max, but we only
    // want it to pause.
    // return (this.maxParticles > 0 && this.getParticleCount() === this.maxParticles);
    return this.maxParticles > 0 && this.getParticleCount() === this.maxParticles && this.dead.length === 0;
  }
}

