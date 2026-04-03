// 古籍比对系统配置文件
const CONFIG = {
    // 系统设置
    MAX_FILE_SIZE: 200 * 1024 * 1024, // 200MB
    MAX_VERSIONS: 6,
    SUPPORTED_FORMATS: ['.jpg', '.jpeg', '.png', '.pdf'],
    
    // OCR设置
    DEFAULT_OCR: {
        name: 'Tesseract.js',
        language: 'chi_sim', // 简体中文
        version: 'v2.1.5'
    },
    
    // 页面文本
    TEXTS: {
        title: '古籍多版本比对系统',
        subtitle: '免费在线工具 · 支持OCR识别 · 人工逐页核查',
        instructions: [
            '1. 选择版本数量（2-6个）',
            '2. 上传图片/PDF或直接输入文本',
            '3. 选择OCR识别方式',
            '4. 开始处理并查看比对结果'
        ]
    },
    
   
// 用户设置存储
let userSettings = {
    ocrType: 'default',
    enableReview: true,
    customAPI: {
        key: '',
        url: ''
    }
};

// 加载用户设置
function loadSettings() {
    const saved = localStorage.getItem('guji_settings');
    if (saved) {
        userSettings = JSON.parse(saved);
    }
}

// 保存用户设置
function saveSettings() {
    localStorage.setItem('guji_settings', JSON.stringify(userSettings));
}
