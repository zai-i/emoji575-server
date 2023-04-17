const express = require('express')
const app = express()
const port = 3000
const cors = require('cors')

var corsOptions = {
  origin: ['https://emoji575.zaiz.ai', 'http://127.0.0.1:5173'],
  optionsSuccessStatus: 200 
}

if (process.env.NODE_ENV !== 'production') {
  require('dotenv-safe').config()
}
app.get('/', async (req, res) => {
  res.send('Emoji 575')
})
app.get('/api', cors(corsOptions), async (req, res) => {
  if (!req.query.keywords) {
    return res.send({error: 'You must provide keywords'})
  }
  else if (req.query.keywords.split(',').length > 15) {
    return res.send({error: 'Too many keywords'})
  }
  else {
    const options = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key': process.env.RAPID_API_KEY,
      'X-RapidAPI-Host': process.env.RAPID_API_HOST,
    },
    body: `{"model":"gpt-3.5-turbo","messages":[{"role":"user","content": "Generate a haiku from the following keywords: ${req.query.keywords}."}]}`,
  }
  try {
    const response = await fetch(process.env.RAPID_API_URL, options)
    const json = await response.json()
    return res.send(json)
  }
  catch (error) {
    console.error(error)
    return res.send(error)
    }
  }
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})

module.exports = app
