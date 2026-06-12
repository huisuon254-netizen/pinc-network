import { useState, useEffect, useCallback, useMemo, useRef, type FormEvent } from "react";
import { invoke } from "@tauri-apps/api/core";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MarketplaceCategory =
  | "all"
  | "digital_goods"
  | "physical_goods"
  | "services"
  | "subscriptions"
  | "gift_cards"
  | "other";

const CATEGORY_LABELS: Record<MarketplaceCategory, string> = {
  all: "All Categories",
  digital_goods: "Digital Goods",
  physical_goods: "Physical Goods",
  services: "Services",
  subscriptions: "Subscriptions",
  gift_cards: "Gift Cards",
  other: "Other",
};

const CATEGORY_OPTIONS: MarketplaceCategory[] = [
  "digital_goods",
  "physical_goods",
  "services",
  "subscriptions",
  "gift_cards",
  "other",
];

interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: MarketplaceCategory;
  image_url: string;
  seller_address: string;
  seller_name: string;
  created_at: string;
  stock: number;
  sold: number;
  rating: number;
  rating_count: number;
  is_active: boolean;
  tags: string[];
}

interface MarketplaceStats {
  total_listings: number;
  total_sales: number;
  total_volume: number;
  active_sellers: number;
}

interface WalletBalance {
  balance: number;
  currency: string;
}

interface ViewMode {
  type: "browse" | "detail" | "create" | "my_listings" | "purchased";
  listingId?: string;
}

// ---------------------------------------------------------------------------
// Mock data — used when Tauri backend commands are unavailable
// ---------------------------------------------------------------------------

const MOCK_SELLER = "pin_user_self_001";

const MOCK_LISTINGS: MarketplaceListing[] = [
  {
    id: "lst_001",
    title: "Premium VPN Access — 1 Year",
    description:
      "High-speed VPN service with unlimited bandwidth, no-logs policy, and servers in 40+ countries. Includes ad-blocking and malware protection. Instant activation after purchase.",
    price: 29.99,
    category: "subscriptions",
    image_url: "",
    seller_address: "pin_seller_a1b2c3",
    seller_name: "SecureNet",
    created_at: "2026-06-01T10:30:00Z",
    stock: 999,
    sold: 142,
    rating: 4.7,
    rating_count: 89,
    is_active: true,
    tags: ["vpn", "privacy", "security"],
  },
  {
    id: "lst_002",
    title: "Custom Logo Design Package",
    description:
      "Professional logo design including 3 initial concepts, 2 rounds of revisions, and final files in SVG, PNG, and PDF formats. 48-hour turnaround time.",
    price: 49.0,
    category: "services",
    image_url: "",
    seller_address: "pin_seller_d4e5f6",
    seller_name: "DesignHub",
    created_at: "2026-06-03T14:00:00Z",
    stock: 10,
    sold: 27,
    rating: 4.9,
    rating_count: 34,
    is_active: true,
    tags: ["design", "logo", "branding"],
  },
  {
    id: "lst_003",
    title: "E-Book: Mastering Decentralized Finance",
    description:
      "Comprehensive 320-page guide covering DeFi protocols, yield farming, liquidity pools, and risk management strategies. PDF and EPUB included.",
    price: 12.5,
    category: "digital_goods",
    image_url: "",
    seller_address: "pin_seller_g7h8i9",
    seller_name: "CryptoLibrary",
    created_at: "2026-05-20T08:15:00Z",
    stock: 9999,
    sold: 563,
    rating: 4.5,
    rating_count: 201,
    is_active: true,
    tags: ["ebook", "defi", "crypto", "finance"],
  },
  {
    id: "lst_004",
    title: "Limited Edition PINC Engraved Sticker Pack",
    description:
      "Set of 6 high-quality vinyl stickers featuring iconic PINC branding. Waterproof, UV-resistant, and perfect for laptops, water bottles, or notebooks. Free shipping.",
    price: 8.0,
    category: "physical_goods",
    image_url: "",
    seller_address: MOCK_SELLER,
    seller_name: "PINC Store",
    created_at: "2026-06-05T12:00:00Z",
    stock: 150,
    sold: 43,
    rating: 4.8,
    rating_count: 52,
    is_active: true,
    tags: ["stickers", "merch", "pinc"],
  },
  {
    id: "lst_005",
    title: "Gift Card — $25 Digital Store Credit",
    description:
      "Redeemable for any item in the marketplace. No expiration date. Transferred directly to your wallet upon purchase.",
    price: 25.0,
    category: "gift_cards",
    image_url: "",
    seller_address: "pin_seller_j0k1l2",
    seller_name: "GiftVault",
    created_at: "2026-06-10T09:45:00Z",
    stock: 200,
    sold: 88,
    rating: 4.6,
    rating_count: 110,
    is_active: true,
    tags: ["gift", "credit", "store"],
  },
  {
    id: "lst_006",
    title: "Smart Contract Audit Service",
    description:
      "Professional audit of your Solidity smart contracts. Includes vulnerability assessment, gas optimization suggestions, and a detailed PDF report. 5-day turnaround.",
    price: 199.0,
    category: "services",
    image_url: "",
    seller_address: "pin_seller_m3n4o5",
    seller_name: "AuditPro",
    created_at: "2026-05-28T16:20:00Z",
    stock: 5,
    sold: 12,
    rating: 5.0,
    rating_count: 12,
    is_active: true,
    tags: ["audit", "smart-contract", "security", "solidity"],
  },
  {
    id: "lst_007",
    title: "PINC Hoodie — Midnight Edition",
    description:
      "Premium cotton-blend hoodie with embroidered PINC logo. Available in sizes S–XXL. Unisex fit. Machine washable.",
    price: 45.0,
    category: "physical_goods",
    image_url: "",
    seller_address: MOCK_SELLER,
    seller_name: "PINC Store",
    created_at: "2026-06-08T11:00:00Z",
    stock: 75,
    sold: 19,
    rating: 4.4,
    rating_count: 22,
    is_active: true,
    tags: ["clothing", "merch", "pinc", "hoodie"],
  },
  {
    id: "lst_008",
    title: "Decentralized Cloud Storage — 500GB / 1 Year",
    description:
      "Encrypted, peer-to-peer cloud storage with 99.9% uptime guarantee. Supports file versioning, sharing links, and auto-backup.",
    price: 35.0,
    category: "subscriptions",
    image_url: "",
    seller_address: "pin_seller_p6q7r8",
    seller_name: "CloudP2P",
    created_at: "2026-06-02T07:30:00Z",
    stock: 500,
    sold: 214,
    rating: 4.3,
    rating_count: 156,
    is_active: true,
    tags: ["cloud", "storage", "encrypted"],
  },
];

