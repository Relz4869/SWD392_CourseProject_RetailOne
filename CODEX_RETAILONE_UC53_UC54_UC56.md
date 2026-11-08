# RETAILONE — CODEX IMPLEMENTATION SPEC
## UC53 Create Promotion Programs · UC54 Assign Products to Promotion · UC56 Delete Promotion

> **Mục tiêu:** Bạn là Senior Full-Stack Engineer (JavaScript, Next.js 14, React 18, Node.js 24, Express 4). Hãy **kiểm tra repository hiện tại rồi triển khai đầy đủ và chạy được** đúng 3 Use Case UC53, UC54, UC56, không chỉ đề xuất kế hoạch. Bám sát UC Description đã cung cấp và kiến trúc RetailOne chốt bên dưới. Báo cáo ngắn kết quả, các file đã thay đổi, cách chạy, cách kiểm thử, điểm còn thiếu.
>
> **Nguồn sự thật:** (1) tài liệu `Major Features - UC description - Architecture.docx` — các UC53/54/56, (2) các Implementation Class Diagram / Interaction Diagram / Communication Diagram của Promotion nếu được tìm thấy trong workspace, (3) code/schema/auth/database đã có. **Không giả định** một file/schema/route hoặc công nghệ đã tồn tại khi chưa đọc. Trong trường hợp mâu thuẫn: ưu tiên nghiệp vụ và exception của UC Description, sau đó đối chiếu diagrams; bảo toàn hợp đồng API, cấu trúc DB và conventions đang dùng, báo cáo bất đồng thay vì lặng lẽ thay đổi. Nếu các sơ đồ sequence/communication không nằm trong workspace, dùng message chain ở mục 3 làm *mapping triển khai*, không tuyên bố đã kiểm tra được thông điệp ở các sơ đồ không tồn tại.

---

## 1. Phạm vi — KHÔNG mở rộng ngoài yêu cầu

**Triển khai đầy đủ:**
- **UC53**: tạo khuyến mãi, lưu nháp, hủy khi đã nhập dữ liệu, kiểm tra dữ liệu và lỗi kết nối, điều hướng đến UC54.
- **UC54**: gán sản phẩm, gán danh mục, bỏ gán sản phẩm, xử lý overlap và inactive product, lưu kết quả bền vững.
- **UC56**: xóa khuyến mãi có xác nhận, hủy xóa, chặn xóa đang active, soft-delete khi có paid invoice history, hard-delete khi an toàn.

**Chỉ làm phần phụ trợ tối thiểu** để ba UC hoạt động được (ví dụ: lấy danh sách khuyến mãi để chọn, lấy sản phẩm/danh mục active, chi tiết khuyến mãi và danh sách target được gán). Không tự triển khai trọn UC52, UC55, Voucher, Staff, Reports hay sửa nghiệp vụ POS không liên quan, trừ khi bắt buộc để bảo đảm tính đúng đắn trong code đã có.

Không tự tạo hàng loạt file, thư viện, framework, mock DB, JSON thay SQL, test harness phức tạp hoặc nhiều tầng abstraction không cần thiết. Tái sử dụng code hiện có; không sao chép ProductRepository hoặc CategoryRepository sang Promotion nếu chúng đã tồn tại.

## 2. Kiến trúc đã chốt (bắt buộc)

- **Deployment:** Client–Server; Frontend và Backend giao tiếp HTTP/HTTPS REST API; dữ liệu persistent ở **SQL Server** theo thiết kế nhóm (xác minh connection / ORM / driver thực tế trước khi code).
- **Backend:** **Modular Monolith**, component-based, mỗi nghiệp vụ một module; bên trong `route → controller → service → repository → model` hoặc đối tượng tương đương theo conventions repo.
- **Frontend:** **Feature-first**, Next.js 14 **App Router** với `app/` chỉ làm routing/layout; logic tính năng thuộc `features/manage-promotion/`; phần tái sử dụng chung thuộc `shared/`.
- **Language:** JavaScript / JSX; không chuyển dự án thành TypeScript hoặc thêm framework thứ hai.
- **OO:** Bảo toàn trách nhiệm các class/controller/service/repository của Implementation Class Diagram; JavaScript module/functions được chấp nhận nếu codebase đang dùng kiểu này. Không ép class hóa toàn bộ code.
- **Tái sử dụng:** Các module promotion có thể gọi abstraction Product/Category đã tồn tại; không copy query logic/validation dùng chung. Không viết SQL trực tiếp trong controller hoặc UI.

