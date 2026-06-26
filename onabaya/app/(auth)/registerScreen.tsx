import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, {
  Rect, Circle, Ellipse, Line, Path, G,
  Text as SvgText,
} from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import PhoneInput from 'react-native-phone-number-input';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { UserRole } from '@/types/users/userType';
import { CreateUserAction } from '@/providers/auth/registerProviderAction';
import { registerSchema } from '@/schemas/auth/registerFormSchema';

const { width } = Dimensions.get('window');
const HEADER_H = 220;

// --- Illustrations SVG identiques à LoginScreen (mêmes couleurs / mêmes scènes par rôle) ---

const IlluProducteur = () => (
  <Svg width={width} height={HEADER_H} viewBox={`0 0 ${width} ${HEADER_H}`}>
    <Rect width={width} height={HEADER_H} fill="#1D4A1A" />
    <Rect width={width} height={120} fill="#2A6B2A" />
    <Rect width={width} height={82} fill="#3B8C3B" />
    <Rect width={width} height={54} fill="#4BAF4B" />
    <Rect width={width} height={32} fill="#5FC75F" />
    <Circle cx={width - 55} cy={30} r={20} fill="#FFC849" opacity={0.95} />
    <Circle cx={width - 55} cy={30} r={28} fill="#FFC849" opacity={0.18} />
    <Ellipse cx={55} cy={118} rx={80} ry={34} fill="#27500A" opacity={0.5} />
    <Ellipse cx={width - 45} cy={122} rx={70} ry={30} fill="#27500A" opacity={0.45} />
    <Rect y={168} width={width} height={HEADER_H} fill="#5C3A1A" />
    <Rect y={164} width={width} height={10} fill="#7A4E22" />
    {[0.1, 0.25, 0.4, 0.55, 0.7, 0.85].map((r, i) => {
      const x = width * r;
      const top = 86 + (i % 3) * 6;
      return (
        <G key={i}>
          <Line x1={x} y1={169} x2={x - 3} y2={top} stroke="#3B8C3B" strokeWidth={3} strokeLinecap="round" />
          <Ellipse cx={x - 3} cy={top + 24} rx={16} ry={4.5} fill="#4BAF4B" transform={`rotate(${i % 2 === 0 ? -24 : 24} ${x - 3} ${top + 24})`} />
        </G>
      );
    })}
    <Rect x={width / 2 - 60} y={182} width={120} height={30} rx={15} fill="rgba(29,158,117,0.22)" stroke="#1D9E75" strokeWidth={1} />
    <SvgText x={width / 2} y={202} textAnchor="middle" fontSize={12} fontWeight="700" fill="#C0DD97">
      Espace Producteur
    </SvgText>
  </Svg>
);

const IlluAcheteur = () => (
  <Svg width={width} height={HEADER_H} viewBox={`0 0 ${width} ${HEADER_H}`}>
    <Rect width={width} height={HEADER_H} fill="#042C53" />
    <Rect width={width} height={108} fill="#0C3A6B" />
    <Rect width={width} height={62} fill="#185FA5" />
    <Rect width={width} height={32} fill="#378ADD" />
    <Circle cx={44} cy={60} r={20} fill="#FFC849" opacity={0.9} />
    <SvgText x={44} y={65} textAnchor="middle" fontSize={10} fontWeight="700" fill="#7A4800">FCFA</SvgText>
    <Circle cx={width - 40} cy={74} r={15} fill="#FFC849" opacity={0.84} />
    <SvgText x={width - 40} y={78} textAnchor="middle" fontSize={8} fontWeight="700" fill="#7A4800">FCFA</SvgText>
    <Rect x={width / 2 - 46} y={96} width={92} height={68} rx={10} fill="#1a2e4a" stroke="#378ADD" strokeWidth={1.5} />
    <Circle cx={width / 2} cy={130} r={19} fill="#112240" stroke="#378ADD" strokeWidth={1.5} />
    <Circle cx={width / 2} cy={130} r={12} fill="#0a1929" stroke="#185FA5" strokeWidth={1} />
    <Line x1={width / 2} y1={130} x2={width / 2 + 7} y2={123} stroke="#FFC849" strokeWidth={2} strokeLinecap="round" />
    <Circle cx={width / 2} cy={130} r={2} fill="#FFC849" />
    <Rect x={width / 2 - 80} y={164} width={160} height={22} rx={11} fill="rgba(29,158,117,0.2)" stroke="#1D9E75" strokeWidth={1} />
    <SvgText x={width / 2} y={180} textAnchor="middle" fontSize={12} fontWeight="700" fill="#B5D4F4">
      Espace Acheteur
    </SvgText>
  </Svg>
);

