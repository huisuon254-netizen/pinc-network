import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion } from 'framer-motion';
import { Brain, Key, Send, Loader2, Shield, Zap } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

interface AgentCard { id: string; name: string; agent_type: string; active: boolean; accuracy: number; inferences_run: number; }

export default function AiPage() {
  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [inferring, setInferring] = useState(false);
  const [groqKey, setGroqKey] = useState('');
  const [groqSaved, setGroqSaved] = useState(false);
  const { settings, saveSettings } = useAppStore();

  useEffect(() => {
    invoke<any[]>('cmd_get_ai_agents').then(data => {
      setAgents(data.map(a => ({
        id: a.id ?? '', name: a.name ?? '', agent_type: a.agent_type ?? '',
        active: a.active ?? false, accuracy: a.accuracy ?? 0, inferences_run: a.inferences_run ?? 0,
      })));
    }).catch(console.error);
    if (settings?.groq_api_key) setGroqKey(settings.groq_api_key);
  }, [settings]);

  const saveGroqKey = async () => {
    if (!settings) return;
    await saveSettings({ ...settings, groq_api_key: groqKey });
    setGroqSaved(true);
    setTimeout(() => setGroqSaved(false), 2000);
  };

  const runInference = async () => {
    if (!prompt.trim()) return;
    setInferring(true);
    setResponse(null);
    try {
      const result = await invoke<any>('cmd_run_ai_inference', { prompt: prompt.trim() });
      setResponse(result.llm_response ?? 'No response');
    } catch (e) {
      setResponse(`Error: ${e}`);
    } finally {
      setInferring(false);
    }
  };

  const activeCount = agents.filter(a => a.active).length;
  const avgAccuracy = agents.length ? agents.reduce((s,a) => s+a.accuracy, 0) / agents.length : 0;
  const totalInferences = agents.reduce((s,a) => s+a.inferences_run, 0);

  return (
    <div style={{ padding:'2rem', maxWidth:'900px' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.2em', marginBottom:'0.25rem' }}>DISTRIBUTED INTELLIGENCE</div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ fontSize:'1.25rem', fontWeight:700 }}>AI Engine</div>
          <span className="badge badge-purple">PHASE 11</span>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'0.75rem', marginBottom:'1.5rem' }}>
        {[
          { l:'AGENTS', v:String(activeCount), c:'var(--neon-green)' },
          { l:'INFERENCES', v:totalInferences > 1000 ? `${(totalInferences/1000).toFixed(0)}K` : String(totalInferences), c:'var(--electric-blue)' },
          { l:'FRAUD STOPPED', v:'0', c:'var(--neon-red)' },
          { l:'ACCURACY', v:`${(avgAccuracy*100).toFixed(0)}%`, c:'var(--neon-cyan)' },
        ].map(s => (
          <div key={s.l} className="pinc-card"><div style={{ fontSize:'0.6rem', color:'var(--text-muted)', marginBottom:'4px' }}>{s.l}</div>
          <div style={{ fontFamily:'monospace', fontSize:'1.1rem', fontWeight:700, color:s.c }}>{s.v}</div></div>
        ))}
      </div>

      {/* Groq API Key Config */}
      <div className="pinc-card" style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'0.75rem' }}>
          <Key size={12} style={{ display:'inline', marginRight:'6px' }}/>GROQ API KEY
        </div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <input className="pinc-input" type="password" value={groqKey} onChange={e => setGroqKey(e.target.value)}
            placeholder="gsk_..." style={{ flex:1 }} />
          <button className="pinc-btn" onClick={saveGroqKey} style={{ fontSize:'0.72rem' }}>
            {groqSaved ? '✓ SAVED' : 'SAVE KEY'}
          </button>
        </div>
        <div style={{ fontSize:'0.62rem', color:'var(--text-muted)', marginTop:'0.5rem' }}>
          Set your Groq API key to enable external LLM inference. Get a free key at console.groq.com
        </div>
      </div>

      {/* Inference Console */}
      <div className="pinc-card" style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'0.75rem' }}>
          <Brain size={12} style={{ display:'inline', marginRight:'6px' }}/>INFERENCE CONSOLE
        </div>
        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'0.75rem' }}>
          <input className="pinc-input" value={prompt} onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runInference()}
            placeholder="Enter a prompt for AI analysis..." style={{ flex:1 }} />
          <button className="pinc-btn pinc-btn-primary" onClick={runInference} disabled={inferring || !prompt.trim()}>
            {inferring ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Send size={14}/>}
            {inferring ? 'ANALYZING...' : 'RUN'}
          </button>
        </div>
        {response && (
          <div style={{ padding:'1rem', background:'var(--bg-secondary)', borderRadius:'4px', fontSize:'0.8rem', color:'var(--text-primary)', lineHeight:1.7, whiteSpace:'pre-wrap', fontFamily:'monospace' }}>
            {response}
          </div>
        )}
      </div>

      {/* Agent Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'0.75rem', marginBottom:'1.5rem' }}>
        {agents.length === 0 ? (
          <div className="pinc-card" style={{ gridColumn:'1/-1', textAlign:'center', padding:'2rem', color:'var(--text-muted)', fontSize:'0.72rem' }}>
            <Brain size={24} style={{ margin:'0 auto 0.5rem', opacity:0.3 }} />
            No AI agents configured. Agents will appear here once the network grows.
          </div>
        ) : agents.map((agent, i) => {
          const color = agent.active ? 'var(--neon-green)' : 'var(--text-muted)';
          return (
            <motion.div key={agent.id || i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.06 }} className="pinc-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.75rem' }}>
                <div>
                  <div style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text-primary)' }}>{agent.name}</div>
                  <div style={{ fontSize:'0.62rem', color:'var(--text-muted)', marginTop:'2px' }}>{agent.agent_type}</div>
                </div>
                <span style={{ fontSize:'0.6rem', color, padding:'2px 6px', border:`1px solid ${color}33`, borderRadius:'3px' }}>
                  {agent.active ? 'ACTIVE' : 'STANDBY'}
                </span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                <span style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>Accuracy</span>
                <span style={{ fontFamily:'monospace', fontSize:'0.65rem', color }}>{(agent.accuracy*100).toFixed(0)}%</span>
              </div>
              <div style={{ height:'4px', background:'var(--bg-elevated)', borderRadius:'2px', marginBottom:'8px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${agent.accuracy*100}%`, background:color, borderRadius:'2px' }} />
              </div>
              <div style={{ fontSize:'0.62rem', color:'var(--text-muted)' }}>{agent.inferences_run.toLocaleString()} inferences</div>
            </motion.div>
          );
        })}
      </div>

      {/* Model Sharding */}
      <div className="pinc-card">
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'0.75rem' }}>DISTRIBUTED MODEL SHARDING</div>
        <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)', lineHeight:1.7 }}>
          AI models are sharded across participating nodes. Each node hosts a portion and contributes compute during inference. Rewards are split proportionally.
        </div>
        <div style={{ display:'flex', gap:'4px', marginTop:'1rem' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ flex:1, height:'24px', borderRadius:'3px', background: i < 5 ? 'var(--electric-blue)' : 'var(--bg-elevated)',
              border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'0.55rem', color: i < 5 ? 'var(--bg-primary)' : 'var(--text-muted)' }}>S{i+1}</div>
          ))}
        </div>
        <div style={{ fontSize:'0.62rem', color:'var(--text-muted)', marginTop:'4px' }}>5/8 shards hosted locally</div>
      </div>
    </div>
  );
}
