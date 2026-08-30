import Link from 'next/link';
import GameClient from '@/components/game/GameClient';

export default function PlayPage() {
  return (
    <main className="playPage">
      <div className="shell">
        <header className="playHeader">
          <div>
            <div className="eyebrow">Mission 01</div>
            <h1>SlugStick Mini</h1>
          </div>
          <Link className="backLink" href="/">← Trang chủ</Link>
        </header>

        <GameClient />

        <section className="controlsCard">
          <div className="panel">
            <strong>Điều khiển</strong>
            <div className="keyRow">
              <span><kbd>A</kbd>/<kbd>←</kbd> trái</span>
              <span><kbd>D</kbd>/<kbd>→</kbd> phải</span>
              <span><kbd>W</kbd>/<kbd>↑</kbd> ngắm lên</span>
              <span><kbd>S</kbd>/<kbd>↓</kbd> cúi</span>
              <span><kbd>J</kbd> bắn</span>
              <span><kbd>K</kbd> nhảy</span>
              <span><kbd>L</kbd> ném bom</span>
            </div>
          </div>
          <div className="panel">
            <strong>Mục tiêu</strong><br />Đi sang phải, dọn các encounter bị khóa camera và hạ tank cuối map.
            High score được lưu bằng localStorage trên trình duyệt.
          </div>
        </section>
      </div>
    </main>
  );
}