const MOCK_STATS: MarketplaceStats = {
  total_listings: MOCK_LISTINGS.length,
  total_sales: MOCK_LISTINGS.reduce((sum, l) => sum + l.sold, 0),
  total_volume: MOCK_LISTINGS.reduce((sum, l) => sum + l.price * l.sold, 0),
  active_sellers: new Set(MOCK_LISTINGS.map((l) => l.seller_address)).size,
};

const MOCK_WALLET: WalletBalance = { balance: 500.0, currency: "PINC" };

// ---------------------------------------------------------------------------
// Tauri invoke wrappers with graceful fallback to mock data
// ---------------------------------------------------------------------------

async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(cmd, args);
  } catch {
    throw new Error(`TAURI_UNAVAILABLE: ${cmd}`);
  }
}

function isTauriUnavailable(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith("TAURI_UNAVAILABLE");
}

async function fetchStats(): Promise<MarketplaceStats> {
  try {
    return await tauriInvoke<MarketplaceStats>("get_marketplace_stats");
  } catch (err) {
    if (isTauriUnavailable(err)) return MOCK_STATS;
    throw err;
  }
}

async function fetchListings(): Promise<MarketplaceListing[]> {
  try {
    return await tauriInvoke<MarketplaceListing[]>("get_marketplace_listings");
  } catch (err) {
    if (isTauriUnavailable(err)) return MOCK_LISTINGS;
    throw err;
  }
}

async function createListing(
  listing: Omit<MarketplaceListing, "id" | "created_at" | "sold" | "rating" | "rating_count" | "is_active">
): Promise<MarketplaceListing> {
  try {
    return await tauriInvoke<MarketplaceListing>("create_marketplace_listing", { listing });
  } catch (err) {
    if (isTauriUnavailable(err)) {
      const newListing: MarketplaceListing = {
        ...listing,
        id: `lst_${Date.now()}`,
        created_at: new Date().toISOString(),
        sold: 0,
        rating: 0,
        rating_count: 0,
        is_active: true,
      };
      MOCK_LISTINGS.unshift(newListing);
      return newListing;
    }
    throw err;
  }
}

