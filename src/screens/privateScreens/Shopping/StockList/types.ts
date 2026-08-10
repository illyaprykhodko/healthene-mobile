export interface StockItem {
    id: number;
    gramWeight: number;
    food: {
        id: number;
        name: string;
        coverImage?: { url: string };
        shoppingCartCategory?: {
            id: number;
            name: string;
        };
    };
}

export interface GroupedSection {
    title: string;
    data: StockItem[];
}
