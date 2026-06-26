import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import Svg, {
  Rect, Circle, Ellipse, Line, Path, G, Defs, LinearGradient, Stop,
  Text as SvgText,
} from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { LoginUserAction } from '@/providers/auth/loginProviderAction';
import { loginSchema } from '@/schemas/auth/loginFormSchema';
import { Eye, EyeOff } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const HEADER_H = 220;

// Illustration neutre : paysage agricole générique (sans rôle)
const IlluHeader = () => (
  <Svg width={width} height={HEADER_H} viewBox={`0 0 ${width} ${HEADER_H}`}>
    {/* Ciel dégradé */}
    <Defs>
      <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#0F2D1F" />
        <Stop offset="1" stopColor="#1D6B3B" />
      </LinearGradient>
      <LinearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#3B5E1A" />
        <Stop offset="1" stopColor="#2A4010" />
      </LinearGradient>
    </Defs>
    <Rect width={width} height={HEADER_H} fill="url(#sky)" />

    {/* Sol */}
    <Rect y={148} width={width} height={HEADER_H} fill="url(#ground)" />
    <Rect y={145} width={width} height={8} fill="#4A7A20" />

    {/* Soleil / lune */}
    <Circle cx={width - 60} cy={38} r={26} fill="#FFC849" opacity={0.92} />
    <Circle cx={width - 60} cy={38} r={36} fill="#FFC849" opacity={0.12} />

    {/* Collines fond */}
    <Ellipse cx={width * 0.2} cy={148} rx={120} ry={44} fill="#2A5A15" opacity={0.7} />
    <Ellipse cx={width * 0.75} cy={148} rx={100} ry={38} fill="#2A5A15" opacity={0.6} />

    {/* Tiges de maïs */}
    {[0.06, 0.16, 0.27, 0.38, 0.5, 0.61, 0.72, 0.83, 0.93].map((r, i) => {
      const x = width * r;
      const h = 44 + (i % 3) * 8;
      return (
        <G key={i}>
          <Line x1={x} y1={153} x2={x} y2={153 - h} stroke="#5AB025" strokeWidth={2.5} strokeLinecap="round" />
          <Ellipse
            cx={x - 6}
            cy={153 - h * 0.55}
            rx={14}
            ry={4}
            fill="#6DCB30"
            opacity={0.85}
            transform={`rotate(-28 ${x - 6} ${153 - h * 0.55})`}
          />
          <Ellipse
            cx={x + 6}
            cy={153 - h * 0.35}
            rx={12}
            ry={3.5}
            fill="#6DCB30"
            opacity={0.75}
            transform={`rotate(28 ${x + 6} ${153 - h * 0.35})`}
          />
        </G>
      );
    })}

    {/* Bandeau titre centré */}
    <Rect x={width / 2 - 72} y={186} width={144} height={28} rx={14} fill="rgba(0,0,0,0.28)" />
    <SvgText x={width / 2} y={205} textAnchor="middle" fontSize={13} fontWeight="700" fill="#D4EDB0" letterSpacing={1}>
      AGROLINK
    </SvgText>
  </Svg>
);

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);

  const [form, setForm] = useState({ phone: '', password: '' });
  const [focusedField, setFocusedField] = useState<'phone' | 'password' | null>(null);
  const [errors, setErrors] = useState<Partial<Record<'phone' | 'password', string>>>({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (key: 'phone' | 'password', value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

const handleLogin = async () => {
  const result = loginSchema.safeParse(form);

  if (!result.success) {
    const f = result.error.flatten().fieldErrors;
    setErrors({ phone: f.phone?.[0], password: f.password?.[0] });
    return;
  }

  setErrors({});

  try {
    console.log('=== DEBUT TENTATIVE CONNEXION ===');
    console.log('Données envoyées :', { phone: result.data.phone.trim() });

    const response = await dispatch(
      LoginUserAction({
        phone: result.data.phone.trim(),
        password: result.data.password,
      })
    );

    // 🔍 LOG 1 : Inspecter tout le payload reçu
    console.log('Payload brut reçu de l\'action :', JSON.stringify(response.payload, null, 2));

    if (LoginUserAction.fulfilled.match(response)) {
      // Extraction sécurisée du rôle
      const payloadData = (response.payload as any)?.data;
      const role = payloadData?.user?.role;

      // 🔍 LOG 2 : Inspecter le rôle extrait
      console.log('Rôle extrait après connexion :', role);

      if (!role) {
        Alert.alert('Erreur', 'Aucun rôle trouvé dans la réponse du serveur.');
        return;
      }

      // Utilisation de routes simplifiées adaptées à Expo Router
      switch (role.toLowerCase().trim()) {
        case 'buyer':
          console.log('Navigation vers la route acheteur...');
          router.replace('/(buyer)');
          break;
        case 'transporter':
          console.log('Navigation vers la route transporteur...');
          router.replace('/(transporter)');
          break;
        case 'producer':
          console.log('Navigation vers la route producteur...');
          router.replace('/(producer)');
          break;
        default:
          console.log(`⚠️ Rôle inconnu détecté : "${role}"`);
          Alert.alert('Erreur', `Rôle inconnu ou non géré : "${role}"`);
      }
    } else {
      // 🔍 LOG 3 : En cas d'échec de la requête
      console.log('Echec de la connexion. Response:', response);
      Alert.alert(
        'Erreur de connexion',
        (response.payload as string) || 'Identifiants incorrects.'
      );
    }
  } catch (error) {
    console.error('Erreur inattendue pendant le handleLogin :', error);
  } finally {
    console.log('=== FIN TENTATIVE CONNEXION ===');
  }
};
  const fieldStyle = (key: 'phone' | 'password') => [
    styles.inputRow,
    focusedField === key && styles.inputRowFocused,
    errors[key] && styles.inputRowError,
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0F2D1F" />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <IlluHeader />
          </View>

          {/* Formulaire */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Connexion</Text>
            <Text style={styles.formSubtitle}>Bienvenue, connectez-vous pour continuer.</Text>

            {/* Téléphone */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Numéro de téléphone</Text>
              <View style={fieldStyle('phone')}>
                <TextInput
                  value={form.phone}
                  onChangeText={(v) => handleChange('phone', v)}
                  placeholder="+229 97 00 00 00"
                  placeholderTextColor="#B4B2A9"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  style={styles.input}
                />
              </View>
              {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* Mot de passe */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Mot de passe</Text>
              <View style={[fieldStyle('password'), styles.inputWithIconRow]}>
                <TextInput
                  value={form.password}
                  onChangeText={(v) => handleChange('password', v)}
                  placeholder="••••••••"
                  placeholderTextColor="#B4B2A9"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  style={[styles.input, styles.inputFlex]}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((p) => !p)}
                  activeOpacity={0.7}
                  style={styles.eyeIconBtn}
                >
                  {showPassword ? <EyeOff size={18} color="#8A8A8A" /> : <Eye size={18} color="#8A8A8A" />}
                </TouchableOpacity>
              </View>
              {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Bouton */}
            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={isLoading}
              style={styles.btn}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Se connecter</Text>}
            </TouchableOpacity>

            {/* Lien inscription */}
            <View style={styles.footerLinks}>
              <Text style={styles.footerText}>Pas de compte ? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/registerScreen')}>
                <Text style={styles.footerLink}>S'inscrire</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7F4' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  header: { width, height: HEADER_H, overflow: 'hidden' },
  form: {
    flex: 1,
    backgroundColor: '#F8F7F4',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    padding: 28,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.4,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: -8,
    marginBottom: 4,
  },
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  inputRow: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#E5E3DC',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
  },
  inputRowFocused: {
    borderColor: '#1D9E75',
    borderWidth: 1.5,
  },
  inputRowError: {
    borderColor: '#D9534F',
    borderWidth: 1,
  },
  inputWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    fontSize: 14,
    color: '#1A1A1A',
    width: '100%',
  },
  inputFlex: { flex: 1 },
  eyeIconBtn: {
    paddingLeft: 8,
    paddingVertical: 4,
  },
  btn: {
    backgroundColor: '#1D9E75',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  footerText: { fontSize: 13, color: '#888' },
  footerLink: { fontSize: 13, fontWeight: '700', color: '#1D9E75' },
  errorText: { color: '#D9534F', fontSize: 12, marginTop: 2 },
});