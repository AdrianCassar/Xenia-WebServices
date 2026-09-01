export interface SessionSearchRequest {
  searchIndex: number;
  resultsCount: number;
  numUsers: number;
  searcher_xuid: string;
  filters: Array<string>;
  xlast_src: string;
}
