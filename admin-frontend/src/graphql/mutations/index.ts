import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation LoginUser($phone: String!, $password: String!) {
    loginUser(phone: $phone, password: $password) { user { _id firstname lastname role phone email } }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateMe($input: UpdateProfileInput!) {
    updateMe(input: $input) {
      _id
      firstname
      lastname
      email
      phone
      gender
      role
      status
    }
  }
`;

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($password: String!, $newPassword: String!) {
    changePassword(password: $password, newPassword: $newPassword)
  }
`;

export const UPDATE_SATISFACTION_SURVEY_TEMPLATE = gql`
  mutation UpdateSatisfactionSurveyTemplate($input: UpdateSatisfactionSurveyTemplateInput!) {
    updateSatisfactionSurveyTemplate(input: $input) {
      _id
      title
      description
      currentVersion
      questions {
        key
        label
        category
        order
        active
      }
      versions {
        version
        title
        validFrom
        validTo
        questions { key active }
      }
      updatedAt
    }
  }
`;

export const REMOVE_SATISFACTION_SURVEY_TEMPLATE = gql`
  mutation RemoveSatisfactionSurveyTemplate {
    removeSatisfactionSurveyTemplate {
      action
      deleted
      archived
      responseCount
      template {
        _id
        title
        active
        archivedAt
      }
    }
  }
`;

export const CREATE_PATIENT = gql`
  mutation CreatePatient($input: CreatePatientInput!) {
    createPatient(input: $input) { _id registrationNumber firstname lastname phone email category }
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
    createDiagnosis(input: $input) { _id name icdCode icdTitle icdLinearizationUri icdFoundationUri type severity }
  }
`;

export const SEED_DEFAULT_SCHEDULING = gql`
  mutation SeedDefaultScheduling {
    seedDefaultScheduling
  }
`;

export const CREATE_UNAVAILABLE_BLOCK = gql`
  mutation CreateUnavailableBlock($input: CreateUnavailableBlockInput!) {
    createUnavailableBlock(input: $input) {
      _id
      startAt
      endAt
      reason
      resource { name }
      staff { userId { firstname lastname } }
      cancelledAppointments { _id }
    }
  }
`;

export const UPDATE_UNAVAILABLE_BLOCK = gql`
  mutation UpdateUnavailableBlock($id: ID!, $input: UpdateUnavailableBlockInput!) {
    updateUnavailableBlock(_id: $id, input: $input) {
      _id
      startAt
      endAt
      reason
      note
      status
    }
  }
`;

export const CANCEL_UNAVAILABLE_BLOCK = gql`
  mutation CancelUnavailableBlock($id: ID!) {
    cancelUnavailableBlock(_id: $id) {
      _id
      status
      cancelledAt
    }
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

export const CREATE_SERVICE = gql`
  mutation CreateService($input: CreateServiceInput!) {
    createService(input: $input) {
      _id
      name
      code
      category
      description
      defaultDurationMinutes
      defaultBufferMinutes
      requiresDoctor
      requiresNurse
      requiresDevice
      assignedStaffs { _id staffType userId { _id firstname lastname } }
      isActive
    }
  }
`;

export const UPDATE_SERVICE = gql`
  mutation UpdateService($id: ID!, $input: UpdateServiceInput!) {
    updateService(_id: $id, input: $input) {
      _id
      name
      code
      category
      description
      defaultDurationMinutes
      defaultBufferMinutes
      requiresDoctor
      requiresNurse
      requiresDevice
      assignedStaffs { _id staffType userId { _id firstname lastname } }
      isActive
    }
  }
`;

export const CREATE_RESOURCE = gql`
  mutation CreateResource($input: CreateResourceInput!) {
    createResource(input: $input) {
      _id
      name
      type
      category
      room
      capacity
      slotIntervalMinutes
      defaultDurationMinutes
      defaultBufferMinutes
      isActive
      services { _id name }
      staff { _id userId { firstname lastname } specialization }
    }
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
