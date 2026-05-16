import { GraphQLUpload } from "graphql-upload";
import { GraphQLDateTimeISO } from "graphql-scalars";
import { GraphQLScalarType } from "graphql";

// Auth / User
import {
  me, getUser, listUsers,
  loginUser, logoutUser, registerUser, updateMe,
  changePassword, forgotPassword, verifyOTP,
  initiateOAuth, sendEmailLoginOTP, loginWithEmailOTP,
} from "../../services/authService";

// Patient
import {
  searchPatients, getPatient, getPatientByRegistration, getMyPatientProfile,
  createPatient, updatePatient, upsertMyPatientProfile,
} from "../../services/patientService";

// Staff
import {
  listStaff, getStaff, getDoctors, listDepartments,
  createStaff, updateStaff, createDepartment, updateDepartment,
} from "../../services/staffService";

// Appointment
import {
  getAppointment, listAppointments, getMyAppointments,
  getDoctorQueue,
  createAppointment, checkInAppointment, cancelAppointment,
  startAppointment, completeAppointment, markNoShow,
} from "../../services/appointmentService";

import {
  listServices, listResources, getAvailableSlots,
  createService, updateService, createResource, updateResource, seedDefaultScheduling,
  listUnavailableBlocks, createUnavailableBlock, updateUnavailableBlock, cancelUnavailableBlock,
} from "../../services/schedulingService";

import { icd11RootChapters, icd11Children, icd11Search } from "../../services/icdService";
import { monthlyReport } from "../../services/reportService";
import {
  getActiveSatisfactionSurveyTemplate,
  getMySatisfactionSurvey,
  getMySatisfactionSurveyRequirement,
  listSatisfactionSurveys,
  removeSatisfactionSurveyTemplate,
  submitSatisfactionSurvey,
  updateSatisfactionSurveyTemplate,
} from "../../services/satisfactionSurveyService";

// Visit
import {
  getVisit, listVisitsByPatient, getMyVisitHistory, getMyVisitByAppointment, getTodayVisits,
  createVisit, updateVisit, completeVisit, recordVitalSigns,
  resolveVisitVitalSigns, resolveVisitDiagnoses, resolveVisitPrescriptions,
} from "../../services/visitService";

// Diagnosis
import {
  getDiagnosesByVisit, getDiagnosesByPatient, getMyDiagnoses,
  createDiagnosis, updateDiagnosis, deleteDiagnosis,
} from "../../services/diagnosisService";

// Prescription
import {
  getPrescription, getPrescriptionsByVisit, getPrescriptionsByPatient,
  getMyPrescriptions,
  createPrescription, updatePrescriptionStatus,
} from "../../services/prescriptionService";

// Notification
import {
  getMyNotifications, readNotifications,
} from "../../services/notificationService";
import { Staff } from "../../models/staffModel";
import { listAuditLogs } from "../../services/auditService";

const DateScalar = new GraphQLScalarType({
  ...GraphQLDateTimeISO.toConfig(),
  name: "Date",
});

