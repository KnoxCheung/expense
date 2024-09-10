const EXPENSE_CATEGORIES = [
  {
    name: "Indoor Cooking",
    key: "indoorCooking",
    budget: { good: 12500, normal: 15000 },
  },
  {
    name: "Outdoor Dinners",
    key: "outdoorDinners",
    budget: { good: 3250, normal: 3750 },
  },
  {
    name: "Transport Fees",
    key: "transportFees",
    budget: { good: 3500, normal: 4000 },
  },
  {
    name: "Entertainment",
    key: "entertainment",
    budget: { good: 3500, normal: 4000 },
  },
  { name: "Education", key: "education", budget: { good: 375, normal: 500 } },
  { name: "Shopping", key: "shopping", budget: { good: 5000, normal: 6250 } },
  {
    name: "Medical Fees",
    key: "medicalFees",
    budget: { good: 2000, normal: 2500 },
  },
];

let expenses = [];
let pieChart;

async function fetchExpenses() {
  try {
    const response = await fetch("/api/expenses");
    expenses = await response.json();
    updateExpenseList();
    updatePieChart();
    updateBudgetStatus();
    updateWeeklyReminder();
  } catch (error) {
    console.error("Error fetching expenses:", error);
    showNotification("Error fetching expenses. Please try again.", "error");
  }
}

async function addOrUpdateExpense(event) {
  event.preventDefault();
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const editIndex = document.getElementById("editIndex").value;

  const expenseData = { category, date, amount };

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
      showNotification("Expense saved successfully!", "success");
    } else {
      console.error("Error adding/updating expense:", await response.text());
      showNotification("Error saving expense. Please try again.", "error");
    }
  } catch (error) {
    console.error("Error adding/updating expense:", error);
    showNotification("Error saving expense. Please try again.", "error");
  }
}

async function deleteExpense(index) {
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
  }
}

function editExpense(index) {
  const expense = expenses[index];
  document.getElementById("category").value = expense.category;
  document.getElementById("date").value = expense.date;
  document.getElementById("amount").value = expense.amount;
  document.getElementById("editIndex").value = index;
  document.getElementById("submitBtn").textContent = "Update Expense";
}

