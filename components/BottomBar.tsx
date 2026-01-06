import { Image as ImageIcon, RotateCcw } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

interface BottomBarProps {
    onCapture: () => void;
    onToggleFacing: () => void;
    onOpenGallery: () => void;
    isProcessing: boolean;
    isRecording: boolean;
    mode: string;
}

export const BottomBar: React.FC<BottomBarProps> = ({
    onCapture, onToggleFacing, onOpenGallery, isProcessing, isRecording, mode
}) => {
    const isVideoMode = mode === 'Vídeo';
    return (
        <View style={styles.shutterBar}>
            <TouchableOpacity style={styles.galleryShortcut} onPress={onOpenGallery}>
                <ImageIcon color="#fff" size={24} />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.shutterOuter, isVideoMode && styles.shutterOuterVideo]}
                onPress={onCapture}
                disabled={isProcessing}
            >
                <View style={[
                    styles.shutterInner,
                    isVideoMode && styles.shutterInnerVideo,
                    isRecording && styles.shutterRecording
                ]}>
                    {isProcessing && <ActivityIndicator color="#000" />}
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchBtn} onPress={onToggleFacing}>
                <RotateCcw color="#fff" size={24} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    shutterBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    shutterOuter: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
    },
    shutterOuterVideo: {
        borderColor: 'rgba(255,0,0,0.5)',
    },
    shutterInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shutterInnerVideo: {
        backgroundColor: '#ff4444',
    },
    shutterRecording: {
        width: 40,
        height: 40,
        borderRadius: 8,
    },
    galleryShortcut: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#202124',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#3c4043',
    },
    switchBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#202124',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
