'use client'

import { useEffect, useState } from 'react'
import type { Dictionary } from '@/lib/i18n/dictionaries'

interface Province {
  id: number
  name_th: string
  name_en: string
}

interface District {
  id: number
  name_th: string
  name_en: string
  province_id: number
}

interface SubDistrict {
  id: number
  name_th: string
  name_en: string
  district_id: number
}

interface ItemRow {
  id: string
  itemName: string
  category: string
  quantity: string
  unit: string
  expiryDate: string

  brand: string
  volume: string
  itemType: string

  otherBrand: string
  otherItemType: string
}

interface NewDonationFormProps {
  dict?: Dictionary
  locale?: 'th' | 'en'
  error?: string
  createDonationAction?: (
    formData: FormData
  ) => void | Promise<void>
}

const donationTypes = [
  {
    id: 'water',
    value: 'water',
    labelTh: 'น้ำ',
    labelEn: 'Water',
    icon: '💧',
  },
  {
    id: 'milk',
    value: 'food',
    labelTh: 'นม',
    labelEn: 'Milk',
    icon: '🍼',
  },
  {
    id: 'rice',
    value: 'food',
    labelTh: 'ข้าวสาร',
    labelEn: 'Rice',
    icon: '🌾',
  },
  {
    id: 'dry-food',
    value: 'food',
    labelTh: 'อาหารแห้ง',
    labelEn: 'Dry Food',
    icon: '📦',
  },
  {
    id: 'hygiene',
    value: 'hygiene',
    labelTh: 'ของใช้',
    labelEn: 'Supplies',
    icon: '👕',
  },
  {
    id: 'medicine',
    value: 'medicine',
    labelTh: 'ยา',
    labelEn: 'Medicine',
    icon: '💊',
  },
]

const inputClassName =
  'block h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-[#0E2A47] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500'

const API_BASE =
  'https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest'

