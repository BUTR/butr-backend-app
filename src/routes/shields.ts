import fetch from "node-fetch";
import { ParamsDictionary } from "express-serve-static-core";

import express = require("express");

interface IRequestQuery {
    gameId: number;
    modId: number;
}
interface IRequestBody {

}
interface IResponseBody {
    schemaVersion: number;
    label: string;
    message: string;
    color: string;
}

const apiUrl = "https://api.nexusmods.com/";
const apiKey = process.env["NEXUSMODS_APIKEY"];

const router = express.Router();

router.get("/",
    async (req: express.Request<ParamsDictionary, IResponseBody, IRequestBody, IRequestQuery>, res: express.Response<IResponseBody>) => {
        res.type("application/json");

        if (!apiKey) {
            res.send({ schemaVersion: 1, label: "Version", message: "Invalid 'NEXUSMODS_APIKEY'!", color: "red" });
        }
        if (!req.query.gameId || !req.query.modId) {
            res.send({ schemaVersion: 1, label: "Version", message: "Invalid gameId or modId!", color: "red" });
        }

        const response = await fetch(
            `${apiUrl}/v1/games/${req.query.gameId}/mods/${req.query.modId}.json`,
            {
                method: "GET",
                headers: { 'apikey': apiKey, 'Content-Type': "application/json" },
            })
            .then(resp => resp.json());

        if (!response.version) {
            res.send({ schemaVersion: 1, label: "Version", message: "Invalid 'version' from NexusMods!", color: "red" });
        }

        res.send({ schemaVersion: 1, label: "Version", message: response.version, color: "yellow" });
    }
);

export default router;