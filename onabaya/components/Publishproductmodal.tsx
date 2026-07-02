import React, { useEffect, useRef } from 'react';
import {
    Modal, View, Text, TouchableOpacity,
    StyleSheet, Animated, Easing, Dimensions, PanResponder
} from 'react-native';
import Svg, {
    Rect, Circle, Polygon, Path, Ellipse, Line
} from 'react-native-svg';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 380;

interface PublishProductModalProps {
    visible: boolean;
    productName?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function PublishProductModal({
    visible,
    productName,
    onConfirm,
    onCancel,
}: PublishProductModalProps) {

    const slideY         = useRef(new Animated.Value(SHEET_HEIGHT)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;

    const stallX      = useRef(new Animated.Value(160)).current;
    const vendorX     = useRef(new Animated.Value(140)).current;
    const vendorY     = useRef(new Animated.Value(0)).current;
    const bagAngle    = useRef(new Animated.Value(0)).current;
    const roadX       = useRef(new Animated.Value(0)).current;
    const dustOpacity = useRef(new Animated.Value(0)).current;

    const walkLoop  = useRef<Animated.CompositeAnimation | null>(null);
    const bagLoop   = useRef<Animated.CompositeAnimation | null>(null);
    const roadLoop  = useRef<Animated.CompositeAnimation | null>(null);
    const dustLoop  = useRef<Animated.CompositeAnimation | null>(null);

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

            stallX.setValue(160);
            Animated.timing(stallX, {
                toValue: 0,
                duration: 2200,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start();

            vendorX.setValue(140);
            Animated.timing(vendorX, {
                toValue: 0,
                duration: 2000,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start();

            dustLoop.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(dustOpacity, { toValue: 0.6, duration: 300, useNativeDriver: true }),
                    Animated.timing(dustOpacity, { toValue: 0,   duration: 900, useNativeDriver: true }),
                ])
            );
            dustLoop.current.start();

            walkLoop.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(vendorY, { toValue: -2, duration: 200, useNativeDriver: true }),
                    Animated.timing(vendorY, { toValue: 0,  duration: 200, useNativeDriver: true }),
                ])
            );
            walkLoop.current.start();

