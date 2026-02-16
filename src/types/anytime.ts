// Anytime Menu types
export type AnytimeItemStatus = 'PENDING' | 'DONE' | 'INCOMPLETE';

export type AnytimeItemType =
  | 'FOOD'
  | 'DRINK'
  | 'SUPPLEMENT'
  | 'MEASUREMENT'
  | 'PHYSICAL_ACTIVITY';

export interface AnytimeBaseItem {
  order?: number;
  amount?: number;
  id: string | number;
  type: AnytimeItemType;
  consumedAmount?: number;
  status: AnytimeItemStatus;
  phaseId?: string | number;
}

export interface AnytimeFoodItem extends AnytimeBaseItem {
  type: 'FOOD';
  food: {
    id: string | number;
    name: string;
    coverImage?: {
      url?: string;
    };
    plantType?: {
      name: string;
    };
  };
  weight?: {
    unit: {
      name: string;
    };
  };
  substanceType?: 'FOOD' | 'DRINK';
}

export interface AnytimeDrinkItem extends AnytimeBaseItem {
  type: 'DRINK';
  food: {
    id: string | number;
    name: string;
    coverImage?: {
      url?: string;
    };
  };
  weight?: {
    unit: {
      name: string;
    };
  };
  substanceType: 'DRINK';
}

export interface AnytimeSupplementItem extends AnytimeBaseItem {
  type: 'SUPPLEMENT';
  supplement: {
    id: string | number;
    name: string;
    coverImage?: {
      url?: string;
    };
    servingSizes?: Array<{
      unit: string;
    }>;
  };
}

export interface AnytimeMeasurementItem extends AnytimeBaseItem {
  type: 'MEASUREMENT';
  measurement: {
    id: number;
    name: string;
    type?: string; // WEIGHT, BLOOD_PRESSURE, BLOOD_GLUCOSE, etc.
    description?: string;
    coverImage?: {
      url?: string;
    };
    video?: {
      id: string | number;
      embedUrl?: string;
      status?: string;
    };
    units?: Array<{
      id: number;
      name: string;
      symbol?: string;
    }>;
  };
}

export interface AnytimePhysicalActivityItem extends AnytimeBaseItem {
  type: 'PHYSICAL_ACTIVITY';
  physicalActivity?: {
    id: string | number;
    name: string;
  };
}

export type AnytimeItem =
  | AnytimeFoodItem
  | AnytimeDrinkItem
  | AnytimeSupplementItem
  | AnytimeMeasurementItem
  | AnytimePhysicalActivityItem;

export interface AnytimeData {
  foods: AnytimeFoodItem[];
  drinks: AnytimeDrinkItem[];
  supplements: AnytimeSupplementItem[];
  measurements: AnytimeMeasurementItem[];
  physicalActivities: AnytimePhysicalActivityItem[];
}

export interface AnytimeMenuIconProps {
  type: AnytimeItemType;
  count: number;
  disabled?: boolean;
  onPress: () => void;
}

export interface AnytimeModalProps {
    icon: string;
    title: string;
    date?: string;
    visible: boolean;
    disabled?: boolean;
    maxHeight?: number; // max height in pixels or percentage
    onClose: () => void;
    items: AnytimeItem[];
    fullScreen?: boolean;
    isFutureDate?: boolean;
    onUpdateItem?: (item: AnytimeItem) => void;
}
