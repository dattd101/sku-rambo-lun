'use client';

import { useEffect, useRef } from 'react';

export default function GameCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let game: import('phaser').Game | null = null;
    let cancelled = false;

    async function boot() {
      if (!mountRef.current) return;
      const { createGame } = await import('@/game/createGame');
      if (cancelled || !mountRef.current) return;
      game = createGame(mountRef.current);
    }

    void boot();

    return () => {
      cancelled = true;
      game?.destroy(true);
      game = null;
    };
  }, []);

  return <div ref={mountRef} className="gameMount" aria-label="Rambo Lùn game canvas" />;
}
