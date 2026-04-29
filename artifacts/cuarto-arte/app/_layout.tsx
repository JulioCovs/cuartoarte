import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setBaseUrl } from "@workspace/api-client-react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import Colors from "@/constants/colors";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

if (process.env.EXPO_PUBLIC_DOMAIN) {
  setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000,
    },
  },
});

function AuthGuard() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const publicRoutes = ["login", "register", "forgot-password"];
    const inPublicRoute = publicRoutes.includes(segments[0] as string);

    if (!user && !inPublicRoute) {
      router.replace("/login");
    } else if (user && inPublicRoute) {
      router.replace("/(tabs)");
    }
  }, [user, isLoading, segments]);

  return null;
}

function RootLayoutNav() {
  return (
    <>
      <AuthGuard />
      <Stack
        screenOptions={{
          headerBackTitle: "Atrás",
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.textPrimary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.dark },
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="events/[id]"
          options={{ title: "Evento", headerShown: true }}
        />
        <Stack.Screen
          name="events/create"
          options={{ title: "Nuevo Evento", headerShown: true, presentation: "modal" }}
        />
        <Stack.Screen
          name="clients/[id]"
          options={{ title: "Cliente", headerShown: true }}
        />
        <Stack.Screen
          name="clients/create"
          options={{ title: "Nuevo Cliente", headerShown: true, presentation: "modal" }}
        />
        <Stack.Screen
          name="musicians/[id]"
          options={{ title: "Músico", headerShown: true }}
        />
        <Stack.Screen
          name="musicians/create"
          options={{ title: "Nuevo Músico", headerShown: true, presentation: "modal" }}
        />
        <Stack.Screen
          name="payments/create"
          options={{ title: "Registrar Pago", headerShown: true, presentation: "modal" }}
        />
        <Stack.Screen
          name="bookings/[id]"
          options={{ title: "Solicitud de Contratación", headerShown: true }}
        />
        <Stack.Screen
          name="bookings/request"
          options={{ title: "Solicitar Músico", headerShown: true, presentation: "modal" }}
        />
        <Stack.Screen
          name="expenses/create"
          options={{ title: "Registrar Gasto", headerShown: true, presentation: "modal" }}
        />
        <Stack.Screen
          name="register"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="forgot-password"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="admin/pending-users"
          options={{ title: "Músicos Pendientes", headerShown: true }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider>
                <RootLayoutNav />
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
