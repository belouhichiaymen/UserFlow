-- database.sql
CREATE DATABASE IF NOT EXISTS user_management;
USE user_management;

-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    grade VARCHAR(50),
    age INT,
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إدراج بيانات أولية
INSERT INTO users (username, password, full_name, role, grade, age, department) VALUES
('admin', '$2b$10$KxG8cJ.8gY2p6d7Q1VzZ4eLmN3bVc5X6y7Z8a9b0c1d2e3f4g5h6i7j8', 'المسؤول الرئيسي', 'admin', 'مدير نظام', 35, 'الإدارة'),
('user1', '$2b$10$KxG8cJ.8gY2p6d7Q1VzZ4eLmN3bVc5X6y7Z8a9b0c1d2e3f4g5h6i7j8', 'أحمد محمد', 'user', 'مهندس', 28, 'التطوير'),
('user2', '$2b$10$KxG8cJ.8gY2p6d7Q1VzZ4eLmN3bVc5X6y7Z8a9b0c1d2e3f4g5h6i7j8', 'فاطمة علي', 'user', 'مصممة', 26, 'التصميم');

-- ملاحظة: كلمة المرور المشفرة هي "password123" لجميع الحسابات للاختبار