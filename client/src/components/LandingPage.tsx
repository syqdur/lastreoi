import React, { useState, useEffect } from 'react';
import { Heart, Camera, Music, Users, Star, ArrowRight, Sparkles, Globe, Shield, Clock, Code, Terminal, Zap } from 'lucide-react';
import { TelyaLogo } from './TelyaLogo';

interface LandingPageProps {
  isDarkMode: boolean;
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

export const LandingPage: React.FC<LandingPageProps> = ({ isDarkMode, onCreateGallery, onRootAdminLogin }) => {
  const [formData, setFormData] = useState<GalleryCreationData>({
    eventName: '',
    slug: '',
    theme: 'hochzeit',
    password: '',
    eventDate: '',
    endDate: '',
    description: '',
    ownerName: '',
    ownerEmail: ''
  });

  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showImprint, setShowImprint] = useState(false);
  const [floatingElements, setFloatingElements] = useState<Array<{id: number, x: number, y: number, delay: number}>>([]);

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

    if (!formData.eventName.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      await onCreateGallery(formData);
    } catch (error) {
      console.error('Error creating gallery:', error);
    } finally {
      setIsCreating(false);
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
    <div className={`min-h-screen relative overflow-hidden ${
      isDarkMode 
        ? 'bg-black' 
        : 'bg-white'
    }`}>
      {/* Apple-style flowing gradient background */}
      <div className="absolute inset-0 opacity-80">
        <div className={`absolute inset-0 ${
          isDarkMode 
            ? 'opacity-30' 
            : 'opacity-100'
        }`} style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, #ff6b6b 0%, transparent 50%),
            radial-gradient(ellipse 60% 50% at 80% 50%, #4ecdc4 0%, transparent 50%),
            radial-gradient(ellipse 70% 50% at 40% 80%, #45b7d1 0%, transparent 50%),
            radial-gradient(ellipse 100% 70% at 80% 20%, #96ceb4 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 10% 90%, #ffeaa7 0%, transparent 50%),
            linear-gradient(135deg, #667eea 0%, #764ba2 100%)
          `
        }} />
        
        {/* Apple-style flowing shapes overlay */}
        <div className={`absolute inset-0 ${
          isDarkMode 
            ? 'opacity-20' 
            : 'opacity-60'
        }`} style={{
          background: `
            radial-gradient(ellipse 120% 80% at 30% 60%, rgba(255, 107, 107, 0.3) 0%, transparent 60%),
            radial-gradient(ellipse 100% 60% at 70% 30%, rgba(78, 205, 196, 0.3) 0%, transparent 60%),
            radial-gradient(ellipse 80% 100% at 60% 70%, rgba(69, 183, 209, 0.3) 0%, transparent 60%)
          `
        }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-20 z-10">
        {/* Apple-style Hero Section */}
        <div className="text-center">
          {/* Apple-style Logo */}
          <div className="mb-12">
            <TelyaLogo size="lg" className="mx-auto opacity-90 drop-shadow-lg" />
          </div>

          {/* Apple-style Headline */}
          <h1 className={`text-5xl md:text-7xl lg:text-8xl font-light tracking-tight mb-8 drop-shadow-sm ${
            isDarkMode ? 'text-white' : 'text-white'
          }`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
            Telya
          </h1>

          {/* Apple-style Subheadline */}
          <h2 className={`text-2xl md:text-3xl lg:text-4xl font-light mb-8 max-w-4xl mx-auto leading-relaxed drop-shadow-sm ${
            isDarkMode ? 'text-gray-200' : 'text-white'
          }`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
            Eure Momente, für die Ewigkeit
          </h2>

          {/* Apple-style Description */}
          <p className={`text-xl md:text-2xl font-light mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-sm ${
            isDarkMode ? 'text-gray-300' : 'text-white/90'
          }`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
            Die moderne Event-Galerie für eure besonderen Momente. Instagram-Style, Echtzeit, Privat.
          </p>

          {/* Apple-style CTA Button */}
          <button
            onClick={() => setShowForm(true)}
            className={`px-8 py-4 text-lg font-medium rounded-full transition-all duration-200 backdrop-blur-sm shadow-lg ${
              isDarkMode 
                ? 'bg-white/90 text-black hover:bg-white' 
                : 'bg-white/90 text-black hover:bg-white'
            }`}
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
          >
            Galerie erstellen
          </button>
        </div>

        {/* Apple-style Features Grid */}
        <div className="mt-32">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center group backdrop-blur-sm bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <div className={`mb-6 ${isDarkMode ? 'text-white/80' : 'text-white/80'} group-hover:scale-105 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className={`text-xl font-light mb-3 drop-shadow-sm ${
                  isDarkMode ? 'text-white' : 'text-white'
                }`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
                  {feature.title}
                </h3>
                <p className={`text-base font-light leading-relaxed drop-shadow-sm ${
                  isDarkMode ? 'text-white/80' : 'text-white/80'
                }`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Apple-style Gallery Creation Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center p-6 z-50">
          <div className={`w-full max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-neutral-900/95' : 'bg-white/95'
          } backdrop-blur-xl shadow-2xl`}>
            <div className="p-8">
              <h3 className={`text-2xl font-light mb-8 text-center ${
                isDarkMode ? 'text-white' : 'text-black'
              }`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
                Eure Event-Galerie erstellen
              </h3>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Apple-style Theme Selection */}
                <div>
                  <label className={`block text-base font-light mb-4 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                    Event-Typ wählen
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(THEMES).map(([key, theme]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, theme: key as any }))}
                        className={`p-6 rounded-xl border transition-all duration-200 text-left ${
                          formData.theme === key
                            ? isDarkMode
                              ? 'bg-white/10 border-white/20 text-white'
                              : 'bg-black/5 border-black/20 text-black'
                            : isDarkMode
                              ? 'bg-neutral-800/50 border-neutral-700/50 text-gray-300 hover:bg-neutral-800'
                              : 'bg-gray-50/50 border-gray-200/50 text-gray-700 hover:bg-gray-100/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xl">{theme.icon}</span>
                          <span className="font-light" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                            {theme.name}
                          </span>
                        </div>
                        <p className={`text-sm font-light ${
                          formData.theme === key 
                            ? isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            : isDarkMode ? 'text-gray-500' : 'text-gray-500'
                        }`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                          {theme.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Apple-style Event Name */}
                <div>
                  <label className={`block text-base font-light mb-3 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                    Event-Name
                  </label>
                  <input
                    type="text"
                    value={formData.eventName}
                    onChange={(e) => handleEventNameChange(e.target.value)}
                    className={`w-full px-4 py-4 text-lg rounded-xl border-0 transition-all duration-200 focus:outline-none focus:ring-1 ${
                      isDarkMode 
                        ? 'bg-neutral-800/70 text-white placeholder-gray-500 focus:ring-white/30' 
                        : 'bg-gray-50/70 text-black placeholder-gray-400 focus:ring-black/30'
                    }`}
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
                    placeholder="z.B. Julia & Tim, 30. Geburtstag, Rom Urlaub..."
                    required
                  />
                </div>

                {/* URL Slug */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Galerie-URL
                  </label>
                  <div className={`flex items-center px-4 py-3 rounded-xl border ${
                    slugError 
                      ? 'border-red-500' 
                      : isDarkMode 
                        ? 'border-neutral-600 bg-neutral-700' 
                        : 'border-gray-300 bg-white'
                  }`}>
                    <span className={`mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      telya.app/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, slug: e.target.value }));
                        validateSlug(e.target.value);
                      }}
                      className={`flex-1 bg-transparent outline-none ${
                        isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="julia-und-tim"
                      required
                    />
                  </div>
                  {slugError && <p className="text-red-500 text-sm mt-1">{slugError}</p>}
                </div>

                {/* Optional Password */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Passwort (optional)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-${THEMES[formData.theme].primaryColor} focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-neutral-700 border-neutral-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Für private Galerien"
                  />
                </div>

                {/* Apple-style Form Buttons */}
                <div className="flex gap-4 pt-8">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className={`flex-1 py-4 px-6 font-light text-lg rounded-xl transition-all duration-200 ${
                      isDarkMode 
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
                    className={`flex-1 py-4 px-6 font-light text-lg rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      isDarkMode 
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

      {/* Imprint Modal */}
      {showImprint && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl ${
            isDarkMode ? 'bg-neutral-800 border border-neutral-700' : 'bg-white/95 backdrop-blur-sm'
          } animate-slideInUp`}>
            <div className="p-8 text-center">
              <div className="mb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl">
                    <Code className="w-6 h-6 text-white" />
                  </div>
                  <Terminal className="w-8 h-8 text-green-500 animate-pulse" />
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  &lt;/&gt; Coded by Mauro
                </h3>
                <div className={`font-mono text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'} mb-4`}>
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
                isDarkMode ? 'bg-neutral-700/50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-500 animate-bounce" />
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Full-Stack Developer
                  </span>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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
        className={`fixed bottom-4 right-4 p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 ${
          isDarkMode 
            ? 'bg-neutral-800/80 text-white border border-neutral-700' 
            : 'bg-white/80 text-gray-900 border border-gray-200'
        }`}
      >
        <Code className="w-5 h-5" />
      </button>

      {/* Root Admin Access (hidden) */}
      {onRootAdminLogin && (
        <button
          onClick={onRootAdminLogin}
          className="fixed bottom-4 left-4 p-2 rounded-full opacity-10 hover:opacity-50 transition-opacity"
        >
          <Shield className="w-4 h-4" />
        </button>
      )}


    </div>
  );
};