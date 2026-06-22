/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum GameStage {
  EGG = 'EGG',                           // Giai đoạn trứng đang phát triển (5s)
  CATERPILLAR = 'CATERPILLAR',           // Giai đoạn sâu đo ăn lá
  TRANSITION_TO_COCOON = 'TRANSITION',   // Hoạt cảnh sâu bò lên cành làm kén
  COCOON = 'COCOON',                     // Giai đoạn kén đếm ngược (60s)
  HATCHING = 'HATCHING',                 // Hoạt cảnh kén nứt rung lắc và nở bùng
  MOTH = 'MOTH',                         // Giai đoạn bướm đêm bay thụ phấn 5 hoa
  MATING = 'MATING',                     // Giai đoạn giao phối (10s)
  EGG_LAYING = 'EGG_LAYING',             // Giai đoạn đẻ trứng trên lá cây
  DEATH = 'DEATH',                       // Giai đoạn bướm chết và linh hồn bay lên thiên đường
  GAME_OVER = 'GAME_OVER',               // Thua cuộc do hết mạng
  VICTORY = 'VICTORY',                   // Chiến thắng hoàn thành vòng đời đầy đủ
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type?: 'pixel' | 'sparkle' | 'leaf' | 'cloud' | 'silk' | 'pollen' | 'sonar' | 'bubble';
}

export interface Leaf {
  id: number;
  x: number;
  y: number;
  size: number;
  points: number; // Điểm khi ăn leaf
  scale: number;  // Hiệu ứng xuất hiện
  growing: boolean;
}

export interface Flower {
  id: number;
  x: number;
  y: number;
  color: string;
  centerColor: string;
  name: string;
  petalCount: number;
  size: number;
  glowProgress: number; // Phát sáng khi bướm đậu lên hút mật
  pollinated: boolean;  // Đã được thụ phấn thành công chưa
  pollinateProgress: number; // Tiến độ thụ phấn hiện tại (0 -> 100)
}

export interface CompanionMoth {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  wingSpeed: number;
  wingAngle: number;
  color: string;
  size: number;
}

export interface Predator {
  id: number;
  type: 'BIRD' | 'BAT';
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  angle: number;
  wingAngle: number;
  state: 'WANDERING' | 'CHASING';
  warningActive?: boolean;
  sonarProgress?: number; // Dành cho Dơi phát sóng siêu âm
}

export interface SpiderWeb {
  id: number;
  x: number;
  y: number;
  size: number;
  hasSpider: boolean;
  spiderWingAngle?: number;
}

export interface PollenGold {
  id: number;
  x: number;
  y: number;
  vy: number;
  size: number;
  color: string;
  points: number;
}

