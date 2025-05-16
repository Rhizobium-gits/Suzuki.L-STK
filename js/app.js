// グローバル変数
let workers = [];
let timers = {};

// 現在時刻の表示
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('current-time').textContent = `${hours}:${minutes}:${seconds}`;
}

// 最初のページ読み込み時に時計を更新
updateClock();
// 1秒ごとに時計を更新
setInterval(updateClock, 1000);

// サンプリング開始ボタンのイベントリスナー
document.getElementById('start-sampling').addEventListener('click', function() {
    this.style.display = 'none';
    document.getElementById('registration-form').style.display = 'block';
    document.getElementById('finish-sampling').style.display = 'block';
});

// 作業追加ボタンのイベントリスナー
document.getElementById('add-task').addEventListener('click', function() {
    const workerName = document.getElementById('worker-name').value.trim();
    const taskName = document.getElementById('task-name').value.trim();
    const taskTime = parseInt(document.getElementById('task-time').value);
    
    if (!workerName || !taskName || isNaN(taskTime) || taskTime <= 0) {
        alert('すべての項目を正しく入力してください。');
        return;
    }
    
    // 既存の作業者かチェック
    let worker = workers.find(w => w.name === workerName);
    
    if (!worker) {
        // 新しい作業者を追加
        worker = {
            name: workerName,
            tasks: [],
            currentTaskIndex: null,
            status: 'ready' // ready, working, paused, completed
        };
        workers.push(worker);
    }
    
    // 作業を追加
    worker.tasks.push({
        name: taskName,
        estimatedTime: taskTime * 60, // 分から秒に変換
        elapsedTime: 0,
        status: 'pending' // pending, active, paused, completed
    });
    
    // フォームをクリア
    document.getElementById('worker-name').value = workerName; // 作業者名は残す
    document.getElementById('task-name').value = '';
    document.getElementById('task-time').value = '';
    
    alert('作業が追加されました。');
});

// 登録完了ボタンのイベントリスナー
document.getElementById('finish-registration').addEventListener('click', function() {
    if (workers.length === 0) {
        alert('少なくとも1つの作業を追加してください。');
        return;
    }
    
    document.getElementById('registration-form').style.display = 'none';
    renderWorkers();
});

