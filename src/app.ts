import express, {type Application,type Request,type Response,} from "express";
import { authRouter } from "./moules/auth/auth.route";




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



export default app;