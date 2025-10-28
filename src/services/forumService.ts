import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, query, where, orderBy, limit, startAfter, increment } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  userId: string;
  userName: string;
  avatar: string;
  category: string;
  createdAt: number;
  updatedAt: number;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  isPinned?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  userId: string;
  userName: string;
  avatar: string;
  createdAt: number;
}

export const forumService = {
  // Create a new post
  async createPost(post: Omit<ForumPost, 'id' | 'createdAt' | 'updatedAt' | 'upvotes' | 'downvotes' | 'commentCount'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'forum_posts'), {
      ...post,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
    });
    return docRef.id;
  },

  // Get all posts with optional category filter
  async getPosts(category?: string): Promise<ForumPost[]> {
    let q = query(
      collection(db, 'forum_posts'),
      orderBy('isPinned', 'desc'),
      orderBy('createdAt', 'desc')
    );

    if (category && category !== 'All') {
      q = query(q, where('category', '==', category));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumPost));
  },

  // Get a single post by ID
  async getPost(id: string): Promise<ForumPost | null> {
    const docRef = doc(db, 'forum_posts', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as ForumPost : null;
  },

  // Update post
  async updatePost(id: string, updates: Partial<ForumPost>): Promise<void> {
    const docRef = doc(db, 'forum_posts', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  // Delete post
  async deletePost(id: string): Promise<void> {
    await deleteDoc(doc(db, 'forum_posts', id));
  },

  // Vote on a post
  async vote(postId: string, userId: string, isUpvote: boolean): Promise<void> {
    const postRef = doc(db, 'forum_posts', postId);
    const voteRef = doc(db, 'forum_votes', `${postId}_${userId}`);
    
    const voteDoc = await getDoc(voteRef);
    const currentVote = voteDoc.exists() ? voteDoc.data().isUpvote : null;

    if (currentVote === isUpvote) {
      // Remove vote
      await deleteDoc(voteRef);
      await updateDoc(postRef, {
        [isUpvote ? 'upvotes' : 'downvotes']: increment(-1),
      });
    } else {
      // Add or change vote
      await setDoc(voteRef, {
        postId,
        userId,
        isUpvote,
        createdAt: Date.now(),
      });

      const updates: any = {};
      if (currentVote !== null) {
        // Change vote
        updates[currentVote ? 'upvotes' : 'downvotes'] = increment(-1);
      }
      updates[isUpvote ? 'upvotes' : 'downvotes'] = increment(1);
      
      await updateDoc(postRef, updates);
    }
  },

  // Add comment
  async addComment(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<string> {
    const batch = db.batch();
    
    // Create comment
    const commentRef = doc(collection(db, 'forum_comments'));
    batch.set(commentRef, {
      ...comment,
      createdAt: Date.now(),
    });

    // Update post comment count
    const postRef = doc(db, 'forum_posts', comment.postId);
    batch.update(postRef, {
      commentCount: increment(1),
      updatedAt: Date.now(),
    });

    await batch.commit();
    return commentRef.id;
  },

  // Get comments for a post
  async getComments(postId: string): Promise<Comment[]> {
    const q = query(
      collection(db, 'forum_comments'),
      where('postId', '==', postId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
  },

  // Delete comment
  async deleteComment(comment: Comment): Promise<void> {
    const batch = db.batch();
    
    // Delete comment
    const commentRef = doc(db, 'forum_comments', comment.id);
    batch.delete(commentRef);

    // Update post comment count
    const postRef = doc(db, 'forum_posts', comment.postId);
    batch.update(postRef, {
      commentCount: increment(-1),
      updatedAt: Date.now(),
    });

    await batch.commit();
  },
};
