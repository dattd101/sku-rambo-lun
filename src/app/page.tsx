import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="hero">
      <div className="shell">
        <section className="heroCard">
          <div className="eyebrow">Next.js 15 + Phaser 3</div>
          <h1>SlugStick Mini</h1>
          <p className="lead">
            Một mission run-and-gun 2D phong cách arcade: nhân vật người que, one-hit death,
            3 mạng, 10 grenade, Pistol vô hạn và pickup H / S / R.
          </p>
          <div className="actions">
            <Link className="primaryButton" href="/play">Chơi ngay</Link>
            <a className="secondaryButton" href="#details">Thông tin MVP</a>
          </div>
          <div id="details" className="featureGrid">
            <div className="feature"><strong>Vũ khí</strong>Pistol ∞ · HMG 200 · Shotgun 30 · Rocket 30.</div>
            <div className="feature"><strong>Kẻ địch</strong>Soldier · Grenadier · Turret · mini boss tank.</div>
            <div className="feature"><strong>Deploy</strong>Push GitHub → import project vào Vercel → gắn custom domain.</div>
          </div>
        </section>
      </div>
    </main>
  );
}
