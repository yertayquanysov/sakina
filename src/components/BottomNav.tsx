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
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-md px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <div className="glass pointer-events-auto grid h-[68px] grid-cols-5 items-center rounded-[26px] border border-line/80 shadow-float">
          {items.map((item) => {
            const active =
              item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="group relative flex h-full flex-col items-center justify-center gap-1"
              >
                <span
                  className={cx(
                    'grid h-9 w-11 place-items-center rounded-2xl transition-all duration-300',
                    active
                      ? 'bg-brand text-gold-soft shadow-[0_6px_16px_-6px_rgb(11_59_46/0.8)]'
                      : 'text-muted group-active:scale-90',
                  )}
                >
                  <Icon size={19} strokeWidth={active ? 2.3 : 1.9} />
                </span>
                <span
                  className={cx(
                    'text-[10px] font-semibold tracking-wide transition-colors',
                    active ? 'text-brand dark:text-gold' : 'text-muted',
                  )}
                >
                  {item.label}
                </span>
              </NavLink>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