            bagLoop.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(bagAngle, { toValue: 1,  duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(bagAngle, { toValue: -1, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ])
            );
            bagLoop.current.start();

            roadLoop.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(roadX, { toValue: 40,  duration: 600, useNativeDriver: true }),
                    Animated.timing(roadX, { toValue: 0,   duration: 0,   useNativeDriver: true }),
                ])
            );
            roadLoop.current.start();

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
            walkLoop.current?.stop();
            bagLoop.current?.stop();
            roadLoop.current?.stop();
            dustLoop.current?.stop();
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

    const bagRotate = bagAngle.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-8deg', '8deg'],
    });

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleCancel}>
            <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleCancel} activeOpacity={1} />
            </Animated.View>

            <Animated.View style={[styles.sheet, { transform: [{ translateY: slideY }] }]}>
                <View {...panResponder.panHandlers} style={styles.handleArea}>
                    <View style={styles.handle} />
                </View>

                <View style={styles.sceneWrap}>
                    <Svg width={200} height={110} viewBox="0 0 200 110" style={{ overflow: 'visible' }}>
                        <Rect width={200} height={80} rx={8} fill="#EBF4E0" />
                        <Circle cx={170} cy={18} r={12} fill="#FAC775" opacity={0.85} />
                        <Line x1={170} y1={3}   x2={170} y2={0}   stroke="#FAC775" strokeWidth={1.5} strokeLinecap="round" />
                        <Line x1={170} y1={33}  x2={170} y2={36}  stroke="#FAC775" strokeWidth={1.5} strokeLinecap="round" />
                        <Line x1={155} y1={18}  x2={152} y2={18}  stroke="#FAC775" strokeWidth={1.5} strokeLinecap="round" />
                        <Line x1={185} y1={18}  x2={188} y2={18}  stroke="#FAC775" strokeWidth={1.5} strokeLinecap="round" />

                        <Rect x={130} y={42} width={38} height={30} rx={3} fill="#F5F5F5" stroke="#D3D1C7" strokeWidth={0.8} />
                        <Polygon points="127,43 170,43 148,26" fill="#D32F2F" opacity={0.8} />
                        <Rect x={142} y={56} width={12} height={16} rx={2} fill="#B5D4F4" />
                        <Rect x={133} y={50} width={9}  height={9}  rx={1.5} fill="#B5D4F4" />
                        <Rect x={162} y={27} width={5}  height={10} rx={1}  fill="#888780" />

                        <Rect x={0} y={80} width={200} height={30} fill="#D3D1C7" />
                    </Svg>

                    <Animated.View style={[styles.road, { transform: [{ translateX: roadX }] }]}>
                        <Svg width={280} height={30} viewBox="0 0 280 30">
                            {[0, 40, 80, 120, 160, 200, 240].map((x) => (
                                <Rect key={x} x={x} y={8} width={26} height={4} rx={2} fill="#B4B2A9" />
                            ))}
                        </Svg>
                    </Animated.View>

                    <Animated.View style={[styles.stall, { transform: [{ translateX: stallX }] }]}>
                        <Svg width={90} height={80} viewBox="0 0 90 80">
                            <Rect x={0} y={0}  width={70} height={7} rx={2} fill="#1D9E75" />
                            <Polygon points="0,7 70,7 76,18 -6,18" fill="#0F6E56" />
                            <Rect x={0} y={18} width={70} height={4} rx={2} fill="#B4B2A9" />
                            <Rect x={4}  y={8}  width={10} height={9} rx={2} fill="#FAC775" />
                            <Rect x={18} y={6}  width={12} height={11} rx={2} fill="#5DCAA5" />
                            <Rect x={34} y={9}  width={9}  height={8} rx={2} fill="#F0997B" />
                            <Rect x={46} y={7}  width={12} height={10} rx={2} fill="#FAC775" />
                            <Rect x={4}  y={22} width={4} height={28} rx={2} fill="#888780" />
                            <Rect x={62} y={22} width={4} height={28} rx={2} fill="#888780" />
                        </Svg>
                    </Animated.View>

                    <Animated.View style={[styles.dust, { opacity: dustOpacity }]}>
                        <Svg width={50} height={24} viewBox="0 0 50 24">
                            <Circle cx={8}  cy={12} r={6} fill="#B4B2A9" opacity={0.6} />
                            <Circle cx={22} cy={8}  r={4} fill="#B4B2A9" opacity={0.5} />
                            <Circle cx={36} cy={14} r={3} fill="#B4B2A9" opacity={0.4} />
                        </Svg>
                    </Animated.View>

                    <Animated.View style={[styles.vendor, { transform: [{ translateX: vendorX }, { translateY: vendorY }] }]}>
                        <Svg width={28} height={56} viewBox="0 0 28 56">
                            <Rect x={6} y={20} width={16} height={18} rx={3.5} fill="#378ADD" />
                            <Circle cx={14} cy={12} r={9} fill="#F0997B" />
                            <Rect x={4}  y={5} width={20} height={3.5} rx={1.5} fill="#185FA5" />
                            <Rect x={7}  y={0} width={14} height={7} rx={1.5} fill="#185FA5" />
                            <Rect x={0}  y={22} width={7}  height={3.5} rx={1.5} fill="#378ADD" />
                            <Rect x={21} y={22} width={7}  height={3.5} rx={1.5} fill="#378ADD" />
                            <Rect x={7}  y={37} width={5}  height={12} rx={2.5} fill="#185FA5" />
                            <Rect x={16} y={37} width={5}  height={12} rx={2.5} fill="#185FA5" />
                            <Ellipse cx={10} cy={49} rx={5} ry={2.5} fill="#2C2C2A" />
                            <Ellipse cx={18} cy={49} rx={5} ry={2.5} fill="#2C2C2A" />
                            <Circle cx={10} cy={13} r={1.3} fill="#2C2C2A" />
                            <Circle cx={18} cy={13} r={1.3} fill="#2C2C2A" />
                            <Path d="M11 17 Q14 20 17 17" stroke="#2C2C2A" strokeWidth={1} strokeLinecap="round" fill="none" />
                        </Svg>

                        {/* Le sac pivote désormais parfaitement sans plantage */}
                        <Animated.View style={[styles.bag, { transform: [{ rotate: bagRotate }] }]}>
                            <Svg width={16} height={18} viewBox="0 0 16 18">
                                <Rect x={2} y={5} width={12} height={12} rx={3.5} fill="#FAC775" />
                                <Path d="M4 5 Q8 0 12 5" stroke="#BA7517" strokeWidth={1.2} fill="none" strokeLinecap="round" />
                            </Svg>
                        </Animated.View>
                    </Animated.View>
                </View>

                <Text style={styles.title}>Publier ce produit ?</Text>
                <Text style={styles.subtitle}>
                    {productName
                        ? `"${productName}" sera mis en vente au marché.\n`
                        : 'Ce produit sera mis en vente au marché.\n'}
                    Le vendeur ouvre son étal.
                </Text>

                <View style={styles.btnRow}>
                    <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={handleCancel} activeOpacity={0.7}>
                        <Text style={styles.btnCancelText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.btnConfirm]} onPress={handleConfirm} activeOpacity={0.7}>
                        <Text style={styles.btnConfirmText}>Publier</Text>
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
    road: {
        position: 'absolute',
        bottom: 0,
        left: -20,
    },
    stall: {
        position: 'absolute',
        top: 30,
        left: 14,
    },
    dust: {
        position: 'absolute',
        bottom: 28,
        right: 6,
    },
    vendor: {
        position: 'absolute',
        top: 44,
        left: 82,
    },
    bag: {
        position: 'absolute',
        top: 22,
        left: 22,
        // Retrait de transformOrigin qui faisait crasher le rendu
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
        backgroundColor: '#E8F7F1',
    },
    btnConfirmText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0F6E56',
    },
});