**Vị trí kỳ vọng nếu chưa có layout khác đã triển khai và chuẩn hóa:**

```text
backend/src/
├── modules/
│   └── manage-promotion/
│       ├── promotion.routes.js
│       ├── promotion.controller.js
│       ├── promotion.service.js
│       ├── promotion.repository.js
│       └── promotion.model.js                 # chỉ nếu phù hợp DB/ORM hiện có
├── middlewares/                            # auth/authorization dùng chung
├── config/
├── constants/
└── utils/

frontend/src/
├── app/
│   └── (dashboard)/
│       └── promotions/
│           ├── page.jsx                    # màn danh sách, nếu đã có thì tái sử dụng
│           ├── create/page.jsx
│           └── [id]/assign/page.jsx
├── features/
│   └── manage-promotion/
│       ├── components/                     # form, target picker, confirm dialog...
│       ├── hooks/                          # chỉ khi cần shared state/fetch logic
│       ├── services/                       # API client
│       └── index.js                        # tùy theo convention hiện có
└── shared/                                 # UI, HTTP client, utilities dùng chung
```

> **Không đổi tên/di chuyển source hiện có chỉ để khớp cây mẫu.** Nếu repo đang dùng `backend/src/components/` hoặc có tổ chức tương đương, bám đúng layout hiện có và tạo file mới ở đúng component. Giải thích ánh xạ trong báo cáo cuối. Không sửa những module khác nếu không cần thiết.

## 3. Ánh xạ message / trách nhiệm từ Promotion Implementation Class Diagram

Các thao tác dưới đây là **điểm neo thiết kế**, không nhất thiết là HTTP endpoint hoặc một function = một file. Đối chiếu với sơ đồ thực tế trước khi đặt tên chính thức.

| UC | View / UI event | Controller | Service | Repository / dependencies | Kết quả |
|---|---|---|---|---|---|
| UC53 | `AdminDashboardView.showPromotionCreationForm()` → `PromotionFormView.submitPromotion(promotionData)` | `PromotionController.submitPromotion(promotionData)` | `PromotionService.validateAndCreatePromotion(promotionData)` → `createPromotion(promotionData)` | `PromotionRepository.save(promotion)` | `OperationResult`, hiển thị thành công/validation; chuyển sang assign |
| UC54 | `PromotionAssignmentView.submitPromotionTargets(promotionId, targets)` | `PromotionController.submitPromotionTargets(promotionId, targets)` | `PromotionService.checkPromotionOverlapAndAssign(...)` → `assignTargetsToPromotion(...)` | `PromotionRepository.findOverlappingPromotions`, `findPromotionTargets`, `savePromotionTargets`; `ProductRepository` / `CategoryRepository` | Hiển thị target đã gán, cảnh báo overlap |
| UC56 | `PromotionListView.confirmDeletePromotion(promotionId)` | `PromotionController.confirmDeletePromotion(promotionId)` | `PromotionService.checkPromotionStatusBeforeDelete(promotionId)` → `deleteOrHidePromotion(promotionId)` | `PromotionRepository.findById`, `hasPaidInvoiceHistory`, `delete` / soft-delete update | Thông báo kết quả và refresh list |

**Các operation khác của diagram cần dùng khi phù hợp:**
- `PromotionController.loadPromotions(criteria)` để hiển thị/refresh danh sách tối thiểu.
- `PromotionRepository.findById(promotionId)` để xác nhận promotion tồn tại và trạng thái tại thời điểm thao tác.
- `PromotionRepository.findPromotionTargets(promotionId)` để hiển thị assigned targets.
- `ProductRepository.findByIds(productIds)`, `findActiveProducts()`, `findByCategory(categoryId)`.
- `CategoryRepository.findById(categoryId)`, `findActiveCategories()`.
- `PromotionAssignmentView.showOverlapWarning(conflicts)`.
- `PromotionFormView.showValidationErrors(errors)` và `showPromotionResult(result)`.
- `PromotionListView.showDeletionResult(result)`.

