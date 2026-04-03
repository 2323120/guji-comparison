// 多版本OCR处理
async function processAllImages() {
    const versionCount = parseInt(document.getElementById('versionCount').value);
    const files = document.querySelectorAll('.version-file');
    const texts = document.querySelectorAll('.version-text');
    
    // 显示加载状态
    showLoading('正在识别多个版本，请稍候...');
    
    try {
        // 初始化OCR worker
        const worker = await Tesseract.createWorker('chi_sim');
        
        // 处理每个版本
        const results = [];
        for (let i = 0; i < versionCount; i++) {
            const file = files[i]?.files[0];
            const textArea = texts[i];
            
            let text = textArea.value.trim();
            
            // 如果有上传图片且文本区域为空，则使用OCR
            if (file && !text) {
                const result = await worker.recognize(file);
                text = result.data.text;
                textArea.value = text;
                
                // 更新进度
                updateProgress(i + 1, versionCount);
            }
            
            // 获取版本名称
            const nameInput = document.querySelector(`input[data-version="${i + 1}"]`);
            const versionName = nameInput?.value || `版本 ${i + 1}`;
            
            results.push({
                id: i + 1,
                name: versionName,
                text: text || textArea.value
            });
        }
        
        await worker.terminate();
        hideLoading();
        
        // 保存结果到全局变量
        window.versionResults = results;
        
        alert(`成功识别 ${results.length} 个版本！现在可以开始比对。`);
        
    } catch (error) {
        console.error('多版本识别错误:', error);
        hideLoading();
        alert('识别过程中出现错误，请检查网络或图片质量。');
    }
}