const IlluChauffeur = () => (
  <Svg width={width} height={HEADER_H} viewBox={`0 0 ${width} ${HEADER_H}`}>
    <Rect width={width} height={HEADER_H} fill="#412402" />
    <Rect width={width} height={118} fill="#633806" />
    <Rect width={width} height={72} fill="#854F0B" />
    <Rect width={width} height={42} fill="#BA7517" />
    <Rect width={width} height={20} fill="#EF9F27" />
    <Ellipse cx={width / 2} cy={2} rx={38} ry={18} fill="#FFC849" opacity={0.92} />
    <Path d={`M0 ${HEADER_H} L${width * 0.35} 132 L${width * 0.65} 132 L${width} ${HEADER_H}Z`} fill="#444" />
    <Rect y={HEADER_H - 10} width={width} height={10} fill="#5C3A1A" />
    <G transform={`translate(${width / 2 - 45}, 96)`}>
      <Rect x={0} y={9} width={70} height={28} rx={3} fill="#BA7517" />
      <Rect x={2} y={11} width={66} height={24} rx={2} fill="#EF9F27" />
      <Rect x={52} y={2} width={25} height={34} rx={4} fill="#854F0B" />
      <Rect x={54} y={5} width={20} height={14} rx={3} fill="#0C3A6B" opacity={0.85} />
      <Circle cx={14} cy={38} r={7} fill="#1a1a1a" />
      <Circle cx={58} cy={38} r={7} fill="#1a1a1a" />
    </G>
    <Rect x={width / 2 - 65} y={182} width={130} height={28} rx={14} fill="rgba(186,117,23,0.22)" stroke="#BA7517" strokeWidth={1} />
    <SvgText x={width / 2} y={200} textAnchor="middle" fontSize={12} fontWeight="700" fill="#FAC775">
      Espace Chauffeur
    </SvgText>
  </Svg>
);

const ROLE_CONFIG: Record<UserRole, {
  label: string;
  headerBg: string;
  btnBg: string;
  linkColor: string;
  Illustration: React.FC;
}> = {
  producer: {
    label: 'Producteur',
    headerBg: '#1D4A1A',
    btnBg: '#1D9E75',
    linkColor: '#1D9E75',
    Illustration: IlluProducteur,
  },
  buyer: {
    label: 'Acheteur',
    headerBg: '#042C53',
    btnBg: '#185FA5',
    linkColor: '#185FA5',
    Illustration: IlluAcheteur,
  },
  transporter: {
    label: 'Chauffeur',
    headerBg: '#412402',
    btnBg: '#BA7517',
    linkColor: '#BA7517',
    Illustration: IlluChauffeur,
  },
};

