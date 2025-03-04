export interface X_STORAGE_FILE_INFO {
  title_id: number;
  title_version: number;
  owner_puid: number;
  country_id: number;
  content_type: number;
  storage_size: number;
  installed_size: number;
  created: number;
  last_modified: number;
  path: string;
}

export interface XStorageEnumerateResponse {
  items: Array<X_STORAGE_FILE_INFO>;
  total_num_items: number;
}
