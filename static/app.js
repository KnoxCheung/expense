let EXPENSE_CATEGORIES = [];
let expenses = [];
let pieChart;

async function fetchExpenses() {
    showLoadingIndicator();
    try {
        console.log("Fetching expenses...");
        const expensesResponse = await fetch("/api/expenses");
        console.log("Expenses response:", expensesResponse);
        if (!expensesResponse.ok) {
            throw new Error(`HTTP error! status: ${expensesResponse.status}`);
        }
        const expensesData = await expensesResponse.json();
        console.log("Expenses data:", expensesData);

        console.log("Fetching budgets...");
        const budgetsResponse = await fetch("/api/budgets");
        console.log("Budgets response:", budgetsResponse);
        if (!budgetsResponse.ok) {
            throw new Error(`HTTP error! status: ${budgetsResponse.status}`);
        }
        const budgetsData = await budgetsResponse.json();
        console.log("Budgets data:", budgetsData);

        expenses = expensesData;
        EXPENSE_CATEGORIES = Object.keys(budgetsData).map((key) => ({
            key: key,
            name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(),
            budget: budgetsData[key],
        }));

        updateExpenseList();
        updatePieChart();
        updateBudgetStatus();
        updateWeeklyReminder();
        displayBudgets(EXPENSE_CATEGORIES);
        updateExpenseSummary();
    } catch (error) {
        console.error("Error fetching data:", error);
        showNotification(`Error fetching data: ${error.message}. Check the console for more details.`, "error");
    } finally {
        hideLoadingIndicator();
    }
}

