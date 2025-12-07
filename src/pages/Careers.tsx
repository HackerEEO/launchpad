import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  active: boolean;
}

export const Careers = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    name: '',
    email: '',
    resume: '',
    coverLetter: '',
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (job: JobPosting) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Application submitted successfully! We\'ll be in touch soon.');
    setIsModalOpen(false);
    setApplicationForm({ name: '', email: '', resume: '', coverLetter: '' });
  };

  const benefits = [
    { icon: '💰', title: 'Competitive Salary', description: 'Industry-leading compensation packages' },
    { icon: '🏥', title: 'Health Benefits', description: 'Comprehensive health, dental, and vision coverage' },
    { icon: '🌴', title: 'Flexible PTO', description: 'Unlimited vacation and sick days' },
    { icon: '🏠', title: 'Remote Work', description: 'Work from anywhere in the world' },
    { icon: '📚', title: 'Learning Budget', description: 'Annual budget for courses and conferences' },
    { icon: '💻', title: 'Equipment', description: 'Latest tech and home office setup' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold mb-6 gradient-text">Join Our Team</h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Help us build the future of decentralized finance. We're looking for talented individuals who are passionate about Web3.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-4xl font-bold text-center mb-12 gradient-text">Why Join Us?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover-glow h-full">
                  <div className="text-5xl mb-4">{benefit.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                  <p className="text-text-secondary">{benefit.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-4xl font-bold text-center mb-4 gradient-text">Open Positions</h2>
            <p className="text-text-secondary text-center">
              {jobs.length} {jobs.length === 1 ? 'position' : 'positions'} available
            </p>
          </motion.div>

          <div className="space-y-6">
            {jobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-8 hover-glow">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{job.title}</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-primary-500/20 text-primary-500 rounded-full text-sm">
                          {job.department}
                        </span>
                        <span className="px-3 py-1 bg-secondary-500/20 text-secondary-500 rounded-full text-sm">
                          {job.location}
                        </span>
                        <span className="px-3 py-1 glass-card rounded-full text-sm">
                          {job.type}
                        </span>
                      </div>
                    </div>
                    <Button onClick={() => handleApply(job)} className="whitespace-nowrap">
                      Apply Now
                    </Button>
                  </div>

                  <p className="text-text-secondary mb-6">{job.description}</p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-bold mb-3">Requirements</h4>
                      <ul className="space-y-2 text-text-secondary">
                        {job.requirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold mb-3">Responsibilities</h4>
                      <ul className="space-y-2 text-text-secondary">
                        {job.responsibilities.map((resp, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span>{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {jobs.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-text-secondary text-lg mb-6">
                We don't have any open positions at the moment, but we're always looking for talented individuals.
              </p>
              <p className="text-text-secondary">
                Send your resume to <a href="mailto:careers@cryptolaunch.io" className="text-primary-500 hover:underline">careers@cryptolaunch.io</a>
              </p>
            </Card>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Apply for ${selectedJob?.title}`}>
        <form onSubmit={handleSubmitApplication} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              id="name"
              value={applicationForm.name}
              onChange={(e) => setApplicationForm(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              id="email"
              value={applicationForm.email}
              onChange={(e) => setApplicationForm(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div>
            <label htmlFor="resume" className="block text-sm font-medium mb-2">
              Resume URL or LinkedIn Profile <span className="text-red-500">*</span>
            </label>
            <Input
              type="url"
              id="resume"
              value={applicationForm.resume}
              onChange={(e) => setApplicationForm(prev => ({ ...prev, resume: e.target.value }))}
              placeholder="https://"
              required
            />
          </div>

          <div>
            <label htmlFor="coverLetter" className="block text-sm font-medium mb-2">
              Cover Letter
            </label>
            <textarea
              id="coverLetter"
              value={applicationForm.coverLetter}
              onChange={(e) => setApplicationForm(prev => ({ ...prev, coverLetter: e.target.value }))}
              rows={6}
              className="w-full px-4 py-3 bg-dark-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Tell us why you're interested in this position..."
            />
          </div>

          <Button type="submit" className="w-full">
            Submit Application
          </Button>
        </form>
      </Modal>
    </div>
  );
};
