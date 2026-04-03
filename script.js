// script.js - 核心功能文件

// 1. OCR识别功能（使用Tesseract.js - 完全免费）
async function processImages() {
    const fileA = document.getElementById('fileA').files[0];
    const fileB = document.getElementById('fileB').files[0];
    
    if (!fileA && !fileB) {
        alert('请至少上传一张图片');
        return;
    }

    // 显示加载状态
    document.getElementById('comparisonResult').innerHTML = 
        '<div class="text-center"><div class="spinner-border text-primary"></div><p>正在识别文字...</p></div>';

    try {
        // 初始化Tesseract
        const worker = await Tesseract.createWorker('chi_sim'); // 简体中文，可改为'chi_tra'繁体
        
        // 识别图片A
        let textA = '';
        if (fileA) {
            const resultA = await worker.recognize(fileA);
            textA = resultA.data.text;
            document.getElementById('textA').value = textA;
        }

        // 识别图片B
        let textB = '';
        if (fileB) {
            const resultB = await worker.recognize(fileB);
            textB = resultB.data.text;
            document.getElementById('textB').value = textB;
        }

        await worker.terminate();
        
        alert('文字识别完成！现在可以点击"开始比对"按钮。');
        
    } catch (error) {
        console.error('OCR识别错误:', error);
        alert('识别失败，请尝试：1.上传更清晰的图片 2.手动输入文本');
    }
}

// 2. 文本比对功能
function compareTexts() {
    const textA = document.getElementById('textA').value.trim();
    const textB = document.getElementById('textB').value.trim();
    
    if (!textA || !textB) {
        alert('请先输入或识别两段文本');
        return;
    }

    // 使用Google的diff-match-patch算法
    const dmp = new diff_match_patch();
    const diffs = dmp.diff_main(textA, textB);
    dmp.diff_cleanupSemantic(diffs);
    
    // 生成带样式的HTML
    let html = '';
    let added = 0;
    let removed = 0;
    let unchanged = 0;
    
    diffs.forEach(([type, text]) => {
        switch(type) {
            case 1: // 新增
                html += `<span class="diff-added">${escapeHtml(text)}</span>`;
                added += text.length;
                break;
            case -1: // 删除
                html += `<span class="diff-removed">${escapeHtml(text)}</span>`;
                removed += text.length;
                break;
            case 0: // 相同
                html += `<span class="diff-unchanged">${escapeHtml(text)}</span>`;
                unchanged += text.length;
                break;
        }
    });
    
    // 显示结果
    document.getElementById('comparisonResult').innerHTML = html;
    
    // 显示统计
    const total = added + removed + unchanged;
    const similarity = total > 0 ? Math.round((unchanged / total) * 100) : 0;
    
    document.getElementById('stats').innerHTML = `
        <div class="row">
            <div class="col">
                <span class="badge bg-success">新增: ${added}字</span>
            </div>
            <div class="col">
                <span class="badge bg-danger">删除: ${removed}字</span>
            </div>
            <div class="col">
                <span class="badge bg-primary">相同: ${unchanged}字</span>
            </div>
            <div class="col">
                <span class="badge bg-info">相似度: ${similarity}%</span>
            </div>
        </div>
    `;
}

// 3. 辅助函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function exportText() {
    const result = document.getElementById('comparisonResult').innerText;
    const textA = document.getElementById('textA').value;
    const textB = document.getElementById('textB').value;
    
    const content = `古籍文本比对结果\n\n版本A：\n${textA}\n\n版本B：\n${textB}\n\n比对结果：\n${result}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `古籍比对_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

function clearAll() {
    if (confirm('确定要清空所有内容吗？')) {
        document.getElementById('fileA').value = '';
        document.getElementById('fileB').value = '';
        document.getElementById('textA').value = '';
        document.getElementById('textB').value = '';
        document.getElementById('comparisonResult').innerHTML = 
            '<p class="text-muted">这里将显示文本比对结果...</p>';
        document.getElementById('stats').innerHTML = '等待比对...';
    }
}

// 4. 百度OCR备用方案（如果需要更好的识别）
async function useBaiduOCR(imageFile) {
    // 这里需要你的百度OCR API Key
    const apiKey = '你的API_KEY';
    const secretKey = '你的SECRET_KEY';
    
    // 获取access_token
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`;
    
    try {
        const tokenResponse = await fetch(tokenUrl);
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        
        // 将图片转为base64
        const reader = new FileReader();
        return new Promise((resolve) => {
            reader.onload = async function() {
                const base64 = reader.result.split(',')[1];
                
                const ocrUrl = `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${accessToken}`;
                const formData = new FormData();
                formData.append('image', base64);
                
                const response = await fetch(ocrUrl, {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                if (data.words_result) {
                    const text = data.words_result.map(item => item.words).join('\n');
                    resolve(text);
                } else {
                    resolve('');
                }
            };
            reader.readAsDataURL(imageFile);
        });
    } catch (error) {
        console.error('百度OCR错误:', error);
        return '';
    }
}