Trên diagram cơ bản, `Promotion` có `name`, `value`, `startDate`, `endDate`, `createdAt`, `type`, `status`. **UC53 còn yêu cầu `minimumInvoiceValue` và `maximumBudget` (optional)**; phải kiểm tra DB/schema đang có. Bổ sung bằng migration hợp lệ nếu thật sự thiếu và có thể chạy an toàn. Không bỏ qua fields bắt buộc của UC vì diagram rút gọn.

**Các message cần bảo toàn từ UI đến DB và ngược lại** (success, validation error, conflict, cancel, not found, DB error). Controller không tự quyết định overlap hay xóa cứng/mềm; business decisions thuộc Service. Repository chịu trách nhiệm persistence/queries/transaction; View chịu trách nhiệm dialog, state, toast, redirect.

## 4. UC53 — Create Promotion Programs

### 4.1. Điều kiện và fields

- Actor: **Manager** đã đăng nhập, có quyền tạo khuyến mãi (RBAC check cả API, không chỉ ẩn nút).
- Trigger: Manager ở Promotion List chọn **Create promotion**.
- Form yêu cầu: **Name, Start time, End time, Discount type (`Percentage`/`Amount`), Discount value**.
- Thêm **Minimum invoice value** (điều kiện áp dụng) và **Maximum Budget** (không bắt buộc) theo UC.
- `status` sau lưu chính thức được xác định từ thời gian **server**, ví dụ `Upcoming` trước giờ bắt đầu, `Active` khi đến giờ; `Expired` sau ngày kết thúc. Trạng thái `Draft/Inactive` phải được lưu riêng để không tự kích hoạt. Không dựa vào giờ client để quyết định nghiệp vụ.
- Quy ước timezone, format time và status phải thống nhất với schema/API sẵn có; tránh sai lệch khi lưu datetime.

### 4.2. Luồng chính 53.0 (từng message phải hoạt động)

1. Người dùng bấm **Create promotion** ở list → mở form.
2. Nhập đầy đủ thông tin; chọn điều kiện và optional budget.
3. Bấm **Save** → frontend validate cơ bản, disable nút trong lúc gửi; Backend kiểm tra lại toàn bộ.
4. Controller nhận request đã qua auth/authorization; Service validate rồi gọi Repository ghi DB; chỉ trả success sau khi transaction lưu thành công.
5. Hiển thị thông báo tạo thành công; trả về `promotionId`; đưa người dùng vào màn **Assign Products to Promotion** (UC54) của promotion vừa tạo.
6. **Xử lý chi tiết UC Description:** bước 7 ghi “redirects to the list screen”, bước 8 lại ghi “automatically redirects ... Assign Products”. Không điều hướng hai lần gây nhấp nháy; dùng kết quả lưu + success notice và **chuyển trực tiếp đến UC54**, cung cấp đường quay về Promotion List. Nếu source diagrams/project hiện có chỉ rõ một cách khác, ưu tiên nó và ghi rõ khác biệt.

### 4.3. Alternative flows

- **53.1 Cancel / leave page:** Nếu form có dữ liệu đã chỉnh sửa thì hiện cảnh báo mất dữ liệu. Bấm xác nhận mới bỏ dữ liệu và quay về; bấm ở lại giữ nguyên form. Không tạo record. Kiểm tra cả nút Cancel và điều hướng nội bộ; `beforeunload` chỉ khi phù hợp browser.
- **53.2 Save as Draft:** Nút riêng, persist record ở `Draft`/`Inactive`, cho phép tiếp tục chỉnh sửa sau; **không xuất hiện như promotion áp dụng tại checkout**. Xác định chính sách validation của draft theo code/schema hiện tại; ít nhất tránh lưu dữ liệu sai kiểu, date/value bất hợp lý. Nếu UC không quy định trường nào có thể để trống trong draft thì không tự áp đặt phải đủ các field của publish; dùng cách bảo toàn draft an toàn và ghi quyết định. Không tự kích hoạt draft khi đến giờ.

