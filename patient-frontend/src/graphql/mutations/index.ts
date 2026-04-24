import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation LoginUser($phone: String!, $password: String!) {
    loginUser(phone: $phone, password: $password) {
      token
      user {
        _id
        firstname
        lastname
        role
        phone
      }
    }
  }
`;

export const SEND_EMAIL_LOGIN_OTP = gql`
  mutation SendEmailLoginOTP($email: String!) {
    sendEmailLoginOTP(email: $email)
  }
`;

export const LOGIN_WITH_EMAIL_OTP = gql`
  mutation LoginWithEmailOTP($email: String!, $code: String!) {
    loginWithEmailOTP(email: $email, code: $code) {
      token
      user {
        _id
        firstname
        lastname
        role
        phone
        email
      }
    }
  }
`;

export const CREATE_APPOINTMENT = gql`
  mutation CreateAppointment($input: CreateAppointmentInput!) {
    createAppointment(input: $input) {
      _id
      scheduledDate
      scheduledTime
      scheduledStart
      scheduledEnd
      status
      queueNumber
      service { name }
      resource { name }
      doctor {
        userId { firstname lastname }
        department { name }
      }
    }
  }
`;

export const UPSERT_MY_PATIENT_PROFILE = gql`
  mutation UpsertMyPatientProfile($input: PatientProfileInput!) {
    upsertMyPatientProfile(input: $input) {
      _id
      registrationNumber
      firstname
      lastname
      phone
      email
      gender
      birthdate
      bloodType
      allergies
      chronicConditions
      regularMedications
      medicalWarnings
      emergencyContact { name phone relationship }
      address
      notes
      profileCompletedAt
    }
  }
`;

export const CANCEL_APPOINTMENT = gql`
  mutation CancelAppointment($id: ID!, $reason: String) {
    cancelAppointment(_id: $id, reason: $reason) {
      _id
      status
    }
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
    }
  }
`;
