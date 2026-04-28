
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
    id: number;
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

export interface Message {
    id: number;
    subject: string;
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
    isRead: boolean;
    chain: {id: number};
    sender: Participant;
    attachments: Attachment[]
}

export interface MessageForm {
    text: string,
    subject: string,
    attachments: Attachment[]
}

export interface Attachment {
    id: number;
    url?: string;
    title: string;
    mimeType: string;
    fileName: string;
}
