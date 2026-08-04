import React, { useState } from "react";
import { FileText, Download, Printer } from "lucide-react";

const TEMPLATES = [
  {
    id: "offer-letter",
    name: "Offer Letter",
    content: `[Company Logo]

Date: [Current Date]

To,
[Passenger Name]
[Address]

Subject: Offer of Employment

Dear [Passenger Name],

We are pleased to offer you the position of [Job Title] at [Company Name]. Your scheduled date of joining is [Joining Date], and your working location will be [Location].

Salary and Benefits:
- Basic Salary: [Amount]
- Allowance: [Amount]

Please sign and return a copy of this letter as a token of your acceptance.

Sincerely,
[Manager Name]
[Company Name]`,
  },
  {
    id: "demand-letter",
    name: "Demand Letter",
    content: `DEMAND LETTER

Date: [Date]
Ref No: [Reference Number]

To,
The Managing Director,
[Agency Name],
Dhaka, Bangladesh.

Dear Sir,

We hereby appoint your esteemed company to recruit the following personnel for our company under the following terms and conditions:

1. Category: [Job Category]
2. Number of Workers: [Number]
3. Basic Salary: [Salary]
4. Working Hours: 8 hours per day, 6 days a week.
5. Accommodation & Food: Provided by company.
6. Local Transportation: Provided by company.
7. Medical & Insurance: Provided by company.

Regards,

[Authorized Signatory]
[Company Name]`,
  },
  {
    id: "experience-certificate",
    name: "Experience Certificate",
    content: `TO WHOM IT MAY CONCERN

This is to certify that [Passenger Name], holding Passport Number [Passport No], has been employed with [Company Name] from [Start Date] to [End Date] in the position of [Job Title].

During their tenure, we found them to be hardworking, honest, and dedicated to their duties.

We wish them all the success in their future endeavors.

Authorized Signatory,
[Company Name]`,
  },
  {
    id: "company-pad",
    name: "Company Letterhead (Pad)",
    content: `[Company Logo]
[Company Address, City, Country]
[Phone Number] | [Email Address] | [Website]
--------------------------------------------------------------------------------

Date: [Date]
Ref: [Reference Number]

To,
[Recipient Name]
[Recipient Position]
[Recipient Organization/Address]

Subject: [Subject of the Letter]

Dear [Name / Sir / Madam],

[Body of the letter goes here. You can write your official statement, request, or information.]

Thank you for your cooperation.

Sincerely,

[Signature]

[Your Name]
[Your Designation]
[Company Name]`,
  },
  {
    id: "money-receipt",
    name: "Money Receipt",
    content: `[Company Logo]
[Company Address, City, Country]
[Phone Number] | [Email Address]

MONEY RECEIPT
================================================================================

Receipt No: [Receipt Number]                            Date: [Date]

Received with thanks from Mr./Mrs./M/s: [Payer Name]
Address/Passport No: [Address or Passport No.]

The sum of Taka (in words): [Amount in Words] Only.

By Cash / Cheque / Bank Transfer No: [Payment Method / Details]
Drawn on Bank: [Bank Name, if applicable]
Date: [Payment Date]

On account of: [Purpose of Payment / E.g., Visa Processing, Air Ticket, etc.]

Amount (In figures): BDT [Amount in Numbers] /-

-----------------------------------------
Authorized Signature & Seal
[Company Name]`,
  },
  {
    id: "rent-receipt",
    name: "House/Office Rent Receipt",
    content: `RENT RECEIPT (ভাড়ার রশিদ)
================================================================================

Receipt No: [Receipt Number]                            Date: [Date]

Received with thanks from (Tenant Name): [Tenant Name]
Address of Rented Property: [Property Address]

A sum of Taka (in numbers): [Amount in Numbers] /-
Taka (in words): [Amount in Words] Only.

By Cash / Cheque / Bank Transfer No: [Payment Method]
Date: [Payment Date]

As rent for the period / month of: [Month/Year]

Outstanding Dues (if any): [Dues amount]

-----------------------------------------
Owner / Authorized Signature
Name: [Owner/Receiver Name]
Contact: [Phone Number]`,
  },
  {
    id: "noc",
    name: "No Objection Certificate (NOC)",
    content: `[Company Logo]
[Company Address]

Date: [Current Date]
Ref: [Reference Number]

TO WHOM IT MAY CONCERN
(No Objection Certificate)

This is to certify that Mr./Ms. [Employee Name], holding Passport No. [Passport Number], has been working in our organization as a [Designation] since [Joining Date].

We have no objection to his/her traveling to [Destination Country] for the purpose of [Tourism/Business/Treatment] from [Start Date] to [End Date]. During this period, he/she will be on approved leave.

He/She bears a good moral character and we wish him/her all success.

Sincerely,

[Signature]

[Authorized Person Name]
[Designation]
[Company Name]`,
  },
  {
    id: "authorization-letter",
    name: "Authorization Letter",
    content: `[Company Logo]
Date: [Date]

To,
[Authority Name / Organization]
[Address]

Subject: Letter of Authorization for [Purpose of Authorization]

Dear Sir/Madam,

I, [Your Name], [Your Designation] of [Company Name], hereby authorize Mr./Ms. [Authorized Person Name], holding NID/Passport No. [ID Number], to act on my behalf and submit/collect documents regarding [Specific details of the task].

His/Her specimen signature is attested below:

Specimen Signature of [Authorized Person Name]: ________________________

Any act carried out by him/her regarding this matter will be considered as an act carried out by me.

Thank you.

Sincerely,

[Your Signature]

[Your Name]
[Your Designation]
[Company Name]`,
  },
  {
    id: "registration-form",
    name: "BMET Registration Form (নিবন্ধন ফর্ম)",
    content: `[Company Logo]

বিএমইটি নিবন্ধন ও ফিঙ্গারপ্রিন্ট তথ্য ফর্ম
================================================================================

১। পাসপোর্টের বিবরণ:
   পাসপোর্ট নম্বর: [Passport No]                          ইস্যুর তারিখ: [Issue Date]
   মেয়াদ উত্তীর্ণের তারিখ: [Expiry Date]                 পাসপোর্ট ইস্যুর স্থান: [Issue Place]

২। ব্যক্তিগত তথ্য:
   নাম (ইংরেজিতে): [Full Name]
   পিতার নাম: [Father's Name]
   মাতার নাম: [Mother's Name]
   জন্ম তারিখ: [DOB]                                      জাতীয় পরিচয়পত্র (NID): [NID Number]
   লিঙ্গ: [পুরুষ/মহিলা]                                      ধর্ম: [ইসলাম/হিন্দু/অন্যান্য]

৩। যোগাযোগের ঠিকানা:
   গ্রাম/মহল্লা: [Village]                                  ডাকঘর: [Post Office]
   উপজেলা/থানা: [Police Station]                        জেলা: [District]
   মোবাইল নম্বর: [Phone Number]

৪। পেশা ও দক্ষতার তথ্য:
   পেশা বা কাজের ধরন: [Job Category]
   শিক্ষাগত যোগ্যতা: [Education Level]
   কাজের অভিজ্ঞতা: [Experience] বছর

৫। নমিনির তথ্য (Nominee Details):
   নমিনির নাম: [Nominee Name]
   সম্পর্ক: [Relation]
   নমিনির মোবাইল নম্বর: [Nominee Phone Number]

আমি শপথপূর্বক ঘোষণা করিতেছি যে, উপরে প্রদত্ত সমস্ত তথ্য আমার জ্ঞান ও বিশ্বাস মতে সম্পূর্ণ সত্য।

-----------------------------------------
আবেদনকারীর স্বাক্ষর:
তারিখ: [Date]`,
  },
];

