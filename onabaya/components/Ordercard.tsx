import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SPACING } from '@/hooks/theme';
import type { OrderResource, OrderStatus } from '@/types/home/homeType';

/**
 * ── OrderTicketCard ──────────────────────────────────────────────────────
 * Un boarding-pass vintage pour chaque commande. 
 * Design : bords perforés, ligne de déchirure, tampon wax, typographie 
 * monospace pour l'aspect "transport rétro".
 * 
 * Remplace OrderCard par OrderTicketCard — mêmes props.
 * ───────────────────────────────────────────────────────────────────────── */

interface OrderTicketCardProps {
  order: OrderResource;
  accentColor: string;
  onPress?: (order: OrderResource) => void;
  hideTrackingButton?: boolean;
}

const { width: SCREEN_W } = Dimensions.get('window');

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; gate: string }
> = {
  searching:  { label: 'RECHERCHE',  color: '#D97706', bg: '#FEF3C7', gate: 'A1' },
  assigned:   { label: 'ASSIGNÉ',    color: '#2563EB', bg: '#DBEAFE', gate: 'B2' },
  collected:  { label: 'COLLECTÉ',   color: '#7C3AED', bg: '#EDE9FE', gate: 'C3' },
  delivered:  { label: 'LIVRÉ',      color: '#059669', bg: '#D1FAE5', gate: '✓' },
  disputed:   { label: 'LITIGE',     color: '#DC2626', bg: '#FEE2E2', gate: '!' },
  cancelled:  { label: 'ANNULÉ',     color: '#4B5563', bg: '#F3F4F6', gate: '✕' },
};

const STAGES: OrderStatus[] = ['searching', 'assigned', 'collected', 'delivered'];

