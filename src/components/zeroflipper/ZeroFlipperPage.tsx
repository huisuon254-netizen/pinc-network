import { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShoppingCart,
  Star,
  TrendingUp,
  Award,
  Zap,
  Code,
  Smartphone,
  Globe,
  Layers,
  Palette,
  FileText,
  BarChart3,
  Box,
  Music,
  Database,
  BookOpen,
  Layout,
  Users,
  Heart,
  X,
  Loader2,
  AlertCircle,
  ShoppingBag,
  PenTool,
  Image,
  Gamepad2,
  Headphones,
  Grid3X3,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  seller: string;
  rating: number;
  sales_count: number;
  type: string;
  created_at: number;
}

interface Wager {
  id: string;
  game_id: string;
  game_title: string;
  player_ids: string[];
  bet_amount: number;
  status: string;
  winner_id: string | null;
  created_at: number;
}

interface GameStats {
  total_high_scores: number;
  games_played: number;
  games_won: number;
  win_rate: number;
}

const CATEGORIES: { id: string; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: <Layers size={14} /> },
  { id: 'ai-agents', label: 'AI Agents', icon: <Zap size={14} /> },
  { id: 'saas', label: 'SaaS', icon: <Globe size={14} /> },
  { id: 'websites', label: 'Websites', icon: <Globe size={14} /> },
  { id: 'mobile-apps', label: 'Mobile Apps', icon: <Smartphone size={14} /> },
  { id: 'apis', label: 'APIs', icon: <Code size={14} /> },
  { id: 'ui-kits', label: 'UI Kits', icon: <Palette size={14} /> },
  { id: 'dashboards', label: 'Dashboards', icon: <BarChart3 size={14} /> },
  { id: 'crm', label: 'CRM Systems', icon: <Users size={14} /> },
  { id: 'erp', label: 'ERP Systems', icon: <Database size={14} /> },
  { id: 'business-systems', label: 'Business', icon: <Layout size={14} /> },
  { id: 'legal-docs', label: 'Legal Docs', icon: <FileText size={14} /> },
  { id: 'marketing', label: 'Marketing', icon: <TrendingUp size={14} /> },
  { id: 'design', label: 'Design Assets', icon: <PenTool size={14} /> },
  { id: '3d-models', label: '3D Models', icon: <Box size={14} /> },
  { id: 'templates', label: 'Templates', icon: <FileText size={14} /> },
  { id: 'ecommerce', label: 'E-Commerce', icon: <ShoppingBag size={14} /> },
  { id: 'games', label: 'Games', icon: <Gamepad2 size={14} /> },
  { id: 'audio', label: 'Audio', icon: <Headphones size={14} /> },
  { id: 'datasets', label: 'Datasets', icon: <Database size={14} /> },
  { id: 'icons', label: 'Icons', icon: <Grid3X3 size={14} /> },
  { id: 'illustrations', label: 'Illustrations', icon: <Image size={14} /> },
  { id: 'fonts', label: 'Fonts', icon: <FileText size={14} /> },
];

const CATEGORY_GRADIENTS: Record<string, string> = {
  'ai-agents': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  saas: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  websites: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'mobile-apps': 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  apis: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'ui-kits': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  dashboards: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  crm: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
  erp: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
  'business-systems': 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  'legal-docs': 'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)',
  marketing: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)',
  design: 'linear-gradient(135deg, #c3cfe2 0%, #f5f7fa 100%)',
  '3d-models': 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  templates: 'linear-gradient(135deg, #f5576c 0%, #ff6f91 100%)',
  ecommerce: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
  games: 'linear-gradient(135deg, #f77062 0%, #fe5196 100%)',
  audio: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  datasets: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  icons: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  illustrations: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  fonts: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'ai-agents': <Zap size={24} />,
  saas: <Globe size={24} />,
  websites: <Globe size={24} />,
  'mobile-apps': <Smartphone size={24} />,
  apis: <Code size={24} />,
  'ui-kits': <Palette size={24} />,
  dashboards: <BarChart3 size={24} />,
  crm: <Users size={24} />,
  erp: <Database size={24} />,
  'business-systems': <Layout size={24} />,
  'legal-docs': <FileText size={24} />,
  marketing: <TrendingUp size={24} />,
  design: <PenTool size={24} />,
  '3d-models': <Box size={24} />,
  templates: <FileText size={24} />,
  ecommerce: <ShoppingBag size={24} />,
  games: <Gamepad2 size={24} />,
  audio: <Headphones size={24} />,
  datasets: <Database size={24} />,
  icons: <Grid3X3 size={24} />,
  illustrations: <Image size={24} />,
  fonts: <FileText size={24} />,
};

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

