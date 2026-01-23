console.log(import.meta.env)

const config = {
    serverUrl: import.meta.env.DEV ? "http://localhost:8080" : ""
}

export default config;