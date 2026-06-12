import { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Share2, Plus, Search, Users, Zap,
  TrendingUp, Bell, Send, X, Bookmark, MoreHorizontal,
  UserPlus, UserMinus, ExternalLink, Image, Link as LinkIcon,
  Hash, ChevronDown, Loader2, Eye, Globe, Lock, AtSign,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';

interface Post {
  id: string;
  author_id: string;
  content: string;
  media_hashes: string[];
  post_type: string;
  visibility: string;
  like_count: number;
  reply_count: number;
  reply_to: string | null;
  tags: string[];
  created_at: number;
  edited_at: number | null;
  encrypted: boolean;
}

interface Profile {
  node_id: string;
  display_name: string;
  bio: string | null;
  avatar_hash: string | null;
  skills: string[];
  badges: { id: string; name: string; icon: string; rarity: string }[];
  follower_count: number;
  following_count: number;
  post_count: number;
  joined_at: number;
  verified: boolean;
}

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'share';
  from_user: string;
  post_id: string | null;
  content: string;
  read: boolean;
  created_at: number;
}

type SocialTab = 'feed' | 'trending' | 'notifications' | 'profile';
type PostVisibility = 'public' | 'followers' | 'private';

const AVATAR_COLORS = [
  'from-purple-500 to-pink-500',
  'from-cyan-400 to-blue-500',
  'from-green-400 to-emerald-500',
  'from-orange-400 to-red-500',
  'from-violet-400 to-purple-500',
  'from-pink-400 to-rose-500',
];

function getAvatarGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeAgo(ts: number): string {
  const diff = Date.now() / 1000 - ts;
  if (diff < 0) return 'just now';
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return `${Math.floor(diff / 604800)}w`;
}

function extractLinks(text: string): { text: string; links: string[] } {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const links = text.match(urlRegex) || [];
  return { text, links };
}

function extractHashtags(text: string): { text: string; tags: string[] } {
  const tagRegex = /#(\w+)/g;
  const tags: string[] = [];
  let match;
  while ((match = tagRegex.exec(text)) !== null) tags.push(match[1]);
  return { text, tags };
}

function truncateId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

const BADGE_COLORS: Record<string, string> = {
  Common: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
  Rare: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  Epic: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  Legendary: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
};

const VISIBILITY_CONFIG: Record<PostVisibility, { icon: typeof Globe; label: string; color: string }> = {
  public: { icon: Globe, label: 'Public', color: 'text-cyan-400' },
  followers: { icon: Users, label: 'Followers', color: 'text-purple-400' },
  private: { icon: Lock, label: 'Private', color: 'text-yellow-400' },
};

const BADGE_ICONS: Record<string, string> = {
  Verified: '\u2713',
  Pioneer: '\u2605',
  Builder: '\u2692',
  Guardian: '\u26E8',
  Relay: '\u26A1',
  TopContributor: '\u2606',
};

function NotificationIcon({ type }: { type: Notification['type'] }) {
  const cfg: Record<string, { icon: typeof Heart; color: string }> = {
    like: { icon: Heart, color: 'text-pink-400' },
    comment: { icon: MessageCircle, color: 'text-cyan-400' },
    follow: { icon: UserPlus, color: 'text-purple-400' },
    mention: { icon: AtSign, color: 'text-yellow-400' },
    share: { icon: Share2, color: 'text-green-400' },
  };
  const { icon: Icon, color } = cfg[type] || cfg.like;
  return <Icon size={14} className={color} />;
}

