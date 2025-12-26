
export const DEFAULT_PROMPT_CONTENT = `1. Giữ nguyên bố cục 100%

Không được dịch chuyển, không thay đổi vị trí, không thay đổi khoảng cách của bất kỳ thành phần nào: sản phẩm, text, icon, bullet, layout tổng thể.

Không thay đổi kích thước sản phẩm hay các thành phần khác.

Bố cục phải giống ảnh gốc 100%.

Chỉ được phép crop hoặc mở rộng nền để loại bỏ vùng trắng dư và đảm bảo nền phủ kín 100%.
Không được căn giữa, không được căn chỉnh lại bố cục theo bất kỳ hướng nào.

2. Nền chuẩn #f0f0f0

Không giữ lại nền cũ thay đổi nền mới hoàn toàn 100%

Nền phải là solid color #f0f0f0.

Không bóng, không noise, không gradient, không đổi sáng.

Bao phủ 100% toàn bộ vùng nền bằng cách crop hoặc mở rộng vùng nền, không thay đổi vị trí các thành phần.

3. Thay logo header

Thay logo “Hàng Nhật Chính Hãng” cũ bằng logo mới tôi cung cấp.

Giữ đúng vị trí và kích thước hiển thị y hệt logo cũ.

Resize đúng tỉ lệ gốc, không méo.

4. Quy định font chữ
Tất cả văn bản dùng Plus Jakarta Sans.

Tiêu đề sản phẩm:

In đậm (bold)

Màu chữ #026415

Có viền trắng

Không đổ bóng

Icon + text mô tả:

Màu chữ và màu viền icon có chính xác màu #32352f

5. Các thành phần khác giữ nguyên 100%
Không thay đổi:

kích thước sản phẩm

vị trí icon

text mô tả

layout 3 bullet

bố cục tổng thể

khoảng cách giữa các phần tử

(Chỉ được crop/mở rộng nền để nền phủ đều 100%.)

6. Kết quả cuối

Kích thước ảnh 1024 × 1024 px

Không giữ lại nền cũ thay đổi nền mới hoàn toàn 100%, Nền #f0f0f0 phủ 100%

Tiêu đề bold, #026415 có viền trắng

Màu chữ và màu viền icon của nội dung có chính xác màu #32352f

Logo mới đúng vị trí + đúng tỉ lệ + đúng kích thước

Không lệch bố cục

Không dịch chuyển bất kỳ thành phần nào

Nền phẳng đều, không còn khung trắng`;

export const DEFAULT_PROMPT_CONTENT_2 = `1. Giữ nguyên bố cục

Không thay đổi: bố cục, vị trí sản phẩm, text, icon, khoảng cách, layout tổng thể.

Chỉ chỉnh sửa theo đúng các yêu cầu bên dưới.

2. Màu background chuẩn

Không giữ lại nền cũ thay đổi nền mới hoàn toàn 100%

Background phải là một màu phẳng (solid color), không bóng, không noise, không gradient, không đổi sáng.

Màu chính xác: #f0f0f0.

Bao phủ 100% toàn bộ vùng nền.

3. Thay thế logo header

Thay logo cũ bằng logo mới tôi cung cấp.

Giữ đúng vị trí cũ 100%.

Resize sao cho bằng đúng kích thước hiển thị của logo cũ.

Không làm méo logo – giữ nguyên tỉ lệ gốc.

Không thay đổi bất kỳ thông tin gì ở logo mới.

4. Quy định về font chữ

Tất cả văn bản sử dụng Plus Jakarta Sans.

Tiêu đề sản phẩm:

Màu chữ: #32352f

Không đổ bóng

Không có viền

Icon và text mô tả:

Màu chữ: #32352f

Không thêm bất cứ thứ gì

5. Các thành phần khác

Không thay đổi:

kích thước sản phẩm

vị trí icon

text mô tả

layout 3 bullet

bố cục tổng thể

Chỉ chỉnh logo + font + màu + background.

6. Kết quả cuối cùng

Ảnh kích thước 1024 × 1024 px.

Không giữ lại nền cũ thay đổi nền mới hoàn toàn 100%,  Nền #f0f0f0 đúng 100%, không sai tông.

Tiêu đề đậm, màu #32352f không viền, không đổ bóng.

Icon + mô tả màu #32352f.

Logo mới được thay đúng kích thước & tỉ lệ như logo cũ.`;

