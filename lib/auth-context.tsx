"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  type Employee,
  type Shift,
  type Order,
  employees as sampleEmployees,
} from "./pos-types";

interface AuthContextType {
  employee: Employee | null;
  currentShift: Shift | null;
  orders: Order[];
  allOrders: Order[]; // All orders including historical
  login: (pin: string) => Promise<Employee | null>;
  logout: () => void;
  openShift: (startingCash: number) => Promise<void>;
  closeShift: (endingCash: number, note?: string) => Promise<void>;
  addOrder: (
    order: Omit<
      Order,
      | "id"
      | "employeeId"
      | "employeeName"
      | "shiftId"
      | "createdAt"
      | "orderNumber"
    >,
  ) => void;
  updateOrderStatus: (
    orderId: string,
    status: Order["status"],
    note?: string,
  ) => void;
  getShiftSummary: () => Promise<{
    totalSales: number;
    totalOrders: number;
    cashSales: number;
    qrSales: number;
  }>;
  getEmployeeOrders: (employeeId?: string) => Order[];
  canAccessAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [currentShiftId, setCurrentShiftId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [orderCounter, setOrderCounter] = useState(1);

  // Load employee and shift from localStorage on mount
  useEffect(() => {
    const storedEmployee = localStorage.getItem("employee");

    if (storedEmployee) {
      const emp = JSON.parse(storedEmployee);
      setEmployee(emp);

      // Fetch open shift for this employee from database
      fetch(`/api/shift?staffId=${emp.id}&status=OPEN`)
        .then((res) => res.json())
        .then((shifts) => {
          console.log("Fetched open shifts from API:", shifts); // Debug
          if (shifts && shifts.length > 0) {
            const shift = shifts[0]; // Get the first open shift
            const shiftData: Shift = {
              id: shift.id,
              employeeId: shift.staffId,
              employeeName: shift.staff.name,
              startTime: new Date(shift.openedAt),
              startingCash: shift.startingCash,
              totalSales: shift.totalSales || 0,
              totalOrders: 0,
              status: "open",
            };
            setCurrentShift(shiftData);
            setCurrentShiftId(shift.id);
            localStorage.setItem("currentShiftId", shift.id);
            console.log("Current shift restored:", shiftData); // Debug

            // Fetch today's orders from database
            const today = new Date().toISOString().split("T")[0];
            fetch(`/api/order?date=${today}`)
              .then((res) => res.json())
              .then((dbOrders) => {
                setAllOrders(dbOrders);
              })
              .catch((err) => console.error("Error loading orders:", err));
          } else {
            console.log("No open shift found for employee"); // Debug
            localStorage.removeItem("currentShiftId");
            setCurrentShiftId(null);
          }
        })
        .catch((err) => {
          console.error("Error loading shift:", err);
          localStorage.removeItem("currentShiftId");
          setCurrentShiftId(null);
        });
    }
  }, []);

  const login = useCallback(async (pin: string): Promise<Employee | null> => {
    try {
      console.log("Login attempt with PIN");
      // Fetch staff from API
      const response = await fetch("/api/staff");
      if (!response.ok) throw new Error("Failed to fetch staff");

      const staff = await response.json();
      const found = staff.find((s: any) => s.pin === pin && s.isActive);

      if (found) {
        const emp: Employee = {
          id: found.id,
          name: found.name,
          pin: found.pin,
          role:
            found.role === "ADMIN" || found.role === "MANAGER"
              ? "admin"
              : "staff",
        };

        console.log("Login successful, employee:", emp);

        // Set employee state and localStorage immediately before async operations
        setEmployee(emp);
        localStorage.setItem("employee", JSON.stringify(emp));

        console.log("Employee state and localStorage set");

        // Fetch open shift for this employee (async operations after state is set)
        try {
          const shiftsResponse = await fetch(
            `/api/shift?staffId=${emp.id}&status=OPEN`,
          );
          if (shiftsResponse.ok) {
            const shifts = await shiftsResponse.json();
            console.log("Fetched open shifts after login:", shifts);
            if (shifts && shifts.length > 0) {
              const shift = shifts[0];
              const shiftData: Shift = {
                id: shift.id,
                employeeId: shift.staffId,
                employeeName: shift.staff.name,
                startTime: new Date(shift.openedAt),
                startingCash: shift.startingCash,
                totalSales: shift.totalSales || 0,
                totalOrders: 0,
                status: "open",
              };
              setCurrentShift(shiftData);
              setCurrentShiftId(shift.id);
              localStorage.setItem("currentShiftId", shift.id);
              console.log("Current shift set after login:", shiftData);

              // Fetch today's orders from database
              const today = new Date().toISOString().split("T")[0];
              const ordersResponse = await fetch(`/api/order?date=${today}`);
              if (ordersResponse.ok) {
                const dbOrders = await ordersResponse.json();
                setAllOrders(dbOrders);
              }
            }
          }
        } catch (shiftError) {
          console.error("Error loading shift after login:", shiftError);
          // Don't fail login if shift loading fails
        }

        console.log("Returning employee from login:", emp);
        return emp;
      }
      console.log("No matching employee found");
      return null;
    } catch (error) {
      console.error("Login error:", error);
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    console.log("Logging out - clearing all state");
    setEmployee(null);
    setCurrentShift(null);
    setCurrentShiftId(null);
    setOrders([]);
    setAllOrders([]);
    localStorage.removeItem("employee");
    localStorage.removeItem("currentShiftId");
    console.log("Logout complete - all state cleared");
  }, []);

  const canAccessAdmin = useCallback(() => {
    const storedEmployee = localStorage.getItem("employee");
    if (storedEmployee) {
      const employee = JSON.parse(storedEmployee) as Employee;
      return employee.role === "admin";
    }
    return employee?.role === "admin";
  }, [employee]);

  const openShift = useCallback(
    async (startingCash: number) => {
      if (!employee) return;

      try {
        const response = await fetch("/api/shift", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            staffId: employee.id,
            startingCash: startingCash,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to open shift");
        }

        const dbShift = await response.json();
        console.log("Shift created:", dbShift); // Debug log

        const shift: Shift = {
          id: dbShift.id,
          employeeId: dbShift.staffId,
          employeeName: dbShift.staff.name,
          startTime: new Date(dbShift.openedAt),
          startingCash: dbShift.startingCash,
          totalSales: 0,
          totalOrders: 0,
          status: "open",
        };

        setCurrentShift(shift);
        setCurrentShiftId(dbShift.id);
        localStorage.setItem("currentShiftId", dbShift.id);
        console.log("Current shift set:", shift); // Debug log

        // Fetch today's orders from database
        try {
          const today = new Date().toISOString().split("T")[0];
          const ordersResponse = await fetch(`/api/order?date=${today}`);
          if (ordersResponse.ok) {
            const dbOrders = await ordersResponse.json();
            setOrders(dbOrders.filter((o: any) => o.createdBy === employee.id));
            setAllOrders(dbOrders);
          } else {
            setOrders([]);
          }
        } catch (orderError) {
          console.error("Error loading orders:", orderError);
          // Don't fail shift open if orders fail to load
          setOrders([]);
        }
      } catch (error) {
        console.error("Error opening shift:", error);
        throw error;
      }
    },
    [employee],
  );
  const getShiftSummary = useCallback(async () => {
    if (!currentShiftId) {
      return {
        totalSales: 0,
        totalOrders: 0,
        cashSales: 0,
        qrSales: 0,
      };
    }

    try {
      // Fetch orders for current shift from database
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(`/api/order?date=${today}`);

      if (!response.ok) throw new Error("Failed to fetch orders");

      const data = await response.json();
      const allOrders = Array.isArray(data) ? data : data.orders || [];

      console.log("All orders fetched:", allOrders.length);
      console.log("Current shift ID:", currentShiftId);
      console.log("Sample order:", allOrders[0]);

      // Filter orders by current shift
      const shiftOrders = allOrders.filter(
        (o: any) => o.shiftId === currentShiftId,
      );
      console.log("Orders for current shift:", shiftOrders.length);

      const completedOrders = shiftOrders.filter(
        (o: any) => o.status === "COMPLETED",
      );
      console.log("Completed orders:", completedOrders.length);

      const cashSales = completedOrders
        .filter((o: any) => o.paymentMethod === "CASH")
        .reduce((sum: number, o: any) => sum + o.totalPrice, 0);

      const qrSales = completedOrders
        .filter((o: any) => o.paymentMethod === "BANK_TRANSFER")
        .reduce((sum: number, o: any) => sum + o.totalPrice, 0);

      return {
        totalSales: cashSales + qrSales,
        totalOrders: completedOrders.length,
        cashSales,
        qrSales,
      };
    } catch (error) {
      console.error("Error fetching shift summary:", error);
      return {
        totalSales: 0,
        totalOrders: 0,
        cashSales: 0,
        qrSales: 0,
      };
    }
  }, [currentShiftId]);
  const closeShift = useCallback(
    async (endingCash: number, note?: string) => {
      if (!currentShift || !currentShiftId) return;

      try {
        const summary = await getShiftSummary();

        const response = await fetch(`/api/shift/${currentShiftId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endingCash: endingCash,
            cashSales: summary.cashSales,
            qrSales: summary.qrSales,
            note: note || null,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to close shift");
        }

        // Clear shift state immediately
        setCurrentShift(null);
        setCurrentShiftId(null);
        localStorage.removeItem("currentShiftId");
      } catch (error) {
        console.error("Error closing shift:", error);
        throw error;
      }
    },
    [currentShift, currentShiftId, getShiftSummary],
  );

  const addOrder = useCallback(
    (
      orderData: Omit<
        Order,
        | "id"
        | "employeeId"
        | "employeeName"
        | "shiftId"
        | "createdAt"
        | "orderNumber"
      >,
    ) => {
      if (!employee || !currentShift) return;

      const newOrder: Order = {
        ...orderData,
        id: `order-${Date.now()}`,
        employeeId: employee.id,
        employeeName: employee.name,
        shiftId: currentShift.id,
        createdAt: new Date(),
        orderNumber: orderCounter,
      };

      setOrders((prev) => [...prev, newOrder]);
      setAllOrders((prev) => [...prev, newOrder]);
      setOrderCounter((prev) => prev + 1);

      setCurrentShift((prev) =>
        prev
          ? {
              ...prev,
              totalSales: prev.totalSales + orderData.total,
              totalOrders: prev.totalOrders + 1,
            }
          : null,
      );
    },
    [employee, currentShift, orderCounter],
  );

  const updateOrderStatus = useCallback(
    (orderId: string, status: Order["status"], note?: string) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status, note: note || order.note }
            : order,
        ),
      );
      setAllOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status, note: note || order.note }
            : order,
        ),
      );
    },
    [],
  );

  const getEmployeeOrders = useCallback(
    (employeeId?: string) => {
      const id = employeeId || employee?.id;
      if (!id) return [];
      return allOrders.filter((o) => o.employeeId === id);
    },
    [allOrders, employee],
  );

  return (
    <AuthContext.Provider
      value={{
        employee,
        currentShift,
        orders,
        allOrders,
        login,
        logout,
        openShift,
        closeShift,
        addOrder,
        updateOrderStatus,
        getShiftSummary,
        getEmployeeOrders,
        canAccessAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
