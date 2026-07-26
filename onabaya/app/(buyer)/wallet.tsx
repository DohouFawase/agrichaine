import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  SafeAreaView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  FlatList,
  Animated,
  Dimensions,
  LayoutAnimation,
  UIManager,
  Alert,
} from 'react-native';
import {
  ArrowDownLeft,
  History,
  Plus,
  X,
  CheckCircle2,
  CreditCard,
  Smartphone,
  AlertCircle,
  RotateCcw,
  ChevronRight,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldCheck,
  Receipt,
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import {
  FetchWalletAction,
  initiateWalletTopUp,
  checkWalletTopUpStatus,
  initiateWalletWithdrawal,
  checkWalletWithdrawalStatus,
  fetchWalletTransactions,
  WalletTransactionItem,
} from '@/providers/users/walletProviderAction';

const { width: SCREEN_W } = Dimensions.get('window');
const MOMO_POLL_INTERVAL = 3_000;
const MOMO_MAX_ATTEMPTS = 20;

type MomoMode = 'topup' | 'withdraw';
type MomoStep = 'form' | 'waiting' | 'success' | 'failed';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const useAnimatedValue = (initial: number) => useRef(new Animated.Value(initial)).current;

// ── Hook : Logique MoMo isolée ──────────────────────────────────────────
function useMomoFlow(loadWalletData: () => void) {
  const dispatch = useAppDispatch();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptsRef = useRef(0);

  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<MomoMode>('topup');
  const [step, setStep] = useState<MomoStep>('form');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [environment, setEnvironment] = useState<'sandbox' | 'production' | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    setStep('form');
    setPhone('');
    setAmount('');
    setError(null);
    setEnvironment(null);
    setIsSubmitting(false);
    attemptsRef.current = 0;
  }, [stopPolling]);

  const open = useCallback((m: MomoMode) => {
    setMode(m);
    reset();
    setShowModal(true);
  }, [reset]);

  const close = useCallback(() => {
    stopPolling();
    Keyboard.dismiss();
    setShowModal(false);
    reset();
  }, [stopPolling, reset]);

  const submit = useCallback(async (balance?: number) => {
    const numAmount = Number(amount);
    const minAmount = mode === 'topup' ? 100 : 500;

    if (!phone || phone.trim().length < 8) {
      setError('Numéro de téléphone invalide.');
      return;
    }
    if (!numAmount || numAmount < minAmount) {
      setError(`Montant minimum : ${minAmount} FCFA.`);
      return;
    }
    if (mode === 'withdraw' && balance !== undefined && numAmount > balance) {
      setError('Montant supérieur à votre solde disponible.');
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setError(null);
    setIsSubmitting(true);
    Keyboard.dismiss();

    const action = mode === 'topup' ? initiateWalletTopUp : initiateWalletWithdrawal;
    const result = await dispatch(action({ phone, amount: numAmount }));
    setIsSubmitting(false);

    if (!action.fulfilled.match(result)) {
      setError((result.payload as string) ?? 'Impossible d\'initier l\'opération.');
      return;
    }

    const reference = result.payload.reference;
    setEnvironment(result.payload.environment);
    setStep('waiting');
    attemptsRef.current = 0;

    const statusAction = mode === 'topup' ? checkWalletTopUpStatus : checkWalletWithdrawalStatus;

    pollingRef.current = setInterval(async () => {
      attemptsRef.current += 1;
      const statusResult = await dispatch(statusAction(reference));

      if (statusAction.fulfilled.match(statusResult)) {
        const status = statusResult.payload.status;
        if (status === 'successful') {
          stopPolling();
          LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
          setStep('success');
          loadWalletData();
        } else if (status === 'failed') {
          stopPolling();
          LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
          setStep('failed');
        }
      } else {
        stopPolling();
        setError((statusResult.payload as string) ?? 'Erreur lors de la vérification.');
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        setStep('failed');
      }

      if (attemptsRef.current >= MOMO_MAX_ATTEMPTS) {
        stopPolling();
        setError('Délai dépassé. Vérifiez votre historique avant de réessayer.');
        setStep('failed');
      }
    }, MOMO_POLL_INTERVAL);
  }, [dispatch, mode, phone, amount, stopPolling, loadWalletData]);

  return {
    showModal, mode, step, phone, setPhone, amount, setAmount,
    error, isSubmitting, environment,
    open, close, submit, reset,
  };
}