### 4.4. Exceptions

| Mã | Điều kiện | Expected |
|---|---|---|
| 53.0.E1 | Thiếu Name, Discount value, Start/End time hoặc field bắt buộc khác | Highlight field đỏ, hiển thị lỗi cạnh input, không gọi save/không tạo record |
| 53.0.E2 | `endDate < startDate` hoặc `startDate` trong quá khứ | Hiển thị **`Invalid time`**, không save; kiểm tra ở server |
| 53.0.E3 | Percentage > 100 hoặc Amount < 0 | Hiển thị **`Invalid discount value`**, không save; không tự đặt quy tắc khác không có căn cứ |
| 53.0.E4 | Mất mạng/DB lỗi trong save | Hiển thị error, **giữ nguyên dữ liệu form**, có thể retry, không báo thành công giả |

### 4.5. Acceptance checks

- Manager hợp lệ tạo được record và thấy ID thật từ DB.
- User không có quyền bị chặn `403` ở API.
- Mọi validation ở UI **và server**, không thể bypass bằng API direct call.
- Draft không được áp dụng checkout; status thay đổi theo server time cho promotion đã publish.
- Không bị tạo record trùng khi người dùng double-click Save; nếu có retry network, xử lý consistent theo conventions/transaction của project.

## 5. UC54 — Assign Products to Promotion

### 5.1. Điều kiện

- Promotion đã tồn tại; actor Manager có quyền gán.
- Có products/categories ở **Active** state. Backend không cho phép inactive product được gán dù gọi API trực tiếp.
- UI mở từ detail **Add products** hoặc sau UC53 thành công. Có ô search/filter, checkbox products, tab **Select by Category**, danh sách đã gán.
- Liên kết phải tồn tại trong DB và được logic tính discount POS nhận biết. Nếu POS implementation thuộc module khác, kiểm tra và tích hợp tối thiểu hợp đồng sẵn có; không tự viết lại checkout.

### 5.2. Normal flow 54.0 — Assign specific products

1. Mở promotion details/assign page với `promotionId` thật.
2. Load promotion, active products, existing targets; render search/filter.
3. Manager chọn các product checkbox, bấm **Save**.
4. UI và server bảo đảm có ít nhất một target đang chọn; kiểm tra promotion tồn tại và product active.
5. Service kiểm tra overlap trên **khoảng thời gian** của các promotions khác và xử lý theo phần exceptions trước khi commit.
6. Repository persist links **atomically**, tránh duplicate target; trả danh sách assigned targets để UI refresh và thông báo thành công.

### 5.3. Alternative flows

- **54.1 Assign by Category:** Manager chọn một/multiple active categories. Hệ thống phải áp dụng cho **sản phẩm hiện tại VÀ sản phẩm thêm vào category sau này**, không chỉ snapshot IDs hiện tại. Hãy dùng **category-level persistent link + dynamic resolution khi checkout** hoặc hook/logic đồng bộ phù hợp với schema đang có; cách nào cũng phải đảm bảo sản phẩm mới tự động được hưởng promotion. Không gán inactive/discontinued product. Nếu schema hiện tại chưa hỗ trợ, bổ sung nhỏ nhất và giải thích migration/integration. Khi sửa assignment, chú ý cả sản phẩm trực tiếp và category-derived targets.
- **54.2 Remove product:** Manager bấm Delete cạnh assigned product → loại bỏ link **ngay lập tức** trong DB/UI, không chỉ xóa khỏi state tạm. Nếu product chỉ nhận promotion do category, cần phân biệt **direct assignment** với **derived assignment**; không giả vờ xóa trực tiếp có tác dụng nếu category link còn hiệu lực. Theo thiết kế hiện có, có thể chặn và giải thích, hoặc áp dụng explicit exclusion nếu project đã hỗ trợ. Không âm thầm sai logic.

### 5.4. Exceptions — quan trọng

