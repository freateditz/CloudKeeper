export const MegaSelectors = {
  email: [
    'input[type="email"]',
    'input[name="email"]',
    'input[aria-label="Email"]',
    '[role="textbox"][name="email"]'
  ],
  password: [
    'input[type="password"]',
    'input[name="password"]',
    'input[aria-label="Password"]'
  ],
  loginButton: [
    'button[type="submit"]',
    'button:has-text("Log in")',
    '[role="button"][name="login"]'
  ]
};
