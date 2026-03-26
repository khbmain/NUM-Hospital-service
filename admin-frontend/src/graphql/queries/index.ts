import { gql } from '@apollo/client';

export const ME_QUERY = gql`
  query Me { me { _id firstname lastname email phone role gender profilePic status } }
`;

export const SEARCH_PATIENTS = gql`
  query SearchPatients($query: String!, $page: Int, $limit: Int) {
    searchPatients(query: $query, page: $page, limit: $limit) {
      patients { _id registrationNumber firstname lastname phone email gender birthdate category status createdAt }
      total page limit
    }
  }
`;

export const GET_PATIENT = gql`
  query GetPatient($id: ID!) {
    getPatient(_id: $id) {
      _id registrationNumber firstname lastname phone email gender birthdate category
      universityId bloodType allergies emergencyContact { name phone relationship }
      address notes status createdAt
    }
  }
`;

export const LIST_APPOINTMENTS = gql`
  query ListAppointments($filter: AppointmentFilterInput!) {
    listAppointments(filter: $filter) {
      appointments {
        _id scheduledDate scheduledTime type status queueNumber chiefComplaint
        patient { _id registrationNumber firstname lastname phone }
        doctor { _id userId { firstname lastname } specialization department { name } }
        createdAt
      }
      total
    }
  }
`;

export const DOCTOR_QUEUE = gql`
  query DoctorQueue($doctorId: ID!, $date: Date!) {
    getDoctorQueue(doctorId: $doctorId, date: $date) {
      _id scheduledDate scheduledTime type status queueNumber chiefComplaint
      patient { _id registrationNumber firstname lastname phone birthdate gender }
    }
  }
`;

export const GET_VISIT = gql`
  query GetVisit($id: ID!) {
    getVisit(_id: $id) {
      _id visitDate status chiefComplaint historyOfPresentIllness physicalExamination
      assessment plan notes completedAt
      patient { _id registrationNumber firstname lastname phone birthdate gender bloodType allergies }
      doctor { _id userId { firstname lastname } specialization }
      vitalSigns { temperature bloodPressureSystolic bloodPressureDiastolic heartRate respiratoryRate oxygenSaturation weight height }
      diagnoses { _id name icdCode type severity notes createdAt }
      prescriptions { _id prescriptionNumber items { medicationName dosage frequency duration quantity unit instructions } notes status createdAt }
    }
  }
`;

export const VISITS_BY_PATIENT = gql`
  query VisitsByPatient($patientId: ID!, $page: Int, $limit: Int) {
    listVisitsByPatient(patientId: $patientId, page: $page, limit: $limit) {
      _id visitDate status chiefComplaint assessment
      doctor { userId { firstname lastname } specialization }
      diagnoses { _id name type }
      completedAt
    }
  }
`;

export const TODAY_VISITS = gql`
  query TodayVisits($doctorId: ID) {
    getTodayVisits(doctorId: $doctorId) {
      _id visitDate status chiefComplaint
      patient { _id registrationNumber firstname lastname }
    }
  }
`;

export const GET_DOCTORS = gql`
  query GetDoctors($departmentId: ID) {
    getDoctors(departmentId: $departmentId) {
      _id userId { _id firstname lastname } specialization department { _id name } isAvailable
    }
  }
`;

export const LIST_DEPARTMENTS = gql`
  query ListDepartments { listDepartments { _id name code description isActive } }
`;

export const LIST_STAFF = gql`
  query ListStaff($staffType: String, $departmentId: ID) {
    listStaff(staffType: $staffType, departmentId: $departmentId) {
      _id userId { _id firstname lastname phone email role status }
      department { _id name } staffType specialization licenseNumber title isAvailable status createdAt
    }
  }
`;

export const PRESCRIPTIONS_BY_PATIENT = gql`
  query PrescriptionsByPatient($patientId: ID!) {
    getPrescriptionsByPatient(patientId: $patientId) {
      _id prescriptionNumber items { medicationName dosage frequency duration quantity unit } notes status createdAt
      doctor { userId { firstname lastname } }
    }
  }
`;

export const DIAGNOSES_BY_VISIT = gql`
  query DiagnosesByVisit($visitId: ID!) {
    getDiagnosesByVisit(visitId: $visitId) { _id name icdCode type severity notes createdAt }
  }
`;
