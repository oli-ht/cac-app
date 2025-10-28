import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MainTabParamList } from '../types/navigation';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Import screens
import AuthScreen from '../screens/auth/AuthScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import CoursesScreen from '../screens/CoursesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ForumScreen from '../screens/ForumScreen';
import MapScreen from '../screens/MapScreen'
import ChatbotsScreen from '../screens/ChatbotsScreen';
import ChatScreen from '../screens/ChatScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import CourseContentScreen from '../screens/CourseContentScreen';
import CourseCreatorScreen from '../screens/CourseCreatorScreen';
import CourseSlidesScreen from '../screens/CourseSlidesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const ChatStack = createStackNavigator<any>();
const CoursesStack = createStackNavigator<any>();
const ForumStack = createStackNavigator<any>();

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
      <CoursesStack.Screen 
        name="CourseCreator" 
        component={CourseCreatorScreen} 
        options={{ 
          title: 'Create Course',
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical'
        }} 
      />
      <CoursesStack.Screen name="CourseContent" component={CourseContentScreen} />
    </CoursesStack.Navigator>
  );
}

function ForumStackNavigator() {
  return (
    <ForumStack.Navigator screenOptions={{ headerShown: false }}>
      <ForumStack.Screen name="ForumMain" component={ForumScreen} />
      <ForumStack.Screen 
        name="NewPost" 
        component={ForumScreen} 
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical'
        }}
      />
    </ForumStack.Navigator>
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
              iconText = <Ionicons name="home" size={24} color={focused ? '#007AFF' : '#999'} />
              break;
            case 'Courses':
              iconText = <Ionicons name="book" size={24} color={focused ? '#007AFF' : '#999'} />
              break;
            case 'Community':
              iconText = <Ionicons name="people" size={24} color={focused ? '#007AFF' : '#999'} />
              break;
            case 'Map':
              iconText = <Ionicons name="map" size={24} color={focused ? '#007AFF' : '#999'} />
              break;
            case 'Chatbots':
              iconText = <Ionicons name="chatbubbles" size={24} color={focused ? '#007AFF' : '#999'} />
              break;
            default:
              iconText = <Ionicons name="home" size={24} color={focused ? '#007AFF' : '#999'} />
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
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            // Reset to CoursesMain when tab is pressed
            navigation.reset({
              index: 0,
              routes: [{ name: 'Courses', state: { routes: [{ name: 'CoursesMain' }] } }],
            });
          },
        })}
      />
      <Tab.Screen
        name="Community"
        component={ForumStackNavigator}
        options={{
          tabBarLabel: 'Community',
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
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
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Auth">
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal'
        }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;