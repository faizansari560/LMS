# ⚖️ Lawyer Management System (LMS)
## Setup Instructions for XAMPP

---

## 📁 Folder Structure

```
LMS/
├── index.html              ← Login / Signup Page (ENTRY POINT)
├── admin/
│   ├── dashboard.html      ← Admin Panel
│   ├── css/admin.css
│   └── js/admin.js
├── user/
│   ├── index.html          ← Public Website
│   ├── css/user.css
│   └── js/user.js
├── backend/
│   ├── config.php          ← Database Config
│   ├── auth.php            ← Login / Signup / Logout
│   ├── users.php           ← User CRUD
│   ├── cases.php           ← Cases CRUD
│   ├── session.php         ← Session Check
│   └── database.sql        ← Database Setup
└── assets/
    └── uploads/            ← Case images (auto-created)
```

---

## ⚙️ Setup Steps

### Step 1 — Copy to XAMPP
Copy the entire `LMS` folder to:
```
C:\xampp\htdocs\LMS
```

### Step 2 — Start XAMPP
- Open XAMPP Control Panel
- Start **Apache** and **MySQL**

### Step 3 — Create Database
1. Open browser → go to `http://localhost/phpmyadmin`
2. Click **New** → name it `lms_db` → click Create
3. Click on `lms_db` → click **Import** tab
4. Choose file: `LMS/backend/database.sql`
5. Click **Go** / Import

### Step 4 — Open the Website
Go to: `http://localhost/LMS/index.html`

---

## 🔐 Default Admin Login
```
Email:    admin@lms.com
Password: password
```

---

## ✨ Features

### Login Page (index.html)
- Login with email + password
- Sign up for new account
- Redirect to Admin Panel (admin) or User Website (user)

### Admin Panel (admin/dashboard.html)
- Dashboard with stats (total cases, won, revenue, users)
- **Cases Management**: Add, Edit, Delete, View cases (with image upload)
- **Users Management**: Add, Edit, Delete, Toggle status, View all users
- Logout & Switch User buttons

### User Website (user/index.html)
- Hero section with animated stats
- Services / Areas of Practice
- All cases displayed as cards (filter by status)
- Case detail popup with full info
- About section
- Contact form
- Logout & Switch User in navbar

---

## 🛠️ Database Config (if needed)
Edit `backend/config.php`:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');      // Your MySQL username
define('DB_PASS', '');          // Your MySQL password (usually empty in XAMPP)
define('DB_NAME', 'lms_db');
```

---

## 📱 Responsive
- Works on mobile, tablet, and desktop
- Sidebar collapses on mobile with hamburger menu
- All grids adapt to screen size

---

Made with ❤️ | Lawyer Management System
