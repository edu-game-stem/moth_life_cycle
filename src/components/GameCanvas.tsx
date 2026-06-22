/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameStage, Particle, Leaf, Flower, CompanionMoth, Predator, SpiderWeb, PollenGold } from '../types';
import { audio } from '../utils/audio';
import { Volume2, VolumeX, RotateCcw, Award, Shield, Zap, Heart, Sparkles, Timer, Bug, Skull } from 'lucide-react';
import VictoryPopup from './VictoryPopup';
import GameOverPopup from './GameOverPopup';

interface GameCanvasProps {
  stage: GameStage;
  setStage: (stage: GameStage) => void;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  energy: number;
  setEnergy: React.Dispatch<React.SetStateAction<number>>;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  onReset: () => void;
}

export default function GameCanvas({
  stage,
  setStage,
  score,
  setScore,
  energy,
  setEnergy,
  isMuted,
  setIsMuted,
  onReset,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mạng sống & Thụ phấn mới
  const [lives, setLives] = useState<number>(3);
  const [pollinatedCount, setPollinatedCount] = useState<number>(0);
  const [survivalSecs, setSurvivalSecs] = useState<number>(0);
  const [speedBoostLeft, setSpeedBoostLeft] = useState<number>(0);
  const [hasShield, setHasShield] = useState<boolean>(false);
  const [hudMessage, setHudMessage] = useState<string>('Chào mừng bạn tới thế giới bướm đêm!');

  // Ref mirrors to avoid stale closures and infinite loop re-renders
  const stageRef = useRef<GameStage>(stage);
  const hasShieldRef = useRef<boolean>(hasShield);
  const speedBoostLeftRef = useRef<number>(speedBoostLeft);
  const survivalSecsRef = useRef<number>(survivalSecs);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    hasShieldRef.current = hasShield;
  }, [hasShield]);

  useEffect(() => {
    speedBoostLeftRef.current = speedBoostLeft;
  }, [speedBoostLeft]);

  useEffect(() => {
    survivalSecsRef.current = survivalSecs;
  }, [survivalSecs]);

  // Keyboard controls state
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  
  // Game coordinates and movement physics
  const caterpillarPos = useRef({ x: 200, y: 500 });
  const caterpillarAngle = useRef(0);
  const caterpillarMoveProgress = useRef(0); // Uốn lượn thớ cơ sâu đo
  const caterpillarTarget = useRef<{ x: number; y: number } | null>(null);

  // Biological Stage Timers & Parameters
  const leavesEatenCount = useRef(0);
  const eggTimer = useRef(0); // 5s timer (300 frames) for EGG stage
  const matingTimer = useRef(0); // 10s timer (600 frames)
  const mateMoth = useRef({ x: 850, y: 150, angle: Math.PI, wingAngle: 0, wingSpeed: 0.2 });
  const eggLayingTimer = useRef(0);
  const laidEggsCount = useRef(0);
  const laidEggsList = useRef<{ x: number; y: number; scale: number; glow: number }[]>([]);
  const dyingTimer = useRef(0);
  const mothDyingAlpha = useRef(1);
  const angelSoul = useRef({ x: 400, y: 560, wingAngle: 0, opacity: 0, active: false });
  const floatingTexts = useRef<{ x: number; y: number; text: string; opacity: number; timer: number }[]>([]);

  // Cocoon settings
  const cocoonCountdown = useRef(60); // 60 seconds
  const cocoonTargetPos = { x: 400, y: 220 }; // Treo kén dưới cành cây
  const cocoonSwingAngle = useRef(0);
  const cocoonSwingVol = useRef(0); // Lực đung đưa tăng lên khi click
  const lastTimeTick = useRef<number>(0);
  const isTransitionStarted = useRef(false);

  // Moth settings
  const mothPos = useRef({ x: 400, y: 220 });
  const mothTargetPos = useRef({ x: 400, y: 300 });
  const mothAngle = useRef(0);
  const mothWingAngle = useRef(0);
  const mothVelocity = useRef({ x: 0, y: 0 });
  const mothTrail = useRef<{ x: number; y: number }[]>([]);
  const companionMoths = useRef<CompanionMoth[]>([]);

  // Hút mật & Thụ phấn
  const activeFlowerId = useRef<number | null>(null);
  const activeFlowerTimer = useRef<number>(0); // 3 giây (60 frames/sec * 3 = 180)

  // Mạng nhện quấn
  const trappedInWebId = useRef<number | null>(null);
  const trapEscapeLeftTime = useRef<number>(0); // 120 frames (2 seconds)
  const isWebStruggling = useRef<boolean>(false);

  // Bất tử tạm thời sau khi bị dơi chim tóm mệt mỏi
  const respawnInvulnerableTimer = useRef<number>(0);

  // Kẻ săn mồi & Mạng nhện & Phấn hoa vàng rơi
  const predators = useRef<Predator[]>([]);
  const spiderWebs = useRef<SpiderWeb[]>([]);
  const goldenPollens = useRef<PollenGold[]>([]);

  // Entities array
  const leaves = useRef<Leaf[]>([]);
  const flowers = useRef<Flower[]>([]);
  const particles = useRef<Particle[]>([]);
  const nextParticleId = useRef(0);
  
  // Frame control & Time tracking
  const animationFrameId = useRef<number | null>(null);
  const gameTime = useRef(0);
  const gameStartTimeRef = useRef<number>(0);
  const nearPredatorAlert = useRef<boolean>(false);

  // Mouse absolute offset inside canvas to track pointers for Caterpillar or Moth
  const mousePosInCanvas = useRef({ x: 400, y: 300 });

  // Reset the stats for Moth gameplay
  const resetMothGameplay = () => {
    setLives(3);
    setPollinatedCount(0);
    setSurvivalSecs(0);
    setSpeedBoostLeft(0);
    setHasShield(false);
    activeFlowerId.current = null;
    activeFlowerTimer.current = 0;
    trappedInWebId.current = null;
    trapEscapeLeftTime.current = 0;
    respawnInvulnerableTimer.current = 0;
    goldenPollens.current = [];
    setHudMessage('Cánh mới đã mở! Hãy bắt đầu thụ phấn cho 5 bông hoa thơm mát!');
    gameStartTimeRef.current = Date.now();

    // Khởi sinh Nhện & Kẻ thù rình rập
    spiderWebs.current = [
      { id: 1, x: 180, y: 350, size: 70, hasSpider: true },
      { id: 2, x: 620, y: 380, size: 70, hasSpider: true },
    ];

    predators.current = [
      { id: 1, type: 'BIRD', x: -50, y: 150, vx: 2, vy: 0.5, size: 20, angle: 0, wingAngle: 0, state: 'WANDERING' }
    ];
  };

  // Initialize entities once
  const initEntities = () => {
    // Reset biological stages states and refs
    leavesEatenCount.current = 0;
    eggTimer.current = 0;
    matingTimer.current = 0;
    eggLayingTimer.current = 0;
    laidEggsCount.current = 0;
    laidEggsList.current = [];
    dyingTimer.current = 0;
    mothDyingAlpha.current = 1;
    angelSoul.current = { x: 400, y: 560, wingAngle: 0, opacity: 0, active: false };
    floatingTexts.current = [];

    // Lá cây ngẫu nhiên rải rác đồi cỏ (Y: 440 -> 540)
    const initialLeaves: Leaf[] = [];
    for (let i = 0; i < 5; i++) {
      initialLeaves.push({
        id: i,
        x: 100 + Math.random() * 600,
        y: 440 + Math.random() * 80,
        size: 14 + Math.random() * 8,
        points: 10,
        scale: 1,
        growing: false,
      });
    }
    leaves.current = initialLeaves;

    // Các bông hoa bừng nở từ các bụi cỏ - NGẪU NHIÊN VỊ TRÍ để làm mới trò chơi hoàn toàn!
    const flowerColors = ['#f43f5e', '#d946ef', '#f59e0b', '#3b82f6', '#ec4899'];
    const flowerCenterColors = ['#fef08a', '#ffffff', '#ef4444', '#fef08a', '#fef08a'];
    const flowerNames = ['Hoa Hồng Đỏ', 'Hoa Tím Mơ', 'Hoa Cúc Vàng', 'Hoa Chuông Xanh', 'Hoa Tulip Hồng'];
    const flowerPetalCounts = [5, 6, 8, 4, 5];
    const flowerSizes = [18, 16, 19, 17, 16];
    
    // Tạo 5 tọa độ X rời rạc, không xếp chồng
    const xs = [120, 260, 400, 540, 680].map(base => base + (Math.random() - 0.5) * 60);
    flowers.current = xs.map((x, idx) => ({
      id: idx + 1,
      x,
      y: 500 + Math.random() * 50,
      color: flowerColors[idx],
      centerColor: flowerCenterColors[idx],
      name: flowerNames[idx],
      petalCount: flowerPetalCounts[idx],
      size: flowerSizes[idx],
      glowProgress: 0,
      pollinated: false,
      pollinateProgress: 0
    }));

    // Tạo bướm đêm đồng hành
    const companions: CompanionMoth[] = [];
    const colors = ['#a5f3fc', '#fbcfe8', '#fef08a', '#c7d2fe', '#bbf7d0'];
    for (let i = 0; i < 6; i++) {
      companions.push({
        id: i,
        x: cocoonTargetPos.x + (Math.random() - 0.5) * 400,
        y: cocoonTargetPos.y + (Math.random() - 0.5) * 300,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        targetX: 400,
        targetY: 300,
        wingSpeed: 0.15 + Math.random() * 0.15,
        wingAngle: 0,
        color: colors[i % colors.length],
        size: 8 + Math.random() * 6,
      });
    }
    companionMoths.current = companions;
    particles.current = [];
  };

  useEffect(() => {
    initEntities();
    audio.setMute(isMuted);

    if (!isMuted) {
      audio.startBgm();
    }

    return () => {
      audio.stopBgm();
    };
  }, []);

  // Reset toàn bộ tài nguyên, hoa, lá và trạng thái game khi quay về giai đoạn Trứng (Reset/Chơi lại)
  useEffect(() => {
    if (stage === GameStage.EGG) {
      initEntities();
      setLives(3);
      setPollinatedCount(0);
      setSurvivalSecs(0);
      setSpeedBoostLeft(0);
      setHasShield(false);
      activeFlowerId.current = null;
      activeFlowerTimer.current = 0;
      trappedInWebId.current = null;
      trapEscapeLeftTime.current = 0;
      respawnInvulnerableTimer.current = 0;
      goldenPollens.current = [];
      setHudMessage('Chào mừng bạn tới thế giới bướm đêm!');
    }
  }, [stage]);

  // Sync mute state
  useEffect(() => {
    audio.setMute(isMuted);
  }, [isMuted]);

  // Listener keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = true;
      
      if (e.key === ' ' && stageRef.current === GameStage.COCOON) {
        handleCocoonTap();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Sinh thêm lá (Caterpillar Stage)
  const spawnLeafIfNeeded = () => {
    const activeLeaves = leaves.current.filter(l => l.scale > 0);
    if (activeLeaves.length < 4 && stageRef.current === GameStage.CATERPILLAR) {
      const newId = Date.now() + Math.random();
      leaves.current.push({
        id: newId,
        x: 80 + Math.random() * 640,
        y: 430 + Math.random() * 100,
        size: 12 + Math.random() * 10,
        points: 10,
        scale: 0.05,
        growing: true,
      });
    }
  };

  // Thêm particle bùng nổ / lấp lánh
  const addParticles = (
    x: number,
    y: number,
    color: string,
    count: number,
    type: 'pixel' | 'sparkle' | 'leaf' | 'cloud' | 'silk' | 'pollen' | 'sonar' | 'bubble' = 'pixel',
    customSpeedMultiplier = 1
  ) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.5 + Math.random() * 2.5) * customSpeedMultiplier;
      nextParticleId.current++;
      particles.current.push({
        id: nextParticleId.current,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'sparkle' || type === 'pollen' ? 0.35 : 0),
        color,
        size: type === 'pixel' ? 2 + Math.random() * 4 : 1.5 + Math.random() * 3,
        life: 0,
        maxLife: 20 + Math.random() * 25,
        type,
      });
    }
  };

  // Tap/Click kén để rút ngắn countdown
  const handleCocoonTap = () => {
    if (stageRef.current !== GameStage.COCOON) return;
    cocoonSwingVol.current = Math.min(cocoonSwingVol.current + 0.35, 1.2);
    cocoonCountdown.current = Math.max(cocoonCountdown.current - 1.5, 0); // Giảm 1.5 giây
    audio.playCrack();
    addParticles(cocoonTargetPos.x, cocoonTargetPos.y + 40, '#f5f5f5', 8, 'silk');
    addParticles(cocoonTargetPos.x, cocoonTargetPos.y + 50, '#fef08a', 4, 'sparkle');
  };

  // Mouse Move & Click handlers
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    
    mousePosInCanvas.current = { x, y };
    
    if (stageRef.current === GameStage.CATERPILLAR) {
      caterpillarTarget.current = { x, y };
    } else if (stageRef.current === GameStage.MOTH) {
      mothTargetPos.current = { x, y };
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (stageRef.current === GameStage.COCOON) {
      const distToCocoon = Math.hypot(x - cocoonTargetPos.x, y - (cocoonTargetPos.y + 45));
      if (distToCocoon < 45) {
        handleCocoonTap();
      }
    } else if (stageRef.current === GameStage.CATERPILLAR) {
      caterpillarTarget.current = { x, y };
    } else if (stageRef.current === GameStage.MOTH) {
      mothTargetPos.current = { x, y };
    }
  };

  // Triệu hồi thêm bầy kẻ thù (Chim hoặc Dơi)
  const spawnPredator = (type: 'BIRD' | 'BAT') => {
    const side = Math.random() < 0.5 ? 'LEFT' : 'RIGHT';
    const id = Date.now() + Math.random();
    const x = side === 'LEFT' ? -40 : 840;
    const y = 80 + Math.random() * 220;
    const vx = side === 'LEFT' ? 1.5 + Math.random() * 1.5 : -1.5 - Math.random() * 1.5;
    const vy = (Math.random() - 0.5) * 1.2;

    predators.current.push({
      id,
      type,
      x,
      y,
      vx,
      vy,
      size: type === 'BIRD' ? 20 : 16,
      angle: 0,
      wingAngle: 0,
      state: 'WANDERING',
      sonarProgress: 0,
    });

    if (type === 'BIRD') {
      audio.playBirdShriek();
      setHudMessage('CẢNH BÁO: Rừng rậm phát hiện Chim săn mồi lượn lờ zigzag!');
    } else {
      audio.playBatSqueak();
      setHudMessage('CẢNH BÁO NGUY HIỂM: Dơi phát sóng siêu âm đêm đã thức giấc!');
    }
  };

  // Trúng đòn từ Chim hoặc Dơi -> Mất mạng
  const handleHitByPredator = (predName: string) => {
    if (respawnInvulnerableTimer.current > 0) return; // Đang bất tử

    if (hasShieldRef.current) {
      setHasShield(false);
      respawnInvulnerableTimer.current = 90; // Bất tử 1.5 giây sau vỡ khiên
      audio.playExplosion();
      addParticles(mothPos.current.x, mothPos.current.y, '#60a5fa', 30, 'bubble', 2);
      setHudMessage('🛡️ LÁ CHẮN ĐÃ VỠ! Đã chặn thành công 1 đòn chí mạng từ kẻ săn mồi.');
      return;
    }

    // Mất 1 mạng thực sự
    audio.playHurt();
    addParticles(mothPos.current.x, mothPos.current.y, '#ef4444', 35, 'pixel', 2.3);
    
    setLives(prev => {
      const nextLives = prev - 1;
      if (nextLives <= 0) {
        setTimeout(() => {
          setStage(GameStage.GAME_OVER);
        }, 0);
      } else {
        // Tái sinh tại vị trí an toàn sau tán cây
        mothPos.current = { x: 400, y: 150 };
        mothTargetPos.current = { x: 400, y: 220 };
        mothVelocity.current = { x: 0, y: 0 };
        respawnInvulnerableTimer.current = 120; // Bất tử 2 giây
        setHudMessage(`💥 Bạn bị ${predName} tóm! Khởi tử hồi sinh sau tán cây an toàn.`);
      }
      return nextLives;
    });
  };

  // VÒNG LẶP CHÍNH (UPDATE & RENDER)
  const drawAndUpdate = (timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    gameTime.current++;

    // TÍNH TOÁN BỘ ĐẾM THỜI GIAN THẬT CHO BƯỚM ĐÊM VÀ CÁC BIOLOGICAL PHASES SAU ĐÓ
    const isPostCocoon = stageRef.current === GameStage.MOTH || stageRef.current === GameStage.MATING || stageRef.current === GameStage.EGG_LAYING || stageRef.current === GameStage.DEATH;
    if (isPostCocoon) {
      const elapsed = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
      if (elapsed > survivalSecsRef.current) {
        setSurvivalSecs(elapsed);

        // Mỗi 10 giây tăng tần suất xuất hiện kẻ thù khi đang bay thụ phấn (MOTH stage only)
        if (stageRef.current === GameStage.MOTH && elapsed % 10 === 0) {
          if (elapsed < 30) {
            spawnPredator('BIRD');
          } else {
            spawnPredator('BAT');
          }
        }
      }

      // Giảm dần các Buff
      if (speedBoostLeftRef.current > 0) {
        setSpeedBoostLeft(prev => Math.max(prev - 0.016, 0)); // Giảm 16ms mỗi frame ~ 60fps
      }
      if (respawnInvulnerableTimer.current > 0) {
        respawnInvulnerableTimer.current--;
      }
    }

    // Cập nhật các văn bản trôi nổi (floating texts)
    floatingTexts.current = floatingTexts.current.filter(ft => {
      ft.y -= 0.6;
      ft.timer--;
      ft.opacity = Math.max(0, ft.timer / 60);
      return ft.timer > 0;
    });

    // 1. CLEAR CANVAS & BACKGROUND (Tùy thuộc Night Mode hay Hoàng Hôn)
    ctx.imageSmoothingEnabled = false;

    // Toàn bộ các quá trình của Bướm đêm sau nở kén đều diễn ra trong bóng đêm thơ mộng rực đom đóm
    const isNightMode = isPostCocoon;
    
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 400);
    if (isNightMode) {
      skyGrad.addColorStop(0, '#020617'); // Đen tối thẫm huyền bí ban đêm đêm
      skyGrad.addColorStop(0.6, '#0f172a');
      skyGrad.addColorStop(1, '#1e1b4b');
    } else {
      skyGrad.addColorStop(0, '#1e1b4b'); // Hoàng hôn dải tím đỏ vàng ấm
      skyGrad.addColorStop(0.5, '#311042');
      skyGrad.addColorStop(1, '#65253e');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 800, 600);

    // Sinh Đom Đóm phát sáng lung linh sặc sỡ bay lượn ban đêm (sau 45s Night mode)
    if (isNightMode && Math.random() < 0.08) {
      // Bắn ra hạt mạt đom đóm lấp lánh neon xanh lá vàng cực đã
      const colors = ['#a3e635', '#fde047', '#34d399', '#38bdf8'];
      const fy = Math.random() * 410;
      const fx = Math.random() * 800;
      addParticles(fx, fy, colors[Math.floor(Math.random() * colors.length)], 1, 'sparkle', 0.5);
    }

    // Đồi cỏ phân lớp 8-bit
    ctx.fillStyle = isNightMode ? '#0f1c14' : '#4c2a4c';
    ctx.beginPath();
    ctx.moveTo(0, 480);
    ctx.quadraticCurveTo(200, 430, 450, 470);
    ctx.quadraticCurveTo(650, 500, 800, 460);
    ctx.lineTo(800, 600);
    ctx.lineTo(0, 600);
    ctx.fill();

    ctx.fillStyle = isNightMode ? '#0d1810' : '#223326';
    ctx.beginPath();
    ctx.moveTo(0, 510);
    ctx.quadraticCurveTo(250, 480, 500, 520);
    ctx.quadraticCurveTo(680, 540, 800, 500);
    ctx.lineTo(800, 600);
    ctx.lineTo(0, 600);
    ctx.fill();

    ctx.fillStyle = isNightMode ? '#09100a' : '#142419';
    ctx.beginPath();
    ctx.moveTo(0, 540);
    ctx.quadraticCurveTo(300, 510, 600, 550);
    ctx.quadraticCurveTo(700, 560, 800, 530);
    ctx.lineTo(800, 600);
    ctx.lineTo(0, 600);
    ctx.fill();

    // Rung rinh cọng cỏ
    ctx.strokeStyle = isNightMode ? '#15803d' : '#34d399';
    ctx.lineWidth = 4;
    for (let x = 30; x < 800; x += 65) {
      const wave = Math.sin(gameTime.current * 0.03 + x) * 4;
      ctx.beginPath();
      ctx.moveTo(x, 540 + Math.sin(x) * 10);
      ctx.lineTo(x + wave - 3, 515 + Math.sin(x) * 10);
      ctx.stroke();
    }

    // Cành cây lớn cổ thụ treo kén và cũng là "KHU VỰC AN TOÀN" (SAFE ZONE)
    // Chim săn mồi Y < 230 X < 450 sẽ không thể tóm bướm đêm khi ẩn náu ở đây!
    ctx.fillStyle = isNightMode ? '#1a0d00' : '#451a03';
    ctx.fillRect(0, 185, 230, 24);
    
    ctx.beginPath();
    ctx.moveTo(220, 185);
    ctx.lineTo(540, 200);
    ctx.lineTo(540, 212);
    ctx.lineTo(220, 209);
    ctx.closePath();
    ctx.fill();

    // Sọc vỏ cành cây dợn gân nổi
    ctx.fillStyle = isNightMode ? '#2d1400' : '#78350f';
    ctx.fillRect(0, 185, 220, 4);
    ctx.fillRect(220, 185, 100, 3);

    // Lá cây Safe Zone rậm rạp
    const drawLeafBlock = (lx: number, ly: number, angle: number) => {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(angle);
      ctx.fillStyle = isNightMode ? '#14532d' : '#064e3b';
      ctx.fillRect(-14, -7, 28, 14);
      ctx.fillStyle = isNightMode ? '#166534' : '#047857';
      ctx.fillRect(-7, -7, 14, 7);
      ctx.restore();
    };
    drawLeafBlock(140, 172, 0.4);
    drawLeafBlock(210, 178, -0.2);
    drawLeafBlock(290, 196, 0.1);
    drawLeafBlock(350, 191, 0.6);
    drawLeafBlock(410, 210, -0.3);
    drawLeafBlock(470, 205, 0.2);
    drawLeafBlock(520, 200, -0.15);

    // Đánh dấu vòng phát sáng Safe Zone mờ nhẹ cho người chơi nhận định
    if (stageRef.current === GameStage.MOTH) {
      ctx.save();
      ctx.globalAlpha = 0.12 + Math.sin(gameTime.current * 0.05) * 0.04;
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, 0, 450, 240);
      
      // Viền SafeZone chấm nét dứt 8-bit
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(2, 2, 448, 236);

      ctx.restore();

      // Vẽ text rêu phong chỉ dẫn ẩn nấp
      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 11px var(--font-sans)';
      ctx.fillText('🛡️ KHU VỰC AN TOÀN (ẨN NẤP CHIM)', 15, 30);
    }

    // 2. CẬP NHẬT & VẼ HOA CỎ RỮA RỠ
    flowers.current.forEach(f => {
      const shakeIdx = Math.sin(gameTime.current * 0.04 + f.x) * 2;
      
      // Vẽ thân cỏ
      ctx.strokeStyle = isNightMode ? '#052e16' : '#065f46';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.lineTo(f.x + shakeIdx * 0.4, 580);
      ctx.stroke();

      // Hào quang phát sáng lấp lánh khi bướm đang bay gần hoặc hoa đã được thụ phấn thành công
      if (f.pollinated) {
        ctx.save();
        ctx.globalAlpha = 0.35 + Math.sin(gameTime.current * 0.08) * 0.15;
        const glowGrad = ctx.createRadialGradient(f.x, f.y, 4, f.x, f.y, f.size * 2);
        glowGrad.addColorStop(0, '#fef08a'); // Sắc vàng lấp lánh phấn hoa
        glowGrad.addColorStop(0.5, '#60a5fa');
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(f.x + shakeIdx, f.y, f.size * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(f.x + shakeIdx, f.y);
      const r = f.size;
      const angleStep = (Math.PI * 2) / f.petalCount;

      for (let p = 0; p < f.petalCount; p++) {
        ctx.rotate(angleStep);
        // Hoa đã thụ phấn chuyển sang màu xanh ngọc ảo diệu thần bí, hoa thường giữ nguyên màu sắc
        ctx.fillStyle = f.pollinated ? '#22d3ee' : f.color;
        
        ctx.fillRect(-r/2, -r - (Math.sin(gameTime.current * 0.05 + f.x) * 1.5), r, r);
      }
      
      // Nhụy hoa
      ctx.fillStyle = f.pollinated ? '#38bdf8' : f.centerColor;
      ctx.fillRect(-r/3, -r/3, (r/3)*2, (r/3)*2);

      // Nhãn tiến trình thụ phấn hình cung tròn nếu đang hút
      if (activeFlowerId.current === f.id) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const drawLimit = (f.pollinateProgress / 100) * Math.PI * 2;
        ctx.arc(0, -r - 15, 8, -Math.PI / 2, -Math.PI / 2 + drawLimit);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${f.pollinateProgress}%`, 0, -r - 28);
      }

      // Đánh dấu ký tự "✨ Thụ phấn thành công"
      if (f.pollinated) {
        ctx.fillStyle = '#a5f3fc';
        ctx.font = '10px var(--font-pixel)';
        ctx.textAlign = 'center';
        ctx.fillText('✨ THÀNH CÔNG', 0, -r - 12);
      }

      ctx.restore();
    });

    // 3. CẬP NHẬT LÁ (Sâu Đo Stage)
    if (stageRef.current === GameStage.CATERPILLAR) {
      spawnLeafIfNeeded();
      leaves.current.forEach(l => {
        if (l.scale <= 0) return;

        if (l.growing && l.scale < 1) {
          l.scale = Math.min(l.scale + 0.02, 1);
          if (l.scale === 1) l.growing = false;
        }

        const wave = Math.sin(gameTime.current * 0.05 + l.id) * 1.5;
        ctx.save();
        ctx.translate(l.x, l.y + wave);
        ctx.scale(l.scale, l.scale);

        ctx.fillStyle = '#0f766e';
        ctx.fillRect(-l.size, -l.size / 2, l.size * 2, l.size);
        ctx.fillStyle = '#14b8a6';
        ctx.fillRect(-l.size, -l.size / 2, l.size * 2, l.size / 2);
        ctx.fillStyle = '#ccfbf1';
        ctx.fillRect(-l.size + 2, -1, l.size * 1.8, 2);
        ctx.restore();
      });
    }

    // 0. GIAI ĐOẠN CUỘC ĐỜI BẮT ĐẦU: QUẢ TRỨNG (EGG PHASE)
    if (stageRef.current === GameStage.EGG) {
      eggTimer.current++;
      
      const eggX = 400;
      const eggY = 480;

      // Vẽ chiếc lá nương tựa nâng bọc của trứng
      ctx.save();
      ctx.translate(eggX, eggY + 14);
      ctx.rotate(-0.1);
      ctx.fillStyle = '#166534'; // Lá thẫm
      ctx.beginPath();
      ctx.ellipse(0, 0, 48, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-45, 0);
      ctx.lineTo(45, 0);
      ctx.stroke();
      ctx.restore();

      let shakeX = 0;
      let shakeY = 0;
      const totalEggDuration = 300; // 5s @ 60fps

      if (eggTimer.current >= totalEggDuration) {
        // NỞ RA SẦU ĐO!
        audio.playExplosion();
        audio.playMove();
        
        // Bắn vô số hạt phấn tơ lấp lánh màu ngọc
        addParticles(eggX, eggY, '#34d399', 30, 'leaf', 1.8);
        addParticles(eggX, eggY, '#fef08a', 20, 'sparkle', 1.5);

        caterpillarPos.current = { x: eggX, y: eggY + 4 };
        caterpillarTarget.current = { x: eggX + 25, y: eggY + 4 }; // Khích bò ranh
        setStage(GameStage.CATERPILLAR);
        setHudMessage('🐛 Trứng đã nứt nở! Đưa Sâu đo di chuyển để ăn những chiếc lá thơm ngon tích trữ hóa kén!');
      } else {
        if (eggTimer.current > 210) {
          // Rung mạnh cuồng nhiệt chuẩn bị bung vỏ nứt kén
          shakeX = (Math.random() - 0.5) * 4.5;
          shakeY = (Math.random() - 0.5) * 3;
          
          if (gameTime.current % 25 === 0) {
            audio.playCrack();
            setHudMessage('🥚 Tách tách... Quả trứng xanh non đang rạn nứt chuẩn bị ra đời!');
          }
        } else {
          // Đung đưa lãng mạn nhẹ nhàng
          shakeX = Math.sin(gameTime.current * 0.08) * 1.8;
          shakeY = Math.cos(gameTime.current * 0.1) * 0.8;
        }

        // Vẽ Quả Trứng hình bầu dục màu xanh nhạt lấm tấm đốm
        ctx.save();
        ctx.translate(eggX + shakeX, eggY + shakeY);
        
        // Hào quang tỏa ra lấp lánh
        ctx.save();
        ctx.shadowColor = '#a7f3d0';
        ctx.shadowBlur = 10 + Math.sin(gameTime.current * 0.15) * 5;
        ctx.globalAlpha = 0.85 + Math.sin(gameTime.current * 0.1) * 0.15;
        ctx.fillStyle = '#dcfce7'; // Xanh lá mầm rực sáng
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 10, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Vẽ chi tiết vỏ trứng lấm tầm chấm nhỏ
        ctx.fillStyle = '#10b981'; // Đốm màu lục nhạt
        ctx.fillRect(-5, -4, 2, 2);
        ctx.fillRect(4, -2, 2, 2);
        ctx.fillRect(-2, 5, 2, 2);
        ctx.fillRect(5, 2, 2, 2);

        // Nứt kén vẽ các đường rạn khi gần nở
        if (eggTimer.current > 210) {
          ctx.strokeStyle = '#047857';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-9, 0);
          ctx.lineTo(-1, -3);
          ctx.lineTo(1, 5);
          ctx.lineTo(8, -1);
          ctx.stroke();
        }

        ctx.restore();

        // Thêm hạt lấp lánh bay lên quanh quả trứng
        if (Math.random() < 0.15) {
          addParticles(eggX + (Math.random() - 0.5) * 20, eggY + (Math.random() - 0.5) * 15, '#34d399', 1, 'sparkle', 0.5);
        }
      }
    }

    // 4. CHẠY GIAI ĐOẠN 1: SÂU ĐO BÒ ĂN LÁ
    if (stageRef.current === GameStage.CATERPILLAR) {
      let targetX = caterpillarPos.current.x;
      let targetY = caterpillarPos.current.y;
      let isMoving = false;

      const speed = 2.4;
      let dx = 0;
      let dy = 0;

      if (keysPressed.current['w'] || keysPressed.current['arrowup']) {
        dy = -speed;
        isMoving = true;
      }
      if (keysPressed.current['s'] || keysPressed.current['arrowdown']) {
        dy = speed;
        isMoving = true;
      }
      if (keysPressed.current['a'] || keysPressed.current['arrowleft']) {
        dx = -speed;
        isMoving = true;
      }
      if (keysPressed.current['d'] || keysPressed.current['arrowright']) {
        dx = speed;
        isMoving = true;
      }

      if (isMoving) {
        targetX = Math.max(30, Math.min(770, caterpillarPos.current.x + dx));
        targetY = Math.max(430, Math.min(570, caterpillarPos.current.y + dy));
        caterpillarTarget.current = null;
      } else if (caterpillarTarget.current) {
        const dist = Math.hypot(caterpillarTarget.current.x - caterpillarPos.current.x, caterpillarTarget.current.y - caterpillarPos.current.y);
        if (dist > 8) {
          isMoving = true;
          const clickAngle = Math.atan2(caterpillarTarget.current.y - caterpillarPos.current.y, caterpillarTarget.current.x - caterpillarPos.current.x);
          targetX = caterpillarPos.current.x + Math.cos(clickAngle) * speed;
          targetY = caterpillarPos.current.y + Math.sin(clickAngle) * speed;
          
          targetX = Math.max(30, Math.min(770, targetX));
          targetY = Math.max(430, Math.min(570, targetY));
        } else {
          caterpillarTarget.current = null;
        }
      }

      if (isMoving) {
        caterpillarAngle.current = Math.atan2(targetY - caterpillarPos.current.y, targetX - caterpillarPos.current.x);
        caterpillarPos.current.x = targetX;
        caterpillarPos.current.y = targetY;
        caterpillarMoveProgress.current += 0.16;

        if (gameTime.current % 18 === 0) {
          audio.playMove();
        }
      } else {
        caterpillarMoveProgress.current = Math.PI; 
      }

      // Ăn lá cây
      leaves.current.forEach(l => {
        if (l.scale <= 0.8) return;
        const dist = Math.hypot(l.x - caterpillarPos.current.x, l.y - caterpillarPos.current.y);
        if (dist < 26) {
          l.scale = 0;
          setScore(prev => prev + l.points);
          leavesEatenCount.current++;
          
          setEnergy(prev => {
            const nextEng = Math.min(prev + 20, 100);
            if (nextEng >= 100) {
              setTimeout(() => {
                setStage(GameStage.TRANSITION_TO_COCOON);
                setHudMessage('✨ Đã nạp đủ 100% năng lượng! Sâu đo đang bò nhanh lên cành cổ thụ trung tâm để bắt đầu dệt kén...');
              }, 0);
            } else {
              setHudMessage(`🍁 Sâu đo đã ăn được ${leavesEatenCount.current} chiếc lá! Năng lượng tích trữ tăng thêm +20%.`);
            }
            return nextEng;
          });

          audio.playEat();
          addParticles(l.x, l.y, '#34d399', 15, 'leaf');
          addParticles(l.x, l.y, '#fef08a', 8, 'sparkle');
        }
      });

      // Vẽ sâu đo S-curve
      ctx.save();
      ctx.translate(caterpillarPos.current.x, caterpillarPos.current.y);
      ctx.rotate(caterpillarAngle.current);

      const numSegments = 6;
      const baseSegSpacing = 11;
      const stretchFactor = 1.0 + Math.sin(caterpillarMoveProgress.current) * 0.32;
      const archFactor = Math.max(0, -Math.sin(caterpillarMoveProgress.current));

      for (let s = numSegments - 1; s >= 0; s--) {
        const t = s / (numSegments - 1);
        const segX = -s * baseSegSpacing * stretchFactor;
        let segY = 0;
        if (s > 0 && s < numSegments - 1) {
          const u = Math.sin(t * Math.PI);
          segY = -archFactor * 14 * u; 
        }

        const radius = s === 0 ? 10 : s === numSegments - 1 ? 7 : 9 - s * 0.3;
        ctx.fillStyle = s % 2 === 0 ? '#10b981' : '#a7f3d0';
        ctx.beginPath();
        ctx.arc(segX, segY, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#047857';
        ctx.fillRect(segX - 3, segY - radius, 5, 2);

        if (s === 0) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(2, -5, 4, 4);
          ctx.fillStyle = '#000000';
          ctx.fillRect(3, -4, 2, 2);

          ctx.strokeStyle = '#a7f3d0';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(3, -7);
          ctx.quadraticCurveTo(8, -12, 12, -10);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 5. CHẠY GIAI ĐOẠN 2: CHUYỂN HOÁ LÊN CÀNH VÀ DỆT KÉN (AUTO ANIMATION)
    if (stageRef.current === GameStage.TRANSITION_TO_COCOON) {
      const nextX = caterpillarPos.current.x + (cocoonTargetPos.x - caterpillarPos.current.x) * 0.08;
      const nextY = caterpillarPos.current.y + (cocoonTargetPos.y - caterpillarPos.current.y) * 0.08;

      caterpillarAngle.current = Math.atan2(cocoonTargetPos.y - caterpillarPos.current.y, cocoonTargetPos.x - caterpillarPos.current.x);
      caterpillarPos.current.x = nextX;
      caterpillarPos.current.y = nextY;
      caterpillarMoveProgress.current += 0.22;

      if (gameTime.current % 12 === 0) {
        audio.playMove();
      }

      const distDiff = Math.hypot(cocoonTargetPos.x - caterpillarPos.current.x, cocoonTargetPos.y - caterpillarPos.current.y);
      if (distDiff < 8) {
        addParticles(cocoonTargetPos.x, cocoonTargetPos.y + 20, '#f8fafc', 50, 'silk');
        audio.playExplosion();
        
        setStage(GameStage.COCOON);
        cocoonCountdown.current = 60;
        lastTimeTick.current = Date.now();
      }

      ctx.save();
      ctx.translate(caterpillarPos.current.x, caterpillarPos.current.y);
      ctx.rotate(caterpillarAngle.current);
      for (let s = 5; s >= 0; s--) {
        const segX = -s * 9 * (1.0 + Math.sin(caterpillarMoveProgress.current) * 0.2);
        let segY = 0;
        if (s > 0 && s < 5) segY = -Math.max(0, -Math.sin(caterpillarMoveProgress.current)) * 9;
        ctx.fillStyle = s % 2 === 0 ? '#10b981' : '#a7f3d0';
        ctx.beginPath();
        ctx.arc(segX, segY, 8 - s * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 6. CHẠY GIAI ĐOẠN 3: KÉN TREO ĐUNG ĐƯA (COCOON STAGE)
    if (stageRef.current === GameStage.COCOON) {
      const nowTime = Date.now();
      if (nowTime - lastTimeTick.current >= 1000) {
        const elapsedSecs = (nowTime - lastTimeTick.current) / 1000;
        cocoonCountdown.current = Math.max(cocoonCountdown.current - elapsedSecs, 0);
        lastTimeTick.current = nowTime;

        if (cocoonCountdown.current <= 0) {
          setStage(GameStage.HATCHING);
          lastTimeTick.current = Date.now();
        }
      }

      const baseSwing = Math.sin(gameTime.current * 0.02) * 0.12;
      cocoonSwingAngle.current = baseSwing + (Math.sin(gameTime.current * 0.2) * cocoonSwingVol.current);
      cocoonSwingVol.current *= 0.94;

      const glowIntensity = (60 - cocoonCountdown.current) / 60;
      const pulseGlow = glowIntensity * (0.6 + Math.sin(gameTime.current * 0.08) * 0.4);

      if (pulseGlow > 0.05) {
        ctx.save();
        ctx.globalAlpha = pulseGlow;
        const gradCocoon = ctx.createRadialGradient(
          cocoonTargetPos.x, cocoonTargetPos.y + 40, 5,
          cocoonTargetPos.x, cocoonTargetPos.y + 40, 75
        );
        gradCocoon.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
        gradCocoon.addColorStop(0.4, 'rgba(234, 179, 8, 0.3)');
        gradCocoon.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradCocoon;
        ctx.beginPath();
        ctx.arc(cocoonTargetPos.x, cocoonTargetPos.y + 40, 75, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Sợi tơ
      ctx.save();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cocoonTargetPos.x, cocoonTargetPos.y);
      const hangLength = 22;
      const cocoonBottomX = cocoonTargetPos.x + Math.sin(cocoonSwingAngle.current) * hangLength;
      const cocoonBottomY = cocoonTargetPos.y + Math.cos(cocoonSwingAngle.current) * hangLength;
      ctx.lineTo(cocoonBottomX, cocoonBottomY);
      ctx.stroke();

      // Vẽ Kén
      ctx.translate(cocoonBottomX, cocoonBottomY);
      ctx.rotate(cocoonSwingAngle.current);

      ctx.fillStyle = '#b45309';
      ctx.fillRect(-22, 0, 44, 55);
      ctx.fillRect(-17, -5, 34, 65);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-19, 2, 38, 51);
      ctx.fillRect(-14, -3, 28, 61);

      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-12, 10, 24, 3);
      ctx.fillRect(-16, 22, 34, 2);
      ctx.fillRect(-14, 34, 28, 3);

      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(-14, 18, 3, 3);
      ctx.fillRect(10, 28, 3, 3);
      ctx.restore();
    }

    // 7. CHẠY GIAI ĐOẠN 4: NẤT KÉN VÀ NỞ BÙNG (HATCHING STAGE)
    if (stageRef.current === GameStage.HATCHING) {
      const stageElapsed = (Date.now() - lastTimeTick.current) / 1000;
      const shakePower = Math.min(stageElapsed * 3.5, 9);
      const shakeX = (Math.random() - 0.5) * shakePower;
      const shakeY = (Math.random() - 0.5) * shakePower;

      if (gameTime.current % 10 === 0 && stageElapsed < 3.2) {
        audio.playCrack();
      }

      if (stageElapsed < 3.2) {
        ctx.save();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cocoonTargetPos.x, cocoonTargetPos.y);
        ctx.lineTo(cocoonTargetPos.x + shakeX, cocoonTargetPos.y + 22 + shakeY);
        ctx.stroke();

        ctx.translate(cocoonTargetPos.x + shakeX, cocoonTargetPos.y + 22 + shakeY);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-22, 0, 44, 55);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-19, 2, 38, 51);

        ctx.fillStyle = '#faf8f5';
        ctx.fillRect(-3, 10, 6, 35);
        ctx.fillRect(-12, 18, 18, 3);
        ctx.restore();
      } else {
        // Nổ tung cánh bướm
        audio.playExplosion();
        addParticles(cocoonTargetPos.x, cocoonTargetPos.y + 40, '#78350f', 60, 'pixel', 3.2);
        addParticles(cocoonTargetPos.x, cocoonTargetPos.y + 40, '#d97706', 60, 'pixel', 2.8);
        addParticles(cocoonTargetPos.x, cocoonTargetPos.y + 40, '#fef08a', 85, 'sparkle', 2.5);
        addParticles(cocoonTargetPos.x, cocoonTargetPos.y + 40, '#a5f3fc', 50, 'cloud', 2.0);

        mothPos.current = { x: cocoonTargetPos.x, y: cocoonTargetPos.y + 45 };
        mothTargetPos.current = { x: cocoonTargetPos.x, y: cocoonTargetPos.y - 70 };
        
        setStage(GameStage.MOTH);
        resetMothGameplay();
        setScore(prev => prev + 100);
      }
    }

    // 8. CHẠY GIAI ĐOẠN 5: BƯỚM ĐÊM TRƯỞNG THÀNH TỰ DO BAY LƯỢN & SHIELD / POLLINATION / PREDATORS
    if (stageRef.current === GameStage.MOTH) {
      
      // KIỂM TRA QUẤN MẠNG NHỆN (CHẠM VÀO LÀ BỊ NHỆN GIẾT)
      let trappedWebIdLocal: number | null = null;

      spiderWebs.current.forEach(web => {
        const dist = Math.hypot(mothPos.current.x - web.x, mothPos.current.y - web.y);
        if (dist < 40) {
          trappedWebIdLocal = web.id;
        }
      });

      if (trappedWebIdLocal !== null && respawnInvulnerableTimer.current === 0) {
        handleHitByPredator('NHỆN ĐỘC KHỔNG LỒ');
      }

      // VẼ MẠNG NHỆN RÌNH RẬP
      spiderWebs.current.forEach(web => {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 1.8;
        // Điểm tâm mạng
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const edgeAngle = (i * Math.PI) / 4;
          ctx.moveTo(web.x, web.y);
          ctx.lineTo(web.x + Math.cos(edgeAngle) * web.size, web.y + Math.sin(edgeAngle) * web.size);
        }
        ctx.stroke();

        // Vòng tròn quấn tơ đồng tâm
        ctx.beginPath();
        for (let rLen = 15; rLen <= web.size; rLen += 15) {
          ctx.moveTo(web.x + rLen, web.y);
          ctx.arc(web.x, web.y, rLen, 0, Math.PI * 2);
        }
        ctx.stroke();

        // Con Nhện rình rập ở giữa mạng nhện
        if (web.hasSpider) {
          const spShake = Math.sin(gameTime.current * 0.1) * 2;
          ctx.fillStyle = '#0f172a'; // Thân nhện đen bóng sẫm Y < 450
          ctx.fillRect(web.x - 7, web.y - 7 + spShake, 14, 14);
          
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2.5;
          // Vẽ 4 chân nhện ngòai bìa bóng
          ctx.beginPath();
          ctx.moveTo(web.x - 7, web.y + spShake);
          ctx.lineTo(web.x - 17, web.y - 8 + spShake);
          ctx.moveTo(web.x + 7, web.y + spShake);
          ctx.lineTo(web.x + 17, web.y - 8 + spShake);
          ctx.stroke();

          // Hai con mắt đỏ rực của con nhện ăn rây
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(web.x - 4, web.y - 4 + spShake, 2, 2);
          ctx.fillRect(web.x + 2, web.y - 4 + spShake, 2, 2);
        }
        ctx.restore();
      });

      // TỰ ĐỘNG GIẢM TỐC GHÉ GẦN HOA ĐẬU HÚT MẬT
      let speedMult = speedBoostLeft > 0 ? 1.6 : 1.0;

      // Bay gần hoa (< 30px) -> Tự động giảm tốc để hút mật
      let isNearAnyFlower = false;
      flowers.current.forEach(f => {
        if (f.pollinated) return;
        const distToFlower = Math.hypot(f.x - mothPos.current.x, f.y - mothPos.current.y + 12);
        if (distToFlower < 38) {
          isNearAnyFlower = true;
          speedMult *= 0.35; // Giảm tốc độ bay xuống còn 35% giúp kiểm soát chuẩn mực
        }
      });

      // ĐIỀU KHIỂN CHUYỂN ĐỘNG BƯỚM ĐÊM MƯỢT MÀ VỚI QUÁN TÍNH NHẸ
      let targetX = mothPos.current.x;
      let targetY = mothPos.current.y;
      let keyboardControlled = false;
      const flyBaseSpeed = 3.8 * speedMult;

      if (keysPressed.current['w'] || keysPressed.current['arrowup']) {
        targetY -= flyBaseSpeed * 1.5;
        keyboardControlled = true;
      }
      if (keysPressed.current['s'] || keysPressed.current['arrowdown']) {
        targetY += flyBaseSpeed * 1.5;
        keyboardControlled = true;
      }
      if (keysPressed.current['a'] || keysPressed.current['arrowleft']) {
        targetX -= flyBaseSpeed * 1.5;
        keyboardControlled = true;
      }
      if (keysPressed.current['d'] || keysPressed.current['arrowright']) {
        targetX += flyBaseSpeed * 1.5;
        keyboardControlled = true;
      }

      if (keyboardControlled) {
        mothTargetPos.current = {
          x: Math.max(15, Math.min(785, targetX)),
          y: Math.max(30, Math.min(570, targetY))
        };
      }

      // Tính quán tính lướt mềm mại
      const angleToTarget = Math.atan2(mothTargetPos.current.y - mothPos.current.x, mothTargetPos.current.x - mothPos.current.x);
      const accelFrac = 0.08; // Quán tính lướt trơn tru
      mothVelocity.current.x += (mothTargetPos.current.x - mothPos.current.x) * accelFrac;
      mothVelocity.current.y += (mothTargetPos.current.y - mothPos.current.y) * accelFrac;
      
      // Giới hạn max speed tránh bốc quá nhanh dốc
      const currentSpeed = Math.hypot(mothVelocity.current.x, mothVelocity.current.y);
      const maxAllowedSpeed = (speedBoostLeft > 0 ? 6.5 : 4.4) * speedMult;
      if (currentSpeed > maxAllowedSpeed) {
        mothVelocity.current.x = (mothVelocity.current.x / currentSpeed) * maxAllowedSpeed;
        mothVelocity.current.y = (mothVelocity.current.y / currentSpeed) * maxAllowedSpeed;
      }

      // Áp dụng ma sát không khí kéo hãm nhẹ
      mothVelocity.current.x *= 0.88;
      mothVelocity.current.y *= 0.88;

      // Di chuyển bướm
      mothPos.current.x += mothVelocity.current.x;
      mothPos.current.y += mothVelocity.current.y;

      // Giới hạn bờ rào canvas
      mothPos.current.x = Math.max(15, Math.min(785, mothPos.current.x));
      mothPos.current.y = Math.max(30, Math.min(570, mothPos.current.y));

      // Góc nghiêng thân hình vỗ xiên
      const travelDist = Math.hypot(mothVelocity.current.x, mothVelocity.current.y);
      if (travelDist > 0.4) {
        mothAngle.current = Math.atan2(mothVelocity.current.y, mothVelocity.current.x);
      }

      // Trail vệt sáng lung linh sau cánh bướm
      if (gameTime.current % 4 === 0) {
        mothTrail.current.push({ x: mothPos.current.x, y: mothPos.current.y });
        if (mothTrail.current.length > 8) mothTrail.current.shift();
      }

      // Vẽ vệt sáng Trail
      ctx.save();
      mothTrail.current.forEach((dot, index) => {
        const ratio = (index + 1) / mothTrail.current.length;
        ctx.globalAlpha = ratio * 0.28;
        ctx.fillStyle = speedBoostLeft > 0 ? '#60a5fa' : '#fef08a';
        ctx.fillRect(dot.x - 3, dot.y - 3, 6, 6);
      });
      ctx.restore();

      // KIỂM TRA HÚT MẬT & THÀNH TỰU THỤ PHẤN
      let foundActiveFlowerThisFrame = false;
      flowers.current.forEach(f => {
        if (f.pollinated) return;
        const dist = Math.hypot(f.x - mothPos.current.x, f.y - (mothPos.current.y + 12));

        if (dist < 32 && trappedInWebId.current === null) {
          foundActiveFlowerThisFrame = true;
          activeFlowerId.current = f.id;

          // Thực hiện hút mật ngọt ngào: +tiến độ mỗi frame
          f.pollinateProgress = Math.min(f.pollinateProgress + 0.6, 100);

          // Phun tia sáng lấp lánh kết nối bướm đêm đến hoa
          ctx.save();
          ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.moveTo(mothPos.current.x, mothPos.current.y);
          ctx.lineTo(f.x, f.y);
          ctx.stroke();
          ctx.restore();

          // Hạt mật sặc sỡ bốc lên
          if (Math.random() < 0.16) {
            addParticles(f.x, f.y - 10, '#fef08a', 1, 'pollen', 0.8);
          }

          if (gameTime.current % 12 === 0) {
            audio.playFlutter();
          }

          setHudMessage(`🌸 ĐANG HÚT MẬT ${f.name.toUpperCase()}... (${Math.floor(f.pollinateProgress)}%)`);

          // Nếu đạt 100% -> THỤ PHẤN THÀNH CÔNG!
          if (f.pollinateProgress >= 100) {
            f.pollinated = true;
            f.glowProgress = 1.0;
            activeFlowerId.current = null;
            audio.playExplosion();

            // Nhận điểm to lớn
            setScore(prev => prev + 50);

            // Tặng dạt dào bốc lấp lánh phấn hoa bắn 360 độ (Pollen Explosion)
            addParticles(f.x, f.y, '#eab308', 35, 'pollen', 2.5);
            addParticles(f.x, f.y, '#a5f3fc', 15, 'sparkle', 2.0);

            // Tạo nhãn bay chữ "+1" rạng rỡ trên đầu hoa
            floatingTexts.current.push({
              x: f.x,
              y: f.y - 12,
              text: '+1 Thụ Phấn 🌸',
              opacity: 1,
              timer: 90
            });

            // Kiểm tra Buffs thưởng dào dạt
            setPollinatedCount(prev => {
              const curCount = prev + 1;
              
              if (curCount >= 5) {
                // TIẾN TỚI GIAI ĐOẠN GIAO PHỐI (MATING PHASE) LÃNG MẠN!
                audio.playShieldOn();
                setHudMessage('✨ THỤ PHẤN ĐỦ 5 HOA! Bạn tình bướm đêm rực rỡ đang bay tới để thực hiện Vũ điệu giao phối ngọt ngào...');
                setTimeout(() => {
                  setStage(GameStage.MATING);
                  matingTimer.current = 0;
                  // Đặt bạn tình xuất hiện từ bìa phải trời cao lướt vào
                  mateMoth.current = {
                    x: 850,
                    y: 150,
                    angle: Math.PI,
                    wingAngle: 0,
                    wingSpeed: 0.18
                  };
                }, 800);
              } else {
                // Buffs
                if (curCount === 3) {
                  setSpeedBoostLeft(5); // 5 giây Speed Boost
                  audio.playShieldOn();
                  setHudMessage('⚡ TĂNG TỐC BAY: Nhận luồng khí bão lướt 1.6x trong 5 giây!');
                } else {
                  setHudMessage(`🌸 THỤ PHẤN THÀNH CÔNG hoa thứ ${curCount}/5! [+50 ĐIỂM]`);
                }
              }
              return curCount;
            });

            // Rơi phấn hoa vàng rủng rỉnh dạt dào
            for (let k = 0; k < 3; k++) {
              goldenPollens.current.push({
                id: Date.now() + Math.random(),
                x: f.x + (Math.random() - 0.5) * 35,
                y: f.y - 25,
                vy: -1.2 - Math.random() * 1.5,
                size: 6,
                color: '#eab308',
                points: 20,
              });
            }
          }
        }
      });

      if (!foundActiveFlowerThisFrame) {
        activeFlowerId.current = null;
        // Reset ngắt tiến độ lột sụt nhẹ nếu dạt ra xa hoa
        flowers.current.forEach(f => {
          if (!f.pollinated && f.pollinateProgress > 0) {
            f.pollinateProgress = Math.max(f.pollinateProgress - 0.25, 0);
          }
        });
      }

      // CẬP NHẬT PHẤN HOA VÀNG VÀ HÚT NHẬT CỘNG ĐIỂM
      goldenPollens.current = goldenPollens.current.filter(gp => {
        gp.y += gp.vy;
        gp.vy += 0.08; // Trọng lực rơi ngược rớt
        
        ctx.fillStyle = gp.color;
        ctx.fillRect(gp.x - gp.size / 2, gp.y - gp.size / 2, gp.size, gp.size);

        // Đồ họa tơ dính vàng lấp lánh xung quanh hạt mạt vàng
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(gp.x - 2, gp.y - 2, 4, 4);

        const distToMoth = Math.hypot(gp.x - mothPos.current.x, gp.y - mothPos.current.y);
        if (distToMoth < 34) {
          // Ăn nhặt thành công
          setScore(prev => prev + gp.points);
          audio.playPollenCollected();
          addParticles(gp.x, gp.y, '#fef08a', 8, 'sparkle', 1.2);
          return false; // Giải tán
        }

        return gp.y < 580; // Sợ rớt biên biến mất
      });

      // 9. CẬP NHẬT KẺ SĂN MỒI RẮT RÈ (BIRD & BAT)
      nearPredatorAlert.current = false;

      predators.current.forEach(pred => {
        let actualFlySpeed = pred.type === 'BIRD' ? 1.8 : 1.2;
        // Nhân thêm độ khó tột cùng theo mốc thời gian sống sót (10 giây tăng 10% tốc độ rượt đuổi)
        const diffMultiplier = 1.0 + Math.floor(survivalSecs / 10) * 0.1;
        actualFlySpeed *= diffMultiplier;

        const isBButterflyInSafeZone = mothPos.current.y < 235 && mothPos.current.x < 450;
        const distToMoth = Math.hypot(mothPos.current.x - pred.x, mothPos.current.y - pred.y);

        // THIẾT LẬP AI TRUY ĐUỔI CHORDS CỰC ĐỘC CHO CHIM SĂN MỒI
        if (pred.type === 'BIRD') {
          // Chim: Bay zigzag ràn rạt
          pred.wingAngle = Math.sin(gameTime.current * 0.42) * 0.85;

          if (distToMoth < 150 && !isBButterflyInSafeZone && respawnInvulnerableTimer.current === 0) {
            pred.state = 'CHASING';
            nearPredatorAlert.current = true;
            
            // Bay thốc 1.5x lao sầm sập đến bướm
            const chaseAng = Math.atan2(mothPos.current.y - pred.y, mothPos.current.x - pred.x);
            pred.x += Math.cos(chaseAng) * actualFlySpeed * 1.5;
            pred.y += Math.sin(chaseAng) * actualFlySpeed * 1.5;
            pred.angle = chaseAng;
          } else {
            pred.state = 'WANDERING';
            // Khập khiễng zigzag hoang dại
            const waveY = Math.sin(gameTime.current * 0.08 + pred.id) * 1.8;
            pred.x += pred.vx * actualFlySpeed;
            pred.y += (pred.vy + waveY) * actualFlySpeed * 0.5;
            pred.angle = Math.atan2(pred.vy + waveY, pred.vx);

            // Nảy ngược lề màn hình trái phải tránh mất chim ra rìa biệt tích
            if (pred.x < -100 || pred.x > 900) {
              pred.vx *= -1; // Đổi hướng dẫ dẫ
            }
          }

          // Rìa va chạm mỏ nhọn chim tóm bướm
          if (distToMoth < 28 && !isBButterflyInSafeZone) {
            handleHitByPredator('CHIM SĂN MỒI CAO XẠ');
          }

        } else if (pred.type === 'BAT') {
          // Dơi đêm: Bay hình sóng sin, bán kính quét dạt rộng
          pred.wingAngle = Math.sin(gameTime.current * 0.28) * 0.7;
          
          // Phát sóng siêu âm đồng tâm loe loe liên tục
          if (gameTime.current % 45 === 0) {
            pred.sonarProgress = 0;
            audio.playBatSqueak();
          }

          if (pred.sonarProgress !== undefined && pred.sonarProgress < 120) {
            pred.sonarProgress += 1.8;
            
            // Vẽ vòng sóng siêu âm mờ màu xanh dương nhạt lan toả
            ctx.save();
            ctx.strokeStyle = `rgba(147, 197, 253, ${Math.max(0, 1.0 - pred.sonarProgress / 120)})`;
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.arc(pred.x, pred.y, pred.sonarProgress, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // BẪY GIẢM TỐC SÓNG SIÊU ÂM (giảm 30% khi lọt tầm vế sóng dơi)
            if (distToMoth < pred.sonarProgress && respawnInvulnerableTimer.current === 0 && !isBButterflyInSafeZone) {
              speedMult *= 0.7; // Tụt 30% tốc độ lách bay
              nearPredatorAlert.current = true;
              if (gameTime.current % 35 === 0) {
                setHudMessage('🦇 SÓNG SIÊU ÂM DƠI QUÉT TRÚNG! Tốc độ râu cánh bị giảm 30%.');
              }
            }
          }

          // Dơi rượt đuổi chậm nhưng chắc
          const waveXOffset = Math.sin(gameTime.current * 0.05 + pred.id) * 2.0;
          const toMothAng = Math.atan2(mothPos.current.y - pred.y, mothPos.current.x - pred.x);
          
          pred.x += (Math.cos(toMothAng) + waveXOffset * 0.2) * actualFlySpeed * 1.1;
          pred.y += Math.sin(toMothAng) * actualFlySpeed * 1.1;
          pred.angle = toMothAng;

          if (distToMoth < 28 && !isBButterflyInSafeZone) {
            handleHitByPredator('DƠI ĐÊM SIÊU ÂM');
          }
        }

        // VẼ KẺ SĂN MỒI PIXEL ART CHẤT LỪ
        ctx.save();
        ctx.translate(pred.x, pred.y);
        ctx.rotate(pred.angle);

        if (pred.type === 'BIRD') {
          // Chim: Lưng vàng chanh, cánh dang dài, mỏ cam thốc hoang dại
          const bW = Math.abs(pred.wingAngle);
          ctx.fillStyle = '#dc2626'; // Mỏ nhọn đỏ
          ctx.fillRect(12, -3, 8, 5);
          
          ctx.fillStyle = '#facc15'; // Thân chim vàng tươi sáng
          ctx.fillRect(-14, -8, 28, 16);
          
          ctx.fillStyle = '#ca8a04'; // Cánh dang rộng vỗ
          ctx.beginPath();
          ctx.moveTo(-4, -6);
          ctx.lineTo(-12, -30 * bW);
          ctx.lineTo(6, -6);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(-4, 6);
          ctx.lineTo(-12, 30 * bW);
          ctx.lineTo(6, 6);
          ctx.fill();

          // Mắt ác độc đen thui
          ctx.fillStyle = '#000000';
          ctx.fillRect(5, -5, 2.5, 2.5);

        } else if (pred.type === 'BAT') {
          // Dơi đêm: Tai dơi dảo dác đen xám, cánh dơi nhọn móng vuốt rách rưới
          const bW = Math.abs(pred.wingAngle);
          ctx.fillStyle = '#1e293b'; // Thân xám tro thẫm
          ctx.fillRect(-12, -6, 24, 12);
          
          // Vẽ cấu hình tai dơi vểnh sọc đen bộc
          ctx.fillRect(-6, -11, 4, 6);
          ctx.fillRect(2, -11, 4, 6);

          ctx.fillStyle = '#0f172a'; // Cánh dơi hẹp đen kịt
          ctx.beginPath();
          ctx.moveTo(-2, -5);
          ctx.lineTo(-18, -25 * bW);
          ctx.lineTo(-10, -5);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(-2, 5);
          ctx.lineTo(-18, 25 * bW);
          ctx.lineTo(-10, 5);
          ctx.fill();

          // Mắt dơi đỏ lượn lơ
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(4, -3, 2, 2);
          ctx.fillRect(4, 1, 2, 2);
        }

        ctx.restore();
      });

      // VẼ CON BƯỚM ĐÊM CHÍNH (Độ vỗ, râu bướm lông vũ quyến rũ)
      const isMButterflyInWeb = trappedInWebId.current !== null;
      const isMButterflyInvulnerable = respawnInvulnerableTimer.current > 0;

      ctx.save();
      ctx.translate(mothPos.current.x, mothPos.current.y);
      ctx.rotate(mothAngle.current);

      // Nếu đang bất tử nhấp nháy mờ dịu
      if (isMButterflyInvulnerable && gameTime.current % 8 < 4) {
        ctx.globalAlpha = 0.35;
      }

      // Vỗ cánh nhịp sin
      const pulseWingAngle = Math.sin(gameTime.current * (isMButterflyInWeb ? 0.8 : 0.42)) * 0.9;
      const wingS = Math.abs(pulseWingAngle);

      // 1. Râu lông vũ rực vàng
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(10, -3);
      ctx.quadraticCurveTo(24, -14, 28, -26);
      ctx.moveTo(10, 3);
      ctx.quadraticCurveTo(24, 14, 28, 26);
      ctx.stroke();

      // 2. Hai đôi cánh vỗ nhịp ngọt
      ctx.save();
      // Nếu có Buff Speed Boost cánh chuyển sang màu viền xanh lam lóe lướt chói lóa
      ctx.fillStyle = speedBoostLeft > 0 ? '#3b82f6' : '#64748b';
      
      // Cánh trước trái
      ctx.beginPath();
      ctx.moveTo(4, -3);
      ctx.bezierCurveTo(-14, -40 * wingS, -46, -42 * wingS, -52, -15 * wingS);
      ctx.bezierCurveTo(-42, 6 * wingS, -14, 0, 4, -3);
      ctx.fill();

      // Đốm nguyệt quế trang trí
      ctx.fillStyle = speedBoostLeft > 0 ? '#93c5fd' : '#fef08a';
      ctx.fillRect(-34, -20 * wingS, 7, 7);

      ctx.fillStyle = speedBoostLeft > 0 ? '#3b82f6' : '#64748b';
      // Cánh trước phải
      ctx.beginPath();
      ctx.moveTo(4, 3);
      ctx.bezierCurveTo(-14, 40 * wingS, -46, 42 * wingS, -52, 15 * wingS);
      ctx.bezierCurveTo(-42, -6 * wingS, -14, 0, 4, 3);
      ctx.fill();

      // Đốm cánh phải
      ctx.fillStyle = speedBoostLeft > 0 ? '#93c5fd' : '#fef08a';
      ctx.fillRect(-34, 14 * wingS, 7, 7);
      ctx.restore();

      // Cánh bé phụ sau
      ctx.save();
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(-10, -3);
      ctx.bezierCurveTo(-26, -30 * wingS, -38, -20 * wingS, -34, -5 * wingS);
      ctx.lineTo(-10, -3);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-10, 3);
      ctx.bezierCurveTo(-26, 30 * wingS, -38, 20 * wingS, -34, 5 * wingS);
      ctx.lineTo(-10, 3);
      ctx.fill();
      ctx.restore();

      // 3. Thân mạp bướm đêm
      ctx.fillStyle = '#334155';
      ctx.fillRect(-18, -6, 32, 12);
      ctx.fillRect(-22, -4, 40, 8);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(10, 0, 7, 0, Math.PI * 2);
      ctx.fill();

      // Mắt đỏ
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(11, -5, 3, 3);
      ctx.fillRect(11, 2, 3, 3);

      ctx.restore();

      // VẼ VẢI LÁ CHẮN HỘ THÂN (SHIELD EFFECT) LUNG LINH XANH BIẾC BAO PHỦ BÁM RẢI
      if (hasShield) {
        ctx.save();
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 4]);
        ctx.globalAlpha = 0.65 + Math.sin(gameTime.current * 0.1) * 0.25;
        ctx.beginPath();
        ctx.arc(mothPos.current.x, mothPos.current.y, 44, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(96, 165, 250, 0.08)';
        ctx.fill();
        ctx.restore();
      }

      // 10. ĐỒNG HÀNH MIẾN MÚA BAY QUANH BƯỚM ĐÊM CHÍNH (Companion Swarm)
      companionMoths.current.forEach(c => {
        const orbitRadius = 110 + Math.sin(gameTime.current * 0.05 + c.id) * 35;
        const angle = (gameTime.current * 0.015 + (c.id * Math.PI * 2) / 6) % (Math.PI * 2);
        
        c.targetX = mothPos.current.x + Math.cos(angle) * orbitRadius;
        c.targetY = mothPos.current.y + Math.sin(angle) * (orbitRadius * 0.7) - 30;

        c.x += (c.targetX - c.x) * 0.05;
        c.y += (c.targetY - c.y) * 0.05;
        c.wingAngle = Math.sin(gameTime.current * c.wingSpeed) * 0.85;

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(angle + Math.PI / 2);
        
        const cWS = Math.abs(c.wingAngle);
        ctx.fillStyle = c.color;
        
        ctx.beginPath();
        ctx.moveTo(2, -2);
        ctx.lineTo(-c.size, -c.size * 1.5 * cWS);
        ctx.lineTo(-c.size * 1.3, -c.size * 0.3 * cWS);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(2, 2);
        ctx.lineTo(-c.size, c.size * 1.5 * cWS);
        ctx.lineTo(-c.size * 1.3, c.size * 0.3 * cWS);
        ctx.fill();

        ctx.fillStyle = '#475569';
        ctx.fillRect(-c.size * 0.8, -c.size * 0.25, c.size * 1.4, c.size * 0.5);
        ctx.restore();

        if (Math.random() < 0.1) {
          addParticles(c.x, c.y, c.color, 1, 'sparkle');
        }
      });
    }

    // ==========================================
    // 12. GIAI ĐOẠN GIAO PHỐI (MATING STAGE)
    // ==========================================
    if (stageRef.current === GameStage.MATING) {
      matingTimer.current++;
      
      // Khích múa xoáy vòng ở giữa màn hình hoàng hôn/ngoài đêm
      const centerX = 400;
      const centerY = 280;
      mothPos.current.x = centerX + Math.sin(gameTime.current * 0.04) * 50;
      mothPos.current.y = centerY + Math.cos(gameTime.current * 0.03) * 30;
      mothAngle.current = Math.sin(gameTime.current * 0.02) * 0.5;

      // Bạn tình di chuyển tới múa cùng
      if (mateMoth.current) {
        const mate = mateMoth.current;
        const targetMateX = mothPos.current.x + 55 + Math.sin(gameTime.current * 0.05) * 15;
        const targetMateY = mothPos.current.y - 12 + Math.cos(gameTime.current * 0.04) * 15;
        
        mate.x += (targetMateX - mate.x) * 0.05;
        mate.y += (targetMateY - mate.y) * 0.05;
        mate.angle = Math.atan2(mothPos.current.y - mate.y, mothPos.current.x - mate.x);
        mate.wingAngle = Math.sin(gameTime.current * 0.35) * 0.95;
      }

      // Tạo hạt tim tình yêu lãng mạn lơ lửng giữa hai bạn bướm
      if (gameTime.current % 12 === 0) {
        const mx = (mothPos.current.x + (mateMoth.current?.x ?? mothPos.current.x)) / 2;
        const my = (mothPos.current.y + (mateMoth.current?.y ?? mothPos.current.y)) / 2;
        addParticles(mx + (Math.random() - 0.5) * 30, my + (Math.random() - 0.5) * 20, '#f43f5e', 4, 'sparkle', 0.8);
      }

      // Đếm ngược 10 giây (600 frames)
      const remainingSecs = Math.max(0, 10 - Math.floor(matingTimer.current / 60));
      setHudMessage(`❤️ VŨ ĐIỆU GIAO PHỐI: Thăng hoa bờ bến hạnh phúc cùng bạn tình tình cảm... (${remainingSecs}s)`);

      if (matingTimer.current >= 600) {
        // Chuyển sang đẻ trứng
        audio.playShieldOn();
        setStage(GameStage.EGG_LAYING);
        eggLayingTimer.current = 0;
        laidEggsCount.current = 0;
        laidEggsList.current = [];
        setHudMessage('☘️ GIAO PHỐI THÀNH CÔNG: Mẹ bướm đêm đang bay tìm chiếc lá an toàn mơn mởn để gửi gắm 7 quả trứng thiêng liên...');
      }

      // VẼ MẸ BƯỚM CHÍNH
      ctx.save();
      ctx.translate(mothPos.current.x, mothPos.current.y);
      ctx.rotate(mothAngle.current);
      const wingS = Math.abs(Math.sin(gameTime.current * 0.38));
      
      // Cánh lông vũ vàng
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, -3); ctx.quadraticCurveTo(24, -14, 28, -26);
      ctx.moveTo(10, 3); ctx.quadraticCurveTo(24, 14, 28, 26);
      ctx.stroke();

      ctx.fillStyle = '#64748b'; // Cánh xám
      ctx.beginPath();
      ctx.moveTo(4, -3);
      ctx.bezierCurveTo(-14, -40 * wingS, -46, -42 * wingS, -52, -15 * wingS);
      ctx.bezierCurveTo(-42, 6 * wingS, -14, 0, 4, -3);
      ctx.fill();
      ctx.fillStyle = '#fef08a'; ctx.fillRect(-34, -20 * wingS, 7, 7);

      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(4, 3);
      ctx.bezierCurveTo(-14, 40 * wingS, -46, 42 * wingS, -52, 15 * wingS);
      ctx.bezierCurveTo(-42, -6 * wingS, -14, 0, 4, 3);
      ctx.fill();
      ctx.fillStyle = '#fef08a'; ctx.fillRect(-34, 14 * wingS, 7, 7);

      ctx.fillStyle = '#334155'; ctx.fillRect(-18, -6, 32, 12);
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(10, 0, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f43f5e'; ctx.fillRect(11, -5, 3, 3); ctx.fillRect(11, 2, 3, 3);
      ctx.restore();

      // VẼ BẠN TÌNH (ĐẸP ĐỘC ĐÁO MÀU LỬA VÀNG CHÓI LỌA)
      if (mateMoth.current) {
        const mate = mateMoth.current;
        ctx.save();
        ctx.translate(mate.x, mate.y);
        ctx.rotate(mate.angle);
        const mateWingS = Math.abs(mate.wingAngle);

        ctx.strokeStyle = '#f97316'; // Lông vũ râu cam
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(10, -3); ctx.quadraticCurveTo(22, -12, 26, -24);
        ctx.moveTo(10, 3); ctx.quadraticCurveTo(22, 12, 26, 24);
        ctx.stroke();

        ctx.fillStyle = '#f43f5e'; // Cánh hồng rực rỡ
        ctx.beginPath();
        ctx.moveTo(3, -2);
        ctx.bezierCurveTo(-12, -36 * mateWingS, -42, -38 * mateWingS, -48, -14 * mateWingS);
        ctx.bezierCurveTo(-38, 5 * mateWingS, -12, 0, 3, -2);
        ctx.fill();
        ctx.fillStyle = '#fde047'; ctx.fillRect(-30, -18 * mateWingS, 6, 6);

        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(3, 2);
        ctx.bezierCurveTo(-12, 36 * mateWingS, -42, 38 * mateWingS, -48, 14 * mateWingS);
        ctx.bezierCurveTo(-38, -5 * mateWingS, -12, 0, 3, 2);
        ctx.fill();
        ctx.fillStyle = '#fde047'; ctx.fillRect(-30, 18 * mateWingS, 6, 6);

        ctx.fillStyle = '#e11d48'; ctx.fillRect(-16, -5, 28, 10);
        ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(8, 0, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#a855f7'; ctx.fillRect(9, -4, 2.5, 2.5); ctx.fillRect(9, 1.5, 2.5, 2.5);
        ctx.restore();
      }
    }

    // ==========================================
    // 13. GIAI ĐOẠN ĐẺ TRỨNG (EGG LAYING STAGE)
    // ==========================================
    if (stageRef.current === GameStage.EGG_LAYING) {
      eggLayingTimer.current++;

      // Lá mục tiêu đẻ trứng nằm góc trung tâm branch lá cây
      const targetAnchorX = 520;
      const targetAnchorY = 200;

      // Bay tự động từ từ cập sát chiếc lá
      const distToLeaf = Math.hypot(targetAnchorX - mothPos.current.x, targetAnchorY - mothPos.current.y);
      const isAnchored = distToLeaf < 8;

      if (!isAnchored) {
        mothPos.current.x += (targetAnchorX - mothPos.current.x) * 0.05;
        mothPos.current.y += (targetAnchorY - mothPos.current.y) * 0.05;
        mothAngle.current = Math.atan2(targetAnchorY - mothPos.current.y, targetAnchorX - mothPos.current.x);
        setHudMessage('☘️ ĐANG BAY CHỌN LÁ: Di chuyển khẩn thiết tới vòm lá an toàn rậm rạp...');
      } else {
        // Đã đậu cố định -> Bắt đầu rung lắc phần đuôi bụng đẻ trứng dồn dập
        mothAngle.current = 0.4; // Đậu xiên trên lá
        mothPos.current.x = targetAnchorX;
        mothPos.current.y = targetAnchorY;

        const shiverX = Math.sin(gameTime.current * 0.8) * 1.5;
        const shiverY = Math.cos(gameTime.current * 0.9) * 1.5;

        // Cứ mỗi 70 frames đẻ 1 quả trứng óng ánh
        if (eggLayingTimer.current > 60 && laidEggsCount.current < 7 && eggLayingTimer.current % 70 === 0) {
          laidEggsCount.current++;
          audio.playCrack();
          addParticles(targetAnchorX - 18, targetAnchorY + 14, '#10b981', 12, 'pollen', 1.0);

          laidEggsList.current.push({
            x: targetAnchorX - 22 + (laidEggsCount.current * 6),
            y: targetAnchorY + 12 + (shiverY * 0.5)
          });

          floatingTexts.current.push({
            x: targetAnchorX - 10,
            y: targetAnchorY - 14,
            text: ` quả thứ ${laidEggsCount.current}/7 ✨`,
            opacity: 1,
            timer: 60
          });
        }

        setHudMessage(`☘️ ĐANG ĐÈ TRỨNG GỬI GAM THẾ HỆ MAI SAU: Đã đẻ được ${laidEggsCount.current}/7 hạt trứng xanh ngọc...`);

        // Đẻ xong tất cả 7 trứng -> Chuyển sang giai đoạn từ giã cõi đời
        if (laidEggsCount.current >= 7 && eggLayingTimer.current > 600) {
          setStage(GameStage.DEATH);
          dyingTimer.current = 0;
          mothDyingAlpha.current = 1.0;
          setHudMessage('✨ HOÀN THÀNH SỨ MỆNH: Cơ thể mẹ bướm đêm yếu dần, chao lượn rơi xuống thảm cỏ mềm và hóa thân siêu thoát...');
        }
      }

      // VẼ MẸ ĐẺ TRỨNG (vỗ cánh chậm dịu)
      ctx.save();
      ctx.translate(mothPos.current.x, mothPos.current.y);
      ctx.rotate(mothAngle.current);
      const wingS = isAnchored ? 0.35 + Math.sin(gameTime.current * 0.08) * 0.15 : Math.abs(Math.sin(gameTime.current * 0.35));
      
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, -3); ctx.quadraticCurveTo(24, -14, 28, -26);
      ctx.moveTo(10, 3); ctx.quadraticCurveTo(24, 14, 28, 26);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(4, -3);
      ctx.bezierCurveTo(-14, -40 * wingS, -46, -42 * wingS, -52, -15 * wingS);
      ctx.bezierCurveTo(-42, 6 * wingS, -14, 0, 4, -3);
      ctx.fill();

      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(4, 3);
      ctx.bezierCurveTo(-14, 40 * wingS, -46, 42 * wingS, -52, 15 * wingS);
      ctx.bezierCurveTo(-42, -6 * wingS, -14, 0, 4, 3);
      ctx.fill();

      ctx.fillStyle = '#334155'; ctx.fillRect(-18, -6, 32, 12);
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(10, 0, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f43f5e'; ctx.fillRect(11, -5, 3, 3); ctx.fillRect(11, 2, 3, 3);
      ctx.restore();

      // VẼ NHỮNG QUẢ TRỨNG ĐÃ ĐẺ ĐƯỢC
      laidEggsList.current.forEach((egg, idx) => {
        ctx.save();
        ctx.translate(egg.x, egg.y);
        ctx.shadowColor = '#67e8f9';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#a5f3fc'; // Màu xanh ngọc rạng rỡ
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 3, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    // ==========================================
    // 14. GIAI ĐOẠN QUA ĐỜI & SIÊU THOÁT (DEATH STAGE)
    // ==========================================
    if (stageRef.current === GameStage.DEATH) {
      dyingTimer.current++;

      // Vẽ những quả trứng đã đẻ ở trên chiếc lá dệt ngọc
      const targetAnchorX = 520;
      const targetAnchorY = 200;
      for (let idx = 1; idx <= 7; idx++) {
        ctx.save();
        ctx.translate(targetAnchorX - 22 + (idx * 6), targetAnchorY + 12);
        ctx.shadowColor = '#67e8f9';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#a5f3fc';
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 3, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Chờ 3 giây (180 frames) run rẩy yếu ớt trên lá rồi mới bắt đầu rơi xuống
      if (dyingTimer.current <= 180) {
        mothPos.current.x = targetAnchorX + Math.sin(gameTime.current * 0.9) * 0.3;
        mothPos.current.y = targetAnchorY + Math.cos(gameTime.current * 0.8) * 0.3;
        mothAngle.current = 0.4; // Đậu xiên yếu ớt trên lá
        
        if (gameTime.current % 30 === 0) {
          addParticles(mothPos.current.x, mothPos.current.y, '#eab308', 2, 'sparkle', 0.5);
        }
      } else {
        // Tiến trình qua đời: Rơi chao đảo mệt mỏi
        if (mothPos.current.y < 535) {
          // Chao nghiêng qua trái phải xiên xiên rất chân thật và buồn bã
          mothPos.current.y += 1.4;
          mothPos.current.x += Math.sin(gameTime.current * 0.05) * 1.5;
          mothAngle.current = Math.PI + Math.sin(gameTime.current * 0.03) * 0.5; // Quay ngược
          
          if (gameTime.current % 22 === 0) {
            audio.playMove(); // Vỗ cánh thều thào
          }
        } else {
          // Đã nằm yên trên nền cỏ -> Tan biến dần biến thành cát bụi phát sáng lung linh
          mothAngle.current = Math.PI;
          if (mothDyingAlpha.current > 0) {
            mothDyingAlpha.current = Math.max(0, mothDyingAlpha.current - 0.005);
            
            if (gameTime.current % 10 === 0 && mothDyingAlpha.current > 0.1) {
              addParticles(mothPos.current.x + (Math.random() - 0.5) * 24, mothPos.current.y, '#fef08a', 1, 'sparkle', 0.6);
            }
          } else {
            // Bướm mẹ đã tan biến hoàn toàn -> Linh hồn (Angel Soul) thức tỉnh bắt đầu thăng hoa!
            const soul = angelSoul.current as any;
            if (!soul.active) {
              audio.playShieldOn(); // Âm thanh thanh khiết tâm linh siêu sinh
              soul.x = mothPos.current.x;
              soul.y = mothPos.current.y;
              soul.alpha = 0;
              soul.haloAngle = 0;
              soul.active = true;
            } else {
              soul.alpha = Math.min((soul.alpha ?? 0) + 0.015, 1);
              soul.y -= 1.1; // Float bay thấu mây xanh
              soul.haloAngle = (soul.haloAngle ?? 0) + 0.04;

              // Rải bụi lấp lánh sau linh hồn vút bay
              if (gameTime.current % 5 === 0) {
                addParticles(soul.x + (Math.random() - 0.5) * 18, soul.y + 10, '#38bdf8', 1, 'sparkle', 1.0);
                addParticles(soul.x + (Math.random() - 0.5) * 12, soul.y + 15, '#e2fbf0', 1, 'pollen', 0.6);
              }

              setHudMessage(`👼 LINH HỒN SIÊU THOÁT: Linh hồn bay tới trời xanh vĩnh hằng tái sinh vòng đời tiếp theo... (${Math.max(0, 600 - Math.floor(soul.y))}m)`);

              // Đạt độ cao thấu trời xanh mây -> CHIẾN THẮNG TRỌN VẸN VÒNG ĐỜI
              if (soul.y <= 60) {
                audio.playWin();
                setStage(GameStage.VICTORY);
              }
            }
          }
        }
      }

      // VẼ MẸ BƯỚM TAN BIẾN (MOTH DYING)
      if (mothDyingAlpha.current > 0) {
        ctx.save();
        ctx.globalAlpha = mothDyingAlpha.current;
        ctx.translate(mothPos.current.x, mothPos.current.y);
        ctx.rotate(mothAngle.current);
        
        // Vỗ cánh mỏi mệt thều thào cực chậm
        const wingS = 0.15 + Math.abs(Math.sin(gameTime.current * 0.05)) * 0.15;

        // Vẽ thân mỏi mệt sẫm
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-18, -6, 32, 12);
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(4, -3); ctx.bezierCurveTo(-14, -30 * wingS, -46, -32 * wingS, -52, -10 * wingS);
        ctx.bezierCurveTo(-42, 4 * wingS, -14, 0, 4, -3); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(4, 3); ctx.bezierCurveTo(-14, 30 * wingS, -46, 32 * wingS, -52, 10 * wingS);
        ctx.bezierCurveTo(-42, -4 * wingS, -14, 0, 4, 3); ctx.fill();
        ctx.restore();
      }

      // VẼ BẢN THỂ LINH HỒN (ANGEL SOUL) PHÁT SÁNG CỰC KỲ THẦN TIÊN LINH DIỆU
      if (angelSoul.current) {
        const soul = angelSoul.current;
        ctx.save();
        ctx.globalAlpha = soul.alpha;
        ctx.translate(soul.x, soul.y);

        // Hào quang thiên sứ bao quanh
        ctx.shadowColor = '#60a5fa';
        ctx.shadowBlur = 18 + Math.sin(gameTime.current * 0.1) * 8;

        // Vẽ vệt sáng Thiên sứ
        const ssWingS = 0.45 + Math.sin(gameTime.current * 0.12) * 0.35;
        ctx.fillStyle = '#f0fdf4'; // Trắng ngọc ngân

        // Cánh linh hồn mềm lướt nhịp nhấp nhô
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.bezierCurveTo(-10, -28 * ssWingS, -32, -30 * ssWingS, -38, -10 * ssWingS);
        ctx.bezierCurveTo(-30, 4 * ssWingS, -10, 0, 0, -2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.bezierCurveTo(-10, 28 * ssWingS, -32, 30 * ssWingS, -38, 10 * ssWingS);
        ctx.bezierCurveTo(-30, -4 * ssWingS, -10, 0, 0, 2);
        ctx.fill();

        // Thân thể linh hồn thon dài phát huỳnh quang
        ctx.fillStyle = '#93c5fd';
        ctx.fillRect(-12, -3, 20, 6);

        // Vẽ chiếc HALO thiên sứ (vòng kim cô phát sáng rực rỡ xoay tròn trên đầu linh hồn)
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.8;
        ctx.save();
        ctx.translate(14, 0);
        ctx.rotate(soul.haloAngle);
        ctx.scale(1.2, 0.4);
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.restore();
      }
    }

    // 11. CẬP NHẬT VÀ VẼ HẠT PARTICLES
    particles.current = particles.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life++;

      p.vx *= 0.98;
      p.vy *= p.type === 'sparkle' ? 0.97 : 0.98;

      const alpha = 1.0 - p.life / p.maxLife;
      if (alpha <= 0) return false;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'pixel') {
        ctx.fillRect(p.x, p.y, p.size, p.size);
      } else if (p.type === 'sparkle') {
        ctx.fillRect(p.x - p.size, p.y, p.size * 2, 1);
        ctx.fillRect(p.x, p.y - p.size, 1, p.size * 2);
      } else if (p.type === 'pollen') {
        ctx.fillStyle = '#fde047';
        ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
      } else if (p.type === 'silk') {
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(p.x, p.y, p.size, p.size * 2);
      } else {
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.restore();
      return true;
    });

    // 12. VẼ HIỆU ỨNG VIỀN MÀN HÌNH ĐỎ CẢNH BÁO "DANGER ZONE" KHI KẺ THÙ Ở QUÁ GẦN (< 140px)
    if (nearPredatorAlert.current && stageRef.current === GameStage.MOTH) {
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
      ctx.lineWidth = 14 + Math.sin(gameTime.current * 0.15) * 5;
      ctx.strokeRect(0, 0, 800, 600);
      
      ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
      ctx.fillRect(0, 0, 800, 600);
      ctx.restore();
    }

    // 13. VẼ BẢN ĐỒ RADAR KHU VỰC GÓC DƯỚI BÊN TRÁI MÀN HÌNH (GÓC DƯỚI 120x90)
    if (stageRef.current === GameStage.MOTH) {
      const rx = 20;
      const ry = 480;
      const rw = 130;
      const rh = 95;
      
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(rx, ry, rw, rh);

      // Sọc tơ dệt xanh chỉ tơ
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('📡 MINI-RADAR', rx + 6, ry + 12);

      // Chấm vị trí Bướm đêm (Trắng xanh biển)
      const px = rx + (mothPos.current.x / 800) * rw;
      const py = ry + (mothPos.current.y / 600) * rh;
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(px - 3, py - 3, 6, 6);

      // Chấm hoa màu xanh xốp hoặc vàng
      flowers.current.forEach(f => {
        const fx = rx + (f.x / 800) * rw;
        const fy = ry + (f.y / 600) * rh;
        ctx.fillStyle = f.pollinated ? '#93c5fd' : '#22c55e';
        ctx.beginPath();
        ctx.arc(fx, fy, f.pollinated ? 2 : 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Chấm vàng Mạng nhện
      spiderWebs.current.forEach(web => {
        const wx = rx + (web.x / 800) * rw;
        const wy = ry + (web.y / 600) * rh;
        ctx.fillStyle = '#d97706';
        ctx.fillRect(wx - 2.5, wy - 2.5, 5, 5);
      });

      // Chấm đỏ Kẻ săn mồi (Chim dơi)
      predators.current.forEach(pred => {
        const kx = rx + (pred.x / 800) * rw;
        const ky = ry + (pred.y / 600) * rh;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(kx, ky, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }

    animationFrameId.current = requestAnimationFrame(drawAndUpdate);
  };

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(drawAndUpdate);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  const isPostCocoon = stage === GameStage.MOTH || stage === GameStage.MATING || stage === GameStage.EGG_LAYING || stage === GameStage.DEATH;

  return (
    <div className="relative bg-stone-900 border-4 border-stone-700 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center">
      
      {/* Giao diện HUD chuyên nghiệp */}
      <div id={`hud-bar`} className="w-full bg-stone-800/90 border-b-4 border-stone-700 px-5 py-3 flex flex-wrap justify-between items-center gap-4 text-white z-10 font-mono">
        
        {/* Điểm số pixel & Mạng sống bướm */}
        <div id={`hud-score-lives`} className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-600">
            <Award className="w-4 h-4 text-yellow-400" />
            <span className="text-[10px] text-stone-400">ĐIỂM:</span>
            <span className="text-xl font-bold text-yellow-300 tracking-wide font-sans">
              {String(score).padStart(4, '0')}
            </span>
          </div>

          {stage === GameStage.MOTH && (
            <div id={`hud-lives-block`} className="flex items-center gap-1.5 bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-600">
              <span className="text-[10px] text-stone-400 uppercase">MẠNG SỐNG:</span>
              <div className="flex gap-1">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Heart
                    key={idx}
                    className={`w-4 h-4 transition-all ${idx < lives ? 'text-rose-500 fill-rose-500 scale-110 drop-shadow-[0_0_5px_#f43f5e]' : 'text-stone-700'}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Trạng thái game ở giữa: Tiến độ thụ phấn và tiến sinh học */}
        <div id={`hud-center-state`} className="flex items-center gap-3 min-w-[240px] justify-center">
          {stage === GameStage.EGG && (
            <div className="w-full flex flex-col justify-center text-center">
              <div className="flex justify-between text-[11px] mb-1 font-bold text-teal-400">
                <span>🥚 TRỨNG SẮP NỞ (PHÁ THƯ DU)</span>
                <span>{Math.max(0, Math.ceil((300 - eggTimer.current) / 60))}s</span>
              </div>
              <div className="w-full h-2.5 bg-neutral-950 border border-neutral-700 rounded p-[1px]">
                <div
                  className="h-full rounded bg-teal-400 transition-all duration-100 animate-pulse"
                  style={{ width: `${(eggTimer.current / 300) * 100}%` }}
                />
              </div>
            </div>
          )}

          {stage === GameStage.CATERPILLAR && (
            <div className="w-full">
              <div className="flex justify-between text-[11px] mb-1 font-bold text-emerald-400">
                <span>🍃 NĂNG LƯỢNG SÂU ĐO</span>
                <span>{energy}%</span>
              </div>
              <div className="w-full h-3 bg-neutral-950 border border-neutral-600 rounded p-[1px]">
                <div
                  className="h-full rounded"
                  style={{
                    width: `${energy}%`,
                    backgroundColor: energy >= 100 ? '#facc15' : '#10b981',
                  }}
                />
              </div>
            </div>
          )}

          {stage === GameStage.TRANSITION_TO_COCOON && (
            <div className="text-[12px] bg-emerald-900/40 border border-emerald-600/30 px-3 py-1 text-emerald-300 font-bold rounded animate-pulse">
              ✨ ĐANG DI CHUYỂN LÊN CÀNH
            </div>
          )}

          {stage === GameStage.COCOON && (
            <div className="w-full flex items-center justify-between bg-amber-950/60 py-1.5 px-3 rounded border border-amber-600/30 gap-3">
              <div className="flex flex-col">
                <span className="text-[9px] text-amber-400 font-bold leading-none">⏱️ THỜI GIAN NỞ</span>
                <span className="text-lg font-bold text-yellow-300 tracking-wider">
                  {Math.ceil(cocoonCountdown.current)} giây
                </span>
              </div>
              <button
                id={`btn-accel`}
                onClick={handleCocoonTap}
                className="bg-amber-600 hover:bg-amber-500 text-yellow-100 font-bold text-[11px] py-1 px-2.5 rounded-md border border-yellow-300 shadow active:translate-y-[1px] cursor-pointer transition-all"
              >
                🖱️ TAP RUNG (-1.5s)
              </button>
            </div>
          )}

          {stage === GameStage.HATCHING && (
            <div className="text-[12px] bg-amber-900 px-3 py-1.5 text-yellow-300 font-bold rounded border border-yellow-500 animate-bounce">
              ⚡ KÉN ĐANG NỨT - BÙNG NỞ!
            </div>
          )}

          {stage === GameStage.MOTH && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-indigo-950/80 px-3 py-1.5 rounded-lg border border-indigo-500/20">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] text-indigo-300 uppercase">THỤ PHẤN:</span>
                <span className="text-lg font-bold text-cyan-400 font-sans">{pollinatedCount}/5</span>
              </div>
              
              {/* Buff Indicators */}
              <div className="flex gap-1.5">
                {speedBoostLeft > 0 && (
                  <div className="p-1 px-2 rounded bg-blue-900 border border-blue-500 flex items-center gap-1 text-[9px] text-blue-200 animate-pulse">
                    <Zap className="w-3 h-3 text-blue-400" />
                    <span>BOOST ({Math.ceil(speedBoostLeft)}s)</span>
                  </div>
                )}
                {hasShield && (
                  <div className="p-1 px-2 rounded bg-emerald-900 border border-emerald-500 flex items-center gap-1 text-[9px] text-emerald-200">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>SHIELD</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {stage === GameStage.MATING && (
            <div className="flex items-center justify-center bg-rose-950/70 border border-rose-500/30 px-4 py-1.5 rounded text-rose-300 text-xs font-bold gap-2 animate-pulse">
              <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
              <span>DANCE YÊU THƯƠNG ({Math.max(0, 10 - Math.floor(matingTimer.current / 60))}s)</span>
            </div>
          )}

          {stage === GameStage.EGG_LAYING && (
            <div className="flex items-center justify-center bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 rounded text-emerald-300 text-xs font-bold gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span>ĐANG ĐÈ TRỤNG: {laidEggsCount.current}/7 QUẢ ✨</span>
            </div>
          )}

          {stage === GameStage.DEATH && (
            <div className="flex items-center justify-center bg-sky-950/90 border border-sky-500/30 px-3 py-1.5 rounded text-sky-200 text-xs font-bold gap-1.5 animate-pulse">
              <span>👼 LINH HỒN SIÊU THOÁT...</span>
            </div>
          )}
        </div>

        {/* Âm thanh, Chơi lại & Log thời gian sinh tồn */}
        <div id={`hud-actions-time`} className="flex items-center gap-3">
          {isPostCocoon && (
            <div className="flex items-center gap-1 bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-600 text-[11px]">
              <Timer className="w-3.5 h-3.5 text-sky-400" />
              <span>SINH TỒN: {survivalSecs}s</span>
            </div>
          )}

          <button
            id={`btn-toggle-sound`}
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 bg-stone-700 hover:bg-stone-600 text-white rounded-lg border border-stone-500 cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          
          <button
            id={`btn-reset`}
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-700 hover:bg-rose-600 border border-rose-500 text-white font-bold rounded-lg text-xs cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* CANVAS VẼ CHÍNH 800x600 ASPECT RATIO 4:3 */}
      <canvas
        id={`main-game-canvas`}
        ref={canvasRef}
        width={800}
        height={600}
        onMouseMove={handleCanvasMouseMove}
        onMouseDown={handleCanvasMouseDown}
        className="block bg-black cursor-crosshair w-full max-w-[800px] border-b-4 border-stone-700 aspect-[4/3] transition-all duration-300"
      />

      {/* DẢI BANNER TIN NHẮN TRẬN ĐẤU (BATTLE MESSAGES) TRỰC QUAN GÓC DƯỚI */}
      <div id={`battle-message-bar`} className="w-full bg-stone-950/95 py-2 px-5 border-t border-stone-800 text-center flex items-center justify-center gap-2">
        <span className="text-yellow-400 font-bold font-mono text-xs animate-pulse">📢 THÔNG BÁO:</span>
        <p className="text-stone-300 text-xs font-medium font-mono">{hudMessage}</p>
      </div>

      {/* MÀN HÌNH GAME OVER (THUA CUỘC) */}
      {stage === GameStage.GAME_OVER && (
        <GameOverPopup
          score={score}
          pollinatedCount={pollinatedCount}
          onRestart={onReset}
        />
      )}

      {/* MÀN HÌNH VICTORY TRÁNG LỆ (CHIẾN THẮNG HOÀN THÀNH VÒNG ĐỜI) */}
      {stage === GameStage.VICTORY && (
        <VictoryPopup
          score={score}
          survivalSecs={survivalSecs}
          leavesEaten={leavesEatenCount.current}
          eggsLaidCount={laidEggsCount.current}
          onRestart={onReset}
        />
      )}

    </div>
  );
}
