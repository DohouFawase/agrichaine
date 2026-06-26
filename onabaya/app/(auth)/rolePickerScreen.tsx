import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { UserRole } from '@/types/users/userType';

const roles = [
  {
    role: 'producer' as UserRole,
    label: 'Producteur',
    desc: 'Je cultive et vends mes récoltes',
    emoji: '🌾',
    bg: '#EAF3DE',
    border: '#97C459',
    iconBg: '#C0DD97',
    titleColor: '#27500A',
    descColor: '#3B6D11',
    arrowColor: '#3B6D11',
  },
  {
    role: 'buyer' as UserRole,
    label: 'Acheteur',
    desc: "J'achète des produits agricoles",
    emoji: '🛒',
    bg: '#E6F1FB',
    border: '#85B7EB',
    iconBg: '#B5D4F4',
    titleColor: '#0C447C',
    descColor: '#185FA5',
    arrowColor: '#185FA5',
  },
  {
    role: 'transporter' as UserRole,
    label: 'Chauffeur',
    desc: 'Je transporte les marchandises',
    emoji: '🚚',
    bg: '#FAEEDA',
    border: '#EF9F27',
    iconBg: '#FAC775',
    titleColor: '#412402',
    descColor: '#633806',
    arrowColor: '#854F0B',
  },
];

export default function RolePickerScreen() {
  const router = useRouter();

  const handleSelectRole = (role: UserRole) => {
    // Redirection vers le formulaire d'inscription avec le rôle sélectionné
    router.push({ pathname: '/(auth)/registerScreen', params: { role } });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F7F4" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Qui êtes-vous ?</Text>
          <Text style={styles.subtitle}>Choisissez votre rôle pour continuer</Text>
        </View>
        <View style={styles.cards}>
          {roles.map((item) => (
            <TouchableOpacity
              key={item.role}
              onPress={() => handleSelectRole(item.role)}
              activeOpacity={0.8}
              style={[styles.card, { backgroundColor: item.bg, borderColor: item.border }]}
            >
              <View style={[styles.cardIcon, { backgroundColor: item.iconBg }]}>
                <Text style={styles.cardEmoji}>{item.emoji}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: item.titleColor }]}>{item.label}</Text>
                <Text style={[styles.cardDesc, { color: item.descColor }]}>{item.desc}</Text>
              </View>
              <Text style={[styles.arrow, { color: item.arrowColor }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Déjà un compte ? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/loginScreen')}>
            <Text style={styles.footerLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7F4' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 32 },
  header: { marginBottom: 32 },
  title: { fontSize: 26, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#888', marginTop: 6 },
  cards: { gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, borderWidth: 1.5 },
  cardIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardEmoji: { fontSize: 22 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardDesc: { fontSize: 12, marginTop: 3, lineHeight: 16 },
  arrow: { fontSize: 22, opacity: 0.6 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', paddingBottom: 24 },
  footerText: { fontSize: 13, color: '#888' },
  footerLink: { fontSize: 13, fontWeight: '600', color: '#1D9E75' },
});