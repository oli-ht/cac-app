import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Animated,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../theme/typography';

const chatbots = [
  {
    id: '1',
    name: 'ReproBot',
    specialty: 'Reproductive Health',
    gradientColors: ['#4F8EF7', '#2E5EFF'],
    icon: 'female',
    description: 'Ask about reproductive health, birth control, and more.'
  },
  {
    id: '2',
    name: 'CardioBot',
    specialty: 'Cardiology',
    gradientColors: ['#5AD2F4', '#2E9FFF'],
    icon: 'heart',
    description: 'Get advice on heart health, blood pressure, and more.'
  },
  {
    id: '3',
    name: 'DermaBot',
    specialty: 'Dermatology',
    gradientColors: ['#7B61FF', '#5B3FFF'],
    icon: 'bandage',
    description: 'Skin care, rashes, acne, and more.'
  },
  {
    id: '4',
    name: 'VaccineBot',
    specialty: 'Vaccination',
    gradientColors: ['#00C6AE', '#00A896'],
    icon: 'medical',
    description: 'Vaccines, schedules, and safety.'
  },
];

const { width } = Dimensions.get('window');

const ChatbotsScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(width)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const filteredBots = chatbots.filter(bot => 
    bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medical Chatbots</Text>
        <Text style={styles.headerSubtitle}>Your AI Health Assistants</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search chatbots..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.cardsContainer}>
        {filteredBots.map((bot) => (
          <Animated.View
            key={bot.id}
            style={[
              styles.cardWrapper,
              {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('Chat', { bot: bot.name })}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={bot.gradientColors}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={bot.icon} size={24} color="#fff" />
                  </View>
                  <View style={styles.statusContainer}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Online</Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>{bot.name}</Text>
                <Text style={styles.cardSpecialty}>{bot.specialty}</Text>
                <Text style={styles.cardDesc}>{bot.description}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.xxxl,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: '#1a1a1a',
  },
  cardsContainer: {
    width: '100%',
  },
  cardWrapper: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  statusText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: '#fff',
  },
  cardTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.xl,
    color: '#fff',
    marginBottom: 4,
  },
  cardSpecialty: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  cardDesc: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 0,
    lineHeight: 22,
  },
});

export default ChatbotsScreen; 