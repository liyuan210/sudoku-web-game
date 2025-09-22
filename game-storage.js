// 游戏数据存储管理
class GameStorage {
    static KEYS = {
        CURRENT_GAME: 'sudoku_current_game',
        SETTINGS: 'sudoku_settings',
        STATS: 'sudoku_stats'
    };

    // 保存当前游戏状态
    static saveGame(gameState) {
        try {
            const saveData = {
                ...gameState,
                timestamp: Date.now(),
                version: '1.0.0'
            };
            localStorage.setItem(this.KEYS.CURRENT_GAME, JSON.stringify(saveData));
            return true;
        } catch (error) {
            // Failed to save game - silently handle for AdSense compliance
            return false;
        }
    }

    // 加载游戏状态
    static loadGame() {
        try {
            const saved = localStorage.getItem(this.KEYS.CURRENT_GAME);
            if (!saved) return null;
            
            const gameData = JSON.parse(saved);
            
            // 检查数据是否过期（24小时）
            const now = Date.now();
            const dayInMs = 24 * 60 * 60 * 1000;
            if (now - gameData.timestamp > dayInMs) {
                this.clearGame();
                return null;
            }
            
            return gameData;
        } catch (error) {
            // Failed to load game - silently handle for AdSense compliance
            return null;
        }
    }

    // 清除当前游戏
    static clearGame() {
        localStorage.removeItem(this.KEYS.CURRENT_GAME);
    }

    // 保存游戏设置
    static saveSettings(settings) {
        try {
            const currentSettings = this.getSettings();
            const updatedSettings = { ...currentSettings, ...settings };
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(updatedSettings));
            return true;
        } catch (error) {
            // Failed to save settings - silently handle for AdSense compliance
            return false;
        }
    }

    // 获取游戏设置
    static getSettings() {
        try {
            const settings = localStorage.getItem(this.KEYS.SETTINGS);
            return settings ? JSON.parse(settings) : this.getDefaultSettings();
        } catch (error) {
            // Failed to load settings - silently handle for AdSense compliance
            return this.getDefaultSettings();
        }
    }

    // 默认设置
    static getDefaultSettings() {
        return {
            soundEnabled: true,
            autoSave: true,
            showTimer: true,
            highlightErrors: true,
            highlightRelated: true,
            theme: 'default',
            autoCheckErrors: true,
            showRemainingNumbers: true,
            confirmBeforeNewGame: true
        };
    }

    // 保存游戏统计
    static saveStats(newStats) {
        try {
            const currentStats = this.getStats();
            const updatedStats = { ...currentStats };
            
            // 更新统计数据
            if (newStats.gameCompleted) {
                updatedStats.gamesCompleted++;
                updatedStats.totalPlayTime += newStats.playTime || 0;
                
                // 更新最佳时间
                const difficulty = newStats.difficulty;
                if (difficulty && newStats.playTime) {
                    if (!updatedStats.bestTimes[difficulty] || 
                        newStats.playTime < updatedStats.bestTimes[difficulty]) {
                        updatedStats.bestTimes[difficulty] = newStats.playTime;
                    }
                }
            }
            
            if (newStats.gameStarted) {
                updatedStats.gamesPlayed++;
            }
            
            // 更新其他统计
            Object.keys(newStats).forEach(key => {
                if (key !== 'gameCompleted' && key !== 'gameStarted' && 
                    key !== 'playTime' && key !== 'difficulty') {
                    updatedStats[key] = newStats[key];
                }
            });
            
            localStorage.setItem(this.KEYS.STATS, JSON.stringify(updatedStats));
            return true;
        } catch (error) {
            // Failed to save stats - silently handle for AdSense compliance
            return false;
        }
    }

    // 获取游戏统计
    static getStats() {
        try {
            const stats = localStorage.getItem(this.KEYS.STATS);
            return stats ? JSON.parse(stats) : this.getDefaultStats();
        } catch (error) {
            // Failed to load stats - silently handle for AdSense compliance
            return this.getDefaultStats();
        }
    }

    // 默认统计数据
    static getDefaultStats() {
        return {
            gamesPlayed: 0,
            gamesCompleted: 0,
            totalPlayTime: 0,
            bestTimes: {},
            hintsUsed: 0,
            errorsFound: 0,
            lastPlayed: null
        };
    }

    // 重置统计数据
    static resetStats() {
        localStorage.removeItem(this.KEYS.STATS);
        return this.getDefaultStats();
    }

    // 导出数据
    static exportData() {
        return {
            settings: this.getSettings(),
            stats: this.getStats(),
            currentGame: this.loadGame(),
            exportDate: new Date().toISOString()
        };
    }

    // 导入数据
    static importData(data) {
        try {
            if (data.settings) {
                this.saveSettings(data.settings);
            }
            if (data.stats) {
                localStorage.setItem(this.KEYS.STATS, JSON.stringify(data.stats));
            }
            if (data.currentGame) {
                this.saveGame(data.currentGame);
            }
            return true;
        } catch (error) {
            // Failed to import data - silently handle for AdSense compliance
            return false;
        }
    }

    // 检查存储空间
    static getStorageInfo() {
        try {
            const used = new Blob(Object.values(localStorage)).size;
            const quota = 5 * 1024 * 1024; // 5MB 估算
            return {
                used: used,
                quota: quota,
                available: quota - used,
                percentage: (used / quota * 100).toFixed(2)
            };
        } catch (error) {
            return null;
        }
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameStorage;
} else {
    window.GameStorage = GameStorage;
}