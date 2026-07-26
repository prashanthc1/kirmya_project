import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Colors from '../theme/colors';

export default function NetworkingScreen() {
  const [activeTab, setActiveTab] = useState<'messages' | 'connections' | 'communities'>('messages');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Professional Network</Text>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'messages' && styles.activeTab]}
            onPress={() => setActiveTab('messages')}
          >
            <Text style={[styles.tabText, activeTab === 'messages' && styles.activeTabText]}>Messages</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'connections' && styles.activeTab]}
            onPress={() => setActiveTab('connections')}
          >
            <Text style={[styles.tabText, activeTab === 'connections' && styles.activeTabText]}>Connections</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'communities' && styles.activeTab]}
            onPress={() => setActiveTab('communities')}
          >
            <Text style={[styles.tabText, activeTab === 'communities' && styles.activeTabText]}>Communities</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'messages' && (
          <View style={styles.card}>
            <View style={styles.msgHeader}>
              <Text style={styles.senderName}>Stripe Technical Recruiter</Text>
              <Text style={styles.msgTime}>30m ago</Text>
            </View>
            <Text style={styles.msgPreview}>
              Hi Alex, looking forward to our technical interview session tomorrow at 2 PM PST!
            </Text>
          </View>
        )}

        {activeTab === 'connections' && (
          <View style={styles.card}>
            <Text style={styles.senderName}>Sarah Chen</Text>
            <Text style={styles.roleText}>Staff Distributed Systems Engineer @ Stripe</Text>
            <Text style={styles.mutualText}>12 Mutual Connections • Verified Employee Referrer</Text>
          </View>
        )}

        {activeTab === 'communities' && (
          <View style={styles.card}>
            <Text style={styles.senderName}>Go & Distributed Systems Guild</Text>
            <Text style={styles.roleText}>4,250 Active Members • Weekly Deep Dives</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  content: {
    padding: 20,
  },
  pageTitle: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: Colors.secondary,
  },
  tabText: {
    color: Colors.textSecondary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  activeTabText: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    padding: 16,
  },
  msgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  senderName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  msgTime: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  msgPreview: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  roleText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 13,
    marginTop: 2,
  },
  mutualText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
});
