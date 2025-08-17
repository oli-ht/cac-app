import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const chatbots = [
  {
    name: 'ReproBot',
    specialty: 'Reproductive Health',
    color: '#4F8EF7',
    description: 'Ask about reproductive health, birth control, and more.'
  },
  {
    name: 'CardioBot',
    specialty: 'Cardiology',
    color: '#5AD2F4',
    description: 'Get advice on heart health, blood pressure, and more.'
  },
  {
    name: 'DermaBot',
    specialty: 'Dermatology',
    color: '#7B61FF',
    description: 'Skin care, rashes, acne, and more.'
  },
  {
    name: 'VaccineBot',
    specialty: 'Vaccination',
    color: '#00C6AE',
    description: 'Vaccines, schedules, and safety.'
  },
];

const ChatbotsScreen = () => {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Medical Chatbots</Text>
      <Text style={styles.subheader}>Choose a bot to start chatting!</Text>
      <View style={styles.cardsContainer}>
        {chatbots.map((bot) => (
          <TouchableOpacity
            key={bot.name}
            style={[styles.card, { backgroundColor: bot.color }]}
            onPress={() => navigation.navigate('Chat', { bot: bot.name })}
            activeOpacity={0.85}
          >
            <Text style={styles.cardTitle}>{bot.name}</Text>
            <Text style={styles.cardSpecialty}>{bot.specialty}</Text>
            <Text style={styles.cardDesc}>{bot.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8ff',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2A3A60',
    marginBottom: 8,
    marginTop: 10,
  },
  subheader: {
    fontSize: 16,
    color: '#4F8EF7',
    marginBottom: 20,
  },
  cardsContainer: {
    width: '100%',
  },
  card: {
    borderRadius: 18,
    padding: 22,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  cardSpecialty: {
    fontSize: 16,
    color: '#e0eaff',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: '#f5f8ff',
  },
});

export default ChatbotsScreen; 