// public/js/admin.js - لوحة تحكم المسؤول
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من تسجيل الدخول
    checkLogin();
    
    // إعداد عناصر الصفحة
    const logoutBtn = document.getElementById('logoutBtn');
    const addUserForm = document.getElementById('addUserForm');
    const usersTableBody = document.getElementById('usersTableBody');
    
    // إضافة مستخدم جديد
    if (addUserForm) {
        addUserForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(addUserForm);
            const userData = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert('تم إضافة المستخدم بنجاح');
                    addUserForm.reset();
                    loadUsers(); // إعادة تحميل قائمة المستخدمين
                } else {
                    alert(data.error || 'حدث خطأ في إضافة المستخدم');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('حدث خطأ في الاتصال بالخادم');
            }
        });
    }
    
    // تسجيل الخروج
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
    
    // تحميل قائمة المستخدمين
    async function loadUsers() {
        try {
            const response = await fetch('/api/users');
            
            if (response.status === 403) {
                // إذا لم يكن المستخدم مسؤولاً
                window.location.href = '/user.html';
                return;
            }
            
            if (!response.ok) {
                throw new Error('Failed to load users');
            }
            
            const users = await response.json();
            
            // تفريغ الجدول
            usersTableBody.innerHTML = '';
            
            // ملء الجدول بالمستخدمين
            users.forEach(user => {
                const row = document.createElement('tr');
                
                // تنسيق التاريخ
                const createdAt = new Date(user.created_at);
                const formattedDate = `${createdAt.getFullYear()}/${createdAt.getMonth()+1}/${createdAt.getDate()}`;
                
                row.innerHTML = `
                    <td>${user.username}</td>
                    <td>${user.full_name}</td>
                    <td><span class="role-badge role-${user.role}">${user.role === 'admin' ? 'مسؤول' : 'مستخدم'}</span></td>
                    <td>${user.grade}</td>
                    <td>${user.age}</td>
                    <td>${user.department}</td>
                    <td>${formattedDate}</td>
                    <td class="actions">
                        <button class="btn-action btn-delete" onclick="deleteUser(${user.id})">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </td>
                `;
                
                usersTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading users:', error);
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
            
            // إذا لم يكن المستخدم مسؤولاً
            if (user.role !== 'admin') {
                window.location.href = '/user.html';
            }
            
            // تحميل قائمة المستخدمين
            loadUsers();
            
        } catch (error) {
            console.error('Error checking login:', error);
            window.location.href = '/';
        }
    }
    
    // جعل دالة الحذف متاحة على النطاق العام
    window.deleteUser = async function(userId) {
        if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('تم حذف المستخدم بنجاح');
                loadUsers(); // إعادة تحميل قائمة المستخدمين
            } else {
                alert(data.error || 'حدث خطأ في حذف المستخدم');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('حدث خطأ في الاتصال بالخادم');
        }
    };
});