// public/js/user.js - صفحة المستخدم العادي
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من تسجيل الدخول
    checkLogin();
    
    // تسجيل الخروج
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            try {
                const response = await fetch('/api/logout', {
                    method: 'POST'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    window.location.href = '/';
                }
            } catch (error) {
                console.error('Error:', error);
                alert('حدث خطأ في تسجيل الخروج');
            }
        });
    }
    
    // تحميل معلومات المستخدم
    async function loadUserInfo() {
        try {
            const response = await fetch('/api/current-user');
            
            if (!response.ok) {
                // إذا لم يكن المستخدم مسجل الدخول
                window.location.href = '/';
                return;
            }
            
            const user = await response.json();
            
            // تحديث واجهة المستخدم
            document.getElementById('userFullName').textContent = user.full_name;
            document.getElementById('infoUsername').textContent = user.username;
            document.getElementById('infoRole').textContent = user.role === 'admin' ? 'مسؤول' : 'مستخدم';
            document.getElementById('infoGrade').textContent = user.grade;
            document.getElementById('infoAge').textContent = user.age;
            document.getElementById('infoDepartment').textContent = user.department;
            
            // تنسيق التاريخ
            const createdAt = new Date(user.created_at);
            const formattedDate = `${createdAt.getFullYear()}/${createdAt.getMonth()+1}/${createdAt.getDate()} ${createdAt.getHours()}:${createdAt.getMinutes().toString().padStart(2, '0')}`;
            document.getElementById('infoCreatedAt').textContent = formattedDate;
            
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    }
    
    // التحقق من تسجيل الدخول
    async function checkLogin() {
        try {
            const response = await fetch('/api/current-user');
            
            if (!response.ok) {
                // إذا لم يكن المستخدم مسجل الدخول
                window.location.href = '/';
                return;
            }
            
            const user = await response.json();
            
            // إذا كان المستخدم مسؤولاً، توجيهه إلى لوحة التحكم
            if (user.role === 'admin') {
                window.location.href = '/admin.html';
                return;
            }
            
            // تحميل معلومات المستخدم
            loadUserInfo();
            
        } catch (error) {
            console.error('Error checking login:', error);
            window.location.href = '/';
        }
    }
});