import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight, BadgeCheck, Bike, CircleDollarSign, Clock3, LocateFixed,
  MapPin, Navigation, ShieldCheck, Sparkles, Users, WalletCards,
  ChevronDown, CarFront, Gift, CheckCircle2, AlertTriangle,
} from 'lucide-react'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import { appConfig, fallbackServiceZones } from './config/appConfig'
import { getCurrentLocation, locationService } from './services/locationService'
import { bookingService } from './services/bookingService'
import { authService } from './services/authService'
import { validateFareOffer } from './utils/businessRules'
import { useLanguage } from './context/useLanguage'
import { safetyService } from './services/safetyService'
import { connectToRide } from './services/trackingService'
import { customerService } from './services/customerService'
import { supportService } from './services/supportService'

const zones = fallbackServiceZones

function readSessionJSON(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

function BookingCard({ compact = false }) {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [pickup, setPickup] = useState(() => sessionStorage.getItem('safarsetu_pickup') || '')
  const [drop, setDrop] = useState(() => sessionStorage.getItem('safarsetu_drop') || '')
  const [vehicle, setVehicle] = useState('bike')
  const [error, setError] = useState('')
  const [locationBusy, setLocationBusy] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [suggestionFor, setSuggestionFor] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const query = suggestionFor === 'pickup' ? pickup : drop
    if (!suggestionFor || appConfig.demoMode || query.trim().length < 3) return undefined
    const timer = window.setTimeout(async () => {
      try {
        const response = await locationService.suggest(query)
        setSuggestions(response.data.suggestions || [])
      } catch (requestError) {
        setSuggestions([])
        setError(requestError.message || 'Location suggestions are temporarily unavailable.')
      }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [drop, pickup, suggestionFor])

  const useMyLocation = async () => {
    setLocationBusy(true)
    setError('')
    try {
      const coordinates = await getCurrentLocation()
      sessionStorage.setItem('safarsetu_pickup_coordinates', JSON.stringify(coordinates))
      setPickup('My current location')
    } catch (locationError) {
      setError(locationError.message)
    } finally {
      setLocationBusy(false)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!pickup.trim() || !drop.trim()) {
      setError('Please enter both pickup and destination locations.')
      return
    }
    setBusy(true)
    setError('')
    sessionStorage.setItem('safarsetu_pickup', pickup)
    sessionStorage.setItem('safarsetu_drop', drop)
    sessionStorage.setItem('safarsetu_vehicle', vehicle)
    sessionStorage.removeItem('safarsetu_request_key')
    sessionStorage.removeItem('safarsetu_booking_id')
    try {
      if (!appConfig.demoMode) {
        const coordinates = {
          pickup: readSessionJSON('safarsetu_pickup_coordinates'),
          destination: readSessionJSON('safarsetu_destination_coordinates'),
        }
        const coverage = await locationService.validateCoverage(pickup, drop, coordinates)
        if (!coverage.data.covered) {
          setError(coverage.data.message || 'This route is outside our current service area.')
          return
        }
        const route = await locationService.getRoute(pickup, drop, coordinates)
        sessionStorage.setItem('safarsetu_route', JSON.stringify(route.data))
      }
      navigate('/select-vehicle', { state: { pickup, drop, vehicle } })
    } catch (requestError) {
      setError(requestError.message || 'We could not validate this route. Please retry.')
    } finally {
      setBusy(false)
    }
  }

  const renderLocationInput = (type, value, setValue, label, placeholder, Icon) => (
    <label className="relative flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-50">
      <Icon size={19} className="shrink-0 text-emerald-500" />
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
        <input
          value={value}
          onFocus={() => setSuggestionFor(type)}
          onChange={(event) => {
            setValue(event.target.value)
            setError('')
            sessionStorage.removeItem(type === 'pickup' ? 'safarsetu_pickup_coordinates' : 'safarsetu_destination_coordinates')
            if (appConfig.demoMode || event.target.value.trim().length < 3) setSuggestions([])
          }}
          placeholder={placeholder}
          autoComplete="off"
          list={appConfig.demoMode ? 'safarsetu-service-zones' : undefined}
          className="mt-0.5 w-full border-0 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
          aria-label={label}
        />
        {suggestions.length > 0 && suggestionFor === type && (
          <div className="absolute left-12 right-3 top-full z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            {suggestions.map((item) => <button key={item.id || item.placeId || item.label} type="button" onClick={() => { setValue(item.label); if (item.coordinates) sessionStorage.setItem(type === 'pickup' ? 'safarsetu_pickup_coordinates' : 'safarsetu_destination_coordinates', JSON.stringify(item.coordinates)); setSuggestionFor(''); setSuggestions([]) }} className="block w-full px-4 py-3 text-left text-sm hover:bg-emerald-50">{item.label}</button>)}
          </div>
        )}
      </span>
      {type === 'pickup' && <button type="button" onClick={useMyLocation} disabled={locationBusy} className="text-slate-400 hover:text-emerald-600 disabled:opacity-50" aria-label="Use current location"><LocateFixed size={18} /></button>}
    </label>
  )

  return (
    <form onSubmit={submit} className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,.12)] ${compact ? '' : 'md:p-6'}`}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">{t('Book a ride')}</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">{t('Where do you want to go?')}</h2>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${appConfig.demoMode ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{appConfig.demoMode ? 'Demo mode' : 'Live service'}</span>
      </div>
      <div className="space-y-3">
        {renderLocationInput('pickup', pickup, setPickup, t('Pickup location'), t('Enter pickup area'), MapPin)}
        {renderLocationInput('drop', drop, setDrop, t('Drop location'), t('Where are you going?'), Navigation)}
        {appConfig.demoMode && <datalist id="safarsetu-service-zones">{zones.map((zone) => <option key={zone} value={zone} />)}</datalist>}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setVehicle('bike')} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold transition ${vehicle === 'bike' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}><Bike size={18} />Bike</button>
        <button type="button" onClick={() => setVehicle('auto')} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold transition ${vehicle === 'auto' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}><CarFront size={18} />Auto</button>
      </div>
      {error && <p role="alert" className="mt-3 flex items-start gap-2 text-sm font-semibold text-red-600"><AlertTriangle size={16} className="mt-0.5 shrink-0" />{error}</p>}
      <button type="submit" disabled={busy || locationBusy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-4 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-wait disabled:opacity-60">{busy ? 'Checking route…' : t('Find a Ride')} {!busy && <ArrowRight size={17} />}</button>
      {appConfig.demoMode && <p className="mt-3 text-center text-xs leading-5 text-slate-400">Demo only: map lookup, coverage checks and ride requests are not sent.</p>}
    </form>
  )
}

function HomePage() {
  const { t } = useLanguage()
  const [serviceZones, setServiceZones] = useState(zones)
  const [zoneError, setZoneError] = useState('')
  useEffect(() => {
    if (appConfig.demoMode) return undefined
    let active = true
    bookingService.getConfiguration()
      .then(({ data }) => {
        if (active && Array.isArray(data.serviceZones)) setServiceZones(data.serviceZones)
      })
      .catch((requestError) => { if (active) setZoneError(requestError.message || 'Service area information is unavailable.') })
    return () => { active = false }
  }, [])
  const faqs = [
    ['Is SafarSetu available across Greater Noida?', 'We are launching in selected service zones, including Alpha, Beta, Knowledge Park, and Pari Chowk. Availability is shown during booking.'],
    ['Can I bargain on my fare?', 'When enabled by the fare configuration, you may offer a lower fare within the allowed range. A rider can only accept or reject that offer.'],
    ['How does the 100th ride reward work?', 'Every 100th completed ride is eligible for a 50% fare discount. Only the configured eligible rides count; cancelled rides do not.'],
  ]

  return (
    <>
      <main>
        <section className="relative overflow-hidden bg-[#f6f9f8]">
          <div className="absolute inset-y-0 right-0 hidden w-[38%] bg-emerald-500/10 lg:block" />
          <div className="container-shell grid min-h-[620px] items-center gap-12 py-14 lg:grid-cols-[1fr_440px] lg:py-16">
            <div className="relative z-10 max-w-[650px]">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-700 shadow-sm">
                <Sparkles size={14} /> Affordable rides in Greater Noida
              </div>
              <h1 className="text-5xl font-black leading-[1.04] tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-[68px]">{t('Your Ride,')}<br /><span className="text-emerald-500">{t('Your Way.')}</span></h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">Simple, transparent Bike and Auto rides for everyday journeys across Greater Noida.</p>
              <div className="mt-8 flex flex-wrap gap-7">
                {[['6', 'Initial service zones'], ['2', 'Planned ride options'], ['DEMO', 'Backend not connected']].map(([value, label]) => (
                  <div key={label}><p className="text-2xl font-black text-slate-950">{value}</p><p className="mt-1 text-xs font-semibold text-slate-500">{label}</p></div>
                ))}
              </div>
            </div>
            <div className="relative z-10"><BookingCard /></div>
          </div>
        </section>

        <section id="how-it-works" className="py-20">
          <div className="container-shell">
            <div className="mx-auto max-w-xl text-center"><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">How it works</p><h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Three steps. One simple ride.</h2></div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                [MapPin, '01', 'Set your route', 'Enter your pickup and destination within our supported zones.'],
                [CircleDollarSign, '02', 'Choose & confirm', 'Review the backend fare estimate and select an available Bike or Auto.'],
                [BadgeCheck, '03', 'Ride with confidence', 'Follow your ride status and receive your receipt after completion.'],
              ].map(([Icon, num, title, text]) => (
                <article key={title} className="relative rounded-2xl border border-slate-100 bg-white p-7 shadow-[0_12px_40px_rgba(15,23,42,.06)]">
                  <span className="absolute right-6 top-5 text-4xl font-black text-slate-100">{num}</span>
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Icon size={22} /></span>
                  <h3 className="mt-6 text-lg font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50/70 py-20">
          <div className="container-shell grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Why SafarSetu</p>
              <h2 className="mt-3 max-w-lg text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Built for simple, everyday mobility.</h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  [ShieldCheck, 'Trust first', 'Clear statuses and transparent pricing.'],
                  [WalletCards, 'No surprises', 'Applicable charges are shown before confirmation.'],
                  [Clock3, 'Simple booking', 'Choose your ride in a few straightforward steps.'],
                  [Users, 'Local focus', 'Designed around Greater Noida service zones.'],
                ].map(([Icon, title, text]) => (
                  <div key={title} className="flex gap-3 rounded-xl bg-white p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><Icon size={19} /></span><div><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div></div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl bg-slate-950 p-8 text-white sm:p-10">
              <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Ride reward</p><h3 className="mt-2 text-2xl font-black">Every 100th ride rewards you</h3></div><Gift className="text-emerald-400" /></div>
              <div className="mt-8 rounded-2xl bg-white/8 p-5"><p className="text-sm font-semibold">Your next eligible milestone</p><p className="mt-2 text-sm text-slate-400">{appConfig.demoMode ? 'Sign in after launch to view your reward progress.' : 'Progress is calculated from eligible completed rides by the backend.'}</p><p className="mt-3 text-xs text-slate-500">Cancelled rides do not count. Reward discounts are funded by SafarSetu.</p></div>
              <Link to="/rewards" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-emerald-400">View reward details <ArrowRight size={16} /></Link>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container-shell">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Service areas</p><h2 className="mt-3 text-3xl font-black tracking-tight">Where you can ride</h2></div><p className="text-sm text-slate-500">Initial Greater Noida launch zones</p></div>
            {zoneError && <p role="alert" className="mt-4 text-sm text-red-600">{zoneError}</p>}
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">{serviceZones.map((zone) => <div key={typeof zone === 'string' ? zone : zone.id} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold"><span className="h-2 w-2 rounded-full bg-emerald-500" />{typeof zone === 'string' ? zone : zone.name}</div>)}</div>
          </div>
        </section>

        <section className="border-t border-slate-100 py-20">
          <div className="container-shell grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Frequently asked</p><h2 className="mt-3 text-3xl font-black tracking-tight">Questions, answered.</h2><Link to="/support" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-600">Visit support <ArrowRight size={16} /></Link></div>
            <div className="divide-y divide-slate-100 border-y border-slate-100">
              {faqs.map(([question, answer]) => <details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold">{question}<ChevronDown size={18} className="shrink-0 text-slate-400 transition group-open:rotate-180" /></summary><p className="mt-3 pr-8 text-sm leading-6 text-slate-500">{answer}</p></details>)}
            </div>
          </div>
        </section>

        <section className="pb-20"><div className="container-shell overflow-hidden rounded-3xl bg-emerald-500 px-6 py-10 text-white sm:px-10"><div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-emerald-950">Ready for a simple ride?</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">Book your next Bike or Auto ride.</h2></div><Link to="/book-ride" className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-4 text-sm font-bold text-white">Book a Ride <ArrowRight size={17} /></Link></div></div></section>
      </main>
    </>
  )
}

function PageShell({ title, eyebrow, children }) {
  return (
    <main className="min-h-[560px] bg-slate-50 py-12">
      <div className="container-shell">
        {(eyebrow || title) && <div className="mb-8"><p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">{eyebrow}</p><h1 className="mt-2 text-3xl font-black text-slate-950">{title}</h1></div>}
        {children}
      </div>
    </main>
  )
}

function AuthPage({ mode }) {
  const navigate = useNavigate()
  const [mobileNumber, setMobileNumber] = useState('')
  const [fullName, setFullName] = useState('')
  const [otp, setOtp] = useState('')
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const sendOtp = async () => {
    setError('')
    setNotice('')
    setLoading(true)
    try {
      await authService.sendOtp(mobileNumber)
      setOtpSent(true)
      setNotice('If the number is eligible, an OTP was sent by the configured verification provider.')
    } catch (requestError) {
      setError(requestError.message || 'OTP could not be requested.')
    } finally {
      setLoading(false)
    }
  }
  const submit = async (event) => {
    event.preventDefault()
    if (!otpSent) {
      setError('Request an OTP first.')
      return
    }
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') await authService.register({ fullName, mobileNumber, otp, privacyConsent })
      else await authService.login({ mobileNumber, otp })
      navigate('/dashboard')
    } catch (requestError) {
      setError(requestError.message || 'Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <main className="grid min-h-[640px] place-items-center bg-slate-50 px-4 py-12">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,.08)] sm:p-9">
        <Link to="/" className="text-2xl font-black">SafarSetu</Link>
        <h1 className="mt-8 text-3xl font-black">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="mt-2 text-sm text-slate-500">{appConfig.demoMode ? 'Demo mode: authentication is unavailable until the backend is connected.' : 'Verify your mobile number with a one-time password.'}</p>
        <div className="mt-7 space-y-4">
          {mode === 'register' && <label className="block text-sm font-bold">Full name<input required value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" placeholder="Enter full name" /></label>}
          <label className="block text-sm font-bold">Mobile number<input required value={mobileNumber} onChange={(event) => setMobileNumber(event.target.value)} inputMode="tel" autoComplete="tel" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" placeholder="+91 98765 43210" /></label>
          {otpSent && <label className="block text-sm font-bold">One-time password<input required value={otp} onChange={(event) => setOtp(event.target.value)} inputMode="numeric" autoComplete="one-time-code" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" placeholder="Enter OTP" /></label>}
          {mode === 'register' && <label className="flex items-start gap-2 text-xs leading-5 text-slate-600"><input required type="checkbox" checked={privacyConsent} onChange={(event) => setPrivacyConsent(event.target.checked)} className="mt-1 accent-emerald-600" /><span>I agree to the <Link to="/terms" className="font-bold text-emerald-700">Terms</Link> and acknowledge the <Link to="/privacy" className="font-bold text-emerald-700">Privacy Policy</Link>.</span></label>}
        </div>
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
        {!otpSent
          ? <button type="button" disabled={loading || appConfig.demoMode || !mobileNumber} onClick={sendOtp} className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-4 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50">{loading ? 'Requesting OTP…' : 'Send OTP'}</button>
          : <button disabled={loading || appConfig.demoMode} className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-4 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50">{loading ? 'Verifying…' : mode === 'login' ? 'Verify and login' : 'Verify and register'}</button>}
        <p className="mt-5 text-center text-sm text-slate-500">{mode === 'login' ? 'New to SafarSetu?' : 'Already have an account?'} <Link to={mode === 'login' ? '/register' : '/login'} className="font-bold text-emerald-600">{mode === 'login' ? 'Sign up' : 'Login'}</Link></p>
      </form>
    </main>
  )
}

function fareForVehicleFromStorage(vehicleId) {
  const options = readSessionJSON('safarsetu_fare_options') || []
  const selectedVehicle = vehicleId || sessionStorage.getItem('safarsetu_vehicle')
  return options.find((option) => option.vehicleType === selectedVehicle) || null
}

function SelectVehiclePage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [selected, setSelected] = useState('bike')
  const [options, setOptions] = useState([
    { id: 'bike', name: 'Bike', detail: 'Quick & affordable', icon: Bike },
    { id: 'auto', name: 'Auto', detail: 'Comfortable & spacious', icon: CarFront },
  ])
  const [fareOptions, setFareOptions] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (appConfig.demoMode) return
    let active = true
    const loadQuote = async () => {
      try {
        const [configuration, quote] = await Promise.all([
          bookingService.getConfiguration(),
          bookingService.estimateFare({
            pickup: sessionStorage.getItem('safarsetu_pickup'),
            destination: sessionStorage.getItem('safarsetu_drop'),
            route: readSessionJSON('safarsetu_route'),
          }),
        ])
        if (!active) return
        const enabledVehicles = configuration.data.activeVehicleTypes || []
        setOptions(enabledVehicles.map((vehicle) => ({
          id: vehicle.id,
          name: vehicle.label,
          detail: vehicle.description || '',
          icon: vehicle.id === 'auto' ? CarFront : Bike,
        })))
        setFareOptions(quote.data.options || [])
        sessionStorage.setItem('safarsetu_fare_options', JSON.stringify(quote.data.options || []))
      } catch (requestError) {
        if (active) setError(requestError.message || 'Fare estimates are unavailable right now.')
      }
    }
    loadQuote()
    return () => { active = false }
  }, [])

  const fareFor = (vehicleId) => fareOptions.find((option) => option.vehicleType === vehicleId)
  const selectedFare = fareFor(selected)

  return (
    <PageShell title="Choose your ride" eyebrow="Step 2 of 4">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {options.map(({ id, name, detail, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setSelected(id)} className={`flex w-full items-center gap-4 rounded-2xl border bg-white p-5 text-left transition ${selected === id ? 'border-emerald-500 ring-4 ring-emerald-50' : 'border-slate-200'}`}>
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-800"><Icon size={26} /></span>
              <span className="min-w-0 flex-1"><span className="block font-black text-slate-950">{name}</span><span className="mt-1 block text-xs text-slate-500">{detail}</span></span>
              <span className="text-right"><span className="block text-sm font-bold">{fareFor(id) ? `₹${fareFor(id).standardFare}` : 'Fare pending'}</span><span className="mt-1 block text-xs text-slate-500">{fareFor(id)?.estimatedMinutes ? `${fareFor(id).estimatedMinutes} min` : 'ETA pending'}</span></span>
              {selected === id && <CheckCircle2 size={20} className="text-emerald-500" />}
            </button>
          ))}
        </div>
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm font-bold">Fare estimate</p><div className="mt-5 flex items-center justify-between text-sm"><span className="text-slate-500">Standard fare</span><span className="font-black">{selectedFare ? `₹${selectedFare.standardFare}` : 'Not available'}</span></div>{selectedFare?.distanceKm && <p className="mt-2 text-xs text-slate-500">Route: {selectedFare.distanceKm} km · {selectedFare.estimatedMinutes || '—'} min</p>}<p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">{appConfig.demoMode ? 'Demo mode does not calculate route distance or fares. No ride request will be sent.' : 'Fare and route information are supplied by the backend. Applicable charges are shown before confirmation.'}</p>{error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}<button disabled={!appConfig.demoMode && !selectedFare} onClick={() => navigate('/fare-estimate', { state: { selected, fare: selectedFare, pickup: state?.pickup, drop: state?.drop } })} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-4 text-sm font-bold text-white disabled:opacity-50">Continue <ArrowRight size={16} /></button></aside>
      </div>
    </PageShell>
  )
}

function FareEstimatePage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const selectedVehicle = state?.selected || sessionStorage.getItem('safarsetu_vehicle')
  const [offer, setOffer] = useState('')
  const [quote] = useState(() => state?.fare || fareForVehicleFromStorage(state?.selected))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [offerError, setOfferError] = useState('')
  const [fareConfiguration, setFareConfiguration] = useState(null)
  const standardFare = quote?.standardFare

  const submitRequest = async () => {
    if (appConfig.demoMode) {
      setError('Demo mode cannot send ride requests. Connect the backend and disable demo mode to book.')
      return
    }
    if (!quote || loading) return
    const parsedOffer = offer.trim() === '' ? standardFare : Number(offer)
    if (offer.trim() !== '') {
      const validation = validateFareOffer(parsedOffer, {
        standardFare,
        minimumFare: fareConfiguration?.minimumFare,
      })
      if (!validation.valid) {
        setOfferError(validation.reason)
        return
      }
    }
    setOfferError('')
    setError('')
    setLoading(true)
    const idempotencyKey = sessionStorage.getItem('safarsetu_request_key') || crypto.randomUUID()
    sessionStorage.setItem('safarsetu_request_key', idempotencyKey)
    try {
      const response = await bookingService.requestRide({
        pickup: sessionStorage.getItem('safarsetu_pickup'),
        destination: sessionStorage.getItem('safarsetu_drop'),
        vehicleType: selectedVehicle,
        quoteId: quote.quoteId,
        customerOffer: offer.trim() === '' ? null : parsedOffer,
      }, idempotencyKey)
      if (!response.data.bookingId) throw new Error('The server did not confirm a booking reference.')
      sessionStorage.setItem('safarsetu_booking_id', response.data.bookingId)
      navigate('/booking-status', { state: { bookingId: response.data.bookingId } })
    } catch (requestError) {
      setError(requestError.message || 'The request could not be sent. Retry safely; duplicate requests are protected by an idempotency key.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (appConfig.demoMode || !quote) return
    let active = true
    bookingService.getConfiguration()
      .then(({ data }) => { if (active) setFareConfiguration(data.fareRules?.[selectedVehicle] || null) })
      .catch((requestError) => { if (active) setError(requestError.message) })
    return () => { active = false }
  }, [quote, selectedVehicle])

  return (
    <PageShell title="Review your fare" eyebrow="Step 3 of 4">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-5"><div><p className="text-xs font-bold text-slate-500">Backend standard fare</p><p className="mt-1 text-3xl font-black">{standardFare == null ? '—' : `₹${standardFare}`}</p></div><Bike size={32} className="text-emerald-500" /></div>
        {quote?.distanceKm && <p className="mt-4 text-sm text-slate-500">Distance {quote.distanceKm} km · Estimated {quote.estimatedMinutes || '—'} min</p>}
        <div className="mt-6"><label htmlFor="fare-offer" className="text-sm font-bold">Optional fare offer</label><div className="mt-2 flex rounded-xl border border-slate-200 focus-within:border-emerald-500"><span className="grid w-12 place-items-center border-r border-slate-200 text-slate-500">₹</span><input id="fare-offer" value={offer} onChange={(event) => { setOffer(event.target.value); setOfferError('') }} type="number" min={fareConfiguration?.minimumFare} max={standardFare} disabled={appConfig.demoMode || !fareConfiguration || !standardFare} placeholder={fareConfiguration ? `Min ₹${fareConfiguration.minimumFare}` : 'Configured minimum unavailable'} className="w-full px-4 py-3 outline-none disabled:bg-slate-50" /></div><p className="mt-2 text-xs leading-5 text-slate-500">Offers are available only within admin-configured limits. Riders may accept or reject; counteroffers are not supported. An accepted offer locks the fare.</p>{offerError && <p role="alert" className="mt-2 text-sm text-red-600">{offerError}</p>}</div>
        {!error && !appConfig.demoMode && !quote && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">A current server fare quote is required before requesting a ride.</p>}
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button onClick={submitRequest} disabled={loading || appConfig.demoMode || !quote} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Sending request…' : 'Submit ride request'} {!loading && <ArrowRight size={17} />}</button>
        <p className="mt-3 text-center text-xs text-slate-400">{appConfig.demoMode ? 'Demo only. No booking request has been sent.' : 'Booking is not confirmed until the backend confirms a rider match.'}</p>
      </div>
    </PageShell>
  )
}

function BookingStatusPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const bookingId = state?.bookingId || sessionStorage.getItem('safarsetu_booking_id')
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!bookingId || appConfig.demoMode) return undefined
    let active = true
    const disconnect = connectToRide(bookingId, (update) => {
      if (active) setBooking((current) => ({ ...current, ...update }))
    }, (socketError) => {
      if (active) setError(socketError.message || 'Live updates disconnected. You can retry the status check.')
    })
    const fetchStatus = async () => {
      try {
        const response = await bookingService.getBooking(bookingId)
        if (active) setBooking(response.data)
      } catch (requestError) {
        if (active) setError(requestError.message || 'Booking status could not be refreshed.')
      }
    }
    fetchStatus()
    return () => { active = false; disconnect() }
  }, [bookingId])

  const cancelBooking = async () => {
    if (!bookingId) return
    setBusy(true)
    setError('')
    try {
      const { data: config } = await bookingService.getConfiguration()
      const policy = booking?.cancellationPolicy || config.cancellationPolicy
      if (!policy) {
        setError('Cancellation terms are unavailable. The request was not cancelled; please contact support.')
        return
      }
      const policyText = policy.description || `Applicable cancellation charge: ${policy.charge == null ? 'none specified' : `₹${policy.charge}`}.`
      if (!window.confirm(`Cancel this ride? ${policyText}`)) return
      const response = await bookingService.cancelBooking(bookingId, { reason: 'customer_request' })
      setBooking(response.data)
    } catch (requestError) {
      setError(requestError.message || 'Cancellation could not be confirmed. Refresh the booking status.')
    } finally {
      setBusy(false)
    }
  }

  const retryMatching = async () => {
    if (!bookingId) return
    setBusy(true)
    setError('')
    try {
      const key = crypto.randomUUID()
      const response = await bookingService.retryMatching(bookingId, key)
      setBooking(response.data)
    } catch (requestError) {
      setError(requestError.message || 'Rider matching could not be retried.')
    } finally {
      setBusy(false)
    }
  }

  const status = booking?.status
  const statusText = {
    searching: 'Searching for an eligible rider',
    rider_assigned: 'Rider assigned',
    rider_arriving: 'Rider is approaching',
    ride_started: 'Ride in progress',
    ride_completed: 'Ride completed',
    no_riders_available: 'No riders are available right now',
    cancelled: 'Booking cancelled',
    rider_cancelled: 'The rider cancelled this booking',
    timed_out: 'Matching timed out',
    rider_no_show: 'The rider did not arrive',
    ride_interrupted: 'Ride interrupted',
  }[status] || (appConfig.demoMode ? 'Demo booking status' : 'Booking status')

  return (
    <PageShell title={statusText} eyebrow="Booking status">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-50"><Navigation className="animate-pulse text-emerald-500" size={32} /></div>
        <h2 className="mt-6 text-xl font-black">{booking?.rider?.name || 'No rider details available'}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{appConfig.demoMode || !bookingId ? 'Demo mode has not submitted a ride request. No rider has been found or assigned.' : booking?.message || 'Booking status is updated only after the backend confirms it.'}</p>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-left">
          <div className="flex items-center justify-between border-b border-slate-100 py-3"><span className="text-sm font-semibold">Current state</span><span className="text-sm font-bold">{statusText}</span></div>
          {booking?.rider && <div className="space-y-2 py-4 text-sm"><p>Verified rider: {booking.rider.name}</p><p>Vehicle: {booking.vehicle?.type} · {booking.vehicle?.registrationNumber}</p><p>ETA: {booking.estimatedArrivalMinutes ?? 'Not available'}</p><p>Agreed fare: {booking.agreedFare == null ? 'Not confirmed' : `₹${booking.agreedFare}`}</p></div>}
          {booking?.route && <div className="border-t border-slate-100 py-3 text-sm text-slate-500">{booking.route.distanceKm} km · {booking.route.estimatedMinutes} min</div>}
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-left text-sm text-red-700">{error}</p>}
        {!bookingId
          ? <button type="button" onClick={() => navigate('/book-ride')} className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Try a demo route</button>
          : ['no_riders_available', 'timed_out', 'rider_cancelled'].includes(status)
            ? <div className="mt-5 flex justify-center gap-3"><button type="button" disabled={busy} onClick={retryMatching} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Retry matching</button><button type="button" onClick={() => navigate('/book-ride')} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold">New request</button></div>
            : status && !['ride_completed', 'cancelled'].includes(status) && <button type="button" disabled={busy} onClick={cancelBooking} className="mt-5 rounded-xl border border-red-200 px-5 py-3 text-sm font-bold text-red-600 disabled:opacity-50">Cancel request</button>}
      </div>
    </PageShell>
  )
}

function TrackRidePage() {
  const bookingId = sessionStorage.getItem('safarsetu_booking_id')
  const [booking, setBooking] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!bookingId || appConfig.demoMode) return undefined
    let active = true
    const disconnect = connectToRide(bookingId, (update) => {
      if (active) setBooking((current) => ({ ...current, ...update }))
    }, () => {
      if (active) setError('Live updates were interrupted. Status refresh is available from the booking page.')
    })
    bookingService.getBooking(bookingId)
      .then(({ data }) => { if (active) setBooking(data) })
      .catch((requestError) => { if (active) setError(requestError.message) })
    return () => { active = false; disconnect() }
  }, [bookingId])

  const shareTrip = async () => {
    if (!bookingId || appConfig.demoMode) return
    try {
      const { data } = await safetyService.shareTrip(bookingId)
      if (navigator.share) await navigator.share({ title: 'SafarSetu trip', url: data.shareUrl })
      else {
        await navigator.clipboard.writeText(data.shareUrl)
        setMessage('Trip-sharing link copied.')
      }
    } catch (requestError) {
      setError(requestError.message || 'Trip sharing is unavailable.')
    }
  }

  const sendEmergencyAlert = async () => {
    if (!bookingId || appConfig.demoMode) return
    if (!window.confirm('Send an emergency alert to SafarSetu support? This does not contact emergency services. Call local emergency services directly if you are in immediate danger.')) return
    try {
      await safetyService.sendEmergencyAlert(bookingId, { source: 'customer_app' })
      setMessage('Your alert was submitted to SafarSetu support. For immediate danger, call local emergency services.')
    } catch (requestError) {
      setError(requestError.message || 'The alert could not be submitted. Contact local emergency services if this is urgent.')
    }
  }

  return (
    <PageShell title="Track your ride" eyebrow="Ride safety">
      {!bookingId || appConfig.demoMode
        ? <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No active demo ride. Live location and rider information appear only after a backend-confirmed rider assignment.</div>
        : <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="grid min-h-72 place-items-center rounded-2xl border border-slate-200 bg-slate-100 p-6 text-center"><div><MapPin size={28} className="mx-auto text-emerald-500" /><p className="mt-3 font-bold">Live map provider integration required</p><p className="mt-2 text-sm text-slate-500">The server may send rider coordinates through the authenticated live connection.</p></div></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-black">Verified ride details</h2>
            {booking?.rider
              ? <div className="mt-4 space-y-2 text-sm"><p>Rider: {booking.rider.name}</p><p>Verification: {booking.rider.verificationStatus || 'Not provided'}</p><p>Vehicle: {booking.vehicle?.type || '—'}</p><p>Registration: {booking.vehicle?.registrationNumber || '—'}</p><p>ETA: {booking.estimatedArrivalMinutes ?? 'Not available'}</p></div>
              : <p className="mt-4 text-sm text-slate-500">Waiting for confirmed rider details.</p>}
            <div className="mt-5 grid gap-2"><button type="button" onClick={shareTrip} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold">Share trip</button><button type="button" onClick={() => window.location.assign('/support')} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold">Contact support</button><button type="button" onClick={sendEmergencyAlert} className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white">Emergency SOS</button></div>
            <p className="mt-3 text-xs leading-5 text-slate-500">SOS alerts SafarSetu support when connected; it does not replace contacting emergency services.</p>
            {message && <p role="status" className="mt-3 text-sm text-emerald-700">{message}</p>}
            {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
          </div>
        </div>}
    </PageShell>
  )
}

function PaymentPage() {
  const bookingId = sessionStorage.getItem('safarsetu_booking_id')
  const [booking, setBooking] = useState(null)
  const [methods, setMethods] = useState([])
  const [method, setMethod] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!bookingId || appConfig.demoMode) return undefined
    let active = true
    Promise.all([bookingService.getBooking(bookingId), bookingService.getConfiguration(), bookingService.getPaymentStatus(bookingId)])
      .then(([rideResponse, configResponse, paymentResponse]) => {
        if (!active) return
        setBooking({ ...rideResponse.data, paymentStatus: paymentResponse.data.status })
        const enabledMethods = (configResponse.data.paymentMethods || []).filter((item) => item.enabled)
        setMethods(enabledMethods)
        setMethod(enabledMethods[0]?.id || '')
      })
      .catch((requestError) => { if (active) setError(requestError.message || 'Payment details could not be loaded.') })
    return () => { active = false }
  }, [bookingId])

  const beginPayment = async () => {
    if (!bookingId || !method || busy || appConfig.demoMode) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const keyName = `safarsetu_payment_key_${bookingId}`
      const key = sessionStorage.getItem(keyName) || crypto.randomUUID()
      sessionStorage.setItem(keyName, key)
      const { data } = await bookingService.startPayment(bookingId, { method }, key)
      if (data.checkoutUrl) {
        const checkout = new URL(data.checkoutUrl)
        if (checkout.protocol !== 'https:') throw new Error('The payment provider returned an insecure checkout URL.')
        window.location.assign(checkout.href)
        return
      }
      setMessage(`Payment status: ${data.status || 'pending'}. The backend must confirm the result.`)
    } catch (requestError) {
      setError(requestError.message || 'Payment could not be started.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell title="Payment" eyebrow="Secure checkout">
      {!bookingId || appConfig.demoMode
        ? <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Payments are disabled in demo mode. No payment has been initiated or recorded.</div>
        : <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex justify-between text-sm"><span>Final fare</span><strong>{booking?.finalFare == null ? 'Awaiting backend confirmation' : `₹${booking.finalFare}`}</strong></div>
          <div className="mt-3 flex justify-between text-sm"><span>Payment status</span><strong className="capitalize">{booking?.paymentStatus || 'Loading'}</strong></div>
          <label htmlFor="payment-method" className="mt-6 block text-sm font-bold">Payment method</label>
          <select id="payment-method" value={method} onChange={(event) => setMethod(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" disabled={!methods.length}>
            {methods.length ? methods.map((item) => <option key={item.id} value={item.id}>{item.label}</option>) : <option value="">No enabled methods</option>}
          </select>
          <p className="mt-3 text-xs text-slate-500">Cash is shown only when enabled by the backend. Card details are handled by the gateway and are never stored here.</p>
          <button type="button" onClick={beginPayment} disabled={!method || !booking?.finalFare || busy} className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-4 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Starting secure checkout…' : 'Continue to payment'}</button>
          {message && <p role="status" className="mt-4 text-sm text-emerald-700">{message}</p>}
          {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
        </div>}
    </PageShell>
  )
}

function GenericPage({ title, eyebrow, children }) {
  return <PageShell title={title} eyebrow={eyebrow}><div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-600">{children}</div></PageShell>
}

function RideHistoryPage() {
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(!appConfig.demoMode)
  const [error, setError] = useState('')

  useEffect(() => {
    if (appConfig.demoMode) return undefined
    let active = true
    bookingService.getHistory({ limit: 20 })
      .then(({ data }) => { if (active) setRides(data.rides || []) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Ride history could not be loaded.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <PageShell title="Ride history" eyebrow="Your trips">
      {appConfig.demoMode && <p className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Demo mode does not contain real ride history.</p>}
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {loading ? <p className="rounded-xl bg-white p-6 text-sm text-slate-500">Loading ride history…</p>
        : rides.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><p className="font-bold">No rides to show yet</p><p className="mt-2 text-sm text-slate-500">Completed and cancelled rides will appear here when available.</p></div>
          : <div className="grid gap-4">{rides.map((ride) => <Link to={`/ride/${ride.id}`} key={ride.id} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-[1fr_1.2fr_100px]"><div><p className="text-xs font-bold text-emerald-600">{ride.bookingId}</p><p className="mt-1 text-xs text-slate-400">{new Date(ride.createdAt).toLocaleString()}</p></div><div className="text-sm"><p className="font-bold">{ride.pickup?.label} → {ride.destination?.label}</p><p className="mt-1 text-xs text-slate-500">{ride.vehicleType} · {ride.finalFare == null ? 'Fare pending' : `₹${ride.finalFare}`} · Payment: {ride.paymentStatus}</p></div><span className="h-fit w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">{ride.status}</span></Link>)}</div>}
    </PageShell>
  )
}

function RideDetailsPage() {
  const { id } = useParams()
  const [ride, setRide] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id || appConfig.demoMode) return undefined
    let active = true
    bookingService.getBooking(id)
      .then(({ data }) => { if (active) setRide(data) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Ride details could not be loaded.') })
    return () => { active = false }
  }, [id])

  const downloadReceipt = async () => {
    try {
      const { data } = await bookingService.getReceipt(id)
      const url = URL.createObjectURL(data)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `safarsetu-receipt-${id}.pdf`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (requestError) {
      setError(requestError.message || 'Receipt could not be downloaded.')
    }
  }

  return <PageShell title="Ride details" eyebrow="Trip receipt">
    {appConfig.demoMode ? <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No actual ride details or receipt are available in demo mode.</p>
      : <div className="rounded-2xl border border-slate-200 bg-white p-6"><p className="font-bold">{ride?.bookingId || 'Loading ride…'}</p><p className="mt-3 text-sm text-slate-600">{ride?.pickup?.label} → {ride?.destination?.label}</p><p className="mt-2 text-sm text-slate-600">Vehicle: {ride?.vehicleType || '—'} · Fare: {ride?.finalFare == null ? '—' : `₹${ride.finalFare}`}</p><p className="mt-2 text-sm text-slate-600">Ride status: {ride?.status || '—'} · Payment: {ride?.paymentStatus || '—'}</p>{error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}<button type="button" onClick={downloadReceipt} disabled={!ride?.receiptAvailable} className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Download receipt</button></div>}
  </PageShell>
}

function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState({ fullName: '', mobileNumber: '', email: '', emergencyContact: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (appConfig.demoMode) return undefined
    let active = true
    Promise.all([customerService.getProfile(), safetyService.getEmergencyContact()])
      .then(([profileResponse, emergencyResponse]) => {
        if (active) setProfile({ ...profileResponse.data, emergencyContact: emergencyResponse.data.mobileNumber || '' })
      })
      .catch((requestError) => { if (active) setError(requestError.message || 'Profile could not be loaded.') })
    return () => { active = false }
  }, [])

  const saveProfile = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await Promise.all([
        customerService.updateProfile({ fullName: profile.fullName, email: profile.email }),
        safetyService.updateEmergencyContact({ mobileNumber: profile.emergencyContact }),
      ])
      setNotice('Profile updates saved.')
    } catch (requestError) {
      setError(requestError.message || 'Profile changes could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  const deleteAccount = async () => {
    if (!window.confirm('Request deletion of your SafarSetu account and personal data? This action may be irreversible.')) return
    setBusy(true)
    setError('')
    try {
      await customerService.deleteAccount('customer_confirmed')
      await authService.logout()
      navigate('/')
    } catch (requestError) {
      setError(requestError.message || 'Account deletion request could not be completed.')
    } finally {
      setBusy(false)
    }
  }

  return <PageShell title="My profile" eyebrow="Personal details">
    {appConfig.demoMode
      ? <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Profile editing and account deletion require the authenticated customer API. Demo mode does not store personal profile data.</div>
      : <form onSubmit={saveProfile} className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6">
        <div className="space-y-4">
          <label className="block text-sm font-bold">Full name<input required value={profile.fullName || ''} onChange={(event) => setProfile({ ...profile, fullName: event.target.value })} autoComplete="name" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
          <label className="block text-sm font-bold">Mobile number<input disabled value={profile.mobileNumber || ''} autoComplete="tel" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" /><span className="mt-1 block text-xs font-normal text-slate-500">Contact support to update a verified number.</span></label>
          <label className="block text-sm font-bold">Email (optional)<input type="email" value={profile.email || ''} onChange={(event) => setProfile({ ...profile, email: event.target.value })} autoComplete="email" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
          <label className="block text-sm font-bold">Emergency contact<input value={profile.emergencyContact || ''} onChange={(event) => setProfile({ ...profile, emergencyContact: event.target.value })} inputMode="tel" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
        </div>
        {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
        {notice && <p role="status" className="mt-4 text-sm text-emerald-700">{notice}</p>}
        <div className="mt-6 flex flex-wrap gap-3"><button disabled={busy} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save changes'}</button><button type="button" disabled={busy} onClick={deleteAccount} className="rounded-xl border border-red-200 px-5 py-3 text-sm font-bold text-red-600 disabled:opacity-50">Request account deletion</button></div>
        <p className="mt-4 text-xs leading-5 text-slate-500">Personal data is sent only to the configured backend. Review the <Link to="/privacy" className="font-bold text-emerald-700">privacy policy</Link> before using live mode.</p>
      </form>}
  </PageShell>
}

function SupportPage() {
  const [category, setCategory] = useState('ride')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const { data } = await supportService.submitTicket({ category, message })
      setNotice(data.ticketId ? `Support request received (${data.ticketId}).` : 'Support request submitted.')
      setMessage('')
    } catch (requestError) {
      setError(requestError.message || 'Support request could not be submitted.')
    } finally {
      setBusy(false)
    }
  }

  return <PageShell title="Help & support" eyebrow="Customer care">
    {appConfig.demoMode
      ? <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Support requests are disabled in demo mode. No message has been sent.</div>
      : <form onSubmit={submit} className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6">
        <label htmlFor="support-category" className="block text-sm font-bold">What do you need help with?</label>
        <select id="support-category" value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"><option value="ride">Ride or rider</option><option value="payment">Payment or refund</option><option value="account">Account and privacy</option><option value="safety">Safety concern</option><option value="other">Other</option></select>
        <label htmlFor="support-message" className="mt-5 block text-sm font-bold">Describe the issue</label>
        <textarea id="support-message" required minLength={10} maxLength={3000} value={message} onChange={(event) => setMessage(event.target.value)} rows={5} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" />
        <p className="mt-2 text-xs text-slate-500">{message.length}/3000</p>
        {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
        {notice && <p role="status" className="mt-4 text-sm text-emerald-700">{notice}</p>}
        <button disabled={busy} className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Submitting…' : 'Submit support request'}</button>
      </form>}
    <p className="mt-5 text-xs text-slate-500">If you are in immediate danger, contact local emergency services. Support requests are not emergency calls.</p>
  </PageShell>
}

function SavedAddressesPage() {
  const [addresses, setAddresses] = useState([])
  const [label, setLabel] = useState('Home')
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const loadAddresses = async () => {
    try {
      const { data } = await customerService.getSavedAddresses()
      setAddresses(data.addresses || [])
    } catch (requestError) {
      setError(requestError.message || 'Saved addresses could not be loaded.')
    }
  }

  useEffect(() => {
    if (appConfig.demoMode) return undefined
    let active = true
    customerService.getSavedAddresses()
      .then(({ data }) => { if (active) setAddresses(data.addresses || []) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Saved addresses could not be loaded.') })
    return () => { active = false }
  }, [])

  const saveAddress = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await customerService.saveAddress({ label, address })
      setAddress('')
      await loadAddresses()
    } catch (requestError) {
      setError(requestError.message || 'Address could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  const removeAddress = async (addressId) => {
    if (!window.confirm('Remove this saved address?')) return
    try {
      await customerService.deleteAddress(addressId)
      setAddresses((current) => current.filter((item) => item.id !== addressId))
    } catch (requestError) {
      setError(requestError.message || 'Address could not be removed.')
    }
  }

  return <PageShell title="Saved addresses" eyebrow="Profile">
    {appConfig.demoMode
      ? <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Saved addresses are account data and are unavailable in demo mode.</p>
      : <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">{addresses.length ? addresses.map((item) => <div key={item.id} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5"><div><p className="font-bold">{item.label}</p><p className="mt-1 text-sm text-slate-500">{item.address}</p></div><button type="button" onClick={() => removeAddress(item.id)} className="text-sm font-bold text-red-600">Remove</button></div>) : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No saved addresses yet.</div>}</div>
        <form onSubmit={saveAddress} className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
          <label htmlFor="address-label" className="block text-sm font-bold">Label</label><select id="address-label" value={label} onChange={(event) => setLabel(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"><option>Home</option><option>Work</option><option>Other</option></select>
          <label htmlFor="address-value" className="mt-4 block text-sm font-bold">Address</label><textarea id="address-value" required minLength={5} value={address} onChange={(event) => setAddress(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" />
          {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
          <button disabled={busy} className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save address'}</button>
        </form>
      </div>}
  </PageShell>
}

function RewardsPage() {
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (appConfig.demoMode) return
    let active = true
    bookingService.getRewardProgress()
      .then(({ data }) => { if (active) setProgress(data) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Reward progress could not be loaded.') })
    return () => { active = false }
  }, [])

  return (
    <PageShell title="Customer rewards" eyebrow="Ride milestone">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl bg-slate-950 p-7 text-white"><Gift className="text-emerald-400" /><h2 className="mt-5 text-2xl font-black">{progress ? `Next reward: ride ${progress.nextMilestone}` : 'Reward progress'}</h2><p className="mt-3 text-sm leading-6 text-slate-400">50% discount on eligible completed ride milestones (100th, 200th, and so on). Cancelled rides do not count.</p>{progress && <><div className="mt-6 h-3 rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, (progress.eligibleCompletedRides % 100))}%` }} /></div><p className="mt-3 text-xs text-slate-400">{progress.eligibleCompletedRides} eligible completed rides · {progress.ridesUntilReward} to next reward</p></>}{!progress && <p className="mt-4 text-sm text-slate-400">{appConfig.demoMode ? 'Progress is not available in demo mode.' : 'Progress requires a backend response.'}</p>}{error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}</div>
        <div className="rounded-3xl border border-slate-200 bg-white p-7"><h2 className="text-xl font-black">How the reward works</h2><ul className="mt-5 space-y-3 text-sm text-slate-600">{['Only eligible completed rides count.', 'Milestones are every 100 eligible rides.', 'SafarSetu funds the discount; rider earnings are not reduced.', 'Eligibility, caps and anti-fraud rules are controlled by the backend.'].map((text) => <li key={text} className="flex gap-3"><CheckCircle2 size={18} className="shrink-0 text-emerald-500" />{text}</li>)}</ul></div>
      </div>
    </PageShell>
  )
}

