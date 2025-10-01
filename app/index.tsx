// app/index.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from 'expo-router';
import React from "react";
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function LandingPage() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={["#1a1a1a", "#000000"]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* App Title */}
      <Text style={styles.title}>Kelly AI</Text>
      <Text style={styles.subtitle}>
        Start your journey with Kelly AI{"\n"}
        Chat, plan, build, and learn.
      </Text>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => router.push({ pathname: '/auth', params: { mode: 'signup' } })}
        >
          <Text style={styles.primaryText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => router.push({ pathname: '/auth', params: { mode: 'login' } })}
        >
          <Text style={styles.secondaryText}>Login</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 44,
    fontWeight: "700",
    color: "#ff99cc",
    marginBottom: 15,
    textAlign: "center",
    fontFamily: "Lato_700Bold",
    textShadowColor: "#ff66aa",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#f2f2f2",
    opacity: 0.9,
    textAlign: "center",
    marginBottom: 50,
    lineHeight: 24,
    fontFamily: "Lato_400Regular",
  },
  buttonContainer: {
    width: "100%",
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: "#ff66aa",
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
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Lato_700Bold",
    letterSpacing: 1,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: "#ff99cc",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ff99cc",
    fontFamily: "Lato_700Bold",
    letterSpacing: 1,
  },
});