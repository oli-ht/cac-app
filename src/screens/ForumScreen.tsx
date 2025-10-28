// Import React and necessary hooks
import React, { useState, useEffect } from 'react';

// Import React Native components for UI
import { 
  StyleSheet,        // For creating styles
  View,              // Container component
  Text,              // Text display
  TextInput,         // Text input field
  TouchableOpacity,  // Touchable button
  FlatList,          // Scrollable list
  Image,             // Image display
  Modal,             // Popup modal
  ScrollView,        // Scrollable container
  ActivityIndicator, // Loading spinner
  Alert,             // Alert dialog
  KeyboardAvoidingView, // Adjust for keyboard
  Platform,          // Detect iOS/Android
} from 'react-native';

// Import safe area to handle notches and status bars
import { SafeAreaView } from 'react-native-safe-area-context';

// Import Firebase for database
import { db } from '../config/firebaseConfig';
import { 
  collection,      // Reference to collection
  addDoc,          // Add document
  onSnapshot,      // Real-time listener
  serverTimestamp, // Server timestamp
  doc,             // Document reference
  updateDoc,       // Update document
  arrayUnion,      // Add to array
  arrayRemove,     // Remove from array
  increment,       // Increment number
} from 'firebase/firestore';

// Import Firebase Auth to get current user
import { getAuth } from 'firebase/auth';

// Import icons
import { Ionicons } from '@expo/vector-icons';

// Import image picker to select photos
import * as ImagePicker from 'expo-image-picker';

