let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let reminders = JSON.parse(localStorage.getItem("reminders")) || [];
let income = Number(localStorage.getItem("income")) || 0;
let budget = Number(localStorage.getItem("budget")) || 0;

let editingExpenseId = null;
let expenseChart = null;
let reportCategoryChart = null;
let incomeExpenseChart = null;

document.addEventListener("DOMContentLoaded", function() {

    showCurrentDate();
    setDefaultDates();
    updateAllPages();
    checkReminders();

});

function showCurrentDate() {

    const element = document.getElementById("currentDate");

    if (!element) {
        return;
    }

    element.textContent = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

}

function getTodayString() {

    const today = new Date();

    return (
        today.getFullYear() +
        "-" +
        String(today.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(today.getDate()).padStart(2, "0")
    );

}

function setDefaultDates() {

    const date = getTodayString();

    const expenseDate = document.getElementById("expenseDate");
    const reminderDate = document.getElementById("reminderDate");

    if (expenseDate) {
        expenseDate.value = date;
    }

    if (reminderDate) {
        reminderDate.value = date;
    }

}

function isCurrentMonth(dateString) {

    const today = new Date();
    const date = new Date(dateString + "T00:00:00");

    return (
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );

}

function getMonthlyExpenses() {

    return expenses.filter(function(expense) {
        return isCurrentMonth(expense.date);
    });

}

function formatMoney(amount) {

    return "AED " + Number(amount).toFixed(2);

}

function formatDate(dateString) {

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}

function saveData() {

    localStorage.setItem("expenses", JSON.stringify(expenses));
    localStorage.setItem("reminders", JSON.stringify(reminders));
    localStorage.setItem("income", income);
    localStorage.setItem("budget", budget);

}

function updateAllPages() {

    updateDashboard();
    displayExpensesPage();
    updateExpensePageStats();
    updateBudgetPage();
    displayRemindersPage();
    updateReminderStats();
    updateReports();

}

function openExpenseModal() {

    const modal = document.getElementById("expenseModal");

    if (!modal) {
        return;
    }

    modal.classList.add("show");

}

function closeExpenseModal() {

    const modal = document.getElementById("expenseModal");

    if (!modal) {
        return;
    }

    modal.classList.remove("show");

    editingExpenseId = null;

    const title = document.getElementById("expenseModalTitle");

    if (title) {
        title.textContent = "Add Expense";
    }

}

const expenseForm = document.getElementById("expenseForm");

if (expenseForm) {

    expenseForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const description =
            document.getElementById("expenseDescription").value.trim();

        const amount =
            Number(document.getElementById("expenseAmount").value);

        const category =
            document.getElementById("expenseCategory").value;

        const date =
            document.getElementById("expenseDate").value;

        if (!description || !Number.isFinite(amount) || amount <= 0 || !date) {

            alert("Please enter valid expense details");

            return;

        }

        if (editingExpenseId !== null) {

            expenses = expenses.map(function(expense) {

                if (expense.id === editingExpenseId) {

                    return {
                        id: expense.id,
                        description: description,
                        amount: amount,
                        category: category,
                        date: date
                    };

                }

                return expense;

            });

        } else {

            expenses.push({
                id: Date.now(),
                description: description,
                amount: amount,
                category: category,
                date: date
            });

        }

        saveData();

        this.reset();

        setDefaultDates();

        closeExpenseModal();

        updateAllPages();

    });

}

function displayExpensesPage() {

    const list = document.getElementById("expensePageList");

    if (!list) {
        return;
    }

    const search =
        (document.getElementById("searchExpense")?.value || "")
        .toLowerCase();

    const category =
        document.getElementById("filterCategory")?.value || "All";

    const filtered = expenses.filter(function(expense) {

        const matchesSearch =
            expense.description.toLowerCase().includes(search) ||
            expense.category.toLowerCase().includes(search);

        const matchesCategory =
            category === "All" ||
            expense.category === category;

        return matchesSearch && matchesCategory;

    });

    list.innerHTML = "";

    if (filtered.length === 0) {

        list.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        No expenses found
                    </div>
                </td>
            </tr>
        `;

        return;

    }

    filtered
        .slice()
        .reverse()
        .forEach(function(expense) {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${formatDate(expense.date)}</td>

                <td>
                    ${escapeHTML(expense.description)}
                </td>

                <td>
                    <span class="category">
                        ${escapeHTML(expense.category)}
                    </span>
                </td>

                <td class="amount">
                    ${formatMoney(expense.amount)}
                </td>

                <td>
                    <div class="action-buttons">

                        <button
                            class="edit-btn"
                            onclick="editExpense(${expense.id})"
                        >
                            ✏️
                        </button>

                        <button
                            class="delete-btn"
                            onclick="deleteExpense(${expense.id})"
                        >
                            🗑
                        </button>

                    </div>
                </td>
            `;

            list.appendChild(row);

        });

}

