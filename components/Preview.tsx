import { RotateCcw } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PreviewProps {
    uri: string;
    onReset: () => void;
    onSave: () => void;
}

export const Preview: React.FC<PreviewProps> = ({ uri, onReset, onSave }) => {
    const isVideo = uri.endsWith('.mp4') || uri.endsWith('.mov');

    return (
        <View style={styles.container}>
            {isVideo ? (
                <View style={styles.videoPlaceholder}>
                    <Text style={styles.videoText}>Vídeo Grabado</Text>
                    <Text style={styles.uriText}>{uri.split('/').pop()}</Text>
                </View>
            ) : (
                <Image source={{ uri }} style={styles.preview} />
            )}
            <View style={styles.overlay}>
                <Text style={styles.overlayText}>
                    {isVideo ? 'Vídeo Listo' : 'Post-Procesado: Filtros de style.xml'}
                </Text>
            </View>
            <View style={styles.previewControls}>
                <TouchableOpacity style={styles.previewBtn} onPress={onReset}>
                    <RotateCcw color="#fff" size={28} />
                    <Text style={styles.previewBtnText}>Descartar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.previewBtn, styles.saveBtn]} onPress={onSave}>
                    <Text style={[styles.previewBtnText, { fontWeight: 'bold' }]}>Guardar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    preview: {
        flex: 1,
        resizeMode: 'cover',
    },
    videoPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#111',
    },
    videoText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    uriText: {
        color: '#8AB4F8',
        fontSize: 12,
        marginTop: 10,
    },
    overlay: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
    },
    overlayText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    previewControls: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    previewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        gap: 8,
    },
    saveBtn: {
        backgroundColor: '#8AB4F8',
    },
    previewBtnText: {
        color: '#fff',
        fontSize: 16,
    },
});
