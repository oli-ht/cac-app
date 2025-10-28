import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import LearningGoalCard from '../components/HomeScreen/LearningGoalCard';
import HorizontalSlider from '../components/common/HorizontalSlider';
import RecentActivityCard from '../components/common/RecentActivityCard';
import { SimpleBarChart } from '../components/HomeScreen/SimpleBarChart';
import { db, auth } from "../config/firebaseConfig";
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { getAuth as getAuthFirebase } from 'firebase/auth';


const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const fetchRecentCourses = async () => {
    try {
      const user = getAuthFirebase().currentUser;
      if (!user) {
        console.log('No user logged in, cannot fetch recent courses');
        return;
      }

      console.log('Fetching recent courses for user:', user.uid);

      const historyRef = collection(db, 'users', user.uid, 'courseHistory');
      const q = query(historyRef, orderBy('lastAccessedAt', 'desc'), limit(4));
      const snapshot = await getDocs(q);

      console.log('Found', snapshot.docs.length, 'recent courses');

      const courses = snapshot.docs.map(doc => ({
        id: doc.data().courseId,
        title: doc.data().courseName,
        lastAccessedAt: doc.data().lastAccessedAt,
        subtitle: "Continue learning",
        color: '#007AFF',
      }));

      console.log('Recent courses:', courses);
      setRecentCourses(courses);
    } catch (error) {
      console.error('Error fetching recent courses:', error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = getAuthFirebase().currentUser;
        if (!user) return;

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setProfileImage(data.profileImage || null);
        }
        
        await fetchRecentCourses();
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleCoursePress = async (courseId: string) => {
    try {
      // Fetch full course data
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      if (courseDoc.exists()) {
        const courseData = { id: courseDoc.id, ...courseDoc.data() };
        // Navigate to Courses tab and CourseDetail
        // The back button in CourseDetail will handle going to CoursesMain
        navigation.navigate('Courses', {
          screen: 'CourseDetail',
          params: { course: courseData },
        });
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    }
  };

  const renderRecentActionCard = (action: any) => (
    <RecentActivityCard
      action={action}
      onPress={() => handleCoursePress(action.id)}
    />
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {loading ? (
          <ActivityIndicator color="#fff" size="large" />
        ) : (
          <>
            {/* Doctor background image */}
            <Image 
              source={require('../assets/images/doctor.png')} 
              style={styles.doctorBackgroundImage}
              resizeMode="cover"
            />
            <View style={styles.headerContent}>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Hi {userData?.name || 'there'}!</Text>
                <Text style={styles.headerSubtitle}>What will you learn today?</Text>
              </View>
              <TouchableOpacity 
                style={styles.profileIconButton}
                onPress={() => navigation.navigate('Profile')}
              >
                {profileImage ? (
                  <Image 
                    source={{ uri: profileImage }} 
                    style={styles.profileIcon}
                  />
                ) : (
                  <View style={styles.profileIconPlaceholder}>
                    <Ionicons name="person" size={24} color="#007AFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
      <View style={styles.content}>
        <LearningGoalCard currentMinutes={46} totalMinutes={60} />
        
        {/* Recent Stuff Slider */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Recent</Text>
          <HorizontalSlider
            data={recentCourses}
            renderItem={renderRecentActionCard}
            containerStyle={styles.quickActionsContainer}
            itemSpacing={12}
          />
        </View>

        {/* Weekly Stats Chart */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Weekly Progress</Text>
          <SimpleBarChart />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Stats</Text>
          <Text style={styles.cardText}>Your activity summary will appear here.</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: 180,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    position: 'relative',
    overflow: 'hidden',
  },
  doctorBackgroundImage: {
    position: 'absolute',
    right: -40,
    top: -30,
    width: 300,
    height: 300,
    opacity: 0.7,
    zIndex: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    zIndex: 10,
    position: 'relative',
  },
  headerText: {
    flex: 1,
    zIndex: 10,
  },
  profileIconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  profileIcon: {
    width: 50,
    height: 50,
  },
  profileIconPlaceholder: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 34,
    fontFamily: 'NotoSerifBold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'InterRegular',
    color: '#fff',
    opacity: 1,
    marginTop: 4,
  },
  content: {
    fontFamily: 'InterRegular',
    padding: 20,
    marginTop: -30, // Pulls the content up to overlap the header slightly
  },
  quickActionsSection: {
    marginBottom: 20,
  },
  statsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'NotoSerifSemiBold',
    color: '#333',
    marginBottom: 15,
  },
  quickActionsContainer: {
    marginTop: 0,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontFamily: 'NotoSerifBold',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  cardText: {
    fontSize: 16,
    color: '#666',
  },
});

export default HomeScreen; 