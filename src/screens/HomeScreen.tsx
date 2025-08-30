import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LearningGoalCard from '../components/HomeScreen/LearningGoalCard';
import HorizontalSlider from '../components/common/HorizontalSlider';
import QuickActionCard from '../components/common/QuickActionCard';
import { SimpleBarChart } from '../components/HomeScreen/SimpleBarChart';
import { db, auth } from "../config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

// Quick actions data
const quickActionsData = [
  {
    id: '1',
    title: 'Start Quiz',
    subtitle: 'Test your knowledge',
    color: '#FF6B6B',
  },
  {
    id: '2',
    title: 'Watch Video',
    subtitle: 'Learn visually',
    color: '#4ECDC4',
  },
  {
    id: '3',
    title: 'Read Article',
    subtitle: 'Deep dive',
    color: '#45B7D1',
  },
  {
    id: '4',
    title: 'Practice',
    subtitle: 'Hands-on learning',
    color: '#96CEB4',
  },
];

const HomeScreen = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleQuickActionPress = (actionId: string) => {
    console.log('Quick action pressed:', actionId);
    // Add your navigation or action logic here
  };

  const renderQuickActionCard = (action: any) => (
    <QuickActionCard
      action={action}
      onPress={() => handleQuickActionPress(action.id)}
    />
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {loading ? (
          <ActivityIndicator color="#fff" size="large" />
        ) : (
          <>
            <Text style={styles.headerTitle}>Hi {userData?.name || 'there'}!</Text>
            <Text style={styles.headerSubtitle}>What will you learn today?</Text>
          </>
        )}
      </View>
      <View style={styles.content}>
        <LearningGoalCard currentMinutes={46} totalMinutes={60} />
        
        {/* Quick Actions Slider */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <HorizontalSlider
            data={quickActionsData}
            renderItem={renderQuickActionCard}
            containerStyle={styles.quickActionsContainer}
            itemSpacing={12}
          />
        </View>

        {/* Weekly Stats Chart */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Weekly Progress</Text>
          <SimpleBarChart />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Stats</Text>
          <Text style={styles.cardText}>Your activity summary will appear here.</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: 180,
    backgroundColor: '#2EB5FA',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'serif',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  content: {
    padding: 20,
    marginTop: -30, // Pulls the content up to overlap the header slightly
  },
  quickActionsSection: {
    marginBottom: 20,
  },
  statsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  quickActionsContainer: {
    marginTop: 0,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  cardText: {
    fontSize: 16,
    color: '#666',
  },
});

export default HomeScreen; 