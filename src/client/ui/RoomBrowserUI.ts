import { RoomSummary } from '../../shared/types';
import { I18n } from '../engine/I18n';

/** Shown for the "multiplayer" mode choice, before the hero-select lobby. The server pushes
 * a fresh ROOM_LIST on every create/join/leave/start (see server.ts's broadcastRoomList),
 * so this just renders whatever list it's handed — no polling needed. */
export class RoomBrowserUI {
  private root: HTMLElement;
  private rooms: RoomSummary[] = [];
  private onCreateRoom: (name: string) => void;
  private onJoinRoom: (roomId: string) => void;

  constructor(
    container: HTMLElement,
    onCreateRoom: (name: string) => void,
    onJoinRoom: (roomId: string) => void
  ) {
    this.onCreateRoom = onCreateRoom;
    this.onJoinRoom = onJoinRoom;
    this.root = document.createElement('div');
    this.root.id = 'room-browser';
    container.appendChild(this.root);
    this.render();
  }

  public destroy(): void {
    this.root.remove();
  }

  public updateRooms(rooms: RoomSummary[]): void {
    this.rooms = rooms;
    this.render();
  }

  private render(): void {
    const isTh = I18n.getLanguage() === 'th';

    const roomRows = this.rooms.length === 0
      ? `<p class="room-browser-empty">${isTh ? 'ยังไม่มีห้องเปิดอยู่ตอนนี้ — สร้างห้องแรกเลย!' : 'No rooms open yet — create the first one!'}</p>`
      : this.rooms.map((r) => `
          <div class="room-row">
            <div class="room-row-info">
              <span class="room-row-name">${r.name}</span>
              <span class="room-row-meta">${r.playerCount}/${r.maxPlayers} ${isTh ? 'คน' : 'players'}${r.isStarted ? ` · ${isTh ? 'กำลังเล่น' : 'in progress'}` : ''}</span>
            </div>
            <button class="btn room-row-join-btn" data-room-id="${r.id}" ${r.playerCount >= r.maxPlayers ? 'disabled' : ''}>
              ${r.playerCount >= r.maxPlayers ? (isTh ? 'เต็ม' : 'Full') : (isTh ? 'เข้าร่วม' : 'Join')}
            </button>
          </div>
        `).join('');

    this.root.innerHTML = `
      <div class="main-menu-backdrop">
        <div class="main-menu-panel room-browser-panel">
          <h1 class="auth-gate-title">${isTh ? 'ห้องที่เปิดอยู่' : 'Open Rooms'}</h1>

          <form id="create-room-form" class="room-browser-create-form">
            <input id="create-room-name" type="text" maxlength="24" class="account-input" placeholder="${isTh ? 'ชื่อห้อง (เว้นว่างได้)' : 'Room name (optional)'}" />
            <button type="submit" class="btn account-submit-btn">${isTh ? '+ สร้างห้องใหม่' : '+ Create Room'}</button>
          </form>

          <div class="room-browser-list">
            ${roomRows}
          </div>
        </div>
      </div>
    `;

    const form = this.root.querySelector('#create-room-form') as HTMLFormElement | null;
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (this.root.querySelector('#create-room-name') as HTMLInputElement)?.value.trim() || '';
      this.onCreateRoom(name);
    });

    this.root.querySelectorAll('.room-row-join-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const roomId = (btn as HTMLElement).dataset.roomId;
        if (roomId) this.onJoinRoom(roomId);
      });
    });
  }
}
