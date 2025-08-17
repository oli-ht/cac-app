import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { coursesData } from '../data/courses';

const CourseSlidesScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { courseId, courseTitle } = route.params;
  
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);

  // Find the course data
  const course = coursesData.find(c => c.id === courseId);
  
  if (!course) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Course not found</Text>
      </SafeAreaView>
    );
  }

  const currentSlide = course.slides[currentSlideIndex];
  const isLastSlide = currentSlideIndex === course.slides.length - 1;
  const isFirstSlide = currentSlideIndex === 0;

  const handleNext = () => {
    if (currentSlide.type === 'quiz' && !quizAnswered) {
      Alert.alert('Quiz', 'Please answer the quiz question first!');
      return;
    }
    
    if (isLastSlide) {
      Alert.alert(
        'Course Complete!',
        'Congratulations! You have completed this course.',
        [
          {
            text: 'Back to Courses',
            onPress: () => navigation.navigate('Courses')
          }
        ]
      );
    } else {
      setCurrentSlideIndex(currentSlideIndex + 1);
      setSelectedQuizAnswer(null);
      setQuizAnswered(false);
    }
  };

  const handlePrevious = () => {
    if (!isFirstSlide) {
      setCurrentSlideIndex(currentSlideIndex - 1);
      setSelectedQuizAnswer(null);
      setQuizAnswered(false);
    }
  };

  const handleQuizAnswer = (answerIndex: number) => {
    setSelectedQuizAnswer(answerIndex);
    setQuizAnswered(true);
    
    const isCorrect = answerIndex === currentSlide.correctAnswer;
    Alert.alert(
      isCorrect ? 'Correct!' : 'Incorrect',
      isCorrect 
        ? 'Great job! You got it right.' 
        : `The correct answer is: ${currentSlide.quizOptions![currentSlide.correctAnswer!]}`,
      [{ text: 'Continue' }]
    );
  };

  const renderSlideContent = () => {
    switch (currentSlide.type) {
      case 'text':
        return (
          <View style={styles.textContent}>
            <Text style={styles.slideTitle}>{currentSlide.title}</Text>
            <Text style={styles.slideText}>{currentSlide.content}</Text>
          </View>
        );
      
      case 'quiz':
        return (
          <View style={styles.quizContent}>
            <Text style={styles.slideTitle}>{currentSlide.title}</Text>
            <Text style={styles.slideText}>{currentSlide.content}</Text>
            
            <View style={styles.quizOptions}>
              {currentSlide.quizOptions?.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.quizOption,
                    selectedQuizAnswer === index && styles.selectedQuizOption
                  ]}
                  onPress={() => handleQuizAnswer(index)}
                  disabled={quizAnswered}
                >
                  <Text style={[
                    styles.quizOptionText,
                    selectedQuizAnswer === index && styles.selectedQuizOptionText
                  ]}>
                    {String.fromCharCode(65 + index)}. {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      
      default:
        return (
          <View style={styles.textContent}>
            <Text style={styles.slideTitle}>{currentSlide.title}</Text>
            <Text style={styles.slideText}>{currentSlide.content}</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{courseTitle}</Text>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentSlideIndex + 1} / {course.slides.length}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${((currentSlideIndex + 1) / course.slides.length) * 100}%` }
            ]} 
          />
        </View>
      </View>

      {/* Slide Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSlideContent()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, isFirstSlide && styles.disabledButton]}
          onPress={handlePrevious}
          disabled={isFirstSlide}
        >
          <Text style={[styles.navButtonText, isFirstSlide && styles.disabledButtonText]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.primaryButton]}
          onPress={handleNext}
        >
          <Text style={[styles.navButtonText, styles.primaryButtonText]}>
            {isLastSlide ? 'Complete' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D1B2A',
    flex: 1,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 14,
    color: '#616161',
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4A5C9E',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  textContent: {
    flex: 1,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0D1B2A',
    marginBottom: 20,
  },
  slideText: {
    fontSize: 16,
    color: '#616161',
    lineHeight: 24,
  },
  quizContent: {
    flex: 1,
  },
  quizOptions: {
    marginTop: 30,
  },
  quizOption: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedQuizOption: {
    backgroundColor: '#4A5C9E',
    borderColor: '#4A5C9E',
  },
  quizOptionText: {
    fontSize: 16,
    color: '#0D1B2A',
  },
  selectedQuizOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#F5F5F5',
  },
  primaryButton: {
    backgroundColor: '#4A5C9E',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D1B2A',
  },
  primaryButtonText: {
    color: '#fff',
  },
  disabledButtonText: {
    color: '#999',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#616161',
    marginTop: 50,
  },
});

export default CourseSlidesScreen; 