import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
} from "@apollo/client";
import { createAuthLink } from "aws-appsync-auth-link";

export const createAppSyncClient = (idToken: string) => {
  const url = process.env.APPSYNC_GRAPHQL_ENDPOINT!;
  const region = process.env.AWS_REGION!;

  console.log('================')
//   console.log('idToken', idToken)

  return new ApolloClient({
    link: ApolloLink.from([
      createAuthLink({
        url,
        region,
        auth: {
          type: "AMAZON_COGNITO_USER_POOLS",
          jwtToken: idToken,
        },
        // Add debugging to see what's happening with the token
        // complexObjectSupport: true,
      }),
      new HttpLink({
        uri: url,
        fetch,
        // headers: {
        //   Authorization: idToken,
        // },
      }),
    ]),
    cache: new InMemoryCache(),
    ssrMode: true,
  });
};
