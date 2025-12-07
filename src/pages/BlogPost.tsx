import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  author_name: string;
  author_avatar: string;
  category: string;
  tags: string[];
  reading_time: number;
  published_at: string;
  views: number;
}

export const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    if (slug) {
      loadPost(slug);
    }
  }, [slug]);

  const loadPost = async (postSlug: string) => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', postSlug)
        .eq('published', true)
        .single();

      if (error) throw error;

      setPost(data);

      await supabase
        .from('blog_posts')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', data.id);

      const { data: related } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('category', data.category)
        .neq('id', data.id)
        .eq('published', true)
        .limit(3);

      setRelatedPosts(related || []);
    } catch (error) {
      console.error('Error loading blog post:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
          <Link to="/blog" className="text-primary-500 hover:underline">
            Return to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <article className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to="/blog" className="text-primary-500 hover:underline mb-8 inline-block">
            ← Back to Blog
          </Link>

          <div className="mb-6">
            <span className="px-4 py-2 bg-primary-500/20 text-primary-500 rounded-full text-sm font-medium">
              {post.category}
            </span>
          </div>

          <h1 className="text-5xl font-bold mb-6">{post.title}</h1>

          <div className="flex items-center gap-4 mb-8">
            <img
              src={post.author_avatar}
              alt={post.author_name}
              className="w-16 h-16 rounded-full"
            />
            <div>
              <div className="font-bold text-lg">{post.author_name}</div>
              <div className="text-text-secondary">
                {formatDate(post.published_at)} · {post.reading_time} min read · {post.views} views
              </div>
            </div>
          </div>

          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-96 object-cover rounded-2xl mb-12"
          />

          <Card className="p-12">
            <div className="prose prose-invert max-w-none">
              <p className="text-xl text-text-secondary leading-relaxed mb-8">{post.excerpt}</p>
              <div className="text-lg leading-relaxed whitespace-pre-wrap">{post.content}</div>
            </div>
          </Card>

          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="px-4 py-2 bg-primary-500/20 text-primary-500 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>

          <Card className="p-8 mt-12 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-primary-500/20">
            <div className="flex items-center gap-6">
              <img
                src={post.author_avatar}
                alt={post.author_name}
                className="w-24 h-24 rounded-full"
              />
              <div>
                <h3 className="text-2xl font-bold mb-2">About {post.author_name}</h3>
                <p className="text-text-secondary">
                  Contributor to CryptoLaunch Blog, sharing insights about Web3, DeFi, and blockchain technology.
                </p>
              </div>
            </div>
          </Card>

          {relatedPosts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-3xl font-bold mb-8">Related Articles</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map(relatedPost => (
                  <Link key={relatedPost.id} to={`/blog/${relatedPost.slug}`}>
                    <Card className="overflow-hidden hover-glow group h-full">
                      <img
                        src={relatedPost.cover_image}
                        alt={relatedPost.title}
                        className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="p-4">
                        <h3 className="font-bold mb-2 group-hover:text-primary-500 transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-sm text-text-secondary">
                          {relatedPost.reading_time} min read
                        </p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </article>
    </div>
  );
};
