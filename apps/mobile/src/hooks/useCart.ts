import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import type { Cart } from "@ecommerce/types";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://localhost:9000";

export function useCart() {
  const { isSignedIn, getToken } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setCart(null);
      return;
    }

    setIsLoading(true);
    getToken()
      .then((token) =>
        fetch(`${BACKEND_URL}/store/carts/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      )
      .then((r) => r.json())
      .then((data) => setCart(data))
      .catch(() => setError("Failed to load cart"))
      .finally(() => setIsLoading(false));
  }, [isSignedIn, getToken]);

  return { cart, isLoading, error };
}
