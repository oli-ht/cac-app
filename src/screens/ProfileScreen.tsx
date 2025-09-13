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
} from 'react-native';

const ForumScreen = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Mock forum data
  const forumPosts = [
    {
      id: 1,
      title: "How to optimize React Native performance?",
      author: "DevMaster",
      avatar: "https://i.pravatar.cc/40?img=1",
      category: "React Native",
      timeAgo: "2h ago",
      upvotes: 24,
      comments: 8,
      preview: "I've been working on a large React Native app and noticed some performance issues...",
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
      comments: 12,
      preview: "With so many state management solutions available, what do you think works best?",
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
      comments: 15,
      preview: "Just upgraded to React Navigation v7 and wanted to share the key changes...",
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
      comments: 23,
      preview: "Here are some essential debugging techniques every React Native developer should know...",
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
      comments: 31,
      preview: "The latest Expo SDK brings some exciting new features and improvements...",
      isPinned: false,
    },
  ];

  const categories = ['All', 'React Native', 'General', 'Navigation', 'Help', 'Expo'];

  const PostItem = ({ post }) => (
    <TouchableOpacity style={styles.postContainer}>
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
        {post.preview}
      </Text>

      <View style={styles.postFooter}>
        <TouchableOpacity style={styles.voteContainer}>
          <Text style={styles.voteCount}>▲ {post.upvotes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.commentContainer}>
          <Text style={styles.commentCount}>💬 {post.comments}</Text>
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
        {forumPosts.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newPostText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
    paddingVertical: 12,
    borderRadius: 25,
    fontSize: 16,
    color: '#212529',
  },
  categoryContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f8f9fa',
  },
  selectedCategoryTab: {
    backgroundColor: '#007bff',
  },
  categoryText: {
    fontSize: 14,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pinnedText: {
    fontSize: 10,
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
  voteCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28a745',
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
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  shareText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007bff',
  },
});

export default ForumScreen;
