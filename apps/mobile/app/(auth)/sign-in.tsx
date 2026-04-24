import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)/");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Sign in failed. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-2xl font-bold text-gray-900 mb-8">Sign In</Text>

      <View className="space-y-4">
        <TextInput
          className="rounded-xl border border-gray-200 px-4 py-3 text-base"
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          className="rounded-xl border border-gray-200 px-4 py-3 text-base"
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <Pressable
        onPress={handleSignIn}
        disabled={isLoading || !email || !password}
        className="mt-6 rounded-xl bg-gray-900 py-4 disabled:opacity-50"
      >
        <Text className="text-center font-semibold text-white">
          {isLoading ? "Signing in…" : "Sign In"}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/(auth)/sign-up")}
        className="mt-4"
      >
        <Text className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Text className="font-medium text-gray-900">Sign Up</Text>
        </Text>
      </Pressable>
    </View>
  );
}