export const DEFAULT_LAYOUT_PROMPT_CONTENT = `ROLE

You are a senior graphic design AI specialized in pixel-perfect layout recreation.
Your task is to recreate the Reference Layout (Image 1) EXACTLY 100% and only replace the provided content.
⚠️ No creativity, no redesign, no interpretation. Absolute accuracy required.

INPUT IMAGES

Image 1 – Reference Layout
→ Master layout.
→ MUST keep 100% structure, positions, spacing, alignment, proportions, font sizes, icon sizes, bullet layout.

Image 2 – New Logo
→ Replace the old header logo.

Image 3 – New Product Image
→ Replace the old product image.

TEXT INPUT

New Title

Product Attributes (list)

ABSOLUTE RULES – MUST FOLLOW
1. LAYOUT PRESERVATION (100% EXACT)

❌ Do NOT move any element

❌ Do NOT resize any element

❌ Do NOT change spacing (margin / padding)

❌ Do NOT re-align any element

❌ Do NOT change layout structure

✔️ Layout must be pixel-identical to Image 1
✔️ Only allowed action: crop or extend background to remove white edges

2. BACKGROUND (MANDATORY)

Remove old background completely

Use solid color #f0f0f0

❌ No shadow

❌ No noise

❌ No gradient

❌ No brightness/contrast changes

✔️ Background must cover 100% canvas
✔️ Background crop/extension must NOT affect element positions

3. HEADER LOGO

Replace old logo text “Hàng Nhật Chính Hãng” with Image 2

Keep:

Exact position

Exact displayed size

Exact aspect ratio

❌ No stretching

❌ No distortion

4. TYPOGRAPHY (STRICT)

All text font: Plus Jakarta Sans

Product Title

Bold

Color: #026415

White outline (stroke)

❌ No shadow

Attribute Text

Color: #32352f (EXACT HEX)

Same size & weight as reference

Center aligned

5. ICON & PRODUCT ATTRIBUTES (VERY IMPORTANT)

For EACH product attribute, you MUST:

STRUCTURE (MANDATORY)

Icon positioned ABOVE the attribute text

Icon + text CENTER ALIGNED vertically

Keep 3-bullet layout exactly as Image 1

Keep original spacing between icon ↔ text

❌ Do NOT change spacing

ICON RULES

Auto-generate icon matching attribute meaning

Style:

Outline (stroke only)

Minimal

Modern

Monoline

Color: #32352f (EXACT)

Size:

All icons same size

Same size as icons in Image 1

❌ No fill

❌ No gradient

❌ No shadow

6. KEEP EVERYTHING ELSE UNCHANGED

❌ Do NOT modify:

Product image size

Icon positions

Bullet layout

Overall composition

Spacing between elements

✔️ Only background crop/extension is allowed

FINAL OUTPUT REQUIREMENTS

Canvas size: 1024 × 1024 px

Background: #f0f0f0, flat, clean, full coverage

Title: Bold, #026415, white outline

Icons + attribute text: #32352f exact

New logo:

Correct position

Correct size

Correct ratio

❌ No layout shift

❌ No white frame

❌ No creative deviation

SELF-CHECK (FAIL IF ANY ITEM IS WRONG)

Any element moved → ❌ FAIL

Any color mismatch → ❌ FAIL

Icon not above text → ❌ FAIL

Not center aligned → ❌ FAIL

Font not Plus Jakarta Sans → ❌ FAIL`;

