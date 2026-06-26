import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ListRenderItemInfo,
} from 'react-native';
import Svg, {
  Rect, Circle, Ellipse, Line, Path, G, Text as SvgText,
} from 'react-native-svg';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// ─── Illustrations SVG ────────────────────────────────────────────────────────

const IllustrationChamp = () => (
  <Svg width={width} height={220} viewBox={`0 0 ${width} 220`}>
    {/* Ciel */}
    <Rect width={width} height={220} fill="#1D4A1A" />
    <Rect width={width} height={110} fill="#2A6B2A" />
    <Rect width={width} height={80}  fill="#3B8C3B" />
    <Rect width={width} height={55}  fill="#4BAF4B" />
    <Rect width={width} height={38}  fill="#5FC75F" />
    {/* Soleil */}
    <Circle cx={width - 52} cy={36} r={20} fill="#FFC849" opacity={0.95} />
    <Circle cx={width - 52} cy={36} r={28} fill="#FFC849" opacity={0.18} />
    <Line x1={width-52} y1={8}  x2={width-52} y2={2}  stroke="#FFC849" strokeWidth={1.5} opacity={0.5}/>
    <Line x1={width-28} y1={13} x2={width-24} y2={8}  stroke="#FFC849" strokeWidth={1.5} opacity={0.5}/>
    <Line x1={width-18} y1={36} x2={width-12} y2={36} stroke="#FFC849" strokeWidth={1.5} opacity={0.5}/>
    <Line x1={width-76} y1={13} x2={width-80} y2={8}  stroke="#FFC849" strokeWidth={1.5} opacity={0.5}/>
    {/* Collines fond */}
    <Ellipse cx={60}       cy={115} rx={90} ry={40} fill="#27500A" opacity={0.5}/>
    <Ellipse cx={width-50} cy={120} rx={80} ry={36} fill="#27500A" opacity={0.45}/>
    {/* Sol */}
    <Rect y={168} width={width} height={52} fill="#5C3A1A"/>
    <Rect y={163} width={width} height={10} fill="#7A4E22"/>
    {/* Tiges */}
    {[0.1,0.23,0.37,0.51,0.65,0.78,0.91].map((r, i) => (
      <G key={i}>
        <Line x1={width*r} y1={172} x2={width*r-3} y2={92+i%3*6}
              stroke="#3B8C3B" strokeWidth={3} strokeLinecap="round"/>
        <Ellipse cx={width*r-3} cy={120+i%2*8} rx={20} ry={5}
                 fill="#4BAF4B"
                 transform={`rotate(${i%2===0?-25:25} ${width*r-3} ${120+i%2*8})`}/>
        <Rect x={width*r-7} y={100+i%3*5} width={9} height={20} rx={4.5} fill="#FFC849"/>
      </G>
    ))}
    {/* Tags flottants */}
    <Rect x={14} y={56} width={130} height={24} rx={12} fill="rgba(255,255,255,0.92)"/>
    <SvgText x={79} y={73} textAnchor="middle" fontSize={11} fontWeight="700" fill="#27500A">
      Maïs · 4 500 F/sac
    </SvgText>
    <Rect x={width-150} y={72} width={136} height={24} rx={12} fill="rgba(255,255,255,0.92)"/>
    <SvgText x={width-82} y={89} textAnchor="middle" fontSize={11} fontWeight="700" fill="#27500A">
      Parakou · 200 sacs
    </SvgText>
  </Svg>
);

