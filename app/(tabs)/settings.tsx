import {  StyleSheet, Text,  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
 
  return (
    <SafeAreaView style={styles.container}>
      <Text>Settings</Text>
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
