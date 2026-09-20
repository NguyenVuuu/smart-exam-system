import { ShieldCheck } from 'lucide-react'

export default function AccountSecurityTipsCard() {
  const tips = [
    {
      title: 'Bảo mật mật khẩu tài khoản',
      desc: 'Sử dụng mật khẩu có độ dài tối thiểu 8 ký tự, kết hợp chữ cái, số và ký tự đặc biệt.',
    },
    {
      title: 'Bảo vệ ca thi và đề thi',
      desc: 'Không chia sẻ mật khẩu ca thi hoặc đề thi ra ngoài phòng thi khi ca thi chưa kết thúc.',
    },
    {
      title: 'Đăng xuất khi dùng máy công cộng',
      desc: 'Luôn đăng xuất sau khi sử dụng hệ thống trên máy tính phòng thực hành hoặc máy của trường.',
    },
  ]

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 space-y-3.5">
      <div className="flex items-center gap-2 text-blue-900 font-semibold text-sm">
        <ShieldCheck size={18} className="text-blue-600" />
        <h3>Khuyến nghị bảo mật cho Giảng viên</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {tips.map((tip, idx) => (
          <div key={idx} className="rounded-xl border border-blue-100/80 bg-white p-3.5 space-y-1 shadow-2xs">
            <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                {idx + 1}
              </span>
              {tip.title}
            </h4>
            <p className="text-[11px] leading-relaxed text-gray-500">{tip.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