| Mã | Điều kiện | Expected |
|---|---|---|
| 54.0.E1 | Target thuộc promotion khác có thời gian overlap | Warning chính xác **`Product A is in promotion B. Confirm overwrite or keep original?`** (thay A/B bằng tên thực). Cho chọn **Overwrite** hoặc **Keep original**. KHÔNG tự overwrite. Nếu keep, không thay đổi assignment của target xung đột; nếu overwrite, thay đổi liên kết xung đột theo rule, trong **một transaction** và giữ audit/history nếu cần. Báo rõ kết quả từng target |
| 54.0.E2 | User không chọn sản phẩm/target nào rồi Save | Chặn, báo **`Please select at least 1 product`**, không ghi DB |
| 54.0.E3 | Product discontinued/inactive | Disable checkbox; API reject nếu bị bypass |

**Overlap phải tính theo các khoảng thời gian giao nhau**, và kiểm tra lại ngay trước commit để tránh race condition. Gán theo category cũng phải xử lý conflict với direct product promotions và các category promotions khác khi sản phẩm nằm nhiều category (nếu model hỗ trợ). Không xóa lịch sử hóa đơn đã thanh toán khi overwrite; không làm thay đổi giá trị của invoices đã chốt.

**Hiệu lực POS:** Với promotion đã Active, add/remove phải có hiệu lực ngay với các yêu cầu checkout tiếp theo trên tất cả POS. Nếu project đang cache promotion, triển khai cache invalidation/refresh phù hợp; không claim real-time nếu chưa có integration thực tế. Giữ snapshot/discount đã chốt của hóa đơn lịch sử.

## 6. UC56 — Delete Promotion

### 6.1. Normal flow 56.0

1. Manager click trash icon của một promotion trong list.
2. Popup hỏi đúng text **`Are you sure you want to delete this promotion?`**.
3. Chỉ khi bấm **Agree** mới gọi API xóa.
4. Backend xác nhận promotion tồn tại, trạng thái hiện tại theo **server time**, có/không có paid invoice usage.
5. Nếu hợp lệ: thực hiện **hard delete hoặc soft delete** theo quy tắc dưới, thông báo thành công và refresh list; promotion `Deleted` không còn xuất hiện trong main list.

### 6.2. Alternative flow 56.1

- Click **Cancel** hoặc đóng popup → không gọi mutation API, giữ nguyên DB/UI.

### 6.3. Exceptions + thứ tự bắt buộc

1. **56.0.E1 — Active Promotion:** Chặn trước. Trả text **`Cannot delete an ongoing promotion. Please stop it first`**; **không hard delete lẫn soft delete** cho campaign đang chạy. Không tự triển khai UC55 Force Stop; hướng dẫn user dùng chức năng Stop nếu có sẵn.
2. **56.0.E2 — Promotion has transaction data:** Nếu promotion không Active nhưng đã gắn với **PAID invoice**, **soft delete** (`Deleted`/tương đương, ẩn khỏi danh sách và vô hiệu hóa áp dụng ở POS) để giữ đối soát/history. Không thay đổi `finalAmount`/discount đã áp dụng ở invoice cũ.
3. **Không có PAID invoice history và không Active:** Hard delete nếu DB foreign keys/constraints an toàn, đồng thời xóa các assignment links có liên quan bằng transaction, không để orphan links. Nếu vẫn có references khác cần bảo toàn, chọn soft delete thay vì phá dữ liệu và ghi lý do.
4. **Không tìm thấy promotion:** Trả `404`, UI thông báo rõ ràng, không hiển thị success giả.
5. **DB/connection failure:** Transaction rollback; hiển thị lỗi và giữ danh sách nguyên trạng hoặc reload consistent.

**Business focus:** Ưu tiên “early termination”/giữ lịch sử hơn xóa mù quáng, nhưng UC55 không thuộc phạm vi nên không phát triển thêm phần dừng campaign mới.

## 7. REST API — đề xuất, ưu tiên hợp đồng có sẵn

Trước khi tạo endpoint mới, inspect routes đã có. Tái sử dụng hợp đồng tương đương, không làm hỏng client đang chạy. Nếu repo chưa có, dùng ví dụ nhất quán sau:

