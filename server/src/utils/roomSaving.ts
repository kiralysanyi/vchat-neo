import fs from "fs"
import { Meeting } from "../types/Meeting"
import { ROOMSTORE } from "../config"

const saveRooms = (rooms: Record<string, Meeting>) => {
    fs.writeFileSync(ROOMSTORE, JSON.stringify(rooms), { encoding: "utf-8" })
}

const getRooms = () => {
    if (!fs.existsSync(ROOMSTORE)) {
        saveRooms({});
        return {};
    }

    return JSON.parse(fs.readFileSync(ROOMSTORE, { encoding: "utf-8" }))
}

export { saveRooms, getRooms }