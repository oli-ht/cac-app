import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { Course, CourseElement, ElementType } from '../types/courseCreator';
import { collection, doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../config/firebaseConfig';



const ELEMENT_TYPES: { type: ElementType; icon: string; label: string }[] = [
  { type: 'article', icon: 'document-text', label: 'Article' },
  { type: 'video', icon: 'videocam', label: 'Video' },
  { type: 'funFact', icon: 'bulb', label: 'Fun Fact' },
  { type: 'quiz', icon: 'help-circle', label: 'Quiz' },
  { type: 'question', icon: 'chatbubble', label: 'Question' },
];

const CourseCreatorScreen = ({ navigation, route }: { navigation: any, route: any }) => {
  const existingCourse = route.params?.course;
  
  // Debug log
  console.log('Received course data:', existingCourse);

  // Initialize course data
  useEffect(() => {
    if (existingCourse) {
      console.log('Received existing course:', existingCourse);
      const courseData = {
        ...existingCourse,
        elements: existingCourse.elements.map((element: CourseElement) => {
          console.log('Processing element:', element);
          return {
            ...element,
            id: element.id || Date.now().toString(),
            title: element.title || '',
            content: element.content || '',
            videoUrl: element.videoUrl || '',
            order: element.order || 0,
          };
        })
      };
      console.log('Setting course data:', courseData);
      setCourse(courseData);
    }
  }, [existingCourse]);

  const [course, setCourse] = useState<Course>({
    id: existingCourse?.id || Date.now().toString(),
    title: existingCourse?.title || '',
    description: existingCourse?.description || '',
    createdAt: existingCourse?.createdAt || Date.now(),
    updatedAt: existingCourse?.updatedAt || Date.now(),
    elements: existingCourse?.elements || [],
    published: existingCourse?.published || false,
    userId: existingCourse?.userId || getAuth().currentUser?.uid || '',
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showElementEditor, setShowElementEditor] = useState(false);
  const [currentElement, setCurrentElement] = useState<CourseElement | null>(null);

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
      alert('Please enter a course title');
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert('Please log in to save courses');
      return;
    }

    try {
      console.log('Saving course:', course);
      const courseRef = doc(db, 'courses', course.id);
      await setDoc(courseRef, {
        ...course,
        creatorId: user.uid,  // Track who created the course
        isPublic: true,       // Make course publicly accessible
        updatedAt: Date.now(),
        // Add metadata for discovery
        metadata: {
          creatorName: user.displayName || 'Anonymous',
          totalElements: course.elements.length,
          lastUpdated: new Date().toISOString(),
          tags: [],  // You can add tags later for categorization
          views: 0,
          likes: 0
        }
      });
      console.log('Course saved successfully');
      
      // Navigate to Courses tab
      const rootNav = navigation.getParent()?.getParent();
      rootNav?.navigate('MainTabs', {
        screen: 'Courses',
        params: {
          screen: 'CoursesMain'
        }
      });
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Failed to save course. Please try again.');
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.titleInput}
          placeholder="Course Title"
          value={course.title}
          onChangeText={(text) => setCourse({ ...course, title: text })}
        />
        <TextInput
          style={styles.descriptionInput}
          placeholder="Course Description"
          value={course.description}
          onChangeText={(text) => setCourse({ ...course, description: text })}
          multiline
        />
      </View>

      <FlatList
        data={course.elements}
        renderItem={renderElement}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.elementsList}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={saveCourse}
      >
        <Text style={styles.saveButtonText}>Save Course</Text>
      </TouchableOpacity>

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
    </View>
  );
};

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizData {
  questions: QuizQuestion[];
}

