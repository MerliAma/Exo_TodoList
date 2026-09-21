const taskInput = document.getElementById("taskInput");
const deadlineInput = document.getElementById("deadlineInput");
const addBtn = document.getElementById("addBtn");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const taskList = document.getElementById("taskList");
const feedbackMessage = document.getElementById("feedbackMessage");
const totalTasksEl = document.getElementById("totalTasks");
const activeTasksEl = document.getElementById("activeTasks");
const completedTasksEl = document.getElementById("completedTasks");
const filterButtons = document.querySelectorAll(".filter-btn");
const editModal = document.getElementById("editModal");
const editTaskInput = document.getElementById("editTaskInput");
const editDeadlineInput = document.getElementById("editDeadlineInput");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveEditBtn = document.getElementById("saveEditBtn");
const confirmModal = document.getElementById("confirmModal");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const userModal = document.getElementById("userModal");
const userNameInput = document.getElementById("userNameInput");
const saveUserBtn = document.getElementById("saveUserBtn");
const changeUserBtn = document.getElementById("changeUserBtn");
const currentUserLabel = document.getElementById("currentUserLabel");

function normalizeUserName(name) {
    return name.trim().toLocaleLowerCase("fr-FR");
}

function loadUsersTasks() {
    try {
        const storedTasks = localStorage.getItem("tasksByUser");
        return storedTasks ? JSON.parse(storedTasks) : {};
    } catch (error) {
        console.warn("Impossible de charger les tâches depuis le stockage local :", error);
        return {};
    }
}

let currentUser = localStorage.getItem("currentUser") || "";
let tasksByUser = loadUsersTasks();
let tasks = [];
let currentFilter = "all";
let isDarkTheme = localStorage.getItem("theme") === "dark";

function migrateLegacyTasks() {
    if (!currentUser) {
        return;
    }

    const userKey = normalizeUserName(currentUser);

    if (Object.prototype.hasOwnProperty.call(tasksByUser, userKey)) {
        return;
    }

    try {
        const legacyTasks = localStorage.getItem("tasks");
        tasksByUser[userKey] = legacyTasks ? JSON.parse(legacyTasks) : [];
        localStorage.setItem("tasksByUser", JSON.stringify(tasksByUser));
    } catch (error) {
        tasksByUser[userKey] = [];
    }
}

migrateLegacyTasks();
tasks = currentUser ? (tasksByUser[normalizeUserName(currentUser)] || []) : [];

function saveTasks() {
    if (!currentUser) {
        return;
    }

    tasksByUser[normalizeUserName(currentUser)] = tasks;
    localStorage.setItem("tasksByUser", JSON.stringify(tasksByUser));
}

function showUserModal() {
    userModal.classList.remove("hidden");
    userNameInput.value = currentUser;
    userNameInput.focus();
}

function setCurrentUser(name) {
    currentUser = name.trim();
    localStorage.setItem("currentUser", currentUser);
    tasks = tasksByUser[normalizeUserName(currentUser)] || [];
    currentUserLabel.textContent = `Tâches de ${currentUser}`;
    userModal.classList.add("hidden");
    selectedTaskIndex = -1;
    currentFilter = "all";
    filterButtons.forEach(button => button.classList.toggle("active", button.dataset.filter === currentFilter));
    renderTasks();
}

function getFilteredTasks() {
    if (currentFilter === "active") {
        return tasks.filter(task => !task.completed);
    }

    if (currentFilter === "completed") {
        return tasks.filter(task => task.completed);
    }

    return tasks;
}

let selectedTaskIndex = -1;
let editingTaskIndex = -1;
let deletingTaskIndex = -1;

function applyTheme() {
    document.body.classList.toggle("dark-theme", isDarkTheme);
    themeToggleBtn.textContent = isDarkTheme ? "☀️" : "🌙";
}

function updateStats() {
    const total = tasks.length;
    const active = tasks.filter(task => !task.completed).length;
    const completed = tasks.filter(task => task.completed).length;

    totalTasksEl.textContent = total;
    activeTasksEl.textContent = active;
    completedTasksEl.textContent = completed;
}

