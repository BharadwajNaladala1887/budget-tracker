# CoinFlow 💸

A lightweight, interactive web-based budget tracking application built to help users seamlessly monitor their daily transactions, income, and expenses. 

live demo : https://bharadwajnaladala1887.github.io/budget-tracker/expense.html
## 🚀 Features

- **Transaction Management:** Add, categorize, and delete income and expense transactions.
- **Dynamic Balance Calculation:** Automatically calculates total balance, total income, and total expenses in real-time.
- **Data Persistence:** Utilizes browser `localStorage` to save transaction history (`CoinFlowData`), ensuring user data is never lost on page refresh.
- **Data Visualization:** Integrates the **D3.js** library to render dynamic, interactive charts based on the user's financial inputs.

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3
- **Logic & DOM Manipulation:** Vanilla JavaScript (ES6+)
- **Data Visualization:** D3.js
- **Storage:** Web Storage API (`localStorage`)

## 🧠 Technical Highlights

Building this application involved utilizing core JavaScript concepts without relying on frontend frameworks:
- **State Management:** Handled custom data arrays and objects using JS array methods (`.map()`, `.filter()`, `.reduce()`).
- **DOM Manipulation:** Dynamically rendering HTML elements and updating the UI based on user input.
- **JSON Parsing:** Serializing and deserializing data payloads for local storage.

## 💻 How to Run Locally

Because this project is built with Vanilla HTML/JS, no complex backend setup or package installation is required!
