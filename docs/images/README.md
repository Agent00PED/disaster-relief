# ภาพหน้าจอสำหรับรายงาน

วางไฟล์ภาพในโฟลเดอร์นี้ตามชื่อด้านล่าง แล้วสั่ง `py -3 docs/build_report.py`
ภาพจะถูกใส่เป็นภาคผนวกท้ายรายงานให้อัตโนมัติ พร้อมคำบรรยายและเลขภาพ
ชื่อไหนยังไม่มีไฟล์จะถูกข้ามไป ใส่ครบเมื่อไหร่ก็สั่งสร้างรายงานใหม่ได้

| ชื่อไฟล์ | หน้าที่ถ่าย | เข้าสู่ระบบเป็น |
|---|---|---|
| 01_home.png | `/` | ไม่ต้องเข้าสู่ระบบ |
| 02_pledge.png | `/pledge` | ไม่ต้องเข้าสู่ระบบ |
| 03_help_request.png | `/help-request` | ไม่ต้องเข้าสู่ระบบ |
| 04_login.png | `/login` | ไม่ต้องเข้าสู่ระบบ |
| 05_dashboard.png | `/` (หน้าเดียวกับ 01 แต่ตอน login แล้ว จะกลายเป็นแดชบอร์ด) | adminTest |
| 06_pledges.png | `/pledges` | adminTest |
| 07_donations.png | `/donations` | adminTest |
| 08_inventory.png | `/inventory` | adminTest |
| 09_requests.png | `/requests` | adminTest |
| 10_allocations.png | `/allocations` | adminTest |
| 11_receipt.png | `/donations/58853bb4-b29c-442c-a9aa-1fb693172ca0/receipt` | adminTest |
| 12_admin.png | `/admin/centers` | adminTest |

ข้อแนะนำตอนถ่าย
- ใช้ธีมสว่างและภาษาไทย ให้เหมือนกันทุกภาพ
- ถ่ายเต็มความกว้างหน้าต่าง ไม่ต้องครอบตัดจนเหลือแค่ตาราง จะได้เห็นเมนูด้วย
- หน้าที่ยาวเกินจอ ถ่ายเฉพาะส่วนบนที่เห็นหัวข้อและข้อมูลแถวแรก ๆ ก็พอ
