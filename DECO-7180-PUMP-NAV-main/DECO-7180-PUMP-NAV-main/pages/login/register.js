import '../../components/nav.js';

function handleRegister(event) {
    event.preventDefault(); // Prevent the form from submitting normally

    // Show success notification
    showNotification('Registration successful!', 'success');
    
    // Redirect to home page after a short delay
    setTimeout(() => {
        window.location.href = '../../index.html'; // Adjust this path if needed
    }, 2000); // 2 second delay before redirecting

    return false; // Prevent form from submitting
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.color = 'white';
    notification.style.fontWeight = 'bold';
    notification.style.zIndex = '1000';
    notification.style.backgroundColor = type === 'success' ? 'green' : 'red';

    // Add notification to the body
    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}

// Attach the handleRegister function to the form submission
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.querySelector('form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});