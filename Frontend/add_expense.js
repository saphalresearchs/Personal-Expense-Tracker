document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
        window.location.href = 'login.html';
        return;
    }

    // Load categories and set up form
    loadCategories();
    setupForm();
});

async function loadCategories() {
    try {
        const categories = await fetchCategories();
        populateCategoryDropdown(categories);
    } catch (error) {
        console.error('Failed to load categories:', error);
        showAlert('Failed to load categories. Please try again.', 'error');
    }
}

async function fetchCategories() {
    const response = await fetch('http://127.0.0.1:8000/api/categories/', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch categories');
    }

    return await response.json();
}

function populateCategoryDropdown(categories) {
    const dropdown = document.getElementById('category');
    dropdown.innerHTML = '<option value="">Select a category</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        dropdown.appendChild(option);
    });
}

function setupForm() {
    const form = document.getElementById('expense-form');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form values
        const title = document.getElementById('title').value;
        const category = document.getElementById('category').value;
        const amount = document.getElementById('amount').value;
        const date = document.getElementById('date').value;
        const description = document.getElementById('description').value;
        
        // Validate
        if (!title || !category || !amount || !date) {
            showAlert('Please fill in all required fields', 'error');
            return;
        }
        
        // Prepare request
        const expenseData = {
            title: title,
            category: parseInt(category),
            amount: parseFloat(amount),
            date: date,
            description: description || ""
        };
        
        // Disable button during submission
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Adding...';
        
        try {
            const newExpense = await addExpense(expenseData);
            showAlert('Expense added successfully!', 'success');
            form.reset();
            
            // Optional: Redirect after success
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } catch (error) {
            console.error('Error adding expense:', error);
            showAlert('Failed to add expense. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Expense';
        }
    });
}

async function addExpense(expenseData) {
    const response = await fetch('http://127.0.0.1:8000/api/expenses/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(expenseData)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to add expense');
    }

    return await response.json();
}

function showAlert(message, type) {
    const alertBox = document.getElementById('alert-box');
    alertBox.textContent = message;
    alertBox.className = `alert-${type}`;
    alertBox.style.display = 'block';
    
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 5000);
}

document.getElementById('home-button').addEventListener('click', () => {
    window.location.href = 'dashboard.html'; // Or your homepage URL
});