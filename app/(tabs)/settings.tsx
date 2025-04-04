import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';

const INJECT_PROFILE_SCRIPT = `
  // Attempt to trigger profile view in the React app
  if (window.openProfile) {
    window.openProfile();
  } else {
    // Fallback: Dispatch a custom event that your React app can listen for
    window.dispatchEvent(new CustomEvent('openProfile'));
  }
  true; // Required for Android
`;

export default function SettingsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleNavigationStateChange = async (event: any) => {
    const { url } = event;

    if (!url.includes('healthrocket.life')) {
      await WebBrowser.openBrowserAsync(url);
      return false;
    }
    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <>
          <WebView
            source={{ uri: 'https://launch.healthrocket.life' }}
            style={styles.webview}
            onNavigationStateChange={handleNavigationStateChange}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            injectedJavaScript={INJECT_PROFILE_SCRIPT}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              setError(nativeEvent.description || 'Failed to load page');
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            allowsBackForwardNavigationGestures={true}
          />
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
  },
});
