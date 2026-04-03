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
    
    // 示例数据（用于演示）
    SAMPLE_TEXTS: [
        `子曰：学而时习之，不亦说乎？
有朋自远方来，不亦乐乎？
人不知而不愠，不亦君子乎？`,
        
        `曾子曰：吾日三省吾身——
为人谋而不忠乎？
与朋友交而不信乎？
传不习乎？`,
        
        `子曰：道千乘之国，敬事而信，
节用而爱人，使民以时。`
    ]
};

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
