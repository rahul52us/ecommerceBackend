import UserRouter from "./auth.routes";

const importRoutings = (app: any) => {
    app.use("/api/auth", UserRouter);
}

export default importRoutings;