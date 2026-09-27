import { FaBookOpen, FaChartLine, FaRobot, FaUpload } from "react-icons/fa";
import { DISPLAY_TEXT } from "../../../lib/config/constants.js";
function ToolFeature({
  icon,
  title,
  description
}) {
  return <div className="tool-feature-card bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center mb-4">
        <div className="p-3 bg-primary/10 rounded-lg mr-4">{icon}</div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="text-muted-foreground">{description}</p>
    </div>;
}
export default function ToolIntroSection() {
  const toolFeatures = [{
    icon: <FaUpload className="text-xl text-primary" />,
    title: "一键上传错题",
    description: `支持拍照上传、文件导入等多种方式，快速建立${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}库，告别手工整理的繁琐。`
  }, {
    icon: <FaRobot className="text-xl text-primary" />,
    title: "AI智能分析",
    description: "自动识别题目类型，分析错误原因，提供详细解题步骤和知识点归纳。"
  }, {
    icon: <FaChartLine className="text-xl text-primary" />,
    title: "数据可视化",
    description: "直观展示错题分布、知识点掌握情况，让学习进度和薄弱环节一目了然。"
  }, {
    icon: <FaBookOpen className="text-xl text-primary" />,
    title: "个性化练习",
    description: "基于错题数据智能推荐相似题型，针对性练习，提升学习效率。"
  }];
  return <section className="py-16 px-6 md:px-12 lg:px-20 bg-gray-50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            错题管家 - 您的专属错题管理工具
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            不再是传统的抄错题本，错题管家让您的错题管理进入数字化时代。
            上传、分析、练习、提升，一站式解决错题管理的所有需求。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {toolFeatures.map((feature, index) => <ToolFeature key={index} icon={feature.icon} title={feature.title} description={feature.description} />)}
        </div>
      </div>
    </section>;
}
