// This file defines the navigation structure of our app
// It tells TypeScript what screens exist and what parameters they accept
import { NavigatorScreenParams } from '@react-navigation/native';

// This defines the main app structure - we have a main tab navigator
export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;  // Main contains our tab navigator
};

// This defines all the screens in our tab navigator
export type MainTabParamList = {
  Home: undefined;                    // Home screen - no parameters needed
  Courses: undefined;                 // Courses list screen - no parameters needed
  Community: undefined;               // Community/Forum screen - no parameters needed
  Chatbots: undefined;                // Chatbots screen - no parameters needed
  Chat: { bot: string } | undefined;  // Chat screen - needs a bot name parameter
  Map: undefined;                     // Map screen - no parameters needed
  CourseDetail: { courseId: string; courseTitle: string };  // Course detail screen - needs course info
  CourseSlides: { courseId: string; courseTitle: string };  // Course slides screen - needs course info
};