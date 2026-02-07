// Member Types
export interface Member {
  id: string;
  code: string; // รหัสสมาชิก เช่น M001
  name: string;
  phone: string;
  email?: string;
  points: number;
  totalSpent: number;
  joinDate: Date;
  lastVisit?: Date;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface PointsTransaction {
  id: string;
  memberId: string;
  orderId?: string;
  type: 'earn' | 'redeem';
  points: number;
  description: string;
  createdAt: Date;
}

// Points Settings
export const POINTS_PER_BAHT = 1; // 1 แก้ว = 1 แต้ม
export const POINTS_REDEEM_RATE = 2.5; // 1 แต้ม = 2.5 บาท (10 แต้ม = 25 บาท)
export const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 500,
  gold: 2000,
  platinum: 5000,
};
export const TIER_DISCOUNTS = {
  bronze: 0,
  silver: 3,
  gold: 5,
  platinum: 10,
};

// Employee & Auth Types
export interface Employee {
  id: string;
  name: string;
  pin: string;
  role: 'staff' | 'admin';
  avatar?: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  startTime: Date;
  endTime?: Date;
  startingCash: number;
  endingCash?: number;
  totalSales: number;
  totalOrders: number;
  status: 'open' | 'closed';
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  memberDiscount: number;
  pointsDiscount: number;
  total: number;
  paymentMethod: 'cash' | 'qr';
  receivedAmount: number;
  change: number;
  employeeId: string;
  employeeName: string;
  shiftId: string;
  createdAt: Date;
  orderNumber: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  memberId?: string;
  memberName?: string;
  pointsEarned?: number;
  pointsUsed?: number;
  note?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  recipe: string;
  nameEn: string;
  price: number;
  image: string;
  category: string;
  description?: string;
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  size: Size;
  sweetness: Sweetness;
  ice: Ice;
  toppings: Topping[];
  totalPrice: number;
  note?: string;
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
}

export type Size = 'S' | 'M' | 'L';
export type Sweetness = '0%' | '25%' | '50%' | '75%' | '100%' | '125%';
export type Ice = 'ไม่ใส่' | 'น้อย' | 'ปกติ' | 'มาก';

export interface Topping {
  id: string;
  name: string;
  price: number;
}

export interface SizeOption {
  size: Size;
  label: string;
  priceAdd: number;
}

export interface OrderSummary {
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
}

// Sample data
export const categories: Category[] = [
  { id: 'all', name: 'ทั้งหมด', nameEn: 'All', icon: 'grid' },
  { id: 'coffee', name: 'กาแฟ', nameEn: 'Coffee', icon: 'coffee' },
  { id: 'tea', name: 'ชา', nameEn: 'Tea', icon: 'leaf' },
  { id: 'milk', name: 'นม', nameEn: 'Milk', icon: 'milk' },
  { id: 'smoothie', name: 'ปั่น', nameEn: 'Smoothie', icon: 'blend' },
  { id: 'special', name: 'พิเศษ', nameEn: 'Special', icon: 'star' },
];


export const toppings: Topping[] = [
  { id: 't1', name: 'ไข่มุก', price: 10 },
  { id: 't2', name: 'วิปครีม', price: 15 },
  { id: 't3', name: 'ช็อตเอสเพรสโซ่', price: 15 },
  { id: 't4', name: 'เยลลี่', price: 10 },
  { id: 't5', name: 'ครีมชีส', price: 20 },
  { id: 't6', name: 'บราวน์ชูการ์', price: 10 },
];

export const sizeOptions: SizeOption[] = [
  { size: 'S', label: 'เล็ก', priceAdd: 0 },
  { size: 'M', label: 'กลาง', priceAdd: 10 },
  { size: 'L', label: 'ใหญ่', priceAdd: 20 },
];

export const sweetnessOptions: Sweetness[] = ['0%', '25%', '50%', '75%', '100%', '125%'];
export const iceOptions: Ice[] = ['ไม่ใส่', 'น้อย', 'ปกติ', 'มาก'];

// Sample Employees
export const employees: Employee[] = [
  { id: 'emp1', name: 'สมชาย ใจดี', pin: '1234', role: 'admin', avatar: '/avatars/admin.png' },
  { id: 'emp2', name: 'สมหญิง รักดี', pin: '5678', role: 'staff', avatar: '/avatars/staff1.png' },
  { id: 'emp3', name: 'วิชัย มานะ', pin: '9012', role: 'staff', avatar: '/avatars/staff2.png' },
];



// Sample Members
export const sampleMembers: Member[] = [
  { id: 'm1', code: 'M001', name: 'นายสมศักดิ์ มงคลชัย', phone: '0812345678', email: 'somsak@email.com', points: 2450, totalSpent: 4500, joinDate: new Date('2024-01-15'), lastVisit: new Date('2025-01-28'), tier: 'gold' },
  { id: 'm2', code: 'M002', name: 'นางสาวพิมพ์ใจ รักดี', phone: '0898765432', email: 'pimjai@email.com', points: 850, totalSpent: 1200, joinDate: new Date('2024-03-20'), lastVisit: new Date('2025-01-25'), tier: 'silver' },
  { id: 'm3', code: 'M003', name: 'นายวิชัย ศรีสุข', phone: '0856789012', points: 150, totalSpent: 300, joinDate: new Date('2024-11-10'), lastVisit: new Date('2025-01-20'), tier: 'bronze' },
  { id: 'm4', code: 'M004', name: 'นางสาวน้ำฝน ใสสะอาด', phone: '0823456789', email: 'namfon@email.com', points: 5200, totalSpent: 12000, joinDate: new Date('2023-06-01'), lastVisit: new Date('2025-01-29'), tier: 'platinum' },
  { id: 'm5', code: 'M005', name: 'นายอนันต์ สุขสันต์', phone: '0834567890', points: 320, totalSpent: 600, joinDate: new Date('2024-08-15'), lastVisit: new Date('2025-01-15'), tier: 'bronze' },
];