const IllustrationCoffre = () => (
  <Svg width={width} height={220} viewBox={`0 0 ${width} 220`}>
    {/* Fond nuit */}
    <Rect width={width} height={220} fill="#0C3A6B"/>
    {/* Étoiles */}
    {[[20,18],[65,10],[110,26],[155,14],[195,8],[35,52],[185,48],[width-20,30]].map(([cx,cy],i)=>(
      <Circle key={i} cx={cx} cy={cy} r={[1.2,0.8,1,1.4,0.9,0.7,1.1,0.7][i]} fill="#fff" opacity={0.25}/>
    ))}
    {/* Lueurs pièces fond */}
    <Circle cx={45}       cy={168} r={14} fill="#FFC849" opacity={0.12}/>
    <Circle cx={width-42} cy={158} r={10} fill="#FFC849" opacity={0.1}/>
    {/* Pièces FCFA */}
    <Circle cx={48}       cy={72}  r={20} fill="#FFC849" opacity={0.92}/>
    <SvgText x={48} y={77} textAnchor="middle" fontSize={9} fontWeight="700" fill="#7A4800">FCFA</SvgText>
    <Circle cx={width-42} cy={88}  r={16} fill="#FFC849" opacity={0.85}/>
    <SvgText x={width-42} y={93} textAnchor="middle" fontSize={8} fontWeight="700" fill="#7A4800">FCFA</SvgText>
    <Circle cx={width/2}  cy={54}  r={12} fill="#FFC849" opacity={0.7}/>
    <SvgText x={width/2} y={58} textAnchor="middle" fontSize={7} fontWeight="700" fill="#7A4800">FCFA</SvgText>
    {/* Corps coffre */}
    <Rect x={width/2-58} y={108} width={116} height={88} rx={10} fill="#1a2e4a" stroke="#378ADD" strokeWidth={1.5}/>
    <Rect x={width/2-50} y={116} width={100} height={74} rx={7}  fill="#0f1f35"/>
    {/* Cadran */}
    <Circle cx={width/2} cy={152} r={24} fill="#112240" stroke="#378ADD" strokeWidth={1.5}/>
    <Circle cx={width/2} cy={152} r={17} fill="#0a1929" stroke="#185FA5" strokeWidth={1}/>
    <Line x1={width/2} y1={137} x2={width/2} y2={140} stroke="#378ADD" strokeWidth={1} opacity={0.5}/>
    <Line x1={width/2+17} y1={152} x2={width/2+14} y2={152} stroke="#378ADD" strokeWidth={1} opacity={0.5}/>
    <Line x1={width/2} y1={167} x2={width/2} y2={164} stroke="#378ADD" strokeWidth={1} opacity={0.5}/>
    <Line x1={width/2-17} y1={152} x2={width/2-14} y2={152} stroke="#378ADD" strokeWidth={1} opacity={0.5}/>
    {/* Aiguille */}
    <Line x1={width/2} y1={152} x2={width/2+10} y2={143} stroke="#FFC849" strokeWidth={2} strokeLinecap="round"/>
    <Circle cx={width/2} cy={152} r={2.5} fill="#FFC849"/>
    {/* Poignée */}
    <Rect x={width/2+52} y={145} width={10} height={14} rx={5} fill="#378ADD"/>
    {/* Verrou vert */}
    <Rect x={width/2-16} y={120} width={28} height={22} rx={4} fill="#1D9E75" stroke="#9FE1CB" strokeWidth={1}/>
    <Path d={`M${width/2-11} 120 V117 a11 11 0 0 1 22 0`} stroke="#9FE1CB" strokeWidth={2} fill="none" strokeLinecap="round"/>
    <Circle cx={width/2} cy={130} r={3.5} fill="#EAF3DE"/>
    {/* Badge séquestre */}
    <Rect x={width/2-88} y={182} width={176} height={24} rx={12} fill="rgba(29,158,117,0.2)" stroke="#1D9E75" strokeWidth={1}/>
    <SvgText x={width/2} y={199} textAnchor="middle" fontSize={11} fontWeight="700" fill="#9FE1CB">
      105 000 F sécurisés
    </SvgText>
  </Svg>
);

const IllustrationRoute = () => (
  <Svg width={width} height={220} viewBox={`0 0 ${width} 220`}>
    {/* Ciel coucher de soleil */}
    <Rect width={width} height={220} fill="#412402"/>
    <Rect width={width} height={130} fill="#633806"/>
    <Rect width={width} height={80}  fill="#854F0B"/>
    <Rect width={width} height={50}  fill="#BA7517"/>
    <Rect width={width} height={26}  fill="#EF9F27"/>
    {/* Soleil couchant */}
    <Ellipse cx={width/2} cy={4} rx={44} ry={24} fill="#FFC849" opacity={0.92}/>
    <Ellipse cx={width/2} cy={0} rx={64} ry={22} fill="#FFC849" opacity={0.28}/>
    {/* Nuages */}
    <Ellipse cx={32}       cy={40} rx={26} ry={10} fill="#FAC775" opacity={0.32}/>
    <Ellipse cx={55}       cy={36} rx={18} ry={8}  fill="#FAC775" opacity={0.28}/>
    <Ellipse cx={width-35} cy={38} rx={22} ry={9}  fill="#FAC775" opacity={0.32}/>
    <Ellipse cx={width-14} cy={43} rx={15} ry={7}  fill="#FAC775" opacity={0.28}/>
    {/* Collines silhouette */}
    <Ellipse cx={38}       cy={148} rx={70} ry={32} fill="#27500A" opacity={0.38}/>
    <Ellipse cx={width-40} cy={152} rx={64} ry={28} fill="#27500A" opacity={0.32}/>
    {/* Route perspective */}
    <Path d={`M0 220 L${width*0.36} 145 L${width*0.64} 145 L${width} 220Z`} fill="#444"/>
    <Path d={`M0 220 L${width*0.38} 148 L${width*0.62} 148 L${width} 220Z`} fill="#555"/>
    {/* Ligne centrale pointillée */}
    <Line x1={width/2} y1={220} x2={width/2} y2={150}
          stroke="#FFC849" strokeWidth={2} strokeDasharray="8 6" opacity={0.5}/>
    {/* Bas route */}
    <Rect y={212} width={width} height={8} fill="#5C3A1A"/>
    {/* Camion — centré */}
    <G transform={`translate(${width/2-60}, 108)`}>
      <Rect x={0}  y={10} width={88} height={36} rx={3}  fill="#BA7517"/>
      <Rect x={2}  y={12} width={84} height={32} rx={2}  fill="#EF9F27"/>
      <Rect x={64} y={2}  width={32} height={44} rx={4}  fill="#854F0B"/>
      <Rect x={66} y={5}  width={26} height={18} rx={3}  fill="#0C3A6B" opacity={0.85}/>
      <Rect x={93} y={29} width={5}  height={9}  rx={2}  fill="#FFC849"/>
      <Circle cx={18} cy={49} r={10} fill="#1a1a1a"/>
      <Circle cx={18} cy={49} r={5.5} fill="#444"/>
      <Circle cx={74} cy={49} r={10} fill="#1a1a1a"/>
      <Circle cx={74} cy={49} r={5.5} fill="#444"/>
      {/* Sacs marchandise */}
      <Rect x={8}  y={4}  width={18} height={13} rx={3} fill="#27500A" opacity={0.9}/>
      <Rect x={30} y={4}  width={18} height={13} rx={3} fill="#27500A" opacity={0.9}/>
      <Rect x={19} y={-6} width={18} height={13} rx={3} fill="#27500A" opacity={0.9}/>
    </G>
    {/* Badge GPS */}
    <Rect x={14} y={138} width={84} height={22} rx={11} fill="rgba(29,158,117,0.85)"/>
    <SvgText x={56} y={153} textAnchor="middle" fontSize={10} fontWeight="700" fill="#fff">
      GPS actif
    </SvgText>
    {/* Trace destination */}
    <Path d={`M${width/2+60} 130 Q${width-50} 110 ${width-42} 88`}
          stroke="#FFC849" strokeWidth={1.5} strokeDasharray="4 3" fill="none" opacity={0.6}/>
    <Circle cx={width-42} cy={88} r={5}  fill="#FFC849"/>
    <Circle cx={width-42} cy={88} r={10} fill="#FFC849" opacity={0.22}/>
  </Svg>
);

