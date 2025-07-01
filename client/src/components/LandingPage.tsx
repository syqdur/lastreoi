import React, { useState, useEffect } from 'react';
import { Heart, Camera, Music, Users, Star, ArrowRight, Sparkles, Globe, Shield, Clock, Code, Terminal, Zap } from 'lucide-react';
import { TelyaLogo } from './TelyaLogo';
import { PricingSection } from './PricingSection';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { galleryService } from '../services/galleryService';

interface LandingPageProps {
  onCreateGallery: (galleryData: GalleryCreationData) => void;
  onRootAdminLogin?: () => void;
}

export interface GalleryCreationData {
  eventName: string;
  slug: string;
  theme: 'hochzeit' | 'geburtstag' | 'urlaub' | 'eigenes';
  password?: string;
  eventDate?: string;
  endDate?: string;
  description?: string;
  ownerName?: string;
  ownerEmail?: string;
  userEmail: string;
  userPassword: string;
  selectedPlan?: 'free' | 'basic' | 'pro';
}

const THEMES = {
  hochzeit: {
    name: 'Hochzeit 💍',
    description: 'Romantische Momente für euren besonderen Tag',
    primaryColor: 'pink-500',
    secondaryColor: 'rose-500',
    gradient: 'from-pink-500 via-rose-500 to-pink-600',
    bgGradient: 'from-pink-50 via-rose-50 to-purple-50',
    darkBgGradient: 'from-pink-900/20 via-rose-900/20 to-purple-900/20',
    dateLabel: 'Hochzeitsdatum',
    endDateLabel: 'Ende der Feier',
    icon: '💍',
    momentsText: 'Hochzeitsmomente'
  },
  geburtstag: {
    name: 'Geburtstag 🎂',
    description: 'Feiert gemeinsam euren besonderen Tag',
    primaryColor: 'purple-500',
    secondaryColor: 'violet-500',
    gradient: 'from-purple-500 via-violet-500 to-purple-600',
    bgGradient: 'from-purple-50 via-violet-50 to-indigo-50',
    darkBgGradient: 'from-purple-900/20 via-violet-900/20 to-indigo-900/20',
    dateLabel: 'Geburtstagsdatum',
    endDateLabel: 'Ende der Party',
    icon: '🎂',
    momentsText: 'Party-Momente'
  },
  urlaub: {
    name: 'Urlaub 🏖️',
    description: 'Sammelt eure schönsten Reiseerinnerungen',
    primaryColor: 'blue-500',
    secondaryColor: 'cyan-500',
    gradient: 'from-blue-500 via-cyan-500 to-blue-600',
    bgGradient: 'from-blue-50 via-cyan-50 to-teal-50',
    darkBgGradient: 'from-blue-900/20 via-cyan-900/20 to-teal-900/20',
    dateLabel: 'Reisebeginn',
    endDateLabel: 'Rückkehr',
    icon: '🏖️',
    momentsText: 'Reise-Momente'
  },
  eigenes: {
    name: 'Eigenes Event 🎊',
    description: 'Für alle anderen besonderen Anlässe',
    primaryColor: 'green-500',
    secondaryColor: 'emerald-500',
    gradient: 'from-green-500 via-emerald-500 to-green-600',
    bgGradient: 'from-green-50 via-emerald-50 to-teal-50',
    darkBgGradient: 'from-green-900/20 via-emerald-900/20 to-teal-900/20',
    dateLabel: 'Event-Datum',
    endDateLabel: 'Event-Ende',
    icon: '🎊',
    momentsText: 'Event-Momente'
  }
};

