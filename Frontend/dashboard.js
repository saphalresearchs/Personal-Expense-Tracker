document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
        window.location.href = 'login.html';
        return;
    }

    // Fetch expenses from API
    fetchExpenses();

    // Initialize charts with empty data (will be updated after fetch)
    initCharts();
});

async function fetchExpenses() {
    try {
        const response = await fetch('http://127.0.0.1:8000/api/expenses/', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch expenses');
        }

        const expenses = await response.json();
        updateUI(expenses);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load expenses. Please try again.');
    }
}

function updateUI(expenses) {
    // Update summary cards
    updateSummaryCards(expenses);
    
    // Render expense cards
    renderExpenseCards(expenses);
    
    // Update charts with real data
    updateCharts(expenses);
}

function updateSummaryCards(expenses) {
    // Calculate totals
    const total = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const thisMonthTotal = expenses
        .filter(expense => new Date(expense.date).getMonth() === new Date().getMonth())
        .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    
    // Update DOM
    document.getElementById('total-spending').textContent = `$${total.toFixed(2)}`;
    document.getElementById('monthly-spending').textContent = `$${thisMonthTotal.toFixed(2)}`;
    document.getElementById('weekly-average').textContent = `$${(total / 4).toFixed(2)}`;
}

function renderExpenseCards(expenses) {
    const container = document.getElementById('expense-cards-container');
    container.innerHTML = '';

    // Sort by date (newest first)
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedExpenses.forEach(expense => {
        const card = document.createElement('div');
        card.className = 'expense-card';
        card.innerHTML = `
            <div class="actions">
                <button class="edit-btn" data-id="${expense.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${expense.id}"><i class="fas fa-trash"></i></button>
            </div>
            <h3>${expense.category}</h3>
            <div class="amount">$${parseFloat(expense.amount).toFixed(2)}</div>
            <div class="date">${new Date(expense.date).toLocaleDateString()}</div>
            <div class="description">${expense.description || 'No description'}</div>
        `;
        container.appendChild(card);
    });

    // Add event listeners for action buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const expenseId = e.target.closest('button').getAttribute('data-id');
            editExpense(expenseId);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const expenseId = e.target.closest('button').getAttribute('data-id');
            deleteExpense(expenseId);
        });
    });
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
                    beginAtZero: true
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
                    beginAtZero: true
                }
            }
        }
    });
}

function updateCharts(expenses) {
    // Group by month
    const monthlyData = Array(12).fill(0);
    expenses.forEach(expense => {
        const month = new Date(expense.date).getMonth();
        monthlyData[month] += parseFloat(expense.amount);
    });
    window.monthlyChart.data.datasets[0].data = monthlyData;
    window.monthlyChart.update();

    // Group by week (simple implementation)
    const weeklyData = Array(4).fill(0);
    expenses.forEach(expense => {
        const date = new Date(expense.date);
        const day = date.getDate();
        const week = Math.floor(day / 7);
        weeklyData[week] += parseFloat(expense.amount);
    });
    window.weeklyChart.data.datasets[0].data = weeklyData;
    window.weeklyChart.update();
}

function editExpense(expenseId) {
    // Implement edit functionality
    console.log('Edit expense:', expenseId);
    // You would typically open a modal or navigate to an edit page
}

function deleteExpense(expenseId) {
    if (confirm('Are you sure you want to delete this expense?')) {
        fetch(`http://127.0.0.1:8000/api/expenses/${expenseId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        })
        .then(response => {
            if (response.ok) {
                fetchExpenses(); // Refresh the list
            } else {
                throw new Error('Failed to delete expense');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to delete expense. Please try again.');
        });
    }
}