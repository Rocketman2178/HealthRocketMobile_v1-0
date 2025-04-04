import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  InteractionManager,
  findNodeHandle,
  UIManager,
} from 'react-native';
import { Searchbar } from 'react-native-paper';
import { Smartphone } from 'lucide-react-native';
import { useVitalLink } from '@tryvital/vital-link';
import { useUser } from '@/hooks/UserContext';
import { supabase } from '@/lib/supabase/client';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Linking } from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
interface ExtraConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}
const { SUPABASE_URL, SUPABASE_ANON_KEY } = Constants?.expoConfig
  ?.extra as ExtraConfig;
type ProviderType = {
  authType: string;
  description: string;
  logo: string;
  name: string;
  slug: string;
  supportedResources: string[];
};

const featuredProviders = [
  'Oura',
  'Garmin',
  'Whoop V2',
  'Strava',
  'Peloton',
  'Eight Sleep',
  'MyFitnessPal',
  'Fitbit',
];

export default function ConnectDevicesScreen() {
  const { user } = useUser();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [deviceEmail, setDeviceEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentVitalUserId, setCurrentVitalUserId] = useState<string | null>(
    null
  );
  const [providers, setProviders] = useState<ProviderType[]>([]);
  const [connectedProviders, setConnectedProviders] = useState<ProviderType[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [errorMessage, setError] = useState('');
  const [getVitalUserLoading, setGetVitalUserLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const emailInputRef = useRef<View>(null);
  const router = useRouter();

  console.log("providers :",providers);

  // Check for the current vital user
  const checkExistingVitalUser = async () => {
    if (!user) return;
    try {
      setGetVitalUserLoading(true);
      const { data: vitalData, error: vitalError } = await supabase
        .rpc('get_vital_user', {
          p_user_id: user.id,
        })
        .single();
      if (vitalError) throw vitalError;
      if (vitalData?.vital_user_id) {
        setCurrentVitalUserId(vitalData.vital_user_id);
      }
    } catch (err) {
      setCurrentVitalUserId(null);
    } finally {
      setGetVitalUserLoading(false);
    }
  };

  useEffect(() => {
    checkExistingVitalUser();
  }, [user?.id]);

  // Fetch all available providers
  useEffect(() => {
    const getAllProviders = async () => {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/get-all-providers`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user.access_token}`,
              apikey: SUPABASE_ANON_KEY || '',
            },
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setProviders(data?.providers || []);
      } catch (error) {
        console.error(error);
      }
    };
    getAllProviders();
  }, [user]);

  // Fetch connected providers for the current user
  const getConnectedProviders = async () => {
    if (!user?.id) return;
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('vital_user_id')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/get-connected-providers`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userData.vital_user_id,
          }),
        }
      );
      const data = await response.json();
      setConnectedProviders(data?.connectedProviders || []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getConnectedProviders();
  }, [user?.id]);

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    setShowEmailInput(true);
    setError('');

    InteractionManager.runAfterInteractions(() => {
      if (emailInputRef.current && flatListRef.current) {
        const flatListNativeRef = flatListRef.current.getNativeScrollRef();
        if (!flatListNativeRef) {
          console.error('FlatList native scroll ref is undefined.');
          return;
        }

        const scrollHandle = findNodeHandle(flatListNativeRef);
        const emailInputHandle = findNodeHandle(emailInputRef.current);

        if (scrollHandle && emailInputHandle) {
          UIManager.measureLayout(
            emailInputHandle,
            scrollHandle,
            (error) => {
              console.error('measureLayout failed:', error);
            },
            (_x, y) => {
              flatListRef.current?.scrollToOffset({
                offset: y,
                animated: true,
              });
            }
          );
        } else {
          console.error('Native handles are missing.');
        }
      }
    });
  };

  const handleProviderDiselect = (providerId: string) => {
    setSelectedProvider(providerId);
    setShowEmailInput(false);
    setError('');
  };

  // Connect a device using the Vital Link token or open a web URL
  const handleConnect = async () => {
    if (!user?.id) return;
    setError('');
    try {
      setLoading(true);
      if (!deviceEmail.trim()) {
        throw new Error('Please enter your device account email');
      }
      const { data: vitalData, error: vitalError } = await supabase
        .rpc('get_vital_user', {
          p_user_id: user.id,
        })
        .single();
      if (vitalError) throw vitalError;
      if (!vitalData?.vital_user_id) {
        throw new Error('Please complete health tracking setup first');
      }
      const { data: linkData, error: linkError } = await supabase.rpc(
        'get_vital_link_token',
        {
          p_user_id: user.id,
          p_provider: selectedProvider,
          p_device_email: deviceEmail,
        }
      );
      if (linkError) throw linkError;
      if (!linkData?.success) {
        throw new Error('Failed to get connection link');
      }
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/connect-vital-device`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.access_token}`,
            apikey: SUPABASE_ANON_KEY || '',
          },
          body: JSON.stringify({
            user_id: user.id,
            provider: selectedProvider,
            device_email: deviceEmail,
          }),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || 'Failed to connect device';
        } catch (e) {
          errorMessage =
            errorText || response.statusText || 'Failed to connect device';
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      const linkWebUrl = data?.link?.linkWebUrl;
       Linking.openURL(linkWebUrl);
      
    } catch (err: any) {
      let message =
        err instanceof Error
          ? err.message
          : 'Failed to connect device. Please try again.';
      if (message.includes('health tracking setup')) {
        message =
          'Please complete health tracking setup before connecting a device';
      }
      setError(message);
      setSelectedProvider(null);
    } finally {
      setLoading(false);
    }
  };

  // Sort and filter providers for display
  const sortedProviders = useMemo(() => {
    const featured: ProviderType[] = [];
    const others: ProviderType[] = [];
    providers.forEach((provider) => {
      if (provider.authType !== 'sdk') {
        if (featuredProviders.includes(provider.name)) {
          featured.push(provider);
        } else {
          others.push(provider);
        }
      }
    });
    featured.sort((a, b) => a.name.localeCompare(b.name));
    others.sort((a, b) => a.name.localeCompare(b.name));
    return [...featured, ...others];
  }, [providers]);

  const filteredProviders = useMemo(() => {
    return sortedProviders.filter((provider) =>
      provider.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, sortedProviders]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1F2937', padding: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <Smartphone color="#ff8c00" size={24} />
        <Text
          style={{
            color: '#fff',
            fontSize: 20,
            fontWeight: 'bold',
            marginLeft: 8,
          }}
        >
          Connect Devices To Your Account
        </Text>
      </View>
      <Searchbar
        placeholder="Search"
        value={searchTerm}
        onChangeText={setSearchTerm}
        style={{ marginBottom: 12, backgroundColor: '#374151' }}
      />

      <FlatList
        ref={flatListRef}
        data={filteredProviders}
        keyExtractor={(item) => item.slug}
        renderItem={({ item: provider }) => {
          const isConnected = connectedProviders.some(
            (p) => p.slug === provider.slug
          );
          return (
            <TouchableOpacity
              onPress={
                isConnected
                  ? () => handleProviderDiselect(provider.slug)
                  : () => handleProviderSelect(provider.slug)
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                backgroundColor: '#374151',
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              {provider.logo ? (
                <Image
                  source={{ uri: provider.logo }}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                />
              ) : (
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: '#FFA500',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 18 }}>
                    {provider.name.charAt(0)}
                  </Text>
                </View>
              )}
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 16 }}>
                  {provider.name}
                </Text>
                <Text style={{ color: '#A1A1AA', fontSize: 14 }}>
                  {provider.description || 'No description available'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
      <View
        style={{
          marginTop: 20,
          padding: 16,
          backgroundColor: '#374151',
          borderRadius: 8,
        }}
      >
        <>
          <Text style={{ color: '#fff', marginBottom: 12 }}>
            Enter your{' '}
            <Text style={{ color: 'orange', fontSize: 15 }}>
              {selectedProvider}
            </Text>{' '}
            Account Email
          </Text>
          <TextInput
            placeholder="device@example.com"
            placeholderTextColor="#888"
            value={deviceEmail}
            onChangeText={setDeviceEmail}
            style={{
              backgroundColor: '#4B5563',
              color: '#fff',
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setShowEmailInput(false);
                setDeviceEmail('');
                router.push('/setupVitalUser');
              }}
            >
              <Text style={{ color: '#9CA3AF' }}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConnect}
              disabled={!deviceEmail.trim() || loading}
            >
              <Text style={{ color: '#FFA500' }}>
                {loading ? 'Connecting...' : 'Connect Device'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      </View>
    </SafeAreaView>
  );
}
