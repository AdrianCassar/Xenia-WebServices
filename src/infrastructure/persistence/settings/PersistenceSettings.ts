import { Injectable } from '@nestjs/common';
import AbstractEnvSettings from '../../AbstractEnvSettings';
import { PersistenceSettingsProps } from './IPersistenceSettings';

@Injectable()
export default class PersistenceSettings extends AbstractEnvSettings<PersistenceSettingsProps> {
  public get() {
    return <PersistenceSettingsProps>this.getFullConfig().persistence;
  }
}
