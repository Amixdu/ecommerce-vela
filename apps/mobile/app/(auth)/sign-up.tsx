import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Sign up failed. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)/");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Verification failed.";
      Alert.alert("Error", message);
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <View className="flex-1 justify-center px-6 bg-white">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Verify Email
        </Text>
        <Text className="text-gray-500 mb-8">
          Enter the code sent to {email}
        </Text>

        <TextInput
          className="rounded-xl border border-gray-200 px-4 py-3 text-base text-center tracking-widest"
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
        />

        <Pressable
          onPress={handleVerify}
          disabled={isLoading || code.length < 6}
          className="mt-6 rounded-xl bg-gray-900 py-4 disabled:opacity-50"
        >
          <Text className="text-center font-semibold text-white">
            {isLoading ? "Verifying…" : "Verify"}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-2xl font-bold text-gray-900 mb-8">
        Create Account
      </Text>

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
        onPress={handleSignUp}
        disabled={isLoading || !email || !password}
        className="mt-6 rounded-xl bg-gray-900 py-4 disabled:opacity-50"
      >
        <Text className="text-center font-semibold text-white">
          {isLoading ? "Creating account…" : "Sign Up"}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/(auth)/sign-in")}
        className="mt-4"
      >
        <Text className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Text className="font-medium text-gray-900">Sign In</Text>
        </Text>
      </Pressable>
    </View>
  );
}
