document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskContainer = document.getElementById('task-container');
    const taskForm = document.getElementById('task-form');
    const taskModal = document.getElementById('task-modal');
    const addTaskBtn = document.getElementById('add-task-btn');
    const closeModalBtn = document.querySelector('.close-modal');
    const themeToggle = document.getElementById('theme-toggle');
    const taskSearch = document.getElementById('task-search');
    const categoryFilter = document.getElementById('category-filter');
    const priorityFilter = document.getElementById('priority-filter');
    const celebrationModal = document.getElementById('celebration-modal');
    const celebrationMessage = document.getElementById('celebration-message');
    const confettiContainer = document.getElementById('confetti-container');
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    
    // State
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let editMode = false;
    let currentEditId = null;
    
    // Initialize the app
    init();
    
    function init() {
        renderTasks();
        updateStats();
        setupEventListeners();
        checkThemePreference();
    }
    
    function setupEventListeners() {
        // Modal handling
        addTaskBtn.addEventListener('click', openTaskModal);
        closeModalBtn.addEventListener('click', closeTaskModal);
        taskModal.addEventListener('click', function(e) {
            if (e.target === taskModal) closeTaskModal();
        });
        
        // Form submission
        taskForm.addEventListener('submit', handleTaskSubmit);
        
        // Theme toggle
        themeToggle.addEventListener('click', toggleTheme);
        
        // Search and filter
        taskSearch.addEventListener('input', debounce(renderTasks, 300));
        categoryFilter.addEventListener('change', renderTasks);
        priorityFilter.addEventListener('change', renderTasks);
    }
    
    // Task CRUD Operations
    function addTask(task) {
        tasks.push(task);
        saveTasks();
        renderTasks();
        updateStats();
    }
    
    function updateTask(id, updatedTask) {
        tasks = tasks.map(task => task.id === id ? {...task, ...updatedTask} : task);
        saveTasks();
        renderTasks();
        updateStats();
    }
    
