import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList, Dimensions, TextInput, Image, Pressable, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import CustomDropdown from '../../components/common/CustomDropdown';
import { db, auth } from "../../config/firebaseConfig";
import { doc, setDoc } from "firebase/firestore"

const Loading = () => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
};
interface Slide {
  id: string;
  title: string;
  description: string;
  graphic: any; // ImageSourcePropType
  input: 'name' | 'demographics' | 'goals' | null;
  options?: {
    age?: string[];
    gender?: string[];
    goals?: string[];
  };
}

const slides: Slide[] = [
  {
    id: '1',
    title: 'Welcome to the App',
    description: 'Boost your health literacy!',
    graphic: require('../../assets/images/welcome.png'),
    input: null
  },
  {
    id: '2',
    title: 'What is your name?',
    description: 'For an enhanced, personalized user experience, please provide the following details.',
    graphic: require('../../assets/images/onboarding1.png'),
    input: 'name'
  },
  {
    id: '3',
    title: 'Which of the following best describes you?',
    description: 'Age, gender, location, and more!',
    graphic: require('../../assets/images/onboarding2.png'),
    input: 'demographics',
    options: {
      age: ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
      gender: ['Male', 'Female', 'Non-binary', 'Prefer not to say']
    }
  },
  {
    id: '4',
    title: 'Goals',
    description: 'Goals, preferred learning topics, and learning style!',
    graphic: require('../../assets/images/goals.png'),
    input: 'goals',
    options: {
      goals: [
        'Learn about health policies',
        'Understand medical terms',
        'Stay updated with healthcare news',
        'Track health literacy progress'
      ]
    }
  }
];

const OnboardingScreen = ({ navigation }: { navigation: any }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  React.useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        // Check if user has completed onboarding
        const onboardingStatus = await AsyncStorage.getItem('@onboarding_complete');
        const userToken = await AsyncStorage.getItem('@user_token');
        
        if (onboardingStatus === 'true' && userToken) {
          // User has completed onboarding and is logged in
          navigation.replace('MainTabs');
        } else if (userToken && !onboardingStatus) {
          // User is logged in but hasn't completed onboarding
          setHasCompletedOnboarding(false);
          setIsLoading(false);
        } else {
          // User needs to log in
          navigation.replace('Auth');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        navigation.replace('Auth');
      }
    };

    checkOnboardingStatus();
  }, [navigation]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <OnboardingContent navigation={navigation} />
      <StatusBar style="auto" />
    </View>
  );
};

const OnboardingContent = ({ navigation }: { navigation: any }) => {
  const windowWidth = Dimensions.get('window').width;
  const flatListRef = React.useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [name, setName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [ageOpen, setAgeOpen] = useState(false);
  const [age, setAge] = useState(null);
  const [ageItems, setAgeItems] = useState([
    { label: '6-12', value: '6-12' },
    { label: '13-18', value: '13-18' },
    { label: '19-29', value: '19-29' },
    { label: '30-49', value: '30-49' },
    { label: '50+', value: '50+' },
  ]);
  const [genderOpen, setGenderOpen] = useState(false);
  const [gender, setGender] = useState(null);
  const [genderItems, setGenderItems] = useState([
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Non-binary', value: 'Non-binary' },
    { label: 'Other', value: 'Other' },
    { label: 'Prefer not to say', value: 'Prefer not to say' },
  ]);

  const goToNextSlide = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevSlide = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1 });
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
          setCurrentIndex(index);
        }}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={true}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: windowWidth }]}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <Image 
              source={item.graphic} 
              style={[
                styles.graphic,
                { marginRight: 20 } // Add your custom styles here
              ]} 
            />
            {item.input === 'goals' && item.options?.goals && (
              <View style={styles.goalsContainer}>
                <Text style={styles.question}>What are your learning goals?</Text>
                {item.options?.goals.map((goal: string) => (
                  <Pressable 
                    key={goal}
                    style={styles.checkboxContainer}
                    onPress={() => {
                      if (selectedGoals.includes(goal)) {
                        setSelectedGoals(selectedGoals.filter(g => g !== goal));
                      } else {
                        setSelectedGoals([...selectedGoals, goal]);
                      }
                    }}
                  >
                    <View style={[styles.checkbox, selectedGoals.includes(goal) && styles.checked]}>
                      {selectedGoals.includes(goal) && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>{goal}</Text>
                  </Pressable>
                ))}
                <TouchableOpacity 
                  style={styles.doneButton}
                  onPress={async () => {
                    try {
                      const user = auth.currentUser;
                      if (!user) {
                        Alert.alert('Error', 'No user found. Please login again.');
                        navigation.replace('Auth');
                        return;
                      }

                      // Create user profile data
                      const userProfile = {
                        name,
                        age,
                        gender,
                        zipCode,
                        learningGoals: selectedGoals,
                        onboardingCompleted: true,
                        updatedAt: new Date().toISOString(),
                        createdAt: new Date().toISOString()
                      };

                      // Save to Firestore
                      await setDoc(doc(db, 'users', user.uid), userProfile, { merge: true });

                      // Save onboarding completion status locally
                      await AsyncStorage.setItem('@onboarding_complete', 'true');
                      
                      // Navigate to main app
                      navigation.replace('MainTabs');
                    } catch (error) {
                      console.error('Error saving user profile:', error);
                      Alert.alert('Error', 'Failed to save your profile. Please try again.');
                    }
                  }}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
            {item.input === 'name' && (
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                value={name}
                onChangeText={text => setName(text)}
              />
            )}
            {item.input === 'demographics' && (
              <View style={styles.demographicsContainer}>
                <CustomDropdown
                  label="Age:"
                  open={ageOpen}
                  value={age}
                  items={ageItems}
                  setOpen={setAgeOpen}
                  setValue={setAge}
                  setItems={setAgeItems}
                  placeholder="Select Age"
                  zIndex={2000}
                />

                <CustomDropdown
                  label="Gender:"
                  open={genderOpen}
                  value={gender}
                  items={genderItems}
                  setOpen={setGenderOpen}
                  setValue={setGender}
                  setItems={setGenderItems}
                  placeholder="Select Gender"
                  zIndex={1000}
                />

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Zip Code (Optional):</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter zip code"
                    value={zipCode}
                    onChangeText={text => setZipCode(text)}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
              </View>
            )}
          </View>
        )}
      />
      <View style={[
        styles.navigationButtons,
        currentIndex === 0 && styles.centerButton
      ]}>
        {currentIndex > 0 && (
          <TouchableOpacity 
            style={[styles.navButton, styles.backButton]} 
            onPress={goToPrevSlide}
          >
            <Text style={[styles.navButtonText, { color: '#666' }]}>Back</Text>
          </TouchableOpacity>
        )}
        {currentIndex < slides.length - 1 ? (
          <TouchableOpacity 
            style={[
              styles.navButton, 
              styles.nextButton,
              currentIndex === 0 && styles.firstScreenButton
            ]} 
            onPress={goToNextSlide}
          >
            <Text style={styles.navButtonText}>Next</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centerButton: {
    justifyContent: 'center',
  },
  firstScreenButton: {
    paddingHorizontal: 48,
    minWidth: 160,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 30,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#E0E0E0',
  },
  nextButton: {
    backgroundColor: '#007AFF',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  doneButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 30,
    alignSelf: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  goalsContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {
    backgroundColor: '#007AFF',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  demographicsContainer: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },

  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 20,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: 'blue',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  graphic: {
    marginTop: 30,
    width: '100%',
    height: 300,
    resizeMode: 'contain',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default OnboardingScreen;