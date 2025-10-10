// app/auth.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";

// Update this to your actual backend URL
// For Android emulator, use: http://10.0.2.2:3001
// For iOS simulator, use: http://localhost:3001
// For physical device, use your computer's IP address: http://192.168.x.x:3001
const API_BASE_URL = "http://10.132.94.222:3001";

const AuthScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Set initial mode based on route params
  useEffect(() => {
    if (params.mode) {
      setIsSignup(params.mode === "signup");
    }
  }, [params.mode]);

  // Check if user is already logged in
  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync("access_token");
      if (token) {
        // User is already authenticated, redirect to chat
        router.replace("/chat");
      }
    } catch (error) {
      console.log("No existing auth found");
    }
  };

  const handleAuth = async () => {
    // Validation
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    // Password length validation
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isSignup
        ? `${API_BASE_URL}/auth/signup`
        : `${API_BASE_URL}/auth/login`;

      console.log(`Attempting ${isSignup ? 'signup' : 'login'} at:`, endpoint);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password: password,
        }),
      });

      const data = await response.json();

      setLoading(false);

      // Check if request was successful
      if (!response.ok) {
        console.error("Auth failed:", data);
        
        // Handle specific error messages
        let errorMessage = "An error occurred";
        if (data.error) {
          errorMessage = typeof data.error === 'string' 
            ? data.error 
            : data.error.message || "Authentication failed";
        }
        
        Alert.alert(
          isSignup ? "Signup Failed" : "Login Failed",
          errorMessage
        );
        return;
      }

      // Success! Handle the response
      console.log("Auth successful:", data);

      // Store authentication token
      // Supabase returns the session in data.session
      if (data.data && data.data.session) {
        const accessToken = data.data.session.access_token;
        const refreshToken = data.data.session.refresh_token;
        const userId = data.data.user.id;
        const userEmail = data.data.user.email;

        // Store tokens securely
        await SecureStore.setItemAsync("access_token", accessToken);
        await SecureStore.setItemAsync("refresh_token", refreshToken);
        await SecureStore.setItemAsync("user_id", userId);
        await SecureStore.setItemAsync("user_email", userEmail);

        console.log("Tokens stored successfully");

        // Show success message
        if (isSignup) {
          Alert.alert(
            "Welcome!",
            "Your account has been created successfully.",
            [
              {
                text: "OK",
                onPress: () => router.replace("/chat"),
              },
            ]
          );
        } else {
          // For login, directly navigate to chat
          router.replace("/chat");
        }
      } else if (data.data && data.data.id) {
        // Fallback for login response that might return user directly
        const userId = data.data.id;
        const userEmail = data.data.email;

        await SecureStore.setItemAsync("user_id", userId);
        await SecureStore.setItemAsync("user_email", userEmail);
        
        // For login without explicit token, still navigate
        router.replace("/chat");
      } else {
        Alert.alert("Error", "Invalid response from server");
      }
    } catch (error) {
      setLoading(false);
      console.error("Network error:", error);

      Alert.alert(
        "Connection Error",
        "Could not connect to the server. Please check:\n\n" +
        "1. Your internet connection\n" +
        "2. Backend server is running on port 3001\n" +
        "3. API_BASE_URL is correctly set"
      );
    }
  };

  const handleGoBack = () => {
    setTimeout(() => router.back(), 0);
  };

  return (
    <LinearGradient colors={["#1a1a1a", "#000000"]} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Back button */}
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{isSignup ? "Sign Up" : "Login"}</Text>

        {/* Inputs */}
        <TextInput
          placeholder="Email"
          placeholderTextColor="#ff99cc88"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#ff99cc88"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        {/* Button */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.primaryText}>
              {isSignup ? "Sign Up" : "Login"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Switch */}
        <TouchableOpacity
          onPress={() => !loading && setIsSignup(!isSignup)}
          style={styles.switchWrapper}
          disabled={loading}
        >
          <Text style={styles.switchTextNormal}>
            {isSignup
              ? "Already have an account? "
              : "Don't have an account? "}
          </Text>
          <Text style={styles.switchTextLink}>
            {isSignup ? "Login" : "Sign Up"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 40,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 25,
    zIndex: 10,
  },
  backText: {
    color: "#ff99cc",
    fontFamily: "Lato_700Bold",
    fontSize: 16,
  },
  title: {
    fontFamily: "Lato_700Bold",
    fontSize: 40,
    color: "#ff99cc",
    marginBottom: 30,
    textAlign: "center",
    textShadowColor: "#ff66aa",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  input: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    color: "#fff",
    fontFamily: "Lato_400Regular",
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ff99cc",
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: "#ff66aa",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    shadowColor: "#ff66aa",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    minHeight: 52,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Lato_700Bold",
    letterSpacing: 1,
  },
  switchWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  switchTextNormal: {
    color: "#ff99cc",
    fontFamily: "Lato_400Regular",
    fontSize: 14,
  },
  switchTextLink: {
    color: "#ff99cc",
    fontFamily: "Lato_700Bold",
    fontSize: 14,
    textDecorationLine: "underline",
    marginLeft: 3,
  },
});