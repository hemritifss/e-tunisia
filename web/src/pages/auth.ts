export function renderLoginPage(): string {
  return `
    <div class="auth-page page-enter">
      <div class="auth-card">
        <div style="text-align: center; margin-bottom: var(--space-6);">
          <img src="/icon.png" alt="e-Tunisia" style="width: 56px; height: 56px; margin: 0 auto var(--space-3); display: block; border-radius: var(--radius-md);" />
        </div>
        <h2 class="auth-title">Welcome back</h2>
        <p class="auth-subtitle">Sign in to continue your Tunisian adventure</p>

        <form class="auth-form" onsubmit="event.preventDefault(); location.hash='#/';">
          <div class="input-group">
            <label class="input-label" for="email">Email</label>
            <input type="email" id="email" class="input" placeholder="you@example.com" />
          </div>
          <div class="input-group">
            <label class="input-label" for="password">Password</label>
            <input type="password" id="password" class="input" placeholder="Your password" />
          </div>
          <div class="flex justify-between items-center">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" class="text-sm text-accent">Forgot password?</a>
          </div>
          <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;">Sign In</button>
        </form>

        <div class="auth-footer">
          Don't have an account? <a href="#/register">Sign up</a>
        </div>
      </div>
    </div>
  `;
}

export function renderRegisterPage(): string {
  return `
    <div class="auth-page page-enter">
      <div class="auth-card">
        <div style="text-align: center; margin-bottom: var(--space-6);">
          <img src="/icon.png" alt="e-Tunisia" style="width: 56px; height: 56px; margin: 0 auto var(--space-3); display: block; border-radius: var(--radius-md);" />
        </div>
        <h2 class="auth-title">Join e-Tunisia</h2>
        <p class="auth-subtitle">Create your account and start exploring</p>

        <form class="auth-form" onsubmit="event.preventDefault(); location.hash='#/';">
          <div class="input-group">
            <label class="input-label" for="fullname">Full Name</label>
            <input type="text" id="fullname" class="input" placeholder="Your full name" />
          </div>
          <div class="input-group">
            <label class="input-label" for="reg-email">Email</label>
            <input type="email" id="reg-email" class="input" placeholder="you@example.com" />
          </div>
          <div class="input-group">
            <label class="input-label" for="country">Country</label>
            <input type="text" id="country" class="input" placeholder="Where are you from?" />
          </div>
          <div class="input-group">
            <label class="input-label" for="reg-password">Password</label>
            <input type="password" id="reg-password" class="input" placeholder="Create a password" />
          </div>
          <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;">Create Account</button>
        </form>

        <div class="auth-footer">
          Already have an account? <a href="#/login">Sign in</a>
        </div>
      </div>
    </div>
  `;
}

export function initAuthPage() {}
