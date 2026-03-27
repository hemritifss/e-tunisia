export function renderSettingsPage(): string {
  return `
    <div class="settings-page page-enter">
      <a href="#/profile" class="btn btn-ghost" style="margin-bottom: var(--space-4);">
        <i class="lucide-arrow-left"></i> Back
      </a>

      <h2 style="margin-bottom: var(--space-6);">Settings</h2>

      <div class="settings-group">
        <div class="settings-group-title">Appearance</div>
        <div class="settings-item">
          <div>
            <div class="settings-item-label">Dark Mode</div>
            <div class="settings-item-desc">Switch between light and dark themes</div>
          </div>
          <label class="toggle">
            <input type="checkbox" id="settings-dark-mode" />
            <span class="toggle-track"></span>
            <span class="toggle-thumb"></span>
          </label>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Language</div>
        <div class="settings-item">
          <div>
            <div class="settings-item-label">Display Language</div>
            <div class="settings-item-desc">Choose your preferred language</div>
          </div>
          <select class="input" style="width: auto; padding: var(--space-2) var(--space-3);">
            <option>English</option>
            <option>Francais</option>
          </select>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Notifications</div>
        <div class="settings-item">
          <div>
            <div class="settings-item-label">Push Notifications</div>
            <div class="settings-item-desc">Receive alerts for new events and tips</div>
          </div>
          <label class="toggle">
            <input type="checkbox" checked />
            <span class="toggle-track"></span>
            <span class="toggle-thumb"></span>
          </label>
        </div>
        <div class="settings-item">
          <div>
            <div class="settings-item-label">Email Digest</div>
            <div class="settings-item-desc">Weekly summary of popular posts</div>
          </div>
          <label class="toggle">
            <input type="checkbox" />
            <span class="toggle-track"></span>
            <span class="toggle-thumb"></span>
          </label>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Account</div>
        <div class="settings-item">
          <div>
            <div class="settings-item-label">Edit Profile</div>
            <div class="settings-item-desc">Update your name, photo, and bio</div>
          </div>
          <button class="btn btn-sm btn-secondary">Edit</button>
        </div>
        <div class="settings-item">
          <div>
            <div class="settings-item-label text-danger">Delete Account</div>
            <div class="settings-item-desc">Permanently delete your account and data</div>
          </div>
          <button class="btn btn-sm btn-secondary text-danger">Delete</button>
        </div>
      </div>
    </div>
  `;
}

export function initSettingsPage() {
  const darkToggle = document.getElementById('settings-dark-mode') as HTMLInputElement;
  if (darkToggle) {
    darkToggle.checked = document.documentElement.dataset.theme === 'dark';
    darkToggle.addEventListener('change', () => {
      const theme = darkToggle.checked ? 'dark' : 'light';
      document.documentElement.dataset.theme = theme;
      localStorage.setItem('theme', theme);
      const icon = document.getElementById('theme-icon');
      if (icon) {
        icon.className = theme === 'dark' ? 'lucide-sun' : 'lucide-moon';
      }
    });
  }
}