// Replace the deleteTask function with:
function deleteTask(id) {
    const taskElement = document.querySelector(`.task-card[data-id="${id}"]`);
    if (taskElement) {
        taskElement.classList.add('fade-out');
        // setTimeout(() => {
        //     const taskToDelete = tasks.find(task => task.id === id);
        //     if (!taskToDelete.completed) {
        //         showRoastMessage(taskToDelete);
        //     }
        //     tasks = tasks.filter(task => task.id !== id);
        //     saveTasks();
        //     renderTasks();
        //     updateStats();
        // }, 300);
    }
}
    function toggleTaskCompletion(id) {
        const task = tasks.find(task => task.id === id);
        if (!task) return;
        
        const updatedTask = {...task, completed: !task.completed};
        updateTask(id, updatedTask);
        
        if (updatedTask.completed) {
            showCelebration(task);
        }
    }
    
    // UI Functions
    function renderTasks() {
        const searchTerm = taskSearch.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const selectedPriority = priorityFilter.value;
        
        const filteredTasks = tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchTerm) || 
                                task.description.toLowerCase().includes(searchTerm);
            const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
            const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
            
            return matchesSearch && matchesCategory && matchesPriority;
        });
        
        if (filteredTasks.length === 0) {
            taskContainer.innerHTML = `
                <div class="empty-state">
                    <img src="https://cdn-icons-png.flaticon.com/512/4076/4076478.png" alt="No tasks" class="empty-img">
                    <h2>No tasks found!</h2>
                    <p>Try adjusting your search or filters.</p>
                </div>
            `;
            return;
        }
        
        taskContainer.innerHTML = '';
        
        filteredTasks.forEach((task, index) => {
            const taskElement = createTaskElement(task);
            taskElement.style.animationDelay = `${index * 0.1}s`;
            taskContainer.appendChild(taskElement);
        });
    }
    
    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-card ${task.priority} ${task.completed ? 'task-completed' : ''} ${isOverdue(task.dueDate) && !task.completed ? 'overdue' : ''}`;
        taskElement.dataset.id = task.id;
        
        const countdownText = getCountdownText(task.dueDate);
        const countdownClass = getCountdownClass(task.dueDate, task.completed);
        
        taskElement.innerHTML = `
            <div class="task-header">
                <h3 class="task-title">${escapeHtml(task.title)}</h3>
                <span class="task-category">${task.category}</span>
            </div>
            ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
            <div class="task-meta">
                <div class="task-due-date">
                    <i class="far fa-calendar-alt"></i>
                    <span>${formatDate(task.dueDate)}</span>
                </div>
                <div class="task-countdown ${countdownClass}">
                    <i class="far fa-clock"></i>
                    <span>${countdownText}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn complete-btn" aria-label="Mark as ${task.completed ? 'incomplete' : 'complete'}">
                    <i class="far ${task.completed ? 'fa-undo-alt' : 'fa-check-circle'}"></i>
                </button>
                <button class="task-btn edit-btn" aria-label="Edit task">
                    <i class="far fa-edit"></i>
                </button>
                <button class="task-btn delete-btn" aria-label="Delete task">
                    <i class="far fa-trash-alt"></i>
                </button>
            </div>
        `;
        
        // Add event listeners to action buttons
        const completeBtn = taskElement.querySelector('.complete-btn');
        const editBtn = taskElement.querySelector('.edit-btn');
        const deleteBtn = taskElement.querySelector('.delete-btn');
        
        completeBtn.addEventListener('click', () => toggleTaskCompletion(task.id));
        editBtn.addEventListener('click', () => openEditModal(task.id));
        deleteBtn.addEventListener('click', () => {
            taskElement.classList.add('shake');
            setTimeout(() => {
                deleteTask(task.id);
            }, 500);
        });
        
        return taskElement;
    }
    
    function openTaskModal() {
        editMode = false;
        currentEditId = null;
        taskForm.reset();
        document.getElementById('task-priority').value = 'medium';
        document.getElementById('task-category').value = 'personal';
        taskModal.classList.add('active');
        document.getElementById('task-title').focus();
    }
    
    function openEditModal(id) {
        const taskToEdit = tasks.find(task => task.id === id);
        if (!taskToEdit) return;
        
        editMode = true;
        currentEditId = id;
        
        document.getElementById('task-title').value = taskToEdit.title;
        document.getElementById('task-description').value = taskToEdit.description || '';
        document.getElementById('task-due-date').value = formatDateForInput(taskToEdit.dueDate);
        document.getElementById('task-priority').value = taskToEdit.priority;
        document.getElementById('task-category').value = taskToEdit.category;
        
        taskModal.classList.add('active');
        document.getElementById('task-title').focus();
    }
    
    function closeTaskModal() {
        taskModal.classList.remove('active');
    }
    
    function handleTaskSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('task-title').value.trim();
        const description = document.getElementById('task-description').value.trim();
        const dueDate = document.getElementById('task-due-date').value;
        const priority = document.getElementById('task-priority').value;
        const category = document.getElementById('task-category').value;
        
        if (!title || !dueDate) {
            alert('Please fill in all required fields');
            return;
        }
        
        const taskData = {
            title,
            description,
            dueDate: new Date(dueDate).toISOString(),
            priority,
            category,
            createdDate: new Date().toISOString(),
            completed: false
        };
        
        if (editMode && currentEditId) {
            updateTask(currentEditId, taskData);
        } else {
            taskData.id = Date.now().toString();
            addTask(taskData);
        }
        
        closeTaskModal();
    }
    
    // Celebration and Roast Functions

function showCelebration(task) {
    const messages = [
        "You're like a software update - you just made everything better! 🎉",
        "Task completed! You're more reliable than my Wi-Fi! 💪",
        "Boom! Another one bites the dust! You're on fire! 🔥",
        "Nailed it! You're crushing these tasks like a pro! 🏆",
        "Success! You're making productivity look easy! ✨",
        "Task conquered! You're unstoppable today! 🚀",
        "Done and done! You're a task-completing machine! 🤖",
        "Achievement unlocked! You're leveling up! 🎮",
        "Mission accomplished! The productivity force is strong with you! ⭐",
        "You did it! Now go treat yourself to something nice! 🍪"
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    celebrationMessage.textContent = randomMessage;
    
    // Create confetti
    createConfetti();
    
    // Create close button if it doesn't exist
    if (!document.querySelector('.celebration-close')) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'celebration-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            // celebrationModal.classList.remove('active');
        });
        celebrationContent.appendChild(closeBtn);
    }
    
    // Show celebration modal
    celebrationModal.classList.add('active');
}
    function createConfetti() {
        confettiContainer.innerHTML = '';
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = `${Math.random() * 10 + 5}px`;
            confetti.style.height = `${Math.random() * 10 + 5}px`;
            confetti.style.animationDuration = `${Math.random() * 3 + 2}s`;
            confetti.style.animationDelay = `${Math.random() * 2}s`;
            confettiContainer.appendChild(confetti);
        }
    }
    
    function showRoastMessage(task) {
        const roasts = {
            new: [
                "Really? Giving up already? Even my houseplant has more commitment! 🌱",
                "Deleting tasks? That's not how productivity works, genius! 🤦‍♂️",
                "Another one bites the dust... and so does your motivation! 💀",
                "Wow, that didn't last long. Maybe try something easier? 🧩",
                "Deleted already? My grandma has more follow-through! 👵"
            ],
            medium: [
                "Couldn't handle it, huh? Maybe next time don't procrastinate! ⏳",
                "Giving up mid-way? That's like leaving a movie before the climax! 🎬",
                "Task deleted. Your productivity graph just cried a little. 😢",
                "Was it too hard or did you just get distracted by cat videos? 🐱",
                "Another task for the 'I'll do it later' graveyard! ⚰️"
            ],
            old: [
                "Finally admitting defeat after all this time? Better late than never! 🐢",
                "This task was so old it could vote! Why delete it now? 🗳️",
                "Wow, you really held onto this one! Like a productivity hoarder! 🏚️",
                "Deleted after all this time? That's some serious commitment... to not doing it! 🙈",
                "This task was collecting dust like a museum exhibit! 🏛️"
            ]
        };
        
        const taskAge = getTaskAge(task.createdDate);
        let roastCategory = 'new';
        
        if (taskAge > 30) roastCategory = 'old';
        else if (taskAge > 7) roastCategory = 'medium';
        
        const randomRoast = roasts[roastCategory][Math.floor(Math.random() * roasts[roastCategory].length)];
        
        // Show toast notification
        showToast(randomRoast, 'warning');
    }
    
// Replace the showToast function with:
function showToast(message, type = 'info') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    toast.appendChild(messageSpan);
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
    toast.appendChild(closeBtn);
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
}
    
    // Utility Functions
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    function updateStats() {
        totalTasksEl.textContent = tasks.length;
        completedTasksEl.textContent = tasks.filter(task => task.completed).length;
        pendingTasksEl.textContent = tasks.filter(task => !task.completed).length;
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    function formatDateForInput(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    function getCountdownText(dueDateString) {
        const now = new Date();
        const dueDate = new Date(dueDateString);
        const diffInMs = dueDate - now;
        
        if (diffInMs <= 0) return 'Overdue!';
        
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        const diffInHours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffInMinutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffInDays > 0) return `${diffInDays}d ${diffInHours}h left`;
        if (diffInHours > 0) return `${diffInHours}h ${diffInMinutes}m left`;
        return `${diffInMinutes}m left`;
    }
    
    function getCountdownClass(dueDateString, isCompleted) {
        if (isCompleted) return '';
        
        const now = new Date();
        const dueDate = new Date(dueDateString);
        const diffInMs = dueDate - now;
        const diffInHours = diffInMs / (1000 * 60 * 60);
        
        if (diffInMs <= 0) return 'danger';
        if (diffInHours <= 24) return 'warning';
        return '';
    }
    
    function isOverdue(dueDateString) {
        const now = new Date();
        const dueDate = new Date(dueDateString);
        return dueDate < now;
    }
    
    function getTaskAge(createdDateString) {
        const createdDate = new Date(createdDateString);
        const now = new Date();
        const diffInMs = now - createdDate;
        return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    }
    
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
    // Theme Functions
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const icon = themeToggle.querySelector('i');
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    function checkThemePreference() {
        const savedTheme = localStorage.getItem('theme') || 
                         (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const icon = themeToggle.querySelector('i');
        icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    // Add toast styles dynamically
    const toastStyles = document.createElement('style');
    toastStyles.textContent = `
        .toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            transition: transform 0.3s ease;
            max-width: 90%;
            text-align: center;
        }
        
        .toast.show {
            transform: translateX(-50%) translateY(0);
        }
        
        .toast-warning {
            background-color: var(--warning);
        }
    `;
    document.head.appendChild(toastStyles);
});