const QuestionEditor = ({
  question,
  onChange,
  onDelete,
  showDelete,
}: {
  question: QuizQuestion;
  onChange: (question: QuizQuestion) => void;
  onDelete: () => void;
  showDelete: boolean;
}) => {
  const addOption = () => {
    onChange({
      ...question,
      options: [...question.options, '']
    });
  };

  const removeOption = (index: number) => {
    const newOptions = question.options.filter((_: string, i: number) => i !== index);
    onChange({
      ...question,
      options: newOptions,
      correctAnswer: question.correctAnswer >= index ? 
        Math.max(0, question.correctAnswer - 1) : 
        question.correctAnswer
    });
  };

  const updateOption = (index: number, text: string) => {
    const newOptions = [...question.options];
    newOptions[index] = text;
    onChange({
      ...question,
      options: newOptions
    });
  };

  return (
    <View style={styles.questionContainer}>
      <View style={styles.questionHeader}>
        <TextInput
          style={[styles.editorInput, styles.questionInput]}
          placeholder="Question"
          value={question.question}
          onChangeText={(text) => onChange({ ...question, question: text })}
          multiline
        />
        {showDelete && (
          <TouchableOpacity
            style={styles.deleteQuestionButton}
            onPress={onDelete}
          >
            <Text style={styles.deleteQuestionText}>Delete Question</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.optionsLabel}>Options:</Text>
      {question.options.map((option: string, index: number) => (
        <View key={index} style={styles.optionRow}>
          <TouchableOpacity
            style={[
              styles.radioButton,
              question.correctAnswer === index && styles.radioButtonSelected
            ]}
            onPress={() => onChange({ ...question, correctAnswer: index })}
          >
            <View style={[
              styles.radioButtonInner,
              question.correctAnswer === index && styles.radioButtonInnerSelected
            ]} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.optionInput}
            placeholder={`Option ${index + 1}`}
            value={option}
            onChangeText={(text) => updateOption(index, text)}
          />
          
          {question.options.length > 1 && (
            <TouchableOpacity
              style={styles.removeOptionButton}
              onPress={() => removeOption(index)}
            >
              <Text style={styles.removeOptionText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.addOptionButton} onPress={addOption}>
        <Text style={styles.addOptionText}>+ Add Option</Text>
      </TouchableOpacity>
    </View>
  );
};

const QuizEditor = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const [quizData, setQuizData] = useState<QuizData>(() => {
    try {
      const parsed = JSON.parse(value);
      return parsed || { questions: [{
        id: Date.now().toString(),
        question: '',
        options: [''],
        correctAnswer: 0
      }]};
    } catch {
      return {
        questions: [{
          id: Date.now().toString(),
          question: '',
          options: [''],
          correctAnswer: 0
        }]
      };
    }
  });

  const updateQuizData = (newData: QuizData) => {
    setQuizData(newData);
    onChange(JSON.stringify(newData));
  };

  const addQuestion = () => {
    updateQuizData({
      ...quizData,
      questions: [...quizData.questions, {
        id: Date.now().toString(),
        question: '',
        options: [''],
        correctAnswer: 0
      }]
    });
  };

  const updateQuestion = (index: number, updatedQuestion: QuizQuestion) => {
    const newQuestions = [...quizData.questions];
    newQuestions[index] = updatedQuestion;
    updateQuizData({
      ...quizData,
      questions: newQuestions
    });
  };

  const removeQuestion = (index: number) => {
    updateQuizData({
      ...quizData,
      questions: quizData.questions.filter((_, i) => i !== index)
    });
  };

  return (
    <View style={styles.quizEditorContainer}>
      {quizData.questions.map((question, index) => (
        <QuestionEditor
          key={question.id}
          question={question}
          onChange={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
          onDelete={() => removeQuestion(index)}
          showDelete={quizData.questions.length > 1}
        />
      ))}

      <TouchableOpacity 
        style={styles.addQuestionButton} 
        onPress={addQuestion}
      >
        <Text style={styles.addQuestionText}>+ Add New Question</Text>
      </TouchableOpacity>
    </View>
  );
};

const ElementEditor = ({
  element,
  onSave,
  onCancel,
}: {
  element: CourseElement | null;
  onSave: (element: CourseElement) => void;
  onCancel: () => void;
}) => {
  const [editedElement, setEditedElement] = useState<CourseElement>(() => {
    if (element) {
      console.log('Editing element:', element); // Debug log
      // Make sure to include all properties from the existing element
      const elementData = {
        ...element,
        id: element.id || Date.now().toString(),
        type: element.type || 'article',
        title: element.title || '',
        content: element.content || '',
        videoUrl: element.videoUrl || '',
        order: element.order || 0,
      };
      console.log('Initialized element data:', elementData); // Debug log
      return elementData;
    }
    return {
      id: Date.now().toString(),
      type: 'article',
      title: '',
      content: '',
      order: 0,
    };
  });

  return (
    <SafeAreaView style={styles.editorContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.editorHeader}>
        <Text style={styles.editorTitle}>
          {ELEMENT_TYPES.find(e => e.type === editedElement.type)?.label} Editor
        </Text>
      </View>

      <ScrollView style={styles.editorContent}>
        <TextInput
          style={styles.editorInput}
          placeholder="Title"
          value={editedElement.title}
          onChangeText={(text) => setEditedElement({ ...editedElement, title: text })}
        />

        {editedElement.type === 'video' && (
          <TextInput
            style={styles.editorInput}
            placeholder="Video URL"
            value={editedElement.videoUrl}
            onChangeText={(text) => setEditedElement({ ...editedElement, videoUrl: text })}
          />
        )}

        {editedElement.type === 'quiz' ? (
          <QuizEditor
            value={editedElement.content}
            onChange={(content) => setEditedElement({ ...editedElement, content })}
          />
        ) : (
          <TextInput
            style={[styles.editorInput, styles.contentInput]}
            placeholder="Content"
            value={editedElement.content}
            onChangeText={(text) => setEditedElement({ ...editedElement, content: text })}
            multiline
          />
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
          onPress={() => onSave(editedElement)}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  quizEditorContainer: {
    marginTop: 10,
  },
  questionContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  questionInput: {
    flex: 1,
    marginRight: 10,
  },
  deleteQuestionButton: {
    backgroundColor: '#FFE5E5',
    padding: 8,
    borderRadius: 8,
  },
  deleteQuestionText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  addQuestionButton: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  addQuestionText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  optionsLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 10,
    color: '#333',
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
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#007AFF',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  radioButtonInnerSelected: {
    backgroundColor: '#007AFF',
  },
  optionInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  removeOptionButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  removeOptionText: {
    fontSize: 24,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  addOptionButton: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addOptionText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  descriptionInput: {
    fontSize: 16,
    color: '#666',
    minHeight: 60,
  },
  elementsList: {
    padding: 20,
  },
  elementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginBottom: 10,
  },
  elementContent: {
    flex: 1,
    marginLeft: 15,
  },
  elementTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  elementType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  saveButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  elementOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  elementOptionText: {
    fontSize: 16,
    marginLeft: 15,
  },
  cancelButton: {
    marginTop: 20,
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  editorContainer: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: Platform.OS === 'ios' ? 50 : 30, // Add more padding at the top
  },
  editorHeader: {
    padding: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  editorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  editorContent: {
    flex: 1,
    padding: 20,
  },
  editorInput: {
    fontSize: 16,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginBottom: 15,
  },
  contentInput: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  editorButtons: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  editorButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
});

export default CourseCreatorScreen;
