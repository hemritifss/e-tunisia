export interface EndorsementTopic {
    id: string;
    label: string;
    emoji: string;
}
export declare const ENDORSEMENT_TOPICS: EndorsementTopic[];
export declare function isValidTopic(id: string): boolean;
