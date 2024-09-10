let expenses = [];
let recurringExpenses = [];
let pieChart;

function addExpense() {
  const category = document.getElementById("category").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const date = document.getElementById("date").value;

  if (category && amount && date) {
    fetch("/api/add_expense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, amount, date }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          expenses = data.expenses;
          updateExpenseList();
          updatePieChart();
          fetchBudgetStatus();
          fetchWeeklyExpenseAlarms();
          updateMonthlyCalendar();
        }
      })
      .catch((error) => console.error("Error:", error));
  }
}

function addRecurringExpense() {
  const category = document.getElementById("recurringCategory").value;
  const amount = parseFloat(document.getElementById("recurringAmount").value);
  const frequency = document.getElementById("recurringFrequency").value;
  const date = document.getElementById("recurringDate").value;

  if (category && amount && frequency && date) {
    fetch("/api/add_recurring_expense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, amount, frequency, date }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          recurringExpenses = data.recurring_expenses;
          updateRecurringExpenseList();
        }
      })
      .catch((error) => console.error("Error:", error));
  }
}

function updateBudgetLimit() {
  const category = document.getElementById("budgetCategory").value;
  const goodLimit = parseFloat(document.getElementById("goodLimit").value);
  const normalLimit = parseFloat(document.getElementById("normalLimit").value);

  if (category && goodLimit && normalLimit) {
    fetch("/api/update_budget_limit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, goodLimit, normalLimit }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          fetchBudgetStatus();
          fetchWeeklyExpenseAlarms();
        }
      })
      .catch((error) => console.error("Error:", error));
  }
}

function updateExpenseList() {
  const list = document.getElementById("expenseList");
  list.innerHTML = "";
  expenses.forEach((expense, index) => {
    list.innerHTML += `
        <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span>${expense.category}: $${expense.amount} on ${expense.date}</span>
            <div>
                <button onclick="editExpense(${index})" class="bg-blue-500 text-white px-2 py-1 rounded mr-2 hover:bg-blue-600">Edit</button>
                <button onclick="removeExpense(${index})" class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Remove</button>
            </div>
        </div>`;
  });
}

function updateRecurringExpenseList() {
  const list = document.getElementById("recurringExpenseList");
  list.innerHTML = "";
  recurringExpenses.forEach((expense, index) => {
    list.innerHTML += `
        <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span>${expense.category}: $${expense.amount} ${expense.frequency} starting ${expense.date}</span>
            <div>
                <button onclick="editRecurringExpense(${index})" class="bg-blue-500 text-white px-2 py-1 rounded mr-2 hover:bg-blue-600">Edit</button>
                <button onclick="removeRecurringExpense(${index})" class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Remove</button>
            </div>
        </div>`;
  });
}

function removeExpense(index) {
  fetch("/api/remove_expense", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        expenses = data.expenses;
        updateExpenseList();
        updatePieChart();
        fetchBudgetStatus();
      }
    })
    .catch((error) => console.error("Error:", error));
}

function removeRecurringExpense(index) {
  fetch("/api/remove_recurring_expense", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        recurringExpenses = data.recurring_expenses;
        updateRecurringExpenseList();
      }
    })
    .catch((error) => console.error("Error:", error));
}

function editExpense(index) {
  const expense = expenses[index];
  document.getElementById("category").value = expense.category;
  document.getElementById("amount").value = expense.amount;
  document.getElementById("date").value = expense.date;

  const addButton = document.getElementById("addExpenseBtn");
  addButton.textContent = "Update Expense";
  addButton.onclick = function () {
    updateExpense(index);
  };
}

function updateExpense(index) {
  const category = document.getElementById("category").value;
  const amount = document.getElementById("amount").value;
  const date = document.getElementById("date").value;

  fetch("/api/edit_expense", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index, category, amount, date }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        expenses = data.expenses;
        updateExpenseList();
        updatePieChart();
        fetchBudgetStatus();

        document.getElementById("category").value = "";
        document.getElementById("amount").value = "";
        document.getElementById("date").value = "";
        const addButton = document.getElementById("addExpenseBtn");
        addButton.textContent = "Add Expense";
        addButton.onclick = addExpense;
      }
    })
    .catch((error) => console.error("Error:", error));
}

function updatePieChart() {
  const ctx = document.getElementById("pieChart").getContext("2d");
  const data = {};
  expenses.forEach((expense) => {
    if (data[expense.category]) {
      data[expense.category] += expense.amount;
    } else {
      data[expense.category] = expense.amount;
    }
  });

  if (pieChart) {
    pieChart.destroy();
  }

  pieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(data),
      datasets: [
        {
          data: Object.values(data),
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
    },
  });
}

function fetchExpenses() {
  fetch("/api/get_expenses")
    .then((response) => response.json())
    .then((data) => {
      expenses = data.expenses;
      updateExpenseList();
      updatePieChart();
    });
}

function fetchRecurringExpenses() {
  fetch("/api/get_recurring_expenses")
    .then((response) => response.json())
    .then((data) => {
      recurringExpenses = data.recurring_expenses;
      updateRecurringExpenseList();
    });
}

