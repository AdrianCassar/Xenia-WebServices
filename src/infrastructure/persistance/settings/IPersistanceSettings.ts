export interface PersistanceSettingsProps {
  mongoURI: string;
  swagger_API: string;
  SSL: string;
  nginx: string;
  heroku_nginx: string;
}

export default interface IPersistanceSettings {
  get(): PersistanceSettingsProps;
}
