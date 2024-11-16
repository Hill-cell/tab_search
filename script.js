// 默认配置
const defaultEngines = [
    { name: '百度', url: 'https://www.baidu.com/s?wd=' },
    { name: '谷歌', url: 'https://www.google.com/search?q=' },
    { name: '必应', url: 'https://www.bing.com/search?q=' },
    { name: '知乎', url: 'https://www.zhihu.com/search?q=' },
    { name: '哔哩哔哩', url: 'https://search.bilibili.com/all?keyword=' },
    { name: '淘宝', url: 'https://s.taobao.com/search?q=' },
    { name: '京东', url: 'https://search.jd.com/Search?keyword=' },
    { name: 'GitHub', url: 'https://github.com/search?q=' }
];

const defaultQuicklinks = [
    { title: '百度', url: 'https://www.baidu.com', icon: 'https://www.baidu.com/favicon.ico' },
    { title: '谷歌', url: 'https://www.google.com', icon: 'https://www.google.com/favicon.ico' },
    { title: '哔哩哔哩', url: 'https://www.bilibili.com', icon: 'https://www.bilibili.com/favicon.ico' },
    { title: '知乎', url: 'https://www.zhihu.com', icon: 'https://www.zhihu.com/favicon.ico' },
    { title: '淘宝', url: 'https://www.taobao.com', icon: 'https://www.taobao.com/favicon.ico' },
    { title: '京东', url: 'https://www.jd.com', icon: 'https://www.jd.com/favicon.ico' },
    { title: 'GitHub', url: 'https://github.com', icon: 'https://github.com/favicon.ico' },
    { title: '微博', url: 'https://weibo.com', icon: 'https://weibo.com/favicon.ico' }
];

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initSearchEngines();
    initQuicklinks();
    initDateTime();
    initWallpaper();
    initDialogs();

    // 初始化日历
    const calendar = new Calendar(document.getElementById('calendar'));
});

// 快捷链接相关函数
function initQuicklinks() {
    chrome.storage.sync.get(['quicklinks'], function(result) {
        const links = result.quicklinks || defaultQuicklinks;
        renderQuicklinks(links);
    });

    document.getElementById('edit-links').addEventListener('click', () => showQuicklinkDialog());
}

function renderQuicklinks(links) {
    const container = document.getElementById('quicklinks-grid');
    container.innerHTML = '';

    links.forEach((link, index) => {
        const quicklink = document.createElement('div');
        quicklink.className = 'quicklink';
        quicklink.draggable = true;
        
        const iconContainer = document.createElement('div');
        iconContainer.className = 'link-icon';
        
        const img = document.createElement('img');
        img.alt = link.title;
        img.addEventListener('error', function() {
            this.src = 'icons/default.png';
        });
        img.src = link.icon;
        
        const title = document.createElement('div');
        title.className = 'link-title';
        title.textContent = link.title;
        
        iconContainer.appendChild(img);
        quicklink.appendChild(iconContainer);
        quicklink.appendChild(title);
        
        quicklink.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index);
            
            const preview = quicklink.cloneNode(true);
            preview.classList.add('quicklink-drop-preview');
            preview.style.position = 'absolute';
            preview.style.left = '-9999px';
            document.body.appendChild(preview);
            
            e.dataTransfer.setDragImage(preview, 0, 0);
            
            quicklink.classList.add('dragging');
            
            setTimeout(() => preview.remove(), 0);
        });

        quicklink.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            let dropIndicator = document.querySelector('.drop-indicator');
            if (!dropIndicator) {
                const indicator = document.createElement('div');
                indicator.className = 'drop-indicator';
                indicator.style.width = quicklink.offsetWidth + 'px';
                indicator.style.height = quicklink.offsetHeight + 'px';
                document.body.appendChild(indicator);
                dropIndicator = indicator;
            }
            
            const rect = quicklink.getBoundingClientRect();
            dropIndicator.style.left = rect.left + 'px';
            dropIndicator.style.top = rect.top + 'px';
        });

        quicklink.addEventListener('dragleave', () => {
            const dropIndicator = document.querySelector('.drop-indicator');
            if (dropIndicator) {
                dropIndicator.remove();
            }
        });

        quicklink.addEventListener('dragend', () => {
            quicklink.classList.remove('dragging');
            const dropIndicator = document.querySelector('.drop-indicator');
            if (dropIndicator) {
                dropIndicator.remove();
            }
        });

        quicklink.addEventListener('drop', (e) => {
            e.preventDefault();
            quicklink.classList.remove('drag-over');
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const toIndex = index;
            
            if (fromIndex !== toIndex) {
                chrome.storage.sync.get(['quicklinks'], function(result) {
                    const links = result.quicklinks || defaultQuicklinks;
                    const [movedItem] = links.splice(fromIndex, 1);
                    links.splice(toIndex, 0, movedItem);
                    chrome.storage.sync.set({ quicklinks: links }, function() {
                        renderQuicklinks(links);
                    });
                });
            }
        });
        
        quicklink.addEventListener('click', () => window.open(link.url, '_blank'));
        
        quicklink.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showQuicklinkContextMenu(e, link, index);
        });
        
        container.appendChild(quicklink);
    });
}