// ── Hook : Historique paginé ────────────────────────────────────────────
function useWalletHistory() {
  const dispatch = useAppDispatch();
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState<WalletTransactionItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const open = useCallback(async () => {
    setShowModal(true);
    setItems([]);
    setPage(1);
    setHasMore(true);
    await loadPage(1, true);
  }, []);

  const loadPage = useCallback(async (p: number, reset = false) => {
    if (loading) return;
    setLoading(true);
    const result = await dispatch(fetchWalletTransactions(p));
    if (fetchWalletTransactions.fulfilled.match(result)) {
      setItems((prev) => (reset ? result.payload.data : [...prev, ...result.payload.data]));
      setHasMore(result.payload.meta.has_more);
      setPage(p);
    }
    setLoading(false);
  }, [dispatch, loading]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) loadPage(page + 1);
  }, [loading, hasMore, page, loadPage]);

  return { showModal, setShowModal, items, loading, hasMore, open, loadMore };
}

// ── Composant : Carte Solde Flip ────────────────────────────────────────
function BalanceCard({ balance, currency, isLoading }: { balance?: number; currency: string; isLoading: boolean }) {
  const [flipped, setFlipped] = useState(false);
  const flipAnim = useAnimatedValue(0);

  const formatCurrency = (amount: number | undefined | null, symbol: string) => {
    const safeAmount = amount ?? 0;
    const formatted = safeAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const displaySymbol = symbol === 'XOF' ? 'F' : symbol;
    return `${formatted} ${displaySymbol}`;
  };

  const handleFlip = () => {
    const toValue = flipped ? 0 : 1;
    Animated.spring(flipAnim, { toValue, friction: 8, tension: 40, useNativeDriver: true }).start();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFlipped(!flipped);
  };

  const frontInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const frontOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] });
  const backOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });

  return (
    <TouchableOpacity activeOpacity={0.95} onPress={handleFlip} style={styles.cardTouchable}>
      <Animated.View style={[styles.cardFace, { transform: [{ rotateY: frontInterpolate }], opacity: frontOpacity }]}>
        <View style={styles.cardGradient}>
          <View style={styles.cardTopRow}>
            <View style={styles.chip}><View style={styles.chipInner} /></View>
            <Wallet size={24} color="rgba(255,255,255,0.8)" />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardLabel}>SOLDE DISPONIBLE</Text>
            {isLoading && balance === undefined ? (
              <ActivityIndicator color="#FFF" size="small" style={{ marginTop: 8 }} />
            ) : (
              <Text style={styles.cardBalance}>{formatCurrency(balance, currency)}</Text>
            )}
          </View>
          <View style={styles.cardBottom}>
            <Text style={styles.cardHint}>Appuyez pour les détails</Text>
            <View style={styles.cardLogo}><Text style={styles.cardLogoText}>MoMo</Text></View>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.cardFace, styles.cardBack, { transform: [{ rotateY: backInterpolate }], opacity: backOpacity }]}>
        <View style={[styles.cardGradient, { backgroundColor: '#145A43' }]}>
          <View style={styles.cardBackContent}>
            <Text style={styles.cardBackTitle}>Détails du compte</Text>
            <View style={styles.cardBackRow}>
              <Text style={styles.cardBackLabel}>Type</Text>
              <Text style={styles.cardBackValue}>Portefeuille Mobile Money</Text>
            </View>
            <View style={styles.cardBackRow}>
              <Text style={styles.cardBackLabel}>Devise</Text>
              <Text style={styles.cardBackValue}>{currency === 'XOF' ? 'Franc CFA (XOF)' : currency}</Text>
            </View>
            <View style={styles.cardBackRow}>
              <Text style={styles.cardBackLabel}>Statut</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Actif</Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Composant : Attente animée ──────────────────────────────────────────
