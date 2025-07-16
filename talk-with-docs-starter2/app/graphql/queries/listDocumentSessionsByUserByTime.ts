import { gql } from "@apollo/client";

export const LIST_DOCUMENT_SESSIONS_BY_USER_BY_TIME = gql`
  query ListDocumentSessionsByUserByTime {
    listDocumentSessionsByUserByTime {
      id
      document_id
      title
      created_at
      updated_at
    }
  }
`;
