document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('login-form');
  const alertBox = document.getElementById('alert-box');

  loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      // Clear previous alerts
      alertBox.innerHTML = '';
      alertBox.className = 'alert';
      
      // Simple validation
      if (!username || !password) {
          showAlert('Please fill in all fields', 'error');
          return;
      }

      // Disable button during request
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';

      // Prepare request data
      const requestData = {
          username: username,
          password: password
      };

      // Make API request
      fetch('http://127.0.0.1:8000/api/login/', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
      })
      .then(response => {
          if (!response.ok) {
              return response.json().then(err => { throw err; });
          }
          return response.json();
      })
      .then(data => {
          // Successful login
          showAlert('Login successful! Redirecting...', 'success');
          
          // Store tokens (you might want to use more secure storage in production)
          localStorage.setItem('access_token', data.access);
          localStorage.setItem('refresh_token', data.refresh);
          
          // Redirect to dashboard after 1.5 seconds
          setTimeout(() => {
              window.location.href = 'dashboard.html';
          }, 1500);
      })
      .catch(error => {
          // Handle errors
          let errorMessage = 'Login failed';
          if (error.detail) {
              errorMessage = error.detail;
          } else if (error.non_field_errors) {
              errorMessage = error.non_field_errors.join(' ');
          }
          showAlert(errorMessage, 'error');
      })
      .finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Login';
      });
  });

  // Helper function to show alerts
  function showAlert(message, type) {
      alertBox.textContent = message;
      alertBox.classList.add(type);
      alertBox.style.display = 'block';
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
          alertBox.style.display = 'none';
      }, 5000);
  }
});