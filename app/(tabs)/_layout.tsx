import { Tabs } from 'expo-router';
import { Chrome as Home } from 'lucide-react-native';

const TAB_BAR_HEIGHT = 70; // Further increased height

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
          paddingBottom: 16 // Increased bottom padding
        },
        tabBarItemStyle: {
          height: TAB_BAR_HEIGHT,
          flex: 1,
          paddingTop: 12 // Increased top padding
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '500',
          marginTop: -8 // Moved label up further
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Home size={24} color={color} />
          ),
          href: '/',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // This prevents the tab from being accessible
        }}
      />
    </Tabs>
  );
}