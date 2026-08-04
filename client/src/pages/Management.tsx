import useOptionalAuth from "../hooks/useOptionalAuth"

const ManagementPage = () => {
    const auth = useOptionalAuth();
    console.log(auth?.user?.profile?.['urn:zitadel:iam:org:project:roles'])

    return <div className="page flex-col">
        {auth?.user?.profile?.['urn:zitadel:iam:org:project:roles'] != undefined ? <>
            <h1>Management</h1>
        </> : <>
            <h1>Management interface not available</h1>
            <p>This server did not configure auth/roles so the management interface is not available. If you changed server config lately, try to log out and log in again.</p>
        </>}
    </div>
}

export default ManagementPage