// ─── Data slides ──────────────────────────────────────────────────────────────

const SLIDES = [
  {
    id: '1',
    Illustration: IllustrationChamp,
    bgTop: '#1D4A1A',
    title: 'Vendez votre récolte\nau meilleur prix',
    desc: 'Publiez vos produits en photo, fixez votre prix et trouvez des acheteurs sérieux partout au Bénin.',
    titleColor: '#27500A',
    descColor: '#3B6D11',
    btnBg: '#1D9E75',
    dotActive: '#1D9E75',
  },
  {
    id: '2',
    Illustration: IllustrationCoffre,
    bgTop: '#0C3A6B',
    title: 'Paiements 100%\nsécurisés',
    desc: 'Vos fonds sont bloqués dès la commande et libérés seulement après la livraison confirmée.',
    titleColor: '#0C447C',
    descColor: '#185FA5',
    btnBg: '#185FA5',
    dotActive: '#185FA5',
  },
  {
    id: '3',
    Illustration: IllustrationRoute,
    bgTop: '#412402',
    title: 'La logistique\nintégrée',
    desc: 'Des chauffeurs vérifiés prennent vos marchandises avec suivi GPS en temps réel et QR Code.',
    titleColor: '#412402',
    descColor: '#633806',
    btnBg: '#BA7517',
    dotActive: '#BA7517',
  },
];

type Slide = typeof SLIDES[0];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList<Slide>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    stopAutoScroll();
    autoScrollRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % SLIDES.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3200);
  }, [stopAutoScroll]);

  useEffect(() => {
    startAutoScroll();
    return () => stopAutoScroll();
  }, [startAutoScroll, stopAutoScroll]);

  const handleNext = () => {
    stopAutoScroll();
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
      startAutoScroll();
    } else {
      router.push('/(auth)/rolePickerScreen');
    }
  };

  const handleSkip = () => {
    stopAutoScroll();
    router.push('/(auth)/rolePickerScreen');
  };

  const renderItem = ({ item }: ListRenderItemInfo<Slide>) => (
    <View style={[styles.slide, { backgroundColor: item.bgTop }]}>
      {/* Illustration SVG plein haut */}
      <item.Illustration />

      {/* Card blanche arrondie collée en bas */}
      <View style={styles.card}>
        <Text style={[styles.title, { color: item.titleColor }]}>{item.title}</Text>
        <Text style={[styles.desc,  { color: item.descColor  }]}>{item.desc}</Text>

        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex ? item.dotActive : '#D3D1C7',
                  width: i === currentIndex ? 20 : 6,
                },
              ]}
            />
          ))}
        </View>

        {/* Bouton */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          style={[styles.btn, { backgroundColor: item.btnBg }]}
        >
          <Text style={styles.btnText}>
            {currentIndex === SLIDES.length - 1 ? 'Commencer' : 'Suivant'}
          </Text>
        </TouchableOpacity>

        {currentIndex < SLIDES.length - 1 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Passer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  desc: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 24,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  btn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  skipBtn: {
    alignItems: 'center',
    paddingTop: 14,
  },
  skipText: {
    fontSize: 13,
    color: '#888',
  },
});