function formatAmount(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

function firstName(person?: { name?: string; last_name?: string } | null): string | null {
  if (!person) return null;
  return person.name ?? person.last_name ?? null;
}

export default function OrderTicketCard({
  order,
  onPress,
  hideTrackingButton,
}: OrderTicketCardProps) {
  const router = useRouter();
  const anyOrder = order as any;
  const floatAnim = useRef(new Animated.Value(0)).current;

  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.cancelled;
  const canTrack = !hideTrackingButton && ['searching', 'assigned', 'collected'].includes(order.status);

  const producerName = firstName(anyOrder.producer) ?? 'Inconnu';
  const transporterName = firstName(anyOrder.transporter) ?? 'En recherche…';
  const rawRating = anyOrder.transporter?.average_rating;
  const rating = rawRating != null ? Number(rawRating).toFixed(1) : null;

  const deliveryFees: number = anyOrder.delivery_fees ?? 0;
  const deliveryCode: string | null = anyOrder.verification_code_delivery ?? null;
  const showCode = order.status === 'collected' && !!deliveryCode;

  const stageIndex = STAGES.indexOf(order.status);
  const progress = stageIndex >= 0 ? stageIndex / (STAGES.length - 1) : 0;

  // Animation de flottement subtile
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });

  const handleArrowPress = (e: any) => {
    e.stopPropagation?.();
    if (canTrack) router.push(`/orders/${order.id}/tracking`);
    else onPress?.(order);
  };

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      <TouchableOpacity activeOpacity={0.92} onPress={() => onPress?.(order)} style={styles.wrapper}>
        {/* ── Ticket Container ─────────────────────────────────────── */}
        <View style={styles.ticket}>
          {/* Perforations haut */}
          <View style={styles.holesTop}>
            {Array.from({ length: 8 }).map((_, i) => (
              <View key={i} style={styles.hole} />
            ))}
          </View>

          {/* ── Partie haute : Produit + Gate ──────────────────────── */}
          <View style={[styles.topSection, { backgroundColor: cfg.bg }]}>
            {/* Gate / Statut */}
            <View style={styles.gateColumn}>
              <Text style={[styles.gateLabel, { color: cfg.color }]}>STATUT</Text>
              <View style={[styles.gateCircle, { borderColor: cfg.color }]}>
                <Text style={[styles.gateNumber, { color: cfg.color }]}>{cfg.gate}</Text>
              </View>
              <Text style={[styles.gateStatus, { color: cfg.color }]}>{cfg.label}</Text>
            </View>

            {/* Infos produit */}
            <View style={styles.infoColumn}>
              <Text style={styles.productName} numberOfLines={2}>
                {order.product?.name ?? 'Produit'}
              </Text>
              <Text style={styles.productMeta}>
                {order.quantity_ordered} {order.product?.unit ?? ''} · {formatAmount(order.total_price)} FCFA
              </Text>
              {deliveryFees > 0 && (
                <Text style={[styles.deliveryFee, { color: cfg.color }]}>
                  +{formatAmount(deliveryFees)} FCFA livraison
                </Text>
              )}
              <Text style={styles.dateText}>
                {new Date(order.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>

          {/* ── Ligne de déchirure ─────────────────────────────────── */}
          <View style={styles.tearLine}>
            <View style={styles.tearDash} />
            <View style={[styles.tearIcon, { backgroundColor: cfg.bg }]}>
              <Text style={{ fontSize: 12 }}>✈</Text>
            </View>
            <View style={styles.tearDash} />
          </View>

          {/* ── Partie basse : Route + Code ────────────────────────── */}
          <View style={styles.bottomSection}>
            {/* Route Producteur → Transporteur */}
            <View style={styles.routeBlock}>
              <View style={styles.routePoint}>
                <Text style={styles.routeCode}>DEP</Text>
                <Text style={styles.routeName} numberOfLines={1}>{producerName}</Text>
                <View style={[styles.routeDot, { backgroundColor: '#10B981' }]} />
              </View>

              {/* Barre de progression stylisée */}
              <View style={styles.routeTrack}>
                <View style={styles.trackBg} />
                <View
                  style={[
                    styles.trackFill,
                    {
                      width: `${progress * 100}%`,
                      backgroundColor: cfg.color,
                    },
                  ]}
                />
                <View style={[styles.truckIcon, { left: `${progress * 100}%`, borderColor: cfg.color }]}>
                  <Text style={{ fontSize: 8 }}>🚚</Text>
                </View>
              </View>

              <View style={[styles.routePoint, styles.routePointRight]}>
                <Text style={styles.routeCode}>ARR</Text>
                <Text style={styles.routeName} numberOfLines={1}>
                  {transporterName}
                  {rating ? ` · ★${rating}` : ''}
                </Text>
                <View style={[styles.routeDot, { backgroundColor: cfg.color }]} />
              </View>
            </View>

            {/* Code de remise style tampon */}
            {showCode && (
              <View style={[styles.waxSeal, { borderColor: cfg.color }]}>
                <Text style={[styles.waxText, { color: cfg.color }]}>CODE</Text>
                <Text style={[styles.waxCode, { color: cfg.color }]}>{deliveryCode}</Text>
              </View>
            )}

            {/* Flèche tracking */}
            {canTrack && (
              <TouchableOpacity onPress={handleArrowPress} style={styles.trackButton}>
                <Text style={[styles.trackButtonText, { color: cfg.color }]}>SUIVRE ↗</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Perforations bas */}
          <View style={styles.holesBottom}>
            {Array.from({ length: 8 }).map((_, i) => (
              <View key={i} style={styles.hole} />
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const HOLE_SIZE = 14;
const CARD_PAD = 20;

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  ticket: {
    backgroundColor: '#FAFAF9', // stone-50
    borderRadius: 20,
    overflow: 'hidden',
    // Ombre papier
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },

  /* ── Perforations ───────────────────────────────────────────── */
  holesTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: -HOLE_SIZE / 2,
    zIndex: 2,
  },
  holesBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: -HOLE_SIZE / 2,
    zIndex: 2,
  },
  hole: {
    width: HOLE_SIZE,
    height: HOLE_SIZE,
    borderRadius: HOLE_SIZE / 2,
    backgroundColor: '#F5F5F4', // match screen bg
  },

  /* ── Top Section ────────────────────────────────────────────── */
  topSection: {
    flexDirection: 'row',
    padding: CARD_PAD,
    paddingTop: CARD_PAD + HOLE_SIZE / 2,
  },
  gateColumn: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  gateLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  gateCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  gateNumber: {
    fontSize: 22,
    fontWeight: '900',
  },
  gateStatus: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  infoColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1C1917',
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  productMeta: {
    fontSize: 13,
    fontWeight: '700',
    color: '#44403C',
    marginTop: 6,
  },
  deliveryFee: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78716C',
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },

  /* ── Tear Line ──────────────────────────────────────────────── */
  tearLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: CARD_PAD,
    marginVertical: 4,
  },
  tearDash: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#E7E5E4',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#D6D3D1',
  },
  tearIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    borderWidth: 2,
    borderColor: '#E7E5E4',
  },

  /* ── Bottom Section ─────────────────────────────────────────── */
  bottomSection: {
    padding: CARD_PAD,
    paddingTop: 8,
    paddingBottom: CARD_PAD + HOLE_SIZE / 2,
  },
  routeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routePoint: {
    width: 80,
    alignItems: 'flex-start',
  },
  routePointRight: {
    alignItems: 'flex-end',
  },
  routeCode: {
    fontSize: 10,
    fontWeight: '900',
    color: '#A8A29E',
    letterSpacing: 1,
    marginBottom: 2,
  },
  routeName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#292524',
    maxWidth: 80,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },

  /* Track */
  routeTrack: {
    flex: 1,
    height: 24,
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  trackBg: {
    height: 3,
    backgroundColor: '#E7E5E4',
    borderRadius: 2,
  },
  trackFill: {
    position: 'absolute',
    height: 3,
    borderRadius: 2,
    left: 0,
  },
  truckIcon: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -11,
    top: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },

  /* ── Wax Seal ───────────────────────────────────────────────── */
  waxSeal: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
    transform: [{ rotate: '-12deg' }],
  },
  waxText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  waxCode: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 2,
  },

  /* ── Track Button ───────────────────────────────────────────── */
  trackButton: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E7E5E4',
  },
  trackButtonText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});