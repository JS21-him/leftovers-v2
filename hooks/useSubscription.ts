import { useState, useEffect } from 'react';
import { checkPremiumEntitlement } from '@/lib/purchases';

export function useSubscription() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPremiumEntitlement().then((result) => {
      setIsPremium(result);
      setLoading(false);
    });
  }, []);

  return {
    isPremium,
    loading,
    refetch: () => checkPremiumEntitlement().then(setIsPremium),
  };
}
