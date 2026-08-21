"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, Brain, ClipboardList, Settings, Shield } from 'lucide-react'

const TABS = [
  { href: '/feed',       label: 'Command',    icon: LayoutDashboard },
  { href: '/mind',       label: 'Risk',       icon: Brain           },
  { href: '/trades',     label: 'Trades',     icon: ClipboardList   },
  { href: '/compliance', label: 'Compliance', icon: Shield          },
  { href: '/journal',    label: 'Audit',      icon: BookOpen        },
  { href: '/settings',   label: 'Settings',   icon: Settings        },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bottom-nav">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              flex: 1, padding: '6px 4px',
              color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{
              padding: '3px 10px', borderRadius: '6px',
              background: active ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={18} />
            </div>
            <span style={{ fontSize: '10px', fontWeight: active ? '700' : '500' }}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
