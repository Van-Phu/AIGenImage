
import { Language } from './types';

type TranslationKey = 
  | 'appTitle'
  | 'batchEditor'
  | 'loading'
  | 'apiKeyMissing'
  | 'apiKeyDesc'
  | 'connectKey'
  | 'readBilling'
  | 'model'
  | 'switchKey'
  | 'importImages'
  | 'uploadText'
  | 'uploadSubText'
  | 'dropMore'
  | 'newLogo'
  | 'logoSubText'
  | 'logoUploaded'
  | 'clickUpload'
  | 'remove'
  | 'promptSettings'
  | 'manage'
  | 'queue'
  | 'clearAll'
  | 'noImages'
  | 'processing'
  | 'generateAll'
  | 'download'
  | 'regenerate'
  | 'noImageSelected'
  | 'selectToView'
  | 'originalInput'
  | 'generatedResult'
  | 'error'
  | 'tryAgain'
  | 'promptManager'
  | 'newPrompt'
  | 'promptName'
  | 'promptContent'
  | 'unsavedChanges'
  | 'allSaved'
  | 'reset'
  | 'saveChanges'
  | 'deletePromptConfirm'
  | 'discardChanges'
  | 'minOnePrompt'
  | 'settings'
  | 'theme'
  | 'language'
  | 'resolution'
  | 'light'
  | 'dark'
  | 'apiKeyInvalid'
  | 'enterApiKey'
  | 'saveKey'
  | 'apiKeyPlaceholder'
  | 'apiKeyNote'
  | 'menuEditor'
  | 'menuHistory'
  | 'menuHelp'
  | 'comingSoon'
  | 'stop'
  | 'stopping'
  | 'saveSuccess'
  | 'saving'
  | 'maxImagesWarning'
  | 'downloadSettings'
  | 'widthPx'
  | 'heightPx'
  | 'keepEmptyOriginal'
  | 'menuLayout'
  | 'layoutGenerator'
  | 'uploadLayoutText'
  | 'uploadLayoutSubText'
  | 'importLayouts'
  | 'filenameConfig'
  | 'regexPattern'
  | 'regexPlaceholder'
  | 'regexPreview'
  | 'newTitle'
  | 'referenceLayout'
  | 'productAttributes'
  | 'attributesPlaceholder'
  | 'referenceUploaded'
  | 'uploadProductsQueue'
  | 'editProductDetails'
  | 'productName'
  | 'addAttribute'
  | 'iconOptional'
  | 'autoGenIcon'
  | 'hasIcon'
  | 'globalSettings'
  | 'addProduct'
  | 'uploadProductImage'
  | 'productImageMissing'
  | 'productInfo'
  | 'configure'
  | 'close'
  | 'resolutionConfig'
  | 'modeReference'
  | 'modeBlueprint'
  | 'modeAutoDesign'
  | 'uploadBlueprint'
  | 'importBlueprints'
  | 'addBlueprints'
  | 'blueprintInstructions'
  | 'blueprintInstructionsPlaceholder'
  | 'refineTitle'
  | 'refinePlaceholder'
  | 'refineButton'
  | 'moduleMarketing'
  | 'moduleSystem';

