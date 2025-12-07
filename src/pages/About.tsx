import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar_url: string;
  twitter?: string;
  linkedin?: string;
  order_index: number;
}

const values = [
  {
    title: 'Transparency',
    description: 'We believe in complete transparency in all our operations and project listings.',
    icon: '🔍',
  },
  {
    title: 'Security First',
    description: 'Security is our top priority. All projects undergo rigorous audits.',
    icon: '🔒',
  },
  {
    title: 'Community Driven',
    description: 'Our community is at the heart of everything we do.',
    icon: '🤝',
  },
  {
    title: 'Innovation',
    description: 'We continuously innovate to provide the best launchpad experience.',
    icon: '🚀',
  },
];

const milestones = [
  { year: '2021', title: 'Company Founded', description: 'Started with a vision to democratize token launches' },
  { year: '2022', title: '50+ Projects Launched', description: 'Successfully helped over 50 projects raise funds' },
  { year: '2023', title: '$100M+ Raised', description: 'Facilitated over $100M in total raise across all projects' },
  { year: '2024', title: 'Global Expansion', description: 'Expanded operations to serve projects worldwide' },
];

export const About = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold mb-6 gradient-text">About CryptoLaunch</h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Empowering the next generation of Web3 projects with a secure, transparent, and community-driven launchpad platform.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="p-12">
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-text-secondary leading-relaxed">
                <p>
                  CryptoLaunch was founded in 2021 by a team of blockchain enthusiasts who recognized the need for a trustworthy,
                  transparent platform where innovative Web3 projects could connect with early-stage investors.
                </p>
                <p>
                  We've witnessed firsthand the challenges that both projects and investors face in the crypto space - from
                  security concerns to lack of transparency. Our mission became clear: create a launchpad that prioritizes
                  security, transparency, and fairness above all else.
                </p>
                <p>
                  Today, we're proud to have facilitated the launch of over 50 successful projects, helping them raise more
                  than $100M in total funding while providing investors with vetted opportunities in the rapidly evolving Web3 ecosystem.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-4xl font-bold text-center mb-12 gradient-text">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 text-center hover-glow h-full">
                  <div className="text-5xl mb-4">{value.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                  <p className="text-text-secondary">{value.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-4xl font-bold text-center mb-12 gradient-text">Our Journey</h2>
          <div className="max-w-3xl mx-auto">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-8 pb-12 last:pb-0"
              >
                {index < milestones.length - 1 && (
                  <div className="absolute left-2 top-8 w-0.5 h-full bg-gradient-to-b from-primary-500 to-transparent" />
                )}
                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-gradient-primary shadow-lg" />
                <Card className="p-6 ml-4">
                  <div className="text-primary-500 font-bold text-2xl mb-2">{milestone.year}</div>
                  <h3 className="text-xl font-bold mb-2">{milestone.title}</h3>
                  <p className="text-text-secondary">{milestone.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-4xl font-bold text-center mb-12 gradient-text">Meet Our Team</h2>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 text-center hover-glow">
                    <img
                      src={member.avatar_url}
                      alt={member.name}
                      className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                    />
                    <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                    <p className="text-primary-500 font-medium mb-3">{member.role}</p>
                    <p className="text-text-secondary text-sm mb-4">{member.bio}</p>
                    <div className="flex justify-center gap-3">
                      {member.twitter && (
                        <a
                          href={member.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-secondary hover:text-primary-500 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                          </svg>
                        </a>
                      )}
                      {member.linkedin && (
                        <a
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-secondary hover:text-primary-500 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Card className="p-12 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-primary-500/20">
            <h2 className="text-3xl font-bold mb-4">Join Our Team</h2>
            <p className="text-text-secondary mb-8 max-w-2xl mx-auto">
              We're always looking for talented individuals to join our mission of democratizing access to Web3 opportunities.
            </p>
            <a href="/careers" className="btn-primary px-8 py-3">
              View Open Positions
            </a>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
