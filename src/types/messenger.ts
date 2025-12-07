
export interface MessageItem {
    id: number;
    date: string;
    subject: string;
    owner: Participant;
    isStarred: boolean;
    messagesCount: number
    attachmentCount: number;
    collocutor: Participant;
    lastMessage: LastMessage
}

export interface LastMessage {
    id: string;
    reply: null;
    text: string;
    isRead: boolean;
    sender: Participant;
    chain: {
        id: string;
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

export interface TransformData<T> {
    data: T[];
    page: number;
    totalPages: number;
}

export interface Message {
    id: number;
    subject: number;
    isStarred: boolean;
    owner: Participant;
    messagesCount: number;
    attachmentCount: number;
    collocutor: Participant;
    lastMessage: LastMessage;
}

export interface MessageChain {
    id: number;
    date: string;
    text: string;
    attachments: []
    isRead: boolean;
    chain: {id: number};
    sender: Participant;
}
