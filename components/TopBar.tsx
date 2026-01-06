import { FlashMode } from 'expo-camera';
import { ChevronDown, Settings, Timer, Zap } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TopBarProps {
    flash: FlashMode;
    timer: number;
    ratio: string;
    onToggleFlash: () => void;
    onToggleTimer: (val: number) => void;
    onToggleRatio: (val: string) => void;
    onOpenSettings: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
    flash, timer, ratio, onToggleFlash, onToggleTimer, onToggleRatio, onOpenSettings
}) => {
    return (
        <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconBtn} onPress={onOpenSettings}>
                <Settings color="#fff" size={24} />
            </TouchableOpacity>

            <View style={styles.topSettings}>
                <TouchableOpacity style={styles.settingBtn} onPress={onToggleFlash}>
                    <Zap color={flash === 'off' ? '#fff' : '#8AB4F8'} size={20} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingBtn} onPress={() => onToggleTimer(timer === 0 ? 3 : timer === 3 ? 10 : 0)}>
                    <Timer color={timer === 0 ? '#fff' : '#8AB4F8'} size={20} />
                    {timer > 0 && <Text style={styles.timerSub}>{timer}s</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingBtn} onPress={() => onToggleRatio(ratio === '4:3' ? '16:9' : '4:3')}>
                    <Text style={styles.settingText}>{ratio}</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.iconBtn}>
                <ChevronDown color="#fff" size={24} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    topSettings: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 20,
        padding: 4,
    },
    settingBtn: {
        paddingHorizontal: 15,
        paddingVertical: 6,
        alignItems: 'center',
    },
    settingText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    timerSub: {
        color: '#8AB4F8',
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: -4,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
