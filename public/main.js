document.addEventListener('DOMContentLoaded', () => {
    const contentDiv = document.getElementById('content');
    const registerLink = document.getElementById('registerLink');
    const loginLink = document.getElementById('loginLink');
    const depositLink = document.getElementById('depositLink');
    const logoutLink = document.getElementById('logoutLink');

    const showRegistrationForm = () => {
        contentDiv.innerHTML = `
            <h2>Register</h2>
            <form id="registerForm">
                <div class="mb-3">
                    <label for="username" class="form-label">Username</label>
                    <input type="text" class="form-control" id="username" name="username" required>
                </div>
                <div class="mb-3">
                    <label for="email" class="form-label">Email</label>
                    <input type="email" class="form-control" id="email" name="email" required>
                </div>
                <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" class="form-control" id="password" name="password" required>
                </div>
                <button type="submit" class="btn btn-primary">Register</button>
            </form>
        `;

        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                username: e.target.username.value,
                email: e.target.email.value,
                password: e.target.password.value,
            };

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    alert('Registration successful');
                    showLoginForm(); // Navigate to login form
                } else {
                    const errorData = await response.json();
                    alert(errorData.error);
                }
            } catch (error) {
                console.error('Error during registration:', error);
                alert('Registration failed');
            }
        });
    };

    const showLoginForm = () => {
        contentDiv.innerHTML = `
            <h2>Login</h2>
            <form id="loginForm">
                <div class="mb-3">
                    <label for="email" class="form-label">Email</label>
                    <input type="email" class="form-control" id="email" name="email" required>
                </div>
                <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" class="form-control" id="password" name="password" required>
                </div>
                <button type="submit" class="btn btn-primary">Login</button>
            </form>
            <a href="#" id="forgotPasswordLink">Forgot Password?</a>
        `;

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                email: e.target.email.value,
                password: e.target.password.value,
            };

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    alert('Login successful');
                    updateNavbar(true); // Update navbar for authenticated user
                    showDepositForm(); // Navigate to deposit form
                } else {
                    const errorData = await response.json();
                    alert(errorData.error);
                }
            } catch (error) {
                console.error('Error during login:', error);
                alert('Login failed');
            }
        });

        document.getElementById('forgotPasswordLink').addEventListener('click', (e) => {
            e.preventDefault();
            showForgotPasswordForm();
        });
    };

    const showDepositForm = () => {
        contentDiv.innerHTML = `
            <h2>Deposit</h2>
            <form id="depositForm">
                <div class="mb-3">
                    <label for="amount" class="form-label">Amount</label>
                    <input type="number" class="form-control" id="amount" name="amount" required>
                </div>
                <button type="submit" class="btn btn-primary">Deposit</button>
            </form>
            <div id="depositResult">
                <h3>Deposit Information</h3>
                <p id="totalAmount"></p>
                <p id="totalProfit"></p>
            </div>
        `;

        document.getElementById('depositForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = { amount: e.target.amount.value };

            try {
                const response = await fetch('/api/deposit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    alert('Deposit successful');
                    fetchDepositInfo();
                } else {
                    const errorData = await response.json();
                    alert(errorData.error);
                }
            } catch (error) {
                console.error('Error during deposit:', error);
                alert('Deposit failed');
            }
        });

        fetchDepositInfo(); // Fetch deposit info on form display
    };

    const fetchDepositInfo = async () => {
        try {
            const response = await fetch('/api/deposit');
            if (response.ok) {
                const data = await response.json();
                document.getElementById('totalAmount').textContent = `Total Amount: $${data.amount}`;
                document.getElementById('totalProfit').textContent = `Total Profit: $${data.profitBalance}`;
            } else {
                const errorData = await response.json();
                alert(errorData.error);
            }
        } catch (error) {
            console.error('Error fetching deposit info:', error);
            alert('Failed to fetch deposit info');
        }
    };

    const showForgotPasswordForm = () => {
        contentDiv.innerHTML = `
            <h2>Forgot Password</h2>
            <form id="forgotPasswordForm">
                <div class="mb-3">
                    <label for="email" class="form-label">Email</label>
                    <input type="email" class="form-control" id="email" name="email" required>
                </div>
                <button type="submit" class="btn btn-primary">Request Password Reset</button>
            </form>
        `;

        document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = { email: e.target.email.value };

            try {
                const response = await fetch('/api/request-password-reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    alert('Password reset token sent to your email');
                    showResetPasswordForm();
                } else {
                    const errorData = await response.json();
                    alert(errorData.error);
                }
            } catch (error) {
                console.error('Error requesting password reset:', error);
                alert('Password reset request failed');
            }
        });
    };

    const showResetPasswordForm = () => {
        contentDiv.innerHTML = `
            <h2>Reset Password</h2>
            <form id="resetPasswordForm">
                <div class="mb-3">
                    <label for="token" class="form-label">Token</label>
                    <input type="text" class="form-control" id="token" name="token" required>
                </div>
                <div class="mb-3">
                    <label for="newPassword" class="form-label">New Password</label>
                    <input type="password" class="form-control" id="newPassword" name="newPassword" required>
                </div>
                <button type="submit" class="btn btn-primary">Reset Password</button>
            </form>
        `;

        document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                token: e.target.token.value,
                newPassword: e.target.newPassword.value,
            };

            try {
                const response = await fetch('/api/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    alert('Password reset successful');
                    showLoginForm(); // Navigate to login form
                } else {
                    const errorData = await response.json();
                    alert(errorData.error);
                }
            } catch (error) {
                console.error('Error resetting password:', error);
                alert('Password reset failed');
            }
        });
    };

    const logout = async () => {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
            });

            if (response.ok) {
                alert('Logged out successfully');
                updateNavbar(false); // Update navbar for unauthenticated user
                showLoginForm(); // Navigate to login form
            } else {
                const errorData = await response.json();
                alert(errorData.error);
            }
        } catch (error) {
            console.error('Error during logout:', error);
            alert('Logout failed');
        }
    };

    const updateNavbar = (isAuthenticated) => {
        if (isAuthenticated) {
            registerLink.classList.add('hidden');
            loginLink.classList.add('hidden');
            depositLink.classList.remove('hidden');
            logoutLink.classList.remove('hidden');
        } else {
            registerLink.classList.remove('hidden');
            loginLink.classList.remove('hidden');
            depositLink.classList.add('hidden');
            logoutLink.classList.add('hidden');
        }
    };

    // Initially update the navbar based on authentication status
    const checkAuthentication = async () => {
        try {
            const response = await fetch('/api/check-authentication');
            if (response.ok) {
                const { isAuthenticated } = await response.json();
                updateNavbar(isAuthenticated);
                if (isAuthenticated) {
                    showDepositForm();
                } else {
                    showLoginForm();
                }
            } else {
                updateNavbar(false);
                showLoginForm();
            }
        } catch (error) {
            console.error('Error checking authentication:', error);
            updateNavbar(false);
            showLoginForm();
        }
    };

    checkAuthentication();

    // Attach event listeners to navbar links
    registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        showRegistrationForm();
    });

    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });

    depositLink.addEventListener('click', (e) => {
        e.preventDefault();
        showDepositForm();
    });

    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
});
