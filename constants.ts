
import { Client, Product, CompanyInfo, QuoteStatus, AppSettings, InstallationProgressStatus, ImportantLink, Audiobook, DailyTask, User, UserRole } from './types';

export const INITIAL_CLIENTS: Client[] = [
  { id: "client-1", name: "COND. ED. TELLES", address: "Rua das Palmeiras, 123, São Paulo, SP", contact: "Sr. Telles (11) 99999-0001", cnpj: "12.345.678/0001-99" },
  { id: "client-2", name: "Tech Solutions Ltda.", address: "Av. Inovação, 456, Campinas, SP", contact: "Ana Paula (19) 98888-0002", cnpj: "98.765.432/0001-11" },
  { id: "client-3", name: "Comércio Varejista XYZ", address: "Praça Central, 789, Rio de Janeiro, RJ", contact: "Carlos Silva (21) 97777-0003", cnpj: "45.678.912/0001-33" },
];

const parseCurrency = (value: string): number => {
  if (!value) return 0;
  return parseFloat(value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
};

const ocrProducts: Product[] = [
  // CAMERAS
  { id: "prod-ocr-1", name: "CAMERA MOTOROLA EXTERNA FULL HD", description: "Câmera Motorola Externa Full HD", unitPrice: parseCurrency("R$ 149,00"), costPrice: parseCurrency("R$ 97,60") },
  { id: "prod-ocr-2", name: "CAMERA MOTOROLA INTERNA FULLHD", description: "Câmera Motorola Interna FullHD", unitPrice: parseCurrency("R$ 149,00"), costPrice: parseCurrency("R$ 93,50") },
  { id: "prod-ocr-3", name: "CAMERA IP MOTOROLA COM AUDIO", description: "Câmera IP Motorola com Áudio", unitPrice: parseCurrency("R$ 349,50"), costPrice: parseCurrency("R$ 234,50") },
  { id: "prod-ocr-4", name: "CAMERA IP MOTOROLA SEM AUDIO", description: "Câmera IP Motorola sem Áudio", unitPrice: parseCurrency("R$ 345,00"), costPrice: parseCurrency("R$ 234,00") },
  { id: "prod-ocr-5", name: "CAMERA PPA BULLET 2MP", description: "Câmera PPA Bullet 2MP", unitPrice: parseCurrency("R$ 125,00"), costPrice: parseCurrency("R$ 64,00") },
  { id: "prod-ocr-6", name: "CAMERA EZEVIZ SMART HOME PAINEL SOLAR", description: "Câmera EZEVIZ Smart Home Painel Solar", unitPrice: parseCurrency("R$ 1.699,00"), costPrice: parseCurrency("R$ 1.242,00") },
  { id: "prod-ocr-7", name: "CAMERA EZEVIZ SMART HOME H1C", description: "Câmera EZEVIZ Smart Home H1C", unitPrice: parseCurrency("R$ 299,00"), costPrice: parseCurrency("R$ 163,00") },
  { id: "prod-ocr-8", name: "CAMERA WIFI EZEVIZ TY2", description: "Câmera WiFi EZEVIZ TY2", unitPrice: parseCurrency("R$ 425,00"), costPrice: parseCurrency("R$ 286,00") },
  { id: "prod-ocr-9", name: "CAMERA IP INTELBRAS VIP1230", description: "Câmera IP Intelbras VIP1230", unitPrice: parseCurrency("R$ 320,00"), costPrice: parseCurrency("R$ 188,00") },
  { id: "prod-ocr-10", name: "CAMERA HDCVI IR 20MT LITE 2,8MM VHC 1120 B", description: "Câmera HDCVI IR 20mt Lite 2,8mm VHC 1120 B", unitPrice: parseCurrency("R$ 135,00"), costPrice: parseCurrency("R$ 84,28") },
  { id: "prod-ocr-11", name: "CAMERA EZEVIZ C3TN", description: "Câmera EZEVIZ C3TN", unitPrice: parseCurrency("R$ 499,00"), costPrice: parseCurrency("R$ 368,00") },
  { id: "prod-ocr-12", name: "CAMERA PPA (DIGITAL 3022D)", description: "Câmera PPA (Digital 3022D)", unitPrice: parseCurrency("R$ 90,00"), costPrice: parseCurrency("R$ 35,64") },
  { id: "prod-ocr-13", name: "CAMERA PPA (DIGITAL 3022B)", description: "Câmera PPA (Digital 3022B)", unitPrice: parseCurrency("R$ 90,00"), costPrice: parseCurrency("R$ 46,15") },
  { id: "prod-ocr-14", name: "CAMERA PPA (JETCOLOR 3122DM)", description: "Câmera PPA (JetColor 3122DM)", unitPrice: parseCurrency("R$ 125,00"), costPrice: parseCurrency("R$ 65,00") },
  { id: "prod-ocr-15", name: "CAMERA PPA (JETCOLOCR 3122B)", description: "Câmera PPA (JetColor 3122B)", unitPrice: parseCurrency("R$ 130,00"), costPrice: parseCurrency("R$ 65,00") },
  { id: "prod-ocr-16", name: "CAMERA PPA (IP RTMP 3242DM)", description: "Câmera PPA (IP RTMP 3242DM)", unitPrice: parseCurrency("R$ 225,00"), costPrice: parseCurrency("R$ 147,06") },
  { id: "prod-ocr-17", name: "CAMERA PPA (IP RTMP 3243 BM)", description: "Câmera PPA (IP RTMP 3243 BM)", unitPrice: parseCurrency("R$ 250,00"), costPrice: parseCurrency("R$ 147,06") },
  { id: "prod-ocr-18", name: "CAMERA PPA (IP 3052 DM)", description: "Câmera PPA (IP 3052 DM)", unitPrice: parseCurrency("R$ 198,00"), costPrice: parseCurrency("R$ 139,53") },
  { id: "prod-ocr-19", name: "CAMERA PPA (IP 3053 BM)", description: "Câmera PPA (IP 3053 BM)", unitPrice: parseCurrency("R$ 198,00"), costPrice: parseCurrency("R$ 139,53") },

  // CABOS
  { id: "prod-ocr-20", name: "cabo cde rede avulso 100% cobre", description: "Cabo de rede avulso 100% cobre (metro)", unitPrice: parseCurrency("R$ 4,50"), costPrice: parseCurrency("R$ 2,49") },
  { id: "prod-ocr-21", name: "CABO COAXIAL 4MM+2X26AWG BR - RL 100MTS", description: "Cabo Coaxial 4mm+2x26AWG BR - RL 100mts", unitPrice: parseCurrency("R$ 135,00"), costPrice: parseCurrency("R$ 84,82") },
  { id: "prod-ocr-22", name: "CAIXA CABO CAT5 100% COBRE 300METROS", description: "Caixa Cabo CAT5 100% Cobre 300 metros", unitPrice: parseCurrency("R$ 480,00"), costPrice: parseCurrency("R$ 385,00") },

  // DVR
  { id: "prod-ocr-23", name: "DVR MOTOROLA 4 CANAIS", description: "DVR Motorola 4 Canais", unitPrice: parseCurrency("R$ 498,00"), costPrice: parseCurrency("R$ 299,30") },
  { id: "prod-ocr-24", name: "DVR MOTOROLA 8 CANAIS", description: "DVR Motorola 8 Canais", unitPrice: parseCurrency("R$ 635,00"), costPrice: parseCurrency("R$ 405,99") },
  { id: "prod-ocr-25", name: "DVR MOTOROLA 16 CANAIS", description: "DVR Motorola 16 Canais", unitPrice: parseCurrency("R$ 999,00"), costPrice: parseCurrency("R$ 669,30") },
  { id: "prod-ocr-26", name: "DVR 4 CAMERAS MHDX INTELBRAS", description: "DVR 4 Câmeras MHDX Intelbras", unitPrice: parseCurrency("R$ 750,00"), costPrice: parseCurrency("R$ 480,00") },
  { id: "prod-ocr-27", name: "DVR 8 CAMERAS MHDX 1008-C INTELBRAS", description: "DVR 8 Câmeras MHDX 1008-C Intelbras", unitPrice: parseCurrency("R$ 890,00"), costPrice: parseCurrency("R$ 544,90") },
  { id: "prod-ocr-28", name: "DVR 16 CAMERAS MHDX INTELBRAS", description: "DVR 16 Câmeras MHDX Intelbras", unitPrice: parseCurrency("R$ 1.299,00"), costPrice: parseCurrency("R$ 900,00") },
  { id: "prod-ocr-29", name: "DVR PPA 4 DIGITAL CANAIS", description: "DVR PPA 4 Digital Canais", unitPrice: parseCurrency("R$ 400,00"), costPrice: parseCurrency("R$ 178,50") },
  { id: "prod-ocr-30", name: "DVR PPA 8 DIGITAL CANAIS", description: "DVR PPA 8 Digital Canais", unitPrice: parseCurrency("R$ 600,00"), costPrice: parseCurrency("R$ 223,03") },
  { id: "prod-ocr-31", name: "DVR PPA 16 DIGITAL CANAIS", description: "DVR PPA 16 Digital Canais", unitPrice: parseCurrency("R$ 900,00"), costPrice: parseCurrency("R$ 410,60") },
  { id: "prod-ocr-32", name: "NVR PPA 8 CANAIS", description: "NVR PPA 8 Canais", unitPrice: parseCurrency("R$ 999,00"), costPrice: parseCurrency("R$ 708,18") },
  { id: "prod-ocr-33", name: "NVR PPA 16 CANAIS", description: "NVR PPA 16 Canais", unitPrice: parseCurrency("R$ 2.100,00"), costPrice: parseCurrency("R$ 1.540,00") },
  
  // ACESSORIOS
  { id: "prod-ocr-34", name: "CONECTOR BNC M C/ RABICHO MOLA - PARAFUSO P", description: "Conector BNC M c/ Rabicho Mola - Parafuso P", unitPrice: parseCurrency("R$ 4,50"), costPrice: parseCurrency("R$ 1,78") },
  { id: "prod-ocr-35", name: "PLUG P4 MACHO C/ PARAFUSO BORNE SINDAL", description: "Plug P4 Macho c/ Parafuso Borne Sindal", unitPrice: parseCurrency("R$ 4,50"), costPrice: parseCurrency("R$ 1,09") },
  { id: "prod-ocr-36", name: "FONTE DE ALIMENTACAO AC/DC 12,8V 05A EFM 1205", description: "Fonte de Alimentação AC/DC 12,8V 05A EFM 1205", unitPrice: parseCurrency("R$ 120,00"), costPrice: parseCurrency("R$ 76,50") },
  { id: "prod-ocr-37", name: "HD 1TB WD PURPLE", description: "HD 1TB WD Purple", unitPrice: parseCurrency("R$ 399,00"), costPrice: parseCurrency("R$ 258,00") },
  { id: "prod-ocr-38", name: "HD 1TB SANSUNG", description: "HD 1TB Samsung", unitPrice: parseCurrency("R$ 259,00"), costPrice: parseCurrency("R$ 160,00") },
  { id: "prod-ocr-39", name: "BALUM (PAR)", description: "Balun (Par)", unitPrice: parseCurrency("R$ 36,00"), costPrice: parseCurrency("R$ 26,00") },
  { id: "prod-ocr-40", name: "HD TOSHIBA CFTV PPA 1TB", description: "HD Toshiba CFTV PPA 1TB", unitPrice: parseCurrency("R$ 320,00"), costPrice: parseCurrency("R$ 262,38") },
  { id: "prod-ocr-41", name: "HD TOSHIBA CFTV PPA 2TB", description: "HD Toshiba CFTV PPA 2TB", unitPrice: parseCurrency("R$ 590,00"), costPrice: parseCurrency("R$ 360,25") },

  // AUTOMAÇÃO
  { id: "prod-ocr-42", name: "FECHADURA FD1000 SMART COM SENHA", description: "Fechadura FD1000 Smart com Senha", unitPrice: parseCurrency("R$ 498,00"), costPrice: parseCurrency("R$ 362,00") },
  { id: "prod-ocr-43", name: "FECHADURA Elsys com Biometria, Chave e Senha e Wi-", description: "Fechadura Elsys com Biometria, Chave, Senha e Wi-Fi", unitPrice: parseCurrency("R$ 1.150,00"), costPrice: parseCurrency("R$ 799,00") },
  { id: "prod-ocr-44", name: "CONTROLADOR DE ACESSO FACIAL SS 1530 MF W", description: "Controlador de Acesso Facial SS 1530 MF W", unitPrice: parseCurrency("R$ 1.250,00"), costPrice: parseCurrency("R$ 764,99") },
  { id: "prod-ocr-45", name: "CONTROLADOR DE ACESSO FACIAL CONTROL ID", description: "Controlador de Acesso Facial Control ID", unitPrice: parseCurrency("R$ 1.499,00"), costPrice: parseCurrency("R$ 1.271,00") },
  { id: "prod-ocr-46", name: "CONTROLADOR DE ACESSO FACIAL HIKVISION", description: "Controlador de Acesso Facial Hikvision", unitPrice: parseCurrency("R$ 1.399,00"), costPrice: parseCurrency("R$ 995,00") },
  { id: "prod-ocr-47", name: "FECHADURA DIGITAL POR SENHA IDLOCK", description: "Fechadura Digital por Senha IDLock", unitPrice: parseCurrency("R$ 780,00"), costPrice: parseCurrency("R$ 532,00") },
  { id: "prod-ocr-48", name: "FECHADURA EZEVIZ L2S BIOMETRIA COMPLETA", description: "Fechadura EZEVIZ L2S Biometria Completa", unitPrice: parseCurrency("R$ 1.599,00"), costPrice: parseCurrency("R$ 1.170,00") },
  
  // ANTENAS RFID
  { id: "prod-ocr-49", name: "ANTENA RFID INTELBRAS", description: "Antena RFID Intelbras", unitPrice: parseCurrency("R$ 3.200,00"), costPrice: parseCurrency("R$ 2.980,00") },
  { id: "prod-ocr-50", name: "ANTENA RFID PPA", description: "Antena RFID PPA", unitPrice: parseCurrency("R$ 2.500,00"), costPrice: parseCurrency("R$ 1.354,00") },
  { id: "prod-ocr-51", name: "CONTROLADORA BRAVA", description: "Controladora Brava", unitPrice: parseCurrency("R$ 890,00"), costPrice: parseCurrency("R$ 700,00") },
  { id: "prod-ocr-52", name: "TAGS unidade", description: "Tag RFID (unidade)", unitPrice: parseCurrency("R$ 6,90"), costPrice: parseCurrency("R$ 4,50") },
];

const existingInitialProducts: Product[] = [
  { id: "prod-1", name: "Leitor Facial Avançado", description: "Leitor de reconhecimento facial com IA, alta precisão.", unitPrice: 1250.00, costPrice: 900.00 }, 
  { id: "prod-2", name: "Câmera IP Dome Full HD", description: "Câmera de segurança IP, modelo Dome, resolução Full HD, infravermelho.", unitPrice: 450.00, costPrice: 300.00 },
  { id: "prod-3", name: "Sensor de Movimento Dual Tech", description: "Sensor de presença com tecnologia dupla (MW e PIR).", unitPrice: 180.00, costPrice: 120.00 },
  { id: "prod-4", name: "Instalação Técnica Padrão", description: "Serviço de instalação e configuração de equipamentos (por ponto/hora).", unitPrice: 150.00, costPrice: 0 },
  { id: "prod-5", name: "Software de Monitoramento Pro", description: "Licença anual de software de monitoramento centralizado.", unitPrice: 800.00, costPrice: 400.00 },
  { id: "prod-6", name: "Cabo UTP CAT6 (Metro)", description: "Cabo de rede UTP CAT6, alta performance.", unitPrice: 2.50, costPrice: 1.50 },
];

const combinedProducts: Product[] = [...existingInitialProducts];
ocrProducts.forEach(ocrProd => {
  const existingIndex = combinedProducts.findIndex(p => p.name.toLowerCase() === ocrProd.name.toLowerCase());
  if (existingIndex === -1) {
    combinedProducts.push(ocrProd);
  } else {
    combinedProducts[existingIndex].unitPrice = ocrProd.unitPrice;
    combinedProducts[existingIndex].costPrice = ocrProd.costPrice;
  }
});


export const INITIAL_PRODUCTS: Product[] = combinedProducts;


export const APP_NAME = "Gerador de Orçamentos Pro";

export const INITIAL_COMPANY_INFO: CompanyInfo = {
  name: "A COMPANY",
  logoUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjMwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMzAiIGZpbGw9IiNmNDQzMzYiLz48L3N2Zz4=", // Default simple logo
  address: "Rua Exemplo, 123, Cidade, Estado, CEP 00000-000",
  phone: "(XX) YYYYY-ZZZZ",
  email: "contato@suaempresa.com",
  website: "www.suaempresa.com",
  cnpj: "00.000.000/0001-00",
};

export const INITIAL_APP_SETTINGS: AppSettings = {
  defaultSalesperson: "Jorcimar",
  defaultValidityDays: 15,
  paymentTermSuggestions: [
    "À Vista com 5% de Desconto",
    "Entrada + 30 dias",
    "3X sem juros",
    "6X sem juros",
    "10X sem juros",
    "12X com juros (consultar)",
  ],
};


export const QUOTE_STATUS_OPTIONS = Object.values(QuoteStatus);

export const INSTALLATION_PROGRESS_STATUS_OPTIONS = Object.values(InstallationProgressStatus);

export const KANBAN_COLUMN_TITLES = {
  TODO: "A Realizar",
  DOING: "Realizando",
  COMPLETED: "Concluída",
};

export const INITIAL_IMPORTANT_LINKS: ImportantLink[] = [];

// Gamification Points
export const POINTS_PER_POMODORO_WORK_CYCLE = 10;
export const POINTS_PER_TASK_COMPLETION = 25; 
export const POINTS_PER_AUDIOBOOK = 50;
export const POINTS_PER_DAILY_TASK_COMPLETION = 15;


// Pomodoro Default Durations (in minutes)
export const POMODORO_WORK_DURATION = 25;
export const POMODORO_SHORT_BREAK_DURATION = 5;
export const POMODORO_LONG_BREAK_DURATION = 15;
export const POMODORO_CYCLES_BEFORE_LONG_BREAK = 4;

// Audiobooks
export const AUDIOBOOK_LIST: Audiobook[] = [
  { id: "ab1", title: "A Arte da Guerra", author: "Sun Tzu", url: "https://librivox.org/the-art-of-war-by-sun-tzu/", source: "LibriVox" },
  { id: "ab2", title: "Meditações", author: "Marco Aurélio", url: "https://librivox.org/meditations-by-marcus-aurelius/", source: "LibriVox" },
  { id: "ab3", title: "O Profeta", author: "Khalil Gibran", url: "https://librivox.org/the-prophet-by-kahlil-gibran/", source: "LibriVox" },
  { id: "ab4", title: "Assim Falou Zaratustra", author: "Friedrich Nietzsche", url: "https://librivox.org/thus-spake-zarathustra-by-friedrich-nietzsche-2/", source: "LibriVox" },
  { id: "ab5", title: "O Príncipe", author: "Nicolau Maquiavel", url: "https://librivox.org/the-prince-by-niccolo-machiavelli/", source: "LibriVox" },
  { id: "ab6", title: "A Riqueza das Nações (Livro 1)", author: "Adam Smith", url: "https://librivox.org/an-inquiry-into-the-nature-and-causes-of-the-wealth-of-nations-book-1-by-adam-smith/", source: "LibriVox" },
  { id: "ab7", title: "Walden ou A Vida nos Bosques", author: "Henry David Thoreau", url: "https://librivox.org/walden-by-henry-david-thoreau/", source: "LibriVox" },
  { id: "ab8", title: "Autoconfiança", author: "Ralph Waldo Emerson", url: "https://librivox.org/self-reliance-by-ralph-waldo-emerson/", source: "LibriVox" },
  { id: "ab9", title: "O Manual de Epicteto", author: "Epicteto", url: "https://librivox.org/the-enchiridion-by-epictetus-translsted-by-elizabeth-carter/", source: "LibriVox" },
  { id: "ab10", title: "Canção de Mim Mesmo", author: "Walt Whitman", url: "https://librivox.org/song-of-myself-by-walt-whitman/", source: "LibriVox" },
];

export const INITIAL_DAILY_TASKS: DailyTask[] = []; // Initialize empty or with defaults if needed


export const INITIAL_USERS: User[] = [
  { id: "user-admin-iac", username: "IAC2010", name: "Administrador IAC", role: UserRole.ADMINISTRADOR, password: "2010" },
  { id: "user-admin-vivi", username: "VIVI", name: "Viviane Admin", role: UserRole.ADMINISTRADOR, password: "2010" },
  { id: "user-rico", username: "RICO", name: "Ricardo Usuário", role: UserRole.USUARIO, password: "2010" },
];