import express, {type Application,type Request,type Response,} from "express";
import { authRouter } from "./moules/auth/auth.route";
import { IssueRouter } from "./moules/issues/issue.route";
import {globalErrorHandler} from "./middleware/globalErrorHandler";
import {notFound} from "./middleware/notFound";





const app: Application = express();


// Middlewares

app.use(express.json());
app.use(express.json());//to parse incoming JSON data
app.use(express.text());//to parse incoming text data
app.use(express.urlencoded({extended:true}))





app.get(
  "/",
  (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: "Server is Running",
    });
  }
);


app.use("/api/auth",authRouter);
app.use('/api/issues',IssueRouter);


app.use(globalErrorHandler);
app.use(notFound);

export default app;