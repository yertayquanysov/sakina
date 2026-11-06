import { NavLink, useLocation } from 'react-router-dom'
import { BookOpenText, Clock3, House, MapPin, Sparkles } from 'lucide-react'
import { cx } from './ui'

const items = [
  { to: '/', label: 'Home', icon: House },
  { to: '/quran', label: 'Quran', icon: BookOpenText },
  { to: '/zikr', label: 'Zikr', icon: Sparkles },
  { to: '/namaz', label: 'Namaz', icon: Clock3 },
  { to: '/map', label: 'Map', icon: MapPin },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-50 border-t border-line">
      <div className="mx-auto grid max-w-md grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active =
            item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="group relative flex h-[58px] flex-col items-center justify-center gap-1"
            >
              <span
                className={cx(
                  'absolute top-0 h-[2px] w-7 rounded-full transition-opacity',
                  active ? 'bg-ink opacity-100' : 'opacity-0',
                )}
              />
              <Icon
                size={19}
                strokeWidth={active ? 2.1 : 1.7}
                className={cx(
                  'transition-colors',
                  active ? 'text-ink' : 'text-muted group-active:text-ink',
                )}
              />
              <span
                className={cx(
                  'text-[9.5px] font-medium transition-colors',
                  active ? 'text-ink' : 'text-muted',
                )}
              >
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
