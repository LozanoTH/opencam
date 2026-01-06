// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Force axios resolution if needed
config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    axios: path.resolve(__dirname, 'node_modules/axios'),
};

module.exports = config;
