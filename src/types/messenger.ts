
export interface MessageItem {
    id: number;
    date: string;
    subject: string;
    owner: Participant;
    isStarred: boolean;
    messagesCount: number
    attachmentCount: number;
    collocutor: Participant;
    lastMessage: {
        id: string;
        reply: null;
        text: string;
        isRead: boolean;
        sender: Participant;
        chain: {
            id: string;
        }
    }
}

export interface Participant {
    id: number;
    name: string;
    email: string;
    enabled: boolean;
    createdDate: string;
    coverImage: {
        url: string;
    }
}

export interface TransformData {
    page: number;
    totalPages: number;
    data: MessageItem[];
}
