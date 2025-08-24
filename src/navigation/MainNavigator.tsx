import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MainTabParamList } from '../types/navigation';
import { Text, Image } from 'react-native';

// Import screens
import AuthScreen from '../screens/auth/AuthScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import CoursesScreen from '../screens/CoursesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChatbotsScreen from '../screens/ChatbotsScreen';
import ChatScreen from '../screens/ChatScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import CourseSlidesScreen from '../screens/CourseSlidesScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const ChatStack = createStackNavigator<any>();
const CoursesStack = createStackNavigator<any>();

function ChatbotsStackNavigator() {
  return (
    <ChatStack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatbotsMain" component={ChatbotsScreen} />
      <ChatStack.Screen name="Chat" component={ChatScreen} />
    </ChatStack.Navigator>
  );
}

function CoursesStackNavigator() {
  return (
    <CoursesStack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <CoursesStack.Screen name="CoursesMain" component={CoursesScreen} />
      <CoursesStack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <CoursesStack.Screen name="CourseSlides" component={CourseSlidesScreen} />
    </CoursesStack.Navigator>
  );
}

const Stack = createStackNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#eee',
        },
        headerShown: false,
        tabBarLabel: ({ focused }) => (
          <Text style={{
            fontSize: 11,
            fontWeight: 'bold',
            color: '#000',
            opacity: focused ? 0.5 : 1,
          }}>
            {route.name}
          </Text>
        ),
        tabBarIcon: ({ focused, size }) => {
          let iconText;
          switch (route.name) {
            case 'Home':
              iconText = '🏠';
              break;
            case 'Courses':
              iconText = '📚';
              break;
            case 'Profile':
              iconText = '👥';
              break;
            case 'Settings':
              iconText = '🗺️';
              break;
            case 'Chatbots':
              iconText = '💬';
              break;
            default:
              iconText = '🏠';
          }
          return (
            <Text
              style={{
                fontSize: 24,
                opacity: focused ? 0.5 : 1,
                color: focused ? '#007AFF' : '#999'
              }}
            >
              {iconText}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{}}
      />
      <Tab.Screen
        name="Courses"
        component={CoursesStackNavigator}
        options={{
          tabBarLabel: 'Courses',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Community',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Map',
        }}
      />
      <Tab.Screen
        name="Chatbots"
        component={ChatbotsStackNavigator}
        options={{
          tabBarLabel: 'Chatbots',
        }}
      />
    </Tab.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Onboarding">
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
    </Stack.Navigator>
  );
};

export default MainNavigator;