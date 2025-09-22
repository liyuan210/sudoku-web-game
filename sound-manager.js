// 音效管理系统
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.enabled = true;
        this.volume = 0.3;
        this.init();
    }

    async init() {
        try {
            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 预加载音效
            this.preloadSounds();
            
            // 监听用户交互以启用音频
            this.setupUserInteraction();
        } catch (error) {
            // Audio not supported - silently disable for AdSense compliance
            this.enabled = false;
        }
    }

    setupUserInteraction() {
        const enableAudio = () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            document.removeEventListener('click', enableAudio);
            document.removeEventListener('keydown', enableAudio);
        };
        
        document.addEventListener('click', enableAudio);
        document.addEventListener('keydown', enableAudio);
    }

    preloadSounds() {
        // 预定义音效参数
        this.soundConfigs = {
            input: { frequency: 440, duration: 0.1, type: 'sine' },
            error: { frequency: 200, duration: 0.3, type: 'sawtooth' },
            success: { frequencies: [523, 659, 784], duration: 0.5, type: 'sine' },
            hint: { frequency: 660, duration: 0.2, type: 'triangle' },
            complete: { frequencies: [523, 659, 784, 1047], duration: 0.8, type: 'sine' },
            click: { frequency: 800, duration: 0.05, type: 'square' },
            select: { frequency: 600, duration: 0.08, type: 'sine' },
            erase: { frequency: 300, duration: 0.15, type: 'sawtooth' }
        };
    }

    play(soundType, options = {}) {
        if (!this.enabled || !this.audioContext) return;

        const config = this.soundConfigs[soundType];
        if (!config) return;

        try {
            if (config.frequencies) {
                // 播放和弦
                this.playChord(config.frequencies, config.duration, config.type);
            } else {
                // 播放单音
                this.playTone(config.frequency, config.duration, config.type, options);
            }
        } catch (error) {
            // Failed to play sound - silently handle for AdSense compliance
        }
    }

    playTone(frequency, duration, type = 'sine', options = {}) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        const volume = (options.volume || this.volume) * 0.5;
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playChord(frequencies, duration, type = 'sine') {
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, duration * 0.8, type);
            }, index * 100);
        });
    }

    // 播放成功音效
    playSuccess() {
        this.play('success');
    }

    // 播放错误音效
    playError() {
        this.play('error');
    }

    // 播放输入音效
    playInput() {
        this.play('input');
    }

    // 播放提示音效
    playHint() {
        this.play('hint');
    }

    // 播放完成音效
    playComplete() {
        this.play('complete');
    }

    // 播放点击音效
    playClick() {
        this.play('click');
    }

    // 播放选择音效
    playSelect() {
        this.play('select');
    }

    // 播放擦除音效
    playErase() {
        this.play('erase');
    }

    // 设置音量
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    // 获取音量
    getVolume() {
        return this.volume;
    }

    // 启用/禁用音效
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    // 检查是否启用
    isEnabled() {
        return this.enabled;
    }

    // 销毁音频上下文
    destroy() {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.sounds.clear();
    }

    // 静态实例
    static instance = null;

    static getInstance() {
        if (!this.instance) {
            this.instance = new SoundManager();
        }
        return this.instance;
    }

    // 静态方法
    static play(soundType, options = {}) {
        return this.getInstance().play(soundType, options);
    }

    static setEnabled(enabled) {
        return this.getInstance().setEnabled(enabled);
    }

    static setVolume(volume) {
        return this.getInstance().setVolume(volume);
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoundManager;
} else {
    window.SoundManager = SoundManager;
}