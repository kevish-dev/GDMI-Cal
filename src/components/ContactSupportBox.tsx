import { Phone, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ContactSupportBoxProps {
  className?: string;
  compact?: boolean;
}

export function ContactSupportBox({ className, compact = false }: ContactSupportBoxProps) {
  const handleCallNow = () => {
    // Replace with actual phone number
    window.open("tel:+919971187600", "_self");
  };

  const handleWhatsApp = () => {
    // Replace with actual WhatsApp number and message
    const message = encodeURIComponent("Hi, I'm facing difficulty with filling details for jewelry calculation. Can you help me?");
    window.open(`https://wa.me/919971187600?text=${message}`, "_blank");
  };

  if (compact) {
    return (
      <div className={`text-center space-y-2 ${className || ""}`}>
        <p className="text-sm text-muted-foreground">
          Facing difficulty with filling details?
        </p>
        <div className="flex justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCallNow}
            className="flex items-center gap-1 text-xs"
          >
            <Phone className="h-3 w-3" />
            Call Now
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleWhatsApp}
            className="flex items-center gap-1 text-xs"
          >
            <MessageCircle className="h-3 w-3" />
            WhatsApp
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className={`border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 ${className || ""}`}>
      <CardContent className="p-4 text-center">
        <div className="flex items-center justify-center mb-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Phone className="h-5 w-5 text-primary" />
          </div>
        </div>
        <h3 className="font-semibold text-lg mb-2">Need Help?</h3>
        <p className="text-muted-foreground mb-4">
          Facing difficulty with filling details? Our experts are here to help!
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            onClick={handleCallNow}
            className="flex items-center gap-2 bg-primary"
          >
            <Phone className="h-4 w-4" />
            Call Now
          </Button>
          <Button
            variant="outline"
            onClick={handleWhatsApp}
            className="flex items-center gap-2 border-green-500 text-green-600"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp Us
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Available 9 AM - 8 PM (Mon-Sat)
        </p>
      </CardContent>
    </Card>
  );
}