import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS, FONT, SPACING } from '@/hooks/theme';

interface SectionHeaderProps {
  title: string;
  count?: number;
  accentColor?: string;
}

const { width: SCREEN_W } = Dimensions.get('window');

export default function SectionHeader({ title, count, accentColor }: SectionHeaderProps) {
  const tapeColor = accentColor ?? COLORS.primary ?? '#F59E0B';

  return (
    <View style={styles.wrapper}>
      {/* Le ruban principal, légèrement incliné */}
      <View style={[styles.tape, { backgroundColor: tapeColor + '22' /* 13% opacity */ }]}>
        {/* Texture de "fibres" du ruban adhésif */}
        <View style={styles.tapeTexture} />

        {/* Le titre, légèrement penché comme écrit à la main */}
        <View style={styles.tapeContent}>
          <Text style={[styles.title, { color: tapeColor }]} numberOfLines={1}>
            {title.toUpperCase()}
          </Text>

          {/* Le compteur = petit sticker rond qui dépasse du ruban */}
          {typeof count === 'number' && (
            <View style={[styles.sticker, { backgroundColor: tapeColor }]}>
              <Text style={styles.stickerText}>{count}</Text>
              {/* Petit reflet sur le sticker */}
              <View style={styles.stickerShine} />
            </View>
          )}
        </View>

        {/* Effet "pli" au centre du ruban */}
        <View style={[styles.fold, { backgroundColor: tapeColor + '18' }]} />
      </View>

      {/* Ligne de séparation "déchirée" en dessous */}
      <View style={styles.tearLine}>
        {Array.from({ length: 24 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.tearBit,
              { backgroundColor: i % 2 === 0 ? '#E7E5E4' : 'transparent' },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    // Laisse de l'espace pour la rotation
    paddingVertical: 6,
  },

  /* ── Le ruban adhésif ───────────────────────────────────────── */
  tape: {
    marginHorizontal: SPACING.md - 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 2,
    transform: [{ rotate: '-1.5deg' }],
    // Bords légèrement irréguliers simulés par l'overflow
    overflow: 'hidden',
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255,255,255,0.4)',
    borderRightWidth: 3,
    borderRightColor: 'rgba(0,0,0,0.03)',
  },
  tapeTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
    // Simule la texture fibreuse du washi tape
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    borderStyle: 'dashed',
  },
  tapeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    transform: [{ rotate: '0.5deg' }], // contre-rotation subtile du texte
  },
  title: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    flex: 1,
  },

  /* ── Le sticker compteur ────────────────────────────────────── */
  sticker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    // Ombre du sticker qui dépasse
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    transform: [{ rotate: '8deg' }],
  },
  stickerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  stickerShine: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
    transform: [{ rotate: '-20deg' }],
  },

  /* ── Le pli au milieu du ruban ──────────────────────────────── */
  fold: {
    position: 'absolute',
    left: '45%',
    right: '45%',
    top: 0,
    bottom: 0,
  },

  /* ── Ligne déchirée en dessous ──────────────────────────────── */
  tearLine: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: 8,
    height: 3,
    overflow: 'hidden',
  },
  tearBit: {
    width: 8,
    height: 3,
    borderRadius: 1.5,
  },
});