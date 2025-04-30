// DOM Elements
const registerForm = document.getElementById('register-form');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const alertBox = document.getElementById('alert-box');

// Function to show alert messages
function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = `alert ${type}`;
    alertBox.style.display = 'block';
    
    // Hide the alert after 5 seconds
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 5000);
}

// Function to validate form
function validateForm() {
    // Check if passwords match
    if (passwordInput.value !== confirmPasswordInput.value) {
        showAlert('Passwords do not match', 'alert-danger');
        return false;
    }
    
    // Check password length
    if (passwordInput.value.length < 8) {
        showAlert('Password must be at least 8 characters', 'alert-danger');
        return false;
    }
    
    return true;
}

// Function to handle registration
async function registerUser(username, email, password) {
    try {
        const response = await fetch('http://127.0.0.1:8000/api/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                password
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            // Handle server errors or validation errors
            let errorMessage = 'Registration failed';
            
            if (data.username) {
                errorMessage = `Username error: ${data.username}`;
            } else if (data.email) {
                errorMessage = `Email error: ${data.email}`;
            } else if (data.password) {
                errorMessage = `Password error: ${data.password}`;
            } else if (data.non_field_errors) {
                errorMessage = data.non_field_errors;
            }
            
            throw new Error(errorMessage);
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

// Event Listener for Form Submission
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    try {
        // Show loading state
        const submitButton = registerForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = 'Registering...';
        submitButton.disabled = true;
        
        // Call API
        const userData = await registerUser(
            usernameInput.value,
            emailInput.value,
            passwordInput.value
        );
        
        // Registration successful
        showAlert('Registration successful! Redirecting to login...', 'alert-success');
        
        // Store user data in localStorage (not the password)
        localStorage.setItem('userId', userData.id);
        localStorage.setItem('username', userData.username);
        
        // Redirect to login page after 2 seconds
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        
    } catch (error) {
        // Show error message
        showAlert(error.message, 'alert-danger');
        
        // Reset button state
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    }
});