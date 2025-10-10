import { Lato_400Regular, Lato_700Bold, useFonts } from "@expo-google-fonts/lato";
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const [fontsLoaded, fontError] = useFonts({
    Lato_400Regular,
    Lato_700Bold,
  });

  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // wait for fonts
        if (!fontsLoaded && !fontError) return;

        // check if user already logged in
        const userId = await SecureStore.getItemAsync('user_id');
        const accessToken = await SecureStore.getItemAsync('access_token');

        if (userId && accessToken) {
          // user exists, go straight to chat
          router.replace('/chat');
        } else {
          // no user, go to auth
          router.replace('/');
        }
      } catch (err) {
        console.error("App init error:", err);
      } finally {
        setAppReady(true);
        SplashScreen.hideAsync();
      }
    };

    prepareApp();
  }, [fontsLoaded, fontError]);

  if (!appReady) {
    return null; // Keep splash visible
  }

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="chat" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