export default function NewDonationForm({
  dict,
  locale,
  error,
  createDonationAction,
}: NewDonationFormProps) {
  const currentLocale: 'th' | 'en' =
    locale ??
    (typeof document !== 'undefined' &&
    document.documentElement.lang.toLowerCase().startsWith('en')
      ? 'en'
      : 'th')

  const tr = (th: string, en: string) =>
    currentLocale === 'th' ? th : en

  const getTodayLocalDate = () => {
    const now = new Date()

    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const [donorName, setDonorName] = useState('')
  const [phone, setPhone] = useState('')

  // =========================================================
  // จังหวัด / ตำบล
  // =========================================================

  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [subdistricts, setSubdistricts] = useState<SubDistrict[]>([])

  const [provinceId, setProvinceId] = useState('')
  const [subdistrict, setSubdistrict] = useState('')

  const [loadingLocation, setLoadingLocation] = useState(true)

  const [receivedDate, setReceivedDate] =
    useState(getTodayLocalDate())

  const [religion, setReligion] = useState('พุทธ')

  const [selectedDonationType, setSelectedDonationType] =
    useState('')

  const [items, setItems] = useState<ItemRow[]>([
    {
      id: '1',
      itemName: '',
      category: '',
      quantity: '',
      unit: '',
      expiryDate: '',
      brand: '',
      volume: '',
      itemType: '',
      otherBrand: '',
      otherItemType: '',
    },
  ])

  // =========================================================
  // โหลดข้อมูลจังหวัด / อำเภอ / ตำบล
  // =========================================================

  useEffect(() => {
    const loadLocationData = async () => {
      try {
        setLoadingLocation(true)

        const [
          provincesResponse,
          districtsResponse,
          subdistrictsResponse,
        ] = await Promise.all([
          fetch(`${API_BASE}/province.json`),
          fetch(`${API_BASE}/district.json`),
          fetch(`${API_BASE}/sub_district.json`),
        ])

        if (
          !provincesResponse.ok ||
          !districtsResponse.ok ||
          !subdistrictsResponse.ok
        ) {
          throw new Error(
            'ไม่สามารถโหลดข้อมูลจังหวัด/ตำบลได้'
          )
        }

        const [
          provincesData,
          districtsData,
          subdistrictsData,
        ] = await Promise.all([
          provincesResponse.json(),
          districtsResponse.json(),
          subdistrictsResponse.json(),
        ])

        setProvinces(provincesData)
        setDistricts(districtsData)
        setSubdistricts(subdistrictsData)
      } catch (err) {
        console.error(
          'ไม่สามารถโหลดข้อมูลพื้นที่:',
          err
        )

        setProvinces([])
        setDistricts([])
        setSubdistricts([])
      } finally {
        setLoadingLocation(false)
      }
    }

    loadLocationData()
  }, [])

  // =========================================================
  // ตำบลที่อยู่ภายในจังหวัดที่เลือก
  // =========================================================

  const selectedProvinceDistrictIds = districts
    .filter(
      (district) =>
        district.province_id === Number(provinceId)
    )
    .map((district) => district.id)

  const filteredSubdistricts = subdistricts.filter(
    (subdistrictItem) =>
      selectedProvinceDistrictIds.includes(
        subdistrictItem.district_id
      )
  )

  // =========================================================
  // เปลี่ยนจังหวัด
  // =========================================================

  const handleProvinceChange = (
    value: string
  ) => {
    setProvinceId(value)

    // เมื่อเปลี่ยนจังหวัด ต้องล้างตำบลเดิม
    setSubdistrict('')
  }

  const formatDisplayDate = (date: string) => {
    if (!date) return ''

    const [year, month, day] =
      date.split('-')

    if (!year || !month || !day) {
      return date
    }

    return new Intl.DateTimeFormat(
      currentLocale === 'th'
        ? 'th-TH'
        : 'en-US',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    ).format(
      new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
      )
    )
  }

  // =========================================================
  // เพิ่มรายการ
  // =========================================================

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        itemName: '',
        category: '',
        quantity: '',
        unit: '',
        expiryDate: '',
        brand: '',
        volume: '',
        itemType: '',
        otherBrand: '',
        otherItemType: '',
      },
    ])
  }

  // =========================================================
  // ลบรายการ
  // =========================================================

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems((prev) =>
        prev.filter(
          (item) => item.id !== id
        )
      )
    }
  }

  // =========================================================
  // แก้ไขรายการ
  // =========================================================

  const handleItemChange = (
    id: string,
    field: keyof ItemRow,
    value: string
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    )
  }

  // =========================================================
  // เลือกประเภทของบริจาค
  // =========================================================

  const handleCategorySelect = (
    id: string,
    category: string,
    typeId: string
  ) => {
    setSelectedDonationType(typeId)

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              category,
              itemName: '',
              quantity: '',
              unit: '',
              brand: '',
              volume: '',
              itemType: '',
              otherBrand: '',
              otherItemType: '',
              expiryDate: '',
            }
          : item
      )
    )
  }

  // =========================================================
  // Reset
  // =========================================================

  const handleReset = () => {
    setDonorName('')
    setPhone('')

    setProvinceId('')
    setSubdistrict('')

    setReceivedDate(
      getTodayLocalDate()
    )

    setReligion('พุทธ')
    setSelectedDonationType('')

    setItems([
      {
        id: '1',
        itemName: '',
        category: '',
        quantity: '',
        unit: '',
        expiryDate: '',
        brand: '',
        volume: '',
        itemType: '',
        otherBrand: '',
        otherItemType: '',
      },
    ])
  }

  const optionLabel = (option: string) => {
    if (currentLocale === 'th') return option

    const labels: Record<string, string> = {
      'นม UHT': 'UHT Milk',
      'นมพาสเจอร์ไรส์': 'Pasteurized Milk',
      'นมถั่วเหลือง': 'Soy Milk',
      'นมผง': 'Milk Powder',
      'นมรสช็อกโกแลต': 'Chocolate Milk',
      'นมรสจืด': 'Plain Milk',
      'ปลากระป๋อง': 'Canned Fish',
      'อาหารกระป๋อง': 'Canned Food',
      'บะหมี่กึ่งสำเร็จรูป': 'Instant Noodles',
      'โจ๊กกึ่งสำเร็จรูป': 'Instant Porridge',
      'ถั่ว': 'Beans / Nuts',
      'ธัญพืช': 'Cereals / Grains',
      'ขนม': 'Snacks',
      'อาหารสำเร็จรูป': 'Ready-to-eat Food',
      'น้ำปลา': 'Fish Sauce',
      'ซอสปรุงรส': 'Seasoning Sauce',
      'น้ำมันพืช': 'Cooking Oil',
      'สบู่': 'Soap',
      'แชมพู': 'Shampoo',
      'ยาสีฟัน': 'Toothpaste',
      'แปรงสีฟัน': 'Toothbrush',
      'ผ้าอนามัย': 'Sanitary Pads',
      'กระดาษทิชชู่': 'Tissue Paper',
      'ผ้าเช็ดตัว': 'Towel',
      'ผ้าห่ม': 'Blanket',
      'เสื้อผ้า': 'Clothing',
      'หน้ากากอนามัย': 'Face Mask',
      'เจลแอลกอฮอล์': 'Hand Sanitizer',
      'ผ้าอ้อม': 'Diapers',
      'น้ำยาซักผ้า': 'Laundry Detergent',
      'น้ำยาล้างจาน': 'Dishwashing Liquid',
      'พาราเซตามอล': 'Paracetamol',
      'ยาแก้ปวด': 'Painkiller',
      'ยาลดไข้': 'Fever Reducer',
      'ยาแก้แพ้': 'Antihistamine',
      'ยาแก้ไอ': 'Cough Medicine',
      'ยาลดกรด': 'Antacid',
      'ยาแก้ท้องเสีย': 'Anti-diarrheal Medicine',
      'ยาทาแผล': 'Wound Ointment',
      'น้ำเกลือล้างแผล': 'Wound Cleaning Saline',
      'ยาดม': 'Inhaler',
      'สิงห์': 'Singha',
      'คริสตัล': 'Crystal',
      'เนสท์เล่ เพียวไลฟ์': 'Nestlé Pure Life',
      'ช้าง': 'Chang',
      'อควาฟิน่า': 'Aquafina',
      'น้ำทิพย์': 'Namthip',
      'เพอร์ร่า': 'Purra',
      'หงษ์ทอง': 'Hong Thong',
      'ฉัตร': 'Chat',
      'มาบุญครอง': 'Ma Boon Khrong',
      'เบญจรงค์': 'Benjarong',
      'ข้าวไก่แจ้': 'Kai Jae Rice',
      'ชิ้น': 'piece',
      'กล่อง': 'box',
      'ขวด': 'bottle',
      'แพ็ค': 'pack',
      'ลัง': 'case',
      'ถัง': 'container',
      'ถุง': 'bag',
      'กระสอบ': 'sack',
      'กิโลกรัม': 'kilogram',
      'ห่อ': 'bundle',
      'กระป๋อง': 'can',
      'ชุด': 'set',
      'แผง': 'blister pack',
      'กระปุก': 'jar',
      'หลอด': 'tube',
      'ซอง': 'sachet',
      'ไทย-เดนมาร์ค': 'Thai-Denmark',
      'โฟร์โมสต์': 'Foremost',
      'เมจิ': 'Meiji',
      'ดัชมิลล์': 'Dutch Mill',
      'หนองโพ': 'Nongpho',
      'ไวตามิ้ลค์': 'Vitamilk',
      'มะลิ': 'Mali',
    }

    return labels[option] ?? option
  }

  const selectedType =
    donationTypes.find(
      (type) =>
        type.id ===
        selectedDonationType
    ) ?? null

  // =========================================================
  // ชื่อจริงของยี่ห้อ
  // =========================================================

  const getActualBrand = (
    item: ItemRow
  ) => {
    return item.brand === '__other__'
      ? item.otherBrand
      : item.brand
  }

  // =========================================================
  // ชื่อจริงของชนิด
  // =========================================================

  const getActualItemType = (
    item: ItemRow
  ) => {
    return item.itemType === '__other__'
      ? item.otherItemType
      : item.itemType
  }

  // =========================================================
  // สร้างชื่อรายการ
  // =========================================================

  const buildItemName = (
    item: ItemRow
  ) => {
    const brand =
      getActualBrand(item)

    const itemType =
      getActualItemType(item)

    switch (selectedDonationType) {
      case 'milk':
        return [
          itemType || 'นม',
          brand
            ? `ตรา ${brand}`
            : '',
          item.volume
            ? `${item.volume} มล.`
            : '',
        ]
          .filter(Boolean)
          .join(' - ')

      case 'water':
        return [
          'น้ำ',
          brand
            ? `ยี่ห้อ ${brand}`
            : '',
          item.volume
            ? `${item.volume} มล.`
            : '',
        ]
          .filter(Boolean)
          .join(' - ')

      case 'rice':
        return [
          'ข้าวสาร',
          brand
            ? `ตรา ${brand}`
            : '',
          item.volume
            ? `${item.volume} กก.`
            : '',
        ]
          .filter(Boolean)
          .join(' - ')

      case 'dry-food':
        return (
          itemType ||
          'อาหารแห้ง'
        )

      case 'hygiene':
        return (
          itemType ||
          'ของใช้'
        )

      case 'medicine':
        return [
          itemType || 'ยา',
          brand
            ? `ยี่ห้อ ${brand}`
            : '',
        ]
          .filter(Boolean)
          .join(' - ')

      default:
        return item.itemName
    }
  }

  return (
    <main className="min-h-screen mx-auto w-full max-w-7xl bg-[#f5f1e8] px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="mb-6 flex items-center gap-3">

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-500 dark:bg-red-950/60 dark:text-red-400">

          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>

        </div>

        <div className="min-w-0">

          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {dict?.donationNew?.title ??
              tr('บันทึกของบริจาคเข้าคลัง', 'Record Donated Items')}
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {tr(
              'กรอกข้อมูลเพื่อใช้ของบริจาคที่ได้รับเพื่อนำเข้าคลังสินค้า',
              'Enter information about donated items received into the inventory.'
            )}
          </p>

        </div>

      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg bg-rose-50 p-4 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
        >
          {error}
        </div>
      )}

      <form
        action={createDonationAction}
        lang={
          currentLocale === 'th'
            ? 'th-TH'
            : 'en-US'
        }
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >

        {/* =====================================================
            ข้อมูลผู้บริจาค
        ====================================================== */}

        <div className="mb-8">

          <div className="mb-4 flex items-center gap-2 text-base font-bold text-[#0E2A47] dark:text-slate-100">

            <svg
              className="h-5 w-5 shrink-0 text-[#0E2A47] dark:text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7-7h14a7 7 0 00-7 7z"
              />
            </svg>

            <span>
              {tr('ข้อมูลผู้บริจาค', 'Donor Information')}
            </span>

          </div>

          {/* ชื่อ + เบอร์โทร */}

          <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">

            {/* ชื่อ */}

            <div className="w-full min-w-0">

              <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                {tr('ชื่อผู้บริจาค', 'Donor Name')}{' '}
                <span className="text-rose-500">
                  *
                </span>
              </label>

              <div className="relative w-full">

                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7-7"
                  />
                </svg>

                <input
                  type="text"
                  name="donor_name"
                  placeholder={tr('เช่น มูลนิธิใจดี', 'e.g. Kindness Foundation')}
                  value={donorName}
                  onChange={(e) =>
                    setDonorName(
                      e.target.value
                    )
                  }
                  required
                  className="block h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-[#0E2A47] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />

              </div>

            </div>

            {/* เบอร์โทร */}

            <div className="w-full min-w-0">

              <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                {tr('เบอร์โทรศัพท์ (ถ้ามี)', 'Phone Number (Optional)')}
              </label>

              <div className="relative w-full">

                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498A2 2 0 0121 19v1a2 2 0 01-2 2h-1C9.716 22 2 14.284 2 6V5z"
                  />
                </svg>

                <input
                  type="text"
                  name="phone"
                  placeholder={tr('เช่น 081-234-5678', 'e.g. 081-234-5678')}
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                    )
                  }
                  className="block h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-[#0E2A47] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />

              </div>

            </div>

          </div>

          {/* =================================================
              ตำบล + จังหวัด
          ================================================== */}

          <div className="mt-5 grid w-full grid-cols-1 gap-5 md:grid-cols-2">

            {/* =================================================
                ตำบล
            ================================================== */}

            <div className="w-full min-w-0">

              <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                {tr('ตำบล/แขวง', 'Subdistrict')}
              </label>

              <div className="relative w-full">

                <svg
                  className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 21a2 2 0 01-2.828 0l-4.243-4.343a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>

                <select
                  name="subdistrict"
                  value={subdistrict}
                  onChange={(e) =>
                    setSubdistrict(
                      e.target.value
                    )
                  }
                  disabled={
                    !provinceId ||
                    loadingLocation
                  }
                  className="block h-11 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-[#0E2A47] focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-800"
                >

                  <option value="">
                    {!provinceId
                      ? tr('กรุณาเลือกจังหวัดก่อน', 'Please select a province first')
                      : loadingLocation
                        ? tr('กำลังโหลดข้อมูล...', 'Loading data...')
                        : tr('เลือกตำบล/แขวง', 'Select Subdistrict')}
                  </option>

                  {filteredSubdistricts.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.name_th}
                      >
                        {currentLocale === 'th' ? item.name_th : item.name_en}
                      </option>
                    )
                  )}

                </select>

              </div>

            </div>

            {/* =================================================
                {tr('จังหวัด', 'Province')}
            ================================================== */}

            <div className="w-full min-w-0">

              <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                {tr('จังหวัด', 'Province')}
              </label>

              <div className="relative w-full">

                <svg
                  className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 21s8-4.5 8-10a8 8 0 10-16 0c0 5.5 8 10 8 10z"
                  />
                  <circle
                    cx="12"
                    cy="11"
                    r="2.5"
                    strokeWidth="2"
                  />
                </svg>

                <select
                  name="province"
                  value={provinceId}
                  onChange={(e) =>
                    handleProvinceChange(
                      e.target.value
                    )
                  }
                  disabled={
                    loadingLocation
                  }
                  required
                  className="block h-11 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-[#0E2A47] focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-800"
                >

                  <option value="">
                    {loadingLocation
                      ? tr('กำลังโหลดจังหวัด...', 'Loading provinces...')
                      : tr('เลือกจังหวัด', 'Select Province')}
                  </option>

                  {provinces.map(
                    (provinceItem) => (
                      <option
                        key={
                          provinceItem.id
                        }
                        value={
                          provinceItem.id
                        }
                      >
                        {currentLocale === 'th' ? provinceItem.name_th : provinceItem.name_en}
                      </option>
                    )
                  )}

                </select>

              </div>

            </div>

          </div>

          {/* =================================================
              ส่งชื่อจังหวัดจริงไป Server
          ================================================== */}

          <input
            type="hidden"
            name="province_name"
            value={
              provinces.find(
                (item) =>
                  item.id ===
                  Number(provinceId)
              )?.name_th ?? ''
            }
          />

          {/* วันที่ */}

          <div className="mt-5 w-full md:w-1/2">

            <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">

              {dict?.table?.receivedDate ??
                tr('วันที่รับของ', 'Received Date')}{' '}

              <span className="text-rose-500">
                *
              </span>

            </label>

            <div className="relative w-full">

              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>

              <input
                type="date"
                name="received_date"
                lang={
                  currentLocale === 'th'
                    ? 'th-TH'
                    : 'en-US'
                }
                value={receivedDate}
                onChange={(e) =>
                  setReceivedDate(
                    e.target.value
                  )
                }
                required
                className="block h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-[#0E2A47] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />

              <div className="mt-2 text-[11px] font-medium text-slate-500">
                {formatDisplayDate(
                  receivedDate
                ) || '—'}
              </div>

            </div>

          </div>

        </div>

        {/* =====================================================
            ประเภทของที่รับบริจาค
        ====================================================== */}

        <div className="mb-8">

          <div className="mb-4 flex items-center gap-2 text-base font-bold text-[#0E2A47] dark:text-slate-100">

            <svg
              className="h-5 w-5 text-[#0E2A47]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10l-8 4"
              />
            </svg>

            <span>
              {tr('ประเภทของที่รับบริจาค', 'Donation Type')}
            </span>

          </div>

          {/* ศาสนา */}

          <div className="mb-5">

            <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
              {tr('ประเภทตามศาสนา', 'Religious Type')}
            </label>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                onClick={() =>
                  setReligion('พุทธ')
                }
                className={`flex h-11 min-w-[145px] items-center justify-center gap-2 rounded-lg border px-5 text-xs font-medium transition ${
                  religion === 'พุทธ'
                    ? 'border-[#0E2A47] bg-[#0E2A47] text-white'
                    : 'border-slate-200 bg-white text-[#0E2A47] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                <span className="text-lg">
                  ☸
                </span>
                {tr('พุทธ', 'Buddhist')}
              </button>

              <button
                type="button"
                onClick={() =>
                  setReligion('ฮาลาล')
                }
                className={`flex h-11 min-w-[145px] items-center justify-center gap-2 rounded-lg border px-5 text-xs font-medium transition ${
                  religion === 'ฮาลาล'
                    ? 'border-[#0E2A47] bg-[#0E2A47] text-white'
                    : 'border-slate-200 bg-white text-[#0E2A47] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                <span className="text-lg">
                  ☪
                </span>
                {tr('ฮาลาล', 'Halal')}
              </button>

            </div>

            <input
              type="hidden"
              name="religion"
              value={religion}
            />

          </div>

          {/* ประเภทสิ่งของ */}

          <div>

            <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
              {tr('ประเภทสิ่งของ', 'Item Type')}
            </label>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

              {donationTypes.map(
                (type) => {
                  const selected =
                    selectedDonationType ===
                    type.id

                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() =>
                        handleCategorySelect(
                          items[0].id,
                          type.value,
                          type.id
                        )
                      }
                      className={`flex h-12 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium transition ${
                        selected
                          ? 'border-[#0E2A47] bg-[#0E2A47] text-white'
                          : 'border-slate-200 bg-white text-[#0E2A47] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span className="text-base">
                        {type.icon}
                      </span>

                      <span>
                        {currentLocale === 'th' ? type.labelTh : type.labelEn}
                      </span>
                    </button>
                  )
                }
              )}

            </div>

          </div>

        </div>

        {/* =====================================================
            รายการของ
        ====================================================== */}

        <div>

          <div className="mb-4 flex items-center gap-2 text-base font-bold text-[#0E2A47] dark:text-slate-100">

            <svg
              className="h-5 w-5 text-[#0E2A47]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>

            <span>
              {tr('รายการของที่รับเข้าคลัง', 'Donated Items')}
            </span>

          </div>

          <div className="space-y-4">

            {items.map(
              (item, index) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 dark:border-slate-700 dark:bg-slate-800/40"
                >

                  {/* ยังไม่เลือก */}

                  {!selectedType && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-xs text-slate-500 dark:border-slate-600 dark:text-slate-400">
                      {tr('กรุณาเลือกประเภทสิ่งของด้านบน', 'Please select an item type above')}
                    </div>
                  )}

                  {/* =================================================
                      น้ำ / Water
                  ================================================== */}

                  {selectedDonationType ===
                    'water' && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">

                      <div className="md:col-span-3">

                        <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                          {tr('ยี่ห้อ *', 'Brand *')}
                        </label>

                        <select
                          value={item.brand}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              'brand',
                              e.target.value
                            )
                          }
                          required
                          className={inputClassName}
                        >
                          <option value="">
                            {tr('เลือกยี่ห้อน้ำ', 'Select Water Brand')}
                          </option>

                          <option value="สิงห์">
                            {optionLabel('สิงห์')}
                          </option>

                          <option value="คริสตัล">
                            {optionLabel('คริสตัล')}
                          </option>

                          <option value="เนสท์เล่ เพียวไลฟ์">
                            {optionLabel('เนสท์เล่ เพียวไลฟ์')}
                          </option>

                          <option value="ช้าง">
                            {optionLabel('ช้าง')}
                          </option>

                          <option value="อควาฟิน่า">
                            {optionLabel('อควาฟิน่า')}
                          </option>

                          <option value="น้ำทิพย์">
                            {optionLabel('น้ำทิพย์')}
                          </option>

                          <option value="เพอร์ร่า">
                            {optionLabel('เพอร์ร่า')}
                          </option>

                          <option value="__other__">
                            {tr('อื่น ๆ', 'Other')}
                          </option>
                        </select>

                        {item.brand ===
                          '__other__' && (
                          <input
                            type="text"
                            value={
                              item.otherBrand
                            }
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                'otherBrand',
                                e.target.value
                              )
                            }
                            placeholder={tr('ระบุยี่ห้อ', 'Specify brand')}
                            required
                            className={`${inputClassName} mt-2`}
                          />
                        )}

                      </div>

                      <QuantityField
                        value={
                          item.volume
                        }
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'volume',
                            value
                          )
                        }
                        label={tr('ปริมาณ (มล.) *', 'Volume (ml) *')}
                        placeholder={tr('เช่น 600', 'e.g. 600')}
                      />

                      <QuantityField
                        value={
                          item.quantity
                        }
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'quantity',
                            value
                          )
                        }
                        label={tr('จำนวน *', 'Quantity *')}
                        placeholder={tr('เช่น 120', 'e.g. 120')}
                      />

                      <div className="md:col-span-2">

                        <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                          {tr('หน่วย *', 'Unit *')}
                        </label>

                        <select
                          value={item.unit}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              'unit',
                              e.target.value
                            )
                          }
                          required
                          className={inputClassName}
                        >
                          <option value="">
                            {tr('เลือกหน่วย', 'Select Unit')}
                          </option>

                          <option value="ขวด">
                            {optionLabel('ขวด')}
                          </option>

                          <option value="แพ็ค">
                            {optionLabel('แพ็ค')}
                          </option>

                          <option value="ลัง">
                            {optionLabel('ลัง')}
                          </option>

                          <option value="ถัง">
                            {optionLabel('ถัง')}
                          </option>
                        </select>

                      </div>

                      <ExpiryField
                        value={
                          item.expiryDate
                        }
                        locale={currentLocale}
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'expiryDate',
                            value
                          )
                        }
                      />

                      <DeleteButton
                        ariaLabel={tr('ลบรายการ', 'Delete Item')}
                        disabled={
                          items.length ===
                          1
                        }
                        onClick={() =>
                          handleRemoveItem(
                            item.id
                          )
                        }
                      />

                    </div>
                  )}

                  {/* =================================================
                      นม / Milk
                  ================================================== */}

                  {selectedDonationType ===
                    'milk' && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">

                      <SelectField
                        label={tr('ชื่อนม *', 'Milk Type *')}
                        value={
                          item.itemType
                        }
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'itemType',
                            value
                          )
                        }
                        options={[
                          'นม UHT',
                          'นมพาสเจอร์ไรส์',
                          'นมถั่วเหลือง',
                          'นมผง',
                          'นมรสช็อกโกแลต',
                          'นมรสจืด',
                          '__other__',
                        ]}
                        otherValue={
                          item.otherItemType
                        }
                        onOtherChange={(value) =>
                          handleItemChange(
                            item.id,
                            'otherItemType',
                            value
                          )
                        }
                        placeholder={tr('เลือกชื่อนม', 'Select Milk Type')}
                        otherLabel={tr('อื่น ๆ', 'Other')}
                        displayOption={optionLabel}
                        otherPlaceholder={tr('ระบุชื่อนม', 'Specify milk type')}
                        span="md:col-span-3"
                      />

                      <SelectField
                        label={tr('ตรานม *', 'Milk Brand *')}
                        value={
                          item.brand
                        }
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'brand',
                            value
                          )
                        }
                        options={[
                          'ไทย-เดนมาร์ค',
                          'โฟร์โมสต์',
                          'เมจิ',
                          'ดัชมิลล์',
                          'หนองโพ',
                          'ไวตามิ้ลค์',
                          'มะลิ',
                          '__other__',
                        ]}
                        otherValue={
                          item.otherBrand
                        }
                        onOtherChange={(value) =>
                          handleItemChange(
                            item.id,
                            'otherBrand',
                            value
                          )
                        }
                        placeholder={tr('เลือกตรานม', 'Select Milk Brand')}
                        otherLabel={tr('อื่น ๆ', 'Other')}
                        displayOption={optionLabel}
                        otherPlaceholder={tr('ระบุตรานม', 'Specify milk brand')}
                        span="md:col-span-2"
                      />

                      <QuantityField
                        value={
                          item.volume
                        }
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'volume',
                            value
                          )
                        }
                        label={tr('ปริมาณ (มล.) *', 'Volume (ml) *')}
                        placeholder={tr('เช่น 200', 'e.g. 200')}
                      />

                      <QuantityField
                        value={
                          item.quantity
                        }
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'quantity',
                            value
                          )
                        }
                        label={tr('จำนวน *', 'Quantity *')}
                        placeholder={tr('เช่น 20', 'e.g. 20')}
                      />

                      <UnitField
                        label={tr('หน่วย *', 'Unit *')}
                        placeholder={tr('เลือกหน่วย', 'Select Unit')}
                        displayOption={optionLabel}
                        value={item.unit}
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'unit',
                            value
                          )
                        }
                        options={[
                          'ชิ้น',
                          'กล่อง',
                          'ขวด',
                          'แพ็ค',
                          'ลัง',
                        ]}
                      />

                      <ExpiryField
                        value={
                          item.expiryDate
                        }
                        locale={currentLocale}
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'expiryDate',
                            value
                          )
                        }
                      />

                      <DeleteButton
                        ariaLabel={tr('ลบรายการ', 'Delete Item')}
                        disabled={
                          items.length ===
                          1
                        }
                        onClick={() =>
                          handleRemoveItem(
                            item.id
                          )
                        }
                      />

                    </div>
                  )}

                  {/* =================================================
                      ข้าวสาร / Rice
                  ================================================== */}

                  {selectedDonationType ===
                    'rice' && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">

                      <SelectField
                        label={tr('ตราข้าวสาร *', 'Rice Brand *')}
                        value={
                          item.brand
                        }
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'brand',
                            value
                          )
                        }
                        options={[
                          'หงษ์ทอง',
                          'ฉัตร',
                          'มาบุญครอง',
                          'เบญจรงค์',
                          'ข้าวไก่แจ้',
                          '__other__',
                        ]}
                        otherValue={
                          item.otherBrand
                        }
                        onOtherChange={(value) =>
                          handleItemChange(
                            item.id,
                            'otherBrand',
                            value
                          )
                        }
                        placeholder={tr('เลือกตราข้าวสาร', 'Select Rice Brand')}
                        otherLabel={tr('อื่น ๆ', 'Other')}
                        displayOption={optionLabel}
                        otherPlaceholder={tr('ระบุตราข้าวสาร', 'Specify rice brand')}
                        span="md:col-span-3"
                      />

                      <QuantityField
                        value={
                          item.volume
                        }
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'volume',
                            value
                          )
                        }
                        label={tr('ปริมาณ (กิโลกรัม) *', 'Weight (kg) *')}
                        placeholder={tr('เช่น 5', 'e.g. 5')}
                      />

                      <QuantityField
                        value={
                          item.quantity
                        }
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'quantity',
                            value
                          )
                        }
                        label={tr('จำนวน *', 'Quantity *')}
                        placeholder={tr('เช่น 20', 'e.g. 20')}
                      />

                      <UnitField
                        label={tr('หน่วย *', 'Unit *')}
                        placeholder={tr('เลือกหน่วย', 'Select Unit')}
                        displayOption={optionLabel}
                        value={item.unit}
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'unit',
                            value
                          )
                        }
                        options={[
                          'ถุง',
                          'แพ็ค',
                          'กล่อง',
                          'กระสอบ',
                          'ลัง',
                          'กิโลกรัม',
                          'ชิ้น',
                        ]}
                      />

                      <ExpiryField
                        value={
                          item.expiryDate
                        }
                        locale={currentLocale}
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'expiryDate',
                            value
                          )
                        }
                      />

                      <DeleteButton
                        ariaLabel={tr('ลบรายการ', 'Delete Item')}
                        disabled={
                          items.length ===
                          1
                        }
                        onClick={() =>
                          handleRemoveItem(
                            item.id
                          )
                        }
                      />

                    </div>
                  )}

                  {/* =================================================
                      อาหารแห้ง / Dry Food
                  ================================================== */}

                  {selectedDonationType ===
                    'dry-food' && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">

                      <SelectField
                        label={tr('ชนิดของ *', 'Type *')}
                        value={
                          item.itemType
                        }
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'itemType',
                            value
                          )
                        }
                        options={[
                          'ปลากระป๋อง',
                          'อาหารกระป๋อง',
                          'บะหมี่กึ่งสำเร็จรูป',
                          'โจ๊กกึ่งสำเร็จรูป',
                          'ถั่ว',
                          'ธัญพืช',
                          'ขนม',
                          'อาหารสำเร็จรูป',
                          'น้ำปลา',
                          'ซอสปรุงรส',
                          'น้ำมันพืช',
                          '__other__',
                        ]}
                        otherValue={
                          item.otherItemType
                        }
                        onOtherChange={(value) =>
                          handleItemChange(
                            item.id,
                            'otherItemType',
                            value
                          )
                        }
                        placeholder={tr('เลือกชนิดอาหารแห้ง', 'Select Dry Food Type')}
                        otherLabel={tr('อื่น ๆ', 'Other')}
                        displayOption={optionLabel}
                        otherPlaceholder={tr('ระบุชนิดอาหารแห้ง', 'Specify dry food type')}
                        span="md:col-span-4"
                      />

                      <QuantityField
                        value={
                          item.quantity
                        }
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'quantity',
                            value
                          )
                        }
                        label={tr('จำนวน *', 'Quantity *')}
                        placeholder={tr('เช่น 20', 'e.g. 20')}
                      />

                      <UnitField
                        label={tr('หน่วย *', 'Unit *')}
                        placeholder={tr('เลือกหน่วย', 'Select Unit')}
                        displayOption={optionLabel}
                        value={item.unit}
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'unit',
                            value
                          )
                        }
                        options={[
                          'ชิ้น',
                          'ถุง',
                          'แพ็ค',
                          'กล่อง',
                          'ลัง',
                          'ห่อ',
                          'กระป๋อง',
                          'ขวด',
                          'กิโลกรัม',
                        ]}
                      />

                      <ExpiryField
                        value={
                          item.expiryDate
                        }
                        locale={currentLocale}
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'expiryDate',
                            value
                          )
                        }
                      />

                      <DeleteButton
                        ariaLabel={tr('ลบรายการ', 'Delete Item')}
                        disabled={
                          items.length ===
                          1
                        }
                        onClick={() =>
                          handleRemoveItem(
                            item.id
                          )
                        }
                      />

                    </div>
                  )}

                  {/* =================================================
                      ของใช้ / Supplies
                  ================================================== */}

                  {selectedDonationType ===
                    'hygiene' && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">

                      <SelectField
                        label={tr('ชนิดของใช้ *', 'Supply Type *')}
                        value={
                          item.itemType
                        }
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'itemType',
                            value
                          )
                        }
                        options={[
                          'สบู่',
                          'แชมพู',
                          'ยาสีฟัน',
                          'แปรงสีฟัน',
                          'ผ้าอนามัย',
                          'กระดาษทิชชู่',
                          'ผ้าเช็ดตัว',
                          'ผ้าห่ม',
                          'เสื้อผ้า',
                          'หน้ากากอนามัย',
                          'เจลแอลกอฮอล์',
                          'ผ้าอ้อม',
                          'น้ำยาซักผ้า',
                          'น้ำยาล้างจาน',
                          '__other__',
                        ]}
                        otherValue={
                          item.otherItemType
                        }
                        onOtherChange={(value) =>
                          handleItemChange(
                            item.id,
                            'otherItemType',
                            value
                          )
                        }
                        placeholder={tr('เลือกชนิดของใช้', 'Select Supply Type')}
                        otherLabel={tr('อื่น ๆ', 'Other')}
                        displayOption={optionLabel}
                        otherPlaceholder={tr('ระบุชนิดของใช้', 'Specify supply type')}
                        span="md:col-span-4"
                      />

                      <QuantityField
                        value={
                          item.quantity
                        }
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'quantity',
                            value
                          )
                        }
                        label={tr('จำนวน *', 'Quantity *')}
                        placeholder={tr('เช่น 20', 'e.g. 20')}
                      />

                      <UnitField
                        label={tr('หน่วย *', 'Unit *')}
                        placeholder={tr('เลือกหน่วย', 'Select Unit')}
                        displayOption={optionLabel}
                        value={item.unit}
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'unit',
                            value
                          )
                        }
                        options={[
                          'ชิ้น',
                          'แพ็ค',
                          'กล่อง',
                          'ถุง',
                          'ขวด',
                          'ห่อ',
                          'ลัง',
                          'ชุด',
                        ]}
                      />

                      <ExpiryField
                        value={
                          item.expiryDate
                        }
                        locale={currentLocale}
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'expiryDate',
                            value
                          )
                        }
                      />

                      <DeleteButton
                        ariaLabel={tr('ลบรายการ', 'Delete Item')}
                        disabled={
                          items.length ===
                          1
                        }
                        onClick={() =>
                          handleRemoveItem(
                            item.id
                          )
                        }
                      />

                    </div>
                  )}

                  {/* =================================================
                      ยา / Medicine
                  ================================================== */}

                  {selectedDonationType ===
                    'medicine' && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">

                      <SelectField
                        label={tr('ชนิดยา *', 'Medicine Type *')}
                        value={
                          item.itemType
                        }
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'itemType',
                            value
                          )
                        }
                        options={[
                          'พาราเซตามอล',
                          'ยาแก้ปวด',
                          'ยาลดไข้',
                          'ยาแก้แพ้',
                          'ยาแก้ไอ',
                          'ยาลดกรด',
                          'ยาแก้ท้องเสีย',
                          'ยาทาแผล',
                          'น้ำเกลือล้างแผล',
                          'ยาดม',
                          '__other__',
                        ]}
                        otherValue={
                          item.otherItemType
                        }
                        onOtherChange={(value) =>
                          handleItemChange(
                            item.id,
                            'otherItemType',
                            value
                          )
                        }
                        placeholder={tr('เลือกชนิดยา', 'Select Medicine Type')}
                        otherLabel={tr('อื่น ๆ', 'Other')}
                        displayOption={optionLabel}
                        otherPlaceholder={tr('ระบุชนิดยา', 'Specify medicine type')}
                        span="md:col-span-3"
                      />

                      <SelectField
                        label={tr('ยี่ห้อ *', 'Brand *')}
                        value={
                          item.brand
                        }
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'brand',
                            value
                          )
                        }
                        options={[
                          'TYLENOL',
                          'Sara',
                          'Panadol',
                          'Tiffy',
                          'Decolgen',
                          'Bayer',
                          'GPO',
                          '__other__',
                        ]}
                        otherValue={
                          item.otherBrand
                        }
                        onOtherChange={(value) =>
                          handleItemChange(
                            item.id,
                            'otherBrand',
                            value
                          )
                        }
                        placeholder={tr('เลือกยี่ห้อ', 'Select Brand')}
                        otherLabel={tr('อื่น ๆ', 'Other')}
                        displayOption={optionLabel}
                        otherPlaceholder={tr('ระบุยี่ห้อ', 'Specify brand')}
                        span="md:col-span-2"
                      />

                      <QuantityField
                        value={
                          item.quantity
                        }
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'quantity',
                            value
                          )
                        }
                        label={tr('จำนวน *', 'Quantity *')}
                        placeholder={tr('เช่น 50', 'e.g. 50')}
                      />

                      <UnitField
                        label={tr('หน่วย *', 'Unit *')}
                        placeholder={tr('เลือกหน่วย', 'Select Unit')}
                        displayOption={optionLabel}
                        value={item.unit}
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'unit',
                            value
                          )
                        }
                        options={[
                          'ชิ้น',
                          'แผง',
                          'กล่อง',
                          'ขวด',
                          'กระปุก',
                          'หลอด',
                          'ซอง',
                        ]}
                      />

                      <ExpiryField
                        value={
                          item.expiryDate
                        }
                        locale={currentLocale}
                        onChange={(value) =>
                          handleItemChange(
                            item.id,
                            'expiryDate',
                            value
                          )
                        }
                      />

                      <DeleteButton
                        ariaLabel={tr('ลบรายการ', 'Delete Item')}
                        disabled={
                          items.length ===
                          1
                        }
                        onClick={() =>
                          handleRemoveItem(
                            item.id
                          )
                        }
                      />

                    </div>
                  )}

                  {/* =================================================
                      Hidden data
                  ================================================== */}

                  {selectedType && (
                    <>
                      <input
                        type="hidden"
                        name={`item_name_${index}`}
                        value={buildItemName(
                          item
                        )}
                      />

                      <input
                        type="hidden"
                        name={`category_${index}`}
                        value={
                          item.category
                        }
                      />

                      <input
                        type="hidden"
                        name={`unit_${index}`}
                        value={item.unit}
                      />

                      <input
                        type="hidden"
                        name={`quantity_${index}`}
                        value={
                          item.quantity
                        }
                      />

                      <input
                        type="hidden"
                        name={`expiry_date_${index}`}
                        value={
                          item.expiryDate
                        }
                      />
                    </>
                  )}

                </div>
              )
            )}

          </div>

          {/* เพิ่มรายการ */}

          <button
            type="button"
            onClick={handleAddItem}
            className="mt-4 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-[#0E2A47] shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>

            <span>
              {tr('เพิ่มรายการ', 'Add Item')}
            </span>
          </button>

        </div>

        {/* =====================================================
            {tr('ปุ่ม', 'Actions')}
        ====================================================== */}

        <div className="mt-8 flex items-center gap-3">

          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-[#0E2A47] px-5 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-[#163a61]"
          >

            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9H17m-1-2l-3-3m0 0L10 5m3-3v9"
              />
            </svg>

            <span>
              {tr('บันทึกข้อมูล', 'Save')}
            </span>

          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >

            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>

            <span>
              {tr('ล้างข้อมูล', 'Reset')}
            </span>

          </button>

        </div>

      </form>

    </main>
  )
}

/* =========================================================
   Component: Select Field
========================================================= */

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  otherValue,
  onOtherChange,
  otherPlaceholder,
  span = 'md:col-span-3',
  otherLabel = 'อื่น ๆ',
  displayOption,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder: string
  otherValue?: string
  onOtherChange?: (
    value: string
  ) => void
  otherPlaceholder?: string
  span?: string
  otherLabel?: string
  displayOption?: (option: string) => string
}) {
  return (
    <div className={span}>

      <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        required
        className={inputClassName}
      >

        <option value="">
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option ===
            '__other__'
              ? otherLabel
              : (displayOption ? displayOption(option) : option)}
          </option>
        ))}

      </select>

      {value ===
        '__other__' &&
        onOtherChange && (
          <input
            type="text"
            value={
              otherValue ?? ''
            }
            onChange={(e) =>
              onOtherChange(
                e.target.value
              )
            }
            placeholder={otherPlaceholder ?? 'ระบุข้อมูล'}
            required
            className={`${inputClassName} mt-2`}
          />
        )}

    </div>
  )
}

/* =========================================================
   Component: Quantity Field
========================================================= */

function QuantityField({
  value,
  onChange,
  label,
  placeholder = 'เช่น 50',
}: {
  value: string
  onChange: (
    value: string
  ) => void
  label: string
  placeholder?: string
}) {
  return (
    <div className="md:col-span-2">

      <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>

      <input
        type="number"
        min="1"
        placeholder={placeholder}
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        required
        className={inputClassName}
      />

    </div>
  )
}

/* =========================================================
   Component: Unit Field
========================================================= */

function UnitField({
  value,
  onChange,
  options,
  label = 'หน่วย *',
  placeholder = 'เลือกหน่วย',
  displayOption,
}: {
  value: string
  onChange: (
    value: string
  ) => void
  options: string[]
  label?: string
  placeholder?: string
  displayOption?: (option: string) => string
}) {
  return (
    <div className="md:col-span-2">

      <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        required
        className={inputClassName}
      >

        <option value="">
          {placeholder}
        </option>

        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {displayOption ? displayOption(option) : option}
            </option>
          )
        )}

      </select>

    </div>
  )
}

/* =========================================================
   Component: วันหมดอายุ
========================================================= */

function ExpiryField({
  value,
  locale,
  onChange,
}: {
  value: string
  locale: 'th' | 'en'
  onChange: (value: string) => void
}) {
  const formatForInput = (isoDate: string) => {
    if (!isoDate) return ''

    const [year, month, day] = isoDate.split('-')

    if (!year || !month || !day) {
      return ''
    }

    if (locale === 'th') {
      return `${day}/${month}/${Number(year) + 543}`
    }

    return `${month}/${day}/${year}`
  }

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 8)

    if (!digits) {
      onChange('')
      return
    }

    const first = digits.slice(0, 2)
    const second = digits.slice(2, 4)
    const yearText = digits.slice(4, 8)

    let display = first

    if (digits.length > 2) {
      display += `/${second}`
    }

    if (digits.length > 4) {
      display += `/${yearText}`
    }

    event.target.value = display

    if (
      first.length !== 2 ||
      second.length !== 2 ||
      yearText.length !== 4
    ) {
      return
    }

    const day =
      locale === 'th'
        ? Number(first)
        : Number(second)

    const month =
      locale === 'th'
        ? Number(second)
        : Number(first)

    const year =
      locale === 'th'
        ? Number(yearText) - 543
        : Number(yearText)

    if (
      !Number.isInteger(day) ||
      !Number.isInteger(month) ||
      !Number.isInteger(year) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31 ||
      year < 1900 ||
      year > 2500
    ) {
      return
    }

    const date = new Date(year, month - 1, day)

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return
    }

    const isoDate =
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    onChange(isoDate)
  }

  return (
    <div className="md:col-span-3">

      <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
        {locale === 'th'
          ? 'วันหมดอายุ (ถ้ามี)'
          : 'Expiry Date (Optional)'}
      </label>

      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>

        <input
          type="text"
          inputMode="numeric"
          value={formatForInput(value)}
          onChange={handleChange}
          maxLength={10}
          placeholder={
            locale === 'th'
              ? 'วว/ดด/ปปปป'
              : 'mm/dd/yyyy'
          }
          aria-label={
            locale === 'th'
              ? 'วันหมดอายุ'
              : 'Expiry Date'
          }
          className="block h-11 w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0E2A47] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

    </div>
  )
}

/* =========================================================
   Component: ปุ่มลบ
========================================================= */

function DeleteButton({
  disabled,
  onClick,
  ariaLabel = 'ลบรายการ',
}: {
  disabled: boolean
  onClick: () => void
  ariaLabel?: string
}) {
  return (
    <div className="flex justify-end md:col-span-1">

      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="flex h-11 w-11 items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-rose-950/50 dark:text-rose-400"
        aria-label={ariaLabel}
      >

        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 01-1-1h-4a1 1 0 01-1 1v3M4 7h16"
          />
        </svg>

      </button>

    </div>
  )
}