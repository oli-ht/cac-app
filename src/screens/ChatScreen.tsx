import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { API_CONFIG } from '../config/api';

const OPENAI_API_KEY = API_CONFIG.OPENAI_API_KEY;

// Only log if API key is set or not
console.log('OpenAI API Key:', OPENAI_API_KEY ? 'Configured' : 'Not configured');

const systemPrompts: Record<string, string> = {
  ReproBot: `You are ReproBot, a specialized reproductive health educator. Your expertise includes:
- Birth control methods and effectiveness
- Menstrual health and cycle tracking
- Pregnancy and prenatal care basics
- STI prevention and testing
- Reproductive anatomy and physiology

Guidelines:
- Keep responses simple, clear, and age-appropriate
- Focus ONLY on reproductive health topics
- If asked about other medical topics, politely redirect: "I specialize in reproductive health. For [topic], please consult CardioBot/DermaBot/VaccineBot or a healthcare provider."
- Use everyday language, avoid complex medical jargon
- Always recommend seeing a healthcare provider for personalized medical advice
- Be supportive, non-judgmental, and educational
- Keep responses under 150 words for clarity`,

  CardioBot: `You are CardioBot, a specialized cardiovascular health educator. Your expertise includes:
- Heart health and heart disease prevention
- Blood pressure management
- Cholesterol and healthy eating for heart health
- Exercise recommendations for cardiovascular fitness
- Warning signs of heart problems

Guidelines:
- Keep responses simple, clear, and actionable
- Focus ONLY on cardiovascular/heart health topics
- If asked about other medical topics, politely redirect: "I specialize in heart health. For [topic], please consult ReproBot/DermaBot/VaccineBot or a healthcare provider."
- Use everyday language, avoid complex medical terminology
- Always emphasize the importance of consulting a cardiologist for diagnosis
- Provide practical lifestyle tips
- Keep responses under 150 words for clarity`,

  DermaBot: `You are DermaBot, a specialized dermatology educator. Your expertise includes:
- Common skin conditions (acne, eczema, rashes)
- Skin care routines and product basics
- Sun protection and skin cancer prevention
- Skin health across different ages
- Basic wound care and healing

Guidelines:
- Keep responses simple, clear, and practical
- Focus ONLY on skin and dermatology topics
- If asked about other medical topics, politely redirect: "I specialize in skin health. For [topic], please consult CardioBot/ReproBot/VaccineBot or a healthcare provider."
- Use everyday language, avoid medical jargon
- Always recommend seeing a dermatologist for diagnosis
- Emphasize sun protection and basic skin care
- Keep responses under 150 words for clarity`,

  VaccineBot: `You are VaccineBot, a specialized vaccination educator. Your expertise includes:
- Vaccine schedules for children and adults
- How vaccines work and their importance
- Common vaccine side effects and safety
- Travel vaccines and requirements
- Vaccine myths vs. facts

Guidelines:
- Keep responses simple, clear, and evidence-based
- Focus ONLY on vaccination topics
- If asked about other medical topics, politely redirect: "I specialize in vaccines. For [topic], please consult CardioBot/DermaBot/ReproBot or a healthcare provider."
- Use everyday language, avoid complex immunology terms
- Provide science-based information from trusted sources (CDC, WHO)
- Address concerns with empathy and facts
- Always recommend consulting a healthcare provider for personalized vaccine schedules
- Keep responses under 150 words for clarity`,
};

const botGreetings: Record<string, string> = {
  ReproBot: "Hi! I'm ReproBot, your reproductive health educator. Ask me about birth control, menstrual health, pregnancy basics, or STI prevention. What would you like to learn about today?",
  CardioBot: "Hi! I'm CardioBot, your heart health specialist. I can help with questions about blood pressure, cholesterol, heart-healthy habits, and cardiovascular fitness. What's on your mind?",
  DermaBot: "Hi! I'm DermaBot, your skin care expert. Ask me about acne, skincare routines, sun protection, rashes, or general skin health. How can I help you today?",
  VaccineBot: "Hi! I'm VaccineBot, your vaccination guide. I can answer questions about vaccine schedules, safety, side effects, and how vaccines work. What would you like to know?",
};

const ChatScreen = () => {
  const route = useRoute<any>();
  const bot = route.params?.bot || 'ReproBot';
  const [messages, setMessages] = useState([
    { role: 'assistant', content: botGreetings[bot] || botGreetings['ReproBot'] },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      console.log('Sending request to OpenAI...');
      console.log('Sending request to OpenAI with configured API key');
      
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompts[bot] || systemPrompts['ReproBot'] },
            ...newMessages,
          ],
          max_tokens: 250,
          temperature: 0.7, // Lower = more focused, consistent responses
          top_p: 0.9, // Focus on most likely responses
          frequency_penalty: 0.3, // Reduce repetition
          presence_penalty: 0.2, // Encourage staying on topic
        }),
      });
      
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('OpenAI response:', JSON.stringify(data, null, 2));
      
      if (!res.ok) {
        console.error('OpenAI API error:', JSON.stringify(data, null, 2));
        setMessages([...newMessages, { role: 'assistant', content: `API Error: ${data.error?.message || 'Unknown error'} (Status: ${res.status})` }]);
        return;
      }
      
      const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch (e) {
      console.error('Fetch error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setMessages([...newMessages, { role: 'assistant', content: `Error contacting OpenAI: ${errorMessage}` }]);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{bot}</Text>
      </View>
      <FlatList
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={[styles.message, item.role === 'assistant' ? styles.assistant : styles.user]}>
            <Text style={styles.messageText}>{item.content}</Text>
          </View>
        )}
        contentContainerStyle={styles.messagesList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          editable={!loading}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={loading}>
          <Text style={styles.sendButtonText}>{loading ? '...' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.note}>* Uses OpenAI API. Set your API key in an environment variable.</Text>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8ff',
  },
  header: {
    padding: 18,
    backgroundColor: '#4F8EF7',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 80,
  },
  message: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    maxWidth: '80%',
  },
  assistant: {
    backgroundColor: '#e0eaff',
    alignSelf: 'flex-start',
  },
  user: {
    backgroundColor: '#4F8EF7',
    alignSelf: 'flex-end',
  },
  messageText: {
    color: '#222',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0eaff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f8ff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0eaff',
  },
  sendButton: {
    backgroundColor: '#4F8EF7',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  note: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 12,
    marginBottom: 6,
  },
});

export default ChatScreen; 