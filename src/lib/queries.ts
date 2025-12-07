import { gql } from 'graphql-request';

export const GET_COURSES = gql`
  query GetCourses($status: String, $teacherWalletAddress: String) {
    courses(status: $status, teacherWalletAddress: $teacherWalletAddress) {
      id
      title
      description
      priceYd
      category
      thumbnailUrl
      status
      teacherWalletAddress
      rating
      reviewCount
    }
  }
`;

export const GET_COURSE = gql`
  query GetCourse($id: ID!) {
    course(id: $id) {
      id
      title
      description
      priceYd
      category
      thumbnailUrl
      videoUrl
      status
      createdAt
      teacherWalletAddress
      rating
      reviewCount
      reviews {
        id
        studentWalletAddress
        rating
        comment
        createdAt
        student {
          username
          walletAddress
        }
      }
    }
    courseLessons(courseId: $id) {
      id
      title
      duration
      isFree
      lessonNumber
    }
  }
`;

export const GET_USER = gql`
  query GetUser($walletAddress: String!) {
    user(walletAddress: $walletAddress) {
      walletAddress
      username
      email
      role
      ydTokenBalance
    }
  }
`;

export const GET_ME = gql`
  query GetMe {
    me {
      walletAddress
      username
      email
      role
      avatarUrl
      ydTokenBalance
    }
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(createUserInput: $input) {
      walletAddress
      username
      role
    }
  }
`;

export const CREATE_COURSE = gql`
  mutation CreateCourse($input: CreateCourseInput!) {
    createCourse(createCourseInput: $input) {
      id
      title
      status
    }
  }
`;

export const GET_LEARNING_RECORDS = gql`
  query GetLearningRecords($userWalletAddress: String!, $courseId: ID) {
    learningRecords(userWalletAddress: $userWalletAddress, courseId: $courseId) {
      id
      courseId
      lessonId
      progressPercentage
      completed
      lastWatchedAt
    }
  }
`;

export const GET_TRANSACTIONS = gql`
  query GetTransactions($walletAddress: String!) {
    transactions(walletAddress: $walletAddress) {
      id
      fromWalletAddress
      toWalletAddress
      amountYd
      transactionType
      status
      transactionHash
      createdAt
      metadata
    }
  }
`;