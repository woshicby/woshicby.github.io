// 多文明演化游戏入口文件
// 确保DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('多文明演化游戏开始初始化');
    
    // 创建模拟器实例并暴露到全局作用域
    window.simulator = new Simulator();
    
    // 初始化UI
    window.simulator.initUI();
    
    // 开始模拟
    window.simulator.start();
    
    console.log('模拟器初始化完成，文明数量：', window.simulator.civilizations.length);
});

// 全局控制函数
function startSimulation() {
    if (window.simulator) {
        window.simulator.start();
        updateControlButtons('running');
    }
}

function pauseSimulation() {
    if (window.simulator) {
        window.simulator.pause();
        updateControlButtons('paused');
    }
}

function resumeSimulation() {
    if (window.simulator) {
        window.simulator.resume();
        updateControlButtons('running');
    }
}

function resetSimulation() {
    if (window.simulator) {
        window.simulator.reset();
        updateControlButtons('stopped');
    }
}

function exportSimulationLog() {
    if (window.simulator) {
        window.simulator.downloadLog();
    }
}

function updateControlButtons(state) {
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    
    if (!startBtn || !pauseBtn || !resumeBtn) return;
    
    switch(state) {
        case 'running':
            startBtn.style.display = 'none';
            pauseBtn.style.display = 'inline-block';
            resumeBtn.style.display = 'none';
            break;
        case 'paused':
            startBtn.style.display = 'none';
            pauseBtn.style.display = 'none';
            resumeBtn.style.display = 'inline-block';
            break;
        case 'stopped':
            startBtn.style.display = 'inline-block';
            pauseBtn.style.display = 'none';
            resumeBtn.style.display = 'none';
            break;
    }
}