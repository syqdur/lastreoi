import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap, ExternalLink } from "lucide-react";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
}

const plans = [
  {
    id: "free",
    name: "Free",
    price: "0€",
    period: "kostenlos",
    icon: <Star className="w-6 h-6" />,
    features: [
      "1 Galerie",
      "Bis zu 50 Medien",
      "Grundlegende Funktionen",
      "Community Support"
    ],
    limitations: [
      "Begrenzte Storage",
      "Kein Premium Support"
    ],
    paypalLink: null,
    popular: false
  },
  {
    id: "basic",
    name: "Basic",
    price: "9,99€",
    period: "einmalig",
    icon: <Zap className="w-6 h-6" />,
    features: [
      "3 Galerien",
      "Bis zu 200 Medien pro Galerie",
      "Alle Grundfunktionen",
      "E-Mail Support",
      "Kein EventPix Branding",
      "Erweiterte Timeline"
    ],
    limitations: [],
    paypalLink: "https://paypal.me/mauromorelli/9.99",
    popular: true
  },
  {
    id: "pro",
    name: "Pro",
    price: "19,99€",
    period: "einmalig",
    icon: <Crown className="w-6 h-6" />,
    features: [
      "Unbegrenzte Galerien",
      "Unbegrenzte Medien",
      "Alle Premium-Funktionen",
      "Priority Support",
      "Kein EventPix Branding",
      "Erweiterte Analytics",
      "Custom Domains"
    ],
    limitations: [],
    paypalLink: "https://paypal.me/mauromorelli/19.99",
    popular: false
  }
];

export default function PricingModal({ isOpen, onClose, currentPlan = "free" }: PricingModalProps) {
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);

  const handlePayment = (paypalLink: string | null) => {
    if (paypalLink) {
      window.open(paypalLink, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-6">
            Wählen Sie Ihren Plan
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg ${
                plan.popular
                  ? "border-blue-500 shadow-lg"
                  : selectedPlan === plan.id
                  ? "border-green-500"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white">
                  Beliebt
                </Badge>
              )}
              
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  <div className={`p-3 rounded-full ${
                    plan.popular ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                  }`}>
                    {plan.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-gray-500 ml-2">{plan.period}</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
                {plan.limitations.map((limitation, index) => (
                  <div key={index} className="flex items-center gap-3 opacity-60">
                    <div className="w-4 h-4 flex-shrink-0 border border-gray-400 rounded-full" />
                    <span className="text-sm">{limitation}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {currentPlan === plan.id ? (
                  <Button disabled className="w-full">
                    Aktueller Plan
                  </Button>
                ) : plan.paypalLink ? (
                  <Button
                    onClick={() => handlePayment(plan.paypalLink)}
                    className={`w-full ${
                      plan.popular
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Mit PayPal bezahlen
                  </Button>
                ) : (
                  <Button
                    onClick={() => setSelectedPlan(plan.id)}
                    variant="outline"
                    className="w-full"
                  >
                    Kostenlos starten
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h4 className="font-semibold mb-2">Zahlungshinweis:</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Nach der PayPal-Zahlung senden Sie bitte eine E-Mail an{" "}
            <a href="mailto:mauro.morelli@outlook.de" className="text-blue-600 hover:underline">
              mauro.morelli@outlook.de
            </a>{" "}
            mit Ihrer Transaktions-ID, damit wir Ihr Konto upgraden können.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}