export const resolvers = {
  Query: {
    // Auth
    me,
    listAuditLogs,
    getUser,
    listUsers,

    // Patient
    searchPatients,
    getPatient,
    getPatientByRegistration,
    getMyPatientProfile,

    // Staff
    listStaff,
    getStaff,
    getDoctors,
    listDepartments,
    listServices,
    listResources,
    listUnavailableBlocks,

    // Appointment
    getAppointment,
    listAppointments,
    getMyAppointments,
    getDoctorQueue,
    getAvailableSlots,
    icd11RootChapters,
    icd11Children,
    icd11Search,
    monthlyReport,
    getActiveSatisfactionSurveyTemplate,
    getMySatisfactionSurvey,
    getMySatisfactionSurveyRequirement,
    listSatisfactionSurveys,

    // Visit
    getVisit,
    listVisitsByPatient,
    getMyVisitHistory,
    getMyVisitByAppointment,
    getTodayVisits,

    // Diagnosis
    getDiagnosesByVisit,
    getDiagnosesByPatient,
    getMyDiagnoses,

    // Prescription
    getPrescription,
    getPrescriptionsByVisit,
    getPrescriptionsByPatient,
    getMyPrescriptions,

    // Notification
    getMyNotifications,
  },

  Mutation: {
    // Auth
    loginUser,
    logoutUser,
    sendEmailLoginOTP,
    loginWithEmailOTP,
    registerUser,
    updateMe,
    changePassword,
    forgotPassword,
    verifyOTP,
    initiateOAuth,

    // Patient
    createPatient,
    updatePatient,
    upsertMyPatientProfile,

    // Staff
    createStaff,
    updateStaff,
    createDepartment,
    updateDepartment,
    createService,
    updateService,
    createResource,
    updateResource,
    seedDefaultScheduling,
    createUnavailableBlock,
    updateUnavailableBlock,
    cancelUnavailableBlock,

    // Appointment
    createAppointment,
    checkInAppointment,
    cancelAppointment,
    startAppointment,
    completeAppointment,
    markNoShow,

    // Visit
    createVisit,
    updateVisit,
    completeVisit,
    recordVitalSigns,

    // Diagnosis
    createDiagnosis,
    updateDiagnosis,
    deleteDiagnosis,

    // Prescription
    createPrescription,
    updatePrescriptionStatus,

    // Notification
    readNotifications,
    submitSatisfactionSurvey,
    updateSatisfactionSurveyTemplate,
    removeSatisfactionSurveyTemplate,
  },

  Subscription: {
    notification: {
      subscribe: (_: any, __: any, ctx: any) => {
        return ctx.pubsub.asyncIterableIterator("NOTIFICATION");
      },
    },
  },

  // ─── Field Resolvers ───
  Visit: {
    patient: (parent: any) => parent.patientId, // already populated
    doctor: (parent: any) => parent.doctorId,
    appointment: (parent: any) => parent.appointmentId,
    vitalSigns: resolveVisitVitalSigns,
    diagnoses: resolveVisitDiagnoses,
    prescriptions: resolveVisitPrescriptions,
  },

  Appointment: {
    patient: (parent: any) => parent.patientId,
    doctor: (parent: any) => parent.doctorId,
    nurse: (parent: any) => parent.nurseId,
    assignedStaff: (parent: any) => parent.assignedStaffId,
    service: (parent: any) => parent.serviceId,
    resource: (parent: any) => parent.resourceId,
    department: (parent: any) => parent.departmentId,
    checkedInBy: (parent: any) => parent.checkedInBy,
    createdBy: (parent: any) => parent.createdBy,
  },

  Staff: {
    userId: (parent: any) => parent.userId,
    department: (parent: any) => parent.departmentId,
  },

  Diagnosis: {
    visit: (parent: any) => parent.visitId,
    patient: (parent: any) => parent.patientId,
    doctor: (parent: any) => parent.doctorId,
  },

  Prescription: {
    visit: (parent: any) => parent.visitId,
    patient: (parent: any) => parent.patientId,
    doctor: (parent: any) => parent.doctorId,
  },

  Patient: {
    userId: (parent: any) => parent.userId,
    registeredBy: (parent: any) => parent.registeredBy,
  },

  AuditLog: {
    user: (parent: any) => parent.userId,
  },

  Resource: {
    staff: (parent: any) => parent.staffId,
    services: (parent: any) => parent.serviceIds,
  },

  Service: {
    assignedStaffs: async (parent: any) => {
      const assignedStaffs = parent.assignedStaffIds || [];
      if (!assignedStaffs.length) return [];

      if (assignedStaffs[0]?.staffType) return assignedStaffs;

      return Staff.find({ _id: { $in: assignedStaffs } }).populate("userId departmentId");
    },
  },

  UnavailableBlock: {
    service: (parent: any) => parent.serviceId,
    resource: (parent: any) => parent.resourceId,
    staff: (parent: any) => parent.staffId,
    cancelledAppointments: (parent: any) => parent.cancelledAppointmentIds,
    createdBy: (parent: any) => parent.createdBy,
    cancelledBy: (parent: any) => parent.cancelledBy,
  },

  // Scalar types
  Date: DateScalar,
  Upload: GraphQLUpload,
};
