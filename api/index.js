const express = require('express'); 
const app = express();
const port = 3000
const cors = require('cors')
const syl = require('syllabificate');

var corsOptions = {
  origin: ['https://emoji575.zaiz.ai', 'http://127.0.0.1:5173', 'http://localhost:5173'],
  optionsSuccessStatus: 200 
}

function validate(text) {
  const lines = text.trim().split(/\r?\n/)
  let errored = false

  if (lines.length !== 3) {
    errored = true
  } else {
    lines.forEach((line, idx) => {
      console.log(line, syl.countSyllables(line))
      // remove weird commas
      line = line.replace('’', '\'')
      const s = syl.countSyllables(line)
      const allowed = idx !== 1 ? 5 : 7
      const isValid = s === allowed
      if (!isValid) {
        errored = true
      }
    })
  }
  return errored;
}

async function requestHaiku(url, options) {
  let haiku;

  const response = await fetch(url, options)
  const json = await response.json();  

  haiku = json.choices[0].message.content
  if(validate(haiku)) {
    haiku = requestHaiku(url, options); // fetch again
  }
  return haiku;
};

async function retryRequest(url, options) {
  try {
    const haiku = requestHaiku(url, options)
    return haiku;
  } catch (error) {
    console.log('Request failed', error)
  }
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
    const response = await retryRequest(process.env.RAPID_API_URL, options)
    const haiku = smarten(response);
    res.status(200).send(
      {
        "response_type": "ephemeral",
        "text": "Generating a valid haiku..."
    })
    fetch(req.query.response_url,
      {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: `{"response_type": "in_channel", "text": "${haiku}"}`,
    })
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
