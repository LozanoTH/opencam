import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Asset } from 'expo-asset';
import { BlurView } from 'expo-blur';
import { CameraType, CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { XMLParser } from 'fast-xml-parser';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Button, Dimensions, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


const { width, height } = Dimensions.get('window');

/**
 * Genera una matriz de color 4x5 basada en los filtros avanzados del XML
 * Expo Image Manipulator usa un array de 20 elementos.
 */
function createColorMatrix(config: any) {
    const { saturation, contrast, rgb } = config;

    // Matriz de Identidad Base
    let matrix = [
        1, 0, 0, 0, 0,
        0, 1, 0, 0, 0,
        0, 0, 1, 0, 0,
        0, 0, 0, 1, 0
    ];

    // 1. Aplicar Escala RGB
    matrix[0] *= rgb.red;
    matrix[6] *= rgb.green;
    matrix[12] *= rgb.blue;

    // 2. Aplicar Saturación (Pesos luma estándar)
    const rw = 0.3086, gw = 0.6094, bw = 0.0820;
    const invS = 1 - saturation;
    const rL = rw * invS, gL = gw * invS, bL = bw * invS;

    const satMatrix = [
        rL + saturation, gL, bL, 0, 0,
        rL, gL + saturation, bL, 0, 0,
        rL, gL, bL + saturation, 0, 0,
        0, 0, 0, 1, 0
    ];

    // Combinación simple (multiplicación de diagonal por saturación)
    // Para simplificar y evitar errores de precisión manual, aplicaremos acciones secuenciales
    return satMatrix;
}

export default function App() {
    const [facing, setFacing] = useState<CameraType>('back');
    const [mode, setMode] = useState<'picture' | 'video'>('picture');
    const [zoom, setZoom] = useState(0);
    const [isRecording, setIsRecording] = useState(false);

    // Filtros desde XML
    const [filterConfig, setFilterConfig] = useState({
        brightness: 0,
        saturation: 1,
        contrast: 1,
        colorTemperature: 6500,
        hue: 0,
        tint: 'transparent',
        tintOpacity: 0,
        tintBlendMode: 'overlay',
        rgb: { red: 1, green: 1, blue: 1 },
        gamma: 1,
        shadows: 1,
        highlights: 1,
        vibrance: 0
    });

    // Permisos
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

    // Estados UI
    const [lastPhoto, setLastPhoto] = useState<string | null>(null);
    const [lastAssetId, setLastAssetId] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const cameraRef = useRef<CameraView>(null);

    // Animaciones
    const centerAnim = useRef(new Animated.Value(0)).current;
    const centerSlide = useRef(new Animated.Value(50)).current;
    const sideAnim = useRef(new Animated.Value(0)).current;
    const sideSlide = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        animateButtons();
        loadFilterConfig();
        if (!microphonePermission) requestMicrophonePermission();
    }, []);

    const parseXMLContent = (xmlContent: string) => {
        const parser = new XMLParser();
        const jsonObj = parser.parse(xmlContent);

        // El nuevo root es StyleConfig
        const config = jsonObj?.StyleConfig || jsonObj?.style || {};

        setFilterConfig({
            brightness: parseFloat(config.Brightness || config.brightness || 0),
            saturation: parseFloat(config.Saturation || 1),
            contrast: parseFloat(config.Contrast || 1),
            colorTemperature: parseFloat(config.ColorTemperature || 6500),
            hue: parseFloat(config.Hue || 0),
            tint: config.Tint?.Color || config.tint || 'transparent',
            tintOpacity: parseFloat(config.Tint?.Opacity || config.tintOpacity || 0),
            tintBlendMode: config.Tint?.BlendMode || 'overlay',
            rgb: {
                red: parseFloat(config.RGB?.Red || 1),
                green: parseFloat(config.RGB?.Green || 1),
                blue: parseFloat(config.RGB?.Blue || 1)
            },
            gamma: parseFloat(config.Gamma || 1),
            shadows: parseFloat(config.Shadows || 1),
            highlights: parseFloat(config.Highlights || 1),
            vibrance: parseFloat(config.Vibrance || 0)
        });
    };

    const loadFilterConfig = async () => {
        try {
            const asset = Asset.fromModule(require('../assets/style.xml'));
            await asset.downloadAsync();
            if (asset.localUri) {
                const xmlContent = await FileSystem.readAsStringAsync(asset.localUri);
                parseXMLContent(xmlContent);
            }
        } catch (error) {
            console.error("Error cargando style.xml defecto:", error);
        }
    };

    const pickCustomConfig = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'text/xml',
                copyToCacheDirectory: true
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const xmlContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
                parseXMLContent(xmlContent);
                Alert.alert("Éxito", "Configuración cargada correctamente");
            }
        } catch (error) {
            console.error("Error picking document:", error);
        }
    };

    const animateButtons = () => {
        Animated.parallel([
            Animated.parallel([
                Animated.timing(centerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.timing(centerSlide, { toValue: 0, duration: 600, useNativeDriver: true })
            ]),
            Animated.sequence([
                Animated.delay(300),
                Animated.parallel([
                    Animated.timing(sideAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                    Animated.timing(sideSlide, { toValue: 0, duration: 600, useNativeDriver: true })
                ])
            ])
        ]).start();
    };

    if (!cameraPermission || !microphonePermission) return <View />;

    if (!cameraPermission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>Permiso de Cámara requerido</Text>
                <Button onPress={requestCameraPermission} title="Conceder Permiso" />
            </View>
        );
    }

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    async function handleCapture() {
        if (mode === 'picture') {
            await takePicture();
        } else {
            isRecording ? stopRecording() : startRecording();
        }
    }

    async function takePicture() {
        if (cameraRef.current) {
            try {
                // 1. Capturar la foto
                const photo = await cameraRef.current.takePictureAsync();
                if (photo) {
                    // Nota: expo-image-manipulator en esta versión solo soporta transformaciones geométricas
                    // No podemos aplicar matrices de color o contraste permanentemente de forma sencilla.
                    // Guardamos la foto original.
                    setLastPhoto(photo.uri);
                    const asset = await saveToAlbum(photo.uri);
                    if (asset) setLastAssetId(asset.id);
                }
            } catch (error) {
                console.error("Error capturando foto:", error);
            }
        }
    }

    async function startRecording() {
        if (cameraRef.current) {
            try {
                setIsRecording(true);
                const video = await cameraRef.current.recordAsync();
                if (video) {
                    setLastPhoto(video.uri); // Para miniatura (no se puede aplicar filtro a video fácilmente en JS)
                    const asset = await saveToAlbum(video.uri);
                    if (asset) setLastAssetId(asset.id);
                }
            } catch (error) {
                console.error("Error video:", error);
                setIsRecording(false);
            }
        }
    }

    function stopRecording() {
        if (cameraRef.current && isRecording) {
            cameraRef.current.stopRecording();
            setIsRecording(false);
        }
    }

    async function saveToAlbum(uri: string): Promise<MediaLibrary.Asset | null> {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') return null;
            const asset = await MediaLibrary.createAssetAsync(uri);
            return asset;
        } catch (error) {
            console.error("Error guardando:", error);
            return null;
        }
    }

    const shareMedia = async () => {
        if (lastPhoto) {
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(lastPhoto);
            } else {
                Alert.alert("Error", "Compartir no está disponible en este dispositivo");
            }
        }
    };

    const deleteMedia = async () => {
        if (lastAssetId) {
            Alert.alert(
                "Eliminar archivo",
                "¿Estás seguro de que quieres eliminar esta foto/video de la galería?",
                [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Eliminar",
                        style: "destructive",
                        onPress: async () => {
                            try {
                                const { status } = await MediaLibrary.requestPermissionsAsync();
                                if (status === 'granted') {
                                    await MediaLibrary.deleteAssetsAsync([lastAssetId]);
                                    setLastPhoto(null);
                                    setLastAssetId(null);
                                    setIsPreviewOpen(false);
                                }
                            } catch (error) {
                                console.error("Error eliminando:", error);
                            }
                        }
                    }
                ]
            );
        }
    };

    return (
        <View style={styles.container}>
            <View style={{ flex: 1 }}>
                {/* Cámara como fondo base */}
                <CameraView
                    style={StyleSheet.absoluteFill}
                    facing={facing}
                    ref={cameraRef}
                    zoom={zoom}
                    mode={mode}
                />

                {/* Capa de Filtro Visual (Overlay) */}
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: filterConfig.tint, opacity: filterConfig.tintOpacity }
                    ]}
                    pointerEvents="none"
                />

                {/* Interfaz de Usuario (Overlay superior e inferior) */}
                <View style={styles.mainOverlay}>
                    <View style={styles.overlayUI}>
                        {/* Selector de Modo */}
                        <View style={styles.modeSelector}>
                            <TouchableOpacity onPress={() => setMode('picture')}>
                                <Text style={[styles.modeText, mode === 'picture' && styles.activeMode]}>FOTO</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setMode('video')}>
                                <Text style={[styles.modeText, mode === 'video' && styles.activeMode]}>VIDEO</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Botón de Ajustes (Tuerca) */}
                        <TouchableOpacity style={styles.settingsButton} onPress={pickCustomConfig}>
                            <Ionicons name="settings-sharp" size={28} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.controlsWrapper}>
                        {/* Slider Zoom */}
                        <View style={styles.zoomContainer}>
                            <Text style={styles.zoomText}>{(zoom * 10 + 1).toFixed(1)}x</Text>
                            <Slider
                                style={{ width: 250, height: 40 }}
                                minimumValue={0}
                                maximumValue={0.5}
                                minimumTrackTintColor="#FFFFFF"
                                maximumTrackTintColor="rgba(255,255,255,0.3)"
                                thumbTintColor="#FFFFFF"
                                value={zoom}
                                onValueChange={setZoom}
                            />
                        </View>

                        <View style={styles.buttonContainer}>
                            <Animated.View style={{ opacity: sideAnim, transform: [{ translateY: sideSlide }] }}>
                                <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
                                    <Ionicons name="camera-reverse-outline" size={30} color="white" />
                                </TouchableOpacity>
                            </Animated.View>

                            <Animated.View style={{ opacity: centerAnim, transform: [{ translateY: centerSlide }] }}>
                                <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
                                    <View style={[
                                        styles.captureInner,
                                        mode === 'video' && { backgroundColor: 'red' },
                                        isRecording && { borderRadius: 5, width: 30, height: 30 }
                                    ]} />
                                </TouchableOpacity>
                            </Animated.View>

                            <Animated.View style={{ opacity: sideAnim, transform: [{ translateY: sideSlide }] }}>
                                <TouchableOpacity
                                    style={styles.iconButton}
                                    onPress={() => lastPhoto && setIsPreviewOpen(true)}
                                    disabled={!lastPhoto}
                                >
                                    {lastPhoto ? (
                                        <Image source={{ uri: lastPhoto }} style={styles.thumbnail} />
                                    ) : (
                                        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                                            <Ionicons name="images-outline" size={20} color="rgba(255,255,255,0.5)" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    </View>
                </View>
            </View>

            <Modal visible={isPreviewOpen} animationType="fade" transparent={true}>
                <View style={styles.previewFullScreen}>
                    {/* Fondo Desenfoque */}
                    {lastPhoto && (
                        <View style={StyleSheet.absoluteFill}>
                            <Image source={{ uri: lastPhoto }} style={StyleSheet.absoluteFill} blurRadius={50} />
                            <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
                        </View>
                    )}

                    {/* Header */}
                    <View style={styles.previewHeader}>
                        <TouchableOpacity style={styles.blurActionButton} onPress={() => setIsPreviewOpen(false)}>
                            <Ionicons name="chevron-back" size={28} color="white" />
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity style={[styles.blurActionButton, { marginRight: 15 }]} onPress={shareMedia}>
                                <Ionicons name="share-social-outline" size={24} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.blurActionButton} onPress={deleteMedia}>
                                <Ionicons name="trash-outline" size={24} color="#ff4444" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Imagen Principal */}
                    <View style={styles.previewImageWrapper}>
                        <Image source={{ uri: lastPhoto || '' }} style={styles.previewImage} resizeMode="contain" />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    message: { textAlign: 'center', color: 'white' },
    camera: { flex: 1 },
    mainOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        paddingTop: 40,
        paddingBottom: 20,
    },
    overlayUI: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    modeSelector: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 25,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    settingsButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    modeText: {
        color: 'rgba(255,255,255,0.5)',
        fontWeight: 'bold',
        fontSize: 12,
        paddingHorizontal: 15,
        paddingVertical: 8,
    },
    activeMode: {
        color: 'white',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    controlsWrapper: {
        paddingBottom: 50,
        alignItems: 'center',
    },
    zoomContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    zoomText: {
        color: 'white',
        fontSize: 12,
        marginBottom: 5,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        paddingHorizontal: 40,
        marginBottom: 50,
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    iconButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureInner: {
        width: 66,
        height: 66,
        borderRadius: 33,
        backgroundColor: 'white',
    },
    thumbnail: {
        width: 45,
        height: 45,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'white',
    },
    thumbnailPlaceholder: {
        width: 45,
        height: 45,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },

    // Preview Modal Premium
    previewFullScreen: {
        flex: 1,
        backgroundColor: 'black'
    },
    previewHeader: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    blurActionButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    previewImageWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewImage: {
        width: width,
        height: height * 0.8,
    },
});
