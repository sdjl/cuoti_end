import "../../styles/user/index.css";
import FeaturesSection from "./components/FeaturesSection.js";
import HeroSection from "./components/HeroSection.js";
import StatsSection from "./components/StatsSection.js";
import SubscriptionSection from "./components/SubscriptionSection.js";
import ToolFeaturesSection from "./components/ToolFeaturesSection.js";
import ToolIntroSection from "./components/ToolIntroSection.js";
export default function HomePage() {
  return <div className="min-h-screen">
      <HeroSection />
      <StatsSection />
      <ToolIntroSection />
      <FeaturesSection />
      <ToolFeaturesSection />
      <SubscriptionSection />
    </div>;
}
