import { View, Text, Image, TouchableOpacity, Animated, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// import { Colors, Radius, Spacing, Typography } from '../../../src/theme/colors';
import { Colors } from '../../../src/theme/colors';
import { Radius, Spacing, Typography } from '../../../src/theme/typography';
import { Fonte } from '../../../src/theme/fonts';
import Icone from '../../../src/components/Icone';

interface RegistoHeaderProps {
    isAnunciante: boolean;
    corPrincipal: string;
    gradiente: readonly [string, string];
    progressoAnim: Animated.Value;
    progresso: number;
    onVoltar: () => void;
}

export function RegistoHeader({
    isAnunciante,
    corPrincipal,
    gradiente,
    progressoAnim,
    progresso,
    onVoltar,
}: RegistoHeaderProps) {
    return (
        <>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.botaoVoltar} onPress={onVoltar} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={22} color={Colors.textoPrincipal} />
                </TouchableOpacity>

                <View style={[styles.papelBadge, { backgroundColor: `${corPrincipal}15` }]}>
                    <Icone name={isAnunciante ? 'home-account' : 'account-search'} size={12} color={corPrincipal} />
                    <Text style={[styles.papelBadgeText, { color: corPrincipal }]}>
                        {isAnunciante ? 'ANUNCIANTE' : 'PROCURADOR'}
                    </Text>
                </View>

                <View style={styles.headerLogo}>
                    {/* <Image source={require('../../assets/logo.png')} style={styles.headerLogoImage} resizeMode="contain" /> */}
                    <Image source={require('../../../assets/logo.png')} style={styles.headerLogoImage} resizeMode="contain" />
                </View>
            </View>

            {/* Barra de progresso */}
            <View style={styles.progressoContainer}>
                <View style={styles.progressoTrack}>
                    <Animated.View
                        style={[
                            styles.progressoFill,
                            {
                                width: progressoAnim.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: ['0%', '100%'],
                                }),
                            },
                        ]}
                    >
                        <LinearGradient colors={gradiente} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                    </Animated.View>
                </View>
                <Text style={styles.progressoTexto}>{Math.round(progresso)}% completo</Text>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.sm,
    },
    botaoVoltar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.fundoSuave,
    },
    papelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: Radius.full,
        gap: 4,
    },
    papelBadgeText: {
        ...Typography.captionBold,
        letterSpacing: 0.5,
        fontSize: 10,
    },
    progressoContainer: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.bordaSubtil,
    },
    progressoTrack: {
        height: 4,
        backgroundColor: Colors.fundoInput,
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressoFill: {
        height: '100%',
        borderRadius: 2,
    },
    progressoTexto: {
        ...Typography.caption,
        color: Colors.textoSecundario,
        textAlign: 'right',
        fontFamily: Fonte.corpoSemi,
    },
    headerLogo: {
        width: 92,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerLogoImage: {
        width: 88,
        height: 34,
    },
});