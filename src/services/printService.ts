import { Passenger } from "../types/passenger";
import { CashTransaction } from "../types/ledger";
import { TrainingEnrollment } from "../types/training";
import { renderToString } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";
import React from "react";

const LOGO_BASE64 = ""; // Fallback placeholder if image fails

function formatPrintDate(dateInput: any): string {
  if (!dateInput) return "N/A";
  if (typeof dateInput.toDate === "function") {
    try {
      return dateInput.toDate().toLocaleDateString("en-US");
    } catch (e) {
      console.error(e);
    }
  }
  if (typeof dateInput === "object" && dateInput.seconds !== undefined) {
    try {
      return new Date(dateInput.seconds * 1000).toLocaleDateString("en-US");
    } catch (e) {
      console.error(e);
    }
  }
  try {
    const parsed = new Date(dateInput);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-US");
    }
  } catch (e) {
    console.error(e);
  }
  return "N/A";
}

export const PrintService = {
  printLedgerReport(
    transactions: CashTransaction[],
    monthFilter: string,
    totalInflow: number,
    totalOutflow: number,
    filterType: string = "All",
    searchQuery: string = "",
    startDate: string = "",
    endDate: string = "",
  ) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Pop-up blocked! Please allow pop-ups to print reports.");
      return;
    }

    // Dynamically calculate actual totals based strictly on the visible/filtered transactions list.
    // This solves the mismatch when the user filters the view by search text, transaction type, etc.
    let actualInflow = 0;
    let actualOutflow = 0;
    transactions.forEach((tx) => {
      if (tx.type === "Inflow") {
        actualInflow += tx.amount;
      } else {
        actualOutflow += tx.amount;
      }
    });

    const displayInflow = actualInflow;
    const displayOutflow = actualOutflow;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Monthly Cash Ledger Report - NexTrip</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Inter', 'Noto Sans Bengali', sans-serif;
            color: #1e293b;
            background: #ffffff;
            padding: 40px;
            line-height: 1.4;
          }
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 20px;
          }
          .logo-area img {
            height: 55px;
            object-fit: contain;
          }
          .title-area {
            text-align: right;
          }
          .title-area h1 {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 4px;
            letter-spacing: -0.02em;
          }
          .title-area p {
            font-size: 11px;
            color: #64748b;
            font-weight: 500;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 25px;
            font-size: 12px;
          }
          .meta-item {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 12px 16px;
            border-radius: 8px;
          }
          .meta-item span {
            display: block;
            font-size: 10px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 700;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
          }
          .meta-item strong {
            font-size: 13px;
            color: #334155;
            font-weight: 600;
          }
          .summary-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .card {
            border-radius: 12px;
            padding: 16px 20px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 2px 0 rgba(0,0,0,0.02);
          }
          .card-inflow {
            background-color: #f0fdf4;
            border-color: #bbf7d0;
            color: #166534;
          }
          .card-outflow {
            background-color: #fff1f2;
            border-color: #fecdd3;
            color: #9f1239;
          }
          .card-balance {
            background-color: #f0f9ff;
            border-color: #bae6fd;
            color: #075985;
          }
          .card-title {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            margin-bottom: 6px;
          }
          .card-value {
            font-size: 18px;
            font-weight: 800;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-top: 15px;
          }
          th {
            background-color: #2563eb;
            color: #ffffff;
            font-weight: 700;
            text-align: left;
            padding: 10px 12px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.02em;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
            vertical-align: middle;
            font-weight: 500;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            padding: 3px 8px;
            border-radius: 9999px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .badge-inflow {
            background-color: #dcfce7;
            color: #166534;
          }
          .badge-outflow {
            background-color: #ffe4e6;
            color: #9f1239;
          }
          .text-amount {
            font-weight: 700;
            font-size: 12px;
          }
          .text-green {
            color: #16a34a;
          }
          .text-red {
            color: #dc2626;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
            padding-top: 15px;
          }
          @media print {
            body {
              padding: 0;
            }
            tr {
              page-break-inside: avoid;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="logo-area">
            <img src="/src/assets/images/nextrip_logo_1779094935437.png" alt="NexTrip Logo" onerror="this.style.display='none'">
          </div>
          <div class="title-area">
            <h1>Monthly Cash Ledger Report</h1>
            <p>মাসিক ক্যাশ লেজার হিসাব খাতা রিপোর্ট</p>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <span>Report Title (রিপোর্ট নাম)</span>
            <strong>Office Cash Flow Report</strong>
          </div>
          <div class="meta-item">
            <span>Selected Month (নির্বাচিত মাস)</span>
            <strong>${monthFilter === "All" ? "All Time (সব সময়)" : monthFilter}</strong>
          </div>
          <div class="meta-item">
            <span>Active Filters & Items (সক্রিয় ফিল্টার)</span>
            <strong>
              ${transactions.length} items 
              ${filterType !== "All" ? `• Type: ${filterType === "Inflow" ? "Inflows Only" : "Outflows Only"}` : ""}
              ${searchQuery ? `• Search: "${searchQuery}"` : ""}
              ${startDate || endDate ? `• Period: ${startDate || "Any"} to ${endDate || "Any"}` : ""}
            </strong>
          </div>
        </div>

        <div class="summary-cards">
          <div class="card card-inflow">
            <div class="card-title">TOTAL FILTERED INFLOW (মোট জমা)</div>
            <div class="card-value">৳${displayInflow.toLocaleString("en-IN")}</div>
          </div>
          <div class="card card-outflow">
            <div class="card-title">TOTAL FILTERED OUTFLOW (মোট খরচ)</div>
            <div class="card-value">৳${displayOutflow.toLocaleString("en-IN")}</div>
          </div>
          <div class="card card-balance">
            <div class="card-title">FILTERED BALANCE (চলতি ব্যালেন্স)</div>
            <div class="card-value">৳${(displayInflow - displayOutflow).toLocaleString("en-IN")}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%">SL</th>
              <th style="width: 12%">Date (তারিখ)</th>
              <th style="width: 10%">Type (ধরণ)</th>
              <th style="width: 15%; text-align: right;">Amount (পরিমাণ)</th>
              <th style="width: 25%">Category / Purpose (উদ্দেশ্য/খাত)</th>
              <th style="width: 23%">Remarks (মন্তব্য)</th>
              <th style="width: 10%">User</th>
            </tr>
          </thead>
          <tbody>
            ${transactions
              .map((tx, index) => {
                const typeBadge =
                  tx.type === "Inflow"
                    ? '<span class="badge badge-inflow">জমা (Inflow)</span>'
                    : '<span class="badge badge-outflow">খরচ (Outflow)</span>';

                const amountClass =
                  tx.type === "Inflow" ? "text-green" : "text-red";
                const prefix = tx.type === "Inflow" ? "+" : "-";

                return `
                <tr>
                  <td>${index + 1}</td>
                  <td style="font-family: monospace; font-size: 11px;">${tx.date}</td>
                  <td>${typeBadge}</td>
                  <td class="text-amount ${amountClass}" style="text-align: right;">${prefix}৳${tx.amount.toLocaleString("en-IN")}</td>
                  <td style="font-weight: 600;">${tx.purpose || "N/A"}</td>
                  <td style="color: #475569; font-size: 10px;">${tx.remarks || "-"}</td>
                  <td style="font-weight: 600; color: #64748b;">${(tx.createdByEmail || "").split("@")[0] || "N/A"}</td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <p>This report was generated securely from NexTrip Enterprise Portal on ${new Date().toLocaleString("en-US")}.</p>
          <p style="margin-top: 5px; font-weight: bold; color: #64748b;">NexTrip Tours & Travels - All Rights Reserved © ${new Date().getFullYear()}</p>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  },

  printPassengerList(
    passengers: Passenger[],
    startDate: string = "",
    endDate: string = "",
  ) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Pop-up blocked! Please allow pop-ups to print reports.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Passenger Report - NexTrip</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Inter', 'Noto Sans Bengali', sans-serif;
            color: #1e293b;
            background: #ffffff;
            padding: 40px;
            line-height: 1.4;
          }
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 20px;
          }
          .logo-area img {
            height: 55px;
            object-fit: contain;
          }
          .title-area {
            text-align: right;
          }
          .title-area h1 {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 4px;
            letter-spacing: -0.02em;
          }
          .title-area p {
            font-size: 11px;
            color: #64748b;
          }
          .meta-info {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 25px;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            font-weight: 500;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          th {
            background-color: #2563eb;
            color: #ffffff;
            font-weight: 700;
            text-align: left;
            padding: 10px 8px;
            font-size: 10px;
            text-transform: uppercase;
          }
          td {
            padding: 8px;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
            font-weight: 500;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .status-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            text-align: center;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
            padding-top: 15px;
          }
          @media print {
            body { padding: 0; }
            tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="logo-area">
            <img src="/src/assets/images/nextrip_logo_1779094935437.png" alt="NexTrip Logo" onerror="this.style.display='none'">
          </div>
          <div class="title-area">
            <h1>Passenger Report</h1>
            <p>যাত্রীদের তালিকা রিপোর্ট</p>
          </div>
        </div>

        <div class="meta-info">
          <div>Generated on: <strong>${new Date().toLocaleString("en-US")}</strong></div>
          ${startDate || endDate ? `<div>Date Range: <strong>${startDate || "Any"} to ${endDate || "Any"}</strong></div>` : ""}
          <div>Total Records: <strong>${passengers.length} passengers</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 4%">SL</th>
              <th style="width: 18%">Name</th>
              <th style="width: 12%">Passport</th>
              <th style="width: 11%">Phone</th>
              <th style="width: 11%">Country</th>
              <th style="width: 15%">Company</th>
              <th style="width: 10%">Trade</th>
              <th style="width: 9%">Status</th>
              <th style="width: 10%">Date</th>
            </tr>
          </thead>
          <tbody>
            ${passengers
              .map((p, index) => {
                return `
                <tr>
                  <td>${p.sl?.toString().padStart(3, "0") || index + 1}</td>
                  <td style="font-weight:700;">${p.name}</td>
                  <td style="font-family: monospace; font-weight: 600;">${p.passportNumber || "N/A"}</td>
                  <td style="font-size: 10px;">${p.phone || "N/A"}</td>
                  <td style="font-weight: 600;">${p.country || "N/A"}</td>
                  <td style="font-size: 10px; color: #475569;">${p.companyName || "N/A"}</td>
                  <td>${p.tradeName || "General"}</td>
                  <td>
                    <span class="status-badge" style="background: #e2e8f0; color: #1e293b;">
                      ${p.status || "N/A"}
                    </span>
                  </td>
                  <td style="font-size: 10px; font-family: monospace;">${formatPrintDate(p.createdAt)}</td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <p>Generated securely from NexTrip Portal on ${new Date().toLocaleString("en-US")}.</p>
          <p style="margin-top: 5px; font-weight: bold; color: #64748b;">NexTrip Tours & Travels - All Rights Reserved © ${new Date().getFullYear()}</p>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  },

  printSingleProfile(p: Passenger) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Pop-up blocked! Please allow pop-ups to print reports.");
      return;
    }

    const qrData = `Name: ${p.name}\nPassport: ${p.passportNumber || "N/A"}\nStatus: ${p.status}\nDestination: ${p.country}\nID: ${p.id}`;
    const qrSvgString = renderToString(
      React.createElement(QRCodeSVG, {
        value: qrData,
        size: 90,
        level: "L",
        includeMargin: false,
      }),
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Passenger Profile - ${p.name}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Inter', 'Noto Sans Bengali', sans-serif;
            color: #1e293b;
            background: #ffffff;
            padding: 50px;
            line-height: 1.5;
          }
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
          }
          .logo-area img {
            height: 60px;
            object-fit: contain;
          }
          .qr-box {
            width: 100px;
            height: 100px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 4px;
            background: #ffffff;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .qr-box svg {
            width: 100%;
            height: 100%;
          }
          .passenger-photo-box {
            width: 100px;
            height: 100px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #f8fafc;
          }
          .passenger-photo-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .title-area {
            text-align: right;
          }
          .title-area h1 {
            font-size: 24px;
            font-weight: 800;
            color: #2563eb;
            letter-spacing: -0.02em;
          }
          .title-area p {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.05em;
          }
          .profile-container {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
            margin-top: 30px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
          }
          .profile-row {
            display: flex;
            border-bottom: 1px solid #f1f5f9;
          }
          .profile-row:last-child {
            border-bottom: none;
          }
          .profile-label {
            width: 250px;
            background: #f8fafc;
            padding: 12px 20px;
            font-weight: 700;
            color: #64748b;
            font-size: 11px;
            text-transform: uppercase;
            border-right: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
          }
          .profile-value {
            padding: 12px 20px;
            color: #0f172a;
            font-size: 13px;
            font-weight: 600;
            flex-grow: 1;
          }
          .signature-section {
            margin-top: 80px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding: 0 15px;
          }
          .signature-box {
            width: 40%;
            text-align: center;
          }
          .signature-line {
            border-top: 1.5px dashed #94a3b8;
            margin-bottom: 8px;
          }
          .signature-title-bn {
            font-size: 13px;
            font-weight: 700;
            color: #1e293b;
          }
          .signature-title-en {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 500;
            letter-spacing: 0.05em;
          }
          .custom-note-box {
            margin-top: 25px;
            background: #fef08a1c;
            border: 1px dashed #eab308;
            padding: 18px 20px;
            border-radius: 12px;
            font-size: 13px;
            color: #1e293b;
            line-height: 1.6;
          }
          .custom-note-header {
            font-size: 11px;
            font-weight: 800;
            color: #854d0e;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 6px;
          }
          @media print {
            body { padding: 0; }
            .profile-container { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="logo-area">
            <img src="/src/assets/images/nextrip_logo_1779094935437.png" alt="NexTrip Logo" onerror="this.style.display='none'">
          </div>
          <div style="display: flex; align-items: center; gap: 20px;">
            <div class="title-area">
              <h1>PASSENGER PROFILE</h1>
              <p>যাত্রী প্রোফাইল ও বিবরণ</p>
            </div>
            <div class="qr-box">
              ${qrSvgString}
            </div>
            ${
              p.photoUrl
                ? `
            <div class="passenger-photo-box">
              <img src="${p.photoUrl}" alt="${p.name}">
            </div>
            `
                : `
            <div class="passenger-photo-box" style="border-style: dashed; border-color: #cbd5e1;">
              <span style="font-size: 9px; font-weight: 750; text-align: center; color: #94a3b8; font-family: sans-serif; line-height: 1.2;">NO PHOTO<br>সংযুক্ত নয়</span>
            </div>
            `
            }
          </div>
        </div>

        <div class="profile-container">
          <div class="profile-row">
            <div class="profile-label">Serial Number (সিরিয়াল নম্বর)</div>
            <div class="profile-value" style="font-family: monospace; font-size: 14px;">${p.sl?.toString().padStart(3, "0") || "N/A"}</div>
          </div>
          <div class="profile-row">
            <div class="profile-label">Full Name (যাত্রীর নাম)</div>
            <div class="profile-value" style="font-size: 16px; color: #2563eb;">${p.name}</div>
          </div>
          <div class="profile-row">
            <div class="profile-label">Passport Number (পাসপোর্ট নম্বর)</div>
            <div class="profile-value" style="font-family: monospace; font-size: 14px;">${p.passportNumber || "N/A"}</div>
          </div>
          <div class="profile-row">
            <div class="profile-label">Phone Number (মোবাইল নম্বর)</div>
            <div class="profile-value">${p.phone || "N/A"}</div>
          </div>
          <div class="profile-row">
            <div class="profile-label">Company Name (কোম্পানির নাম)</div>
            <div class="profile-value">${p.companyName || "N/A"}</div>
          </div>
          <div class="profile-row">
            <div class="profile-label">Country Destination (গন্তব্য দেশ)</div>
            <div class="profile-value" style="color: #16a34a;">${p.country || "N/A"}</div>
          </div>
          <div class="profile-row">
            <div class="profile-label">Movement Type (ধরণ)</div>
            <div class="profile-value">${p.inOut || "N/A"}</div>
          </div>
          <div class="profile-row">
            <div class="profile-label">Trade / Profession (কাজ)</div>
            <div class="profile-value">${p.tradeName || "General"}</div>
          </div>
          <div class="profile-row">
            <div class="profile-label">Current Status (চলতি অবস্থা)</div>
            <div class="profile-value">
              <span style="background: #eff6ff; color: #1e40af; padding: 4px 10px; border-radius: 6px; font-size: 11px; text-transform: uppercase;">
                ${p.status || "N/A"}
              </span>
            </div>
          </div>
          <div class="profile-row">
            <div class="profile-label">Assigned Agent (এজেন্ট / রেফারেন্স)</div>
            <div class="profile-value">${p.agentName || "N/A"}</div>
          </div>
          <div class="profile-row">
            <div class="profile-label">Registration Date (নিবন্ধন তারিখ)</div>
            <div class="profile-value" style="font-family: monospace;">${formatPrintDate(p.createdAt)}</div>
          </div>
          <div class="profile-row">
            <div class="profile-label">Submission Date (জমাদানের তারিখ)</div>
            <div class="profile-value">${p.submissionDate || "N/A"}</div>
          </div>
        </div>

        ${
          p.systemNote
            ? `
        <div class="custom-note-box">
          <div class="custom-note-header">কোম্পানি / যাত্রী বিশেষ মন্তব্য (Passenger Specific Memo)</div>
          <p style="white-space: pre-wrap; font-weight: 500; font-size: 13px; color: #1e293b; margin: 0;">${p.systemNote}</p>
        </div>
        `
            : ""
        }

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-title-bn">যাত্রীর স্বাক্ষর</div>
            <div class="signature-title-en">Passenger Signature</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-title-bn">ব্যবস্থাপকের স্বাক্ষর</div>
            <div class="signature-title-en">Manager Signature</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  },

  printPassengerCV(p: Passenger) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Pop-up blocked! Please allow pop-ups to print reports.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Curriculum Vitae - ${p.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            background: #fff;
            padding: 40px;
            max-width: 900px;
            margin: 0 auto;
            line-height: 1.5;
          }
          @media print {
            body { padding: 0; background: #fff; }
            .no-print { display: none !important; }
            @page { margin: 15mm; size: A4; }
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            font-size: 28px;
            font-weight: 800;
            color: #1e3a8a;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .header h2 {
            font-size: 16px;
            color: #64748b;
            margin: 5px 0 0 0;
            font-weight: 600;
            letter-spacing: 1px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            background: #eff6ff;
            color: #1d4ed8;
            padding: 8px 12px;
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-left: 4px solid #2563eb;
            margin-bottom: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          td {
            padding: 8px 12px;
            border: none;
          }
          .cv-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
          }
          .cv-table td, .cv-table th {
            border: 1px dotted #000;
            padding: 4px;
            vertical-align: top;
            font-size: 11px;
            color: #000;
          }
          .gray-bg {
            background-color: #e2e8f0;
            font-weight: bold;
            text-align: center;
          }
          .label {
            width: 40%;
          }
          .value {
            font-weight: normal;
          }
          .layout-table {
            width: 100%;
            border-collapse: collapse;
          }
          .layout-table > tbody > tr > td {
            padding: 0;
            vertical-align: top;
            border: none;
          }
          .col-left {
            width: 50%;
            padding-right: 5px;
          }
          .col-right {
            width: 50%;
            padding-left: 5px;
          }
          .text-center {
            text-align: center;
          }
          .font-bold {
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: center;">
          <button onclick="window.print()" style="background: #2563eb; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">Print CV</button>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
          <div style="width: 120px; flex-shrink: 0;">
            <img src="/diabari_logo.png" style="width: 100%; height: auto;" alt="DIABARI LOGO" onerror="this.onerror=null; this.src='https://placehold.co/200x100?text=DIABARI+LOGO';">
          </div>
          <div style="flex: 1; text-align: center; padding: 0 10px;">
             <h1 style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 1px; color: #1e3a8a; line-height: 1.2;">DIABARI TECHNICAL TRAINING CENTRE (RL2572)</h1>
          </div>
          <div style="width: 110px; height: 130px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 10px; overflow: hidden; flex-shrink: 0;">
            ${p.photoUrl ? '<img src="' + p.photoUrl + '" style="width: 100%; height: 100%; object-fit: cover;" alt="Photo">' : 'Photo'}
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 18px; text-decoration: underline;">CURRICULUM VITAE</h2>
          <h3 style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; text-transform: uppercase;">${p.primarySkill || p.tradeName || ''}</h3>
        </div>

        <table class="layout-table">
          <tr>
            <td class="col-left">
              <!-- GENERAL INFORMATION -->
              <table class="cv-table">
                <tr><td colspan="2" class="gray-bg">GENERAL INFORMATION</td></tr>
                <tr><td class="label">Name</td><td class="value">${p.name || ''}</td></tr>
                <tr><td class="label">Father's Name</td><td class="value">${p.fatherName || ''}</td></tr>
                <tr><td class="label">Date of Birth</td><td class="value">${p.fatherDOB || ''}</td></tr>
                <tr><td class="label">Mother's Name</td><td class="value">${p.motherName || ''}</td></tr>
                <tr><td class="label">Date of Birth</td><td class="value">${p.motherDOB || ''}</td></tr>
                <tr><td class="label">Wife Name</td><td class="value">${p.wifeName || ''}</td></tr>
                <tr><td class="label">Date of Birth</td><td class="value">${p.wifeDOB || ''}</td></tr>
                <tr style="background:#e2e8f0;"><td class="label" style="text-align:left; font-weight: bold;">Children</td><td class="value" style="background:#fff;">${p.children || ''}</td></tr>
                <tr><td class="label">Nationality</td><td class="value">${p.nationality || ''}</td></tr>
                <tr><td class="label">Date of Birth</td><td class="value">${p.candidateDOB || ''}</td></tr>
                <tr><td class="label">Age</td><td class="value">${p.age || ''}</td></tr>
                <tr><td class="label">Place of Birth</td><td class="value">${p.placeOfBirth || ''}</td></tr>
                <tr><td class="label">Religion</td><td class="value">${p.religion || ''}</td></tr>
                <tr><td class="label">Marital Status</td><td class="value">${p.maritalStatus || ''}</td></tr>
                <tr><td class="label">Height (Ft.)</td><td class="value">${p.height || ''}</td></tr>
                <tr><td class="label">Weight (Kg.)</td><td class="value">${p.weight || ''}</td></tr>
              </table>

              <!-- PASSPORT INFORMATION -->
              <table class="cv-table">
                <tr><td colspan="2" class="gray-bg">PASSPORT INFORMATION</td></tr>
                <tr><td class="label">Passport No.</td><td class="value">${p.passportNumber || ''}</td></tr>
                <tr><td class="label">Place of Issue</td><td class="value">${p.placeOfIssue || ''}</td></tr>
                <tr><td class="label">Date of Issue</td><td class="value">${p.dateOfIssue || ''}</td></tr>
                <tr><td class="label">Date of Expire</td><td class="value">${p.dateOfExpire || ''}</td></tr>
              </table>
            </td>

            <td class="col-right">
              <!-- ADDRESS INFORMATION -->
              <table class="cv-table">
                <tr><td colspan="2" class="gray-bg">ADDRESS INFORMATION</td></tr>
                <tr><td colspan="2" class="text-center">PERMANENT</td></tr>
                <tr><td colspan="2" style="height: 70px; white-space: pre-wrap;">${p.permanentAddress || ''}</td></tr>
                <tr><td colspan="2" class="text-center">PRESENT</td></tr>
                <tr><td colspan="2" style="height: 70px; white-space: pre-wrap;">${p.presentAddress || ''}</td></tr>
              </table>

              <table class="layout-table" style="margin-bottom: 10px;">
                <tr>
                  <td style="width: 48%; padding-right: 2%;">
                    <!-- CONTACT NUMBER -->
                    <table class="cv-table" style="margin-bottom: 0;">
                      <tr><td class="gray-bg">CONTACT NUMBER</td></tr>
                      <tr><td style="height: 44px; text-align: center; vertical-align: middle;">${p.phone || ''}</td></tr>
                    </table>
                  </td>
                  <td style="width: 50%;">
                    <!-- LANGUAGE INFORMATION -->
                    <table class="cv-table" style="margin-bottom: 0;">
                      <tr><td colspan="2" class="gray-bg">LANGUAGE INFORMATION</td></tr>
                      <tr><td class="label text-center">English</td><td class="value text-center">${p.englishLevel || ''}</td></tr>
                      <tr><td class="label text-center">Bangla</td><td class="value text-center">${p.banglaLevel || ''}</td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- SELECTION STATUS -->
              <table class="cv-table">
                <tr>
                  <td class="gray-bg" style="width: 40%; text-align:left;">SELECTION STATUS</td>
                  <td style="width: 40%; text-align:center;">${p.selectionStatus || ''}</td>
                  <td class="gray-bg" style="width: 10%;">GRADE</td>
                  <td style="width: 10%; text-align:center;">${p.grade || ''}</td>
                </tr>
              </table>

              <!-- SKILL & QUALIFICATION -->
              <table class="cv-table">
                <tr><td colspan="2" class="gray-bg">SKILL & QUALIFICATION</td></tr>
                <tr><td class="label">Experience certificate</td><td class="value text-center">${p.experienceCertificateNo ? p.experienceCertificateNo : 'NO'}</td></tr>
                <tr><td class="label font-bold uppercase">${p.primarySkill || 'STEEL FIXER'}</td><td class="value text-center">YES</td></tr>
                <tr><td class="label">License No</td><td class="value text-center">${p.licenseNo || 'N/A'}</td></tr>
                <tr><td class="label">Overseas Country</td><td class="value text-center">${p.overseasCountry || 'YES'}</td></tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- COMPUTER SKILL -->
        <table class="cv-table">
          <tr>
            <td class="gray-bg" style="width: 150px; text-align:left;">COMPUTER SKILL</td>
            <td>${p.computerSkill || 'N/A'}</td>
          </tr>
        </table>

        <!-- EDUCATIONAL QUALIFICATION -->
        <table class="cv-table">
          <tr><td colspan="3" class="gray-bg">EDUCATIONAL QUALIFICATION</td></tr>
          <tr>
            <td class="text-center font-bold" style="width:33%;">Examination Name</td>
            <td class="text-center font-bold" style="width:33%;">Passing Year</td>
            <td class="text-center font-bold" style="width:34%;">Result</td>
          </tr>
          <tr>
            <td style="height: 25px; text-align:center;">${p.educationalQualification ? (p.educationalQualification.split('-')[0] || '') : ''}</td>
            <td style="height: 25px; text-align:center;">${p.educationalQualification ? (p.educationalQualification.split('-')[1] || '') : ''}</td>
            <td style="height: 25px; text-align:center;">${p.educationalQualification ? (p.educationalQualification.split('-')[2] || '') : ''}</td>
          </tr>
        </table>

        <!-- EXPERIENCE DETAILS -->
        <table class="cv-table">
          <tr><td colspan="5" class="gray-bg">EXPERIENCE DETAILS (HOME & ABROAD)</td></tr>
          <tr>
            <td class="text-center font-bold">Duration</td>
            <td class="text-center font-bold">Company</td>
            <td class="text-center font-bold">Country</td>
            <td class="text-center font-bold">Position</td>
            <td class="text-center font-bold">ABROAD</td>
          </tr>
          <tr>
            <td style="height: 25px; text-align:center;">${p.experienceDetails ? (p.experienceDetails.split('-')[0] || '') : ''}</td>
            <td style="height: 25px; text-align:center;">${p.experienceDetails ? (p.experienceDetails.split('-')[1] || '') : ''}</td>
            <td style="height: 25px; text-align:center;">${p.experienceDetails ? (p.experienceDetails.split('-')[2] || '') : ''}</td>
            <td style="height: 25px; text-align:center;">${p.experienceDetails ? (p.experienceDetails.split('-')[3] || '') : ''}</td>
            <td style="height: 25px; text-align:center;">${p.experienceDetails ? (p.experienceDetails.split('-')[4] || '') : ''}</td>
          </tr>
          <tr>
            <td style="height: 25px;"></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        </table>

        <!-- WORK DESCRIPTION -->
        <table class="cv-table">
          <tr><td class="gray-bg text-center" style="width:100%;">WORK DESCRIPTION</td></tr>
          <tr><td style="height: 80px; white-space: pre-wrap;">${p.workDescriptionText || ''}</td></tr>
        </table>
        
        <table class="cv-table" style="border: none;">
          <tr>
            <td style="width: 15%; font-weight:bold; border: 1px dotted #000; text-align:right;">Remarks:</td>
            <td style="height: 50px; border: 1px dotted #000;">${p.remarks || ''}</td>
          </tr>
        </table>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  },

  printMonthlySalarySheet(records: any[], month: string) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Pop-up blocked! Please allow pop-ups to print reports.");
      return;
    }

    // Calculate totals of the sheet
    const totalStaff = records.length;
    let totalBasePay = 0;
    let totalOT = 0;
    let totalAdvanceDeducted = 0;
    let totalNetPay = 0;
    let totalPaidCount = 0;

    records.forEach(({ member, loggedSheet, daysPresent }) => {
      const hasSlip = !!loggedSheet;
      const shownBase = hasSlip ? loggedSheet.baseSalary : member.baseSalary;
      const shownAllowance = hasSlip ? loggedSheet.allowance : 0;
      const shownDeducted = hasSlip ? loggedSheet.advanceDeducted : 0;
      const shownNet = hasSlip
        ? loggedSheet.netPayable
        : Math.round(member.baseSalary * (daysPresent / 30));

      totalBasePay += shownBase;
      totalOT += shownAllowance;
      totalAdvanceDeducted += shownDeducted;
      totalNetPay += shownNet;

      if (loggedSheet && loggedSheet.isPaid) {
        totalPaidCount++;
      }
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Monthly Salary Sheet - NexTrip</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Inter', 'Noto Sans Bengali', sans-serif;
            color: #1e293b;
            background: #ffffff;
            padding: 40px;
            line-height: 1.4;
          }
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 2px solid #059669;
            padding-bottom: 20px;
          }
          .logo-area img {
            height: 55px;
            object-fit: contain;
          }
          .title-area {
            text-align: right;
          }
          .title-area h1 {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 4px;
            letter-spacing: -0.02em;
          }
          .title-area p {
            font-size: 11px;
            color: #64748b;
            font-weight: 500;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 25px;
            font-size: 12px;
          }
          .meta-item {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 12px 16px;
            border-radius: 8px;
          }
          .meta-item span {
            display: block;
            font-size: 10px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 700;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
          }
          .meta-item strong {
            font-size: 13px;
            color: #334155;
            font-weight: 600;
          }
          .summary-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .card {
            border-radius: 12px;
            padding: 16px 20px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 2px 0 rgba(0,0,0,0.02);
          }
          .card-net {
            background-color: #ecfdf5;
            border-color: #a7f3d0;
            color: #065f46;
          }
          .card-base {
            background-color: #f8fafc;
            border-color: #e2e8f0;
            color: #334155;
          }
          .card-adv {
            background-color: #fef2f2;
            border-color: #fee2e2;
            color: #991b1b;
          }
          .card-title {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            margin-bottom: 6px;
          }
          .card-value {
            font-size: 18px;
            font-weight: 800;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-top: 15px;
          }
          th {
            background-color: #059669;
            color: #ffffff;
            font-weight: 700;
            text-align: left;
            padding: 10px 12px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.02em;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
            vertical-align: middle;
            font-weight: 500;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .total-row {
            background-color: #f1f5f9 !important;
            font-weight: 700;
            border-top: 2px solid #cbd5e1;
            border-bottom: 2px solid #cbd5e1;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            padding: 3px 8px;
            border-radius: 9999px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .badge-paid {
            background-color: #dcfce7;
            color: #166534;
          }
          .badge-unpaid {
            background-color: #ffe4e6;
            color: #9f1239;
          }
          .badge-draft {
            background-color: #f1f5f9;
            color: #475569;
          }
          .signature-section {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
          }
          .sig-box {
            width: 200px;
            text-align: center;
          }
          .sig-line {
            border-top: 1px solid #94a3b8;
            margin-bottom: 8px;
          }
          .sig-title {
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
            padding-top: 15px;
          }
          @media print {
            body {
              padding: 0;
            }
            tr {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="logo-area">
            <img src="/src/assets/images/nextrip_logo_1779094935437.png" alt="NexTrip Logo" onerror="this.style.display='none'">
          </div>
          <div class="title-area">
            <h1>Monthly Staff Salary Sheet</h1>
            <p>মাসিক স্টাফ বেতন শীট ও হিসাব খাতা</p>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <span>Report Title (রিপোর্ট নাম)</span>
            <strong>Monthly Payroll Sheet</strong>
          </div>
          <div class="meta-item">
            <span>Salary Month (বেতন মাস)</span>
            <strong>${month}</strong>
          </div>
          <div class="meta-item">
            <span>Total Staff (মোট কর্মকর্তা)</span>
            <strong>${totalStaff} members (${totalPaidCount} Paid)</strong>
          </div>
        </div>

        <div class="summary-cards">
          <div class="card card-base">
            <div class="card-title">TOTAL BASE SALARIES (মূল বেতন)</div>
            <div class="card-value">৳${totalBasePay.toLocaleString("en-IN")}</div>
          </div>
          <div class="card card-adv">
            <div class="card-title">ADVANCES DEDUCTED (অগ্রিম কর্তন)</div>
            <div class="card-value">৳${totalAdvanceDeducted.toLocaleString("en-IN")}</div>
          </div>
          <div class="card card-net">
            <div class="card-title">NET PAYABLE AMOUNT (পরিশোধিত নেট বেতন)</div>
            <div class="card-value">৳${totalNetPay.toLocaleString("en-IN")}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%">SL</th>
              <th style="width: 25%">Staff Member ( কর্মকর্তা ও পদবী )</th>
              <th style="width: 15%; text-align: right;">Base Rate (মূল বেতন)</th>
              <th style="width: 12%; text-align: center;">Attendance</th>
              <th style="width: 13%; text-align: right;">OT / Bonus</th>
              <th style="width: 15%; text-align: right;">Adv Deduct (অগ্রিম কর্তন)</th>
              <th style="width: 15%; text-align: right;">Net Payable (নেট প্রদান)</th>
              <th style="width: 10%; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${records
              .map(({ member, loggedSheet, daysPresent, status }, index) => {
                const hasSlip = !!loggedSheet;
                const shownBase = hasSlip
                  ? loggedSheet.baseSalary
                  : member.baseSalary;
                const shownAllowance = hasSlip ? loggedSheet.allowance : 0;
                const shownDeducted = hasSlip ? loggedSheet.advanceDeducted : 0;
                const shownNet = hasSlip
                  ? loggedSheet.netPayable
                  : Math.round(member.baseSalary * (daysPresent / 30));

                let statusBadge = "";
                if (status === "Paid") {
                  statusBadge = '<span class="badge badge-paid">Paid</span>';
                } else if (status === "Unpaid Documented") {
                  statusBadge =
                    '<span class="badge badge-unpaid">Pending</span>';
                } else {
                  statusBadge = '<span class="badge badge-draft">Draft</span>';
                }

                return `
                <tr>
                  <td>${index + 1}</td>
                  <td>
                    <div style="font-weight: 750; color: #1e293b;">${member.name}</div>
                    <div style="font-size: 10px; color: #64748b; text-transform: capitalize; margin-top: 2px;">${member.designation} (${member.role || "Staff"})</div>
                  </td>
                  <td style="text-align: right; font-family: monospace; font-size: 11px;">৳${shownBase.toLocaleString("en-IN")}</td>
                  <td style="text-align: center; font-family: monospace;">${daysPresent}/30 Days</td>
                  <td style="text-align: right; font-family: monospace; font-size: 11px; color: #10b981; font-weight: 600;">+৳${shownAllowance.toLocaleString("en-IN")}</td>
                  <td style="text-align: right; font-family: monospace; font-size: 11px; color: #ef4444; font-weight: 600;">-৳${shownDeducted.toLocaleString("en-IN")}</td>
                  <td style="text-align: right; font-family: monospace; font-size: 12px; font-weight: 750; color: #0f172a; background-color: #f8fafc;">৳${shownNet.toLocaleString("en-IN")}</td>
                  <td style="text-align: center;">${statusBadge}</td>
                </tr>
              `;
              })
              .join("")}
            
            <tr class="total-row">
              <td colspan="2" style="text-align: left; font-weight: bold; padding: 12px 12px;">TOTALS (মোট হিসাব)</td>
              <td style="text-align: right; font-family: monospace; font-weight: bold;">৳${totalBasePay.toLocaleString("en-IN")}</td>
              <td style="text-align: center;">-</td>
              <td style="text-align: right; font-family: monospace; font-weight: bold; color: #059669;">+৳${totalOT.toLocaleString("en-IN")}</td>
              <td style="text-align: right; font-family: monospace; font-weight: bold; color: #dc2626;">-৳${totalAdvanceDeducted.toLocaleString("en-IN")}</td>
              <td style="text-align: right; font-family: monospace; font-weight: 800; font-size: 13px; color: #047857; background-color: #ecfdf5;">৳${totalNetPay.toLocaleString("en-IN")}</td>
              <td style="text-align: center;">-</td>
            </tr>
          </tbody>
        </table>

        <div class="signature-section">
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-title">Prepared By</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-title">Verified By Accountant</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-title">Authorized Signature</div>
          </div>
        </div>

        <div class="footer">
          <p>This Monthly Salary Sheet was generated securely from NexTrip Enterprise Portal on ${new Date().toLocaleString("en-US")}.</p>
          <p style="margin-top: 5px; font-weight: bold; color: #64748b;">NexTrip Tours & Travels - All Rights Reserved © ${new Date().getFullYear()}</p>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  },

  printSingleSalarySlip(
    member: any,
    loggedSheet: any,
    daysPresent: number,
    overtimeHours: number,
    month: string,
  ) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Pop-up blocked! Please allow pop-ups to print reports.");
      return;
    }

    const hasSlip = !!loggedSheet;
    const shownBase = hasSlip ? loggedSheet.baseSalary : member.baseSalary;
    const shownAllowance = hasSlip ? loggedSheet.allowance : 0;
    const shownDeducted = hasSlip ? loggedSheet.advanceDeducted : 0;
    const shownNet = hasSlip
      ? loggedSheet.netPayable
      : Math.round(member.baseSalary * (daysPresent / 30));
    const status = hasSlip
      ? loggedSheet.isPaid
        ? "PAID"
        : "DUE / PENDING"
      : "DRAFT ESTIMATE";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Salary Pay Slip - ${member.name}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Inter', 'Noto Sans Bengali', sans-serif;
            color: #1e293b;
            background: #ffffff;
            padding: 50px;
            line-height: 1.5;
          }
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 25px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
          }
          .logo-area img {
            height: 60px;
            object-fit: contain;
          }
          .title-area {
            text-align: right;
          }
          .title-area h1 {
            font-size: 24px;
            font-weight: 800;
            color: #2563eb;
            letter-spacing: -0.02em;
          }
          .title-area p {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.05em;
          }
          .slip-meta-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-top: 30px;
            margin-bottom: 30px;
          }
          .slip-meta-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 16px 20px;
            border-radius: 12px;
          }
          .slip-meta-box h3 {
            font-size: 13px;
            color: #1e293b;
            font-weight: 700;
            margin-bottom: 10px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.02em;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-bottom: 6px;
          }
          .meta-row:last-child {
            margin-bottom: 0;
          }
          .meta-label {
            color: #64748b;
            font-weight: 600;
          }
          .meta-value {
            color: #1e293b;
            font-weight: 700;
          }
          .table-container {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th {
            background-color: #f1f5f9;
            color: #475569;
            font-weight: 700;
            text-align: left;
            padding: 12px 16px;
            border-bottom: 1px solid #e2e8f0;
          }
          td {
            padding: 12px 16px;
            border-bottom: 1px solid #f1f5f9;
            color: #334155;
          }
          tr:last-child td {
            border-bottom: none;
          }
          .amount-col {
            text-align: right;
            font-family: monospace;
            font-weight: 600;
            font-size: 12px;
          }
          .net-pay-row {
            background: #eff6ff;
            font-weight: 800;
            font-size: 14px;
            color: #1e40af;
            border-top: 2px solid #bfdbfe;
          }
          .net-pay-row td {
            padding: 16px;
          }
          .status-stamp {
            border: 3px double;
            display: inline-block;
            padding: 6px 15px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 900;
            letter-spacing: 0.05em;
            margin-top: 10px;
            text-transform: uppercase;
          }
          .stamp-paid {
            color: #059669;
            border-color: #059669;
            background: #ecfdf5;
            transform: rotate(-3deg);
          }
          .stamp-due {
            color: #d97706;
            border-color: #d97706;
            background: #fffbeb;
            transform: rotate(-3deg);
          }
          .signature-section {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
          }
          .sig-box {
            width: 200px;
            text-align: center;
          }
          .sig-line {
            border-top: 1px solid #94a3b8;
            margin-bottom: 8px;
          }
          .sig-title {
            font-size: 10px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
          }
          .doc-footer {
            margin-top: 50px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 20px;
            border-radius: 12px;
            font-size: 11px;
            color: #475569;
          }
          @media print {
            body { padding: 0; }
            .slip-meta-grid, .table-container { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="logo-area">
            <img src="/src/assets/images/nextrip_logo_1779094935437.png" alt="NexTrip Logo" onerror="this.style.display='none'">
          </div>
          <div class="title-area">
            <h1>SALARY PAY SLIP</h1>
            <p>কর্মকর্তার বেতন রশিদ ও কপি</p>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;">
          <div style="flex-grow: 1;">
            <p style="font-[10px]; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Salary Slip For:</p>
            <h2 style="font-size: 20px; font-weight: 850; color: #1e293b; margin-top: 4px;">${member.name}</h2>
            <p style="font-size: 12px; color: #475569; font-weight: 600; margin-top: 2px;">${member.designation} (${member.role || "Staff"})</p>
          </div>
          <div>
            <span class="status-stamp ${status === "PAID" ? "stamp-paid" : "stamp-due"}">${status}</span>
          </div>
        </div>

        <div class="slip-meta-grid">
          <div class="slip-meta-box">
            <h3>Employee & Contract Info</h3>
            <div class="meta-row">
              <span class="meta-label">Email Address</span>
              <span class="meta-value">${member.email || "N/A"}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Phone Number</span>
              <span class="meta-value">${member.phone || "N/A"}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Joining Date</span>
              <span class="meta-value">${member.joiningDate || "N/A"}</span>
            </div>
          </div>
          
          <div class="slip-meta-box">
            <h3>Payroll Period Info</h3>
            <div class="meta-row">
              <span class="meta-label">Salary Month</span>
              <span class="meta-value">${month}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Logged Attendance</span>
              <span class="meta-value">${daysPresent}/30 Days</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Overtime Logged</span>
              <span class="meta-value">${overtimeHours} hours</span>
            </div>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Description of Earnings & Deductions</th>
                <th style="text-align: right; width: 30%;">Amount (BDT)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong style="color: #1e293b;">Contractual Base Salary Rate (চুক্তিবদ্ধ মূল বেতন)</strong>
                  <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Earned pro-rata rate based on monthly attendance weight.</div>
                </td>
                <td class="amount-col" style="color: #1e293b;">৳${shownBase.toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td>
                  <strong style="color: #059669;">Overtime & Custom Bonus Allowances (ওভারটাইম / বোনাস)</strong>
                  <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Logged and approved overtime rate (${overtimeHours} hrs).</div>
                </td>
                <td class="amount-col" style="color: #059669;">+৳${shownAllowance.toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td>
                  <strong style="color: #dc2626;">Advance Salary Repayment Deductions (অগ্রিম ঋণ সমন্বয়)</strong>
                  <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Auto-deducted repayment for previous outstanding advance payments.</div>
                </td>
                <td class="amount-col" style="color: #dc2626;">-৳${shownDeducted.toLocaleString("en-IN")}</td>
              </tr>
              <tr class="net-pay-row">
                <td>
                  <strong>NET PAYABLE / DISBURSED AMOUNT (নেট পরিশোধিত টাকা)</strong>
                  <div style="font-size: 10px; color: #2563eb; margin-top: 2px; font-weight: 500;">Final salary handed over or deposited.</div>
                </td>
                <td class="amount-col" style="font-size: 15px; font-weight: 900;">৳${shownNet.toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${
          hasSlip && loggedSheet.remarks
            ? `
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px 20px; font-size: 11px; margin-bottom: 30px;">
            <strong style="color: #334155; text-transform: uppercase; font-size: 10px; display: block; margin-bottom: 4px;">Accountant Remarks / Notes:</strong>
            <span style="color: #475569; font-weight: 500;">${loggedSheet.remarks}</span>
          </div>
        `
            : ""
        }

        <div class="signature-section">
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-title">Receiver's Signature</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-title">Prepared By (Accounts)</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-title">Authorized Seal</div>
          </div>
        </div>

        <div class="doc-footer">
          <p><strong>System Note:</strong> This pay slip is custom computed and printed directly from NexTrip Enterprise Resource Portal.</p>
          <p><strong>Verification Hash:</strong> SEC-PAY-${member.id?.slice(0, 8)}-${month}</p>
          <p style="margin-top: 10px; font-weight: bold; color: #2563eb; font-size: 10px;">NexTrip Tours & Travels - Integrity Verified</p>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  },

  printTrainingReport(
    enrollments: TrainingEnrollment[],
    startDate: string = "",
    endDate: string = "",
  ) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Pop-up blocked! Please allow pop-ups to print reports.");
      return;
    }

    const totalStudents = enrollments.length;
    const activeStudents = enrollments.filter(
      (e) => e.status === "Running" || e.status === "Admitted",
    ).length;
    const completedStudents = enrollments.filter(
      (e) => e.status === "Completed",
    ).length;
    const totalFees = enrollments.reduce(
      (sum, e) => sum + (e.totalFee || 0),
      0,
    );
    const totalPaid = enrollments.reduce(
      (sum, e) => sum + (e.paidAmount || 0),
      0,
    );
    const totalDue = enrollments.reduce(
      (sum, e) => sum + (e.dueAmount || 0),
      0,
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Training Admissions Report - NexTrip</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Inter', 'Noto Sans Bengali', sans-serif;
            color: #0f172a;
            background: #ffffff;
            padding: 40px;
            line-height: 1.4;
          }
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 25px;
            border-bottom: 3px solid #0f172a;
            padding-bottom: 15px;
          }
          .logo-area {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #1e3a8a;
          }
          .logo-sub {
            font-size: 9px;
            font-weight: bold;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #64748b;
            margin-top: 2px;
          }
          .title-area { text-align: right; }
          .title-area h1 {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.2px;
          }
          .title-area p {
            font-size: 11px;
            font-weight: 500;
            color: #64748b;
            margin-top: 3px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 12px;
            margin-bottom: 30px;
          }
          .summary-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px;
            text-align: left;
          }
          .summary-card.highlight {
            background-color: #eff6ff;
            border-color: #bfdbfe;
          }
          .summary-card.success-highlight {
            background-color: #f0fdf4;
            border-color: #bbf7d0;
          }
          .summary-card.danger-highlight {
            background-color: #fef2f2;
            border-color: #fca5a5;
          }
          .summary-card .label {
            font-size: 9px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .summary-card .value {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
          }
          .table-container {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          thead {
            background-color: #f8fafc;
            border-b: 1px solid #e2e8f0;
          }
          th {
            text-align: left;
            padding: 12px;
            font-weight: bold;
            color: #475569;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.5px;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #f1f5f9;
            color: #334155;
            vertical-align: middle;
          }
          tr:last-child td { border-bottom: none; }
          .mono { font-family: monospace; font-size: 11px; font-weight: 600; }
          .status {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 9999px;
            font-size: 8px;
            font-weight: 800;
            text-transform: uppercase;
          }
          .status.admitted { background-color: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe; }
          .status.running { background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
          .status.completed { background-color: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }
          .status.cancelled { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fee2e2; }
          .status.dropped-out { background-color: #faf5ff; color: #6b21a8; border: 1px solid #f3e8ff; }
          
          .footer {
            margin-top: 50px;
            border-top: 1px solid #f1f5f9;
            padding-top: 15px;
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            color: #94a3b8;
          }
          .sign-area {
            display: flex;
            justify-content: flex-end;
            gap: 80px;
            margin-top: 60px;
            margin-bottom: 20px;
          }
          .sign-box {
            text-align: center;
            width: 140px;
          }
          .sign-line {
            border-top: 1px solid #94a3b8;
            margin-bottom: 6px;
          }
          .sign-text {
            font-size: 9px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div>
            <div class="logo-area">NexTrip International</div>
            <div class="logo-sub">Training Academy & Resource</div>
          </div>
          <div class="title-area">
            <h1>Training Admission & Income Report</h1>
            <p>Date-wise Enrolled Trainees Register</p>
          </div>
        </div>

        <div style="font-size: 11px; margin-bottom: 20px; color: #475569;">
          Report Period: <strong>${startDate || "All Time"}</strong> to <strong>${endDate || "All Time"}</strong>
          &bull; Generated: <strong>${new Date().toLocaleString()}</strong>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="label">Total Enrolled</div>
            <div class="value">${totalStudents}</div>
          </div>
          <div class="summary-card highlight">
            <div class="label">Running (সক্রিয়)</div>
            <div class="value">${activeStudents}</div>
          </div>
          <div class="summary-card success-highlight">
            <div class="label">Completed (সম্পন্ন)</div>
            <div class="value">${completedStudents}</div>
          </div>
          <div class="summary-card highlight">
            <div class="label">Total Fee Amount</div>
            <div class="value">৳${totalFees.toLocaleString("en-IN")}</div>
          </div>
          <div class="summary-card success-highlight">
            <div class="label">Total Collected</div>
            <div class="value">৳${totalPaid.toLocaleString("en-IN")}</div>
          </div>
          <div class="summary-card danger-highlight">
            <div class="label">Total Outstanding Due</div>
            <div class="value">৳${totalDue.toLocaleString("en-IN")}</div>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width: 5%;">SL</th>
                <th style="width: 20%;">Student Details</th>
                <th style="width: 25%;">Course & Batch</th>
                <th style="width: 12%;">Adm. Date</th>
                <th style="width: 10%;">Status</th>
                <th style="text-align: right; width: 9%;">Total Fee</th>
                <th style="text-align: right; width: 9%;">Paid</th>
                <th style="text-align: right; width: 10%;">Due</th>
              </tr>
            </thead>
            <tbody>
              ${enrollments
                .map((e, index) => {
                  const statusClass = (e.status || "Admitted")
                    .toLowerCase()
                    .replace(" ", "-");
                  const dueColor =
                    (e.dueAmount || 0) > 0
                      ? "color: #ef4444; font-weight: bold;"
                      : "color: #10b981;";
                  return `
                  <tr>
                    <td class="mono">${index + 1}</td>
                    <td>
                      <strong style="color: #0f172a; font-size: 11px;">${e.studentName}</strong>
                      <div style="color: #64748b; font-size: 9px; margin-top: 2px;">${e.phone}</div>
                    </td>
                    <td>
                      <span style="font-weight: 600; color: #1e3a8a;">${e.courseName}</span>
                      <div style="color: #64748b; font-size: 9px; margin-top: 2px;">Batch: ${e.batchName || "Default"}</div>
                    </td>
                    <td class="mono">${e.admissionDate}</td>
                    <td>
                      <span class="status ${statusClass}">${e.status}</span>
                    </td>
                    <td class="mono" style="text-align: right;">৳${e.totalFee.toLocaleString("en-IN")}</td>
                    <td class="mono" style="text-align: right; color: #059669;">৳${e.paidAmount.toLocaleString("en-IN")}</td>
                    <td class="mono" style="text-align: right; ${dueColor}">৳${e.dueAmount.toLocaleString("en-IN")}</td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="sign-area">
          <div class="sign-box">
            <div class="sig-line"></div>
            <div class="sig-text">Prepared By</div>
          </div>
          <div class="sign-box">
            <div class="sig-line"></div>
            <div class="sig-text">Director Signature</div>
          </div>
        </div>

        <div class="footer">
          <div>Nextrip Training System Copy &bull; Secure Cloud Entry</div>
          <div>Page 1 of 1</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  },

  printStudentReceipt(student: TrainingEnrollment) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Pop-up blocked! Please allow pop-ups to print reports.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Admission Slip - ${student.studentName}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Inter', 'Noto Sans Bengali', sans-serif;
            color: #0f172a;
            padding: 40px;
            background: #fff;
          }
          .border-box {
            border: 2px dashed #94a3b8;
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 20px;
            position: relative;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-translate, -50%) rotate(-15deg);
            font-size: 65px;
            color: rgba(241, 245, 249, 0.7);
            font-weight: 900;
            z-index: 1;
            pointer-events: none;
            width: 100%;
            text-align: center;
          }
          .header-main {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 12px;
            margin-bottom: 20px;
            z-index: 2;
            position: relative;
          }
          .logo {
            font-weight: 800;
            color: #1e3a8a;
            font-size: 20px;
          }
          .logo-sub {
            font-size: 8px;
            letter-spacing: 1.5px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
          }
          .badge {
            background-color: #f1f5f9;
            color: #0f172a;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .receipt-title {
            text-align: center;
            margin-bottom: 25px;
          }
          .receipt-title h2 {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.3px;
          }
          .receipt-title p {
            font-size: 10px;
            color: #64748b;
            margin-top: 3px;
          }
          .grid-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 25px;
            position: relative;
            z-index: 2;
          }
          .info-block h4 {
            font-size: 8px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 4px;
          }
          .info-block p {
            font-size: 13px;
            color: #1e293b;
            font-weight: 600;
          }
          .finance-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-bottom: 30px;
            position: relative;
            z-index: 2;
          }
          .finance-table th {
            text-align: left;
            border-bottom: 2px solid #e2e8f0;
            padding: 8px 12px;
            color: #64748b;
            text-transform: uppercase;
            font-size: 8px;
            letter-spacing: 1px;
          }
          .finance-table td {
            padding: 12px;
            border-bottom: 1px solid #f1f5f9;
            font-weight: 500;
          }
          .finance-table tr.total-row td {
            font-weight: 800;
            background-color: #f8fafc;
            border-top: 2px solid #e2e8f0;
          }
          .mono { font-family: monospace; font-size: 12px; }
          .signature-box {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            position: relative;
            z-index: 2;
          }
          .sig {
            text-align: center;
            width: 130px;
          }
          .sig-line {
            border-top: 1px solid #94a3b8;
            margin-bottom: 4px;
          }
          .sig-title {
            font-size: 9px;
            color: #64748b;
            font-weight: bold;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <div class="border-box">
          <div class="watermark">ADMITTED</div>
          
          <div class="header-main">
            <div>
              <div class="logo">NexTrip</div>
              <div class="logo-sub">Training Academy</div>
            </div>
            <div class="badge">Trainee copy</div>
          </div>

          <div class="receipt-title">
            <h2>Admission Confirmation & Payment Slip</h2>
            <p>Admission Serial: NT-TRN-${student.id?.slice(0, 6).toUpperCase() || "NEW"}</p>
          </div>

          <div class="grid-info">
            <div class="info-block">
              <h4>Candidate Name (অংশগ্রহণকারী)</h4>
              <p>${student.studentName}</p>
            </div>
            <div class="info-block">
              <h4>Phone Number</h4>
              <p class="mono">${student.phone}</p>
            </div>
            <div class="info-block">
              <h4>Enrolled Course (কোর্স নাম)</h4>
              <p style="color: #1e3a8a;">${student.courseName}</p>
            </div>
            <div class="info-block">
              <h4>Batch & Time</h4>
              <p>${student.batchName || "Default Batch"}</p>
            </div>
            <div class="info-block">
              <h4>Admission Date</h4>
              <p class="mono">${student.admissionDate}</p>
            </div>
            <div class="info-block">
              <h4>Registration Status</h4>
              <p style="text-transform: uppercase; color: #10b981;">● ${student.status}</p>
            </div>
          </div>

          <table class="finance-table">
            <thead>
              <tr>
                <th>Description Of Fees</th>
                <th style="text-align: right;">Amount (৳)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Standard Course registration fee & course materials BDT</td>
                <td style="text-align: right;" class="mono">৳${student.totalFee.toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td style="color: #16a34a; font-weight: 600;">Admission Paid Initial BDT (সংগৃহীত আমানত)</td>
                <td style="text-align: right; color: #16a34a;" class="mono font-bold">৳${student.paidAmount.toLocaleString("en-IN")}</td>
              </tr>
              <tr class="total-row">
                <td style="color: #ef4444;">Total Outstanding Due Balance (বকেয়া পরিশোধের দায়)</td>
                <td style="text-align: right; color: #ef4444;" class="mono font-extrabold">৳${student.dueAmount.toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>

          ${
            student.remarks
              ? `
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 10px; color: #475569; margin-top: -15px; margin-bottom: 25px;">
              <strong>Note:</strong> ${student.remarks}
            </div>
          `
              : ""
          }

          <div class="signature-box">
            <div class="sig">
              <div class="sig-line"></div>
              <div class="sig-title">Candidate Signature</div>
            </div>
            <div class="sig">
              <div class="sig-line"></div>
              <div class="sig-title">Officer Signature</div>
            </div>
            <div class="sig">
              <div class="sig-line"></div>
              <div class="sig-title">Authorized Seal</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  },
};
