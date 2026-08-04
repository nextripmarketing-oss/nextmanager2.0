import Papa from "papaparse";
import { Passenger, PassengerStatus } from "../types/passenger";
import { PassengerService } from "./passengerService";

export const CSVService = {
  parseCSV(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error),
      });
    });
  },

  mapToPassenger(
    row: any,
    uid: string,
    displayName: string,
  ): Omit<Passenger, "id" | "createdAt" | "updatedAt"> {
    // Basic normalization: lowercase keys and remove spaces/special chars
    const data: any = {};
    Object.keys(row).forEach((key) => {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      data[normalizedKey] = row[key];
    });

    // Normalize inOut
    let inOutValue = data.inout || "Out";
    if (inOutValue.toUpperCase() === "IN") inOutValue = "In";
    if (inOutValue.toUpperCase() === "OUT") inOutValue = "Out";

    // Normalize status to match exact case if possible
    let statusValue = (data.status || "Others").trim();
    // Simple case normalization for common statuses
    const statusMap: { [key: string]: PassengerStatus } = {
      "PASSPORT SUBMIT": "Passport Submit",
      "MEDICAL DONE": "Medical Done",
      "WORKPERMIT ISSUE": "Workpermit Issue",
      "WORK PERMIT ISSUED": "Workpermit Issue",
      "WORKPERMIT ISSUED": "Workpermit Issue",
      "WORK PERMIT ISSUED ": "Workpermit Issue",
      "WORK PERMIT": "Workpermit Issue",
      "VISA ONLINE": "Visa Online",
      "EMBASSY SUBMIT": "Embassy Submit",
      "VISA REJECT": "Visa Reject",
      "PASSPORT RETURN": "Passport Return",
      "PASSPORT RETURN ": "Passport Return",
      "MANPOWER DONE": "Manpower Done",
      "MAN POWER DONE": "Manpower Done",
      "FLIGHT DONE": "Flight Done",
      "PROCESSING CANCELLED": "Processing Cancelled",
      "PROCCESSING CANCELLED": "Processing Cancelled",
    };

    const allowedStatuses: PassengerStatus[] = [
      "Passport Submit",
      "Medical Done",
      "Workpermit Issue",
      "Visa Online",
      "Embassy Submit",
      "Visa Reject",
      "Passport Return",
      "Manpower Done",
      "Flight Done",
      "Processing Cancelled",
      "Others",
    ];

    let mappedStatus =
      statusMap[statusValue.toUpperCase().trim()] ||
      (statusValue as PassengerStatus);
    if (!allowedStatuses.includes(mappedStatus)) {
      mappedStatus = "Others";
    }

    // Mapping logic
    return {
      sl: parseInt(data.sl || data.serial) || undefined,
      name: (data.name || data.fullname || data.passengername || "").trim(),
      passportNumber: (data.passport || data.passportnumber || "").trim(),
      inOut: inOutValue,
      phone:
        (data.phone || data.phonenumber || data.mobile || "").trim() || "N/A", // Set N/A if empty to pass rules if needed, though I will update rules
      tradeName: (data.trade || data.tradename || "").trim(),
      agentName: (data.agent || data.agentname || "").trim(),
      agentNumber: (data.agentphone || data.agentnumber || "").trim(),
      reference: (data.reference || data.ref || "").trim(),
      date:
        data.date || data.registrationdate || new Date().toLocaleDateString(),
      submissionDate: data.submissiondate || data.passportsubmit || undefined,
      status: mappedStatus,
      country: (data.country || data.destination || "Unknown").trim(),
      documents: [],
      history: [
        {
          status: mappedStatus,
          updatedBy: displayName,
          updatedByUid: uid,
          timestamp: new Date().toISOString(),
        },
      ],
      createdBy: uid,
    };
  },

  async importPassengers(
    file: File,
    uid: string,
    displayName: string,
    onProgress?: (current: number, total: number) => void,
  ): Promise<{ success: number; total: number }> {
    const rows = await this.parseCSV(file);
    const passengersToImport = rows
      .map((row) => this.mapToPassenger(row, uid, displayName))
      .filter((p) => p.name);

    const CHUNK_SIZE = 500;
    for (let i = 0; i < passengersToImport.length; i += CHUNK_SIZE) {
      const chunk = passengersToImport.slice(i, i + CHUNK_SIZE);
      await PassengerService.bulkAddPassengers(chunk);
      if (onProgress) {
        onProgress(
          Math.min(i + CHUNK_SIZE, passengersToImport.length),
          passengersToImport.length,
        );
      }
    }

    return { success: passengersToImport.length, total: rows.length };
  },

  parseCSVString(csvString: string): any[] {
    const results = Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
    });
    return results.data;
  },

  async importPastedPassengers(
    csvString: string,
    uid: string,
    displayName: string,
    onProgress?: (current: number, total: number) => void,
  ): Promise<{ success: number; total: number }> {
    const rows = this.parseCSVString(csvString);
    const passengersToImport = rows
      .map((row) => this.mapToPassenger(row, uid, displayName))
      .filter((p) => p.name);

    const CHUNK_SIZE = 100;
    for (let i = 0; i < passengersToImport.length; i += CHUNK_SIZE) {
      const chunk = passengersToImport.slice(i, i + CHUNK_SIZE);
      await PassengerService.bulkAddPassengers(chunk);
      if (onProgress) {
        onProgress(
          Math.min(i + CHUNK_SIZE, passengersToImport.length),
          passengersToImport.length,
        );
      }
    }

    return { success: passengersToImport.length, total: rows.length };
  },
};
