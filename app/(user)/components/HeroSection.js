import BaseImage from "../../../components/common/BaseImage.js";
export default function HeroSection() {
  return <section className="hero-section py-16 md:py-20 px-6 md:px-12 lg:px-20">
      <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="hero-content">
          <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-medium">
            智能错题管理工具
          </span>
          <h1 className="mt-6 mb-4">
            发现 <span className="gradient-text">错题管家</span>，
            让错题管理变得智能高效
          </h1>
          <p className="text-muted-foreground mb-8">
            错题管家是一款专业的错题管理工具，帮助学生上传、整理和分析错题。通过AI技术提供智能分析、知识点归纳、个性化练习等功能，让学生能够更好地管理自己的学习数据，提升学习效率。
          </p>
          <div className="mt-12 flex gap-12">
            <div>
              <h3 className="text-3xl font-bold text-primary">10K+</h3>
              <p className="text-muted-foreground">错题已处理</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-primary">5K+</h3>
              <p className="text-muted-foreground">用户已受益</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-primary">300+</h3>
              <p className="text-muted-foreground">知识点覆盖</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="w-full h-[400px] bg-gradient-to-r from-primary/10 to-accent/20 rounded-lg flex items-center justify-center overflow-hidden">
            <BaseImage src="/images/user/index/education-platform2.png" alt="错题管家工具界面" width={800} height={400} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>;
}
