import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation LoginUser($phone: String!, $password: String!) {
    loginUser(phone: $phone, password: $password) { token user { _id firstname lastname role phone } }
  }
`;

export const CREATE_PATIENT = gql`
  mutation CreatePatient($input: CreatePatientInput!) {
    createPatient(input: $input) { _id registrationNumber firstname lastname phone category }
  }
`;

export const UPDATE_PATIENT = gql`
  mutation UpdatePatient($id: ID!, $input: UpdatePatientInput!) {
    updatePatient(_id: $id, input: $input) { _id firstname lastname phone }
  }
`;

export const CREATE_APPOINTMENT = gql`
  mutation CreateAppointment($input: CreateAppointmentInput!) {
    createAppointment(input: $input) { _id scheduledDate scheduledTime status queueNumber }
  }
`;

export const CHECK_IN_APPOINTMENT = gql`
  mutation CheckIn($id: ID!) { checkInAppointment(_id: $id) { _id status checkedInAt } }
`;

export const CANCEL_APPOINTMENT = gql`
  mutation CancelAppointment($id: ID!, $reason: String) {
    cancelAppointment(_id: $id, reason: $reason) { _id status }
  }
`;

export const START_APPOINTMENT = gql`
  mutation StartAppointment($id: ID!) { startAppointment(_id: $id) { _id status } }
`;

export const CREATE_VISIT = gql`
  mutation CreateVisit($input: CreateVisitInput!) {
    createVisit(input: $input) { _id visitDate status }
  }
`;

export const UPDATE_VISIT = gql`
  mutation UpdateVisit($id: ID!, $input: UpdateVisitInput!) {
    updateVisit(_id: $id, input: $input) { _id status chiefComplaint assessment }
  }
`;

export const COMPLETE_VISIT = gql`
  mutation CompleteVisit($id: ID!) { completeVisit(_id: $id) { _id status completedAt } }
`;

export const RECORD_VITALS = gql`
  mutation RecordVitals($visitId: ID!, $input: VitalSignInput!) {
    recordVitalSigns(visitId: $visitId, input: $input) {
      _id temperature bloodPressureSystolic bloodPressureDiastolic heartRate oxygenSaturation
    }
  }
`;

export const CREATE_DIAGNOSIS = gql`
  mutation CreateDiagnosis($input: CreateDiagnosisInput!) {
    createDiagnosis(input: $input) { _id name icdCode type severity }
  }
`;

export const CREATE_PRESCRIPTION = gql`
  mutation CreatePrescription($input: CreatePrescriptionInput!) {
    createPrescription(input: $input) { _id prescriptionNumber items { medicationName dosage frequency } status }
  }
`;

export const CREATE_STAFF = gql`
  mutation CreateStaff($input: CreateStaffInput!) {
    createStaff(input: $input) { _id staffType specialization }
  }
`;

export const CREATE_DEPARTMENT = gql`
  mutation CreateDepartment($input: CreateDepartmentInput!) {
    createDepartment(input: $input) { _id name code }
  }
`;

export const REGISTER_USER = gql`
  mutation RegisterUser($input: RegisterUserInput!) {
    registerUser(input: $input) { _id firstname lastname phone role }
  }
`;
