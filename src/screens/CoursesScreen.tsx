import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  ScrollView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import HorizontalSlider from '../components/common/HorizontalSlider';
import CategoryCard from '../components/common/CategoryCard';
import { coursesData } from '../data/courses';
import { Course } from '../types/course';

// Using Course interface from ../types/course

// Using imported coursesData from ../data/courses

const categoryData = [
  { id: '1', name: 'General Health', image: '' /* Add image path */ },
  { id: '2', name: 'Disease', image: '' /* Add image path */ },
  { id: '3', name: 'Medication', image: '' /* Add image path */ },
];

// this is loading the course item blocks
const CourseItem = ({ item }: { item: Course }) => {
  const navigation = useNavigation<any>();
  
  const handleCoursePress = () => {
    navigation.navigate('CourseDetail', {
      courseId: item.id,
      courseTitle: item.title
    });
  };

  return (
    <TouchableOpacity style={styles.courseItemContainer} onPress={handleCoursePress}>
      <View style={styles.courseImagePlaceholder} />
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle}>{item.title}</Text>
        <Text style={styles.courseInstructor}>{item.instructor}</Text>
        <View style={styles.courseMeta}>
          <Text style={styles.courseDuration}>{item.duration}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const CoursesScreen = () => {
  const [activeFilter, setActiveFilter] = useState('All'); //default filter is "All"
  const [filteredCourses, setFilteredCourses] = useState(coursesData);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleFilter = (filter: string) => {
    setActiveFilter(filter);
    if (filter === 'Popular') {
      setFilteredCourses(coursesData.filter(course => course.isPopular));
    } else if (filter === 'New') {
      setFilteredCourses(coursesData.filter(course => course.isNew));
    } else {
      setFilteredCourses(coursesData);
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Course</Text>
          {/* You can replace this with a real user avatar */}
          <View style={styles.avatarPlaceholder} />
        </View>

        {/* --- Search Bar --- */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Find Course"
            placeholderTextColor="#9E9E9E"
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
          <Text style={styles.sectionTitle}>Choice your course</Text>
          <View style={styles.filterContainer}>
            <TouchableOpacity 
              style={[styles.filterButton, activeFilter === 'All' && styles.activeFilter]}
              onPress={() => handleFilter('All')}
            >
              <Text style={[styles.filterText, activeFilter === 'All' && styles.activeFilterText]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, activeFilter === 'Popular' && styles.activeFilter]}
              onPress={() => handleFilter('Popular')}
            >
              <Text style={[styles.filterText, activeFilter === 'Popular' && styles.activeFilterText]}>Popular</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, activeFilter === 'New' && styles.activeFilter]}
              onPress={() => handleFilter('New')}
            >
              <Text style={[styles.filterText, activeFilter === 'New' && styles.activeFilterText]}>New</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Course List --- */}
        <FlatList
          data={filteredCourses}
          renderItem={({ item }) => <CourseItem item={item} />}
          keyExtractor={(item) => item.id}
          scrollEnabled={false} // The parent ScrollView handles scrolling
          showsVerticalScrollIndicator={false}
        />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0D1B2A',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  searchContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  categoriesContainer: {
    marginTop: 20,
  },
  filterSection: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0D1B2A',
    marginBottom: 15,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 15,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  activeFilter: {
    backgroundColor: '#4A5C9E',
  },
  filterText: {
    color: '#616161',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  courseItemContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
    // Adding a light shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  courseImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginRight: 15,
  },
  courseInfo: {
    flex: 1,
    justifyContent: 'space-around',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D1B2A',
  },
  courseInstructor: {
    fontSize: 14,
    color: '#616161',
    marginTop: 4,
  },
  courseMeta: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
  },
  coursePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A5C9E',
  },
  courseDuration: {
    fontSize: 12,
    color: '#FF6F61',
    backgroundColor: '#FFE5E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 10,
    overflow: 'hidden', // Ensures the borderRadius is applied
  },
});

export default CoursesScreen; 