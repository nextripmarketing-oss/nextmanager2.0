import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Passenger } from "../types/passenger";
import { CashTransaction } from "../types/ledger";

const LOGO_URL = "/src/assets/images/nextrip_logo_1779094935437.png";

function formatPDFDate(dateInput: any): string {
  if (!dateInput) return "N/A";

  // If it's a Firestore Timestamp (has toDate function)
  if (typeof dateInput.toDate === "function") {
    try {
      return dateInput.toDate().toLocaleDateString();
    } catch (e) {
      console.error("Error formatting Firestore Timestamp toDate():", e);
    }
  }

  // If it has seconds (like a plain Firestore Timestamp representation or parsed from localStorage JSON)
  if (typeof dateInput === "object" && dateInput.seconds !== undefined) {
    try {
      return new Date(dateInput.seconds * 1000).toLocaleDateString();
    } catch (e) {
      console.error("Error formatting Timestamp seconds:", e);
    }
  }

  // If it's a string or can be converted to date safely
  try {
    const parsed = new Date(dateInput);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString();
    }
  } catch (e) {
    console.error("Error parsing generic dateInput:", e);
  }

  return "N/A";
}

export const PDFService = {
  async generateLedgerReport(
    transactions: CashTransaction[],
    monthFilter: string,
    totalInflow: number,
    totalOutflow: number,
  ) {
    const doc = new jsPDF();

    // Add Logo
    try {
      const img = new Image();
      img.src = LOGO_URL;
      await new Promise((resolve) => (img.onload = resolve));
      doc.addImage(img, "PNG", 15, 10, 40, 15);
    } catch (e) {
      console.error("Logo could not be loaded for PDF", e);
    }

    // Header Info
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text("Monthly Cash Ledger Report", 15, 35);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 42);
    doc.text(`Selected Month: ${monthFilter || "All Time"}`, 15, 47);
    doc.text(`Total Transactions: ${transactions.length}`, 15, 52);

    // Summary Card Box style (total Inflow, total Outflow, Net)
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(15, 58, 180, 24, 3, 3, "F");

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("TOTAL INFLOW", 20, 66);
    doc.text("TOTAL OUTFLOW", 85, 66);
    doc.text("NET BALANCE", 150, 66);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129); // emerald-600
    doc.text(`BDT ${totalInflow.toLocaleString()}`, 20, 74);

    doc.setTextColor(244, 63, 94); // rose-600
    doc.text(`BDT ${totalOutflow.toLocaleString()}`, 85, 74);

    const netVal = totalInflow - totalOutflow;
    if (netVal >= 0) {
      doc.setTextColor(16, 185, 129); // emerald-600
    } else {
      doc.setTextColor(244, 63, 94); // rose-600
    }
    doc.text(`BDT ${netVal.toLocaleString()}`, 150, 74);
    doc.setFont("helvetica", "normal"); // Reset

    // Table
    const tableData = transactions.map((tx, index) => [
      index + 1,
      tx.date,
      tx.type,
      `BDT ${tx.amount.toLocaleString()}`,
      tx.purpose || "N/A",
      tx.remarks || "N/A",
      (tx.createdByEmail || "").split("@")[0] || "N/A",
    ]);

    autoTable(doc, {
      startY: 90,
      head: [
        [
          "SL",
          "Date",
          "Type",
          "Amount",
          "Category / Purpose",
          "Remarks",
          "User",
        ],
      ],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [37, 99, 235], // blue-600
        textColor: 255,
        fontStyle: "bold",
      },
      didParseCell: (data) => {
        // Style Type column
        if (data.section === "body" && data.column.index === 2) {
          const val = data.cell.raw;
          if (val === "Inflow") {
            data.cell.styles.textColor = [16, 185, 129]; // green
            data.cell.styles.fontStyle = "bold";
          } else if (val === "Outflow") {
            data.cell.styles.textColor = [244, 63, 94]; // red
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
      margin: { top: 15 },
      styles: { fontSize: 8, cellPadding: 2.5 },
    });

    const fileMonthName = monthFilter ? monthFilter.replace("-", "_") : "All";
    doc.save(`NexTrip_Ledger_${fileMonthName}_${new Date().getTime()}.pdf`);
  },

  async generatePassengerList(passengers: Passenger[]) {
    const doc = new jsPDF();

    // Add Logo
    try {
      const img = new Image();
      img.src = LOGO_URL;
      await new Promise((resolve) => (img.onload = resolve));
      doc.addImage(img, "PNG", 15, 10, 40, 15);
    } catch (e) {
      console.error("Logo could not be loaded for PDF", e);
    }

    // Header Info
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text("Passenger Report", 15, 35);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 42);
    doc.text(`Total Records: ${passengers.length}`, 15, 47);

    // Table
    const tableData = passengers.map((p, index) => [
      p.sl?.toString().padStart(3, "0") || index + 1,
      p.name,
      p.passportNumber || "N/A",
      p.phone || "N/A",
      p.country || "N/A",
      p.companyName || "N/A",
      p.tradeName || "General",
      p.status || "N/A",
      formatPDFDate(p.createdAt),
    ]);

    autoTable(doc, {
      startY: 55,
      head: [
        [
          "SL",
          "Name",
          "Passport",
          "Phone",
          "Country",
          "Company",
          "Trade",
          "Status",
          "Date",
        ],
      ],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
      }, // blue-600
      alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
      margin: { top: 15 },
      styles: { fontSize: 7, cellPadding: 2 },
    });

    doc.save(`NexTrip_Passengers_${new Date().getTime()}.pdf`);
  },

  async generateSingleProfile(p: Passenger) {
    const doc = new jsPDF();

    // Add Logo
    try {
      const img = new Image();
      img.src = LOGO_URL;
      await new Promise((resolve) => (img.onload = resolve));
      doc.addImage(img, "PNG", 15, 10, 40, 15);
    } catch (e) {
      console.error("Logo could not be loaded for PDF", e);
    }

    // Header
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // blue-600
    doc.text("PASSENGER PROFILE", 15, 40);

    // Horizontal Line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(15, 45, 195, 45);

    // Profile Details
    const details = [
      ["Serial No.", p.sl?.toString().padStart(3, "0") || "N/A"],
      ["Full Name", p.name],
      ["Passport No", p.passportNumber || "N/A"],
      ["Company Name", p.companyName || "N/A"],
      ["Phone Number", p.phone || "N/A"],
      ["Destination", p.country || "N/A"],
      ["Movement", p.inOut || "N/A"],
      ["Trade Name", p.tradeName || "General"],
      ["Current Status", p.status || "N/A"],
      ["Assigned Agent", p.agentName || "N/A"],
      ["Registration Date", formatPDFDate(p.createdAt)],
      ["Submission Date", p.submissionDate || "N/A"],
    ];

    autoTable(doc, {
      startY: 55,
      body: details,
      theme: "plain",
      styles: { fontSize: 11, cellPadding: 5 },
      columnStyles: {
        0: { fontStyle: "bold", textColor: [100, 116, 139], cellWidth: 50 }, // label
        1: { textColor: [30, 41, 59] }, // value
      },
    });

    // Documents Section
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    const currentY = finalY + 20;

    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text("Status History & Documents", 15, currentY);

    doc.setDrawColor(37, 99, 235);
    doc.line(15, currentY + 2, 80, currentY + 2);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `This profile was generated from NexTrip Secure Agency Portal.`,
      15,
      currentY + 15,
    );
    doc.text(`Passenger ID: ${p.id}`, 15, currentY + 20);

    doc.save(`Profile_${p.name.replace(/\s+/g, "_")}.pdf`);
  },
};
