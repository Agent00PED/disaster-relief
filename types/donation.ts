export type ItemType =
  | 'water'
  | 'rice'
  | 'medicine'
  | 'clothes'
  | 'canned'
  | 'snack'
  | 'medical'

export type DonationStatus = 'รับเข้าคลัง' | 'ปกติ' | 'ใกล้หมดอายุ'

export type DonationRecord = {
  id: number
  date: string
  donorName: string
  itemName: string
  category: string
  itemType: ItemType
  amount: number
  unit: string
  expireDate: string
  status: DonationStatus
}
