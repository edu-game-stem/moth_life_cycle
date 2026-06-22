/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameStage } from './types';
import GameCanvas from './components/GameCanvas';
import Instructions from './components/Instructions';
import { Sparkles, Trophy, Bug, HelpCircle, Eye, Info } from 'lucide-react';

export default function App() {
  const [stage, setStage] = useState<GameStage>(GameStage.EGG);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [energy, setEnergy] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(true);

  // Load HighScore from LocalStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('moth_game_highscore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // Sync new highScore
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('moth_game_highscore', String(score));
    }
  }, [score, highScore]);

  const handleResetGame = () => {
    setStage(GameStage.EGG);
    setScore(0);
    setEnergy(0);
  };

  return (
    <div id={`app-container`} className="min-h-screen bg-stone-950 bg-radial from-stone-900/40 to-stone-950 flex flex-col justify-between select-none">
      {/* HEADER: Tiêu đề trò chơi Pixel Art mộc mạc phong cách thiên nhiên */}
      <header id={`top-header`} className="w-full bg-stone-900/60 border-b border-stone-800/80 py-4 px-6 gap-4 flex flex-wrap justify-between items-center backdrop-blur-md">
        <div id={`logo-block`} className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-950/80 border-2 border-emerald-500 rounded-lg shadow-sm">
            <Bug className="w-6 h-6 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-pixel tracking-wider text-emerald-400">
              MOTH LIFECYCLE SIMULATOR
            </h1>
            <p className="text-xs text-stone-400 font-medium">
              Vòng Đời Bướm Đêm 2D • Phong cách Pixel Art Retro
            </p>
          </div>
        </div>

        <div id={`high-score-block`} className="flex items-center gap-2 bg-stone-950/60 border border-amber-500/20 px-4 py-2 rounded-xl">
          <Trophy className="w-4 h-4 text-amber-400 animate-bounce" />
          <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">KỶ LỤC:</span>
          <span className="text-lg font-black text-amber-300 font-pixel">
            {String(highScore).padStart(4, '0')}
          </span>
        </div>
      </header>

      {/* BODY CHÍNH GỒM GRID CANVAS VÀ PANEL KIẾN THỨC SINH HỌC */}
      <main id={`main-game-layout`} className="max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
        
        {/* KHU VỰC GAME CANVAS CHÍNH (8/12 cột) */}
        <div id={`canvas-wrapper`} className="col-span-1 lg:col-span-8 flex flex-col gap-4">
          <GameCanvas
            stage={stage}
            setStage={setStage}
            score={score}
            setScore={setScore}
            energy={energy}
            setEnergy={setEnergy}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            onReset={handleResetGame}
          />
        </div>

        {/* SIDEBAR TƯƠNG TÁC TIỂU SỬ VÀ CHỈ DẪN SINH HỌC (4/12 cột) */}
        <div id={`sidebar-information`} className="col-span-1 lg:col-span-4 flex flex-col gap-4 h-full justify-start">
          
          {/* Hộp chỉ dẫn tương tác sinh động tương ứng từng chặng phát triển */}
          <Instructions stage={stage} />

          {/* Sơ đồ tuần hoàn tóm tắt các giai đoạn Sinh trưởng của Bướm đêm */}
          <div id={`stages-timeline`} className="bg-stone-900/40 border border-stone-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-stone-300 font-mono flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>SƠ ĐỒ PHÁT TRIỂN TUẦN HOÀN</span>
            </h3>

            <div className="relative flex flex-col gap-4 pl-4 border-l-2 border-stone-800/80">
              {/* Chặng 0: Trứng */}
              <div className="relative">
                <div className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-all ${stage === GameStage.EGG ? 'bg-cyan-400 border-white ring-4 ring-cyan-500/20' : 'bg-stone-800 border-stone-700'}`} />
                <h4 className={`text-xs font-bold ${stage === GameStage.EGG ? 'text-cyan-400' : 'text-stone-400'}`}>
                  🥚 Trứng bướm (Egg Stage)
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                  Trứng lấp lánh đung đưa nhẹ trên lá. Chờ 5 giây tự động nứt vỏ nở thành sâu.
                </p>
              </div>

              {/* Chặng 1: Sâu */}
              <div className="relative">
                <div className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-all ${stage === GameStage.CATERPILLAR ? 'bg-emerald-400 border-white ring-4 ring-emerald-500/20' : 'bg-stone-800 border-stone-700'}`} />
                <h4 className={`text-xs font-bold ${stage === GameStage.CATERPILLAR ? 'text-emerald-400' : 'text-stone-400'}`}>
                  🐛 Sâu Đo dẻo dai (Caterpillar)
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                  Bò uốn dẻo để tìm lá cây. Ăn đầy 100% năng lượng để di chuyển lên cành làm kén.
                </p>
              </div>

              {/* Chặng 2: Kén */}
              <div className="relative">
                <div className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-all ${stage === GameStage.COCOON || stage === GameStage.TRANSITION_TO_COCOON || stage === GameStage.HATCHING ? 'bg-amber-400 border-white ring-4 ring-amber-500/20' : 'bg-stone-800 border-stone-700'}`} />
                <h4 className={`text-xs font-bold ${stage === GameStage.COCOON || stage === GameStage.TRANSITION_TO_COCOON || stage === GameStage.HATCHING ? 'text-amber-400' : 'text-stone-400'}`}>
                  🟤 Kiến tạo Kén tơ (Cocoon)
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                  Kén tơ nâu treo đung đưa đếm ngược 60 giây (bấm tap liên tục để giảm thời gian), sau đó rung mạnh và nở bùng.
                </p>
              </div>

              {/* Chặng 4: Bướm */}
              <div className="relative">
                <div className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-all ${stage === GameStage.MOTH ? 'bg-indigo-400 border-white ring-4 ring-indigo-500/20' : 'bg-stone-800 border-stone-700'}`} />
                <h4 className={`text-xs font-bold ${stage === GameStage.MOTH ? 'text-indigo-400' : 'text-stone-400'}`}>
                  🦋 Bướm Đêm thụ phấn (Moth)
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                  Bay lượn né dơi, chim và nhện. Đến gần 5 bông hoa để tự động thụ phấn (3 giây/hoa).
                </p>
              </div>

              {/* Chặng 5: Giao phối & Đẻ trứng */}
              <div className="relative">
                <div className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-all ${stage === GameStage.MATING || stage === GameStage.EGG_LAYING ? 'bg-rose-500 border-white ring-4 ring-rose-500/20' : 'bg-stone-800 border-stone-700'}`} />
                <h4 className={`text-xs font-bold ${stage === GameStage.MATING || stage === GameStage.EGG_LAYING ? 'text-rose-400' : 'text-stone-400'}`}>
                  ❤️ Duy trì nòi giống (Mating & Laying)
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                  Xoay tròn lãng mạn cùng bướm bạn rồi đậu xuống lá đẻ 5-7 quả trứng lấp lánh sinh mệnh.
                </p>
              </div>

              {/* Chặng 6: Thiên sứ */}
              <div className="relative">
                <div className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-all ${stage === GameStage.DEATH || stage === GameStage.VICTORY ? 'bg-yellow-400 border-white ring-4 ring-yellow-400/20' : 'bg-stone-800 border-stone-700'}`} />
                <h4 className={`text-xs font-bold ${stage === GameStage.DEATH || stage === GameStage.VICTORY ? 'text-yellow-400' : 'text-stone-400'}`}>
                  👼 Linh hồn thăng thiên (Ascension)
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                  Bướm yếu đi ngã xuống, linh hồn thiên thần trắng lung linh rũ sương tơ bay thẳng về trời xanh tuyệt sắc.
                </p>
              </div>
            </div>
          </div>

          {/* Giáo trình khoa học bỏ túi (Fact list) */}
          <div id={`science-fact-box`} className="bg-stone-900/40 border border-stone-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-stone-300 font-mono flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-sky-400" />
              <span>GÓC SINH HỌC THIÊN NHIÊN</span>
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Bạn có biết? Bướm đêm đóng vai trò cực kỳ quan trọng trong tự nhiên như những chiến binh thụ phấn thầm lặng lúc đêm về. Sắc tố phấn tối sậm trên đôi cánh giúp bướm đêm ngụy trang tài tình dưới tán cây, né tránh kẻ săn mồi.
            </p>
          </div>
        </div>

      </main>

      {/* FOOTER: Bản quyền và thông tin tác giả nho nhỏ */}
      <footer id={`app-footer`} className="w-full bg-stone-950 border-t border-stone-900 py-3 text-center text-xs text-stone-600 font-mono">
        <p>Moth Lifecycle Simulator © 2026 • Crafted in modern React & HTML5 Canvas</p>
      </footer>
    </div>
  );
}