function ProtectedRoute({ children }) {
  const [authState, setAuthState] = useState(appConfig.demoMode ? 'unauthenticated' : 'checking')
  const [authError, setAuthError] = useState('')
  useEffect(() => {
    if (appConfig.demoMode) return undefined
    let active = true
    authService.getSession()
      .then(() => { if (active) setAuthState('authenticated') })
      .catch((requestError) => {
        if (!active) return
        if (requestError.status === 401) setAuthState('unauthenticated')
        else {
          setAuthError(requestError.message || 'Session verification failed.')
          setAuthState('error')
        }
      })
    return () => { active = false }
  }, [])
  if (authState === 'checking') return <PageShell title="Checking your session"><p className="text-sm text-slate-500">Verifying your sign-in with the server…</p></PageShell>
  if (authState === 'error') return <PageShell title="Unable to verify sign-in"><p role="alert" className="text-sm text-red-600">{authError}</p></PageShell>
  return authState === 'authenticated' ? children : <Navigate to="/login" replace />
}

function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [progress, setProgress] = useState(null)
  const [recentRides, setRecentRides] = useState([])
  const [error, setError] = useState('')
  useEffect(() => {
    if (appConfig.demoMode) return
    let active = true
    Promise.all([
      customerService.getDashboard(),
      bookingService.getRewardProgress(),
      bookingService.getHistory({ limit: 5 }),
    ])
      .then(([dashboardResponse, rewardsResponse, historyResponse]) => {
        if (!active) return
        setSummary(dashboardResponse.data)
        setProgress(rewardsResponse.data)
        setRecentRides(historyResponse.data.rides || [])
      })
      .catch((requestError) => { if (active) setError(requestError.message || 'Dashboard details could not be loaded.') })
    return () => { active = false }
  }, [])
  return (
    <PageShell title="Welcome back" eyebrow="Customer dashboard">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {[
          ['Completed rides', summary?.completedRides ?? '—', BadgeCheck],
          ['Next reward', progress ? `${progress.ridesUntilReward} rides` : '—', Gift],
          ['Current ride', summary?.activeRide?.status || '—', Clock3],
          ['Saved addresses', appConfig.demoMode ? '—' : 'View profile', MapPin],
        ].map(([label, value, Icon]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><Icon size={20} className="text-emerald-500" /><p className="mt-4 text-xs font-bold text-slate-400">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>
        ))}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-black">Recent ride history</h2>{recentRides.length ? <div className="mt-4 divide-y divide-slate-100">{recentRides.map((ride) => <Link key={ride.id} to={`/ride/${ride.id}`} className="flex items-center justify-between gap-3 py-3 text-sm"><span>{ride.pickup?.label} → {ride.destination?.label}</span><span className="shrink-0 text-xs text-slate-500">{ride.status}</span></Link>)}</div> : <p className="mt-4 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{appConfig.demoMode ? 'Demo mode has no ride history.' : 'No recent rides.'}</p>}</div>
        <div className="rounded-2xl bg-slate-950 p-6 text-white"><p className="text-xs font-bold text-emerald-400">Next reward</p><h2 className="mt-2 text-xl font-black">{progress ? `Ride ${progress.nextMilestone}` : 'Progress unavailable'}</h2>{progress && <><div className="mt-5 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, progress.eligibleCompletedRides % 100)}%` }} /></div><p className="mt-2 text-xs text-slate-400">{progress.ridesUntilReward} eligible rides to go</p></>}<Link to="/rewards" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-400">View rewards <ArrowRight size={16} /></Link></div>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
    </PageShell>
  )
}

function AppLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/book-ride" element={<PageShell title="Book a ride" eyebrow="Where are you going?"><div className="mx-auto max-w-xl"><BookingCard /></div></PageShell>} />
        <Route path="/select-vehicle" element={<SelectVehiclePage />} />
        <Route path="/fare-estimate" element={<FareEstimatePage />} />
        <Route path="/booking-status" element={<BookingStatusPage />} />
        <Route path="/track-ride" element={<ProtectedRoute><TrackRidePage /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
        <Route path="/ride-history" element={<ProtectedRoute><RideHistoryPage /></ProtectedRoute>} />
        <Route path="/ride/:id" element={<ProtectedRoute><RideDetailsPage /></ProtectedRoute>} />
        <Route path="/rewards" element={<ProtectedRoute><RewardsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/saved-addresses" element={<ProtectedRoute><SavedAddressesPage /></ProtectedRoute>} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/about" element={<GenericPage title="About SafarSetu" eyebrow="Our purpose"><p>SafarSetu aims to provide affordable, trustworthy and transparent Bike and Auto rides for everyday journeys in Greater Noida.</p></GenericPage>} />
        <Route path="/contact" element={<GenericPage title="Contact" eyebrow="Get in touch"><div className="space-y-4"><p>Contact SafarSetu for assistance with your ride questions.</p><p><a href="tel:+917820092916" className="font-semibold text-emerald-700 hover:underline">+91 7820092916</a></p><p><a href="mailto:safarsetuuu@gmail.com" className="font-semibold text-emerald-700 hover:underline">safarsetuuu@gmail.com</a></p></div></GenericPage>} />
        <Route path="/terms" element={<GenericPage title="Terms" eyebrow="Legal"><p>Website terms are a placeholder until final business terms are approved.</p></GenericPage>} />
        <Route path="/privacy" element={<GenericPage title="Privacy policy" eyebrow="Legal"><p>Privacy practices and data retention details are a placeholder until the production policy is approved.</p></GenericPage>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default function App() {
  return <BrowserRouter><AppLayout /></BrowserRouter>
}
