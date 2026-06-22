/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameStage } from '../types';
import { Bug, Sparkles, Hourglass, Zap, HelpCircle } from 'lucide-react';

interface InstructionsProps {
  stage: GameStage;
}

export default function Instructions({ stage }: InstructionsProps) {
  const getStageDetails = () => {
    switch (stage) {
      case GameStage.EGG:
        return {
          title: "Giai Đoạn Trứng (Egg Stage)",
          desc: "Vòng đời bắt đầu từ quả trứng bướm màu xanh nhạt nhỏ nhắn, lấp lánh đung đưa nhẹ trên lá cây rừng già.",
          controls: "Chờ 5 giây trứng tự động nở rộng. Thưởng thức hiệu ứng rung lắc tuyệt vời khi sâu đo tí hon chui ra!",
          fact: "Trứng bướm thường có một lớp sáp bảo vệ mỏng bao phủ bên ngoài để ngăn chặn mất nước và bảo vệ chống lại các thiên địch siêu nhỏ.",
          icon: <HelpCircle className="w-5 h-5 text-cyan-300 animate-pulse" />,
          color: "border-cyan-500/30 bg-cyan-950/40 text-cyan-100",
        };
      case GameStage.CATERPILLAR:
        return {
          title: "Giai Đoạn Sâu Đo (Caterpillar)",
          desc: "Điều khiển sâu đo bò đi ăn những chiếc lá non mọng nước để tích lũy năng lượng cho quá trình hóa kén lớn.",
          controls: "Di chuyển bằng phím WASD / Các mũi tên hoặc Click chuột vào vị trí bất kỳ để bò đến đó.",
          fact: "Sâu đo mập mạp di chuyển bằng cách uốn gập người lại tạo lực đẩy hình chữ S độc đáo do chúng thiếu các chân ở giữa thân.",
          icon: <Bug className="w-5 h-5 text-emerald-400" />,
          color: "border-emerald-500/30 bg-emerald-950/40 text-emerald-100",
        };
      case GameStage.TRANSITION_TO_COCOON:
        return {
          title: "Chuẩn Bị Hóa Kén (Spinning Silk)",
          desc: "Sâu đo leo lên cành cây kiên cố nhất ở trung tâm để dệt tổ kén tơ bảo vệ cơ thể ấm áp.",
          controls: "Tự động di chuyển lên cành cây. Sẽ sớm bắt đầu giai đoạn làm kén.",
          fact: "Tơ kén của bướm đêm cực kỳ dai và mịn, tạo thành một lớp kén mờ ấm giúp chống lại sương đêm và giữ ẩm hoàn hảo.",
          icon: <Sparkles className="w-5 h-5 text-amber-300" />,
          color: "border-amber-500/30 bg-amber-950/40 text-amber-100",
        };
      case GameStage.COCOON:
        return {
          title: "Giai Đoạn Kén (Cocoon Metamorphosis)",
          desc: "Quá trình lột xác kỳ diệu ẩn giấu bên trong kén nâu treo trên cành cây đang diễn ra âm thầm.",
          controls: "Đợi 60 giây để quá trình hoàn tất. MẸO: Bạn có thể click chuột trực tiếp vào kén để kén đung đưa rung lắc và tăng tốc thời gian nở nhanh hơn (giảm 1.5 giây mỗi lần bấm)!",
          fact: "Bên trong kén, các tế bào của sâu đo thực tế sẽ phân rã thành một dạng 'chất lỏng lỏng dinh dưỡng', sau đó tái sắp xếp hoàn toàn để kiến tạo nên đôi cánh và cơ thể của bướm đêm vĩ đại.",
          icon: <Hourglass className="w-5 h-5 text-amber-400 animate-spin-slow" />,
          color: "border-amber-500/30 bg-amber-950/40 text-amber-200",
        };
      case GameStage.HATCHING:
        return {
          title: "Thời Khắc Nở Tổ (Hatching)",
          desc: "Vỏ kén đang nứt dần! Sức mạnh sinh mệnh vĩ đại đã chín muồi để phá vỡ lớp kén bọc.",
          controls: "Hãy đón chờ sự bùng nổ của đôi cánh rực rỡ sắp xuất hiện!",
          fact: "Khi nở ra, bướm đêm phải sử dụng chất dịch chuyên dụng để làm mềm tơ kén rồi đẩy mạnh cơ thể ra ngoài trước khi đôi cánh khô ráo hoàn toàn.",
          icon: <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />,
          color: "border-yellow-500/30 bg-yellow-950/40 text-yellow-100",
        };
      case GameStage.MOTH:
        return {
          title: "Bướm Đêm Thụ Phấn (Pollination)",
          desc: "Đôi cánh xinh đẹp đã định hình! Mục tiêu: Thụ phấn cho 5 bông hoa bằng cách bay đến hút mật (3 giây). Tránh xa các loài Chim, Dơi săn mồi rình rập và các Mạng nhện giăng bẫy giảm 50% tốc độ.",
          controls: "Dùng phím WASD / Mũi tên hoặc Rơ chuột lướt nhẹ nhàng. Nhặt Phấn Hoa Vàng để lấy điểm. Đạt 3 hoa nhận Speed Boost (⚡), 5 hoa nhận Lá Chắn (🛡️). Ẩn nấp Chim bằng cách núp Y < 230 ở KHU VỰC AN TOÀN bảo bọc.",
          fact: "Bướm đêm trưởng thành sử dụng râu dạng lông vũ siêu nhạy của mình làm khứu giác để định hướng trong bóng đêm sâu thẳm và lọc mật ngọt lành.",
          icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
          color: "border-indigo-500/30 bg-indigo-950/40 text-indigo-100",
        };
      case GameStage.MATING:
        return {
          title: "Giai Đoạn Giao Phối (Mating)",
          desc: "Hai con bướm lãng mạn nhảy điệu vũ xoay tròn lộng lẫy tại tâm màn hình, tỏa hào quang ấm và ngợp tràn bong bóng trái tim ❤️ bay lên.",
          controls: "Thưởng thức chuỗi hoạt cảnh múa xoay tròn đầy nghệ thuật của cặp đôi trong vòng 10 giây vĩ đại.",
          fact: "Bướm đêm giao phối khi đậu hoặc đang bay chậm bằng cách nhận diện pheromone quyến rũ được tiết ra từ cơ thể bạn tình cách xa hàng dặm.",
          icon: <Sparkles className="w-5 h-5 text-rose-400" />,
          color: "border-rose-500/30 bg-rose-950/40 text-rose-100",
        };
      case GameStage.EGG_LAYING:
        return {
          title: "Giai Đoạn Đẻ Trứng (Egg Laying)",
          desc: "Bướm cái mẹ bay hạ cánh xuống lá cây rừng, nhẹ nhàng rung dẻo đuôi và đẻ xuống 5 - 7 hạt trứng xanh non mọc tơ phát sáng óng ánh.",
          controls: "Ngắm bướm run cánh dệt trứng nhẹ nhành lăn tròn lấp lánh trên cỏ lá rừng xanh mướt.",
          fact: "Bướm cái luôn chọn bề mặt lá cây thích hợp là nguồn thức ăn giàu dinh dưỡng của sâu non sau này để đẻ trứng bọc kín.",
          icon: <Bug className="w-5 h-5 text-cyan-400" />,
          color: "border-cyan-500/30 bg-cyan-950/40 text-cyan-100",
        };
      case GameStage.DEATH:
        return {
          title: "Sự Biến Khuyết Kỳ Diệu (Ascension Spirit)",
          desc: "Đã hoàn tất thiên chức vĩ đại. Bướm mẹ yếu dần rũ cánh chìm sâu vào đất lành. Nhưng từ nơi đó xuất hiện linh hồn thiên sứ bướm rạng ngời hào quang thăng thiên.",
          controls: "Theo chân linh hồn thăng thiên tỏa muôn sương óng ánh bay dần về chốn mây trời chín tầng rực rỡ.",
          fact: "Cái chết sinh học của thế hệ bướm đêm cũ khép lại một chương ý nghĩa để nhường chỗ cho hàng trăm mầm non sâu đo thế hệ vàng sinh sôi nảy nở tiếp nối.",
          icon: <Sparkles className="w-5 h-5 text-yellow-300" />,
          color: "border-yellow-500/30 bg-yellow-950/40 text-yellow-200",
        };
      case GameStage.GAME_OVER:
        return {
          title: "Thử Thách Thất Bại (Game Over)",
          desc: "Bản năng sinh tồn của bạn đã bị khuất phục trước cái bẫy của động vật săn mồi rừng già.",
          controls: "Nhất nút 'THỬ LẠI CHẶNG NÀY' hoặc 'RESET' ở phía trên để tái sinh vòng đời thi vị ấm cúm.",
          fact: "Trong tự nhiên, bướm đêm là nguồn thức ăn giàu protein dạt dào cho chim sẻ, dơi tai to và nhện độc.",
          icon: <Bug className="w-5 h-5 text-red-400" />,
          color: "border-red-500/30 bg-red-950/40 text-red-100",
        };
      case GameStage.VICTORY:
        return {
          title: "Thăng Hoa Chiến Thắng (Victory Journey)",
          desc: "Bạn đã bảo toàn trọn vẹn và thúc đẩy quá trình thụ phấn hoa tươi sắc rạng rỡ của vòng đời bướm đêm vĩ đại!",
          controls: "Nhất nút 'BẮT ĐẦU VÒNG ĐỜI MỚI' để lướt cánh thăng hoa trong rừng xanh rờn kỳ diệu tuyệt đẹp.",
          fact: "Một chu trình thụ phấn trọn vẹn tạo nguồn hạt giống dồi dào gầy dựng tương lai cỏ thung lũng mướt mát xanh tươi.",
          icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
          color: "border-emerald-500/30 bg-emerald-950/40 text-emerald-100",
        };
    }
  };

  const details = getStageDetails();

  return (
    <div id={`instruction-box`} className={`border rounded-lg p-4 transition-all duration-300 ${details.color} backdrop-blur-xs`}>
      <div id={`instruction-title`} className="flex items-center gap-2 mb-2 font-semibold">
        {details.icon}
        <span>{details.title}</span>
      </div>
      <p id={`instruction-desc`} className="text-sm opacity-90 mb-3 leading-relaxed">
        {details.desc}
      </p>

      <div id={`instruction-controls-wrap`} className="bg-black/25 rounded-md p-2.5 border border-white/5 mb-3 text-xs font-mono">
        <span className="text-yellow-400 font-bold block mb-1">🎮 ĐIỀU KHIỂN:</span>
        <span className="leading-normal">{details.controls}</span>
      </div>

      <div id={`instruction-fact-wrap`} className="text-xs italic opacity-75 border-l-2 border-white/20 pl-2 leading-relaxed">
        <span className="font-semibold block not-italic text-[10px] uppercase tracking-wider mb-0.5 opacity-60">💡 Sự thật thú vị:</span>
        {details.fact}
      </div>
    </div>
  );
}