function editExpense(id) {

    const expense = expenses.find(function(item) {
        return item.id === id;
    });

    if (!expense) {
        return;
    }

    editingExpenseId = id;

    document.getElementById("expenseModalTitle").textContent =
        "Edit Expense";

    document.getElementById("expenseDescription").value =
        expense.description;

    document.getElementById("expenseAmount").value =
        expense.amount;

    document.getElementById("expenseCategory").value =
        expense.category;

    document.getElementById("expenseDate").value =
        expense.date;

    openExpenseModal();

}

function deleteExpense(id) {

    if (!confirm("Delete this expense?")) {
        return;
    }

    expenses = expenses.filter(function(expense) {
        return expense.id !== id;
    });

    saveData();

    updateAllPages();

}

function updateExpensePageStats() {

    const monthly = getMonthlyExpenses();

    const total = monthly.reduce(function(sum, expense) {
        return sum + expense.amount;
    }, 0);

    const average =
        monthly.length > 0
        ? total / monthly.length
        : 0;

    const largest =
        monthly.length > 0
        ? Math.max(...monthly.map(function(expense) {
            return expense.amount;
        }))
        : 0;

    const totalElement = document.getElementById("expensePageTotal");
    const countElement = document.getElementById("expenseCount");
    const averageElement = document.getElementById("averageExpense");
    const largestElement = document.getElementById("largestExpense");

    if (totalElement) {
        totalElement.textContent = formatMoney(total);
    }

    if (countElement) {
        countElement.textContent = monthly.length;
    }

    if (averageElement) {
        averageElement.textContent = formatMoney(average);
    }

    if (largestElement) {
        largestElement.textContent = formatMoney(largest);
    }

}

function addIncome() {

    const amount = prompt(
        "Enter your monthly income",
        income > 0 ? income : ""
    );

    if (amount === null) {
        return;
    }

    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
        alert("Enter a valid amount");
        return;
    }

    income = value;

    saveData();
    updateAllPages();
}

}

function setBudget() {

    const amount = prompt(
        "Enter your monthly budget",
        budget > 0 ? budget : ""
    );

    if (amount === null) {
        return;
    }

    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {

        alert("Enter a valid budget");

        return;

    }

    budget = value;

    saveData();

    updateAllPages();

}

function updateDashboard() {

    const monthly = getMonthlyExpenses();

    const totalExpense = monthly.reduce(function(sum, expense) {
        return sum + expense.amount;
    }, 0);

    const balance = income - totalExpense;
    const remaining = budget - totalExpense;

    const incomeElement = document.getElementById("totalIncome");
    const expenseElement = document.getElementById("totalExpense");
    const balanceElement = document.getElementById("balance");
    const budgetRemainingElement =
        document.getElementById("budgetRemaining");

    if (incomeElement) {
        incomeElement.textContent = formatMoney(income);
    }

    if (expenseElement) {
        expenseElement.textContent = formatMoney(totalExpense);
    }

    if (balanceElement) {
        balanceElement.textContent = formatMoney(balance);
    }

    if (budgetRemainingElement) {
        budgetRemainingElement.textContent = formatMoney(remaining);
    }

    updateDashboardBudget(totalExpense);
    displayRecentExpenses();
    displayDashboardReminders();
    updateDashboardChart(monthly);

}

function updateDashboardBudget(totalExpense) {

    const amountElement =
        document.getElementById("budgetAmount");

    const spentElement =
        document.getElementById("budgetSpent");

    const progressElement =
        document.getElementById("budgetProgress");

    const messageElement =
        document.getElementById("budgetMessage");

    if (!amountElement) {
        return;
    }

    amountElement.textContent = formatMoney(budget);
    spentElement.textContent = formatMoney(totalExpense);

    if (budget <= 0) {

        progressElement.style.width = "0%";

        messageElement.textContent =
            "Set a monthly budget to start tracking.";

        return;

    }

    const percentage =
        (totalExpense / budget) * 100;

    progressElement.style.width =
        Math.min(percentage, 100) + "%";

    if (totalExpense > budget) {

        messageElement.textContent =
            "You are " +
            formatMoney(totalExpense - budget) +
            " over budget.";

    } else {

        messageElement.textContent =
            Math.round(percentage) +
            "% of your budget used.";

    }

}

