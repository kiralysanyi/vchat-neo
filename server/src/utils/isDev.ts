const isDev = (): boolean => {
    const isdev = process.argv.includes("--dev");
    console.log("Dev env: ", isdev)
    return isdev
}

export default isDev;