export const LandingPage: React.FC<LandingPageProps> = ({ onCreateGallery, onRootAdminLogin }) => {
  // Force light mode for landing page
  const isLight = true;
  const [formData, setFormData] = useState<GalleryCreationData>({
    eventName: '',
    slug: '',
    theme: 'hochzeit',
    password: '',
    eventDate: '',
    endDate: '',
    description: '',
    ownerName: '',
    ownerEmail: '',
    userEmail: '',
    userPassword: '',
    selectedPlan: undefined
  });

  const [showForm, setShowForm] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showImprint, setShowImprint] = useState(false);
  const [floatingElements, setFloatingElements] = useState<Array<{id: number, x: number, y: number, delay: number}>>([]);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    // Create floating animation elements
    const elements = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5
    }));
    setFloatingElements(elements);

    // Trigger entrance animation
    setIsAnimating(true);
  }, []);

  const generateSlug = (eventName: string) => {
    return eventName
      .toLowerCase()
      .replace(/[äöüß]/g, (match) => ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }[match] || match))
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleEventNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      eventName: value,
      slug: generateSlug(value)
    }));
  };

  const handlePlanSelect = (planId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPlan: planId as 'free' | 'basic' | 'pro'
    }));
    // After plan selection, show the gallery creation form
    setShowForm(true);
  };

  const validateSlug = (slug: string) => {
    if (slug.length < 3) {
      setSlugError('URL muss mindestens 3 Zeichen lang sein');
      return false;
    }
    if (slug.length > 50) {
      setSlugError('URL darf maximal 50 Zeichen lang sein');
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setSlugError('URL darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten');
      return false;
    }
    setSlugError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSlug(formData.slug)) {
      return;
    }

    if (!formData.eventName.trim() || !formData.userEmail.trim() || !formData.userPassword.trim()) {
      return;
    }

    // Validate selected plan
    if (!formData.selectedPlan) {
      alert('Bitte wählen Sie einen Tarif aus.');
      return;
    }

    setIsCreating(true);
    try {
      // Validate password strength first
      if (formData.userPassword.length < 6) {
        alert('Das Passwort muss mindestens 6 Zeichen lang sein.');
        setIsCreating(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.userEmail)) {
        alert('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
        setIsCreating(false);
        return;
      }

      // Check if payment is required for paid plans
      if (formData.selectedPlan !== 'free') {
        const confirmed = confirm(
          `Sie haben den ${formData.selectedPlan === 'basic' ? 'Basic (9€)' : 'Pro (19€)'} Tarif gewählt. ` +
          'Nach der Galerie-Erstellung werden Sie zur Zahlung weitergeleitet. Möchten Sie fortfahren?'
        );
        
        if (!confirmed) {
          setIsCreating(false);
          return;
        }
      }

      // Create gallery data with proper plan validation
      const galleryData = {
        ...formData,
        ownerEmail: formData.userEmail,
        selectedPlan: formData.selectedPlan
      };

      console.log('Creating gallery with plan:', formData.selectedPlan, galleryData);
      await onCreateGallery(galleryData);
    } catch (error: any) {
      console.error('Error creating gallery:', error);
      if (error.code === 'auth/weak-password') {
        alert('Das Passwort ist zu schwach. Bitte wählen Sie ein stärkeres Passwort (mindestens 6 Zeichen).');
      } else if (error.code === 'auth/invalid-email') {
        alert('Ungültige E-Mail-Adresse. Bitte überprüfen Sie Ihre Eingabe.');
      } else if (error.code === 'auth/wrong-password') {
        alert('Falsches Passwort. Bitte versuchen Sie es erneut.');
      } else if (error.code === 'auth/invalid-credential') {
        alert('Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.');
      } else if (error.code === 'auth/user-not-found') {
        alert('Benutzer nicht gefunden. Bitte überprüfen Sie Ihre E-Mail-Adresse.');
      } else if (error.code === 'auth/network-request-failed') {
        alert('Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.');
      } else {
        alert(`Fehler beim Erstellen der Galerie: ${error.message || 'Unbekannter Fehler'}. Bitte versuchen Sie es erneut.`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email.trim() || !loginData.password.trim()) {
      return;
    }

    setIsLoggingIn(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        alert('Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse. Prüfen Sie Ihr Postfach.');
        return;
      }

      // Successfully logged in - find and redirect to user's galleries
      try {
        const userGalleries = await galleryService.getGalleriesByOwnerEmail(userCredential.user.email!);
        
        if (userGalleries.length > 0) {
          // Redirect to the most recent gallery
          const mostRecentGallery = userGalleries.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
          
          alert(`Anmeldung erfolgreich! Sie werden zu Ihrer Galerie "${mostRecentGallery.eventName}" weitergeleitet.`);
          window.location.href = `/${mostRecentGallery.slug}`;
        } else {
          alert('Anmeldung erfolgreich! Sie haben noch keine Galerien erstellt.');
          setShowLogin(false);
          setLoginData({ email: '', password: '' });
        }
      } catch (error) {
        console.error('Error fetching user galleries:', error);
        alert('Anmeldung erfolgreich! Fehler beim Laden Ihrer Galerien.');
        setShowLogin(false);
        setLoginData({ email: '', password: '' });
      }
      
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found') {
        alert('Kein Konto mit dieser E-Mail-Adresse gefunden.');
      } else if (error.code === 'auth/wrong-password') {
        alert('Falsches Passwort. Bitte versuchen Sie es erneut.');
      } else if (error.code === 'auth/invalid-email') {
        alert('Ungültige E-Mail-Adresse.');
      } else {
        alert('Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const features = [
    {
      icon: <Camera className="w-6 h-6" />,
      title: "Instagram-Style Feed",
      description: "Teilt Fotos & Videos in Echtzeit"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Live Presence",
      description: "Seht wer gerade online ist"
    },
    {
      icon: <Music className="w-6 h-6" />,
      title: "Spotify Integration",
      description: "Gemeinsame Musikwünsche"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Stories & Timeline",
      description: "24h Stories & Meilensteine"
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Simplified animated background - optimized for mobile */}
      <div className="absolute inset-0 opacity-80 overflow-hidden">
        {/* Simple gradient base */}
        <div className="absolute inset-0" 
          style={{
            background: `linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ff6b6b 100%)`,
            animation: 'gradientShift 8s ease-in-out infinite alternate'
          }}
        />
        
        {/* Reduced floating shapes for mobile performance */}
        <div className="absolute inset-0 hidden sm:block">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full blur-sm bg-white/20"
              style={{
                width: `${20 + i * 10}px`,
                height: `${20 + i * 10}px`,
                left: `${10 + i * 20}%`,
                top: `${20 + i * 15}%`,
                animation: `floatUpDown ${4 + i}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.5}s`
              }}
            />
          ))}
        </div>
        
        {/* Minimal sparkles for mobile */}
        <div className="absolute inset-0 hidden md:block">
          {[...Array(6)].map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute text-white/30"
              style={{
                left: `${10 + i * 15}%`,
                top: `${20 + i * 12}%`,
                animation: `sparkle ${2 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.8}s`
              }}
            >
              <Sparkles size={6} />
            </div>
          ))}
        </div>
        
        {/* Simple overlay for mobile */}
        <div className="absolute inset-0 opacity-40" 
          style={{
            background: `
              radial-gradient(ellipse 100% 80% at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 70%)
            `
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 z-10">
        {/* Apple-style Hero Section */}
        <div className="text-center">
          {/* Logo */}
          <div className="mb-12">
            <img 
              src="/telya_logo.png" 
              alt="Telya Logo" 
              className="mx-auto h-20 w-auto opacity-90 drop-shadow-lg"
            />
          </div>

          {/* Apple-style Subheadline */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-light mb-8 max-w-4xl mx-auto leading-relaxed drop-shadow-sm text-white" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
            Eure Momente, für die Ewigkeit
          </h2>

          {/* Apple-style Description */}
          <p className="text-xl md:text-2xl font-light mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-sm text-white/90" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
            Die moderne Event-Galerie für eure besonderen Momente. Instagram-Style, Echtzeit, Privat.
          </p>

          {/* Buttons removed per user request */}
        </div>

        {/* Apple-style Features Grid */}
        <div className="mt-32">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center group backdrop-blur-sm bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <div className="mb-6 text-white/80 group-hover:scale-105 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-light mb-3 drop-shadow-sm text-white" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
                  {feature.title}
                </h3>
                <p className="text-base font-light leading-relaxed drop-shadow-sm text-white/80" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mt-32">
          <PricingSection 
            onSelectPlan={handlePlanSelect}
            selectedPlan={formData.selectedPlan}
          />
        </div>
      </div>

      {/* Apple-style Gallery Creation Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-start sm:items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
          <div className="w-full max-w-xl rounded-xl sm:rounded-2xl my-4 sm:my-0 bg-white/95 backdrop-blur-xl shadow-2xl">
            <div className="p-4 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-light mb-6 sm:mb-8 text-center text-black" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
                Eure Event-Galerie erstellen
              </h3>

              {/* Plan Selection Status */}
              {!formData.selectedPlan && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-orange-600 text-sm font-semibold">!</span>
                    </div>
                    <div>
                      <p className="text-orange-800 font-medium">Tarif wählen erforderlich</p>
                      <p className="text-orange-700 text-sm">Bitte wählen Sie zuerst einen Tarif aus der Preisliste unten aus.</p>
                    </div>
                  </div>
                </div>
              )}

              {formData.selectedPlan && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 text-sm">✓</span>
                    </div>
                    <div>
                      <p className="text-green-800 font-medium">
                        {formData.selectedPlan === 'free' ? 'Kostenlos' : 
                         formData.selectedPlan === 'basic' ? 'Basic (9€)' : 'Pro (19€)'} Tarif ausgewählt
                      </p>
                      <p className="text-green-700 text-sm">Sie können jetzt Ihre Galerie erstellen.</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                {/* Apple-style Theme Selection */}
                <div>
                  <label className={`block text-sm sm:text-base font-light mb-3 sm:mb-4 ${
                    'text-gray-700'
                  }`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                    Event-Typ wählen
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {Object.entries(THEMES).map(([key, theme]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, theme: key as any }))}
                        className={`p-4 sm:p-6 rounded-xl border transition-all duration-200 text-left touch-manipulation min-h-[80px] ${
                          formData.theme === key
                            ? `bg-${theme.primaryColor}/10 border-${theme.primaryColor}/30 text-black shadow-lg shadow-${theme.primaryColor}/20`
                            : 'bg-gray-50/50 border-gray-200/50 text-gray-700 hover:bg-gray-100/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                          <span className="text-lg sm:text-xl">{theme.icon}</span>
                          <span className="font-light text-sm sm:text-base" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                            {theme.name}
                          </span>
                        </div>
                        <p className={`text-xs sm:text-sm font-light ${
                          formData.theme === key 
                            ? 'text-gray-600'
                            : 'text-gray-500'
                        }`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                          {theme.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Apple-style Event Name */}
                <div>
                  <label className={`block text-sm sm:text-base font-light mb-2 sm:mb-3 ${
                    'text-gray-700'
                  }`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                    Event-Name
                  </label>
                  <input
                    type="text"
                    value={formData.eventName}
                    onChange={(e) => handleEventNameChange(e.target.value)}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 text-base sm:text-lg rounded-xl border-0 transition-all duration-200 focus:outline-none focus:ring-1 touch-manipulation bg-white text-black placeholder-gray-400 focus:ring-black/30"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
                    placeholder="z.B. Julia & Tim, 30. Geburtstag, Rom Urlaub..."
                    required
                  />
                </div>

                {/* URL Slug */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${'text-gray-700'}`}>
                    Galerie-URL
                  </label>
                  <div className={`flex items-center px-3 sm:px-4 py-3 rounded-xl border touch-manipulation ${
                    slugError 
                      ? 'border-red-500' 
                      : 'border-gray-300 bg-white'
                  }`}>
                    <span className={`mr-1 sm:mr-2 text-sm sm:text-base ${'text-gray-500'}`}>
                      telya.app/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, slug: e.target.value }));
                        validateSlug(e.target.value);
                      }}
                      className={`flex-1 bg-transparent outline-none text-sm sm:text-base ${
                        'text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="julia-und-tim"
                      required
                    />
                  </div>
                  {slugError && <p className="text-red-500 text-xs sm:text-sm mt-1">{slugError}</p>}
                </div>

                {/* Email Registration */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${'text-gray-700'}`}>
                    E-Mail-Adresse (für Galerie-Verwaltung)
                  </label>
                  <input
                    type="email"
                    value={formData.userEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, userEmail: e.target.value }))}
                    className={`w-full px-3 sm:px-4 py-3 text-sm sm:text-base rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation ${
                      false
                        ? 'bg-neutral-700 border-neutral-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="ihre.email@beispiel.de"
                    required
                  />
                </div>

                {/* User Password */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${'text-gray-700'}`}>
                    Passwort (für Galerie-Verwaltung)
                  </label>
                  <input
                    type="password"
                    value={formData.userPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, userPassword: e.target.value }))}
                    className={`w-full px-3 sm:px-4 py-3 text-sm sm:text-base rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation ${
                      false
                        ? 'bg-neutral-700 border-neutral-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Mindestens 6 Zeichen"
                    required
                    minLength={6}
                  />
                  <p className={`text-xs mt-1 ${'text-gray-500'}`}>
                    Mit diesem Konto können Sie Ihre Galerie verwalten und Einstellungen ändern.
                  </p>
                </div>

                {/* Optional Gallery Password */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${'text-gray-700'}`}>
                    Galerie-Passwort (optional)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className={`w-full px-3 sm:px-4 py-3 text-sm sm:text-base rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation ${
                      false
                        ? 'bg-neutral-700 border-neutral-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Für private Galerien"
                  />
                  <p className={`text-xs mt-1 ${'text-gray-500'}`}>
                    Optional: Zusätzlicher Schutz für Ihre Galerie. Gäste müssen dieses Passwort eingeben.
                  </p>
                </div>

                {/* Apple-style Form Buttons - Mobile Optimized */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 sm:pt-8">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className={`w-full sm:flex-1 py-3 sm:py-4 px-4 sm:px-6 font-light text-base sm:text-lg rounded-xl transition-all duration-200 ${
                      false
                        ? 'bg-neutral-800/70 text-gray-300 hover:bg-neutral-700/70' 
                        : 'bg-gray-100/70 text-gray-700 hover:bg-gray-200/70'
                    }`}
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className={`w-full sm:flex-1 py-3 sm:py-4 px-4 sm:px-6 font-light text-base sm:text-lg rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      false
                        ? 'bg-white text-black hover:bg-gray-100' 
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
                  >
                    {isCreating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                        Wird erstellt...
                      </>
                    ) : (
                      'Galerie erstellen'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
          <div className={`w-full max-w-md rounded-xl sm:rounded-2xl ${
            'bg-white/95'
          } backdrop-blur-xl shadow-2xl`}>
            <div className="p-6 sm:p-8">
              <h3 className={`text-2xl sm:text-3xl font-light mb-6 text-center ${
                'text-black'
              }`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
                Bei Ihrer Galerie anmelden
              </h3>

              <form onSubmit={handleLogin} className="space-y-6">
                {/* Email */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${'text-gray-700'}`}>
                    E-Mail-Adresse
                  </label>
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full px-4 py-3 text-base rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation ${
                      false
                        ? 'bg-neutral-700 border-neutral-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="ihre.email@beispiel.de"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${'text-gray-700'}`}>
                    Passwort
                  </label>
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className={`w-full px-4 py-3 text-base rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation ${
                      false
                        ? 'bg-neutral-700 border-neutral-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Ihr Passwort"
                    required
                  />
                </div>

                {/* Form Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLogin(false);
                      setLoginData({ email: '', password: '' });
                    }}
                    className={`w-full sm:flex-1 py-3 px-4 font-light text-base rounded-xl transition-all duration-200 ${
                      false
                        ? 'bg-neutral-800/70 text-gray-300 hover:bg-neutral-700/70' 
                        : 'bg-gray-100/70 text-gray-700 hover:bg-gray-200/70'
                    }`}
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className={`w-full sm:flex-1 py-3 px-4 font-light text-base rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      false
                        ? 'bg-white text-black hover:bg-gray-100' 
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
                  >
                    {isLoggingIn ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                        Wird angemeldet...
                      </>
                    ) : (
                      'Anmelden'
                    )}
                  </button>
                </div>
              </form>

              <div className={`mt-6 text-center text-sm ${'text-gray-600'}`}>
                <p>Noch kein Konto? Erstellen Sie eine neue Galerie.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Imprint Modal */}
      {showImprint && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl ${
            'bg-white/95 backdrop-blur-sm'
          } animate-slideInUp`}>
            <div className="p-8 text-center">
              <div className="mb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl">
                    <Code className="w-6 h-6 text-white" />
                  </div>
                  <Terminal className="w-8 h-8 text-green-500 animate-pulse" />
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${'text-gray-900'}`}>
                  &lt;/&gt; Coded by Mauro
                </h3>
                <div className={`font-mono text-sm ${'text-green-600'} mb-4`}>
                  <div className="animate-typewriter">
                    <span className="opacity-60">$</span> git commit -m "Built with ❤️"
                  </div>
                  <div className="animate-typewriter" style={{ animationDelay: '1s' }}>
                    <span className="opacity-60">$</span> npm run deploy --production
                  </div>
                  <div className="animate-typewriter" style={{ animationDelay: '2s' }}>
                    <span className="opacity-60">$</span> echo "Made in Germany 🇩🇪"
                  </div>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl mb-6 ${
                'bg-gray-50'
              }`}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-500 animate-bounce" />
                  <span className={`font-medium ${'text-gray-900'}`}>
                    Full-Stack Developer
                  </span>
                </div>
                <p className={`text-sm ${'text-gray-600'}`}>
                  React • TypeScript • Node.js • Firebase
                </p>
              </div>

              <button
                onClick={() => setShowImprint(false)}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Imprint Button */}
      <button
        onClick={() => setShowImprint(true)}
        className={`fixed bottom-4 right-4 p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 z-40 touch-manipulation ${
          false
            ? 'bg-neutral-800/80 text-white border border-neutral-700' 
            : 'bg-white/80 text-gray-900 border border-gray-200'
        }`}
        style={{ minHeight: '48px', minWidth: '48px' }}
      >
        <Code className="w-5 h-5" />
      </button>

      {/* Root Admin Access (hidden) */}
      {onRootAdminLogin && (
        <button
          onClick={onRootAdminLogin}
          className="fixed bottom-4 left-4 p-2 rounded-full opacity-10 hover:opacity-50 transition-opacity z-40 touch-manipulation"
          style={{ minHeight: '48px', minWidth: '48px' }}
        >
          <Shield className="w-4 h-4" />
        </button>
      )}


    </div>
  );
};