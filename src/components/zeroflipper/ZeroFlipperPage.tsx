import { useState, useMemo } from 'react';
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
  Video,
  Database,
  BookOpen,
  Layout,
  Users,
  ArrowUpRight,
  Eye,
  Heart,
  Filter,
  X,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CategoryId =
  | 'all'
  | 'ai-agents'
  | 'saas'
  | 'websites'
  | 'mobile-apps'
  | 'apis'
  | 'ui-kits'
  | 'dashboards'
  | 'crm'
  | 'erp'
  | 'business-systems'
  | 'legal-docs'
  | 'marketing'
  | 'design'
  | '3d-models'
  | 'audio'
  | 'video'
  | 'automation'
  | 'data-sets'
  | 'research'
  | 'educational';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  seller: string;
  sellerAvatar: string;
  category: CategoryId;
  type: 'Template' | 'Asset' | 'SaaS' | 'System' | 'Pack';
  gradient: string;
  icon: React.ReactNode;
  sales: number;
  isFeatured?: boolean;
  isTrending?: boolean;
  isNew?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: { id: CategoryId; label: string; icon: React.ReactNode }[] = [
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
  { id: 'design', label: 'Design Assets', icon: <Palette size={14} /> },
  { id: '3d-models', label: '3D Models', icon: <Box size={14} /> },
  { id: 'audio', label: 'Audio', icon: <Music size={14} /> },
  { id: 'video', label: 'Video', icon: <Video size={14} /> },
  { id: 'automation', label: 'Automation', icon: <Zap size={14} /> },
  { id: 'data-sets', label: 'Data Sets', icon: <Database size={14} /> },
  { id: 'research', label: 'Research', icon: <BookOpen size={14} /> },
  { id: 'educational', label: 'Educational', icon: <BookOpen size={14} /> },
];

const TYPE_COLORS: Record<Product['type'], string> = {
  Template: 'var(--accent-blue)',
  Asset: 'var(--accent-purple)',
  SaaS: 'var(--accent-green)',
  System: 'var(--accent-red)',
  Pack: 'var(--accent-yellow)',
};

