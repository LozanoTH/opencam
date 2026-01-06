import Slider from '@react-native-community/slider';
import { CameraView } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Download, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

import { BottomBar } from '../components/BottomBar';
import { ModeSelector } from '../components/ModeSelector';
import { Preview } from '../components/Preview';
import { TopBar } from '../components/TopBar';
import { ZoomControls } from '../components/ZoomControls';
import { useCamera } from '../hooks/useCamera';
import { applyFilters, FilterSettings, parseStyleXml, serializeStyleXml } from '../utils/filterEngine';

export default function HomeScreen() {
    const {
        permission,
        hasMediaLibraryPermission,
        cameraRef,
        flash,
        zoom,
        facing,
        ratio,
        timer,
        isCountingDown,
        isRecording,
        recordingDuration,
        setZoom,
        setRatio,
        setTimer,
        toggleFlash,
        toggleFacing,
        takePictureWithTimer,
        startRecording,
        stopRecording,
    } = useCamera();

    const [processedPhoto, setProcessedPhoto] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeMode, setActiveMode] = useState('Foto');
    const [countdown, setCountdown] = useState(0);
    const [isSettingsVisible, setIsSettingsVisible] = useState(false);
    const [filterSettings, setFilterSettings] = useState<FilterSettings>({
        brightness: 0,
        saturation: 1,
        contrast: 1,
        rotation: 0,
        compress: 0.9,
        preset: 'default'
    });

    // Cargar ajustes iniciales desde style.xml
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const fs = FileSystem as any;
                const xmlPath = fs.documentDirectory ? fs.documentDirectory + 'style.xml' : '';
                const xmlContent = await FileSystem.readAsStringAsync(xmlPath);
                setFilterSettings(parseStyleXml(xmlContent));
            } catch (e) {
                // Si no existe, usamos los valores por defecto
            }
        };
        loadSettings();
    }, []);

    const fadeAnim = useRef(new Animated.Value(1)).current;

    const handleCapture = async () => {
        if (isProcessing) return;

        if (activeMode === 'Vídeo') {
            if (isRecording) {
                await stopRecording();
            } else {
                const video = await startRecording();
                if (video) {
                    setProcessedPhoto(video.uri);
                }
            }
            return;
        }

        if (timer > 0) {
            let timeLeft = timer;
            setCountdown(timeLeft);
            const interval = setInterval(() => {
                timeLeft -= 1;
                setCountdown(timeLeft);
                if (timeLeft <= 0) {
                    clearInterval(interval);
                    setCountdown(0);
                }
            }, 1000);
        }

        const photo = await takePictureWithTimer();
        if (photo) {
            setIsProcessing(true);

            // Flash animation
            Animated.sequence([
                Animated.timing(fadeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
            ]).start();

            try {
                // Solo aplicamos filtros en modo Foto y Retrato
                if (activeMode === 'Foto' || activeMode === 'Retrato') {
                    const result = await applyFilters(photo.uri, filterSettings);
                    setProcessedPhoto(result.uri);
                } else {
                    setProcessedPhoto(photo.uri);
                }
            } catch (error) {
                Alert.alert("Error", "No se pudo procesar la imagen.");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleSave = async () => {
        if (processedPhoto) {
            try {
                await MediaLibrary.saveToLibraryAsync(processedPhoto);
                Alert.alert("Éxito", "¡Imagen guardada en la galería!");
                setProcessedPhoto(null);
            } catch (error) {
                Alert.alert("Error", "No se pudo guardar la imagen.");
            }
        }
    };

    const handleOpenGallery = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled) {
                // We could also apply filters to gallery images if desired
                setProcessedPhoto(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert("Error", "No se pudo abrir la galería.");
        }
    };

    if (!permission || hasMediaLibraryPermission === null) {
        return <View style={styles.container} />;
    }

    if (!permission.granted || !hasMediaLibraryPermission) {
        return (
            <View style={styles.centered}>
                <Text style={styles.infoText}>Faltan permisos</Text>
            </View>
        );
    }

    // Calculate camera height based on ratio
    const screenWidth = width - 16;
    let cameraHeight = screenWidth * (4 / 3); // Default 4:3
    if (ratio === '16:9') {
        cameraHeight = screenWidth * (16 / 9);
    } else if (ratio === '1:1') {
        cameraHeight = screenWidth;
    }

    if (processedPhoto) {
        return (
            <Preview
                uri={processedPhoto}
                onReset={() => setProcessedPhoto(null)}
                onSave={handleSave}
            />
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.topSpacer} />
            <Animated.View style={[
                styles.cameraContainer,
                {
                    opacity: fadeAnim,
                    height: cameraHeight,
                    maxHeight: height - 260 // Ensure it doesn't overlap the bottom section
                }
            ]}>
                <CameraView
                    style={styles.camera}
                    ref={cameraRef}
                    facing={facing}
                    flash={flash}
                    zoom={zoom}
                    ratio={ratio as any}
                    mode={activeMode === 'Vídeo' ? 'video' : 'picture'}
                >
                    <TopBar
                        flash={flash}
                        timer={timer}
                        ratio={ratio}
                        onToggleFlash={toggleFlash}
                        onToggleTimer={setTimer}
                        onToggleRatio={setRatio}
                        onOpenSettings={() => setIsSettingsVisible(true)}
                    />

                    {countdown > 0 && (
                        <View style={styles.countdownContainer}>
                            <Text style={styles.countdownText}>{countdown}</Text>
                        </View>
                    )}

                    {isRecording && (
                        <View style={styles.recordingTimerContainer}>
                            <View style={styles.recordingDot} />
                            <Text style={styles.recordingTimerText}>
                                {new Date(recordingDuration * 1000).toISOString().substr(14, 5)}
                            </Text>
                        </View>
                    )}

                    <ZoomControls zoom={zoom} onZoomChange={setZoom} />
                </CameraView>
            </Animated.View>

            <View style={styles.bottomSection}>
                <ModeSelector activeMode={activeMode} onModeChange={setActiveMode} />
                <BottomBar
                    onCapture={handleCapture}
                    onToggleFacing={toggleFacing}
                    onOpenGallery={handleOpenGallery}
                    isProcessing={isProcessing}
                    isRecording={isRecording}
                    mode={activeMode}
                />
            </View>

            <Modal
                visible={isSettingsVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsSettingsVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.settingsModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Ajustes de Filtro</Text>
                            <TouchableOpacity onPress={() => setIsSettingsVisible(false)}>
                                <X color="#fff" size={24} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.settingsList}>
                            <SettingSlider
                                label="Brillo"
                                value={filterSettings.brightness}
                                min={-1}
                                max={1}
                                step={0.1}
                                onValueChange={(v: number) => setFilterSettings({ ...filterSettings, brightness: v })}
                            />
                            <SettingSlider
                                label="Saturación"
                                value={filterSettings.saturation}
                                min={0}
                                max={2}
                                step={0.1}
                                onValueChange={(v: number) => setFilterSettings({ ...filterSettings, saturation: v })}
                            />
                            <SettingSlider
                                label="Contraste"
                                value={filterSettings.contrast}
                                min={0.5}
                                max={2}
                                step={0.1}
                                onValueChange={(v: number) => setFilterSettings({ ...filterSettings, contrast: v })}
                            />
                            <SettingSlider
                                label="Compresión"
                                value={filterSettings.compress}
                                min={0.1}
                                max={1}
                                step={0.05}
                                onValueChange={(v: number) => setFilterSettings({ ...filterSettings, compress: v })}
                            />
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.exportBtn}
                            onPress={async () => {
                                try {
                                    const xml = serializeStyleXml(filterSettings);
                                    const fs = FileSystem as any;
                                    const path = (fs.cacheDirectory || fs.documentDirectory) + 'style.xml';
                                    await FileSystem.writeAsStringAsync(path, xml);
                                    await Sharing.shareAsync(path, {
                                        mimeType: 'application/xml',
                                        dialogTitle: 'Exportar style.xml',
                                        UTI: 'public.xml'
                                    });
                                } catch (error) {
                                    Alert.alert("Error", "No se pudo exportar el archivo.");
                                }
                            }}
                        >
                            <Download color="#000" size={20} />
                            <Text style={styles.exportBtnText}>Exportar style.xml</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function SettingSlider({ label, value, min, max, step, onValueChange }: any) {
    return (
        <View style={styles.settingItem}>
            <View style={styles.settingLabelRow}>
                <Text style={styles.settingLabel}>{label}</Text>
                <Text style={styles.settingValue}>{value.toFixed(2)}</Text>
            </View>
            <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={min}
                maximumValue={max}
                step={step}
                value={value}
                onValueChange={onValueChange}
                minimumTrackTintColor="#8AB4F8"
                maximumTrackTintColor="rgba(255,255,255,0.2)"
                thumbTintColor="#8AB4F8"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    topSpacer: {
        height: 40,
    },
    cameraContainer: {
        borderRadius: 24,
        overflow: 'hidden',
        marginHorizontal: 8,
        backgroundColor: '#111',
        justifyContent: 'center',
    },
    camera: {
        flex: 1,
    },
    bottomSection: {
        height: 220,
        backgroundColor: '#000',
        justifyContent: 'center',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    infoText: {
        color: '#fff',
        fontSize: 18,
    },
    countdownContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countdownText: {
        color: '#fff',
        fontSize: 120,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 10,
    },
    recordingTimerContainer: {
        position: 'absolute',
        top: 20,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ff4444',
        marginRight: 8,
    },
    recordingTimerText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'monospace',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    settingsModal: {
        backgroundColor: '#1c1c1e',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    settingsList: {
        marginBottom: 20,
    },
    settingItem: {
        marginBottom: 16,
    },
    settingLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    settingLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
    },
    settingValue: {
        color: '#8AB4F8',
        fontSize: 14,
        fontWeight: 'bold',
    },
    exportBtn: {
        backgroundColor: '#8AB4F8',
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    exportBtnText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
