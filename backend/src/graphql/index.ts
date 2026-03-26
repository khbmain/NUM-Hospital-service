import { makeExecutableSchema } from "@graphql-tools/schema";
import typeDefs from "./typeDefs/index";
import { resolvers } from "./resolvers/index";
import { PubSub } from "graphql-subscriptions";

export const pubsub = new PubSub();

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
