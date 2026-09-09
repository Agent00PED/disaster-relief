import { DonationRecord, ItemType, DonationStatus } from '@/types/donation';

export const generate500Records = (): DonationRecord[] => {
  const donors = [
    'มูลนิธิใจดี',
    'บริษัทปันสุข',
    'โรงพยาบาลวชิระพรรณ',
    'ชมรมดนตรี',
    'วัดศรีธรรมาราม',
    'ห้างสรรพสินค้าใจบุญ',
    'มหาวิทยาลัยราชภัฏ',
    'คุณสมชาย',
  ];

  const itemsConfig: { name: string; category: string; unit: string; type: ItemType }[] = [
    { name: 'น้ำดื่ม', category: 'น้ำดื่ม', unit: 'กล่อง', type: 'water' },
    { name: 'ข้าวสาร', category: 'อาหาร', unit: 'ถุง', type: 'rice' },
    { name: 'ยารักษาโรค', category: 'ยารักษาโรค', unit: 'กล่อง', type: 'medicine' },
    { name: 'เสื้อผ้า', category: 'เครื่องนุ่งห่ม', unit: 'ชิ้น', type: 'clothes' },
    { name: 'อาหารกระป๋อง', category: 'อาหาร', unit: 'กระป๋อง', type: 'canned' },
    { name: 'ขนม', category: 'อาหาร', unit: 'กล่อง', type: 'snack' },
    { name: 'เวชภัณฑ์', category: 'ยารักษาโรค', unit: 'ชุด', type: 'medical' },
  ];

  const list: DonationRecord[] = [];

  for (let i = 1; i <= 500; i++) {
    const itemCfg = itemsConfig[(i - 1) % itemsConfig.length];
    const donor = donors[(i - 1) % donors.length];

    let status: DonationStatus = 'รับเข้าคลัง';
    if (i % 6 === 0) status = 'ใกล้หมดอายุ';
    else if (i % 4 === 0) status = 'ปกติ';

    const amount = i === 1 ? 500 : Math.floor(Math.random() * 180) + 20;

    list.push({
      id: i,
      date: `${Math.max(1, 6 - Math.floor(i / 80))} ก.ย. 2568 ${String(10 + (i % 8)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`,
      donorName: donor,
      itemName: itemCfg.name,
      category: itemCfg.category,
      itemType: itemCfg.type,
      amount: amount,
      unit: itemCfg.unit,
      expireDate: i % 4 === 0 ? '-' : `${(i % 25) + 1} ก.ย. 2568`,
      status: status,
    });
  }

  return list;
};