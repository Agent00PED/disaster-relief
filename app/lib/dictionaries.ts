const dictionaries = {
  th: {
    title: "ระบบติดตามการบริจาค",
    donors: {
      title: "ผู้บริจาค",
      searchTitle: "ค้นหาผู้บริจาค",
      searchSubtitle: "จัดการและค้นหาข้อมูลผู้บริจาคทั้งหมดในระบบ",
      addNew: "เพิ่มผู้บริจาค",
      searchByName: "ค้นหาด้วยชื่อ",
      searchPlaceholder: "ระบุชื่อผู้บริจาค...",
      allStatuses: "ทุกสถานะ",
      active: "ใช้งาน",
      inactive: "ระงับใช้งาน",
      notFound: "ไม่พบข้อมูลผู้บริจาค",
      previousPage: "ก่อนหน้า",
      nextPage: "ถัดไป",
      anonymousCheckbox: "ไม่ประสงค์ออกนาม",
    },
    common: {
      search: "ค้นหา",
      status: "สถานะ",
      actions: "จัดการ",
      edit: "แก้ไข",
      cancel: "ยกเลิก",
      save: "บันทึก",
    },
    form: {
      name: "ชื่อ",
      phone: "เบอร์โทร",
      email: "อีเมล",
      province: "จังหวัด",
      donorType: "ประเภทผู้บริจาค",
      individual: "บุคคลธรรมดา",
      organization: "องค์กร / นิติบุคคล",
    }
  },
  en: {
    title: "Disaster Relief Donation Tracking System",
    donors: {
      title: "Donors",
      searchTitle: "Search Donors",
      searchSubtitle: "Manage and search all donor information in the system",
      addNew: "Add New Donor",
      searchByName: "Search by Name",
      searchPlaceholder: "Enter donor name...",
      allStatuses: "All Statuses",
      active: "Active",
      inactive: "Inactive",
      notFound: "No donors found",
      previousPage: "Previous",
      nextPage: "Next",
      anonymousCheckbox: "Anonymous",
    },
    common: {
      search: "Search",
      status: "Status",
      actions: "Actions",
      edit: "Edit",
      cancel: "Cancel",
      save: "Save",
    },
    form: {
      name: "Name",
      phone: "Phone Number",
      email: "Email",
      province: "Province",
      donorType: "Donor Type",
      individual: "Individual",
      organization: "Organization",
    }
  },
}

export type Dictionary = typeof dictionaries.th

export const getDictionary = async (locale: string): Promise<Dictionary> => {
  if (locale === "en") {
    return dictionaries.en
  }
  return dictionaries.th
}