// 搜索引擎相关函数
function initSearchEngines() {
    chrome.storage.sync.get(['searchEngines'], function(result) {
        const engines = result.searchEngines || defaultEngines;
        renderSearchEngines(engines);
    });

    document.getElementById('manage-engines').addEventListener('click', showEngineDialog);
}

function renderSearchEngines(engines) {
    const container = document.getElementById('search-engines');
    container.innerHTML = '';

    engines.forEach((engine, index) => {
        const searchBox = document.createElement('div');
        searchBox.className = 'search-box';
        
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'search-input-wrapper';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `在 ${engine.name} 中搜索`;
        
        const searchIcon = document.createElement('div');
        searchIcon.className = 'search-icon';
        
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch(this.value, engine.url);
            }
        });

        searchIcon.addEventListener('click', () => {
            performSearch(input.value, engine.url);
        });

        inputWrapper.appendChild(input);
        inputWrapper.appendChild(searchIcon);
        searchBox.appendChild(inputWrapper);
        container.appendChild(searchBox);
    });
}

// 对话框相关函数
function initDialogs() {
    const engineDialog = document.getElementById('engine-dialog');
    const quicklinkDialog = document.getElementById('quicklink-dialog');

    document.getElementById('close-dialog').addEventListener('click', () => {
        engineDialog.close();
    });

    document.getElementById('add-new-engine').addEventListener('click', () => {
        const engineList = document.getElementById('engine-list');
        const engineItem = document.createElement('div');
        engineItem.className = 'engine-item';
        engineItem.draggable = true;
        engineItem.innerHTML = `
            <div class="drag-handle">⋮⋮</div>
            <input type="text" value="新搜索引擎" placeholder="搜索引擎名称" required>
            <input type="url" value="https://example.com/search?q=" placeholder="搜索URL" required>
            <button class="delete-engine">删除</button>
        `;
        engineList.appendChild(engineItem);
    });

    document.getElementById('engine-list').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-engine')) {
            const engineItems = document.querySelectorAll('.engine-item');
            if (engineItems.length > 1) {
                e.target.closest('.engine-item').remove();
                saveEngineOrder();
            } else {
                alert('至少需要保留一个搜索引擎');
            }
        }
    });

    engineDialog.addEventListener('close', () => {
        saveEngineOrder();
    });

    document.getElementById('quicklink-form').addEventListener('submit', saveQuicklink);
    document.getElementById('close-quicklink-dialog').addEventListener('click', () => {
        quicklinkDialog.close();
    });
}

// 工具函数
function performSearch(query, engineUrl) {
    if (!query.trim()) return;
    
    try {
        const searchTerm = encodeURIComponent(query);
        const searchUrl = engineUrl + searchTerm;
        window.open(searchUrl, '_blank');
    } catch (error) {
        console.error('搜索失败:', error);
    }
}

function updateDateTime() {
    const now = new Date();
    document.getElementById('time').textContent = now.toLocaleTimeString('zh-CN');
    document.getElementById('date').textContent = now.toLocaleDateString('zh-CN');
}

function initDateTime() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

// 壁纸相关函数
function initWallpaper() {
    const wallpaperUpload = document.getElementById('wallpaper-upload');
    const changeWallpaperBtn = document.getElementById('change-wallpaper');
    
    changeWallpaperBtn.addEventListener('click', () => {
        wallpaperUpload.click();
    });
    
    wallpaperUpload.addEventListener('change', handleWallpaperUpload);
    document.getElementById('reset-wallpaper').addEventListener('click', resetWallpaper);

    chrome.storage.local.get(['wallpaper'], function(result) {
        if (result.wallpaper) {
            document.body.style.backgroundImage = `url(${result.wallpaper})`;
        }
    });
}

function handleWallpaperUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.body.style.backgroundImage = `url(${e.target.result})`;
            chrome.storage.local.set({ wallpaper: e.target.result });
        };
        reader.readAsDataURL(file);
    }
}

function resetWallpaper() {
    document.body.style.backgroundImage = 'url(images/default-wallpaper.jpg)';
    chrome.storage.local.remove(['wallpaper']);
}

