import React, { useEffect, useRef } from 'react';
import {
    Modal, View, Text, TouchableOpacity,
    StyleSheet, Animated, Easing, Dimensions, PanResponder
} from 'react-native';
import Svg, {
    Rect, Circle, Polygon, Path, Ellipse, Line, G
} from 'react-native-svg';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 380;

interface EditProductModalProps {
    visible: boolean;
    productName?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function EditProductModal({
    visible,
    productName,
    onConfirm,
    onCancel,
}: EditProductModalProps) {

    const slideY         = useRef(new Animated.Value(SHEET_HEIGHT)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;

    // Vendeur se penche / travaille sur place
    const vendorTilt  = useRef(new Animated.Value(0)).current;
    // Marteau frappe
    const hammerAngle = useRef(new Animated.Value(0)).current;
    // Produits sur l'étal bougent légèrement
    const productY    = useRef(new Animated.Value(0)).current;
    // Étoiles scintillent
    const sparkleOp   = useRef(new Animated.Value(0)).current;

    const vendorLoop  = useRef<Animated.CompositeAnimation | null>(null);
    const hammerLoop  = useRef<Animated.CompositeAnimation | null>(null);
    const productLoop = useRef<Animated.CompositeAnimation | null>(null);
    const sparkleLoop = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideY, {
                    toValue: 0,
                    damping: 20,
                    stiffness: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Vendeur se penche en avant/arrière (travaille)
            vendorLoop.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(vendorTilt, { toValue: 1,  duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(vendorTilt, { toValue: -1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ])
            );
            vendorLoop.current.start();

            // Marteau frappe vite
            hammerLoop.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(hammerAngle, { toValue: 1,  duration: 250, easing: Easing.in(Easing.ease),  useNativeDriver: true }),
                    Animated.timing(hammerAngle, { toValue: -1, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                ])
            );
            hammerLoop.current.start();

            // Produits bougent doucement
            productLoop.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(productY, { toValue: -2, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(productY, { toValue: 0,  duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ])
            );
            productLoop.current.start();

            // Étoiles / scintillement
            sparkleLoop.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(sparkleOp, { toValue: 1, duration: 500, useNativeDriver: true }),
                    Animated.timing(sparkleOp, { toValue: 0, duration: 500, useNativeDriver: true }),
                ])
            );
            sparkleLoop.current.start();

        } else {
            close();
        }
    }, [visible]);

    const close = () => {
        Animated.parallel([
            Animated.timing(slideY, {
                toValue: SHEET_HEIGHT,
                duration: 280,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            vendorLoop.current?.stop();
            hammerLoop.current?.stop();
            productLoop.current?.stop();
            sparkleLoop.current?.stop();
        });
    };

    const handleCancel = () => {
        close();
        setTimeout(onCancel, 300);
    };

    const handleConfirm = () => {
        close();
        setTimeout(onConfirm, 300);
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, g) => {
                if (g.dy > 0) slideY.setValue(g.dy);
            },
            onPanResponderRelease: (_, g) => {
                if (g.dy > 80) {
                    handleCancel();
                } else {
                    Animated.spring(slideY, {
                        toValue: 0,
                        damping: 20,
                        stiffness: 200,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const vendorRotate = vendorTilt.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-4deg', '4deg'],
    });

    const hammerRotate = hammerAngle.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-30deg', '10deg'],
    });

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleCancel}>
            {/* Overlay */}
            <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleCancel} activeOpacity={1} />
            </Animated.View>

            {/* Bottom sheet */}
            <Animated.View style={[styles.sheet, { transform: [{ translateY: slideY }] }]}>

                {/* Drag handle */}
                <View {...panResponder.panHandlers} style={styles.handleArea}>
                    <View style={styles.handle} />
                </View>

                {/* SVG scene */}
                <View style={styles.sceneWrap}>
                    <Svg width={200} height={110} viewBox="0 0 200 110" style={{ overflow: 'visible' }}>
                        {/* Sky */}
                        <Rect width={200} height={80} rx={8} fill="#EBF4E0" />
                        {/* Sun */}
                        <Circle cx={170} cy={18} r={12} fill="#FAC775" opacity={0.85} />
                        <Line x1={170} y1={3}   x2={170} y2={0}   stroke="#FAC775" strokeWidth={1.5} strokeLinecap="round" />
                        <Line x1={170} y1={33}  x2={170} y2={36}  stroke="#FAC775" strokeWidth={1.5} strokeLinecap="round" />
                        <Line x1={155} y1={18}  x2={152} y2={18}  stroke="#FAC775" strokeWidth={1.5} strokeLinecap="round" />
                        <Line x1={185} y1={18}  x2={188} y2={18}  stroke="#FAC775" strokeWidth={1.5} strokeLinecap="round" />
                        {/* House */}
                        <Rect x={130} y={42} width={38} height={30} rx={3} fill="#F5F5F5" stroke="#D3D1C7" strokeWidth={0.8} />
                        <Polygon points="127,43 170,43 148,26" fill="#D32F2F" opacity={0.8} />
                        <Rect x={142} y={56} width={12} height={16} rx={2} fill="#B5D4F4" />
                        <Rect x={133} y={50} width={9}  height={9}  rx={1.5} fill="#B5D4F4" />
                        <Rect x={162} y={27} width={5}  height={10} rx={1}  fill="#888780" />
                        {/* Ground */}
                        <Rect x={0} y={80} width={200} height={30} fill="#D3D1C7" />
                    </Svg>

                    {/* Étal statique */}
                    <View style={styles.stall}>
                        <Svg width={90} height={80} viewBox="0 0 90 80">
                            <Rect x={0} y={0}  width={70} height={7} rx={2} fill="#1D9E75" />
                            <Polygon points="0,7 70,7 76,18 -6,18" fill="#0F6E56" />
                            <Rect x={0} y={18} width={70} height={4} rx={2} fill="#B4B2A9" />
                            <Rect x={4}  y={22} width={4} height={28} rx={2} fill="#888780" />
                            <Rect x={62} y={22} width={4} height={28} rx={2} fill="#888780" />
                        </Svg>

                        {/* Produits qui bougent */}
                        <Animated.View style={[styles.products, { transform: [{ translateY: productY }] }]}>
                            <Svg width={70} height={14} viewBox="0 0 70 14">
                                <Rect x={4}  y={0} width={10} height={9} rx={2} fill="#FAC775" />
                                <Rect x={18} y={0} width={12} height={11} rx={2} fill="#5DCAA5" />
                                <Rect x={34} y={0} width={9}  height={8} rx={2} fill="#F0997B" />
                                <Rect x={46} y={0} width={12} height={10} rx={2} fill="#FAC775" />
                            </Svg>
                        </Animated.View>
                    </View>

                    {/* Étoiles scintillantes au-dessus de l'étal */}
                    <Animated.View style={[styles.sparkle, { opacity: sparkleOp }]}>
                        <Svg width={30} height={22} viewBox="0 0 30 22">
                            <Polygon
                                points="6,0 7.5,5 12,5 8.5,8 10,13 6,10 2,13 3.5,8 0,5 4.5,5"
                                fill="#FAC775"
                            />
                            <Polygon
                                points="23,2 24,6 28,6 25,8.5 26,12 23,10 20,12 21,8.5 18,6 22,6"
                                fill="#378ADD"
                                opacity={0.7}
                            />
                        </Svg>
                    </Animated.View>

                    {/* Vendeur qui travaille sur place */}
                    <Animated.View style={[styles.vendor, { transform: [{ rotate: vendorRotate }] }]}>
                        <Svg width={28} height={56} viewBox="0 0 28 56">
                            <Rect x={6}  y={20} width={16} height={18} rx={3.5} fill="#378ADD" />
                            <Circle cx={14} cy={12} r={9} fill="#F0997B" />
                            <Rect x={4}  y={5}  width={20} height={3.5} rx={1.5} fill="#185FA5" />
                            <Rect x={7}  y={0}  width={14} height={7}   rx={1.5} fill="#185FA5" />
                            {/* Bras levés (en train de travailler) */}
                            <Rect x={0}  y={20} width={7}  height={3.5} rx={1.5} fill="#378ADD" />
                            <Rect x={21} y={20} width={7}  height={3.5} rx={1.5} fill="#378ADD" />
                            <Rect x={7}  y={37} width={5}  height={12}  rx={2.5} fill="#185FA5" />
                            <Rect x={16} y={37} width={5}  height={12}  rx={2.5} fill="#185FA5" />
                            <Ellipse cx={10} cy={49} rx={5} ry={2.5} fill="#2C2C2A" />
                            <Ellipse cx={18} cy={49} rx={5} ry={2.5} fill="#2C2C2A" />
                            <Circle cx={10} cy={13} r={1.3} fill="#2C2C2A" />
                            <Circle cx={18} cy={13} r={1.3} fill="#2C2C2A" />
                            {/* Bouche concentrée (droite) */}
                            <Line x1={11} y1={18} x2={17} y2={18} stroke="#2C2C2A" strokeWidth={1} strokeLinecap="round" />
                        </Svg>

                        {/* Marteau animé */}
                        <Animated.View style={[styles.hammer, { transform: [{ rotate: hammerRotate }] }]}>
                            <Svg width={18} height={18} viewBox="0 0 18 18">
                                {/* Manche */}
                                <Rect x={8} y={8} width={4} height={10} rx={1.5} fill="#888780" />
                                {/* Tête */}
                                <Rect x={4} y={4} width={10} height={6}  rx={2}   fill="#2C2C2A" />
                            </Svg>
                        </Animated.View>
                    </Animated.View>
                </View>

                <Text style={styles.title}>Modifier ce produit ?</Text>
                <Text style={styles.subtitle}>
                    {productName
                        ? `"${productName}" sera mis à jour au marché.\n`
                        : 'Ce produit sera mis à jour au marché.\n'}
                    Le vendeur réarrange son étal.
                </Text>

                <View style={styles.btnRow}>
                    <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={handleCancel} activeOpacity={0.7}>
                        <Text style={styles.btnCancelText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.btnConfirm]} onPress={handleConfirm} activeOpacity={0.7}>
                        <Text style={styles.btnConfirmText}>Enregistrer</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: SHEET_HEIGHT,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    handleArea: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D3D1C7',
    },
    sceneWrap: {
        width: 200,
        height: 110,
        alignSelf: 'center',
        marginBottom: 16,
        overflow: 'hidden',
        borderRadius: 10,
        position: 'relative',
    },
    stall: {
        position: 'absolute',
        top: 30,
        left: 14,
    },
    products: {
        position: 'absolute',
        top: 8,
        left: 0,
    },
    sparkle: {
        position: 'absolute',
        top: 18,
        left: 20,
    },
    vendor: {
        position: 'absolute',
        top: 44,
        left: 82,
        transformOrigin: 'bottom center',
    },
    hammer: {
        position: 'absolute',
        top: 14,
        left: -12,
        transformOrigin: 'bottom right',
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#000',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    btnRow: {
        flexDirection: 'row',
        gap: 12,
    },
    btn: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 14,
        alignItems: 'center',
    },
    btnCancel: {
        backgroundColor: '#F5F5F5',
    },
    btnCancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    btnConfirm: {
        backgroundColor: '#EEF3FF',   // bleu clair
    },
    btnConfirmText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#185FA5',             // bleu foncé
    },
});