function PostCard({
  post,
  myNodeId,
  onLike,
  onComment,
  onShare,
  onProfileClick,
  liked,
  saved,
  onSave,
}: {
  post: Post;
  myNodeId: string;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onProfileClick: (id: string) => void;
  liked: boolean;
  saved: boolean;
  onSave: () => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<{ id: string; author: string; text: string; ts: number }[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const { text: contentText, links } = extractLinks(post.content);
  const { tags } = extractHashtags(contentText);
  const displayTags = [...new Set([...post.tags, ...tags])];
  const isAuthor = post.author_id === myNodeId;
  const vis = (post.visibility as PostVisibility) || 'public';
  const VisIcon = VISIBILITY_CONFIG[vis]?.icon ?? Globe;
  const visColor = VISIBILITY_CONFIG[vis]?.color ?? 'text-gray-400';

  const loadComments = async () => {
    try {
      const c = await invoke<{ id: string; author: string; text: string; ts: number }[]>('cmd_get_post_comments', { postId: post.id }).catch(() => []);
      setComments(c);
    } catch { setComments([]); }
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    try {
      await invoke('cmd_comment_on_post', { postId: post.id, content: commentText.trim() });
      setCommentText('');
      loadComments();
    } catch (e) { console.error('Comment failed:', e); }
  };

  useEffect(() => {
    if (showComments) loadComments();
  }, [showComments]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#12121e] border border-[#1e1e3a] rounded-lg p-4 mb-3 transition-all duration-200 hover:border-[#2a2a4a] hover:shadow-[0_0_20px_rgba(168,85,247,0.05)]"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onProfileClick(post.author_id)}
            className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarGradient(post.author_id)} flex items-center justify-center text-white text-[10px] font-mono font-bold flex-shrink-0 ring-1 ring-white/10 hover:ring-white/30 transition-all`}
          >
            {post.author_id.slice(-4).toUpperCase()}
          </button>
          <div>
            <button
              onClick={() => onProfileClick(post.author_id)}
              className="font-mono text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-semibold"
            >
              {truncateId(post.author_id)}
            </button>
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              <span>{timeAgo(post.created_at)}</span>
              <span className="text-gray-600">&middot;</span>
              <VisIcon size={10} className={visColor} />
              <span className={visColor}>{VISIBILITY_CONFIG[vis]?.label}</span>
            </div>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-600 hover:text-gray-400 transition-colors rounded"
          >
            <MoreHorizontal size={14} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 z-10 bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg py-1 min-w-[140px] shadow-xl">
              <button className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors">
                <Bookmark size={12} /> Save Post
              </button>
              {!isAuthor && (
                <button className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors">
                  <UserPlus size={12} /> Follow
                </button>
              )}
              {isAuthor && (
                <button className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors">
                  <MoreHorizontal size={12} /> Edit
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-200 leading-relaxed mb-3 whitespace-pre-wrap break-words">
        {contentText}
      </div>

      {links.length > 0 && (
        <div className="mb-3 space-y-1">
          {links.map((link, i) => (
            <a
              key={i}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
            >
              <ExternalLink size={10} /> {link.length > 50 ? link.slice(0, 50) + '...' : link}
            </a>
          ))}
        </div>
      )}

      {displayTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {displayTags.map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 text-[10px] rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 pt-3 border-t border-[#1e1e3a]">
        <button
          onClick={onLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${
            liked
              ? 'text-pink-400 bg-pink-500/10'
              : 'text-gray-500 hover:text-pink-400 hover:bg-pink-500/5'
          }`}
        >
          <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
          <span className="font-mono">{post.like_count + (liked ? 1 : 0)}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${
            showComments
              ? 'text-cyan-400 bg-cyan-500/10'
              : 'text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/5'
          }`}
        >
          <MessageCircle size={13} />
          <span className="font-mono">{post.reply_count}</span>
        </button>
        <button
          onClick={onShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-gray-500 hover:text-green-400 hover:bg-green-500/5 transition-all"
        >
          <Share2 size={13} />
        </button>
        <div className="flex-1" />
        <button
          onClick={onSave}
          className={`p-1.5 rounded-md text-xs transition-all ${
            saved
              ? 'text-yellow-400 bg-yellow-500/10'
              : 'text-gray-600 hover:text-yellow-400 hover:bg-yellow-500/5'
          }`}
        >
          <Bookmark size={13} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-[#1e1e3a] space-y-2">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getAvatarGradient(c.author)} flex items-center justify-center text-white text-[8px] font-mono font-bold flex-shrink-0`}>
                    {c.author.slice(-2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-[10px] text-cyan-400">{truncateId(c.author)}</span>
                      <span className="text-[9px] text-gray-600">{timeAgo(c.ts)}</span>
                    </div>
                    <div className="text-xs text-gray-300 mt-0.5">{c.text}</div>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-[10px] text-gray-600 text-center py-2">No comments yet</div>
              )}
              <div className="flex gap-2 mt-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                  placeholder="Write a comment..."
                  className="flex-1 bg-[#0f0f1a] border border-[#1e1e3a] rounded px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-cyan-500/50 transition-colors"
                />
                <button
                  onClick={submitComment}
                  disabled={!commentText.trim()}
                  className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded text-xs hover:bg-cyan-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CreatePostModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (content: string, visibility: PostVisibility, tags: string[]) => void;
}) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !tags.includes(t) && tags.length < 8) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const handleSubmit = async () => {
    if (!content.trim() || posting) return;
    setPosting(true);
    try {
      await onSubmit(content.trim(), visibility, tags);
      setContent('');
      setTags([]);
      setTagInput('');
      setVisibility('public');
      onClose();
    } finally {
      setPosting(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-[#12121e] border border-[#2a2a4a] rounded-xl w-full max-w-lg shadow-2xl shadow-purple-500/10"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e3a]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
              <span className="text-sm font-semibold text-gray-200">New Post</span>
              <span className="text-[10px] text-gray-600 font-mono ml-1">E2E Encrypted</span>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="p-5">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind? Share with the PINC network..."
              className="w-full h-32 bg-[#0f0f1a] border border-[#1e1e3a] rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none resize-none focus:border-purple-500/50 transition-colors"
              maxLength={2000}
            />

            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1">
                {(['public', 'followers', 'private'] as PostVisibility[]).map((v) => {
                  const cfg = VISIBILITY_CONFIG[v];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={v}
                      onClick={() => setVisibility(v)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all ${
                        visibility === v
                          ? `${cfg.color} bg-white/5 border border-current/20`
                          : 'text-gray-600 hover:text-gray-400 border border-transparent'
                      }`}
                    >
                      <Icon size={10} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex-1" />
              <span className="text-[10px] text-gray-600 font-mono">{content.length}/2000</span>
            </div>

            <div className="mt-3">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  >
                    #{t}
                    <button onClick={() => removeTag(t)} className="hover:text-pink-400 transition-colors">
                      <X size={8} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); addTag(); }
                    }}
                    placeholder="Add tags..."
                    className="w-full bg-[#0a0a0f] border border-[#1e1e3a] rounded px-2.5 pl-7 py-1.5 text-[11px] text-gray-300 placeholder-gray-600 outline-none focus:border-purple-500/40 transition-colors"
                  />
                </div>
                <button
                  onClick={addTag}
                  disabled={!tagInput.trim() || tags.length >= 8}
                  className="px-2.5 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded text-[11px] hover:bg-purple-500/20 transition-colors disabled:opacity-30"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-5 py-4 border-t border-[#1e1e3a] bg-[#0f0f1a]/50 rounded-b-xl">
            <div className="flex items-center gap-3 text-gray-600">
              <button className="p-1.5 hover:bg-white/5 rounded transition-colors hover:text-cyan-400">
                <Image size={15} />
              </button>
              <button className="p-1.5 hover:bg-white/5 rounded transition-colors hover:text-cyan-400">
                <LinkIcon size={15} />
              </button>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || posting}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-lg hover:from-purple-400 hover:to-pink-400 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {posting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ProfileCard({
  profile,
  myNodeId,
  onFollow,
  onMessage,
}: {
  profile: Profile;
  myNodeId: string;
  onFollow: (id: string) => void;
  onMessage: (id: string) => void;
}) {
  const isMe = profile.node_id === myNodeId;
  const [following, setFollowing] = useState(false);

  const handleFollow = () => {
    setFollowing(!following);
    onFollow(profile.node_id);
  };

  return (
    <div className="bg-[#12121e] border border-[#1e1e3a] rounded-xl overflow-hidden hover:border-[#2a2a4a] transition-all group">
      <div className="h-16 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#12121e]" />
      </div>
      <div className="px-4 pb-4 -mt-6 relative">
        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${getAvatarGradient(profile.node_id)} flex items-center justify-center text-white text-sm font-mono font-bold ring-4 ring-[#12121e] mb-3`}>
          {profile.node_id.slice(-4).toUpperCase()}
        </div>
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-sm text-cyan-400 font-semibold flex items-center gap-1.5">
              {truncateId(profile.node_id)}
              {profile.verified && (
                <span className="text-[9px] px-1 py-0.5 bg-cyan-500/10 text-cyan-400 rounded border border-cyan-500/20">
                  VERIFIED
                </span>
              )}
            </div>
            {profile.display_name && (
              <div className="text-xs text-gray-400 mt-0.5">{profile.display_name}</div>
            )}
          </div>
          {!isMe && (
            <div className="flex gap-1.5">
              <button
                onClick={handleFollow}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  following
                    ? 'bg-gray-500/10 text-gray-400 border border-gray-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400 shadow-lg shadow-purple-500/20'
                }`}
              >
                {following ? <UserMinus size={11} /> : <UserPlus size={11} />}
                {following ? 'Following' : 'Follow'}
              </button>
              <button
                onClick={() => onMessage(profile.node_id)}
                className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-colors"
              >
                <Send size={11} />
              </button>
            </div>
          )}
        </div>

        {profile.bio && (
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">{profile.bio}</p>
        )}

        {profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {profile.skills.slice(0, 5).map((s) => (
              <span key={s} className="px-1.5 py-0.5 text-[9px] rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {s}
              </span>
            ))}
          </div>
        )}

        {profile.badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {profile.badges.map((b) => (
              <span
                key={b.id}
                className={`flex items-center gap-1 px-1.5 py-0.5 text-[9px] rounded border ${BADGE_COLORS[b.rarity] || BADGE_COLORS.Common}`}
              >
                {BADGE_ICONS[b.name] || b.icon} {b.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#1e1e3a]">
          <div className="text-center">
            <div className="font-mono text-xs font-bold text-gray-200">{profile.post_count}</div>
            <div className="text-[9px] text-gray-600">Posts</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xs font-bold text-purple-400">{profile.follower_count}</div>
            <div className="text-[9px] text-gray-600">Followers</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xs font-bold text-cyan-400">{profile.following_count}</div>
            <div className="text-[9px] text-gray-600">Following</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  onNavigate,
}: {
  notification: Notification;
  onNavigate: (postId: string | null) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => onNavigate(notification.post_id)}
      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-white/[0.02] ${
        !notification.read ? 'bg-purple-500/[0.03] border-l-2 border-purple-500/50' : ''
      }`}
    >
      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarGradient(notification.from_user)} flex items-center justify-center text-white text-[9px] font-mono font-bold flex-shrink-0`}>
        {notification.from_user.slice(-2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <NotificationIcon type={notification.type} />
          <span className="text-xs text-gray-300">
            <span className="font-mono text-cyan-400 text-[11px]">{truncateId(notification.from_user)}</span>
            {' '}
            {notification.type === 'like' && 'liked your post'}
            {notification.type === 'comment' && 'commented on your post'}
            {notification.type === 'follow' && 'started following you'}
            {notification.type === 'mention' && 'mentioned you'}
            {notification.type === 'share' && 'shared your post'}
          </span>
        </div>
        {notification.content && (
          <div className="text-[11px] text-gray-500 mt-1 truncate">{notification.content}</div>
        )}
        <div className="text-[9px] text-gray-600 mt-0.5">{timeAgo(notification.created_at)}</div>
      </div>
      {!notification.read && (
        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0 mt-2" />
      )}
    </motion.div>
  );
}

export default function SocialPage() {
  const [tab, setTab] = useState<SocialTab>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [trending, setTrending] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const identity = useAppStore((s) => s.identity);
  const myNodeId = identity?.node_id ?? '';
  const peers = useAppStore((s) => s.peers);

  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      const feed = await invoke<Post[]>('cmd_get_social_feed').catch(() => []);
      setPosts(feed);
      setHasMore(feed.length >= 20);
      feed.forEach((p) => {
        if (!profiles[p.author_id]) loadProfile(p.author_id);
      });
    } catch (e) {
      console.error('Feed load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTrending = useCallback(async () => {
    try {
      const t = await invoke<Post[]>('cmd_get_trending_posts').catch(() => setTrending([]));
      if (Array.isArray(t)) setTrending(t);
    } catch { setTrending([]); }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const n = await invoke<Notification[]>('cmd_get_notifications').catch(() => setNotifications([]));
      if (Array.isArray(n)) setNotifications(n);
    } catch { setNotifications([]); }
  }, []);

  const loadProfile = async (nodeId: string) => {
    try {
      const p = await invoke<Profile>('cmd_get_profile', { nodeId }).catch(() => null);
      if (p) setProfiles((prev) => ({ ...prev, [nodeId]: p }));
    } catch { /* profile not available */ }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const more = await invoke<Post[]>('cmd_get_social_feed', { offset: posts.length, limit: 20 }).catch(() => []);
      if (more.length === 0) setHasMore(false);
      else {
        setPosts((prev) => [...prev, ...more]);
        more.forEach((p) => { if (!profiles[p.author_id]) loadProfile(p.author_id); });
      }
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => { loadFeed(); loadTrending(); loadNotifications(); }, []);

  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) loadMore();
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [loadingMore, hasMore, posts.length]);

  const handleCreatePost = async (content: string, visibility: PostVisibility, tags: string[]) => {
    try {
      await invoke('cmd_create_post', { content, tags });
      loadFeed();
    } catch (e) {
      console.error('Post failed:', e);
    }
  };

  const handleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
        setPosts((ps) => ps.map((p) => (p.id === postId ? { ...p, like_count: Math.max(0, p.like_count - 1) } : p)));
      } else {
        next.add(postId);
        setPosts((ps) => ps.map((p) => (p.id === postId ? { ...p, like_count: p.like_count + 1 } : p)));
        invoke('cmd_like_post', { postId }).catch(() => {});
      }
      return next;
    });
  };

  const handleSave = (postId: string) => {
    setSavedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const handleShare = async (postId: string) => {
    try {
      await invoke('cmd_share_post', { postId });
    } catch { /* share not available */ }
  };

  const handleFollow = (nodeId: string) => {
    setFollowing((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
        invoke('cmd_unfollow_user', { nodeId }).catch(() => {});
      } else {
        next.add(nodeId);
        invoke('cmd_follow_user', { nodeId }).catch(() => {});
      }
      return next;
    });
  };

  const handleMessage = (nodeId: string) => {
    window.dispatchEvent(new CustomEvent('navigate-to-messages', { detail: { peerId: nodeId } }));
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const results = await invoke<Profile[]>('cmd_search_users', { query: q.trim() }).catch(() => []);
      setSearchResults(Array.isArray(results) ? results : []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  const handleProfileClick = (nodeId: string) => {
    loadProfile(nodeId);
    setViewingProfile(nodeId);
    setTab('profile');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const displayPosts = tab === 'feed' ? posts : tab === 'trending' ? trending : [];

  if (viewingProfile && tab === 'profile') {
    const p = profiles[viewingProfile];
    return (
      <div className="h-full overflow-y-auto" ref={feedRef} style={{ scrollbarWidth: 'thin' }}>
        <div className="max-w-2xl mx-auto p-4">
          <button
            onClick={() => { setViewingProfile(null); setTab('feed'); }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-cyan-400 transition-colors mb-4"
          >
            &larr; Back to feed
          </button>
          {p ? (
            <ProfileCard
              profile={p}
              myNodeId={myNodeId}
              onFollow={handleFollow}
              onMessage={handleMessage}
            />
          ) : (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={20} className="animate-spin text-purple-400" />
            </div>
          )}
          {p && (
            <div className="mt-4 space-y-3">
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Posts by {truncateId(viewingProfile)}</div>
              {posts.filter((post) => post.author_id === viewingProfile).map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  myNodeId={myNodeId}
                  onLike={() => handleLike(post.id)}
                  onComment={() => {}}
                  onShare={() => handleShare(post.id)}
                  onProfileClick={handleProfileClick}
                  liked={likedPosts.has(post.id)}
                  saved={savedPosts.has(post.id)}
                  onSave={() => handleSave(post.id)}
                />
              ))}
              {posts.filter((post) => post.author_id === viewingProfile).length === 0 && (
                <div className="text-center text-gray-600 text-xs py-8">No posts yet</div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] text-gray-500 tracking-[0.2em] uppercase mb-0.5">Encrypted Community</div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-gray-100">Social</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded border border-purple-500/20 font-semibold">
                  PHASE 9
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMessage(peers[0]?.id || '')}
                className="p-2 bg-[#12121e] border border-[#1e1e3a] rounded-lg text-gray-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
                title="Messages"
              >
                <Send size={14} />
              </button>
              <button
                onClick={() => setTab('notifications')}
                className="relative p-2 bg-[#12121e] border border-[#1e1e3a] rounded-lg text-gray-500 hover:text-purple-400 hover:border-purple-500/30 transition-all"
              >
                <Bell size={14} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-[#0a0a0f] rounded-lg p-1 border border-[#1e1e3a]">
            {([
              { id: 'feed' as SocialTab, label: 'Feed', icon: Zap },
              { id: 'trending' as SocialTab, label: 'Trending', icon: TrendingUp },
              { id: 'notifications' as SocialTab, label: 'Activity', icon: Bell, badge: unreadCount },
            ]).map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); if (t.id === 'trending') loadTrending(); if (t.id === 'notifications') loadNotifications(); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-medium transition-all ${
                    tab === t.id
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/20'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon size={12} />
                  {t.label}
                  {t.badge !== undefined && t.badge > 0 && (
                    <span className="w-4 h-4 bg-pink-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                      {t.badge > 9 ? '9+' : t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative mt-3">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search users, tags, content..."
              className="w-full bg-[#0f0f1a] border border-[#1e1e3a] rounded-lg pl-8 pr-3 py-2 text-xs text-gray-300 placeholder-gray-600 outline-none focus:border-purple-500/40 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Search Results */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-2 bg-[#12121e] border border-[#2a2a4a] rounded-lg overflow-hidden max-h-60 overflow-y-auto"
              >
                {searchResults.map((p) => (
                  <button
                    key={p.node_id}
                    onClick={() => { handleProfileClick(p.node_id); setSearchQuery(''); setSearchResults([]); }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors text-left"
                  >
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarGradient(p.node_id)} flex items-center justify-center text-white text-[9px] font-mono font-bold flex-shrink-0`}>
                      {p.node_id.slice(-2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[11px] text-cyan-400">{truncateId(p.node_id)}</div>
                      {p.display_name && <div className="text-[10px] text-gray-500">{p.display_name}</div>}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-gray-600">
                      <span>{p.follower_count} followers</span>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" ref={feedRef} style={{ scrollbarWidth: 'thin' }}>
        <div className="max-w-2xl mx-auto p-4">
          {/* Stats */}
          {tab === 'feed' && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Posts', value: posts.length, color: 'text-cyan-400', icon: MessageCircle },
                { label: 'Authors', value: new Set(posts.map((p) => p.author_id)).size, color: 'text-purple-400', icon: Users },
                { label: 'Likes', value: posts.reduce((s, p) => s + p.like_count, 0), color: 'text-pink-400', icon: Heart },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="bg-[#12121e] border border-[#1e1e3a] rounded-lg p-3 flex items-center gap-2.5 hover:border-[#2a2a4a] transition-colors">
                    <Icon size={14} className={s.color} />
                    <div>
                      <div className={`font-mono text-sm font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-[9px] text-gray-600 uppercase tracking-wider">{s.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Create Post Button (feed only) */}
          {tab === 'feed' && (
            <button
              onClick={() => setShowCreatePost(true)}
              className="w-full bg-[#12121e] border border-[#1e1e3a] rounded-lg p-4 mb-4 text-left hover:border-purple-500/30 hover:bg-purple-500/[0.02] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarGradient(myNodeId || 'default')} flex items-center justify-center text-white text-[10px] font-mono font-bold flex-shrink-0 ring-1 ring-white/10`}>
                  {(myNodeId.slice(-4) || 'YOU').toUpperCase()}
                </div>
                <div className="flex-1 text-xs text-gray-600 group-hover:text-gray-400 transition-colors">
                  Share with the PINC network...
                </div>
                <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg text-purple-400 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all">
                  <Plus size={14} />
                </div>
              </div>
            </button>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-purple-400" />
              <span className="ml-2 text-xs text-gray-500">Loading feed...</span>
            </div>
          )}

          {/* Empty */}
          {!loading && displayPosts.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex items-center justify-center">
                <Zap size={24} className="text-purple-400" />
              </div>
              <div className="text-sm text-gray-400 mb-1">
                {tab === 'feed' ? 'No posts yet' : tab === 'trending' ? 'No trending posts' : 'No notifications'}
              </div>
              <div className="text-[11px] text-gray-600">
                {tab === 'feed'
                  ? 'Be the first to share with the network'
                  : 'Check back later for popular content'}
              </div>
            </div>
          )}

          {/* Posts */}
          {displayPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              myNodeId={myNodeId}
              onLike={() => handleLike(post.id)}
              onComment={() => {}}
              onShare={() => handleShare(post.id)}
              onProfileClick={handleProfileClick}
              liked={likedPosts.has(post.id)}
              saved={savedPosts.has(post.id)}
              onSave={() => handleSave(post.id)}
            />
          ))}

          {/* Load More */}
          {tab === 'feed' && hasMore && posts.length > 0 && (
            <div className="flex justify-center py-4">
              {loadingMore ? (
                <Loader2 size={16} className="animate-spin text-purple-400" />
              ) : (
                <button
                  onClick={loadMore}
                  className="text-[11px] text-gray-500 hover:text-purple-400 transition-colors"
                >
                  Load more posts
                </button>
              )}
            </div>
          )}

          {/* Notifications */}
          {tab === 'notifications' && (
            <div className="space-y-1">
              {notifications.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Bell size={24} className="text-gray-600 mx-auto mb-3" />
                  <div className="text-xs text-gray-500">No activity yet</div>
                </div>
              )}
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onNavigate={(postId) => {
                    if (postId) setTab('feed');
                  }}
                />
              ))}
            </div>
          )}

          {/* Trending */}
          {tab === 'trending' && trending.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-pink-400" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Top Posts</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Create Post Button (mobile) */}
      <button
        onClick={() => setShowCreatePost(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all md:hidden z-40"
      >
        <Plus size={20} />
      </button>

      <CreatePostModal
        open={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSubmit={handleCreatePost}
      />
    </div>
  );
}
