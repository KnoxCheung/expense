from flask import Flask, render_template, request, jsonify, send_from_directory
from expense_manager import ExpenseManager
from datetime import datetime
import calendar
import os

app = Flask(__name__)
manager = ExpenseManager("expenses.xlsx")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/main.js')
def serve_js():
    return send_from_directory('templates', 'main.js')

@app.route('/api/add_expense', methods=['POST'])
def add_expense():
    data = request.json
    success = manager.add_expense(data['category'], data['amount'], data['date'])
    if success:
        return jsonify({
            "status": "success",
            "expenses": [e.to_dict() for e in manager.get_expenses()]
        })
    else:
        return jsonify({"status": "error", "message": "Failed to add expense"}), 400

@app.route('/api/add_recurring_expense', methods=['POST'])
def add_recurring_expense():
    data = request.json
    success = manager.add_recurring_expense(data['category'], data['amount'], data['frequency'], data['date'])
    if success:
        return jsonify({
            "status": "success",
            "recurring_expenses": [e.to_dict() for e in manager.get_recurring_expenses()]
        })
    else:
        return jsonify({"status": "error", "message": "Failed to add recurring expense"}), 400

@app.route('/api/remove_expense', methods=['POST'])
def remove_expense():
    data = request.json
    success = manager.remove_expense(data['index'])
    if success:
        return jsonify({
            "status": "success",
            "expenses": [e.to_dict() for e in manager.get_expenses()]
        })
    else:
        return jsonify({"status": "error", "message": "Failed to remove expense"}), 400

@app.route('/api/remove_recurring_expense', methods=['POST'])
def remove_recurring_expense():
    data = request.json
    success = manager.remove_recurring_expense(data['index'])
    if success:
        return jsonify({
            "status": "success",
            "recurring_expenses": [e.to_dict() for e in manager.get_recurring_expenses()]
        })
    else:
        return jsonify({"status": "error", "message": "Failed to remove recurring expense"}), 400

@app.route('/api/edit_expense', methods=['POST'])
def edit_expense():
    data = request.json
    success = manager.edit_expense(data['index'], data['category'], data['amount'], data['date'])
    if success:
        return jsonify({
            "status": "success",
            "expenses": [e.to_dict() for e in manager.get_expenses()]
        })
    else:
        return jsonify({"status": "error", "message": "Failed to edit expense"}), 400

@app.route('/api/edit_recurring_expense', methods=['POST'])
def edit_recurring_expense():
    data = request.json
    success = manager.edit_recurring_expense(data['index'], data['category'], data['amount'], data['frequency'], data['date'])
    if success:
        return jsonify({
            "status": "success",
            "recurring_expenses": [e.to_dict() for e in manager.get_recurring_expenses()]
        })
    else:
        return jsonify({"status": "error", "message": "Failed to edit recurring expense"}), 400

@app.route('/api/get_expenses', methods=['GET'])
def get_expenses():
    return jsonify({"expenses": [e.to_dict() for e in manager.get_expenses()]})

@app.route('/api/get_recurring_expenses', methods=['GET'])
def get_recurring_expenses():
    return jsonify({"recurring_expenses": [e.to_dict() for e in manager.get_recurring_expenses()]})

@app.route('/api/get_budget_status', methods=['GET'])
def get_budget_status():
    return jsonify(manager.get_budget_status())

@app.route('/api/update_budget_limit', methods=['POST'])
def update_budget_limit():
    data = request.json
    manager.update_budget_limit(data['category'], data['goodLimit'], data['normalLimit'])
    return jsonify({"status": "success", "budget_status": manager.get_budget_status()})

@app.route('/api/clear_data', methods=['POST'])
def clear_data():
    manager.clear_data()
    return jsonify({"status": "success"})

@app.route('/api/send_reminder', methods=['POST'])
def send_reminder():
    data = request.json
    manager.send_weekly_reminder(data['email'])
    return jsonify({"status": "success"})

@app.route('/api/get_expenses_for_range', methods=['GET'])
def get_expenses_for_range():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    expenses = manager.get_expenses_for_range(start_date, end_date)
    return jsonify({"expenses": [e.to_dict() for e in expenses]})

@app.route('/api/get_weekly_expense_alarm', methods=['GET'])
def get_weekly_expense_alarm():
    alarms = manager.get_weekly_expense_alarm()
    return jsonify({"alarms": alarms})

@app.route('/api/get_monthly_calendar', methods=['GET'])
def get_monthly_calendar():
    current_date = datetime.now()
    year = int(request.args.get('year', current_date.year))
    month = int(request.args.get('month', current_date.month))

    month_expenses = manager.get_monthly_calendar(year, month)
    cal = calendar.monthcalendar(year, month)
    return jsonify({
        "calendar": cal,
        "expenses": {str(day): [e.to_dict() for e in expenses] for day, expenses in month_expenses.items()}
    })

if __name__ == '__main__':
    app.run(debug=True)
