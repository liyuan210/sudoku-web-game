// 设置面板
class SettingsPanel {
    constructor() {
        this.modal = null;
        this.settings = GameStorage.getSettings();
    }

    show() {
        if (this.modal) {
            this.modal.remove();
        }

        this.settings = GameStorage.getSettings();
        this.createModal();
        document.body.appendChild(this.modal);
        
        // 显示动画
        setTimeout(() => {
            this.modal.classList.add('show');
        }, 10);
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'settings-modal modal';
        
        this.modal.innerHTML = `
            <div class="settings-content modal-content">
                <div class="settings-header">
                    <h2>⚙️ 游戏设置</h2>
                    <button class="close-btn" onclick="this.closest('.settings-modal').remove()">×</button>
                </div>
                
                <div class="settings-sections">
                    <div class="settings-section">
                        <h3>🎵 音效设置</h3>
                        <div class="setting-item">
                            <label class="setting-label">
                                <input type="checkbox" id="soundEnabled" ${this.settings.soundEnabled ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                启用音效
                            </label>
                            <p class="setting-description">开启后会播放操作音效</p>
                        </div>
                        
                        <div class="setting-item">
                            <label class="setting-label">音量大小</label>
                            <div class="volume-control">
                                <input type="range" id="volume" min="0" max="100" value="${(SoundManager.getInstance().getVolume() * 100)}" class="volume-slider">
                                <span class="volume-value">${Math.round(SoundManager.getInstance().getVolume() * 100)}%</span>
                            </div>
                        </div>
                    </div>

                    <div class="settings-section">
                        <h3>🎮 游戏设置</h3>
                        <div class="setting-item">
                            <label class="setting-label">
                                <input type="checkbox" id="autoSave" ${this.settings.autoSave ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                自动保存游戏
                            </label>
                            <p class="setting-description">自动保存游戏进度，下次打开时可继续</p>
                        </div>
                        
                        <div class="setting-item">
                            <label class="setting-label">
                                <input type="checkbox" id="confirmBeforeNewGame" ${this.settings.confirmBeforeNewGame ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                新游戏前确认
                            </label>
                            <p class="setting-description">开始新游戏前显示确认对话框</p>
                        </div>
                    </div>

                    <div class="settings-section">
                        <h3>👁️ 显示设置</h3>
                        <div class="setting-item">
                            <label class="setting-label">
                                <input type="checkbox" id="showTimer" ${this.settings.showTimer ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                显示计时器
                            </label>
                            <p class="setting-description">在游戏界面显示计时器</p>
                        </div>
                        
                        <div class="setting-item">
                            <label class="setting-label">
                                <input type="checkbox" id="showRemainingNumbers" ${this.settings.showRemainingNumbers ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                显示剩余数字
                            </label>
                            <p class="setting-description">显示每个数字的剩余使用次数</p>
                        </div>
                        
                        <div class="setting-item">
                            <label class="setting-label">
                                <input type="checkbox" id="highlightRelated" ${this.settings.highlightRelated ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                高亮相关格子
                            </label>
                            <p class="setting-description">选中格子时高亮同行、同列、同宫格</p>
                        </div>
                    </div>

                    <div class="settings-section">
                        <h3>🔍 辅助功能</h3>
                        <div class="setting-item">
                            <label class="setting-label">
                                <input type="checkbox" id="highlightErrors" ${this.settings.highlightErrors ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                高亮错误
                            </label>
                            <p class="setting-description">自动高亮冲突的数字</p>
                        </div>
                        
                        <div class="setting-item">
                            <label class="setting-label">
                                <input type="checkbox" id="autoCheckErrors" ${this.settings.autoCheckErrors ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                自动检查错误
                            </label>
                            <p class="setting-description">输入数字时自动检查是否有冲突</p>
                        </div>
                    </div>

                    <div class="settings-section">
                        <h3>🎨 主题设置</h3>
                        <div class="setting-item">
                            <label class="setting-label">选择主题</label>
                            <select id="theme" class="theme-select">
                                <option value="default" ${this.settings.theme === 'default' ? 'selected' : ''}>默认主题</option>
                                <option value="dark" ${this.settings.theme === 'dark' ? 'selected' : ''}>深色主题</option>
                                <option value="blue" ${this.settings.theme === 'blue' ? 'selected' : ''}>蓝色主题</option>
                                <option value="green" ${this.settings.theme === 'green' ? 'selected' : ''}>绿色主题</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="settings-actions">
                    <button class="settings-btn save-btn" onclick="settingsPanel.saveSettings()">
                        💾 保存设置
                    </button>
                    <button class="settings-btn reset-btn" onclick="settingsPanel.resetSettings()">
                        🔄 恢复默认
                    </button>
                    <button class="settings-btn test-btn" onclick="settingsPanel.testSound()">
                        🔊 测试音效
                    </button>
                    <button class="settings-btn close-btn" onclick="this.closest('.settings-modal').remove()">
                        关闭
                    </button>
                </div>
            </div>
        `;

        // 设置事件监听器
        this.setupEventListeners();

        // 点击背景关闭
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.modal.remove();
            }
        });
    }

    setupEventListeners() {
        // 音量滑块
        const volumeSlider = this.modal.querySelector('#volume');
        const volumeValue = this.modal.querySelector('.volume-value');
        
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            volumeValue.textContent = e.target.value + '%';
            SoundManager.setVolume(volume);
        });

        // 实时预览设置变化
        const checkboxes = this.modal.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.previewSettings();
            });
        });

        // 主题选择
        const themeSelect = this.modal.querySelector('#theme');
        themeSelect.addEventListener('change', () => {
            this.previewTheme(themeSelect.value);
        });
    }

    previewSettings() {
        // 实时预览某些设置的效果
        const soundEnabled = this.modal.querySelector('#soundEnabled').checked;
        SoundManager.setEnabled(soundEnabled);
        
        const showTimer = this.modal.querySelector('#showTimer').checked;
        const timerElement = document.querySelector('.timer');
        if (timerElement) {
            timerElement.style.display = showTimer ? 'flex' : 'none';
        }
        
        const showRemainingNumbers = this.modal.querySelector('#showRemainingNumbers').checked;
        const remainingElement = document.querySelector('.remaining-numbers');
        if (remainingElement) {
            remainingElement.style.display = showRemainingNumbers ? 'block' : 'none';
        }
    }

    previewTheme(theme) {
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        if (theme !== 'default') {
            document.body.classList.add(`theme-${theme}`);
        }
    }

    saveSettings() {
        // 收集所有设置
        const newSettings = {
            soundEnabled: this.modal.querySelector('#soundEnabled').checked,
            autoSave: this.modal.querySelector('#autoSave').checked,
            showTimer: this.modal.querySelector('#showTimer').checked,
            highlightErrors: this.modal.querySelector('#highlightErrors').checked,
            highlightRelated: this.modal.querySelector('#highlightRelated').checked,
            theme: this.modal.querySelector('#theme').value,
            autoCheckErrors: this.modal.querySelector('#autoCheckErrors').checked,
            showRemainingNumbers: this.modal.querySelector('#showRemainingNumbers').checked,
            confirmBeforeNewGame: this.modal.querySelector('#confirmBeforeNewGame').checked
        };

        // 保存设置
        if (GameStorage.saveSettings(newSettings)) {
            this.settings = newSettings;
            this.applySettings();
            NotificationSystem.success('设置已保存');
            
            // 通知主应用设置已更改
            if (window.sudokuApp && window.sudokuApp.onSettingsChanged) {
                window.sudokuApp.onSettingsChanged(newSettings);
            }
        } else {
            NotificationSystem.error('设置保存失败');
        }
    }

    resetSettings() {
        if (confirm('确定要恢复默认设置吗？')) {
            const defaultSettings = GameStorage.getDefaultSettings();
            
            // 更新UI
            Object.keys(defaultSettings).forEach(key => {
                const element = this.modal.querySelector(`#${key}`);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = defaultSettings[key];
                    } else {
                        element.value = defaultSettings[key];
                    }
                }
            });

            // 重置音量
            const volumeSlider = this.modal.querySelector('#volume');
            const volumeValue = this.modal.querySelector('.volume-value');
            volumeSlider.value = 30;
            volumeValue.textContent = '30%';
            SoundManager.setVolume(0.3);

            // 预览设置
            this.previewSettings();
            this.previewTheme(defaultSettings.theme);
            
            NotificationSystem.info('已恢复默认设置');
        }
    }

    testSound() {
        SoundManager.play('success');
        setTimeout(() => SoundManager.play('input'), 200);
        setTimeout(() => SoundManager.play('hint'), 400);
    }

    applySettings() {
        // 应用音效设置
        SoundManager.setEnabled(this.settings.soundEnabled);
        
        // 应用主题
        this.previewTheme(this.settings.theme);
        
        // 应用显示设置
        this.previewSettings();
    }

    hide() {
        if (this.modal) {
            this.modal.classList.remove('show');
            setTimeout(() => {
                if (this.modal) {
                    this.modal.remove();
                    this.modal = null;
                }
            }, 300);
        }
    }

    // 静态实例
    static instance = null;

    static getInstance() {
        if (!this.instance) {
            this.instance = new SettingsPanel();
        }
        return this.instance;
    }

    static show() {
        return this.getInstance().show();
    }
}

// 全局实例
let settingsPanel = SettingsPanel.getInstance();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsPanel;
} else {
    window.SettingsPanel = SettingsPanel;
}