-- =============================================
-- Lawyer Management System - Database Setup
-- Run this in phpMyAdmin or MySQL CLI
-- =============================================

CREATE DATABASE IF NOT EXISTS lms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lms_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('admin', 'user') DEFAULT 'user',
    status ENUM('active', 'inactive') DEFAULT 'active',
    profile_pic VARCHAR(255) DEFAULT 'default.png',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Cases / Products Table (Legal Cases)
CREATE TABLE IF NOT EXISTS cases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_title VARCHAR(200) NOT NULL,
    case_number VARCHAR(100),
    case_type VARCHAR(100),
    description TEXT,
    client_name VARCHAR(150),
    lawyer_name VARCHAR(150),
    status ENUM('open', 'closed', 'pending', 'won', 'lost') DEFAULT 'open',
    fee DECIMAL(10,2) DEFAULT 0.00,
    hearing_date DATE,
    filed_date DATE,
    image VARCHAR(255) DEFAULT 'default-case.png',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert Default Admin
INSERT INTO users (full_name, email, password, role, status) 
VALUES ('Admin User', 'admin@lms.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active');
-- Default admin password: password

-- Insert Sample Cases
INSERT INTO cases (case_title, case_number, case_type, description, client_name, lawyer_name, status, fee, hearing_date, filed_date, created_by) VALUES
('Property Dispute - Khan vs Ali', 'CASE-2024-001', 'Civil', 'Dispute over 5 marla plot in DHA Phase 5. Client claims ownership based on 1998 registry.', 'Ahmed Khan', 'Adv. Rashid Mehmood', 'open', 150000.00, '2024-06-15', '2024-01-10', 1),
('Criminal Defense - Robbery Case', 'CASE-2024-002', 'Criminal', 'Client accused of robbery. Alibi witnesses available. CCTV footage under review.', 'Shahid Hussain', 'Adv. Sara Malik', 'pending', 200000.00, '2024-07-20', '2024-02-05', 1),
('Divorce Proceedings', 'CASE-2024-003', 'Family', 'Mutual divorce case. Child custody and property division to be settled.', 'Nadia Iqbal', 'Adv. Rashid Mehmood', 'open', 80000.00, '2024-06-30', '2024-03-15', 1),
('Corporate Fraud Investigation', 'CASE-2024-004', 'Corporate', 'Company accused of financial fraud amounting to 5 million PKR.', 'XYZ Corporation', 'Adv. Bilal Ahmed', 'closed', 500000.00, '2024-05-10', '2024-01-20', 1),
('Labor Dispute - Unfair Dismissal', 'CASE-2024-005', 'Labor', 'Employee wrongfully terminated without due process or compensation.', 'Kamran Mirza', 'Adv. Sara Malik', 'won', 50000.00, '2024-04-25', '2024-02-28', 1);
