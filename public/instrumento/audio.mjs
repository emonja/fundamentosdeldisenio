export class Voice {
  async arm(frequency) {
    // Called only from a student's initial gesture. An inaudible running graph
    // unlocks audio on mobile without waiting for a later remote gesture.
    if (!this.context) {
      this.context = new AudioContext();
      this.oscillator = this.context.createOscillator();
      this.gain = this.context.createGain();
      this.oscillator.type = 'sine'; this.oscillator.frequency.value = frequency;
      this.gain.gain.value = 0;
      this.oscillator.connect(this.gain).connect(this.context.destination);
      this.oscillator.start();
    }
    await this.context.resume();
    if (this.context.state !== 'running') throw new Error('No se pudo preparar el sonido. Vuelve a tocar el rostro.');
  }
  play(active) {
    if (!this.context) return;
    const t = this.context.currentTime;
    this.gain.gain.cancelScheduledValues(t);
    this.gain.gain.setTargetAtTime(active ? 0.075 : 0, t, 0.1);
  }
  close() {this.context?.close();}
}
