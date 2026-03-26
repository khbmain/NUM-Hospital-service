import { ContextFunction } from "@apollo/server";
import { ExpressContextFunctionArgument } from "@apollo/server/express4";
import { DecodedToken, decodeToken } from "../utils/auth";
import { PubSub } from "graphql-subscriptions";
import { pubsub } from "./index";

export type ContextType = DecodedToken & {
  req: ExpressContextFunctionArgument["req"];
  res: ExpressContextFunctionArgument["res"];
  authenticated: boolean;
  pubsub: PubSub;
};

export const context: ContextFunction<
  [ExpressContextFunctionArgument],
  ContextType
> = async ({ req, res }) => {
  try {
    const token = req.headers.authorization || "";
    if (token) {
      const decoded = decodeToken(token.replace("Bearer ", ""));
      return {
        ...decoded,
        authenticated: true,
        pubsub,
        req,
        res,
      } as ContextType;
    }
  } catch (err) {
    // Token invalid or expired — continue as unauthenticated
  }

  return {
    _id: "",
    exp: 0,
    iat: 0,
    phone: "",
    role: "",
    authenticated: false,
    pubsub,
    req,
    res,
  } as ContextType;
};
