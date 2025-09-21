// 游戏统计面板
class StatsPanel {
    constructor() {
        this.modal = null;
    }

    show() {
        if (this.modal) {
            this.modal.remove();
        }

        const stats = GameStorage.getStats();
        this.createModal(stats);
        document.body.appendChild(this.modal);
        
        // 显示动画
        setTimeout(() => {
            this.modal.classList.add('show');
        }, 10);
    }

    createModal(stats) {
        this.modal = document.createElement('div');
        this.modal.className = 'stats-modal modal';
        
        this.modal.innerHTML = `
            <div class="stats-content modal-content">
                <div class="stats-header">
                    <h2>🏆 游戏统计</h2>
                    <button class="close-btn" onclick="this.closest('.stats-modal').remove()">×</button>
                </div>
                
                <div class="stats-overview">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">🎮</div>
                            <div class="stat-info">
                                <div class="stat-value">${stats.gamesPlayed}</div>
                                <div class="stat-label">游戏次数</div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon">✅</div>
                            <div class="stat-info">
                                <div class="stat-value">${stats.gamesCompleted}</div>
                                <div class="stat-label">完成次数</div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon">⏱️</div>
                            <div class="stat-info">
                                <div class="stat-value">${this.formatTime(stats.totalPlayTime)}</div>
                                <div class="stat-label">总游戏时间</div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon">📊</div>
                            <div class="stat-info">
                                <div class="stat-value">${this.calculateWinRate(stats)}%</div>
                                <div class="stat-label">完成率</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="best-times-section">
                    <h3>🏅 最佳时间</h3>
                    <div class="best-times-grid">
                        ${this.renderBestTimes(stats.bestTimes)}
                    </div>
                </div>

                <div class="additional-stats">
                    <h3>📈 详细统计</h3>
                    <div class="additional-stats-grid">
                        <div class="additional-stat">
                            <span class="stat-name">使用提示次数:</span>
                            <span class="stat-value">${stats.hintsUsed || 0}</span>
                        </div>
                        <div class="additional-stat">
                            <span class="stat-name">发现错误次数:</span>
                            <span class="stat-value">${stats.errorsFound || 0}</span>
                        </div>
                        <div class="additional-stat">
                            <span class="stat-name">平均游戏时间:</span>
                            <span class="stat-value">${this.calculateAverageTime(stats)}</span>
                        </div>
                        <div class="additional-stat">
                            <span class="stat-name">上次游戏:</span>
                            <span class="stat-value">${this.formatLastPlayed(stats.lastPlayed)}</span>
                        </div>
                    </div>
                </div>

                <div class="stats-actions">
                    <button class="stats-btn export-btn" onclick="statsPanel.exportStats()">
                        📤 导出数据
                    </button>
                    <button class="stats-btn import-btn" onclick="statsPanel.importStats()">
                        📥 导入数据
                    </button>
                    <button class="stats-btn reset-btn" onclick="statsPanel.resetStats()">
                        🗑️ 重置统计
                    </button>
                    <button class="stats-btn close-btn" onclick="this.closest('.stats-modal').remove()">
                        关闭
                    </button>
                </div>
            </div>
        `;

        // 点击背景关闭
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.modal.remove();
            }
        });
    }

    renderBestTimes(bestTimes) {
        const difficulties = {
            fast: { name: '快速', icon: '⚡' },
            easy: { name: '简单', icon: '🟢' },
            normal: { name: '普通', icon: '🟡' },
            hard: { name: '困难', icon: '🟠' },
            evil: { name: '极难', icon: '🔴' }
        };

        return Object.keys(difficulties).map(difficulty => {
            const time = bestTimes[difficulty];
            const diffInfo = difficulties[difficulty];
            
            return `
                <div class="best-time-item ${time ? 'has-time' : 'no-time'}">
                    <div class="difficulty-info">
                        <span class="difficulty-icon">${diffInfo.icon}</span>
                        <span class="difficulty-name">${diffInfo.name}</span>
                    </div>
                    <div class="time-info">
                        ${time ? this.formatTime(time) : '未完成'}
                    </div>
                </div>
            `;
        }).join('');
    }

    formatTime(milliseconds) {
        if (!milliseconds) return '00:00';
        
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    calculateWinRate(stats) {
        if (stats.gamesPlayed === 0) return 0;
        return Math.round((stats.gamesCompleted / stats.gamesPlayed) * 100);
    }

    calculateAverageTime(stats) {
        if (stats.gamesCompleted === 0) return '00:00';
        const average = stats.totalPlayTime / stats.gamesCompleted;
        return this.formatTime(average);
    }

    formatLastPlayed(timestamp) {
        if (!timestamp) return '从未';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return '今天';
        } else if (diffDays === 1) {
            return '昨天';
        } else if (diffDays < 7) {
            return `${diffDays}天前`;
        } else {
            return date.toLocaleDateString('zh-CN');
        }
    }

    exportStats() {
        try {
            const data = GameStorage.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `sudoku-stats-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            NotificationSystem.success('统计数据已导出');
        } catch (error) {
            NotificationSystem.error('导出失败: ' + error.message);
        }
    }

    importStats() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (GameStorage.importData(data)) {
                        NotificationSystem.success('数据导入成功');
                        this.show(); // 刷新显示
                    } else {
                        NotificationSystem.error('数据导入失败');
                    }
                } catch (error) {
                    NotificationSystem.error('文件格式错误: ' + error.message);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    resetStats() {
        if (confirm('确定要重置所有统计数据吗？此操作不可恢复。')) {
            GameStorage.resetStats();
            NotificationSystem.info('统计数据已重置');
            this.show(); // 刷新显示
        }
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
            this.instance = new StatsPanel();
        }
        return this.instance;
    }

    static show() {
        return this.getInstance().show();
    }
}

// 全局实例
let statsPanel = StatsPanel.getInstance();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatsPanel;
} else {
    window.StatsPanel = StatsPanel;
}