// 作業者カードをレンダリング
function renderWorkers() {
    const container = document.getElementById('workers-container');
    container.innerHTML = '';
    
    workers.forEach((worker, workerIndex) => {
        const card = document.createElement('div');
        card.className = `worker-card ${worker.status === 'completed' ? 'completed' : ''}`;
        card.id = `worker-${workerIndex}`;
        
        // 作業者名
        const nameElement = document.createElement('div');
        nameElement.className = 'worker-name';
        nameElement.textContent = worker.name;
        card.appendChild(nameElement);
        
        // タスクリスト
        const taskList = document.createElement('ul');
        taskList.className = 'task-list';
        
        worker.tasks.forEach((task, taskIndex) => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${taskIndex === worker.currentTaskIndex ? 'active' : ''}`;
            
            const taskContent = document.createElement('div');
            taskContent.innerHTML = `
                <span class="task-name">${task.name}</span>
                <span class="task-time">${formatTime(task.estimatedTime)}</span>
            `;
            taskItem.appendChild(taskContent);
            
            // アクティブなタスクの場合、プログレスバーとタイマーを追加
            if (taskIndex === worker.currentTaskIndex) {
                const timer = document.createElement('div');
                timer.className = 'timer';
                timer.id = `timer-${workerIndex}-${taskIndex}`;
                timer.textContent = formatTime(task.elapsedTime);
                taskItem.appendChild(timer);
                
                const progressBarContainer = document.createElement('div');
                progressBarContainer.className = 'progress-bar';
                
                const progressBar = document.createElement('div');
                progressBar.className = 'progress';
                progressBar.id = `progress-${workerIndex}-${taskIndex}`;
                progressBar.style.width = `${(task.elapsedTime / task.estimatedTime) * 100}%`;
                
                progressBarContainer.appendChild(progressBar);
                taskItem.appendChild(progressBarContainer);
            }
            
            taskList.appendChild(taskItem);
        });
        
        card.appendChild(taskList);
        
        // ボタン
        const button = document.createElement('button');
        button.className = `worker-btn ${getButtonClass(worker.status)}`;
        button.textContent = getButtonText(worker.status);
        button.dataset.workerIndex = workerIndex;
        button.addEventListener('click', handleWorkerButtonClick);
        card.appendChild(button);
        
        // メニューポップアップ
        const menuPopup = document.createElement('div');
        menuPopup.className = 'menu-popup';
        menuPopup.id = `menu-${workerIndex}`;
        
        const finishMenuItem = document.createElement('div');
        finishMenuItem.className = 'menu-item';
        finishMenuItem.textContent = '作業を終わる';
        finishMenuItem.dataset.action = 'finish';
        finishMenuItem.dataset.workerIndex = workerIndex;
        finishMenuItem.addEventListener('click', handleMenuItemClick);
        
        const pauseMenuItem = document.createElement('div');
        pauseMenuItem.className = 'menu-item';
        pauseMenuItem.textContent = '一時停止';
        pauseMenuItem.dataset.action = 'pause';
        pauseMenuItem.dataset.workerIndex = workerIndex;
        pauseMenuItem.addEventListener('click', handleMenuItemClick);
        
        const addTaskMenuItem = document.createElement('div');
        addTaskMenuItem.className = 'menu-item';
        addTaskMenuItem.textContent = '新規作業追加';
        addTaskMenuItem.dataset.action = 'add-task';
        addTaskMenuItem.dataset.workerIndex = workerIndex;
        addTaskMenuItem.addEventListener('click', handleMenuItemClick);
        
        menuPopup.appendChild(finishMenuItem);
        menuPopup.appendChild(pauseMenuItem);
        menuPopup.appendChild(addTaskMenuItem);
        
        card.appendChild(menuPopup);
        
        container.appendChild(card);
    });
}

// ボタンクラスを取得
function getButtonClass(status) {
    switch (status) {
        case 'working': return 'working';
        case 'paused': return 'paused';
        default: return '';
    }
}

// ボタンテキストを取得
function getButtonText(status) {
    switch (status) {
        case 'ready': return '作業開始';
        case 'working': return '作業中';
        case 'paused': return '一時停止';
        case 'completed': return '完了';
        default: return '作業開始';
    }
}

// 作業者ボタンクリックハンドラ
function handleWorkerButtonClick(event) {
    const workerIndex = parseInt(event.target.dataset.workerIndex);
    const worker = workers[workerIndex];
    
    if (worker.status === 'ready') {
        // 作業開始
        startTask(workerIndex);
    } else if (worker.status === 'working') {
        // メニューを表示
        const menuId = `menu-${workerIndex}`;
        document.getElementById(menuId).style.display = 'block';
    } else if (worker.status === 'paused') {
        // 作業再開
        resumeTask(workerIndex);
    }
}

// メニューアイテムクリックハンドラ
function handleMenuItemClick(event) {
    const action = event.target.dataset.action;
    const workerIndex = parseInt(event.target.dataset.workerIndex);
    const worker = workers[workerIndex];
    const menuId = `menu-${workerIndex}`;
    
    // メニューを隠す
    document.getElementById(menuId).style.display = 'none';
    
    switch (action) {
        case 'finish':
            finishCurrentTask(workerIndex);
            break;
        case 'pause':
            pauseTask(workerIndex);
            break;
        case 'add-task':
            showAddTaskDialog(workerIndex);
            break;
    }
}

// 作業開始
function startTask(workerIndex) {
    const worker = workers[workerIndex];
    
    // 最初のタスクを開始
    if (worker.currentTaskIndex === null && worker.tasks.length > 0) {
        worker.currentTaskIndex = 0;
    }
    
    if (worker.currentTaskIndex !== null) {
        worker.status = 'working';
        worker.tasks[worker.currentTaskIndex].status = 'active';
        
        // タイマーを開始
        startTimer(workerIndex);
        
        renderWorkers();
    }
}

// 作業一時停止
function pauseTask(workerIndex) {
    const worker = workers[workerIndex];
    
    if (worker.status === 'working' && worker.currentTaskIndex !== null) {
        worker.status = 'paused';
        worker.tasks[worker.currentTaskIndex].status = 'paused';
        
        // タイマーを停止
        stopTimer(workerIndex);
        
        renderWorkers();
    }
}

// 作業再開
function resumeTask(workerIndex) {
    const worker = workers[workerIndex];
    
    if (worker.status === 'paused' && worker.currentTaskIndex !== null) {
        worker.status = 'working';
        worker.tasks[worker.currentTaskIndex].status = 'active';
        
        // タイマーを再開
        startTimer(workerIndex);
        
        renderWorkers();
    }
}

// 現在の作業を終了
function finishCurrentTask(workerIndex) {
    const worker = workers[workerIndex];
    
    if (worker.currentTaskIndex !== null) {
        // 現在のタスクを完了状態に
        const currentTaskIndex = worker.currentTaskIndex;
        worker.tasks[currentTaskIndex].status = 'completed';
        
        // タイマーを停止
        stopTimer(workerIndex);
        
        // 次のタスクを探す
        let nextTaskIndex = null;
        for (let i = 0; i < worker.tasks.length; i++) {
            if (worker.tasks[i].status === 'pending') {
                nextTaskIndex = i;
                break;
            }
        }
        
        if (nextTaskIndex !== null) {
            // 次のタスクがある場合
            worker.currentTaskIndex = nextTaskIndex;
            worker.status = 'ready';
        } else {
            // すべてのタスクが完了した場合
            worker.currentTaskIndex = null;
            worker.status = 'completed';
        }
        
        renderWorkers();
        
        // すべての作業者が完了したかチェック
        checkAllWorkersCompleted();
    }
}

// 新規作業追加ダイアログを表示
function showAddTaskDialog(workerIndex) {
    const worker = workers[workerIndex];
    
    const taskName = prompt('新しい作業名を入力してください:');
    if (!taskName) return;
    
    const taskTimeStr = prompt('予定作業時間（分）を入力してください:');
    const taskTime = parseInt(taskTimeStr);
    
    if (isNaN(taskTime) || taskTime <= 0) {
        alert('有効な作業時間を入力してください。');
        return;
    }
    
    // 新しいタスクを追加
    worker.tasks.push({
        name: taskName,
        estimatedTime: taskTime * 60, // 分から秒に変換
        elapsedTime: 0,
        status: 'pending'
    });
    
    renderWorkers();
}

// タイマーを開始
function startTimer(workerIndex) {
    const worker = workers[workerIndex];
    const taskIndex = worker.currentTaskIndex;
    
    if (taskIndex === null) return;
    
    // 既存のタイマーを停止
    stopTimer(workerIndex);
    
    // 新しいタイマーを開始
    timers[workerIndex] = setInterval(() => {
        const task = worker.tasks[taskIndex];
        task.elapsedTime++;
        
        // タイマー表示を更新
        const timerElement = document.getElementById(`timer-${workerIndex}-${taskIndex}`);
        if (timerElement) {
            timerElement.textContent = formatTime(task.elapsedTime);
        }
        
        // プログレスバーを更新
        const progressElement = document.getElementById(`progress-${workerIndex}-${taskIndex}`);
        if (progressElement) {
            const progress = Math.min((task.elapsedTime / task.estimatedTime) * 100, 100);
            progressElement.style.width = `${progress}%`;
        }
    }, 1000);
}

// タイマーを停止
function stopTimer(workerIndex) {
    if (timers[workerIndex]) {
        clearInterval(timers[workerIndex]);
        delete timers[workerIndex];
    }
}

// すべての作業者が完了したかチェック
function checkAllWorkersCompleted() {
    const allCompleted = workers.every(worker => worker.status === 'completed');
    if (allCompleted) {
        alert('すべての作業者が作業を完了しました！');
    }
}

// 時間を整形
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// サンプリング終了ボタンのイベントリスナー
document.getElementById('finish-sampling').addEventListener('click', function() {
    if (confirm('サンプリングを終了しますか？')) {
        // すべてのタイマーを停止
        for (const workerIndex in timers) {
            stopTimer(workerIndex);
        }
        
        // 最初の状態に戻す
        workers = [];
        document.getElementById('workers-container').innerHTML = '';
        document.getElementById('start-sampling').style.display = 'block';
        document.getElementById('finish-sampling').style.display = 'none';
    }
});