type FormState = {
  name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function RegisterScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  const params = useLocalSearchParams<{ role?: UserRole }>();
  const role: UserRole = (params.role as UserRole) || 'producer';
  const config = ROLE_CONFIG[role];
  const { Illustration } = config;

  const phoneInputRef = useRef<PhoneInput>(null);

  const [form, setForm] = useState<FormState>({
    name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [focusedField, setFocusedField] = useState<keyof FormState | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = <K extends keyof FormState>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = () => {
    console.log('[REGISTER] Données envoyées à zod:', { ...form, role });

    const result = registerSchema.safeParse({
      ...form,
      role,
    });

    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors;
      console.log('[REGISTER] ❌ Validation zod échouée:', flattened);
      setErrors({
        name: flattened.name?.[0],
        last_name: flattened.last_name?.[0],
        email: flattened.email?.[0],
        phone: flattened.phone?.[0],
        password: flattened.password?.[0],
        confirmPassword: flattened.confirmPassword?.[0],
      });
      return null;
    }

    console.log('[REGISTER] ✅ Validation zod réussie:', result.data);
    setErrors({});
    return result.data;
  };

  const handleSubmit = async () => {
    console.log('[REGISTER] === Soumission du formulaire ===');
    console.log('[REGISTER] form state:', form);
    console.log('[REGISTER] role:', role);

    const checkValid = phoneInputRef.current?.isValidNumber(form.phone);
    console.log('[REGISTER] Numéro de téléphone valide ?', checkValid, '| valeur:', form.phone);

    if (!checkValid) {
      console.log('[REGISTER] ❌ Arrêt: numéro de téléphone invalide');
      setErrors((prev) => ({ ...prev, phone: 'Numéro de téléphone invalide' }));
      return;
    }

    const data = validate();
    if (!data) {
      console.log('[REGISTER] ❌ Arrêt: validation zod a échoué, voir logs au-dessus');
      return;
    }

    console.log('[REGISTER] 📤 Envoi vers CreateUserAction:', {
      name: data.name.trim(),
      last_name: data.last_name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      role: data.role,
    });

    try {
      const resultAction = await dispatch(
        CreateUserAction({
          name: data.name.trim(),
          last_name: data.last_name.trim(),
          email: data.email.trim(),
          phone: data.phone.trim(),
          password: data.password,
          role: data.role,
        } as any)
      );

      console.log('[REGISTER] 📥 Réponse complète de CreateUserAction:', resultAction);

      if (CreateUserAction.fulfilled.match(resultAction)) {
        console.log('[REGISTER] ✅ Inscription réussie -> redirection vers Login (role:', role, ')');
        // Après inscription, on renvoie vers l'écran de connexion avec le même rôle pré-sélectionné
        router.replace({ pathname: '/(auth)/loginScreen' });
      } else {
        console.log('[REGISTER] ❌ Inscription rejetée, payload (erreur backend):', resultAction.payload);
        Alert.alert(
          "Erreur d'inscription",
          (resultAction.payload as string) || 'Une erreur est survenue.'
        );
      }
    } catch (err) {
      console.log('[REGISTER] 💥 Exception non gérée pendant le dispatch:', err);
      Alert.alert("Erreur d'inscription", 'Une erreur inattendue est survenue (voir console).');
    }
  };

  const getFieldStyle = (key: keyof FormState) => [
    styles.inputRow,
    focusedField === key && { borderColor: config.headerBg, borderWidth: 1.5 },
    errors[key] && styles.inputRowError,
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={config.headerBg} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.header, { backgroundColor: config.headerBg }]}>
            <Illustration />
          </View>

          <View style={styles.form}>
            <Text style={styles.formTitle}>
              Nouveau {config.label}
            </Text>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.fieldLabel}>Prénom</Text>
                <View style={getFieldStyle('name')}>
                  <TextInput
                    value={form.name}
                    onChangeText={(v) => handleChange('name', v)}
                    placeholder="FAWASE"
                    placeholderTextColor="#B4B2A9"
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    style={styles.input}
                  />
                </View>
                {!!errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.flex1}>
                <Text style={styles.fieldLabel}>Nom</Text>
                <View style={getFieldStyle('last_name')}>
                  <TextInput
                    value={form.last_name}
                    onChangeText={(v) => handleChange('last_name', v)}
                    placeholder="DOHOU"
                    placeholderTextColor="#B4B2A9"
                    onFocus={() => setFocusedField('last_name')}
                    onBlur={() => setFocusedField(null)}
                    style={styles.input}
                  />
                </View>
                {!!errors.last_name && <Text style={styles.errorText}>{errors.last_name}</Text>}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={getFieldStyle('email')}>
                <TextInput
                  value={form.email}
                  onChangeText={(v) => handleChange('email', v)}
                  placeholder="dohfawaz90@gmail.com"
                  placeholderTextColor="#B4B2A9"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  style={styles.input}
                />
              </View>
              {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* --- Champ téléphone avec drapeau --- */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Téléphone</Text>
              <View
                style={[
                  styles.phoneWrapper,
                  focusedField === 'phone' && { borderColor: config.headerBg, borderWidth: 1.5 },
                  errors.phone && styles.inputRowError,
                ]}
              >
                <PhoneInput
                  ref={phoneInputRef}
                  defaultValue={form.phone}
                  defaultCode="BJ"
                  layout="first"
                  onChangeFormattedText={(text) => handleChange('phone', text)}
                  containerStyle={styles.phoneContainer}
                  textContainerStyle={styles.phoneTextContainer}
                  textInputStyle={styles.phoneTextInput}
                  codeTextStyle={styles.phoneCodeText}
                  flagButtonStyle={styles.phoneFlagButton}
                  withDarkTheme={false}
                  withShadow={false}
                  autoFocus={false}
                  countryPickerProps={{
                    withFlag: true,
                    withCallingCode: true,
                    withAlphaFilter: true,
                  }}
                />
              </View>
              {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Mot de passe</Text>
              <View style={[getFieldStyle('password'), styles.inputWithIconRow]}>
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
                  onPress={() => setShowPassword((prev) => !prev)}
                  activeOpacity={0.7}
                  style={styles.eyeIconBtn}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#8A8A8A" />
                  ) : (
                    <Eye size={18} color="#8A8A8A" />
                  )}
                </TouchableOpacity>
              </View>
              {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Confirmer le mot de passe</Text>
              <View style={[getFieldStyle('confirmPassword'), styles.inputWithIconRow]}>
                <TextInput
                  value={form.confirmPassword}
                  onChangeText={(v) => handleChange('confirmPassword', v)}
                  placeholder="••••••••"
                  placeholderTextColor="#B4B2A9"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  style={[styles.input, styles.inputFlex]}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  activeOpacity={0.7}
                  style={styles.eyeIconBtn}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} color="#8A8A8A" />
                  ) : (
                    <Eye size={18} color="#8A8A8A" />
                  )}
                </TouchableOpacity>
              </View>
              {!!errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.85}
              style={[styles.btn, { backgroundColor: config.btnBg }]}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Créer mon compte</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerLinks}>
              <Text style={styles.footerText}>Déjà un compte ? </Text>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/(auth)/loginScreen', params: { role } })}
              >
                <Text style={[styles.footerLink, { color: config.linkColor }]}>Se connecter</Text>
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
  header: { width, height: HEADER_H, overflow: 'hidden', position: 'relative' },
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
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  flex1: { flex: 1 },
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
  inputRowError: {
    borderColor: '#D9534F',
  },
  inputWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  // --- Téléphone avec drapeau ---
  phoneWrapper: {
    borderWidth: 0.5,
    borderColor: '#E5E3DC',
    borderRadius: 12,
    overflow: 'hidden',
    height: 48,
  },
  phoneContainer: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  phoneTextContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 0,
  },
  phoneTextInput: {
    fontSize: 14,
    color: '#1A1A1A',
    height: 48,
  },
  phoneCodeText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  phoneFlagButton: {
    paddingHorizontal: 4,
  },
  btn: {
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
  footerLink: { fontSize: 13, fontWeight: '700' },
  errorText: { color: '#D9534F', fontSize: 12, marginTop: 2 },
});