const TYPE_COLORS: Record<string, string> = {
  Template: 'var(--accent-blue)',
  Asset: 'var(--accent-purple)',
  SaaS: 'var(--accent-green)',
  System: 'var(--accent-red)',
  Pack: 'var(--accent-yellow)',
};

const DEFAULT_TYPE_COLOR = 'var(--accent-blue)';

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

function renderStars(rating: number): React.ReactNode {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <>
      {'★'.repeat(full)}
      {half ? '½' : ''}
      {'☆'.repeat(empty)}
    </>
  );
}

function formatSales(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function getGradient(category: string): string {
  return CATEGORY_GRADIENTS[category] || DEFAULT_GRADIENT;
}

function getCategoryIcon(category: string): React.ReactNode {
  return CATEGORY_ICONS[category] || <Box size={24} />;
}

function getTypeColor(type: string): string {
  return TYPE_COLORS[type] || DEFAULT_TYPE_COLOR;
}

function getSellerInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontFamily: "'Inter', 'Space Grotesk', system-ui, sans-serif",
  } as React.CSSProperties,
  container: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '24px',
  } as React.CSSProperties,
  header: {
    textAlign: 'center' as const,
    marginBottom: 32,
    padding: '40px 0 24px',
  } as React.CSSProperties,
  title: {
    fontSize: 42,
    fontWeight: 800,
    letterSpacing: -1,
    background: 'linear-gradient(135deg, var(--accent-red) 0%, var(--accent-purple) 50%, var(--accent-blue) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: 8,
  } as React.CSSProperties,
  subtitle: {
    fontSize: 16,
    color: 'var(--text-muted)',
    fontWeight: 400,
  } as React.CSSProperties,
  searchContainer: {
    position: 'relative' as const,
    maxWidth: 600,
    margin: '0 auto 32px',
  } as React.CSSProperties,
  searchIcon: {
    position: 'absolute' as const,
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
  } as React.CSSProperties,
  searchInput: {
    width: '100%',
    padding: '14px 16px 14px 48px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    color: 'var(--text-primary)',
    fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  } as React.CSSProperties,
  categoryBar: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto' as const,
    padding: '0 0 16px',
    marginBottom: 24,
    scrollbarWidth: 'thin' as const,
  } as React.CSSProperties,
  categoryTab: (active: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 8,
    border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border)'}`,
    background: active ? 'rgba(0, 212, 255, 0.1)' : 'var(--bg-secondary)',
    color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.2s',
  }),
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 20,
    marginBottom: 40,
  } as React.CSSProperties,
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    overflow: 'hidden',
    transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
  } as React.CSSProperties,
  cardThumbnail: (gradient: string): React.CSSProperties => ({
    height: 160,
    background: gradient,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
    overflow: 'hidden',
  }),
  cardTypeBadge: (type: string): React.CSSProperties => ({
    position: 'absolute' as const,
    top: 12,
    left: 12,
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    background: 'rgba(0,0,0,0.6)',
    color: getTypeColor(type),
    backdropFilter: 'blur(4px)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  }),
  cardBody: {
    padding: 16,
  } as React.CSSProperties,
  cardName: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 4,
    lineHeight: 1.3,
  } as React.CSSProperties,
  cardDescription: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginBottom: 12,
    lineHeight: 1.5,
    display: '-webkit-box' as const,
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden' as const,
  } as React.CSSProperties,
  cardSeller: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  } as React.CSSProperties,
  sellerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 6,
    background: 'var(--bg-elevated)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 9,
    fontWeight: 700,
    color: 'var(--accent-blue)',
    border: '1px solid var(--border)',
  } as React.CSSProperties,
  sellerName: {
    fontSize: 12,
    color: 'var(--text-muted)',
  } as React.CSSProperties,
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as React.CSSProperties,
  priceContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  } as React.CSSProperties,
  price: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--accent-green)',
  } as React.CSSProperties,
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
  } as React.CSSProperties,
  stars: {
    color: 'var(--accent-yellow)',
  } as React.CSSProperties,
  buyButton: {
    padding: '8px 20px',
    borderRadius: 8,
    border: 'none',
    background: 'var(--accent-blue)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  } as React.CSSProperties,
  statsBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: 48,
    marginBottom: 40,
    padding: 20,
    background: 'var(--bg-secondary)',
    borderRadius: 12,
    border: '1px solid var(--border)',
  } as React.CSSProperties,
  statItem: {
    textAlign: 'center' as const,
  } as React.CSSProperties,
  statValue: {
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--accent-blue)',
  } as React.CSSProperties,
  statLabel: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginTop: 4,
  } as React.CSSProperties,
  featuredBanner: {
    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 32,
    marginBottom: 40,
    textAlign: 'center' as const,
  } as React.CSSProperties,
  featuredTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 8,
  } as React.CSSProperties,
  featuredSubtitle: {
    fontSize: 14,
    color: 'var(--text-muted)',
  } as React.CSSProperties,
  trendingTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    borderRadius: 6,
    background: 'rgba(255, 34, 85, 0.1)',
    color: 'var(--accent-red)',
    fontSize: 11,
    fontWeight: 600,
    border: '1px solid rgba(255, 34, 85, 0.2)',
  } as React.CSSProperties,
  noResults: {
    textAlign: 'center' as const,
    padding: 60,
    color: 'var(--text-muted)',
  } as React.CSSProperties,
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 120,
    gap: 16,
  } as React.CSSProperties,
  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 80,
    gap: 12,
    color: 'var(--accent-red)',
  } as React.CSSProperties,
};

function ProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false);
  const gradient = getGradient(product.category);
  const icon = getCategoryIcon(product.category);
  const initials = getSellerInitials(product.seller);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        ...styles.card,
        transform: hovered ? 'translateY(-4px)' : undefined,
        borderColor: hovered ? 'var(--accent-blue)' : undefined,
        boxShadow: hovered ? '0 8px 32px rgba(0, 212, 255, 0.15)' : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.cardThumbnail(gradient)}>
        <div style={{ color: 'rgba(255,255,255,0.9)', transform: 'scale(2)' }}>
          {icon}
        </div>
        <div style={styles.cardTypeBadge(product.type)}>
          {product.type}
        </div>
      </div>

      <div style={styles.cardBody}>
        <div style={styles.cardName}>{product.name}</div>
        <div style={styles.cardDescription}>{product.description}</div>

        <div style={styles.cardSeller}>
          <div style={styles.sellerAvatar}>{initials}</div>
          <span style={styles.sellerName}>{product.seller}</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
            {formatSales(product.sales_count)} sales
          </span>
        </div>

        <div style={styles.cardFooter}>
          <div style={styles.priceContainer}>
            <span style={styles.price}>{formatPrice(product.price)}</span>
          </div>
          <div style={styles.rating}>
            <span style={styles.stars}>{renderStars(product.rating)}</span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ ...styles.buyButton, width: '100%', marginTop: 12, justifyContent: 'center' }}
        >
          <ShoppingCart size={14} />
          Buy Now
        </motion.button>
      </div>
    </motion.div>
  );
}

function LoadingSpinner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={styles.loadingContainer}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 size={48} style={{ color: 'var(--accent-blue)' }} />
      </motion.div>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{message}</p>
    </motion.div>
  );
}

function ErrorDisplay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={styles.errorContainer}
    >
      <AlertCircle size={48} />
      <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
        Failed to load data
      </h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 400 }}>
        {message}
      </p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onRetry}
        style={{
          ...styles.buyButton,
          marginTop: 8,
          background: 'var(--accent-red)',
        }}
      >
        Retry
      </motion.button>
    </motion.div>
  );
}

