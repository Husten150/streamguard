import React, { useState } from 'react';
import { GRANT_STRATEGY_CONTENT } from '../contracts/rustSource';
import { Award, Copy, Check, Sparkles, CheckCircle2, Calendar } from 'lucide-react';

export const GrantStrategySection: React.FC = () => {
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(GRANT_STRATEGY_CONTENT.elevatorPitch);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  const handleCopyFullMarkdown = () => {
    const md = `# StreamGuard: Stellar Drips Wave Grant Submission

## 1. Elevator Pitch
${GRANT_STRATEGY_CONTENT.elevatorPitch}

## 2. Technical Differentiators on Stellar Soroban
${GRANT_STRATEGY_CONTENT.technicalDifferentiators
  .map((d) => `### ${d.title} [${d.tag}]\n${d.desc}`)
  .join('\n\n')}

## 3. Post-Hackathon Mainnet Launch Roadmap
${GRANT_STRATEGY_CONTENT.milestones
  .map(
    (m) => `### Milestone ${m.number}: ${m.title} (${m.duration})\n` +
      m.deliverables.map((del) => `- ${del}`).join('\n')
  )
  .join('\n\n')}
`;
    navigator.clipboard.writeText(md);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2000);
  };

  return (
    <div>
      {/* Header */}
      <div className="section-banner">
        <div>
          <div className="eyebrow">
            <Award style={{ width: 14, height: 14 }} />
            Stellar Drips Wave • Hackathon Grant Package
          </div>
          <h2 className="banner-heading">
            Submission Strategy & Technical Blueprint
          </h2>
          <p className="banner-subtitle">
            A comprehensive, battle-tested grant dossier tailored to Stellar Foundation reviewers and Soroban core engineers.
          </p>
        </div>

        <button
          onClick={handleCopyFullMarkdown}
          className="btn btn-primary"
        >
          {copiedFull ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
          {copiedFull ? 'Full Markdown Copied!' : 'Copy Entire Grant Application'}
        </button>
      </div>

      {/* 3-Sentence Elevator Pitch */}
      <div className="panel-card" style={{ marginBottom: '24px', border: '1px solid var(--border-emerald)', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="status-dot" />
            <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-emerald)' }}>
              3-Sentence Elevator Pitch (Reviewer Executive Summary)
            </h3>
          </div>
          <button
            onClick={handleCopyPitch}
            className="btn btn-secondary"
            style={{ fontSize: '11px', padding: '4px 10px' }}
          >
            {copiedPitch ? <Check style={{ width: 12, height: 12, color: 'var(--accent-emerald)' }} /> : <Copy style={{ width: 12, height: 12 }} />}
            {copiedPitch ? 'Copied' : 'Copy Pitch'}
          </button>
        </div>

        <blockquote style={{ fontSize: '15px', fontStyle: 'italic', lineHeight: 1.6, borderLeft: '3px solid var(--accent-emerald)', paddingLeft: '16px', color: '#ffffff' }}>
          "{GRANT_STRATEGY_CONTENT.elevatorPitch}"
        </blockquote>
      </div>

      {/* Technical Differentiators Grid */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Sparkles style={{ width: 16, height: 16, color: 'var(--accent-emerald)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
            Technical Differentiators Highlighting Stellar & Soroban
          </h3>
        </div>

        <div className="grid-cols-2">
          {GRANT_STRATEGY_CONTENT.technicalDifferentiators.map((diff, idx) => (
            <div
              key={idx}
              className="panel-card"
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="stream-id-badge">
                  {diff.tag}
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>#0{idx + 1}</span>
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>{diff.title}</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{diff.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3-Milestone Launch Roadmap */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Calendar style={{ width: 16, height: 16, color: 'var(--accent-teal)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
            Post-Hackathon 3-Milestone Mainnet Launch Roadmap
          </h3>
        </div>

        <div className="grid-cols-3">
          {GRANT_STRATEGY_CONTENT.milestones.map((ms) => (
            <div
              key={ms.number}
              className="panel-card"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="brand-icon" style={{ width: 28, height: 28, fontSize: '13px', borderRadius: 'var(--radius-sm)' }}>
                    {ms.number}
                  </span>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{ms.duration}</span>
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>{ms.title}</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', borderTop: '1px solid var(--border-dim)', paddingTop: '12px' }}>
                  {ms.deliverables.map((del, dIdx) => (
                    <li key={dIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-secondary)' }}>
                      <CheckCircle2 style={{ width: 14, height: 14, color: 'var(--accent-emerald)', flexShrink: 0, marginTop: 2 }} />
                      <span style={{ lineHeight: 1.4 }}>{del}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