// 多版本比对函数
function compareMultipleVersions() {
    if (!window.versionResults || window.versionResults.length < 2) {
        alert('请先识别至少2个版本的文字');
        return;
    }
    
    const results = window.versionResults;
    const versionCount = results.length;
    
    // 创建比对表格
    let html = `
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>位置</th>
    `;
    
    // 添加表头（版本名称）
    results.forEach(version => {
        html += `<th>${version.name}</th>`;
    });
    html += `</tr></thead><tbody>`;
    
    // 这里需要实现多版本比对算法
    // 简化版：按行分割后逐行比对
    const allLines = results.map(v => v.text.split('\n'));
    const maxLines = Math.max(...allLines.map(lines => lines.length));
    
    for (let lineNum = 0; lineNum < maxLines; lineNum++) {
        html += `<tr><td class="text-muted">第${lineNum + 1}行</td>`;
        
        const lineTexts = results.map(v => 
            allLines[v.id - 1][lineNum] || ''
        );
        
        // 检查这一行是否所有版本都相同
        const isSameLine = lineTexts.every((text, i, arr) => 
            text === arr
        );
        
        lineTexts.forEach(text => {
            if (isSameLine) {
                html += `<td>${escapeHtml(text)}</td>`;
            } else {
                html += `<td class="diff-highlight">${escapeHtml(text)}</td>`;
            }
        });
        
        html += `</tr>`;
    }
    
    html += `</tbody></table>`;
    
    // 添加统计信息
    html += `
        <div class="mt-4">
            <h6>比对统计：</h6>
            <div class="row">
                <div class="col">
                    <span class="badge bg-info">总版本数: ${versionCount}</span>
                </div>
                <div class="col">
                    <span class="badge bg-success">完全相同的行: ${calculateSameLines(results)}</span>
                </div>
                <div class="col">
                    <span class="badge bg-warning">存在差异的行: ${calculateDiffLines(results)}</span>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('comparisonResult').innerHTML = html;
}

// 辅助函数：计算相同行数
function calculateSameLines(results) {
    const allLines = results.map(v => v.text.split('\n'));
    const maxLines = Math.max(...allLines.map(lines => lines.length));
    let sameCount = 0;
    
    for (let i = 0; i < maxLines; i++) {
        const lineTexts = results.map(v => allLines[v.id - 1][i] || '');
        if (lineTexts.every((text, idx, arr) => text === arr[0](@ref)) {
            sameCount++;
        }
    }
    
    return sameCount;
}

// 辅助函数：计算差异行数
function calculateDiffLines(results) {
    const allLines = results.map(v => v.text.split('\n'));
    const maxLines = Math.max(...allLines.map(lines => lines.length));
    return maxLines - calculateSameLines(results);
}

// 加载状态函数
function showLoading(message) {
    let loadingDiv = document.getElementById('multiLoading');
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'multiLoading';
        loadingDiv.className = 'alert alert-info';
        loadingDiv.innerHTML = `
            <div class="spinner-border spinner-border-sm me-2"></div>
            <span id="loadingMessage">${message}</span>
            <div class="progress mt-2">
                <div id="multiProgressBar" class="progress-bar progress-bar-striped progress-bar-animated" style="width: 0%"></div>
            </div>
        `;
        document.querySelector('.card-body').prepend(loadingDiv);
    }
    loadingDiv.style.display = 'block';
}

function updateProgress(current, total) {
    const progress = Math.round((current / total) * 100);
    const bar = document.getElementById('multiProgressBar');
    if (bar) bar.style.width = `${progress}%`;
    
    const msg = document.getElementById('loadingMessage');
    if (msg) msg.textContent = `正在处理版本 ${current}/${total}...`;
}

function hideLoading() {
    const loadingDiv = document.getElementById('multiLoading');
    if (loadingDiv) loadingDiv.style.display = 'none';
}
// OCR引擎选择逻辑
let currentOCRConfig = {
    engine: 'tesseract',
    baidu: { apiKey: '', secretKey: '' },
    tencent: { secretId: '', secretKey: '' }
};

// 监听OCR引擎选择变化
document.addEventListener('DOMContentLoaded', function() {
    const ocrRadios = document.querySelectorAll('input[name="ocrEngine"]');
    ocrRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const engine = this.value;
            currentOCRConfig.engine = engine;
            
            // 显示/隐藏配置区域
            const configArea = document.getElementById('apiConfigArea');
            const baiduConfig = document.getElementById('baiduConfig');
            const tencentConfig = document.getElementById('tencentConfig');
            
            if (engine === 'tesseract') {
                configArea.style.display = 'none';
            } else {
                configArea.style.display = 'block';
                
                if (engine === 'baidu') {
                    baiduConfig.style.display = 'block';
                    tencentConfig.style.display = 'none';
                } else if (engine === 'tencent') {
                    baiduConfig.style.display = 'none';
                    tencentConfig.style.display = 'block';
                }
            }
            
            // 保存配置到localStorage
            saveOCRConfig();
        });
    });
    
    // 监听API Key输入变化
    document.getElementById('baiduApiKey')?.addEventListener('input', function() {
        currentOCRConfig.baidu.apiKey = this.value;
        saveOCRConfig();
    });
    
    document.getElementById('baiduSecretKey')?.addEventListener('input', function() {
        currentOCRConfig.baidu.secretKey = this.value;
        saveOCRConfig();
    });
    
    // 加载保存的配置
    loadOCRConfig();
});

// 保存配置到浏览器
function saveOCRConfig() {
    localStorage.setItem('guji_ocr_config', JSON.stringify(currentOCRConfig));
}

// 加载配置
function loadOCRConfig() {
    const saved = localStorage.getItem('guji_ocr_config');
    if (saved) {
        currentOCRConfig = JSON.parse(saved);
        
        // 设置单选按钮
        document.querySelector(`input[value="${currentOCRConfig.engine}"]`).checked = true;
        
        // 触发change事件以显示配置区域
        document.querySelector(`input[value="${currentOCRConfig.engine}"]`).dispatchEvent(new Event('change'));
        
        // 填充API Key
        if (document.getElementById('baiduApiKey')) {
            document.getElementById('baiduApiKey').value = currentOCRConfig.baidu.apiKey;
            document.getElementById('baiduSecretKey').value = currentOCRConfig.baidu.secretKey;
        }
    }
}

// 统一的OCR识别函数
async function recognizeText(imageFile, engine = currentOCRConfig.engine) {
    switch(engine) {
        case 'tesseract':
            return await recognizeWithTesseract(imageFile);
            
        case 'baidu':
            return await recognizeWithBaidu(imageFile);
            
        case 'tencent':
            return await recognizeWithTencent(imageFile);
            
        default:
            return await recognizeWithTesseract(imageFile);
    }
}

// Tesseract识别
async function recognizeWithTesseract(imageFile) {
    const worker = await Tesseract.createWorker('chi_sim');
    const result = await worker.recognize(imageFile);
    await worker.terminate();
    return result.data.text;
}

// 百度OCR识别
async function recognizeWithBaidu(imageFile) {
    const { apiKey, secretKey } = currentOCRConfig.baidu;
    
    if (!apiKey || !secretKey) {
        throw new Error('请先配置百度OCR API Key');
    }
    
    // 获取access_token
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`;
    
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
        throw new Error('获取百度OCR访问令牌失败');
    }
    
    // 将图片转为base64
    const base64 = await fileToBase64(imageFile);
    
    // 调用OCR接口
    const ocrUrl = `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${tokenData.access_token}`;
    
    const formData = new FormData();
    formData.append('image', base64);
    formData.append('language_type', 'CHN_ENG'); // 中英文混合
    
    const response = await fetch(ocrUrl, {
        method: 'POST',
        body: formData
    });
    
    const data = await response.json();
    
    if (data.words_result) {
        return data.words_result.map(item => item.words).join('\n');
    } else {
        throw new Error('百度OCR识别失败: ' + (data.error_msg || '未知错误'));
    }
}

// 腾讯OCR识别（类似百度，需要实现）
async function recognizeWithTencent(imageFile) {
    // 这里需要实现腾讯OCR调用
    // 由于代码较长，可以先返回提示
    alert('腾讯OCR功能待实现，请先使用百度OCR或Tesseract');
    return '';
}

// 文件转base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 修改processAllImages函数，使用统一的OCR识别
async function processAllImages() {
    const versionCount = parseInt(document.getElementById('versionCount').value);
    const files = document.querySelectorAll('.version-file');
    const texts = document.querySelectorAll('.version-text');
    
    showLoading('正在识别多个版本，请稍候...');
    
    try {
        const results = [];
        for (let i = 0; i < versionCount; i++) {
            const file = files[i]?.files[0];
            const textArea = texts[i];
            
            let text = textArea.value.trim();
            
            // 如果有上传图片且文本区域为空，则使用OCR
            if (file && !text) {
                text = await recognizeText(file, currentOCRConfig.engine);
                textArea.value = text;
                
                updateProgress(i + 1, versionCount);
            }
            
            const nameInput = document.querySelector(`input[data-version="${i + 1}"]`);
            const versionName = nameInput?.value || `版本 ${i + 1}`;
            
            results.push({
                id: i + 1,
                name: versionName,
                text: text || textArea.value
            });
        }
        
        hideLoading();
        window.versionResults = results;
        
        alert(`成功识别 ${results.length} 个版本！`);
        
    } catch (error) {
        console.error('识别错误:', error);
        hideLoading();
        alert('识别失败: ' + error.message);
    }
}
