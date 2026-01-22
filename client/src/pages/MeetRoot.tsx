import { Outlet } from "react-router"
import { DataProvider } from "../providers/DataProvider"

const MeetRoot = () => {
    return <DataProvider>
        <Outlet></Outlet>
    </DataProvider>
}

export default MeetRoot