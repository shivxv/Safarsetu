import { Bike, Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'

const currentYear = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-slate-950 text-white">
      <div className="container-shell grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Link to="/" className="flex items-center gap-2"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500"><Bike size={22} /></span><span className="text-xl font-black">SafarSetu</span></Link>
          <p className="mt-5 max-w-xs text-sm leading-7 text-slate-400">Aapka Safar, Hamara Saath.</p>
          <p className="mt-2 max-w-xs text-xs leading-6 text-slate-500">Launching locally in Greater Noida with Bike and Auto rides.</p>
        </div>
        <div><h3 className="text-sm font-bold">Company</h3><div className="mt-5 flex flex-col gap-3 text-sm text-slate-400"><Link to="/about" className="hover:text-white">About Us</Link><Link to="/contact" className="hover:text-white">Contact</Link><Link to="/support" className="hover:text-white">Support</Link></div></div>
        <div><h3 className="text-sm font-bold">Legal</h3><div className="mt-5 flex flex-col gap-3 text-sm text-slate-400"><Link to="/terms" className="hover:text-white">Terms</Link><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></div></div>
        <div>
          <h3 className="text-sm font-bold">Contact</h3>
          <div className="mt-5 space-y-3 text-sm text-slate-400">
            <p className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-emerald-500" />Greater Noida, Uttar Pradesh</p>
            <a href="tel:+917820092916" className="flex items-center gap-2 hover:text-white"><Phone size={16} className="text-emerald-500" />+91 7820092916</a>
            <a href="mailto:safarsetuuu@gmail.com" className="flex items-center gap-2 hover:text-white"><Mail size={16} className="text-emerald-500" />safarsetuuu@gmail.com</a>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800"><div className="container-shell flex flex-col gap-2 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>© {currentYear} SafarSetu. All rights reserved.</p><p>Demo website — booking confirmed only after backend verification.</p></div></div>
    </footer>
  )
}
