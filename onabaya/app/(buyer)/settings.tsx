import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { User, ShieldCheck, Bell, Key, LogOut } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { fetchCurrentUserAction } from '@/providers/auth/authProviderAction';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { user, isLoading } = useAppSelector((state) => state.auth);

    // Charge les données à l'ouverture de l'écran si le token est présent
    useEffect(() => {
        dispatch(fetchCurrentUserAction());
    }, [dispatch]);

    // Extraction du nom à afficher et génération des initiales
    const displayName = user ? `${user.name.toUpperCase()} ${user.last_name || ''}` : 'Utilisateur';
    const initiales = user ? `${user.name[0]}${user.last_name ? user.last_name[0] : ''}`.toUpperCase() : 'UI';

    // const handleLogout = () => {
    //     dispatch(logoutAction());
    //     router.replace('/auth/login');
    // };

    return (
        <SafeAreaView style={styles.container}>
            {isLoading && !user ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1D9E75" />
                </View>
            ) : (
                <View style={styles.content}>
                    {/* Avatar avec initiales et badge de vérification */}
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>{initiales}</Text>
                        </View>
                        {user?.id_verified_at && (
                            <View style={styles.verifiedBadge}>
                                <ShieldCheck size={16} color="#1D9E75" fill="#FFFFFF" />
                            </View>
                        )}
                    </View>

                    {/* Nom de l'utilisateur connecté */}
                    <Text style={styles.userName}>{displayName}</Text>

                    {/* Menu d'options conforme à la maquette Android Compact - 5.png */}
                    <View style={styles.menuContainer}>
                        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                            <View style={styles.iconWrapper}>
                                <User size={22} color="#000000" />
                            </View>
                            <Text style={styles.menuLabel}>Modifier mon profil</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                            <View style={styles.iconWrapper}>
                                <ShieldCheck size={22} color="#000000" />
                            </View>
                            <Text style={styles.menuLabel}>Vérification d'identité</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                            <View style={styles.iconWrapper}>
                                <Bell size={22} color="#000000" />
                            </View>
                            <Text style={styles.menuLabel}>Notifications</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                            <View style={styles.iconWrapper}>
                                <Key size={22} color="#000000" />
                            </View>
                            <Text style={styles.menuLabel}>Changer le mot de passe</Text>
                        </TouchableOpacity>

                        {/* Option de déconnexion supplémentaire */}
                        {/* <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout} activeOpacity={0.7}> */}
                        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} activeOpacity={0.7}>
                            <View style={[styles.iconWrapper, { backgroundColor: '#FCE8E6' }]}>
                                <LogOut size={22} color="#D32F2F" />
                            </View>
                            <Text style={[styles.menuLabel, { color: '#D32F2F' }]}>Déconnexion</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    content: { flex: 1, alignItems: 'center', paddingTop: 40, paddingHorizontal: 24 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    avatarContainer: { position: 'relative', marginBottom: 16 },
    avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#C3E4A4', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 36, fontWeight: '700', color: '#000000', letterSpacing: 1 },
    verifiedBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 1 },
    userName: { fontSize: 20, fontWeight: '600', color: '#000000', marginBottom: 32 },
    menuContainer: { width: '100%', gap: 14 },
    menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F0F0F0', borderRadius: 16, padding: 16 },
    iconWrapper: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    menuLabel: { fontSize: 16, fontWeight: '500', color: '#000000' },
    logoutItem: { borderColor: '#FCE8E6', marginTop: 10 },
});