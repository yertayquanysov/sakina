import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'
import Logo from './Logo'
import { Sheet } from './ui'
import { useApp } from '../lib/app-context'

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

const DISMISS_KEY = 'sakina:install-dismissed'

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export default function InstallPrompt() {
  const { settings } = useApp()
  const [deferred, setDeferred] = useState<BIPEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    const dismissed = Number(localStorage.getItem(DISMISS_KEY) || 0)
    if (dismissed && Date.now() - dismissed < 1000 * 60 * 60 * 24 * 14) return

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BIPEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)

    let timer: number | undefined
    if (isIOS()) {
      timer = window.setTimeout(() => setVisible(true), 9000)
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      if (timer) window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (deferred) {
      const timer = window.setTimeout(() => setVisible(true), 7000)
      return () => window.clearTimeout(timer)
    }
  }, [deferred])

  if (!settings.onboarded || !visible) return null

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
  }

  const install = async () => {
    if (deferred) {
      await deferred.prompt()
      await deferred.userChoice
      setDeferred(null)
      setVisible(false)
    } else {
      setShowHelp(true)
    }
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-[calc(4.6rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md px-3">
        <div className="animate-fade-up flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5 pr-2 shadow-float">
          <Logo size={36} />
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-medium leading-tight">Install Sakina</p>
            <p className="truncate text-[10.5px] text-muted">
              Full screen, faster, works offline
            </p>
          </div>
          <button
            onClick={install}
            className="tap flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[11.5px] font-semibold text-white"
          >
            <Download size={13} /> Add
          </button>
          <button
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="grid h-7 w-7 place-items-center rounded-full text-muted"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <Sheet
        open={showHelp}
        onClose={() => setShowHelp(false)}
        title="Add to Home Screen"
        subtitle="Sakina runs like a native app"
      >
        <div className="space-y-4 pb-2">
          <div className="flex gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface2 text-[11.5px] font-medium text-muted">
              1
            </span>
            <p className="text-[12.5px] leading-relaxed text-muted">
              Tap the <Share size={14} className="inline text-ink" /> Share button in
              your browser toolbar.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface2 text-[11.5px] font-medium text-muted">
              2
            </span>
            <p className="text-[12.5px] leading-relaxed text-muted">
              Choose <span className="font-medium text-ink">Add to Home Screen</span>,
              then confirm.
            </p>
          </div>
          <div className="rounded-xl bg-surface2 px-3.5 py-3 text-[11px] leading-relaxed text-muted">
            On Chrome for Android, open the menu and tap{' '}
            <span className="font-medium text-ink">Install app</span>.
          </div>
        </div>
      </Sheet>
    </>
  )
}
