import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Colors from '../theme/colors';

export default function AICareerScreen() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'assistant',
      text: 'Welcome! I am your Kirmya AI Career Companion. How can I assist with your job recovery, resume optimization, or interview coaching today?',
    },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    const userMsg = { id: Date.now().toString(), sender: 'user', text: inputText };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    setTimeout(() => {
      const aiReply = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: 'Based on your background in Go microservices, I recommend highlighting metrics like "P99 latency < 50ms" in your experience section.',
      };
      setMessages((prev) => [...prev, aiReply]);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>AI Career Companion</Text>
        <Text style={styles.subtitle}>Resume Score: 94% • Target: Principal Architect</Text>
      </View>

      <ScrollView contentContainerStyle={styles.chatContainer}>
        {messages.map((m) => (
          <View
            key={m.id}
            style={[
              styles.bubble,
              m.sender === 'user' ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                m.sender === 'user' ? styles.userText : styles.aiText,
              ]}
            >
              {m.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask AI Career Companion..."
          placeholderTextColor={Colors.textMuted}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  pageTitle: {
    color: Colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  chatContainer: {
    padding: 20,
    gap: 12,
  },
  bubble: {
    padding: 14,
    borderRadius: 14,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: Colors.backgroundPrimary,
    fontWeight: 'bold',
  },
  aiText: {
    color: Colors.textPrimary,
  },
  inputBar: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    gap: 10,
    backgroundColor: Colors.backgroundSecondary,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 14,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: 8,
  },
  sendBtnText: {
    color: Colors.backgroundPrimary,
    fontWeight: 'bold',
  },
});
