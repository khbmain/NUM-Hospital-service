import { GraphQLUpload } from "graphql-upload";
import { GraphQLDateTimeISO } from "graphql-scalars";
import { GraphQLScalarType } from "graphql";

// Auth / User
import {
  me, getUser, listUsers,
  loginUser, registerUser, updateMe,
  changePassword, forgotPassword, verifyOTP,
  initiateOAuth, sendEmailLoginOTP, loginWithEmailOTP,
} from "../../services/authService";

// Patient
import {
  searchPatients, getPatient, getPatientByRegistration, getMyPatientProfile,
  createPatient, updatePatient,
} from "../../services/patientService";

// Staff
import {
  listStaff, getStaff, getDoctors, listDepartments,
  createStaff, updateStaff, createDepartment, updateDepartment,
} from "../../services/staffService";

// Appointment
import {
  getAppointment, listAppointments, getMyAppointments,
  getDoctorQueue, getAvailableSlots,
  createAppointment, checkInAppointment, cancelAppointment,
  startAppointment, completeAppointment, markNoShow,
} from "../../services/appointmentService";

// Visit
import {
  getVisit, listVisitsByPatient, getMyVisitHistory, getTodayVisits,
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

const DateScalar = new GraphQLScalarType({
  ...GraphQLDateTimeISO.toConfig(),
  name: "Date",
});

export const resolvers = {
  Query: {
    // Auth
    me,
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

    // Appointment
    getAppointment,
    listAppointments,
    getMyAppointments,
    getDoctorQueue,
    getAvailableSlots,

    // Visit
    getVisit,
    listVisitsByPatient,
    getMyVisitHistory,
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

    // Staff
    createStaff,
    updateStaff,
    createDepartment,
    updateDepartment,

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

  // Scalar types
  Date: DateScalar,
  Upload: GraphQLUpload,
};
