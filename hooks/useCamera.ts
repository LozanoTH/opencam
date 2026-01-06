import { Camera, FlashMode, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useEffect, useRef, useState } from 'react';
import { Vibration } from 'react-native';

export const useCamera = () => {
    const [permission, requestPermission] = useCameraPermissions();
    const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState<boolean | null>(null);
    const [flash, setFlash] = useState<FlashMode>('off');
    const [zoom, setZoom] = useState(0);
    const [facing, setFacing] = useState<'back' | 'front'>('back');
    const [ratio, setRatio] = useState('4:3');
    const [timer, setTimer] = useState(0); // 0, 3, 10
    const [isCountingDown, setIsCountingDown] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const cameraRef = useRef<any>(null);
    const recordingStartTime = useRef<number>(0);

    useEffect(() => {
        let interval: any;
        if (isRecording) {
            setRecordingDuration(0);
            recordingStartTime.current = Date.now();
            interval = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } else {
            setRecordingDuration(0);
            recordingStartTime.current = 0;
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRecording]);

    useEffect(() => {
        (async () => {
            const { status: cameraStatus } = await requestPermission();
            // Check microphone permission for video
            const { status: micStatus } = await Camera.requestMicrophonePermissionsAsync();

            const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync(true);
            setHasMediaLibraryPermission(mediaStatus === 'granted');
        })();
    }, []);

    const toggleFlash = () => {
        setFlash(current => {
            if (current === 'off') return 'on';
            if (current === 'on') return 'auto';
            return 'off';
        });
    };

    const toggleFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    const takePictureWithTimer = async () => {
        if (timer > 0) {
            setIsCountingDown(true);
            await new Promise(resolve => setTimeout(resolve, timer * 1000));
            setIsCountingDown(false);
        }
        return await capture();
    };

    const capture = async () => {
        if (cameraRef.current) {
            Vibration.vibrate(50);
            return await cameraRef.current.takePictureAsync({
                quality: 1,
                exif: false,
            });
        }
    };

    const startRecording = async () => {
        if (cameraRef.current && !isRecording) {
            setIsRecording(true);
            try {
                return await cameraRef.current.recordAsync();
            } catch (error) {
                console.error("Video record error:", error);
                setIsRecording(false);
            }
        }
    };

    const stopRecording = async () => {
        if (cameraRef.current && isRecording) {
            const now = Date.now();
            const elapsed = now - recordingStartTime.current;

            // Si ha pasado menos de 1 segundo, esperamos para evitar el error de Expo
            if (elapsed < 1000) {
                await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
            }

            cameraRef.current.stopRecording();
            setIsRecording(false);
        }
    };

    return {
        permission,
        requestPermission,
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
    };
};
