import React from 'react';
import { Check, Star, Crown, Heart } from 'lucide-react';

interface PricingTier {
  id: 'free' | 'basic' | 'pro';
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  icon: React.ReactNode;
  buttonText: string;
  buttonStyle: string;
  disabled?: boolean;
}

interface PricingSectionProps {
  onSelectPlan: (planId: string) => void;
  selectedPlan?: string;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan, selectedPlan }) => {
  const pricingTiers: PricingTier[] = [
    {
      id: 'free',
      name: 'Kostenlos',
      price: '0€',
      period: 'Testphase',
      description: 'Alle Features kostenlos während der Testphase',
      icon: <Heart className="w-6 h-6" />,
      features: [
        'Instagram-Style Foto-Feed',
        'Instagram Stories (24h)',
        'Unbegrenzte Fotos & Videos',
        'Person-Tagging in Bildern',
        'Live-User Anzeige',
        'Event-Timeline mit Meilensteinen',
        'Spotify Music Wishlist',
        'GPS-Location Tagging',
        'Push-Benachrichtigungen',
        'ZIP-Download aller Medien',
        'Admin-Bereich',
        'WhatsApp Galerie-Sharing',
        'Nutzer-Management',
        'Event-Countdown Timer',
        'Custom Event-Themes'
      ],
      buttonText: 'Kostenlos starten',
      buttonStyle: 'border-2 transition-all duration-300 hover:scale-105 border-gray-300 text-gray-600 hover:border-gray-500 hover:text-gray-800'
    },
    {
      id: 'basic',
      name: 'Basic',
      price: '9€',
      period: 'pro Event',
      description: 'Ideal für Hochzeiten & Geburtstage',
      icon: <Star className="w-6 h-6" />,
      highlighted: true,
      disabled: true,
      features: [
        'Alles aus Kostenlos',
        'Instagram Stories (24h)',
        'Unbegrenzte Fotos & Videos',
        'Person-Tagging in Bildern',
        'Live-User Anzeige',
        'Erweiterte Kommentar-Features',
        'Admin-Bereich',
        'WhatsApp Galerie-Sharing'
      ],
      buttonText: 'Bald verfügbar',
      buttonStyle: `
        bg-gray-400 text-gray-600 cursor-not-allowed
        border-2 border-gray-400
      `
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '19€',
      period: 'pro Event',
      description: 'Vollständige Event-Lösung',
      icon: <Crown className="w-6 h-6" />,
      disabled: true,
      features: [
        'Alles aus Basic',
        'Event-Timeline mit Meilensteinen',
        'Spotify Music Wishlist',
        'GPS-Location Tagging',
        'Push-Benachrichtigungen',
        'ZIP-Download aller Medien',
        'Erweiterte Admin-Controls',
        'Custom Event-Themes',
        'Nutzer-Management',
        'Event-Countdown Timer',
        'Prioritärer Support'
      ],
      buttonText: 'Bald verfügbar',
      buttonStyle: `
        bg-gray-400 text-gray-600 cursor-not-allowed
        border-2 border-gray-400
      `
    }
  ];

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-white drop-shadow-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
            Wähle deinen perfekten Plan
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto drop-shadow-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
            Von kostenlosen Galerien bis hin zu professionellen Event-Lösungen - 
            finde den Plan, der zu deiner Feier passt.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`
                relative rounded-2xl p-8 backdrop-blur-sm border border-white/20
                ${tier.disabled 
                  ? `opacity-50 cursor-not-allowed bg-gray-800/30 shadow-lg` 
                  : `transition-all duration-300 hover:scale-105 ${
                      selectedPlan === tier.id
                        ? `ring-4 ring-green-500 bg-green-500/20 shadow-2xl transform scale-105`
                        : tier.highlighted 
                          ? `ring-2 ring-pink-500 bg-white/20 shadow-2xl` 
                          : `bg-white/10 shadow-lg hover:shadow-xl hover:bg-white/20`
                    }`
                }
              `}
            >
              {/* Popular Badge or Disabled Badge */}
              {tier.disabled && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gray-600 text-gray-300 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm">
                    Bald verfügbar
                  </div>
                </div>
              )}
              {tier.highlighted && !tier.disabled && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm">
                    Beliebteste Wahl
                  </div>
                </div>
              )}

              {/* Icon & Header */}
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 backdrop-blur-sm ${
                  tier.disabled
                    ? 'bg-gray-600/50 text-gray-400'
                    : tier.highlighted 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' 
                      : 'bg-white/20 text-white'
                }`}>
                  {tier.icon}
                </div>
                <h3 className={`text-2xl font-bold mb-2 drop-shadow-sm ${tier.disabled ? 'text-gray-400' : 'text-white'}`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
                  {tier.name}
                </h3>
                <div className="mb-2">
                  <span className={`text-4xl font-bold drop-shadow-sm ${
                    tier.disabled 
                      ? 'text-gray-400' 
                      : tier.highlighted 
                        ? 'text-pink-300' 
                        : 'text-white'
                  }`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
                    {tier.price}
                  </span>
                  <span className={`text-lg ml-2 drop-shadow-sm ${tier.disabled ? 'text-gray-500' : 'text-white/80'}`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                    {tier.period}
                  </span>
                </div>
                <p className={`drop-shadow-sm ${tier.disabled ? 'text-gray-500' : 'text-white/90'}`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                  {tier.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${
                      tier.disabled 
                        ? 'text-gray-500' 
                        : tier.highlighted 
                          ? 'text-pink-300' 
                          : 'text-green-300'
                    }`} />
                    <span className={`drop-shadow-sm ${tier.disabled ? 'text-gray-500' : 'text-white/90'}`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => !tier.disabled && onSelectPlan(tier.id)}
                disabled={tier.disabled}
                className={`
                  w-full py-4 px-6 rounded-xl font-semibold text-lg backdrop-blur-sm transition-all duration-200
                  ${tier.disabled 
                    ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed border-2 border-gray-600/50' 
                    : selectedPlan === tier.id 
                      ? 'bg-green-500/90 text-white border-2 border-green-400 shadow-lg' 
                      : tier.highlighted
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-2 border-transparent hover:shadow-lg hover:scale-105'
                        : 'border-2 border-white/60 text-white hover:bg-white/10 hover:border-white/80'
                  }
                `}
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
              >
                {tier.disabled 
                  ? tier.buttonText 
                  : selectedPlan === tier.id 
                    ? '✓ Ausgewählt' 
                    : tier.buttonText
                }
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold mb-8 text-white drop-shadow-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
            Häufig gestellte Fragen
          </h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-6 rounded-xl backdrop-blur-sm bg-white/10 border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-300">
              <h4 className="font-semibold mb-3 text-white drop-shadow-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                Wie lange sind die Galerien verfügbar?
              </h4>
              <p className="text-white/90 drop-shadow-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                Basic und Pro Galerien bleiben 6 Monate nach dem Event aktiv. 
                Kostenlose Galerien 3 Monate.
              </p>
            </div>
            <div className="p-6 rounded-xl backdrop-blur-sm bg-white/10 border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-300">
              <h4 className="font-semibold mb-3 text-white drop-shadow-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                Können Gäste ohne App teilnehmen?
              </h4>
              <p className="text-white/90 drop-shadow-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                Ja! Alle Galerien funktionieren direkt im Browser ohne App-Download.
              </p>
            </div>
            <div className="p-6 rounded-xl backdrop-blur-sm bg-white/10 border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-300">
              <h4 className="font-semibold mb-3 text-white drop-shadow-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                Gibt es versteckte Kosten?
              </h4>
              <p className="text-white/90 drop-shadow-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                Nein! Alle Preise sind transparent. Keine Setup-Gebühren oder versteckten Kosten.
              </p>
            </div>
            <div className="p-6 rounded-xl backdrop-blur-sm bg-white/10 border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-300">
              <h4 className="font-semibold mb-3 text-white drop-shadow-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                Kann ich zwischen Plänen wechseln?
              </h4>
              <p className="text-white/90 drop-shadow-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                Ja! Du kannst jederzeit von kostenlos auf Basic/Pro upgraden.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};