import { View, Text, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@ecommerce/utils";

export default function CartScreen() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const { cart, isLoading } = useCart();

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-lg font-semibold text-gray-900">
          Sign in to view your cart
        </Text>
        <Pressable
          onPress={() => router.push("/(auth)/sign-in")}
          className="mt-4 rounded-xl bg-gray-900 px-6 py-3"
        >
          <Text className="font-semibold text-white">Sign In</Text>
        </Pressable>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">Loading cart…</Text>
      </View>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-lg font-semibold text-gray-900">
          Your cart is empty
        </Text>
        <Pressable
          onPress={() => router.push("/(tabs)/")}
          className="mt-4 rounded-xl bg-gray-900 px-6 py-3"
        >
          <Text className="font-semibold text-white">Browse Products</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={cart.items}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        ItemSeparatorComponent={() => <View className="h-px bg-gray-100" />}
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-3 py-3">
            <View className="flex-1">
              <Text className="font-medium text-gray-900" numberOfLines={1}>
                {item.title}
              </Text>
              <Text className="text-sm text-gray-500">{item.variantTitle}</Text>
              <Text className="mt-1 text-sm font-medium">
                {formatPrice(item.unitPrice, item.currency)} × {item.quantity}
              </Text>
            </View>
            <Text className="font-semibold text-gray-900">
              {formatPrice(item.totalPrice, item.currency)}
            </Text>
          </View>
        )}
        ListFooterComponent={
          <View className="mt-6 rounded-xl border border-gray-200 p-4">
            <View className="flex-row justify-between">
              <Text className="text-gray-500">Total</Text>
              <Text className="font-bold text-gray-900 text-lg">
                {formatPrice(cart.totals.total, cart.totals.currency)}
              </Text>
            </View>
          </View>
        }
      />
    </View>
  );
}
