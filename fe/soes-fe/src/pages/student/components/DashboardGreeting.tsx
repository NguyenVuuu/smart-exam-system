interface DashboardGreetingProps {
  fullName: string
}

export default function DashboardGreeting({ fullName }: DashboardGreetingProps) {
  return (
    <div className="mb-5">
      <h1 className="text-xl font-semibold text-gray-900">
        Xin chào, {fullName} 👋
      </h1>
      <p className="text-sm text-gray-400 mt-0.5">Chúc bạn có một ngày học tập hiệu quả!</p>
    </div>
  )
}
