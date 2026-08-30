# Rambo Lùn

Mini run-and-gun 2D bằng **Next.js 15 + Phaser 3 + TypeScript**. Player và bot dùng sprite PNG cục bộ; projectile/effect dùng Phaser Graphics.

## Có sẵn

- 1 mission side-scroll dài 5200 px
- Player sprite: chạy, nhảy, cúi, bắn, ném grenade
- One-hit death, 3 lives
- 10 grenade khi bắt đầu
- Pistol vô hạn
- HMG: 200 viên
- Shotgun: 30 viên
- Rocket Launcher: 30 viên
- Bot sprite: bắn súng, ném lựu đạn, tự nhảy và tấn công trên không
- Player 50 HP: đạn bot -5 HP, lựu đạn bot -25 HP; HP về 0 mới mất 1 mạng
- Boss cuối map 100 HP, di chuyển/bắn/ném lựu đạn/nhảy né đạn
- Camera side-scroll + encounter lock
- Pickup H / S / R
- Score + high score lưu localStorage
- Game Over / Mission Complete + Enter để restart
- Responsive 16:9 canvas
- Không cần database / backend

> Ghi chú dữ liệu: ammo Pistol/HMG/Shotgun/Rocket và 10 grenade được dùng như baseline từ Metal Slug cổ điển. Các giá trị `fireRate`, `bulletSpeed`, `damage`, enemy speed và boss HP trong source là tuning riêng cho prototype web, không được mô tả là frame data chính xác từ ROM arcade.

## Yêu cầu

- Node.js 22.x
- npm

## Chạy local

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`.

Build production:

```bash
npm run build
npm start
```

## Controls

- `A` / `←`: trái
- `D` / `→`: phải
- `W` / `↑`: ngắm lên
- `S` / `↓`: cúi
- `J`: bắn
- `K`: nhảy
- `L`: ném bom
- `Enter`: chơi lại sau Game Over / Mission Complete

## GitHub

Tạo repo trống trên GitHub rồi chạy:

```bash
git init
git add .
git commit -m "Initial Rambo Lùn"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Deploy Vercel

1. Đăng nhập Vercel bằng GitHub.
2. `Add New > Project`.
3. Import repo vừa push.
4. Framework Vercel sẽ tự nhận là Next.js.
5. Build command giữ mặc định `next build`.
6. Deploy.

Mỗi lần push vào `main`, Vercel sẽ build/deploy production mới.

## Gắn custom domain

Trong Vercel project:

1. `Settings > Domains`.
2. Thêm `tenmiencuaban.com` hoặc `game.tenmiencuaban.com`.
3. Cập nhật DNS theo record Vercel hiển thị.
4. Chờ DNS verify. HTTPS được Vercel cấp tự động.

## Cấu trúc chính

```text
src/
├── app/
│   ├── page.tsx
│   └── play/page.tsx
├── components/game/
│   ├── GameClient.tsx
│   └── GameCanvas.tsx
└── game/
    ├── config/
    │   ├── level.ts
    │   └── weapons.ts
    ├── entities/
    │   ├── Boss.ts
    │   ├── Enemy.ts
    │   ├── Player.ts
    │   └── StickActor.ts
    ├── scenes/
    │   └── MissionScene.ts
    ├── utils/
    │   └── textures.ts
    └── createGame.ts
```

## Chỉnh map

Các encounter nằm tại `src/game/config/level.ts`. Bạn có thể đổi trigger, camera lock và danh sách enemy trực tiếp ở đó.

## Chỉnh súng

Ammo và tuning nằm tại `src/game/config/weapons.ts`.

## Public/commercial

Gameplay có thể lấy cảm hứng từ run-and-gun arcade, nhưng nếu public/commercial nên tiếp tục dùng tên, artwork, music, sound effect, logo, enemy design và map layout do bạn tự tạo. Project này cố ý không bundle asset có bản quyền của SNK.

## Vercel TypeScript fix

Physics collision/overlap callbacks use Phaser 3.90 Arcade Physics callback-compatible types, so production TypeScript builds do not reject `Body | StaticBody | Tile | GameObjectWithBody`.
