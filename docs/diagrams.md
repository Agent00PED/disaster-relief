# ER Diagram และ Use Case Diagram (ฉบับล่าสุด)

สร้างจากโครงสร้างฐานข้อมูลจริงบน Supabase ณ 25 กันยายน 2569
ไม่ได้คัดลอกจากเอกสารเก่า ทุกตารางและทุกคอลัมน์ตรวจสอบกับ
`information_schema` แล้ว

วิธีทำเป็นรูป: คัดลอกโค้ดในกรอบไปวางที่ https://mermaid.live
แล้วกด Actions > PNG

---

## 1. ER Diagram

ฐานข้อมูลมี 9 ตาราง แบ่งเป็น 3 กลุ่ม

| กลุ่ม | ตาราง | หน้าที่ |
|---|---|---|
| ผู้ใช้และสถานที่ | `profiles` `centers` | ใครเป็นใคร อยู่ศูนย์ไหน |
| งานหลัก | `donors` `donations` `requests` `allocations` | ของเข้า ของขอ ของจ่าย |
| คำร้องจากคนทั่วไป | `donation_pledges` `request_pledges` `public_needs` | ยังไม่ใช่ข้อมูลจริง รอเจ้าหน้าที่อนุมัติ |

```mermaid
erDiagram
    centers ||--o{ profiles          : "สังกัด"
    centers ||--o{ donations         : "รับของเข้า"
    centers ||--o{ requests          : "ยื่นคำขอ"
    centers ||--o{ request_pledges   : "ปลายทางคำร้อง"

    donors  ||--o{ donations         : "บริจาค"

    requests    ||--o{ allocations   : "ถูกจัดสรรให้"
    donations   ||--o{ allocations   : "ถูกตัดจ่ายจาก"

    profiles ||--o{ donations        : "บันทึกรับของ"
    profiles ||--o{ requests         : "สร้างคำขอ"
    profiles ||--o{ allocations      : "จัดสรร/ตัดจ่าย"

    donation_pledges }o--|| donations : "อนุมัติแล้วกลายเป็น"
    request_pledges  }o--|| requests  : "อนุมัติแล้วกลายเป็น"

    centers {
        uuid    id PK
        text    name
        text    name_en
        text    type          "warehouse | shelter"
        text    address
        text    contact_phone
        boolean is_active
        timestamptz created_at
    }

    profiles {
        uuid    id PK "อ้างอิง auth.users"
        text    full_name
        text    username
        text    role          "admin | staff | volunteer"
        uuid    center_id FK
        text    phone
        text    first_name
        text    last_name
        date    birth_date
        int     birth_year
        text    id_photo_path "ไฟล์ใน Storage"
        timestamptz created_at
    }

    donors {
        uuid    id PK
        text    name
        text    donor_type    "individual | organization"
        text    phone
        text    email
        text    address
        boolean is_anonymous  "ปิดข้อมูลทุกช่องถ้าเป็น true"
        boolean is_active
        timestamptz created_at
    }

    donations {
        uuid    id PK
        uuid    center_id FK
        uuid    donor_id FK   "NULL ได้ ถ้าผู้บริจาคถูกลบ"
        text    item_name
        text    category
        text    unit
        text    dietary_type  "general | halal | vegetarian"
        int     quantity_received
        int     quantity_remaining
        date    expiry_date
        uuid    received_by FK
        date    received_date
        text    note
        timestamptz received_at
    }

    requests {
        uuid    id PK
        uuid    center_id FK
        text    item_name
        text    item_name_en
        text    category
        text    unit
        text    dietary_type  "general | halal | vegetarian"
        int     quantity_requested
        int     quantity_fulfilled
        text    urgency       "low | medium | high"
        text    status        "pending | partial | fulfilled | cancelled"
        uuid    requested_by FK
        uuid    cancelled_by FK
        text    cancel_reason
        timestamptz cancelled_at
        timestamptz created_at
    }

    allocations {
        uuid    id PK
        uuid    request_id FK
        uuid    donation_id FK
        int     quantity_allocated
        int     received_quantity "ยอดที่ศูนย์ยืนยันรับจริง"
        text    status        "allocated | delivered | cancelled"
        uuid    allocated_by FK
        uuid    delivered_by FK
        uuid    cancelled_by FK
        text    delivery_note
        text    cancel_reason
        timestamptz allocated_at
        timestamptz delivered_at
        timestamptz cancelled_at
    }

    donation_pledges {
        uuid    id PK
        text    donor_name
        text    donor_phone
        text    donor_email
        text    address       "ส่งต่อไป donors ตอนอนุมัติ"
        text    item_name
        text    category
        text    unit
        text    dietary_type  "general | halal | vegetarian"
        int     quantity
        text    note
        text    status        "pending | approved | rejected"
        uuid    converted_donation_id FK
        uuid    reviewed_by FK
        timestamptz created_at
        timestamptz reviewed_at
    }

    request_pledges {
        uuid    id PK
        text    requester_name
        text    requester_phone
        text    requester_email
        text    address
        uuid    center_id FK
        text    item_name
        text    category
        text    dietary_type  "general | halal | vegetarian"
        int     quantity
        text    urgency
        text    note
        text    status        "pending | approved | rejected"
        uuid    converted_request_id FK
        uuid    reviewed_by FK
        timestamptz created_at
        timestamptz reviewed_at
    }

    public_needs {
        text    category PK
        int     shortage
        int     center_count
        int     pledged_count
        timestamptz updated_at
    }
```

### จุดที่ควรอธิบายตอนนำเสนอ

