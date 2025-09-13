import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Image,
  Modal,
  Alert,
  FlatList,
} from 'react-native';

const ForumScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: "How to optimize React Native performance?",
      author: "DevMaster",
      avatar: "https://i.pravatar.cc/40?img=1",
      category: "React Native",
      timeAgo: "2h ago",
      upvotes: 24,
      downvotes: 2,
      userVote: null, // null, 'up', or 'down'
      comments: [
        { id: 1, author: "CodeGuru", content: "Great question! I'd recommend using React.memo for components.", timeAgo: "1h ago", avatar: "https://i.pravatar.cc/40?img=10" },
        { id: 2, author: "DevExpert", content: "Also consider using FlatList instead of ScrollView for large lists.", timeAgo: "45m ago", avatar: "https://i.pravatar.cc/40?img=11" }
      ],
      content: "I've been working on a large React Native app and noticed some performance issues. The app becomes sluggish when navigating between screens with large data sets. What are the best practices for optimizing performance?",
      isPinned: true,
    },
    {
      id: 2,
      title: "Best practices for state management in 2024",
      author: "StateGuru",
      avatar: "https://i.pravatar.cc/40?img=2",
      category: "General",
      timeAgo: "4h ago",
      upvotes: 18,
      downvotes: 1,
      userVote: null,
      comments: [
        { id: 3, author: "ReactPro", content: "I still prefer Redux for complex apps.", timeAgo: "2h ago", avatar: "https://i.pravatar.cc/40?img=12" }
      ],
      content: "With so many state management solutions available (Redux, Zustand, Context API, etc.), what do you think works best for different project sizes?",
      isPinned: false,
    },
    {
      id: 3,
      title: "Navigation v6 vs v7 - Major differences",
      author: "NavExpert",
      avatar: "https://i.pravatar.cc/40?img=3",
      category: "Navigation",
      timeAgo: "6h ago",
      upvotes: 31,
      downvotes: 0,
      userVote: null,
      comments: [],
      content: "Just upgraded to React Navigation v7 and wanted to share the key changes I noticed during the migration process.",
      isPinned: false,
    },
    {
      id: 4,
      title: "Debugging tips for beginners",
      author: "HelpfulDev",
      avatar: "https://i.pravatar.cc/40?img=4",
      category: "Help",
      timeAgo: "1d ago",
      upvotes: 42,
      downvotes: 3,
      userVote: null,
      comments: [
        { id: 4, author: "NewbieCoder", content: "This is exactly what I needed! Thank you.", timeAgo: "12h ago", avatar: "https://i.pravatar.cc/40?img=13" },
        { id: 5, author: "DevMentor", content: "Don't forget to use React DevTools!", timeAgo: "8h ago", avatar: "https://i.pravatar.cc/40?img=14" }
      ],
      content: "Here are some essential debugging techniques every React Native developer should know, especially when starting out.",
      isPinned: false,
    },
    {
      id: 5,
      title: "New Expo SDK 50 features overview",
      author: "ExpoFan",
      avatar: "https://i.pravatar.cc/40?img=5",
      category: "Expo",
      timeAgo: "2d ago",
      upvotes: 67,
      downvotes: 2,
      userVote: null,
      comments: [
        { id: 6, author: "MobileDev", content: "The new camera features are amazing!", timeAgo: "1d ago", avatar: "https://i.pravatar.cc/40?img=15" }
      ],
      content: "The latest Expo SDK brings some exciting new features and improvements. Let me break down the most important ones.",
      isPinned: false,
    },
  ]);

  const categories = ['All', 'React Native', 'General', 'Navigation', 'Help', 'Expo'];

  // Filter posts based on selected category and search
  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchText.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleVote = (postId, voteType) => {
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          let newUpvotes = post.upvotes;
          let newDownvotes = post.downvotes;
          let newUserVote = voteType;

          // Remove previous vote if exists
          if (post.userVote === 'up') {
            newUpvotes--;
          } else if (post.userVote === 'down') {
            newDownvotes--;
          }

          // Add new vote or remove if same vote clicked
          if (voteType === 'up') {
            if (post.userVote === 'up') {
              newUserVote = null; // Remove vote
            } else {
              newUpvotes++;
            }
          } else if (voteType === 'down') {
            if (post.userVote === 'down') {
              newUserVote = null; // Remove vote
            } else {
              newDownvotes++;
            }
          }

          return {
            ...post,
            upvotes: newUpvotes,
            downvotes: newDownvotes,
            userVote: newUserVote,
          };
        }
        return post;
      })
    );
  };

  const openPost = (post) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };

  const addComment = () => {
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now(),
      author: "You",
      content: newComment,
      timeAgo: "now",
      avatar: "https://i.pravatar.cc/40?img=9",
    };

    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === selectedPost.id
          ? { ...post, comments: [...post.comments, comment] }
          : post
      )
    );

    // Update selected post for modal
    setSelectedPost(prev => ({
      ...prev,
      comments: [...prev.comments, comment]
    }));

    setNewComment('');
    Alert.alert("Success", "Comment added!");
  };

  const PostItem = ({ post }) => (
    <TouchableOpacity style={styles.postContainer} onPress={() => openPost(post)}>
      {post.isPinned && (
        <View style={styles.pinnedBadge}>
          <Text style={styles.pinnedText}>📌 PINNED</Text>
        </View>
      )}
      
      <View style={styles.postHeader}>
        <Image source={{ uri: post.avatar }} style={styles.avatar} />
        <View style={styles.postMeta}>
          <Text style={styles.authorName}>{post.author}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.category}>{post.category}</Text>
            <Text style={styles.timeAgo}>• {post.timeAgo}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postPreview} numberOfLines={2}>
        {post.content}
      </Text>

      <View style={styles.postFooter}>
        <View style={styles.voteContainer}>
          <TouchableOpacity 
            style={[styles.voteButton, post.userVote === 'up' && styles.activeUpvote]}
            onPress={(e) => {
              e.stopPropagation();
              handleVote(post.id, 'up');
            }}
          >
            <Text style={[styles.voteText, post.userVote === 'up' && styles.activeUpvoteText]}>
              ▲ {post.upvotes}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.voteButton, post.userVote === 'down' && styles.activeDownvote]}
            onPress={(e) => {
              e.stopPropagation();
              handleVote(post.id, 'down');
            }}
          >
            <Text style={[styles.voteText, post.userVote === 'down' && styles.activeDownvoteText]}>
              ▼ {post.downvotes}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.commentContainer} onPress={() => openPost(post)}>
          <Text style={styles.commentCount}>💬 {post.comments.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const CategoryTab = ({ category, isSelected, onPress }) => (
    <TouchableOpacity
      style={[styles.categoryTab, isSelected && styles.selectedCategoryTab]}
      onPress={onPress}
    >
      <Text style={[styles.categoryText, isSelected && styles.selectedCategoryText]}>
        {category}
      </Text>
    </TouchableOpacity>
  );

  const CommentItem = ({ comment }) => (
    <View style={styles.commentItem}>
      <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{comment.author}</Text>
          <Text style={styles.commentTime}>• {comment.timeAgo}</Text>
        </View>
        <Text style={styles.commentText}>{comment.content}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Forum</Text>
        <TouchableOpacity style={styles.newPostButton}>
          <Text style={styles.newPostText}>+ New Post</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
        {categories.map((category) => (
          <CategoryTab
            key={category}
            category={category}
            isSelected={selectedCategory === category}
            onPress={() => setSelectedCategory(category)}
          />
        ))}
      </ScrollView>

      <ScrollView style={styles.postsContainer} showsVerticalScrollIndicator={false}>
        {filteredPosts.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
        {filteredPosts.length === 0 && (
          <View style={styles.noPostsContainer}>
            <Text style={styles.noPostsText}>
              {searchText ? 'No posts found matching your search.' : 'No posts in this category.'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Post Detail Modal */}
      <Modal
        visible={showPostModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPostModal(false)} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Post</Text>
            <View style={styles.placeholder} />
          </View>

          {selectedPost && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.postDetailHeader}>
                <Image source={{ uri: selectedPost.avatar }} style={styles.avatar} />
                <View style={styles.postMeta}>
                  <Text style={styles.authorName}>{selectedPost.author}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.category}>{selectedPost.category}</Text>
                    <Text style={styles.timeAgo}>• {selectedPost.timeAgo}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.postDetailTitle}>{selectedPost.title}</Text>
              <Text style={styles.postDetailContent}>{selectedPost.content}</Text>

              <View style={styles.postDetailFooter}>
                <View style={styles.voteContainer}>
                  <TouchableOpacity 
                    style={[styles.voteButton, selectedPost.userVote === 'up' && styles.activeUpvote]}
                    onPress={() => handleVote(selectedPost.id, 'up')}
                  >
                    <Text style={[styles.voteText, selectedPost.userVote === 'up' && styles.activeUpvoteText]}>
                      ▲ {selectedPost.upvotes}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.voteButton, selectedPost.userVote === 'down' && styles.activeDownvote]}
                    onPress={() => handleVote(selectedPost.id, 'down')}
                  >
                    <Text style={[styles.voteText, selectedPost.userVote === 'down' && styles.activeDownvoteText]}>
                      ▼ {selectedPost.downvotes}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.commentsSection}>
                <Text style={styles.commentsTitle}>Comments ({selectedPost.comments.length})</Text>
                
                <View style={styles.addCommentContainer}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Add a comment..."
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity style={styles.addCommentButton} onPress={addComment}>
                    <Text style={styles.addCommentButtonText}>Post</Text>
                  </TouchableOpacity>
                </View>

                {selectedPost.comments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
  },
  newPostButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  newPostText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInput: {
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 16,
    color: '#212529',
  },
  categoryContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    maxHeight: 40,
  },
  categoryTab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    backgroundColor: '#f8f9fa',
    height: 28,
    justifyContent: 'center',
  },
  selectedCategoryTab: {
    backgroundColor: '#007bff',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6c757d',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  postsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  postContainer: {
    backgroundColor: '#fff',
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  pinnedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ffc107',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pinnedText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#212529',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  category: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
  },
  timeAgo: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
    lineHeight: 24,
  },
  postPreview: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    marginBottom: 16,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 4,
  },
  activeUpvote: {
    backgroundColor: '#28a745',
  },
  activeDownvote: {
    backgroundColor: '#dc3545',
  },
  voteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
  },
  activeUpvoteText: {
    color: '#fff',
  },
  activeDownvoteText: {
    color: '#fff',
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
  },
  shareButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  shareText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007bff',
  },
  noPostsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noPostsText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  placeholder: {
    width: 50,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  postDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  postDetailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 12,
    lineHeight: 28,
  },
  postDetailContent: {
    fontSize: 16,
    color: '#212529',
    lineHeight: 24,
    marginBottom: 20,
  },
  postDetailFooter: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 20,
  },
  commentsSection: {
    marginTop: 10,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  addCommentContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  addCommentButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addCommentButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  commentTime: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#212529',
    lineHeight: 20,
  },
});

export default ForumScreen;
