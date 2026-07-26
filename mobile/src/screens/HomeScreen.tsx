import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Colors from '../theme/colors';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>Alex Rivera</Text>
          </View>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>✓ Verified Candidate</Text>
          </View>
        </View>

        {/* AI Recommendation Widget */}
        <View style={styles.aiCard}>
          <Text style={styles.aiCardTag}>🤖 AI CAREER MATCH</Text>
          <Text style={styles.aiCardTitle}>Senior Go Backend Architect</Text>
          <Text style={styles.aiCardSubtitle}>Stripe Global • $180k - $220k • 96% Match</Text>
          <Text style={styles.aiCardDesc}>
            Your 5+ years of Go microservice architecture and PostgreSQL GIN index optimization fit 96% of Stripe's requirements.
          </Text>

          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>1-Click Apply Now</Text>
          </TouchableOpacity>
        </View>

        {/* Active Application Progress */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Application Progress</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.companyName}>Stripe Global</Text>
          <Text style={styles.jobTitle}>Senior Go Backend Architect</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Current Status:</Text>
            <Text style={styles.statusValue}>Technical Interview Scheduled</Text>
          </View>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  userName: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  badgeContainer: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.success,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: 'bold',
  },
  aiCard: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  aiCardTag: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  aiCardTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  aiCardSubtitle: {
    color: Colors.success,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
    marginBottom: 10,
  },
  aiCardDesc: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    color: Colors.backgroundPrimary,
    fontWeight: 'bold',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    padding: 16,
  },
  companyName: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  jobTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center',
  },
  statusLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  statusValue: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});
