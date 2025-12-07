import { useState } from 'react';
import { motion } from 'framer-motion';
import { useProjects } from '@/hooks/useProjects';
import type { ProjectFilter } from '@/types';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { Input } from '@/components/ui/Input';
import { SkeletonCard } from '@/components/ui/Loading';
import { debounce } from '@/utils/helpers';

export const Projects = () => {
  const [filters, setFilters] = useState<ProjectFilter>({
    status: 'all',
    search: '',
    sortBy: 'newest',
  });

  const { projects, loading } = useProjects(filters);

  const handleSearchChange = debounce((value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  }, 500);

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            All <span className="gradient-text">Projects</span>
          </h1>
          <p className="text-text-secondary text-lg">
            Discover and invest in the next generation of blockchain projects
          </p>
        </div>

        <div className="glass-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search projects..."
              onChange={(e) => handleSearchChange(e.target.value)}
              className="md:col-span-2"
            />

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="live">Live</option>
              <option value="ended">Ended</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
              className="input-field"
            >
              <option value="newest">Newest First</option>
              <option value="ending_soon">Ending Soon</option>
              <option value="most_raised">Most Raised</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 glass-card">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-text-secondary text-lg mb-2">No projects found</p>
            <p className="text-text-muted">Try adjusting your filters</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
