import * as ImageManipulator from 'expo-image-manipulator';

export interface FilterSettings {
    brightness: number;
    saturation: number;
    contrast: number;
    rotation: number;
    compress: number;
    preset: string;
}

export const parseStyleXml = (xmlContent: string): FilterSettings => {
    const getVal = (tag: string) => {
        const match = xmlContent.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`));
        return match ? match[1] : null;
    };

    return {
        preset: getVal('preset') || 'default',
        brightness: parseFloat(getVal('brightness') || '0'),
        saturation: parseFloat(getVal('saturation') || '1'),
        contrast: parseFloat(getVal('contrast') || '1'),
        rotation: parseInt(getVal('rotation') || '0'),
        compress: parseFloat(getVal('compress') || '1'),
    };
};

export const applyFilters = async (uri: string, settings: FilterSettings) => {
    const actions: ImageManipulator.Action[] = [];

    // Geometric actions are easier in Expo
    if (settings.rotation !== 0) {
        actions.push({ rotate: settings.rotation });
    }

    // Process with ImageManipulator
    return await ImageManipulator.manipulateAsync(
        uri,
        actions,
        {
            compress: settings.compress,
            format: ImageManipulator.SaveFormat.JPEG
        }
    );
};

export const serializeStyleXml = (settings: FilterSettings): string => {
    return `
<style>
    <preset>${settings.preset}</preset>
    <brightness>${settings.brightness}</brightness>
    <saturation>${settings.saturation}</saturation>
    <contrast>${settings.contrast}</contrast>
    <rotation>${settings.rotation}</rotation>
    <compress>${settings.compress}</compress>
</style>
`.trim();
};
