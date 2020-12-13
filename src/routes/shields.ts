import fetch from "node-fetch";
import { ParamsDictionary } from "express-serve-static-core";

import express = require("express");

interface IRequestQuery {
    gameId: string;
    modId: string;
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
            res.send(errorMsg("Invalid 'NEXUSMODS_APIKEY'!"));
        }
        if (!req.query.gameId || !req.query.modId) {
            res.send(errorMsg("Invalid 'gameId' or 'modId'!"));
        }

        const response = await fetch(
            `${apiUrl}/v1/games/${req.query.gameId}/mods/${req.query.modId}.json`,
            { method: "GET", headers: { 'apikey': apiKey, 'Content-Type': "application/json" } })
            .then(resp => resp.json())
            .then(json => {
                if (!json.version) {
                    return errorMsg("Invalid 'version' from NexusMods!");
                }
                return successMsg(json.version);
            })
            .catch(err => errorMsg("Error while getting download count!"));

        res.send(response);
    }
);

function successMsg(message: string): IResponseBody {
    return { schemaVersion: 1, label: "Version", message: message, color: "yellow" }
}
function errorMsg(message: string): IResponseBody {
    return { schemaVersion: 1, label: "Version", message: message, color: "red" }
}

export default router;