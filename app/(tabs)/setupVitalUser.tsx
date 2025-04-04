import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  Button,
  ActivityIndicator,
} from 'react-native';
import { useUser } from '@/hooks/UserContext';
import { Smartphone, User } from 'lucide-react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import supportedProviders from '@/constants/supportedProviders';
import { Image } from 'expo-image';
import { supabase } from '@/lib/supabase/client';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
interface ExtraConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}
const { SUPABASE_URL, SUPABASE_ANON_KEY } = Constants?.expoConfig
  ?.extra as ExtraConfig;
export default function SetupVitalUserScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [currentVitalUserId, setCurrentVitalUserId] = useState<string | null>(
    null
  );
  const [setuploading, setSetupLoading] = useState(false);
  const [checkExisingUserLoading, setCheckExistingUserLoading] =
    useState<boolean>(false);
  const [error, setError] = useState('');
  // Check if a Vital user already exists
  const checkExistingVitalUser = async () => {
    if (!user) return;
    try {
      const { data: vitalData, error: vitalError } = await supabase.rpc(
        'get_vital_user',
        {
          p_user_id: user.id,
        }
      );
      if (vitalError) throw vitalError;
      if (vitalData?.vital_user_id) {
        setCurrentVitalUserId(vitalData.vital_user_id);
      }
    } catch (err) {
      setCurrentVitalUserId(null);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const checkUser = async () => {
        if (!user) return;
        setCheckExistingUserLoading(true);
        try {
          await checkExistingVitalUser();
        } catch (error) {
          // Optionally handle the error here
        } finally {
          setCheckExistingUserLoading(false);
        }
      };
      checkUser();
    }, [user?.id])
  );

  const connectDevices = () => {
    if (currentVitalUserId) {
      router.push('/connectDevices');
    }
  };

  // Set up health tracking by creating a Vital user via an edge function
  const handleSetUpHealthTracking = async () => {
    if (!user) return;
    setError('');
    setSetupLoading(true);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/create-vital-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.access_token}`,
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ user_id: user.id }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup health tracking');
      }
      // Re-check to update the currentVitalUserId state
      checkExistingVitalUser();
    } catch (err: any) {
      setError(err.message || 'Failed to setup health tracking');
    } finally {
      setSetupLoading(false);
    }
  };

  if (checkExisingUserLoading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#1F2937',
        }}
      >
        <ActivityIndicator size="large" color="#FFA500" />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView
      style={{
        padding: 16,
        backgroundColor: '#1F2937',
        flex: 1,
      }}
    >
      <ScrollView>
        <View style={{ marginBottom: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <User color="#FFA500" width={24} height={24} />
            <Text
              style={{
                fontSize: 20,
                fontWeight: '600',
                color: '#fff',
                marginLeft: 8,
              }}
            >
              Setup Data Tracking
            </Text>
          </View>
          <View
            style={{
              backgroundColor: 'rgba(55,65,81,0.5)',
              borderRadius: 8,
              padding: 16,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <Smartphone color="#FFA500" width={20} height={20} />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '500',
                  color: '#fff',
                  marginLeft: 8,
                }}
              >
                Supported Devices
              </Text>
            </View>
            {supportedProviders.map((provider) => (
              <View
                key={provider.slug}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <Image
                  source={{ uri: provider.logo }}
                  style={{ width: 40, height: 40 }}
                  contentFit="cover"
                  transition={1000}
                />

                <Text style={{ color: '#ddd', marginLeft: 8 }}>
                  {provider.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
        {error ? (
          <View
            style={{
              backgroundColor: 'rgba(239,68,68,0.1)',
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: 'red' }}>{error}</Text>
          </View>
        ) : null}
        {currentVitalUserId ? (
          <Button
            onPress={connectDevices}
            color="#FFA500"
            disabled={setuploading}
            title={'Connect Devices'}
          />
        ) : (
          <Button
            onPress={handleSetUpHealthTracking}
            color="#FFA500"
            disabled={setuploading}
            title={setuploading ? 'Setting Up...' : 'Setup Health Tracking'}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