export default function TemplateMaker() {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [content, setContent] = useState(TEMPLATES[0].content);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");

  const logoSVG = `
      <div style="text-align: center; margin-bottom: 25px; padding-bottom: 10px; border-bottom: 2px solid #004C99;">
        <svg width="220" height="95" viewBox="0 0 350 150" xmlns="http://www.w3.org/2000/svg">
          <path d="M 60 70 Q 150 10 260 55" stroke="#004C99" stroke-width="14" fill="none" stroke-linecap="round" />
          <path d="M 70 85 Q 150 35 240 65" stroke="#004C99" stroke-width="7" fill="none" stroke-linecap="round" />
          
          <g transform="translate(225, 30) rotate(15) scale(1.1)">
             <path d="M 40 16 L 15 -5 C 12 -7 8 -5 8 -2 L 5 18 L -25 15 C -30 14 -33 18 -29 22 L -15 35 C -13 37 -10 37 -8 35 L 12 18 L 30 40 C 33 43 38 41 39 37 L 40 16 Z" fill="#004C99"/>
          </g>

          <text x="175" y="120" font-family="Arial, sans-serif" font-weight="900" font-size="80" text-anchor="middle">
            <tspan fill="#E51937">Nex</tspan><tspan fill="#111111">Trip</tspan>
          </text>
          
          <text x="175" y="145" font-family="Arial, sans-serif" font-weight="700" font-size="16" text-anchor="middle" letter-spacing="7" fill="#111111">
            Tours & Travels
          </text>
        </svg>
      </div>
    `;

  const getPrintableContent = (rawContent: string) => {
    const htmlWithBreaks = rawContent.replace(/\n/g, "<br/>");
    return htmlWithBreaks
      .replace(/\[Company Logo\]/gi, logoSVG)
      .replace(/\[Company Logo Here\]/gi, logoSVG);
  };

  const handleTemplateChange = (templateId: string) => {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setContent(template.content);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Pop-up blocked! Please allow pop-ups.");
      return;
    }

    const printableContent = getPrintableContent(content);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${selectedTemplate.name}</title>
        <style>
          body {
            font-family: 'Times New Roman', Times, serif;
            color: #000;
            background: #fff;
            padding: 50px;
            line-height: 1.6;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>${printableContent}</body>
      <script>
        setTimeout(() => {
          window.print();
          window.close();
        }, 500);
      </script>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Document Maker
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              Generate and edit standard agency documents
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handlePrint}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors shadow-sm"
          >
            <Printer size={16} />
            Print Doc
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2 shrink-0">
            Select Template
          </label>
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden md:max-h-[600px] pb-2 md:pb-0 scrollbar-hide">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTemplateChange(t.id)}
                className={`flex-none w-48 md:w-full text-left px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                  selectedTemplate.id === t.id
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("edit")}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${
                  viewMode === "edit"
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:bg-slate-200/50"
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setViewMode("preview")}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${
                  viewMode === "preview"
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:bg-slate-200/50"
                }`}
              >
                Live Preview
              </button>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
              {selectedTemplate.name}
            </span>
          </div>
          {viewMode === "edit" ? (
            <textarea
              className="w-full h-[400px] md:h-[600px] p-4 sm:p-8 text-sm sm:text-base font-serif leading-relaxed outline-none resize-none focus:ring-0 focus:border-transparent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
            />
          ) : (
            <div className="w-full h-[400px] md:h-[600px] bg-slate-100 p-4 sm:p-8 overflow-y-auto">
              <div
                className="bg-white min-h-full shadow-lg p-8 sm:p-12 mx-auto max-w-[210mm]"
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  lineHeight: 1.6,
                }}
                dangerouslySetInnerHTML={{
                  __html: getPrintableContent(content),
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