async function purchaseListing(
  listingId: string,
  quantity: number
): Promise<{ success: boolean; message: string }> {
  try {
    return await tauriInvoke<{ success: boolean; message: string }>("purchase_marketplace_listing", {
      listingId,
      quantity,
    });
  } catch (err) {
    if (isTauriUnavailable(err)) {
      const listing = MOCK_LISTINGS.find((l) => l.id === listingId);
      if (!listing) return { success: false, message: "Listing not found." };
      if (listing.seller_address === MOCK_SELLER) {
        return { success: false, message: "You cannot buy your own listing." };
      }
      if (listing.stock < quantity) {
        return { success: false, message: "Insufficient stock." };
      }
      const total = listing.price * quantity;
      if (MOCK_WALLET.balance < total) {
        return { success: false, message: "Insufficient wallet balance." };
      }
      MOCK_WALLET.balance -= total;
      listing.stock -= quantity;
      listing.sold += quantity;
      return { success: true, message: `Successfully purchased ${quantity}x "${listing.title}".` };
    }
    throw err;
  }
}

async function deleteListing(listingId: string): Promise<{ success: boolean }> {
  try {
    return await tauriInvoke<{ success: boolean }>("delete_marketplace_listing", { listingId });
  } catch (err) {
    if (isTauriUnavailable(err)) {
      const idx = MOCK_LISTINGS.findIndex((l) => l.id === listingId);
      if (idx !== -1) MOCK_LISTINGS.splice(idx, 1);
      return { success: true };
    }
    throw err;
  }
}

