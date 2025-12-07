import { Hero } from '@/components/home/Hero';
import { StatsSection } from '@/components/home/StatsSection';
import { FeaturedProjects } from '@/components/home/FeaturedProjects';

export const Home = () => {
  return (
    <div>
      <Hero />
      <StatsSection />
      <FeaturedProjects />
    </div>
  );
};