function WaitingStep({ mode, environment, phone }: { mode: MomoMode; environment: 'sandbox' | 'production' | null; phone: string }) {
  const pulseAnim = useAnimatedValue(1);
  const rotateAnim = useAnimatedValue(0);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 2000, useNativeDriver: true })).start();
  }, []);

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.waitingContainer}>
      <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
      <View style={styles.spinnerContainer}>
        <Animated.View style={[styles.spinnerTrack, { transform: [{ rotate: spin }] }]} />
        <Smartphone size={28} color="#1D9E75" />
      </View>

      {environment === 'sandbox' && (
        <View style={styles.sandboxPill}>
          <Text style={styles.sandboxPillText}>MODE SANDBOX</Text>
        </View>
      )}

      <Text style={styles.waitingTitle}>
        {environment === 'sandbox'
          ? 'Confirmation auto...'
          : mode === 'topup' ? 'Validez sur votre téléphone' : 'Traitement du retrait...'}
      </Text>
      <Text style={styles.waitingDesc}>
        {environment === 'sandbox'
          ? 'Environnement de test : confirmation automatique en cours.'
          : mode === 'topup'
            ? `Demande MoMo envoyée au ${phone}. Confirmez-la.`
            : `Envoi des fonds vers ${phone} en cours.`}
      </Text>
    </View>
  );
}