async function fetchWallet(): Promise<WalletBalance> {
  try {
    return await tauriInvoke<WalletBalance>("get_wallet_balance");
  } catch (err) {
    if (isTauriUnavailable(err)) return MOCK_WALLET;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function formatPINC(value: number): string {
  return `${value.toFixed(2)} PINC`;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}mo ago`;
}

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-zinc-800/60 px-4 py-3 border border-zinc-700/50">
      <span className="text-2xl font-bold text-emerald-400">{value}</span>
      <span className="mt-1 text-xs text-zinc-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function ListingCard({
  listing,
  onClick,
}: {
  listing: MarketplaceListing;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col rounded-xl bg-zinc-800/50 border border-zinc-700/40 overflow-hidden
                 hover:border-emerald-500/50 hover:bg-zinc-800/80 transition-all duration-200 text-left w-full"
    >
      <div className="relative h-40 bg-zinc-900 flex items-center justify-center overflow-hidden">
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-zinc-600">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <span className="text-[10px] uppercase tracking-widest">No Image</span>
          </div>
        )}
        <span className="absolute top-2 right-2 rounded-full bg-zinc-900/80 px-2 py-0.5 text-[10px] font-medium text-zinc-300 border border-zinc-700/60">
          {CATEGORY_LABELS[listing.category] ?? listing.category}
        </span>
        {listing.seller_address === MOCK_SELLER && (
          <span className="absolute top-2 left-2 rounded-full bg-emerald-600/80 px-2 py-0.5 text-[10px] font-medium text-white">
            YOUR LISTING
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 p-3 flex-1">
        <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2 group-hover:text-emerald-400 transition-colors">
          {listing.title}
        </h3>
        <p className="text-xs text-zinc-500 line-clamp-2 flex-1">{listing.description}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm font-bold text-emerald-400">{formatPINC(listing.price)}</span>
          <span className="text-[10px] text-zinc-500">{listing.sold} sold</span>
        </div>
        {listing.rating > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-yellow-500">
            <span>{renderStars(listing.rating)}</span>
            <span className="text-zinc-500">({listing.rating_count})</span>
          </div>
        )}
      </div>
    </button>
  );
}

function CreateListingForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<MarketplaceCategory>("digital_goods");
  const [stock, setStock] = useState("1");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const imageFileRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Price must be a positive number.");
      return;
    }
    if (isNaN(stockNum) || stockNum < 1) {
      setError("Stock must be at least 1.");
      return;
    }

    setSubmitting(true);
    try {
      await createListing({
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        category,
        image_url: imagePreview || imageUrl.trim(),
        seller_address: MOCK_SELLER,
        seller_name: "You",
        stock: stockNum,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400
                     hover:text-zinc-200 hover:border-zinc-600 transition-colors"
        >
          ← Back
        </button>
        <h2 className="text-xl font-bold text-zinc-100">Create New Listing</h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-6"
      >
        {/* Title */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Title <span className="text-red-400">*</span>
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Enter listing title"
            className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100
                       placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </label>

        {/* Description */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Description <span className="text-red-400">*</span>
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={5}
            placeholder="Describe what you're selling..."
            className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100
                       placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
          />
          <span className="text-[10px] text-zinc-600 text-right">{description.length}/2000</span>
        </label>

        {/* Price + Stock row */}
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Price (PINC) <span className="text-red-400">*</span>
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100
                         placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Stock <span className="text-red-400">*</span>
            </span>
            <input
              type="number"
              step="1"
              min="1"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="1"
              className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100
                         placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </label>
        </div>

        {/* Category */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Category <span className="text-red-400">*</span>
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as MarketplaceCategory)}
            className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100
                       focus:outline-none focus:border-emerald-500 transition-colors"
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </label>

        {/* Image upload */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Image</span>
          <div className="flex gap-3 items-start">
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreview(null);
                  }}
                  placeholder="Or paste image URL"
                  className="flex-1 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100
                             placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => imageFileRef.current?.click()}
                  className="rounded-lg bg-zinc-700 border border-zinc-600 px-3 py-2 text-xs text-zinc-300
                             hover:bg-zinc-600 transition-colors whitespace-nowrap"
                >
                  Browse...
                </button>
                <input
                  ref={imageFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>
              <p className="text-[10px] text-zinc-600">Supports JPG, PNG, WebP up to 5 MB.</p>
            </div>
            {(imagePreview || imageUrl) && (
              <div className="w-20 h-20 rounded-lg border border-zinc-700 overflow-hidden bg-zinc-900 flex-shrink-0">
                <img
                  src={imagePreview || imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        </label>

        {/* Tags */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Tags (comma-separated)
          </span>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. crypto, vpn, digital"
            className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100
                       placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </label>

        {error && (
          <div className="rounded-lg bg-red-900/30 border border-red-700/50 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white
                       hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Creating..." : "Publish Listing"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400
                       hover:text-zinc-200 hover:border-zinc-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function ProductDetailView({
  listing,
  onBack,
  onPurchased,
}: {
  listing: MarketplaceListing;
  onBack: () => void;
  onPurchased: () => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const isOwn = listing.seller_address === MOCK_SELLER;
  const total = listing.price * quantity;

  async function handleBuy() {
    setBuying(true);
    setMessage(null);
    try {
      const result = await purchaseListing(listing.id, quantity);
      if (result.success) {
        setMessage({ type: "success", text: result.message });
        setTimeout(() => onPurchased(), 1500);
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Purchase failed." });
    } finally {
      setBuying(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400
                   hover:text-zinc-200 hover:border-zinc-600 transition-colors"
      >
        ← Back to listings
      </button>

      <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 overflow-hidden">
        {/* Image area */}
        <div className="h-64 bg-zinc-900 flex items-center justify-center">
          {listing.image_url ? (
            <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-600">
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <span className="text-xs uppercase tracking-widest">No Image</span>
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded-full bg-zinc-700/60 px-2 py-0.5 text-[10px] text-zinc-300 border border-zinc-600/50">
                  {CATEGORY_LABELS[listing.category]}
                </span>
                <span className="text-[10px] text-zinc-500">{timeAgo(listing.created_at)}</span>
              </div>
              <h1 className="text-2xl font-bold text-zinc-100">{listing.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <span>
              Seller: <span className="text-zinc-200 font-medium">{listing.seller_name}</span>
            </span>
            {listing.rating > 0 && (
              <span className="text-yellow-500">
                {renderStars(listing.rating)} <span className="text-zinc-500">({listing.rating_count})</span>
              </span>
            )}
            <span>{listing.sold} sold</span>
          </div>

          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{listing.description}</p>

          {listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {listing.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-zinc-700/50 px-2.5 py-0.5 text-[10px] text-zinc-400 border border-zinc-600/40"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="border-t border-zinc-700/50 pt-4 mt-2">
            {isOwn ? (
              <div className="rounded-lg bg-zinc-700/30 px-4 py-3 text-sm text-zinc-400 text-center">
                This is your listing.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Price</span>
                    <p className="text-xl font-bold text-emerald-400">{formatPINC(listing.price)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Stock</span>
                    <p className="text-lg font-semibold text-zinc-200">{listing.stock}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Qty</span>
                    <div className="flex items-center rounded-lg border border-zinc-700 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-700 transition-colors"
                      >
                        −
                      </button>
                      <span className="px-3 py-1.5 text-sm text-zinc-100 min-w-[40px] text-center border-x border-zinc-700">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.min(listing.stock, q + 1))}
                        className="px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-700 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-sm text-zinc-400">
                    Total: <span className="text-lg font-bold text-emerald-400">{formatPINC(total)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleBuy}
                    disabled={buying || listing.stock === 0}
                    className="flex-1 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white
                               hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {buying ? "Processing..." : listing.stock === 0 ? "Out of Stock" : "Buy Now"}
                  </button>
                </div>
              </div>
            )}

            {message && (
              <div
                className={`mt-3 rounded-lg px-4 py-2 text-sm ${
                  message.type === "success"
                    ? "bg-emerald-900/30 border border-emerald-700/50 text-emerald-400"
                    : "bg-red-900/30 border border-red-700/50 text-red-400"
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MyListingsView({
  listings,
  onRefresh,
  onViewListing,
}: {
  listings: MarketplaceListing[];
  onRefresh: () => void;
  onViewListing: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await deleteListing(id);
      onRefresh();
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-zinc-100 mb-4">My Listings</h2>
      {listings.length === 0 ? (
        <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-12 text-center">
          <p className="text-zinc-500 text-sm">You have no listings yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex flex-col rounded-xl bg-zinc-800/50 border border-zinc-700/40 overflow-hidden"
            >
              <div
                className="h-32 bg-zinc-900 flex items-center justify-center cursor-pointer"
                onClick={() => onViewListing(listing.id)}
              >
                {listing.image_url ? (
                  <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                )}
              </div>
              <div className="p-3 flex flex-col gap-2 flex-1">
                <h3 className="text-sm font-semibold text-zinc-100 line-clamp-1">{listing.title}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-emerald-400">{formatPINC(listing.price)}</span>
                  <span className="text-[10px] text-zinc-500">{listing.sold} sold</span>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  <span className={listing.is_active ? "text-emerald-400" : "text-zinc-500"}>
                    {listing.is_active ? "● Active" : "● Inactive"}
                  </span>
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => onViewListing(listing.id)}
                    className="flex-1 rounded-lg bg-zinc-700 px-2 py-1.5 text-[10px] text-zinc-300
                               hover:bg-zinc-600 transition-colors"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(listing.id)}
                    disabled={deleting === listing.id}
                    className="rounded-lg bg-red-900/40 border border-red-700/40 px-2 py-1.5 text-[10px] text-red-400
                               hover:bg-red-900/60 disabled:opacity-50 transition-colors"
                  >
                    {deleting === listing.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MarketplacePage() {
  const [view, setView] = useState<ViewMode>({ type: "browse" });
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [wallet, setWallet] = useState<WalletBalance>(MOCK_WALLET);
  const [loading, setLoading] = useState(true);

  // Search & filters
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<MarketplaceCategory>("all");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "popular" | "rating">(
    "newest"
  );
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [l, s, w] = await Promise.all([fetchListings(), fetchStats(), fetchWallet()]);
      setListings(l);
      setStats(s);
      setWallet(w);
    } catch {
      // use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered + sorted listings
  const displayedListings = useMemo(() => {
    let result = listings.filter((l) => l.is_active);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.tags.some((t) => t.toLowerCase().includes(q)) ||
          l.seller_name.toLowerCase().includes(q)
      );
    }

    // Category
    if (filterCategory !== "all") {
      result = result.filter((l) => l.category === filterCategory);
    }

    // Price range
    const minP = parseFloat(priceMin);
    const maxP = parseFloat(priceMax);
    if (!isNaN(minP)) result = result.filter((l) => l.price >= minP);
    if (!isNaN(maxP)) result = result.filter((l) => l.price <= maxP);

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "price_asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        result.sort((a, b) => b.sold - a.sold);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
    }

    return result;
  }, [listings, search, filterCategory, sortBy, priceMin, priceMax]);

  const myListings = useMemo(() => listings.filter((l) => l.seller_address === MOCK_SELLER), [listings]);

  const selectedListing =
    view.type === "detail" && view.listingId ? listings.find((l) => l.id === view.listingId) : null;

  // ---- RENDER ----

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              <span className="text-emerald-400">PINC</span> Marketplace
            </h1>
            <p className="text-sm text-zinc-500 mt-1">Buy and sell with the PINC community</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-1.5 text-xs text-zinc-400">
              Wallet: <span className="text-emerald-400 font-bold">{formatPINC(wallet.balance)}</span>
            </div>
            <button
              type="button"
              onClick={() => setView({ type: "create" })}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white
                         hover:bg-emerald-500 transition-colors"
            >
              + New Listing
            </button>
          </div>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Listings" value={String(stats.total_listings)} />
            <StatCard label="Total Sales" value={String(stats.total_sales)} />
            <StatCard label="Volume" value={formatPINC(stats.total_volume)} />
            <StatCard label="Sellers" value={String(stats.active_sellers)} />
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex items-center gap-1 mb-5 border-b border-zinc-800 pb-px">
          {(
            [
              { key: "browse", label: "Browse" },
              { key: "my_listings", label: `My Listings (${myListings.length})` },
              { key: "purchased", label: "Purchased" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setView({ type: tab.key as ViewMode["type"] })}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px ${
                view.type === tab.key || (tab.key === "browse" && view.type === "detail")
                  ? "text-emerald-400 border-b-2 border-emerald-400 bg-zinc-800/30"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-zinc-500">Loading marketplace...</span>
            </div>
          </div>
        ) : view.type === "create" ? (
          <CreateListingForm
            onCreated={() => {
              loadData();
              setView({ type: "my_listings" });
            }}
            onCancel={() => setView({ type: "browse" })}
          />
        ) : view.type === "detail" && selectedListing ? (
          <ProductDetailView
            listing={selectedListing}
            onBack={() => setView({ type: "browse" })}
            onPurchased={loadData}
          />
        ) : view.type === "my_listings" ? (
          <MyListingsView
            listings={myListings}
            onRefresh={loadData}
            onViewListing={(id) => setView({ type: "detail", listingId: id })}
          />
        ) : view.type === "purchased" ? (
          <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-12 text-center">
            <svg
              className="w-12 h-12 text-zinc-700 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-zinc-500 text-sm">
              Purchase history will appear here once you buy something.
            </p>
          </div>
        ) : (
          /* Browse view */
          <div>
            {/* Search + filter bar */}
            <div className="flex flex-col gap-3 mb-5">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search listings by title, description, tags, or seller..."
                    className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 pl-9 pr-4 py-2.5
                               text-sm text-zinc-100 placeholder:text-zinc-600
                               focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters((f) => !f)}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    showFilters
                      ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-400"
                      : "bg-zinc-800/80 border-zinc-700/50 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                </button>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-300
                             focus:outline-none focus:border-emerald-500/50 transition-colors"
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price ↑</option>
                  <option value="price_desc">Price ↓</option>
                  <option value="popular">Most Popular</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>

              {/* Expandable filter panel */}
              {showFilters && (
                <div className="flex flex-wrap items-end gap-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30 p-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Category</span>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value as MarketplaceCategory)}
                      className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200
                                 focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="all">All Categories</option>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Min Price</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      placeholder="0"
                      className="w-24 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200
                                 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Max Price</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      placeholder="∞"
                      className="w-24 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200
                                 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterCategory("all");
                      setPriceMin("");
                      setPriceMax("");
                      setSearch("");
                    }}
                    className="rounded-lg bg-zinc-700/50 border border-zinc-600/50 px-3 py-1.5 text-xs text-zinc-400
                               hover:text-zinc-200 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-500">
                {displayedListings.length} listing{displayedListings.length !== 1 ? "s" : ""} found
              </span>
            </div>

            {/* Listings grid */}
            {displayedListings.length === 0 ? (
              <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-12 text-center">
                <svg
                  className="w-12 h-12 text-zinc-700 mx-auto mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-zinc-500 text-sm mb-1">No listings match your search.</p>
                <p className="text-zinc-600 text-xs">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onClick={() => setView({ type: "detail", listingId: listing.id })}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
