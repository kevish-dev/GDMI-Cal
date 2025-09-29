/**
 * Location Service
 * Gets user location information using IP geolocation
 */

interface LocationData {
  country: string;
  region: string;
  city: string;
  ip: string;
}

interface IPAPIResponse {
  country_name: string;
  region: string;
  city: string;
  ip: string;
}

export const getUserLocation = async (): Promise<LocationData> => {
  try {
    // Using ip-api.com which is free and doesn't require API key
    const response = await fetch('https://ipapi.co/json/');
    
    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }

    const data = await response.json();

    return {
      country: data.country_name || 'Unknown',
      region: data.region || 'Unknown',
      city: data.city || 'Unknown',
      ip: data.ip || 'Unknown',
    };
  } catch (error) {
    console.error('Error fetching location:', error);
    
    // Fallback location if API fails
    return {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
      ip: 'Unknown',
    };
  }
};

// Alternative function using a different service as backup
export const getUserLocationBackup = async (): Promise<LocationData> => {
  try {
    // Using ipapi.co as backup (also free)
    const response = await fetch('https://ipapi.co/json/');
    
    if (!response.ok) {
      throw new Error('Failed to fetch location data from backup service');
    }

    const data = await response.json();

    return {
      country: data.country_name || 'Unknown',
      region: data.region || 'Unknown', 
      city: data.city || 'Unknown',
      ip: data.ip || 'Unknown',
    };
  } catch (error) {
    console.error('Error fetching location from backup service:', error);
    
    // Final fallback
    return {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
      ip: 'Unknown',
    };
  }
};

// Main function that tries primary service and falls back to secondary
export const getLocationWithFallback = async (): Promise<LocationData> => {
  try {
    return await getUserLocation();
  } catch (error) {
    console.warn('Primary location service failed, trying backup...');
    return await getUserLocationBackup();
  }
};