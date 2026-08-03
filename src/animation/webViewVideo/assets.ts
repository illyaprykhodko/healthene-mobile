// outsource dependencies
import RNBlobUtil from 'react-native-blob-util';
import { Platform } from 'react-native';

// iOS ships .mov in the app bundle; Android ships .webm in assets/videos/.
export const VIDEO_EXT = Platform.OS === 'ios' ? 'mov' : 'webm';
export const VIDEO_MIME = Platform.OS === 'ios' ? 'video/quicktime' : 'video/webm';

export function getVideoAssetPath (name: string): string {
    return Platform.OS === 'ios'
        ? `${RNBlobUtil.fs.dirs.MainBundleDir}/${name}.${VIDEO_EXT}`
        : `bundle-assets://videos/${name}.${VIDEO_EXT}`;
}

export function getVideoDataUrl (base64: string): string {
    return `data:${VIDEO_MIME};base64,${base64}`;
}

export async function preloadVideoAssets (names: string[]): Promise<Map<string, string>> {
    const cache = new Map<string, string>();
    for (const name of names) {
        try {
            const base64 = await RNBlobUtil.fs.readFile(
                getVideoAssetPath(name),
                'base64'
            );
            cache.set(name, base64);
        } catch (error) {
            console.error(`webViewVideo: failed to load "${name}"`, error);
        }
    }
    return cache;
}
