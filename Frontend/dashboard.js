// Global variables to track filters
let currentFilters = {
    category: 'all',
    month: 'all'
};

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize empty categories array
    window.expenseCategories = [];
    //initFilters();

    initFilters().then(() => {
        loadData();
    });

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }
    });

    async function logout() {
    const refresh = localStorage.getItem("refresh");

    if (refresh) {
        try {
        await fetch(`${BASE_URL}/logout/`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("access")}`
            },
            body: JSON.stringify({ refresh: refresh })
        });
        } catch (err) {
        console.error("Logout error:", err);
        }
    }

    // Clean up tokens no matter what
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.location.href = "login.html";

    // Load data sequentially
    //loadData();
};

function formatNPR(amount) {
    return new Intl.NumberFormat('ne-NP', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

async function loadData() {
    try {
        // 1. First fetch categories
        const categories = await fetchCategories();
        window.expenseCategories = categories;

        // Populate category filter
        const categoryFilter = document.getElementById('category-filter');
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
        
        await applyFilters();
        
        // 2. Then fetch expenses
        const expenses = await fetchExpenses();
        
        // 3. Update UI with both datasets
        updateUI(expenses);
    } catch (error) {
        console.error('Error loading data:', error);
        showAlert('Failed to load data. Please refresh the page.', 'error');
    }
}

async function initFilters() {
    try {
        // Load categories first
        const categories = await fetchCategories();
        populateCategoryFilter(categories);
        populateMonthFilter();
        
        // Set up event listeners
        document.getElementById('category-filter').addEventListener('change', function() {
            currentFilters.category = this.value;
            applyFilters();
        });
        
        document.getElementById('month-filter').addEventListener('change', function() {
            currentFilters.month = this.value;
            applyFilters();
        });
        
        document.getElementById('reset-filters').addEventListener('click', resetFilters);
        
    } catch (error) {
        console.error('Error initializing filters:', error);
        showAlert('Failed to initialize filters', 'error');
    }
    // Month/year filter setup
    const monthFilter = document.getElementById('month-filter');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Populate month/year filter (last 12 months)
    for (let i = 0; i < 12; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const option = document.createElement('option');
        option.value = `${year}-${month}`;
        option.textContent = `${year}-${month}`;
        monthFilter.appendChild(option);
    }
    
    // Set default to current month
    monthFilter.value = `${currentYear}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    // Event listeners for filters
    document.getElementById('category-filter').addEventListener('change', applyFilters);
    monthFilter.addEventListener('change', applyFilters);
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
}

async function applyFilters() {
    try {
        // Start with base URL
        let apiUrl = 'http://127.0.0.1:8000/api/expenses/';  // Removed '?'
        const params = [];
        
        if (currentFilters.category !== 'all') {
            params.push(`category=${currentFilters.category}`);
        }
        
        if (currentFilters.month !== 'all') {
            params.push(`month=${currentFilters.month}`);
        }
        
        // Only add '?' if params exist
        if (params.length > 0) {
            apiUrl += '?' + params.join('&');  // <-- Add '?' here
        }
        
        console.log("API URL:", apiUrl);  // Debug: Check the URL
        
        // Fetch data with filters
        const expenses = await fetchExpenses(apiUrl);
        updateUI(expenses);
        
        updateActiveFiltersDisplay();
        
    } catch (error) {
        console.error('Error applying filters:', error);
        showAlert('Failed to apply filters', 'error');
    }
}

function resetFilters() {
    currentFilters = {
        category: 'all',
        month: 'all'
    };

    document.getElementById('category-filter').value = 'all';
    document.getElementById('month-filter').value = '';
    applyFilters();
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

// async function fetchExpenses() {
//     const response = await fetch('http://127.0.0.1:8000/api/expenses/', {
//         headers: {
//             'Authorization': `Bearer ${localStorage.getItem('access_token')}`
//         }
//     });

//     if (!response.ok) {
//         throw new Error('Failed to fetch expenses');
//     }

//     return await response.json();
// }

async function fetchExpenses(url = 'http://127.0.0.1:8000/api/expenses/') {
    const response = await fetch(url, {  // Uses dynamic URL
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch expenses');
    }
    return await response.json();
}   

function updateUI(expenses) {
    updateSummaryCards(expenses);
    renderExpenseCards(expenses);
    updateCharts(expenses);
}

function updateSummaryCards(expenses) {
    // Calculate totals
    const total = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    
    const currentMonth = new Date().getMonth();
    const thisMonthTotal = expenses
        .filter(expense => new Date(expense.date).getMonth() === currentMonth)
        .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    
    // Find top category
    const categoryTotals = {};
    expenses.forEach(expense => {
        const category = window.expenseCategories.find(c => c.id === expense.category);
        const categoryName = category ? category.name : 'Other';
        categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + parseFloat(expense.amount);
    });
    
    const topCategory = Object.keys(categoryTotals).reduce((a, b) => 
        categoryTotals[a] > categoryTotals[b] ? a : b, 'None');

    // Update DOM
    document.getElementById('total-spending').textContent = `NPR ${total.toFixed(2)}`;
    document.getElementById('monthly-spending').textContent = `NPR ${thisMonthTotal.toFixed(2)}`;
    document.getElementById('weekly-average').textContent = `NPR ${(total / 4).toFixed(2)}`;
    document.getElementById('top-category').textContent = topCategory;
}

function renderExpenseCards(expenses) {
    const container = document.getElementById('expense-cards-container');
    container.innerHTML = '';

    // Sort by date (newest first)
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedExpenses.forEach(expense => {
        // Get category name
        const category = window.expenseCategories.find(c => c.id === expense.category);
        const categoryName = category ? category.name : 'Uncategorized';
        
        // Format date
        const expenseDate = new Date(expense.date);
        const formattedDate = expenseDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        // Create card
        const card = document.createElement('div');
        card.className = 'expense-card';
        card.innerHTML = `
            <div class="actions">
                <button class="edit-btn" data-id="${expense.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" data-id="${expense.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <h3>${categoryName}</h3>
            <div class="amount">NPR ${parseFloat(expense.amount).toFixed(2)}</div>
            <div class="date">${formattedDate}</div>
            <div class="description">${expense.description || 'No description'}</div>
        `;
        container.appendChild(card);
    });

    // Add event listeners
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', handleEdit);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', handleDelete);
    });
}

function handleEdit(e) {
    const expenseId = e.target.closest('button').getAttribute('data-id');
    // Implement your edit logic here
    console.log('Edit expense:', expenseId);
    alert('Edit functionality will be implemented here');
}

function handleDelete(e) {
    const expenseId = e.target.closest('button').getAttribute('data-id');
    
    if (confirm('Are you sure you want to delete this expense?')) {
        deleteExpense(expenseId)
            .then(() => {
                showAlert('Expense deleted successfully', 'success');
                loadData(); // Refresh data
            })
            .catch(error => {
                console.error('Delete error:', error);
                showAlert('Failed to delete expense', 'error');
            });
    }
}

async function deleteExpense(expenseId) {
    const response = await fetch(`http://127.0.0.1:8000/api/expenses/${expenseId}/`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
    });

    if (!response.ok) {
        throw new Error('Delete failed');
    }
}

