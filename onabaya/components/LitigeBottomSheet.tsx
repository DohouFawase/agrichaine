import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, PanResponder, Dimensions, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ShieldAlert, X, Quote, PhotoPlus, Send, CircleCheck } from 'lucide-react-native';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.78;

const C = {
  red:        '#E24B4A',
  redBg:      '#FCEBEB',
  redBorder:  '#F09595',
  redText:    '#A32D2D',
  green:      '#1D9E75',
  greenBg:    '#E1F5EE',
  greenBorder:'#5DCAA5',
  greenText:  '#085041',
  surface:    '#FFFFFF',
  surface1:   '#F9F8F6',
  border:     '#D3D1C7',
  borderStrong:'#B4B2A9',
  text:       '#2C2C2A',
  textMuted:  '#888780',
  textSec:    '#5F5E5A',
};

interface Props {
  visible:       boolean;
  disputeReason: string;
  onClose:       () => void;
  onSubmit:      (response: string, photo: string | null) => void;
  loading?:      boolean;
}

export function LitigeBottomSheet({
  visible, disputeReason, onClose, onSubmit, loading = false,
}: Props) {
  const translateY = useRef(new Animated.Value(SHEET_H)).current;
  const [response, setResponse]     = useState('');
  const [photo, setPhoto]           = useState<string | null>(null);
  const [charCount, setCharCount]   = useState(0);

  React.useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : SHEET_H,
      useNativeDriver: true,
      bounciness: 5,
    }).start();
    if (!visible) { setResponse(''); setPhoto(null); setCharCount(0); }
  }, [visible]);

  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dy > 8,
    onPanResponderMove:  (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
    onPanResponderRelease: (_, g) => {
      if (g.dy > 80) onClose();
      else Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 5 }).start();
    },
  })).current;

  const onChangeText = (t: string) => {
    if (t.length > 500) return;
    setResponse(t);
    setCharCount(t.length);
  };

  const pickPhoto = async () => {
    if (photo) { setPhoto(null); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const canSubmit = response.trim().length > 0 && !loading;

  if (!visible) return null;

  return (
    <>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />

      <Animated.View style={[s.sheet, { transform: [{ translateY }] }]}>

        {/* Handle */}
        <View {...pan.panHandlers} style={s.handleArea}>
          <View style={s.handle} />
        </View>

        {/* Header badge */}
        <View style={s.headerBadge}>
          <View style={s.headerIconBox}>
            <ShieldAlert size={16} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Litige ouvert par l'acheteur</Text>
            <Text style={s.headerSub}>Un administrateur examinera votre dossier</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <X size={16} color={C.textMuted} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Motif */}
          <Text style={s.sectionLabel}>Motif déclaré</Text>
          <View style={s.motifRow}>
            <View style={s.motifAccent} />
            <View style={s.motifContent}>
              <Quote size={14} color={C.red} style={{ opacity: 0.5, marginBottom: 4 }} />
              <Text style={s.motifText}>
                {disputeReason || "Aucun motif précisé par l'acheteur"}
              </Text>
            </View>
          </View>

          {/* Réponse */}
          <View style={s.row}>
            <Text style={s.sectionLabel}>Votre réponse</Text>
            <Text style={[s.sectionLabel, { color: charCount > 450 ? C.red : C.textMuted }]}>
              {charCount} / 500
            </Text>
          </View>
          <TextInput
            style={s.textArea}
            placeholder="Expliquez votre version des faits..."
            placeholderTextColor={C.textMuted}
            multiline
            value={response}
            onChangeText={onChangeText}
            textAlignVertical="top"
            maxLength={500}
          />

          {/* Photo preuve */}
          <Text style={s.sectionLabel}>Photo preuve</Text>
          <TouchableOpacity
            style={[s.photoBox, photo && s.photoBoxDone]}
            onPress={pickPhoto}
            activeOpacity={0.75}
          >
            {photo ? (
              <>
                <CircleCheck size={22} color={C.green} />
                <Text style={[s.photoLabel, { color: C.greenText }]}>Photo ajoutée — appuyer pour retirer</Text>
              </>
            ) : (
              <>
                {/* <PhotoPlus size={22} color={C.textMuted} /> */}
                <Text style={s.photoLabel}>Ajouter une photo</Text>
              </>
            )}
          </TouchableOpacity>

          {/* CTA */}
          <View style={s.ctaRow}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
              <Text style={s.cancelText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.submitBtn, !canSubmit && s.submitBtnOff]}
              disabled={!canSubmit}
              onPress={() => onSubmit(response, photo)}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Send size={15} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={s.submitText}>Envoyer ma réponse</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </Animated.View>
    </>
  );
}

const s = StyleSheet.create({
  backdrop:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 10 },
  sheet:        { position: 'absolute', bottom: 0, left: 0, right: 0, height: SHEET_H, backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingBottom: 32, zIndex: 11, elevation: 20 },

  handleArea:   { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  handle:       { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border },

  headerBadge:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.redBg, borderWidth: 0.5, borderColor: C.redBorder, borderRadius: 12, padding: 12, marginBottom: 18 },
  headerIconBox:{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerTitle:  { fontSize: 13, fontWeight: '500', color: C.redText },
  headerSub:    { fontSize: 11, color: C.red, opacity: 0.7, marginTop: 1 },
  closeBtn:     { padding: 4 },

  sectionLabel: { fontSize: 11, fontWeight: '500', color: C.textSec, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  motifRow:     { flexDirection: 'row', backgroundColor: C.surface1, borderRadius: 8, marginBottom: 14, overflow: 'hidden' },
  motifAccent:  { width: 3, backgroundColor: C.red },
  motifContent: { flex: 1, padding: 12 },
  motifText:    { fontSize: 14, color: C.text, fontStyle: 'italic' },

  textArea:     { backgroundColor: C.surface1, borderWidth: 0.5, borderColor: C.border, borderRadius: 8, padding: 12, height: 100, fontSize: 14, color: C.text, marginBottom: 14 },

  photoBox:     { borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.borderStrong, borderRadius: 8, height: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 18, backgroundColor: C.surface1 },
  photoBoxDone: { borderStyle: 'solid', borderColor: C.greenBorder, backgroundColor: C.greenBg },
  photoLabel:   { fontSize: 13, color: C.textMuted },

  ctaRow:       { flexDirection: 'row', gap: 10 },
  cancelBtn:    { flex: 1, height: 48, borderRadius: 12, borderWidth: 0.5, borderColor: C.borderStrong, alignItems: 'center', justifyContent: 'center' },
  cancelText:   { fontSize: 14, fontWeight: '500', color: C.textSec },
  submitBtn:    { flex: 2, height: 48, borderRadius: 12, backgroundColor: C.red, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  submitBtnOff: { opacity: 0.4 },
  submitText:   { fontSize: 14, fontWeight: '500', color: '#fff' },
});