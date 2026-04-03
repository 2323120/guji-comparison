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
// PDF处理相关函数
async function processPDFFile(pdfFile, versionNum) {
    if (pdfFile.size > 200 * 1024 * 1024) {
        throw new Error(`PDF文件超过200MB限制，当前大小：${(pdfFile.size / 1024 / 1024).toFixed(2)}MB`);
    }
    
    showLoading(`正在处理PDF版本 ${versionNum}...`);
    
    try {
        // 使用pdf.js处理PDF
        const pdfText = await extractTextFromPDF(pdfFile);
        
        // 如果PDF有多个页面，让用户选择页面
        if (pdfText.pages.length > 1) {
            const selectedPages = await selectPDFPages(pdfText.pages, versionNum);
            return selectedPages.join('\n\n--- 页面分隔 ---\n\n');
        } else {
            return pdfText.pages[0].text;
        }
        
    } catch (error) {
        console.error('PDF处理错误:', error);
        throw new Error(`PDF处理失败: ${error.message}`);
    }
}

// 提取PDF文本
async function extractTextFromPDF(pdfFile) {
    // 动态加载pdf.js库
    if (!window.pdfjsLib) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
        window.pdfjsLib = pdfjsLib;
        
        // 设置worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const pages = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
            .map(item => item.str)
            .join(' ');
        
        pages.push({
            pageNum: i,
            text: pageText,
            preview: pageText.substring(0, 100) + '...'
        });
    }
    
    return {
        totalPages: pdf.numPages,
        pages: pages
    };
}

// 让用户选择PDF页面
async function selectPDFPages(pages, versionNum) {
    return new Promise((resolve) => {
        // 创建页面选择对话框
        const modalHtml = `
            <div class="modal fade" id="pdfPageModal${versionNum}" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">选择PDF页面 - 版本 ${versionNum}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>共 ${pages.length} 页，请选择要识别的页面：</p>
                            <div class="row">
                                ${pages.map((page, index) => `
                                    <div class="col-md-6 mb-2">
                                        <div class="form-check">
                                            <input class="form-check-input page-checkbox" 
                                                   type="checkbox" id="page${index}" 
                                                   value="${index}" checked>
                                            <label class="form-check-label" for="page${index}">
                                                第${page.pageNum}页：
                                                <small class="text-muted">${page.preview}</small>
                                            </label>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="mt-3">
                                <button class="btn btn-sm btn-outline-secondary" onclick="selectAllPages(${versionNum})">
                                    全选
                                </button>
                                <button class="btn btn-sm btn-outline-secondary" onclick="deselectAllPages(${versionNum})">
                                    全不选
                                </button>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-primary" onclick="confirmPages(${versionNum})">
                                确认选择
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 添加到页面
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // 显示模态框
        const modal = new bootstrap.Modal(document.getElementById(`pdfPageModal${versionNum}`));
        modal.show();
        
        // 设置确认回调
        window.confirmPages = function(vNum) {
            if (vNum === versionNum) {
                const selected = [];
                document.querySelectorAll(`#pdfPageModal${versionNum} .page-checkbox:checked`).forEach(checkbox => {
                    const pageIndex = parseInt(checkbox.value);
                    selected.push(pages[pageIndex].text);
                });
                
                modal.hide();
                document.getElementById(`pdfPageModal${versionNum}`).remove();
                
                if (selected.length === 0) {
                    alert('请至少选择一个页面');
                    return;
                }
                
                resolve(selected);
            }
        };
    });
}

// 动态加载脚本
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// 修改processAllImages函数，支持PDF
async function processAllImages() {
    const versionCount = parseInt(document.getElementById('versionCount').value);
    const files = document.querySelectorAll('.version-file');
    const texts = document.querySelectorAll('.version-text');
    
    showLoading('正在处理多个版本，请稍候...');
    
    try {
        const results = [];
        for (let i = 0; i < versionCount; i++) {
            const file = files[i]?.files[0];
            const textArea = texts[i];
            
            let text = textArea.value.trim();
            
            // 如果有上传文件且文本区域为空
            if (file && !text) {
                if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                    // 处理PDF文件
                    text = await processPDFFile(file, i + 1);
                } else {
                    // 处理图片文件
                    text = await recognizeText(file, currentOCRConfig.engine);
                }
                
                textArea.value = text;
                updateProgress(i + 1, versionCount);
            }
            
            const nameInput = document.querySelector(`input[data-version="${i + 1}"]`);
            const versionName = nameInput?.value || `版本 ${i + 1}`;
            
            results.push({
                id: i + 1,
                name: versionName,
                text: text || textArea.value,
                fileType: file?.type || 'text'
            });
        }
        
        hideLoading();
        window.versionResults = results;
        
        alert(`成功处理 ${results.length} 个版本！`);
        
    } catch (error) {
        console.error('处理错误:', error);
        hideLoading();
        alert('处理失败: ' + error.message);
    }
}
