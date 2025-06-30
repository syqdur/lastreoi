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
      period: 'für immer',
      description: 'Perfekt für kleine Feiern',
      icon: <Heart className="w-6 h-6" />,
      features: [
        'Instagram-Style Foto-Feed',
        'Bis zu 50 Fotos',
        'Grundlegende Kommentare & Likes',
        'Mobil-optimiert',
        'Einfache Galerie-Erstellung'
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
      buttonText: 'Basic wählen',
      buttonStyle: `
        bg-gradient-to-r from-pink-500 to-purple-600 text-white 
        transition-all duration-300 hover:scale-105 hover:shadow-lg
        border-2 border-transparent
      `
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '19€',
      period: 'pro Event',
      description: 'Vollständige Event-Lösung',
      icon: <Crown className="w-6 h-6" />,
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
      buttonText: 'Pro wählen',
      buttonStyle: `
        bg-gradient-to-r from-purple-600 to-indigo-700 text-white 
        transition-all duration-300 hover:scale-105 hover:shadow-lg
        border-2 border-transparent ring-2 ring-purple-500 ring-opacity-50
      `
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className={`text-4xl font-bold mb-4 'text-gray-900'`}>
            Wähle deinen perfekten Plan
          </h2>
          <p className={`text-xl 'text-gray-600' max-w-3xl mx-auto`}>
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
                relative rounded-2xl p-8 transition-all duration-300 hover:scale-105
                ${selectedPlan === tier.id
                  ? `ring-4 ring-green-500 bg-green-50 shadow-2xl transform scale-105`
                  : tier.highlighted 
                    ? `ring-2 ring-pink-500 'bg-white' shadow-2xl` 
                    : `'bg-white' shadow-lg hover:shadow-xl`
                }
              `}
            >
              {/* Popular Badge */}
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Beliebteste Wahl
                  </div>
                </div>
              )}

              {/* Icon & Header */}
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  tier.highlighted 
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tier.icon}
                </div>
                <h3 className={`text-2xl font-bold mb-2 'text-gray-900'`}>
                  {tier.name}
                </h3>
                <div className="mb-2">
                  <span className={`text-4xl font-bold ${tier.highlighted ? 'text-pink-500' : 'text-gray-900'}`}>
                    {tier.price}
                  </span>
                  <span className={`text-lg 'text-gray-500' ml-2`}>
                    {tier.period}
                  </span>
                </div>
                <p className={`'text-gray-600'`}>
                  {tier.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${
                      tier.highlighted ? 'text-pink-500' : 'text-green-500'
                    }`} />
                    <span className={`'text-gray-700'`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => onSelectPlan(tier.id)}
                className={`
                  w-full py-4 px-6 rounded-xl font-semibold text-lg
                  ${selectedPlan === tier.id ? 'bg-green-600 text-white border-2 border-green-600' : tier.buttonStyle}
                `}
              >
                {selectedPlan === tier.id ? '✓ Ausgewählt' : tier.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <h3 className={`text-2xl font-bold mb-8 'text-gray-900'`}>
            Häufig gestellte Fragen
          </h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className={`p-6 rounded-xl 'bg-white' shadow-lg`}>
              <h4 className={`font-semibold mb-3 'text-gray-900'`}>
                Wie lange sind die Galerien verfügbar?
              </h4>
              <p className={`'text-gray-600'`}>
                Basic und Pro Galerien bleiben 6 Monate nach dem Event aktiv. 
                Kostenlose Galerien 3 Monate.
              </p>
            </div>
            <div className={`p-6 rounded-xl 'bg-white' shadow-lg`}>
              <h4 className={`font-semibold mb-3 'text-gray-900'`}>
                Können Gäste ohne App teilnehmen?
              </h4>
              <p className={`'text-gray-600'`}>
                Ja! Alle Galerien funktionieren direkt im Browser ohne App-Download.
              </p>
            </div>
            <div className={`p-6 rounded-xl 'bg-white' shadow-lg`}>
              <h4 className={`font-semibold mb-3 'text-gray-900'`}>
                Gibt es versteckte Kosten?
              </h4>
              <p className={`'text-gray-600'`}>
                Nein! Alle Preise sind transparent. Keine Setup-Gebühren oder versteckten Kosten.
              </p>
            </div>
            <div className={`p-6 rounded-xl 'bg-white' shadow-lg`}>
              <h4 className={`font-semibold mb-3 'text-gray-900'`}>
                Kann ich zwischen Plänen wechseln?
              </h4>
              <p className={`'text-gray-600'`}>
                Ja! Du kannst jederzeit von kostenlos auf Basic/Pro upgraden.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};