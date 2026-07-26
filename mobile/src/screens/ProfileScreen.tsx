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

export default function ProfileScreen() {
  const [fullName, setFullName] = useState('Alex Rivera');
  const [headline, setHeadline] = useState('Senior Go Backend Architect');
  const [bio, setBio] = useState('5+ years building high-scale microservices and PostgreSQL architectures.');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleUploadResume = () => {
    setUploadStatus('Uploading resume via presigned CDN URL...');
    setTimeout(() => {
      setUploadStatus('✓ Resume uploaded successfully (alex_rivera_resume.pdf)');
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>User Profile & Verification</Text>

        <View style={styles.badgeCard}>
          <Text style={styles.badgeTitle}>✓ VERIFIED PROFESSIONAL</Text>
          <Text style={styles.badgeDesc}>
            Employment & Skill Verification active across Stripe & Google networks.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>Professional Headline</Text>
          <TextInput
            style={styles.input}
            value={headline}
            onChangeText={setHeadline}
          />

          <Text style={styles.label}>Summary / Bio</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Save Profile Updates</Text>
          </TouchableOpacity>
        </View>

        {/* Document Upload Section */}
        <View style={[styles.card, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>Document Management</Text>
          <Text style={styles.docDesc}>
            Upload PDF resume or certifications for AI analysis & recruiter verification.
          </Text>

          {uploadStatus && (
            <Text style={styles.uploadStatusText}>{uploadStatus}</Text>
          )}

          <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadResume}>
            <Text style={styles.uploadBtnText}>📄 Upload New Resume (PDF)</Text>
          </TouchableOpacity>
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
  badgeCard: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  badgeTitle: {
    color: Colors.success,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  badgeDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 14,
    padding: 20,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 8,
    padding: 12,
    color: Colors.textPrimary,
    fontSize: 15,
    marginBottom: 16,
  },
  multiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: Colors.backgroundPrimary,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  docDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 16,
  },
  uploadStatusText: {
    color: Colors.success,
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 12,
  },
  uploadBtn: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadBtnText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