// ── Composant : Succès animé ────────────────────────────────────────────
function SuccessStep({ mode, amount, currency, phone, onClose }: any) {
  const scaleAnim = useAnimatedValue(0);
  const slideAnim = useAnimatedValue(30);

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();
    Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
  }, []);

  const formatCurrency = (amt: string, sym: string) => {
    const formatted = amt.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formatted} ${sym === 'XOF' ? 'F' : sym}`;
  };

  return (
    <View style={styles.resultContainer}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View style={styles.successCircle}><CheckCircle2 size={40} color="#1D9E75" /></View>
      </Animated.View>
      <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
        <Text style={styles.resultTitle}>{mode === 'topup' ? 'Recharge réussie !' : 'Retrait réussi !'}</Text>
        <Text style={styles.resultAmount}>{formatCurrency(amount, currency)}</Text>
        <Text style={styles.resultSubtitle}>
          {mode === 'topup'
            ? 'Votre portefeuille a été crédité.'
            : `Envoyé vers ${phone}.`}
        </Text>
      </Animated.View>
      <TouchableOpacity style={styles.primaryBtn} onPress={onClose}>
        <Text style={styles.primaryBtnText}>Parfait</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Composant : Échec animé ─────────────────────────────────────────────
function FailedStep({ mode, error, onRetry, onClose }: any) {
  const shakeAnim = useAnimatedValue(0);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.resultContainer}>
      <Animated.View style={[styles.failCircle, { transform: [{ translateX: shakeAnim }] }]}>
        <AlertCircle size={40} color="#E24B4A" />
      </Animated.View>
      <Text style={[styles.resultTitle, { color: '#E24B4A' }]}>
        {mode === 'topup' ? 'Recharge échouée' : 'Retrait échoué'}
      </Text>
      <Text style={styles.resultSubtitle}>{error ?? 'L\'opération n\'a pas pu être confirmée.'}</Text>
      {mode === 'withdraw' && (
        <Text style={[styles.resultSubtitle, { fontSize: 12, marginTop: 4 }]}>
          Si des fonds avaient été débités, ils sont automatiquement recrédités.
        </Text>
      )}
      <View style={styles.failBtnRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
          <Text style={styles.secondaryBtnText}>Fermer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={onRetry}>
          <RotateCcw size={16} color="#FFF" style={{ marginRight: 6 }} />
          <Text style={styles.primaryBtnText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SCREEN PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════
export default function WalletScreen() {
  const dispatch = useAppDispatch();
  const {
    balance, currency, escrow, recent_transactions, isLoading, error
  } = useAppSelector((state) => state.wallet);

  const momo = useMomoFlow(() => dispatch(FetchWalletAction()));
  const history = useWalletHistory();

  const loadWalletData = useCallback(async () => {
    try { await dispatch(FetchWalletAction()); } catch (e) { console.error(e); }
  }, [dispatch]);

  useEffect(() => { loadWalletData(); }, [loadWalletData]);

  const formatCurrency = (amount: number | undefined | null, symbol: string) => {
    const safeAmount = amount ?? 0;
    const formatted = safeAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const displaySymbol = symbol === 'XOF' ? 'F' : symbol;
    return `${formatted} ${displaySymbol}`;
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'credit') return <TrendingUp size={16} color="#1D9E75" />;
    if (type === 'debit') return <TrendingDown size={16} color="#E24B4A" />;
    return <Receipt size={16} color="#666" />;
  };

  const renderHistoryItem = ({ item }: { item: WalletTransactionItem }) => (
    <View style={styles.txCard}>
      <View style={[styles.txIconBg, { backgroundColor: item.display_type === 'credit' ? '#ECFDF5' : '#FEF2F2' }]}>
        {getTransactionIcon(item.display_type)}
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.txDate}>
          {new Date(item.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: item.display_type === 'credit' ? '#1D9E75' : '#111' }]}>
          {item.display_type === 'credit' ? '+' : '-'} {formatCurrency(item.amount, currency)}
        </Text>
        <ChevronRight size={14} color="#CCC" />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />

      {/* HEADER SOMBRE */}
      <View style={styles.darkHeader}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerTopBar}>
            <Text style={styles.headerBrand}>Mon Portefeuille</Text>
            <TouchableOpacity style={styles.headerIconBtn} onPress={history.open}>
              <History size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <BalanceCard balance={balance} currency={currency} isLoading={isLoading} />

          {/* Actions rapides */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.qaBtn} activeOpacity={0.8} onPress={() => momo.open('topup')}>
              <View style={[styles.qaIcon, { backgroundColor: '#1D9E75' }]}>
                <Plus size={20} color="#FFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.qaLabel}>Recharger</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.qaBtn} activeOpacity={0.8} onPress={() => momo.open('withdraw')}>
              <View style={[styles.qaIcon, { backgroundColor: '#3B82F6' }]}>
                <ArrowUpRight size={20} color="#FFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.qaLabel}>Retirer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.qaBtn} activeOpacity={0.8} onPress={history.open}>
              <View style={[styles.qaIcon, { backgroundColor: '#8B5CF6' }]}>
                <Receipt size={18} color="#FFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.qaLabel}>Historique</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* CONTENU SCROLLABLE */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadWalletData} tintColor="#1D9E75" />
        }
      >
        {error && (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color="#E24B4A" />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* SÉQUESTRE */}
        {escrow?.active_orders && escrow.active_orders.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>En séquestre</Text>
              <Text style={styles.sectionAmount}>{formatCurrency(escrow.total_amount, currency)}</Text>
            </View>
            {escrow.active_orders.map((order: any) => (
              <View key={order.order_id} style={styles.escrowCard}>
                <View style={styles.escrowImagePlaceholder}>
                  <Text style={styles.escrowImageText}>📦</Text>
                </View>
                <View style={styles.escrowInfo}>
                  <Text style={styles.escrowProduct} numberOfLines={1}>{order.product_name}</Text>
                  <Text style={styles.escrowMeta}>{order.quantity} {order.unit} · {order.status_label}</Text>
                </View>
                <Text style={styles.escrowPrice}>{formatCurrency(order.display_amount, currency)}</Text>
              </View>
            ))}
          </View>
        ) : !isLoading ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>En séquestre</Text>
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}><ShieldCheck size={24} color="#CCC" /></View>
              <Text style={styles.emptyText}>Aucun fonds bloqué</Text>
            </View>
          </View>
        ) : null}

        {/* TRANSACTIONS RÉCENTES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transactions récentes</Text>
            {recent_transactions && recent_transactions.length > 0 && (
              <TouchableOpacity onPress={history.open}>
                <Text style={styles.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoading && (!recent_transactions || recent_transactions.length === 0) ? (
            <ActivityIndicator color="#1D9E75" style={{ marginTop: 20 }} />
          ) : recent_transactions && recent_transactions.length > 0 ? (
            recent_transactions.map((tx: any) => (
              <View key={tx.id} style={styles.txCard}>
                <View style={[styles.txIconBg, { backgroundColor: tx.display_type === 'credit' ? '#ECFDF5' : '#FEF2F2' }]}>
                  {getTransactionIcon(tx.display_type)}
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txTitle} numberOfLines={1}>{tx.title}</Text>
                  <Text style={styles.txDate}>
                    {new Date(tx.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: tx.display_type === 'credit' ? '#1D9E75' : '#111' }]}>
                    {tx.display_type === 'credit' ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                  </Text>
                  <ChevronRight size={14} color="#CCC" />
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}><Receipt size={24} color="#CCC" /></View>
              <Text style={styles.emptyText}>Aucune transaction</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── MODAL MOMO (RECHARGE/RETRAIT) ─────────────────────────────── */}
      <Modal visible={momo.showModal} transparent animationType="none" onRequestClose={momo.close}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableOpacity style={styles.modalBackdrop} onPress={momo.close} />
              <Animated.View style={styles.modalSheet}>
                <View style={styles.modalHandle} />

                {/* FORMULAIRE */}
                {momo.step === 'form' && (
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <View>
                        <Text style={styles.modalTitle}>
                          {momo.mode === 'topup' ? 'Recharger' : 'Retirer'}
                        </Text>
                        <Text style={styles.modalSubtitle}>
                          {momo.mode === 'topup' ? 'Via MTN Mobile Money' : `Solde: ${formatCurrency(balance, currency)}`}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.closeBtn} onPress={momo.close}>
                        <X size={18} color="#666" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Numéro Mobile Money</Text>
                      <View style={styles.inputBox}>
                        <Smartphone size={18} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                          style={styles.inputField}
                          value={momo.phone}
                          onChangeText={momo.setPhone}
                          keyboardType="phone-pad"
                          placeholder="229 90 00 00 01"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Montant (FCFA)</Text>
                      <View style={styles.inputBox}>
                        <Text style={styles.currencyPrefix}>F</Text>
                        <TextInput
                          style={styles.inputField}
                          value={momo.amount}
                          onChangeText={momo.setAmount}
                          keyboardType="numeric"
                          placeholder={momo.mode === 'topup' ? '5 000' : '1 000'}
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>

                    {/* Montants rapides */}
                    <View style={styles.quickAmounts}>
                      {(momo.mode === 'topup' ? [1000, 2000, 5000, 10000] : [500, 1000, 2000, 5000]).map((amt) => (
                        <TouchableOpacity
                          key={amt}
                          style={[styles.quickAmtBtn, momo.amount === String(amt) && styles.quickAmtBtnActive]}
                          onPress={() => momo.setAmount(String(amt))}
                        >
                          <Text style={[styles.quickAmtText, momo.amount === String(amt) && styles.quickAmtTextActive]}>
                            {amt.toLocaleString()} F
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {momo.error && (
                      <View style={styles.inlineError}>
                        <AlertCircle size={14} color="#E24B4A" />
                        <Text style={styles.inlineErrorText}>{momo.error}</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[styles.primaryBtn, momo.isSubmitting && styles.primaryBtnDisabled]}
                      onPress={() => momo.submit(balance)}
                      disabled={momo.isSubmitting}
                    >
                      {momo.isSubmitting ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text style={styles.primaryBtnText}>
                          {momo.mode === 'topup' ? 'Recharger maintenant' : 'Retirer maintenant'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* ATTENTE */}
                {momo.step === 'waiting' && (
                  <WaitingStep mode={momo.mode} environment={momo.environment} phone={momo.phone} />
                )}

                {/* SUCCÈS */}
                {momo.step === 'success' && (
                  <SuccessStep
                    mode={momo.mode}
                    amount={momo.amount}
                    currency={currency}
                    phone={momo.phone}
                    onClose={momo.close}
                  />
                )}

                {/* ÉCHEC */}
                {momo.step === 'failed' && (
                  <FailedStep
                    mode={momo.mode}
                    error={momo.error}
                    onRetry={momo.reset}
                    onClose={momo.close}
                  />
                )}
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── MODAL HISTORIQUE COMPLET ──────────────────────────────────── */}
      <Modal visible={history.showModal} transparent animationType="slide" onRequestClose={() => history.setShowModal(false)}>
        <View style={styles.historyOverlay}>
          <View style={styles.historySheet}>
            <View style={styles.modalHandle} />
            <View style={styles.historyHeader}>
              <Text style={styles.modalTitle}>Historique complet</Text>
              <TouchableOpacity onPress={() => history.setShowModal(false)} style={styles.closeBtn}>
                <X size={18} color="#666" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={history.items}
              keyExtractor={(item) => item.id}
              renderItem={renderHistoryItem}
              onEndReached={history.loadMore}
              onEndReachedThreshold={0.3}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                !history.loading ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIconBg}><Receipt size={24} color="#CCC" /></View>
                    <Text style={styles.emptyText}>Aucune transaction enregistrée.</Text>
                  </View>
                ) : null
              }
              ListFooterComponent={
                history.loading ? (
                  <ActivityIndicator color="#1D9E75" size="small" style={{ marginVertical: 16 }} />
                ) : !history.hasMore && history.items.length > 0 ? (
                  <Text style={styles.endOfList}>— Fin de l'historique —</Text>
                ) : null
              }
              contentContainerStyle={{ paddingBottom: 24 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },

  // Header sombre
  darkHeader: {
    backgroundColor: '#0F0F0F',
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 8,
  },
  headerBrand: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Carte flip
  cardTouchable: {
    height: 200,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFace: {
    width: SCREEN_W - 40,
    height: 200,
    borderRadius: 24,
    position: 'absolute',
    backfaceVisibility: 'hidden',
    shadowColor: '#1D9E75',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  cardBack: { backgroundColor: '#145A43' },
  cardGradient: {
    flex: 1,
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
    backgroundColor: '#1D9E75',
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: {
    width: 40, height: 28, borderRadius: 6,
    backgroundColor: '#F4D03F', justifyContent: 'center', alignItems: 'center',
  },
  chipInner: { width: 28, height: 20, borderRadius: 4, borderWidth: 1, borderColor: '#D4AC0D' },
  cardBody: { marginTop: 8 },
  cardLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  cardBalance: { color: '#FFF', fontSize: 32, fontWeight: '800', marginTop: 6 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardHint: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  cardLogo: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  cardLogoText: { color: '#FFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  cardBackContent: { flex: 1, justifyContent: 'center', gap: 16 },
  cardBackTitle: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  cardBackRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBackLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  cardBackValue: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
  statusText: { color: '#4ADE80', fontSize: 12, fontWeight: '700' },

  // Quick Actions
  quickActions: { flexDirection: 'row', justifyContent: 'space-around' },
  qaBtn: { alignItems: 'center', gap: 8 },
  qaIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  qaLabel: { color: '#FFF', fontSize: 12, fontWeight: '600' },

  // Scroll content
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, marginBottom: 16 },
  errorBannerText: { color: '#E24B4A', fontSize: 13, flex: 1 },

  // Sections
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111' },
  sectionAmount: { fontSize: 14, fontWeight: '700', color: '#1D9E75' },
  seeAll: { fontSize: 13, fontWeight: '600', color: '#1D9E75' },

  // Escrow
  escrowCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  escrowImagePlaceholder: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  escrowImageText: { fontSize: 20 },
  escrowInfo: { flex: 1 },
  escrowProduct: { fontSize: 14, fontWeight: '700', color: '#111' },
  escrowMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  escrowPrice: { fontSize: 14, fontWeight: '700', color: '#111' },

  // Transactions
  txCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  txIconBg: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
  txDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  txRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  txAmount: { fontSize: 14, fontWeight: '700' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyIconBg: { width: 56, height: 56, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  endOfList: { textAlign: 'center', color: '#CCC', fontSize: 12, marginVertical: 16 },

  // Modal MoMo
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    minHeight: 480,
  },
  modalHandle: { width: 36, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalContent: {},
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#111' },
  modalSubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },

  // Inputs
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 14, height: 52 },
  inputIcon: { marginRight: 10 },
  currencyPrefix: { fontSize: 16, fontWeight: '700', color: '#1D9E75', marginRight: 8 },
  inputField: { flex: 1, fontSize: 16, color: '#111', fontWeight: '600' },

  // Quick amounts
  quickAmounts: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickAmtBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F3F4F6' },
  quickAmtBtnActive: { backgroundColor: '#1D9E75' },
  quickAmtText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  quickAmtTextActive: { color: '#FFF' },

  inlineError: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  inlineErrorText: { color: '#E24B4A', fontSize: 13 },

  // Boutons
  primaryBtn: { backgroundColor: '#1D9E75', borderRadius: 16, height: 54, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', shadowColor: '#1D9E75', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4 },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  secondaryBtn: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 16, height: 54, justifyContent: 'center', alignItems: 'center' },
  secondaryBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },

  // Waiting step
  waitingContainer: { alignItems: 'center', paddingVertical: 40 },
  pulseRing: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(29,158,117,0.1)' },
  spinnerContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  spinnerTrack: { position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#1D9E75', borderTopColor: 'transparent' },
  sandboxPill: { backgroundColor: '#FEF3C7', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  sandboxPillText: { fontSize: 11, fontWeight: '800', color: '#92400E', letterSpacing: 0.5 },
  waitingTitle: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 8, textAlign: 'center' },
  waitingDesc: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },

  // Result steps
  resultContainer: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 10 },
  successCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  failCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  resultTitle: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 4 },
  resultAmount: { fontSize: 28, fontWeight: '800', color: '#1D9E75', marginBottom: 8 },
  resultSubtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  failBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },

  // History modal
  historyOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  historySheet: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingTop: 18, height: '82%' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
});