from flask import Flask, render_template, request, jsonify
from datetime import datetime, timedelta, date
import calendar
import json
import os
import logging
from abc import ABC, abstractmethod

logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)

class Expense(ABC):
    def __init__(self, category, date, amount):
        self.category = category
        self.date = date
        self.amount = float(amount)

    @abstractmethod
    def to_dict(self):
        pass

class SingleExpense(Expense):
    def __init__(self, category, date, amount):
        super().__init__(category, date, amount)

    def to_dict(self):
        return {
            "category": self.category,
            "date": self.date,
            "amount": self.amount,
            "isRecurring": False
        }

class RecurringExpense(Expense):
    def __init__(self, category, date, amount, frequency):
        super().__init__(category, date, amount)
        self.frequency = frequency

    def to_dict(self):
        return {
            "category": self.category,
            "date": self.date,
            "amount": self.amount,
            "isRecurring": True,
            "frequency": self.frequency
        }

    def get_occurrences(self, start_date, end_date):
        occurrences = []
        current_date = datetime.strptime(self.date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')

        while current_date <= end:
            if current_date >= datetime.strptime(start_date, '%Y-%m-%d'):
                occurrences.append(current_date.strftime('%Y-%m-%d'))

            if self.frequency == 'weekly':
                current_date += timedelta(days=7)
            elif self.frequency == 'monthly':
                current_date = add_months(current_date, 1)

        return occurrences

def add_months(date, months):
    month = date.month - 1 + months
    year = date.year + month // 12
    month = month % 12 + 1
    day = min(date.day, calendar.monthrange(year, month)[1])
    return date.replace(year=year, month=month, day=day)

class ExpenseManager:
    def __init__(self, expense_file, budget_file):
        self.expense_file = expense_file
        self.budget_file = budget_file

    def load_expenses(self):
        try:
            with open(self.expense_file, 'r') as f:
                expenses_data = json.load(f)
            return [
                RecurringExpense(
                    category=exp['category'],
                    date=exp['date'],
                    amount=exp['amount'],
                    frequency=exp['frequency']
                ) if exp.get('isRecurring') else
                SingleExpense(
                    category=exp['category'],
                    date=exp['date'],
                    amount=exp['amount']
                )
                for exp in expenses_data
            ]
        except FileNotFoundError:
            return []
        except json.JSONDecodeError as e:
            logging.error(f"Error decoding JSON from {self.expense_file}: {e}")
            return []

    def save_expenses(self, expenses):
        with open(self.expense_file, 'w') as f:
            json.dump([exp.to_dict() for exp in expenses], f)

    def load_budgets(self):
        try:
            with open(self.budget_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {
                "indoorCooking": {"good": 500, "normal": 1000},
                "outdoorDinners": {"good": 500, "normal": 1000},
                "transportFees": {"good": 500, "normal": 1000},
                "entertainment": {"good": 500, "normal": 1000},
                "education": {"good": 500, "normal": 1000},
                "shopping": {"good": 500, "normal": 1000},
                "medicalFees": {"good": 500, "normal": 1000}
            }

    def save_budgets(self, budgets):
        with open(self.budget_file, 'w') as f:
            json.dump(budgets, f)

    def get_budget_status(self):
        expenses = self.load_expenses()
        budgets = self.load_budgets()

        now = datetime.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month_start = (current_month_start + timedelta(days=32)).replace(day=1)

        weekly_status = {}
        monthly_status = {category: {"amount": 0, "status": "Good"} for category in budgets}

        for expense in expenses:
            if isinstance(expense, RecurringExpense):
                occurrences = expense.get_occurrences(current_month_start.strftime('%Y-%m-%d'), next_month_start.strftime('%Y-%m-%d'))
                for date in occurrences:
                    self.update_status(weekly_status, monthly_status, expense, date, budgets)
            else:
                self.update_status(weekly_status, monthly_status, expense, expense.date, budgets)

        for category, budget in budgets.items():
            monthly_amount = monthly_status[category]['amount']
            if monthly_amount >= budget['normal'] * 4:
                monthly_status[category]['status'] = "Over Budget"
            elif monthly_amount >= budget['good'] * 4:
                monthly_status[category]['status'] = "Normal"

        return {"weekly": weekly_status, "total": monthly_status}

    def get_week_key(self, expense_date):
        if isinstance(expense_date, str):
            expense_date = datetime.strptime(expense_date, '%Y-%m-%d')
        
        # Get the Sunday of the week (considering Sunday as the first day of the week)
        sunday = expense_date - timedelta(days=expense_date.weekday() + 1)
        return f"{sunday.year}-W{sunday.isocalendar()[1]:02d}"

    def update_status(self, weekly_status, monthly_status, expense, date, budgets):
        expense_date = datetime.strptime(date, '%Y-%m-%d')
        current_month_start = expense_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month_start = (current_month_start + timedelta(days=32)).replace(day=1)

        if current_month_start <= expense_date < next_month_start:
            week_key = self.get_week_key(expense_date)
            
            if week_key not in weekly_status:
                weekly_status[week_key] = {category: 0 for category in budgets}
            weekly_status[week_key][expense.category] += expense.amount
            monthly_status[expense.category]['amount'] += expense.amount

    def get_expense_summary(self, num_days):
        expenses = self.load_expenses()
        summary = []
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=num_days)

        for i in range(num_days):
            current_date = start_date + timedelta(days=i)
            daily_total = sum(
                expense.amount
                for expense in expenses
                if datetime.strptime(expense.date, '%Y-%m-%d').date() == current_date
            )
            summary.append({"date": current_date.strftime('%Y-%m-%d'), "total": daily_total})

        return summary

    def get_current_week_expenses(self):
        expenses = self.load_expenses()
        now = datetime.now()
        start_of_week = now - timedelta(days=now.weekday() + 1)  # Sunday
        end_of_week = start_of_week + timedelta(days=6)  # Saturday
        
        current_week_expenses = sum(
            expense.amount
            for expense in expenses
            if start_of_week <= datetime.strptime(expense.date, '%Y-%m-%d') <= end_of_week
        )
        
        return current_week_expenses

expense_manager = ExpenseManager('expenses.json', 'budgets.json')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/expenses', methods=['GET', 'POST', 'DELETE'])
def handle_expenses():
    try:
        if request.method == 'GET':
            expenses = expense_manager.load_expenses()
            return jsonify([exp.to_dict() for exp in expenses])
        elif request.method == 'POST':
            expenses = expense_manager.load_expenses()
            new_expense_data = request.json
            if new_expense_data.get('isRecurring'):
                new_expense = RecurringExpense(
                    category=new_expense_data['category'],
                    date=new_expense_data['date'],
                    amount=new_expense_data['amount'],
                    frequency=new_expense_data['frequency']
                )
            else:
                new_expense = SingleExpense(
                    category=new_expense_data['category'],
                    date=new_expense_data['date'],
                    amount=new_expense_data['amount']
                )
            expenses.append(new_expense)
            expense_manager.save_expenses(expenses)
            return jsonify({"status": "success"}), 201
        elif request.method == 'DELETE':
            expense_manager.save_expenses([])
            return jsonify({"status": "success"}), 200
    except Exception as e:
        logging.exception(f"An error occurred in handle_expenses: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/api/expenses/<int:index>', methods=['PUT', 'DELETE'])
def handle_expense(index):
    try:
        expenses = expense_manager.load_expenses()
        if request.method == 'PUT':
            updated_expense_data = request.json
            if updated_expense_data.get('isRecurring'):
                updated_expense = RecurringExpense(
                    category=updated_expense_data['category'],
                    date=updated_expense_data['date'],
                    amount=updated_expense_data['amount'],
                    frequency=updated_expense_data['frequency']
                )
            else:
                updated_expense = SingleExpense(
                    category=updated_expense_data['category'],
                    date=updated_expense_data['date'],
                    amount=updated_expense_data['amount']
                )
            expenses[index] = updated_expense
            expense_manager.save_expenses(expenses)
            return jsonify({"status": "success"}), 200
        elif request.method == 'DELETE':
            del expenses[index]
            expense_manager.save_expenses(expenses)
            return jsonify({"status": "success"}), 200
    except Exception as e:
        logging.exception(f"An error occurred in handle_expense: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/api/budgets', methods=['GET', 'PUT'])
def handle_budgets():
    try:
        if request.method == 'GET':
            return jsonify(expense_manager.load_budgets())
        elif request.method == 'PUT':
            new_budgets = request.json
            expense_manager.save_budgets(new_budgets)
            return jsonify({"status": "success"}), 200
    except Exception as e:
        logging.exception(f"An error occurred in handle_budgets: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/api/budget_status', methods=['GET'])
def get_budget_status():
    try:
        status = expense_manager.get_budget_status()
        current_week_expenses = expense_manager.get_current_week_expenses()
        status['current_week_expenses'] = current_week_expenses
        return jsonify(status)
    except Exception as e:
        logging.exception(f"An error occurred in get_budget_status: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/api/expense_summary/<int:days>', methods=['GET'])
def get_expense_summary(days):
    try:
        summary = expense_manager.get_expense_summary(days)
        return jsonify(summary)
    except Exception as e:
        logging.exception(f"An error occurred in get_expense_summary: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)