async function addOrUpdateExpense(event) {
    event.preventDefault();
    showLoadingIndicator();
    const category = document.getElementById("category").value;
    const date = document.getElementById("date").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const isRecurring = document.getElementById("isRecurring").checked;
    const frequency = isRecurring ? document.getElementById("frequency").value : null;
    const editIndex = document.getElementById("editIndex").value;

    const expenseData = { category, date, amount, isRecurring, frequency };

    try {
        let response;
        if (editIndex === "") {
            response = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(expenseData),
            });
        } else {
            response = await fetch(`/api/expenses/${editIndex}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(expenseData),
            });
        }

        if (response.ok) {
            await fetchExpenses();
            document.getElementById("expenseForm").reset();
            document.getElementById("editIndex").value = "";
            document.getElementById("submitBtn").textContent = "Add Expense";
            document.getElementById("frequency").classList.add("hidden");
            showNotification("Expense saved successfully!", "success");
        } else {
            console.error("Error adding/updating expense:", await response.text());
            showNotification("Error saving expense. Please try again.", "error");
        }
    } catch (error) {
        console.error("Error adding/updating expense:", error);
        showNotification("Error saving expense. Please try again.", "error");
    } finally {
        hideLoadingIndicator();
    }
}

async function deleteExpense(index) {
    showLoadingIndicator();
    try {
        const response = await fetch(`/api/expenses/${index}`, {
            method: "DELETE",
        });
        if (response.ok) {
            await fetchExpenses();
            showNotification("Expense deleted successfully!", "success");
        } else {
            console.error("Error deleting expense:", await response.text());
            showNotification("Error deleting expense. Please try again.", "error");
        }
    } catch (error) {
        console.error("Error deleting expense:", error);
        showNotification("Error deleting expense. Please try again.", "error");
    } finally {
        hideLoadingIndicator();
    }
}

function editExpense(index) {
    const expense = expenses[index];
    document.getElementById("category").value = expense.category;
    document.getElementById("date").value = expense.date;
    document.getElementById("amount").value = expense.amount;
    document.getElementById("isRecurring").checked = expense.isRecurring;
    if (expense.isRecurring) {
        document.getElementById("frequency").value = expense.frequency;
        document.getElementById("frequency").classList.remove("hidden");
    } else {
        document.getElementById("frequency").classList.add("hidden");
    }
    document.getElementById("editIndex").value = index;
    document.getElementById("submitBtn").textContent = "Update Expense";
}

function updateExpenseList() {
    const expenseList = document.getElementById("expenseList");
    expenseList.innerHTML = "";

    const groupedExpenses = expenses.reduce((groups, expense) => {
        const weekKey = getWeekKey(new Date(expense.date));
        if (!groups[weekKey]) {
            groups[weekKey] = [];
        }
        groups[weekKey].push(expense);
        return groups;
    }, {});

    const sortedWeeks = Object.keys(groupedExpenses).sort((a, b) => b.localeCompare(a));

    sortedWeeks.forEach((weekKey) => {
        const weekBlock = document.createElement("div");
        weekBlock.className = "mb-4";
        const [year, week] = weekKey.split('-W');
        const weekStart = getDateOfISOWeek(parseInt(week), parseInt(year));
        weekBlock.innerHTML = `<h3 class="font-semibold text-lg mb-2">Week of ${weekKey} (${weekStart.getMonth() + 1}-${weekStart.getDate()})</h3>`;

        groupedExpenses[weekKey].forEach((expense) => {
            const categoryName = EXPENSE_CATEGORIES.find(cat => cat.key === expense.category).name;
            const expenseItem = document.createElement("div");
            expenseItem.className = "flex justify-between items-center bg-gray-100 p-2 rounded mb-2";
            expenseItem.innerHTML = `
                <span>${categoryName} - ${expense.date} - $${expense.amount.toFixed(2)}${expense.isRecurring ? ` (${expense.frequency})` : ""}</span>
                <div>
                    <button onclick="editExpense(${expenses.indexOf(expense)})" class="bg-blue-500 text-white px-2 py-1 rounded mr-2 hover:bg-blue-600">Edit</button>
                    <button onclick="deleteExpense(${expenses.indexOf(expense)})" class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Delete</button>
                </div>
            `;
            weekBlock.appendChild(expenseItem);
        });

        expenseList.appendChild(weekBlock);
    });
}

function getWeekKey(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() - d.getUTCDay());
    const year = d.getUTCFullYear();
    const week = getWeekNumber(d);
    return `${year}-W${week.toString().padStart(2, '0')}`;
}

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

function getDateOfISOWeek(w, y) {
    var simple = new Date(y, 0, 1 + (w - 1) * 7);
    var dow = simple.getDay();
    var ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay());
    else
        ISOweekStart.setDate(simple.getDate() + 7 - simple.getDay());
    return ISOweekStart;
}

async function updatePieChart() {
    try {
        const response = await fetch("/api/budget_status");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const budgetStatus = await response.json();
        console.log("Budget status for pie chart:", budgetStatus);

        const data = EXPENSE_CATEGORIES.map(category => ({
            label: category.name,
            value: budgetStatus.total[category.key].amount || 0
        }));

        const totalAmount = data.reduce((sum, item) => sum + item.value, 0);

        if (pieChart) {
            pieChart.destroy();
        }

        const ctx = document.getElementById("pieChart").getContext("2d");
        pieChart = new Chart(ctx, {
            type: "pie",
            data: {
                labels: data.map(d => d.label),
                datasets: [{
                    data: data.map(d => d.value),
                    backgroundColor: [
                        "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#FF6384"
                    ],
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || "";
                                const value = context.parsed || 0;
                                const percentage = ((value / totalAmount) * 100).toFixed(2);
                                return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error updating pie chart:", error);
        showNotification("Error updating pie chart. Please try again.", "error");
    }
}

async function updateBudgetStatus() {
    const budgetStatus = document.getElementById("budgetStatus");
    budgetStatus.innerHTML = "";

    try {
        const response = await fetch("/api/budget_status");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const status = await response.json();
        console.log("Budget status:", status);

        const weeklyStatusDiv = document.createElement("div");
        weeklyStatusDiv.className = "mb-8";
        weeklyStatusDiv.innerHTML = "<h3 class='text-xl font-semibold mb-4'>Weekly Budget Status</h3>";

        Object.entries(status.weekly).forEach(([week, categories]) => {
            const weekDiv = document.createElement("div");
            weekDiv.className = "mb-4 p-4 bg-white rounded shadow";
            weekDiv.innerHTML = `<h4 class="font-bold text-lg mb-2">Week ${week}</h4>`;

            EXPENSE_CATEGORIES.forEach(category => {
                const amount = categories[category.key] || 0;
                const weeklyStatus = getStatus(amount, category.budget);
                const statusClass = getStatusClass(weeklyStatus);

                weekDiv.innerHTML += `
                    <div class="flex justify-between items-center mb-2">
                        <span>${category.name}</span>
                        <span class="${statusClass} px-2 py-1 rounded">${weeklyStatus} - $${amount.toFixed(2)}</span>
                    </div>
                `;
            });

            weeklyStatusDiv.appendChild(weekDiv);
        });

        budgetStatus.appendChild(weeklyStatusDiv);

        const totalStatusDiv = document.createElement("div");
        totalStatusDiv.className = "mb-4";
        totalStatusDiv.innerHTML = "<h3 class='text-xl font-semibold mb-4'>Monthly Budget Status</h3>";

        EXPENSE_CATEGORIES.forEach(category => {
            const { amount, status: totalStatus } = status.total[category.key];
            const statusClass = getStatusClass(totalStatus);

            totalStatusDiv.innerHTML += `
                <div class="flex justify-between items-center mb-2">
                    <span>${category.name}</span>
                    <span class="${statusClass} px-2 py-1 rounded">${totalStatus} - $${amount.toFixed(2)}</span>
                </div>
            `;
        });

        budgetStatus.appendChild(totalStatusDiv);
    } catch (error) {
        console.error("Error updating budget status:", error);
        showNotification("Error updating budget status. Please try again.", "error");
    }
}

function getStatus(amount, budget) {
    if (amount < budget.good) return "Good";
    if (amount < budget.normal) return "Normal";
    return "Over Budget";
}

function getStatusClass(status) {
    switch (status) {
        case "Good":
            return "bg-green-100 text-green-800";
        case "Normal":
            return "bg-yellow-100 text-yellow-800";
        case "Over Budget":
            return "bg-red-100 text-red-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
}

async function updateWeeklyReminder() {
    const weeklyReminder = document.getElementById("weeklyReminder");

    try {
        const response = await fetch("/api/budget_status");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const status = await response.json();
        console.log("Weekly reminder status:", status);

        const currentWeekExpenses = status.current_week_expenses;
        console.log("Current week expenses:", currentWeekExpenses);

        const totalWeeklyBudget = EXPENSE_CATEGORIES.reduce((sum, category) => sum + category.budget.normal, 0);
        console.log("Total weekly budget:", totalWeeklyBudget);

        let message, className;
        if (currentWeekExpenses < totalWeeklyBudget * 0.8) {
            message = `Great job! You're saving money this week. Total spent: $${currentWeekExpenses.toFixed(2)}`;
            className = "text-green-600";
        } else if (currentWeekExpenses <= totalWeeklyBudget) {
            message = `You're on track with your budget this week. Total spent: $${currentWeekExpenses.toFixed(2)}`;
            className = "text-yellow-600";
        } else {
            message = `Warning: You're over budget this week. Total spent: $${currentWeekExpenses.toFixed(2)}`;
            className = "text-red-600";
        }

        weeklyReminder.innerHTML = `<p class="${className} text-lg font-semibold">${message}</p>`;
    } catch (error) {
        console.error("Error updating weekly reminder:", error);
        showNotification("Error updating weekly reminder. Please try again.", "error");
    }
}