// 搜索引擎管理相关函数
function showEngineDialog() {
    const dialog = document.getElementById('engine-dialog');
    const engineList = document.getElementById('engine-list');
    
    chrome.storage.sync.get(['searchEngines'], function(result) {
        const engines = result.searchEngines || defaultEngines;
        engineList.innerHTML = '';
        
        engines.forEach((engine, index) => {
            const engineItem = document.createElement('div');
            engineItem.className = 'engine-item';
            engineItem.innerHTML = `
                <div class="drag-handle" draggable="true">⋮⋮</div>
                <input type="text" value="${engine.name}" placeholder="搜索引擎名称" required>
                <input type="url" value="${engine.url}" placeholder="搜索URL" required>
                <button class="delete-engine" data-index="${index}">删除</button>
            `;
            engineList.appendChild(engineItem);
        });

        initEngineDragSort(engineList);
    });
    
    dialog.showModal();
}

function saveEngineOrder() {
    const engineList = document.getElementById('engine-list');
    const engines = [];
    
    engineList.querySelectorAll('.engine-item').forEach(item => {
        const inputs = item.querySelectorAll('input');
        const name = inputs[0].value.trim();
        const url = inputs[1].value.trim();
        
        if (name && url && validateEngineUrl(url)) {
            engines.push({
                name: name,
                url: url
            });
        }
    });

    if (engines.length > 0) {
        chrome.storage.sync.set({ searchEngines: engines }, function() {
            renderSearchEngines(engines);
        });
    }
}

function validateEngineUrl(url) {
    try {
        new URL(url);
        return url.includes('?') && (
            url.includes('q=') || 
            url.includes('query=') || 
            url.includes('keyword=') || 
            url.includes('wd=') || 
            url.includes('search=')
        );
    } catch {
        return false;
    }
}

function initEngineDragSort(container) {
    let draggedItem = null;

    container.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('drag-handle')) {
            draggedItem = e.target.closest('.engine-item');
            draggedItem.classList.add('dragging');
        }
    });

    container.addEventListener('dragend', (e) => {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            saveEngineOrder();
            draggedItem = null;
        }
    });

    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!draggedItem) return;

        const afterElement = getDragAfterElement(container, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (draggable) {
            if (afterElement) {
                container.insertBefore(draggable, afterElement);
            } else {
                container.appendChild(draggable);
            }
        }
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.engine-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// 添加右键菜单功能
function showQuicklinkContextMenu(e, link, index) {
    e.preventDefault(); // 阻止默认右键菜单

    // 移除已存在的菜单
    const oldMenu = document.querySelector('.context-menu');
    if (oldMenu) oldMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
        <div class="menu-item edit">编辑</div>
        <div class="menu-item delete">删除</div>
    `;

    // 设置菜单位置
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;
    document.body.appendChild(menu);

    // 编辑功能
    menu.querySelector('.edit').addEventListener('click', () => {
        showQuicklinkDialog(link, index);
        menu.remove();
    });

    // 删除功能
    menu.querySelector('.delete').addEventListener('click', () => {
        deleteQuicklink(index);
        menu.remove();
    });

    // 点击其他地方关闭菜单
    document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    });
}

// 添加删除快捷链接的函数
function deleteQuicklink(index) {
    chrome.storage.sync.get(['quicklinks'], function(result) {
        const links = result.quicklinks || defaultQuicklinks;
        links.splice(index, 1);
        chrome.storage.sync.set({ quicklinks: links }, function() {
            renderQuicklinks(links);
        });
    });
}

// 修改 showQuicklinkDialog 函数
function showQuicklinkDialog(link = null, index = null) {
    const dialog = document.getElementById('quicklink-dialog');
    const form = document.getElementById('quicklink-form');
    const titleInput = document.getElementById('link-title');
    const urlInput = document.getElementById('link-url');
    const iconInput = document.getElementById('link-icon');

    if (link) {
        titleInput.value = link.title;
        urlInput.value = link.url;
        iconInput.value = link.icon;
        form.dataset.editIndex = index;
    } else {
        form.reset();
        delete form.dataset.editIndex;
    }

    dialog.showModal();
}

// 修改 saveQuicklink 函数
function saveQuicklink(e) {
    e.preventDefault();
    const form = document.getElementById('quicklink-form');
    const newLink = {
        title: document.getElementById('link-title').value,
        url: document.getElementById('link-url').value,
        icon: document.getElementById('link-icon').value || 
              `https://www.google.com/s2/favicons?domain=${document.getElementById('link-url').value}`
    };

    chrome.storage.sync.get(['quicklinks'], function(result) {
        let links = result.quicklinks || defaultQuicklinks;
        const editIndex = form.dataset.editIndex;

        if (editIndex !== undefined) {
            links[editIndex] = newLink;
        } else {
            links.push(newLink);
        }

        chrome.storage.sync.set({ quicklinks: links }, function() {
            renderQuicklinks(links);
            document.getElementById('quicklink-dialog').close();
            form.reset();
            delete form.dataset.editIndex;
        });
    });
}