// 游戏引擎类
class GameEngine {
    constructor() {
        this.sudokuGenerator = new SudokuGenerator();
        this.currentBoard = Array(9).fill(null).map(() => Array(9).fill(0));
        this.solvedBoard = Array(9).fill(null).map(() => Array(9).fill(0));
        this.givenCells = new Set(); // 存储初始给定的格子
        this.pencilMarks = {}; // 存储铅笔标记
        this.history = []; // 历史记录用于撤销
        this.historyIndex = -1; // 当前历史位置
        this.selectedCell = null; // 当前选中的格子
        this.isPencilMode = false; // 铅笔模式
        this.gameStartTime = null;
        this.gameEndTime = null;
        this.isGameComplete = false;
        this.isPaused = false;
        this.timer = null;
        this.elapsedTime = 0;
        this.listeners = {};
        
        // 设置数独生成器监听器
        this.sudokuGenerator.setListener({
            onSolvedBoardCreated: (solvedBoard) => {
                this.solvedBoard = solvedBoard.map(row => [...row]);
                this.emit('solvedBoardCreated', this.solvedBoard);
            }
        });
    }

    // 事件监听器管理
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    // 初始化新游戏
    initNewGame(difficulty = 'normal') {
        const missingDigits = DIFFICULTY_CONFIG[difficulty];
        const result = this.sudokuGenerator.init(9, missingDigits);
        
        this.currentBoard = result.board.map(row => [...row]);
        this.solvedBoard = result.solvedBoard.map(row => [...row]);
        
        // 记录初始给定的格子
        this.givenCells.clear();
        this.pencilMarks = {};
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.currentBoard[row][col] !== 0) {
                    this.givenCells.add(`${row}-${col}`);
                }
            }
        }
        
        // 重置游戏状态
        this.history = [this.deepCopyBoard(this.currentBoard)];
        this.historyIndex = 0;
        this.selectedCell = null;
        this.isPencilMode = false;
        this.isGameComplete = false;
        this.isPaused = false;
        this.elapsedTime = 0;
        
        // 开始计时
        this.startTimer();
        
        // 通知监听器
        this.emit('gameInitialized', {
            board: this.currentBoard,
            solvedBoard: this.solvedBoard,
            givenCells: Array.from(this.givenCells)
        });
        
        this.updateRemainingNumbers();
    }

    // 深拷贝棋盘
    deepCopyBoard(board) {
        return board.map(row => [...row]);
    }

    // 深拷贝铅笔标记
    deepCopyPencilMarks(pencilMarks) {
        const copy = {};
        for (const key in pencilMarks) {
            copy[key] = [...pencilMarks[key]];
        }
        return copy;
    }

    // 选择格子
    selectCell(row, col) {
        if (this.isPaused || this.isGameComplete) return;
        
        this.selectedCell = { row, col };
        this.emit('cellSelected', { row, col });
        
        // 高亮相关格子
        this.highlightRelatedCells(row, col);
    }

    // 高亮相关格子
    highlightRelatedCells(row, col) {
        const relatedCells = [];
        const currentValue = this.currentBoard[row][col];
        
        // 同行、同列、同宫格的格子
        for (let i = 0; i < 9; i++) {
            // 同行
            if (i !== col) {
                relatedCells.push({ row, col: i, type: 'row' });
            }
            // 同列
            if (i !== row) {
                relatedCells.push({ row: i, col, type: 'col' });
            }
        }
        
        // 同宫格
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = boxRow; i < boxRow + 3; i++) {
            for (let j = boxCol; j < boxCol + 3; j++) {
                if (i !== row || j !== col) {
                    relatedCells.push({ row: i, col: j, type: 'box' });
                }
            }
        }
        
        // 相同数字的格子
        if (currentValue !== 0) {
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    if (this.currentBoard[i][j] === currentValue && (i !== row || j !== col)) {
                        relatedCells.push({ row: i, col: j, type: 'same' });
                    }
                }
            }
        }
        
        this.emit('cellsHighlighted', relatedCells);
    }

    // 输入数字
    inputNumber(num) {
        if (!this.selectedCell || this.isPaused || this.isGameComplete) return;
        
        const { row, col } = this.selectedCell;
        
        // 检查是否是给定格子
        if (this.givenCells.has(`${row}-${col}`)) return;
        
        // 保存当前状态到历史记录
        this.saveToHistory();
        
        if (this.isPencilMode) {
            this.handlePencilInput(row, col, num);
        } else {
            this.handleNormalInput(row, col, num);
        }
        
        this.emit('boardUpdated', {
            board: this.currentBoard,
            pencilMarks: this.pencilMarks
        });
        
        this.updateRemainingNumbers();
        this.checkGameComplete();
    }

    // 处理普通输入
    handleNormalInput(row, col, num) {
        const currentValue = this.currentBoard[row][col];
        
        if (currentValue === num) {
            // 如果输入相同数字，则清除
            this.currentBoard[row][col] = 0;
        } else {
            // 输入新数字
            this.currentBoard[row][col] = num;
            // 清除该格子的铅笔标记
            delete this.pencilMarks[`${row}-${col}`];
        }
        
        // 检查是否有错误
        this.checkForErrors(row, col);
    }

    // 处理铅笔输入
    handlePencilInput(row, col, num) {
        const key = `${row}-${col}`;
        
        if (!this.pencilMarks[key]) {
            this.pencilMarks[key] = [];
        }
        
        const index = this.pencilMarks[key].indexOf(num);
        if (index > -1) {
            // 如果已存在，则移除
            this.pencilMarks[key].splice(index, 1);
            if (this.pencilMarks[key].length === 0) {
                delete this.pencilMarks[key];
            }
        } else {
            // 如果不存在，则添加
            this.pencilMarks[key].push(num);
            this.pencilMarks[key].sort();
        }
        
        // 清除该格子的数字
        this.currentBoard[row][col] = 0;
    }

    // 检查错误
    checkForErrors(row, col) {
        const num = this.currentBoard[row][col];
        if (num === 0) return;
        
        const errors = [];
        
        // 检查行
        for (let c = 0; c < 9; c++) {
            if (c !== col && this.currentBoard[row][c] === num) {
                errors.push({ row, col: c });
            }
        }
        
        // 检查列
        for (let r = 0; r < 9; r++) {
            if (r !== row && this.currentBoard[r][col] === num) {
                errors.push({ row: r, col });
            }
        }
        
        // 检查宫格
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if ((r !== row || c !== col) && this.currentBoard[r][c] === num) {
                    errors.push({ row: r, col: c });
                }
            }
        }
        
        if (errors.length > 0) {
            errors.push({ row, col });
            this.emit('errorsFound', errors);
        }
    }

    // 保存到历史记录
    saveToHistory() {
        // 移除当前位置之后的历史记录
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // 添加新状态
        this.history.push({
            board: this.deepCopyBoard(this.currentBoard),
            pencilMarks: this.deepCopyPencilMarks(this.pencilMarks)
        });
        
        this.historyIndex++;
        
        // 限制历史记录长度
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    // 撤销
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const state = this.history[this.historyIndex];
            this.currentBoard = this.deepCopyBoard(state.board);
            this.pencilMarks = this.deepCopyPencilMarks(state.pencilMarks);
            
            this.emit('boardUpdated', {
                board: this.currentBoard,
                pencilMarks: this.pencilMarks
            });
            
            this.updateRemainingNumbers();
        }
    }

    // 重做
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const state = this.history[this.historyIndex];
            this.currentBoard = this.deepCopyBoard(state.board);
            this.pencilMarks = this.deepCopyPencilMarks(state.pencilMarks);
            
            this.emit('boardUpdated', {
                board: this.currentBoard,
                pencilMarks: this.pencilMarks
            });
            
            this.updateRemainingNumbers();
        }
    }

    // 切换铅笔模式
    togglePencilMode() {
        this.isPencilMode = !this.isPencilMode;
        this.emit('pencilModeChanged', this.isPencilMode);
    }

    // 橡皮擦
    eraseCell() {
        if (!this.selectedCell || this.isPaused || this.isGameComplete) return;
        
        const { row, col } = this.selectedCell;
        
        // 检查是否是给定格子
        if (this.givenCells.has(`${row}-${col}`)) return;
        
        this.saveToHistory();
        
        this.currentBoard[row][col] = 0;
        delete this.pencilMarks[`${row}-${col}`];
        
        this.emit('boardUpdated', {
            board: this.currentBoard,
            pencilMarks: this.pencilMarks
        });
        
        this.updateRemainingNumbers();
    }

    // 更新剩余数字
    updateRemainingNumbers() {
        const remaining = {};
        
        for (let num = 1; num <= 9; num++) {
            let count = 0;
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (this.currentBoard[row][col] === num) {
                        count++;
                    }
                }
            }
            remaining[num] = 9 - count;
        }
        
        this.emit('remainingNumbersUpdated', remaining);
    }

    // 检查游戏是否完成
    checkGameComplete() {
        if (this.sudokuGenerator.isComplete(this.currentBoard)) {
            if (this.sudokuGenerator.isValidSolution(this.currentBoard)) {
                this.isGameComplete = true;
                this.gameEndTime = Date.now();
                this.stopTimer();
                
                this.emit('gameCompleted', {
                    time: this.elapsedTime,
                    isValid: true
                });
            } else {
                this.emit('gameCompleted', {
                    time: this.elapsedTime,
                    isValid: false
                });
            }
        }
    }

    // 获取提示
    getHint() {
        if (this.isPaused || this.isGameComplete) return;
        
        const hint = this.sudokuGenerator.getHint(this.currentBoard);
        if (hint) {
            this.emit('hintProvided', hint);
        }
    }

    // 显示解答
    showSolution() {
        if (this.isPaused) return;
        
        this.saveToHistory();
        this.currentBoard = this.deepCopyBoard(this.solvedBoard);
        this.pencilMarks = {};
        this.isGameComplete = true;
        this.stopTimer();
        
        this.emit('boardUpdated', {
            board: this.currentBoard,
            pencilMarks: this.pencilMarks
        });
        
        this.emit('solutionShown');
    }

    // 开始计时
    startTimer() {
        this.gameStartTime = Date.now();
        this.timer = setInterval(() => {
            if (!this.isPaused && !this.isGameComplete) {
                this.elapsedTime = Date.now() - this.gameStartTime;
                this.emit('timerUpdated', this.elapsedTime);
            }
        }, 1000);
    }

    // 停止计时
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    // 暂停游戏
    pauseGame() {
        this.isPaused = true;
        this.emit('gamePaused');
    }

    // 继续游戏
    resumeGame() {
        this.isPaused = false;
        this.gameStartTime = Date.now() - this.elapsedTime;
        this.emit('gameResumed');
    }

    // 格式化时间
    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // 获取当前游戏状态
    getGameState() {
        return {
            currentBoard: this.currentBoard,
            solvedBoard: this.solvedBoard,
            givenCells: Array.from(this.givenCells),
            pencilMarks: this.pencilMarks,
            selectedCell: this.selectedCell,
            isPencilMode: this.isPencilMode,
            isGameComplete: this.isGameComplete,
            isPaused: this.isPaused,
            elapsedTime: this.elapsedTime,
            gameStartTime: this.gameStartTime,
            history: this.history,
            historyIndex: this.historyIndex
        };
    }

    // 加载游戏状态
    loadGameState(gameState) {
        try {
            this.currentBoard = gameState.currentBoard.map(row => [...row]);
            this.solvedBoard = gameState.solvedBoard.map(row => [...row]);
            this.givenCells = new Set(gameState.givenCells);
            this.pencilMarks = { ...gameState.pencilMarks };
            this.selectedCell = gameState.selectedCell;
            this.isPencilMode = gameState.isPencilMode || false;
            this.isGameComplete = gameState.isGameComplete || false;
            this.isPaused = gameState.isPaused || false;
            this.elapsedTime = gameState.elapsedTime || 0;
            this.gameStartTime = gameState.gameStartTime || Date.now();
            this.history = gameState.history || [this.deepCopyBoard(this.currentBoard)];
            this.historyIndex = gameState.historyIndex || 0;
            
            // 重新开始计时器
            if (!this.isGameComplete && !this.isPaused) {
                this.startTimer();
            }
            
            // 通知监听器
            this.emit('gameInitialized', {
                board: this.currentBoard,
                solvedBoard: this.solvedBoard,
                givenCells: Array.from(this.givenCells)
            });
            
            this.emit('boardUpdated', {
                board: this.currentBoard,
                pencilMarks: this.pencilMarks
            });
            
            this.emit('pencilModeChanged', this.isPencilMode);
            this.updateRemainingNumbers();
            
            if (this.selectedCell) {
                this.emit('cellSelected', this.selectedCell);
                this.highlightRelatedCells(this.selectedCell.row, this.selectedCell.col);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to load game state:', error);
            return false;
        }
    }

    // 销毁游戏引擎
    destroy() {
        this.stopTimer();
        this.listeners = {};
    }
}

// 导出游戏引擎
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameEngine;
} else {
    window.GameEngine = GameEngine;
} 