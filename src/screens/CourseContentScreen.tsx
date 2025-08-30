import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Course, CourseElement } from '../types/courseCreator';

const { width } = Dimensions.get('window');

const VideoPlayer = ({ url }: { url: string }) => {
  // Extract video ID from YouTube URL
  const getYouTubeVideoId = (url: string) => {
    const regex = /(?:\?v=|\/embed\/|\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeVideoId(url);
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <View style={styles.videoContainer}>
      <WebView
        style={styles.video}
        source={{ uri: embedUrl }}
        allowsFullscreenVideo
      />
    </View>
  );
};

const QuizElement = ({ element }: { element: CourseElement }) => {
  // Parse quiz data from content first
  const quizData = JSON.parse(element.content);
  const { questions } = quizData;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Reset quiz state when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setCurrentQuestionIndex(0);
      setAnswers(new Array(questions.length).fill(null));
      setQuizCompleted(false);
    }, [questions.length])
  );
  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (index: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = index;
    setAnswers(newAnswers);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    const correctAnswers = answers.reduce((count: number, answer: number | null, index: number) => {
      return count + (answer === questions[index].correctAnswer ? 1 : 0);
    }, 0);
    return Math.round((correctAnswers / questions.length) * 100);
  };

  if (quizCompleted) {
    const score = calculateScore();
    return (
      <View style={styles.quizContainer}>
        <Text style={styles.quizTitle}>Quiz Completed!</Text>
        <Text style={styles.scoreText}>Your Score: {score}%</Text>
        <TouchableOpacity
          style={styles.retakeButton}
          onPress={() => {
            setCurrentQuestionIndex(0);
            setAnswers([]);
            setQuizCompleted(false);
          }}
        >
          <Text style={styles.retakeButtonText}>Retake Quiz</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.quizContainer}>
      <View style={styles.quizProgress}>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
      </View>

      <Text style={styles.quizQuestion}>{currentQuestion.question}</Text>
      
      {currentQuestion.options.map((option: string, index: number) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.quizOption,
            answers[currentQuestionIndex] === index && styles.selectedOption,
            answers[currentQuestionIndex] !== null && index === currentQuestion.correctAnswer && styles.correctOption,
          ]}
          onPress={() => handleAnswer(index)}
          disabled={answers[currentQuestionIndex] !== null}
        >
          <Text style={[
            styles.quizOptionText,
            answers[currentQuestionIndex] === index && styles.selectedOptionText,
            answers[currentQuestionIndex] !== null && index === currentQuestion.correctAnswer && styles.correctOptionText,
          ]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}

      {answers[currentQuestionIndex] !== null && (
        <Text style={[
          styles.feedbackText,
          answers[currentQuestionIndex] === currentQuestion.correctAnswer ? styles.correctFeedback : styles.incorrectFeedback
        ]}>
          {answers[currentQuestionIndex] === currentQuestion.correctAnswer ? 'Correct!' : 'Incorrect. The correct answer is shown above.'}
        </Text>
      )}

      <View style={styles.quizNavigation}>
        <TouchableOpacity
          style={[styles.quizNavButton, currentQuestionIndex === 0 && styles.disabledButton]}
          onPress={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        {answers[currentQuestionIndex] !== null && (
          <TouchableOpacity
            style={styles.quizNavButton}
            onPress={goToNextQuestion}
          >
            {currentQuestionIndex === questions.length - 1 ? (
              <Text style={styles.finishButtonText}>Finish</Text>
            ) : (
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const CourseContentScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { course } = route.params;
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentElement = course.elements[currentIndex];

  const handleNext = () => {
    if (currentIndex < course.elements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const renderElement = () => {
    switch (currentElement.type) {
      case 'video':
        return <VideoPlayer url={currentElement.videoUrl || ''} />;
      case 'quiz':
        return <QuizElement element={currentElement} />;
      case 'article':
      case 'funFact':
      default:
        return (
          <ScrollView style={styles.contentScroll}>
            <Text style={styles.contentText}>{currentElement.content}</Text>
          </ScrollView>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.progress}>
          {currentIndex + 1} / {course.elements.length}
        </Text>
      </View>

      <Text style={styles.elementTitle}>{currentElement.title}</Text>

      <View style={styles.contentContainer}>
        {renderElement()}
      </View>

      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={[styles.navButton, currentIndex === 0 && styles.disabledButton]}
          onPress={handleBack}
          disabled={currentIndex === 0}
        >
          <Text style={[styles.navButtonText, currentIndex === 0 && styles.disabledButtonText]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, currentIndex === course.elements.length - 1 && styles.disabledButton]}
          onPress={handleNext}
          disabled={currentIndex === course.elements.length - 1}
        >
          <Text style={[styles.navButtonText, currentIndex === course.elements.length - 1 && styles.disabledButtonText]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  quizProgress: {
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  progressText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  quizTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 30,
  },
  retakeButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quizNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40, // Add space between quiz navigation and course navigation
  },
  quizNavButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  progress: {
    fontSize: 16,
    color: '#666',
  },
  elementTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    color: '#333',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 100, // Add extra padding at the bottom
  },
  contentScroll: {
    flex: 1,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  videoContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#000',
    borderRadius: 10,
    overflow: 'hidden',
  },
  video: {
    flex: 1,
  },
  quizContainer: {
    padding: 20,
  },
  quizQuestion: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  quizOption: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  correctOption: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  quizOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: '#2196F3',
  },
  correctOptionText: {
    color: '#4CAF50',
  },
  feedbackText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    fontWeight: 'bold',
  },
  correctFeedback: {
    color: '#4CAF50',
  },
  incorrectFeedback: {
    color: '#F44336',
  },
  navigationButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  disabledButtonText: {
    color: '#666',
  },
});

export default CourseContentScreen;
