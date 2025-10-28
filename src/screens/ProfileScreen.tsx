import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // State variables
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Load user data
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    if (!currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfileImage(data.profileImage || null);
        setName(data.name || '');
        setEmail(currentUser.email || '');
        setAge(data.age?.toString() || '');
        setGender(data.gender || '');
        setLocation(data.location || '');
        setLocationSharingEnabled(data.locationSharingEnabled || false);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Pick and convert image to base64
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      try {
        // Convert to base64
        const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
        const manipResult = await manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 400 } }],
          { compress: 0.7, format: SaveFormat.JPEG }
        );

        const response = await fetch(manipResult.uri);
        const blob = await response.blob();

        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileImage(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error('Error processing image:', error);
        Alert.alert('Error', 'Failed to process image');
      }
    }
  };

  // Save profile changes
  const handleSave = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        profileImage,
        name,
        age: age ? parseInt(age) : null,
        gender,
        location,
        locationSharingEnabled,
        updatedAt: new Date().toISOString(),
      });

      Alert.alert('Success', 'Profile updated successfully!');
      setEditMode(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // Log out
  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              // Navigation will be handled by auth state listener
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to log out');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          onPress={() => {
            if (editMode) {
              handleSave();
            } else {
              setEditMode(true);
            }
          }}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>
            {saving ? 'Saving...' : editMode ? 'Save' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <View style={styles.profileImageSection}>
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={60} color="#999" />
              </View>
            )}
          </View>
          {editMode && (
            <TouchableOpacity style={styles.changePhotoButton} onPress={handlePickImage}>
              <Ionicons name="camera" size={20} color="#007AFF" />
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            {editMode ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#999"
              />
            ) : (
              <Text style={styles.value}>{name || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{email}</Text>
            <Text style={styles.hint}>Email cannot be changed</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Age</Text>
            {editMode ? (
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                placeholder="Enter your age"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            ) : (
              <Text style={styles.value}>{age || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Gender</Text>
            {editMode ? (
              <TextInput
                style={styles.input}
                value={gender}
                onChangeText={setGender}
                placeholder="Enter your gender"
                placeholderTextColor="#999"
              />
            ) : (
              <Text style={styles.value}>{gender || 'Not set'}</Text>
            )}
          </View>
        </View>

        {/* Location Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            {editMode ? (
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Enter your location"
                placeholderTextColor="#999"
              />
            ) : (
              <Text style={styles.value}>{location || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.switchField}>
            <View style={styles.switchLabel}>
              <Text style={styles.label}>Share Location</Text>
              <Text style={styles.hint}>Allow app to access your location</Text>
            </View>
            <Switch
              value={locationSharingEnabled}
              onValueChange={setLocationSharingEnabled}
              disabled={!editMode}
              trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'NotoSerifBold',
    color: '#333',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    fontSize: 16,
    fontFamily: 'InterSemiBold',
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  profileImageSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 16,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  changePhotoText: {
    fontSize: 14,
    fontFamily: 'InterMedium',
    color: '#007AFF',
  },
  section: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'NotoSerifBold',
    color: '#333',
    marginBottom: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'InterMedium',
    color: '#666',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    fontFamily: 'InterRegular',
    color: '#333',
  },
  input: {
    fontSize: 16,
    fontFamily: 'InterRegular',
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9F9F9',
  },
  hint: {
    fontSize: 12,
    fontFamily: 'InterRegular',
    color: '#999',
    marginTop: 4,
  },
  switchField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  switchLabel: {
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#FFE5E5',
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'InterSemiBold',
    color: '#FF3B30',
  },
});

export default ProfileScreen;