async function clearAllData() {
    if (confirm("Are you sure you want to clear all expense data? This action cannot be undone.")) {
        showLoadingIndicator();
        try {
            const response = await fetch("/api/expenses", { method: "DELETE" });
            if (response.ok) {
                await fetchExpenses();
                showNotification("All data cleared successfully!", "success");
            } else {
                console.error("Error clearing all data:", await response.text());
                showNotification("Error clearing data. Please try again.", "error");
            }
        } catch (error) {
            console.error("Error clearing all data:", error);
            showNotification("Error clearing data. Please try again.", "error");
        } finally {
            hideLoadingIndicator();
        }
    }
}

function showNotification(message, type) {
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.className = `fixed bottom-4 right-4 p-4 rounded-lg text-white ${type === "success" ? "bg-green-500" : "bg-red-500"}`;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function displayBudgets(budgets) {
    const budgetContainer = document.getElementById("budgetContainer");
    budgetContainer.innerHTML = "";

    budgets.forEach(category => {
        const categoryDiv = document.createElement("div");
        categoryDiv.className = "mb-4";
        categoryDiv.innerHTML = `
            <h4 class="font-semibold">${category.name}</h4>
            <div class="flex space-x-2">
                <input type="number" id="${category.key}-good" value="${category.budget.good}" class="w-1/2 p-1 border rounded" placeholder="Good">
                <input type="number" id="${category.key}-normal" value="${category.budget.normal}" class="w-1/2 p-1 border rounded" placeholder="Normal">
            </div>
        `;
        budgetContainer.appendChild(categoryDiv);
    });
}

async function updateBudgets() {
    showLoadingIndicator();
    const updatedBudgets = {};
    EXPENSE_CATEGORIES.forEach(category => {
        const goodInput = document.getElementById(`${category.key}-good`);
        const normalInput = document.getElementById(`${category.key}-normal`);
        updatedBudgets[category.key] = {
            good: parseFloat(goodInput.value),
            normal: parseFloat(normalInput.value)
        };
    });

    try {
        const response = await fetch("/api/budgets", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedBudgets),
        });

        if (response.ok) {
            showNotification("Budgets updated successfully!", "success");
            await fetchExpenses(); // Refresh expense data to reflect new budgets
        } else {
            console.error("Error updating budgets:", await response.text());
            showNotification("Error updating budgets. Please try again.", "error");
        }
    } catch (error) {
        console.error("Error updating budgets:", error);
        showNotification("Error updating budgets. Please try again.", "error");
    } finally {
        hideLoadingIndicator();
    }
}

