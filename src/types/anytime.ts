// Anytime Menu types
export type AnytimeItemStatus = 'PENDING' | 'DONE' | 'INCOMPLETE';

export type AnytimeItemType =
  | 'FOOD'
  | 'DRINK'
  | 'SUPPLEMENT'
  | 'MEASUREMENT'
  | 'PHYSICAL_ACTIVITY';

export interface AnytimeBaseItem {
  id: string | number;
  type: AnytimeItemType;
  status: AnytimeItemStatus;
  amount?: number;
  order?: number;
  phaseId?: string | number;
  /**
   * Tracks how much of the item has been consumed. Used for multi-serve foods/drinks.
   * If omitted by the backend, it is treated as 0 on the client.
   */
  consumedAmount?: number;
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
    id: string | number;
    name: string;
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
    visible: boolean;
    disabled?: boolean;
    maxHeight?: number; // max height in pixels or percentage
    onClose: () => void;
    items: AnytimeItem[];
    fullScreen?: boolean;
    isFutureDate?: boolean;
    onUpdateItem?: (item: AnytimeItem) => void;
}