export const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    appTitle: 'Hachi Hachi',
    batchEditor: 'Batch Editor',
    loading: 'Loading...',
    apiKeyMissing: 'Hachi Hachi',
    apiKeyDesc: 'To use the advanced Gemini 3 Pro (Nano Banana) model, you must provide a valid Google Cloud API key.',
    connectKey: 'Connect API Key',
    readBilling: 'Get an API Key here',
    model: 'Model',
    switchKey: 'Change Key',
    importImages: 'Import Images',
    uploadText: 'Upload Images to Edit',
    uploadSubText: 'Drag & drop multiple files or folders',
    dropMore: 'Drop more files here',
    newLogo: 'New Logo',
    logoSubText: '(Global for all items)',
    logoUploaded: 'Logo uploaded',
    clickUpload: 'Click to upload',
    remove: 'Remove',
    promptSettings: 'Prompt Settings',
    manage: 'Manage',
    queue: 'Queue',
    clearAll: 'Clear All',
    noImages: 'No images in queue',
    processing: 'Processing...',
    generateAll: 'Generate All',
    download: 'Download',
    regenerate: 'Regenerate',
    noImageSelected: 'No image selected',
    selectToView: 'Select a product to view details',
    originalInput: 'Original Input',
    generatedResult: 'Generated Result',
    error: 'Error',
    tryAgain: 'Try Again',
    promptManager: 'Prompt Manager',
    newPrompt: 'New Prompt',
    promptName: 'Prompt Name',
    promptContent: 'Prompt Content (System Instruction)',
    unsavedChanges: 'Unsaved changes',
    allSaved: 'All changes saved',
    reset: 'Reset',
    saveChanges: 'Save Changes',
    deletePromptConfirm: 'Are you sure you want to delete this prompt?',
    discardChanges: 'You have unsaved changes. Discard them?',
    minOnePrompt: 'You must have at least one prompt.',
    settings: 'System Settings',
    theme: 'Theme',
    language: 'Language',
    resolution: 'Image Resolution',
    light: 'Light',
    dark: 'Dark',
    apiKeyInvalid: 'Your API key is invalid or expired.',
    enterApiKey: 'Enter your Gemini API Key',
    saveKey: 'Save API Key',
    apiKeyPlaceholder: 'Paste your API Key here (starts with AIza...)',
    apiKeyNote: 'Your key is stored locally in your browser.',
    menuEditor: 'Editor',
    menuHistory: 'History',
    menuHelp: 'Help & Docs',
    comingSoon: 'Feature coming soon',
    stop: 'Stop Generation',
    stopping: 'Stopping...',
    saveSuccess: 'All images saved to folder successfully!',
    saving: 'Saving...',
    maxImagesWarning: 'Maximum 10 images allowed in the queue.',
    downloadSettings: 'Download Size (Optional)',
    widthPx: 'Width (px)',
    heightPx: 'Height (px)',
    keepEmptyOriginal: 'Leave empty for original size',
    menuLayout: 'Layout Gen',
    layoutGenerator: 'Layout Generator',
    uploadLayoutText: 'Reference Layout', 
    uploadLayoutSubText: 'Upload reference design',
    importLayouts: 'Products List',
    uploadProductsQueue: 'Upload Product Images (Max 10)',
    filenameConfig: 'Filename Config (Regex)',
    regexPattern: 'Barcode Extraction Regex',
    regexPlaceholder: 'e.g. (\\d{13})',
    regexPreview: 'Preview: ',
    newTitle: 'Product Title',
    referenceLayout: 'Reference Layout',
    productAttributes: 'Attributes',
    attributesPlaceholder: 'e.g. Waterproof',
    referenceUploaded: 'Reference Layout uploaded',
    editProductDetails: 'Product Configuration',
    productName: 'Product Name',
    addAttribute: '+ Add Attribute',
    iconOptional: 'Icon (Optional)',
    autoGenIcon: 'Auto-Gen',
    hasIcon: 'Icon Set',
    globalSettings: 'Global Assets',
    addProduct: 'Add Product',
    uploadProductImage: 'Product Image',
    productImageMissing: 'Missing Image',
    productInfo: 'Product Information',
    configure: 'Configure',
    close: 'Done',
    resolutionConfig: 'Output Resolution',
    modeReference: 'Reference Image',
    modeBlueprint: 'Blueprint / Draw',
    modeAutoDesign: 'Auto Design',
    uploadBlueprint: 'Blueprint Image',
    importBlueprints: 'Blueprints List',
    addBlueprints: 'Upload Blueprints',
    blueprintInstructions: 'Instructions / Context',
    blueprintInstructionsPlaceholder: 'e.g. This is a tall plastic bottle. Make the liquid orange. The title should be green.',
    refineTitle: 'Refine / Edit Result',
    refinePlaceholder: 'Describe changes to this image (e.g., make background darker, change title color...)',
    refineButton: 'Update Image',
    moduleMarketing: 'Marketing',
    moduleSystem: 'System'
  },
  vi: {
    appTitle: 'Hachi Hachi',
    batchEditor: 'Trình chỉnh sửa hàng loạt',
    loading: 'Đang tải...',
    apiKeyMissing: 'Hachi Hachi',
    apiKeyDesc: 'Để sử dụng mô hình Gemini 3 Pro (Nano Banana) nâng cao, bạn cần cung cấp Google Cloud API Key hợp lệ.',
    connectKey: 'Kết nối API Key',
    readBilling: 'Lấy API Key tại đây',
    model: 'Mô hình',
    switchKey: 'Đổi Key',
    importImages: 'Nhập Hình ảnh',
    uploadText: 'Tải ảnh cần chỉnh sửa',
    uploadSubText: 'Kéo thả nhiều tập tin hoặc thư mục',
    dropMore: 'Thả thêm tập tin vào đây',
    newLogo: 'Logo Mới',
    logoSubText: '(Dùng chung cho tất cả)',
    logoUploaded: 'Đã tải logo',
    clickUpload: 'Tải logo',
    remove: 'Xóa',
    promptSettings: 'Cấu hình Prompt',
    manage: 'Quản lý',
    queue: 'Danh sách chờ',
    clearAll: 'Xóa tất cả',
    noImages: 'Chưa có ảnh nào',
    processing: 'Đang xử lý...',
    generateAll: 'Tạo Layout',
    download: 'Tải xuống',
    regenerate: 'Tạo lại',
    noImageSelected: 'Chưa chọn ảnh',
    selectToView: 'Chọn sản phẩm để xem kết quả',
    originalInput: 'Input',
    generatedResult: 'Kết quả',
    error: 'Lỗi',
    tryAgain: 'Thử lại',
    promptManager: 'Quản lý Prompt',
    newPrompt: 'Thêm Prompt',
    promptName: 'Tên Prompt',
    promptContent: 'Nội dung Prompt (Hướng dẫn hệ thống)',
    unsavedChanges: 'Chưa lưu thay đổi',
    allSaved: 'Đã lưu thay đổi',
    reset: 'Đặt lại',
    saveChanges: 'Lưu thay đổi',
    deletePromptConfirm: 'Bạn có chắc chắn muốn xóa prompt này?',
    discardChanges: 'Bạn có thay đổi chưa lưu. Hủy bỏ chúng?',
    minOnePrompt: 'Bạn phải giữ ít nhất một prompt.',
    settings: 'Cấu hình chung',
    theme: 'Giao diện',
    language: 'Ngôn ngữ',
    resolution: 'Độ phân giải ảnh',
    light: 'Sáng',
    dark: 'Tối',
    apiKeyInvalid: 'API key của bạn không hợp lệ hoặc đã hết hạn.',
    enterApiKey: 'Nhập Gemini API Key',
    saveKey: 'Lưu API Key',
    apiKeyPlaceholder: 'Dán API Key vào đây (bắt đầu bằng AIza...)',
    apiKeyNote: 'Key của bạn được lưu cục bộ trên trình duyệt.',
    menuEditor: 'Chỉnh sửa',
    menuHistory: 'Lịch sử',
    menuHelp: 'Trợ giúp',
    comingSoon: 'Tính năng đang phát triển',
    stop: 'Dừng tạo ảnh',
    stopping: 'Đang dừng...',
    saveSuccess: 'Đã lưu tất cả ảnh vào thư mục thành công!',
    saving: 'Đang lưu...',
    maxImagesWarning: 'Chỉ cho phép tối đa 10 ảnh trong danh sách chờ.',
    downloadSettings: 'Kích thước tải xuống (Tùy chọn)',
    widthPx: 'Rộng (px)',
    heightPx: 'Cao (px)',
    keepEmptyOriginal: 'Để trống để giữ kích thước gốc',
    menuLayout: 'Tạo Layout',
    layoutGenerator: 'Tạo ảnh từ Layout',
    uploadLayoutText: 'Layout Mẫu', 
    uploadLayoutSubText: 'Tải ảnh thiết kế mẫu',
    importLayouts: 'Danh sách Sản phẩm',
    uploadProductsQueue: 'Tải Ảnh Sản Phẩm (Max 10)',
    filenameConfig: 'Cấu hình tên file (Regex)',
    regexPattern: 'Regex lấy Barcode',
    regexPlaceholder: 'ví dụ: (\\d{13})',
    regexPreview: 'Xem trước: ',
    newTitle: 'Tên sản phẩm',
    referenceLayout: 'Layout Mẫu',
    productAttributes: 'Thuộc tính',
    attributesPlaceholder: 'VD: Chống nước',
    referenceUploaded: 'Đã tải Layout mẫu',
    editProductDetails: 'Cấu hình Sản phẩm',
    productName: 'Tên hiển thị',
    addAttribute: 'Thêm thuộc tính',
    iconOptional: 'Icon',
    autoGenIcon: 'Tự tạo Icon',
    hasIcon: 'Đã có Icon',
    globalSettings: 'Tài nguyên chung',
    addProduct: 'Thêm sản phẩm',
    uploadProductImage: 'Ảnh sản phẩm',
    productImageMissing: 'Thiếu ảnh',
    productInfo: 'Thông tin sản phẩm',
    configure: 'Cấu hình',
    close: 'Hoàn tất',
    resolutionConfig: 'Độ phân giải xuất',
    modeReference: 'Ảnh mẫu',
    modeBlueprint: 'Bản vẽ',
    modeAutoDesign: 'Tự thiết kế',
    uploadBlueprint: 'Ảnh bản vẽ',
    importBlueprints: 'Danh sách Bản vẽ',
    addBlueprints: 'Tải bản vẽ (Max 10)',
    blueprintInstructions: 'Mô tả / Ngữ cảnh',
    blueprintInstructionsPlaceholder: 'VD: Đây là chai nước rửa chén. Màu chất lỏng là vàng chanh. Tiêu đề màu xanh lá.',
    refineTitle: 'Tinh chỉnh kết quả',
    refinePlaceholder: 'Mô tả thay đổi muốn thực hiện trên ảnh này (VD: làm nền tối hơn, đổi màu chữ...)',
    refineButton: 'Cập nhật ảnh',
    moduleMarketing: 'Marketing',
    moduleSystem: 'Hệ thống'
  }
};
