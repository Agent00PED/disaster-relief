export interface ItemRow {
  id: number;
  name: string;
  amount: string;
  unit: string;
  expireDate: string;
  note: string;
}

export type ItemType = 'water' | 'rice' | 'medicine' | 'clothes' | 'canned' | 'snack' | 'medical';

export type DonationStatus = 'รับเข้าคลัง' | 'ปกติ' | 'ใกล้หมดอายุ';

export interface DonationRecord {
  id: number;
  date: string;
  donorName: string;
  itemName: string;
  category: string;
  itemType: ItemType;
  amount: number;
  unit: string;
  expireDate: string;
  status: DonationStatus;
}