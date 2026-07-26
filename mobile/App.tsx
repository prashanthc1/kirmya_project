import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import Colors from './src/theme/colors';

import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import JobsScreen from './src/screens/JobsScreen';
import NetworkingScreen from './src/screens/NetworkingScreen';
import AICareerScreen from './src/screens/AICareerScreen';
import ProfileScreen from './src/screens/ProfileScreen';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'jobs' | 'network' | 'ai' | 'profile'>('home');

  if (!isAuthenticated) {
    return <AuthScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'jobs':
        return <JobsScreen />;
      case 'network':
        return <NetworkingScreen />;
      case 'ai':
        return <AICareerScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>{renderContent()}</View>

      {/* Cross-Platform Navigation Bottom Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}>
          <Text style={[styles.navIcon, activeTab === 'home' && styles.activeNavIcon]}>🏠</Text>
          <Text style={[styles.navText, activeTab === 'home' && styles.activeNavText]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('jobs')}>
          <Text style={[styles.navIcon, activeTab === 'jobs' && styles.activeNavIcon]}>💼</Text>
          <Text style={[styles.navText, activeTab === 'jobs' && styles.activeNavText]}>Jobs</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('network')}>
          <Text style={[styles.navIcon, activeTab === 'network' && styles.activeNavIcon]}>👥</Text>
          <Text style={[styles.navText, activeTab === 'network' && styles.activeNavText]}>Network</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('ai')}>
          <Text style={[styles.navIcon, activeTab === 'ai' && styles.activeNavIcon]}>🤖</Text>
          <Text style={[styles.navText, activeTab === 'ai' && styles.activeNavText]}>AI Assistant</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('profile')}>
          <Text style={[styles.navIcon, activeTab === 'profile' && styles.activeNavIcon]}>👤</Text>
          <Text style={[styles.navText, activeTab === 'profile' && styles.activeNavText]}>Profile</Text>
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
  body: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingVertical: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.6,
  },
  activeNavIcon: {
    opacity: 1,
  },
  navText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: 'bold',
  },
  activeNavText: {
    color: Colors.primary,
  },
});
