# PINC Network — UX Research: Button/Action Design Best Practices

> Research compiled June 2026. All findings are grounded in current UX research (NN/g, Figma, LogRocket, UXPin) and tailored to the PINC Tauri + React + Zustand + Framer Motion stack.

---

## Table of Contents

1. [Button States and Feedback](#1-button-states-and-feedback)
2. [Form Design Patterns](#2-form-design-patterns)
3. [Real-time Data Patterns](#3-real-time-data-patterns)
4. [Empty State Design](#4-empty-state-design)

---

## 1. Button States and Feedback

### 1.1 Button States Overview

Every button in PINC should support at minimum these states (per NN/g 2025, Figma, UXPin 2026):

| State | Visual | Purpose |
|-------|--------|---------|
| **Default** | Outlined, electric-blue border | Ready to click |
| **Hover** | `rgba(0,212,255,0.1)` bg + glow | Cursor is over button |
| **Active/Pressed** | `scale(0.98)` | Being clicked |
| **Focus** | `2px solid` ring with `rgba(0,212,255,0.15)` | Keyboard navigation (WCAG 2.2 requirement) |
| **Disabled** | `opacity: 0.4; cursor: not-allowed` | Not available |
| **Loading** | Spinner + descriptive text | Action in progress |
| **Success** | Green fill or check icon, brief animation (100-200ms) | Action completed |
| **Error** | Red fill or warning icon | Action failed |

### 1.2 Loading States on Buttons

**Key principle**: Keep the label visible and relevant. Never replace the entire label with just a spinner — that removes context.

```tsx
// src/components/shared/LoadingButton.tsx
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps {
  onClick: () => Promise<void>;
  children: string;
  loadingText?: string;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'danger';
}

export function LoadingButton({
  onClick,
  children,
  loadingText,
  className = '',
  disabled = false,
  variant = 'default',
}: LoadingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const variantClass =
    variant === 'primary' ? 'pinc-btn-primary' :
    variant === 'danger' ? 'pinc-btn-danger' : '';

  const handleClick = async () => {
    setLoading(true);
    try {
      await onClick();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={`pinc-btn ${variantClass} ${className}`}
      onClick={handleClick}
      disabled={loading || disabled}
      aria-busy={loading}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {success ? 'Done!' : loading ? (loadingText || 'Processing…') : children}
    </button>
  );
}
```

**Guidelines**:
- **< 100ms operations**: Skip loading indicator entirely — it causes visual flicker that makes the app feel slower
- **100ms–3s**: Show spinner with text ("Saving…", "Applying…", "Processing…")
- **3s+**: Show progress bar if measurable, or spinner with status text
- **Always disable the button** during loading to prevent double-submissions
- Use `aria-busy="true"` for screen readers (WCAG 4.1.3)

### 1.3 Success/Error Toast Patterns

PINC already has a toast pattern in `JobsPage.tsx:831-855`. Current implementation is good — here's a reusable component:

```tsx
// src/components/shared/Toast.tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onDismiss: () => void;
}

export function Toast({ message, type, duration = 4000, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 200);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const styles: Record<string, React.CSSProperties> = {
    success: {
      background: 'rgba(57,255,20,0.15)',
      color: '#39ff14',
      border: '1px solid rgba(57,255,20,0.3)',
    },
    error: {
      background: 'rgba(255,34,85,0.15)',
      color: '#ff2255',
      border: '1px solid rgba(255,34,85,0.3)',
    },
    info: {
      background: 'rgba(0,212,255,0.15)',
      color: '#00d4ff',
      border: '1px solid rgba(0,212,255,0.3)',
    },
  };

  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 1000,
            padding: '0.6rem 1rem',
            borderRadius: 6,
            fontSize: '0.8rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            ...styles[type],
          }}
        >
          {Icon && <Icon size={14} />}
          <span>{message}</span>
          <button
            type="button"
            onClick={() => { setVisible(false); setTimeout(onDismiss, 200); }}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
            aria-label="Dismiss"
          >
            <X size={12} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Toast UX Guidelines (from NN/g, Vitaly Friedman)**:
- Auto-dismiss after **4-6 seconds** for simple messages, **6-10 seconds** with action buttons
- Pause timer on hover (Discord pattern)
- Maximum 3 lines of text; action labels 2 words or less
- Position: bottom-right on desktop, bottom-center on mobile
- Use `aria-live="polite"` for screen readers
- **Don't use toasts for critical/warnings** — those should persist until acknowledged

### 1.4 Confirmation Dialogs for Destructive Actions

**Three-tier approach** (from Prism Design System, Smashing Magazine):

| Risk Level | Pattern | Example in PINC |
|-----------|---------|-----------------|
| **Low** | Inline confirmation (click changes label, click again) | Toggle settings, archive item |
| **Medium** | Modal with "Are you sure?" + Cancel/Confirm | Delete job application, leave wager |
| **High** | Modal with type-to-confirm + warning | Delete account, withdraw all earnings, reset wallet |

```tsx
// src/components/shared/ConfirmDialog.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  requireType?: string;       // e.g. "DELETE" or the item name
  loading?: boolean;
  loadingText?: string;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
  requireType,
  loading = false,
  loadingText = 'Processing…',
}: ConfirmDialogProps) {
  const [typedValue, setTypedValue] = useState('');
  const isGatePass = !requireType || typedValue === requireType;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-message"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)',
          }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--neon-red)',
              borderRadius: 8,
              padding: '1.5rem',
              maxWidth: 420,
              width: '90%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <AlertTriangle size={20} style={{ color: 'var(--neon-red)' }} />
              <h2 id="confirm-title" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {title}
              </h2>
            </div>
            <p id="confirm-message" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              {message}
            </p>

            {requireType && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Type <strong style={{ color: 'var(--neon-red)' }}>{requireType}</strong> to confirm
                </label>
                <input
                  type="text"
                  value={typedValue}
                  onChange={(e) => setTypedValue(e.target.value)}
                  className="pinc-input"
                  style={{ borderColor: typedValue === requireType ? 'var(--neon-red)' : undefined }}
                  autoFocus
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                className="pinc-btn"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pinc-btn pinc-btn-danger"
                onClick={onConfirm}
                disabled={!isGatePass || loading}
                aria-disabled={!isGatePass || loading}
              >
                {loading ? loadingText : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Rules for destructive confirmations** (NN/g, Vercel Geist):
1. **Title states the action** — "Delete Job Post" not "Are you sure?"
2. **Description states the consequence** — "This cannot be undone" or "You will lose $X in escrow"
3. **Primary button names the action** — "Delete Job Post" not "Confirm" or "OK"
4. **Cancel gets initial focus** — prevent accidental Enter keypress from committing
5. **Disable backdrop-click** for destructive actions (prevent accidental dismissal)
6. **Use `role="alertdialog"`** — raises screen reader announcement priority

### 1.5 Disabled States

```css
/* Add to globals.css */
.pinc-btn:disabled,
.pinc-btn[aria-disabled="true"] {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
  box-shadow: none;
}

/* Better: use aria-disabled instead of disabled attribute to preserve keyboard focus */
.pinc-btn[aria-disabled="true"]:focus-visible {
  outline: 2px solid var(--electric-blue);
  outline-offset: 2px;
}
```

**Why `aria-disabled` over `disabled`?** (from UXPatterns.dev):
- `disabled` removes the element from tab order — screen reader users can't reach it
- `aria-disabled` keeps focusability but communicates the state to assistive tech
- Pair with `aria-label` explaining *why* the button is disabled: "Complete all required fields to continue"

---

## 2. Form Design Patterns

### 2.1 When to Use What

| Pattern | Use When | Example in PINC |
|---------|----------|-----------------|
| **Inline form** | 1-4 fields, always visible, part of the page flow | Search bar, filter controls |
| **Modal form** | 3-6 fields, quick task, must be finished or cancelled | Create job post, create wager |
| **Side drawer** | Edit record while seeing list context | Edit job details, edit profile |
| **Full page** | Multi-step wizard, 8+ fields, needs reference context | Complete job application, tournament setup |

**Decision rule from NN/g**: "A modal interrupts on purpose; use that interruption only when the interruption is the point."

### 2.2 Multi-Step Form Pattern

For PINC's complex creation flows (jobs, wagers, tournaments), use multi-step forms:

```tsx
// src/components/shared/StepWizard.tsx
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface Step {
  label: string;
  content: React.ReactNode;
  validate?: () => string | null;  // returns error message or null
}

interface StepWizardProps {
  steps: Step[];
  onComplete: () => void;
  finishLabel?: string;
}

export function StepWizard({ steps, onComplete, finishLabel = 'Submit' }: StepWizardProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const isFirst = current === 0;
  const isLast = current === steps.length - 1;

  const goNext = useCallback(() => {
    const validationError = steps[current].validate?.();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setDirection(1);
    setCurrent((c) => Math.min(c + 1, steps.length - 1));
  }, [current, steps]);

  const goBack = useCallback(() => {
    setError(null);
    setDirection(-1);
    setCurrent((c) => Math.max(c - 1, 0));
  }, []);

  return (
    <div>
      {/* Progress indicator */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem' }}>
        {steps.map((step, i) => (
          <div
            key={step.label}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i <= current ? 'var(--electric-blue)' : 'var(--border)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {/* Step label */}
      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.08em', marginBottom: '1rem' }}>
        Step {current + 1} of {steps.length}: {steps[current].label}
      </p>

      {/* Step content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          initial={{ opacity: 0, x: direction * 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -20 }}
          transition={{ duration: 0.2 }}
        >
          {steps[current].content}
        </motion.div>
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <p role="alert" style={{ fontSize: '0.75rem', color: 'var(--neon-red)', marginTop: 12 }}>
          {error}
        </p>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
        {!isFirst ? (
          <button type="button" className="pinc-btn" onClick={goBack} style={{ gap: 4 }}>
            <ChevronLeft size={14} /> Back
          </button>
        ) : <div />}

        {isLast ? (
          <button type="button" className="pinc-btn pinc-btn-primary" onClick={onComplete} style={{ gap: 4 }}>
            <Check size={14} /> {finishLabel}
          </button>
        ) : (
          <button type="button" className="pinc-btn pinc-btn-primary" onClick={goNext} style={{ gap: 4 }}>
            Next <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
```

**Best practices** (from multiple 2025-2026 sources):
- **2-5 steps** max; 3-4 is the sweet spot
- **2-3 fields per step** — single-column layout only
- **First step should be effortless** — basic info users can answer without thinking
- **Show progress as "Step 2 of 4"** not "50% complete" — feels more concrete
- **Allow back navigation** without losing data
- **Use `aria-current="step"`** on the current step indicator
- **Move focus** to step heading on clean transition, or first invalid field on validation error
- **Conditional logic** — skip irrelevant steps based on previous answers

### 2.3 Form Validation

**Recommended stack for PINC**: React Hook Form + Zod (since PINC uses React 18, Zustand, TypeScript)

```tsx
// Example: Job creation form with validation
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const jobSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  budgetMin: z.number().min(1, 'Minimum budget is 1 PINC'),
  budgetMax: z.number().min(1, 'Maximum budget is 1 PINC'),
  category: z.string().min(1, 'Select a category'),
  skills: z.array(z.string()).min(1, 'Add at least one skill'),
}).refine((data) => data.budgetMax >= data.budgetMin, {
  message: 'Maximum budget must be greater than minimum',
  path: ['budgetMax'],
});

type JobFormData = z.infer<typeof jobSchema>;

function JobForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    mode: 'onBlur',       // validate on blur, re-validate on change
  });

  const onSubmit = async (data: JobFormData) => {
    // submit to backend
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
          Job Title
        </label>
        <input
          {...register('title')}
          className="pinc-input"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <p id="title-error" role="alert" style={{ fontSize: '0.7rem', color: 'var(--neon-red)', marginTop: 4 }}>
            {errors.title.message}
          </p>
        )}
      </div>
      {/* ... more fields ... */}
      <button type="submit" className="pinc-btn pinc-btn-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Creating…' : 'Create Job'}
      </button>
    </form>
  );
}
```

**Validation timing** (from react.wiki, Samioda):
- **Blur**: Show errors after user leaves field (reduces noise while typing)
- **Change**: Re-validate in real-time so errors clear as users fix them
- **Submit**: Full form validation as safety net
- **Never show errors before touch** — "angry red errors while typing" is hostile UX

### 2.4 Responsive Form Layout

```css
/* Add to globals.css */
.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

@media (max-width: 640px) {
  .form-actions {
    flex-direction: column;
  }
  .form-actions button {
    width: 100%;
  }
}
```

---

## 3. Real-time Data Patterns

### 3.1 Current PINC Pattern Analysis

PINC currently uses **Tauri `invoke` + polling** (see `DashboardPage.tsx:22` — `setInterval(() => store.refreshNodeStatus?.(), 15000)`). This is appropriate for the current use case. The store in `appStore.ts` has empty `catch` blocks that silently swallow errors.

### 3.2 When to Use Polling vs WebSocket vs SSE

| Approach | Best For | PINC Use Case |
|----------|----------|---------------|
| **Polling** | Data changes every 10+ seconds, low user count, simplicity | Node status, wallet balance, earnings |
| **SSE** | Server→client push, sub-second delivery | Live notifications, chat messages |
| **WebSocket** | Bidirectional, <50ms latency | Live wager matching, real-time chat |

**Decision tree** (from Frontend Patterns 2026):
```
Does the client need to send data to server in real time, constantly?
├── No → Use SSE for server push, or polling for low-frequency updates
└── Yes → Use WebSocket (chat, live matching, collaborative editing)
```

### 3.3 Polling Best Practices for PINC

Since PINC is a Tauri desktop app, polling is the simplest and most reliable approach for most features:

```tsx
// src/hooks/usePolling.ts
import { useEffect, useRef, useCallback } from 'react';

interface UsePollingOptions {
  interval: number;
  enabled?: boolean;
}

export function usePolling(callback: () => void, { interval, enabled = true }: UsePollingOptions) {
  const savedCallback = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    // Run immediately on mount
    savedCallback.current();

    timerRef.current = setInterval(() => {
      savedCallback.current();
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [interval, enabled]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { stop };
}
```

**Usage in a page component:**
```tsx
function RentbitPage() {
  const refreshStatus = useCallback(async () => {
    try {
      const status = await invoke<RentbitStatus>('cmd_get_rentbit_status');
      setRentbitStatus(status);
    } catch {
      // handle error
    }
  }, []);

  // Poll every 15 seconds, pause when tab is not active
  const [isVisible, setIsVisible] = useState(true);
  usePolling(refreshStatus, { interval: 15000, enabled: isVisible });

  // Pause polling when tab is hidden
  useEffect(() => {
    const onVisChange = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisChange);
    return () => document.removeEventListener('visibilitychange', onVisChange);
  }, []);

  // ... render
}
```

**Polling guidelines** (from multiple 2025-2026 sources):
- **15-60 seconds** for dashboards and status updates
- **Pause when tab is hidden** (`document.hidden`) — don't waste resources
- **Pause when window is unfocused** for battery conservation
- **Add jitter** to prevent thundering herd in multi-window scenarios
- **Never poll faster than 5 seconds** for non-critical data

### 3.4 SSE for Server-Push (When Needed)

If PINC needs to receive push notifications from the backend (new messages, wager matches, security alerts):

```tsx
// src/hooks/useSSE.ts
import { useEffect, useRef, useState } from 'react';

export function useSSE(url: string) {
  const [data, setData] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);
    es.onmessage = (event) => {
      setData(JSON.parse(event.data));
    };
    es.onerror = () => {
      setConnected(false);
      // Auto-reconnect is built into EventSource API
    };

    return () => es.close();
  }, [url]);

  return { data, connected };
}
```

**Why SSE over WebSocket for one-way push?**
- SSE auto-reconnects for free (WebSocket requires custom logic)
- SSE works over standard HTTP (WebSocket requires protocol upgrade)
- SSE has `Last-Event-ID` for resume capability
- WebSocket is overkill unless you need client→server messages without HTTP overhead

### 3.5 Real-time Update Display Patterns

For live data in PINC (active rentals, earnings, network status):

```tsx
// Pattern: Optimistic update with real-time sync
function WalletBalance({ balance }: { balance: WalletBalance | null }) {
  const [displayValue, setDisplayValue] = useState(balance?.total ?? 0);
  const [isUpdating, setIsUpdating] = useState(false);

  // Update display on prop change with animation
  useEffect(() => {
    if (balance?.total !== undefined) {
      setIsUpdating(true);
      // Animate number change
      const start = displayValue;
      const end = balance.total;
      const duration = 500;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setDisplayValue(start + (end - start) * progress);
        if (progress < 1) requestAnimationFrame(animate);
        else setIsUpdating(false);
      };
      requestAnimationFrame(animate);
    }
  }, [balance?.total]);

  return (
    <div style={{ position: 'relative' }}>
      <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--neon-green)' }}>
        {formatPINC(displayValue)}
      </span>
      {isUpdating && (
        <span
          style={{
            position: 'absolute',
            top: -4,
            right: -8,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--neon-green)',
            animation: 'pulse-glow 1s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
}
```

---

## 4. Empty State Design

### 4.1 Empty State Types

PINC already has an `EmptyState` component in `JobsPage.tsx:602-610`. It's functional but could be enhanced.

| Type | When | Goal | PINC Pages |
|------|------|------|------------|
| **First-use** | User just arrived, nothing created yet | Explain value + one primary CTA | Jobs, Wagers, Tournaments, Rentbit |
| **No results** | Search/filter returned nothing | Explain why + suggest recovery | Jobs browse, Rankings |
| **Cleared** | User finished/deleted everything | Confirm completion + next action | Earnings history, Vault |
| **Error** | Network or server failure | Reassure + retry | Any page with data loading |

### 4.2 Enhanced Empty State Component

```tsx
// src/components/shared/EmptyState.tsx
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'first-use' | 'no-results' | 'cleared' | 'error';
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  variant = 'first-use',
}: EmptyStateProps) {
  return (
    <div
      role="status"
      style={{
        textAlign: 'center',
        padding: '3rem 1.5rem',
        maxWidth: 360,
        margin: '0 auto',
      }}
    >
      {/* Ghost preview for first-use variant */}
      {variant === 'first-use' && (
        <div
          aria-hidden="true"
          style={{
            width: '100%',
            height: 48,
            marginBottom: '1.5rem',
            border: '1px dashed var(--border)',
            borderRadius: 6,
            opacity: 0.3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '0 16px',
          }}
        >
          <div style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--border)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: '60%', height: 8, borderRadius: 4, background: 'var(--border)', marginBottom: 4 }} />
            <div style={{ width: '40%', height: 6, borderRadius: 4, background: 'var(--border)' }} />
          </div>
        </div>
      )}

      <Icon
        size={variant === 'first-use' ? 48 : 36}
        style={{
          color: variant === 'error' ? 'var(--neon-red)' : 'var(--text-muted)',
          margin: '0 auto 12px',
        }}
      />

      <h3 style={{
        fontSize: variant === 'first-use' ? '1rem' : '0.9rem',
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: 6,
      }}>
        {title}
      </h3>

      <p style={{
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
        marginBottom: action ? 20 : 0,
      }}>
        {description}
      </p>

      {action && (
        <button
          type="button"
          className="pinc-btn pinc-btn-primary"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}

      {secondaryAction && (
        <button
          type="button"
          className="pinc-btn"
          onClick={secondaryAction.onClick}
          style={{ marginTop: 8 }}
        >
          {secondaryAction.label}
        </button>
      )}
    </div>
  );
}
```

### 4.3 Page-Specific Empty States

**Jobs Page:**
```tsx
<EmptyState
  variant="first-use"
  icon={Briefcase}
  title="No jobs yet"
  description="Create your first job post or browse available work to start earning PINC."
  action={{ label: 'Create a Job', onClick: openCreateJob }}
  secondaryAction={{ label: 'Browse Jobs', onClick: () => setTab('browse') }}
/>
```

**Wagers Page:**
```tsx
<EmptyState
  variant="first-use"
  icon={Trophy}
  title="No active wagers"
  description="Challenge someone to a wager or join a tournament to compete for PINC."
  action={{ label: 'Create a Wager', onClick: openCreateWager }}
  secondaryAction={{ label: 'View Tournaments', onClick: showTournaments }}
/>
```

**Rentbit Page (no active rentals):**
```tsx
<EmptyState
  variant="first-use"
  icon={Server}
  title="Your device is idle"
  description="Rent out your compute resources to earn passive PINC income."
  action={{ label: 'Start Hosting', onClick: openHostingSetup }}
/>
```

**Search/No results:**
```tsx
<EmptyState
  variant="no-results"
  icon={Search}
  title="No results found"
  description="Try adjusting your search terms or clearing filters to see more results."
  action={{ label: 'Clear Filters', onClick: clearFilters }}
/>
```

**Error state:**
```tsx
<EmptyState
  variant="error"
  icon={AlertCircle}
  title="Failed to load data"
  description="Something went wrong while fetching your data. Please try again."
  action={{ label: 'Retry', onClick: retry }}
/>
```

### 4.4 Onboarding Flow Design

For new PINC users, use a **checklist-style onboarding** (like Linear) rather than a modal tour:

```tsx
// src/components/shared/OnboardingChecklist.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, X, ArrowRight } from 'lucide-react';

interface OnboardingItem {
  id: string;
  label: string;
  description: string;
  action: () => void;
  completed: boolean;
}

interface OnboardingChecklistProps {
  items: OnboardingItem[];
  onDismiss: () => void;
}

export function OnboardingChecklist({ items, onDismiss }: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false);

  // Persist dismissal
  useEffect(() => {
    const wasDismissed = localStorage.getItem('pinc-onboarding-dismissed');
    if (wasDismissed) setDismissed(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pinc-onboarding-dismissed', 'true');
    onDismiss();
  };

  if (dismissed) return null;

  const completedCount = items.filter((i) => i.completed).length;
  const progress = (completedCount / items.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '1rem',
        marginBottom: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Get Started
        </h3>
        <button
          type="button"
          onClick={handleDismiss}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
          aria-label="Dismiss onboarding"
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginBottom: 12 }}>
        <div
          style={{
            height: '100%',
            background: 'var(--electric-blue)',
            borderRadius: 2,
            width: `${progress}%`,
            transition: 'width 0.3s',
          }}
        />
      </div>

      {/* Checklist items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={item.action}
            disabled={item.completed}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '0.5rem 0.6rem',
              background: item.completed ? 'rgba(57,255,20,0.05)' : 'transparent',
              border: '1px solid ' + (item.completed ? 'rgba(57,255,20,0.2)' : 'var(--border)'),
              borderRadius: 6,
              cursor: item.completed ? 'default' : 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.2s',
            }}
          >
            {item.completed ? (
              <CheckCircle2 size={16} style={{ color: 'var(--neon-green)', flexShrink: 0 }} />
            ) : (
              <Circle size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: 500,
                color: item.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                textDecoration: item.completed ? 'line-through' : 'none',
              }}>
                {item.label}
              </span>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {item.description}
              </p>
            </div>
            {!item.completed && <ArrowRight size={12} style={{ color: 'var(--electric-blue)' }} />}
          </button>
        ))}
      </div>

      {completedCount === items.length && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ fontSize: '0.75rem', color: 'var(--neon-green)', textAlign: 'center', marginTop: 12 }}
        >
          You're all set! Start exploring PINC.
        </motion.p>
      )}
    </motion.div>
  );
}
```

**Onboarding checklist items for PINC:**
```tsx
const ONBOARDING_ITEMS = [
  {
    id: 'identity',
    label: 'Set up your identity',
    description: 'Create your node identity to get started',
    action: () => navigate('/profile'),
    completed: !!identity,
  },
  {
    id: 'wallet',
    label: 'Back up your seed phrase',
    description: 'Secure your wallet with a seed phrase backup',
    action: () => navigate('/wallet/backup'),
    completed: seedPhraseBackedUp,
  },
  {
    id: 'first-job',
    label: 'Post your first job',
    description: 'Create a job listing to find talent on the network',
    action: () => navigate('/jobs/create'),
    completed: myJobs.length > 0,
  },
  {
    id: 'hosting',
    label: 'Enable device hosting',
    description: 'Start earning passive income by renting your resources',
    action: () => navigate('/rentbit'),
    completed: rentbitStatus?.qualified,
  },
];
```

**Onboarding design principles** (from Carbon Design System, Nextcraft):
1. **Non-blocking** — user can ignore the checklist and use the product immediately
2. **Progressive** — items unlock as earlier ones are completed
3. **Celebratory** — each completion is acknowledged (satisfying, not patronizing)
4. **Dismissible** — power users who don't need it can get rid of it
5. **Persistent** — remember dismissal in localStorage

---

## 5. Summary of Recommendations for PINC

### Immediate Wins (No new dependencies)

1. **Add focus-visible styles** to all `.pinc-btn` elements — WCAG 2.2 requirement
2. **Fix disabled states** — use `aria-disabled` instead of `disabled` attribute on buttons that should remain focusable
3. **Add `aria-live="polite"`** to existing toast notifications
4. **Enhance EmptyState** — add ghost preview rows, action buttons, and variant-specific copy
5. **Add onboarding checklist** — reuse existing data to show progress

### Short-term (1-2 sprints)

6. **Extract Toast and ConfirmDialog** as shared components
7. **Add loading states to all action buttons** (especially in Jobs, Wagers, Rentbit)
8. **Implement StepWizard** for multi-step creation flows
9. **Add polling hooks** with visibility detection to all data-fetching pages
10. **Standardize validation** — move ad-hoc validation to a consistent pattern

### Medium-term (2-4 sprints)

11. **Add React Hook Form + Zod** for all creation forms
12. **Implement SSE** for push notifications (security alerts, new messages)
13. **Add optimistic updates** for wallet balance and earnings
14. **Build a shared notification/toast system** that works across all pages
15. **Create a design system documentation** for button states, form patterns, and empty states

---

## Sources

- NN/g: [Button States: Communicate Interaction](https://www.nngroup.com/articles/button-states-communicate-interaction/) (2025)
- NN/g: [Confirmation Dialogs](https://www.nngroup.com/articles/confirmation-dialog/) (2018)
- NN/g: [Modal & Nonmodal Dialogs](https://www.nngroup.com/articles/modal-nonmodal-dialog/) (2017)
- Figma: [Understanding Button States in UI Design](https://www.figma.com/resource-library/button-states/)
- UXPin: [Button States Explained: Complete Design Guide](https://www.uxpin.com/studio/blog/button-states/) (2026)
- UXPatterns.dev: [Button Pattern](https://uxpatterns.dev/patterns/forms/button)
- LogRocket: [Designing Button States](https://blog.logrocket.com/ux-design/designing-button-states/) (2025)
- Smart Interface Design Patterns: [Designing Better Loading & Progress UX](https://smart-interface-design-patterns.com/articles/designing-better-loading-progress-ux/)
- Frontend Patterns: [Loading State](https://frontendpatterns.dev/loading-state)
- Paste (Twilio): [Notifications and Feedback Patterns](https://paste.twilio.design/patterns/notifications-and-feedback)
- Human Standards: [Notifications & Feedback](https://www.humanstandards.org/interaction-patterns/notifications-feedback/)
- Vitaly Friedman: [Toasts & Snackbars UX Guidelines](https://www.linkedin.com/pulse/toasts-snackbars-ux-guidelines-vitaly-friedman-6peze) (2025)
- Carbon Design System: [Empty States Pattern](https://carbondesignsystem.com/patterns/empty-states-pattern/)
- 72Technologies: [Empty States as Onboarding](https://www.72technologies.com/blog/empty-states-as-onboarding-surface) (2026)
- Northbase: [Empty States Best Practices](https://www.northbase.design/patterns/empty-states)
- Smashing Magazine: [How To Manage Dangerous Actions](https://www.smashingmagazine.com/2024/09/how-manage-dangerous-actions-user-interfaces/) (2024)
- Vercel Geist: [Destructive Action Modal](https://vercel.com/geist/destructive-action-modal)
- Frontend Patterns: [Choosing a Networking Style for Realtime Apps](https://frontendpatterns.dev/guides/choosing-a-networking-style-for-realtime-apps) (2026)
- Veld Systems: [Real Time Architecture Guide](https://veldsystems.com/blog/real-time-architecture-guide) (2026)
- Static Forms: [Multi Step Forms Guide](https://www.staticforms.dev/blog/multi-step-forms) (2026)
- OrbitForms: [Multi-Step Form Design Guide](https://orbitforms.ai/blog/multi-step-form-design-guide) (2026)
