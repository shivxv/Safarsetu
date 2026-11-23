import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, Bike, X } from 'lucide-react'
import { useLanguage } from '../../context/useLanguage'

const navItems = [
  ['Home', '/'],
  ['Book a Ride', '/book-ride'],
  ['How It Works', '/#how-it-works'],
  ['About Us', '/about'],
  ['Contact', '/contact'],
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { language, t, toggleLanguage } = useLanguage()

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
      <div className="container-shell flex h-[72px] items-center justify-between">
        <Link to="/" className="flex items-center gap-2" aria-label="SafarSetu home">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500 text-white shadow-sm">
            <Bike size={23} strokeWidth={2.5} />
          </span>
          <div>
            <div className="text-xl font-black tracking-tight text-slate-950">SafarSetu</div>
            <div className="hidden text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 sm:block">Aapka Safar, Hamara Saath</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {navItems.map(([label, to]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `text-sm font-semibold transition ${isActive ? 'text-emerald-600' : 'text-slate-600 hover:text-slate-950'}`}>
              {t(label)}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <button type="button" onClick={toggleLanguage} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold" aria-label="Change language">{language === 'en' ? 'हिंदी' : 'English'}</button>
          <Link to="/login" className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-emerald-600">{t('Login')}</Link>
          <Link to="/register" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-600">{t('Sign Up')}</Link>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 lg:hidden" aria-expanded={open} aria-label="Toggle menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden" aria-label="Mobile navigation">
          <div className="container-shell flex flex-col gap-1">
            {navItems.map(([label, to]) => (
              <Link key={to} to={to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">{t(label)}</Link>
            ))}
            <button type="button" onClick={toggleLanguage} className="mt-2 rounded-lg border border-slate-200 px-3 py-3 text-left text-sm font-bold">{language === 'en' ? 'हिंदी में देखें' : 'View in English'}</button>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Link to="/login" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-bold">{t('Login')}</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white">{t('Sign Up')}</Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
