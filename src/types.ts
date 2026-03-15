export type ColorMode = 'default' | 'multi' | 'custom';

export interface DisplaySettings {
  showThresholds: boolean;
  colorMode: ColorMode;
  customColor: string;
}

export interface BranchData {
  id: string;
  name: string;
  min: number;
  max: number;
  value: number;
  color: string;
  description?: string;
  isDeletable?: boolean;
}

export interface ConfigurationData {
  version: string;
  branches: BranchData[];
  displaySettings: DisplaySettings;
}
