import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express()
const port = 3000
app.use(cors({
    origin:process.env.CORS_ORIGIN
}))

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))
app.use(cookieParser())



app.get('/', (req, res) => res.send('Hello World!'))
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
export {app}