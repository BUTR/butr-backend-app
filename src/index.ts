import updateChecker from "./routes/update-checker";
import shields from "./routes/shields";
import downloads from "./routes/downloads";
import { IApplicationError, IApplicationErrorMessage } from "./types";
import { NextFunction, Request, Response } from "express-serve-static-core";

import debug from "debug";
import express = require("express");
import bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/update-checker", updateChecker);
app.use("/shields", shields);
app.use("/downloads", downloads);


app.use((_req, _res, next) => {
    next({ message: "Not Found", status: 404 } as IApplicationError);
});
app.use((err: IApplicationError, _req: Request, res: Response<IApplicationErrorMessage>, _next: NextFunction) => {
    res.status(err.status || 500);
    res.send({ message: err.message })
});


app.set("port", process.env["PORT"] || 3000);

const server = app.listen(app.get("port"), () => {
    debug(`Express server listening on port ${server.address().port}`);
});