import { useEffect, useMemo, useState } from 'react'
import { LanguageContext } from './LanguageContextValue'

const translations = {
  en: {
    Home: 'Home',
    'Book a Ride': 'Book a Ride',
    'How It Works': 'How It Works',
    'About Us': 'About Us',
    Contact: 'Contact',
    Login: 'Login',
    'Sign Up': 'Sign Up',
    'Book a ride': 'Book a ride',
    'Where do you want to go?': 'Where do you want to go?',
    'Pickup location': 'Pickup location',
    'Drop location': 'Drop location',
    'Enter pickup area': 'Enter pickup area',
    'Where are you going?': 'Where are you going?',
    'Find a Ride': 'Find a Ride',
    'Your Ride,': 'Your Ride,',
    'Your Way.': 'Your Way.',
  },
  hi: {
    Home: 'होम',
    'Book a Ride': 'राइड बुक करें',
    'How It Works': 'यह कैसे काम करता है',
    'About Us': 'हमारे बारे में',
    Contact: 'संपर्क',
    Login: 'लॉग इन',
    'Sign Up': 'साइन अप',
    'Book a ride': 'राइड बुक करें',
    'Where do you want to go?': 'आप कहाँ जाना चाहते हैं?',
    'Pickup location': 'पिकअप स्थान',
    'Drop location': 'ड्रॉप स्थान',
    'Enter pickup area': 'पिकअप क्षेत्र दर्ज करें',
    'Where are you going?': 'आप कहाँ जा रहे हैं?',
    'Find a Ride': 'राइड खोजें',
    'Your Ride,': 'आपकी राइड,',
    'Your Way.': 'आपकी पसंद।',
  },
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('safarsetu_language') === 'hi' ? 'hi' : 'en')
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])
  const value = useMemo(() => ({
    language,
    toggleLanguage: () => setLanguage((current) => {
      const next = current === 'en' ? 'hi' : 'en'
      localStorage.setItem('safarsetu_language', next)
      return next
    }),
    t: (key) => translations[language][key] || key,
  }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