const PRODUCTS: Product[] = [
  {
    id: 'zf001',
    name: 'GPT-4 Chat Agent Builder',
    description: 'Build custom AI chat agents with no-code drag-and-drop interface. Supports multi-turn conversations.',
    price: 149.99,
    originalPrice: 199.99,
    rating: 4.9,
    reviewCount: 342,
    seller: 'NeuralForge',
    sellerAvatar: 'NF',
    category: 'ai-agents',
    type: 'Template',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    icon: <Zap size={24} />,
    sales: 1247,
    isFeatured: true,
    isTrending: true,
  },
  {
    id: 'zf002',
    name: 'SaaS Analytics Dashboard',
    description: 'Complete analytics dashboard with real-time metrics, cohort analysis, and revenue tracking.',
    price: 89.00,
    rating: 4.7,
    reviewCount: 189,
    seller: 'DataViz Studio',
    sellerAvatar: 'DV',
    category: 'dashboards',
    type: 'Template',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    icon: <BarChart3 size={24} />,
    sales: 892,
    isFeatured: true,
  },
  {
    id: 'zf003',
    name: 'React Native E-Commerce Kit',
    description: 'Full-featured mobile e-commerce starter with payments, cart, and product management.',
    price: 299.00,
    originalPrice: 399.00,
    rating: 4.8,
    reviewCount: 276,
    seller: 'MobileCraft',
    sellerAvatar: 'MC',
    category: 'mobile-apps',
    type: 'Template',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    icon: <Smartphone size={24} />,
    sales: 2103,
    isFeatured: true,
    isTrending: true,
  },
  {
    id: 'zf004',
    name: 'REST API Starter Framework',
    description: 'Production-ready API framework with authentication, rate limiting, and auto-documentation.',
    price: 49.99,
    rating: 4.6,
    reviewCount: 154,
    seller: 'BackendPro',
    sellerAvatar: 'BP',
    category: 'apis',
    type: 'Template',
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    icon: <Code size={24} />,
    sales: 678,
  },
  {
    id: 'zf005',
    name: 'Enterprise CRM System',
    description: 'Full CRM with lead management, pipeline tracking, email integration, and reporting.',
    price: 499.00,
    rating: 4.9,
    reviewCount: 89,
    seller: 'BusinessFlow',
    sellerAvatar: 'BF',
    category: 'crm',
    type: 'System',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    icon: <Users size={24} />,
    sales: 312,
    isFeatured: true,
  },
  {
    id: 'zf006',
    name: 'UI Component Library Pro',
    description: '200+ React components with dark mode, accessibility, and Figma design files included.',
    price: 79.00,
    rating: 4.8,
    reviewCount: 421,
    seller: 'DesignSystem Co',
    sellerAvatar: 'DS',
    category: 'ui-kits',
    type: 'Asset',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    icon: <Palette size={24} />,
    sales: 3456,
    isTrending: true,
  },
  {
    id: 'zf007',
    name: 'AI Content Writer Agent',
    description: 'Automated content generation agent for blogs, social media, and email campaigns.',
    price: 59.99,
    rating: 4.5,
    reviewCount: 267,
    seller: 'ContentAI',
    sellerAvatar: 'CA',
    category: 'ai-agents',
    type: 'SaaS',
    gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
    icon: <FileText size={24} />,
    sales: 1892,
    isTrending: true,
  },
  {
    id: 'zf008',
    name: 'ERP Operations Suite',
    description: 'Complete ERP solution with inventory, procurement, HR, and financial modules.',
    price: 449.00,
    originalPrice: 599.00,
    rating: 4.7,
    reviewCount: 67,
    seller: 'Enterprise Solutions',
    sellerAvatar: 'ES',
    category: 'erp',
    type: 'System',
    gradient: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
    icon: <Database size={24} />,
    sales: 198,
    isFeatured: true,
  },
  {
    id: 'zf009',
    name: 'Legal Contract Templates',
    description: '50+ legally-reviewed contract templates for SaaS, consulting, and freelance work.',
    price: 39.99,
    rating: 4.4,
    reviewCount: 156,
    seller: 'LegalDraft',
    sellerAvatar: 'LD',
    category: 'legal-docs',
    type: 'Pack',
    gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
    icon: <FileText size={24} />,
    sales: 2847,
  },
  {
    id: 'zf010',
    name: 'Marketing Campaign Kit',
    description: 'Complete marketing toolkit with email templates, ad creatives, and social media assets.',
    price: 29.99,
    rating: 4.6,
    reviewCount: 312,
    seller: 'GrowthHive',
    sellerAvatar: 'GH',
    category: 'marketing',
    type: 'Pack',
    gradient: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)',
    icon: <TrendingUp size={24} />,
    sales: 4123,
    isTrending: true,
  },
  {
    id: 'zf011',
    name: 'Next.js SaaS Boilerplate',
    description: 'Production-ready SaaS starter with auth, billing, and admin dashboard.',
    price: 199.00,
    rating: 4.9,
    reviewCount: 523,
    seller: 'ShipFast',
    sellerAvatar: 'SF',
    category: 'saas',
    type: 'Template',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    icon: <Globe size={24} />,
    sales: 5678,
    isFeatured: true,
    isTrending: true,
  },
  {
    id: 'zf012',
    name: '3D Product Configurator',
    description: 'Interactive 3D product viewer and configurator for e-commerce websites.',
    price: 179.00,
    rating: 4.7,
    reviewCount: 98,
    seller: 'ThreeJS Studio',
    sellerAvatar: 'TJ',
    category: '3d-models',
    type: 'Asset',
    gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    icon: <Box size={24} />,
    sales: 445,
    isNew: true,
  },
  {
    id: 'zf013',
    name: 'Podcast Production Pack',
    description: 'Intro/outro music, sound effects, and editing templates for podcast production.',
    price: 24.99,
    rating: 4.5,
    reviewCount: 187,
    seller: 'AudioCraft',
    sellerAvatar: 'AC',
    category: 'audio',
    type: 'Pack',
    gradient: 'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)',
    icon: <Music size={24} />,
    sales: 1567,
  },
  {
    id: 'zf014',
    name: 'Video Intro Maker Pro',
    description: '50+ animated video intro templates with custom branding and export options.',
    price: 44.99,
    rating: 4.6,
    reviewCount: 234,
    seller: 'MotionLab',
    sellerAvatar: 'ML',
    category: 'video',
    type: 'Asset',
    gradient: 'linear-gradient(135deg, #c3cfe2 0%, #f5f7fa 100%)',
    icon: <Video size={24} />,
    sales: 2891,
  },
  {
    id: 'zf015',
    name: 'Workflow Automation Suite',
    description: 'No-code automation platform with 200+ pre-built workflow templates.',
    price: 129.00,
    originalPrice: 169.00,
    rating: 4.8,
    reviewCount: 156,
    seller: 'AutoFlow',
    sellerAvatar: 'AF',
    category: 'automation',
    type: 'System',
    gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    icon: <Zap size={24} />,
    sales: 1234,
    isFeatured: true,
  },
  {
    id: 'zf016',
    name: 'ML Training Dataset Bundle',
    description: 'Curated datasets for NLP, computer vision, and time-series forecasting models.',
    price: 89.99,
    rating: 4.4,
    reviewCount: 78,
    seller: 'DataPool',
    sellerAvatar: 'DP',
    category: 'data-sets',
    type: 'Pack',
    gradient: 'linear-gradient(135deg, #f5576c 0%, #ff6f91 100%)',
    icon: <Database size={24} />,
    sales: 567,
    isNew: true,
  },
  {
    id: 'zf017',
    name: 'Market Research Report Pack',
    description: 'Industry analysis reports for SaaS, fintech, and e-commerce sectors.',
    price: 59.99,
    rating: 4.3,
    reviewCount: 45,
    seller: 'InsightLab',
    sellerAvatar: 'IL',
    category: 'research',
    type: 'Pack',
    gradient: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
    icon: <BookOpen size={24} />,
    sales: 234,
  },
  {
    id: 'zf018',
    name: 'Online Course Builder',
    description: 'Complete platform for creating and selling online courses with quizzes and certificates.',
    price: 249.00,
    rating: 4.7,
    reviewCount: 123,
    seller: 'EduTech Pro',
    sellerAvatar: 'EP',
    category: 'educational',
    type: 'System',
    gradient: 'linear-gradient(135deg, #f77062 0%, #fe5196 100%)',
    icon: <BookOpen size={24} />,
    sales: 678,
    isFeatured: true,
  },
  {
    id: 'zf019',
    name: 'Brand Identity Kit',
    description: 'Logo templates, color palettes, typography guides, and brand guidelines.',
    price: 34.99,
    rating: 4.8,
    reviewCount: 567,
    seller: 'BrandForge',
    sellerAvatar: 'BR',
    category: 'design',
    type: 'Asset',
    gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
    icon: <Palette size={24} />,
    sales: 4567,
    isTrending: true,
  },
  {
    id: 'zf020',
    name: 'Customer Support Bot',
    description: 'AI-powered customer support agent with ticket management and knowledge base.',
    price: 79.99,
    rating: 4.6,
    reviewCount: 189,
    seller: 'SupportAI',
    sellerAvatar: 'SA',
    category: 'ai-agents',
    type: 'SaaS',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    icon: <Users size={24} />,
    sales: 1567,
  },
  {
    id: 'zf021',
    name: 'Landing Page Templates',
    description: '20 high-converting landing page templates with A/B testing built in.',
    price: 49.99,
    originalPrice: 79.99,
    rating: 4.7,
    reviewCount: 345,
    seller: 'PageCraft',
    sellerAvatar: 'PC',
    category: 'websites',
    type: 'Template',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    icon: <Globe size={24} />,
    sales: 3456,
    isTrending: true,
  },
  {
    id: 'zf022',
    name: 'Business Intelligence Suite',
    description: 'Advanced BI tools with data visualization, forecasting, and executive dashboards.',
    price: 399.00,
    rating: 4.8,
    reviewCount: 67,
    seller: 'AnalyticsPro',
    sellerAvatar: 'AP',
    category: 'business-systems',
    type: 'System',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    icon: <BarChart3 size={24} />,
    sales: 234,
    isNew: true,
  },
  {
    id: 'zf023',
    name: 'Social Media Asset Pack',
    description: '500+ social media templates for Instagram, Twitter, LinkedIn, and TikTok.',
    price: 19.99,
    rating: 4.5,
    reviewCount: 678,
    seller: 'SocialKit',
    sellerAvatar: 'SK',
    category: 'marketing',
    type: 'Pack',
    gradient: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)',
    icon: <Heart size={24} />,
    sales: 8912,
    isTrending: true,
  },
  {
    id: 'zf024',
    name: 'Flutter UI Kit Pro',
    description: '150+ Flutter widgets with Material Design 3 and custom theming support.',
    price: 69.99,
    rating: 4.6,
    reviewCount: 234,
    seller: 'FlutterDev',
    sellerAvatar: 'FD',
    category: 'ui-kits',
    type: 'Asset',
    gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
    icon: <Smartphone size={24} />,
    sales: 1890,
  },
  {
    id: 'zf025',
    name: 'Email Marketing Automation',
    description: 'Automated email sequences with segmentation, A/B testing, and analytics.',
    price: 99.00,
    rating: 4.7,
    reviewCount: 156,
    seller: 'MailFlow',
    sellerAvatar: 'MF',
    category: 'automation',
    type: 'SaaS',
    gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    icon: <Zap size={24} />,
    sales: 2345,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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
  cardTypeBadge: (type: Product['type']): React.CSSProperties => ({
    position: 'absolute' as const,
    top: 12,
    left: 12,
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    background: 'rgba(0,0,0,0.6)',
    color: TYPE_COLORS[type],
    backdropFilter: 'blur(4px)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  }),
  cardBadges: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    display: 'flex',
    gap: 6,
  } as React.CSSProperties,
  badge: (color: string): React.CSSProperties => ({
    padding: '3px 8px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    background: color,
    color: '#fff',
    textTransform: 'uppercase' as const,
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
  originalPrice: {
    fontSize: 13,
    color: 'var(--text-muted)',
    textDecoration: 'line-through',
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
  reviewCount: {
    color: 'var(--text-muted)',
    fontSize: 11,
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
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false);

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
      <div style={styles.cardThumbnail(product.gradient)}>
        <div style={{ color: 'rgba(255,255,255,0.9)', transform: 'scale(2)' }}>
          {product.icon}
        </div>
        <div style={styles.cardTypeBadge(product.type)}>
          {product.type}
        </div>
        <div style={styles.cardBadges}>
          {product.isNew && <span style={styles.badge('var(--accent-green)')}>New</span>}
          {product.isTrending && <span style={styles.badge('var(--accent-red)')}>🔥 Trending</span>}
          {product.originalPrice && (
            <span style={styles.badge('var(--accent-yellow)')}>
              -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </span>
          )}
        </div>
      </div>

      <div style={styles.cardBody}>
        <div style={styles.cardName}>{product.name}</div>
        <div style={styles.cardDescription}>{product.description}</div>

        <div style={styles.cardSeller}>
          <div style={styles.sellerAvatar}>{product.sellerAvatar}</div>
          <span style={styles.sellerName}>{product.seller}</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
            {formatSales(product.sales)} sales
          </span>
        </div>

        <div style={styles.cardFooter}>
          <div style={styles.priceContainer}>
            <span style={styles.price}>{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span style={styles.originalPrice}>{formatPrice(product.originalPrice)}</span>
            )}
          </div>
          <div style={styles.rating}>
            <span style={styles.stars}>{renderStars(product.rating)}</span>
            <span style={styles.reviewCount}>({product.reviewCount})</span>
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

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ZeroFlipperPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [showAllCategories, setShowAllCategories] = useState(false);

  const filteredProducts = useMemo(() => {
    let result = PRODUCTS;

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
  }, [search, activeCategory]);

  const featuredProducts = useMemo(() => PRODUCTS.filter((p) => p.isFeatured), []);
  const trendingProducts = useMemo(() => PRODUCTS.filter((p) => p.isTrending), []);

  const visibleCategories = showAllCategories ? CATEGORIES : CATEGORIES.slice(0, 12);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={styles.header}
        >
          <h1 style={styles.title}>ZEROFLIPPER</h1>
          <p style={styles.subtitle}>Digital Marketplace — 5,000+ Products</p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={styles.statsBar}
        >
          <div style={styles.statItem}>
            <div style={styles.statValue}>5,247</div>
            <div style={styles.statLabel}>Products</div>
          </div>
          <div style={styles.statItem}>
            <div style={{ ...styles.statValue, color: 'var(--accent-green)' }}>1,892</div>
            <div style={styles.statLabel}>Creators</div>
          </div>
          <div style={styles.statItem}>
            <div style={{ ...styles.statValue, color: 'var(--accent-purple)' }}>128k+</div>
            <div style={styles.statLabel}>Sales</div>
          </div>
          <div style={styles.statItem}>
            <div style={{ ...styles.statValue, color: 'var(--accent-yellow)' }}>4.8</div>
            <div style={styles.statLabel}>Avg Rating</div>
          </div>
        </motion.div>

        {/* Search Bar */}
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
            placeholder="Search 5,000+ products, templates, assets, and more..."
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

        {/* Category Tabs */}
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

        {/* Featured Products Banner */}
        {activeCategory === 'all' && !search && (
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

        {/* Featured Products */}
        {activeCategory === 'all' && !search && (
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

        {/* Trending Products */}
        {activeCategory === 'all' && !search && (
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

        {/* All Products / Filtered Results */}
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
              <h3 style={{ fontSize: 18, marginBottom: 8, color: 'var(--text-primary)' }}>No products found</h3>
              <p style={{ fontSize: 14 }}>Try adjusting your search or category filter</p>
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
