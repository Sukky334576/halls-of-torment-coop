import { AuthClient } from '../engine/AuthClient';
import { MetaProgression } from '../engine/MetaProgression';
import { SoundManager } from '../engine/SoundManager';
import { I18n } from '../engine/I18n';

/** Opt-in account system — logging in/registering is never required to play; guests keep
 * using localStorage exactly as before this existed (see AuthClient/MetaProgression). */
export class AccountUI {
  private container: HTMLElement;
  private root: HTMLElement;
  private sound: SoundManager | null = null;
  private mode: 'login' | 'register' = 'login';
  private busy: boolean = false;
  private errorMsg: string = '';
  public onProgressionSynced?: () => void;

  constructor(container: HTMLElement, sound?: SoundManager) {
    this.container = container;
    this.sound = sound || null;

    this.root = document.createElement('div');
    this.root.id = 'account-modal';
    this.root.className = 'meta-modal-backdrop';
    this.root.style.display = 'none';
    this.container.appendChild(this.root);

    this.render();
  }

  public show(): void {
    this.mode = 'login';
    this.errorMsg = '';
    this.render();
    this.root.style.display = 'flex';
    this.sound?.playClick();
  }

  public hide(): void {
    this.root.style.display = 'none';
    this.sound?.playClick();
  }

  private render(): void {
    const isTh = I18n.getLanguage() === 'th';
    const loggedIn = AuthClient.isLoggedIn();

    this.root.innerHTML = loggedIn
      ? this.renderLoggedIn(isTh)
      : this.renderLoginForm(isTh);

    this.bindEvents();
  }

  private renderLoggedIn(isTh: boolean): string {
    const username = AuthClient.getUsername() || '?';
    return `
      <div class="meta-modal-panel account-modal-panel">
        <div class="meta-modal-header">
          <div class="modal-title-group">
            <span class="modal-icon">👤</span>
            <div>
              <h2 class="modal-title">${isTh ? 'บัญชีผู้เล่น' : 'ACCOUNT'}</h2>
              <span class="modal-subtitle">${isTh ? 'เข้าสู่ระบบแล้ว ความคืบหน้าจะซิงค์อัตโนมัติ' : 'Logged in — progress syncs automatically'}</span>
            </div>
          </div>
          <button id="btn-close-account" class="btn-modal-close" title="Close">✕</button>
        </div>
        <div class="account-body">
          <p class="account-welcome">${isTh ? 'สวัสดี' : 'Welcome'}, <strong>${username}</strong></p>
          <button id="btn-account-logout" class="btn account-submit-btn">${isTh ? 'ออกจากระบบ' : 'Log Out'}</button>
        </div>
      </div>
    `;
  }

  private renderLoginForm(isTh: boolean): string {
    const isLogin = this.mode === 'login';
    return `
      <div class="meta-modal-panel account-modal-panel">
        <div class="meta-modal-header">
          <div class="modal-title-group">
            <span class="modal-icon">👤</span>
            <div>
              <h2 class="modal-title">${isTh ? 'บัญชีผู้เล่น' : 'ACCOUNT'}</h2>
              <span class="modal-subtitle">${isTh ? 'เข้าสู่ระบบเพื่อเล่นข้ามเครื่องได้ (ไม่บังคับ)' : 'Log in to sync your progress across devices (optional)'}</span>
            </div>
          </div>
          <button id="btn-close-account" class="btn-modal-close" title="Close">✕</button>
        </div>
        <div class="account-body">
          <div class="account-tabs">
            <button id="btn-tab-login" class="account-tab ${isLogin ? 'active' : ''}">${isTh ? 'เข้าสู่ระบบ' : 'Log In'}</button>
            <button id="btn-tab-register" class="account-tab ${!isLogin ? 'active' : ''}">${isTh ? 'สมัครสมาชิก' : 'Register'}</button>
          </div>
          <form id="account-form">
            <input id="account-username" type="text" autocomplete="username" placeholder="${isTh ? 'ชื่อผู้ใช้ (3-20 ตัวอักษร)' : 'Username (3-20 chars)'}" class="account-input" />
            <input id="account-password" type="password" autocomplete="${isLogin ? 'current-password' : 'new-password'}" placeholder="${isTh ? 'รหัสผ่าน (อย่างน้อย 6 ตัว)' : 'Password (6+ chars)'}" class="account-input" />
            ${
              !isLogin
                ? `<p class="account-hint">${isTh ? 'ความคืบหน้าปัจจุบันในเครื่องนี้จะถูกใช้เป็นจุดเริ่มต้นของบัญชีใหม่' : 'Your current progress on this device becomes this new account’s starting point'}</p>`
                : `<p class="account-hint">${isTh ? 'ความคืบหน้าที่บันทึกไว้ในบัญชีจะแทนที่ข้อมูลในเครื่องนี้' : 'Your account’s saved progress will replace what’s on this device'}</p>`
            }
            ${this.errorMsg ? `<p class="account-error">${this.errorMsg}</p>` : ''}
            <button type="submit" class="btn account-submit-btn" ${this.busy ? 'disabled' : ''}>
              ${this.busy ? (isTh ? 'กำลังดำเนินการ...' : 'Working...') : isLogin ? (isTh ? 'เข้าสู่ระบบ' : 'Log In') : (isTh ? 'สมัครสมาชิก' : 'Register')}
            </button>
          </form>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    this.root.querySelector('#btn-close-account')?.addEventListener('click', () => this.hide());
    this.root.querySelector('#btn-account-logout')?.addEventListener('click', () => {
      AuthClient.logout();
      this.render();
    });
    this.root.querySelector('#btn-tab-login')?.addEventListener('click', () => {
      this.mode = 'login';
      this.errorMsg = '';
      this.render();
    });
    this.root.querySelector('#btn-tab-register')?.addEventListener('click', () => {
      this.mode = 'register';
      this.errorMsg = '';
      this.render();
    });

    const form = this.root.querySelector('#account-form') as HTMLFormElement | null;
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (this.busy) return;

      const username = (this.root.querySelector('#account-username') as HTMLInputElement)?.value.trim() || '';
      const password = (this.root.querySelector('#account-password') as HTMLInputElement)?.value || '';

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

      await MetaProgression.syncFromServer();
      this.onProgressionSynced?.();
      this.render();
    });
  }
}
