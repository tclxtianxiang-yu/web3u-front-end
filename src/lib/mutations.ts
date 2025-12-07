import { gql } from 'graphql-request';

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
    }
  }
`;

export const GENERATE_VIDEO_UPLOAD_URL_MUTATION = gql`
  mutation GenerateVideoUploadUrl($input: CreateUploadUrlInput!) {
    generateVideoUploadUrl(input: $input) {
      uploadUrl
      key
      publicUrl
    }
  }
`;

export const CREATE_REVIEW_MUTATION = gql`
  mutation CreateReview($input: CreateReviewInput!) {
    createReview(createReviewInput: $input) {
      id
      rating
      comment
      createdAt
    }
  }
`;

export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      walletAddress
      username
      email
      avatarUrl
    }
  }
`;
