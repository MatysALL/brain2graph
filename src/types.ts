export interface BranchData {
  id: string;
  name: string;
  min: number;
  max: number;
  value: number;
  color: string;
  isDeletable?: boolean;
}
