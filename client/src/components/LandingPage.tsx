import React, { useState } from 'react';
import { Heart, Camera, Music, Users, Star, ArrowRight, Sparkles, Globe, Shield, Clock } from 'lucide-react';

interface LandingPageProps {
  isDarkMode: boolean;
  onCreateGallery: (galleryData: GalleryCreationData) => void;
}

export interface GalleryCreationData {
  eventName: string;
  slug: string;
  password?: string;
  eventDate?: string;
  endDate?: string;
  description?: string;
  ownerName?: string;
  ownerEmail?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({ isDarkMode, onCreateGallery }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<GalleryCreationData>({
    eventName: '',
    slug: '',
    password: '',
    eventDate: '',
    endDate: '',
    description: '',
    ownerName: '',
    ownerEmail: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [slugError, setSlugError] = useState('');

  const generateSlug = (eventName: string) => {
    return eventName
      .toLowerCase()
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
    setSlugError('');
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
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Form submitted!', formData);
    console.log('🔍 Event name:', formData.eventName);
    console.log('🔍 Slug:', formData.slug);
    
    if (!validateSlug(formData.slug)) {
      console.log('❌ Slug validation failed');
      alert('URL-Validierung fehlgeschlagen');
      return;
    }

    if (!formData.eventName.trim()) {
      console.log('❌ Event name validation failed');
      alert('Bitte geben Sie einen Event-Namen ein');
      return;
    }

    console.log('✅ Validation passed, creating gallery...');
    setIsCreating(true);
    try {
      console.log('📞 Calling onCreateGallery with:', formData);
      await onCreateGallery(formData);
      console.log('✅ Gallery creation successful');
    } catch (error) {
      console.error('❌ Error creating gallery:', error);
      alert(`Fehler beim Erstellen der Galerie: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setIsCreating(false);
      console.log('🏁 Gallery creation process finished');
    }
  };

  const features = [
    {
      icon: <Camera className="w-6 h-6" />,
      title: 'Instagram-Style Feed',
      description: 'Fotos, Videos und Nachrichten in Echtzeit teilen'
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: '24h Stories',
      description: 'Spontane Momente, die nach einem Tag verschwinden'
    },
    {
      icon: <Music className="w-6 h-6" />,
      title: 'Spotify Integration',
      description: 'Musikwünsche sammeln und direkt zur Playlist hinzufügen'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Live Tracking',
      description: 'Sehen Sie, wer gerade online ist und aktiv teilnimmt'
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: 'Timeline',
      description: 'Interaktive Liebesgeschichte mit Meilensteinen'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Privat & Sicher',
      description: 'Jede Galerie ist standardmäßig privat und geschützt'
    }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-pink-50 via-white to-purple-50'
    }`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-20 left-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${
            isDarkMode ? 'bg-pink-500' : 'bg-pink-300'
          }`}></div>
          <div className={`absolute top-40 right-20 w-24 h-24 rounded-full blur-2xl opacity-30 ${
            isDarkMode ? 'bg-purple-500' : 'bg-purple-300'
          }`}></div>
          <div className={`absolute bottom-20 left-1/4 w-40 h-40 rounded-full blur-3xl opacity-15 ${
            isDarkMode ? 'bg-blue-500' : 'bg-blue-300'
          }`}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <div className="text-center">
            {/* Logo/Brand */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className={`p-4 rounded-2xl ${
                isDarkMode ? 'bg-pink-600' : 'bg-pink-500'
              } text-white shadow-lg`}>
                <Camera className="w-8 h-8" />
              </div>
              <h1 className={`text-4xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                WeddingPix
              </h1>
            </div>

            {/* Hero Title */}
            <h2 className={`text-5xl md:text-6xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Eure Hochzeit,
              <br />
              <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                unvergesslich geteilt
              </span>
            </h2>

            <p className={`text-xl md:text-2xl mb-12 max-w-3xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Erstellt eure eigene private Hochzeitsgalerie in Sekunden. 
              Gäste teilen Momente in Echtzeit – ohne Registrierung, ohne Kompliziertes.
            </p>

            {/* CTA Button */}
            <button
              onClick={() => {
                console.log('Button clicked!');
                setShowCreateForm(true);
              }}
              className={`group inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-xl' 
                  : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-xl'
              }`}
            >
              <Sparkles className="w-6 h-6" />
              Galerie jetzt erstellen
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>

            <p className={`text-sm mt-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              ✨ Kostenlos • Keine Registrierung erforderlich • In 2 Minuten einsatzbereit
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className={`py-20 ${
        isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'
      } backdrop-blur-sm`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className={`text-3xl md:text-4xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Alles was ihr braucht
            </h3>
            <p className={`text-lg ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Professionelle Funktionen für unvergessliche Hochzeitsmomente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`p-8 rounded-2xl transition-all duration-300 hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border border-gray-600/30 hover:bg-gray-700/70' 
                    : 'bg-white/70 border border-gray-200/50 hover:bg-white/90 shadow-lg hover:shadow-xl'
                } backdrop-blur-sm`}
              >
                <div className={`inline-flex p-3 rounded-xl mb-4 ${
                  isDarkMode ? 'bg-pink-600/20 text-pink-400' : 'bg-pink-100 text-pink-600'
                }`}>
                  {feature.icon}
                </div>
                <h4 className={`text-xl font-semibold mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {feature.title}
                </h4>
                <p className={`${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="py-20 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h3 className={`text-3xl md:text-4xl font-bold mb-6 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            So einfach geht's
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            {
              step: '1',
              title: 'Galerie erstellen',
              description: 'Event-Name eingeben, optionales Passwort setzen – fertig!',
              icon: <Globe className="w-8 h-8" />
            },
            {
              step: '2', 
              title: 'Link teilen',
              description: 'QR-Code oder URL an Gäste senden. Keine App-Installation nötig.',
              icon: <Users className="w-8 h-8" />
            },
            {
              step: '3',
              title: 'Momente sammeln',
              description: 'Gäste teilen Fotos, Videos und Nachrichten in Echtzeit.',
              icon: <Heart className="w-8 h-8" />
            }
          ].map((step, index) => (
            <div key={index} className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 ${
                isDarkMode ? 'bg-pink-600 text-white' : 'bg-pink-500 text-white'
              }`}>
                {step.icon}
              </div>
              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mb-4 ${
                isDarkMode ? 'bg-gray-700 text-pink-400' : 'bg-pink-100 text-pink-600'
              }`}>
                {step.step}
              </div>
              <h4 className={`text-xl font-semibold mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {step.title}
              </h4>
              <p className={`${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Gallery Creation Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl p-8 ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-2xl'
          }`}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Eure Galerie erstellen
                </h3>
                <p className={`mt-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  In 2 Minuten einsatzbereit
                </p>
              </div>
              <button
                onClick={() => setShowCreateForm(false)}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <ArrowRight className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Name */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Event Name *
                </label>
                <input
                  type="text"
                  value={formData.eventName}
                  onChange={(e) => handleEventNameChange(e.target.value)}
                  placeholder="z.B. Julia & Tim"
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-pink-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-pink-500'
                  } focus:outline-none focus:ring-2 focus:ring-pink-500/20`}
                  required
                />
              </div>

              {/* URL Slug */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Galerie URL
                </label>
                <div className={`flex items-center rounded-xl border ${
                  isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
                }`}>
                  <span className={`px-4 py-3 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    weddingpix.app/
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => {
                      const slug = generateSlug(e.target.value);
                      setFormData(prev => ({ ...prev, slug }));
                      setSlugError('');
                    }}
                    placeholder="julia-und-tim"
                    className={`flex-1 px-2 py-3 rounded-r-xl border-0 ${
                      isDarkMode 
                        ? 'bg-gray-700 text-white placeholder-gray-400' 
                        : 'bg-gray-50 text-gray-900 placeholder-gray-500'
                    } focus:outline-none`}
                  />
                </div>
                {slugError && (
                  <p className="text-red-500 text-sm mt-1">{slugError}</p>
                )}
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Hochzeitsdatum (optional)
                  </label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-pink-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-pink-500'
                    } focus:outline-none focus:ring-2 focus:ring-pink-500/20`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Passwort (optional)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Für privaten Zugang"
                    className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-pink-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-pink-500'
                    } focus:outline-none focus:ring-2 focus:ring-pink-500/20`}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Beschreibung (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Erzählt euren Gästen mehr über euren besonderen Tag..."
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border resize-none transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-pink-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-pink-500'
                  } focus:outline-none focus:ring-2 focus:ring-pink-500/20`}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className={`flex-1 px-6 py-3 rounded-xl border transition-colors ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                    isCreating
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : isDarkMode
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white'
                        : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white'
                  }`}
                >
                  {isCreating ? (
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 animate-spin" />
                      Erstelle Galerie...
                    </div>
                  ) : (
                    'Galerie erstellen'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
