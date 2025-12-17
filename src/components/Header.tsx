import { Languages, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n, { LANGUAGE_STORAGE_KEY } from '../i18n/i18n'
import { cn } from '../lib/utils'
import { useTheme } from './theme-provider'

export default function Header() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()

  const lang = i18n.language === 'fr' ? 'fr' : 'en'

  function toggleLanguage(): void {
    const next = lang === 'en' ? 'fr' : 'en'
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next)
    void i18n.changeLanguage(next)
    document.documentElement.lang = next
  }

  return (
    <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="min-w-0">
          <div className="truncate bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-2xl font-bold text-transparent">
            {t('app.title')}
          </div>
          <div className="truncate text-sm text-muted-foreground">{t('app.tagline')}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span aria-hidden="true">🇫🇷</span>
            <span>{t('header.patents')}</span>
            <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] text-primary">
              {t('header.patentPending')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium',
              'bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground',
            )}
            onClick={toggleLanguage}
            aria-label={t('header.toggleLanguage')}
          >
            <Languages className="h-4 w-4" />
            <span>{lang.toUpperCase()}</span>
          </button>

          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium',
              'bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground',
            )}
            onClick={toggleTheme}
            aria-label={t('header.toggleTheme')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>{theme === 'dark' ? t('theme.dark') : t('theme.light')}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
