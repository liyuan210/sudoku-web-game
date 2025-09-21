// 数独生成器类
class SudokuGenerator {
    constructor() {
        this.board = [];
        this.solvedBoard = [];
        this.numRowOrColumn = 9;
        this.srNumRowOrColumn = 3; // sqrt(9) = 3
        this.numMissingDigits = 0;
        this.listener = null;
    }

    // 设置监听器
    setListener(listener) {
        this.listener = listener;
    }

    // 初始化数独
    init(n = 9, k = 40) {
        this.numRowOrColumn = n;
        this.numMissingDigits = k;
        this.srNumRowOrColumn = Math.sqrt(n);
        
        // 初始化棋盘
        this.board = Array(n).fill(null).map(() => Array(9).fill(0));
        
        // 生成数独
        this.fillValues();
        
        return {
            board: this.board,
            solvedBoard: this.solvedBoard
        };
    }

    // 检查数字在行中是否未使用
    unUsedInRow(row, num) {
        for (let col = 0; col < this.numRowOrColumn; col++) {
            if (this.board[row][col] === num) {
                return false;
            }
        }
        return true;
    }

    // 检查数字在列中是否未使用
    unUsedInCol(col, num) {
        for (let row = 0; row < this.numRowOrColumn; row++) {
            if (this.board[row][col] === num) {
                return false;
            }
        }
        return true;
    }

    // 检查数字在3x3宫格中是否未使用
    unUsedInBox(rowStart, colStart, num) {
        for (let i = 0; i < this.srNumRowOrColumn; i++) {
            for (let j = 0; j < this.srNumRowOrColumn; j++) {
                if (this.board[rowStart + i][colStart + j] === num) {
                    return false;
                }
            }
        }
        return true;
    }

    // 检查在指定位置放置数字是否安全
    checkIfSafe(row, col, num) {
        const rowStart = row - (row % this.srNumRowOrColumn);
        const colStart = col - (col % this.srNumRowOrColumn);
        
        return this.unUsedInRow(row, num) && 
               this.unUsedInCol(col, num) && 
               this.unUsedInBox(rowStart, colStart, num);
    }

    // 填充3x3宫格
    fillBox(row, col) {
        for (let i = 0; i < this.srNumRowOrColumn; i++) {
            for (let j = 0; j < this.srNumRowOrColumn; j++) {
                let num;
                do {
                    num = Math.floor(Math.random() * this.numRowOrColumn) + 1;
                } while (!this.unUsedInBox(row, col, num));
                
                this.board[row + i][col + j] = num;
            }
        }
    }

    // 填充对角线上的3x3宫格
    fillDiagonal() {
        for (let i = 0; i < this.numRowOrColumn; i += this.srNumRowOrColumn) {
            this.fillBox(i, i);
        }
    }

    // 递归填充剩余的格子
    fillRemaining(row, col) {
        if (col >= this.numRowOrColumn && row < this.numRowOrColumn - 1) {
            row++;
            col = 0;
        }
        
        if (row >= this.numRowOrColumn && col >= this.numRowOrColumn) {
            return true;
        }
        
        if (row < this.srNumRowOrColumn) {
            if (col < this.srNumRowOrColumn) {
                col = this.srNumRowOrColumn;
            }
        } else if (row < this.numRowOrColumn - this.srNumRowOrColumn) {
            if (col === Math.floor(row / this.srNumRowOrColumn) * this.srNumRowOrColumn) {
                col += this.srNumRowOrColumn;
            }
        } else {
            if (col === this.numRowOrColumn - this.srNumRowOrColumn) {
                row++;
                col = 0;
                if (row >= this.numRowOrColumn) {
                    return true;
                }
            }
        }
        
        for (let num = 1; num <= this.numRowOrColumn; num++) {
            if (this.checkIfSafe(row, col, num)) {
                this.board[row][col] = num;
                
                if (this.fillRemaining(row, col + 1)) {
                    return true;
                }
                
                this.board[row][col] = 0;
            }
        }
        
        return false;
    }

    // 移除K个数字创建游戏
    removeKDigits() {
        let count = this.numMissingDigits;
        
        while (count !== 0) {
            const cellId = Math.floor(Math.random() * (this.numRowOrColumn * this.numRowOrColumn));
            
            const row = Math.floor(cellId / this.numRowOrColumn);
            const col = cellId % this.numRowOrColumn;
            
            if (this.board[row][col] !== 0) {
                count--;
                this.board[row][col] = 0;
            }
        }
    }

    // 生成数独的主要方法
    fillValues() {
        // 填充对角线宫格
        this.fillDiagonal();
        
        // 填充剩余格子
        this.fillRemaining(0, this.srNumRowOrColumn);
        
        // 保存完整解答
        this.solvedBoard = this.board.map(row => [...row]);
        
        // 通知监听器
        if (this.listener && this.listener.onSolvedBoardCreated) {
            this.listener.onSolvedBoardCreated(this.solvedBoard);
        }
        
        // 移除数字创建谜题
        this.removeKDigits();
    }

    // 打印棋盘（调试用）
    printBoard() {
        // 生产环境下移除console.log
        if (process.env.NODE_ENV === 'development') {
            console.log('Current Board:');
            for (let i = 0; i < this.numRowOrColumn; i++) {
                console.log(this.board[i].join(' '));
            }
        }
        return this.board;
    }

    // 验证数独解答是否正确
    isValidSolution(board) {
        // 检查行
        for (let row = 0; row < 9; row++) {
            const seen = new Set();
            for (let col = 0; col < 9; col++) {
                const num = board[row][col];
                if (num !== 0) {
                    if (seen.has(num)) return false;
                    seen.add(num);
                }
            }
        }
        
        // 检查列
        for (let col = 0; col < 9; col++) {
            const seen = new Set();
            for (let row = 0; row < 9; row++) {
                const num = board[row][col];
                if (num !== 0) {
                    if (seen.has(num)) return false;
                    seen.add(num);
                }
            }
        }
        
        // 检查3x3宫格
        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                const seen = new Set();
                for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
                    for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
                        const num = board[row][col];
                        if (num !== 0) {
                            if (seen.has(num)) return false;
                            seen.add(num);
                        }
                    }
                }
            }
        }
        
        return true;
    }

    // 检查数独是否完成
    isComplete(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    // 获取提示
    getHint(currentBoard) {
        const emptyCells = [];
        
        // 找到所有空格
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (currentBoard[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        if (emptyCells.length === 0) return null;
        
        // 随机选择一个空格
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const { row, col } = randomCell;
        
        return {
            row,
            col,
            value: this.solvedBoard[row][col]
        };
    }
}

// 难度配置
const DIFFICULTY_CONFIG = {
    fast: 24,
    easy: 32,
    normal: 40,
    hard: 48,
    evil: 56
};

// 导出类和配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SudokuGenerator, DIFFICULTY_CONFIG };
} else {
    window.SudokuGenerator = SudokuGenerator;
    window.DIFFICULTY_CONFIG = DIFFICULTY_CONFIG;
} 