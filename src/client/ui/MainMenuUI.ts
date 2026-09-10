import { AuthClient } from '../engine/AuthClient';
import { I18n } from '../engine/I18n';

export type GameMode = 'solo' | 'multiplayer';

/** Shown right after the auth gate succeeds, before the hero-select lobby. Both choices lead
 * to the same lobby/server today (see LobbyUI's `mode` param) — "solo" just hides the party
 * panel and skips the ready-up step, since there's no one else to coordinate with. No
 * offline/embedded-server work here; this is purely a menu/flow distinction. */
export class MainMenuUI {
  private root: HTMLElement;
  private onChoose: (mode: GameMode) => void;

  constructor(container: HTMLElement, onChoose: (mode: GameMode) => void) {
    this.onChoose = onChoose;
    this.root = document.createElement('div');
    this.root.id = 'main-menu';
    container.appendChild(this.root);
    this.render();
  }

  public destroy(): void {
    this.root.remove();
  }

  private render(): void {
    const isTh = I18n.getLanguage() === 'th';
    const username = AuthClient.getUsername() || '?';

    this.root.innerHTML = `
      <div class="main-menu-backdrop">
        <div class="main-menu-panel">
          <h1 class="auth-gate-title">${I18n.t('game.title')}</h1>
          <p class="main-menu-welcome">${isTh ? 'สวัสดี' : 'Welcome'}, <strong>${username}</strong></p>

          <div class="main-menu-actions">
            <button id="btn-mode-solo" class="btn main-menu-btn">
              <span class="main-menu-btn-icon">🗡️</span>
              <span class="main-menu-btn-label">${isTh ? 'เล่นคนเดียว' : 'Single Player'}</span>
            </button>
            <button id="btn-mode-multiplayer" class="btn main-menu-btn">
              <span class="main-menu-btn-icon">👥</span>
              <span class="main-menu-btn-label">${isTh ? 'เล่นหลายคน' : 'Multiplayer'}</span>
            </button>
          </div>

          <button id="btn-menu-logout" class="main-menu-logout">${isTh ? 'ออกจากระบบ' : 'Log Out'}</button>
        </div>
      </div>
    `;

    this.root.querySelector('#btn-mode-solo')?.addEventListener('click', () => this.onChoose('solo'));
    this.root.querySelector('#btn-mode-multiplayer')?.addEventListener('click', () => this.onChoose('multiplayer'));
    this.root.querySelector('#btn-menu-logout')?.addEventListener('click', () => {
      AuthClient.logout();
      window.location.reload();
    });
  }
}
