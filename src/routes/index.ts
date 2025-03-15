import UserRouter from "./auth.routes";
import CompanyRouter from './company.routes'

const importRoutings = (app: any) => {
    app.use("/api/auth", UserRouter);
    app.use('/api/company',CompanyRouter)
}

export default importRoutings;