async function updateExpenseSummary() {
    try {
        const response = await fetch("/api/expense_summary/30");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const summary = await response.json();
        console.log("Expense summary:", summary);

        // Here you can add code to display the summary data
        // For example, you could create a line chart showing daily totals
    } catch (error) {
        console.error("Error fetching expense summary:", error);
        showNotification("Error fetching expense summary. Please try again.", "error");
    }
}

function showLoadingIndicator() {
    const loadingIndicator = document.createElement("div");
    loadingIndicator.id = "loadingIndicator";
    loadingIndicator.className = "fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50";
    loadingIndicator.innerHTML = '<div class="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>';
    document.body.appendChild(loadingIndicator);
}

function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById("loadingIndicator");
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

document.getElementById("expenseForm").addEventListener("submit", addOrUpdateExpense);
document.getElementById("clearAllData").addEventListener("click", clearAllData);
document.getElementById("updateBudgetsBtn").addEventListener("click", updateBudgets);

// Category icon functionality
const categoryIcons = document.querySelectorAll("[data-category]");
const categorySelect = document.getElementById("category");

categoryIcons.forEach(icon => {
    icon.addEventListener("click", () => {
        categorySelect.value = icon.dataset.category;
        categoryIcons.forEach(i => i.classList.remove("text-green-500"));
        icon.classList.add("text-green-500");
    });
});

// Add event listener for recurring checkbox
document.getElementById("isRecurring").addEventListener("change", function () {
    const frequencySelect = document.getElementById("frequency");
    if (this.checked) {
        frequencySelect.classList.remove("hidden");
    } else {
        frequencySelect.classList.add("hidden");
    }
});

// Initialize Flatpickr
flatpickr("#date", {
    dateFormat: "Y-m-d",
    defaultDate: "today",
});

// Initial data fetch
fetchExpenses();