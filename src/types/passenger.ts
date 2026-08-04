export type PassengerType =
  | "Tourist"
  | "Worker"
  | "Business Visitor"
  | "Family Visit"
  | "Student"
  | "STEEL FIXER"
  | "CLEANER"
  | "DRIVER"
  | "ELECTRICIAN"
  | "PLUMBER"
  | "LABOUR"
  | "MASON"
  | "WELDER"
  | "Others";

export type PassengerStatus =
  | "Passport Submit"
  | "Medical Done"
  | "Workpermit Issue"
  | "Visa Online"
  | "Embassy Submit"
  | "Visa Reject"
  | "Passport Return"
  | "Manpower Done"
  | "Flight Done"
  | "Processing Cancelled"
  | "Others";

export interface PassengerDoc {
  name: string;
  url: string;
}

export interface HistoryEntry {
  status: PassengerStatus;
  updatedBy: string;
  updatedByUid: string;
  timestamp: string;
}

export type ReqDocStatus = "Pending" | "Uploaded" | "Verified";

export interface RequiredDocument {
  type: string;
  status: ReqDocStatus;
  fileUrl?: string;
  fileName?: string;
  lastUpdated?: string;
}

export interface Passenger {
  id?: string;
  sl?: number;
  name: string;
  passportNumber?: string;
  photoUrl?: string;
  inOut: "In" | "Out" | string;
  companyName?: string;
  phone: string;
  tradeName: string;
  agentName: string;
  delegateAgent?: string;
  agentNumber: string;
  reference: string;
  date: string;
  submissionDate?: string;
  status: PassengerStatus;
  country: string;
  passengerType?: PassengerType;
  documents: PassengerDoc[];
  requiredDocs?: Record<string, RequiredDocument>;
  history: HistoryEntry[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  visaRate?: number;
  agentRate?: number;
  profit?: number;
  paidAmount?: number;
  dueAmount?: number;
  systemNote?: string;
  
  // New Fields (CV / Extra Information)
  fatherName?: string;
  fatherDOB?: string;
  motherName?: string;
  motherDOB?: string;
  wifeName?: string;
  wifeDOB?: string;
  children?: string;
  candidateDOB?: string;
  age?: string;
  placeOfBirth?: string;
  religion?: string;
  maritalStatus?: string;
  height?: string;
  weight?: string;
  placeOfIssue?: string;
  dateOfIssue?: string;
  dateOfExpire?: string;
  computerSkill?: string;
  permanentAddress?: string;
  presentAddress?: string;
  englishLevel?: string;
  banglaLevel?: string;
  experienceCertificateNo?: string;
  primarySkill?: string;
  licenseNo?: string;
  overseasCountry?: string;
  workDescriptionTitle?: string;
  workDescriptionText?: string;
  
  // Extra fields for the new template
  nationality?: string;
  selectionStatus?: string;
  grade?: string;
  educationalQualification?: string;
  experienceDetails?: string;
  remarks?: string;
}
