import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { API_CONFIG } from '../config/api';

const OPENAI_API_KEY = API_CONFIG.OPENAI_API_KEY;

// Only log if API key is set or not
console.log('OpenAI API Key:', OPENAI_API_KEY ? 'Configured' : 'Not configured');

const systemPrompts: Record<string, string> = {
  ReproBot: 'You are a helpful assistant specializing in reproductive health.',
  CardioBot: 'You are a helpful assistant specializing in cardiology.',
  DermaBot: 'You are a helpful assistant specializing in dermatology.',
  VaccineBot: 'You are a helpful assistant specializing in vaccines.',
};

const ChatScreen = () => {
  const route = useRoute<any>();
  const bot = route.params?.bot || 'ReproBot';
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hi! I'm ${bot}. How can I help you today?` },
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
          max_tokens: 200,
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