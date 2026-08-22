"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Search, BookOpen, Star, Settings,
  ShieldCheck, Radio, Brain, ClipboardList,
  Building2, ChevronRight, Lock, Shield, Workflow
} from 'lucide-react'

// Enterprise Light Grouped Navigation List
const NAV_GROUPS = [
  {
    title: 'OVERVIEW',
    items: [
      { href: '/feed', label: 'Command Center', icon: LayoutDashboard, badge: 'LIVE' },
    ],
  },
  {
    title: 'TRADE OPERATIONS',
    items: [
      { href: '/trades', label: 'Transactions & Log', icon: ClipboardList },
      { href: '/watchlist', label: 'Counterparty Watchlist', icon: Star },
    ],
  },
  {
    title: 'COMPLIANCE & RISK',
    items: [
      { href: '/mind', label: 'Risk & Regime Engine', icon: ShieldCheck, badge: 'HMM' },
      { href: '/compliance', label: 'Compliance', icon: Shield, badge: 'BEDROCK' },
      { href: '/orchestrator', label: 'Agent Orchestrator', icon: Workflow, badge: '5 AGENTS' },
    ],
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { href: '/copilot', label: 'AI Compliance Copilot', icon: Radio, badge: '6 AGENTS' },
      { href: '/research', label: 'Regulatory Terminal', icon: Search },
      { href: '/journal', label: 'Audit & Review Journal', icon: BookOpen },
    ],
  },
]

const SYSTEM_NAV = [
  { href: '/settings', label: 'Enterprise Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar-desktop" style={{
      width: '264px',
      background: '#FFFFFF',
      color: 'var(--navy-primary)',
      height: '100vh',
      position: 'sticky',
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      borderRight: '1px solid var(--border-default)',
      boxShadow: '1px 0 4px rgba(0, 0, 0, 0.03)',
    }}>
      {/* Brand Header */}
      <div style={{ padding: '20px 20px', borderBottom: '1px solid var(--border-default)' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            borderRadius: '9px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
          }}>
            <ShieldCheck size={20} color="white" />
          </div>
          <div>
            <div style={{
              fontSize: '16px', fontWeight: '800', color: 'var(--navy-primary)',
              letterSpacing: '-0.01em', lineHeight: 1.2,
              fontFamily: 'Inter, sans-serif',
            }}>
              TradeGuard AI
            </div>
            <div style={{
              fontSize: '11px', color: 'var(--text-muted)',
              fontWeight: '600', letterSpacing: '0.02em', marginTop: '2px',
            }}>
              Trade Risk & Compliance
            </div>
          </div>
        </Link>
      </div>

      {/* GIFT City Node Metadata Badge */}
      <div style={{
        margin: '12px 16px 4px',
        padding: '8px 12px',
        borderRadius: '8px',
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="pulse-dot" style={{ width: '6px', height: '6px' }} />
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--navy-primary)', letterSpacing: '0.02em' }}>
            IFSC GIFT City · Node 01
          </span>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--accent-blue)', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace' }}>
          IBU
        </span>
      </div>

      {/* Navigation Groups List */}
      <nav style={{
        flex: 1, padding: '14px 16px',
        overflowY: 'auto', display: 'flex',
        flexDirection: 'column', gap: '20px',
      }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <div style={{
              padding: '0 8px 8px',
              fontSize: '10px', fontWeight: '800',
              color: 'var(--text-muted)', letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>{group.title}</span>
              <div style={{ height: '1px', flex: 1, background: 'var(--border-default)', marginLeft: '10px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {group.items.map((link) => {
                const Icon = link.icon
                const isActive = pathname.startsWith(link.href)
                return (
                  <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                      background: isActive ? 'var(--accent-blue-dim)' : 'transparent',
                      border: `1px solid ${isActive ? 'rgba(37, 99, 235, 0.25)' : 'transparent'}`,
                      fontSize: '13px',
                      fontWeight: isActive ? '700' : '500',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}>
                      {/* Left active border indicator */}
                      {isActive && (
                        <div style={{
                          position: 'absolute', left: '-1px', top: '6px', bottom: '6px',
                          width: '3px', borderRadius: '0 2px 2px 0', background: 'var(--accent-blue)',
                        }} />
                      )}

                      {/* Icon container */}
                      <div style={{
                        width: '26px', height: '26px', borderRadius: '6px',
                        background: isActive ? 'var(--accent-blue)' : 'var(--bg-subtle)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                        flexShrink: 0,
                        transition: 'all 0.15s ease',
                      }}>
                        <Icon size={14} />
                      </div>

                      <span style={{ flex: 1 }}>{link.label}</span>

                      {/* Optional Badge pill */}
                      {link.badge && (
                        <span style={{
                          fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px',
                          background: isActive ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-subtle)',
                          color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)',
                          border: `1px solid ${isActive ? 'rgba(37, 99, 235, 0.3)' : 'var(--border-default)'}`,
                          fontFamily: 'JetBrains Mono, monospace',
                        }}>
                          {link.badge}
                        </span>
                      )}

                      {isActive && !link.badge && (
                        <ChevronRight size={12} color="var(--accent-blue)" />
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* System Section at Bottom */}
      <div style={{
        padding: '14px 16px', borderTop: '1px solid var(--border-default)',
        display: 'flex', flexDirection: 'column', gap: '8px',
        background: '#FFFFFF',
      }}>
        {SYSTEM_NAV.map((link) => {
          const Icon = link.icon
          const isActive = pathname.startsWith(link.href)
          return (
            <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '9px 12px', borderRadius: '8px',
                color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-blue-dim)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(37, 99, 235, 0.25)' : 'transparent'}`,
                fontSize: '13px', fontWeight: isActive ? '700' : '500',
              }}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '6px',
                  background: isActive ? 'var(--accent-blue)' : 'var(--bg-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                }}>
                  <Icon size={14} />
                </div>
                <span>{link.label}</span>
              </div>
            </Link>
          )
        })}

        {/* 256-bit Security Tag */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 12px', borderRadius: '6px',
          background: 'var(--bg-subtle)', border: '1px solid var(--border-default)',
          color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600',
        }}>
          <Lock size={12} color="var(--accent-blue)" />
          <span style={{ color: 'var(--text-secondary)' }}>256-bit Encrypted Audit Trail</span>
        </div>
      </div>
    </aside>
  )
}
