import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useRef, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function App() {
    const [facing, setFacing] = useState<CameraType>('back');
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);

    if (!cameraPermission) {
        // Permisos de cámara cargando
        return <View />;
    }

    if (!cameraPermission.granted) {
        // Permiso de cámara no concedido
        return (
            <View style={styles.container}>
                <Text style={styles.message}>Necesitamos permiso para usar la cámara</Text>
                <Button onPress={requestCameraPermission} title="Conceder Permiso Cámara" />
            </View>
        );
    }

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    async function takePicture() {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync();

                if (photo) {
                    // Pasamos la URI a la función de guardado
                    await saveToAlbum(photo.uri);
                }
            } catch (error) {
                console.error("Error tomando foto:", error);
                Alert.alert('Error', 'No se pudo tomar la foto');
            }
        }
    }

    async function saveToAlbum(uri: string) {
        try {
            // Solicitud explícita de permisos al momento de intentar guardar
            // Esto previene que la app explote al iniciar si falta configuración
            const { status } = await MediaLibrary.requestPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert("Permiso denegado", "Se necesita acceso a la galería para guardar la foto.");
                return;
            }

            const asset = await MediaLibrary.createAssetAsync(uri);
            const albumName = "MiAppFotos";
            const album = await MediaLibrary.getAlbumAsync(albumName);

            if (album) {
                await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            } else {
                await MediaLibrary.createAlbumAsync(albumName, asset, false);
            }

            Alert.alert('Foto Guardada', `Imagen guardada en álbum "${albumName}"`);

        } catch (error) {
            console.error("Error guardando foto:", error);
            // Mensaje de error amigable que sugiere la solución real
            Alert.alert("Error de Configuración", "No se pudo acceder a la galería. Intenta reiniciar el servidor con 'npx expo start --clear'.");
        }
    }

    return (
        <View style={styles.container}>
            <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
                        <Ionicons name="camera-reverse-outline" size={40} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                        <View style={styles.captureInner} />
                    </TouchableOpacity>

                    <View style={styles.spacer} />
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
    },
    camera: {
        flex: 1,
    },
    buttonContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'transparent',
        margin: 30,
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    iconButton: {
        padding: 10,
        alignSelf: 'flex-end',
        marginBottom: 20
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10
    },
    captureInner: {
        width: 60,
        height: 60,
        borderRadius: 35,
        backgroundColor: 'white',
    },
    spacer: {
        width: 60,
    }
});
