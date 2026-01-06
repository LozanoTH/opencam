import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ZoomControlsProps {
    zoom: number;
    onZoomChange: (val: number) => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({ zoom, onZoomChange }) => {
    // Expo Camera zoom is between 0 and 1.
    // We map 0.6x to 0 (default), 1x to 0.1, and 2x to 0.5 for visible effect.
    const ZOOM_LEVELS = [
        { label: '0.6', val: 0 },
        { label: '1', val: 0.15 },
        { label: '2', val: 0.5 }
    ];

    return (
        <View style={styles.zoomContainer}>
            <View style={styles.zoomPills}>
                {ZOOM_LEVELS.map(level => (
                    <TouchableOpacity
                        key={level.label}
                        onPress={() => onZoomChange(level.val)}
                        style={[styles.zoomPill, zoom === level.val && styles.activeZoomPill]}
                    >
                        <Text style={[styles.zoomText, zoom === level.val && styles.activeZoomText]}>
                            {level.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    zoomContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    zoomPills: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 24,
        padding: 4,
    },
    zoomPill: {
        width: 40,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 2,
    },
    activeZoomPill: {
        backgroundColor: '#fff',
    },
    zoomText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    activeZoomText: {
        color: '#000',
    },
});