export default function ZeroFlipperPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAllCategories, setShowAllCategories] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [wagers, setWagers] = useState<Wager[]>([]);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [productsData, wagersData, gameStatsData] = await Promise.all([
        invoke<Product[]>('cmd_list_products'),
        invoke<Wager[]>('cmd_get_wagers').catch(() => [] as Wager[]),
        invoke<GameStats>('cmd_get_user_game_stats').catch(() => null),
      ]);
      setProducts(productsData);
      setWagers(Array.isArray(wagersData) ? wagersData : []);
      setGameStats(gameStatsData || null);
    } catch (err: unknown) {
      const msg = typeof err === 'string' ? err : 'An unexpected error occurred';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (activeCategory !== 'all') {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.seller.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q)
      );
    }
    return result;
  }, [products, search, activeCategory]);

  const featuredProducts = useMemo(
    () => [...products].sort((a, b) => b.rating - a.rating).slice(0, 6),
    [products]
  );

  const trendingProducts = useMemo(
    () => [...products].sort((a, b) => b.sales_count - a.sales_count).slice(0, 6),
    [products]
  );

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const uniqueSellers = new Set(products.map((p) => p.seller)).size;
    const totalSales = products.reduce((sum, p) => sum + p.sales_count, 0);
    const avgRating =
      products.length > 0
        ? products.reduce((sum, p) => sum + p.rating, 0) / products.length
        : 0;
    const activeWagers = wagers.filter(
      (w) => w.status === 'active' || w.status === 'open'
    ).length;
    const totalPoints = gameStats?.total_high_scores ?? 0;
    return { totalProducts, uniqueSellers, totalSales, avgRating, activeWagers, totalPoints };
  }, [products, wagers, gameStats]);

  const visibleCategories = showAllCategories ? CATEGORIES : CATEGORIES.slice(0, 12);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={styles.header}
          >
            <h1 style={styles.title}>ZEROFLIPPER</h1>
            <p style={styles.subtitle}>Digital Marketplace</p>
          </motion.div>
          <LoadingSpinner message="Loading marketplace data..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={styles.header}
          >
            <h1 style={styles.title}>ZEROFLIPPER</h1>
            <p style={styles.subtitle}>Digital Marketplace</p>
          </motion.div>
          <ErrorDisplay message={error} onRetry={loadData} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={styles.header}
        >
          <h1 style={styles.title}>ZEROFLIPPER</h1>
          <p style={styles.subtitle}>
            Digital Marketplace &mdash; {formatNumber(stats.totalProducts)} Products
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={styles.statsBar}
        >
          <div style={styles.statItem}>
            <div style={styles.statValue}>{formatNumber(stats.totalProducts)}</div>
            <div style={styles.statLabel}>Products</div>
          </div>
          <div style={styles.statItem}>
            <div style={{ ...styles.statValue, color: 'var(--accent-green)' }}>
              {formatNumber(stats.uniqueSellers)}
            </div>
            <div style={styles.statLabel}>Creators</div>
          </div>
          <div style={styles.statItem}>
            <div style={{ ...styles.statValue, color: 'var(--accent-purple)' }}>
              {formatNumber(stats.totalSales)}+
            </div>
            <div style={styles.statLabel}>Sales</div>
          </div>
          <div style={styles.statItem}>
            <div style={{ ...styles.statValue, color: 'var(--accent-yellow)' }}>
              {stats.avgRating.toFixed(1)}
            </div>
            <div style={styles.statLabel}>Avg Rating</div>
          </div>
          {stats.activeWagers > 0 && (
            <div style={styles.statItem}>
              <div style={{ ...styles.statValue, color: 'var(--accent-red)' }}>
                {stats.activeWagers}
              </div>
              <div style={styles.statLabel}>Active Wagers</div>
            </div>
          )}
          {stats.totalPoints > 0 && (
            <div style={styles.statItem}>
              <div style={{ ...styles.statValue, color: 'var(--accent-orange, #f59e0b)' }}>
                {formatNumber(stats.totalPoints)}
              </div>
              <div style={styles.statLabel}>High Scores</div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={styles.searchContainer}
        >
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${formatNumber(stats.totalProducts)} products, templates, assets, and more...`}
            style={styles.searchInput}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-blue)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 212, 255, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              <X size={16} />
            </button>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div style={styles.categoryBar}>
            {visibleCategories.map((cat) => (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={styles.categoryTab(activeCategory === cat.id)}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.icon}
                {cat.label}
              </motion.button>
            ))}
            {!showAllCategories && CATEGORIES.length > 12 && (
              <button
                onClick={() => setShowAllCategories(true)}
                style={styles.categoryTab(false)}
              >
                +{CATEGORIES.length - 12} more
              </button>
            )}
          </div>
        </motion.div>

        {activeCategory === 'all' && !search && products.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={styles.featuredBanner}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              <Award size={24} style={{ color: 'var(--accent-yellow)' }} />
              <span style={styles.trendingTag}>
                <TrendingUp size={12} />
                Featured Collection
              </span>
            </div>
            <h2 style={styles.featuredTitle}>Top Picks by Our Team</h2>
            <p style={styles.featuredSubtitle}>
              Hand-selected products trusted by thousands of creators worldwide
            </p>
          </motion.div>
        )}

        {activeCategory === 'all' && !search && featuredProducts.length > 0 && (
          <>
            <div style={styles.sectionTitle}>
              <Award size={20} style={{ color: 'var(--accent-yellow)' }} />
              Featured Products
            </div>
            <div style={styles.grid}>
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}

        {activeCategory === 'all' && !search && trendingProducts.length > 0 && (
          <>
            <div style={styles.sectionTitle}>
              <TrendingUp size={20} style={{ color: 'var(--accent-red)' }} />
              Trending Now
            </div>
            <div style={styles.grid}>
              {trendingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}

        <>
          <div style={styles.sectionTitle}>
            <Layers size={20} style={{ color: 'var(--accent-blue)' }} />
            {activeCategory === 'all'
              ? 'All Products'
              : CATEGORIES.find((c) => c.id === activeCategory)?.label ?? 'Products'}
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
              ({filteredProducts.length})
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={styles.noResults}
            >
              <Search size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
              <h3 style={{ fontSize: 18, marginBottom: 8, color: 'var(--text-primary)' }}>
                {search ? 'No products match your search' : 'No products found'}
              </h3>
              <p style={{ fontSize: 14 }}>
                {search ? 'Try different keywords or browse categories' : 'Try adjusting your search or category filter'}
              </p>
            </motion.div>
          ) : (
            <div style={styles.grid}>
              <AnimatePresence>
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      </div>
    </div>
  );
}
