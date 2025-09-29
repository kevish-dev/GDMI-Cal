import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin, User, Phone } from 'lucide-react';
import { useUserVerification } from '@/contexts/UserVerificationContext';
import { getLocationWithFallback } from '@/services/locationService';
import { useToast } from '@/hooks/use-toast';

interface UserVerificationModalProps {
  onSuccess?: () => void;
}

export function UserVerificationModal({ onSuccess }: UserVerificationModalProps) {
  const { isModalOpen, closeVerificationModal, verifyUser } = useUserVerification();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: 'Required Fields Missing',
        description: 'Please fill in both name and phone number.',
        variant: 'destructive',
      });
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^[+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid phone number.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setIsGettingLocation(true);

    try {
      // Get user location
      const location = await getLocationWithFallback();
      
      setIsGettingLocation(false);
      
      // Verify user with collected data
      const { isReturningUser } = await verifyUser({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        location,
      });

      toast({
        title: isReturningUser ? 'Welcome back! 👋' : 'Welcome! 🎉',
        description: isReturningUser 
          ? 'Good to see you again! You can now use our calculator.' 
          : 'Your information has been saved. You can now use our calculator!',
      });

      // Reset form
      setFormData({ name: '', phone: '' });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error during verification:', error);
      toast({
        title: 'Verification Failed',
        description: 'There was an error saving your information. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsGettingLocation(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={() => !isLoading && closeVerificationModal()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Welcome to GDMI Calculator!
          </DialogTitle>
          <DialogDescription>
            To provide you with the best experience, we need some basic information. 
            This is a one-time setup and helps us serve you better.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Full Name *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleInputChange('name')}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number *
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleInputChange('phone')}
              disabled={isLoading}
              required
            />
          </div>

          {isGettingLocation && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Getting your location for better service...</span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeVerificationModal}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.name.trim() || !formData.phone.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isGettingLocation ? 'Getting Location...' : 'Saving...'}
                </>
              ) : (
                'Get Started'
              )}
            </Button>
          </div>
        </form>

        <div className="text-xs text-muted-foreground text-center mt-4">
          Your information is securely stored and will only be used to improve our services.
        </div>
      </DialogContent>
    </Dialog>
  );
}