**`allocations` เป็นตารางกลางที่ทำให้ระบบตรวจสอบย้อนหลังได้**
ของ 1 ล็อตแบ่งจ่ายได้หลายคำขอ และ 1 คำขอรับของจากหลายล็อตได้
(ความสัมพันธ์แบบกลุ่มต่อกลุ่ม) ทุกครั้งที่ตัดจ่ายจะบันทึกว่า
ใครทำ เมื่อไหร่ จำนวนเท่าไหร่ ย้อนดูได้ทุกก้าว

**`quantity_remaining` ห้ามแก้ตรง ๆ**
มี trigger `guard_donation_stock()` คอยกันไว้ ต้องแก้ผ่านฟังก์ชัน
`allocate_items` / `cancel_allocation` เท่านั้น เพื่อไม่ให้ยอดในคลัง
กับยอดที่จ่ายไปแล้วเพี้ยนจากกัน

**ตารางกลุ่ม pledges แยกจากตารางจริง**
คนทั่วไปที่ไม่ได้ล็อกอินเขียนลงได้แค่ 2 ตารางนี้ ยังไม่กระทบยอดคลัง
ต่อเมื่อเจ้าหน้าที่กดอนุมัติจึงถูกแปลงเป็น `donations` / `requests`
เป็นการกันไม่ให้ข้อมูลที่ยังไม่ตรวจสอบเข้าไปปนกับข้อมูลจริง

**ตารางคู่ต้องมีคอลัมน์ครบเท่ากัน ไม่งั้นข้อมูลหายตอนแปลง**
บทเรียนจริงจากโปรเจกต์นี้ ตอนแรก `dietary_type` มีเฉพาะในตารางจริง
ตารางคำร้องไม่มี พอกดอนุมัติจึงไม่มีค่าจะส่ง ปลายทางตกไปใช้ค่าตั้งต้น
`general` ทุกใบ ทำให้คำขออาหารฮาลาลจากประชาชนกลายเป็นอาหารทั่วไป
และกฎตรวจสอบก็ไม่ทำงาน แก้แล้วในไฟล์ `docs/sql/42`

**`donations.donor_id` เป็น NULL ได้**
ตั้งเป็น ON DELETE SET NULL ตั้งใจให้ลบผู้บริจาคได้โดยที่ใบรับของ
ที่ออกไปแล้วไม่หายตามไปด้วย

---

## 2. Use Case Diagram

ระบบมีผู้ใช้ 4 แบบ โดย "ผู้ใช้ทั่วไป" ไม่ต้องล็อกอิน

```mermaid
flowchart LR
    subgraph actors[" "]
        direction TB
        G["ผู้ใช้ทั่วไป<br/>(ไม่ต้องล็อกอิน)"]
        V["อาสาสมัคร"]
        S["เจ้าหน้าที่ประจำศูนย์"]
        A["ผู้ดูแลระบบ"]
    end

    subgraph sys["ระบบ WalaiTrack"]
        direction TB
        U1(["ดูสิ่งของที่ศูนย์ขาดแคลน"])
        U2(["แจ้งความประสงค์บริจาค"])
        U3(["ขอรับความช่วยเหลือ"])
        U4(["สมัครสมาชิก / เข้าสู่ระบบ"])

        U5(["ดูงานของศูนย์ตัวเอง"])
        U6(["ยืนยันรับของที่ส่งถึงศูนย์"])
        U7(["อัปโหลดรูปยืนยันตัวตน"])

        U8(["บันทึกของบริจาคเข้าคลัง"])
        U9(["ดูคลังและของใกล้หมดอายุ"])
        U10(["สร้างและแก้ไขคำขอ"])
        U11(["จัดสรรของให้คำขอ"])
        U12(["ตัดจ่ายและติดตามสถานะ"])
        U13(["จัดการทะเบียนผู้บริจาค"])
        U14(["อนุมัติคำร้องจากคนทั่วไป"])

        U15(["จัดการศูนย์"])
        U16(["จัดการผู้ใช้และสิทธิ์"])
    end

    G --> U1
    G --> U2
    G --> U3
    G --> U4

    V --> U4
    V --> U5
    V --> U6
    V --> U7

    S --> U4
    S --> U8
    S --> U9
    S --> U10
    S --> U11
    S --> U12
    S --> U13
    S --> U14

    A --> U15
    A --> U16

    A -.->|"ทำได้ทุกอย่างที่เจ้าหน้าที่ทำได้<br/>และข้ามได้ทุกศูนย์"| S

    U11 -.->|include| U9
    U12 -.->|include| U11
    U14 -.->|extend| U8
```

### สิ่งที่แผนภาพนี้บอก

**เจ้าหน้าที่เห็นเฉพาะศูนย์ตัวเอง ผู้ดูแลเห็นทุกศูนย์**
บังคับที่ระดับฐานข้อมูลด้วย RLS ไม่ใช่แค่ซ่อนปุ่มบนหน้าจอ
ต่อให้ยิงคำสั่งตรงเข้าฐานข้อมูลก็ยังถูกกัน

**อาสาสมัครไม่มีสิทธิ์แตะคลังหรือจัดสรร**
มีหน้าของตัวเองแยกที่ `/volunteer` เข้าหน้าเจ้าหน้าที่จะถูกเด้งออก

**คนทั่วไปทำได้ 3 อย่างโดยไม่ต้องล็อกอิน**
ดูของขาด แจ้งบริจาค ขอความช่วยเหลือ ทั้งหมดลงตารางกลุ่ม pledges
ที่ต้องผ่านการอนุมัติก่อน ไม่กระทบยอดคลังทันที
