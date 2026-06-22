import React from 'react';
import { RotateCcw, Award, Clock, Leaf, Egg } from 'lucide-react';

interface VictoryPopupProps {
  score: number;
  survivalSecs: number;
  leavesEaten: number;
  eggsLaidCount: number;
  onRestart: () => void;
}

export default function VictoryPopup({
  score,
  survivalSecs,
  leavesEaten,
  eggsLaidCount,
  onRestart,
}: VictoryPopupProps) {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="victory-overlay"
      className="absolute inset-0 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
    >
      {/* Khung vintage viền vàng ánh kim */}
      <div
        id="victory-modal"
        className="relative max-w-md w-full bg-stone-900 border-4 border-amber-500 rounded-2xl p-6 shadow-2xl overflow-hidden animate-scale-up text-center select-none"
        style={{
          boxShadow: '0 0 35px rgba(245, 158, 11, 0.25)',
        }}
      >
        {/* Họa tiết góc cổ kính 8-bit bằng CSS */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-400" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-400" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-amber-400" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-amber-400" />

        {/* Cánh bướm lấp lánh đỉnh đầu */}
        <div className="flex justify-center mb-3">
          <div className="relative p-3 bg-amber-950/60 rounded-full border border-amber-500/30 animate-pulse">
            <span className="text-3xl">✨🦋✨</span>
          </div>
        </div>

        <h2 className="text-2xl font-black text-amber-400 tracking-widest font-pixel uppercase">
          VÒNG ĐỜI HOÀN TẤT
        </h2>
        <p className="text-stone-400 italic text-sm mt-1 mb-5">
          "Một vòng đời đã khép lại..."
        </p>

        {/* Thanh ngăn cách hoa văn vàng */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-amber-500" />
          <span className="text-amber-500 text-xs text-ellipsis">⚜️</span>
          <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-amber-500" />
        </div>

        {/* Bảng thống kê chi tiết */}
        <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-4 mb-6 text-left">
          <h3 className="text-xs uppercase font-bold text-stone-500 tracking-wider mb-3 leading-none font-mono">
            📊 THỐNG KÊ CHI TIẾT
          </h3>
          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="bg-stone-900 border border-stone-800/60 p-2.5 rounded-lg flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <span className="text-[10px] text-stone-500 block leading-none antialiased">THỜI GIAN</span>
                <span className="text-sm font-bold text-sky-300 font-sans">{formatTime(survivalSecs)}</span>
              </div>
            </div>

            <div className="bg-stone-900 border border-stone-800/60 p-2.5 rounded-lg flex items-center gap-2">
              <span className="text-md shrink-0">🌸</span>
              <div>
                <span className="text-[10px] text-stone-500 block leading-none antialiased">THỰ PHẤN</span>
                <span className="text-sm font-bold text-emerald-400 font-sans">5 / 5 hoa</span>
              </div>
            </div>

            <div className="bg-stone-900 border border-stone-800/60 p-2.5 rounded-lg flex items-center gap-2">
              <Egg className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[10px] text-stone-500 block leading-none antialiased">TRỨNG ĐÃ ĐẺ</span>
                <span className="text-sm font-bold text-cyan-300 font-sans">{eggsLaidCount} quả</span>
              </div>
            </div>

            <div className="bg-stone-900 border border-stone-800/60 p-2.5 rounded-lg flex items-center gap-2">
              <Leaf className="w-4 h-4 text-green-400 shrink-0" />
              <div>
                <span className="text-[10px] text-stone-500 block leading-none antialiased">SẦU ĐÃ ĂN</span>
                <span className="text-sm font-bold text-green-300 font-sans">{leavesEaten} lá</span>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-stone-800/80 pt-3 flex justify-between items-center bg-stone-900/40 p-2 rounded-lg">
            <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">TỔNG ĐIỂM:</span>
            <span className="text-lg font-black text-yellow-400 animate-pulse font-sans">
              {score} pt
            </span>
          </div>
        </div>

        {/* Nút bấm Chơi Lại */}
        <div className="flex flex-col items-center gap-2">
          <button
            id="modal-replay-btn"
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl border-2 border-yellow-300 shadow-md transform active:scale-95 transition-all cursor-pointer font-pixel tracking-wider text-base uppercase"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <span>🔄 CHƠI LẠI</span>
          </button>
          <span className="text-[10px] text-stone-500 italic mt-1 select-none">
            "Nhấn chơi lại để bắt đầu vòng đời mới"
          </span>
        </div>
      </div>
    </div>
  );
}