export const DEFAULT_BLUEPRINT_PROMPT_CONTENT = `ROLE

You are an expert AI specialized in Blueprint-to-Product visualization.

Your task is to take a Blueprint/Wireframe (Image 1) and a Logo (Image 2), analyze the layout structure, and render a final photorealistic product image.

INPUTS

IMAGE 1: Blueprint / Wireframe / Sketch
(Contains layout structure, product shape placeholder, header zone, and text position placeholders)

IMAGE 2: Brand Logo

TASKS
1. ANALYZE STRUCTURE

From IMAGE 1, precisely identify:

The Header area

The Product area

The Title / Text areas

⚠️ Do not infer or redesign positions. Follow the blueprint layout strictly.

2. LOGO REPLACEMENT

Place IMAGE 2 (Logo) into the detected Header area.

Completely replace any sketched logo, placeholder text, or symbols in the header.

Resize the logo to fit perfectly within the header zone defined by the blueprint.

Maintain the original aspect ratio of the logo (no distortion).

3. PRODUCT RENDERING

Analyze the central product sketch in IMAGE 1.

Render it as a realistic, high-quality 3D product image:

If the sketch represents a bottle → render a bottle

If the sketch represents a box → render a box

Material:

Plastic / Glass / Paper
→ Choose appropriately based on the product shape.

Style: Clean, professional, e-commerce–ready

4. TEXT RENDERING

Identify the Title and Attribute / Body text placeholders from the blueprint.

Render sharp, professional typography in the exact detected positions.

Font: Plus Jakarta Sans

Text color rules:

Title: #32352f (MANDATORY)

Body text: #32352f

Title positioning rule (MANDATORY):

A Title MUST always be present

The Title must be placed centered directly below the Logo

The position is fixed relative to the Logo, not inferred elsewhere

Title styling rules (IMPORTANT):

Title must be plain text only

NO border

NO box

NO background shape

NO outline

NO decorative frame

Text content:

If the sketch text is readable → use the exact text

If the sketch text is illegible → generate realistic Lorem Ipsum–style product text that fits the space and context

5. BACKGROUND

Remove all:

Blueprint grids

Paper textures

Sketch lines

Use a solid background color: #f0f0f0
Add soft, realistic shadow beneath the product.

OUTPUT

One single image

Resolution: 1024 × 1024

No wireframes

No sketch lines

Professional, photorealistic e-commerce appearance`;

export const DEFAULT_AUTO_DESIGN_PROMPT_CONTENT = `ROLE
You are a Senior E-Commerce Graphic Designer. 
Your task is to create a professional product marketing image by composing the provided elements (Product, Logo, Text, Icons) into a high-quality layout.

STRICT BRAND GUIDELINES (MUST FOLLOW):
1. BACKGROUND: 
   - Solid Color #f0f0f0. 
   - Clean, flat, no gradients, no noise.
   - Full 100% coverage.

2. LOGO PLACEMENT:
   - Place the provided LOGO (Image 2) in the HEADER area.
   - Position: Top Left or Top Center (Standard E-commerce).
   - Maintain original logo aspect ratio. Do not distort.

3. TYPOGRAPHY:
   - Font: "Plus Jakarta Sans".
   - PRODUCT TITLE: Bold, #026415 (Green), White Outline (Stroke). Positioned prominently (usually Top or Center).
   - ATTRIBUTES: #32352f (Dark Grey).

4. LAYOUT COMPOSITION:
   - PRODUCT (Image 1): Place visibly in the center or slightly right. Add a soft realistic shadow underneath.
   - ATTRIBUTES LIST: Arrange the attributes (Text + Provided Icons) in a clean list (vertical or horizontal) usually on the side or bottom.
   - ICONS: If specific icon images are provided, place them ABOVE or NEXT TO their respective attribute text.

INPUT DATA:
- Image 1: Product Image.
- Image 2: Logo.
- Images 3+: Specific Attribute Icons (mapped in instructions).
- Text: Title and Attribute Descriptions.

OUTPUT:
- A single 1024x1024 pixel-perfect marketing image.
- Professional, clean, ready for sales.
`;
