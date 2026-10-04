import Papa from "papaparse";
import { Passenger } from "../types/passenger";
import { PassengerService } from "./passengerService";

export const BackupService = {
  /**
   * Triggers a browser download of a JSON database backup.
   * This preserves all fields, timestamps, documents, and historical logs.
   */
  exportToJSON(passengers: Passenger[]): void {
    try {
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(passengers, null, 2));
      const downloadAnchor = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute(
        "download",
        `nextrip_db_backup_${dateStr}.json`,
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (error) {
      console.error("Failed to export JSON backup", error);
      throw new Error("Unable to generate JSON backup file.");
    }
  },

  /**
   * Triggers a browser download of a CSV database file, formatted for Excel/Google Sheets.
   */
  exportToCSV(passengers: Passenger[]): void {
    try {
      // Map passengers to flat rows for CSV representation
      const flatRows = passengers.map((p) => ({
        "Serial No": p.sl || "",
        "Passenger Name": p.name || "",
        "Passport Number": p.passportNumber || "",
        "In/Out Status": p.inOut || "",
        "Status (Current)": p.status || "",
        "Trade Name": p.tradeName || "",
        "Country/Destination": p.country || "",
        "Branch/Office": p.branch || "nextrip",
        "Passenger Type": p.passengerType || "",
        "Phone Number": p.phone || "",
        "Agent Name": p.agentName || "",
        "Agent Phone": p.agentNumber || "",
        Reference: p.reference || "",
        "Registration Date": p.date || "",
        "Passport Submission Date": p.submissionDate || "",
        "Created By (UID)": p.createdBy || "",
        "Created At": p.createdAt || "",
        "Updated At": p.updatedAt || "",
        "History Log Count": p.history?.length || 0,
        "Attached Documents Count": p.documents?.length || 0,
      }));

      const csvContent = Papa.unparse(flatRows);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];

      downloadAnchor.setAttribute("href", url);
      downloadAnchor.setAttribute(
        "download",
        `nextrip_excel_export_${dateStr}.csv`,
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export CSV file", error);
      throw new Error("Unable to generate CSV file.");
    }
  },

  /**
   * Resolves with parsed and validated Passenger structures from a .json file.
   */
  async readAndValidateJSONBackup(
    file: File,
    currentUserUid?: string,
    isAdmin: boolean = false,
  ): Promise<Omit<Passenger, "id">[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);

          if (!Array.isArray(parsed)) {
            throw new Error(
              "Invalid backup format. Backup file must contain a list of records.",
            );
          }

          // Validate mandatory fields and map to safe insertion objects
          const validated: Omit<Passenger, "id">[] = parsed.map(
            (item: any, idx: number) => {
              if (!item.name) {
                throw new Error(
                  `Record at position ${idx + 1} is missing the passenger 'name' attribute.`,
                );
              }

              const resolvedCreator =
                isAdmin || item.createdBy === currentUserUid
                  ? item.createdBy || currentUserUid || "Unknown Admin"
                  : currentUserUid || "Unknown Admin";

              // Re-normalize dates or preserve existing back-up dates
              const record: any = {
                name: String(item.name).trim(),
                inOut: item.inOut || "Out",
                phone: item.phone ? String(item.phone).trim() : "N/A",
                tradeName: item.tradeName ? String(item.tradeName).trim() : "",
                agentName: item.agentName ? String(item.agentName).trim() : "",
                agentNumber: item.agentNumber
                  ? String(item.agentNumber).trim()
                  : "",
                reference: item.reference ? String(item.reference).trim() : "",
                date: item.date || new Date().toLocaleDateString(),
                status: item.status || "Others",
                country: item.country ? String(item.country).trim() : "Unknown",
                branch: item.branch === "diabari" ? "diabari" : "nextrip",
                documents: Array.isArray(item.documents) ? item.documents : [],
                history: Array.isArray(item.history) ? item.history : [],
                createdBy: resolvedCreator,
                createdAt: item.createdAt || new Date().toISOString(),
                updatedAt: item.updatedAt || new Date().toISOString(),
              };

              if (item.sl !== undefined && item.sl !== null && item.sl !== "") {
                record.sl = Number(item.sl);
              }
              if (item.passportNumber) {
                record.passportNumber = String(item.passportNumber).trim();
              }
              if (item.companyName) {
                record.companyName = String(item.companyName).trim();
              }
              if (item.submissionDate) {
                record.submissionDate = String(item.submissionDate).trim();
              }
              if (item.passengerType) {
                record.passengerType = item.passengerType;
              }

              return record;
            },
          );

          resolve(validated);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error("Unable to read backup file correctly."));
      };

      reader.readAsText(file);
    });
  },

  /**
   * Iterates and uploads records in clean sizes to Firebase
   */
  async restoreBackup(
    passengers: Omit<Passenger, "id">[],
    onProgress?: (current: number, total: number) => void,
  ): Promise<{ successCount: number }> {
    const CHUNK_SIZE = 100; // Small safe batch size for Firestore
    const total = passengers.length;

    for (let i = 0; i < total; i += CHUNK_SIZE) {
      const chunk = passengers.slice(i, i + CHUNK_SIZE);
      await PassengerService.bulkAddPassengers(chunk);
      if (onProgress) {
        onProgress(Math.min(i + CHUNK_SIZE, total), total);
      }
    }

    return { successCount: total };
  },
};
