// Video types for Library module

export interface Attachment {
    id: number;
    title?: string;
    description?: string;
    url?: string;
    embedUrl?: string;
    thumbnailUrl?: string;
    status: 'PENDING' | 'COMPLETED' | 'ERROR';
    mimeType?: string;
    size?: number;
}

export interface VideoItem {
    id: number;
    attachment?: Attachment;
    alreadySeen?: boolean;
}

export interface PatientVideo {
    id: number;
    attachment?: Attachment;
    relatedToDayOverviewItemAttachmentExists?: boolean;
    alreadySeen?: boolean;
}

export interface PatientFoodCategoryAttachment {
    id: number;
    attachment?: Attachment;
    relatedToDayOverviewItemAttachmentExists?: boolean;
}

// Video Library types
export const VIDEO_LIBRARY = {
    FOOD: 'FOOD',
    OTHER: 'OTHER',
    DISEASE: 'DISEASE',
    GENERAL: 'GENERAL',
} as const;

export type VideoLibrary = typeof VIDEO_LIBRARY[keyof typeof VIDEO_LIBRARY];

// Medical term with videos
export interface MedicalTermWithVideos {
    id: number;
    medicalTerm: {
        id: number;
        name: string;
    };
    seenAttachments?: VideoItem[];
    readyToSeeAttachments?: VideoItem[];
}

// Food tree item with videos
export interface FoodTreeItem {
    foodCategory?: {
        id: number;
        category: {
            id: number;
            name: string;
        };
    };
    attachments?: VideoItem[];
    children?: FoodTreeItem[];
}

// Destination tree item
export interface DestinationTreeItem {
    destination: string;
    attachments?: VideoItem[];
}

// Navigation params for Video screen
export interface VideoNavigationParams {
    id?: number;
    video: Attachment;
    backLink: string;
    library: string;
}

// Video library data structure
export interface VideoLibraryData {
    diseaseVideo: MedicalTermWithVideos[];
    foodVideo: FoodTreeItem[];
    otherVideo: DestinationTreeItem[];
}
