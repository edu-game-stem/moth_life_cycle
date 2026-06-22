/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// 8-bit Web Audio API Synthesizer
class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmInterval: any = null;
  private isBgmPlaying: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setMute(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
  }

  getMuted() {
    return this.isMuted;
  }

  // Tiếng chíp khi ăn lá (tiếng beep retro tăng dần tần số ngắn)
  playEat() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle'; // Âm thanh ấm áp 8-bit
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn("Audio Context Error: ", e);
    }
  }

  // Tiếng di chuyển nhấp nhô của sâu đo (tiếng xột xoạt nhịp nhàng tần số cực thấp)
  playMove() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.08);
      
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      // Ignored
    }
  }

  // Tiếng lách cách nhẹ của kén rung lắc/đung đưa
  playCrack() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      
      // Tạo xung lách cách ngẫu nhiên bằng cách tạo oscillator vuông tần số rất cao trong thời gian siêu ngắn
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(1200 + Math.random() * 800, now);
      
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      // Ignored
    }
  }

  // Tiếng bùng nổ khi bướm đêm chui ra khỏi kén (tiếng nổ 8-bit hoành tráng)
  playExplosion() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      
      // Sử dụng Oscillator với răng cưa kết hợp nhiễu trắng giả lập tiếng nổ
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(120, now);
      osc1.frequency.exponentialRampToValueAtTime(20, now + 0.6);
      
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Thêm một osc tần số vuông cao để tạo hiệu ứng lấp lánh (spark) đi kèm tiếng nổ
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(600, now);
      osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
      gain2.gain.setValueAtTime(0.08, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.4);
    } catch (e) {
      // Ignored
    }
  }

  // Tiếng vỗ cánh bướm đêm (âm bass trầm rít nhẹ theo tần số thấp)
  playFlutter() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.1);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      // Ignored
    }
  }

  // Tiếng chim ăn sâu rít la lên khi phát hiện bướm (tiếng ríu rít 8-bit cao vút)
  playBirdShriek() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(1600, now + 0.15);
      osc.frequency.linearRampToValueAtTime(1000, now + 0.3);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  // Tiếng dơi đêm phát ra sóng siêu âm lách cách thần bí
  playBatSqueak() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(2000, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.12);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  // Tiếng khi bị chim/dơi tóm hoặc nhện trói quá lâu (âm trầm rơi rớt thê lương)
  playHurt() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.45);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }

  // Tiếng bọc lá chắn hoa lấp lánh hoặc nhặt phấn hoa vàng
  playShieldOn() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.3);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  // Tiếng khi phấn hoa vàng rủng rỉnh rớt/thu hoạch
  playPollenCollected() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  // Nhạc chiptune hoàn hỉ chiến thắng hoàn thành vòng đời
  playWin() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      
      const chords = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio dạt dào hy vọng
      chords.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);
        gain.gain.setValueAtTime(0.08, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.4);
      });
    } catch (e) {}
  }

  // Nhạc nền retro yên bình (êm đềm, ấm áp mộc mạc như rừng đêm)
  // Tạo một chuỗi giai điệu chầm chậm pentatonic (Đô - Rê - Mi - Sol - La) lặp lại thanh nhã
  startBgm() {
    if (this.isMuted || this.isBgmPlaying) return;
    try {
      this.initCtx();
      this.isBgmPlaying = true;
      const notes = [
        261.63, // C4
        293.66, // D4
        329.63, // E4
        392.00, // G4
        440.00, // A4
        523.25, // C5
        587.33, // D5
        659.25, // E5
      ];
      
      // Giai điệu mộc mạc thư thái rừng đêm 8-bit
      const melody = [3, 4, 5, 4, 3, 2, 1, 0, 2, 4, 3, 1, 0, 2, 1, 0];
      let step = 0;

      this.bgmInterval = setInterval(() => {
        if (this.isMuted || !this.isBgmPlaying || !this.ctx) return;
        const now = this.ctx.currentTime;
        
        // Cứ mỗi nốt chầm chậm (600ms)
        const noteIndex = melody[step % melody.length];
        const freq = notes[noteIndex];
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        // Thỉnh thoảng biến tấu ngẫu nhiên một chút để giai điệu được độc đáo
        osc.type = 'triangle'; 
        osc.frequency.setValueAtTime(freq, now);
        
        // Tạo phím gảy (plucky sound) thanh thoát
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.5);
        
        step++;
      }, 550);
    } catch (e) {
      console.warn("BGM Error: ", e);
    }
  }

  stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const audio = new AudioEngine();
