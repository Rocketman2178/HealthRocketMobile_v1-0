import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useUser } from '@/hooks/UserContext';

export default function WebViewScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const {setUser} = useUser();
  const handleNavigationStateChange = useCallback(async (event: any) => {
    const { url } = event;
    
    // Handle external links
    if (!url.includes('healthrocket.life')) {
      await WebBrowser.openBrowserAsync(url);
      return false;
    }
    return true;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: 'https://launch.healthrocket.life' }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={() => setIsLoading(true)}
        onMessage={(event)=>{
          setUser(JSON.parse(event.nativeEvent.data));
        }}
        onLoadEnd={() => setIsLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsBackForwardNavigationGestures={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
});