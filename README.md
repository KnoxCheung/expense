# Weekly and Monthly Expense Tracker

This web application helps users track their expenses on a weekly and monthly basis, providing insights into spending habits and budget adherence.

## Features

- Add, edit, and delete expenses
- Categorize expenses (e.g., indoor cooking, outdoor dinners, transport fees)
- Set and manage budgets for different expense categories
- View expenses grouped by week (Monday to Sunday)
- Visualize expense distribution with a pie chart
- Get weekly budget status updates and reminders
- See monthly budget status across all categories

## Technical Stack

- Backend: Python with Flask
- Frontend: HTML, CSS (Tailwind CSS), and JavaScript
- Data Storage: JSON files

## Project Structure

- `app.py`: Flask backend application
- `static/app.js`: Frontend JavaScript
- `templates/index.html`: Main HTML template
- `expenses.json`: JSON file storing expense data
- `budgets.json`: JSON file storing budget data

## Setup and Running

1. Ensure you have Python 3.7+ installed
2. Install required Python packages:
   ```
   pip install flask
   ```
3. Run the Flask application:
   ```
   python app.py
   ```
4. Open a web browser and navigate to `http://localhost:5000`

## Backend Design

The backend is designed with the following constraints:
- Uses flow control (if-else, for, while)
- Utilizes lists and dictionaries
- Implements the range() function
- Has multiple classes, including inheritance
- Reads and writes files
- Implements exception handling
- Uses three or more standard modules (datetime, json, logging)

## Frontend Design

The frontend is built using vanilla JavaScript and interacts with the backend via RESTful API calls. It dynamically updates the UI based on user actions and data changes.

## Recent Updates

- Fixed expense grouping issue to ensure expenses are correctly grouped into weeks (Monday to Sunday)
- Improved consistency between expense list, budget status, and weekly reminder date ranges

## Future Improvements

- Implement user authentication
- Add data visualization for expense trends over time
- Create a mobile app version
- Integrate with financial institutions for automatic expense tracking

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).