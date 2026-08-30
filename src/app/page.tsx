import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function HomePage() {
  return (
    <main className="hero">
      <div className="shell">
        <div className="homeToolbar">
          <ThemeToggle />
        </div>

        <section className="heroCard">
          <div className="eyebrow">Arcade run-and-gun</div>
          <h1>RAMBO LÙN</h1>
          <p className="lead">
            Một mission 2D đi cảnh tốc độ cao: chạy, nhảy, bắn, ném lựu đạn,
            nhặt vũ khí và hạ boss cuối map.
          </p>

          <div className="actions">
            <Link className="primaryButton" href="/play">Chơi ngay</Link>
            <a className="secondaryButton" href="#details">Thông tin game</a>
          </div>

          <div id="details" className="featureGrid">
            <div className="feature">
              <strong>Vũ khí</strong>
              Glock 12 ∞ · HMG 200 · Shotgun 30 · Rocket 30.
            </div>
            <div className="feature">
              <strong>Kẻ địch</strong>
              Soldier · Grenadier · Turret · mini boss tank.
            </div>
            <div className="feature">
              <strong>Điều khiển</strong>
              J bắn · K nhảy · L ném bom · WASD / phím mũi tên di chuyển.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
