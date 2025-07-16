import { gql } from "@apollo/client";

export const LIST_DOCUMENTS_BY_USER_BY_TIME = gql`
  query ListDocumentsByUserByTime {
    listDocumentsByUserByTime {
      document_id
      file_title
      upload_timestamp
      page_count
      file_size
    }
  }
`;
