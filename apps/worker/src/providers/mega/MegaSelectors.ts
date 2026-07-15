export const MegaSelectors = {
  email: [
    'input[name="login-name3"]',
    '#login-name3'
  ],
  password: [
    'input[name="login-password3"]',
    '#login-password3'
  ],
  // Note: We use getByRole('button', { name: 'Log in' }) directly in the executor
  loginButton: [
    'button[type="submit"]',
    'button:has-text("Log in")',
    '.login-button',
    '[role="button"][name="login"]'
  ]
};
