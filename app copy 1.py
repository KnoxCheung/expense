from flask import Flask, render_template, request, jsonify
from expense_manager import ExpenseManager

app = Flask(__name__)
manager = ExpenseManager("expenses.xlsx")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/add_expense', methods=['POST'])
def add_expense():
    data = request.json
    manager.add_expense(data['category'], data['amount'])
    return jsonify({"status": "success"})

@app.route('/api/add_recurring_expense', methods=['POST'])
def add_recurring_expense():
    data = request.json
    manager.add_recurring_expense(data['category'], data['amount'], data['frequency'])
    return jsonify({"status": "success"})

@app.route('/api/get_expenses', methods=['GET'])
def get_expenses():
    return jsonify({"expenses": [e.to_dict() for e in manager.get_expenses()]})

@app.route('/api/get_recurring_expenses', methods=['GET'])
def get_recurring_expenses():
    return jsonify({"recurring_expenses": [e.to_dict() for e in manager.get_recurring_expenses()]})

@app.route('/api/get_budget_status', methods=['GET'])
def get_budget_status():
    return jsonify(manager.get_budget_status())

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
    days = int(request.args.get('days', 7))  # Default to 7 days if not specified
    expenses = manager.get_expenses_for_range(days)
    return jsonify({"expenses": [e.to_dict() for e in expenses]})

if __name__ == '__main__':
    app.run(debug=True)
