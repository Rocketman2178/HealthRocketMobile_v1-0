import { Tabs } from 'expo-router';
import { Chrome as Home, Settings, User } from 'lucide-react-native';
const TAB_BAR_HEIGHT = 70;
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: '#000',
          height: TAB_BAR_HEIGHT,
          borderTopWidth: 0,
          paddingBottom: 16,
        },
        tabBarItemStyle: {
          height: TAB_BAR_HEIGHT,
          flex: 1,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '500',
          marginTop: -8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Home size={24} color={color} />,
          href: '/',
        }}
      />
      <Tabs.Screen
        name="setupVitalUser"
        options={{
          title: 'Setup Vital',
          tabBarIcon: ({ size, color }) => <User size={24} color={color} />,
          href: '/setupVitalUser',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => <Settings size={24} color={color} />,
          href: '/settings',
        }}
      />
    </Tabs>
  );
}
