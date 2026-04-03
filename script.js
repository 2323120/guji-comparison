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