| Method | Endpoint | UC | Mục đích |
|---|---|---|---|
| `POST` | `/api/promotions` | 53 | Create promotion; response `id`, `status` |
| `POST` | `/api/promotions/drafts` hoặc `POST /api/promotions` với mode phù hợp | 53 | Save as Draft; tránh endpoint trùng nếu hiện có convention |
| `GET` | `/api/promotions/:id` | 54/56 | Load detail/status |
| `GET` | `/api/promotions` | hỗ trợ | Minimal listing/refresh |
| `GET` | `/api/promotions/:id/targets` | 54 | Load assigned direct/category targets |
| `PUT`/`POST` | `/api/promotions/:id/targets` | 54 | Save targets/resolve overlap; rõ replace vs append |
| `DELETE` | `/api/promotions/:id/targets/:targetId` | 54 | Remove direct assignment; resolve category-derived semantics |
| `DELETE` | `/api/promotions/:id` | 56 | Delete with service-level hard/soft decision |
| `GET` | API Product/Category có sẵn | 54 | Active targets + search/filter |

**API response thống nhất** với project; biểu diễn các lỗi bằng HTTP status phù hợp (`400` validation, `401` unauthenticated, `403` forbidden, `404` not found, `409` overlap/active conflict, `5xx` server failure). Không gửi raw SQL error/stack trace cho người dùng. Overlap response phải chứa target nào xung đột, promotion nào, và dữ liệu cần thiết để hiển thị dialog; lần xác nhận overwrite phải được server revalidate trong transaction.

## 8. Database và tính toàn vẹn dữ liệu

1. Đọc schema, migration, database client/ORM, model, constraints và seed hiện có trước khi code. **Không tự suy diễn bảng/cột thật** từ UML; UML giúp xác định trách nhiệm, UC xác định behavior.
2. Đảm bảo lưu được `Promotion` và các trường UC53: name, start/end datetime, discount type/value, minimum invoice value, optional maximum budget, draft/status và timestamps. Ánh xạ tên thuộc tính vào schema thật; migration nếu thiếu phải non-destructive.
3. Đảm bảo lưu được direct product links và category links cho UC54, với uniqueness phù hợp; hỗ trợ target từ category tương lai.
4. Khi overwrite conflict, update relationships **atomically**; tính overlap trên `start < other.end && other.start < end` trừ khi schema đã quy định inclusive endpoints khác. Không tính một promotion chồng với chính nó; loại draft/deleted/disabled theo business status đã xác nhận.
5. UC56 cần query kiểm tra **paid invoice** bằng data source thực; không dựa vào cờ từ frontend. Hard delete chỉ khi an toàn; soft-delete không mất invoice history.
6. Transactions cho multi-table writes; parameterized queries/ORM, không ghép SQL bằng string. Không thay đổi data đã có, không tự drop database hoặc chạy destructive migration khi chưa có cách rollback.
7. **BR-02, BR-24, BR-65** được tài liệu nhắc nhưng không cung cấp đầy đủ định nghĩa chi tiết trong các trang UC này; hãy tìm file Business Rules trong workspace. Nếu không tìm thấy, không bịa nội dung BR; thực thi những gì UC mô tả rõ và liệt kê phần BR cần xác nhận trong báo cáo.

## 9. Frontend UI / UX requirements

- Giữ phong cách UI/route conventions trong repo, sử dụng shared components đang có; không cài thêm UI library nếu không cần.
- Thể hiện chính xác lời nhắc và thông báo lỗi được trích trong UC (English như trong doc) khi đã quy định.
- Product picker hiển thị product name/ID, active status, search/filter, selectable checkbox, category tab, current assigned targets; disabled state cho inactive products.
- Form có các nhãn, trạng thái loading, field validation, button Save / Save as Draft / Cancel; giữ dữ liệu khi API fail.
- Confirmation dialogs cho UC56 và 54.0.E1; phải có hành động Cancel rõ ràng, không commit khi chưa xác nhận.
- Điều hướng Next.js App Router (`next/navigation`), không dùng Pages Router; `page.jsx` mỏng và import từ feature.
- Cấm tin rằng chỉ ẩn button là đủ bảo mật: Backend auth + Manager RBAC cho mọi mutation.
- Không làm hỏng hoặc ghi đè giao diện/list đang hoạt động; tích hợp đúng route/menu hiện có.