function updateExpenseList() {
  const expenseList = document.getElementById("expenseList");
  expenseList.innerHTML = "";

  const groupedExpenses = expenses.reduce((groups, expense) => {
    const expenseDate = new Date(expense.date);
    const weekStart = new Date(
      expenseDate.getFullYear(),
      expenseDate.getMonth(),
      expenseDate.getDate() - expenseDate.getDay(),
    );
    const weekKey = `${weekStart.getFullYear()}-W${String(weekStart.getWeek()).padStart(2, "0")} (${weekStart.getMonth() + 1}-${String(weekStart.getDate()).padStart(2, "0")})`;
    if (!groups[weekKey]) {
      groups[weekKey] = [];
    }
    groups[weekKey].push(expense);
    return groups;
  }, {});

  const sortedWeeks = Object.keys(groupedExpenses).sort((a, b) =>
    b.localeCompare(a),
  );

  sortedWeeks.forEach((weekKey) => {
    const weekBlock = document.createElement("div");
    weekBlock.className = "mb-4";
    weekBlock.innerHTML = `<h3 class="font-semibold text-lg mb-2">Week of ${weekKey}</h3>`;

    groupedExpenses[weekKey].forEach((expense, index) => {
      const categoryName = EXPENSE_CATEGORIES.find(
        (cat) => cat.key === expense.category,
      ).name;
      const expenseItem = document.createElement("div");
      expenseItem.className =
        "flex justify-between items-center bg-gray-100 p-2 rounded mb-2";
      expenseItem.innerHTML = `
                <span>${categoryName} - ${expense.date} - $${expense.amount.toFixed(2)}</span>
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

async function updatePieChart() {
  try {
    const response = await fetch("/api/budget_status");
    const budgetStatus = await response.json();

    const data = EXPENSE_CATEGORIES.map((category) => ({
      label: category.name,
      value: budgetStatus.total[category.key].amount || 0,
    }));

    const totalAmount = data.reduce((sum, item) => sum + item.value, 0);

    if (pieChart) {
      pieChart.destroy();
    }

    const ctx = document.getElementById("pieChart").getContext("2d");
    pieChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            data: data.map((d) => d.value),
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
              "#FF9F40",
              "#FF6384",
            ],
          },
        ],
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
              },
            },
          },
        },
      },
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
    const status = await response.json();

    const weeklyStatusDiv = document.createElement("div");
    weeklyStatusDiv.className = "mb-8";
    weeklyStatusDiv.innerHTML =
      "<h3 class='text-xl font-semibold mb-4'>Weekly Budget Status</h3>";

    Object.entries(status.weekly).forEach(([week, categories]) => {
      const weekDiv = document.createElement("div");
      weekDiv.className = "mb-4 p-4 bg-white rounded shadow";
      weekDiv.innerHTML = `<h4 class="font-bold text-lg mb-2">Week ${week}</h4>`;

      EXPENSE_CATEGORIES.forEach((category) => {
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
    totalStatusDiv.innerHTML =
      "<h3 class='text-xl font-semibold mb-4'>Total Budget Status</h3>";

    EXPENSE_CATEGORIES.forEach((category) => {
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
    showNotification(
      "Error updating budget status. Please try again.",
      "error",
    );
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
    const status = await response.json();

    const currentWeek = Object.keys(status.weekly).sort().pop();
    const currentWeekExpenses = status.weekly[currentWeek];

    const totalWeeklySpent = Object.values(currentWeekExpenses).reduce(
      (sum, amount) => sum + amount,
      0,
    );
    const totalWeeklyBudget = EXPENSE_CATEGORIES.reduce(
      (sum, category) => sum + category.budget.normal,
      0,
    );

    let message, className;
    if (totalWeeklySpent < totalWeeklyBudget * 0.8) {
      message = `Great job! You're saving money this week. Total spent: $${totalWeeklySpent.toFixed(2)}`;
      className = "text-green-600";
    } else if (totalWeeklySpent <= totalWeeklyBudget) {
      message = `You're on track with your budget this week. Total spent: $${totalWeeklySpent.toFixed(2)}`;
      className = "text-yellow-600";
    } else {
      message = `Warning: You're over budget this week. Total spent: $${totalWeeklySpent.toFixed(2)}`;
      className = "text-red-600";
    }

    weeklyReminder.innerHTML = `<p class="${className} text-lg font-semibold">${message}</p>`;
  } catch (error) {
    console.error("Error updating weekly reminder:", error);
    showNotification(
      "Error updating weekly reminder. Please try again.",
      "error",
    );
  }
}

async function clearAllData() {
  if (
    confirm(
      "Are you sure you want to clear all expense data? This action cannot be undone.",
    )
  ) {
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

// Helper function to get week number
Date.prototype.getWeek = function () {
  var d = new Date(
    Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()),
  );
  var dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

document
  .getElementById("expenseForm")
  .addEventListener("submit", addOrUpdateExpense);
document.getElementById("clearAllData").addEventListener("click", clearAllData);

// Category icon functionality
const categoryIcons = document.querySelectorAll("[data-category]");
const categorySelect = document.getElementById("category");

categoryIcons.forEach((icon) => {
  icon.addEventListener("click", () => {
    categorySelect.value = icon.dataset.category;
    categoryIcons.forEach((i) => i.classList.remove("text-green-500"));
    icon.classList.add("text-green-500");
  });
});

// Initialize Flatpickr
flatpickr("#date", {
  dateFormat: "Y-m-d",
  defaultDate: "today",
});

// Initial data fetch
fetchExpenses();
