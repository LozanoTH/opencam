import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MODES } from '../constants/camera';

const { width } = Dimensions.get('window');

interface ModeSelectorProps {
    activeMode: string;
    onModeChange: (mode: string) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ activeMode, onModeChange }) => {
    return (
        <View style={styles.modeContainer}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.modeScroll}
            >
                {MODES.map(mode => (
                    <TouchableOpacity
                        key={mode}
                        onPress={() => onModeChange(mode)}
                        style={styles.modeItem}
                    >
                        <Text style={[styles.modeText, activeMode === mode && styles.activeModeText]}>
                            {mode}
                        </Text>
                        {activeMode === mode && <View style={styles.activeDot} />}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    modeContainer: {
        height: 50,
        marginBottom: 20,
    },
    modeScroll: {
        paddingHorizontal: width / 2 - 40,
        alignItems: 'center',
    },
    modeItem: {
        marginHorizontal: 15,
        alignItems: 'center',
    },
    modeText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    activeModeText: {
        color: '#fff',
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#8AB4F8',
        marginTop: 4,
    },
});