function displayRecentExpenses() {

    const list = document.getElementById("recentExpenseList");

    if (!list) {
        return;
    }

    const monthly = getMonthlyExpenses()
        .slice()
        .reverse()
        .slice(0, 5);

    list.innerHTML = "";

    if (monthly.length === 0) {

        list.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty-state">
                        No expenses this month
                    </div>
                </td>
            </tr>
        `;

        return;

    }

    monthly.forEach(function(expense) {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${formatDate(expense.date)}</td>

            <td>
                ${escapeHTML(expense.description)}
            </td>

            <td>
                <span class="category">
                    ${escapeHTML(expense.category)}
                </span>
            </td>

            <td class="amount">
                ${formatMoney(expense.amount)}
            </td>
        `;

        list.appendChild(row);

    });

}

function displayDashboardReminders() {

    const list =
        document.getElementById("dashboardReminderList");

    if (!list) {
        return;
    }

    const pending = reminders
        .filter(function(reminder) {
            return !reminder.completed;
        })
        .slice()
        .sort(function(a, b) {
            return new Date(a.date + "T" + a.time) -
                   new Date(b.date + "T" + b.time);
        })
        .slice(0, 4);

    list.innerHTML = "";

    if (pending.length === 0) {

        list.innerHTML = `
            <div class="empty-state">
                No pending reminders
            </div>
        `;

        return;

    }

    pending.forEach(function(reminder) {

        const item = document.createElement("div");

        item.className = "reminder-item";

        item.innerHTML = `
            <div class="reminder-info">

                <div class="reminder-title">
                    ${escapeHTML(reminder.title)}
                </div>

                <span class="reminder-date">
                    ${formatDate(reminder.date)}
                    at
                    ${reminder.time}
                </span>

            </div>

            <span class="priority ${reminder.priority}">
                ${reminder.priority}
            </span>
        `;

        list.appendChild(item);

    });

}

