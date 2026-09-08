import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MailCheck } from 'lucide-react-native';
import { useAppDispatch } from '@/stores/hooks';
import {
  resendEmailOtpAction,
  verifyEmailOtpAction,
} from '@/providers/auth/emailVerificationProviderAction';

export default function EmailVerificationScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = String(params.email || '');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const verify = async () => {
    if (code.length !== 6) {
      Alert.alert('Code incomplet', 'Saisissez les 6 chiffres reçus par email.');
      return;
    }

    setIsLoading(true);
    const result = await dispatch(verifyEmailOtpAction({ email, code }));
    setIsLoading(false);

    if (verifyEmailOtpAction.fulfilled.match(result)) {
      Alert.alert('Compte vérifié', 'Votre adresse email est confirmée. Vous pouvez vous connecter.', [
        { text: 'Se connecter', onPress: () => router.replace('/(auth)/loginScreen') },
      ]);
    } else {
      Alert.alert('Vérification impossible', result.payload || 'Code invalide.');
    }
  };

  const resend = async () => {
    if (resendCooldown > 0 || !email) return;
    setIsResending(true);
    const result = await dispatch(resendEmailOtpAction(email));
    setIsResending(false);

    if (resendEmailOtpAction.fulfilled.match(result)) {
      setResendCooldown(60);
      Alert.alert('Code envoyé', 'Un nouveau code a été envoyé à votre adresse email.');
    } else {
      Alert.alert('Envoi impossible', result.payload || 'Impossible de renvoyer le code.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.iconCircle}>
          <MailCheck size={38} color="#1D9E75" />
        </View>
        <Text style={styles.title}>Vérifiez votre email</Text>
        <Text style={styles.subtitle}>
          Saisissez le code à 6 chiffres envoyé à
        </Text>
        <Text style={styles.email}>{email}</Text>

        <TextInput
          style={styles.codeInput}
          value={code}
          onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          placeholder="000000"
          placeholderTextColor="#B4B2A9"
          textContentType="oneTimeCode"
        />

        <TouchableOpacity
          style={styles.verifyButton}
          onPress={verify}
          disabled={isLoading || isResending}
        >
          {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Vérifier mon compte</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendButton} onPress={resend} disabled={isResending || resendCooldown > 0}>
          {isResending ? (
            <ActivityIndicator color="#1D9E75" />
          ) : (
            <Text style={[styles.resendText, resendCooldown > 0 && styles.disabledText]}>
              {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : 'Renvoyer le code'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(auth)/loginScreen')}>
          <Text style={styles.loginLink}>Retour à la connexion</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7F4' },
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 80 },
  iconCircle: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#E4F4EC', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },
  subtitle: { marginTop: 12, fontSize: 15, color: '#777', textAlign: 'center' },
  email: { marginTop: 4, fontSize: 15, fontWeight: '700', color: '#1D9E75', textAlign: 'center' },
  codeInput: { width: '100%', marginTop: 32, height: 62, borderRadius: 14, borderWidth: 1, borderColor: '#D8D6CF', backgroundColor: '#FFFFFF', textAlign: 'center', letterSpacing: 10, fontSize: 28, fontWeight: '700', color: '#1A1A1A' },
  verifyButton: { width: '100%', marginTop: 18, height: 54, borderRadius: 14, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  resendButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  resendText: { color: '#1D9E75', fontSize: 14, fontWeight: '700' },
  disabledText: { color: '#AAA' },
  loginLink: { marginTop: 28, color: '#555', fontSize: 14, fontWeight: '600' },
});