const ForumScreen = () => {
  // STATE VARIABLES
  // Array of all forum posts
  const [posts, setPosts] = useState<any[]>([]);
  // Text content for new post
  const [newPostContent, setNewPostContent] = useState('');
  // Selected image for new post
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  // Show/hide create post modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Loading state while uploading
  const [uploading, setUploading] = useState(false);
  // Loading state for fetching posts
  const [loading, setLoading] = useState(true);
  // Search query text
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get current authenticated user
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // FETCH POSTS FROM FIREBASE
  // useEffect runs when component mounts
  useEffect(() => {
    // Set up real-time listener for posts collection
    const unsubscribe = onSnapshot(
      collection(db, 'forumPosts'),  // Listen to 'forumPosts' collection
      (snapshot) => {                 // When data changes
        // Map through documents and extract data
        const postsData = snapshot.docs.map(doc => ({
          id: doc.id,              // Document ID
          ...doc.data(),           // All document data
        }));
        // Sort posts by timestamp (newest first)
        postsData.sort((a: any, b: any) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;  // Descending order
        });
        // Update state with posts
        setPosts(postsData);
        // Stop loading
        setLoading(false);
      },
      (error) => {
        // Handle errors
        console.error('Error fetching posts:', error);
        Alert.alert('Error', 'Failed to load posts');
        setLoading(false);
      }
    );
    
    // Cleanup: unsubscribe when component unmounts
    return () => unsubscribe();
  }, []); // Empty array = run once on mount

  // IMAGE PICKER FUNCTION
  // Opens device gallery to select image
  const pickImage = async () => {
    // Request permission to access media library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    // If permission denied, show alert
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Only images
      allowsEditing: true,     // Allow crop/edit
      aspect: [4, 3],          // Crop aspect ratio
      quality: 0.7,            // Compress to 70% quality
    });

    // If user didn't cancel, save selected image
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // CONVERT IMAGE TO BASE64
  // Takes image URI and converts to base64 string for Firestore storage
  const convertImageToBase64 = async (uri: string) => {
    try {
      // Use expo's FileSystem to read image as base64
      const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
      
      // Compress and resize image to reduce size (max 800px width)
      const manipResult = await manipulateAsync(
        uri,
        [{ resize: { width: 800 } }], // Resize to max 800px wide
        { compress: 0.7, format: SaveFormat.JPEG } // 70% quality JPEG
      );
      
      // Read as base64
      const response = await fetch(manipResult.uri);
      const blob = await response.blob();
      
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image:', error);
      throw new Error('Failed to process image: ' + (error as Error).message);
    }
  };

  // CREATE NEW POST
  const handleCreatePost = async () => {
    // Validate: must have content or image
    if (!newPostContent.trim() && !selectedImage) {
      Alert.alert('Error', 'Please add some content or an image');
      return;
    }

    // Must be logged in
    if (!currentUser) {
      Alert.alert('Error', 'Please log in to post');
      return;
    }

    // Start uploading
    setUploading(true);

    try {
      // Convert image to base64 if selected
      let imageData = null;
      if (selectedImage) {
        console.log('Converting image to base64...');
        imageData = await convertImageToBase64(selectedImage);
        console.log('Image converted successfully');
      }

      // Add post to Firestore
      console.log('Creating post in Firestore...');
      await addDoc(collection(db, 'forumPosts'), {
        content: newPostContent.trim(),      // Post text
        imageUrl: imageData,                 // Base64 image data (or null)
        userId: currentUser.uid,             // Who posted
        userName: currentUser.displayName || 'Anonymous', // Username
        userEmail: currentUser.email,        // User email
        createdAt: serverTimestamp(),        // When posted
        likes: [],                           // Empty likes array
        likesCount: 0,                       // Like counter
        commentsCount: 0,                    // Comment counter
      });

      // Clear form
      setNewPostContent('');
      setSelectedImage(null);
      setShowCreateModal(false);
      
      // Success message
      Alert.alert('Success', 'Post created!');
    } catch (error) {
      console.error('Error creating post:', error);
      // Show more detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post';
      Alert.alert('Error', errorMessage);
    } finally {
      // Stop uploading state
      setUploading(false);
    }
  };

  // LIKE/UNLIKE POST
  const handleLike = async (postId: string, currentLikes: string[]) => {
    // Must be logged in
    if (!currentUser) {
      Alert.alert('Error', 'Please log in to like posts');
      return;
    }

    try {
      // Reference to the post document
      const postRef = doc(db, 'forumPosts', postId);
      
      // Check if user already liked
      const hasLiked = currentLikes.includes(currentUser.uid);
      
      if (hasLiked) {
        // Unlike: remove user from likes array
        await updateDoc(postRef, {
          likes: arrayRemove(currentUser.uid),
          likesCount: increment(-1), // Decrease count by 1
        });
      } else {
        // Like: add user to likes array
        await updateDoc(postRef, {
          likes: arrayUnion(currentUser.uid),
          likesCount: increment(1), // Increase count by 1
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to update like');
    }
  };

  // FILTER POSTS BY SEARCH QUERY
  // Returns posts that match the search text
  const filteredPosts = posts.filter(post => {
    // If no search query, show all posts
    if (!searchQuery.trim()) return true;
    
    // Convert search query to lowercase for case-insensitive search
    const query = searchQuery.toLowerCase();
    
    // Check if post content contains search query
    const contentMatch = post.content?.toLowerCase().includes(query);
    
    // Check if username contains search query
    const userMatch = post.userName?.toLowerCase().includes(query);
    
    // Return true if either content or username matches
    return contentMatch || userMatch;
  });

  // FORMAT TIMESTAMP
  // Convert Firebase timestamp to "X mins ago" format
  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate();
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // RENDER EACH POST CARD
  const renderPost = ({ item }: { item: any }) => {
    // Check if current user liked this post
    const isLiked = item.likes?.includes(currentUser?.uid);

    return (
      <View style={styles.postCard}>
        {/* POST HEADER - User info */}
        <View style={styles.postHeader}>
          {/* User avatar (first letter of name) */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.userName?.charAt(0).toUpperCase() || 'A'}
            </Text>
          </View>
          
          {/* User name and time */}
          <View style={styles.postMeta}>
            <Text style={styles.userName}>{item.userName || 'Anonymous'}</Text>
            <Text style={styles.timeAgo}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>

        {/* POST CONTENT - Text */}
        {item.content && (
          <Text style={styles.postContent}>{item.content}</Text>
        )}

        {/* POST IMAGE (if exists) */}
        {item.imageUrl && (
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.postImage}
            resizeMode="cover"
          />
        )}

        {/* POST FOOTER - Like and Comment buttons */}
        <View style={styles.postFooter}>
          {/* Like button */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLike(item.id, item.likes || [])}
          >
            <Ionicons 
              name={isLiked ? 'heart' : 'heart-outline'} 
              size={22} 
              color={isLiked ? '#E74C3C' : '#666'}
            />
            <Text style={[styles.actionText, isLiked && styles.likedText]}>
              {item.likesCount || 0}
            </Text>
          </TouchableOpacity>

          {/* Comment button */}
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={20} color="#666" />
            <Text style={styles.actionText}>{item.commentsCount || 0}</Text>
          </TouchableOpacity>

          {/* Share button */}
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // LOADING STATE
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  // MAIN RENDER
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community Forum</Text>
        {/* Create post button */}
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts or users..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {/* Clear search button (shows when there's text) */}
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* POSTS LIST */}
      <FlatList
        data={filteredPosts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name={searchQuery ? "search-outline" : "chatbubbles-outline"} size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No results found' : 'No posts yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search term' : 'Be the first to share something!'}
            </Text>
          </View>
        }
      />

      {/* CREATE POST MODAL */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowCreateModal(false);
              setNewPostContent('');
              setSelectedImage(null);
            }}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Post</Text>
            <TouchableOpacity 
              onPress={handleCreatePost}
              disabled={uploading}
            >
              <Text style={[styles.postButton, uploading && styles.postButtonDisabled]}>
                Post
              </Text>
            </TouchableOpacity>
          </View>

          {/* Modal content */}
          <KeyboardAvoidingView 
            style={styles.modalContent}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* User info */}
              <View style={styles.modalUserInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {currentUser?.displayName?.charAt(0).toUpperCase() || 'A'}
                  </Text>
                </View>
                <Text style={styles.modalUserName}>
                  {currentUser?.displayName || 'Anonymous'}
                </Text>
              </View>

              {/* Text input */}
              <TextInput
                style={styles.postInput}
                placeholder="What's on your mind?"
                placeholderTextColor="#999"
                value={newPostContent}
                onChangeText={setNewPostContent}
                multiline
                textAlignVertical="top"
              />

              {/* Selected image preview */}
              {selectedImage && (
                <View style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ uri: selectedImage }} 
                    style={styles.imagePreview}
                  />
                  {/* Remove image button */}
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => setSelectedImage(null)}
                  >
                    <Ionicons name="close-circle" size={32} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Add image button */}
              <TouchableOpacity 
                style={styles.addImageButton}
                onPress={pickImage}
                disabled={uploading}
              >
                <Ionicons name="image-outline" size={24} color="#007AFF" />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>

              {/* Uploading indicator */}
              {uploading && (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// STYLES
const styles = StyleSheet.create({
  // Main container - takes full screen
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  
  // Header bar at top
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  
  // "Community Forum" title
  headerTitle: {
    fontSize: 24,
    fontFamily: 'NotoSerifBold',
    color: '#333',
  },
  
  // Blue circular + button
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // SEARCH BAR STYLES
  
  // Container for search bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  
  // Magnifying glass icon
  searchIcon: {
    marginRight: 8,
  },
  
  // Search text input
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'InterRegular',
    color: '#333',
    paddingVertical: 8,
  },
  
  // Posts list padding
  listContent: {
    padding: 16,
  },
  
  // Each post card
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Post header (user info section)
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  // Circular avatar with user initial
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Letter inside avatar
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'InterBold',
  },
  
  // User name and time container
  postMeta: {
    marginLeft: 12,
    flex: 1,
  },
  
  // User name text
  userName: {
    fontSize: 16,
    fontFamily: 'InterSemiBold',
    color: '#333',
  },
  
  // "X mins ago" text
  timeAgo: {
    fontSize: 12,
    fontFamily: 'InterRegular',
    color: '#999',
    marginTop: 2,
  },
  
  // Post text content
  postContent: {
    fontSize: 15,
    fontFamily: 'InterRegular',
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  
  // Post image
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    marginBottom: 12,
  },
  
  // Footer with like/comment buttons
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  
  // Like/comment/share button
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  
  // Number next to icons
  actionText: {
    fontSize: 14,
    fontFamily: 'InterMedium',
    color: '#666',
    marginLeft: 6,
  },
  
  // Red text when liked
  likedText: {
    color: '#E74C3C',
  },
  
  // Empty state (no posts)
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  
  // "No posts yet" text
  emptyText: {
    fontSize: 18,
    fontFamily: 'NotoSerifBold',
    color: '#999',
    marginTop: 16,
  },
  
  // "Be the first..." subtext
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'InterRegular',
    color: '#BBB',
    marginTop: 8,
  },
  
  // Loading screen container
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  
  // "Loading posts..." text
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'InterRegular',
    color: '#666',
  },
  
  // CREATE POST MODAL STYLES
  
  // Modal full screen container
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  
  // Modal header with close/post buttons
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  
  // "Create Post" title
  modalTitle: {
    fontSize: 18,
    fontFamily: 'NotoSerifBold',
    color: '#333',
  },
  
  // "Post" button text
  postButton: {
    fontSize: 16,
    fontFamily: 'InterSemiBold',
    color: '#007AFF',
  },
  
  // Disabled post button
  postButtonDisabled: {
    color: '#CCC',
  },
  
  // Modal content area
  modalContent: {
    flex: 1,
    padding: 16,
  },
  
  // User info in modal
  modalUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  // Username in modal
  modalUserName: {
    fontSize: 16,
    fontFamily: 'InterSemiBold',
    color: '#333',
    marginLeft: 12,
  },
  
  // Text input for post content
  postInput: {
    fontSize: 16,
    fontFamily: 'InterRegular',
    color: '#333',
    minHeight: 150,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  
  // Image preview container
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  
  // Image preview
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  
  // X button to remove image
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
  },
  
  // "Add Photo" button
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  
  // "Add Photo" text
  addImageText: {
    fontSize: 16,
    fontFamily: 'InterMedium',
    color: '#007AFF',
    marginLeft: 8,
  },
  
  // Uploading indicator container
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  
  // "Uploading..." text
  uploadingText: {
    fontSize: 14,
    fontFamily: 'InterRegular',
    color: '#666',
    marginLeft: 8,
  },
});

export default ForumScreen;