function initCharts() {
    // Monthly Chart
    const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
    window.monthlyChart = new Chart(monthlyCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Spending',
                data: Array(12).fill(0),
                backgroundColor: '#1976d2',
                borderColor: '#1565c0',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount (NPR)'
                    }
                }
            }
        }
    });

    // Weekly Chart
    const weeklyCtx = document.getElementById('weeklyChart').getContext('2d');
    window.weeklyChart = new Chart(weeklyCtx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Spending',
                data: Array(4).fill(0),
                backgroundColor: 'rgba(25, 118, 210, 0.2)',
                borderColor: '#1976d2',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount (NPR)'
                    }
                }
            }
        }
    });
}

function updateCharts(expenses) {
    // Monthly data
    const monthlyData = Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    expenses.forEach(expense => {
        const date = new Date(expense.date);
        if (date.getFullYear() === currentYear) {
            const month = date.getMonth();
            monthlyData[month] += parseFloat(expense.amount);
        }
    });
    
    window.monthlyChart.data.datasets[0].data = monthlyData;
    window.monthlyChart.update();

    // Weekly data (simple implementation)
    const weeklyData = Array(4).fill(0);
    expenses.forEach(expense => {
        const date = new Date(expense.date);
        const day = date.getDate();
        const week = Math.min(Math.floor(day / 7), 3); // Ensure week index is 0-3
        weeklyData[week] += parseFloat(expense.amount);
    });
    
    window.weeklyChart.data.datasets[0].data = weeklyData;
    window.weeklyChart.update();
}

function showAlert(message, type) {
    const alertBox = document.createElement('div');
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = message;
    
    const container = document.querySelector('.container');
    container.prepend(alertBox);
    
    setTimeout(() => {
        alertBox.remove();
    }, 5000);
}

function generateMonthOptions() {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        options.push({
            value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
            label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        });
    }
    
    return options;
}

function updateActiveFiltersDisplay() {
    const categoryFilter = document.getElementById('category-filter');
    const monthFilter = document.getElementById('month-filter');
    const activeFiltersDiv = document.getElementById('active-filters-display');
    
    if (!activeFiltersDiv) return;
    
    let filterText = '';
    
    if (categoryFilter.value !== 'all') {
        const selectedCategory = categoryFilter.options[categoryFilter.selectedIndex].text;
        filterText += `<strong>Category:</strong> ${selectedCategory} `;
    }
    
    if (monthFilter.value !== 'all') {
        const selectedMonth = monthFilter.options[monthFilter.selectedIndex].text;
        filterText += `<strong>Month:</strong> ${selectedMonth}`;
    }
    
    activeFiltersDiv.innerHTML = filterText || 'No filters applied';
}

// Initialize charts when page loads
initCharts();