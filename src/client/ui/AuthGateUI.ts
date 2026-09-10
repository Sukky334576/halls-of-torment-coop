import { AuthClient } from '../engine/AuthClient';
import { I18n } from '../engine/I18n';

/** Mandatory full-page login/register gate — shown before anything else loads. Unlike
 * AccountUI (an optional in-lobby modal you can close), this has no skip/guest option: the
 * app does not proceed until AuthClient.isLoggedIn() is true. See main.ts's boot sequence. */
export class AuthGateUI {
  private root: HTMLElement;
  private mode: 'login' | 'register' = 'login';
  private busy: boolean = false;
  private errorMsg: string = '';
  private onSuccess: () => void;

  constructor(container: HTMLElement, onSuccess: () => void) {
    this.onSuccess = onSuccess;
    this.root = document.createElement('div');
    this.root.id = 'auth-gate';
    container.appendChild(this.root);
    this.render();
  }

  public destroy(): void {
    this.root.remove();
  }

  private render(): void {
    const isTh = I18n.getLanguage() === 'th';
    const isLogin = this.mode === 'login';

    this.root.innerHTML = `
      <div class="auth-gate-backdrop">
        <div class="auth-gate-panel">
          <h1 class="auth-gate-title">${I18n.t('game.title')}</h1>
          <p class="auth-gate-subtitle">${isTh ? 'ต้องมีบัญชีเพื่อเข้าเล่น' : 'An account is required to play'}</p>

          <div class="account-tabs">
            <button id="gate-tab-login" class="account-tab ${isLogin ? 'active' : ''}">${isTh ? 'เข้าสู่ระบบ' : 'Log In'}</button>
            <button id="gate-tab-register" class="account-tab ${!isLogin ? 'active' : ''}">${isTh ? 'สมัครสมาชิก' : 'Register'}</button>
          </div>
          <form id="auth-gate-form">
            <input id="gate-username" type="text" autocomplete="username" placeholder="${isTh ? 'ชื่อผู้ใช้ (3-20 ตัวอักษร)' : 'Username (3-20 chars)'}" class="account-input" />
            <input id="gate-password" type="password" autocomplete="${isLogin ? 'current-password' : 'new-password'}" placeholder="${isTh ? 'รหัสผ่าน (อย่างน้อย 6 ตัว)' : 'Password (6+ chars)'}" class="account-input" />
            ${this.errorMsg ? `<p class="account-error">${this.errorMsg}</p>` : ''}
            <button type="submit" class="btn account-submit-btn" ${this.busy ? 'disabled' : ''}>
              ${this.busy ? (isTh ? 'กำลังดำเนินการ...' : 'Working...') : isLogin ? (isTh ? 'เข้าสู่ระบบ' : 'Log In') : (isTh ? 'สมัครสมาชิก' : 'Register')}
            </button>
          </form>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.root.querySelector('#gate-tab-login')?.addEventListener('click', () => {
      this.mode = 'login';
      this.errorMsg = '';
      this.render();
    });
    this.root.querySelector('#gate-tab-register')?.addEventListener('click', () => {
      this.mode = 'register';
      this.errorMsg = '';
      this.render();
    });

    const form = this.root.querySelector('#auth-gate-form') as HTMLFormElement | null;
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (this.busy) return;

      const username = (this.root.querySelector('#gate-username') as HTMLInputElement)?.value.trim() || '';
      const password = (this.root.querySelector('#gate-password') as HTMLInputElement)?.value || '';

      this.busy = true;
      this.errorMsg = '';
      this.render();

      const result = this.mode === 'login'
        ? await AuthClient.login(username, password)
        : await AuthClient.register(username, password);

      this.busy = false;
      if (!result.success) {
        this.errorMsg = result.error || 'Something went wrong';
        this.render();
        return;
      }

      this.onSuccess();
    });
  }
}
