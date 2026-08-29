'use client';

import dynamic from 'next/dynamic';

const GameCanvas = dynamic(() => import('./GameCanvas'), {
  ssr: false,
  loading: () => <div className="loading">Đang nạp game…</div>,
});

export default function GameClient() {
  return (
    <div className="gameFrame">
      <GameCanvas />
    </div>
  );
}
