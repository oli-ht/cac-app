// This screen shows detailed information about a specific course
// It's displayed when a user clicks on a course from the courses list
import React from 'react';
import {
  View,              // Container component - like a div in web
  Text,              // Text display component
  StyleSheet,        // For styling components
  ScrollView,        // Scrollable container
  TouchableOpacity,  // Button component that responds to touch
  Image,             // Image component (we'll use this later)
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';  // Handles safe areas on different devices
import { useRoute, useNavigation } from '@react-navigation/native';  // Navigation hooks
import { coursesData } from '../data/courses';  // Our course data

// This is our main component function
const CourseDetailScreen = () => {
  // These hooks get information from navigation
  const route = useRoute<any>();           // Gets the current route and its parameters
  const navigation = useNavigation<any>(); // Gets navigation functions (go back, navigate, etc.)
  
  // Extract course information from the route parameters
  const { courseId, courseTitle } = route.params;

  // Find the specific course data using the courseId
  const course = coursesData.find(c => c.id === courseId);

  // If course is not found, show an error message
  if (!course) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Course not found</Text>
      </SafeAreaView>
    );
  }

  // This function is called when user clicks "Start Course" button
  const handleStartCourse = () => {
    // Navigate to the slides screen, passing course information
    navigation.navigate('CourseSlides', {
      courseId: course.id,      // Pass the course ID
      courseTitle: course.title // Pass the course title
    });
  };

  // This is what gets rendered on the screen
  return (
    <SafeAreaView style={styles.container}>
      {/* ScrollView allows the content to scroll if it's too long */}
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Header section with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Course image placeholder - shows first letter of course title */}
        <View style={styles.courseImageContainer}>
          <View style={styles.courseImagePlaceholder}>
            <Text style={styles.courseImageText}>{course.title.charAt(0)}</Text>
          </View>
        </View>

        {/* Course information section */}
        <View style={styles.courseInfo}>
          <Text style={styles.courseTitle}>{course.title}</Text>
          <Text style={styles.courseInstructor}>by {course.instructor}</Text>
          <Text style={styles.courseDuration}>{course.duration}</Text>
          
          {/* Category badge */}
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryText}>{course.category}</Text>
          </View>
        </View>

        {/* Course description section */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>About this course</Text>
          <Text style={styles.descriptionText}>{course.description}</Text>
        </View>

        {/* Course statistics section */}
        <View style={styles.statsContainer}>
          {/* Number of slides */}
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{course.slides.length}</Text>
            <Text style={styles.statLabel}>Slides</Text>
          </View>
          {/* Number of quizzes */}
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{course.slides.filter(s => s.type === 'quiz').length}</Text>
            <Text style={styles.statLabel}>Quizzes</Text>
          </View>
          {/* Free indicator */}
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>Free</Text>
          </View>
        </View>

        {/* Start course button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStartCourse}>
          <Text style={styles.startButtonText}>Start Course</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// This defines all the visual styles for our components
const styles = StyleSheet.create({
  container: {
    flex: 1,                    // Takes up all available space
    backgroundColor: '#fff',    // White background
  },
  header: {
    paddingHorizontal: 20,      // 20 pixels of padding on left and right
    paddingVertical: 15,        // 15 pixels of padding on top and bottom
  },
  backButton: {
    fontSize: 16,               // Text size
    color: '#007AFF',           // Blue color (iOS blue)
    fontWeight: '500',          // Medium font weight
  },
  courseImageContainer: {
    alignItems: 'center',       // Center the image horizontally
    marginVertical: 20,         // 20 pixels of margin on top and bottom
  },
  courseImagePlaceholder: {
    width: 120,                 // Width of the placeholder
    height: 120,                // Height of the placeholder
    borderRadius: 60,           // Makes it circular (half of width/height)
    backgroundColor: '#4A5C9E', // Dark blue background
    justifyContent: 'center',   // Center content vertically
    alignItems: 'center',       // Center content horizontally
  },
  courseImageText: {
    fontSize: 48,               // Large text size
    fontWeight: 'bold',         // Bold font weight
    color: '#fff',              // White text color
  },
  courseInfo: {
    paddingHorizontal: 20,      // Horizontal padding
    alignItems: 'center',       // Center all content
    marginBottom: 30,           // Bottom margin
  },
  courseTitle: {
    fontSize: 24,               // Large title text
    fontWeight: 'bold',         // Bold font
    color: '#0D1B2A',           // Dark color
    textAlign: 'center',        // Center the text
    marginBottom: 8,            // Space below the title
  },
  courseInstructor: {
    fontSize: 16,               // Medium text size
    color: '#616161',           // Gray color
    marginBottom: 8,            // Space below instructor name
  },
  courseDuration: {
    fontSize: 14,               // Small text size
    color: '#FF6F61',           // Orange color
    backgroundColor: '#FFE5E2', // Light orange background
    paddingHorizontal: 12,      // Horizontal padding
    paddingVertical: 4,         // Vertical padding
    borderRadius: 12,           // Rounded corners
    marginBottom: 12,           // Space below duration
  },
  categoryContainer: {
    backgroundColor: '#F0F4FF', // Light blue background
    paddingHorizontal: 16,      // Horizontal padding
    paddingVertical: 6,         // Vertical padding
    borderRadius: 16,           // Rounded corners
  },
  categoryText: {
    color: '#4A5C9E',           // Dark blue text
    fontSize: 14,               // Small text size
    fontWeight: '500',          // Medium font weight
  },
  descriptionContainer: {
    paddingHorizontal: 20,      // Horizontal padding
    marginBottom: 30,           // Bottom margin
  },
  descriptionTitle: {
    fontSize: 18,               // Medium-large text
    fontWeight: 'bold',         // Bold font
    color: '#0D1B2A',           // Dark color
    marginBottom: 12,           // Space below title
  },
  descriptionText: {
    fontSize: 16,               // Medium text size
    color: '#616161',           // Gray color
    lineHeight: 24,             // Space between lines
  },
  statsContainer: {
    flexDirection: 'row',       // Arrange items horizontally
    justifyContent: 'space-around', // Space items evenly
    paddingHorizontal: 20,      // Horizontal padding
    marginBottom: 40,           // Bottom margin
  },
  statItem: {
    alignItems: 'center',       // Center content
  },
  statNumber: {
    fontSize: 24,               // Large number
    fontWeight: 'bold',         // Bold font
    color: '#4A5C9E',           // Dark blue color
  },
  statLabel: {
    fontSize: 14,               // Small label text
    color: '#616161',           // Gray color
    marginTop: 4,               // Space above label
  },
  startButton: {
    backgroundColor: '#4A5C9E', // Dark blue background
    marginHorizontal: 20,       // Horizontal margin
    paddingVertical: 16,        // Vertical padding
    borderRadius: 12,           // Rounded corners
    alignItems: 'center',       // Center the text
    marginBottom: 30,           // Bottom margin
  },
  startButtonText: {
    color: '#fff',              // White text
    fontSize: 18,               // Large text size
    fontWeight: 'bold',         // Bold font
  },
  errorText: {
    textAlign: 'center',        // Center the text
    fontSize: 16,               // Medium text size
    color: '#616161',           // Gray color
    marginTop: 50,              // Top margin
  },
});

// Export the component so other files can use it
export default CourseDetailScreen; 