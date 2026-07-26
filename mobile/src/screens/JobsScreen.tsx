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

export default function JobsScreen() {
  const [search, setSearch] = useState('Go Backend');
  const [savedJobs, setSavedJobs] = useState<Record<string, boolean>>({});

  const jobs = [
    {
      id: 'j1',
      title: 'Senior Go Backend Architect',
      company: 'Stripe Global',
      location: 'Remote / SF',
      salary: '$180k - $220k',
      matchScore: 96,
    },
    {
      id: 'j2',
      title: 'Lead Distributed Systems Engineer',
      company: 'TechCorp Cloud',
      location: 'Remote',
      salary: '$190k - $240k',
      matchScore: 88,
    },
  ];

  const toggleSave = (id: string) => {
    setSavedJobs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Job Discovery & Matching</Text>

        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search jobs, skills, companies..."
          placeholderTextColor={Colors.textMuted}
        />

        <View style={styles.jobsList}>
          {jobs.map((item) => (
            <View key={item.id} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <Text style={styles.matchBadge}>{item.matchScore}% MATCH</Text>
                <TouchableOpacity onPress={() => toggleSave(item.id)}>
                  <Text style={styles.bookmarkText}>
                    {savedJobs[item.id] ? '🔖 Saved' : '📑 Save'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.jobTitle}>{item.title}</Text>
              <Text style={styles.company}>{item.company}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{item.location}</Text>
                <Text style={styles.metaDivider}>•</Text>
                <Text style={styles.salaryText}>{item.salary}</Text>
              </View>

              <TouchableOpacity style={styles.applyBtn}>
                <Text style={styles.applyBtnText}>Apply Now</Text>
              </TouchableOpacity>
            </View>
          ))}
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
  pageTitle: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 10,
    padding: 14,
    color: Colors.textPrimary,
    fontSize: 16,
    marginBottom: 20,
  },
  jobsList: {
    gap: 16,
  },
  jobCard: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 14,
    padding: 18,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchBadge: {
    backgroundColor: Colors.success,
    color: Colors.backgroundPrimary,
    fontWeight: 'bold',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bookmarkText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  jobTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  company: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  metaDivider: {
    color: Colors.textMuted,
    marginHorizontal: 6,
  },
  salaryText: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyBtnText: {
    color: Colors.backgroundPrimary,
    fontWeight: 'bold',
  },
});
