import { FaChartLine, FaClipboardCheck, FaRobot, FaUsers } from "react-icons/fa";
function StatsCard({
  icon,
  count,
  label
}) {
  return <div className="stats-card">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3>{count}</h3>
      <p className="text-muted-foreground">{label}</p>
    </div>;
}
export default function StatsSection() {
  const statsData = [{
    icon: <FaClipboardCheck className="text-5xl text-primary" />,
    count: "10K+",
    label: "错题已处理"
  }, {
    icon: <FaChartLine className="text-5xl text-primary" />,
    count: "5K+",
    label: "用户数据分析"
  }, {
    icon: <FaUsers className="text-5xl text-primary" />,
    count: "2K+",
    label: "活跃用户"
  }, {
    icon: <FaRobot className="text-5xl text-primary" />,
    count: "100K+",
    label: "AI分析次数"
  }];
  return <section className="py-16 px-6 md:px-12 lg:px-20 bg-background">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {statsData.map((stat, index) => <StatsCard key={index} icon={stat.icon} count={stat.count} label={stat.label} />)}
      </div>
    </section>;
}
