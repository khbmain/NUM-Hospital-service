import express, { RequestHandler } from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPlugin } from "@apollo/server";

import typeDefs from "./graphql/typeDefs/index";
import { resolvers } from "./graphql/resolvers/index";
import { schema } from "./graphql/index";
import { context } from "./graphql/context";
import oauthRoutes from "./routes/oauthRoutes";
import healthRoutes from "./routes/healthRoutes";
import { MONGODB_URI, NODE_ENV, PORT as ENV_PORT, PATIENT_FRONTEND_URL, ADMIN_FRONTEND_URL } from "./utils/constants";
import { useServer } from "graphql-ws/use/ws";
import { graphqlUploadExpress } from "graphql-upload";
import { scheduleCronJobs } from "./cron/scheduler";

const app = express();
const PORT = ENV_PORT || 4000;
const httpServer = createServer(app);

// WebSocket server for subscriptions
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/subscriptions",
});

const serverCleanup = useServer({ schema, context }, wsServer);

// Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: NODE_ENV !== "development",
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    } as ApolloServerPlugin,
  ],
});

// Allowed origins
const allowedOrigins = [
  PATIENT_FRONTEND_URL,
  ADMIN_FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

// Middleware
app.use(
  NODE_ENV === "development"
    ? cors()
    : cors({
        origin: function (origin, callback) {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
        credentials: true,
      })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(
  graphqlUploadExpress({
    maxFileSize: 10 * 1024 * 1024,
    maxFiles: 10,
  }) as unknown as RequestHandler
);

// Health check
app.get("/", (_req, res) => {
  res.status(200).json({
    service: "NUM Hospital Backend",
    status: "running",
    env: NODE_ENV,
  });
});

// REST routes
app.use("/", healthRoutes);
app.use("/", oauthRoutes);

// Start
server.start().then(async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }

  // Mount GraphQL
  app.use(
    "/graphql",
    expressMiddleware(server, { context })
  );

  // Cron jobs
  scheduleCronJobs();

  // Debug mode in development
  if (NODE_ENV === "development") mongoose.set("debug", true);

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}/graphql`);
    console.log(`🔌 WebSocket at ws://localhost:${PORT}/subscriptions`);
    console.log(`🔑 OAuth callback at http://localhost:${PORT}/auth/sisi/callback`);
  });
});
