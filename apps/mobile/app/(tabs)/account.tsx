import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";

export default function AccountScreen() {
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-lg font-semibold text-gray-900">
          Sign in to your account
        </Text>
        <Pressable
          onPress={() => router.push("/(auth)/sign-in")}
          className="mt-4 rounded-xl bg-gray-900 px-6 py-3"
        >
          <Text className="font-semibold text-white">Sign In</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/(auth)/sign-up")}
          className="mt-3"
        >
          <Text className="text-sm text-gray-500 underline">
            Create an account
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-4">
      <View className="rounded-xl border border-gray-200 p-4">
        <Text className="font-bold text-lg text-gray-900">
          {user?.firstName} {user?.lastName}
        </Text>
        <Text className="mt-1 text-sm text-gray-500">
          {user?.primaryEmailAddress?.emailAddress}
        </Text>
      </View>

      <View className="mt-6 space-y-2">
        <Pressable
          onPress={() => router.push("/orders")}
          className="rounded-xl border border-gray-200 p-4"
        >
          <Text className="font-medium text-gray-900">My Orders</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => signOut()}
        className="mt-8 rounded-xl border border-red-200 p-4"
      >
        <Text className="text-center font-medium text-red-600">Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}
