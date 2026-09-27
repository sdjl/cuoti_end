import { FaBookOpen, FaChartLine, FaChartPie, FaClipboardCheck, FaRobot, FaUserGraduate } from "react-icons/fa";
import { DISPLAY_TEXT } from "../../../lib/config/constants.js";
function FeatureDetail({
  icon,
  title,
  subtitle,
  features
}) {
  return <div className="feature-detail-card bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center mb-4">
        <div className="p-3 bg-primary/10 rounded-lg mr-4">{icon}</div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-primary font-medium">{subtitle}</p>
        </div>
      </div>
      <ul className="space-y-3">
        {features.map((feature, index) => <li key={index} className="flex items-start">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span className="text-muted-foreground text-sm leading-relaxed">
              {feature}
            </span>
          </li>)}
      </ul>
    </div>;
}
export default function ToolFeaturesSection() {
  const featureDetails = [{
    icon: <FaClipboardCheck className="text-2xl text-primary" />,
    title: "智能试卷处理",
    subtitle: "让试卷管理变得简单高效",
    features: ["自动切题与提取题目信息 - 只需上传PDF试卷，系统依靠先进的AI技术自动识别试题区域、提取题目内容，极大减少人力录入和整理上的负担。", "灵活的试卷与题库管理 - 轻松管理各类考试试卷、测验与作业，同时方便用户调整题库、更新相关题目和知识点，确保内容始终保持最新。"]
  }, {
    icon: <FaChartLine className="text-2xl text-primary" />,
    title: "智能数据分析",
    subtitle: "精准评估学习状况，提供个性化建议",
    features: ["智能数据报告生成 - 系统自动统计答题数据、正确率和答题记录，并通过图表清晰展示每次练习和测验的成绩表现，为用户提供直观、全面的分析。", "综合与单次答卷报告 - 提供详细的单次测验和综合评估报告，帮助用户发现知识盲点，制定更有针对性的复习计划。"]
  }, {
    icon: <FaUserGraduate className="text-2xl text-primary" />,
    title: `定制式${DISPLAY_TEXT.COURSE_MISTAKE}`,
    subtitle: "发现问题，精准突破，让练习更有针对性",
    features: [`自动生成${DISPLAY_TEXT.COURSE_MISTAKE}任务 - 根据用户答题记录和错误题目智能匹配，生成专属${DISPLAY_TEXT.COURSE_MISTAKE}任务，重点强化知识薄弱环节。`, "跨设备无缝练习体验 - 不论是在平板、手机还是电脑，用户均可通过简单身份验证即刻进入练习状态，确保每一次练习都精准有效。"]
  }, {
    icon: <FaChartPie className="text-2xl text-primary" />,
    title: "学习成长图谱",
    subtitle: "全面记录成长轨迹，让进步一目了然",
    features: ["直观掌握知识点进展 - 动态生成的知识点掌握图谱帮助用户清晰查看哪些内容已牢固掌握，哪些部分依然需要加强。", "成长趋势与复习规划对接 - 根据每次测验和练习数据，展示用户的进步曲线，为未来复习和练习计划提供科学依据。"]
  }, {
    icon: <FaBookOpen className="text-2xl text-primary" />,
    title: "个性化数据可视化",
    subtitle: "全方位了解学习状况，实时掌握进度",
    features: ["图谱化分析，直观评估 - 将成绩、知识点掌握率、练习参与情况等关键数据以图表、色彩标记等形式直观呈现，让用户能一目了然地看到自己的学习全貌。", "错题回顾与精准诊断 - 针对错误题目系统标注和回顾，帮助用户明确常错点，避免重复错误，提高整体成绩。"]
  }, {
    icon: <FaRobot className="text-2xl text-primary" />,
    title: "智能AI助手互动",
    subtitle: "随时解疑答惑，提供个性化学习指导",
    features: ["实时提问与互动辅导 - 用户可以在遇到疑问时向AI助手发起提问，无论是文字还是语音，均能获得详尽、准确的回答。", "定制常见问题与错题笔记 - 系统支持内置常见问题和错题笔记自动整理，让复习时能精准对接已出现问题，提升学习效率。"]
  }];
  return <section className="py-16 px-6 md:px-12 lg:px-20 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            强大功能，助力高效错题管理
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            从错题收集到智能分析，从个性化练习到数据可视化，
            错题管家为您提供完整的错题管理解决方案。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {featureDetails.map((feature, index) => <FeatureDetail key={index} icon={feature.icon} title={feature.title} subtitle={feature.subtitle} features={feature.features} />)}
        </div>
      </div>
    </section>;
}
