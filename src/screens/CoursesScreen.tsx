import React, { useState, useEffect } from 'react';
import { Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../config/firebaseConfig';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { typography } from '../theme/typography';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import HorizontalSlider from '../components/common/HorizontalSlider';
import CategoryCard from '../components/common/CategoryCard';
import { coursesData } from '../data/courses';
import { Course } from '../types/courseCreator';

// Using Course interface from ../types/course

// Using imported coursesData from ../data/courses

const categoryData = [
  { id: '1', name: 'General Health', image: '' /* Add image path */ },
  { id: '2', name: 'Disease', image: '' /* Add image path */ },
  { id: '3', name: 'Medication', image: '' /* Add image path */ },
];

// this is loading the course item blocks
const CourseItem = ({ item, onRefresh }: { item: Course, onRefresh: () => void }) => {
  const navigation = useNavigation<any>();
  const [showOptions, setShowOptions] = useState(false);
  
  const handleCoursePress = () => {
    navigation.navigate('CourseDetail', {
      course: item  // Pass the entire course object
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const handleEdit = () => {
    console.log('Course before edit:', item); // Debug log
    const courseToEdit = {
      id: item.id,
      title: item.title || '',
      description: item.description || '',
      elements: item.elements || [],
      createdAt: item.createdAt || Date.now(),
      updatedAt: item.updatedAt || Date.now(),
      published: item.published || false,
      userId: item.userId
    };
    console.log('Sending course to editor:', courseToEdit); // Debug log
    setShowOptions(false);
    navigation.navigate('CourseCreator', { course: courseToEdit });
  };

  const handleDelete = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert('Please log in to delete courses');
      return;
    }

    try {
      const courseRef = doc(db, 'courses', item.id);
      await deleteDoc(courseRef);
      alert('Course deleted successfully');
      onRefresh(); // Refresh the course list
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course. Please try again.');
    }
    setShowOptions(false);
  };

  return (
    <View style={styles.courseItemContainer}>
      <TouchableOpacity 
        style={styles.courseContent} 
        onPress={handleCoursePress}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#f0f2ff', '#e6e9ff']}
          style={styles.courseImagePlaceholder}
        >
          <Ionicons name="book" size={24} color="#5d8bf5" />
        </LinearGradient>
        <View style={styles.courseInfo}>
          <View style={styles.courseTitleContainer}>
            <Text style={styles.courseTitle}>{item.title}</Text>
            <TouchableOpacity 
              style={styles.optionsButton}
              onPress={() => setShowOptions(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <Text style={styles.courseDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.courseMeta}>
            <View style={styles.courseMetaItem}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.courseDate}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
            <View style={styles.courseMetaItem}>
              <Ionicons name="layers-outline" size={14} color="#5d8bf5" />
              <Text style={styles.elementCount}>
                {item.elements?.length || 0} elements
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        visible={showOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.optionsMenu}>
            <TouchableOpacity style={styles.optionItem} onPress={handleEdit}>
              <Ionicons name="create-outline" size={20} color="#007AFF" />
              <Text style={styles.optionText}>Edit Course</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.optionItem, styles.deleteOption]} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={styles.deleteOptionText}>Delete Course</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};



const CoursesScreen = ({ route }: { route: any }) => {
  const navigation = useNavigation<any>();
  const [activeFilter, setActiveFilter] = useState('All');
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch courses when screen comes into focus or when returning from course creation
  useFocusEffect(
    React.useCallback(() => {
      console.log('Screen focused, fetching courses...');
      fetchCourses();
    }, [])
  );

  // Also fetch on initial mount
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.log('No user logged in');
      setCourses([]);
      setFilteredCourses([]);
      return;
    }

    try {
      const coursesCollection = collection(db, 'courses');
      const q = query(
        coursesCollection,
        where('isPublic', '==', true),
        // You can add more filters here like:
        // orderBy('metadata.lastUpdated', 'desc')
      );
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const coursesList = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Fetched course data:', { id: doc.id, ...data });
          return {
            ...data,
            id: doc.id,
          };
        }) as Course[];
        console.log('All courses:', coursesList);
        setCourses(coursesList);
        setFilteredCourses(coursesList);
        setRefreshing(false); // Stop refresh animation if it's running
      }, (error) => {
        console.error('Error fetching courses:', error);
        setRefreshing(false);
      });

      // Clean up listener when component unmounts
      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up courses listener:', error);
      setRefreshing(false);
    }
  };

  const handleFilter = (filter: string) => {
    setActiveFilter(filter);
    if (filter === 'Popular') {
      setFilteredCourses(courses.filter(course => (course.elements?.length || 0) > 2));
    } else if (filter === 'New') {
      // Show courses created in the last 7 days
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      setFilteredCourses(courses.filter(course => course.updatedAt > sevenDaysAgo));
    } else {
      setFilteredCourses(courses);
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // You can add category filtering logic here
  };

  const renderCategoryCard = (category: any) => (
    <CategoryCard
      category={category}
      isActive={selectedCategory === category.id}
      onPress={() => handleCategoryPress(category.id)}
    />
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchCourses().then(() => setRefreshing(false));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['white', 'white']}
        style={styles.gradientBackground}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <View style={styles.header}>
            <View>
              <Text style={styles.welcomeText}>Welcome back</Text>
              <Text style={styles.headerTitle}>Your Courses</Text>
            </View>
          </View>

          {/* --- Search Bar --- */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for courses..."
              placeholderTextColor="#666"
            />
          </View>

        {/* --- Category Cards using reusable component --- */}
        <HorizontalSlider
          data={categoryData}
          renderItem={renderCategoryCard}
          containerStyle={styles.categoriesContainer}
          itemSpacing={15}
        />

        {/* --- Filter Tabs --- */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Browse Courses</Text>
          <View style={styles.filterContainer}>
            {['All', 'Popular', 'New'].map((filter) => (
              <TouchableOpacity 
                key={filter}
                style={styles.filterButton}
                onPress={() => handleFilter(filter)}
              >
                <LinearGradient
                  colors={activeFilter === filter ? ['darkblue', '#5d8bf5'] : ['#f5f5f5', '#f5f5f5']}
                  style={styles.filterGradient}
                >
                  <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>
                    {filter}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* --- Course List --- */}
        <View style={styles.courseListContainer}>
          <FlatList
            data={filteredCourses}
            renderItem={({ item }) => <CourseItem item={item} onRefresh={fetchCourses} />}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.courseList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="book-outline" size={48} color="#666" />
                <Text style={styles.emptyStateText}>No courses found</Text>
                <Text style={styles.emptyStateSubtext}>Create your first course to get started</Text>
              </View>
            }
          />
        </View>

      </ScrollView>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('CourseCreator')}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </LinearGradient>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradientBackground: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  welcomeText: {
    fontFamily: 'InterRegular',
    fontSize: typography.sizes.md,
    color: '#666',
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: 'NotoSerifBold',
    fontSize: typography.sizes.xxxl,
    color: '#1a1a1a',
  },
  searchContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: '#1a1a1a',
  },
  categoriesContainer: {
    marginTop: 25,
  },
  filterSection: {
    marginTop: 25,
    marginBottom: 15,
  },
  sectionTitle: {
    fontFamily: 'NotoSerifSemiBold',
    fontSize: typography.sizes.xl,
    color: '#1a1a1a',
    marginBottom: 15,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  filterGradient: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  filterText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  courseListContainer: {
    flex: 1,
    marginTop: 10,
  },
  courseList: {
    gap: 15,
  },
  courseItemContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseContent: {
    flexDirection: 'row',
    padding: 12,
  },
  courseImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseInfo: {
    flex: 1,
  },
  courseTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  courseTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.lg,
    color: '#1a1a1a',
    flex: 1,
    marginRight: 24,
  },
  courseDescription: {
    fontFamily: 'EbgaramondSemiBold',
    fontSize: typography.sizes.md,
    color: '#666',
    marginTop: 4,
    lineHeight: 20,
  },
  courseMeta: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  courseMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  courseDate: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: '#666',
  },
  elementCount: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: '#5d8bf5',
  },
  optionsButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsMenu: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  optionText: {
    fontFamily: typography.fonts.medium,
    marginLeft: 12,
    fontSize: typography.sizes.md,
    color: '#007AFF',
  },
  deleteOption: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  deleteOptionText: {
    fontFamily: typography.fonts.medium,
    marginLeft: 12,
    fontSize: typography.sizes.md,
    color: '#FF3B30',
  },
  createButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'darkblue',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.lg,
    color: '#1a1a1a',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default CoursesScreen; 