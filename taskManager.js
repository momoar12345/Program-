export class TaskManager {
  constructor() {
    this.tasks = [];
    this.level = 0;
    this.points = 0;
    this.saveTimeout = null;
    this.statsCache = null;
    this.statsCacheTime = null;
    this.reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
    this._reminderTimers = [];
    this.initializeReminders();
  }

  async loadTasks() {
    const savedData = JSON.parse(localStorage.getItem('taskData') || '{}');
    this.tasks = savedData.tasks || [];
    this.level = savedData.level || 0;
    this.points = savedData.points || 0;
  }

  getTasks() {
    return this.tasks;
  }

  getLevel() {
    return {
      level: this.level,
      points: this.points
    };
  }

  async addTask(taskData) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Set to last Saturday

    const weeklyStatus = Array(7).fill().map((_, i) => ({
      date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString(),
      status: null, // Initially no status selected
      enabled: true // All days enabled by default
    }));

    const task = {
      id: Date.now().toString(),
      ...taskData,
      weeklyStatus,
      createdAt: new Date().toISOString()
    };

    this.tasks.push(task);
    await this.saveTasks();
    return task;
  }

  async updateDayStatus(taskId, dayIndex, status) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Store previous status for point calculation
    const previousStatus = task.weeklyStatus[dayIndex].status;
    
    // If same status is selected, clear it
    if (task.weeklyStatus[dayIndex].status === status) {
      task.weeklyStatus[dayIndex].status = null;
    } else {
      task.weeklyStatus[dayIndex].status = status;
    }
    
    // Immediately deduct points for previous status if it exists
    if (previousStatus) {
      switch(previousStatus) {
        case 'complete': 
          this.addPoints(-10); 
          this.adjustLevel(-1); // Reduce level for unchecking completion
          break;
        case 'failed': 
          this.addPoints(5); // Add back the points that were deducted
          this.adjustLevel(1); // Add level back for unchecking failure
          break;
        case 'break': 
          this.addPoints(-2);
          break;
      }
    }

    // Immediately add points for new status
    if (status) {
      switch(status) {
        case 'complete': 
          this.addPoints(10);
          this.adjustLevel(1); // Add level for completion
          this.showPointAnimation(dayIndex, '+10', true);
          break;
        case 'failed': 
          this.addPoints(-5);
          this.adjustLevel(-1); // Reduce level for failure
          this.showPointAnimation(dayIndex, '-5', true);
          break;
        case 'break': 
          this.addPoints(2);
          this.showPointAnimation(dayIndex, '+2');
          break;
      }
    }

    // Update UI immediately
    document.querySelector('.level').textContent = `Level ${this.level}`;
    document.querySelector('.points').textContent = `${this.points} pts`;

    this.requestSave();
  }

  adjustLevel(change) {
    this.level = Math.max(0, this.level + change);
  }

  showPointAnimation(dayIndex, points, showLevel = false) {
    const cells = document.querySelectorAll('.day-cell');
    const cell = cells[dayIndex];
    if (!cell) return;

    // Points animation
    const animation = document.createElement('div');
    animation.className = 'points-animation';
    animation.textContent = points;
    animation.style.color = points.includes('+') ? '#2ecc71' : '#e74c3c';
    
    cell.appendChild(animation);

    // Trigger animation
    requestAnimationFrame(() => {
      animation.style.transform = 'translateY(-20px)';
      animation.style.opacity = '0';
    });

    // Remove after animation
    setTimeout(() => animation.remove(), 500);

    // Level animation if needed
    if (showLevel) {
      const levelAnimation = document.createElement('div');
      levelAnimation.className = 'points-animation level-change';
      levelAnimation.textContent = points.includes('+') ? '+1 Level' : '-1 Level';
      levelAnimation.style.color = points.includes('+') ? '#2ecc71' : '#e74c3c';
      levelAnimation.style.top = '70%';
      
      cell.appendChild(levelAnimation);

      requestAnimationFrame(() => {
        levelAnimation.style.transform = 'translateY(-20px)';
        levelAnimation.style.opacity = '0';
      });

      setTimeout(() => levelAnimation.remove(), 500);
    }
  }

  addPoints(points) {
    this.points += points;
    if (this.points < 0) this.points = 0;
  }

  requestSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.saveTasks(), 300);
  }

  async saveTasks() {
    localStorage.setItem('taskData', JSON.stringify({
      tasks: this.tasks,
      level: this.level,
      points: this.points
    }));
  }

  async completeTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = true;
      task.completedAt = new Date().toISOString();
      await this.saveTasks();
    }
  }

  async deleteTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      // Calculate points to deduct based on completed tasks in the task's weekly status
      const pointsToDeduct = task.weeklyStatus.reduce((total, status) => {
        switch(status.status) {
          case 'complete': return total - 10;
          case 'failed': return total + 5; // Add back the negative points
          case 'break': return total - 2;
          default: return total;
        }
      }, 0);

      // Update points
      this.points = Math.max(0, this.points + pointsToDeduct);
      
      // Recalculate level
      this.level = Math.floor(this.points / 100);
    }

    // Remove task
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    await this.saveTasks();
    
    // Clear stats cache to force recalculation
    this.statsCache = null;
    this.statsCacheTime = null;
  }

  async updateTask(taskId, updates) {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      this.tasks[taskIndex] = {
        ...this.tasks[taskIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await this.saveTasks();
      return this.tasks[taskIndex];
    }
    return null;
  }

  async markTaskFailed(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.failed = true;
      task.completed = false;
      task.failedAt = new Date().toISOString();
      await this.saveTasks();
    }
  }

  async markTaskBreak(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.onBreak = !task.onBreak;
      task.breakStartedAt = task.onBreak ? new Date().toISOString() : null;
      await this.saveTasks();
    }
  }

  async startNewWeek() {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Set to current Saturday
    
    this.tasks = this.tasks.map(task => {
      // Reset weekly status with new dates
      const weeklyStatus = Array(7).fill().map((_, i) => ({
        date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString(),
        status: null,
        enabled: true
      }));
      
      return {
        ...task,
        weeklyStatus
      };
    });

    // Clear stats cache
    this.statsCache = null;
    this.statsCacheTime = null;
    
    // Save changes
    await this.saveTasks();
    return this.tasks;
  }

  getTaskStats() {
    // Cache results for better performance
    if (this.statsCache && Date.now() - this.statsCacheTime < 1000) {
      return this.statsCache;
    }

    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    
    // Pre-calculate date objects for comparison
    const dates = Array(7).fill().map((_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      return date;
    });

    // Use reduce instead of multiple array operations
    const weeklyStats = this.tasks.reduce((stats, task) => {
      task.weeklyStatus.forEach((status, i) => {
        if (!stats[i]) {
          stats[i] = { date: dates[i], completed: 0, failed: 0, break: 0 };
        }
        if (status.status === 'complete') stats[i].completed++;
        else if (status.status === 'failed') stats[i].failed++;
        else if (status.status === 'break') stats[i].break++;
      });
      return stats;
    }, []);

    // Cache results
    this.statsCache = {
      weekly: weeklyStats,
      total: weeklyStats.reduce((total, day) => ({
        completed: total.completed + day.completed,
        failed: total.failed + day.failed,
        break: total.break + day.break
      }), { completed: 0, failed: 0, break: 0 })
    };
    
    this.statsCacheTime = Date.now();
    return this.statsCache;
  }

  async getPredictionStats() {
    const stats = this.getTaskStats();
    const totalTasks = this.tasks.length;
    
    if (totalTasks === 0) return null;

    const completedTasks = stats.total.completed;
    const failedTasks = stats.total.failed;
    const successRate = (completedTasks / (completedTasks + failedTasks)) * 100 || 0;
    
    const levelFactor = Math.min((this.level * 5), 25); // Level influence up to 25%
    const consistencyBonus = this.calculateConsistencyBonus();
    
    return {
      overallSuccessRate: Math.round(successRate),
      levelBonus: levelFactor,
      consistencyBonus,
      adjustedSuccessRate: Math.round(Math.min(successRate + levelFactor + consistencyBonus, 100))
    };
  }

  calculateConsistencyBonus() {
    const recentTasks = this.tasks
      .flatMap(task => task.weeklyStatus)
      .filter(status => status.status)
      .slice(-10);

    if (recentTasks.length === 0) return 0;

    const successfulTasks = recentTasks.filter(status => status.status === 'complete').length;
    const consistencyRate = (successfulTasks / recentTasks.length) * 100;
    
    return Math.round(Math.min(consistencyRate * 0.15, 15)); // Up to 15% bonus
  }

  initializeReminders() {
    // Clear any existing reminder timers
    if (this._reminderTimers) {
      this._reminderTimers.forEach(timer => clearTimeout(timer));
    }
    this._reminderTimers = [];
    
    // Set up reminders
    this.reminders.forEach(reminder => {
      if (new Date(reminder.time) > new Date()) {
        this.scheduleReminder(reminder);
      }
    });
  }

  scheduleReminder(reminder) {
    const now = new Date().getTime();
    const reminderTime = new Date(reminder.time).getTime();
    const delay = reminderTime - now;
    
    if (delay > 0) {
      const timer = setTimeout(() => {
        this.showReminderNotification(reminder);
      }, delay);
      
      this._reminderTimers.push(timer);
    }
  }

  showReminderNotification(reminder) {
    const popup = document.createElement('div');
    popup.className = 'reminder-popup';
    popup.innerHTML = `
      <button class="close-btn" onclick="app.hideReminderMessage(this)">×</button>
      <h4>Task Reminder</h4>
      <p>${reminder.message}</p>
      <p class="reminder-task">Task: ${reminder.taskTitle}</p>
    `;
    
    document.body.appendChild(popup);
    
    // Auto-hide after 30 seconds
    setTimeout(() => {
      if (document.body.contains(popup)) {
        app.hideReminderMessage(popup.querySelector('.close-btn'));
      }
    }, 30000);
  }

  async addReminder(taskId, reminderTime, message) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    const reminder = {
      id: Date.now().toString(),
      taskId,
      taskTitle: task.title,
      time: reminderTime,
      message
    };

    this.reminders.push(reminder);
    await this.saveReminders();
    this.scheduleReminder(reminder);
    return reminder;
  }

  async deleteReminder(reminderId) {
    this.reminders = this.reminders.filter(r => r.id !== reminderId);
    await this.saveReminders();
  }

  async saveReminders() {
    localStorage.setItem('reminders', JSON.stringify(this.reminders));
  }

  getReminders(taskId = null) {
    return taskId 
      ? this.reminders.filter(r => r.taskId === taskId)
      : this.reminders;
  }

  cleanup() {
    if (this._reminderTimers) {
      this._reminderTimers.forEach(timer => clearTimeout(timer));
    }
  }
}