function updateDashboardChart(monthly) {

    const canvas = document.getElementById("expenseChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    const categories = {};

    monthly.forEach(function(expense) {

        categories[expense.category] =
            (categories[expense.category] || 0) +
            expense.amount;

    });

    const labels = Object.keys(categories);
    const values = Object.values(categories);

    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(canvas, {

        type: "doughnut",

        data: {
            labels: labels,
            datasets: [{
                data: values
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }

    });

}

function updateBudgetPage() {

    const monthly = getMonthlyExpenses();

    const spent = monthly.reduce(function(sum, expense) {
        return sum + expense.amount;
    }, 0);

    const remaining = budget - spent;

    const percentage =
        budget > 0
        ? (spent / budget) * 100
        : 0;

    const elements = {

        amount: document.getElementById("budgetPageAmount"),
        spent: document.getElementById("budgetPageSpent"),
        remaining: document.getElementById("budgetPageRemaining"),
        percentage: document.getElementById("budgetPercentage"),
        largeAmount: document.getElementById("largeBudgetAmount"),
        largeSpent: document.getElementById("largeBudgetSpent"),
        progress: document.getElementById("largeBudgetProgress"),
        message: document.getElementById("largeBudgetMessage")

    };

    if (!elements.amount) {
        return;
    }

    elements.amount.textContent = formatMoney(budget);
    elements.spent.textContent = formatMoney(spent);
    elements.remaining.textContent = formatMoney(remaining);
    elements.percentage.textContent =
        Math.round(percentage) + "%";

    elements.largeAmount.textContent =
        formatMoney(budget);

    elements.largeSpent.textContent =
        formatMoney(spent);

    elements.progress.style.width =
        Math.min(percentage, 100) + "%";

    if (budget <= 0) {

        elements.message.textContent =
            "Set a monthly budget to begin tracking.";

    } else if (spent > budget) {

        elements.message.textContent =
            "You are " +
            formatMoney(spent - budget) +
            " over your budget.";

    } else {

        elements.message.textContent =
            formatMoney(remaining) +
            " remaining from your monthly budget.";

    }

    displayBudgetCategories(monthly, spent);

}

function displayBudgetCategories(monthly, totalSpent) {

    const container =
        document.getElementById("budgetCategoryList");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (monthly.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                No expenses this month
            </div>
        `;

        return;

    }

    const categories = {};

    monthly.forEach(function(expense) {

        categories[expense.category] =
            (categories[expense.category] || 0) +
            expense.amount;

    });

    Object.entries(categories).forEach(function([category, amount]) {

        const percentage =
            totalSpent > 0
            ? (amount / totalSpent) * 100
            : 0;

        const item = document.createElement("div");

        item.className = "budget-category";

        item.innerHTML = `
            <div class="budget-category-header">

                <span>
                    ${escapeHTML(category)}
                </span>

                <strong>
                    ${formatMoney(amount)}
                </strong>

            </div>

            <div class="category-progress">
                <div style="width:${percentage}%"></div>
            </div>
        `;

        container.appendChild(item);

    });

}

function openReminderModal() {

    const modal = document.getElementById("reminderModal");

    if (!modal) {
        return;
    }

    modal.classList.add("show");

    requestNotificationPermission();

}

function closeReminderModal() {

    const modal = document.getElementById("reminderModal");

    if (!modal) {
        return;
    }

    modal.classList.remove("show");

}

const reminderForm =
    document.getElementById("reminderForm");

if (reminderForm) {

    reminderForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const title =
            document.getElementById("reminderTitle").value.trim();

        const date =
            document.getElementById("reminderDate").value;

        const time =
            document.getElementById("reminderTime").value;

        const priority =
            document.getElementById("reminderPriority").value;

        if (!title || !date || !time) {

            alert("Please enter all reminder details");

            return;

        }

        reminders.push({

            id: Date.now(),

            title: title,

            date: date,

            time: time,

            priority: priority,

            completed: false,

            notified: false

        });

        saveData();

        this.reset();

        setDefaultDates();

        closeReminderModal();

        updateAllPages();

    });

}

function displayRemindersPage() {

    const list =
        document.getElementById("reminderPageList");

    if (!list) {
        return;
    }

    list.innerHTML = "";

    if (reminders.length === 0) {

        list.innerHTML = `
            <div class="empty-state">
                No reminders yet
            </div>
        `;

        return;

    }

    reminders
        .slice()
        .sort(function(a, b) {
            return new Date(a.date + "T" + a.time) -
                   new Date(b.date + "T" + b.time);
        })
        .forEach(function(reminder) {

            const item = document.createElement("div");

            item.className =
                "reminder-item" +
                (reminder.completed ? " completed" : "");

            item.innerHTML = `

                <input
                    type="checkbox"
                    class="reminder-check"
                    ${reminder.completed ? "checked" : ""}
                    onchange="toggleReminder(${reminder.id})"
                >

                <div class="reminder-info">

                    <div class="reminder-title">
                        ${escapeHTML(reminder.title)}
                    </div>

                    <span class="reminder-date">
                        Due ${formatDate(reminder.date)}
                        at ${reminder.time}
                    </span>

                </div>

                <span class="priority ${reminder.priority}">
                    ${reminder.priority}
                </span>

                <button
                    class="delete-btn"
                    onclick="deleteReminder(${reminder.id})"
                >
                    🗑
                </button>

            `;

            list.appendChild(item);

        });

}

function toggleReminder(id) {

    reminders = reminders.map(function(reminder) {

        if (reminder.id === id) {

            reminder.completed =
                !reminder.completed;

        }

        return reminder;

    });

    saveData();

    updateAllPages();

}

function deleteReminder(id) {

    if (!confirm("Delete this reminder?")) {
        return;
    }

    reminders = reminders.filter(function(reminder) {
        return reminder.id !== id;
    });

    saveData();

    updateAllPages();

}

function updateReminderStats() {

    const total = reminders.length;

    const pending =
        reminders.filter(function(reminder) {
            return !reminder.completed;
        }).length;

    const high =
        reminders.filter(function(reminder) {
            return (
                !reminder.completed &&
                reminder.priority === "High"
            );
        }).length;

    const completed =
        reminders.filter(function(reminder) {
            return reminder.completed;
        }).length;

    const totalElement =
        document.getElementById("totalReminders");

    const pendingElement =
        document.getElementById("pendingReminderCount");

    const highElement =
        document.getElementById("highPriorityCount");

    const completedElement =
        document.getElementById("completedReminderCount");

    if (totalElement) {
        totalElement.textContent = total;
    }

    if (pendingElement) {
        pendingElement.textContent = pending;
    }

    if (highElement) {
        highElement.textContent = high;
    }

    if (completedElement) {
        completedElement.textContent = completed;
    }

}

function requestNotificationPermission() {

    if (
        "Notification" in window &&
        Notification.permission === "default"
    ) {

        Notification.requestPermission();

    }

}

function checkReminders() {

    const now = new Date();

    let changed = false;

    reminders.forEach(function(reminder) {

        if (reminder.completed || reminder.notified) {
            return;
        }

        const reminderDate =
            new Date(reminder.date + "T" + reminder.time);

        if (now >= reminderDate) {

            if (
                "Notification" in window &&
                Notification.permission === "granted"
            ) {

                new Notification("MyFinance Reminder", {
                    body: reminder.title
                });

            } else {

                alert("Reminder: " + reminder.title);

            }

            reminder.notified = true;

            changed = true;

        }

    });

    if (changed) {
        saveData();
    }

}

setInterval(checkReminders, 30000);

function updateReports() {

    const monthly = getMonthlyExpenses();

    const totalExpense =
        monthly.reduce(function(sum, expense) {
            return sum + expense.amount;
        }, 0);

    const balance = income - totalExpense;

    const incomeElement =
        document.getElementById("reportIncome");

    if (!incomeElement) {
        return;
    }

    document.getElementById("reportIncome").textContent =
        formatMoney(income);

    document.getElementById("reportExpense").textContent =
        formatMoney(totalExpense);

    document.getElementById("reportBalance").textContent =
        formatMoney(balance);

    document.getElementById("reportTransactions").textContent =
        monthly.length;

    updateReportCategoryChart(monthly);
    updateIncomeExpenseChart(totalExpense);
    displayReportCategories(monthly, totalExpense);

}

function updateReportCategoryChart(monthly) {

    const canvas =
        document.getElementById("reportCategoryChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    const categories = {};

    monthly.forEach(function(expense) {

        categories[expense.category] =
            (categories[expense.category] || 0) +
            expense.amount;

    });

    if (reportCategoryChart) {
        reportCategoryChart.destroy();
    }

    reportCategoryChart = new Chart(canvas, {

        type: "doughnut",

        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories)
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }

    });

}

function updateIncomeExpenseChart(totalExpense) {

    const canvas =
        document.getElementById("incomeExpenseChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    if (incomeExpenseChart) {
        incomeExpenseChart.destroy();
    }

    incomeExpenseChart = new Chart(canvas, {

        type: "bar",

        data: {
            labels: ["Income", "Expenses"],

            datasets: [{
                label: "Amount",
                data: [income, totalExpense]
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            scales: {
                y: {
                    beginAtZero: true
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

function displayReportCategories(monthly, totalExpense) {

    const list =
        document.getElementById("reportCategoryList");

    if (!list) {
        return;
    }

    list.innerHTML = "";

    if (monthly.length === 0) {

        list.innerHTML = `
            <tr>
                <td colspan="3">
                    <div class="empty-state">
                        No expenses this month
                    </div>
                </td>
            </tr>
        `;

        return;

    }

    const categories = {};

    monthly.forEach(function(expense) {

        categories[expense.category] =
            (categories[expense.category] || 0) +
            expense.amount;

    });

    Object.entries(categories)
        .sort(function(a, b) {
            return b[1] - a[1];
        })
        .forEach(function([category, amount]) {

            const percentage =
                totalExpense > 0
                ? (amount / totalExpense) * 100
                : 0;

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>
                    <span class="category">
                        ${escapeHTML(category)}
                    </span>
                </td>

                <td class="amount">
                    ${formatMoney(amount)}
                </td>

                <td>
                    ${percentage.toFixed(1)}%
                </td>
            `;

            list.appendChild(row);

        });

}

const dashboardStatus =
    document.getElementById("dashboardBudgetStatus");

if (dashboardStatus) {

    setInterval(function() {

        const monthly = getMonthlyExpenses();

        const spent = monthly.reduce(function(sum, expense) {
            return sum + expense.amount;
        }, 0);

        if (budget <= 0) {

            dashboardStatus.innerHTML = `
                <div class="status-box">
                    <h3>No budget set</h3>
                    <p>
                        Set a monthly budget to monitor your
                        spending.
                    </p>
                </div>
            `;

            return;

        }

        const remaining = budget - spent;

        if (remaining < 0) {

            dashboardStatus.innerHTML = `
                <div class="status-box">
                    <h3>Budget exceeded</h3>
                    <p>
                        You have spent ${formatMoney(
                            Math.abs(remaining)
                        )} more than your budget.
                    </p>
                </div>
            `;

        } else {

            dashboardStatus.innerHTML = `
                <div class="status-box">
                    <h3>${formatMoney(remaining)} remaining</h3>
                    <p>
                        You have this amount available
                        in your monthly budget.
                    </p>
                </div>
            `;

        }

    }, 500);

}
