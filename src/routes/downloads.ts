import fetch from "node-fetch";
import { ParamsDictionary } from "express-serve-static-core";
import cache from 'memory-cache';

import express = require("express");

interface IRequestQuery {
    type: 'total' | 'unique';
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

interface IDownloads {
    id: string,
    total: string,
    unique: string
}

const apiUrl = "https://staticstats.nexusmods.com";
const apiKey = process.env["NEXUSMODS_APIKEY"];

const router = express.Router();

router.get("/",
    async (req: express.Request<ParamsDictionary, IResponseBody, IRequestBody, IRequestQuery>, res: express.Response<IResponseBody>) => {
        res.type("application/json");

        const label = req.query.type === "unique" ? "Unique Downloads" : "Total Downloads";

        if (!apiKey) {
            res.send(errorMsg(label, "Invalid 'NEXUSMODS_APIKEY'!"));
        }
        if (!req.query.type || !req.query.gameId || !req.query.modId) {
            res.send(errorMsg(label, "Invalid 'type' or 'gameId' or 'modId'!"));
        }

        const key = `downloads:${req.query.gameId}`;
        let downloads: IDownloads[] = cache.get(key);
        if (downloads === null) {
            downloads = await fetch(
                `${apiUrl}/live_download_counts/mods/${req.query.gameId}.csv`,
                { method: "GET" })
                .then(resp => resp.text())
                .then(text => text.split(/\n/).map(row => {
                    if (row === ""){
                        return null; // There seems to be a blank row at the end of every CSV.
                    }
        
                    const values = row.split(",");
                    if (values.length !== 3) {
                        return null;
                    }
    
                    return {
                        id: values[0],
                        total: parseInt(values[1]).toLocaleString(),
                        unique: parseInt(values[2]).toLocaleString()
                    } as IDownloads;
                }).filter(m => m !== null))
                .catch(err => defaultDownloads(req.query.modId));

            cache.put(key, downloads, 60000); 
        }

        const download = downloads.find(d => d.id === req.query.modId);
        if (!download) {
            res.send(errorMsg(label, 'mod not found!'));
        }
        res.send(successMsg(label, req.query.type === "unique" ? download.unique : download.total));
    }
);

function defaultDownloads(id: string) {
    const arr: IDownloads[] = [];
    arr.push({ id: id, total: '0', unique: '0' });
    return arr;
}

function successMsg(label: string, message: string): IResponseBody {
    return { schemaVersion: 1, label: label, message: message, color: "yellow" };
}

function errorMsg(label: string, message: string): IResponseBody {
    return { schemaVersion: 1, label: label, message: message, color: "red" };
}

export default router;