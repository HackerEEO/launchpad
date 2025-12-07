import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Project } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatCurrency, calculateProgress } from '@/utils/helpers';
import { useCountdown } from '@/hooks/useCountdown';

interface ProjectCardProps {
  project: Project;
  index?: number;
}

export const ProjectCard = ({ project, index = 0 }: ProjectCardProps) => {
  const progress = calculateProgress(project.raised_amount, project.hard_cap);
  const timeLeft = useCountdown(project.status === 'upcoming' ? project.sale_start : project.sale_end);

  const statusVariant = {
    upcoming: 'info' as const,
    live: 'success' as const,
    ended: 'default' as const,
  };

  const timeLabel = project.status === 'upcoming' ? 'Starts in' : project.status === 'live' ? 'Ends in' : 'Ended';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Link to={`/project/${project.id}`}>
        <Card hover className="h-full group">
          {project.banner_url && (
            <div className="relative h-48 -mx-6 -mt-6 mb-4 rounded-t-xl overflow-hidden">
              <img
                src={project.banner_url}
                alt={project.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-4 right-4">
                <Badge variant={statusVariant[project.status]}>
                  {project.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          )}

          <div className="flex items-start gap-4 mb-4">
            {project.logo_url && (
              <img
                src={project.logo_url}
                alt={project.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-white mb-1 truncate">
                {project.name}
              </h3>
              <p className="text-text-muted text-sm">{project.token_symbol}</p>
            </div>
          </div>

          <p className="text-text-secondary text-sm mb-4 line-clamp-2">
            {project.description}
          </p>

          <div className="mb-4">
            <ProgressBar progress={progress} showLabel={false} />
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-text-muted">Raised</span>
              <span className="text-white font-semibold">
                {formatCurrency(project.raised_amount)} / {formatCurrency(project.hard_cap)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div>
              <div className="text-text-muted text-xs mb-1">Price</div>
              <div className="text-white font-semibold">
                ${project.token_price}
              </div>
            </div>
            <div>
              <div className="text-text-muted text-xs mb-1">{timeLabel}</div>
              <div className="text-white font-semibold">
                {timeLeft.total > 0 ? (
                  `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m`
                ) : (
                  'Ended'
                )}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
};