function renderTasks() {
    taskList.innerHTML = "";

    currentUserLabel.textContent = currentUser ? `Tâches de ${currentUser}` : "";
    updateStats();

    const filteredTasks = getFilteredTasks();

    filteredTasks.forEach((task, index) => {
        const li = document.createElement("li");

        const span = document.createElement("span");
        span.className = "task";

        const taskText = document.createElement("span");
        taskText.textContent = task.text;

        if (task.completed) {
            taskText.classList.add("completed");
        }

        const meta = document.createElement("span");
        meta.className = "task-meta";
        const createdDate = task.createdAt ? new Date(task.createdAt).toLocaleDateString("fr-FR") : "Date inconnue";
        const deadlineText = task.deadline ? `Échéance : ${new Date(task.deadline).toLocaleDateString("fr-FR")}` : "Aucune échéance";
        meta.textContent = `Créée le ${createdDate} • ${deadlineText}`;

        span.appendChild(taskText);
        span.appendChild(meta);

        const originalIndex = tasks.findIndex(t => t === task);

        if (selectedTaskIndex === originalIndex) {
            span.classList.add("selected");
        }

        span.addEventListener("click", () => {
            selectedTaskIndex = originalIndex;
            tasks[originalIndex].completed = !tasks[originalIndex].completed;
            saveTasks();
            renderTasks();
        });

        const actions = document.createElement("div");
        actions.className = "actions";

        const editBtn = document.createElement("button");
        editBtn.textContent = "Modifier";
        editBtn.className = "edit";

        editBtn.addEventListener("click", () => {
            if (task.completed) {
                showFeedback("Cette tâche est déjà terminée. Vous ne pouvez plus la modifier.");
                return;
            }

            editingTaskIndex = originalIndex;
            editTaskInput.value = task.text;
            editDeadlineInput.value = task.deadline || "";
            editModal.classList.remove("hidden");
            editTaskInput.focus();
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Supprimer";
        deleteBtn.className = "delete";

        deleteBtn.addEventListener("click", () => {
            deletingTaskIndex = originalIndex;
            confirmModal.classList.remove("hidden");
        });

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(span);
        li.appendChild(actions);

        taskList.appendChild(li);
    });
}

function showFeedback(message) {
    feedbackMessage.textContent = message;
    clearTimeout(showFeedback.timeoutId);
    showFeedback.timeoutId = setTimeout(() => {
        feedbackMessage.textContent = "";
    }, 2000);
}

function clearFeedback() {
    clearTimeout(showFeedback.timeoutId);
    feedbackMessage.textContent = "";
}

function addTask() {
    const text = taskInput.value.trim();
    const deadline = deadlineInput.value;

    if (text === "" && !deadline) {
        showFeedback("Veuillez saisir un titre et une deadline pour ajouter une tâche.");
        return;
    }

    if (text === "") {
        showFeedback("Veuillez saisir un titre pour votre tâche.");
        return;
    }

    if (!deadline) {
        showFeedback("Veuillez choisir une deadline avant d’ajouter la tâche.");
        return;
    }

    const now = new Date();

    tasks.push({
        text,
        completed: false,
        createdAt: now.toISOString(),
        deadline: deadlineInput.value || null
    });

    saveTasks();
    renderTasks();

    taskInput.value = "";
    deadlineInput.value = "";
    clearFeedback();
    taskInput.focus();
}

addBtn.addEventListener("click", addTask);

saveUserBtn.addEventListener("click", () => {
    const name = userNameInput.value.trim();

    if (!name) {
        showFeedback("Veuillez renseigner votre nom.");
        userNameInput.focus();
        return;
    }

    setCurrentUser(name);
});

changeUserBtn.addEventListener("click", showUserModal);

userNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        saveUserBtn.click();
    }
});

clearCompletedBtn.addEventListener("click", () => {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
});

themeToggleBtn.addEventListener("click", () => {
    isDarkTheme = !isDarkTheme;
    localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
    applyTheme();
});

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        filterButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        renderTasks();
    });
});

taskInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        addTask();
    }
});

deadlineInput.addEventListener("change", clearFeedback);
taskInput.addEventListener("input", clearFeedback);

cancelEditBtn.addEventListener("click", () => {
    editModal.classList.add("hidden");
    editingTaskIndex = -1;
});

saveEditBtn.addEventListener("click", () => {
    if (editingTaskIndex >= 0) {
        const newText = editTaskInput.value.trim();
        const newDeadline = editDeadlineInput.value;

        if (!newText) {
            showFeedback("Le titre ne peut pas être vide.");
            return;
        }

        tasks[editingTaskIndex].text = newText;
        tasks[editingTaskIndex].deadline = newDeadline || null;
        saveTasks();
        renderTasks();
        editModal.classList.add("hidden");
        editingTaskIndex = -1;
        clearFeedback();
    }
});

editModal.addEventListener("click", (e) => {
    if (e.target === editModal) {
        editModal.classList.add("hidden");
        editingTaskIndex = -1;
    }
});

confirmModal.addEventListener("click", (e) => {
    if (e.target === confirmModal) {
        confirmModal.classList.add("hidden");
        deletingTaskIndex = -1;
    }
});

cancelDeleteBtn.addEventListener("click", () => {
    confirmModal.classList.add("hidden");
    deletingTaskIndex = -1;
});

confirmDeleteBtn.addEventListener("click", () => {
    if (deletingTaskIndex >= 0) {
        tasks.splice(deletingTaskIndex, 1);
        selectedTaskIndex = -1;
        saveTasks();
        renderTasks();
    }

    confirmModal.classList.add("hidden");
    deletingTaskIndex = -1;
});

document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") {
        return;
    }

    if (e.key === "Delete") {
        if (selectedTaskIndex >= 0) {
            tasks.splice(selectedTaskIndex, 1);
            selectedTaskIndex = -1;
            saveTasks();
            renderTasks();
        }
    }
});

applyTheme();
renderTasks();

if (!currentUser) {
    showUserModal();
}