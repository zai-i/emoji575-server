const express = require('express')
const app = express()
const port = 3000
const cors = require('cors')

var corsOptions = {
  origin: ['https://emoji575.zaiz.ai', 'http://127.0.0.1:5173', 'http://localhost:5173'],
  optionsSuccessStatus: 200 
}

const smarten = (string) => {
  string = string.replace(/(^|[-\u2014/([{"\s])'/g, '$1\u2018'); // opening singles
  string = string.replace(/'/g, '\u2019'); // closing singles & apostrophes
  string = string.replace(/(^|[-\u2014/([{\u2018\s])"/g, '$1\u201c'); // opening doubles
  string = string.replace(/"/g, '\u201d'); // closing doubles
  string = string.replace(/--/g, '\u2014'); // em-dashes

  return string;
};

if (process.env.NODE_ENV !== 'production') {
  require('dotenv-safe').config()
}
app.get('/', async (req, res) => {
  res.send('Emoji 575')
})
app.get('/api', cors(corsOptions), async (req, res) => {
  if (!req.query.text) {
    return res.send({error: 'You must provide keywords'})
  }
  else if (req.query.text.split(',').length > 15) {
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
    body: `{"model":"gpt-3.5-turbo","messages":[{"role":"user","content": "Generate a haiku from the following keywords: ${req.query.text}."}]}`,
  }
  try {
    const response = await fetch(process.env.RAPID_API_URL, options);
    const json = await response.json();
    const haiku = smarten(JSON.stringify(json.choices[0].message.content.replace(/\n/g, '<br>')));
    return res.send(haiku)
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
