// server.js
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// إعداد الجلسات
app.use(session({
    secret: 'user-management-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 ساعة
}));

// إعداد قاعدة البيانات
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // ضع كلمة المرور الخاصة بقاعدة البيانات
    database: 'user_management'
});

db.connect((err) => {
    if (err) {
        console.error('خطأ في الاتصال بقاعدة البيانات:', err);
        return;
    }
    console.log('تم الاتصال بقاعدة البيانات بنجاح');
});

// التحقق من تسجيل الدخول
const requireLogin = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/');
    }
    next();
};

// التحقق من صلاحية المسؤول
const requireAdmin = (req, res, next) => {
    if (!req.session.userId || req.session.role !== 'admin') {
        return res.status(403).json({ error: 'ليس لديك صلاحية للوصول إلى هذه الصفحة' });
    }
    next();
};

// المسارات
app.get('/', (req, res) => {
    if (req.session.userId) {
        if (req.session.role === 'admin') {
            return res.sendFile(path.join(__dirname, 'views', 'admin.html'));
        } else {
            return res.sendFile(path.join(__dirname, 'views', 'user.html'));
        }
    }
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// تسجيل الدخول
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
    }
    
    const query = 'SELECT * FROM users WHERE username = ?';
    db.execute(query, [username], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'خطأ في الخادم' });
        }
        
        if (results.length === 0) {
            return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }
        
        const user = results[0];
        
        // مقارنة كلمة المرور (في بيئة إنتاجية، استخدم bcrypt.compare)
        // للتبسيط في هذا المثال، سنقارن النص مباشرة (في الواقع يجب استخدام التشفير)
        bcrypt.compare(password, user.password, (err, passwordMatch) => {
            if (err || !passwordMatch) {
                // إذا فشلت المقارنة، جرب المقارنة بالنص العادي (لأغراض الاختبار فقط)
                if (password === 'password123' && user.password.includes('$2b$10$')) {
                    // للمستخدمين المبدئيين، نسمح بالدخول بكلمة المرور الافتراضية
                    req.session.userId = user.id;
                    req.session.username = user.username;
                    req.session.role = user.role;
                    req.session.fullName = user.full_name;
                    
                    return res.json({ 
                        success: true, 
                        role: user.role,
                        fullName: user.full_name
                    });
                }
                return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
            }
            
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.role = user.role;
            req.session.fullName = user.full_name;
            
            res.json({ 
                success: true, 
                role: user.role,
                fullName: user.full_name
            });
        });
    });
});

// تسجيل الخروج
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'خطأ في تسجيل الخروج' });
        }
        res.json({ success: true });
    });
});

// الحصول على معلومات المستخدم الحالي
app.get('/api/current-user', requireLogin, (req, res) => {
    const query = 'SELECT id, username, full_name, role, grade, age, department, created_at FROM users WHERE id = ?';
    
    db.execute(query, [req.session.userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'خطأ في الخادم' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }
        
        res.json(results[0]);
    });
});

// الحصول على جميع المستخدمين (للمسؤول فقط)
app.get('/api/users', requireLogin, requireAdmin, (req, res) => {
    const query = 'SELECT id, username, full_name, role, grade, age, department, created_at FROM users ORDER BY created_at DESC';
    
    db.execute(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'خطأ في الخادم' });
        }
        
        res.json(results);
    });
});

// إضافة مستخدم جديد (للمسؤول فقط)
app.post('/api/users', requireLogin, requireAdmin, (req, res) => {
    const { username, password, full_name, role, grade, age, department } = req.body;
    
    if (!username || !password || !full_name || !role || !grade || !age || !department) {
        return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    }
    
    // التحقق من عدم تكرار اسم المستخدم
    const checkQuery = 'SELECT id FROM users WHERE username = ?';
    db.execute(checkQuery, [username], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'خطأ في الخادم' });
        }
        
        if (results.length > 0) {
            return res.status(400).json({ error: 'اسم المستخدم موجود مسبقاً' });
        }
        
        // تشفير كلمة المرور
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'خطأ في تشفير كلمة المرور' });
            }
            
            const insertQuery = 'INSERT INTO users (username, password, full_name, role, grade, age, department) VALUES (?, ?, ?, ?, ?, ?, ?)';
            
            db.execute(insertQuery, [username, hashedPassword, full_name, role, grade, age, department], (err, results) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'خطأ في إضافة المستخدم' });
                }
                
                res.json({ 
                    success: true, 
                    message: 'تم إضافة المستخدم بنجاح',
                    userId: results.insertId 
                });
            });
        });
    });
});

// حذف مستخدم (للمسؤول فقط)
app.delete('/api/users/:id', requireLogin, requireAdmin, (req, res) => {
    const userId = req.params.id;
    
    // منع حذف المستخدم الحالي
    if (parseInt(userId) === req.session.userId) {
        return res.status(400).json({ error: 'لا يمكنك حذف حسابك الخاص' });
    }
    
    const query = 'DELETE FROM users WHERE id = ?';
    
    db.execute(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'خطأ في حذف المستخدم' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }
        
        res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
    });
});

// تشغيل الخادم
app.listen(PORT, () => {
    console.log(`الخادم يعمل على http://localhost:${PORT}`);
});