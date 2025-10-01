// app/auth.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from "react";
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity
} from "react-native";

const AuthScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Set initial mode based on route params
  useEffect(() => {
    if (params.mode) {
      setIsSignup(params.mode === 'signup');
    }
  }, [params.mode]);

  const handleAuth = () => {
    if (isSignup) {
      console.log("Signing up with:", email, password);
      // Add your signup logic here
      // After successful signup, navigate to home/main screen
      // router.push('/home');
    } else {
      console.log("Logging in with:", email, password);
      // Add your login logic here
      // After successful login, navigate to home/main screen
      // router.push('/home');
    }
  };

  const handleGoBack = () => {
  setTimeout(() => {
    router.back();
  }, 0);
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
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#ff99cc88"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Button */}
        <TouchableOpacity style={styles.primaryButton} onPress={handleAuth}>
          <Text style={styles.primaryText}>{isSignup ? "Sign Up" : "Login"}</Text>
        </TouchableOpacity>

        {/* Switch */}
        <TouchableOpacity
          onPress={() => setIsSignup(!isSignup)}
          style={styles.switchWrapper}
        >
          <Text style={styles.switchTextNormal}>
            {isSignup ? "Already have an account? " : "Don't have an account? "}
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
    position: 'absolute',
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
    marginBottom: 15,
    shadowColor: "#ff66aa",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
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