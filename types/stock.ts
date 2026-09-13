export interface ItemRow {
  id: number;
  name: string;
  amount: string;
  unit: string;
  expireDate: string;
  note: string;
}

export interface StockHistoryItem {
  id: number;
  date: string;
  donorName: string;
  itemName: string;
  itemType: 'water' | 'rice' | 'medicine' | 'clothes' | 'canned';
  amount: number;
  unit: string;
  expireDate: string;
  status: 'รับเข้าคลัง' | 'ปกติ';
}