import { useState, useEffect, useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";

// ─── Types ────────────────────────────────────────────────────────────────────

type ResourceType = "compute" | "storage" | "bandwidth";

interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  capacity: number;
  used: number;
  unit: string;
  pricePerUnit: number;
  owner: string;
  available: boolean;
  shared: boolean;
  sharedWith: string[];
  description: string;
  createdAt: string;
}

interface ResourceRequest {
  id: string;
  type: ResourceType;
  neededCapacity: number;
  requester: string;
  message: string;
  status: "pending" | "accepted" | "denied";
  createdAt: string;
}

interface ResourceAllocation {
  id: string;
  resourceId: string;
  taskName: string;
  allocatedAmount: number;
  assignee: string;
  status: "active" | "completed" | "cancelled";
  createdAt: string;
}

interface UsageStat {
  resourceId: string;
  date: string;
  usagePercent: number;
}

interface PricingInfo {
  resourceId: string;
  type: ResourceType;
  pricePerUnit: number;
  recommendedPrice: number;
}

type Tab = "catalog" | "marketplace" | "sharing" | "rental" | "monitoring" | "allocation" | "pricing" | "requests";

// ─── Constants ────────────────────────────────────────────────────────────────

const RESOURCE_UNITS: Record<ResourceType, string> = {
  compute: "vCPU",
  storage: "GB",
  bandwidth: "Mbps",
};

const RESOURCE_ICONS: Record<ResourceType, string> = {
  compute: "⚡",
  storage: "💾",
  bandwidth: "🌐",
};

const TYPE_COLORS: Record<ResourceType, string> = {
  compute: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  storage: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
  bandwidth: "from-green-500/20 to-green-600/10 border-green-500/30",
};

const TYPE_ACCENT: Record<ResourceType, string> = {
  compute: "text-blue-400",
  storage: "text-purple-400",
  bandwidth: "text-green-400",
};

const TYPE_BADGE: Record<ResourceType, string> = {
  compute: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  storage: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  bandwidth: "bg-green-500/20 text-green-300 border-green-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  active: "text-green-400",
  completed: "text-blue-400",
  cancelled: "text-gray-400",
  pending: "text-yellow-400",
  accepted: "text-green-400",
  denied: "text-red-400",
};

const MOCK_CURRENT_USER = "local-user-01";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

function percentOf(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min((used / total) * 100, 100);
}

function sparkBarValues(data: UsageStat[], count: number = 20): number[] {
  if (data.length === 0) return Array(count).fill(0);
  const step = Math.max(1, Math.floor(data.length / count));
  const bars: number[] = [];
  for (let i = 0; i < data.length && bars.length < count; i += step) {
    bars.push(data[i].usagePercent);
  }
  while (bars.length < count) bars.push(0);
  return bars;
}

// ─── Mini Spark Bar ───────────────────────────────────────────────────────────

