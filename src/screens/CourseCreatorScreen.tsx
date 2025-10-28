import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { getAuth as getAuthFirebase } from 'firebase/auth';
import { Course, CourseElement, ElementType } from '../types/courseCreator';

const COURSE_ICONS = [
  'book', 'school', 'fitness', 'heart', 'medical', 'nutrition', 
  'pulse', 'thermometer', 'bandage', 'documents', 'shield-checkmark'
];

const ELEMENT_TYPES: { type: ElementType; icon: string; label: string }[] = [
  { type: 'article', icon: 'document-text', label: 'Article' },
  { type: 'video', icon: 'videocam', label: 'Video' },
  { type: 'funFact', icon: 'bulb', label: 'Fun Fact' },
  { type: 'quiz', icon: 'help-circle', label: 'Quiz' },
  { type: 'question', icon: 'chatbubble', label: 'Question' },
];

const CourseCreatorScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  const existingCourse = route.params?.course;
  const [course, setCourse] = useState<Course>({
    id: existingCourse?.id || Date.now().toString(),
    title: existingCourse?.title || '',
    description: existingCourse?.description || '',
    createdAt: existingCourse?.createdAt || Date.now(),
    updatedAt: existingCourse?.updatedAt || Date.now(),
    elements: existingCourse?.elements || [],
    published: existingCourse?.published || false,
    userId: existingCourse?.userId || '',
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showElementEditor, setShowElementEditor] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [currentElement, setCurrentElement] = useState<CourseElement | null>(null);
  const [courseIcon, setCourseIcon] = useState<string>(existingCourse?.icon || 'book');
  const [courseColor, setCourseColor] = useState<string>(existingCourse?.color || '#007AFF');

  const addElement = (type: ElementType) => {
    const newElement: CourseElement = {
      id: Date.now().toString(),
      type,
      title: '',
      content: '',
      order: course.elements.length,
    };
    setCurrentElement(newElement);
    setShowAddModal(false);
    setShowElementEditor(true);
  };

  const saveElement = (element: CourseElement) => {
    const newElements = [...course.elements];
    const index = newElements.findIndex(e => e.id === element.id);
    
    if (index === -1) {
      newElements.push(element);
    } else {
      newElements[index] = element;
    }
    
    setCourse({
      ...course,
      elements: newElements,
      updatedAt: Date.now(),
    });
    setShowElementEditor(false);
    setCurrentElement(null);
  };

  const saveCourse = async () => {
    if (!course.title.trim()) {
      Alert.alert('Error', 'Please enter a course title');
      return;
    }

    try {
      const user = getAuthFirebase().currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to save a course');
        return;
      }

      const courseRef = doc(db, 'courses', course.id);
      const courseData = {
        ...course,
        icon: courseIcon,
        color: courseColor,
        userId: user.uid,
        creatorId: user.uid,
        updatedAt: Date.now(),
        isPublic: true,
        published: false,
        metadata: {
          creatorName: user.displayName || 'Anonymous',
          lastUpdated: new Date().toISOString(),
          views: 0,
          likes: 0,
          totalElements: course.elements.length,
          tags: [],
        }
      };

      console.log('Saving course:', courseData);
      await setDoc(courseRef, courseData);
      Alert.alert('Success', 'Course saved successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving course:', error);
      Alert.alert('Error', 'Failed to save course. Please try again.');
    }
  };

  const renderElement = ({ item }: { item: CourseElement }) => (
    <TouchableOpacity
      style={styles.elementCard}
      onPress={() => {
        setCurrentElement(item);
        setShowElementEditor(true);
      }}
    >
      <Ionicons name={ELEMENT_TYPES.find(e => e.type === item.type)?.icon as any} size={24} color="#007AFF" />
      <View style={styles.elementContent}>
        <Text style={styles.elementTitle}>{item.title || 'Untitled'}</Text>
        <Text style={styles.elementType}>{ELEMENT_TYPES.find(e => e.type === item.type)?.label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#999" />
    </TouchableOpacity>
  );

  const ElementEditor = ({ element, onSave, onCancel }: { element: CourseElement | null; onSave: (element: CourseElement) => void; onCancel: () => void }) => {
    const [editedElement, setEditedElement] = useState<CourseElement>(() => {
      if (element) {
        return {
          ...element,
          content: element.content,
        };
      }
      return {
        id: Date.now().toString(),
        type: 'article',
        title: '',
        content: '',
        order: 0,
      };
    });

    // Glossary state for articles
    const [glossary, setGlossary] = useState<{term: string; definition: string}[]>(() => {
      if (editedElement.type === 'article' && editedElement.glossary) {
        return editedElement.glossary;
      }
      return [];
    });

    const addGlossaryTerm = () => {
      setGlossary([...glossary, { term: '', definition: '' }]);
    };

    const updateGlossaryTerm = (index: number, field: 'term' | 'definition', value: string) => {
      const newGlossary = [...glossary];
      newGlossary[index][field] = value;
      setGlossary(newGlossary);
    };

    const deleteGlossaryTerm = (index: number) => {
      setGlossary(glossary.filter((_: any, i: number) => i !== index));
    };

    // Quiz state
    const [quizQuestions, setQuizQuestions] = useState(() => {
      if (editedElement.type === 'quiz' && editedElement.content) {
        try {
          const parsed = JSON.parse(editedElement.content);
          return parsed.questions || [];
        } catch {
          return [];
        }
      }
      return [];
    });

    const addQuestion = (questionType: string = 'multipleChoice') => {
      const baseQuestion: any = {
        id: Date.now().toString(),
        questionType,
        question: '',
      };

      switch (questionType) {
        case 'multipleChoice':
          baseQuestion.options = ['', '', '', ''];
          baseQuestion.correctAnswer = 0;
          break;
        case 'trueFalse':
          baseQuestion.options = ['True', 'False'];
          baseQuestion.correctAnswer = 0;
          break;
        case 'multiSelect':
          baseQuestion.options = ['', '', '', ''];
          baseQuestion.correctAnswers = [];
          break;
        case 'matching':
          baseQuestion.pairs = [
            { left: '', right: '' },
            { left: '', right: '' },
            { left: '', right: '' },
          ];
          break;
        case 'fillInBlank':
          baseQuestion.correctText = '';
          baseQuestion.caseSensitive = false;
          break;
        case 'ordering':
          baseQuestion.correctOrder = ['', '', ''];
          break;
      }

      setQuizQuestions([...quizQuestions, baseQuestion]);
    };

    const updateQuestion = (index: number, field: string, value: any) => {
      const newQuestions = [...quizQuestions];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      setQuizQuestions(newQuestions);
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
      const newQuestions = [...quizQuestions];
      if (newQuestions[qIndex].options) {
        newQuestions[qIndex].options[oIndex] = value;
        setQuizQuestions(newQuestions);
      }
    };

    const addOption = (qIndex: number) => {
      const newQuestions = [...quizQuestions];
      if (newQuestions[qIndex].options) {
        newQuestions[qIndex].options.push('');
        setQuizQuestions(newQuestions);
      }
    };

    const removeOption = (qIndex: number, oIndex: number) => {
      const newQuestions = [...quizQuestions];
      if (newQuestions[qIndex].options && newQuestions[qIndex].options.length > 2) {
        newQuestions[qIndex].options.splice(oIndex, 1);
        setQuizQuestions(newQuestions);
      }
    };

    const toggleMultiSelectAnswer = (qIndex: number, oIndex: number) => {
      const newQuestions = [...quizQuestions];
      const question = newQuestions[qIndex];
      if (!question.correctAnswers) question.correctAnswers = [];
      
      const index = question.correctAnswers.indexOf(oIndex);
      if (index > -1) {
        question.correctAnswers.splice(index, 1);
      } else {
        question.correctAnswers.push(oIndex);
      }
      setQuizQuestions(newQuestions);
    };

    const updateMatchingPair = (qIndex: number, pIndex: number, side: 'left' | 'right', value: string) => {
      const newQuestions = [...quizQuestions];
      if (newQuestions[qIndex].pairs) {
        newQuestions[qIndex].pairs[pIndex][side] = value;
        setQuizQuestions(newQuestions);
      }
    };

    const addMatchingPair = (qIndex: number) => {
      const newQuestions = [...quizQuestions];
      if (newQuestions[qIndex].pairs) {
        newQuestions[qIndex].pairs.push({ left: '', right: '' });
        setQuizQuestions(newQuestions);
      }
    };

    const removeMatchingPair = (qIndex: number, pIndex: number) => {
      const newQuestions = [...quizQuestions];
      if (newQuestions[qIndex].pairs && newQuestions[qIndex].pairs.length > 2) {
        newQuestions[qIndex].pairs.splice(pIndex, 1);
        setQuizQuestions(newQuestions);
      }
    };

    const updateOrderingItem = (qIndex: number, itemIndex: number, value: string) => {
      const newQuestions = [...quizQuestions];
      if (newQuestions[qIndex].correctOrder) {
        newQuestions[qIndex].correctOrder[itemIndex] = value;
        setQuizQuestions(newQuestions);
      }
    };

    const addOrderingItem = (qIndex: number) => {
      const newQuestions = [...quizQuestions];
      if (newQuestions[qIndex].correctOrder) {
        newQuestions[qIndex].correctOrder.push('');
        setQuizQuestions(newQuestions);
      }
    };

    const removeOrderingItem = (qIndex: number, itemIndex: number) => {
      const newQuestions = [...quizQuestions];
      if (newQuestions[qIndex].correctOrder && newQuestions[qIndex].correctOrder.length > 2) {
        newQuestions[qIndex].correctOrder.splice(itemIndex, 1);
        setQuizQuestions(newQuestions);
      }
    };

    const deleteQuestion = (index: number) => {
      setQuizQuestions(quizQuestions.filter((_: any, i: number) => i !== index));
    };

    const handleSave = () => {
      if (editedElement.type === 'quiz') {
        const quizContent = JSON.stringify({ questions: quizQuestions });
        onSave({ ...editedElement, content: quizContent });
      } else if (editedElement.type === 'article') {
        // Save article with glossary
        onSave({ ...editedElement, glossary });
      } else {
        onSave(editedElement);
      }
    };

    return (
      <SafeAreaView style={styles.editorContainer}>
        <View style={styles.editorHeader}>
          <Text style={styles.editorTitle}>
            {ELEMENT_TYPES.find(e => e.type === editedElement.type)?.label} Editor
          </Text>
        </View>

        <ScrollView style={styles.editorContent}>
          <TextInput
            style={styles.editorInput}
            placeholder="Title"
            placeholderTextColor="#999"
            value={editedElement.title}
            onChangeText={(text) => setEditedElement({ ...editedElement, title: text })}
          />

          {editedElement.type === 'video' && (
            <TextInput
              style={styles.editorInput}
              placeholder="Video URL"
              placeholderTextColor="#999"
              value={editedElement.videoUrl}
              onChangeText={(text) => setEditedElement({ ...editedElement, videoUrl: text })}
            />
          )}

          {editedElement.type === 'quiz' ? (
            <View>
              <Text style={styles.inputLabel}>Quiz Questions</Text>
              {quizQuestions.map((q: any, qIndex: number) => (
                <View key={q.id} style={styles.quizQuestionCard}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>Question {qIndex + 1}</Text>
                    <TouchableOpacity onPress={() => deleteQuestion(qIndex)}>
                      <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                    </TouchableOpacity>
                  </View>

                  {/* Question Type Badge */}
                  <View style={styles.questionTypeBadge}>
                    <Text style={styles.questionTypeText}>
                      {q.questionType === 'multipleChoice' && '⭕ Multiple Choice'}
                      {q.questionType === 'trueFalse' && '✓✗ True/False'}
                      {q.questionType === 'multiSelect' && '☑ Multi-Select'}
                      {q.questionType === 'matching' && '⟷ Matching'}
                      {q.questionType === 'fillInBlank' && '✏️ Fill in Blank'}
                      {q.questionType === 'ordering' && '↕️ Ordering'}
                    </Text>
                  </View>
                  
                  <TextInput
                    style={styles.editorInput}
                    placeholder="Enter question"
                    placeholderTextColor="#999"
                    value={q.question}
                    onChangeText={(text) => updateQuestion(qIndex, 'question', text)}
                    multiline
                  />

                  {/* Multiple Choice */}
                  {q.questionType === 'multipleChoice' && (
                    <>
                      <Text style={styles.optionsLabel}>Options (tap to select correct answer):</Text>
                      {q.options?.map((option: string, oIndex: number) => (
                        <View key={oIndex} style={styles.optionRow}>
                          <TouchableOpacity
                            style={[styles.radioButton, q.correctAnswer === oIndex && styles.radioButtonSelected]}
                            onPress={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                          >
                            {q.correctAnswer === oIndex && <Ionicons name="checkmark" size={16} color="#fff" />}
                          </TouchableOpacity>
                          <TextInput
                            style={styles.optionInput}
                            placeholder={`Option ${oIndex + 1}`}
                            placeholderTextColor="#999"
                            value={option}
                            onChangeText={(text) => updateOption(qIndex, oIndex, text)}
                          />
                          {q.options.length > 2 && (
                            <TouchableOpacity onPress={() => removeOption(qIndex, oIndex)}>
                              <Ionicons name="close-circle" size={20} color="#999" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                      <TouchableOpacity style={styles.addOptionButton} onPress={() => addOption(qIndex)}>
                        <Text style={styles.addOptionText}>+ Add Option</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* True/False */}
                  {q.questionType === 'trueFalse' && (
                    <>
                      <Text style={styles.optionsLabel}>Correct Answer:</Text>
                      <View style={styles.trueFalseContainer}>
                        <TouchableOpacity
                          style={[styles.trueFalseButton, q.correctAnswer === 0 && styles.trueFalseSelected]}
                          onPress={() => updateQuestion(qIndex, 'correctAnswer', 0)}
                        >
                          <Text style={[styles.trueFalseText, q.correctAnswer === 0 && styles.trueFalseTextSelected]}>
                            True ✓
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.trueFalseButton, q.correctAnswer === 1 && styles.trueFalseSelected]}
                          onPress={() => updateQuestion(qIndex, 'correctAnswer', 1)}
                        >
                          <Text style={[styles.trueFalseText, q.correctAnswer === 1 && styles.trueFalseTextSelected]}>
                            False ✗
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  {/* Multi-Select */}
                  {q.questionType === 'multiSelect' && (
                    <>
                      <Text style={styles.optionsLabel}>Options (tap to select all correct answers):</Text>
                      {q.options?.map((option: string, oIndex: number) => (
                        <View key={oIndex} style={styles.optionRow}>
                          <TouchableOpacity
                            style={[styles.checkbox, q.correctAnswers?.includes(oIndex) && styles.checkboxSelected]}
                            onPress={() => toggleMultiSelectAnswer(qIndex, oIndex)}
                          >
                            {q.correctAnswers?.includes(oIndex) && <Ionicons name="checkmark" size={16} color="#fff" />}
                          </TouchableOpacity>
                          <TextInput
                            style={styles.optionInput}
                            placeholder={`Option ${oIndex + 1}`}
                            placeholderTextColor="#999"
                            value={option}
                            onChangeText={(text) => updateOption(qIndex, oIndex, text)}
                          />
                          {q.options.length > 2 && (
                            <TouchableOpacity onPress={() => removeOption(qIndex, oIndex)}>
                              <Ionicons name="close-circle" size={20} color="#999" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                      <TouchableOpacity style={styles.addOptionButton} onPress={() => addOption(qIndex)}>
                        <Text style={styles.addOptionText}>+ Add Option</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Matching */}
                  {q.questionType === 'matching' && (
                    <>
                      <Text style={styles.optionsLabel}>Matching Pairs:</Text>
                      {q.pairs?.map((pair: any, pIndex: number) => (
                        <View key={pIndex} style={styles.matchingPairRow}>
                          <TextInput
                            style={styles.matchingInput}
                            placeholder="Left item"
                            placeholderTextColor="#999"
                            value={pair.left}
                            onChangeText={(text) => updateMatchingPair(qIndex, pIndex, 'left', text)}
                          />
                          <Ionicons name="swap-horizontal" size={24} color="#007AFF" style={styles.matchingArrow} />
                          <TextInput
                            style={styles.matchingInput}
                            placeholder="Right item"
                            placeholderTextColor="#999"
                            value={pair.right}
                            onChangeText={(text) => updateMatchingPair(qIndex, pIndex, 'right', text)}
                          />
                          {q.pairs.length > 2 && (
                            <TouchableOpacity onPress={() => removeMatchingPair(qIndex, pIndex)}>
                              <Ionicons name="close-circle" size={20} color="#999" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                      <TouchableOpacity style={styles.addOptionButton} onPress={() => addMatchingPair(qIndex)}>
                        <Text style={styles.addOptionText}>+ Add Pair</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Fill in the Blank */}
                  {q.questionType === 'fillInBlank' && (
                    <>
                      <Text style={styles.optionsLabel}>Correct Answer:</Text>
                      <TextInput
                        style={styles.editorInput}
                        placeholder="Enter correct answer"
                        placeholderTextColor="#999"
                        value={q.correctText}
                        onChangeText={(text) => updateQuestion(qIndex, 'correctText', text)}
                      />
                      <View style={styles.caseSensitiveRow}>
                        <TouchableOpacity
                          style={styles.checkbox}
                          onPress={() => updateQuestion(qIndex, 'caseSensitive', !q.caseSensitive)}
                        >
                          {q.caseSensitive && <Ionicons name="checkmark" size={16} color="#007AFF" />}
                        </TouchableOpacity>
                        <Text style={styles.caseSensitiveText}>Case sensitive</Text>
                      </View>
                    </>
                  )}

                  {/* Ordering */}
                  {q.questionType === 'ordering' && (
                    <>
                      <Text style={styles.optionsLabel}>Items (in correct order):</Text>
                      {q.correctOrder?.map((item: string, itemIndex: number) => (
                        <View key={itemIndex} style={styles.orderingRow}>
                          <Text style={styles.orderingNumber}>{itemIndex + 1}.</Text>
                          <TextInput
                            style={styles.orderingInput}
                            placeholder={`Step ${itemIndex + 1}`}
                            placeholderTextColor="#999"
                            value={item}
                            onChangeText={(text) => updateOrderingItem(qIndex, itemIndex, text)}
                          />
                          {q.correctOrder.length > 2 && (
                            <TouchableOpacity onPress={() => removeOrderingItem(qIndex, itemIndex)}>
                              <Ionicons name="close-circle" size={20} color="#999" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                      <TouchableOpacity style={styles.addOptionButton} onPress={() => addOrderingItem(qIndex)}>
                        <Text style={styles.addOptionText}>+ Add Item</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              ))}
              
              {/* Add Question with Type Selection */}
              <View style={styles.addQuestionSection}>
                <Text style={styles.addQuestionSectionTitle}>Add New Question:</Text>
                <View style={styles.questionTypeGrid}>
                  <TouchableOpacity style={styles.questionTypeButton} onPress={() => addQuestion('multipleChoice')}>
                    <Text style={styles.questionTypeEmoji}>⭕</Text>
                    <Text style={styles.questionTypeLabel}>Multiple Choice</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.questionTypeButton} onPress={() => addQuestion('trueFalse')}>
                    <Text style={styles.questionTypeEmoji}>✓✗</Text>
                    <Text style={styles.questionTypeLabel}>True/False</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.questionTypeButton} onPress={() => addQuestion('multiSelect')}>
                    <Text style={styles.questionTypeEmoji}>☑</Text>
                    <Text style={styles.questionTypeLabel}>Multi-Select</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.questionTypeButton} onPress={() => addQuestion('matching')}>
                    <Text style={styles.questionTypeEmoji}>⟷</Text>
                    <Text style={styles.questionTypeLabel}>Matching</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.questionTypeButton} onPress={() => addQuestion('fillInBlank')}>
                    <Text style={styles.questionTypeEmoji}>✏️</Text>
                    <Text style={styles.questionTypeLabel}>Fill Blank</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.questionTypeButton} onPress={() => addQuestion('ordering')}>
                    <Text style={styles.questionTypeEmoji}>↕️</Text>
                    <Text style={styles.questionTypeLabel}>Ordering</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.inputLabel}>Content</Text>
              <TextInput
                style={[styles.editorInput, styles.contentInput]}
                placeholder="Enter content here..."
                placeholderTextColor="#999"
                value={editedElement.content}
                onChangeText={(text) => setEditedElement({ ...editedElement, content: text })}
                multiline
                textAlignVertical="top"
              />

              {editedElement.type === 'article' && (
                <View style={styles.glossarySection}>
                  <Text style={styles.inputLabel}>Glossary (Bold Terms + Definitions)</Text>
                  <Text style={styles.glossaryHint}>
                    Add terms you want to bold. Users can long-press them to see definitions.
                  </Text>
                  
                  {glossary.map((item, index) => (
                    <View key={index} style={styles.glossaryItem}>
                      <View style={styles.glossaryInputRow}>
                        <TextInput
                          style={[styles.editorInput, styles.glossaryTermInput]}
                          placeholder="Term (e.g., 'Medicare')"
                          placeholderTextColor="#999"
                          value={item.term}
                          onChangeText={(text) => updateGlossaryTerm(index, 'term', text)}
                        />
                        <TouchableOpacity onPress={() => deleteGlossaryTerm(index)}>
                          <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                        </TouchableOpacity>
                      </View>
                      <TextInput
                        style={[styles.editorInput, styles.glossaryDefInput]}
                        placeholder="Definition"
                        placeholderTextColor="#999"
                        value={item.definition}
                        onChangeText={(text) => updateGlossaryTerm(index, 'definition', text)}
                        multiline
                      />
                    </View>
                  ))}

                  <TouchableOpacity style={styles.addGlossaryButton} onPress={addGlossaryTerm}>
                    <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
                    <Text style={styles.addGlossaryText}>Add Term</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>

        <View style={styles.editorButtons}>
          <TouchableOpacity
            style={[styles.editorButton, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.editorButton, styles.saveButton]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with close button */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Create Course</Text>
        <TouchableOpacity onPress={saveCourse}>
          <Text style={styles.saveTopButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Course Icon Section */}
        <View style={styles.iconSection}>
          <Text style={styles.sectionLabel}>Course Icon</Text>
          <TouchableOpacity 
            style={[styles.iconPreview, { backgroundColor: courseColor }]}
            onPress={() => setShowIconPicker(true)}
          >
            <Ionicons name={courseIcon as any} size={48} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Course Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionLabel}>Course Details</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Course Title"
            placeholderTextColor="#999"
            value={course.title}
            onChangeText={(text) => setCourse({ ...course, title: text })}
          />
          <TextInput
            style={styles.descriptionInput}
            placeholder="Course Description"
            placeholderTextColor="#999"
            value={course.description}
            onChangeText={(text) => setCourse({ ...course, description: text })}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Elements Section */}
        <View style={styles.elementsSection}>
          <Text style={styles.sectionLabel}>Course Content</Text>

          <FlatList
            data={course.elements}
            renderItem={renderElement}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.elementsList}
          />
          
          <TouchableOpacity
            style={styles.addElementButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
            <Text style={styles.addElementText}>Add Element</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Element</Text>
            {ELEMENT_TYPES.map((element) => (
              <TouchableOpacity
                key={element.type}
                style={styles.elementOption}
                onPress={() => addElement(element.type)}
              >
                <Ionicons name={element.icon as any} size={24} color="#007AFF" />
                <Text style={styles.elementOptionText}>{element.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showElementEditor}
        animationType="slide"
      >
        <ElementEditor
          element={currentElement}
          onSave={saveElement}
          onCancel={() => {
            setShowElementEditor(false);
            setCurrentElement(null);
          }}
        />
      </Modal>

      {/* Icon Picker Modal */}
      <Modal
        visible={showIconPicker}
        animationType="slide"
        transparent
      >
        <View style={styles.modalContainer}>
          <View style={styles.iconPickerContent}>
            <Text style={styles.modalTitle}>Choose Course Icon</Text>
            <ScrollView>
              <View style={styles.iconGrid}>
                {COURSE_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      courseIcon === icon && styles.iconOptionSelected
                    ]}
                    onPress={() => {
                      setCourseIcon(icon);
                      setShowIconPicker(false);
                    }}
                  >
                    <Ionicons name={icon as any} size={32} color={courseIcon === icon ? '#007AFF' : '#666'} />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity
              style={styles.closeIconPicker}
              onPress={() => setShowIconPicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  topBarTitle: {
    fontSize: 20,
    fontFamily: 'NotoSerifBold',
    color: '#333',
  },
  saveTopButton: {
    fontSize: 16,
    fontFamily: 'InterMedium',
    color: '#007AFF',
  },
  iconSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'InterMedium',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  titleInput: {
    fontSize: 24,
    fontFamily: 'NotoSerifBold',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 12,
    marginBottom: 16,
  },
  descriptionInput: {
    fontSize: 16,
    fontFamily: 'InterRegular',
    color: '#666',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  elementsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
  },
  elementsList: {
    paddingBottom: 0,
  },
  elementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  elementContent: {
    flex: 1,
    marginLeft: 15,
  },
  elementTitle: {
    fontSize: 16,
    fontFamily: 'NotoSerifSemiBold',
    color: '#333',
  },
  elementType: {
    fontSize: 13,
    fontFamily: 'InterRegular',
    color: '#666',
    marginTop: 4,
  },
  addElementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  addElementText: {
    fontSize: 16,
    fontFamily: 'InterMedium',
    color: '#007AFF',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'NotoSerifBold',
    color: '#333',
    marginBottom: 20,
  },
  elementOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    marginBottom: 10,
  },
  elementOptionText: {
    fontSize: 16,
    fontFamily: 'InterMedium',
    color: '#333',
    marginLeft: 15,
  },
  cancelButton: {
    marginTop: 12,
    padding: 16,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'InterMedium',
  },
  iconPickerContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '70%',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  iconOption: {
    width: '22%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e8f4ff',
  },
  closeIconPicker: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  editorContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  editorHeader: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  editorTitle: {
    fontSize: 20,
    fontFamily: 'NotoSerifBold',
    color: '#333',
  },
  editorContent: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'InterMedium',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editorInput: {
    fontSize: 16,
    fontFamily: 'InterRegular',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contentInput: {
    minHeight: 200,
    textAlignVertical: 'top',
  },
  quizQuestionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 16,
    fontFamily: 'NotoSerifSemiBold',
    color: '#333',
  },
  optionsLabel: {
    fontSize: 13,
    fontFamily: 'InterMedium',
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#007AFF',
  },
  optionInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'InterRegular',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  addQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  addQuestionText: {
    fontSize: 16,
    fontFamily: 'InterMedium',
    color: '#007AFF',
    marginLeft: 8,
  },
  glossarySection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  glossaryHint: {
    fontSize: 13,
    fontFamily: 'InterRegular',
    color: '#999',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  glossaryItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  glossaryInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  glossaryTermInput: {
    flex: 1,
    marginRight: 12,
    marginBottom: 0,
  },
  glossaryDefInput: {
    minHeight: 60,
    marginBottom: 0,
  },
  addGlossaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  addGlossaryText: {
    fontSize: 14,
    fontFamily: 'InterMedium',
    color: '#007AFF',
    marginLeft: 6,
  },
  editorButtons: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  editorButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  saveButton: {
    marginTop: 12,
    padding: 16,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'InterMedium',
  },
  questionTypeBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  questionTypeText: {
    fontSize: 12,
    fontFamily: 'InterMedium',
    color: '#007AFF',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
  },
  addOptionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  addOptionText: {
    fontSize: 13,
    fontFamily: 'InterMedium',
    color: '#007AFF',
  },
  trueFalseContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  trueFalseButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  trueFalseSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  trueFalseText: {
    fontSize: 16,
    fontFamily: 'InterMedium',
    color: '#666',
  },
  trueFalseTextSelected: {
    color: '#007AFF',
  },
  matchingPairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchingInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'InterRegular',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  matchingArrow: {
    marginHorizontal: 8,
  },
  caseSensitiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  caseSensitiveText: {
    fontSize: 14,
    fontFamily: 'InterRegular',
    color: '#666',
  },
  orderingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderingNumber: {
    fontSize: 16,
    fontFamily: 'InterMedium',
    color: '#007AFF',
    width: 30,
  },
  orderingInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'InterRegular',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
  },
  addQuestionSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  addQuestionSectionTitle: {
    fontSize: 16,
    fontFamily: 'NotoSerifSemiBold',
    color: '#333',
    marginBottom: 16,
  },
  questionTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  questionTypeButton: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  questionTypeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  questionTypeLabel: {
    fontSize: 11,
    fontFamily: 'InterMedium',
    color: '#666',
    textAlign: 'center',
  },
});

export default CourseCreatorScreen;