import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { BranchId, Passenger } from "../types/passenger";
import { CashTransaction } from "../types/ledger";

export interface BranchMeta {
  id: BranchId;
  name: string;
  bengaliName: string;
  shortName: string;
  tagline: string;
  licenseNumber: string;
  isHeadOffice: boolean;
  themeColor: "blue" | "emerald";
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const BRANCH_METAS: Record<BranchId, BranchMeta> = {
  nextrip: {
    id: "nextrip",
    name: "NexTrip Travels & Tours",
    bengaliName: "নেক্সট্রিপ (NexTrip)",
    shortName: "নেক্সট্রিপ",
    tagline: "অপারেশন ও ট্রাভেল সার্ভিস শাখা",
    licenseNumber: "",
    isHeadOffice: false,
    themeColor: "blue",
    badgeBg: "bg-blue-50 dark:bg-blue-950/60",
    badgeText: "text-blue-700 dark:text-blue-300",
    badgeBorder: "border-blue-200 dark:border-blue-800",
  },
  diabari: {
    id: "diabari",
    name: "Diabari Technical Training Centre & Head Office",
    bengaliName: "দিয়াবাড়ী - হেড অফিস (Diabari)",
    shortName: "দিয়াবাড়ী হেড অফিস",
    tagline: "প্রধান কার্যালয় (RL2572), ক্লাইন্ট ও ট্রেনিং ম্যানেজমেন্ট",
    licenseNumber: "RL2572",
    isHeadOffice: true,
    themeColor: "emerald",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/60",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    badgeBorder: "border-emerald-200 dark:border-emerald-800",
  },
};

const STORAGE_KEY = "nextrip_active_branch";
const SELECTION_DONE_KEY = "nextrip_branch_has_selected";

interface BranchContextType {
  currentBranch: BranchId;
  setBranch: (branch: BranchId) => void;
  branchMeta: BranchMeta;
  isBranchModalOpen: boolean;
  openBranchModal: () => void;
  closeBranchModal: () => void;
  filterPassengers: (
    passengers: Passenger[],
    branchOverride?: BranchId | "all",
  ) => Passenger[];
  filterTransactions: (
    transactions: CashTransaction[],
    branchOverride?: BranchId | "all",
  ) => CashTransaction[];
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const [currentBranch, setCurrentBranchState] = useState<BranchId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "diabari" || saved === "nextrip") {
        return saved;
      }
    } catch (e) {
      // Ignore
    }
    return "nextrip";
  });

  const [isBranchModalOpen, setIsBranchModalOpen] = useState<boolean>(() => {
    try {
      const hasChosen = localStorage.getItem(SELECTION_DONE_KEY);
      // If user has never selected a branch, open the selection gateway modal!
      return !hasChosen;
    } catch {
      return false;
    }
  });

  const setBranch = (branch: BranchId) => {
    setCurrentBranchState(branch);
    try {
      localStorage.setItem(STORAGE_KEY, branch);
      localStorage.setItem(SELECTION_DONE_KEY, "true");
    } catch (e) {
      // Ignore
    }
  };

  const openBranchModal = () => setIsBranchModalOpen(true);
  const closeBranchModal = () => setIsBranchModalOpen(false);

  const branchMeta = useMemo(() => {
    return BRANCH_METAS[currentBranch] || BRANCH_METAS.nextrip;
  }, [currentBranch]);

  // Passenger filtering: Diabari sees only Diabari; NexTrip sees NexTrip or legacy records without branch
  const filterPassengers = (
    passengers: Passenger[],
    branchOverride?: BranchId | "all",
  ): Passenger[] => {
    const active = branchOverride !== undefined ? branchOverride : currentBranch;
    if (active === "all") return passengers;
    if (active === "diabari") {
      return passengers.filter((p) => p.branch === "diabari");
    }
    return passengers.filter((p) => !p.branch || p.branch === "nextrip");
  };

  // Transaction filtering: Diabari sees only Diabari; NexTrip sees NexTrip or legacy records
  const filterTransactions = (
    transactions: CashTransaction[],
    branchOverride?: BranchId | "all",
  ): CashTransaction[] => {
    const active = branchOverride !== undefined ? branchOverride : currentBranch;
    if (active === "all") return transactions;
    if (active === "diabari") {
      return transactions.filter((t) => t.branch === "diabari");
    }
    return transactions.filter((t) => !t.branch || t.branch === "nextrip");
  };

  return (
    <BranchContext.Provider
      value={{
        currentBranch,
        setBranch,
        branchMeta,
        isBranchModalOpen,
        openBranchModal,
        closeBranchModal,
        filterPassengers,
        filterTransactions,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch(): BranchContextType {
  const ctx = useContext(BranchContext);
  if (!ctx) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return ctx;
}
