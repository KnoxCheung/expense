# Weekly and Monthly Expense Tracker

This is a web-based application for tracking personal expenses on a weekly and monthly basis. It allows users to add, edit, and delete expenses, set budgets for different categories, and view their spending patterns through visualizations and summaries.

## Features

- Add, edit, and delete expenses
- Categorize expenses (e.g., Indoor Cooking, Outdoor Dinners, Transport Fees)
- Support for one-time and recurring expenses (weekly or monthly)
- Set and update budgets for each expense category
- View expenses grouped by week
- Pie chart visualization of expenses by category
- Weekly and monthly budget status reports
- Weekly spending reminder
- 30-day expense summary

## Technologies Used

- Backend: Python with Flask
- Frontend: HTML, CSS (Tailwind CSS), JavaScript
- Charts: Chart.js
- Date Picker: Flatpickr

## Setup and Installation

1. Clone the repository:
   ```
   git clone https://github.com/KnoxCheung/expense.git
   cd expense
   ```

2. Set up a virtual environment (optional but recommended):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   ```

3. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

4. Run the Flask application:
   ```
   python app.py
   ```

5. Open a web browser and navigate to `http://localhost:5000` to use the application.

## File Structure

- `app.py`: The main Flask application (backend)
- `static/app.js`: Frontend JavaScript code
- `templates/index.html`: HTML template for the single-page application
- `expenses.json`: JSON file to store expense data
- `budgets.json`: JSON file to store budget data

## Usage

1. Add an expense by filling out the form and clicking "Add Expense"
2. Edit an expense by clicking the "Edit" button next to an existing expense
3. Delete an expense by clicking the "Delete" button next to an existing expense
4. Update category budgets in the "Budget Settings" section
5. View your expense summary in the pie chart
6. Check your budget status in the "Weekly Budget Status" and "Monthly Budget Status" sections
7. The "Weekly Reminder" will give you a quick overview of your spending for the current week

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

If all else fails, try manually installing each dependency:
   ```
   pip install Flask==2.0.1
   pip install Werkzeug==2.0.1
   pip install python-dateutil==2.8.2
