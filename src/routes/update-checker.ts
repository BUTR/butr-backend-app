import fetch from "node-fetch";
import { ParamsDictionary } from "express-serve-static-core";
import { IApplicationErrorMessage } from "../types";

import express = require("express");

import semver = require("semver")

interface IRequestBodyModData {
    id: string;
    version: string;
    url: string;
}
interface IResponseBodyModData {
    id: string;
    newVersion: string;
}
interface IRequestQuery {

}
interface IRequestBody {
    modData: IRequestBodyModData[];
}
interface IResponseBody {
    modData?: IResponseBodyModData[];
}

const apiUrl = "https://api.nexusmods.com/";
const apiKey = process.env["NEXUSMODS_APIKEY"];

const router = express.Router();

router.post("/",
    async (req: express.Request<ParamsDictionary, IResponseBody, IRequestBody, IRequestQuery>, res: express.Response<IResponseBody | IApplicationErrorMessage>) => {
        res.type("application/json");

        if (!apiKey) {
            res.send({ message: "Invalid 'NEXUSMODS_APIKEY'!" });
        }

        if (!req.body.modData) {
            res.send({ message: "Invalid 'modData'!" });
        }

        const arr = Array<IResponseBodyModData>();
        for (const modData of req.body.modData) {
            if (!modData.id || !modData.version  || !modData.url ) {
                continue;
            }

            let str: IResponseBodyModData;
            if (modData.url.includes("nexusmods")) {
                str = await nexusmods(modData);
            }
            if (modData.url.includes("github")) {
                str = await github(modData);
            }
            if (str) {
                arr.push(str);
            }
        }

        res.send({ modData: arr });
    }
);

async function github(modData: IRequestBodyModData): Promise<IResponseBodyModData | null> {
    return null;
}

async function nexusmods(modData: IRequestBodyModData): Promise<IResponseBodyModData | null> {
    const result = modData.url.split("/");
    if (result.length < 6) {
        return null;
    }

    const [, , , gameDomain, , modId] = result;

    const response = await fetch(
         `${apiUrl}/v1/games/${gameDomain}/mods/${modId}.json`,
        {
            method: "GET",
            headers: { 'apikey': apiKey, 'Content-Type': "application/json" },
        })
        .then(resp => resp.json());

    const version = response["version"];
    if (!version) {
        return null;
    }

    return compareVersions(modData.version, version) ? { id: modData.id, newVersion: version } : null;
}

function compareVersions(originalVersion: string, newVersion: string): boolean {
    if (originalVersion.length === 0 || newVersion.length === 0) {
        return false;
    }

    let realOriginalVersion: string;
    let realNewVersion: string;
    if (!isCharNumber(originalVersion.charAt(0)) && !isCharNumber(newVersion.charAt(0))) {
        if (originalVersion.charAt(0) !== newVersion.charAt(0)) {
            return false;
        }
        if (!isCharNumber(originalVersion.charAt(1)) && !isCharNumber(newVersion.charAt(1))) {
            return false;
        }
        realOriginalVersion = originalVersion.substring(1);
        realNewVersion = newVersion.substring(1);
    } else if (isCharNumber(originalVersion.charAt(0)) && isCharNumber(newVersion.charAt(0))) {
        realOriginalVersion = originalVersion;
        realNewVersion = newVersion;
    } else {
        return false;
    }

    if (!semver.valid(realNewVersion) || !semver.valid(realOriginalVersion)){
        return false;
    }

    return semver.gt(realNewVersion, realOriginalVersion);
}

function isCharNumber(c: string) {
    return c >= "0" && c <= "9";
}

export default router;