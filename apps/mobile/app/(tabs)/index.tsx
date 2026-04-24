import { useEffect, useState } from "react";
import {
  FlatList,
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import type { Product } from "@ecommerce/types";
import { formatPrice } from "@ecommerce/utils";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://localhost:9000";

export default function ProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/store/products?limit=20`)
      .then((r) => r.json())
      .then((data) => setProducts(data.products ?? []))
      .catch(() => setError("Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-red-500">{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerClassName="p-3"
      columnWrapperClassName="gap-3"
      ItemSeparatorComponent={() => <View className="h-3" />}
      renderItem={({ item }) => (
        <Pressable
          className="flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white"
          onPress={() => router.push(`/products/${item.id}`)}
        >
          {item.thumbnail ? (
            <Image
              source={{ uri: item.thumbnail }}
              className="aspect-square w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="aspect-square w-full items-center justify-center bg-gray-100">
              <Text className="text-xs text-gray-400">No image</Text>
            </View>
          )}
          <View className="p-3">
            <Text className="font-semibold text-gray-900" numberOfLines={1}>
              {item.title}
            </Text>
            {item.variants[0] && (
              <Text className="mt-1 text-sm font-medium text-gray-700">
                {formatPrice(
                  item.variants[0].priceAmount,
                  item.variants[0].currency
                )}
              </Text>
            )}
          </View>
        </Pressable>
      )}
    />
  );
}
