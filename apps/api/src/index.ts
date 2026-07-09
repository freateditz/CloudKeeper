import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./modules/auth/auth.routes";
import accountsRoutes from "./modules/accounts/accounts.routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/accounts", accountsRoutes);

app.listen(3001, () => {
  console.log("API Server running on port 3001");
});
