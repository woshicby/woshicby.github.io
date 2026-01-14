// 多文明演化游戏入口文件
// 确保DOM加载完成后执行
(document.addEventListener('DOMContentLoaded', function() {
    console.log('多文明演化游戏开始初始化');
    
    // 创建模拟器实例
    const simulator = new Simulator();
    
    // 初始化UI
    simulator.initUI();
    
    // 开始模拟
    simulator.start();
    
    console.log('模拟器初始化完成，文明数量：', simulator.civilizations.length);
}));