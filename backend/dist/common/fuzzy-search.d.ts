import { Repository, SelectQueryBuilder } from 'typeorm';
export declare const FUZZY_THRESHOLD = 0.3;
export interface FuzzyFields {
    like: string[];
    fuzzy: string[];
}
export declare function ensureFuzzySearch(repo: Repository<any>): Promise<boolean>;
export declare function applyFuzzy(qb: SelectQueryBuilder<any>, pg: boolean, fuzzyReady: boolean, fields: FuzzyFields, term: string, p?: string): string | null;
