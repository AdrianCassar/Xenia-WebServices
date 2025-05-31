export interface PersistanceSettingsProps {
  mongoURI: string;
  swagger_API: string;
  SSL: string;
  nginx: string;
  heroku_nginx: string;
  xstorage: string;
  HEROKU_RELEASE_CREATED_AT: string;
  HEROKU_BUILD_COMMIT: string;
  START_TIME: string;
}

export default interface IPersistanceSettings {
  get(): PersistanceSettingsProps;
}
