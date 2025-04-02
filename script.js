class PomodoroTimer {
    constructor() {
        this.workTime = 25;
        this.breakTime = 5;
        this.longBreakTime = 15;
        this.timeLeft = this.workTime * 60;
        this.isRunning = false;
        this.isBreak = false;
        this.pomodorosCompleted = 0;
        this.totalFocusTime = 0;
        this.streak = 0;
        this.timer = null;
        this.tasks = [];
        this.currentMode = 'pomodoro';
        this.taskFilter = 'all';
        this.dailyFocus = {};
        this.weeklyFocus = {};
        
        // Music player properties
        this.currentTrack = null;
        this.currentPlaylist = 'focus';
        this.isMusicPlaying = false;
        this.musicVolume = 0.5;
        this.playlists = {
            focus: [
                { title: 'Focus Music 1', url: './music/focus/focus1.mp3' },
                { title: 'Focus Music 2', url: './music/focus/focus2.mp3' },
                { title: 'Focus Music 3', url: './music/focus/focus3.mp3' }
            ],
            relax: [
                { title: 'Relaxing Music 1', url: './music/relax/relax1.mp3' },
                { title: 'Relaxing Music 2', url: './music/relax/relax2.mp3' },
                { title: 'Relaxing Music 3', url: './music/relax/relax3.mp3' }
            ],
            nature: [
                { title: 'Nature Sounds 1', url: './music/nature/nature1.mp3' },
                { title: 'Nature Sounds 2', url: './music/nature/nature2.mp3' },
                { title: 'Nature Sounds 3', url: './music/nature/nature3.mp3' }
            ]
        };
        this.currentTrackIndex = 0;
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadData();
        this.initializeCharts();
        this.checkNotificationPermission();
        this.registerServiceWorker();
        this.initializeMusicPlayer();
    }

    initializeElements() {
        // Timer elements
        this.minutesDisplay = document.getElementById('minutes');
        this.secondsDisplay = document.getElementById('seconds');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.progressBar = document.querySelector('.progress');

        // Settings elements
        this.workTimeInput = document.getElementById('workTime');
        this.breakTimeInput = document.getElementById('breakTime');
        this.longBreakTimeInput = document.getElementById('longBreakTime');
        this.soundEnabledInput = document.getElementById('soundEnabled');
        this.notificationsEnabledInput = document.getElementById('notificationsEnabled');
        this.autoStartBreaksInput = document.getElementById('autoStartBreaks');
        this.darkModeInput = document.getElementById('darkMode');

        // Task elements
        this.taskInput = document.getElementById('taskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.taskList = document.getElementById('taskList');

        // Stats elements
        this.totalPomodorosDisplay = document.getElementById('totalPomodoros');
        this.totalFocusTimeDisplay = document.getElementById('totalFocusTime');
        this.streakDisplay = document.getElementById('streak');
        this.todayFocusDisplay = document.getElementById('todayFocus');
        this.todayPomodorosDisplay = document.getElementById('todayPomodoros');
        this.weeklyFocusDisplay = document.getElementById('weeklyFocus');
        this.weeklyAverageDisplay = document.getElementById('weeklyAverage');

        // Music player elements
        this.playMusicBtn = document.getElementById('playMusicBtn');
        this.prevTrackBtn = document.getElementById('prevTrackBtn');
        this.nextTrackBtn = document.getElementById('nextTrackBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.currentTrackDisplay = document.getElementById('currentTrack');
        this.musicProgress = document.querySelector('.music-progress .progress');
    }

    setupEventListeners() {
        // Timer controls
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());

        // Mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setMode(btn.dataset.mode));
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setTaskFilter(btn.dataset.filter));
        });

        // Settings
        this.workTimeInput.addEventListener('change', () => this.updateWorkTime());
        this.breakTimeInput.addEventListener('change', () => this.updateBreakTime());
        this.longBreakTimeInput.addEventListener('change', () => this.updateLongBreakTime());
        this.darkModeInput.addEventListener('change', () => this.toggleDarkMode());

        // Tasks
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Music player event listeners
        this.playMusicBtn.addEventListener('click', () => this.toggleMusic());
        this.prevTrackBtn.addEventListener('click', () => this.playPreviousTrack());
        this.nextTrackBtn.addEventListener('click', () => this.playNextTrack());
        this.volumeSlider.addEventListener('input', (e) => this.updateVolume(e.target.value));
        document.querySelectorAll('.playlist-btn').forEach(btn => {
            btn.addEventListener('click', () => this.changePlaylist(btn.dataset.playlist));
        });
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('Service Worker registered successfully:', registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        } else {
            console.log('Service Worker is not supported in this browser');
        }
    }

    async checkNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            this.notificationsEnabledInput.checked = permission === 'granted';
        }
    }

    setMode(mode) {
        this.currentMode = mode;
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        switch (mode) {
            case 'pomodoro':
                this.timeLeft = this.workTime * 60;
                this.isBreak = false;
                break;
            case 'short-break':
                this.timeLeft = this.breakTime * 60;
                this.isBreak = true;
                break;
            case 'long-break':
                this.timeLeft = this.longBreakTime * 60;
                this.isBreak = true;
                break;
        }

        this.updateDisplay();
        this.updateProgressBar();
    }

    setTaskFilter(filter) {
        this.taskFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.renderTasks();
    }

    toggleDarkMode() {
        document.body.setAttribute('data-theme', this.darkModeInput.checked ? 'dark' : 'light');
        this.saveData();
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.timer = setInterval(() => this.updateTimer(), 1000);
            this.startBtn.disabled = true;
            this.playSound('start');
            this.showNotification('Timer Started', 'Focus time begins!');
        }
    }

    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.timer);
            this.startBtn.disabled = false;
            this.playSound('pause');
            this.showNotification('Timer Paused', 'Take a moment to breathe.');
        }
    }

    reset() {
        this.pause();
        this.timeLeft = this.workTime * 60;
        this.updateDisplay();
        this.updateProgressBar();
        this.playSound('reset');
    }

    updateTimer() {
        if (this.timeLeft > 0) {
            this.timeLeft--;
            this.updateDisplay();
            this.updateProgressBar();
        } else {
            this.handleTimerComplete();
        }
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.minutesDisplay.textContent = minutes.toString().padStart(2, '0');
        this.secondsDisplay.textContent = seconds.toString().padStart(2, '0');
    }

    updateProgressBar() {
        const totalTime = this.isBreak ? 
            (this.currentMode === 'long-break' ? this.longBreakTime : this.breakTime) * 60 :
            this.workTime * 60;
        const progress = ((totalTime - this.timeLeft) / totalTime) * 100;
        this.progressBar.style.width = `${progress}%`;
    }

    handleTimerComplete() {
        this.pause();
        this.playSound('complete');

        if (!this.isBreak) {
            this.pomodorosCompleted++;
            this.totalFocusTime += this.workTime;
            this.updateStats();
            this.updateAnalytics();
            this.saveData();

            if (this.pomodorosCompleted % 4 === 0) {
                this.setMode('long-break');
                this.showNotification('Long Break Time!', 'Take a well-deserved 15-minute break.');
            } else {
                this.setMode('short-break');
                this.showNotification('Break Time!', 'Take a 5-minute break.');
            }
        } else {
            this.setMode('pomodoro');
            this.showNotification('Back to Work!', 'Time to focus again.');
        }

        if (this.autoStartBreaksInput.checked) {
            this.start();
        }
    }

    updateWorkTime() {
        this.workTime = parseInt(this.workTimeInput.value);
        if (!this.isRunning && !this.isBreak) {
            this.timeLeft = this.workTime * 60;
            this.updateDisplay();
            this.updateProgressBar();
        }
    }

    updateBreakTime() {
        this.breakTime = parseInt(this.breakTimeInput.value);
    }

    updateLongBreakTime() {
        this.longBreakTime = parseInt(this.longBreakTimeInput.value);
    }

    addTask() {
        const taskText = this.taskInput.value.trim();
        if (taskText) {
            const task = {
                id: Date.now(),
                text: taskText,
                completed: false,
                createdAt: new Date().toISOString()
            };
            this.tasks.push(task);
            this.renderTasks();
            this.taskInput.value = '';
            this.saveData();
        }
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.renderTasks();
            this.saveData();
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.renderTasks();
        this.saveData();
    }

    renderTasks() {
        this.taskList.innerHTML = '';
        const filteredTasks = this.tasks.filter(task => {
            switch (this.taskFilter) {
                case 'active':
                    return !task.completed;
                case 'completed':
                    return task.completed;
                default:
                    return true;
            }
        });

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="${task.completed ? 'completed' : ''}">${task.text}</span>
                <div>
                    <button onclick="pomodoro.toggleTask(${task.id})">
                        <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                    </button>
                    <button onclick="pomodoro.deleteTask(${task.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            this.taskList.appendChild(li);
        });
    }

    updateStats() {
        this.totalPomodorosDisplay.textContent = this.pomodorosCompleted;
        this.totalFocusTimeDisplay.textContent = this.totalFocusTime;
        this.streakDisplay.textContent = this.streak;
    }

    updateAnalytics() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];

            // Update daily focus
            this.dailyFocus[today] = (this.dailyFocus[today] || 0) + this.workTime;
            this.todayFocusDisplay.textContent = this.dailyFocus[today];
            this.todayPomodorosDisplay.textContent = Math.floor(this.dailyFocus[today] / this.workTime);

            // Update weekly focus
            let weeklyTotal = 0;
            let daysWithFocus = 0;
            const weekData = Array(7).fill(0);
            
            for (let i = 0; i < 7; i++) {
                const date = new Date(weekStart);
                date.setDate(date.getDate() + i);
                const dateKey = date.toISOString().split('T')[0];
                const dayFocus = this.dailyFocus[dateKey] || 0;
                weekData[i] = dayFocus;
                weeklyTotal += dayFocus;
                if (dayFocus > 0) daysWithFocus++;
            }

            this.weeklyFocusDisplay.textContent = weeklyTotal;
            this.weeklyAverageDisplay.textContent = daysWithFocus > 0 ? Math.round(weeklyTotal / daysWithFocus) : 0;

            // Update streak
            this.updateStreak();

            // Update charts
            this.updateCharts(weekData);
        } catch (error) {
            console.error('Error updating analytics:', error);
        }
    }

    updateStreak() {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = yesterday.toISOString().split('T')[0];

        if (this.dailyFocus[today] > 0) {
            if (this.dailyFocus[yesterdayKey] > 0) {
                this.streak++;
            } else if (this.streak === 0) {
                this.streak = 1;
            }
        } else if (this.dailyFocus[yesterdayKey] === 0) {
            this.streak = 0;
        }

        this.streakDisplay.textContent = this.streak;
    }

    updateCharts(weekData) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const todayFocus = this.dailyFocus[today] || 0;

            // Update today's chart
            if (this.todayChart) {
                this.todayChart.data.datasets[0].data = [todayFocus, 24 * 60 - todayFocus];
                this.todayChart.update('none');
            }

            // Update weekly chart
            if (this.weeklyChart) {
                this.weeklyChart.data.datasets[0].data = weekData;
                this.weeklyChart.update('none');
            }
        } catch (error) {
            console.error('Error updating charts:', error);
        }
    }

    showNotification(title, message) {
        if (this.notificationsEnabledInput.checked && Notification.permission === 'granted') {
            try {
                new Notification(title, {
                    body: message,
                    icon: './icon-192x192.png'
                });
            } catch (error) {
                console.error('Failed to show notification:', error);
            }
        }
    }

    playSound(type) {
        if (!this.soundEnabledInput.checked) return;

        try {
            const audio = new Audio();
            audio.onerror = (e) => {
                console.error('Error playing sound:', e);
            };

            switch (type) {
                case 'start':
                    audio.src = './sounds/start.mp3';
                    break;
                case 'pause':
                    audio.src = './sounds/pause.mp3';
                    break;
                case 'complete':
                    audio.src = './sounds/complete.mp3';
                    break;
                case 'reset':
                    audio.src = './sounds/reset.mp3';
                    break;
            }

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error('Error playing audio:', error);
                });
            }
        } catch (error) {
            console.error('Error in playSound:', error);
        }
    }

    saveData() {
        try {
            const data = {
                tasks: this.tasks,
                pomodorosCompleted: this.pomodorosCompleted,
                totalFocusTime: this.totalFocusTime,
                streak: this.streak,
                dailyFocus: this.dailyFocus,
                weeklyFocus: this.weeklyFocus,
                settings: {
                    workTime: this.workTime,
                    breakTime: this.breakTime,
                    longBreakTime: this.longBreakTime,
                    soundEnabled: this.soundEnabledInput.checked,
                    notificationsEnabled: this.notificationsEnabledInput.checked,
                    autoStartBreaks: this.autoStartBreaksInput.checked,
                    darkMode: this.darkModeInput.checked
                },
                musicSettings: {
                    currentPlaylist: this.currentPlaylist,
                    volume: this.musicVolume,
                    isPlaying: this.isMusicPlaying
                }
            };
            localStorage.setItem('pomodoroData', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving data to localStorage:', error);
        }
    }

    loadData() {
        try {
            const data = localStorage.getItem('pomodoroData');
            if (data) {
                const parsedData = JSON.parse(data);
                this.tasks = parsedData.tasks || [];
                this.pomodorosCompleted = parsedData.pomodorosCompleted || 0;
                this.totalFocusTime = parsedData.totalFocusTime || 0;
                this.streak = parsedData.streak || 0;
                this.dailyFocus = parsedData.dailyFocus || {};
                this.weeklyFocus = parsedData.weeklyFocus || {};
                
                if (parsedData.settings) {
                    this.workTime = parsedData.settings.workTime || 25;
                    this.breakTime = parsedData.settings.breakTime || 5;
                    this.longBreakTime = parsedData.settings.longBreakTime || 15;
                    this.soundEnabledInput.checked = parsedData.settings.soundEnabled !== false;
                    this.notificationsEnabledInput.checked = parsedData.settings.notificationsEnabled !== false;
                    this.autoStartBreaksInput.checked = parsedData.settings.autoStartBreaks !== false;
                    this.darkModeInput.checked = parsedData.settings.darkMode || false;
                }

                if (parsedData.musicSettings) {
                    this.currentPlaylist = parsedData.musicSettings.currentPlaylist || 'focus';
                    this.musicVolume = parsedData.musicSettings.volume || 0.5;
                    this.isMusicPlaying = parsedData.musicSettings.isPlaying || false;
                    this.volumeSlider.value = this.musicVolume * 100;
                    
                    document.querySelectorAll('.playlist-btn').forEach(btn => {
                        btn.classList.toggle('active', btn.dataset.playlist === this.currentPlaylist);
                    });
                    
                    if (this.isMusicPlaying) {
                        this.playMusicBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    }
                }

                this.updateStats();
                this.renderTasks();
                this.updateDisplay();
                this.updateProgressBar();
                this.updateAnalytics();
                
                if (this.darkModeInput.checked) {
                    document.body.setAttribute('data-theme', 'dark');
                }
            }
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
            this.resetToDefaults();
        }
    }

    resetToDefaults() {
        this.workTime = 25;
        this.breakTime = 5;
        this.longBreakTime = 15;
        this.timeLeft = this.workTime * 60;
        this.isRunning = false;
        this.isBreak = false;
        this.pomodorosCompleted = 0;
        this.totalFocusTime = 0;
        this.streak = 0;
        this.tasks = [];
        this.dailyFocus = {};
        this.weeklyFocus = {};
        
        // Reset music settings
        this.currentPlaylist = 'focus';
        this.currentTrackIndex = 0;
        this.musicVolume = 0.5;
        this.isMusicPlaying = false;
        this.volumeSlider.value = 50;
        this.currentTrackDisplay.textContent = 'No track playing';
        this.musicProgress.style.width = '0%';
        this.playMusicBtn.innerHTML = '<i class="fas fa-play"></i>';
        
        document.querySelectorAll('.playlist-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.playlist === 'focus');
        });

        this.updateStats();
        this.renderTasks();
        this.updateDisplay();
        this.updateProgressBar();
        this.updateAnalytics();
    }

    initializeCharts() {
        try {
            // Today's focus chart
            const todayCtx = document.getElementById('todayChart');
            if (todayCtx) {
                this.todayChart = new Chart(todayCtx.getContext('2d'), {
                    type: 'doughnut',
                    data: {
                        labels: ['Focus Time', 'Remaining'],
                        datasets: [{
                            data: [0, 24 * 60],
                            backgroundColor: ['#2ecc71', '#ecf0f1'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        cutout: '70%'
                    }
                });
            }

            // Weekly focus chart
            const weeklyCtx = document.getElementById('weeklyChart');
            if (weeklyCtx) {
                this.weeklyChart = new Chart(weeklyCtx.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        datasets: [{
                            label: 'Focus Time (minutes)',
                            data: [0, 0, 0, 0, 0, 0, 0],
                            backgroundColor: '#2ecc71',
                            borderRadius: 5
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.1)'
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }

    initializeMusicPlayer() {
        this.audio = new Audio();
        this.audio.addEventListener('timeupdate', () => this.updateMusicProgress());
        this.audio.addEventListener('ended', () => this.playNextTrack());
        this.audio.addEventListener('error', (e) => {
            console.error('Error playing music:', e);
            this.playNextTrack();
        });
        this.loadTrack();
    }

    loadTrack() {
        try {
            const playlist = this.playlists[this.currentPlaylist];
            if (playlist && playlist.length > 0) {
                this.currentTrack = playlist[this.currentTrackIndex];
                this.audio.src = this.currentTrack.url;
                this.currentTrackDisplay.textContent = this.currentTrack.title;
                this.audio.volume = this.musicVolume;
                if (this.isMusicPlaying) {
                    this.audio.play();
                }
            }
        } catch (error) {
            console.error('Error loading track:', error);
        }
    }

    toggleMusic() {
        if (this.isMusicPlaying) {
            this.audio.pause();
            this.playMusicBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            this.audio.play();
            this.playMusicBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
        this.isMusicPlaying = !this.isMusicPlaying;
    }

    playNextTrack() {
        const playlist = this.playlists[this.currentPlaylist];
        if (playlist && playlist.length > 0) {
            this.currentTrackIndex = (this.currentTrackIndex + 1) % playlist.length;
            this.loadTrack();
        }
    }

    playPreviousTrack() {
        const playlist = this.playlists[this.currentPlaylist];
        if (playlist && playlist.length > 0) {
            this.currentTrackIndex = (this.currentTrackIndex - 1 + playlist.length) % playlist.length;
            this.loadTrack();
        }
    }

    updateVolume(value) {
        this.musicVolume = value / 100;
        this.audio.volume = this.musicVolume;
    }

    updateMusicProgress() {
        if (this.audio.duration) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            this.musicProgress.style.width = `${progress}%`;
        }
    }

    changePlaylist(playlist) {
        this.currentPlaylist = playlist;
        this.currentTrackIndex = 0;
        document.querySelectorAll('.playlist-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.playlist === playlist);
        });
        this.loadTrack();
    }
}

// Initialize the Pomodoro Timer
const pomodoro = new PomodoroTimer(); 