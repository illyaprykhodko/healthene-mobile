// Question Types

export const QUESTION_TYPE = {
    FOOD_QUESTION: 'FOOD_QUESTION',
    DISEASE_QUESTION: 'DISEASE_QUESTION',
    GENERAL_QUESTION: 'GENERAL_QUESTION',
} as const;

export type QuestionType = typeof QUESTION_TYPE[keyof typeof QUESTION_TYPE];

// Response types
export const RESPONSE_TYPE = {
    USER_ENTERED_RESPONSE: 'USER_ENTERED_RESPONSE',
    FINAL_MESSAGE: 'FINAL_MESSAGE',
} as const;

export type ResponseType = typeof RESPONSE_TYPE[keyof typeof RESPONSE_TYPE] | string;

// Response item (answer option)
export interface ResponseItem {
    id: number;
    itemText: string;
    order?: number;
}

// Question response structure
export interface QuestionResponse {
    id: number;
    type: ResponseType;
    responseItems: ResponseItem[];
}

// Base question structure
export interface Question {
    id: number;
    question: string;
    response: QuestionResponse;
}

// Library item for general questions
export interface LibraryItem {
    id: number;
    question: string;
    response: QuestionResponse;
}

// Library category
export interface LibraryCategory {
    id: number;
    name: string;
}

// Question with parent reference
export interface QuestionWithParent {
    id: number;
    question: Question;
    parent?: {
        question: {
            title: string;
        };
    };
}

// Disease question structure
export interface DiseaseQuestion {
    id: number;
    question: Question;
    questionType?: QuestionType;
    parent?: {
        question: {
            title: string;
        };
    };
}

// General question structure (from library)
export interface GeneralQuestion {
    id: number;
    libraryItem: LibraryItem;
    questionType?: QuestionType;
    alreadyAnswered?: boolean;
}

// Question category with questions
export interface QuestionCategory {
    libraryCategory: LibraryCategory;
    questions: DiseaseQuestion[];
}

// API Request/Response types
export interface AnswerDiseaseQuestionRequest {
    id: number;
    answeredDate: string;
    description?: string;
    responseItem?: { id: number };
}

export interface AnswerFoodQuestionRequest {
    id: number;
    answeredTime: string;
    patientQuestionAnswer: {
        patient: { id: number };
        question: { id: number };
        description?: string;
        responseItem?: { id: number };
    };
}

export interface AnswerGeneralQuestionRequest {
    id: number;
    patientQuestionAnswer: {
        patient: { id: number };
        question: { id: number };
        description?: string;
        responseItem?: { id: number };
    };
    libraryItem: { id: number };
}

// Navigation params for question screens
export interface QuestionParams {
    backLink: string;
    question: {
        id: number;
        questionType: QuestionType;
        question?: Question;
        libraryItem?: LibraryItem;
    };
}

export interface QuestionCategoryParams {
    date: string;
}

// Questions videos response (for indicators)
export interface QuestionsVideosResponse {
    totalQuestions: number;
    totalVideos: number;
    questions?: DiseaseQuestion[];
    videos?: any[];
}
