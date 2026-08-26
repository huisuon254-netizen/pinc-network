import { useAppStore } from '../../../store/appStore';

export const AGENT_SETTINGS_HASH = '#p2p-agent';

export function openBecomeAgent() {
  try {
    window.location.hash = AGENT_SETTINGS_HASH;
  } catch {}
  useAppStore.getState().setActiveTab('settings');
}
