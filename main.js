// 主游戏应用类
class SudokuApp {
    constructor() {
        this.gameEngine = new GameEngine();
        this.currentDifficulty = 'normal';
        this.selectedNumber = null;
        this.highlightedCells = [];
        
        // DOM元素
        this.boardElement = document.getElementById('sudoku-board');
        this.timerElement = document.getElementById('timer');
        this.difficultySelect = document.getElementById('difficulty-select');
        this.numberButtons = document.querySelectorAll('.number-btn');
        this.actionButtons = {
            pencil: document.getElementById('pencil-btn'),
            eraser: document.getElementById('eraser-btn'),
            undo: document.getElementById('undo-btn'),
            redo: document.getElementById('redo-btn')
        };
        this.gameButtons = {
            newGame: document.getElementById('new-game-btn'),
            pause: document.getElementById('pause-btn'),
            hint: document.getElementById('hint-btn'),
            solve: document.getElementById('solve-btn')
        };
        this.remainingNumbersElement = document.getElementById('remaining-numbers');
        this.winModal = document.getElementById('win-modal');
        this.pauseOverlay = document.getElementById('pause-overlay');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupGameEngineListeners();
        this.createBoard();
        this.startNewGame();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 难度选择
        this.difficultySelect.addEventListener('change', (e) => {
            this.currentDifficulty = e.target.value;
            this.startNewGame();
        });

        // 数字按钮
        this.numberButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const number = parseInt(e.target.dataset.number);
                this.selectNumber(number);
            });
        });

        // 操作按钮
        this.actionButtons.pencil.addEventListener('click', () => {
            this.gameEngine.togglePencilMode();
        });

        this.actionButtons.eraser.addEventListener('click', () => {
            this.gameEngine.eraseCell();
        });

        this.actionButtons.undo.addEventListener('click', () => {
            this.gameEngine.undo();
        });

        this.actionButtons.redo.addEventListener('click', () => {
            this.gameEngine.redo();
        });

        // 游戏按钮
        this.gameButtons.newGame.addEventListener('click', () => {
            this.startNewGame();
        });

        this.gameButtons.pause.addEventListener('click', () => {
            this.togglePause();
        });

        this.gameButtons.hint.addEventListener('click', () => {
            this.gameEngine.getHint();
        });

        this.gameButtons.solve.addEventListener('click', () => {
            this.gameEngine.showSolution();
        });

        // 模态框按钮
        document.getElementById('new-game-modal-btn').addEventListener('click', () => {
            this.hideWinModal();
            this.startNewGame();
        });

        document.getElementById('close-modal-btn').addEventListener('click', () => {
            this.hideWinModal();
        });

        document.getElementById('resume-btn').addEventListener('click', () => {
            this.togglePause();
        });

        // 键盘事件
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });

        // 点击模态框外部关闭
        this.winModal.addEventListener('click', (e) => {
            if (e.target === this.winModal) {
                this.hideWinModal();
            }
        });
    }

    // 设置游戏引擎监听器
    setupGameEngineListeners() {
        this.gameEngine.on('gameInitialized', (data) => {
            this.updateBoard(data.board);
            this.updateGivenCells(data.givenCells);
        });

        this.gameEngine.on('boardUpdated', (data) => {
            this.updateBoard(data.board);
            this.updatePencilMarks(data.pencilMarks);
            // 数字输入后取消选择状态
            this.clearNumberSelection();
        });

        this.gameEngine.on('cellSelected', (data) => {
            this.updateSelectedCell(data.row, data.col);
        });

        this.gameEngine.on('cellsHighlighted', (cells) => {
            this.updateHighlightedCells(cells);
        });

        this.gameEngine.on('pencilModeChanged', (isPencilMode) => {
            this.updatePencilModeUI(isPencilMode);
        });

        this.gameEngine.on('remainingNumbersUpdated', (remaining) => {
            this.updateRemainingNumbers(remaining);
        });

        this.gameEngine.on('timerUpdated', (elapsedTime) => {
            this.updateTimer(elapsedTime);
        });

        this.gameEngine.on('gameCompleted', (data) => {
            this.handleGameComplete(data);
        });

        this.gameEngine.on('gamePaused', () => {
            this.showPauseOverlay();
        });

        this.gameEngine.on('gameResumed', () => {
            this.hidePauseOverlay();
        });

        this.gameEngine.on('hintProvided', (hint) => {
            this.showHint(hint);
        });

        this.gameEngine.on('errorsFound', (errors) => {
            this.showErrors(errors);
        });

        this.gameEngine.on('solutionShown', () => {
            this.handleSolutionShown();
        });
    }

    // 创建棋盘
    createBoard() {
        this.boardElement.innerHTML = '';
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', () => {
                    this.selectCell(row, col);
                });
                
                this.boardElement.appendChild(cell);
            }
        }
    }

    // 开始新游戏
    startNewGame() {
        this.clearHighlights();
        this.clearErrors();
        this.clearNumberSelection();
        this.hideWinModal();
        this.hidePauseOverlay();
        this.gameEngine.initNewGame(this.currentDifficulty);
    }

    // 选择格子
    selectCell(row, col) {
        this.gameEngine.selectCell(row, col);
        
        // 如果有选中的数字，直接输入
        if (this.selectedNumber) {
            this.gameEngine.inputNumber(this.selectedNumber);
        }
    }

    // 选择数字
    selectNumber(number) {
        // 更新选中的数字
        this.selectedNumber = this.selectedNumber === number ? null : number;
        
        // 更新数字按钮状态
        this.numberButtons.forEach(btn => {
            btn.classList.toggle('selected', parseInt(btn.dataset.number) === this.selectedNumber);
        });
        
        // 如果有选中的格子，直接输入数字
        if (this.gameEngine.selectedCell && this.selectedNumber) {
            this.gameEngine.inputNumber(this.selectedNumber);
        }
    }

    // 清除数字选择状态
    clearNumberSelection() {
        this.selectedNumber = null;
        this.numberButtons.forEach(btn => {
            btn.classList.remove('selected');
        });
    }

    // 更新棋盘显示
    updateBoard(board) {
        const cells = this.boardElement.querySelectorAll('.sudoku-cell');
        
        cells.forEach((cell, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            const value = board[row][col];
            
            cell.textContent = value === 0 ? '' : value.toString();
            
            // 清除铅笔标记显示
            cell.classList.remove('pencil-notes');
            const pencilNotes = cell.querySelectorAll('.pencil-note');
            pencilNotes.forEach(note => note.remove());
        });
    }

    // 更新给定格子样式
    updateGivenCells(givenCells) {
        const cells = this.boardElement.querySelectorAll('.sudoku-cell');
        
        cells.forEach((cell, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            const key = `${row}-${col}`;
            
            cell.classList.toggle('given', givenCells.includes(key));
        });
    }

    // 更新铅笔标记
    updatePencilMarks(pencilMarks) {
        const cells = this.boardElement.querySelectorAll('.sudoku-cell');
        
        cells.forEach((cell, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            const key = `${row}-${col}`;
            
            // 清除现有铅笔标记
            const existingNotes = cell.querySelectorAll('.pencil-note');
            existingNotes.forEach(note => note.remove());
            cell.classList.remove('pencil-notes');
            
            if (pencilMarks[key] && pencilMarks[key].length > 0) {
                cell.classList.add('pencil-notes');
                cell.textContent = '';
                
                pencilMarks[key].forEach(num => {
                    const note = document.createElement('span');
                    note.className = 'pencil-note';
                    note.textContent = num;
                    cell.appendChild(note);
                });
            }
        });
    }

    // 更新选中格子
    updateSelectedCell(row, col) {
        const cells = this.boardElement.querySelectorAll('.sudoku-cell');
        
        cells.forEach((cell, index) => {
            const cellRow = Math.floor(index / 9);
            const cellCol = index % 9;
            
            cell.classList.toggle('selected', cellRow === row && cellCol === col);
        });
    }

    // 更新高亮格子
    updateHighlightedCells(highlightedCells) {
        // 清除之前的高亮
        this.clearHighlights();
        
        const cells = this.boardElement.querySelectorAll('.sudoku-cell');
        
        highlightedCells.forEach(({ row, col, type }) => {
            const index = row * 9 + col;
            const cell = cells[index];
            
            if (type === 'same') {
                cell.classList.add('highlight');
            } else {
                cell.classList.add('highlight');
            }
        });
        
        this.highlightedCells = highlightedCells;
    }

    // 清除高亮
    clearHighlights() {
        const cells = this.boardElement.querySelectorAll('.sudoku-cell');
        cells.forEach(cell => {
            cell.classList.remove('highlight');
        });
        this.highlightedCells = [];
    }

    // 更新铅笔模式UI
    updatePencilModeUI(isPencilMode) {
        this.actionButtons.pencil.classList.toggle('active', isPencilMode);
    }

    // 更新剩余数字
    updateRemainingNumbers(remaining) {
        for (let num = 1; num <= 9; num++) {
            const item = this.remainingNumbersElement.querySelector(`[data-number="${num}"] span`);
            if (item) {
                item.textContent = remaining[num];
                
                // 如果数字用完了，禁用对应按钮
                const button = document.querySelector(`.number-btn[data-number="${num}"]`);
                if (button) {
                    button.disabled = remaining[num] === 0;
                }
            }
        }
    }

    // 更新计时器
    updateTimer(elapsedTime) {
        this.timerElement.textContent = this.gameEngine.formatTime(elapsedTime);
    }

    // 处理游戏完成
    handleGameComplete(data) {
        if (data.isValid) {
            this.showWinModal(data.time);
        } else {
            // 显示错误提示
            alert('数独解答有误，请检查后重试！');
        }
    }

    // 显示胜利模态框
    showWinModal(time) {
        const finalTimeElement = document.getElementById('final-time');
        finalTimeElement.textContent = this.gameEngine.formatTime(time);
        this.winModal.classList.add('show');
    }

    // 隐藏胜利模态框
    hideWinModal() {
        this.winModal.classList.remove('show');
    }

    // 切换暂停状态
    togglePause() {
        if (this.gameEngine.isPaused) {
            this.gameEngine.resumeGame();
        } else {
            this.gameEngine.pauseGame();
        }
    }

    // 显示暂停覆盖层
    showPauseOverlay() {
        this.pauseOverlay.classList.add('show');
        this.gameButtons.pause.textContent = '继续';
    }

    // 隐藏暂停覆盖层
    hidePauseOverlay() {
        this.pauseOverlay.classList.remove('show');
        this.gameButtons.pause.textContent = '暂停';
    }

    // 显示提示
    showHint(hint) {
        const { row, col, value } = hint;
        const cells = this.boardElement.querySelectorAll('.sudoku-cell');
        const index = row * 9 + col;
        const cell = cells[index];
        
        // 高亮提示格子
        cell.classList.add('highlight');
        
        // 3秒后移除高亮
        setTimeout(() => {
            cell.classList.remove('highlight');
        }, 3000);
        
        // 选中该格子
        this.gameEngine.selectCell(row, col);
        
        // 显示提示值
        alert(`提示：第${row + 1}行第${col + 1}列应该填入数字${value}`);
    }

    // 显示错误
    showErrors(errors) {
        const cells = this.boardElement.querySelectorAll('.sudoku-cell');
        
        // 清除之前的错误
        this.clearErrors();
        
        errors.forEach(({ row, col }) => {
            const index = row * 9 + col;
            const cell = cells[index];
            cell.classList.add('error');
        });
        
        // 3秒后清除错误显示
        setTimeout(() => {
            this.clearErrors();
        }, 3000);
    }

    // 清除错误显示
    clearErrors() {
        const cells = this.boardElement.querySelectorAll('.sudoku-cell');
        cells.forEach(cell => {
            cell.classList.remove('error');
        });
    }

    // 处理解答显示
    handleSolutionShown() {
        alert('已显示完整解答！');
    }

    // 处理键盘输入
    handleKeyPress(e) {
        if (this.gameEngine.isPaused) return;
        
        const key = e.key;
        
        // 数字键 1-9
        if (key >= '1' && key <= '9') {
            const number = parseInt(key);
            this.selectNumber(number);
            e.preventDefault();
        }
        
        // 方向键
        if (this.gameEngine.selectedCell) {
            const { row, col } = this.gameEngine.selectedCell;
            let newRow = row;
            let newCol = col;
            
            switch (key) {
                case 'ArrowUp':
                    newRow = Math.max(0, row - 1);
                    break;
                case 'ArrowDown':
                    newRow = Math.min(8, row + 1);
                    break;
                case 'ArrowLeft':
                    newCol = Math.max(0, col - 1);
                    break;
                case 'ArrowRight':
                    newCol = Math.min(8, col + 1);
                    break;
            }
            
            if (newRow !== row || newCol !== col) {
                this.gameEngine.selectCell(newRow, newCol);
                e.preventDefault();
            }
        }
        
        // 删除键
        if (key === 'Delete' || key === 'Backspace') {
            this.gameEngine.eraseCell();
            e.preventDefault();
        }
        
        // 空格键切换铅笔模式
        if (key === ' ') {
            this.gameEngine.togglePencilMode();
            e.preventDefault();
        }
        
        // Ctrl+Z 撤销
        if (e.ctrlKey && key === 'z') {
            this.gameEngine.undo();
            e.preventDefault();
        }
        
        // Ctrl+Y 重做
        if (e.ctrlKey && key === 'y') {
            this.gameEngine.redo();
            e.preventDefault();
        }
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new SudokuApp();
    
    // 将应用实例暴露到全局，便于调试
    window.sudokuApp = app;
}); 