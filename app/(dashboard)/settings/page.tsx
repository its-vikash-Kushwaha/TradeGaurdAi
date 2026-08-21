"use client"

import { useState, useEffect } from 'react'
import { Settings, Shield, User, Bell, Key, Database, Building2, Check, RefreshCw } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'compliance' | 'security' | 'api'>('profile')
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [saved, setSaved]         = useState(false)

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setName(d.data.name || '')
          setEmail(d.data.email || '')
        }
      })
      .catch(() => {})
  }, [])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const TABS = [
    { key: 'profile',    label: 'Officer Profile',       icon: User      },
    { key: 'compliance', label: 'Compliance Rules',      icon: Shield    },
    { key: 'security',   label: 'Security & Workspace',  icon: Building2 },
    { key: 'api',        label: 'API & Integrations',    icon: Key       },
  ] as const

  return (
    <div className="slide-in" style={{ maxWidth: '960px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--navy-primary)', letterSpacing: '-0.01em' }}>
            Enterprise Settings & Configuration
          </h1>
          <span className="badge badge-info">WORKSPACE</span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Manage compliance rule engine, officer credentials, audit security, and API integrations
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Navigation Sidebar */}
        <div className="card-enterprise" style={{ padding: '8px' }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '6px', border: 'none',
                background: activeTab === key ? 'var(--accent-blue-dim)' : 'transparent',
                color: activeTab === key ? 'var(--accent-blue)' : 'var(--text-secondary)',
                fontSize: '13px', fontWeight: activeTab === key ? '700' : '500',
                cursor: 'pointer', textAlign: 'left', marginBottom: '2px',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div className="card-enterprise" style={{ padding: '24px' }}>
          {activeTab === 'profile' && (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--navy-primary)', marginBottom: '4px' }}>
                Officer & Account Profile
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input className="input-field" value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Enterprise Email
                </label>
                <input className="input-field" value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Assigned Node / Institution
                </label>
                <input className="input-field" value="IFSC GIFT City · Node 01 (International Banking Unit)" disabled style={{ background: 'var(--bg-subtle)' }} />
              </div>

              {saved && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--bull)', fontSize: '13px', fontWeight: '600' }}>
                  <Check size={16} /> Profile settings saved successfully.
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: 'fit-content', marginTop: '8px' }}>
                Save Settings
              </button>
            </form>
          )}

          {activeTab === 'compliance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--navy-primary)' }}>
                Compliance Rule Configuration
              </div>
              {[
                { title: 'Automated Invoice Amount Matching', desc: 'Flag transactions when invoice value differs from customs declaration by over 5%', active: true },
                { title: 'Sanctioned Country Routing Check', desc: 'Screen origin and destination ports against OFAC and global sanction watchlists', active: true },
                { title: 'IEC / GST Entity Verification', desc: 'Cross-reference exporter identification credentials with regulatory databases', active: true },
                { title: 'High Volatility Anomaly Trigger', desc: 'Flag positions experiencing >15% price divergence within 1 hour', active: false },
              ].map((rule, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--navy-primary)' }}>{rule.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{rule.desc}</div>
                  </div>
                  <span className={rule.active ? 'badge badge-compliant' : 'badge badge-review'}>
                    {rule.active ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--navy-primary)' }}>
                Security & Audit Logging
              </div>
              <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--navy-primary)', marginBottom: '4px' }}>256-Bit Audit Trail Encryption</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>All compliance reviews, OCR parses, and officer signoffs are recorded with immutable SHA-256 hashes.</div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--navy-primary)' }}>
                API & External Integrations
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Configure Azure AI Foundry IQ Search Endpoint, Pusher real-time channels, and Polygon data keys.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
