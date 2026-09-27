import FeatureCard from "./FeatureCard.js";
export default function FeaturesSection() {
  const features = [{
    title: "错题智能分析",
    subtitle: "AI驱动的深度分析",
    description: "自动识别错题类型，分析错误原因，提供详细的解题思路和知识点归纳，帮助用户深度理解问题所在。"
  }, {
    title: "个性化练习推荐",
    subtitle: "精准定位薄弱环节",
    description: "基于错题数据智能推荐相似题型练习，针对性强化薄弱知识点，让练习更有效果。"
  }, {
    title: "知识点图谱管理",
    subtitle: "可视化掌握进度",
    description: "自动构建个人知识点掌握图谱，清晰展示各知识点的掌握情况，让学习进度一目了然。"
  }, {
    title: "多平台数据同步",
    subtitle: "随时随地管理错题",
    description: "支持手机、平板、电脑等多设备使用，错题数据云端同步，让用户随时随地都能管理自己的错题库。"
  }];
  return <section className="py-16 px-6 md:px-12 lg:px-20 bg-background">
      <div className="container mx-auto">
        <div className="section-heading">
          <h2>核心功能特色</h2>
          <p className="text-muted-foreground">
            专业的错题管理工具，为用户提供智能化、个性化的错题分析和管理服务。
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => <FeatureCard key={index} title={feature.title} subtitle={feature.subtitle} description={feature.description} />)}
        </div>
      </div>
    </section>;
}