## 10. Test / verification: chạy được, không chỉ mã giả

**Ưu tiên dùng test framework đang cài**, không thêm package kiểm thử trừ khi thật cần. Cần có các kiểm tra sau bằng test tự động hoặc test tay có kết quả thực tế, dùng database test hoặc dữ liệu an toàn:

| UC | Trường hợp tối thiểu |
|---|---|
| 53 | Tạo thành công, status server-time, điều hướng UC54, thiếu field, invalid dates, percent >100, amount âm, Save Draft không áp dụng checkout, cancel dirty form, lỗi DB giữ dữ liệu, 403 |
| 54 | Gán một/nhiều product, category áp dụng cả future products, xóa direct link, zero selection, inactive product bị chặn ở UI+API, overlap overwrite/keep-original, refresh POS active, rollback khi lưu fail, 403 |
| 56 | Popup Agree/Cancel, delete promotion chưa active chưa có paid history, chặn Active với đúng message, PAID invoice → soft delete và giữ invoice amounts, missing ID, rollback DB error, deleted không xuất hiện list/POS, 403 |

**Ngoài ra:** Kiểm tra SQL injection safe bindings, request validation, duplicate links, transaction/race condition, build/lint/test hiện có, và không có client crash khi lỗi mạng. Không ghi 'PASS' nếu chưa thực chạy. Nếu thiếu DB credentials/secret/service ngoài, không hardcode; mô tả rõ blocker và cách xác minh sau.

## 11. Quy trình Codex bắt buộc

1. **Inspect** project tree, `package.json`/scripts, routing App Router, Express app/mounting, auth middleware/RBAC, DB connection, schema/migrations, Promotion/Product/Category code và test conventions.
2. **Read** UC Description ở file DOCX (hoặc nội dung spec này), và diagrams nếu có; lập bảng mapping thực tế `(UC step → message/method → file → endpoint → DB)` trước khi sửa code.
3. **Implement** theo thứ tự UC53 → UC54 → UC56, đồng bộ API/UI/DB, ưu tiên reuse existing implementation.
4. **Run** cài đặt/build/lint/tests theo package scripts sẵn có; sửa lỗi có liên quan. Không tự xóa `node_modules`, data, migrations hoặc file người dùng.
5. **Verify** đủ normal/alternative/exception flows; kiểm tra status, historical paid invoices, draft handling, future category assignment.
6. **Report** ngắn gọn: files changed; API endpoints; DB migrations; UC scenario status (**PASS / BLOCKED / NOT VERIFIED**, có bằng chứng); assumptions/gaps; hướng dẫn chạy và test.

### Definition of Done (không dừng ở skeleton)

- [ ] Cả 3 UC có UI + Backend + persistence hoạt động thực với DB hiện có.
- [ ] Code tổ chức theo Frontend Feature-first và Backend modular component-first, không duplicate repositories.
- [ ] UC53 normal + draft + cancel + 4 exception paths.
- [ ] UC54 product/category/future category/removal + overlap + empty + inactive paths.
- [ ] UC56 confirm/cancel + active block + paid-history soft-delete + safe hard-delete.
- [ ] Authentication và Manager authorization kiểm tra ở API.
- [ ] Tests/build đã chạy hoặc ghi rõ vì sao không chạy được, không tuyên bố hoàn thành giả.
- [ ] Các message và method trong diagram được ánh xạ hoặc báo rõ những tên khác đang sử dụng; không thêm chức năng ngoài scope.

**Thực hiện code trong workspace ngay. Không dừng ở phần phân tích/kế hoạch. Khi gặp thiếu dependency, schema hoặc credentials, triển khai tối đa phần có thể kiểm chứng và báo chính xác blocker, tuyệt đối không tự bịa dữ liệu.**
