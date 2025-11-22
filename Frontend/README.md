# 📦 Inventory Management System (Full Stack)

A full-stack web application to manage products with authentication, role-based access, pagination, sorting, CSV import/export, and responsive UI.

---

## 🚀 Live Project Links

### Frontend (Netlify)
🔗 https://6921a267070cd50008fb42dd--inventory-frontend-1.netlify.app/

### Backend (Render)
🔗 https://inventory-backend-24p8.onrender.com/

---

## 🛠️ Tech Stack

### Frontend
- React.js (Create React App)
- CSS (Flexbox + Media Queries)
- Axios
- JWT stored in Local Storage

### Backend
- Node.js
- Express.js
- SQLite3
- JWT (JSON Web Tokens)
- bcrypt (password hashing)

### Deployment
- Frontend → Netlify
- Backend → Render

---

## 🔑 Features

### ✅ Authentication
- Login and Register
- Password hashing using **bcrypt**
- JWT-based authentication
- Role-based access control

### ✅ Roles
| Role  | Permissions |
|--------|------------|
| Admin  | View, Add, Edit, Delete, Import CSV, Export CSV |
| Client | View only |

---

## 📋 Default Users

Use these demo accounts:

Admin:
Username: admin
Password: admin123

Client:
Username: client
Password: client123


---

## 📦 Product Management

You can:

- Add products
- Edit products
- Delete products (admin only)
- View stock history
- Import products using CSV
- Export products as CSV

---

## 📊 Pagination & Sorting

### Frontend
- Click column headers to **sort**
- Supports page size selection
- Prev/Next page navigation

### Backend
Supports:
/api/products?page=1&limit=10&sort=name&order=asc


---

## 📥 CSV Import Format

Use this format for importing products:

```csv
name,unit,category,brand,stock
Pen,pcs,Stationary,Cello,100
Notebook,pcs,Stationary,Classmate,50
Phone,unit,Electronics,Samsung,30

🎨 UI Features

Modern button colors (Import, Export, Add, Edit, Delete)

Stock status badges:

🟢 Green → In Stock

🔴 Red → Out of Stock

Responsive Design

Desktop optimized table view

Mobile-friendly card/table hybrid layout

Media queries for:

Mobile

Tablet

Desktop


inventory-management/
│
├── Backend/
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── products.js
│   ├── db.js
│   ├── server.js
│   └── package.json
│
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js
│   │   │   ├── ProductTable.js
│   │   │   └── HistorySidebar.js
│   │   ├── api.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   └── package.json
│
└── .gitignore


⚙️ Local Setup
Clone the Repo

git clone https://github.com/2022ec0621/inventory-management.git
cd inventory-management

Run Backend
cd Backend
npm install
npm start

Runs at:
http://localhost:5000

Run Frontend
cd Frontend
npm install
npm start


🌐 Environment Variables
Backend (Render)

Set in Render Dashboard:


JWT_SECRET=your-secret-key

Frontend (Netlify)

Set in Netlify:
REACT_APP_API_BASE_URL=https://inventory-backend-24p8.onrender.com
DISABLE_ESLINT_PLUGIN=true


🚀 Deployment Summary
Backend (Render)

Root directory: Backend

Build command: npm install

Start command: npm start

Frontend (Netlify)

Base directory: Frontend

Build command: npm run build

Publish directory: build

✅ Assignment Requirements Covered
| Requirement          | Status |
| -------------------- | ------ |
| User Authentication  | ✅ Done |
| JWT Security         | ✅ Done |
| Role Based Access    | ✅ Done |
| CRUD Operations      | ✅ Done |
| Pagination & Sorting | ✅ Done |
| CSV Import/Export    | ✅ Done |
| Responsive UI        | ✅ Done |
| Deployment           | ✅ Done |


👨‍💻 Developer

Name: Karthik
Project: Full Stack Inventory Management System
Year: 2024 – 2025