function fetchBudgetStatus() {
  fetch("/api/get_budget_status")
    .then((response) => response.json())
    .then((data) => {
      const status = document.getElementById("budgetStatus");
      status.innerHTML = "";
      for (const [category, limits] of Object.entries(data)) {
        const totalSpent = expenses
          .filter((e) => e.category === category)
          .reduce((sum, e) => sum + e.amount, 0);
        let statusClass = "bg-green-100 border-green-500";
        if (totalSpent > limits.normal) {
          statusClass = "bg-red-100 border-red-500";
        } else if (totalSpent > limits.good) {
          statusClass = "bg-yellow-100 border-yellow-500";
        }
        status.innerHTML += `
                <div class="p-2 rounded ${statusClass}">
                    <strong>${category}</strong><br>
                    Spent: $${totalSpent.toFixed(2)}<br>
                    Good Limit: $${limits.good}<br>
                    Normal Limit: $${limits.normal}
                </div>
            `;
      }
    });
}

function sendWeeklyReminder() {
  const email = document.getElementById("emailInput").value;
  if (email) {
    fetch("/api/send_reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          alert("Reminder sent successfully!");
        } else {
          alert("Failed to send reminder. Please try again.");
        }
      })
      .catch((error) => console.error("Error:", error));
  } else {
    alert("Please enter an email address.");
  }
}

function fetchWeeklyExpenseAlarms() {
  fetch("/api/get_weekly_expense_alarm")
    .then((response) => response.json())
    .then((data) => {
      const alarmsDiv = document.getElementById("alarms");
      alarmsDiv.innerHTML = "";
      data.alarms.sort().forEach((alarm) => {
        const p = document.createElement("p");
        p.textContent = alarm;
        p.className =
          "text-sm p-2 bg-yellow-100 border border-yellow-500 rounded";
        alarmsDiv.appendChild(p);
      });
    })
    .catch((error) => console.error("Error:", error));
}

function updateMonthlyCalendar() {
  const monthPicker = document.getElementById("monthPicker");
  let [month, year] = monthPicker.value.split(" ");

  // If monthPicker value is empty, use current date
  if (!month || !year) {
    const currentDate = new Date();
    month = currentDate.toLocaleString("default", { month: "long" });
    year = currentDate.getFullYear();
  }

  const monthNumber =
    new Date(Date.parse(month + " 1, " + year)).getMonth() + 1;

  fetch(`/api/get_monthly_calendar?year=${year}&month=${monthNumber}`)
    .then((response) => response.json())
    .then((data) => {
      const calendarDiv = document.getElementById("calendar");
      calendarDiv.innerHTML = "";

      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      dayNames.forEach((day) => {
        const dayDiv = document.createElement("div");
        dayDiv.className = "text-center font-bold";
        dayDiv.textContent = day;
        calendarDiv.appendChild(dayDiv);
      });

      data.calendar.forEach((week) => {
        week.forEach((day) => {
          const dayDiv = document.createElement("div");
          dayDiv.className = "h-10 border p-1 text-sm";
          if (day !== 0) {
            dayDiv.textContent = day;
            if (data.expenses[day]) {
              dayDiv.classList.add("bg-indigo-100");
              const total = data.expenses[day].reduce(
                (sum, exp) => sum + exp.amount,
                0,
              );
              const totalSpan = document.createElement("span");
              totalSpan.className = "block text-indigo-600 font-bold";
              totalSpan.textContent = `$${total.toFixed(2)}`;
              dayDiv.appendChild(totalSpan);
              dayDiv.onclick = () => showDayExpenses(data.expenses[day]);
            }
          }
          calendarDiv.appendChild(dayDiv);
        });
      });
    })
    .catch((error) => console.error("Error:", error));
}

function showDayExpenses(expenses) {
  alert(JSON.stringify(expenses, null, 2));
}

function clearAllData() {
  if (
    confirm(
      "Are you sure you want to clear all expense data? This action cannot be undone.",
    )
  ) {
    fetch("/api/clear_data", { method: "POST" })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          fetchExpenses();
          fetchRecurringExpenses();
          fetchBudgetStatus();
          fetchWeeklyExpenseAlarms();
          updateMonthlyCalendar();
        }
      })
      .catch((error) => console.error("Error:", error));
  }
}

// Initialize Flatpickr for date inputs
flatpickr("#date", { dateFormat: "Y-m-d", defaultDate: "today" });
flatpickr("#recurringDate", { dateFormat: "Y-m-d", defaultDate: "today" });
flatpickr("#monthPicker", {
  plugins: [
    new monthSelectPlugin({
      shorthand: true,
      dateFormat: "F Y",
      altFormat: "F Y",
      theme: "light",
    }),
  ],
  onChange: function (selectedDates, dateStr) {
    updateMonthlyCalendar();
  },
});

// Initial render
document.addEventListener("DOMContentLoaded", function () {
  fetchExpenses();
  fetchRecurringExpenses();
  fetchBudgetStatus();
  fetchWeeklyExpenseAlarms();
  updateMonthlyCalendar();
});
