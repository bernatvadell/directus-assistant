export interface Message {
    id: number;
    role: 'assistant' | 'user';
    content: string;
    created_at: string;
    user: string;
}