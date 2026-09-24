'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import { UNITS } from '@/lib/units'

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
  donationType: string
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
  centerSelect?: React.ReactNode
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
    value: 'milk',
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

const createEmptyItem = (
  id: string,
  donationType = ''
): ItemRow => ({
  id,
  donationType,
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
})

export default function NewDonationForm({
  locale,
  error,
  createDonationAction,
  centerSelect,
}: NewDonationFormProps) {
  const currentLocale: 'th' | 'en' =
    locale ??
    (typeof document !== 'undefined' &&
    document.documentElement.lang
      .toLowerCase()
      .startsWith('en')
      ? 'en'
      : 'th')

  const tr = (th: string, en: string) =>
    currentLocale === 'th' ? th : en

  // =========================
  // DONOR
  // =========================

  const [donorFirstName, setDonorFirstName] =
    useState('')

  const [donorLastName, setDonorLastName] =
    useState('')

  const [phone, setPhone] = useState('')

  // =========================
  // LOCATION
  // =========================

  const [provinces, setProvinces] = useState<
    Province[]
  >([])

  const [districts, setDistricts] = useState<
    District[]
  >([])

  const [subdistricts, setSubdistricts] =
    useState<SubDistrict[]>([])

  const [provinceId, setProvinceId] =
    useState('')

  const [subdistrict, setSubdistrict] =
    useState('')

  const [loadingLocation, setLoadingLocation] =
    useState(true)

  // =========================
  // DONATION
  // =========================

  const [receivedDate, setReceivedDate] =
    useState('')

  const [religion, setReligion] =
    useState('พุทธ')

  const [
    selectedDonationType,
    setSelectedDonationType,
  ] = useState('')

  const [items, setItems] = useState<ItemRow[]>([
    createEmptyItem('1'),
  ])

  // =========================
  // VALIDATION ERROR
  // =========================

  const [validationError, setValidationError] =
    useState('')

  // =========================
  // LOAD LOCATION DATA
  // =========================

  useEffect(() => {
    const loadLocationData = async () => {
      try {
        setLoadingLocation(true)

        const [
          provincesResponse,
          districtsResponse,
          subdistrictsResponse,
        ] = await Promise.all([
          fetch(
            `${API_BASE}/province.json`
          ),
          fetch(
            `${API_BASE}/district.json`
          ),
          fetch(
            `${API_BASE}/sub_district.json`
          ),
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
        setSubdistricts(
          subdistrictsData
        )
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

  // =========================
  // FILTER SUBDISTRICT
  // =========================

  const selectedProvinceDistrictIds =
    districts
      .filter(
        (district) =>
          district.province_id ===
          Number(provinceId)
      )
      .map(
        (district) => district.id
      )

  const filteredSubdistricts =
    subdistricts.filter(
      (subdistrictItem) =>
        selectedProvinceDistrictIds.includes(
          subdistrictItem.district_id
        )
    )

  const handleProvinceChange = (
    value: string
  ) => {
    setProvinceId(value)
    setSubdistrict('')
    setValidationError('')
  }

  // =========================
  // DATE
  // =========================

  const formatDisplayDate = (
    date: string
  ) => {
    if (!date) return ''

    const [
      year,
      month,
      day,
    ] = date.split('-')

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

  // =========================
  // ITEMS
  // =========================

  const handleAddItem = () => {
    setValidationError('')

    setItems((prev) => [
      ...prev,
      createEmptyItem(
        Date.now().toString()
      ),
    ])
  }

  const handleRemoveItem = (
    id: string
  ) => {
    setValidationError('')

    if (items.length > 1) {
      setItems((prev) =>
        prev.filter(
          (item) =>
            item.id !== id
        )
      )
    }
  }

  const handleItemChange = (
    id: string,
    field: keyof ItemRow,
    value: string
  ) => {
    setValidationError('')

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

  // =========================
  // CHANGE CATEGORY
  // =========================

  const handleCategorySelect = (
    id: string,
    category: string,
    typeId: string
  ) => {
    setValidationError('')

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              donationType: typeId,
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

    if (items[0]?.id === id) {
      setSelectedDonationType(
        typeId
      )
    }
  }

  // =========================
  // VALIDATE ITEMS
  // =========================

  const validateItems = () => {
    if (!receivedDate) {
      return tr(
        'กรุณาเลือกวันที่รับบริจาค',
        'Please select the received date.'
      )
    }

    if (items.length === 0) {
      return tr(
        'กรุณาเพิ่มรายการสิ่งของอย่างน้อย 1 รายการ',
        'Please add at least one donation item.'
      )
    }

    for (
      let index = 0;
      index < items.length;
      index++
    ) {
      const item = items[index]
      const itemNumber = index + 1

      // =========================
      // CATEGORY
      // =========================

      if (
        !item.donationType ||
        !item.category
      ) {
        return tr(
          `รายการที่ ${itemNumber} ยังไม่ได้เลือกประเภทสิ่งของ`,
          `Item ${itemNumber}: please select a donation category.`
        )
      }

      // =========================
      // QUANTITY
      // =========================

      if (
        !item.quantity ||
        !/^\d+$/.test(
          item.quantity
        ) ||
        Number(item.quantity) < 1
      ) {
        return tr(
          `รายการที่ ${itemNumber} กรุณากรอกจำนวนให้ถูกต้อง`,
          `Item ${itemNumber}: please enter a valid quantity.`
        )
      }

      // =========================
      // UNIT
      // =========================

      if (!item.unit) {
        return tr(
          `รายการที่ ${itemNumber} กรุณาเลือกหน่วย`,
          `Item ${itemNumber}: please select a unit.`
        )
      }

      // =========================
      // MILK
      // =========================

      if (
        item.donationType ===
        'milk'
      ) {
        if (!item.itemType) {
          return tr(
            `รายการที่ ${itemNumber} กรุณาเลือกประเภทนม`,
            `Item ${itemNumber}: please select the milk type.`
          )
        }

        if (
          item.itemType ===
            '_other_' &&
          !item.otherItemType.trim()
        ) {
          return tr(
            `รายการที่ ${itemNumber} กรุณาระบุประเภทนม`,
            `Item ${itemNumber}: please specify the milk type.`
          )
        }

        if (!item.brand) {
          return tr(
            `รายการที่ ${itemNumber} กรุณาเลือกยี่ห้อนม`,
            `Item ${itemNumber}: please select the milk brand.`
          )
        }

        if (
          item.brand ===
            '_other_' &&
          !item.otherBrand.trim()
        ) {
          return tr(
            `รายการที่ ${itemNumber} กรุณาระบุยี่ห้อนม`,
            `Item ${itemNumber}: please specify the milk brand.`
          )
        }

        if (
          !item.volume ||
          Number(item.volume) <= 0
        ) {
          return tr(
            `รายการที่ ${itemNumber} กรุณากรอกปริมาตรนม`,
            `Item ${itemNumber}: please enter the milk volume.`
          )
        }
      }

      // =========================
      // WATER
      // =========================

      if (
        item.donationType ===
        'water'
      ) {
        if (!item.brand) {
          return tr(
            `รายการที่ ${itemNumber} กรุณาเลือกยี่ห้อน้ำ`,
            `Item ${itemNumber}: please select the water brand.`
          )
        }

        if (
          item.brand ===
            '_other_' &&
          !item.otherBrand.trim()
        ) {
          return tr(
            `รายการที่ ${itemNumber} กรุณาระบุยี่ห้อน้ำ`,
            `Item ${itemNumber}: please specify the water brand.`
          )
        }

        if (
          !item.volume ||
          Number(item.volume) <= 0
        ) {
          return tr(
            `รายการที่ ${itemNumber} กรุณากรอกปริมาตรน้ำ`,
            `Item ${itemNumber}: please enter the water volume.`
          )
        }
      }

      // =========================
      // RICE
      // =========================

      if (
        item.donationType ===
        'rice'
      ) {
        if (!item.brand) {
          return tr(
            `รายการที่ ${itemNumber} กรุณาเลือกยี่ห้อข้าวสาร`,
            `Item ${itemNumber}: please select the rice brand.`
          )
        }

        if (
          item.brand ===
            '_other_' &&
          !item.otherBrand.trim()
        ) {
          return tr(
            `รายการที่ ${itemNumber} กรุณาระบุยี่ห้อข้าวสาร`,
            `Item ${itemNumber}: please specify the rice brand.`
          )
        }

        if (
          !item.volume ||
          Number(item.volume) <= 0
        ) {
          return tr(
            `รายการที่ ${itemNumber} กรุณากรอกน้ำหนักข้าวสาร`,
            `Item ${itemNumber}: please enter the rice weight.`
          )
        }
      }

      // =========================
      // DRY FOOD
      // =========================

      if (
        item.donationType ===
        'dry-food'
      ) {
        if (!item.itemType) {
          return tr(
            `รายการที่ ${itemNumber} กรุณาเลือกประเภทอาหาร`,
            `Item ${itemNumber}: please select the food type.`
          )
        }

        if (
          item.itemType ===
            '_other_' &&
          !item.otherItemType.trim()
        ) {
          return tr(
            `รายการที่ ${itemNumber} กรุณาระบุประเภทอาหาร`,
            `Item ${itemNumber}: please specify the food type.`
          )
        }
      }

      // =========================
      // HYGIENE
      // =========================

      if (
        item.donationType ===
        'hygiene'
      ) {
        if (!item.itemType) {
          return tr(
            `รายการที่ ${itemNumber} กรุณาเลือกประเภทของใช้`,
            `Item ${itemNumber}: please select the supply type.`
          )
        }

        if (
          item.itemType ===
            '_other_' &&
          !item.otherItemType.trim()
        ) {
          return tr(
            `รายการที่ ${itemNumber} กรุณาระบุประเภทของใช้`,
            `Item ${itemNumber}: please specify the supply type.`
          )
        }
      }

      // =========================
      // MEDICINE
      // =========================

      if (
        item.donationType ===
        'medicine'
      ) {
        if (!item.itemType) {
          return tr(
            `รายการที่ ${itemNumber} กรุณาเลือกประเภทยา`,
            `Item ${itemNumber}: please select the medicine type.`
          )
        }

        if (
          item.itemType ===
            '_other_' &&
          !item.otherItemType.trim()
        ) {
          return tr(
            `รายการที่ ${itemNumber} กรุณาระบุประเภทยา`,
            `Item ${itemNumber}: please specify the medicine type.`
          )
        }
      }
    }

    return ''
  }

  // =========================
  // FORM SUBMIT
  // =========================

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    const message =
      validateItems()

    if (message) {
      event.preventDefault()

      setValidationError(
        message
      )

      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      }, 0)

      return
    }

    setValidationError('')
  }

  // =========================
  // RESET
  // =========================

  const handleReset = () => {
    setDonorFirstName('')
    setDonorLastName('')
    setPhone('')
    setProvinceId('')
    setSubdistrict('')
    setReceivedDate('')
    setReligion('พุทธ')
    setSelectedDonationType('')
    setValidationError('')

    setItems([
      createEmptyItem('1'),
    ])
  }

  // =========================
  // OPTION TRANSLATION
  // =========================

  const optionLabel = (
    option: string
  ) => {
    if (currentLocale === 'th') {
      return option
    }

    const labels: Record<
      string,
      string
    > = {
      'นม UHT': 'UHT Milk',
      'นมพาสเจอร์ไรส์':
        'Pasteurized Milk',
      'นมถั่วเหลือง':
        'Soy Milk',
      'นมผง':
        'Milk Powder',
      'นมรสช็อกโกแลต':
        'Chocolate Milk',
      'นมรสจืด':
        'Plain Milk',

      'ปลากระป๋อง':
        'Canned Fish',
      'อาหารกระป๋อง':
        'Canned Food',
      'บะหมี่กึ่งสำเร็จรูป':
        'Instant Noodles',
      'โจ๊กกึ่งสำเร็จรูป':
        'Instant Porridge',
      'ถั่ว':
        'Beans / Nuts',
      'ธัญพืช':
        'Cereals / Grains',
      'ขนม':
        'Snacks',
      'อาหารสำเร็จรูป':
        'Ready-to-eat Food',
      'น้ำปลา':
        'Fish Sauce',
      'ซอสปรุงรส':
        'Seasoning Sauce',
      'น้ำมันพืช':
        'Cooking Oil',

      'สบู่': 'Soap',
      'แชมพู': 'Shampoo',
      'ยาสีฟัน':
        'Toothpaste',
      'แปรงสีฟัน':
        'Toothbrush',
      'ผ้าอนามัย':
        'Sanitary Pads',
      'กระดาษทิชชู่':
        'Tissue Paper',
      'ผ้าเช็ดตัว':
        'Towel',
      'ผ้าห่ม':
        'Blanket',
      'เสื้อผ้า':
        'Clothing',
      'หน้ากากอนามัย':
        'Face Mask',
      'เจลแอลกอฮอล์':
        'Hand Sanitizer',
      'ผ้าอ้อม':
        'Diapers',
      'น้ำยาซักผ้า':
        'Laundry Detergent',
      'น้ำยาล้างจาน':
        'Dishwashing Liquid',

      'พาราเซตามอล':
        'Paracetamol',
      'ยาแก้ปวด':
        'Painkiller',
      'ยาลดไข้':
        'Fever Reducer',
      'ยาแก้แพ้':
        'Antihistamine',
      'ยาแก้ไอ':
        'Cough Medicine',
      'ยาลดกรด':
        'Antacid',
      'ยาแก้ท้องเสีย':
        'Anti-diarrheal Medicine',
      'ยาทาแผล':
        'Wound Ointment',
      'น้ำเกลือล้างแผล':
        'Wound Cleaning Saline',
      'ยาดม':
        'Inhaler',

      'สิงห์': 'Singha',
      'คริสตัล': 'Crystal',
      'เนสท์เล่ เพียวไลฟ์':
        'Nestlé Pure Life',
      'ช้าง': 'Chang',
      'อควาฟิน่า': 'Aquafina',
      'น้ำทิพย์': 'Namthip',
      'เพอร์ร่า': 'Purra',

      'หงษ์ทอง':
        'Hong Thong',
      'ฉัตร': 'Chat',
      'มาบุญครอง':
        'Ma Boon Khrong',
      'เบญจรงค์':
        'Benjarong',
      'ข้าวไก่แจ้':
        'Kai Jae Rice',

      'ชิ้น': 'piece',
      'กล่อง': 'box',
      'ขวด': 'bottle',
      'แพ็ค': 'pack',
      'ลัง': 'case',
      'ถัง': 'container',
      'ถุง': 'bag',
      'กระสอบ': 'sack',
      'กิโลกรัม':
        'kilogram',
      'ห่อ': 'bundle',
      'กระป๋อง': 'can',
      'ชุด': 'set',
      'แผง': 'blister pack',
      'กระปุก': 'jar',
      'หลอด': 'tube',
      'ซอง': 'sachet',

      'ไทย-เดนมาร์ค':
        'Thai-Denmark',
      'โฟร์โมสต์':
        'Foremost',
      'เมจิ': 'Meiji',
      'ดัชมิลล์':
        'Dutch Mill',
      'หนองโพ':
        'Nongpho',
      'ไวตามิ้ลค์':
        'Vitamilk',
      'มะลิ': 'Mali',
    }

    return labels[option] ?? option
  }

  // =========================
  // ITEM NAME
  // =========================

  const getActualBrand = (
    item: ItemRow
  ) => {
    return item.brand === '_other_'
      ? item.otherBrand
      : item.brand
  }

  const getActualItemType = (
    item: ItemRow
  ) => {
    return item.itemType ===
      '_other_'
      ? item.otherItemType
      : item.itemType
  }

  const buildItemName = (
    item: ItemRow
  ) => {
    const brand =
      getActualBrand(item)

    const itemType =
      getActualItemType(item)

    switch (
      item.donationType
    ) {
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

  const selectedProvince =
    provinces.find(
      (province) =>
        province.id ===
        Number(provinceId)
    )

  const fullDonorName = [
    donorFirstName.trim(),
    donorLastName.trim(),
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <form
      action={
        createDonationAction
      }
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* =========================
          VALIDATION ERROR
      ========================= */}

      {validationError && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        >
          <div className="font-semibold">
            {tr(
              'ไม่สามารถบันทึกข้อมูลได้',
              'Unable to save donation'
            )}
          </div>

          <div className="mt-1">
            {validationError}
          </div>

          <div className="mt-2 text-xs">
            {tr(
              'กรุณากรอกข้อมูลให้ครบทุกช่องที่จำเป็นก่อนบันทึก',
              'Please complete all required fields before saving.'
            )}
          </div>
        </div>
      )}

      {/* =========================
          DESTINATION CENTER
      ========================= */}

      {centerSelect && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {tr(
                'ศูนย์ปลายทาง / คลังสินค้า',
                'Destination Center / Warehouse'
              )}
            </h2>
          </div>

          {centerSelect}
        </section>
      )}

      {/* =========================
          DONOR INFORMATION
      ========================= */}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {tr(
              'ข้อมูลผู้บริจาค',
              'Donor Information'
            )}
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
              {tr(
                'ชื่อ',
                'First Name'
              )}
            </label>

            <input
              type="text"
              value={
                donorFirstName
              }
              onChange={(e) =>
                setDonorFirstName(
                  e.target.value
                )
              }
              placeholder={tr(
                'กรอกชื่อ',
                'Enter first name'
              )}
              className={
                inputClassName
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
              {tr(
                'นามสกุล',
                'Last Name'
              )}
            </label>

            <input
              type="text"
              value={
                donorLastName
              }
              onChange={(e) =>
                setDonorLastName(
                  e.target.value
                )
              }
              placeholder={tr(
                'กรอกนามสกุล',
                'Enter last name'
              )}
              className={
                inputClassName
              }
            />
          </div>

          <input
            type="hidden"
            name="donor_name"
            value={
              fullDonorName
            }
          />

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
              {tr(
                'เบอร์โทรศัพท์',
                'Phone Number'
              )}
            </label>

            <input
              type="tel"
              name="phone"
              value={phone}
              onChange={(e) =>
                setPhone(
                  e.target.value
                )
              }
              placeholder={tr(
                'กรอกเบอร์โทรศัพท์',
                'Enter phone number'
              )}
              className={
                inputClassName
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
              {tr(
                'ตำบล',
                'Subdistrict'
              )}
            </label>

            <select
              name="subdistrict"
              value={
                subdistrict
              }
              onChange={(e) => {
                setSubdistrict(
                  e.target.value
                )
                setValidationError('')
              }}
              disabled={
                loadingLocation ||
                !provinceId
              }
              className={
                inputClassName
              }
            >
              <option value="">
                {loadingLocation
                  ? tr(
                      'กำลังโหลดข้อมูล...',
                      'Loading...'
                    )
                  : !provinceId
                    ? tr(
                        'เลือกจังหวัดก่อน',
                        'Select province first'
                      )
                    : tr(
                        'เลือกตำบล',
                        'Select subdistrict'
                      )}
              </option>

              {filteredSubdistricts.map(
                (item) => (
                  <option
                    key={item.id}
                    value={
                      currentLocale ===
                      'th'
                        ? item.name_th
                        : item.name_en
                    }
                  >
                    {currentLocale ===
                    'th'
                      ? item.name_th
                      : item.name_en}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
              {tr(
                'จังหวัด',
                'Province'
              )}
            </label>

            <select
              name="province_id"
              value={
                provinceId
              }
              onChange={(e) =>
                handleProvinceChange(
                  e.target.value
                )
              }
              disabled={
                loadingLocation
              }
              className={
                inputClassName
              }
            >
              <option value="">
                {loadingLocation
                  ? tr(
                      'กำลังโหลดข้อมูล...',
                      'Loading...'
                    )
                  : tr(
                      'เลือกจังหวัด',
                      'Select province'
                    )}
              </option>

              {provinces.map(
                (province) => (
                  <option
                    key={province.id}
                    value={
                      province.id
                    }
                  >
                    {currentLocale ===
                    'th'
                      ? province.name_th
                      : province.name_en}
                  </option>
                )
              )}
            </select>

            <input
              type="hidden"
              name="province_name"
              value={
                selectedProvince?.name_th ??
                ''
              }
            />
          </div>
        </div>
      </section>

      {/* =========================
          DONATION INFORMATION
      ========================= */}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {tr(
              'ข้อมูลการรับบริจาค',
              'Donation Information'
            )}
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* RECEIVED DATE */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
              {tr(
                'วันที่รับบริจาค',
                'Received Date'
              )}{' '}
              <span className="text-red-500">
                *
              </span>
            </label>

            <div className="relative">
              {!receivedDate && (
                <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-xs text-slate-400">
                  {currentLocale === 'th'
                    ? 'วว/ดด/ปปปป'
                    : 'mm/dd/yyyy'}
                </span>
              )}

              <input
                type="date"
                name="received_date"
                value={
                  receivedDate
                }
                required
                onChange={(e) => {
                  setReceivedDate(
                    e.target.value
                  )
                  setValidationError('')
                }}
                lang={
                  currentLocale === 'th'
                    ? 'th-TH'
                    : 'en-US'
                }
                className={`${inputClassName} ${
                  !receivedDate
                    ? 'text-transparent'
                    : ''
                }`}
              />
            </div>

            <p className="mt-1 text-[11px] text-slate-400">
              {formatDisplayDate(
                receivedDate
              )}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
              {tr(
                'ประเภทตามศาสนา',
                'Religious Type'
              )}
            </label>

            <div className="flex gap-3">
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-700">
                <input
                  type="radio"
                  name="religion"
                  value="พุทธ"
                  checked={
                    religion ===
                    'พุทธ'
                  }
                  onChange={(e) =>
                    setReligion(
                      e.target.value
                    )
                  }
                />

                <span className="text-xs text-slate-700 dark:text-slate-300">
                  {tr(
                    'พุทธ',
                    'Buddhist'
                  )}
                </span>
              </label>

              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-700">
                <input
                  type="radio"
                  name="religion"
                  value="ฮาลาล"
                  checked={
                    religion ===
                    'ฮาลาล'
                  }
                  onChange={(e) =>
                    setReligion(
                      e.target.value
                    )
                  }
                />

                <span className="text-xs text-slate-700 dark:text-slate-300">
                  {tr(
                    'ฮาลาล',
                    'Halal'
                  )}
                </span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          DONATION TYPE
      ========================= */}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {tr(
              'ประเภทสิ่งของบริจาค',
              'Donation Type'
            )}
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            {tr(
              'เลือกหมวดสำหรับรายการแรก และสามารถเปลี่ยนหมวดของแต่ละรายการได้ภายหลัง',
              'Select a category for the first item. Each item can have a different category.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {donationTypes.map(
            (type) => {
              const selected =
                selectedDonationType ===
                type.id

              return (
                <button
                  key={
                    type.id
                  }
                  type="button"
                  onClick={() =>
                    handleCategorySelect(
                      items[0].id,
                      type.value,
                      type.id
                    )
                  }
                  className={`rounded-xl border p-4 text-center transition ${
                    selected
                      ? 'border-[#0E2A47] bg-[#0E2A47]/5 dark:border-slate-400 dark:bg-slate-800'
                      : 'border-slate-200 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500'
                  }`}
                >
                  <div className="mb-2 text-2xl">
                    {
                      type.icon
                    }
                  </div>

                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {currentLocale ===
                    'th'
                      ? type.labelTh
                      : type.labelEn}
                  </div>
                </button>
              )
            }
          )}
        </div>
      </section>

      {/* =========================
          ITEMS
      ========================= */}

      {items.some(
        (item) =>
          item.donationType !== ''
      ) && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {tr(
                'รายการสิ่งของบริจาค',
                'Donation Items'
              )}
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {tr(
                'แต่ละรายการสามารถเลือกหมวดสิ่งของแตกต่างกันได้',
                'Each item can have a different donation category.'
              )}
            </p>
          </div>

          <div className="space-y-5">
            {items.map(
              (item, index) => {
                const itemType =
                  donationTypes.find(
                    (type) =>
                      type.id ===
                      item.donationType
                  ) ?? null

                return (
                  <div
                    key={
                      item.id
                    }
                    className="relative rounded-xl border border-slate-200 p-5 dark:border-slate-700"
                  >
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveItem(
                            item.id
                          )
                        }
                        className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                        aria-label={tr(
                          'ลบรายการ',
                          'Delete item'
                        )}
                      >
                        ×
                      </button>
                    )}

                    <div className="mb-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {tr(
                        `รายการที่ ${
                          index + 1
                        }`,
                        `Item ${
                          index + 1
                        }`
                      )}
                    </div>

                    <div className="mb-5">
                      <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                        {tr(
                          'ประเภทสิ่งของ',
                          'Donation Category'
                        )}{' '}
                        <span className="text-red-500">
                          *
                        </span>
                      </label>

                      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
                        {donationTypes.map(
                          (type) => {
                            const selected =
                              item.donationType ===
                              type.id

                            return (
                              <button
                                key={
                                  type.id
                                }
                                type="button"
                                onClick={() =>
                                  handleCategorySelect(
                                    item.id,
                                    type.value,
                                    type.id
                                  )
                                }
                                className={`rounded-lg border px-3 py-3 text-center transition ${
                                  selected
                                    ? 'border-[#0E2A47] bg-[#0E2A47]/5 dark:border-slate-400 dark:bg-slate-800'
                                    : 'border-slate-200 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500'
                                }`}
                              >
                                <div className="mb-1 text-xl">
                                  {
                                    type.icon
                                  }
                                </div>

                                <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                  {currentLocale ===
                                  'th'
                                    ? type.labelTh
                                    : type.labelEn}
                                </div>
                              </button>
                            )
                          }
                        )}
                      </div>
                    </div>

                    {itemType && (
                      <>
                        <div className="mb-4 flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800">
                          <span className="text-xl">
                            {
                              itemType.icon
                            }
                          </span>

                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {currentLocale ===
                            'th'
                              ? itemType.labelTh
                              : itemType.labelEn}
                          </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                          {/* MILK TYPE */}
                          {item.donationType ===
                            'milk' && (
                            <div>
                              <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                {tr(
                                  'ประเภทนม',
                                  'Milk Type'
                                )}{' '}
                                <span className="text-red-500">
                                  *
                                </span>
                              </label>

                              <select
                                value={
                                  item.itemType
                                }
                                required
                                onChange={(
                                  e
                                ) =>
                                  handleItemChange(
                                    item.id,
                                    'itemType',
                                    e.target.value
                                  )
                                }
                                className={
                                  inputClassName
                                }
                              >
                                <option value="">
                                  {tr(
                                    'เลือกประเภท',
                                    'Select type'
                                  )}
                                </option>

                                {[
                                  'นม UHT',
                                  'นมพาสเจอร์ไรส์',
                                  'นมถั่วเหลือง',
                                  'นมผง',
                                  'นมรสช็อกโกแลต',
                                  'นมรสจืด',
                                ].map(
                                  (
                                    option
                                  ) => (
                                    <option
                                      key={
                                        option
                                      }
                                      value={
                                        option
                                      }
                                    >
                                      {optionLabel(
                                        option
                                      )}
                                    </option>
                                  )
                                )}

                                <option value="_other_">
                                  {tr(
                                    'อื่น ๆ',
                                    'Other'
                                  )}
                                </option>
                              </select>
                            </div>
                          )}

                          {/* WATER BRAND */}
                          {item.donationType ===
                            'water' && (
                            <div>
                              <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                {tr(
                                  'ยี่ห้อ',
                                  'Brand'
                                )}{' '}
                                <span className="text-red-500">
                                  *
                                </span>
                              </label>

                              <select
                                value={
                                  item.brand
                                }
                                required
                                onChange={(
                                  e
                                ) =>
                                  handleItemChange(
                                    item.id,
                                    'brand',
                                    e.target.value
                                  )
                                }
                                className={
                                  inputClassName
                                }
                              >
                                <option value="">
                                  {tr(
                                    'เลือกยี่ห้อ',
                                    'Select brand'
                                  )}
                                </option>

                                {[
                                  'สิงห์',
                                  'คริสตัล',
                                  'เนสท์เล่ เพียวไลฟ์',
                                  'ช้าง',
                                  'อควาฟิน่า',
                                  'น้ำทิพย์',
                                  'เพอร์ร่า',
                                ].map(
                                  (
                                    option
                                  ) => (
                                    <option
                                      key={
                                        option
                                      }
                                      value={
                                        option
                                      }
                                    >
                                      {optionLabel(
                                        option
                                      )}
                                    </option>
                                  )
                                )}

                                <option value="_other_">
                                  {tr(
                                    'อื่น ๆ',
                                    'Other'
                                  )}
                                </option>
                              </select>
                            </div>
                          )}

                          {/* RICE */}
                          {item.donationType ===
                            'rice' && (
                            <>
                              <div>
                                <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                  {tr(
                                    'ยี่ห้อ',
                                    'Brand'
                                  )}{' '}
                                  <span className="text-red-500">
                                    *
                                  </span>
                                </label>

                                <select
                                  value={
                                    item.brand
                                  }
                                  required
                                  onChange={(
                                    e
                                  ) =>
                                    handleItemChange(
                                      item.id,
                                      'brand',
                                      e.target.value
                                    )
                                  }
                                  className={
                                    inputClassName
                                  }
                                >
                                  <option value="">
                                    {tr(
                                      'เลือกยี่ห้อ',
                                      'Select brand'
                                    )}
                                  </option>

                                  {[
                                    'หงษ์ทอง',
                                    'ฉัตร',
                                    'มาบุญครอง',
                                    'เบญจรงค์',
                                    'ข้าวไก่แจ้',
                                    'มะลิ',
                                  ].map(
                                    (
                                      option
                                    ) => (
                                      <option
                                        key={
                                          option
                                        }
                                        value={
                                          option
                                        }
                                      >
                                        {optionLabel(
                                          option
                                        )}
                                      </option>
                                    )
                                  )}

                                  <option value="_other_">
                                    {tr(
                                      'อื่น ๆ',
                                      'Other'
                                    )}
                                  </option>
                                </select>
                              </div>

                              <div>
                                <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                  {tr(
                                    'น้ำหนัก (กก.)',
                                    'Weight (kg)'
                                  )}{' '}
                                  <span className="text-red-500">
                                    *
                                  </span>
                                </label>

                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={
                                    item.volume
                                  }
                                  required
                                  onChange={(
                                    e
                                  ) =>
                                    handleItemChange(
                                      item.id,
                                      'volume',
                                      e.target.value
                                    )
                                  }
                                  placeholder="0"
                                  className={
                                    inputClassName
                                  }
                                />
                              </div>
                            </>
                          )}

                          {/* DRY FOOD */}
                          {item.donationType ===
                            'dry-food' && (
                            <div>
                              <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                {tr(
                                  'ประเภทอาหาร',
                                  'Food Type'
                                )}{' '}
                                <span className="text-red-500">
                                  *
                                </span>
                              </label>

                              <select
                                value={
                                  item.itemType
                                }
                                required
                                onChange={(
                                  e
                                ) =>
                                  handleItemChange(
                                    item.id,
                                    'itemType',
                                    e.target.value
                                  )
                                }
                                className={
                                  inputClassName
                                }
                              >
                                <option value="">
                                  {tr(
                                    'เลือกประเภท',
                                    'Select type'
                                  )}
                                </option>

                                {[
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
                                ].map(
                                  (
                                    option
                                  ) => (
                                    <option
                                      key={
                                        option
                                      }
                                      value={
                                        option
                                      }
                                    >
                                      {optionLabel(
                                        option
                                      )}
                                    </option>
                                  )
                                )}

                                <option value="_other_">
                                  {tr(
                                    'อื่น ๆ',
                                    'Other'
                                  )}
                                </option>
                              </select>
                            </div>
                          )}

                          {/* HYGIENE */}
                          {item.donationType ===
                            'hygiene' && (
                            <div>
                              <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                {tr(
                                  'ประเภทของใช้',
                                  'Supply Type'
                                )}{' '}
                                <span className="text-red-500">
                                  *
                                </span>
                              </label>

                              <select
                                value={
                                  item.itemType
                                }
                                required
                                onChange={(
                                  e
                                ) =>
                                  handleItemChange(
                                    item.id,
                                    'itemType',
                                    e.target.value
                                  )
                                }
                                className={
                                  inputClassName
                                }
                              >
                                <option value="">
                                  {tr(
                                    'เลือกประเภท',
                                    'Select type'
                                  )}
                                </option>

                                {[
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
                                ].map(
                                  (
                                    option
                                  ) => (
                                    <option
                                      key={
                                        option
                                      }
                                      value={
                                        option
                                      }
                                    >
                                      {optionLabel(
                                        option
                                      )}
                                    </option>
                                  )
                                )}

                                <option value="_other_">
                                  {tr(
                                    'อื่น ๆ',
                                    'Other'
                                  )}
                                </option>
                              </select>
                            </div>
                          )}

                          {/* MEDICINE */}
                          {item.donationType ===
                            'medicine' && (
                            <div>
                              <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                {tr(
                                  'ประเภทยา',
                                  'Medicine Type'
                                )}{' '}
                                <span className="text-red-500">
                                  *
                                </span>
                              </label>

                              <select
                                value={
                                  item.itemType
                                }
                                required
                                onChange={(
                                  e
                                ) =>
                                  handleItemChange(
                                    item.id,
                                    'itemType',
                                    e.target.value
                                  )
                                }
                                className={
                                  inputClassName
                                }
                              >
                                <option value="">
                                  {tr(
                                    'เลือกประเภท',
                                    'Select type'
                                  )}
                                </option>

                                {[
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
                                ].map(
                                  (
                                    option
                                  ) => (
                                    <option
                                      key={
                                        option
                                      }
                                      value={
                                        option
                                      }
                                    >
                                      {optionLabel(
                                        option
                                      )}
                                    </option>
                                  )
                                )}

                                <option value="_other_">
                                  {tr(
                                    'อื่น ๆ',
                                    'Other'
                                  )}
                                </option>
                              </select>
                            </div>
                          )}

                          {/* OTHER ITEM TYPE */}
                          {item.itemType ===
                            '_other_' && (
                            <div>
                              <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                {tr(
                                  'ระบุประเภท',
                                  'Specify Type'
                                )}{' '}
                                <span className="text-red-500">
                                  *
                                </span>
                              </label>

                              <input
                                type="text"
                                value={
                                  item.otherItemType
                                }
                                required
                                onChange={(
                                  e
                                ) =>
                                  handleItemChange(
                                    item.id,
                                    'otherItemType',
                                    e.target.value
                                  )
                                }
                                placeholder={tr(
                                  'ระบุประเภท',
                                  'Specify type'
                                )}
                                className={
                                  inputClassName
                                }
                              />
                            </div>
                          )}

                          {/* MILK / WATER */}
                          {(item.donationType ===
                            'milk' ||
                            item.donationType ===
                              'water') && (
                            <>
                              {/* MILK BRAND */}
                              {item.donationType ===
                                'milk' && (
                                <div>
                                  <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {tr(
                                      'ยี่ห้อ',
                                      'Brand'
                                    )}{' '}
                                    <span className="text-red-500">
                                      *
                                    </span>
                                  </label>

                                  <select
                                    value={
                                      item.brand
                                    }
                                    required
                                    onChange={(
                                      e
                                    ) =>
                                      handleItemChange(
                                        item.id,
                                        'brand',
                                        e.target.value
                                      )
                                    }
                                    className={
                                      inputClassName
                                    }
                                  >
                                    <option value="">
                                      {tr(
                                        'เลือกยี่ห้อ',
                                        'Select brand'
                                      )}
                                    </option>

                                    {[
                                      'ไทย-เดนมาร์ค',
                                      'โฟร์โมสต์',
                                      'เมจิ',
                                      'ดัชมิลล์',
                                      'หนองโพ',
                                      'ไวตามิ้ลค์',
                                    ].map(
                                      (
                                        option
                                      ) => (
                                        <option
                                          key={
                                            option
                                          }
                                          value={
                                            option
                                          }
                                        >
                                          {optionLabel(
                                            option
                                          )}
                                        </option>
                                      )
                                    )}

                                    <option value="_other_">
                                      {tr(
                                        'อื่น ๆ',
                                        'Other'
                                      )}
                                    </option>
                                  </select>
                                </div>
                              )}

                              {/* OTHER BRAND */}
                              {item.brand ===
                                '_other_' && (
                                <div>
                                  <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {tr(
                                      'ระบุยี่ห้อ',
                                      'Specify Brand'
                                    )}{' '}
                                    <span className="text-red-500">
                                      *
                                    </span>
                                  </label>

                                  <input
                                    type="text"
                                    value={
                                      item.otherBrand
                                    }
                                    required
                                    onChange={(
                                      e
                                    ) =>
                                      handleItemChange(
                                        item.id,
                                        'otherBrand',
                                        e.target.value
                                      )
                                    }
                                    placeholder={tr(
                                      'ระบุยี่ห้อ',
                                      'Specify brand'
                                    )}
                                    className={
                                      inputClassName
                                    }
                                  />
                                </div>
                              )}

                              {/* VOLUME */}
                              <div>
                                <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                  {tr(
                                    'ปริมาตร (มล.)',
                                    'Volume (ml)'
                                  )}{' '}
                                  <span className="text-red-500">
                                    *
                                  </span>
                                </label>

                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={
                                    item.volume
                                  }
                                  required
                                  onChange={(
                                    e
                                  ) =>
                                    handleItemChange(
                                      item.id,
                                      'volume',
                                      e.target.value
                                    )
                                  }
                                  placeholder="0"
                                  className={
                                    inputClassName
                                  }
                                />
                              </div>
                            </>
                          )}

                          {/* QUANTITY */}
                          <div>
                            <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                              {tr(
                                'จำนวน',
                                'Quantity'
                              )}{' '}
                              <span className="text-red-500">
                                *
                              </span>
                            </label>

                            <input
                              type="number"
                              min="1"
                              step="1"
                              inputMode="numeric"
                              value={
                                item.quantity
                              }
                              required
                              onChange={(
                                e
                              ) => {
                                const value =
                                  e.target.value

                                if (
                                  value ===
                                    '' ||
                                  /^\d+$/.test(
                                    value
                                  )
                                ) {
                                  handleItemChange(
                                    item.id,
                                    'quantity',
                                    value
                                  )
                                }
                              }}
                              placeholder="0"
                              className={
                                inputClassName
                              }
                            />
                          </div>

                          {/* UNIT */}
                          <div>
                            <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
                              {tr(
                                'หน่วย',
                                'Unit'
                              )}{' '}
                              <span className="text-red-500">
                                *
                              </span>
                            </label>

                            <select
                              value={
                                item.unit
                              }
                              required
                              onChange={(
                                e
                              ) =>
                                handleItemChange(
                                  item.id,
                                  'unit',
                                  e.target.value
                                )
                              }
                              className={
                                inputClassName
                              }
                            >
                              <option value="">
                                {tr(
                                  'เลือกหน่วย',
                                  'Select unit'
                                )}
                              </option>

                              {UNITS.map(
                                (option) => (
                                  <option
                                    key={
                                      option
                                    }
                                    value={
                                      option
                                    }
                                  >
                                    {optionLabel(
                                      option
                                    )}
                                  </option>
                                )
                              )}
                            </select>
                          </div>

                          {/* EXPIRY DATE */}
                          <ExpiryField
                            value={
                              item.expiryDate
                            }
                            locale={
                              currentLocale
                            }
                            onChange={(
                              value
                            ) =>
                              handleItemChange(
                                item.id,
                                'expiryDate',
                                value
                              )
                            }
                          />
                        </div>

                        {/* HIDDEN VALUES */}
                        <input
                          type="hidden"
                          name="item_name"
                          value={buildItemName(
                            item
                          )}
                        />

                        <input
                          type="hidden"
                          name="category"
                          value={
                            item.category
                          }
                        />

                        <input
                          type="hidden"
                          name="unit"
                          value={
                            item.unit
                          }
                        />

                        <input
                          type="hidden"
                          name="quantity"
                          value={
                            item.quantity
                          }
                        />

                        <input
                          type="hidden"
                          name="quantity_received"
                          value={
                            item.quantity
                          }
                        />

                        <input
                          type="hidden"
                          name="expiry_date"
                          value={
                            item.expiryDate
                          }
                        />
                      </>
                    )}

                    {!itemType && (
                      <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center dark:border-slate-700">
                        <p className="text-xs text-slate-400">
                          {tr(
                            'กรุณาเลือกประเภทสิ่งของสำหรับรายการนี้',
                            'Please select a donation category for this item.'
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )
              }
            )}
          </div>

          {/* ADD ITEM */}
          <button
            type="button"
            onClick={
              handleAddItem
            }
            className="mt-5 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-xs font-medium text-slate-600 hover:border-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-white"
          >
            +{' '}
            {tr(
              'เพิ่มรายการ',
              'Add Item'
            )}
          </button>
        </section>
      )}

      {/* =========================
          BUTTONS
      ========================= */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/donations"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-5 py-3 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {tr(
            '← กลับไปหน้ารายการ',
            '← Back to List'
          )}
        </Link>

        <button
          type="button"
          onClick={
            handleReset
          }
          className="rounded-lg border border-slate-200 px-5 py-3 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {tr(
            'ล้างข้อมูล',
            'Reset'
          )}
        </button>

        <button
          type="submit"
          disabled={
            !createDonationAction
          }
          className="rounded-lg bg-[#0E2A47] px-6 py-3 text-xs font-medium text-white hover:bg-[#12395f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {tr(
            'บันทึกการรับบริจาค',
            'Save Donation'
          )}
        </button>
      </div>
    </form>
  )
}

/* =====================================================
   EXPIRY FIELD
   ใช้ Native Date Picker
===================================================== */

function ExpiryField({
  value,
  locale,
  onChange,
}: {
  value: string
  locale: 'th' | 'en'
  onChange: (
    value: string
  ) => void
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
        {locale === 'th'
          ? 'วันหมดอายุ (ถ้ามี)'
          : 'Expiry Date (Optional)'}
      </label>

      <div className="relative">
        {!value && (
          <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-xs text-slate-400">
            {locale === 'th'
              ? 'วว/ดด/ปปปป'
              : 'mm/dd/yyyy'}
          </span>
        )}

        <input
          type="date"
          value={
            value || ''
          }
          onChange={(
            event
          ) => {
            onChange(
              event.target.value
            )
          }}
          aria-label={
            locale === 'th'
              ? 'วันหมดอายุ'
              : 'Expiry Date'
          }
          lang={
            locale === 'th'
              ? 'th-TH'
              : 'en-US'
          }
          className={`block h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-[#0E2A47] focus:outline-none dark:border-slate-700 dark:bg-slate-800 ${
            !value
              ? 'text-transparent'
              : 'text-slate-900 dark:text-slate-100'
          }`}
        />
      </div>
    </div>
  )
}