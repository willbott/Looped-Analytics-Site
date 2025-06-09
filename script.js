// other.js
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.custom-navbar');
    if (window.scrollY > 50) {
      navbar.classList.add('transparent-bg');
    } else {
      navbar.classList.remove('transparent-bg');
    }
});

document.querySelectorAll('.dropdown').forEach(dropdown => {
    const menu = dropdown.querySelector('.dropdown-menu');
  
    dropdown.addEventListener('hide.bs.dropdown', (event) => {
      event.preventDefault(); // stop immediate hide
      
      menu.classList.remove('show'); // start fade out animation
  
      setTimeout(() => {
        // Now hide for real by Bootstrap
        dropdown.classList.remove('show');
        menu.style.display = 'none'; // Bootstrap's usual hide method
        // Manually trigger Bootstrap's internal state change
        // or simulate if needed (usually Bootstrap will handle it after this)
      }, 300); // match with CSS transition time
    });
  
    dropdown.addEventListener('show.bs.dropdown', () => {
      menu.style.display = 'block'; // show instantly for fade in
      setTimeout(() => {
        menu.classList.add('show'); // start fade in animation
      }, 10);
    });
});

window.addEventListener('load', () => {
    const wrapper = document.querySelector('.main-wrapper');
    if (wrapper) {
      wrapper.classList.add('visible');
    }
});

window.addEventListener('load', async () => {
    try {
      const res = await fetch(`http://localhost:3000/auth/check`, {
        method: 'GET',
        credentials: 'include'  // <--- this sends cookies
      });
      if (res.ok) {
        const data = await res.json();
        console.log('User remembered:', data.userId);
        // Update UI for logged-in user here
        window.location.href = 'analytics.html';
      } else {
        console.log('User not logged in');
      }
    } catch (e) {
      console.error('Error checking login:', e);
    }
});

function sendNotification(message, isError = false, duration = 4000) {
    const container = document.getElementById('notifications-container');
  
    // Create notification element
    const notification = document.createElement('div');
    notification.classList.add('notification');
    if (isError) notification.classList.add('error');
    notification.textContent = message;
  
    // Append notification to container
    container.appendChild(notification);
  
    // Remove notification after duration with slide-up animation
    setTimeout(() => {
      notification.style.animation = 'slideUpFadeOut 0.4s forwards';
      notification.addEventListener('animationend', () => {
        notification.remove();
      });
    }, duration);
}

// login.js

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent actual form submission

    console.log('Frontend received');

    const email = document.getElementById('inputEmail').value.trim();
    const password = document.getElementById('inputPassword').value.trim();
    const rememberMe = document.getElementById('rememberMe').checked;

    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }
    
    // Simple email validation (basic)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }
    
    // Send data
    try {
        const response = await fetch('http://localhost:3000/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username: email, password, rememberMe }) // make sure keys match your backend
        });
        
        const data = await response.json();
        const messageEl = document.getElementById('message');
      
        if (response.ok) {
            sendNotification('Login Successful!');
            window.location.href = 'analytics.html';
          } else {
            sendNotification('Login failed: Incorrect password.', true);
          }
        } catch (error) {
            sendNotification('An error occurred: ' + error.message, true);
        }
});

document.getElementById('forgotPasswordForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const emailInput = document.getElementById('resetEmail');
    const email = emailInput.value.trim();
  
    if (!email) {
      alert('Please enter your email address.');
      return;
    }
  
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }
  
    // Simulate sending reset link
    alert(`If an account with ${email} exists, a password reset link will be sent.`);
  
    // Reset and close modal
    emailInput.value = '';
    const modalEl = document.getElementById('forgotPasswordModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
})