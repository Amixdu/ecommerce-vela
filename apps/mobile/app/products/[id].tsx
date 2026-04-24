import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import type { Product } from "@ecommerce/types";
import { formatPrice } from "@ecommerce/utils";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://localhost:9000";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND_URL}/store/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        const p: Product = data.product;
        setProduct(p);
        setSelectedVariantId(p.variants[0]?.id ?? "");
      })
      .catch(() => Alert.alert("Error", "Failed to load product"))
      .finally(() => setLoading(false));
  }, [id]);

  const addToCart = async () => {
    if (!selectedVariantId) return;

    const token = await getToken();
    if (!token) {
      Alert.alert("Sign in required", "Please sign in to add items to your cart.");
      return;
    }

    setAddingToCart(true);
    try {
      const res = await fetch(`${BACKEND_URL}/store/carts/me/line-items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ variant_id: selectedVariantId, quantity: 1 }),
      });

      if (!res.ok) throw new Error("Failed to add to cart");
      Alert.alert("Added to cart", `${product?.title} added to your cart.`);
    } catch {
      Alert.alert("Error", "Failed to add item to cart.");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-red-500">Product not found</Text>
      </View>
    );
  }

  const selectedVariant = product.variants.find(
    (v) => v.id === selectedVariantId
  );

  return (
    <ScrollView className="flex-1 bg-white">
      {product.thumbnail ? (
        <Image
          source={{ uri: product.thumbnail }}
          className="w-full aspect-square"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full aspect-square bg-gray-100 items-center justify-center">
          <Text className="text-gray-400">No image</Text>
        </View>
      )}

      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900">{product.title}</Text>

        {selectedVariant && (
          <Text className="mt-2 text-xl font-semibold text-gray-700">
            {formatPrice(selectedVariant.priceAmount, selectedVariant.currency)}
          </Text>
        )}

        {product.description && (
          <Text className="mt-4 text-gray-500 leading-relaxed">
            {product.description}
          </Text>
        )}

        {product.variants.length > 1 && (
          <View className="mt-6">
            <Text className="font-semibold text-gray-900 mb-3">Variant</Text>
            <View className="flex-row flex-wrap gap-2">
              {product.variants.map((variant) => (
                <Pressable
                  key={variant.id}
                  onPress={() => setSelectedVariantId(variant.id)}
                  className={`rounded-lg border px-4 py-2 ${
                    selectedVariantId === variant.id
                      ? "border-gray-900 bg-gray-900"
                      : "border-gray-200"
                  }`}
                >
                  <Text
                    className={
                      selectedVariantId === variant.id
                        ? "text-white font-medium"
                        : "text-gray-700"
                    }
                  >
                    {variant.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <Pressable
          onPress={addToCart}
          disabled={addingToCart || !selectedVariantId}
          className="mt-8 rounded-xl bg-gray-900 py-4 disabled:opacity-50"
        >
          <Text className="text-center font-semibold text-white text-base">
            {addingToCart ? "Adding…" : "Add to Cart"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
