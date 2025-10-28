import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Modal,
  TextInput,
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
  const [answers, setAnswers] = useState<any[]>(new Array(questions.length).fill(null));
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  // For matching questions
  const [matchingAnswers, setMatchingAnswers] = useState<{[key: number]: {[key: number]: number | null}}>({}); 
  const [selectedLeftIndex, setSelectedLeftIndex] = useState<number | null>(null);
  const [shuffledRightItems, setShuffledRightItems] = useState<{[key: number]: any[]}>({});
  
  // For ordering questions
  const [orderingAnswers, setOrderingAnswers] = useState<{[key: number]: string[]}>({});

  // Reset quiz state when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setCurrentQuestionIndex(0);
      setAnswers(new Array(questions.length).fill(null));
      setMatchingAnswers({});
      setSelectedLeftIndex(null);
      setShuffledRightItems({});
      setOrderingAnswers({});
      setQuizCompleted(false);
    }, [questions.length])
  );
  
  const currentQuestion = questions[currentQuestionIndex];

  const handleMultipleChoiceAnswer = (index: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = index;
    setAnswers(newAnswers);
  };

  const handleMultiSelectToggle = (index: number) => {
    const newAnswers = [...answers];
    if (!Array.isArray(newAnswers[currentQuestionIndex])) {
      newAnswers[currentQuestionIndex] = [];
    }
    const currentSelections = newAnswers[currentQuestionIndex];
    const optionIndex = currentSelections.indexOf(index);
    if (optionIndex > -1) {
      currentSelections.splice(optionIndex, 1);
    } else {
      currentSelections.push(index);
    }
    setAnswers(newAnswers);
  };

  const handleFillInBlankAnswer = (text: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = text;
    setAnswers(newAnswers);
  };

  const initializeMatching = () => {
    if (!shuffledRightItems[currentQuestionIndex]) {
      // Shuffle the right items
      const shuffled = [...(currentQuestion.pairs || [])].map((pair, idx) => ({
        ...pair,
        originalIndex: idx
      })).sort(() => Math.random() - 0.5);
      
      setShuffledRightItems({
        ...shuffledRightItems,
        [currentQuestionIndex]: shuffled
      });
      
      // Initialize empty matching answers
      if (!matchingAnswers[currentQuestionIndex]) {
        setMatchingAnswers({
          ...matchingAnswers,
          [currentQuestionIndex]: {}
        });
      }
    }
  };

  const initializeOrdering = () => {
    if (!orderingAnswers[currentQuestionIndex] && currentQuestion.correctOrder) {
      const shuffled = [...currentQuestion.correctOrder].sort(() => Math.random() - 0.5);
      setOrderingAnswers({
        ...orderingAnswers,
        [currentQuestionIndex]: shuffled
      });
    }
  };

  React.useEffect(() => {
    if (currentQuestion.questionType === 'matching') {
      initializeMatching();
    } else if (currentQuestion.questionType === 'ordering') {
      initializeOrdering();
    }
  }, [currentQuestionIndex]);

  const moveOrderingItem = (fromIndex: number, direction: 'up' | 'down') => {
    const items = [...(orderingAnswers[currentQuestionIndex] || [])];
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex >= 0 && toIndex < items.length) {
      [items[fromIndex], items[toIndex]] = [items[toIndex], items[fromIndex]];
      setOrderingAnswers({
        ...orderingAnswers,
        [currentQuestionIndex]: items
      });
    }
  };

  const isQuestionAnswered = () => {
    const answer = answers[currentQuestionIndex];
    const type = currentQuestion.questionType;
    
    if (type === 'multipleChoice' || type === 'trueFalse') {
      return answer !== null && answer !== undefined;
    } else if (type === 'multiSelect') {
      return Array.isArray(answer) && answer.length > 0;
    } else if (type === 'fillInBlank') {
      return typeof answer === 'string' && answer.trim().length > 0;
    } else if (type === 'matching') {
      return matchingAnswers[currentQuestionIndex] !== undefined;
    } else if (type === 'ordering') {
      return orderingAnswers[currentQuestionIndex] !== undefined;
    }
    return false;
  };

  const checkAnswer = () => {
    const type = currentQuestion.questionType;
    
    if (type === 'multipleChoice' || type === 'trueFalse') {
      return answers[currentQuestionIndex] === currentQuestion.correctAnswer;
    } else if (type === 'multiSelect') {
      const userAnswers = answers[currentQuestionIndex] || [];
      const correctAnswers = currentQuestion.correctAnswers || [];
      return userAnswers.length === correctAnswers.length && 
             userAnswers.every((ans: number) => correctAnswers.includes(ans));
    } else if (type === 'fillInBlank') {
      const userAnswer = answers[currentQuestionIndex] || '';
      const correctAnswer = currentQuestion.correctText || '';
      if (currentQuestion.caseSensitive) {
        return userAnswer === correctAnswer;
      }
      return userAnswer.toLowerCase() === correctAnswer.toLowerCase();
    } else if (type === 'matching') {
      // Check if all pairs match correctly
      const userMatching = matchingAnswers[currentQuestionIndex] || {};
      const pairsCount = currentQuestion.pairs?.length || 0;
      
      // All left items must be matched
      if (Object.keys(userMatching).length !== pairsCount) return false;
      
      // Each match must be correct (left item matched to its corresponding right item)
      return Object.keys(userMatching).every((leftIdx) => {
        const rightOriginalIndex = userMatching[parseInt(leftIdx)];
        return rightOriginalIndex === parseInt(leftIdx);
      });
    } else if (type === 'ordering') {
      const userOrder = orderingAnswers[currentQuestionIndex] || [];
      const correctOrder = currentQuestion.correctOrder || [];
      return JSON.stringify(userOrder) === JSON.stringify(correctOrder);
    }
    return false;
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
    let correct = 0;
    questions.forEach((q: any, index: number) => {
      const type = q.questionType;
      
      if (type === 'multipleChoice' || type === 'trueFalse') {
        if (answers[index] === q.correctAnswer) correct++;
      } else if (type === 'multiSelect') {
        const userAnswers = answers[index] || [];
        const correctAnswers = q.correctAnswers || [];
        if (userAnswers.length === correctAnswers.length && 
            userAnswers.every((ans: number) => correctAnswers.includes(ans))) {
          correct++;
        }
      } else if (type === 'fillInBlank') {
        const userAnswer = answers[index] || '';
        const correctAnswer = q.correctText || '';
        const match = q.caseSensitive ? 
          userAnswer === correctAnswer : 
          userAnswer.toLowerCase() === correctAnswer.toLowerCase();
        if (match) correct++;
      } else if (type === 'matching') {
        const userMatching = matchingAnswers[index] || {};
        const pairsCount = q.pairs?.length || 0;
        
        if (Object.keys(userMatching).length === pairsCount) {
          const allCorrect = Object.keys(userMatching).every((leftIdx) => {
            const rightOriginalIndex = userMatching[parseInt(leftIdx)];
            return rightOriginalIndex === parseInt(leftIdx);
          });
          if (allCorrect) correct++;
        }
      } else if (type === 'ordering') {
        const userOrder = orderingAnswers[index] || [];
        const correctOrder = q.correctOrder || [];
        if (JSON.stringify(userOrder) === JSON.stringify(correctOrder)) {
          correct++;
        }
      }
    });
    return Math.round((correct / questions.length) * 100);
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
            setAnswers(new Array(questions.length).fill(null));
            setMatchingAnswers({});
            setSelectedLeftIndex(null);
            setShuffledRightItems({});
            setOrderingAnswers({});
            setQuizCompleted(false);
          }}
        >
          <Text style={styles.retakeButtonText}>Retake Quiz</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isAnswered = isQuestionAnswered();
  const isCorrect = isAnswered && checkAnswer();

  return (
    <ScrollView style={styles.quizContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.quizProgress}>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
      </View>

      <Text style={styles.quizQuestion}>{currentQuestion.question}</Text>
      
      {/* Multiple Choice & True/False */}
      {(currentQuestion.questionType === 'multipleChoice' || currentQuestion.questionType === 'trueFalse') && (
        <>
          {currentQuestion.options?.map((option: string, index: number) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.quizOption,
            answers[currentQuestionIndex] === index && styles.selectedOption,
                isAnswered && index === currentQuestion.correctAnswer && styles.correctOption,
          ]}
              onPress={() => handleMultipleChoiceAnswer(index)}
              disabled={isAnswered}
        >
          <Text style={[
            styles.quizOptionText,
            answers[currentQuestionIndex] === index && styles.selectedOptionText,
                isAnswered && index === currentQuestion.correctAnswer && styles.correctOptionText,
          ]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
        </>
      )}

      {/* Multi-Select */}
      {currentQuestion.questionType === 'multiSelect' && (
        <>
          <Text style={styles.multiSelectHint}>Select all that apply:</Text>
          {currentQuestion.options?.map((option: string, index: number) => {
            const isSelected = Array.isArray(answers[currentQuestionIndex]) && 
                              answers[currentQuestionIndex].includes(index);
            const isCorrectOption = currentQuestion.correctAnswers?.includes(index);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.quizOption,
                  isSelected && styles.selectedOption,
                  isAnswered && isCorrectOption && styles.correctOption,
                ]}
                onPress={() => handleMultiSelectToggle(index)}
                disabled={isAnswered}
              >
                <View style={styles.multiSelectRow}>
                  <View style={[
                    styles.multiSelectCheckbox,
                    isSelected && styles.multiSelectCheckboxSelected,
                    isAnswered && isCorrectOption && styles.correctOption
                  ]}>
                    {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  <Text style={[
                    styles.quizOptionText,
                    isSelected && styles.selectedOptionText,
                    isAnswered && isCorrectOption && styles.correctOptionText,
                  ]}>
                    {option}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
          {!isAnswered && (
            <TouchableOpacity
              style={styles.submitMultiSelectButton}
              onPress={() => {
                if (Array.isArray(answers[currentQuestionIndex]) && answers[currentQuestionIndex].length > 0) {
                  // Answers already set, just trigger re-render
                  setAnswers([...answers]);
                }
              }}
            >
              <Text style={styles.submitMultiSelectText}>Submit Answer</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Fill in the Blank */}
      {currentQuestion.questionType === 'fillInBlank' && (
        <>
          <TextInput
            style={styles.fillInBlankInput}
            placeholder="Type your answer..."
            placeholderTextColor="#999"
            value={answers[currentQuestionIndex] || ''}
            onChangeText={handleFillInBlankAnswer}
            editable={!isAnswered}
          />
          {!isAnswered && (answers[currentQuestionIndex] || '').trim().length > 0 && (
            <TouchableOpacity
              style={styles.submitMultiSelectButton}
              onPress={() => setAnswers([...answers])}
            >
              <Text style={styles.submitMultiSelectText}>Submit Answer</Text>
            </TouchableOpacity>
          )}
          {isAnswered && (
            <Text style={styles.correctAnswerText}>
              Correct answer: {currentQuestion.correctText}
            </Text>
          )}
        </>
      )}

      {/* Matching */}
      {currentQuestion.questionType === 'matching' && shuffledRightItems[currentQuestionIndex] && (
        <>
          <View style={styles.matchingHeaderRow}>
            <Text style={styles.matchingHint}>
              {!isAnswered ? 'Tap a left item, then tap a right item to match them' : 'Your matches:'}
            </Text>
            {!isAnswered && (
              <TouchableOpacity
                style={styles.resetMatchingButton}
                onPress={() => {
                  // Clear all matches and reshuffle
                  const shuffled = [...(currentQuestion.pairs || [])].map((pair, idx) => ({
                    ...pair,
                    originalIndex: idx
                  })).sort(() => Math.random() - 0.5);
                  
                  setShuffledRightItems({
                    ...shuffledRightItems,
                    [currentQuestionIndex]: shuffled
                  });
                  setMatchingAnswers({
                    ...matchingAnswers,
                    [currentQuestionIndex]: {}
                  });
                  setSelectedLeftIndex(null);
                }}
              >
                <Ionicons name="refresh" size={20} color="#007AFF" />
                <Text style={styles.resetMatchingText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.matchingTwoColumns}>
            {/* Left Column */}
            <View style={styles.matchingColumn}>
              <Text style={styles.matchingColumnTitle}>Match these:</Text>
              {currentQuestion.pairs?.map((pair: any, leftIndex: number) => {
                const isSelected = selectedLeftIndex === leftIndex && !isAnswered;
                const isMatched = matchingAnswers[currentQuestionIndex]?.[leftIndex] !== undefined;
                const matchedRightIdx = matchingAnswers[currentQuestionIndex]?.[leftIndex];
                const isCorrect = isAnswered && matchedRightIdx === leftIndex;
                
                return (
                  <TouchableOpacity
                    key={leftIndex}
                    style={[
                      styles.matchingItem,
                      isSelected && styles.matchingItemSelected,
                      isMatched && !isAnswered && styles.matchingItemMatched,
                      isAnswered && (isCorrect ? styles.matchingItemCorrect : styles.matchingItemIncorrect)
                    ]}
                    onPress={() => {
                      if (!isAnswered) {
                        setSelectedLeftIndex(leftIndex);
                      }
                    }}
                    disabled={isAnswered}
                  >
                    <Text style={[
                      styles.matchingItemText,
                      isSelected && styles.matchingItemTextSelected,
                      isAnswered && (isCorrect ? styles.matchingTextCorrect : styles.matchingTextIncorrect)
                    ]}>
                      {pair.left}
                    </Text>
                    {isMatched && (
                      <Ionicons 
                        name={isAnswered ? (isCorrect ? "checkmark-circle" : "close-circle") : "link"} 
                        size={20} 
                        color={isAnswered ? (isCorrect ? "#4CAF50" : "#F44336") : "#007AFF"} 
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            
            {/* Right Column */}
            <View style={styles.matchingColumn}>
              <Text style={styles.matchingColumnTitle}>To these:</Text>
              {shuffledRightItems[currentQuestionIndex].map((item: any, displayIndex: number) => {
                const originalIndex = item.originalIndex;
                const isMatchedToThis = Object.entries(matchingAnswers[currentQuestionIndex] || {})
                  .find(([_, rightIdx]) => rightIdx === originalIndex);
                const matchedLeftIndex = isMatchedToThis ? parseInt(isMatchedToThis[0]) : null;
                const isCorrect = isAnswered && matchedLeftIndex === originalIndex;
                
                return (
                  <TouchableOpacity
                    key={displayIndex}
                    style={[
                      styles.matchingItem,
                      matchedLeftIndex !== null && !isAnswered && styles.matchingItemMatched,
                      isAnswered && matchedLeftIndex !== null && (isCorrect ? styles.matchingItemCorrect : styles.matchingItemIncorrect)
                    ]}
                    onPress={() => {
                      if (!isAnswered && selectedLeftIndex !== null) {
                        // Match the selected left item to this right item
                        setMatchingAnswers({
                          ...matchingAnswers,
                          [currentQuestionIndex]: {
                            ...matchingAnswers[currentQuestionIndex],
                            [selectedLeftIndex]: originalIndex
                          }
                        });
                        setSelectedLeftIndex(null);
                      }
                    }}
                    disabled={isAnswered}
                  >
                    <Text style={[
                      styles.matchingItemText,
                      isAnswered && matchedLeftIndex !== null && (isCorrect ? styles.matchingTextCorrect : styles.matchingTextIncorrect)
                    ]}>
                      {item.right}
                    </Text>
                    {matchedLeftIndex !== null && (
                      <Ionicons 
                        name={isAnswered ? (isCorrect ? "checkmark-circle" : "close-circle") : "link"} 
                        size={20} 
                        color={isAnswered ? (isCorrect ? "#4CAF50" : "#F44336") : "#007AFF"} 
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          
          {!isAnswered && Object.keys(matchingAnswers[currentQuestionIndex] || {}).length === currentQuestion.pairs?.length && (
            <TouchableOpacity
              style={styles.submitMultiSelectButton}
              onPress={() => setAnswers([...answers])}
            >
              <Text style={styles.submitMultiSelectText}>Submit Answer</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Ordering */}
      {currentQuestion.questionType === 'ordering' && orderingAnswers[currentQuestionIndex] && (
        <>
          <Text style={styles.orderingHint}>Arrange items in correct order:</Text>
          {orderingAnswers[currentQuestionIndex].map((item: string, index: number) => (
            <View key={index} style={styles.orderingItem}>
              <Text style={styles.orderingNumber}>{index + 1}.</Text>
              <Text style={styles.orderingText}>{item}</Text>
              {!isAnswered && (
                <View style={styles.orderingControls}>
                  {index > 0 && (
                    <TouchableOpacity onPress={() => moveOrderingItem(index, 'up')}>
                      <Ionicons name="chevron-up" size={24} color="#007AFF" />
                    </TouchableOpacity>
                  )}
                  {index < orderingAnswers[currentQuestionIndex].length - 1 && (
                    <TouchableOpacity onPress={() => moveOrderingItem(index, 'down')}>
                      <Ionicons name="chevron-down" size={24} color="#007AFF" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))}
          {!isAnswered && (
            <TouchableOpacity
              style={styles.submitMultiSelectButton}
              onPress={() => setAnswers([...answers])}
            >
              <Text style={styles.submitMultiSelectText}>Submit Answer</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Feedback */}
      {isAnswered && (
        <Text style={[
          styles.feedbackText,
          isCorrect ? styles.correctFeedback : styles.incorrectFeedback
        ]}>
          {isCorrect ? '✓ Correct!' : '✗ Incorrect. Try reviewing the material.'}
        </Text>
      )}

      {/* Navigation */}
      <View style={styles.quizNavigation}>
        <TouchableOpacity
          style={[styles.quizNavButton, currentQuestionIndex === 0 && styles.disabledButton]}
          onPress={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        {isAnswered && (
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
    </ScrollView>
  );
};

const ArticleWithGlossary = ({ 
  content, 
  glossary 
}: { 
  content: string; 
  glossary?: {term: string; definition: string}[] 
}) => {
  const [selectedTerm, setSelectedTerm] = useState<{term: string; definition: string} | null>(null);
  
  // Clean the content
  const cleanedContent = cleanHtmlContent(content);
  
  // If no glossary, just render plain text
  if (!glossary || glossary.length === 0) {
    return (
      <ScrollView style={styles.contentScroll}>
        <Text style={styles.articleText}>{cleanedContent}</Text>
      </ScrollView>
    );
  }
  
  // Split content into parts, identifying glossary terms
  const renderContentWithGlossary = () => {
    const parts: React.ReactElement[] = [];
    let remainingText = cleanedContent;
    let key = 0;
    
    // Create a map of terms for easier lookup
    const glossaryMap = new Map(
      glossary.map(item => [item.term.toLowerCase(), item])
    );
    
    // Sort terms by length (longest first) to handle overlapping terms
    const sortedTerms = glossary
      .map(item => item.term)
      .sort((a, b) => b.length - a.length);
    
    // Process the text
    while (remainingText.length > 0) {
      let foundTerm = false;
      
      // Check if any glossary term starts at the current position
      for (const term of sortedTerms) {
        const regex = new RegExp(`\\b${term}\\b`, 'i');
        const match = remainingText.match(regex);
        
        if (match && match.index === 0) {
          // Found a term at the start
          const glossaryItem = glossaryMap.get(term.toLowerCase());
          if (glossaryItem) {
            parts.push(
              <Text
                key={key++}
                style={styles.glossaryTerm}
                onLongPress={() => setSelectedTerm(glossaryItem)}
              >
                {match[0]}
              </Text>
            );
            remainingText = remainingText.slice(match[0].length);
            foundTerm = true;
            break;
          }
        } else if (match && match.index !== undefined && match.index > 0) {
          // Found a term later in the text
          // First add the text before the term
          parts.push(
            <Text key={key++} style={styles.articleText}>
              {remainingText.slice(0, match.index)}
            </Text>
          );
          
          // Then add the term
          const glossaryItem = glossaryMap.get(term.toLowerCase());
          if (glossaryItem) {
            parts.push(
              <Text
                key={key++}
                style={styles.glossaryTerm}
                onLongPress={() => setSelectedTerm(glossaryItem)}
              >
                {match[0]}
              </Text>
            );
          }
          
          remainingText = remainingText.slice(match.index! + match[0].length);
          foundTerm = true;
          break;
        }
      }
      
      // If no term was found, add the next character as regular text
      if (!foundTerm) {
        parts.push(
          <Text key={key++} style={styles.articleText}>
            {remainingText.charAt(0)}
          </Text>
        );
        remainingText = remainingText.slice(1);
      }
    }
    
    return parts;
  };
  
  return (
    <>
      <ScrollView style={styles.contentScroll}>
        <Text style={styles.articleText}>
          {renderContentWithGlossary()}
        </Text>
      </ScrollView>
      
      {/* Definition Modal */}
      <Modal
        visible={selectedTerm !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTerm(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedTerm(null)}
        >
          <View style={styles.definitionCard}>
            <View style={styles.definitionHeader}>
              <Text style={styles.definitionTerm}>{selectedTerm?.term}</Text>
              <TouchableOpacity onPress={() => setSelectedTerm(null)}>
                <Ionicons name="close-circle" size={28} color="#666" />
              </TouchableOpacity>
    </View>
            <Text style={styles.definitionText}>{selectedTerm?.definition}</Text>
    </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const cleanHtmlContent = (content: string) => {
  // First, remove all HTML tags and their contents
  let cleaned = content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style tags and their contents
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags and their contents
    .replace(/<[^>]+>/g, '') // Remove all remaining HTML tags
    .replace(/style=".*?"/g, '') // Remove style attributes
    .replace(/class=".*?"/g, '') // Remove class attributes
    .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
    // Fix HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();

  // Remove any remaining HTML-like patterns
  cleaned = cleaned
    .replace(/([<>])/g, '') // Remove any stray < or >
    .replace(/\\/g, '') // Remove backslashes
    .replace(/\s+/g, ' ') // Final whitespace cleanup
    .trim();

  return cleaned;
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
        return (
          <ArticleWithGlossary 
            content={currentElement.content} 
            glossary={currentElement.glossary}
          />
        );
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
  articleText: {
    fontFamily: 'NotoSerif', // Change this to any font you prefer
    fontSize: 18,
    lineHeight: 24,
    color: '#333',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
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
    fontFamily: 'NotoSerifBold',
    fontSize: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
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
  glossaryTerm: {
    fontWeight: 'bold',
    color: '#007AFF',
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  definitionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  definitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  definitionTerm: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF',
    flex: 1,
  },
  definitionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  multiSelectHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  multiSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  multiSelectCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2196F3',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  multiSelectCheckboxSelected: {
    backgroundColor: '#2196F3',
  },
  submitMultiSelectButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  submitMultiSelectText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fillInBlankInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginBottom: 10,
  },
  correctAnswerText: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 10,
    fontWeight: '600',
  },
  matchingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  matchingHint: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    flex: 1,
  },
  resetMatchingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  resetMatchingText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  matchingTwoColumns: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  matchingColumn: {
    flex: 1,
  },
  matchingColumnTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  matchingItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
  },
  matchingItemSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  matchingItemMatched: {
    backgroundColor: '#FFF9C4',
    borderColor: '#FBC02D',
  },
  matchingItemCorrect: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  matchingItemIncorrect: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  matchingItemText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  matchingItemTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  matchingTextCorrect: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  matchingTextIncorrect: {
    color: '#F44336',
    fontWeight: '600',
  },
  orderingHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  orderingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  orderingNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 12,
    width: 30,
  },
  orderingText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  orderingControls: {
    flexDirection: 'column',
    marginLeft: 12,
  },
});

export default CourseContentScreen;
