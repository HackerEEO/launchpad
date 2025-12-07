import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { useProjects } from '@/hooks/useProjects';
import { projectsService } from '@/services/projects.service';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatDateTime } from '@/utils/helpers';
import toast from 'react-hot-toast';

export const Admin = () => {
  const { isAdmin } = useAppStore();
  const navigate = useNavigate();
  const { projects, refresh } = useProjects();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    token_name: '',
    token_symbol: '',
    total_supply: '',
    token_price: '',
    hard_cap: '',
    soft_cap: '',
    sale_start: '',
    sale_end: '',
    website: '',
    twitter: '',
    telegram: '',
    discord: '',
    logo_url: '',
    banner_url: '',
  });

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto glass-card p-12">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-text-secondary mb-6">
            You don't have permission to access the admin panel
          </p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const handleCreateProject = async () => {
    setIsCreating(true);
    try {
      await projectsService.create({
        ...formData,
        total_supply: Number(formData.total_supply),
        token_price: Number(formData.token_price),
        hard_cap: Number(formData.hard_cap),
        soft_cap: Number(formData.soft_cap),
        sale_start: new Date(formData.sale_start).toISOString(),
        sale_end: new Date(formData.sale_end).toISOString(),
        status: 'upcoming',
        token_address: null,
        vesting_schedule: {
          tge_percent: 20,
          cliff_months: 3,
          vesting_months: 12,
        },
      });

      toast.success('Project created successfully');
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        token_name: '',
        token_symbol: '',
        total_supply: '',
        token_price: '',
        hard_cap: '',
        soft_cap: '',
        sale_start: '',
        sale_end: '',
        website: '',
        twitter: '',
        telegram: '',
        discord: '',
        logo_url: '',
        banner_url: '',
      });
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectsService.delete(id);
      toast.success('Project deleted successfully');
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete project');
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Admin <span className="gradient-text">Panel</span>
            </h1>
            <p className="text-text-secondary">Manage projects and platform settings</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Project
          </Button>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold mb-6">All Projects</h2>

          {projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary">No projects yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-text-muted font-medium">Project</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium">Raised</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium">Target</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium">Created</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} className="border-b border-white/10 hover:bg-card-hover transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {project.logo_url && (
                            <img
                              src={project.logo_url}
                              alt={project.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <div className="font-semibold">{project.name}</div>
                            <div className="text-sm text-text-muted">{project.token_symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant={
                            project.status === 'live'
                              ? 'success'
                              : project.status === 'upcoming'
                              ? 'info'
                              : 'default'
                          }
                        >
                          {project.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 font-semibold">
                        {formatCurrency(project.raised_amount)}
                      </td>
                      <td className="py-4 px-4">
                        {formatCurrency(project.hard_cap)}
                      </td>
                      <td className="py-4 px-4 text-text-secondary text-sm">
                        {formatDateTime(project.created_at)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => navigate(`/project/${project.id}`)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDeleteProject(project.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
        maxWidth="max-w-4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Project Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter project name"
          />
          <Input
            label="Token Symbol"
            value={formData.token_symbol}
            onChange={(e) => setFormData({ ...formData, token_symbol: e.target.value })}
            placeholder="e.g., BTC"
          />
          <div className="md:col-span-2">
            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Project description"
            />
          </div>
          <Input
            label="Token Name"
            value={formData.token_name}
            onChange={(e) => setFormData({ ...formData, token_name: e.target.value })}
            placeholder="Token name"
          />
          <Input
            label="Total Supply"
            type="number"
            value={formData.total_supply}
            onChange={(e) => setFormData({ ...formData, total_supply: e.target.value })}
            placeholder="1000000"
          />
          <Input
            label="Token Price (USD)"
            type="number"
            value={formData.token_price}
            onChange={(e) => setFormData({ ...formData, token_price: e.target.value })}
            placeholder="0.01"
          />
          <Input
            label="Hard Cap (USD)"
            type="number"
            value={formData.hard_cap}
            onChange={(e) => setFormData({ ...formData, hard_cap: e.target.value })}
            placeholder="500000"
          />
          <Input
            label="Soft Cap (USD)"
            type="number"
            value={formData.soft_cap}
            onChange={(e) => setFormData({ ...formData, soft_cap: e.target.value })}
            placeholder="250000"
          />
          <Input
            label="Sale Start"
            type="datetime-local"
            value={formData.sale_start}
            onChange={(e) => setFormData({ ...formData, sale_start: e.target.value })}
          />
          <Input
            label="Sale End"
            type="datetime-local"
            value={formData.sale_end}
            onChange={(e) => setFormData({ ...formData, sale_end: e.target.value })}
          />
          <Input
            label="Website"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://example.com"
          />
          <Input
            label="Twitter"
            value={formData.twitter}
            onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
            placeholder="https://twitter.com/..."
          />
          <Input
            label="Telegram"
            value={formData.telegram}
            onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
            placeholder="https://t.me/..."
          />
          <Input
            label="Logo URL"
            value={formData.logo_url}
            onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
            placeholder="https://..."
          />
          <div className="md:col-span-2">
            <Input
              label="Banner URL"
              value={formData.banner_url}
              onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <Button onClick={handleCreateProject} loading={isCreating} className="flex-1">
            Create Project
          </Button>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1">
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
};