function SparkBar({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-px h-8">
      {values.map((v, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-t-sm ${color} transition-all duration-300`}
          style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 2 : 0 }}
        />
      ))}
    </div>
  );
}

// ─── Usage Arc (SVG) ──────────────────────────────────────────────────────────

function UsageArc({ percent, size = 80, strokeWidth = 6 }: { percent: number; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color =
    percent > 80 ? "stroke-red-400" : percent > 50 ? "stroke-yellow-400" : "stroke-emerald-400";

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        className={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-white text-xs font-semibold"
        transform={`rotate(90 ${size / 2} ${size / 2})`}
      >
        {Math.round(percent)}%
      </text>
    </svg>
  );
}

// ─── Resource Card ────────────────────────────────────────────────────────────

function ResourceCard({
  resource,
  onToggleShare,
  onEditPrice,
  onDelete,
  onAllocate,
  onRent,
}: {
  resource: Resource;
  onToggleShare: (id: string) => void;
  onEditPrice: (id: string) => void;
  onDelete: (id: string) => void;
  onAllocate: (resource: Resource) => void;
  onRent: (resource: Resource) => void;
}) {
  const usagePercent = percentOf(resource.used, resource.capacity);

  return (
    <div
      className={`relative group rounded-xl border bg-gradient-to-br ${TYPE_COLORS[resource.type]} p-5 transition-all duration-200 hover:border-white/20 hover:shadow-lg hover:shadow-black/20`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{RESOURCE_ICONS[resource.type]}</span>
          <div>
            <h3 className="text-sm font-semibold text-white leading-tight">{resource.name}</h3>
            <span className={`inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded border ${TYPE_BADGE[resource.type]}`}>
              {resource.type.toUpperCase()}
            </span>
          </div>
        </div>
        <UsageArc percent={usagePercent} size={52} strokeWidth={5} />
      </div>

      <p className="text-xs text-gray-400 mb-3 line-clamp-2">{resource.description}</p>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="bg-white/5 rounded-lg px-2.5 py-1.5">
          <span className="text-gray-500 block">Capacity</span>
          <span className="text-white font-medium">
            {formatNumber(resource.capacity)} {resource.unit}
          </span>
        </div>
        <div className="bg-white/5 rounded-lg px-2.5 py-1.5">
          <span className="text-gray-500 block">Used</span>
          <span className={`font-medium ${usagePercent > 80 ? "text-red-400" : "text-white"}`}>
            {formatNumber(resource.used)} {resource.unit}
          </span>
        </div>
        <div className="bg-white/5 rounded-lg px-2.5 py-1.5">
          <span className="text-gray-500 block">Price</span>
          <span className="text-emerald-400 font-medium">
            ${resource.pricePerUnit.toFixed(2)}/{resource.unit}
          </span>
        </div>
        <div className="bg-white/5 rounded-lg px-2.5 py-1.5">
          <span className="text-gray-500 block">Status</span>
          <span className={`font-medium ${resource.available ? "text-green-400" : "text-gray-400"}`}>
            {resource.available ? "Available" : "Unavailable"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-3">
        <span className="text-[10px] text-gray-500">SHARED</span>
        <button
          onClick={() => onToggleShare(resource.id)}
          className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${
            resource.shared ? "bg-emerald-500" : "bg-gray-600"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${
              resource.shared ? "translate-x-4" : ""
            }`}
          />
        </button>
        {resource.shared && resource.sharedWith.length > 0 && (
          <span className="text-[10px] text-gray-400 ml-1">{resource.sharedWith.length} user(s)</span>
        )}
      </div>

      <div className="flex gap-1.5">
        <button
          onClick={() => onAllocate(resource)}
          className="flex-1 text-[11px] font-medium px-2 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/20 hover:bg-blue-500/30 transition-colors"
        >
          Allocate
        </button>
        <button
          onClick={() => onRent(resource)}
          className="flex-1 text-[11px] font-medium px-2 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/20 hover:bg-purple-500/30 transition-colors"
        >
          Rent
        </button>
        <button
          onClick={() => onEditPrice(resource.id)}
          className="text-[11px] font-medium px-2 py-1.5 rounded-lg bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-colors"
        >
          $
        </button>
        <button
          onClick={() => onDelete(resource.id)}
          className="text-[11px] font-medium px-2 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/10 hover:bg-red-500/20 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Add Resource Form ────────────────────────────────────────────────────────

function AddResourceForm({ onAdd, onClose }: { onAdd: (r: Omit<Resource, "id" | "createdAt" | "used" | "shared" | "sharedWith">) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ResourceType>("compute");
  const [capacity, setCapacity] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!name.trim() || !capacity || !pricePerUnit) return;
    onAdd({
      name: name.trim(),
      type,
      capacity: parseFloat(capacity),
      pricePerUnit: parseFloat(pricePerUnit),
      unit: RESOURCE_UNITS[type],
      owner: MOCK_CURRENT_USER,
      available: true,
      description: description.trim() || `${type} resource`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white mb-4">Add Resource</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
              placeholder="My GPU Cluster"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Type</label>
            <div className="flex gap-2">
              {(["compute", "storage", "bandwidth"] as ResourceType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 text-xs font-medium py-2 rounded-lg border transition-colors ${
                    type === t
                      ? `${TYPE_BADGE[t]} border-current`
                      : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {RESOURCE_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Capacity ({RESOURCE_UNITS[type]})
              </label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                placeholder="100"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Price per {RESOURCE_UNITS[type]} ($)
              </label>
              <input
                type="number"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                placeholder="0.50"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none h-16"
              placeholder="High-performance compute resources available for rent..."
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2 text-sm text-gray-400 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !capacity || !pricePerUnit}
            className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add Resource
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Allocation Form ──────────────────────────────────────────────────────────

function AllocationForm({
  resource,
  onAllocate,
  onClose,
}: {
  resource: Resource;
  onAllocate: (allocation: Omit<ResourceAllocation, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const [taskName, setTaskName] = useState("");
  const [amount, setAmount] = useState("");
  const maxAvailable = resource.capacity - resource.used;

  const handleSubmit = () => {
    if (!taskName.trim() || !amount) return;
    const amt = parseFloat(amount);
    if (amt <= 0 || amt > maxAvailable) return;
    onAllocate({
      resourceId: resource.id,
      taskName: taskName.trim(),
      allocatedAmount: amt,
      assignee: MOCK_CURRENT_USER,
      status: "active",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-1">Allocate Resource</h3>
        <p className="text-xs text-gray-400 mb-4">
          {RESOURCE_ICONS[resource.type]} {resource.name} — {formatNumber(maxAvailable)} {resource.unit} available
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Task Name</label>
            <input
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
              placeholder="ML Training Job"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Amount ({resource.unit})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
              placeholder={`${Math.floor(maxAvailable / 2)}`}
              min="0"
              max={maxAvailable}
              step="0.1"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2 text-sm text-gray-400 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!taskName.trim() || !amount || parseFloat(amount) <= 0}
            className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Allocate
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Rental Form ──────────────────────────────────────────────────────────────

function RentalForm({
  resource,
  onRent,
  onClose,
}: {
  resource: Resource;
  onRent: (resource: Resource, hours: number) => void;
  onClose: () => void;
}) {
  const [hours, setHours] = useState("1");
  const h = parseFloat(hours) || 0;
  const cost = h * resource.pricePerUnit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-1">Rent Resource</h3>
        <p className="text-xs text-gray-400 mb-4">
          {RESOURCE_ICONS[resource.type]} {resource.name} by {resource.owner}
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Duration (hours)</label>
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
              min="1"
              step="1"
            />
          </div>
          <div className="bg-white/5 rounded-lg px-3 py-2 text-sm">
            <span className="text-gray-400">Estimated cost: </span>
            <span className="text-emerald-400 font-semibold">${cost.toFixed(2)}</span>
            <span className="text-gray-500 text-xs ml-1">
              ({formatNumber(resource.capacity)} {resource.unit} × ${resource.pricePerUnit.toFixed(2)}/unit × {h}h)
            </span>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2 text-sm text-gray-400 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onRent(resource, h)}
            disabled={h <= 0}
            className="flex-1 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Rent — ${cost.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Price Editor ─────────────────────────────────────────────────────────────

function PriceEditor({
  resourceId,
  currentPrice,
  resourceType,
  onSet,
  onClose,
}: {
  resourceId: string;
  currentPrice: number;
  resourceType: ResourceType;
  onSet: (resourceId: string, price: number) => void;
  onClose: () => void;
}) {
  const [price, setPrice] = useState(currentPrice.toFixed(2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-4">Set Price</h3>
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Price per {RESOURCE_UNITS[resourceType]} ($)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
            min="0"
            step="0.01"
          />
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2 text-sm text-gray-400 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => {
              const p = parseFloat(price);
              if (p >= 0) onSet(resourceId, p);
            }}
            className="flex-1 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Resource Request Form ────────────────────────────────────────────────────

function RequestForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (req: Omit<ResourceRequest, "id" | "status" | "createdAt">) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<ResourceType>("compute");
  const [neededCapacity, setNeededCapacity] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (!neededCapacity) return;
    onSubmit({
      type,
      neededCapacity: parseFloat(neededCapacity),
      requester: MOCK_CURRENT_USER,
      message: message.trim() || `Need ${neededCapacity} ${RESOURCE_UNITS[type]} of ${type}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-4">Request Resource</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Type</label>
            <div className="flex gap-2">
              {(["compute", "storage", "bandwidth"] as ResourceType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 text-xs font-medium py-2 rounded-lg border transition-colors ${
                    type === t
                      ? `${TYPE_BADGE[t]} border-current`
                      : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {RESOURCE_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Needed Capacity ({RESOURCE_UNITS[type]})
            </label>
            <input
              type="number"
              value={neededCapacity}
              onChange={(e) => setNeededCapacity(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
              placeholder="50"
              min="0"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none h-16"
              placeholder="Describe what you need..."
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2 text-sm text-gray-400 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!neededCapacity}
            className="flex-1 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ResourcePage ────────────────────────────────────────────────────────

export default function ResourcePage() {
  const [activeTab, setActiveTab] = useState<Tab>("catalog");
  const [resources, setResources] = useState<Resource[]>([]);
  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [allocations, setAllocations] = useState<ResourceAllocation[]>([]);
  const [usageStats, setUsageStats] = useState<Record<string, UsageStat[]>>({});

  const [showAddForm, setShowAddForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [allocatingResource, setAllocatingResource] = useState<Resource | null>(null);
  const [rentingResource, setRentingResource] = useState<Resource | null>(null);
  const [editingPriceResource, setEditingPriceResource] = useState<Resource | null>(null);

  const [filterType, setFilterType] = useState<ResourceType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // ── Tauri invoke helpers ──────────────────────────────────────────────────

  const invokeSafe = useCallback(async <T,>(cmd: string, args?: Record<string, unknown>): Promise<T | null> => {
    try {
      return await invoke<T>(cmd, args);
    } catch (e) {
      console.warn(`[Tauri] ${cmd} failed, using local state:`, e);
      return null;
    }
  }, []);

  // ── Init: load data ───────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      const res = await invokeSafe<Resource[]>("get_resources");
      if (res && res.length > 0) {
        setResources(res);
      } else {
        setResources(generateSeedResources());
      }

      const req = await invokeSafe<ResourceRequest[]>("get_resource_requests");
      if (req) setRequests(req);

      const alloc = await invokeSafe<ResourceAllocation[]>("get_resource_allocations");
      if (alloc) setAllocations(alloc);

      const usage = await invokeSafe<Record<string, UsageStat[]>>("get_resource_usage");
      if (usage) {
        setUsageStats(usage);
      } else {
        setUsageStats(generateSeedUsage(resources.length > 0 ? resources : generateSeedResources()));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep usage stats seeded when resources load for the first time
  useEffect(() => {
    if (resources.length > 0 && Object.keys(usageStats).length === 0) {
      setUsageStats(generateSeedUsage(resources));
    }
  }, [resources]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── CRUD actions ──────────────────────────────────────────────────────────

  const addResource = useCallback(
    async (r: Omit<Resource, "id" | "createdAt" | "used" | "shared" | "sharedWith">) => {
      const newRes: Resource = {
        ...r,
        id: generateId(),
        used: 0,
        shared: false,
        sharedWith: [],
        createdAt: new Date().toISOString(),
      };
      setResources((prev) => [newRes, ...prev]);
      setUsageStats((prev) => ({
        ...prev,
        [newRes.id]: generateUsageForId(newRes.id),
      }));
      await invokeSafe("add_resource", { resource: newRes });
    },
    [invokeSafe],
  );

  const deleteResource = useCallback(
    async (id: string) => {
      setResources((prev) => prev.filter((r) => r.id !== id));
      setUsageStats((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await invokeSafe("delete_resource", { resourceId: id });
    },
    [invokeSafe],
  );

  const toggleShare = useCallback(
    async (id: string) => {
      setResources((prev) =>
        prev.map((r) => (r.id === id ? { ...r, shared: !r.shared } : r)),
      );
      await invokeSafe("toggle_resource_share", { resourceId: id });
    },
    [invokeSafe],
  );

  const setPrice = useCallback(
    async (id: string, price: number) => {
      setResources((prev) => prev.map((r) => (r.id === id ? { ...r, pricePerUnit: price } : r)));
      setEditingPriceResource(null);
      await invokeSafe("set_resource_price", { resourceId: id, price });
    },
    [invokeSafe],
  );

  const addAllocation = useCallback(
    async (a: Omit<ResourceAllocation, "id" | "createdAt">) => {
      const alloc: ResourceAllocation = { ...a, id: generateId(), createdAt: new Date().toISOString() };
      setAllocations((prev) => [alloc, ...prev]);
      setResources((prev) =>
        prev.map((r) =>
          r.id === a.resourceId
            ? { ...r, used: Math.min(r.used + a.allocatedAmount, r.capacity) }
            : r,
        ),
      );
      await invokeSafe("add_allocation", { allocation: alloc });
    },
    [invokeSafe],
  );

  const cancelAllocation = useCallback(
    async (allocId: string, resourceId: string, amount: number) => {
      setAllocations((prev) =>
        prev.map((a) => (a.id === allocId ? { ...a, status: "cancelled" as const } : a)),
      );
      setResources((prev) =>
        prev.map((r) => (r.id === resourceId ? { ...r, used: Math.max(0, r.used - amount) } : r)),
      );
      await invokeSafe("cancel_allocation", { allocationId: allocId });
    },
    [invokeSafe],
  );

  const addRequest = useCallback(
    async (r: Omit<ResourceRequest, "id" | "status" | "createdAt">) => {
      const req: ResourceRequest = {
        ...r,
        id: generateId(),
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      setRequests((prev) => [req, ...prev]);
      await invokeSafe("add_resource_request", { request: req });
    },
    [invokeSafe],
  );

  const handleRequestAction = useCallback(
    async (reqId: string, action: "accepted" | "denied") => {
      setRequests((prev) => prev.map((r) => (r.id === reqId ? { ...r, status: action } : r)));
      await invokeSafe("handle_resource_request", { requestId: reqId, action });
    },
    [invokeSafe],
  );

  const rentResource = useCallback(
    async (resource: Resource, hours: number) => {
      const amount = resource.capacity * hours;
      const alloc: ResourceAllocation = {
        id: generateId(),
        resourceId: resource.id,
        taskName: `Rental: ${hours}h`,
        allocatedAmount: amount,
        assignee: MOCK_CURRENT_USER,
        status: "active",
        createdAt: new Date().toISOString(),
      };
      setAllocations((prev) => [alloc, ...prev]);
      setResources((prev) =>
        prev.map((r) =>
          r.id === resource.id ? { ...r, used: Math.min(r.used + amount, r.capacity) } : r,
        ),
      );
      setRentingResource(null);
      await invokeSafe("rent_resource", { allocation: alloc, hours, cost: hours * resource.pricePerUnit });
    },
    [invokeSafe],
  );

  // ── Filtered / derived ────────────────────────────────────────────────────

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      if (filterType !== "all" && r.type !== filterType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.owner.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [resources, filterType, searchQuery]);

  const marketplaceResources = useMemo(() => {
    return resources.filter((r) => r.available && r.shared);
  }, [resources]);

  const totalCapacityByType = useMemo(() => {
    const acc: Record<ResourceType, number> = { compute: 0, storage: 0, bandwidth: 0 };
    resources.forEach((r) => {
      acc[r.type] += r.capacity;
    });
    return acc;
  }, [resources]);

  const totalUsedByType = useMemo(() => {
    const acc: Record<ResourceType, number> = { compute: 0, storage: 0, bandwidth: 0 };
    resources.forEach((r) => {
      acc[r.type] += r.used;
    });
    return acc;
  }, [resources]);

  const tabs: { key: Tab; label: string; icon: string; badge?: number }[] = [
    { key: "catalog", label: "Catalog", icon: "📦" },
    { key: "marketplace", label: "Marketplace", icon: "🏪", badge: marketplaceResources.length },
    { key: "sharing", label: "Sharing", icon: "🔗", badge: resources.filter((r) => r.shared).length },
    { key: "rental", label: "Rental", icon: "💰" },
    { key: "monitoring", label: "Monitoring", icon: "📊" },
    { key: "allocation", label: "Allocation", icon: "🎯", badge: allocations.filter((a) => a.status === "active").length },
    { key: "pricing", label: "Pricing", icon: "💲" },
    { key: "requests", label: "Requests", icon: "📨", badge: requests.filter((r) => r.status === "pending").length },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Resources</h1>
              <p className="text-xs text-gray-500 mt-0.5">Manage, share, and trade compute resources</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRequestForm(true)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/20 hover:bg-amber-500/25 transition-colors"
              >
                + Request
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                + Add Resource
              </button>
            </div>
          </div>

          {/* Summary row */}
          <div className="flex gap-3 mb-4">
            {(["compute", "storage", "bandwidth"] as ResourceType[]).map((t) => (
              <div key={t} className="flex-1 bg-white/[0.03] rounded-lg px-3 py-2 border border-white/5">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{RESOURCE_ICONS[t]}</span>
                  <span className="text-[10px] text-gray-500 uppercase">{t}</span>
                </div>
                <div className="text-sm font-semibold text-white">
                  {formatNumber(totalUsedByType[t])} / {formatNumber(totalCapacityByType[t])}
                  <span className="text-gray-500 text-[10px] ml-1">{RESOURCE_UNITS[t]}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none -mb-4 pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "bg-white/10 text-white"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge != null && tab.badge > 0 && (
                  <span className="ml-0.5 bg-blue-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ── CATALOG TAB ─────────────────────────────────────────────────── */}
        {activeTab === "catalog" && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                placeholder="Search resources..."
              />
              <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
                {(["all", "compute", "storage", "bandwidth"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterType(f)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors ${
                      filterType === f ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {filteredResources.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <span className="text-3xl block mb-2">📦</span>
                <p className="text-sm">No resources found</p>
                <p className="text-xs text-gray-600 mt-1">Add a resource or adjust your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredResources.map((r) => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    onToggleShare={toggleShare}
                    onEditPrice={(id) => {
                      const res = resources.find((x) => x.id === id);
                      if (res) setEditingPriceResource(res);
                    }}
                    onDelete={deleteResource}
                    onAllocate={setAllocatingResource}
                    onRent={setRentingResource}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MARKETPLACE TAB ─────────────────────────────────────────────── */}
        {activeTab === "marketplace" && (
          <div>
            <div className="mb-4 bg-white/[0.03] rounded-xl border border-white/5 p-4">
              <h3 className="text-sm font-semibold text-white mb-1">Resource Marketplace</h3>
              <p className="text-xs text-gray-500">Browse resources shared by other users in the network.</p>
            </div>

            {marketplaceResources.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <span className="text-3xl block mb-2">🏪</span>
                <p className="text-sm">No resources available in the marketplace</p>
                <p className="text-xs text-gray-600 mt-1">Share your resources to make them visible here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketplaceResources.map((r) => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    onToggleShare={toggleShare}
                    onEditPrice={(id) => {
                      const res = resources.find((x) => x.id === id);
                      if (res) setEditingPriceResource(res);
                    }}
                    onDelete={deleteResource}
                    onAllocate={setAllocatingResource}
                    onRent={setRentingResource}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SHARING TAB ─────────────────────────────────────────────────── */}
        {activeTab === "sharing" && (
          <div>
            <div className="mb-4 bg-white/[0.03] rounded-xl border border-white/5 p-4">
              <h3 className="text-sm font-semibold text-white mb-1">Resource Sharing</h3>
              <p className="text-xs text-gray-500">Toggle sharing on your resources to make them available to others.</p>
            </div>

            <div className="space-y-2">
              {resources.map((r) => (
                <div key={r.id} className="flex items-center gap-4 bg-white/[0.03] rounded-xl border border-white/5 px-4 py-3">
                  <span className="text-lg">{RESOURCE_ICONS[r.type]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{r.name}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${TYPE_BADGE[r.type]}`}>
                        {r.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">{r.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.shared && (
                      <span className="text-[10px] text-gray-400">
                        Shared with {r.sharedWith.length} user(s)
                      </span>
                    )}
                    <button
                      onClick={() => toggleShare(r.id)}
                      className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                        r.shared ? "bg-emerald-500" : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                          r.shared ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── RENTAL TAB ──────────────────────────────────────────────────── */}
        {activeTab === "rental" && (
          <div>
            <div className="mb-4 bg-white/[0.03] rounded-xl border border-white/5 p-4">
              <h3 className="text-sm font-semibold text-white mb-1">Rent Resources</h3>
              <p className="text-xs text-gray-500">Rent compute, storage, or bandwidth from other users.</p>
            </div>

            <div className="mb-4 flex gap-2">
              {(["compute", "storage", "bandwidth"] as ResourceType[]).map((t) => {
                const avail = marketplaceResources.filter((r) => r.type === t);
                return (
                  <div key={t} className="flex-1 bg-white/[0.03] rounded-xl border border-white/5 p-3 text-center">
                    <span className="text-xl block mb-1">{RESOURCE_ICONS[t]}</span>
                    <span className="text-lg font-bold text-white">{avail.length}</span>
                    <span className="text-[10px] text-gray-500 block">{t} available</span>
                  </div>
                );
              })}
            </div>

            {marketplaceResources.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <span className="text-3xl block mb-2">💰</span>
                <p className="text-sm">No resources available for rent</p>
                <p className="text-xs text-gray-600 mt-1">Check back later or request resources below</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketplaceResources.map((r) => (
                  <div key={r.id} className={`relative rounded-xl border bg-gradient-to-br ${TYPE_COLORS[r.type]} p-5`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{RESOURCE_ICONS[r.type]}</span>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{r.name}</h4>
                        <span className="text-[10px] text-gray-400">by {r.owner}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">{r.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs">
                        <span className="text-gray-500">Available: </span>
                        <span className="text-white font-medium">
                          {formatNumber(r.capacity - r.used)} {r.unit}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-500">Price: </span>
                        <span className="text-emerald-400 font-medium">
                          ${r.pricePerUnit.toFixed(2)}/{r.unit}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setRentingResource(r)}
                      className="w-full py-2 text-xs font-medium text-white bg-purple-600/80 rounded-lg hover:bg-purple-500 transition-colors"
                    >
                      Rent Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MONITORING TAB ──────────────────────────────────────────────── */}
        {activeTab === "monitoring" && (
          <div>
            <div className="mb-4 bg-white/[0.03] rounded-xl border border-white/5 p-4">
              <h3 className="text-sm font-semibold text-white mb-1">Resource Monitoring</h3>
              <p className="text-xs text-gray-500">Track usage, availability, and performance across all resources.</p>
            </div>

            <div className="space-y-4">
              {resources.map((r) => {
                const usagePercent = percentOf(r.used, r.capacity);
                const stats = usageStats[r.id] || [];
                const sparkValues = sparkBarValues(stats);

                return (
                  <div key={r.id} className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
                    <div className="flex items-start gap-4">
                      <UsageArc percent={usagePercent} size={72} strokeWidth={6} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{RESOURCE_ICONS[r.type]}</span>
                          <span className="text-sm font-semibold text-white">{r.name}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${TYPE_BADGE[r.type]}`}>
                            {r.type}
                          </span>
                          <span className={`text-[10px] font-medium ${r.available ? "text-green-400" : "text-gray-500"}`}>
                            {r.available ? "ONLINE" : "OFFLINE"}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mt-2 text-xs">
                          <div>
                            <span className="text-gray-500 block">Capacity</span>
                            <span className="text-white font-medium">{formatNumber(r.capacity)} {r.unit}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Used</span>
                            <span className={`font-medium ${usagePercent > 80 ? "text-red-400" : "text-white"}`}>
                              {formatNumber(r.used)} {r.unit}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Free</span>
                            <span className="text-white font-medium">
                              {formatNumber(Math.max(0, r.capacity - r.used))} {r.unit}
                            </span>
                          </div>
                        </div>

                        {/* Usage bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                            <span>Usage</span>
                            <span>{usagePercent.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                usagePercent > 80 ? "bg-red-400" : usagePercent > 50 ? "bg-yellow-400" : "bg-emerald-400"
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Spark chart */}
                      <div className="flex-shrink-0">
                        <SparkBar
                          values={sparkValues}
                          color={r.type === "compute" ? "bg-blue-400" : r.type === "storage" ? "bg-purple-400" : "bg-green-400"}
                        />
                        <span className="text-[9px] text-gray-600 block text-center mt-0.5">24h</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {resources.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                  <span className="text-3xl block mb-2">📊</span>
                  <p className="text-sm">No resources to monitor</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ALLOCATION TAB ──────────────────────────────────────────────── */}
        {activeTab === "allocation" && (
          <div>
            <div className="mb-4 bg-white/[0.03] rounded-xl border border-white/5 p-4">
              <h3 className="text-sm font-semibold text-white mb-1">Resource Allocation</h3>
              <p className="text-xs text-gray-500">Assign resources to tasks and manage active allocations.</p>
            </div>

            <div className="space-y-3">
              {allocations.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <span className="text-3xl block mb-2">🎯</span>
                  <p className="text-sm">No allocations yet</p>
                  <p className="text-xs text-gray-600 mt-1">Allocate resources from the catalog</p>
                </div>
              ) : (
                allocations.map((a) => {
                  const res = resources.find((r) => r.id === a.resourceId);
                  return (
                    <div key={a.id} className="bg-white/[0.03] rounded-xl border border-white/5 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{res ? RESOURCE_ICONS[res.type] : "📦"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white truncate">{a.taskName}</span>
                            <span className={`text-[10px] font-medium uppercase ${STATUS_COLORS[a.status]}`}>
                              {a.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500">
                            {formatNumber(a.allocatedAmount)} {res?.unit || "units"} allocated to {a.assignee}
                          </p>
                        </div>
                        {a.status === "active" && (
                          <button
                            onClick={() => cancelAllocation(a.id, a.resourceId, a.allocatedAmount)}
                            className="text-[11px] font-medium px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/10 hover:bg-red-500/20 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── PRICING TAB ─────────────────────────────────────────────────── */}
        {activeTab === "pricing" && (
          <div>
            <div className="mb-4 bg-white/[0.03] rounded-xl border border-white/5 p-4">
              <h3 className="text-sm font-semibold text-white mb-1">Resource Pricing</h3>
              <p className="text-xs text-gray-500">Set prices for your resources and view market rates.</p>
            </div>

            <div className="space-y-2">
              {resources.map((r) => {
                const recommended = r.type === "compute" ? 0.5 : r.type === "storage" ? 0.02 : 0.1;
                const isOverpriced = r.pricePerUnit > recommended * 1.5;
                const isUnderpriced = r.pricePerUnit < recommended * 0.5;

                return (
                  <div key={r.id} className="bg-white/[0.03] rounded-xl border border-white/5 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{RESOURCE_ICONS[r.type]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white truncate">{r.name}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${TYPE_BADGE[r.type]}`}>
                            {r.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500">{r.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-400">
                          ${r.pricePerUnit.toFixed(2)}/{r.unit}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Recommended: ${recommended.toFixed(2)}
                        </div>
                        {isOverpriced && (
                          <span className="text-[9px] text-red-400 font-medium">Above market</span>
                        )}
                        {isUnderpriced && (
                          <span className="text-[9px] text-yellow-400 font-medium">Below market</span>
                        )}
                      </div>
                      <button
                        onClick={() => setEditingPriceResource(r)}
                        className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── REQUESTS TAB ────────────────────────────────────────────────── */}
        {activeTab === "requests" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4 flex-1 mr-3">
                <h3 className="text-sm font-semibold text-white mb-1">Resource Requests</h3>
                <p className="text-xs text-gray-500">Manage incoming and outgoing resource requests.</p>
              </div>
              <button
                onClick={() => setShowRequestForm(true)}
                className="text-xs font-medium px-3 py-2 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/20 hover:bg-amber-500/25 transition-colors"
              >
                + New Request
              </button>
            </div>

            <div className="space-y-2">
              {requests.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <span className="text-3xl block mb-2">📨</span>
                  <p className="text-sm">No requests yet</p>
                  <p className="text-xs text-gray-600 mt-1">Create a request to ask for resources</p>
                </div>
              ) : (
                requests.map((req) => (
                  <div key={req.id} className="bg-white/[0.03] rounded-xl border border-white/5 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{RESOURCE_ICONS[req.type]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{req.requester}</span>
                          <span className={`text-[10px] font-medium uppercase ${STATUS_COLORS[req.status]}`}>
                            {req.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Needs {formatNumber(req.neededCapacity)} {RESOURCE_UNITS[req.type]} of{" "}
                          <span className={TYPE_ACCENT[req.type]}>{req.type}</span>
                        </p>
                        {req.message && <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{req.message}</p>}
                      </div>
                      {req.status === "pending" && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleRequestAction(req.id, "accepted")}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-green-500/15 text-green-300 border border-green-500/20 hover:bg-green-500/25 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRequestAction(req.id, "denied")}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-red-500/15 text-red-300 border border-red-500/20 hover:bg-red-500/25 transition-colors"
                          >
                            Deny
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {showAddForm && <AddResourceForm onAdd={addResource} onClose={() => setShowAddForm(false)} />}
      {showRequestForm && <RequestForm onSubmit={addRequest} onClose={() => setShowRequestForm(false)} />}
      {allocatingResource && (
        <AllocationForm
          resource={allocatingResource}
          onAllocate={addAllocation}
          onClose={() => setAllocatingResource(null)}
        />
      )}
      {rentingResource && (
        <RentalForm
          resource={rentingResource}
          onRent={rentResource}
          onClose={() => setRentingResource(null)}
        />
      )}
      {editingPriceResource && (
        <PriceEditor
          resourceId={editingPriceResource.id}
          currentPrice={editingPriceResource.pricePerUnit}
          resourceType={editingPriceResource.type}
          onSet={setPrice}
          onClose={() => setEditingPriceResource(null)}
        />
      )}
    </div>
  );
}

// ─── Seed data generators ─────────────────────────────────────────────────────

function generateSeedResources(): Resource[] {
  return [
    {
      id: "res-gpu-01",
      name: "GPU Cluster A",
      type: "compute",
      capacity: 64,
      used: 42,
      unit: "vCPU",
      pricePerUnit: 0.75,
      owner: "node-alpha",
      available: true,
      shared: true,
      sharedWith: ["node-beta", "node-gamma"],
      description: "High-performance GPU cluster for ML training and inference workloads.",
      createdAt: "2026-01-15T08:30:00Z",
    },
    {
      id: "res-gpu-02",
      name: "GPU Cluster B",
      type: "compute",
      capacity: 32,
      used: 8,
      unit: "vCPU",
      pricePerUnit: 0.5,
      owner: "node-beta",
      available: true,
      shared: false,
      sharedWith: [],
      description: "Mid-range compute cluster for general-purpose tasks.",
      createdAt: "2026-02-03T14:20:00Z",
    },
    {
      id: "res-ssd-01",
      name: "NVMe Storage Pool",
      type: "storage",
      capacity: 10000,
      used: 6200,
      unit: "GB",
      pricePerUnit: 0.015,
      owner: "node-alpha",
      available: true,
      shared: true,
      sharedWith: ["node-delta"],
      description: "Enterprise NVMe storage pool with 99.99% uptime SLA.",
      createdAt: "2026-01-20T10:00:00Z",
    },
    {
      id: "res-hdd-01",
      name: "Cold Storage Archive",
      type: "storage",
      capacity: 100000,
      used: 45000,
      unit: "GB",
      pricePerUnit: 0.003,
      owner: "node-gamma",
      available: true,
      shared: true,
      sharedWith: [],
      description: "High-capacity cold storage for archival data and backups.",
      createdAt: "2026-03-01T06:45:00Z",
    },
    {
      id: "res-net-01",
      name: "Fiber Uplink",
      type: "bandwidth",
      capacity: 10000,
      used: 3200,
      unit: "Mbps",
      pricePerUnit: 0.08,
      owner: "node-delta",
      available: true,
      shared: false,
      sharedWith: [],
      description: "10Gbps dedicated fiber uplink with low-latency routing.",
      createdAt: "2026-02-10T12:00:00Z",
    },
    {
      id: "res-net-02",
      name: "Regional CDN Edge",
      type: "bandwidth",
      capacity: 5000,
      used: 1800,
      unit: "Mbps",
      pricePerUnit: 0.05,
      owner: "node-epsilon",
      available: true,
      shared: true,
      sharedWith: ["node-alpha", "node-beta"],
      description: "CDN edge node for content delivery in the APAC region.",
      createdAt: "2026-03-15T09:30:00Z",
    },
  ];
}

function generateUsageForId(id: string): UsageStat[] {
  const stats: UsageStat[] = [];
  const now = Date.now();
  let base = 30 + Math.random() * 40;
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    base = Math.max(5, Math.min(95, base + (Math.random() - 0.48) * 12));
    stats.push({
      resourceId: id,
      date: d.toISOString().split("T")[0],
      usagePercent: base,
    });
  }
  return stats;
}

function generateSeedUsage(resources: Resource[]): Record<string, UsageStat[]> {
  const out: Record<string, UsageStat[]> = {};
  resources.forEach((r) => {
    out[r.id] = generateUsageForId(r.id);
  });
  return out;
}
