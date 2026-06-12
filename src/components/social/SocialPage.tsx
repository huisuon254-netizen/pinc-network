import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Plus, Search, Users, Zap } from 'lucide-react';

interface Post { id:string; author_id:string; content:string; like_count:number; reply_count:number; created_at:number; tags:string[]; }

function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const timeAgo = (() => {
    const diff = Date.now() / 1000 - post.created_at;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  })();
  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="pinc-card" style={{ marginBottom:'0.75rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.75rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--bg-elevated)', border:'1px solid var(--border-bright)',
            display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'monospace', fontSize:'0.65rem', color:'var(--neon-cyan)' }}>
            {post.author_id.slice(-4)}
          </div>
          <div>
            <div style={{ fontFamily:'monospace', fontSize:'0.75rem', color:'var(--neon-cyan)' }}>{post.author_id}</div>
            <div style={{ fontSize:'0.62rem', color:'var(--text-muted)' }}>{timeAgo}</div>
          </div>
        </div>
      </div>
      <div style={{ fontSize:'0.82rem', color:'var(--text-primary)', lineHeight:1.7, marginBottom:'0.75rem' }}>{post.content}</div>
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'0.875rem' }}>
        {post.tags.map(t => <span key={t} style={{ fontSize:'0.65rem', color:'var(--electric-blue)' }}>{t}</span>)}
      </div>
      <div style={{ display:'flex', gap:'1.5rem', paddingTop:'0.5rem', borderTop:'1px solid var(--border)' }}>
        {[
          { icon:<Heart size={14} fill={liked?'var(--neon-red)':'none'} color={liked?'var(--neon-red)':'var(--text-muted)'}/>, count: post.like_count + (liked?1:0), action: () => setLiked(!liked) },
          { icon:<MessageCircle size={14} color="var(--text-muted)"/>, count: post.reply_count, action: ()=>{} },
          { icon:<Share2 size={14} color="var(--text-muted)"/>, count: null, action: ()=>{} },
        ].map((a, i) => (
          <button key={i} onClick={a.action}
            style={{ display:'flex', alignItems:'center', gap:'5px', background:'none', border:'none', color:'var(--text-muted)', fontSize:'0.72rem', cursor:'pointer', padding:'0', transition:'color 0.15s' }}>
            {a.icon} {a.count !== null && a.count}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default function SocialPage() {
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    invoke<Post[]>('cmd_get_social_feed').then(setPosts).catch(console.error);
  }, []);

  return (
    <div style={{ padding:'2rem', maxWidth:'780px' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.2em', marginBottom:'0.25rem' }}>ENCRYPTED COMMUNITY</div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ fontSize:'1.25rem', fontWeight:700 }}>Social Feed</div>
          <span className="badge badge-purple">PHASE 9</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'0.75rem', marginBottom:'1.5rem' }}>
        {[{ l:'FOLLOWING', v:'18', c:'var(--electric-blue)', icon:<Users size={14}/> },
          { l:'FOLLOWERS', v:'47', c:'var(--neon-cyan)', icon:<Users size={14}/> },
          { l:'ACTIVE GROUPS', v:'6', c:'var(--soft-purple)', icon:<Zap size={14}/> }].map(s => (
          <div key={s.l} className="pinc-card" style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
            <div style={{ color:s.c }}>{s.icon}</div>
            <div>
              <div style={{ fontFamily:'monospace', fontSize:'1.1rem', fontWeight:700, color:s.c }}>{s.v}</div>
              <div style={{ fontSize:'0.62rem', color:'var(--text-muted)' }}>{s.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Compose */}
      <div className="pinc-card" style={{ marginBottom:'1.5rem' }}>
        <textarea className="pinc-input" rows={3} placeholder="Share with the PINC network... (end-to-end encrypted to followers)"
          value={newPost} onChange={e => setNewPost(e.target.value)} style={{ resize:'none', marginBottom:'0.75rem' }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>🔒 Encrypted · {newPost.length}/500</div>
          <button className="pinc-btn pinc-btn-primary" style={{ fontSize:'0.75rem' }} onClick={() => setNewPost('')}>
            <Plus size={13}/> POST
          </button>
        </div>
      </div>

      {/* Feed */}
      {posts.map(p => <PostCard key={p.id} post={p} />)}
    </div>
  );
}
