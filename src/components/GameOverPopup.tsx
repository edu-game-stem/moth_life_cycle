import React from 'react';
import { RotateCcw, Skull, Award } from 'lucide-react';

interface GameOverPopupProps {
  score: number;
  pollinatedCount: number;
  onRestart: () => void;
}

export default function GameOverPopup({
  score,
  pollinatedCount,
  onRestart,
}: GameOverPopupProps) {
  return (
    <div
      id="game-over-overlay"
      className="absolute inset-0 bg-stone-950/95 backdrop-blur-md flex flex-col justify-center items-center p-6 text-center z-40 animate-fade-in"
    >
      <div className="p-4 bg-stone-900 border-4 border-red-600 rounded-full animate-bounce mb-4 shadow-[0_0_20px_rgba(239,68,110,0.3)]">
        <Skull className="w-12 h-12 text-red-500" />
      </div>

      <h2 className="text-4xl font-black text-red-500 font-pixel tracking-wider mb-2">
        GAME OVER!
      </h2>
      <p className="text-stone-300 max-w-md text-sm mb-6 leading-relaxed font-medium">
        Kẻ săn mồi tự nhiên quá tinh ranh hoặc mạng nhện đã bọc kín đôi cánh. Điểm sinh tồn của bạn đã được ghi nhận vào di sản thiên nhiên rừng già rộng lớn!
      </p>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-2 gap-4 max-w-sm w-full mb-8 font-mono">
        <div className="bg-stone-900 border border-stone-800 p-3 rounded-xl">
          <span className="text-stone-500 text-[10px] block uppercase font-bold leading-none mb-1.5">THỰ PHẤN HOA</span>
          <span className="text-2xl font-bold text-cyan-400 font-sans">{pollinatedCount} / 5</span>
        </div>
        <div className="bg-stone-900 border border-stone-800 p-3 rounded-xl">
          <span className="text-stone-500 text-[10px] block uppercase font-bold leading-none mb-1.5">TỔNG ĐIỂM</span>
          <span className="text-xl font-bold text-yellow-300 font-sans">{score} pt</span>
        </div>
      </div>

      <button
        id="btn-retry-over-popup"
        onClick={onRestart}
        className="flex items-center gap-2 px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-md cursor-pointer border-2 border-yellow-400 shadow-lg active:scale-95 transition-all font-pixel tracking-wider"
      >
        <RotateCcw className="w-5 h-5" />
        <span>THỬ LẠI CHẶNG NÀY</span>
      </button>
    </div>
  );
}
